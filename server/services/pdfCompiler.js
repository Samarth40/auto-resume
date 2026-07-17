/**
 * PDF Compiler — runs pdflatex on the optimized .tex file.
 * Compiles inside /generated with -interaction=nonstopmode so a warning
 * never hangs the server. Gracefully reports when pdflatex is missing.
 */
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { config, GENERATED_DIR } from "../config.js";

let pdflatexAvailable = null;

/** Check once whether pdflatex is installed. */
export async function checkPdflatex() {
  if (pdflatexAvailable !== null) return pdflatexAvailable;
  pdflatexAvailable = await new Promise((resolve) => {
    const p = spawn(config.pdflatexPath, ["--version"], { shell: false, windowsHide: true });
    p.on("error", () => resolve(false));
    p.on("close", (code) => resolve(code === 0));
  });
  return pdflatexAvailable;
}

/**
 * Compile a .tex file to PDF in /generated.
 * @returns {{ ok: boolean, pdfPath?: string, log?: string, error?: string }}
 */
export async function compileToPdf(texPath) {
  const available = await checkPdflatex();
  if (!available) {
    return {
      ok: false,
      error:
        "pdflatex not found. Install MiKTeX (https://miktex.org) or TeX Live, or set PDFLATEX_PATH in server/.env. The optimized .tex file is still available for download.",
    };
  }

  const jobname = path.basename(texPath, ".tex");
  const run = () =>
    new Promise((resolve) => {
      const p = spawn(
        config.pdflatexPath,
        ["-interaction=nonstopmode", "-halt-on-error", `-output-directory=${GENERATED_DIR}`, texPath],
        { cwd: GENERATED_DIR, shell: false, windowsHide: true }
      );
      let out = "";
      const timer = setTimeout(() => {
        p.kill();
        resolve({ code: -1, out: out + "\n[timeout]" });
      }, config.pdflatexTimeoutMs);
      p.stdout.on("data", (d) => (out += d));
      p.stderr.on("data", (d) => (out += d));
      p.on("error", (e) => {
        clearTimeout(timer);
        resolve({ code: -1, out: String(e) });
      });
      p.on("close", (code) => {
        clearTimeout(timer);
        resolve({ code, out });
      });
    });

  // two passes for stable refs/layout
  let res = await run();
  if (res.code === 0) res = await run();

  const pdfPath = path.join(GENERATED_DIR, `${jobname}.pdf`);
  // clean aux files
  for (const ext of [".aux", ".log", ".out"]) {
    const f = path.join(GENERATED_DIR, `${jobname}${ext}`);
    if (fs.existsSync(f)) {
      try { fs.unlinkSync(f); } catch { /* ignore */ }
    }
  }

  if (res.code === 0 && fs.existsSync(pdfPath)) {
    return { ok: true, pdfPath };
  }
  const tail = res.out.split("\n").slice(-30).join("\n");
  return { ok: false, error: "pdflatex compilation failed.", log: tail };
}
