import React, { useState } from "react";
import type {
  CustomDesignSystemTokens,
  CustomMotionDNAValues,
} from "../../types/design-systems.js";
import type { ViewportPreset } from "../../types/index.js";

interface DesignSystemLivePreviewProps {
  systemName: string;
  tokens: CustomDesignSystemTokens;
  dnaValues: CustomMotionDNAValues;
  reducedMotion: boolean;
}

export const DesignSystemLivePreview: React.FC<DesignSystemLivePreviewProps> = ({
  systemName,
  tokens,
  dnaValues,
  reducedMotion,
}) => {
  const [viewport, setViewport] = useState<ViewportPreset>("desktop");
  const [bgMode, setBgMode] = useState<"dark" | "light" | "grid">("dark");
  const [entranceKey, setEntranceKey] = useState<number>(0);

  const c = tokens.colors;
  const t = tokens.typography;
  const s = tokens.spacing;
  const i = tokens.interaction;

  const isReduced = reducedMotion || (dnaValues.respectReducedMotion && reducedMotion);

  // Motion physics
  const hoverScale = isReduced ? 1.0 : i.hoverScale;
  const pressScale = isReduced ? 1.0 : i.pressScale;
  const duration = isReduced ? 0 : dnaValues.duration;

  const containerWidth =
    viewport === "mobile" ? "375px" : viewport === "tablet" ? "680px" : "100%";

  return (
    <div className="ds-live-preview-container">
      {/* Top Preview Toolbar */}
      <div className="ds-preview-toolbar">
        <div className="ds-preview-toolbar-left">
          <span className="ds-toolbar-title">Live Preview</span>
          <span className="ds-preview-badge">
            {systemName} • {dnaValues.personality}
          </span>
        </div>

        <div className="ds-preview-toolbar-right">
          {/* Replay Entrance */}
          <button
            type="button"
            className="ds-toolbar-action-btn"
            onClick={() => setEntranceKey((prev) => prev + 1)}
            title="Replay entrance animation"
          >
            🔄 Replay Entrance
          </button>

          {/* Viewport Presets */}
          <div className="ds-viewport-btn-group" role="group" aria-label="Viewport">
            <button
              type="button"
              className={`ds-view-btn ${viewport === "desktop" ? "active" : ""}`}
              onClick={() => setViewport("desktop")}
              title="Desktop"
            >
              🖥️
            </button>
            <button
              type="button"
              className={`ds-view-btn ${viewport === "tablet" ? "active" : ""}`}
              onClick={() => setViewport("tablet")}
              title="Tablet"
            >
              📱
            </button>
            <button
              type="button"
              className={`ds-view-btn ${viewport === "mobile" ? "active" : ""}`}
              onClick={() => setViewport("mobile")}
              title="Mobile"
            >
              📲
            </button>
          </div>

          {/* Background Theme */}
          <div className="ds-bg-btn-group" role="group" aria-label="Background Theme">
            <button
              type="button"
              className={`ds-bg-btn ${bgMode === "dark" ? "active" : ""}`}
              onClick={() => setBgMode("dark")}
            >
              Dark
            </button>
            <button
              type="button"
              className={`ds-bg-btn ${bgMode === "light" ? "active" : ""}`}
              onClick={() => setBgMode("light")}
            >
              Light
            </button>
            <button
              type="button"
              className={`ds-bg-btn ${bgMode === "grid" ? "active" : ""}`}
              onClick={() => setBgMode("grid")}
            >
              Grid
            </button>
          </div>
        </div>
      </div>

      {/* Stage Canvas */}
      <div className={`ds-preview-stage-area bg-${bgMode}`}>
        <div
          key={entranceKey}
          className="ds-preview-canvas"
          style={{
            maxWidth: containerWidth,
            fontFamily: t.fontFamilySans,
            fontSize: `${t.fontSizeBase}px`,
            lineHeight: t.lineHeightNormal,
            letterSpacing: t.letterSpacingNormal,
            backgroundColor: c.background ?? "#090b0e",
            color: c.text ?? "#f8fafc",
            borderRadius: `${s.borderRadius * 2}px`,
            border: `1px solid ${c.border ?? "rgba(255,255,255,0.12)"}`,
            padding: `${s.componentPadding * 1.5}px`,
            transition: isReduced ? "none" : `all ${duration}ms ${dnaValues.entranceEasing}`,
          }}
        >
          {/* Navigation Bar */}
          <nav
            className="ds-preview-nav"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingBottom: `${s.gap}px`,
              borderBottom: `1px solid ${c.border ?? "rgba(255,255,255,0.1)"}`,
              marginBottom: `${s.gap * 1.5}px`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "14px",
                  height: "14px",
                  borderRadius: "50%",
                  background: c.primary ?? "#3b82f6",
                }}
              />
              <span style={{ fontWeight: 700, fontSize: "1.1rem" }}>{systemName}</span>
            </div>

            <div style={{ display: "flex", gap: `${s.gap}px`, fontSize: "0.85rem" }}>
              <span style={{ color: c.text, cursor: "pointer", fontWeight: 600 }}>
                Overview
              </span>
              <span style={{ color: c.muted, cursor: "pointer" }}>Components</span>
              <span style={{ color: c.muted, cursor: "pointer" }}>Tokens</span>
            </div>
          </nav>

          {/* Typography Hierarchy */}
          <section style={{ marginBottom: `${s.gap * 2}px` }}>
            <h1
              style={{
                fontFamily: t.fontFamilySerif,
                fontSize: "1.85rem",
                fontWeight: 700,
                color: c.text,
                margin: "0 0 8px 0",
              }}
            >
              Unified System Typography
            </h1>
            <p
              style={{
                color: c.muted ?? "#94a3b8",
                fontSize: "0.95rem",
                margin: 0,
                maxWidth: "600px",
              }}
            >
              Harmonizing responsive typography scales, proportional layout units,
              and {dnaValues.personality} Motion DNA dynamics into production-ready UI components.
            </p>
          </section>

          {/* Buttons Row */}
          <section
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: `${s.gap}px`,
              alignItems: "center",
              marginBottom: `${s.gap * 2}px`,
            }}
          >
            <button
              type="button"
              className="ds-interactive-btn"
              style={{
                background: c.primary ?? "#3b82f6",
                color: "#ffffff",
                border: "none",
                borderRadius: `${s.borderRadius}px`,
                padding: `${s.baseUnit}px ${s.baseUnit * 2.5}px`,
                fontWeight: 600,
                cursor: "pointer",
                transition: isReduced ? "none" : `transform ${i.transitionDuration}ms ${dnaValues.interactionEasing}`,
              }}
              onMouseEnter={(e) => {
                if (!isReduced) e.currentTarget.style.transform = `scale(${hoverScale})`;
              }}
              onMouseLeave={(e) => {
                if (!isReduced) e.currentTarget.style.transform = "scale(1)";
              }}
              onMouseDown={(e) => {
                if (!isReduced) e.currentTarget.style.transform = `scale(${pressScale})`;
              }}
              onMouseUp={(e) => {
                if (!isReduced) e.currentTarget.style.transform = `scale(${hoverScale})`;
              }}
            >
              Primary Action
            </button>

            <button
              type="button"
              className="ds-interactive-btn"
              style={{
                background: c.secondary ?? "#8b5cf6",
                color: "#ffffff",
                border: "none",
                borderRadius: `${s.borderRadius}px`,
                padding: `${s.baseUnit}px ${s.baseUnit * 2.5}px`,
                fontWeight: 600,
                cursor: "pointer",
                transition: isReduced ? "none" : `transform ${i.transitionDuration}ms ${dnaValues.interactionEasing}`,
              }}
              onMouseEnter={(e) => {
                if (!isReduced) e.currentTarget.style.transform = `scale(${hoverScale})`;
              }}
              onMouseLeave={(e) => {
                if (!isReduced) e.currentTarget.style.transform = "scale(1)";
              }}
              onMouseDown={(e) => {
                if (!isReduced) e.currentTarget.style.transform = `scale(${pressScale})`;
              }}
              onMouseUp={(e) => {
                if (!isReduced) e.currentTarget.style.transform = `scale(${hoverScale})`;
              }}
            >
              Secondary Action
            </button>

            <button
              type="button"
              className="ds-interactive-btn"
              style={{
                background: "transparent",
                color: c.text ?? "#ffffff",
                border: `1px solid ${c.border ?? "rgba(255,255,255,0.2)"}`,
                borderRadius: `${s.borderRadius}px`,
                padding: `${s.baseUnit}px ${s.baseUnit * 2.5}px`,
                fontWeight: 600,
                cursor: "pointer",
                transition: isReduced ? "none" : `transform ${i.transitionDuration}ms ${dnaValues.interactionEasing}`,
              }}
              onMouseEnter={(e) => {
                if (!isReduced) e.currentTarget.style.transform = `scale(${hoverScale})`;
              }}
              onMouseLeave={(e) => {
                if (!isReduced) e.currentTarget.style.transform = "scale(1)";
              }}
              onMouseDown={(e) => {
                if (!isReduced) e.currentTarget.style.transform = `scale(${pressScale})`;
              }}
              onMouseUp={(e) => {
                if (!isReduced) e.currentTarget.style.transform = `scale(${hoverScale})`;
              }}
            >
              Outline Button
            </button>
          </section>

          {/* Elevated Surface Card & Form Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: viewport === "mobile" ? "1fr" : "1fr 1fr",
              gap: `${s.gap * 1.5}px`,
              marginBottom: `${s.gap * 2}px`,
            }}
          >
            {/* Surface Card */}
            <div
              style={{
                backgroundColor: c.surface ?? "#141720",
                border: `1px solid ${c.border ?? "rgba(255,255,255,0.12)"}`,
                borderRadius: `${s.borderRadius}px`,
                padding: `${s.componentPadding}px`,
                boxShadow: `0 ${i.elevationDistance}px 24px -4px rgba(0,0,0,0.35)`,
              }}
            >
              <h3
                style={{
                  margin: "0 0 8px 0",
                  fontSize: "1.1rem",
                  color: c.accent ?? "#ec4899",
                }}
              >
                Elevated Surface Card
              </h3>
              <p
                style={{
                  color: c.muted ?? "#94a3b8",
                  fontSize: "0.88rem",
                  margin: "0 0 12px 0",
                  lineHeight: 1.5,
                }}
              >
                Depth elevation distance ({i.elevationDistance}px) paired with custom
                accent hues.
              </p>
              <div
                style={{
                  fontFamily: t.fontFamilyMono,
                  fontSize: "0.75rem",
                  color: c.accent ?? "#ec4899",
                  background: "rgba(255,255,255,0.04)",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  display: "inline-block",
                }}
              >
                radius: {s.borderRadius}px • base: {s.baseUnit}px
              </div>
            </div>

            {/* Form Controls */}
            <div
              style={{
                backgroundColor: c.surface ?? "#141720",
                border: `1px solid ${c.border ?? "rgba(255,255,255,0.12)"}`,
                borderRadius: `${s.borderRadius}px`,
                padding: `${s.componentPadding}px`,
              }}
            >
              <h3 style={{ margin: "0 0 12px 0", fontSize: "1.1rem", color: c.text }}>
                Interactive Form Field
              </h3>
              <div style={{ marginBottom: "12px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.8rem",
                    color: c.muted,
                    marginBottom: "4px",
                  }}
                >
                  Text Field with Focus Ring
                </label>
                <input
                  type="text"
                  placeholder="Type to test focus ring..."
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "8px 12px",
                    background: c.background ?? "#090b0e",
                    color: c.text ?? "#ffffff",
                    border: `1px solid ${c.border ?? "rgba(255,255,255,0.2)"}`,
                    borderRadius: `${s.borderRadius}px`,
                    outline: "none",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.boxShadow = `0 0 0 ${i.focusRingWidth}px ${c.primary ?? "#3b82f6"}`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>

              {/* Status Badges */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    padding: "2px 8px",
                    borderRadius: "12px",
                    background: "rgba(16, 185, 129, 0.15)",
                    color: c.success ?? "#10b981",
                  }}
                >
                  ● Active
                </span>
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    padding: "2px 8px",
                    borderRadius: "12px",
                    background: "rgba(245, 158, 11, 0.15)",
                    color: c.warning ?? "#f59e0b",
                  }}
                >
                  ▲ Warning
                </span>
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    padding: "2px 8px",
                    borderRadius: "12px",
                    background: "rgba(239, 68, 68, 0.15)",
                    color: c.error ?? "#ef4444",
                  }}
                >
                  ✕ Error
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
