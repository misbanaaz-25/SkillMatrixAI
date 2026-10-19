const API_BASE_URL = "http://127.0.0.1:8000";

async function request(path, options) {
  const response = await fetch(`${API_BASE_URL}${path}`, options);

  if (!response.ok) {
    let message = "Something went wrong. Please try again.";
    try {
      const error = await response.json();
      if (typeof error.detail === "string") {
        message = error.detail;
      } else if (Array.isArray(error.detail) && error.detail.length > 0) {
        const first = error.detail[0];
        const field = Array.isArray(first.loc) ? first.loc[first.loc.length - 1] : "input";
        message = `Please check "${field}": ${first.msg}`;
      }
    } catch {
      // response was not JSON, keep the default message
    }
    throw new Error(message);
  }

  return response.json();
}

function buildResumeForm(file, jobDescription) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("job_description", jobDescription);
  return formData;
}

export function analyzeMatch(file, jobDescription) {
  return request("/analyze/match", {
    method: "POST",
    body: buildResumeForm(file, jobDescription),
  });
}

export function getAiFeedback(file, jobDescription) {
  return request("/ai/feedback", {
    method: "POST",
    body: buildResumeForm(file, jobDescription),
  });
}

export function sendChatMessage(analysisId, messages) {
  return request("/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ analysis_id: analysisId, messages }),
  });
}

export function getStats() {
  return request("/stats");
}

export function getHistory() {
  return request("/history");
}

export function deleteAnalysis(id) {
  return request(`/history/${id}`, { method: "DELETE" });
}

export function getApplicationStats() {
  return request("/applications/stats");
}

export function getApplications() {
  return request("/applications");
}

export function createApplication(payload) {
  return request("/applications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function updateApplication(id, payload) {
  return request(`/applications/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function deleteApplication(id) {
  return request(`/applications/${id}`, { method: "DELETE" });
}