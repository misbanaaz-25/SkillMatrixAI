import { useMemo, useState } from "react";

const SKILLS = [
  { name: "Python", matched: true },
  { name: "FastAPI", matched: false },
  { name: "SQL", matched: true },
  { name: "Git", matched: false },
  { name: "REST API", matched: true },
  { name: "Testing", matched: false },
  { name: "Docker", matched: false },
];

const WIDTH = 520;
const HEIGHT = 440;
const CENTER = { x: 260, y: 220 };

export function ScoreRing({ score }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);

  return (
    <div className="ring">
      <svg viewBox="0 0 100 100">
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <circle className="ring-track" cx="50" cy="50" r={radius} />
        <circle
          className="ring-value"
          cx="50"
          cy="50"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span>{score}%</span>
    </div>
  );
}

function SkillConstellation() {
  const [learned, setLearned] = useState([]);

  const nodes = useMemo(
    () =>
      SKILLS.map((skill, index) => {
        const angle = (-90 + (360 / SKILLS.length) * index) * (Math.PI / 180);
        const radius = index % 2 === 0 ? 150 : 175;
        return {
          ...skill,
          x: CENTER.x + Math.cos(angle) * radius,
          y: CENTER.y + Math.sin(angle) * radius * 0.82,
        };
      }),
    []
  );

  const isMatched = (node) => node.matched || learned.includes(node.name);
  const matchedCount = nodes.filter(isMatched).length;
  const score = Math.round((matchedCount / nodes.length) * 100);

  const learn = (name) => {
    setLearned((current) => (current.includes(name) ? current : [...current, name]));
  };

  return (
    <div className="constellation">
      <div className="constellation-top">
        <ScoreRing score={score} />
        <div className="constellation-info">
          <h3>Python Developer</h3>
          <p>Estimated match · sample data</p>
        </div>
        <button
          className="btn btn-ghost btn-small"
          onClick={() => setLearned([])}
          disabled={learned.length === 0}
        >
          Reset
        </button>
      </div>

      <svg
        className="constellation-svg"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="group"
        aria-label="Interactive skill demo with sample data"
      >
        <defs>
          <radialGradient id="centerGrad">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#22d3ee" />
          </radialGradient>
        </defs>

        <circle className="orbit" cx={CENTER.x} cy={CENTER.y} r="110" />
        <circle className="orbit" cx={CENTER.x} cy={CENTER.y} r="175" />

        {nodes.map((node) => (
          <line
            key={`link-${node.name}`}
            className={isMatched(node) ? "link-good" : "link-gap"}
            x1={CENTER.x}
            y1={CENTER.y}
            x2={node.x}
            y2={node.y}
          />
        ))}

        <g>
          <circle className="center-glow" cx={CENTER.x} cy={CENTER.y} r="40" />
          <circle cx={CENTER.x} cy={CENTER.y} r="30" fill="url(#centerGrad)" />
          <text
            className="center-label"
            x={CENTER.x}
            y={CENTER.y + 5}
            textAnchor="middle"
          >
            You
          </text>
        </g>

        {nodes.map((node) => {
          const matched = isMatched(node);
          const handlers = matched
            ? {}
            : {
                onClick: () => learn(node.name),
                onKeyDown: (event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    learn(node.name);
                  }
                },
                role: "button",
                tabIndex: 0,
                "aria-label": `Learn ${node.name}`,
              };

          return (
            <g
              key={node.name}
              className={`node ${matched ? "node-good" : "node-gap"}`}
              {...handlers}
            >
              {!matched && <circle className="pulse-ring" cx={node.x} cy={node.y} r="16" />}
              <circle className="core" cx={node.x} cy={node.y} r="16" />
              <text className="node-mark" x={node.x} y={node.y + 5} textAnchor="middle">
                {matched ? "✓" : "+"}
              </text>
              <text className="node-label" x={node.x} y={node.y + 36} textAnchor="middle">
                {node.name}
              </text>
            </g>
          );
        })}
      </svg>

      <p className="constellation-hint">
        Tap a blinking amber skill to see your match score rise.
      </p>
    </div>
  );
}

export default SkillConstellation;