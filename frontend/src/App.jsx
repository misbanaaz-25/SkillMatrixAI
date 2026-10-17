import { useState } from "react";

import Navbar from "./components/Navbar";
import Analyzer from "./pages/Analyzer";
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
      />
      {view === "home" ? <Home onAnalyze={() => goTo("analyzer")} /> : <Analyzer />}
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