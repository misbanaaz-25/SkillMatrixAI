function Navbar({ view, onHome, onAnalyze }) {
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
            <a href="#top" onClick={onHome}>
              Home
            </a>
          )}
          <button className="btn btn-primary btn-small" onClick={onAnalyze}>
            {view === "home" ? "Get Started" : "Analyzer"}
          </button>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;