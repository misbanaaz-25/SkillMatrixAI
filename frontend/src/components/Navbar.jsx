function Navbar({ view, onHome, onAnalyze, onDashboard }) {
  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <a href="#top" className="logo" onClick={onHome}>
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
            <a href="#top" className="nav-keep" onClick={onHome}>
              Home
            </a>
          )}

          {view !== "dashboard" && (
            <a href="#top" className="nav-keep" onClick={onDashboard}>
              Dashboard
            </a>
          )}

          {view !== "analyzer" && (
            <button className="btn btn-primary btn-small" onClick={onAnalyze}>
              {view === "home" ? "Get Started" : "Analyze"}
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;