import { useState } from "react";

import CareerBuddy from "./components/CareerBuddy";
import Navbar from "./components/Navbar";
import { AnalysisProvider } from "./context/AnalysisContext";
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
  const isAuthPage = activeView === "login" || activeView === "signup";

  return (
    <>
      <Navbar view={activeView} onNavigate={goTo} />

      {activeView === "home" && <Home onAnalyze={() => goTo("analyzer")} />}
      {activeView === "analyzer" && <Analyzer />}
      {activeView === "dashboard" && <Dashboard onAnalyze={() => goTo("analyzer")} />}
      {activeView === "tracker" && <Tracker />}
      {isAuthPage && !checking && (
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

      {!isAuthPage && <CareerBuddy onAnalyze={() => goTo("analyzer")} />}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AnalysisProvider>
        <AppContent />
      </AnalysisProvider>
    </AuthProvider>
  );
}

export default App;