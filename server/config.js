import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

export const ROOT_DIR = path.resolve(__dirname, "..");
export const TEMPLATES_DIR = path.join(ROOT_DIR, "templates");
export const GENERATED_DIR = path.join(ROOT_DIR, "generated");
export const PROMPTS_DIR = path.join(__dirname, "prompts");

export const RESUME_TEX_PATH = path.join(TEMPLATES_DIR, "resume.tex");
export const OPTIMIZED_TEX_PATH = path.join(GENERATED_DIR, "optimized_resume.tex");
export const OPTIMIZED_PDF_PATH = path.join(GENERATED_DIR, "optimized_resume.pdf");
export const VERSIONS_DIR = path.join(GENERATED_DIR, "versions");

export const config = {
  port: Number(process.env.PORT) || 5050,
  openaiApiKey: process.env.OPENAI_API_KEY || "",
  openaiModel: process.env.OPENAI_MODEL || "gpt-5.5",
  openaiBaseUrl: process.env.OPENAI_BASE_URL || undefined,
  pdflatexPath: process.env.PDFLATEX_PATH || "pdflatex",
  pdflatexTimeoutMs: Number(process.env.PDFLATEX_TIMEOUT_MS) || 60000,
  get mockMode() {
    return !this.openaiApiKey;
  },
};
