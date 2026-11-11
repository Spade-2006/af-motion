import React, { useState, useRef, useCallback } from "react";
import { easings, animate } from "../../../src/index.js";
import { DocsPlaygroundContainer } from "./DocsPlaygroundContainer.js";

interface EasingPreset {
  name: string;
  bezier: string;
  category: string;
}

const EASING_PRESETS: EasingPreset[] = [
  { name: "easeOutExpo", bezier: "cubic-bezier(0.16, 1, 0.3, 1)", category: "Exponential" },
  { name: "easeInOutCubic", bezier: "cubic-bezier(0.65, 0, 0.35, 1)", category: "Cubic" },
  { name: "easeOutBack", bezier: "cubic-bezier(0.34, 1.56, 0.64, 1)", category: "Back" },
  { name: "easeOutElastic", bezier: "cubic-bezier(0.68, -0.6, 0.32, 1.6)", category: "Elastic" },
  { name: "easeInOutQuad", bezier: "cubic-bezier(0.45, 0, 0.55, 1)", category: "Quad" },
  { name: "easeInExpo", bezier: "cubic-bezier(0.7, 0, 0.84, 0)", category: "Exponential" },
  { name: "linear", bezier: "cubic-bezier(0, 0, 1, 1)", category: "Standard" },
];

export const EasingExplorer: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState<EasingPreset>(EASING_PRESETS[0]);
  const [compareLinear, setCompareLinear] = useState(true);
  const [duration, setDuration] = useState(800);
  const [isRunning, setIsRunning] = useState(false);

  const primaryDotRef = useRef<HTMLDivElement>(null);
  const compareDotRef = useRef<HTMLDivElement>(null);

  const runAnimation = useCallback(() => {
    setIsRunning(true);

    if (primaryDotRef.current) {
      animate(
        primaryDotRef.current,
        { transform: ["translateX(0px)", "translateX(260px)"] },
        { duration, easing: selectedPreset.bezier, fill: "forwards" }
      );
    }

    if (compareLinear && compareDotRef.current) {
      animate(
        compareDotRef.current,
        { transform: ["translateX(0px)", "translateX(260px)"] },
        { duration, easing: "linear", fill: "forwards" }
      );
    }

    setTimeout(() => {
      setIsRunning(false);
    }, duration + 50);
  }, [duration, selectedPreset, compareLinear]);

  const resetAnimation = useCallback(() => {
    if (primaryDotRef.current) primaryDotRef.current.style.transform = "translateX(0px)";
    if (compareDotRef.current) compareDotRef.current.style.transform = "translateX(0px)";
    setIsRunning(false);
  }, []);

  const generatedCode = `import { easings, animate } from "af-motion";

// Selected curve: ${selectedPreset.name}
const easingCurve = "${selectedPreset.bezier}";

animate(
  element,
  { transform: ["translateX(0px)", "translateX(260px)"] },
  {
    duration: ${duration},
    easing: easingCurve,
  }
);`;

  return (
    <DocsPlaygroundContainer
      title="Interactive Easing & Curve Explorer"
      badge="56 Mathematical Curves"
      description="Visualize cubic-bezier curves, inspect acceleration curves, and compare against linear timing."
      isRunning={isRunning}
      onRun={runAnimation}
      onReset={resetAnimation}
      code={generatedCode}
      preview={
        <div className="easing-explorer-view">
          {/* Curve Visualization (SVG Graph) */}
          <div className="easing-graph-wrapper">
            <svg
              viewBox="0 0 200 120"
              className="docs-curve-svg"
              style={{ width: "100%", height: "130px", background: "rgba(0,0,0,0.2)", borderRadius: "8px" }}
            >
              {/* Grid lines */}
              <line x1="20" y1="20" x2="180" y2="20" stroke="rgba(255,255,255,0.08)" strokeDasharray="2" />
              <line x1="20" y1="100" x2="180" y2="100" stroke="rgba(255,255,255,0.15)" />
              <line x1="20" y1="20" x2="20" y2="100" stroke="rgba(255,255,255,0.15)" />
              <line x1="180" y1="20" x2="180" y2="100" stroke="rgba(255,255,255,0.08)" strokeDasharray="2" />

              {/* Reference linear baseline */}
              <line x1="20" y1="100" x2="180" y2="20" stroke="rgba(255,255,255,0.2)" strokeDasharray="4" />

              {/* Animated Curve Path visualization */}
              <path
                d={
                  selectedPreset.name === "linear"
                    ? "M 20 100 L 180 20"
                    : selectedPreset.name === "easeOutExpo"
                    ? "M 20 100 C 45 20, 70 20, 180 20"
                    : selectedPreset.name === "easeOutBack"
                    ? "M 20 100 C 74 10, 120 -10, 180 20"
                    : selectedPreset.name === "easeInOutCubic"
                    ? "M 20 100 C 120 100, 80 20, 180 20"
                    : "M 20 100 C 80 30, 120 20, 180 20"
                }
                fill="none"
                stroke="#38bdf8"
                strokeWidth="3"
              />
            </svg>
            <div className="graph-label">
              <span>(0, 0)</span>
              <span style={{ color: "#38bdf8", fontWeight: 700 }}>{selectedPreset.name}</span>
              <span>(1, 1)</span>
            </div>
          </div>

          {/* Running Track Preview */}
          <div className="preview-track-area">
            <div className="track-row">
              <span className="track-label">{selectedPreset.name}</span>
              <div className="track-bar">
                <div
                  ref={primaryDotRef}
                  className="track-dot primary"
                  style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    background: "#38bdf8",
                    boxShadow: "0 0 12px #38bdf8",
                  }}
                />
              </div>
            </div>

            {compareLinear && (
              <div className="track-row">
                <span className="track-label">Linear Baseline</span>
                <div className="track-bar">
                  <div
                    ref={compareDotRef}
                    className="track-dot secondary"
                    style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.4)",
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      }
      controls={
        <div className="controls-form">
          <div className="control-row">
            <label htmlFor="easing-preset-select">Select Curve</label>
            <select
              id="easing-preset-select"
              value={selectedPreset.name}
              onChange={(e) => {
                const found = EASING_PRESETS.find((p) => p.name === e.target.value);
                if (found) setSelectedPreset(found);
              }}
              className="docs-select-input"
            >
              {EASING_PRESETS.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name} ({p.category})
                </option>
              ))}
            </select>
          </div>

          <div className="control-row">
            <label htmlFor="easing-duration">Duration: {duration}ms</label>
            <input
              id="easing-duration"
              type="range"
              min="200"
              max="2500"
              step="50"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            />
          </div>

          <div className="control-row-toggle">
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={compareLinear}
                onChange={(e) => setCompareLinear(e.target.checked)}
              />
              <span>Compare against linear baseline</span>
            </label>
          </div>

          <div className="curve-info-card">
            <div className="info-item">
              <span className="info-key">CSS Definition:</span>
              <code className="info-val">{selectedPreset.bezier}</code>
            </div>
          </div>
        </div>
      }
    />
  );
};
