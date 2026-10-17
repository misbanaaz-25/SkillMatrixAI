import Navbar from "./components/Navbar";
import Home from "./pages/Home";

function App() {
  return (
    <>
      <Navbar />
      <Home />
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