/**
 * AI Service — talks to the OpenAI API (model configurable via env).
 * Falls back to the deterministic mock service when no API key is set.
 * All prompts live in /server/prompts — nothing is hardcoded here.
 */
import OpenAI from "openai";
import { config } from "../config.js";
import { loadPrompt, fillPrompt } from "../utils/promptLoader.js";
import { extractJson } from "../utils/extractJson.js";
import { mockAnalyze, mockOptimize } from "./mockAiService.js";

let client = null;
function getClient() {
  if (!client) {
    client = new OpenAI({
      apiKey: config.openaiApiKey,
      ...(config.openaiBaseUrl ? { baseURL: config.openaiBaseUrl } : {}),
    });
  }
  return client;
}

async function chatJson(systemPrompt, userPrompt) {
  const res = await getClient().chat.completions.create({
    model: config.openaiModel,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    // Deterministic settings: same resume + JD should always produce the
    // same analysis/score. (No `seed` — Gemini's OpenAI-compat endpoint
    // rejects it with a 400.)
    temperature: 0,
  });
  const text = res.choices?.[0]?.message?.content;
  return extractJson(text);
}

/** Analyze resume vs job description. */
export async function analyzeResume(resume, jobDescription) {
  if (config.mockMode) return mockAnalyze(resume, jobDescription);

  const system = loadPrompt("analyze.system.txt");
  const user = fillPrompt(loadPrompt("analyze.user.txt"), {
    RESUME_JSON: JSON.stringify(resume, null, 2),
    JOB_DESCRIPTION: jobDescription,
  });
  const json = await chatJson(system, user);
  return normalizeAnalysis(json);
}

/** Optimize resume content for the job description. */
export async function optimizeResume(resume, jobDescription, analysis) {
  if (config.mockMode) return mockOptimize(resume, jobDescription, analysis);

  const system = loadPrompt("optimize.system.txt");
  const user = fillPrompt(loadPrompt("optimize.user.txt"), {
    RESUME_JSON: JSON.stringify(resume, null, 2),
    JOB_DESCRIPTION: jobDescription,
    ANALYSIS_JSON: JSON.stringify(analysis, null, 2),
  });
  const json = await chatJson(system, user);
  return normalizeOptimization(json, resume, analysis);
}

/* ---------- response normalization (defensive against model drift) ---------- */

const arr = (v) => (Array.isArray(v) ? v : []);
const clampScore = (n) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));

/** Canonical form for keyword comparison: "React.js" ≈ "ReactJS" ≈ "react". */
const kwNorm = (s) => {
  const flat = String(s).toLowerCase().replace(/[^a-z0-9+#]/g, "");
  // strip a trailing "js" suffix ("reactjs" → "react") unless that's the whole name
  return flat.length > 2 ? flat.replace(/js$/, "") : flat;
};

/**
 * Deterministic ATS score — same rubric the prompts specify:
 * 45% required, 25% ats keywords, 15% responsibilities, 10% preferred, 5% soft.
 * Computed in code from the model's own extracted lists so the same
 * resume + JD always yields the same score and the model can't inflate it.
 * Responsibilities alignment isn't directly measurable from keyword lists,
 * so it's approximated by overall keyword coverage.
 */
function computeRubricScore(j, matchedKeywords) {
  const matched = new Set(arr(matchedKeywords).map(kwNorm));
  const coverage = (list) => {
    const items = arr(list).map(kwNorm).filter(Boolean);
    if (!items.length) return 1;
    return items.filter((k) => matched.has(k)).length / items.length;
  };
  const requiredCov = coverage(j.requiredSkills);
  const keywordCov = coverage(j.atsKeywords);
  const preferredCov = coverage(j.preferredSkills);
  const softCov = coverage(j.softSkills);
  const respAlign = keywordCov; // proxy — see docstring
  return clampScore(
    45 * requiredCov + 25 * keywordCov + 15 * respAlign + 10 * preferredCov + 5 * softCov
  );
}

function normalizeAnalysis(j) {
  const matchedKeywords = arr(j.matchedKeywords);
  // Blend the model's estimate with the code-computed rubric score (50/50).
  // The rubric anchors the number to actual keyword coverage; the model's
  // half preserves its judgment on responsibilities/evidence alignment.
  const rubricScore = computeRubricScore(j, matchedKeywords);
  const modelScore = clampScore(j.atsScore);
  const atsScore = j.atsScore != null ? Math.round((rubricScore + modelScore) / 2) : rubricScore;
  return {
    requiredSkills: arr(j.requiredSkills),
    preferredSkills: arr(j.preferredSkills),
    programmingLanguages: arr(j.programmingLanguages),
    frameworks: arr(j.frameworks),
    libraries: arr(j.libraries),
    responsibilities: arr(j.responsibilities),
    atsKeywords: arr(j.atsKeywords),
    softSkills: arr(j.softSkills),
    industryTerms: arr(j.industryTerms),
    matchedKeywords,
    missingKeywords: arr(j.missingKeywords),
    atsScore,
    sectionScores: {
      summary: clampScore(j.sectionScores?.summary),
      skills: clampScore(j.sectionScores?.skills),
      experience: clampScore(j.sectionScores?.experience),
      projects: clampScore(j.sectionScores?.projects),
      achievements: clampScore(j.sectionScores?.achievements),
    },
    projectRelevance: arr(j.projectRelevance).map((p) => ({
      title: String(p?.title || ""),
      score: clampScore(p?.score),
      reason: String(p?.reason || ""),
    })),
    skillGaps: arr(j.skillGaps).map((g) => ({
      skill: String(g?.skill || ""),
      importance: ["critical", "important", "nice-to-have"].includes(g?.importance) ? g.importance : "nice-to-have",
      suggestion: String(g?.suggestion || ""),
    })),
    suggestions: arr(j.suggestions).map(String),
  };
}

function normalizeOptimization(j, resume, analysis = {}) {
  const matchedKeywords = arr(j.matchedKeywords).map(String);
  // Score the optimized resume against the SAME JD lists the analysis
  // extracted, using the optimizer's post-rewrite matched list. Blended
  // 50/50 with the model estimate, and never below the pre-optimization
  // score — a rewrite that only rephrases can't honestly lose coverage.
  const rubricScore = computeRubricScore(analysis, matchedKeywords);
  const modelScore = clampScore(j.atsScore);
  const blended = j.atsScore != null ? Math.round((rubricScore + modelScore) / 2) : rubricScore;
  const atsScore = Math.max(blended, clampScore(analysis.atsScore));
  return {
    summary: String(j.summary || resume.summary || ""),
    skills: arr(j.skills)
      .map((g) => ({ category: String(g?.category || ""), items: arr(g?.items).map(String) }))
      .filter((g) => g.category && g.items.length),
    projects: arr(j.projects).map((p) => ({
      title: String(p?.title || ""),
      description: String(p?.description || ""),
      bullets: arr(p?.bullets).map(String),
    })),
    achievements: arr(j.achievements).map(String),
    matchedKeywords,
    missingKeywords: arr(j.missingKeywords).map(String),
    atsScore,
    changes: arr(j.changes).map((c) => ({
      section: String(c?.section || ""),
      before: String(c?.before || ""),
      after: String(c?.after || ""),
      reason: String(c?.reason || ""),
    })),
  };
}
