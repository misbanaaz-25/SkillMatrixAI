const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const TOKEN_KEY = "skillmatrix_token";
const USER_KEY = "skillmatrix_user";

/* ---------- saved login (stays after refresh) ---------- */

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSession(token, user) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // storage blocked, the user will just need to log in again next time
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    // nothing to clear
  }
}

/* ---------- core request helper ---------- */

async function request(path, options = {}) {
  const token = getToken();
  const headers = { ...(options.headers || {}) };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

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

    // a saved token that the server no longer accepts: log the user out
    if (response.status === 401 && token) {
      clearSession();
      window.dispatchEvent(new Event("auth:expired"));
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

/* ---------- auth ---------- */

export function signup(name, email, password) {
  return request("/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
}

export function login(email, password) {
  return request("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
}

export function getMe() {
  return request("/auth/me");
}

/* ---------- analysis ---------- */

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

export async function downloadReport(result) {
  const response = await fetch(`${API_BASE_URL}/report/download`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(result),
  });

  if (!response.ok) {
    throw new Error("Could not create the report. Please try again.");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `SkillMatrixAI_Report_${result.id ?? "analysis"}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

/* ---------- history and stats ---------- */

export function getStats() {
  return request("/stats");
}

export function getHistory() {
  return request("/history");
}

export function deleteAnalysis(id) {
  return request(`/history/${id}`, { method: "DELETE" });
}

/* ---------- job tracker ---------- */

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