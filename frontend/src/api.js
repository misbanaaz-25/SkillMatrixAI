const API_BASE_URL = "http://127.0.0.1:8000";

export async function analyzeMatch(file, jobDescription) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("job_description", jobDescription);

  const response = await fetch(`${API_BASE_URL}/analyze/match`, {
    method: "POST",
    body: formData,
  });

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