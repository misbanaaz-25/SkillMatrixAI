const PAGES = [
  { id: "dashboard", label: "Dashboard" },
  { id: "tracker", label: "Job Tracker" },
];

function Navbar({ view, onNavigate }) {
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

          {PAGES.filter((page) => page.id !== view).map((page) => (
            <a
              key={page.id}
              href="#top"
              className="nav-keep"
              onClick={() => onNavigate(page.id)}
            >
              {page.label}
            </a>
          ))}

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