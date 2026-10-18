import { useState } from "react";

import Navbar from "./components/Navbar";
import Analyzer from "./pages/Analyzer";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";

function App() {
  const [view, setView] = useState("home");

  const goTo = (nextView) => {
    setView(nextView);
    window.scrollTo(0, 0);
  };

  return (
    <>
      <Navbar
        view={view}
        onHome={() => goTo("home")}
        onAnalyze={() => goTo("analyzer")}
        onDashboard={() => goTo("dashboard")}
      />

      {view === "home" && <Home onAnalyze={() => goTo("analyzer")} />}
      {view === "analyzer" && <Analyzer />}
      {view === "dashboard" && <Dashboard onAnalyze={() => goTo("analyzer")} />}

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