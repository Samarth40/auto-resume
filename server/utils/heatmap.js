/**
 * Keyword Heatmap — counts how often each matched/missing JD keyword
 * appears in each resume section. Powers the frontend heatmap grid.
 */

const norm = (s) => String(s).toLowerCase().replace(/\.js$/, "").trim();

function countIn(text, keyword) {
  const esc = norm(keyword).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(?<![a-z0-9])${esc}(?:\\.js)?(?![a-z0-9])`, "gi");
  return (String(text).toLowerCase().match(re) || []).length;
}

export function buildHeatmap(resume, keywords) {
  const sectionTexts = {
    summary: resume.summary || "",
    skills: JSON.stringify(resume.skills || []),
    experience: JSON.stringify(resume.experience || []),
    projects: JSON.stringify(resume.projects || []),
    achievements: (resume.achievements || []).join(" "),
  };
  const sections = Object.keys(sectionTexts);
  return keywords.slice(0, 25).map((kw) => ({
    keyword: kw,
    counts: Object.fromEntries(sections.map((s) => [s, countIn(sectionTexts[s], kw)])),
    total: sections.reduce((sum, s) => sum + countIn(sectionTexts[s], kw), 0),
  }));
}
