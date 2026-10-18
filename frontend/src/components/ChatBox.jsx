import { useEffect, useRef, useState } from "react";

import { sendChatMessage } from "../api";

const SUGGESTIONS = [
  "What should I learn first?",
  "Give me a 1-week study plan",
  "Which project should I build?",
];

const MAX_SENT_MESSAGES = 9;

function FormattedText({ text }) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
      <strong key={index}>{part.slice(2, -2)}</strong>
    ) : (
      <span key={index}>{part}</span>
    )
  );
}

function ChatBox({ analysisId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const logRef = useRef(null);

  useEffect(() => {
    const log = logRef.current;
    if (log) {
      log.scrollTop = log.scrollHeight;
    }
  }, [messages, sending]);

  const send = async (text) => {
    const content = text.trim();
    if (!content || sending) return;

    const nextMessages = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setInput("");
    setError("");
    setSending(true);

    try {
      const data = await sendChatMessage(analysisId, nextMessages.slice(-MAX_SENT_MESSAGES));
      setMessages([...nextMessages, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setMessages(messages);
      setInput(content);
      setError(
        err.message === "Failed to fetch"
          ? "Cannot reach the backend. Make sure the server is running on port 8000."
          : err.message
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="panel">
      <h2>💬 Career Buddy</h2>
      <p className="muted small">
        Ask about your skill gap, what to learn, practice projects or interview prep. Buddy
        knows your skill lists, not your full resume text.
      </p>

      <div className="chat-log" ref={logRef} aria-live="polite">
        {messages.length === 0 && (
          <div className="chat-suggestions">
            {SUGGESTIONS.map((suggestion) => (
              <button
                type="button"
                className="chip chip-button"
                key={suggestion}
                onClick={() => send(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`chat-msg ${message.role === "user" ? "chat-user" : "chat-bot"}`}
          >
            <FormattedText text={message.content} />
          </div>
        ))}

        {sending && (
          <div className="chat-msg chat-bot chat-typing">
            <div className="spinner" />
            Buddy is typing...
          </div>
        )}
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <form
        className="chat-form"
        onSubmit={(event) => {
          event.preventDefault();
          send(input);
        }}
      >
        <input
          type="text"
          value={input}
          maxLength={1000}
          placeholder="Ask Career Buddy..."
          onChange={(event) => setInput(event.target.value)}
        />
        <button className="btn btn-primary btn-small" type="submit" disabled={sending || !input.trim()}>
          Send
        </button>
      </form>

      <p className="muted small">
        Your messages are sent to an external AI service (currently Google Gemini's free
        tier), so please do not share private details. Answers can be wrong, so double-check
        them.
      </p>
    </div>
  );
}

export default ChatBox;