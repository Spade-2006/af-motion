import React, { useState, useRef, useCallback } from "react";
import { applyMotionDNA, animate } from "../../../src/index.js";
import { DocsPlaygroundContainer } from "./DocsPlaygroundContainer.js";

type MotionDNAType = "precise" | "playful" | "elegant" | "energetic" | "editorial-flow";

interface DNAProfileData {
  id: MotionDNAType;
  name: string;
  duration: number;
  easingDesc: string;
  springDesc: string;
  vibe: string;
  bestFor: string;
}

const DNA_PROFILES: DNAProfileData[] = [
  {
    id: "precise",
    name: "Precise",
    duration: 200,
    easingDesc: "cubic-bezier(0.2, 0, 0, 1)",
    springDesc: "Stiffness: 350, Damping: 30 (Zero overshoot)",
    vibe: "Utilitarian, crisp, responsive",
    bestFor: "B2B SaaS, data tables, toolbars, dashboards",
  },
  {
    id: "playful",
    name: "Playful",
    duration: 450,
    easingDesc: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    springDesc: "Stiffness: 220, Damping: 14 (Elastic bounce)",
    vibe: "Bouncy, lively, delightful",
    bestFor: "Consumer apps, gamification, onboarding, social",
  },
  {
    id: "elegant",
    name: "Elegant",
    duration: 750,
    easingDesc: "cubic-bezier(0.16, 1, 0.3, 1)",
    springDesc: "Stiffness: 180, Damping: 26 (Smooth deceleration)",
    vibe: "Luxurious, smooth, deliberate",
    bestFor: "Fashion, luxury brands, architecture, portfolios",
  },
  {
    id: "energetic",
    name: "Energetic",
    duration: 250,
    easingDesc: "cubic-bezier(0.25, 1, 0.5, 1)",
    springDesc: "Stiffness: 320, Damping: 16 (Punchy snap)",
    vibe: "Rapid attack, high momentum",
    bestFor: "Fitness apps, esports, creative agencies, music",
  },
  {
    id: "editorial-flow",
    name: "Editorial Flow",
    duration: 650,
    easingDesc: "cubic-bezier(0.25, 0.1, 0.25, 1)",
    springDesc: "Stiffness: 190, Damping: 24 (Staggered cadence)",
    vibe: "Literary, thoughtful rhythm",
    bestFor: "Publishing, magazines, creative essays, blogs",
  },
];

export const MotionDNAPlayground: React.FC = () => {
  const [selectedDNA, setSelectedDNA] = useState<MotionDNAType>("playful");
  const [isRunning, setIsRunning] = useState(false);

  const previewCardRef = useRef<HTMLDivElement>(null);
  const activeProfile = DNA_PROFILES.find((p) => p.id === selectedDNA) || DNA_PROFILES[0];

  const triggerAnimation = useCallback(() => {
    if (!previewCardRef.current) return;
    setIsRunning(true);

    try {
      const dnaNameMap: Record<string, string> = {
        precise: "snappy",
        playful: "playful",
        elegant: "calm",
        energetic: "energetic",
        "editorial-flow": "calm",
      };
      const profileName = dnaNameMap[selectedDNA] || "playful";
      const motionOptions = applyMotionDNA(profileName, { duration: activeProfile.duration });

      // Trigger standard bounce/scale animation matching profile duration
      animate(
        previewCardRef.current,
        {
          transform: ["scale(0.85) translateY(20px)", "scale(1) translateY(0px)"],
          opacity: [0.3, 1],
        },
        motionOptions
      );

      setTimeout(() => {
        setIsRunning(false);
      }, activeProfile.duration + 50);
    } catch {
      setIsRunning(false);
    }
  }, [selectedDNA, activeProfile]);

  const dnaNameMap: Record<string, string> = {
    precise: "snappy",
    playful: "playful",
    elegant: "calm",
    energetic: "energetic",
    "editorial-flow": "calm",
  };
  const profileName = dnaNameMap[selectedDNA] || "playful";

  const generatedCode = `import { animate, applyMotionDNA } from "af-motion";

// 1. Resolve '${selectedDNA}' Motion DNA options
const motionOptions = applyMotionDNA("${profileName}", {
  duration: ${activeProfile.duration},
});

// 2. Animate target element with Motion DNA profile
animate(document.querySelector(".my-card"), {
  transform: ["scale(0.85) translateY(20px)", "scale(1) translateY(0px)"],
  opacity: [0.3, 1],
}, motionOptions);`;

// Configured values:
// Duration: ${activeProfile.duration}ms
// Curve: ${activeProfile.easingDesc}
// Physics: ${activeProfile.springDesc}`;

  return (
    <DocsPlaygroundContainer
      title="Motion DNA Personality Playground"
      badge="5 Kinetic Profiles"
      description="Compare how the 5 Motion DNA personalities transform animation rhythm, duration, and tactile bounce."
      isRunning={isRunning}
      onRun={triggerAnimation}
      code={generatedCode}
      preview={
        <div className="preview-canvas-box" style={{ height: "230px" }}>
          <div
            ref={previewCardRef}
            onClick={triggerAnimation}
            className="motion-dna-card"
            style={{
              padding: "20px 28px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
              border: "1px solid rgba(129, 140, 248, 0.3)",
              boxShadow: "0 12px 30px rgba(0,0,0,0.4)",
              color: "#ffffff",
              textAlign: "center",
              cursor: "pointer",
              userSelect: "none",
              willChange: "transform, opacity",
            }}
          >
            <span style={{ fontSize: "1.8rem", display: "block", marginBottom: "6px" }}>🧬</span>
            <h4 style={{ margin: "0 0 4px 0", color: "#38bdf8" }}>{activeProfile.name} DNA</h4>
            <p style={{ margin: 0, fontSize: "0.85rem", opacity: 0.85 }}>{activeProfile.vibe}</p>
            <small style={{ display: "block", marginTop: "10px", color: "#818cf8", fontSize: "0.75rem" }}>
              Click to preview kinetic personality
            </small>
          </div>
        </div>
      }
      controls={
        <div className="controls-form">
          <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--docs-text-muted)" }}>
            Select Personality
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "14px" }}>
            {DNA_PROFILES.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedDNA(p.id)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--docs-border)",
                  background: selectedDNA === p.id ? "var(--docs-accent)" : "rgba(255,255,255,0.03)",
                  color: selectedDNA === p.id ? "#090b0e" : "var(--docs-text)",
                  fontWeight: 700,
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                {p.name}
              </button>
            ))}
          </div>

          <div className="dna-metrics-table">
            <div className="metric-row">
              <span className="metric-key">Duration:</span>
              <strong className="metric-val">{activeProfile.duration}ms</strong>
            </div>
            <div className="metric-row">
              <span className="metric-key">Physics:</span>
              <span className="metric-val">{activeProfile.springDesc}</span>
            </div>
            <div className="metric-row">
              <span className="metric-key">Best For:</span>
              <span className="metric-val">{activeProfile.bestFor}</span>
            </div>
          </div>
        </div>
      }
    />
  );
};
