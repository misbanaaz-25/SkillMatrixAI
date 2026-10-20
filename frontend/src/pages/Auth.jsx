import { useState } from "react";

import { useAuth } from "../context/AuthContext";
import "./Auth.css";

function Auth({ mode, onNavigate, onSuccess }) {
  const { login, signup } = useAuth();
  const isSignup = mode === "signup";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignup) {
        await signup(name.trim(), email.trim(), password);
      } else {
        await login(email.trim(), password);
      }
      onSuccess();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1>
          {isSignup ? "Create your " : "Welcome "}
          <span className="gradient-text">{isSignup ? "account" : "back"}</span>
        </h1>
        <p className="auth-sub">
          {isSignup
            ? "Save your analyses, track job applications and keep your data safe."
            : "Log in to see your dashboard, history and job tracker."}
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          {isSignup && (
            <label>
              Name
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
              />
            </label>
          )}

          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isSignup ? "At least 6 characters" : "Your password"}
              minLength={isSignup ? 6 : undefined}
              required
            />
          </label>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? "Please wait..." : isSignup ? "Sign up" : "Log in"}
          </button>
        </form>

        <p className="auth-switch">
          {isSignup ? "Already have an account? " : "New here? "}
          <a
            href="#top"
            onClick={() => onNavigate(isSignup ? "login" : "signup")}
          >
            {isSignup ? "Log in" : "Create an account"}
          </a>
        </p>
      </div>
    </main>
  );
}

export default Auth;