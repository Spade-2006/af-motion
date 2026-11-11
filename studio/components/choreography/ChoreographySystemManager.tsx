import React from "react";
import type { MultiSystemActiveSettings } from "../../types/choreography.js";

interface ChoreographySystemManagerProps {
  systems: MultiSystemActiveSettings;
  onToggleSystem: (systemKey: keyof MultiSystemActiveSettings) => void;
  onResetSystems: () => void;
}

const SYSTEMS_METADATA: Array<{
  key: keyof MultiSystemActiveSettings;
  name: string;
  icon: string;
  desc: string;
}> = [
  {
    key: "dom",
    name: "Core DOM Animations",
    icon: "📦",
    desc: "Transforms, opacity, and layout offsets driven by the high-performance DOM engine.",
  },
  {
    key: "pageTransitions",
    name: "Page & Route Transitions",
    icon: "🚪",
    desc: "Cross-route entrance/exit transitions with coordinated overlays and depth.",
  },
  {
    key: "scrollMotion",
    name: "Scroll-Driven Motion",
    icon: "📜",
    desc: "Progressive timeline playback linked to scroll position and velocity.",
  },
  {
    key: "microinteractions",
    name: "Interactive Microinteractions",
    icon: "👆",
    desc: "Tactile hover, press, and spring feedback for buttons and cards.",
  },
  {
    key: "graphicsEffects",
    name: "Canvas Graphics & Shaders",
    icon: "🎨",
    desc: "Procedural textures, particle fields, auroras, and fluid shader meshes.",
  },
  {
    key: "scene3d",
    name: "3D Scene Geometry & Camera",
    icon: "🧊",
    desc: "Three.js mesh rotations, camera drift, and lighting synchronization.",
  },
  {
    key: "ambientMotion",
    name: "Continuous Ambient Motion",
    icon: "✨",
    desc: "Gentle non-distracting background floats and breathing cycles.",
  },
];

export const ChoreographySystemManager: React.FC<ChoreographySystemManagerProps> = ({
  systems,
  onToggleSystem,
  onResetSystems,
}) => {
  const activeCount = Object.values(systems).filter(Boolean).length;

  return (
    <div className="ch-system-manager-panel">
      <div className="ch-section-header">
        <h3 className="ch-section-title">🌐 Multi-System Composition</h3>
        <span className="ch-count-badge">{activeCount}/7 Systems Active</span>
      </div>

      <p className="ch-section-subtitle">
        Activate and synchronize AF Motion&apos;s 7 underlying runtime systems into one cohesive choreography script.
      </p>

      <div className="ch-systems-grid">
        {SYSTEMS_METADATA.map((meta) => {
          const isActive = systems[meta.key];
          return (
            <div
              key={meta.key}
              className={`ch-system-card ${isActive ? "active" : ""}`}
            >
              <div className="ch-system-card-top">
                <span className="ch-system-icon">{meta.icon}</span>
                <span className="ch-system-name">{meta.name}</span>
                <label className="ch-toggle-switch">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={() => onToggleSystem(meta.key)}
                  />
                  <span className="ch-slider" />
                </label>
              </div>
              <p className="ch-system-desc">{meta.desc}</p>
            </div>
          );
        })}
      </div>

      <div className="ch-sync-bridge-info">
        <h4 className="ch-bridge-title">🔗 Deterministic Cross-System Bridge</h4>
        <p className="ch-bridge-desc">
          When multiple systems are active, AF Motion coordinates them via a shared
          normalized progress bridge (0.0 to 1.0). Canvas requestAnimationFrame loops,
          DOM matrix transforms, and WebGL renders are aligned to eliminate visual jank.
        </p>
      </div>
    </div>
  );
};
