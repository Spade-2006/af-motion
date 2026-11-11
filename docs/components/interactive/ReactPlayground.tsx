import React, { useState } from "react";
import { useAnimate, useMicrointeraction, useMotionAccessibility, Reveal } from "../../../src/react.js";
import { DocsPlaygroundContainer } from "./DocsPlaygroundContainer.js";

export const ReactPlayground: React.FC = () => {
  const { ref: badgeRef, animate: animateBadge } = useAnimate<HTMLDivElement>();
  const { accessibilityScore } = useMotionAccessibility({
    duration: 350,
    properties: { scale: [1, 1.25, 1] },
  });
  const [simulatedReducedMotion, setSimulatedReducedMotion] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  // Microinteraction hook
  const { ref: microRef, handlers: microHandlers, isPressed } = useMicrointeraction<HTMLButtonElement>("button");

  const osReducedMotion =
    typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;
  const isReducedActive = simulatedReducedMotion || osReducedMotion;

  const handleTriggerAnimate = async () => {
    setClickCount((c) => c + 1);
    if (isReducedActive) {
      // Suppress animation when reduced motion active
      return;
    }
    animateBadge({ scale: [1, 1.25, 1], rotate: [0, 8, -8, 0] }, { duration: 350 });
  };

  const generatedCode = `"use client";

import { useAnimate, useMicrointeraction, useMotionAccessibility, Reveal } from "af-motion/react";

export function InteractiveFeature() {
  const { ref: badgeRef, animate: animateBadge } = useAnimate<HTMLDivElement>();
  const { isAccessible, accessibilityScore } = useMotionAccessibility({
    duration: 350,
    properties: { scale: [1, 1.25, 1] },
  });
  const { ref: buttonRef, handlers, isPressed } = useMicrointeraction("button");

  const handleClick = () => {
    if (!isAccessible) return;
    animateBadge({ scale: [1, 1.2, 1] }, { duration: 300 });
  };

  return (
    <div className="container">
      <Reveal direction="down" duration={400}>
        <div ref={badgeRef} className="badge">
          Accessibility Score: {accessibilityScore}/100
        </div>
      </Reveal>

      <button
        ref={buttonRef}
        {...handlers}
        onClick={handleClick}
        style={{ transform: isPressed ? "scale(0.95)" : "scale(1)" }}
      >
        Click with Micro-feedback
      </button>
    </div>
  );
}`;

  return (
    <DocsPlaygroundContainer
      title="React Hooks & Declarative Primitives"
      badge="React 18 / 19 Bindings"
      description="Test useAnimate scoped imperative control, tactile useMicrointeraction springs, and reduced-motion compliance."
      code={generatedCode}
      preview={
        <div className="preview-canvas-box" style={{ height: "230px", flexDirection: "column", gap: "16px" }}>
          <Reveal direction="down" duration={400}>
            <div
              ref={badgeRef}
              style={{
                display: "inline-block",
                padding: "6px 14px",
                borderRadius: "20px",
                background: "rgba(56, 189, 248, 0.15)",
                border: "1px solid rgba(56, 189, 248, 0.4)",
                color: "#38bdf8",
                fontWeight: 700,
                fontSize: "0.85rem",
              }}
              className="react-badge"
            >
              ⚡ Animated Hook Target (Clicks: {clickCount}) • Score: {accessibilityScore}/100
            </div>
          </Reveal>

          <button
            ref={microRef}
            {...microHandlers}
            onClick={handleTriggerAnimate}
            style={{
              padding: "12px 24px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #0284c7 0%, #2563eb 100%)",
              color: "#ffffff",
              border: "none",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: "0.95rem",
              boxShadow: "0 8px 20px rgba(37,99,235,0.35)",
              transform: isPressed ? "scale(0.95)" : "scale(1)",
              transition: isReducedActive ? "none" : "transform 0.15s ease",
            }}
          >
            Trigger useAnimate() & Press
          </button>

          <div style={{ fontSize: "0.75rem", color: "var(--docs-text-muted)" }}>
            Reduced Motion Active:{" "}
            <strong style={{ color: isReducedActive ? "#facc15" : "#4ade80" }}>
              {isReducedActive ? "YES (Animations Suppressed)" : "NO (Full 60fps Motion)"}
            </strong>
          </div>
        </div>
      }
      controls={
        <div className="controls-form">
          <div className="control-row-toggle">
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={simulatedReducedMotion}
                onChange={(e) => setSimulatedReducedMotion(e.target.checked)}
              />
              <span>Simulate prefers-reduced-motion</span>
            </label>
          </div>
          <p style={{ fontSize: "0.8rem", color: "var(--docs-text-muted)", marginTop: "12px" }}>
            When reduced motion is simulated, AF Motion components suppress layout shifts and heavy spring rebounds, providing immediate accessible transitions.
          </p>
        </div>
      }
    />
  );
};
