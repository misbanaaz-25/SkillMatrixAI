function Navbar() {
  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <a href="#top" className="logo">
          <span className="logo-mark">◈</span>
          <span>
            SkillMatrix<span className="gradient-text">AI</span>
          </span>
        </a>

        <nav className="nav-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <a href="#top" className="btn btn-primary btn-small">
            Get Started
          </a>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;