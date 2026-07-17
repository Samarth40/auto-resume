/**
 * Version History — stores each optimization run under /generated/versions.
 * Each version keeps the optimized .tex, the AI result JSON, and metadata.
 */
import fs from "fs";
import path from "path";
import { VERSIONS_DIR } from "../config.js";

function ensureDir() {
  fs.mkdirSync(VERSIONS_DIR, { recursive: true });
}

export function saveVersion({ tex, result, jobDescription }) {
  ensureDir();
  const id = `v${Date.now()}`;
  const dir = path.join(VERSIONS_DIR, id);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "optimized_resume.tex"), tex, "utf8");
  const meta = {
    id,
    createdAt: new Date().toISOString(),
    atsScore: result.atsScore,
    changesCount: (result.changes || []).length,
    jobDescriptionPreview: String(jobDescription || "").slice(0, 200),
  };
  fs.writeFileSync(path.join(dir, "meta.json"), JSON.stringify(meta, null, 2), "utf8");
  fs.writeFileSync(path.join(dir, "result.json"), JSON.stringify(result, null, 2), "utf8");
  return meta;
}

export function listVersions() {
  ensureDir();
  return fs
    .readdirSync(VERSIONS_DIR)
    .filter((d) => fs.existsSync(path.join(VERSIONS_DIR, d, "meta.json")))
    .map((d) => JSON.parse(fs.readFileSync(path.join(VERSIONS_DIR, d, "meta.json"), "utf8")))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function getVersion(id) {
  const dir = path.join(VERSIONS_DIR, id);
  const metaFile = path.join(dir, "meta.json");
  if (!/^v\d+$/.test(id) || !fs.existsSync(metaFile)) return null;
  return {
    meta: JSON.parse(fs.readFileSync(metaFile, "utf8")),
    tex: fs.readFileSync(path.join(dir, "optimized_resume.tex"), "utf8"),
    result: JSON.parse(fs.readFileSync(path.join(dir, "result.json"), "utf8")),
  };
}
