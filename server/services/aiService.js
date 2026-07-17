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
    temperature: 0.3,
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
  return normalizeOptimization(json, resume);
}

/* ---------- response normalization (defensive against model drift) ---------- */

const arr = (v) => (Array.isArray(v) ? v : []);
const clampScore = (n) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));

function normalizeAnalysis(j) {
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
    matchedKeywords: arr(j.matchedKeywords),
    missingKeywords: arr(j.missingKeywords),
    atsScore: clampScore(j.atsScore),
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

function normalizeOptimization(j, resume) {
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
    matchedKeywords: arr(j.matchedKeywords).map(String),
    missingKeywords: arr(j.missingKeywords).map(String),
    atsScore: clampScore(j.atsScore),
    changes: arr(j.changes).map((c) => ({
      section: String(c?.section || ""),
      before: String(c?.before || ""),
      after: String(c?.after || ""),
      reason: String(c?.reason || ""),
    })),
  };
}
