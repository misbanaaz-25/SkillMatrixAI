import { useEffect, useState } from "react";

import { useAnalysis } from "../context/AnalysisContext";
import ChatBox from "./ChatBox";

const TOAST_MS = 7000;

function CareerBuddy({ onAnalyze }) {
  const [open, setOpen] = useState(false);
  const { analysisId, unread, toast, dismissToast, clearUnread } = useAnalysis();

  // opening the chat marks everything as read
  useEffect(() => {
    if (open && unread > 0) clearUnread();
  }, [open, unread, clearUnread]);

  // popup hides itself after a few seconds, the badge stays
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(dismissToast, TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast, dismissToast]);

  const handleAnalyzeClick = () => {
    setOpen(false);
    onAnalyze();
  };

  const hasAlert = unread > 0 && !open;

  return (
    <>
      {open && (
        <div className="buddy-window" role="dialog" aria-label="Career Buddy chat">
          <div className="buddy-header">
            <div>
              <strong>Career Buddy</strong>
              <span>Ask about your resume, skills and roadmap</span>
            </div>
            <button
              className="buddy-close"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>

          <div className="buddy-body">
            {analysisId ? (
              <ChatBox key={analysisId} analysisId={analysisId} />
            ) : (
              <div className="buddy-empty">
                <div className="buddy-empty-icon">📄</div>
                <p>
                  Pehle apna resume analyze karo, phir main tumhare resume ke hisaab se
                  help karunga.
                </p>
                <button className="btn btn-primary" onClick={handleAnalyzeClick}>
                  Analyze my resume
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {!open && toast && (
        <div
          className="buddy-toast"
          key={toast.id}
          role="status"
          onClick={() => setOpen(true)}
        >
          <div className="buddy-toast-avatar">🤖</div>
          <div className="buddy-toast-text">
            <strong>Career Buddy</strong>
            <span>{toast.text}</span>
          </div>
          <button
            className="buddy-toast-close"
            aria-label="Dismiss notification"
            onClick={(event) => {
              event.stopPropagation();
              dismissToast();
            }}
          >
            ✕
          </button>
          <div className="buddy-toast-timer" />
        </div>
      )}

      <button
        className={`buddy-fab ${hasAlert ? "buddy-fab-alert" : ""}`}
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Close Career Buddy" : "Open Career Buddy"}
      >
        <span className="buddy-fab-icon" key={hasAlert ? unread : "idle"}>
          {open ? "✕" : "💬"}
        </span>
        {hasAlert && (
          <span className="buddy-badge" key={`badge-${unread}`}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
    </>
  );
}

export default CareerBuddy;