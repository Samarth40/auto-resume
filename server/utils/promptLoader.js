import fs from "fs";
import path from "path";
import { PROMPTS_DIR } from "../config.js";

const cache = new Map();

/** Load a prompt template from /server/prompts (cached). */
export function loadPrompt(name) {
  if (cache.has(name)) return cache.get(name);
  const file = path.join(PROMPTS_DIR, name);
  const text = fs.readFileSync(file, "utf8");
  cache.set(name, text);
  return text;
}

/** Fill {{PLACEHOLDER}} slots in a prompt template. */
export function fillPrompt(template, vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    key in vars ? String(vars[key]) : `{{${key}}}`
  );
}
