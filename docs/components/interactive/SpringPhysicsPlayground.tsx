import React, { useState, useRef, useCallback } from "react";
import { animateSpring } from "../../../src/index.js";
import { DocsPlaygroundContainer } from "./DocsPlaygroundContainer.js";

export const SpringPhysicsPlayground: React.FC = () => {
  const [stiffness, setStiffness] = useState(260);
  const [damping, setDamping] = useState(18);
  const [mass, setMass] = useState(1);
  const [isRunning, setIsRunning] = useState(false);
  const [statusText, setStatusText] = useState("Resting at equilibrium");

  const springTargetRef = useRef<HTMLDivElement>(null);

  // Approximate damping ratio: zeta = c / (2 * sqrt(m * k))
  const dampingRatio = (damping / (2 * Math.sqrt(mass * stiffness))).toFixed(2);
  const springType =
    Number(dampingRatio) < 1 ? "Under-damped (Oscillating)" : Number(dampingRatio) === 1 ? "Critically damped" : "Over-damped";

  const releaseSpring = useCallback(() => {
    if (!springTargetRef.current) return;
    setIsRunning(true);
    setStatusText("Spring released - Simulating forces...");

    try {
      animateSpring({
        from: 0.5,
        to: 1,
        config: { stiffness, damping, mass },
        onUpdate: ({ position }) => {
          if (springTargetRef.current) {
            const scale = position;
            const y = (1 - position) * 40;
            springTargetRef.current.style.transform = `scale(${scale}) translateY(${y}px)`;
          }
        },
        onComplete: () => {
          setIsRunning(false);
          setStatusText("Settled at equilibrium");
        },
      });
    } catch {
      setIsRunning(false);
      setStatusText("Settled");
    }
  }, [stiffness, damping, mass]);

  const resetSpring = useCallback(() => {
    if (springTargetRef.current) {
      springTargetRef.current.style.transform = "scale(1) translateY(0px)";
    }
    setIsRunning(false);
    setStatusText("Resting at equilibrium");
  }, []);

  const generatedCode = `import { animateSpring } from "af-motion";

const card = document.querySelector(".spring-card") as HTMLElement;

animateSpring({
  from: 0.5,
  to: 1,
  config: {
    stiffness: ${stiffness}, // Spring rigidity
    damping: ${damping},     // Oscillation resistance
    mass: ${mass},           // Inertial mass
  },
  onUpdate: ({ position }) => {
    const scale = position;
    const y = (1 - position) * 40;
    card.style.transform = \`scale(\${scale}) translateY(\${y}px)\`;
  },
  onComplete: () => {
    console.log("Settled at equilibrium");
  },
});`;

  return (
    <DocsPlaygroundContainer
      title="Natural Spring Physics Playground"
      badge="Harmonic Oscillations"
      description="Experiment with stiffness, damping resistance, and mass to observe interruptible natural movement."
      statusText={statusText}
      isRunning={isRunning}
      onRun={releaseSpring}
      onReset={resetSpring}
      code={generatedCode}
      preview={
        <div className="preview-canvas-box" style={{ height: "220px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div
            ref={springTargetRef}
            className="spring-target-object"
            onClick={releaseSpring}
            style={{
              width: "110px",
              height: "110px",
              borderRadius: "24px",
              background: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)",
              boxShadow: "0 12px 30px -4px rgba(236, 72, 153, 0.4)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "0.85rem",
              userSelect: "none",
              willChange: "transform",
            }}
          >
            <span>🌀 Spring</span>
            <small style={{ fontSize: "0.7rem", opacity: 0.9 }}>Click to Bounce</small>
          </div>
        </div>
      }
      controls={
        <div className="controls-form">
          <div className="control-row">
            <label htmlFor="stiffness-slider">Stiffness (k): {stiffness}</label>
            <input
              id="stiffness-slider"
              type="range"
              min="50"
              max="500"
              step="10"
              value={stiffness}
              onChange={(e) => setStiffness(Number(e.target.value))}
            />
          </div>

          <div className="control-row">
            <label htmlFor="damping-slider">Damping (c): {damping}</label>
            <input
              id="damping-slider"
              type="range"
              min="5"
              max="45"
              step="1"
              value={damping}
              onChange={(e) => setDamping(Number(e.target.value))}
            />
          </div>

          <div className="control-row">
            <label htmlFor="mass-slider">Mass (m): {mass}</label>
            <input
              id="mass-slider"
              type="range"
              min="0.2"
              max="3"
              step="0.1"
              value={mass}
              onChange={(e) => setMass(Number(e.target.value))}
            />
          </div>

          <div className="physics-telemetry-badge">
            <div className="badge-row">
              <span className="badge-title">Damping Ratio (ζ):</span>
              <strong className="badge-value">{dampingRatio}</strong>
            </div>
            <div className="badge-row">
              <span className="badge-title">Behavior:</span>
              <span className="badge-sub">{springType}</span>
            </div>
          </div>
        </div>
      }
    />
  );
};
