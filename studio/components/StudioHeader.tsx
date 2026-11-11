import React from "react";
import type { StudioTab, ViewportPreset } from "../types/index.js";

interface StudioHeaderProps {
  activeTab: StudioTab;
  onTabChange: (tab: StudioTab) => void;
  viewport: ViewportPreset;
  onViewportChange: (vp: ViewportPreset) => void;
  reducedMotion: boolean;
  onToggleReducedMotion: () => void;
  onExportClick: () => void;
}

export const StudioHeader: React.FC<StudioHeaderProps> = ({
  activeTab,
  onTabChange,
  viewport,
  onViewportChange,
  reducedMotion,
  onToggleReducedMotion,
  onExportClick,
}) => {
  return (
    <header className="studio-header">
      <div className="studio-brand">
        <span className="studio-logo">✨ AF Motion Studio</span>
        <span className="studio-version">v0.1.0</span>
      </div>

      <nav className="studio-tabs" aria-label="Studio Navigation">
        <button
          type="button"
          className={`studio-tab-btn ${activeTab === "animation" ? "active" : ""}`}
          onClick={() => onTabChange("animation")}
        >
          🎬 Animation
        </button>
        <button
          type="button"
          className={`studio-tab-btn ${activeTab === "background" ? "active" : ""}`}
          onClick={() => onTabChange("background")}
        >
          🎨 Background
        </button>
        <button
          type="button"
          className={`studio-tab-btn ${activeTab === "dual" ? "active" : ""}`}
          onClick={() => onTabChange("dual")}
        >
          🎛️ Combined Studio
        </button>
        <button
          type="button"
          className={`studio-tab-btn ${activeTab === "export" ? "active" : ""}`}
          onClick={() => onTabChange("export")}
        >
          📦 Code & Export
        </button>
        <button
          type="button"
          className={`studio-tab-btn future-tab ${activeTab === "style-explorer" ? "active" : ""}`}
          onClick={() => onTabChange("style-explorer")}
          title="Visual Style Explorer (Prompt 94)"
        >
          🎭 Styles
        </button>
        <button
          type="button"
          className={`studio-tab-btn ${activeTab === "design-systems" ? "active" : ""}`}
          onClick={() => onTabChange("design-systems")}
          title="Design System & Motion DNA Editor (Prompt 95)"
        >
          📐 Design Systems & DNA
        </button>
        <button
          type="button"
          className={`studio-tab-btn ${activeTab === "choreography" ? "active" : ""}`}
          onClick={() => onTabChange("choreography")}
          title="Choreography & Multi-System Builder (Prompt 96)"
        >
          🎬 Choreography
        </button>
        <button
          type="button"
          className={`studio-tab-btn ${activeTab === "scene-3d" ? "active" : ""}`}
          onClick={() => onTabChange("scene-3d")}
          title="3D Scene Studio (Prompt 97)"
        >
          🧊 3D Scene
        </button>
        <button
          type="button"
          className={`studio-tab-btn ${activeTab === "motion-physics" ? "active" : ""}`}
          onClick={() => onTabChange("motion-physics")}
          title="Motion Physics Studio (Prompt 135)"
        >
          ⚛️ Physics
        </button>
        <button
          type="button"
          className={`studio-tab-btn ${activeTab === "interactions" ? "active" : ""}`}
          onClick={() => onTabChange("interactions")}
          title="Interaction & Gesture Playground (Prompt 136)"
        >
          👆 Interactions
        </button>
        <button
          type="button"
          className={`studio-tab-btn ${activeTab === "advanced-motion" ? "active" : ""}`}
          onClick={() => onTabChange("advanced-motion")}
          title="Advanced Motion & Morphing Studio (Prompt 137)"
        >
          🚀 Advanced Motion
        </button>
        <button
          type="button"
          className={`studio-tab-btn ${activeTab === "simulations" ? "active" : ""}`}
          onClick={() => onTabChange("simulations")}
          title="GPU Particles & Simulation Studio (Prompt 138)"
        >
          ✨ Simulations
        </button>
        <button
          type="button"
          className={`studio-tab-btn ${activeTab === "unified" ? "active" : ""}`}
          onClick={() => onTabChange("unified")}
          title="Unified Visual Playground & Feature Integration (Prompt 140)"
        >
          🌐 Unified Playground
        </button>
      </nav>

      <div className="studio-header-actions">
        {/* Viewport Presets */}
        <div className="viewport-toggle-group" role="group" aria-label="Viewport Size">
          <button
            type="button"
            className={`btn-icon ${viewport === "desktop" ? "active" : ""}`}
            onClick={() => onViewportChange("desktop")}
            title="Desktop (100%)"
          >
            🖥️
          </button>
          <button
            type="button"
            className={`btn-icon ${viewport === "tablet" ? "active" : ""}`}
            onClick={() => onViewportChange("tablet")}
            title="Tablet (768px)"
          >
            📱
          </button>
          <button
            type="button"
            className={`btn-icon ${viewport === "mobile" ? "active" : ""}`}
            onClick={() => onViewportChange("mobile")}
            title="Mobile (375px)"
          >
            📲
          </button>
        </div>

        {/* Reduced Motion Toggle */}
        <button
          type="button"
          className={`btn-reduced-motion ${reducedMotion ? "active" : ""}`}
          onClick={onToggleReducedMotion}
          title={reducedMotion ? "Reduced motion active" : "Enable reduced motion preview"}
        >
          {reducedMotion ? "⚡ Reduced Motion: ON" : "🏃 Motion: Normal"}
        </button>

        {/* Export CTA */}
        <button
          type="button"
          className="btn-export-primary"
          onClick={onExportClick}
        >
          Export Code
        </button>
      </div>
    </header>
  );
};
