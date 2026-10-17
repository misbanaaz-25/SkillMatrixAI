import SkillConstellation from "../components/SkillConstellation";

const marqueeSkills = [
  "Python", "SQL", "FastAPI", "React", "Node.js", "Docker", "Git",
  "REST API", "Machine Learning", "NLP", "Pandas", "NumPy", "Scikit-learn",
  "TypeScript", "AWS", "Testing", "Django", "Flask", "MongoDB", "Firebase",
  "Kotlin", "React Native",
];

const steps = [
  { title: "Upload your resume", text: "Add your resume as a PDF or DOCX file." },
  { title: "Add the job description", text: "Paste the description of the role you want." },
  { title: "Close the gap", text: "See your match, missing skills and what to learn next." },
];

function Home({onAnalyze}) {
  const loopedSkills = [...marqueeSkills, ...marqueeSkills];

  return (
    <main id="top">
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <span className="badge">AI-powered Resume Analyzer</span>
            <h1>
              Don't just apply. See your <span className="gradient-text">skill gap</span> light up.
            </h1>
            <p className="hero-text">
              Upload your resume, add a job description, and watch which skills
              you have, which are missing, and what to learn next.
            </p>
            <div className="hero-actions">
              <button className="btn btn-primary" onClick={onAnalyze}>
                Analyze my resume
              </button>
              <a href="#how-it-works" className="btn btn-ghost">
                How it works
              </a>
            </div>
          </div>

          <SkillConstellation />
        </div>
      </section>

      <div className="marquee">
        <p className="marquee-label">Skills we detect</p>
        <div className="marquee-track">
          {loopedSkills.map((skill, index) => (
            <span className="chip" key={`${skill}-${index}`}>
              {skill}
            </span>
          ))}
        </div>
      </div>

      <section id="features" className="section">
        <div className="container">
          <h2 className="section-title">
            Built to take you from <span className="gradient-text">gap</span> to growth
          </h2>
          <p className="section-sub">
            Everything from reading your resume to planning what to learn next.
          </p>

          <div className="bento">
            <div className="bento-card span-3">
              <div className="card-icon">📄</div>
              <h3>Resume Analyzer</h3>
              <p>Upload a PDF or DOCX and get the skills detected from it.</p>
              <div className="file-pill">📎 resume.pdf</div>
              <div className="chips">
                <span className="chip chip-good">Python</span>
                <span className="chip chip-good">SQL</span>
                <span className="chip chip-good">Git</span>
              </div>
            </div>

            <div className="bento-card span-3">
              <div className="card-icon">🎯</div>
              <h3>Job Match Analyzer</h3>
              <p>Compare your resume with a job description, skill by skill.</p>
              <div className="bar-row">
                <div><span>Skill match</span><span>71%</span></div>
                <div className="bar"><span style={{ width: "71%" }} /></div>
              </div>
              <div className="bar-row">
                <div><span>Text similarity</span><span>44%</span></div>
                <div className="bar"><span style={{ width: "44%" }} /></div>
              </div>
              <div className="chips">
                <span className="chip chip-bad">Missing: Docker</span>
                <span className="chip chip-bad">Missing: Testing</span>
              </div>
            </div>

            <div className="bento-card span-4">
              <div className="card-icon">🗺️</div>
              <h3>Personalized Learning Roadmap</h3>
              <p>Missing skills in priority order, from beginner to advanced. Example: FastAPI.</p>
              <div className="timeline">
                <div className="timeline-item">
                  <strong>Beginner</strong>
                  <span>Routes, path and query parameters</span>
                </div>
                <div className="timeline-item">
                  <strong>Intermediate</strong>
                  <span>Pydantic models, file upload</span>
                </div>
                <div className="timeline-item">
                  <strong>Advanced</strong>
                  <span>Authentication, database integration</span>
                </div>
              </div>
            </div>

            <div className="bento-card span-2">
              <div className="card-icon">📈</div>
              <h3>
                Career Growth<span className="soon">Coming soon</span>
              </h3>
              <p>See which roles your skills can grow into over time.</p>
            </div>

            <div className="bento-card span-3">
              <div className="card-icon">✨</div>
              <h3>
                Personalisation<span className="soon">Coming soon</span>
              </h3>
              <p>Roadmaps that adapt to your level, goals and pace.</p>
            </div>

            <div className="bento-card span-3">
              <div className="card-icon">🗂️</div>
              <h3>
                Dashboard &amp; History<span className="soon">Coming soon</span>
              </h3>
              <p>Track your scores, compare past analyses and download reports.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="section">
        <div className="container">
          <h2 className="section-title">How it works</h2>
          <p className="section-sub">Three simple steps.</p>

          <div className="steps">
            {steps.map((step, index) => (
              <div className="bento-card" key={step.title}>
                <div className="step-number">{index + 1}</div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="container">
        <div className="cta">
          <h2>
            Ready to see your <span className="gradient-text">skill gap</span>?
          </h2>
          <p>Upload your resume and find out what to learn next.</p>
          <button className="btn btn-primary" onClick={onAnalyze}>
           Analyze my resume
          </button>
        </div>
      </div>
    </main>
  );
}

export default Home;