/**
 * Deterministic mock AI — used when OPENAI_API_KEY is not set.
 * Performs real keyword extraction + comparison so the app is fully
 * demonstrable offline. All "optimizations" are conservative rewrites
 * that only reorder/reword existing content.
 */

const TECH_LEXICON = [
  // languages
  "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "Go", "Rust", "SQL", "HTML5", "HTML", "CSS3", "CSS", "PHP", "Ruby", "Kotlin", "Swift",
  // frontend
  "React", "React.js", "Next.js", "Vue", "Angular", "Svelte", "Redux", "Tailwind CSS", "Tailwind", "Bootstrap", "Shadcn/ui", "Framer Motion", "Vite", "Webpack",
  // backend
  "Node.js", "Express.js", "Express", "REST APIs", "REST", "GraphQL", "gRPC", "WebSockets", "Microservices", "MVC", "Middleware", "Authentication", "JWT", "OAuth",
  // db
  "MongoDB", "Mongoose", "PostgreSQL", "MySQL", "Redis", "Firestore", "Firebase", "DynamoDB", "SQLite", "Elasticsearch",
  // devops/cloud
  "Docker", "Kubernetes", "AWS", "GCP", "Azure", "CI/CD", "Git", "GitHub", "GitLab", "Jenkins", "Terraform", "Vercel", "Netlify", "Cloudinary", "Nginx", "Linux",
  // practices
  "Agile", "Scrum", "TDD", "Unit Testing", "Jest", "Cypress", "Playwright", "Code Review", "Pair Programming", "Design Patterns", "Data Structures", "Algorithms",
  // ai/misc
  "Machine Learning", "AI", "LLM", "OpenAI", "Blockchain", "NFT", "Web3", "Responsive Design", "Accessibility", "Performance Optimization", "SEO", "Lighthouse",
];

const SOFT_LEXICON = [
  "Communication", "Team Leadership", "Leadership", "Mentoring", "Problem-Solving", "Problem Solving",
  "Collaboration", "Teamwork", "Time Management", "Adaptability", "Ownership", "Critical Thinking",
  "Attention to Detail", "Self-Motivated", "Fast Learner", "Stakeholder Management",
];

