/**
 * LaTeX Modifier
 * --------------
 * Splices AI-optimized content back into the ORIGINAL resume source.
 * Only the following are ever rewritten:
 *   - Summary body text
 *   - Skills lines (ordering/grouping of existing skills)
 *   - Project bullet items (\resumeItem contents) — headings/dates untouched
 *   - Achievement/activity bullet items — headings/dates untouched
 *
 * Everything else (preamble, packages, fonts, margins, commands, education,
 * certifications, contact info, dates, company names, project names) is
 * copied through byte-for-byte.
 */

import { parseResume, escapeLatex } from "./latexParser.js";

/** Re-apply \textbf{} emphasis to known keywords inside a plain sentence. */
function emphasizeKeywords(text, keywords = []) {
  let out = escapeLatex(text);
  const sorted = [...new Set(keywords)].sort((a, b) => b.length - a.length);
  for (const kw of sorted) {
    if (!kw || kw.length < 3) continue;
    const esc = escapeLatex(kw).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`\\b${esc}\\b`, "gi");
    // only bold matches that are NOT already inside a \textbf{...} group
    let m;
    while ((m = re.exec(out)) !== null) {
      if (insideTextbf(out, m.index)) continue;
      out = out.slice(0, m.index) + `\\textbf{${m[0]}}` + out.slice(m.index + m[0].length);
      break; // bold first occurrence only
    }
  }
  return out;
}

