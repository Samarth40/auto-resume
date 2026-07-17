/** Quick end-to-end pipeline test (mock mode). Run: node test/pipeline.test.js */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parseResume } from "../parser/latexParser.js";
import { applyOptimizations } from "../parser/latexModifier.js";
import { mockAnalyze, mockOptimize } from "../services/mockAiService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tex = fs.readFileSync(path.join(__dirname, "../../templates/resume.tex"), "utf8");

const jd = `We are hiring a Full Stack Developer. Requirements: React, Node.js, Express, MongoDB,
TypeScript, Docker, AWS, REST APIs, Git, CI/CD, Tailwind CSS, JWT authentication.
Nice to have: Next.js, PostgreSQL, Kubernetes. Responsibilities: build scalable web
applications, develop REST APIs, collaborate with designers, deploy to cloud.
Soft skills: communication, problem-solving, teamwork.`;

let failures = 0;
const check = (name, cond) => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}`);
  if (!cond) failures++;
};

const parsed = parseResume(tex);
check("parser finds 7 sections", Object.keys(parsed.sections).length === 7);
check("parser: 5 skill groups", parsed.structured.skills.length === 5);
check("parser: 3 projects", parsed.structured.projects.length === 3);
check("parser: 3 achievements", parsed.structured.achievements.length === 3);
check("parser: education found", parsed.structured.education[0]?.title.includes("Bachelor"));

const analysis = mockAnalyze(parsed.structured, jd);
check("analysis: score in range", analysis.atsScore >= 0 && analysis.atsScore <= 100);
check("analysis: matched keywords found", analysis.matchedKeywords.length > 5);
check("analysis: missing keywords found", analysis.missingKeywords.includes("TypeScript"));
check("analysis: section scores present", Object.keys(analysis.sectionScores).length === 5);
check("analysis: project relevance for all", analysis.projectRelevance.length === 3);

const opt = mockOptimize(parsed.structured, jd, analysis);
check("optimize: summary rewritten", opt.summary.length > 50);
check("optimize: changes recorded", opt.changes.length > 0);

const { tex: newTex, applied } = applyOptimizations(tex, opt);
fs.mkdirSync(path.join(__dirname, "../../generated"), { recursive: true });
fs.writeFileSync(path.join(__dirname, "../../generated/optimized_resume.tex"), newTex);

check("modifier: all 4 sections applied", applied.length === 4);

// protected content must survive byte-for-byte
const protectedStrings = [
  "GPA: 8.76/10",
  "Expert IT Data Informatics LLP, Pune",
  "Nov 2024 -- Apr 2025",
  "samarthshinde4033@gmail.com",
  "+91-92658-85486",
  "Bachelor of Engineering in Computer Engineering",
  "Full-Stack Web Development (Sigma Batch, Apna College, 2024)",
  "\\textbf{VanRaksha} $|$ MERN, Firebase, Aptos Blockchain",
  "Feb 2025",
  "35\\%",
  "70\\%",
  "40\\%",
];
for (const s of protectedStrings) check(`protected: ${s.slice(0, 45)}`, newTex.includes(s));

// preamble byte-identical
const marker = "\\begin{document}";
check(
  "preamble byte-identical",
  newTex.slice(0, newTex.indexOf(marker)) === tex.slice(0, tex.indexOf(marker))
);
check("no double-escaping", !newTex.includes("textbackslash"));
check("no nested \\textbf", !/\\textbf\{[^{}]*\\textbf/.test(newTex));
check("skills: no invented skills", !newTex.includes("TypeScript"));
check("balanced braces", (newTex.match(/{/g) || []).length === (newTex.match(/}/g) || []).length);

console.log(failures === 0 ? "\nALL TESTS PASSED" : `\n${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