const norm = (s) => s.toLowerCase().replace(/\.js$/, "").replace(/[^a-z0-9+#/ ]/g, "").trim();

function findTerms(text, lexicon) {
  const found = [];
  const lower = text.toLowerCase();
  for (const term of lexicon) {
    const esc = term.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(?<![a-z0-9])${esc}(?![a-z0-9])`, "i");
    if (re.test(lower)) found.push(term);
  }
  // dedupe by normalized form, prefer longer names (React.js over React)
  const byNorm = new Map();
  for (const t of found.sort((a, b) => b.length - a.length)) {
    if (!byNorm.has(norm(t))) byNorm.set(norm(t), t);
  }
  // drop terms fully contained in a longer matched term as a whole word
  // ("REST" ⊂ "REST APIs" is dropped, but "Git" ⊄ "GitHub" survives)
  const terms = [...byNorm.values()];
  const words = (s) => s.toLowerCase().split(/[^a-z0-9+#]+/).filter(Boolean);
  return terms.filter(
    (t) => !terms.some((o) => o !== t && o.length > t.length && words(o).includes(t.toLowerCase()))
  );
}

/** Expand stack acronyms so "MERN" projects match React/Node/etc. keywords. */
function expandAcronyms(text) {
  let out = String(text);
  if (/\bMERN\b/i.test(out)) out += " MongoDB Express.js React.js Node.js";
  if (/\bMEAN\b/i.test(out)) out += " MongoDB Express.js Angular Node.js";
  return out;
}

export function mockAnalyze(resume, jobDescription) {
  const resumeText = JSON.stringify(resume);
  const jdTech = findTerms(jobDescription, TECH_LEXICON);
  const jdSoft = findTerms(jobDescription, SOFT_LEXICON);
  const resumeTech = findTerms(resumeText, TECH_LEXICON);
  const resumeSoft = findTerms(resumeText, SOFT_LEXICON);

  const resumeNorms = new Set([...resumeTech, ...resumeSoft].map(norm));
  const matched = [...jdTech, ...jdSoft].filter((t) => resumeNorms.has(norm(t)));
  const missing = [...jdTech, ...jdSoft].filter((t) => !resumeNorms.has(norm(t)));

  const total = jdTech.length + jdSoft.length;
  const atsScore = total === 0 ? 50 : Math.round((matched.length / total) * 100);

  const scoreSection = (text) => {
    const terms = findTerms(expandAcronyms(text), TECH_LEXICON);
    const hits = terms.filter((t) => jdTech.some((j) => norm(j) === norm(t))).length;
    return jdTech.length === 0 ? 50 : Math.min(100, Math.round((hits / Math.max(3, jdTech.length)) * 100) + 20);
  };

  const projectRelevance = (resume.projects || []).map((p) => {
    const pText = expandAcronyms(`${p.title} ${p.technologies} ${(p.bullets || []).join(" ")}`);
    const pTerms = findTerms(pText, TECH_LEXICON);
    const hits = pTerms.filter((t) => jdTech.some((j) => norm(j) === norm(t)));
    const score = jdTech.length === 0 ? 50 : Math.min(100, Math.round((hits.length / Math.max(2, Math.min(jdTech.length, 8))) * 100));
    return {
      title: p.title,
      score,
      reason: hits.length
        ? `Uses ${hits.slice(0, 4).join(", ")} — directly relevant to the role.`
        : "Limited direct overlap with the job's core stack.",
    };
  });

  const skillGaps = missing.slice(0, 8).map((skill, i) => ({
    skill,
    importance: i < 2 ? "critical" : i < 5 ? "important" : "nice-to-have",
    suggestion: `Not present in the resume — consider learning ${skill} or highlighting closely related experience you already have. Do not claim it without real experience.`,
  }));

  return {
    requiredSkills: jdTech.slice(0, 10),
    preferredSkills: jdTech.slice(10, 18),
    programmingLanguages: jdTech.filter((t) => ["JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "Go", "Rust", "SQL", "HTML5", "CSS3", "PHP", "Ruby"].includes(t)),
    frameworks: jdTech.filter((t) => ["React", "React.js", "Next.js", "Vue", "Angular", "Express.js", "Express", "Svelte", "Tailwind CSS"].includes(t)),
    libraries: jdTech.filter((t) => ["Redux", "Mongoose", "Framer Motion", "Shadcn/ui", "Jest", "Cypress"].includes(t)),
    responsibilities: jobDescription
      .split(/\n|\. /)
      .map((s) => s.trim())
      .filter((s) => /\b(build|develop|design|implement|maintain|collaborate|write|deploy|test|optimi[sz]e|lead)\b/i.test(s) && s.length > 20 && s.length < 160)
      .slice(0, 6),
    atsKeywords: jdTech,
    softSkills: jdSoft,
    industryTerms: findTerms(jobDescription, ["SaaS", "E-commerce", "Fintech", "Healthcare", "Startup", "Enterprise", "B2B", "B2C"]),
    matchedKeywords: matched,
    missingKeywords: missing,
    atsScore,
    sectionScores: {
      summary: scoreSection(resume.summary || ""),
      skills: scoreSection(JSON.stringify(resume.skills || [])),
      experience: scoreSection(JSON.stringify(resume.experience || [])),
      projects: scoreSection(JSON.stringify(resume.projects || [])),
      achievements: scoreSection(JSON.stringify(resume.achievements || [])),
    },
    projectRelevance,
    skillGaps,
    suggestions: [
      matched.length ? `Front-load these matched keywords in your summary: ${matched.slice(0, 5).join(", ")}.` : "Add a keyword-rich professional summary.",
      "Reorder skill groups so the job's core stack appears first.",
      missing.length ? `The JD mentions ${missing.slice(0, 3).join(", ")} — only add them if you genuinely have that experience.` : "Strong keyword coverage — focus on impact wording.",
      "Start every bullet with a strong action verb (Engineered, Architected, Delivered).",
      "Keep quantified metrics (%, counts) — ATS and recruiters both reward them.",
      "Mirror the job title's exact phrasing where truthful.",
    ],
    _mock: true,
  };
}

const VERB_UPGRADES = [
  [/^Developed\b/i, "Engineered"],
  [/^Built\b/i, "Developed and shipped"],
  [/^Created\b/i, "Designed and built"],
  [/^Made\b/i, "Produced"],
  [/^Worked on\b/i, "Delivered"],
  [/^Contributed to\b/i, "Contributed production code to"],
  [/^Organized\b/i, "Spearheaded"],
  [/^Led\b/i, "Directed"],
  [/^Mentored\b/i, "Coached and mentored"],
];

function upgradeVerbs(text) {
  let out = text;
  for (const [re, rep] of VERB_UPGRADES) {
    if (re.test(out)) {
      out = out.replace(re, rep);
      break;
    }
  }
  return out.replace(/\.\.$/, ".");
}

export function mockOptimize(resume, jobDescription, analysis) {
  const matched = analysis.matchedKeywords || [];
  const jdNorms = new Set((analysis.atsKeywords || []).map(norm));

  // Summary: rebuild around matched keywords, all facts from original
  const topMatched = matched.slice(0, 6);
  const role = (jobDescription.match(/(?:hiring|for|as)(?: an?)? ([A-Z][A-Za-z /+-]{3,40}?(?:Developer|Engineer|Intern))/i) || [])[1];
  const summary = `${role ? `${role.trim()} candidate — ` : ""}Full-stack developer experienced in designing and deploying production web applications with ${topMatched.slice(0, 4).join(", ") || "the MERN stack"}. Proven record of building responsive UIs, developing REST APIs, implementing secure authentication (JWT, Firebase), and integrating cloud services. Strong problem-solver focused on delivering scalable, maintainable solutions.`;

  // Skills: reorder items inside each group — JD-relevant first
  const skills = (resume.skills || []).map((g) => ({
    category: g.category,
    items: [...g.items].sort((a, b) => {
      const aHit = jdNorms.has(norm(a)) ? 0 : 1;
      const bHit = jdNorms.has(norm(b)) ? 0 : 1;
      return aHit - bHit;
    }),
  }));
  // groups with more JD hits first (keep Soft Skills last)
  skills.sort((a, b) => {
    const soft = (g) => (/soft/i.test(g.category) ? 1 : 0);
    if (soft(a) !== soft(b)) return soft(a) - soft(b);
    const hits = (g) => g.items.filter((i) => jdNorms.has(norm(i))).length / Math.max(1, g.items.length);
    return hits(b) - hits(a);
  });

  const changes = [];
  if (resume.summary) {
    changes.push({
      section: "summary",
      before: resume.summary,
      after: summary,
      reason: "Front-loaded JD-matched keywords and role framing; all claims from original resume.",
    });
  }

  const projects = (resume.projects || []).map((p) => {
    const bullets = (p.bullets || []).map((b) => {
      const nb = upgradeVerbs(b);
      if (nb !== b) {
        changes.push({ section: "projects", before: b, after: nb, reason: "Stronger action verb; facts unchanged." });
      }
      return nb;
    });
    return { title: p.title, description: bullets[0] || "", bullets };
  });

  const achievements = (resume.achievements || []).map((a) => {
    const na = upgradeVerbs(a);
    if (na !== a) {
      changes.push({ section: "achievements", before: a, after: na, reason: "Stronger action verb; metrics unchanged." });
    }
    return na;
  });

  changes.push({
    section: "skills",
    before: "Original skill ordering",
    after: "JD-relevant skills moved to the front of each group",
    reason: "ATS parsers and recruiters weight early-listed skills more heavily.",
  });

  return {
    summary,
    skills,
    projects,
    achievements,
    matchedKeywords: matched,
    missingKeywords: analysis.missingKeywords || [],
    atsScore: Math.min(100, (analysis.atsScore || 50) + 7),
    changes,
    _mock: true,
  };
}
