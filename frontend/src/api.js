const API_BASE_URL = "http://127.0.0.1:8000";

async function request(path, options) {
  const response = await fetch(`${API_BASE_URL}${path}`, options);

  if (!response.ok) {
    let message = "Something went wrong. Please try again.";
    try {
      const error = await response.json();
      if (typeof error.detail === "string") {
        message = error.detail;
      }
    } catch {
      // response was not JSON, keep the default message
    }
    throw new Error(message);
  }

  return response.json();
}

export function analyzeMatch(file, jobDescription) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("job_description", jobDescription);

  return request("/analyze/match", { method: "POST", body: formData });
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