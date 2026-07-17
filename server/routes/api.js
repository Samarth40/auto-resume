import { Router } from "express";
import fs from "fs";
import path from "path";
import {
  RESUME_TEX_PATH,
  OPTIMIZED_TEX_PATH,
  OPTIMIZED_PDF_PATH,
  GENERATED_DIR,
  config,
} from "../config.js";
import { parseResume } from "../parser/latexParser.js";
import { applyOptimizations } from "../parser/latexModifier.js";
import { analyzeResume, optimizeResume } from "../services/aiService.js";
import { compileToPdf, checkPdflatex } from "../services/pdfCompiler.js";
import { saveVersion, listVersions, getVersion } from "../services/versionStore.js";
import { buildHeatmap } from "../utils/heatmap.js";

const router = Router();

function loadMasterResume() {
  if (!fs.existsSync(RESUME_TEX_PATH)) {
    const err = new Error("Master resume not found at /templates/resume.tex");
    err.status = 500;
    throw err;
  }
  const tex = fs.readFileSync(RESUME_TEX_PATH, "utf8");
  return { tex, parsed: parseResume(tex) };
}

function requireJd(req) {
  const jd = String(req.body?.jobDescription || "").trim();
  if (jd.length < 40) {
    const err = new Error("Please paste a job description (at least 40 characters).");
    err.status = 400;
    throw err;
  }
  if (jd.length > 20000) {
    const err = new Error("Job description too long (max 20,000 characters).");
    err.status = 400;
    throw err;
  }
  return jd;
}

/** GET /api/resume — the parsed master resume (never uploaded, read from disk). */
router.get("/resume", (req, res, next) => {
  try {
    const { tex, parsed } = loadMasterResume();
    res.json({ structured: parsed.structured, tex, mockMode: config.mockMode, model: config.openaiModel });
  } catch (e) {
    next(e);
  }
});

/** POST /api/analyze — compare resume vs JD. */
router.post("/analyze", async (req, res, next) => {
  try {
    const jd = requireJd(req);
    const { parsed } = loadMasterResume();
    const analysis = await analyzeResume(parsed.structured, jd);
    const heatmap = buildHeatmap(parsed.structured, [
      ...analysis.matchedKeywords,
      ...analysis.missingKeywords,
    ]);
    res.json({ analysis, heatmap, resume: parsed.structured, mockMode: config.mockMode });
  } catch (e) {
    next(e);
  }
});

/** POST /api/optimize — analyze (or reuse analysis), rewrite sections, regenerate .tex + .pdf. */
router.post("/optimize", async (req, res, next) => {
  try {
    const jd = requireJd(req);
    const { tex: originalTex, parsed } = loadMasterResume();

    const analysis = req.body?.analysis?.atsScore != null
      ? req.body.analysis
      : await analyzeResume(parsed.structured, jd);

    const optimization = await optimizeResume(parsed.structured, jd, analysis);

    // Splice optimized content into the original LaTeX (formatting untouched)
    const { tex: optimizedTex, applied } = applyOptimizations(originalTex, optimization);

    fs.mkdirSync(GENERATED_DIR, { recursive: true });
    fs.writeFileSync(OPTIMIZED_TEX_PATH, optimizedTex, "utf8");

    const pdf = await compileToPdf(OPTIMIZED_TEX_PATH);
    const version = saveVersion({ tex: optimizedTex, result: optimization, jobDescription: jd });

    const optimizedParsed = parseResume(optimizedTex);
    const heatmap = buildHeatmap(optimizedParsed.structured, [
      ...(optimization.matchedKeywords || []),
      ...(optimization.missingKeywords || []),
    ]);

    res.json({
      analysis,
      optimization,
      applied,
      heatmap,
      version,
      originalTex,
      optimizedTex,
      original: parsed.structured,
      optimized: optimizedParsed.structured,
      pdf: { ready: pdf.ok, error: pdf.error || null, log: pdf.log || null },
      mockMode: config.mockMode,
    });
  } catch (e) {
    next(e);
  }
});

/** GET /api/download/pdf */
router.get("/download/pdf", (req, res) => {
  if (!fs.existsSync(OPTIMIZED_PDF_PATH)) {
    return res.status(404).json({ error: "No optimized PDF yet. Run Optimize first (and ensure pdflatex is installed)." });
  }
  res.download(OPTIMIZED_PDF_PATH, "optimized_resume.pdf");
});

/** GET /api/download/tex */
router.get("/download/tex", (req, res) => {
  if (!fs.existsSync(OPTIMIZED_TEX_PATH)) {
    return res.status(404).json({ error: "No optimized .tex yet. Run Optimize first." });
  }
  res.download(OPTIMIZED_TEX_PATH, "optimized_resume.tex");
});

/** GET /api/preview/pdf — inline PDF for the in-app preview iframe. */
router.get("/preview/pdf", (req, res) => {
  if (!fs.existsSync(OPTIMIZED_PDF_PATH)) {
    return res.status(404).json({ error: "No PDF available." });
  }
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "inline; filename=optimized_resume.pdf");
  fs.createReadStream(OPTIMIZED_PDF_PATH).pipe(res);
});

/** GET /api/versions — version history list. */
router.get("/versions", (req, res) => {
  res.json({ versions: listVersions() });
});

/** GET /api/versions/:id — a specific saved version. */
router.get("/versions/:id", (req, res) => {
  const v = getVersion(req.params.id);
  if (!v) return res.status(404).json({ error: "Version not found." });
  res.json(v);
});

/** GET /api/health */
router.get("/health", async (req, res) => {
  res.json({
    ok: true,
    mockMode: config.mockMode,
    model: config.openaiModel,
    pdflatex: await checkPdflatex(),
  });
});

export default router;
