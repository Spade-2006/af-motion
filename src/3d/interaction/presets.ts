/**
 * AF Motion 3D Interactive Environment Presets
 *
 * Composable environment setups for product showcases, portfolios,
 * spatial storytelling, and narrative displays.
 */

import type {
  InteractionEnvironmentPreset,
  InteractionPresetName,
} from "./types.js";

export const INTERACTION_PRESETS: Record<
  InteractionPresetName,
  InteractionEnvironmentPreset
> = {
  "product-showcase": {
    name: "product-showcase",
    description: "Product inspection with auto-rotation, constrained orbit, and part highlighting.",
    cameraControls: {
      mode: "combined",
      enableOrbit: true,
      enablePan: false,
      enableZoom: true,
      autoRotate: true,
      autoRotateSpeed: 1.5,
      minPolarAngle: Math.PI * 0.15,
      maxPolarAngle: Math.PI * 0.48, // Prevent going under ground plane
      minDistance: 2.0,
      maxDistance: 12.0,
      dampingFactor: 0.08,
    },
    interactionOptions: {
      enableHighlight: true,
      highlightColor: "#3b82f6",
      dragThreshold: 4,
    },
  },

  "portfolio": {
    name: "portfolio",
    description: "Multi-stand portfolio showcase with horizontal navigation and focal framing.",
    cameraControls: {
      mode: "combined",
      enableOrbit: true,
      enablePan: true,
      enableZoom: true,
      minDistance: 3.0,
      maxDistance: 25.0,
      dampingFactor: 0.06,
    },
    interactionOptions: {
      enableHighlight: true,
      highlightColor: "#10b981",
      dragThreshold: 5,
    },
  },

  "immersive-landing": {
    name: "immersive-landing",
    description: "Hero landing scene with gentle pointer parallax and smooth depth response.",
    cameraControls: {
      mode: "combined",
      enableOrbit: true,
      enablePan: false,
      enableZoom: false,
      rotateSpeed: 0.4,
      minPolarAngle: Math.PI * 0.35,
      maxPolarAngle: Math.PI * 0.55,
      minAzimuthAngle: -Math.PI * 0.25,
      maxAzimuthAngle: Math.PI * 0.25,
      dampingFactor: 0.04,
    },
    interactionOptions: {
      enableHighlight: false,
      dragThreshold: 8,
    },
  },

  "spatial-story": {
    name: "spatial-story",
    description: "Spatial journey through 3D waypoints with cinematic camera framing.",
    cameraControls: {
      mode: "combined",
      enableOrbit: true,
      enablePan: true,
      enableZoom: true,
      minDistance: 1.0,
      maxDistance: 40.0,
      dampingFactor: 0.05,
    },
    interactionOptions: {
      enableHighlight: true,
      highlightColor: "#8b5cf6",
      dragThreshold: 6,
    },
  },

  "object-display": {
    name: "object-display",
    description: "Classic turntable display for 3D statues, models, and artifacts.",
    cameraControls: {
      mode: "orbit",
      enableOrbit: true,
      enablePan: false,
      enableZoom: true,
      minPolarAngle: Math.PI * 0.2,
      maxPolarAngle: Math.PI * 0.5,
      minDistance: 1.5,
      maxDistance: 10.0,
      dampingFactor: 0.09,
    },
    interactionOptions: {
      enableHighlight: true,
      highlightColor: "#f59e0b",
      dragThreshold: 3,
    },
  },

  "scroll-narrative": {
    name: "scroll-narrative",
    description: "Narrative scene orchestrated with scroll-linked camera stages.",
    cameraControls: {
      mode: "combined",
      enableOrbit: true,
      enablePan: false,
      enableZoom: false,
      dampingFactor: 0.05,
    },
    interactionOptions: {
      enableHighlight: true,
      highlightColor: "#ec4899",
      dragThreshold: 5,
    },
  },
};

export function getInteractionPreset(
  name: InteractionPresetName
): InteractionEnvironmentPreset {
  return INTERACTION_PRESETS[name] ?? INTERACTION_PRESETS["product-showcase"];
}
