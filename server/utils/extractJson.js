/** Robustly extract a JSON object from an LLM response. */
export function extractJson(text) {
  if (typeof text !== "string") throw new Error("Empty AI response");
  // strip code fences if the model ignored instructions
  let t = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  try {
    return JSON.parse(t);
  } catch {
    // fall back to the first balanced {...}
    const start = t.indexOf("{");
    if (start === -1) throw new Error("No JSON object in AI response");
    let depth = 0;
    let inStr = false;
    let esc = false;
    for (let i = start; i < t.length; i++) {
      const c = t[i];
      if (inStr) {
        if (esc) esc = false;
        else if (c === "\\") esc = true;
        else if (c === '"') inStr = false;
      } else {
        if (c === '"') inStr = true;
        else if (c === "{") depth++;
        else if (c === "}") {
          depth--;
          if (depth === 0) return JSON.parse(t.slice(start, i + 1));
        }
      }
    }
    throw new Error("Unbalanced JSON in AI response");
  }
}
