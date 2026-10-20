import { useAuth } from "../context/AuthContext";

const PAGES = [
  { id: "dashboard", label: "Dashboard" },
  { id: "tracker", label: "Job Tracker" },
];

function Navbar({ view, onNavigate }) {
  const { user, isLoggedIn, logout } = useAuth();

  const handleLogout = () => {
    logout();
    onNavigate("home");
  };

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

          {isLoggedIn &&
            PAGES.filter((page) => page.id !== view).map((page) => (
              <a
                key={page.id}
                href="#top"
                className="nav-keep"
                onClick={() => onNavigate(page.id)}
              >
                {page.label}
              </a>
            ))}

          {isLoggedIn ? (
            <>
              <span className="nav-user nav-keep">
                Hi, {user?.name || user?.email || "there"}
              </span>
              <a href="#top" className="nav-keep" onClick={handleLogout}>
                Logout
              </a>
            </>
          ) : (
            <>
              {view !== "login" && (
                <a href="#top" className="nav-keep" onClick={() => onNavigate("login")}>
                  Login
                </a>
              )}
              {view !== "signup" && (
                <a href="#top" className="nav-keep" onClick={() => onNavigate("signup")}>
                  Sign up
                </a>
              )}
            </>
          )}

          {view !== "analyzer" && (
            <button className="btn btn-primary btn-small" onClick={() => onNavigate("analyzer")}>
              {view === "home" ? "Get Started" : "Analyze"}
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;