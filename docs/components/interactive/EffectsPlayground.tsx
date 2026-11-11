import React, { useState, useRef, useCallback } from "react";
import { reveal, stagger, magnetic, tilt } from "../../../src/index.js";
import { DocsPlaygroundContainer } from "./DocsPlaygroundContainer.js";

type EffectTab = "reveal" | "stagger" | "magnetic" | "tilt";

export const EffectsPlayground: React.FC = () => {
  const [activeEffect, setActiveEffect] = useState<EffectTab>("reveal");

  // Reveal state
  const [revealDir, setRevealDir] = useState<"up" | "down" | "left" | "right">("up");
  const [revealDist, setRevealDist] = useState(30);

  // Stagger state
  const [staggerDelay, setStaggerDelay] = useState(60);

  // Magnetic state
  const [magStrength, setMagStrength] = useState(0.4);

  // Tilt state
  const [maxTilt, setMaxTilt] = useState(18);

  const containerRef = useRef<HTMLDivElement>(null);
  const magneticControlsRef = useRef<any>(null);
  const tiltControlsRef = useRef<any>(null);

  const runEffect = useCallback(() => {
    if (!containerRef.current) return;

    if (activeEffect === "reveal") {
      const card = containerRef.current.querySelector(".reveal-target") as HTMLElement;
      if (card) {
        const offset = revealDir === "up" ? revealDist : revealDir === "down" ? -revealDist : 0;
        const offsetX = revealDir === "left" ? revealDist : revealDir === "right" ? -revealDist : 0;
        const fromTransform = offset !== 0 ? `translateY(${offset}px)` : `translateX(${offsetX}px)`;
        reveal(card, {
          properties: {
            opacity: [0, 1],
            transform: [fromTransform, "translate(0px)"],
          },
          duration: 500,
          once: false,
        });
      }
    } else if (activeEffect === "stagger") {
      stagger(".stagger-pill", {
        properties: {
          opacity: [0, 1],
          transform: ["translateY(20px)", "translateY(0px)"],
        },
        stagger: staggerDelay,
        duration: 400,
      });
    }
  }, [activeEffect, revealDir, revealDist, staggerDelay]);

  // Magnetic interaction on mount/update
  const handleMagneticMount = useCallback((node: HTMLButtonElement | null) => {
    if (magneticControlsRef.current) {
      try { magneticControlsRef.current.destroy(); } catch {}
      magneticControlsRef.current = null;
    }
    if (node) {
      try {
        magneticControlsRef.current = magnetic(node, { strength: magStrength, distance: 100 });
      } catch {}
    }
  }, [magStrength]);

  // Tilt interaction on mount/update
  const handleTiltMount = useCallback((node: HTMLDivElement | null) => {
    if (tiltControlsRef.current) {
      try { tiltControlsRef.current.destroy(); } catch {}
      tiltControlsRef.current = null;
    }
    if (node) {
      try {
        tiltControlsRef.current = tilt(node, { maxTilt, scale: 1.05, perspective: 1000 });
      } catch {}
    }
  }, [maxTilt]);

  const generatedCode =
    activeEffect === "reveal"
      ? `import { reveal } from "af-motion";

reveal(document.querySelector(".target"), {
  properties: {
    opacity: [0, 1],
    transform: ["translateY(${revealDist}px)", "translateY(0px)"],
  },
  duration: 500,
});`
      : activeEffect === "stagger"
      ? `import { stagger } from "af-motion";

stagger(document.querySelectorAll(".pill"), {
  properties: {
    opacity: [0, 1],
    transform: ["translateY(20px)", "translateY(0px)"],
  },
  stagger: ${staggerDelay},
  duration: 400,
});`
      : activeEffect === "magnetic"
      ? `import { magnetic } from "af-motion";

magnetic(document.querySelector(".magnetic-btn"), {
  strength: ${magStrength},
  distance: 100,
});`
      : `import { tilt } from "af-motion";

tilt(document.querySelector(".tilt-card"), {
  maxTilt: ${maxTilt},
  scale: 1.05,
  perspective: 1000,
});`;

  return (
    <DocsPlaygroundContainer
      title="Interactive Effects & Microinteractions"
      badge="Tactile UI Primitives"
      description="Select and configure directional Reveal, list Stagger, cursor Magnetic attraction, or 3D Tilt."
      onRun={activeEffect === "reveal" || activeEffect === "stagger" ? runEffect : undefined}
      code={generatedCode}
      preview={
        <div ref={containerRef} className="preview-canvas-box" style={{ height: "230px" }}>
          {activeEffect === "reveal" && (
            <div
              className="reveal-target"
              style={{
                padding: "24px",
                borderRadius: "14px",
                background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#ffffff",
                boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
                textAlign: "center",
              }}
            >
              <h4 style={{ margin: "0 0 6px 0" }}>Directional Reveal</h4>
              <p style={{ margin: 0, fontSize: "0.85rem", opacity: 0.8 }}>
                Direction: {revealDir} | Distance: {revealDist}px
              </p>
            </div>
          )}

          {activeEffect === "stagger" && (
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
              {["React", "TypeScript", "Vite", "WAAPI", "Springs"].map((tag, idx) => (
                <span
                  key={tag}
                  className="stagger-pill"
                  style={{
                    padding: "8px 16px",
                    borderRadius: "20px",
                    background: idx % 2 === 0 ? "#38bdf8" : "#818cf8",
                    color: "#0f172a",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {activeEffect === "magnetic" && (
            <div style={{ textAlign: "center" }}>
              <button
                ref={handleMagneticMount}
                className="magnetic-preview-btn"
                style={{
                  padding: "14px 28px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)",
                  border: "none",
                  color: "#ffffff",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontSize: "1rem",
                  boxShadow: "0 8px 20px rgba(59,130,246,0.35)",
                }}
              >
                Hover Near Me (Magnetic)
              </button>
            </div>
          )}

          {activeEffect === "tilt" && (
            <div
              ref={handleTiltMount}
              className="tilt-preview-card"
              style={{
                width: "200px",
                height: "130px",
                borderRadius: "16px",
                background: "linear-gradient(135deg, #6366f1 0%, #ec4899 100%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                boxShadow: "0 15px 35px rgba(0,0,0,0.4)",
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              <h4 style={{ margin: "0 0 4px 0" }}>3D Tilt Card</h4>
              <small style={{ opacity: 0.85 }}>Move cursor across</small>
            </div>
          )}
        </div>
      }
      controls={
        <div className="controls-form">
          <div className="effect-tab-group" style={{ display: "flex", gap: "6px", marginBottom: "14px" }}>
            {(["reveal", "stagger", "magnetic", "tilt"] as EffectTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                className={`docs-sub-tab ${activeEffect === tab ? "active" : ""}`}
                onClick={() => setActiveEffect(tab)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: "1px solid var(--docs-border)",
                  background: activeEffect === tab ? "var(--docs-accent)" : "transparent",
                  color: activeEffect === tab ? "#090b0e" : "var(--docs-text)",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  textTransform: "capitalize",
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeEffect === "reveal" && (
            <>
              <div className="control-row">
                <label>Direction</label>
                <select
                  value={revealDir}
                  onChange={(e) => setRevealDir(e.target.value as any)}
                  className="docs-select-input"
                >
                  <option value="up">Up (Slides from below)</option>
                  <option value="down">Down (Slides from above)</option>
                  <option value="left">Left (Slides from right)</option>
                  <option value="right">Right (Slides from left)</option>
                </select>
              </div>

              <div className="control-row">
                <label>Distance: {revealDist}px</label>
                <input
                  type="range"
                  min="10"
                  max="80"
                  step="5"
                  value={revealDist}
                  onChange={(e) => setRevealDist(Number(e.target.value))}
                />
              </div>
            </>
          )}

          {activeEffect === "stagger" && (
            <div className="control-row">
              <label>Stagger Delay: {staggerDelay}ms</label>
              <input
                type="range"
                min="20"
                max="150"
                step="10"
                value={staggerDelay}
                onChange={(e) => setStaggerDelay(Number(e.target.value))}
              />
            </div>
          )}

          {activeEffect === "magnetic" && (
            <div className="control-row">
              <label>Strength: {magStrength}</label>
              <input
                type="range"
                min="0.1"
                max="0.7"
                step="0.05"
                value={magStrength}
                onChange={(e) => setMagStrength(Number(e.target.value))}
              />
            </div>
          )}

          {activeEffect === "tilt" && (
            <div className="control-row">
              <label>Max Tilt: {maxTilt}deg</label>
              <input
                type="range"
                min="5"
                max="30"
                step="1"
                value={maxTilt}
                onChange={(e) => setMaxTilt(Number(e.target.value))}
              />
            </div>
          )}
        </div>
      }
    />
  );
};
