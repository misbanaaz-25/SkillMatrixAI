import { useEffect, useRef, useState } from "react";

import { useAuth } from "../context/AuthContext";

const MENU_PAGES = [
  { id: "dashboard", label: "Dashboard" },
  { id: "tracker", label: "Job Tracker" },
];

function Navbar({ view, onNavigate }) {
  const { user, isLoggedIn, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  // close the dropdown on outside click or Escape
  useEffect(() => {
    if (!open) return undefined;

    const handleClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    const handleKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const go = (target) => {
    setOpen(false);
    onNavigate(target);
  };

  const handleLogout = () => {
    setOpen(false);
    logout();
    onNavigate("home");
  };

  const displayName = user?.name || user?.email || "User";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <a href="#top" className="logo" onClick={() => onNavigate("home")}>
          <span className="logo-mark">◈</span>
          <span>
            SkillMatrix<span className="gradient-text">AI</span>
          </span>
        </a>

        <nav className="nav-links">
          {view === "home" ? (
            <>
              <a href="#features">Features</a>
              <a href="#how-it-works">How it works</a>
            </>
          ) : (
            <a href="#top" className="nav-keep" onClick={() => onNavigate("home")}>
              Home
            </a>
          )}

          {view !== "analyzer" && (
            <button className="btn btn-primary btn-small" onClick={() => onNavigate("analyzer")}>
              {view === "home" ? "Get Started" : "Analyze"}
            </button>
          )}

          <div className="profile-menu nav-keep" ref={menuRef}>
            <button
              type="button"
              className={`profile-btn ${isLoggedIn ? "profile-btn-active" : ""}`}
              onClick={() => setOpen((value) => !value)}
              aria-label="Profile menu"
              aria-expanded={open}
            >
              {isLoggedIn ? (
                <span className="profile-initial">{initial}</span>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
                  <path
                    d="M4 20c0-4 3.6-6 8-6s8 2 8 6"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </button>

            {open && (
              <div className="profile-dropdown">
                {isLoggedIn ? (
                  <>
                    <div className="profile-head">
                      <strong>{displayName}</strong>
                      {user?.email && user.email !== displayName && (
                        <span>{user.email}</span>
                      )}
                    </div>

                    {MENU_PAGES.map((page) => (
                      <button
                        key={page.id}
                        type="button"
                        className={`profile-item ${view === page.id ? "profile-item-current" : ""}`}
                        onClick={() => go(page.id)}
                      >
                        {page.label}
                      </button>
                    ))}

                    <div className="profile-divider" />
                    <button
                      type="button"
                      className="profile-item profile-item-danger"
                      onClick={handleLogout}
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <div className="profile-guest">
                    <strong>Unlock your profile</strong>
                    <p>Log in to save analyses, track applications and keep your data safe.</p>
                    <button
                      type="button"
                      className="btn btn-primary btn-small profile-login"
                      onClick={() => go("login")}
                    >
                      Log in
                    </button>
                    <p className="profile-signup">
                      New here?{" "}
                      <a href="#top" onClick={() => go("signup")}>
                        Create an account
                      </a>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;