const BASE = "/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  health: () => request("/health"),
  getResume: () => request("/resume"),
  analyze: (jobDescription) =>
    request("/analyze", { method: "POST", body: JSON.stringify({ jobDescription }) }),
  optimize: (jobDescription, analysis, approvedSkills = []) =>
    request("/optimize", { method: "POST", body: JSON.stringify({ jobDescription, analysis, approvedSkills }) }),
  versions: () => request("/versions"),
  getVersion: (id) => request(`/versions/${id}`),
  downloadUrl: (type) => `${BASE}/download/${type}`,
  previewPdfUrl: () => `${BASE}/preview/pdf?t=${Date.now()}`,
};
