import React, { useState, useRef, useEffect, useCallback } from "react";
import { animate } from "../../../src/index.js";
import { DocsPlaygroundContainer } from "./DocsPlaygroundContainer.js";

export const CoreAnimationPlayground: React.FC = () => {
  const [duration, setDuration] = useState(600);
  const [easing, setEasing] = useState("cubic-bezier(0.16, 1, 0.3, 1)");
  const [scale, setScale] = useState(1.2);
  const [translateY, setTranslateY] = useState(-20);
  const [rotate, setRotate] = useState(0);
  const [opacity, setOpacity] = useState(1);
  const [isRunning, setIsRunning] = useState(false);
  const [statusText, setStatusText] = useState("Idle - Ready to animate");

  const boxRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<any>(null);

  const runAnimation = useCallback(() => {
    if (!boxRef.current) return;
    if (controlsRef.current) {
      try {
        controlsRef.current.cancel();
      } catch {
        // Safe fallback
      }
    }

    setIsRunning(true);
    setStatusText("Running animation...");

    try {
      controlsRef.current = animate(
        boxRef.current,
        {
          transform: [
            "scale(1) translateY(0px) rotate(0deg)",
            `scale(${scale}) translateY(${translateY}px) rotate(${rotate}deg)`,
          ],
          opacity: [0.4, opacity],
        },
        {
          duration,
          easing,
          fill: "forwards",
        }
      );

      if (controlsRef.current && controlsRef.current.finished) {
        controlsRef.current.finished
          .then(() => {
            setIsRunning(false);
            setStatusText("Completed");
          })
          .catch(() => {
            setIsRunning(false);
            setStatusText("Cancelled / Idle");
          });
      } else {
        setTimeout(() => {
          setIsRunning(false);
          setStatusText("Completed");
        }, duration);
      }
    } catch {
      setIsRunning(false);
      setStatusText("Fallback completed");
    }
  }, [duration, easing, scale, translateY, rotate, opacity]);

  const resetAnimation = useCallback(() => {
    if (controlsRef.current) {
      try {
        controlsRef.current.cancel();
      } catch {}
    }
    if (boxRef.current) {
      boxRef.current.style.transform = "scale(1) translateY(0px) rotate(0deg)";
      boxRef.current.style.opacity = "1";
    }
    setIsRunning(false);
    setStatusText("Reset to initial state");
  }, []);

  useEffect(() => {
    return () => {
      if (controlsRef.current) {
        try {
          controlsRef.current.cancel();
        } catch {}
      }
    };
  }, []);

  const generatedCode = `import { animate } from "af-motion";

const element = document.querySelector(".target-box") as HTMLElement;

const controls = animate(
  element,
  {
    transform: [
      "scale(1) translateY(0px) rotate(0deg)",
      "scale(${scale}) translateY(${translateY}px) rotate(${rotate}deg)"
    ],
    opacity: [0.4, ${opacity}],
  },
  {
    duration: ${duration},
    easing: "${easing}",
    fill: "forwards",
  }
);

// Await completion or orchestrate controls:
await controls.finished;`;

  return (
    <DocsPlaygroundContainer
      title="Core Animation & WAAPI Playground"
      badge="animate() Interactive Explorer"
      description="Adjust duration, easing curves, scale, and transforms to inspect hardware-accelerated Web Animations API execution."
      statusText={statusText}
      isRunning={isRunning}
      onRun={runAnimation}
      onReset={resetAnimation}
      code={generatedCode}
      preview={
        <div className="preview-canvas-box">
          <div
            ref={boxRef}
            className="interactive-target-card"
            data-testid="interactive-animation-target"
            style={{
              width: "120px",
              height: "120px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 10px 25px -5px rgba(56, 189, 248, 0.4)",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "0.9rem",
              userSelect: "none",
              willChange: "transform, opacity",
            }}
          >
            <span>⚡ AF Motion</span>
            <small style={{ fontSize: "0.7rem", opacity: 0.85 }}>GPU Target</small>
          </div>
        </div>
      }
      controls={
        <div className="controls-form">
          <div className="control-row">
            <label htmlFor="duration-slider">Duration: {duration}ms</label>
            <input
              id="duration-slider"
              type="range"
              min="100"
              max="2000"
              step="50"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            />
          </div>

          <div className="control-row">
            <label htmlFor="easing-select">Easing Curve</label>
            <select
              id="easing-select"
              value={easing}
              onChange={(e) => setEasing(e.target.value)}
              className="docs-select-input"
            >
              <option value="cubic-bezier(0.16, 1, 0.3, 1)">easeOutExpo (0.16, 1, 0.3, 1)</option>
              <option value="cubic-bezier(0.65, 0, 0.35, 1)">easeInOutCubic (0.65, 0, 0.35, 1)</option>
              <option value="cubic-bezier(0.34, 1.56, 0.64, 1)">easeOutBack (Overshoot)</option>
              <option value="linear">linear (0, 0, 1, 1)</option>
              <option value="ease-out">ease-out</option>
              <option value="ease-in-out">ease-in-out</option>
            </select>
          </div>

          <div className="control-row">
            <label htmlFor="scale-slider">Scale: {scale}x</label>
            <input
              id="scale-slider"
              type="range"
              min="0.5"
              max="1.6"
              step="0.05"
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
            />
          </div>

          <div className="control-row">
            <label htmlFor="translate-slider">Translate Y: {translateY}px</label>
            <input
              id="translate-slider"
              type="range"
              min="-60"
              max="60"
              step="5"
              value={translateY}
              onChange={(e) => setTranslateY(Number(e.target.value))}
            />
          </div>

          <div className="control-row">
            <label htmlFor="rotate-slider">Rotate: {rotate}deg</label>
            <input
              id="rotate-slider"
              type="range"
              min="-180"
              max="180"
              step="15"
              value={rotate}
              onChange={(e) => setRotate(Number(e.target.value))}
            />
          </div>
        </div>
      }
    />
  );
};
