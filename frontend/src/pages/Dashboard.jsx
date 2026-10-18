import { useCallback, useEffect, useState } from "react";

import { deleteAnalysis, getHistory, getStats } from "../api";

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function scoreClass(score) {
  if (score >= 70) return "chip-good";
  if (score < 40) return "chip-bad";
  return "";
}

function TrendChart({ trend }) {
  const width = 400;
  const height = 170;
  const padding = 26;
  const gap = 10;
  const barWidth = Math.min(
    56,
    (width - padding * 2 - gap * (trend.length - 1)) / trend.length
  );
  const totalWidth = trend.length * barWidth + gap * (trend.length - 1);
  const startX = (width - totalWidth) / 2;
  const chartHeight = height - padding * 2;

  return (
    <svg className="trend-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Recent match scores">
      <defs>
        <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>

      <line
        className="trend-axis"
        x1={padding}
        x2={width - padding}
        y1={height - padding}
        y2={height - padding}
      />

      {trend.map((point, index) => {
        const barHeight = (point.match_score / 100) * chartHeight;
        const x = startX + index * (barWidth + gap);
        const y = height - padding - barHeight;

        return (
          <g key={point.id}>
            <rect className="trend-bar" x={x} y={y} width={barWidth} height={barHeight} rx="5" />
            <text className="trend-label" x={x + barWidth / 2} y={y - 6} textAnchor="middle">
              {Math.round(point.match_score)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function SkillBars({ items, warn }) {
  if (items.length === 0) {
    return <p className="muted small">No data yet</p>;
  }

  const max = Math.max(...items.map((item) => item.count));

  return items.map((item) => (
    <div className={`bar-row ${warn ? "bar-warn" : ""}`} key={item.skill}>
      <div>
        <span>{item.skill}</span>
        <span>{item.count}×</span>
      </div>
      <div className="bar">
        <span style={{ width: `${(item.count / max) * 100}%` }} />
      </div>
    </div>
  ));
}

function Dashboard({ onAnalyze }) {
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState(null);

  const load = useCallback(async () => {
    try {
      setError("");
      const [statsData, historyData] = await Promise.all([getStats(), getHistory()]);
      setStats(statsData);
      setHistory(historyData);
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Cannot reach the backend. Make sure the server is running on port 8000."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this analysis?")) return;

    try {
      await deleteAnalysis(id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const hasData = stats && stats.total_analyses > 0;

  return (
    <main className="dashboard">
      <div className="container">
        <div className="analyzer-head">
          <h1>
            Your <span className="gradient-text">dashboard</span>
          </h1>
          <p>Track your match scores, strongest skills and gaps over time.</p>
        </div>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        {loading && (
          <div className="panel placeholder">
            <div className="spinner" />
            <p>Loading your dashboard...</p>
          </div>
        )}

        {!loading && stats && !hasData && (
          <div className="panel placeholder">
            <div className="dropzone-icon">📭</div>
            <p>No analyses yet. Analyze a resume and it will show up here.</p>
            <button className="btn btn-primary" onClick={onAnalyze}>
              Analyze a resume
            </button>
          </div>
        )}

        {!loading && hasData && (
          <>
            <div className="stat-grid">
              <div className="panel">
                <p className="stat-label">Total analyses</p>
                <p className="stat-value">{stats.total_analyses}</p>
              </div>
              <div className="panel">
                <p className="stat-label">Average match</p>
                <p className="stat-value">{Math.round(stats.average_match_score)}%</p>
              </div>
              <div className="panel">
                <p className="stat-label">Best match</p>
                <p className="stat-value">{Math.round(stats.best_match_score)}%</p>
              </div>
            </div>

            <div className="dash-grid">
              <div className="panel">
                <h2>Recent scores</h2>
                <p className="muted small">Your last {stats.score_trend.length} analyses, oldest to newest.</p>
                <TrendChart trend={stats.score_trend} />
              </div>

              <div className="results">
                <div className="panel">
                  <h2>Strongest skills</h2>
                  <p className="muted small">Skills matched most often.</p>
                  <SkillBars items={stats.top_matched_skills} />
                </div>
                <div className="panel">
                  <h2>Most missing skills</h2>
                  <p className="muted small">Skills you are asked for but do not have yet.</p>
                  <SkillBars items={stats.top_missing_skills} warn />
                </div>
              </div>
            </div>

            <div className="panel">
              <h2>History</h2>
              <div className="history-list">
                {history.map((item) => (
                  <div className="history-item" key={item.id}>
                    <div className="history-head">
                      <div className="history-main">
                        <strong>{item.filename}</strong>
                        <span className="muted small">{formatDate(item.created_at)}</span>
                      </div>
                      <span className={`chip ${scoreClass(item.match_score)}`}>
                        {Math.round(item.match_score)}% match
                      </span>
                      <div className="history-actions">
                        <button
                          className="link-button"
                          onClick={() => setOpenId(openId === item.id ? null : item.id)}
                        >
                          {openId === item.id ? "Hide" : "Details"}
                        </button>
                        <button
                          className="link-button link-danger"
                          onClick={() => handleDelete(item.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {openId === item.id && (
                      <div className="history-detail">
                        <p className="history-preview">{item.job_preview}</p>

                        <div className="skill-block">
                          <h3>Matched ({item.matched_skills.length})</h3>
                          <div className="chips">
                            {item.matched_skills.length === 0 && (
                              <span className="muted small">None</span>
                            )}
                            {item.matched_skills.map((skill) => (
                              <span className="chip chip-good" key={skill}>
                                ✓ {skill}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="skill-block">
                          <h3>Missing ({item.missing_skills.length})</h3>
                          <div className="chips">
                            {item.missing_skills.length === 0 && (
                              <span className="muted small">No gaps</span>
                            )}
                            {item.missing_skills.map((skill) => (
                              <span className="chip chip-bad" key={skill}>
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default Dashboard;