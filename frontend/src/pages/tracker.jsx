import { useCallback, useEffect, useState } from "react";

import {
  createApplication,
  deleteApplication,
  getApplicationStats,
  getApplications,
  updateApplication,
} from "../api";

const STATUSES = [
  { id: "saved", label: "To apply" },
  { id: "applied", label: "Applied" },
  { id: "interview", label: "Interview" },
  { id: "offer", label: "Offer" },
  { id: "rejected", label: "Rejected" },
];

const EMPTY_FORM = {
  company: "",
  role: "",
  status: "saved",
  applied_date: "",
  job_link: "",
  notes: "",
  analysis_id: null,
};

const todayString = () => new Date().toISOString().slice(0, 10);

function friendlyError(err) {
  return err.message === "Failed to fetch"
    ? "Cannot reach the backend. Make sure the server is running on port 8000."
    : err.message;
}

function toPayload(form) {
  return {
    company: form.company.trim(),
    role: form.role.trim(),
    status: form.status,
    applied_date: form.applied_date || null,
    job_link: form.job_link.trim() || null,
    notes: form.notes.trim() || null,
    analysis_id: form.analysis_id ?? null,
  };
}

function formFromItem(item) {
  return {
    company: item.company,
    role: item.role,
    status: item.status,
    applied_date: item.applied_date || "",
    job_link: item.job_link || "",
    notes: item.notes || "",
    analysis_id: item.analysis_id,
  };
}

function Tracker() {
  const [stats, setStats] = useState(null);
  const [applications, setApplications] = useState([]);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [statsData, items] = await Promise.all([getApplicationStats(), getApplications()]);
      setStats(statsData);
      setApplications(items);
      setError("");
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateField = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = toPayload(form);
      if (editingId) {
        await updateApplication(editingId, payload);
      } else {
        await createApplication(payload);
      }
      resetForm();
      await load();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setForm(formFromItem(item));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleStatusChange = async (item, status) => {
    const payload = toPayload(formFromItem(item));
    payload.status = status;
    if (status !== "saved" && !payload.applied_date) {
      payload.applied_date = todayString();
    }

    try {
      await updateApplication(item.id, payload);
      await load();
    } catch (err) {
      setError(friendlyError(err));
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.role}" at ${item.company}?`)) return;

    try {
      await deleteApplication(item.id);
      if (editingId === item.id) resetForm();
      await load();
    } catch (err) {
      setError(friendlyError(err));
    }
  };

  const tabs = [
    { id: "all", label: "All", count: stats?.total },
    ...STATUSES.map((status) => ({ ...status, count: stats?.[status.id] })),
  ];

  const visible =
    filter === "all" ? applications : applications.filter((item) => item.status === filter);

  return (
    <main className="dashboard">
      <div className="container">
        <div className="analyzer-head">
          <h1>
            Your job <span className="gradient-text">tracker</span>
          </h1>
          <p>Keep track of where you applied and what is still left to apply.</p>
        </div>

      
{stats && (
  <div className="stat-grid">
    <div className="panel">
      <p className="stat-label">Applied</p>
      <p className="stat-value">{stats.applied_total}</p>
    </div>

    <div className="panel">
      <p className="stat-label">Still to apply</p>
      <p className="stat-value">{stats.to_apply}</p>
    </div>

    <div className="panel">
      <p className="stat-label">Interviews</p>
      <p className="stat-value">{stats.interview}</p>
    </div>

    <div className="panel">
      <p className="stat-label">Offers</p>
      <p className="stat-value">{stats.offer}</p>
    </div>
  </div>
)}


        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <div className="analyzer-grid">
          {/* ---------- Left: add / edit form ---------- */}
          <form className="panel" onSubmit={handleSubmit}>
            <h2>{editingId ? "Edit job" : "Add a job"}</h2>

            <div className="field">
              <label htmlFor="company">Company *</label>
              <input
                id="company"
                type="text"
                required
                maxLength={100}
                value={form.company}
                onChange={updateField("company")}
              />
            </div>

            <div className="field">
              <label htmlFor="role">Role *</label>
              <input
                id="role"
                type="text"
                required
                maxLength={100}
                value={form.role}
                onChange={updateField("role")}
              />
            </div>

            <div className="field-row">
              <div className="field">
                <label htmlFor="status">Status</label>
                <select id="status" value={form.status} onChange={updateField("status")}>
                  {STATUSES.map((status) => (
                    <option key={status.id} value={status.id}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="applied_date">Applied on</label>
                <input
                  id="applied_date"
                  type="date"
                  value={form.applied_date}
                  onChange={updateField("applied_date")}
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="job_link">Job link</label>
              <input
                id="job_link"
                type="url"
                placeholder="https://..."
                maxLength={500}
                value={form.job_link}
                onChange={updateField("job_link")}
              />
            </div>

            <div className="field">
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                rows={3}
                maxLength={1000}
                value={form.notes}
                onChange={updateField("notes")}
              />
            </div>

            <div className="form-actions">
              <button className="btn btn-primary full" type="submit" disabled={saving}>
                {saving ? "Saving..." : editingId ? "Save changes" : "Add job"}
              </button>
              {editingId && (
                <button className="btn btn-ghost" type="button" onClick={resetForm}>
                  Cancel
                </button>
              )}
            </div>
          </form>

          {/* ---------- Right: list ---------- */}
          <div className="panel">
            <h2>Your applications</h2>

            <div className="tabs" role="tablist">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={filter === tab.id}
                  className={`tab ${filter === tab.id ? "tab-active" : ""}`}
                  onClick={() => setFilter(tab.id)}
                >
                  {tab.label}
                  {tab.count !== undefined ? ` (${tab.count})` : ""}
                </button>
              ))}
            </div>

            {loading && (
              <div className="placeholder">
                <div className="spinner" />
                <p>Loading your jobs...</p>
              </div>
            )}

            {!loading && visible.length === 0 && (
              <p className="muted">
                {applications.length === 0
                  ? "No jobs yet. Add your first one using the form."
                  : "No jobs in this list."}
              </p>
            )}

            <div className="job-list">
              {visible.map((item) => (
                <div className="job-item" key={item.id}>
                  <div className="job-head">
                    <div className="job-main">
                      <strong>{item.role}</strong>
                      <span className="muted">{item.company}</span>
                    </div>
                    <select
                      className={`status-select status-${item.status}`}
                      value={item.status}
                      aria-label={`Status of ${item.role} at ${item.company}`}
                      onChange={(event) => handleStatusChange(item, event.target.value)}
                    >
                      {STATUSES.map((status) => (
                        <option key={status.id} value={status.id}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {(item.applied_date || item.job_link) && (
                    <div className="job-meta small">
                      {item.applied_date && <span className="muted">📅 {item.applied_date}</span>}
                      {item.job_link && (
                        <a href={item.job_link} target="_blank" rel="noopener noreferrer">
                          🔗 Job link
                        </a>
                      )}
                    </div>
                  )}

                  {item.notes && <p className="job-notes small">{item.notes}</p>}

                  <div className="history-actions" style={{ marginTop: 10 }}>
                    <button className="link-button" onClick={() => handleEdit(item)}>
                      Edit
                    </button>
                    <button className="link-button link-danger" onClick={() => handleDelete(item)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Tracker;