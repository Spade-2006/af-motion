import React, { useEffect, useRef, useState } from "react";
import type {
  PreviewTargetKind,
  StudioAnimationConfig,
  StudioBackgroundConfig,
  ViewportPreset,
} from "../types/index.js";
import { interpolateAnimationStyles } from "../engine/animation-engine.js";
import { computeCSSBackground, renderCanvasBackground } from "../engine/background-engine.js";

interface PreviewStageProps {
  animationConfig: StudioAnimationConfig;
  backgroundConfig: StudioBackgroundConfig;
  progress: number;
  viewport: ViewportPreset;
  timeMs: number;
}

export const PreviewStage: React.FC<PreviewStageProps> = ({
  animationConfig,
  backgroundConfig,
  progress,
  viewport,
  timeMs,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [showBackground, setShowBackground] = useState(true);
  const [showTarget, setShowTarget] = useState(true);
  const [showGridGuides, setShowGridGuides] = useState(false);

  // Render canvas if background requires it
  useEffect(() => {
    if (!canvasRef.current || !showBackground) return;
    if (backgroundConfig.type === "particles" || backgroundConfig.type === "noise") {
      renderCanvasBackground(canvasRef.current, backgroundConfig, timeMs);
    }
  }, [backgroundConfig, timeMs, showBackground]);

  const animatedStyles = interpolateAnimationStyles(animationConfig, progress);
  const cssBackground = computeCSSBackground(backgroundConfig);

  const renderTargetElement = (kind: PreviewTargetKind) => {
    const commonStyles: React.CSSProperties = {
      transform: animatedStyles.transform,
      opacity: animatedStyles.opacity,
      filter: animatedStyles.filter,
      borderRadius: animatedStyles.borderRadius,
      backgroundColor: animatedStyles.backgroundColor || "rgba(255, 255, 255, 0.12)",
      boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.4)",
      backdropFilter: "blur(16px)",
      border: "1px solid rgba(255, 255, 255, 0.15)",
    };

    switch (kind) {
      case "button":
        return (
          <button
            type="button"
            className="preview-target-btn"
            style={commonStyles}
          >
            <span>🚀 Explore AF Motion</span>
          </button>
        );

      case "badge":
        return (
          <div className="preview-target-badge" style={commonStyles}>
            <span className="badge-dot" />
            <span>Interactive GPU Motion</span>
          </div>
        );

      case "icon":
        return (
          <div className="preview-target-icon" style={commonStyles}>
            <span style={{ fontSize: "2.5rem" }}>⚡</span>
          </div>
        );

      case "text":
        return (
          <h2
            className="preview-target-text"
            style={{
              transform: animatedStyles.transform,
              opacity: animatedStyles.opacity,
              filter: animatedStyles.filter,
              color: "#FFFFFF",
              fontSize: "2.2rem",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              textAlign: "center",
              textShadow: "0 2px 20px rgba(0, 0, 0, 0.5)",
            }}
          >
            Physics-Driven Motion
          </h2>
        );

      case "card":
      default:
        return (
          <div className="preview-target-card" style={commonStyles}>
            <div className="card-header">
              <span className="card-badge">AF Motion</span>
              <span className="card-dot" />
            </div>
            <h3 className="card-title">Interactive Element</h3>
            <p className="card-body">
              Target element animated via AF Motion GPU transforms.
            </p>
            <div className="card-footer">
              <span className="card-tag">{animationConfig.preset ?? "Custom"}</span>
              <span className="card-meta">{animationConfig.duration}ms</span>
            </div>
          </div>
        );
    }
  };

  const getViewportDimensions = () => {
    switch (viewport) {
      case "mobile":
        return { width: "375px", height: "600px" };
      case "tablet":
        return { width: "768px", height: "520px" };
      case "desktop":
      default:
        return { width: "100%", height: "520px" };
    }
  };

  const dims = getViewportDimensions();

  return (
    <div className="stage-wrapper">
      {/* Stage Toolbar */}
      <div className="stage-toolbar">
        <span className="stage-label">
          Viewport: {viewport.toUpperCase()} ({dims.width})
        </span>

        <div className="stage-layer-toggles">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={showBackground}
              onChange={(e) => setShowBackground(e.target.checked)}
            />
            <span>Background</span>
          </label>
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={showTarget}
              onChange={(e) => setShowTarget(e.target.checked)}
            />
            <span>Target</span>
          </label>
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={showGridGuides}
              onChange={(e) => setShowGridGuides(e.target.checked)}
            />
            <span>Guides</span>
          </label>
        </div>
      </div>

      {/* Stage Container */}
      <div className="stage-outer-frame">
        <div
          className={`stage-viewport ${showGridGuides ? "with-guides" : ""}`}
          style={{
            width: dims.width,
            height: dims.height,
            background: showBackground ? cssBackground : "#12141a",
          }}
        >
          {/* Canvas layer for procedural textures */}
          {showBackground &&
            (backgroundConfig.type === "particles" || backgroundConfig.type === "noise") && (
              <canvas
                ref={canvasRef}
                width={800}
                height={600}
                className="stage-canvas-layer"
              />
            )}

          {/* Foreground animated target */}
          {showTarget && (
            <div className="stage-foreground-center">
              {renderTargetElement(animationConfig.target)}
            </div>
          )}

          {/* Readout tag */}
          <div className="stage-readout-pill">
            <span>t: {Math.round(progress * 100)}%</span>
            <span>•</span>
            <span>{animationConfig.target}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
