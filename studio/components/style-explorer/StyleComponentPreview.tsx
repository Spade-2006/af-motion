import React, { useState } from "react";
import type {
  StyleCustomizationValues,
  StylePreviewComponentKind,
} from "../../types/style-explorer.js";
import { computeComponentStyle, getVisualStyleById } from "../../engine/style-explorer-engine.js";

interface StyleComponentPreviewProps {
  styleId: string;
  customization?: StyleCustomizationValues;
  reducedMotion: boolean;
}

export const StyleComponentPreview: React.FC<StyleComponentPreviewProps> = ({
  styleId,
  customization,
  reducedMotion,
}) => {
  const [componentKind, setComponentKind] = useState<StylePreviewComponentKind>("card");
  const [bgMode, setBgMode] = useState<"dark" | "light" | "checker">("dark");
  const [sampleText, setSampleText] = useState("");

  const def = getVisualStyleById(styleId);
  const computed = computeComponentStyle(styleId, componentKind, customization);

  const componentKinds: { id: StylePreviewComponentKind; label: string }[] = [
    { id: "card", label: "Card" },
    { id: "button", label: "Button" },
    { id: "input", label: "Input" },
    { id: "panel", label: "Panel" },
    { id: "badge", label: "Badge" },
    { id: "typography", label: "Typography" },
  ];

  const getStageBg = () => {
    switch (bgMode) {
      case "light":
        return "#f1f3f7";
      case "checker":
        return "radial-gradient(#ffffff18 1px, transparent 1px), #141721";
      case "dark":
      default:
        return "#0c0e14";
    }
  };

  const renderComponent = () => {
    const textToDisplay = sampleText.trim() || def.name;

    switch (componentKind) {
      case "button":
        return (
          <button
            type="button"
            className="style-preview-btn"
            style={{
              background: computed.background,
              color: computed.color,
              border: computed.border,
              borderRadius: computed.borderRadius,
              boxShadow: computed.boxShadow,
              textShadow: computed.textShadow,
              fontFamily: computed.fontFamily,
              fontSize: computed.fontSize,
              padding: computed.padding,
              backdropFilter: computed.backdropFilter,
              cursor: "pointer",
              transition: reducedMotion ? "none" : computed.transition,
            }}
          >
            <span>{textToDisplay} Action</span>
          </button>
        );

      case "input":
        return (
          <div className="style-preview-input-wrap">
            <input
              type="text"
              readOnly
              value={textToDisplay}
              className="style-preview-input"
              style={{
                background: computed.background,
                color: computed.color,
                border: computed.border,
                borderRadius: computed.borderRadius,
                boxShadow: computed.boxShadow,
                fontFamily: computed.fontFamily,
                fontSize: computed.fontSize,
                padding: computed.padding,
                width: "280px",
              }}
            />
          </div>
        );

      case "badge":
        return (
          <div
            className="style-preview-badge"
            style={{
              background: computed.background,
              color: computed.color,
              border: computed.border,
              borderRadius: computed.borderRadius,
              boxShadow: computed.boxShadow,
              fontFamily: computed.fontFamily,
              fontSize: computed.fontSize,
              padding: computed.padding,
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>✨ {def.name} Style</span>
          </div>
        );

      case "panel":
        return (
          <div
            className="style-preview-panel-box"
            style={{
              background: computed.background,
              color: computed.color,
              border: computed.border,
              borderRadius: computed.borderRadius,
              boxShadow: computed.boxShadow,
              fontFamily: computed.fontFamily,
              padding: computed.padding,
              width: "360px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
              <span style={{ fontWeight: 700, fontSize: "0.85rem", opacity: 0.9 }}>
                {def.name} Panel
              </span>
              <span style={{ fontSize: "0.75rem", opacity: 0.6 }}>{def.category}</span>
            </div>
            <p style={{ margin: "0 0 12px 0", fontSize: "0.85rem", lineHeight: 1.5, opacity: 0.85 }}>
              {def.philosophy}
            </p>
            <div style={{ fontSize: "0.75rem", opacity: 0.7 }}>
              Shape: {def.shapeLanguage.cornerRadius} radius • {def.shapeLanguage.borderStyle} border
            </div>
          </div>
        );

      case "typography":
        return (
          <div
            className="style-preview-typo-box"
            style={{
              color: computed.color,
              fontFamily: computed.fontFamily,
              maxWidth: "460px",
              textAlign: "center",
            }}
          >
            <h1
              style={{
                fontSize: computed.fontSize,
                margin: "0 0 10px 0",
                textShadow: computed.textShadow,
              }}
            >
              {textToDisplay}
            </h1>
            <p style={{ fontSize: "1rem", lineHeight: 1.6, opacity: 0.85, fontFamily: def.typography.bodyFont }}>
              Visual style typography rendered using {def.typography.headingFont} heading scale.
            </p>
          </div>
        );

      case "card":
      default:
        return (
          <div
            className="style-preview-card"
            style={{
              background: computed.background,
              color: computed.color,
              border: computed.border,
              borderRadius: computed.borderRadius,
              boxShadow: computed.boxShadow,
              textShadow: computed.textShadow,
              fontFamily: computed.fontFamily,
              padding: computed.padding,
              width: "320px",
              backdropFilter: computed.backdropFilter,
              transition: reducedMotion ? "none" : computed.transition,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "14px" }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.04em" }}>
                {def.name}
              </span>
              <span style={{ fontSize: "0.7rem", opacity: 0.7, padding: "2px 6px", borderRadius: "4px", background: "rgba(255,255,255,0.08)" }}>
                {def.category}
              </span>
            </div>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "1.2rem", fontWeight: 700 }}>
              {textToDisplay}
            </h3>
            <p style={{ margin: "0 0 18px 0", fontSize: "0.85rem", opacity: 0.8, lineHeight: 1.5 }}>
              {def.description}
            </p>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", opacity: 0.7 }}>
              <span>Font: {def.typography.headingFont.split(",")[0]}</span>
              <span>Radius: {computed.borderRadius}</span>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="style-preview-container">
      {/* Component Toolbar */}
      <div className="style-preview-toolbar">
        <div className="preview-component-pills">
          {componentKinds.map((k) => (
            <button
              key={k.id}
              type="button"
              className={`component-pill ${componentKind === k.id ? "active" : ""}`}
              onClick={() => setComponentKind(k.id)}
            >
              {k.label}
            </button>
          ))}
        </div>

        <div className="preview-theme-toggles">
          <button
            type="button"
            className={`btn-theme-pill ${bgMode === "dark" ? "active" : ""}`}
            onClick={() => setBgMode("dark")}
            title="Dark Stage Background"
          >
            🌙 Dark
          </button>
          <button
            type="button"
            className={`btn-theme-pill ${bgMode === "light" ? "active" : ""}`}
            onClick={() => setBgMode("light")}
            title="Light Stage Background"
          >
            ☀️ Light
          </button>
          <button
            type="button"
            className={`btn-theme-pill ${bgMode === "checker" ? "active" : ""}`}
            onClick={() => setBgMode("checker")}
            title="Grid Pattern"
          >
            🏁 Grid
          </button>
        </div>
      </div>

      {/* Live Interactive Stage */}
      <div
        className="style-live-stage"
        style={{
          background: getStageBg(),
        }}
      >
        <div className="style-rendered-component-wrap">
          {renderComponent()}
        </div>

        <div className="style-stage-meta-pill">
          <span>{def.name}</span>
          <span>•</span>
          <span>{componentKind}</span>
          {reducedMotion && <span>• ⚡ Reduced Motion</span>}
        </div>
      </div>
    </div>
  );
};
