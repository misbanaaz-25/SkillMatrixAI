import { useRef, useState } from "react";

import { analyzeMatch, getAiFeedback, downloadReport } from "../api";
import { ScoreRing } from "../components/SkillConstellation";
import { useAnalysis } from "../context/AnalysisContext";

const SAMPLE_JOB_DESCRIPTION =
  "We are looking for a Python Developer with experience in FastAPI, SQL, Git, REST APIs and testing. Knowledge of Docker and AWS is a plus.";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = [".pdf", ".docx"];
const MIN_JOB_DESCRIPTION_LENGTH = 30;

const IDLE_AI = { status: "idle", data: null, error: "" };

function friendlyError(err) {
  return err.message === "Failed to fetch"
    ? "Cannot reach the backend. Make sure the server is running on port 8000."
    : err.message;
}

function Analyzer() {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [analyzedInput, setAnalyzedInput] = useState(null);
  const [ai, setAi] = useState(IDLE_AI);
  const [downloading, setDownloading] = useState(false);
  const [reportError, setReportError] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);
  const { setAnalysisId,notify } = useAnalysis();

  const pickFile = (candidate) => {
    if (!candidate) return;

    const name = candidate.name.toLowerCase();
    if (!ALLOWED_EXTENSIONS.some((extension) => name.endsWith(extension))) {
      setError("Only PDF and DOCX files are allowed.");
      return;
    }
    if (candidate.size > MAX_FILE_SIZE) {
      setError("File is too large. Maximum size is 5 MB.");
      return;
    }

    setError("");
    setFile(candidate);
     notify("Resume mil gaya ✅ Ab job description paste karke Analyze dabao.");
  };

  const canAnalyze =
    file && jobDescription.trim().length >= MIN_JOB_DESCRIPTION_LENGTH && !loading;

  const handleAnalyze = async () => {
    setLoading(true);
    setError("");
    setReportError("");
    setResult(null);
    setAi(IDLE_AI);

    try {
      const data = await analyzeMatch(file, jobDescription);
      setResult(data);
      setAnalyzedInput({ file, jobDescription });
      setAnalysisId(data.id ?? null);
            notify("Analysis ready! 🎯 you can ask about your skills.");
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async () => {
    if (!analyzedInput) return;

    setAi({ status: "loading", data: null, error: "" });
          notify("AI feedback ready ✨ ");

    try {
      const data = await getAiFeedback(analyzedInput.file, analyzedInput.jobDescription);
      setAi({ status: "done", data: data.feedback, error: "" });
    } catch (err) {
      setAi({ status: "error", data: null, error: friendlyError(err) });
    }
  };

  const handleDownload = async () => {
    if (!result) return;

    setDownloading(true);
    setReportError("");

    try {
      await downloadReport(result);
    } catch (err) {
      setReportError(friendlyError(err));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <main className="analyzer">
      <div className="container">
        <div className="analyzer-head">
          <h1>
            Analyze your <span className="gradient-text">resume</span>
          </h1>
          <p>Upload your resume, paste a job description and see your skill gap.</p>
        </div>

        <div className="analyzer-grid">
          {/* ---------- Left: inputs ---------- */}
          <div className="panel">
            <div
              className={`dropzone ${dragging ? "dropzone-active" : ""}`}
              role="button"
              tabIndex={0}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  inputRef.current?.click();
                }
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                pickFile(event.dataTransfer.files[0]);
              }}
            >
              <div className="dropzone-icon">{file ? "✅" : "📄"}</div>
              <strong>{file ? "Resume selected" : "Drop your resume here"}</strong>
              <span>{file ? "Click to replace" : "or click to browse · PDF or DOCX · max 5 MB"}</span>
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.docx"
                hidden
                onChange={(event) => pickFile(event.target.files[0])}
              />
            </div>

            {file && (
              <div className="file-row">
                <span>📎 {file.name}</span>
                <span className="muted">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                <button className="link-button" onClick={() => setFile(null)}>
                  Remove
                </button>
              </div>
            )}

            <div className="field-head">
              <label htmlFor="jd">Job description</label>
              <button
                className="link-button"
                onClick={() => setJobDescription(SAMPLE_JOB_DESCRIPTION)}
              >
                Use sample
              </button>
            </div>
            <textarea
              id="jd"
              rows={8}
              placeholder="Paste the job description here..."
              value={jobDescription}
              onChange={(event) => setJobDescription(event.target.value)}
            />
            <p className="muted small">
              {jobDescription.trim().length} characters · minimum {MIN_JOB_DESCRIPTION_LENGTH}
            </p>

            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}

            <button
              className="btn btn-primary full"
              onClick={handleAnalyze}
              disabled={!canAnalyze}
            >
              {loading ? "Analyzing..." : "Analyze"}
            </button>
          </div>

          {/* ---------- Right: results ---------- */}
          <div className="results">
            {loading && (
              <div className="panel placeholder">
                <div className="spinner" />
                <p>Reading your resume and comparing skills...</p>
              </div>
            )}

            {!loading && !result && (
              <div className="panel placeholder">
                <div className="dropzone-icon">🔭</div>
                <p>Your match score, skill gap and learning roadmap will appear here.</p>
              </div>
            )}

            {!loading && result && (
              <Results
                result={result}
                ai={ai}
                onGetFeedback={handleFeedback}
                onDownload={handleDownload}
                downloading={downloading}
                reportError={reportError}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function AiFeedbackPanel({ ai, onGetFeedback }) {
  if (ai.status === "done" && ai.data) {
    const { summary, strengths, improvements, bullet_rewrites: rewrites } = ai.data;

    return (
      <div className="panel">
        <h2>✨ AI feedback</h2>

        {summary && <p className="ai-summary">{summary}</p>}

        {strengths.length > 0 && (
          <div className="skill-block">
            <h3>What is working</h3>
            <ul className="ai-list ai-good">
              {strengths.map((item, index) => (
                <li key={`s-${index}`}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {improvements.length > 0 && (
          <div className="skill-block">
            <h3>What to improve</h3>
            <ul className="ai-list ai-warn">
              {improvements.map((item, index) => (
                <li key={`i-${index}`}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {rewrites.length > 0 && (
          <div className="skill-block">
            <h3>Better wording for your bullet points</h3>
            {rewrites.map((item, index) => (
              <div className="rewrite" key={`r-${index}`}>
                <p className="rewrite-before">
                  <span>Before</span>
                  {item.original}
                </p>
                <p className="rewrite-after">
                  <span>After</span>
                  {item.improved}
                </p>
              </div>
            ))}
          </div>
        )}

        <p className="muted small">
          AI suggestions can be wrong or generic. Check every point against your real
          experience, and replace placeholders like [X%] with true numbers only.
        </p>
      </div>
    );
  }

  return (
    <div className="panel">
      <h2>✨ AI feedback</h2>
      <p className="muted small">
        Get strengths, improvements and better wording for your bullet points.
      </p>
      <p className="notice small">
        To do this, your resume text (email, phone and links removed) is sent to an
        external AI service, currently Google Gemini's free tier. Use it only if you are
        comfortable with that.
      </p>

      {ai.status === "error" && (
        <p className="form-error" role="alert">
          {ai.error}
        </p>
      )}

      {ai.status === "loading" && (
        <div className="ai-loading">
          <div className="spinner" />
          <span>The AI is reading your resume. This can take up to 20 seconds...</span>
        </div>
      )}

      <button
        className="btn btn-primary full"
        onClick={onGetFeedback}
        disabled={ai.status === "loading"}
      >
        {ai.status === "loading"
          ? "Thinking..."
          : ai.status === "error"
            ? "Try again"
            : "Get AI feedback"}
      </button>
    </div>
  );
}

function Results({ result, ai, onGetFeedback, onDownload, downloading, reportError }) {
  const score = Math.round(result.match_score);
  const noSkillsInJob = result.job_skills_detected === 0;

  return (
    <>
      <div className="panel">
        <div className="result-top">
          <ScoreRing score={score} />
          <div>
            <h2>Estimated match</h2>
            <p className="muted small">{result.filename}</p>
          </div>
        </div>

        {result.skill_match_score !== null && (
          <div className="bar-row">
            <div>
              <span>Skill match</span>
              <span>{Math.round(result.skill_match_score)}%</span>
            </div>
            <div className="bar">
              <span style={{ width: `${result.skill_match_score}%` }} />
            </div>
          </div>
        )}

        <div className="bar-row">
          <div>
            <span>Text similarity</span>
            <span>{Math.round(result.text_similarity_score)}%</span>
          </div>
          <div className="bar">
            <span style={{ width: `${result.text_similarity_score}%` }} />
          </div>
        </div>

        <p className="muted small">{result.note}</p>

        {reportError && (
          <p className="form-error" role="alert">
            {reportError}
          </p>
        )}

        <button className="btn btn-primary full" onClick={onDownload} disabled={downloading}>
          {downloading ? "Creating report..." : "📥 Download report (PDF)"}
        </button>
      </div>

      <div className="panel">
        {noSkillsInJob && (
          <p className="muted">
            No known skills were found in this job description. Try a description that
            names specific skills or tools.
          </p>
        )}

        <div className="skill-block">
          <h3>Matched skills ({result.matched_skills.length})</h3>
          <div className="chips">
            {result.matched_skills.length === 0 && <span className="muted small">None yet</span>}
            {result.matched_skills.map((skill) => (
              <span className="chip chip-good" key={skill}>
                ✓ {skill}
              </span>
            ))}
          </div>
        </div>

        <div className="skill-block">
          <h3>Missing skills ({result.missing_skills.length})</h3>
          <div className="chips">
            {result.missing_skills.length === 0 && (
              <span className="muted small">No gaps found</span>
            )}
            {result.missing_skills.map((skill) => (
              <span className="chip chip-bad" key={skill}>
                {skill}
              </span>
            ))}
          </div>
        </div>

        {result.extra_skills.length > 0 && (
          <div className="skill-block">
            <h3>Other skills in your resume ({result.extra_skills.length})</h3>
            <div className="chips">
              {result.extra_skills.map((skill) => (
                <span className="chip" key={skill}>
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <AiFeedbackPanel ai={ai} onGetFeedback={onGetFeedback} />

      {result.roadmap.length > 0 && (
        <div className="panel">
          <h2>Your learning roadmap</h2>
          <p className="muted small">Start from the top, the most foundational skills come first.</p>

          <div className="roadmap-list">
            {result.roadmap.map((item, index) => (
              <div className="roadmap-item" key={item.skill}>
                <div className="roadmap-title">
                  <span className="roadmap-number">{index + 1}</span>
                  <h3>{item.skill}</h3>
                </div>
                <ul>
                  {item.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ul>
                <p className="small">
                  <strong>Practice project:</strong> {item.practice_project}
                </p>
                <p className="small muted">
                  <strong>Resources:</strong> {item.resources.join(" · ")}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export default Analyzer;