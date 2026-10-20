import { useState } from "react";

import Navbar from "./components/Navbar";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Analyzer from "./pages/Analyzer";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import Tracker from "./pages/Tracker";

const LOGIN_REQUIRED = ["dashboard", "tracker"];

function AppContent() {
  const [view, setView] = useState("home");
  const { isLoggedIn, checking } = useAuth();

  const goTo = (nextView) => {
    setView(nextView);
    window.scrollTo(0, 0);
  };

  // logged-out users can't open pages that show personal data
  const needsLogin = LOGIN_REQUIRED.includes(view) && !isLoggedIn;
  const activeView = needsLogin ? "login" : view;

  return (
    <>
      <Navbar view={activeView} onNavigate={goTo} />

      {activeView === "home" && <Home onAnalyze={() => goTo("analyzer")} />}
      {activeView === "analyzer" && <Analyzer />}
      {activeView === "dashboard" && <Dashboard onAnalyze={() => goTo("analyzer")} />}
      {activeView === "tracker" && <Tracker />}
      {(activeView === "login" || activeView === "signup") && !checking && (
        <Auth
          key={activeView}
          mode={activeView}
          onNavigate={goTo}
          onSuccess={() => goTo(needsLogin ? view : "analyzer")}
        />
      )}

      <footer className="footer">
        <div className="container">
          <p>SkillMatrixAI</p>
          <p>Match scores are estimates, not a guarantee of selection.</p>
        </div>
      </footer>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;