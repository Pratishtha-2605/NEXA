// =========================================================
const API_URL = "http://localhost:5000";

// ─── EXPERIMENTS ───

export async function createExperiment(data) {
  const res = await fetch(`${API_URL}/api/experiments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function getAllExperiments() {
  const res = await fetch(`${API_URL}/api/experiments`);
  return res.json();
}

export async function getExperiment(experimentId) {
  const res = await fetch(`${API_URL}/api/experiments/${experimentId}`);
  return res.json();
}

// ─── RESPONSES ───

export async function submitResponse(data) {
  const res = await fetch(`${API_URL}/api/responses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function getResponsesByExperiment(experimentId) {
  const res = await fetch(`${API_URL}/api/responses/${experimentId}`);
  return res.json();
}

export async function getExperimentStats(experimentId) {
  const res = await fetch(`${API_URL}/api/responses/${experimentId}/stats`);
  return res.json();
}

export function getExportUrl(experimentId) {
  return `${API_URL}/api/responses/${experimentId}/export`;
}
