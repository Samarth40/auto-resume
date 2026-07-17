/**
 * LaTeX Resume Parser
 * -------------------
 * Parses the master resume (/templates/resume.tex) into structured sections
 * WITHOUT altering any formatting. It works on the raw source and records
 * the exact character ranges of each section body so the modifier can later
 * splice optimized content back in surgically.
 *
 * Recognized sections (by \section{...} title, fuzzy-matched):
 *  - Professional Summary   ("Summary")
 *  - Skills                 ("Technical Skills")
 *  - Experience
 *  - Projects
 *  - Leadership/Activities  (treated as Achievements source)
 *  - Education
 *  - Certifications & Awards
 */

const SECTION_ALIASES = {
  summary: ["summary", "professional summary", "profile", "objective", "about"],
  skills: ["technical skills", "skills", "skills & tools", "core competencies"],
  experience: ["experience", "work experience", "professional experience", "employment"],
  projects: ["projects", "personal projects", "academic projects"],
  activities: ["leadership & activities", "leadership", "activities", "extracurricular", "achievements"],
  education: ["education", "academics"],
  certifications: ["certifications & awards", "certifications", "awards", "certifications and awards", "honors"],
};

/** Strip LaTeX markup to plain text (for AI consumption / keyword matching). */
export function latexToPlain(tex) {
  if (!tex) return "";
  return tex
    .replace(/(?<!\\)%[^\n]*/g, " ")
    .replace(/\\textbf\{([^{}]*)\}/g, "$1")
    .replace(/\\textit\{([^{}]*)\}/g, "$1")
    .replace(/\\emph\{([^{}]*)\}/g, "$1")
    .replace(/\\underline\{([^{}]*)\}/g, "$1")
    .replace(/\\href\{[^{}]*\}\{([^{}]*)\}/g, "$1")
    .replace(/\\resumeItem\{/g, "")
    .replace(/\\small|\\large|\\Large|\\Huge|\\scshape|\\bfseries/g, " ")
    .replace(/\$\|\$/g, "|")
    .replace(/\\&/g, "&")
    .replace(/\\%/g, "%")
    .replace(/\\#/g, "#")
    .replace(/\\_/g, "_")
    .replace(/\\\\/g, "\n")
    .replace(/\\[a-zA-Z]+\*?/g, " ")
    .replace(/[{}]/g, "")
    .replace(/~/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Escape plain text for safe insertion into LaTeX. */
export function escapeLatex(text) {
  if (text == null) return "";
  return String(text)
    // don't double-escape already-escaped chars
    .replace(/\\(?![a-zA-Z])/g, "\\textbackslash{}")
    .replace(/(?<!\\)&/g, "\\&")
    .replace(/(?<!\\)%/g, "\\%")
    .replace(/(?<!\\)#/g, "\\#")
    .replace(/(?<!\\)\$/g, "\\$")
    .replace(/(?<!\\)_/g, "\\_")
    .replace(/\^/g, "\\^{}")
    .replace(/~/g, "\\textasciitilde{}");
}

/** Find every \section{...} with its title and index. */
function findSections(tex) {
  const out = [];
  const re = /\\section\{([^}]*)\}/g;
  let m;
  while ((m = re.exec(tex)) !== null) {
    out.push({ rawTitle: m[1], start: m.index, bodyStart: m.index + m[0].length });
  }
  // body of each section ends where the next \section begins (or \end{document})
  const endDoc = tex.indexOf("\\end{document}");
  for (let i = 0; i < out.length; i++) {
    out[i].bodyEnd = i + 1 < out.length ? out[i + 1].start : (endDoc !== -1 ? endDoc : tex.length);
  }
  return out;
}

function canonicalKey(rawTitle) {
  const t = rawTitle.replace(/\\&/g, "&").toLowerCase().trim();
  for (const [key, aliases] of Object.entries(SECTION_ALIASES)) {
    if (aliases.some((a) => t === a || t.includes(a) || a.includes(t))) return key;
  }
  return null;
}

/** Parse skills body: lines like `\textbf{Category:} a, b, c \\` */
function parseSkills(body) {
  const skills = [];
  const re = /\\textbf\{([^}]*?):?\}\s*([^\\]*(?:\\(?!\\)[^\\]*)*)/g;
  // simpler: split by lines and match category lines
  const lines = body.split(/\\\\|\n/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    const m = line.match(/\\textbf\{([^}]*?):?\s*\}\s*:?\s*(.+)/);
    if (m) {
      const category = m[1].replace(/:$/, "").trim();
      const items = latexToPlain(m[2])
        .split(/,\s*/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (category && items.length) skills.push({ category, items });
    }
  }
  return skills;
}

/** Parse \resumeSubheading{a}{b}{c}{d} blocks followed by \resumeItem{...} lists. */
function parseSubheadingBlocks(body) {
  const blocks = [];
  const re = /\\resumeSubheading\s*\{/g;
  let m;
  while ((m = re.exec(body)) !== null) {
    const args = readBraceGroups(body, m.index + m[0].length - 1, 4);
    if (!args) continue;
    const afterIdx = args.endIndex;
    const nextSub = body.indexOf("\\resumeSubheading", afterIdx);
    const scope = body.slice(afterIdx, nextSub === -1 ? undefined : nextSub);
    blocks.push({
      title: latexToPlain(args.groups[0]),
      dateRange: latexToPlain(args.groups[1]),
      subtitle: latexToPlain(args.groups[2]),
      location: latexToPlain(args.groups[3]),
      bullets: parseResumeItems(scope),
    });
  }
  return blocks;
}

/** Parse \resumeProjectHeading{title}{date} blocks + bullets. */
function parseProjectBlocks(body) {
  const projects = [];
  const re = /\\resumeProjectHeading\s*\{/g;
  let m;
  while ((m = re.exec(body)) !== null) {
    const args = readBraceGroups(body, m.index + m[0].length - 1, 2);
    if (!args) continue;
    const afterIdx = args.endIndex;
    const nextProj = body.indexOf("\\resumeProjectHeading", afterIdx);
    const scope = body.slice(afterIdx, nextProj === -1 ? undefined : nextProj);
    const headingPlain = latexToPlain(args.groups[0]);
    const [titlePart, techPart] = headingPlain.split("|").map((s) => s?.trim() ?? "");
    projects.push({
      title: titlePart || headingPlain,
      technologies: techPart || "",
      date: latexToPlain(args.groups[1]),
      bullets: parseResumeItems(scope),
      rawHeading: args.groups[0],
    });
  }
  return projects;
}

/** Extract every \resumeItem{...} within a scope (handles nested braces). */
function parseResumeItems(scope) {
  const items = [];
  const re = /\\resumeItem\s*\{/g;
  let m;
  while ((m = re.exec(scope)) !== null) {
    const grp = readBraceGroups(scope, m.index + m[0].length - 1, 1);
    if (grp) items.push(latexToPlain(grp.groups[0]));
  }
  return items;
}

/**
 * Read `count` consecutive {...} groups starting at an opening brace index.
 * Handles nested braces. Returns { groups: string[], endIndex }.
 */
function readBraceGroups(str, openIdx, count) {
  const groups = [];
  let i = openIdx;
  for (let g = 0; g < count; g++) {
    // skip whitespace to next '{'
    while (i < str.length && str[i] !== "{") {
      if (!/\s/.test(str[i])) return null;
      i++;
    }
    if (str[i] !== "{") return null;
    let depth = 0;
    const start = i + 1;
    for (; i < str.length; i++) {
      if (str[i] === "{") depth++;
      else if (str[i] === "}") {
        depth--;
        if (depth === 0) break;
      }
    }
    if (depth !== 0) return null;
    groups.push(str.slice(start, i));
    i++; // move past closing brace
  }
  return { groups, endIndex: i };
}

/**
 * Main entry: parse full resume source into a structured object.
 * Each section carries { rawTitle, bodyStart, bodyEnd, raw } so the modifier
 * can splice content back without touching anything else.
 */
export function parseResume(tex) {
  const sections = findSections(tex);
  const byKey = {};
  for (const s of sections) {
    const key = canonicalKey(s.rawTitle);
    if (key && !byKey[key]) {
      byKey[key] = { ...s, raw: tex.slice(s.bodyStart, s.bodyEnd) };
    }
  }

  const summary = byKey.summary ? latexToPlain(byKey.summary.raw) : "";
  const skills = byKey.skills ? parseSkills(byKey.skills.raw) : [];
  const experience = byKey.experience ? parseSubheadingBlocks(byKey.experience.raw) : [];
  const projects = byKey.projects ? parseProjectBlocks(byKey.projects.raw) : [];
  const activities = byKey.activities ? parseSubheadingBlocks(byKey.activities.raw) : [];
  const education = byKey.education ? parseSubheadingBlocks(byKey.education.raw) : [];
  const certifications = byKey.certifications ? parseResumeItems(byKey.certifications.raw) : [];

  // Achievements = leadership/activity bullets (the "wordable" content)
  const achievements = activities.flatMap((a) => a.bullets);

  return {
    sections: byKey,
    structured: {
      summary,
      skills,
      experience,
      projects: projects.map(({ rawHeading, ...p }) => p),
      activities,
      achievements,
      education,
      certifications,
    },
    plainText: latexToPlain(tex),
  };
}
