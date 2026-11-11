import React from "react";
import type { FutureModuleMetadata } from "../types/index.js";

export const FUTURE_STUDIO_MODULES: FutureModuleMetadata[] = [
  {
    id: "style-explorer",
    name: "Visual Style Explorer",
    prompt: "Prompt 94",
    description: "Browse, compare, and customize the 19 visual design styles with real-time palette swapping.",
    status: "coming-soon",
  },
  {
    id: "design-systems",
    name: "Design System & Motion DNA",
    prompt: "Prompt 95",
    description: "Inspect Motion DNA profiles, token mapping, and timing multipliers across design systems.",
    status: "coming-soon",
  },
  {
    id: "choreography",
    name: "Choreography & Multi-System Builder",
    prompt: "Prompt 96",
    description: "Compose multi-element entrance sequences and synchronize DOM, Canvas, and 3D scenes.",
    status: "coming-soon",
  },
  {
    id: "scene-3d",
    name: "3D Scene & Geometry Studio",
    prompt: "Prompt 97",
    description: "3D camera orbit controls, procedural geometries, PBR materials, and lighting presets.",
    status: "coming-soon",
  },
];

interface FutureModulePlaceholderProps {
  moduleId: string;
}

export const FutureModulePlaceholder: React.FC<FutureModulePlaceholderProps> = ({
  moduleId,
}) => {
  const mod =
    FUTURE_STUDIO_MODULES.find((m) => m.id === moduleId) ??
    FUTURE_STUDIO_MODULES[0];

  return (
    <div className="future-module-placeholder">
      <div className="placeholder-card">
        <span className="module-prompt-pill">{mod.prompt} Foundation</span>
        <h2 className="module-title">{mod.name}</h2>
        <p className="module-desc">{mod.description}</p>
        <div className="module-status-badge">
          <span className="status-dot pulse" />
          <span>Architecture Slot Ready • Scheduled in {mod.prompt}</span>
        </div>
      </div>
    </div>
  );
};
