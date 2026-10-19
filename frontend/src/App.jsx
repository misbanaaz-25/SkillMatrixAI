import { useState } from "react";

import Navbar from "./components/Navbar";
import Analyzer from "./pages/Analyzer";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import Tracker from "./pages/Tracker";

function App() {
  const [view, setView] = useState("home");

  const goTo = (nextView) => {
    setView(nextView);
    window.scrollTo(0, 0);
  };

  return (
    <>
      <Navbar view={view} onNavigate={goTo} />

      {view === "home" && <Home onAnalyze={() => goTo("analyzer")} />}
      {view === "analyzer" && <Analyzer />}
      {view === "dashboard" && <Dashboard onAnalyze={() => goTo("analyzer")} />}
      {view === "tracker" && <Tracker />}

      <footer className="footer">
        <div className="container">
          <p>SkillMatrixAI</p>
          <p>Match scores are estimates, not a guarantee of selection.</p>
        </div>
      </footer>
    </>
  );
}

export default App;