/** Is position `idx` inside an existing \textbf{...} group? */
function insideTextbf(str, idx) {
  const re = /\\textbf\{/g;
  let m;
  while ((m = re.exec(str)) !== null) {
    if (m.index >= idx) break;
    let depth = 0;
    for (let i = m.index + m[0].length - 1; i < str.length; i++) {
      if (str[i] === "{") depth++;
      else if (str[i] === "}") {
        depth--;
        if (depth === 0) {
          if (idx > m.index && idx < i) return true;
          break;
        }
      }
    }
  }
  return false;
}

/** Build the skills section body from optimized skill groups. */
function buildSkillsBody(skillGroups) {
  const lines = skillGroups.map(
    (g) => `\\textbf{${escapeLatex(g.category)}:} ${g.items.map(escapeLatex).join(", ")}`
  );
  return "\n" + lines.join(" \\\\\n") + "\n";
}

/** Replace the Nth..every \resumeItem{...} inside a scope with new texts (in order). */
function replaceResumeItems(scope, newBullets, boldKeywords) {
  let idx = 0;
  const re = /\\resumeItem\s*\{/g;
  let result = "";
  let last = 0;
  let m;
  while ((m = re.exec(scope)) !== null) {
    const openIdx = m.index + m[0].length - 1;
    let depth = 0;
    let i = openIdx;
    for (; i < scope.length; i++) {
      if (scope[i] === "{") depth++;
      else if (scope[i] === "}") {
        depth--;
        if (depth === 0) break;
      }
    }
    if (depth !== 0) break; // malformed — bail, keep original
    if (idx < newBullets.length && newBullets[idx] != null) {
      result += scope.slice(last, openIdx + 1);
      result += emphasizeKeywords(newBullets[idx], boldKeywords);
      last = i; // position of closing brace
    }
    idx++;
    re.lastIndex = i + 1;
  }
  result += scope.slice(last);
  return result;
}

/**
 * Replace bullets project-by-project. `optimizedProjects` items are matched
 * to source projects by title (case-insensitive, fuzzy) so reordering in the
 * AI response can't corrupt the wrong project.
 */
function replaceProjectBullets(body, optimizedProjects, boldKeywords) {
  const re = /\\resumeProjectHeading\s*\{/g;
  const spans = [];
  let m;
  while ((m = re.exec(body)) !== null) spans.push(m.index);
  spans.push(body.length);

  let out = "";
  for (let s = 0; s < spans.length - 1; s++) {
    let chunk = body.slice(spans[s], spans[s + 1]);
    const prefix = s === 0 ? body.slice(0, spans[0]) : "";
    // extract title text from the heading to match against optimized list
    const titleMatch = chunk.match(/\\textbf\{([^{}]+)\}/);
    const title = titleMatch ? titleMatch[1].toLowerCase().trim() : "";
    const opt = optimizedProjects.find(
      (p) => p.title && (title.includes(p.title.toLowerCase().trim()) || p.title.toLowerCase().trim().includes(title))
    );
    if (opt) {
      const bullets = opt.bullets ?? (opt.description ? [opt.description] : []);
      if (bullets.length) chunk = replaceResumeItems(chunk, bullets, boldKeywords);
    }
    out += prefix + chunk;
  }
  return spans.length > 1 ? out : body;
}

/** Canonical skill key: "React.js" ≈ "ReactJS" ≈ "react" — same skill, variant spelling. */
function skillKey(s) {
  const flat = String(s).toLowerCase().replace(/[^a-z0-9+#]/g, "");
  // strip a trailing "js" suffix ("reactjs" → "react") unless that's the whole name
  return flat.length > 2 ? flat.replace(/js$/, "") : flat;
}

/**
 * Validate skill groups only rearrange existing skills — never add new ones,
 * with one exception: `approvedSkills` the user explicitly confirmed having.
 */
function sanitizeSkills(optimizedGroups, originalGroups, approvedSkills = []) {
  const allOriginal = new Map();
  for (const g of originalGroups) {
    for (const item of g.items) allOriginal.set(skillKey(item), item);
  }
  // Approved skills are whitelisted additions (skip ones already on the resume)
  const approved = new Map();
  for (const s of approvedSkills) {
    const key = skillKey(s);
    if (key && !allOriginal.has(key)) approved.set(key, String(s).trim());
  }
  const used = new Set();
  const clean = [];
  for (const g of optimizedGroups || []) {
    const items = [];
    for (const it of g.items || []) {
      const key = skillKey(it);
      if ((allOriginal.has(key) || approved.has(key)) && !used.has(key)) {
        // Same skill — keep the AI's spelling (may mirror the JD, e.g. "React.js")
        items.push(String(it).trim());
        used.add(key);
      }
    }
    if (items.length) clean.push({ category: String(g.category || "Skills"), items });
  }
  // Anything the AI dropped gets appended so no real skill is ever lost —
  // including approved skills the AI forgot to place.
  const leftovers = [];
  for (const [key, orig] of allOriginal) if (!used.has(key)) leftovers.push(orig);
  for (const [key, s] of approved) if (!used.has(key)) leftovers.push(s);
  if (leftovers.length) {
    const other = clean.find((g) => /other|additional/i.test(g.category));
    if (other) other.items.push(...leftovers);
    else if (clean.length) clean[clean.length - 1].items.push(...leftovers);
    else clean.push(...originalGroups);
  }
  return clean.length ? clean : originalGroups;
}

/**
 * Apply an AI optimization result to the original LaTeX source.
 * @param {string} originalTex  full source of /templates/resume.tex
 * @param {object} opt          AI JSON: { summary, skills, projects, achievements, matchedKeywords }
 * @returns {{ tex: string, applied: string[] }}
 */
export function applyOptimizations(originalTex, opt, approvedSkills = []) {
  const parsed = parseResume(originalTex);
  const { sections, structured } = parsed;
  const boldKeywords = (opt.matchedKeywords || []).concat(
    structured.skills.flatMap((g) => g.items)
  );

  // Collect replacements as { start, end, text } against the ORIGINAL string,
  // then apply from the end so indices stay valid.
  const edits = [];

  if (opt.summary && sections.summary) {
    edits.push({
      start: sections.summary.bodyStart,
      end: sections.summary.bodyEnd,
      text: "\n" + emphasizeKeywords(opt.summary, boldKeywords) + "\n\n",
    });
  }

  if (Array.isArray(opt.skills) && opt.skills.length && sections.skills) {
    const clean = sanitizeSkills(opt.skills, structured.skills, approvedSkills);
    edits.push({
      start: sections.skills.bodyStart,
      end: sections.skills.bodyEnd,
      text: buildSkillsBody(clean),
    });
  }

  if (Array.isArray(opt.projects) && opt.projects.length && sections.projects) {
    const newBody = replaceProjectBullets(sections.projects.raw, opt.projects, boldKeywords);
    edits.push({ start: sections.projects.bodyStart, end: sections.projects.bodyEnd, text: newBody });
  }

  if (Array.isArray(opt.achievements) && opt.achievements.length && sections.activities) {
    const newBody = replaceResumeItems(sections.activities.raw, opt.achievements, boldKeywords);
    edits.push({ start: sections.activities.bodyStart, end: sections.activities.bodyEnd, text: newBody });
  }

  edits.sort((a, b) => b.start - a.start);
  let tex = originalTex;
  const applied = [];
  for (const e of edits) {
    tex = tex.slice(0, e.start) + e.text + tex.slice(e.end);
  }
  if (opt.summary && sections.summary) applied.push("summary");
  if (Array.isArray(opt.skills) && opt.skills.length && sections.skills) applied.push("skills");
  if (Array.isArray(opt.projects) && opt.projects.length && sections.projects) applied.push("projects");
  if (Array.isArray(opt.achievements) && opt.achievements.length && sections.activities) applied.push("achievements");

  return { tex, applied };
}
