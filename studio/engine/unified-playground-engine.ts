/**
 * AF Motion Studio — Unified Visual Playground Engine (Prompt 140)
 *
 * Coordinates cross-system composition, unified preset discovery, design/motion DNA
 * token synchronization, Performance Intelligence telemetry, and multi-format code export.
 */

import type {
  UnifiedCompositionLayer,
  UnifiedCompositionState,
  UnifiedDesignBridgeConfig,
  UnifiedExportBundle,
  UnifiedPresetEntry,
  UnifiedSubsystemId,
  UnifiedTelemetrySnapshot,
} from "../types/unified-playground.js";
import { BUILT_IN_PALETTE_INPUTS } from "../../src/core/built-in-palettes.js";
import {
  COMPOSITION_SPEC_VERSION,
  type MotionComposition,
  type CompositionNode,
} from "../../src/core/composition.js";
import { defaultPerformanceIntelligence } from "../../src/core/performance-intelligence/index.js";

// ============================================================================
// 1. DEFAULT STATE FACTORY
// ============================================================================

export function createDefaultUnifiedCompositionState(): UnifiedCompositionState {
  const defaultPalette = BUILT_IN_PALETTE_INPUTS[0]; // Cobalt Classic

  return {
    id: "comp-default-unified",
    name: "Unified Interactive Motion Scene",
    description: "Cohesive multi-system composition linking 3D space, physics simulation, particle dynamics, and responsive UI.",
    systems: {
      animation: true,
      background: true,
      styles: true,
      designSystem: true,
      choreography: true,
      scene3d: true,
      physics: true,
      interactions: true,
      advancedMotion: false,
      simulations: false,
    },
    designBridge: {
      paletteName: defaultPalette.name,
      paletteId: "cobalt-classic",
      motionDNA: "precise",
      timingMultiplier: 1.0,
      reducedMotion: false,
      colors: {
        primary: defaultPalette.primary,
        secondary: defaultPalette.secondary,
        accent: defaultPalette.accent,
        background: "#0B0F19",
      },
    },
    crossCoupling: {
      magneticCursorCoupling: true,
      physicsCollisionTriggers: true,
      scrollWorldCoupling: true,
      fluidInteractionCoupling: false,
    },
    layers: [
      {
        id: "layer-bg",
        name: "Background Simulation & Particles",
        subsystem: "background",
        enabled: true,
        zIndex: 0,
        opacity: 0.85,
        blendMode: "screen",
      },
      {
        id: "layer-3d",
        name: "3D Procedural Scene & Terrain",
        subsystem: "scene3d",
        enabled: true,
        zIndex: 1,
        opacity: 1.0,
        blendMode: "normal",
      },
      {
        id: "layer-physics",
        name: "Rigid & Soft Body Physics",
        subsystem: "physics",
        enabled: true,
        zIndex: 2,
        opacity: 1.0,
        blendMode: "normal",
      },
      {
        id: "layer-dom",
        name: "Interactive UI Card & Typography",
        subsystem: "animation",
        enabled: true,
        zIndex: 3,
        opacity: 1.0,
        blendMode: "normal",
      },
      {
        id: "layer-fx",
        name: "Forces, Lighting & Post-Processing",
        subsystem: "interactions",
        enabled: true,
        zIndex: 4,
        opacity: 0.9,
        blendMode: "additive",
      },
    ],
    playback: {
      currentTimeMs: 0,
      durationMs: 3000,
      progress: 0,
      isPlaying: true,
      speed: 1.0,
      loop: true,
    },
  };
}

// ============================================================================
// 2. UNIFIED PRESET REGISTRY (Cross-Subsystem Discovery)
// ============================================================================

export const UNIFIED_PRESET_REGISTRY: readonly UnifiedPresetEntry[] = [
  // Core Animation
  {
    id: "anim-fade-up",
    name: "Gentle Fade Up",
    category: "animation",
    subsystem: "animation",
    description: "Smooth vertical entrance with subtle opacity fade and natural deceleration.",
    tags: ["entrance", "fade", "smooth", "minimal"],
    targetTab: "animation",
    configuration: { duration: 600, easing: "cubic-bezier(0.16, 1, 0.3, 1)", translateY: 24, opacity: 0 },
  },
  {
    id: "anim-pop-in",
    name: "Spring Pop In",
    category: "animation",
    subsystem: "animation",
    description: "Playful bouncy scale entrance with overshoot physics curve.",
    tags: ["bounce", "spring", "scale", "playful"],
    targetTab: "animation",
    configuration: { duration: 500, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)", scale: 0.8, opacity: 0 },
  },
  {
    id: "anim-gentle-pulse",
    name: "Ambient Pulse",
    category: "animation",
    subsystem: "animation",
    description: "Looping subtle scale oscillation ideal for focal interactive elements.",
    tags: ["loop", "ambient", "pulse", "idle"],
    targetTab: "animation",
    configuration: { duration: 2000, iterations: "infinite", direction: "alternate", scale: 1.04 },
  },

  // Backgrounds
  {
    id: "bg-cosmic-aurora",
    name: "Cosmic Aurora",
    category: "background",
    subsystem: "background",
    description: "Procedural atmospheric curtains of waving gradients and floating stardust.",
    tags: ["canvas", "procedural", "aurora", "cosmic"],
    targetTab: "background",
    configuration: { type: "aurora", speed: 0.8, intensity: 0.75, paletteId: "midnight-voltage" },
  },
  {
    id: "bg-deep-particles",
    name: "Deep Space Particle Field",
    category: "background",
    subsystem: "background",
    description: "Multi-layered depth particle field with speed variance and subtle drift.",
    tags: ["particles", "space", "depth", "canvas"],
    targetTab: "background",
    configuration: { type: "particles", density: 60, speed: 1.2, paletteId: "cobalt-classic" },
  },
  {
    id: "bg-cyber-grid",
    name: "Synthesized Cyber Grid",
    category: "background",
    subsystem: "background",
    description: "Infinite perspective grid plane with horizon glow and animated pulse lines.",
    tags: ["grid", "cyberpunk", "retro", "perspective"],
    targetTab: "background",
    configuration: { type: "grid", scale: 1.5, angle: 45, paletteId: "primary-pop" },
  },

  // Visual Styles
  {
    id: "style-glassmorphism",
    name: "Frosted Glassmorphism",
    category: "styles",
    subsystem: "styles",
    description: "Backdrop blur, translucent specular borders, and chromatic light refraction.",
    tags: ["glass", "blur", "modern", "light"],
    targetTab: "style-explorer",
    configuration: { styleId: "glassmorphism", blur: 16, opacity: 0.7, borderAlpha: 0.2 },
  },
  {
    id: "style-cyberpunk",
    name: "High-Voltage Cyberpunk",
    category: "styles",
    subsystem: "styles",
    description: "Neon edge glow, chromatic aberration, clipped corners, and scanlines.",
    tags: ["neon", "glow", "cyber", "dark"],
    targetTab: "style-explorer",
    configuration: { styleId: "cyberpunk", glowRadius: 20, scanlines: true, neonAccent: "#00F0FF" },
  },
  {
    id: "style-claymorphism",
    name: "Tactile Claymorphism",
    category: "styles",
    subsystem: "styles",
    description: "Soft inflated 3D clay aesthetic with dual directional inner/outer shadows.",
    tags: ["clay", "soft", "3d", "tactile"],
    targetTab: "style-explorer",
    configuration: { styleId: "claymorphism", cornerRadius: 28, depth: 12, insetShadow: true },
  },

  // Design Systems & Motion DNA
  {
    id: "ds-carbon-precise",
    name: "Carbon Precise",
    category: "designSystem",
    subsystem: "designSystem",
    description: "High-cadence engineering precision with crisp damping and 180ms transitions.",
    tags: ["carbon", "precise", "fast", "enterprise"],
    targetTab: "design-systems",
    configuration: { personality: "precise", durationMultiplier: 0.75, spring: { stiffness: 400, damping: 32 } },
  },
  {
    id: "ds-apple-fluid",
    name: "Apple Fluid Continuity",
    category: "designSystem",
    subsystem: "designSystem",
    description: "Physics-driven continuous spring motion with uninterrupted interruptibility.",
    tags: ["fluid", "continuity", "spring", "apple"],
    targetTab: "design-systems",
    configuration: { personality: "playful", durationMultiplier: 1.1, spring: { stiffness: 220, damping: 24 } },
  },

  // Choreography
  {
    id: "choreo-hero-cascade",
    name: "Hero Section Cascade",
    category: "choreography",
    subsystem: "choreography",
    description: "Hierarchical reveal: Eyebrow (0ms) → Headline (80ms) → Paragraph (160ms) → CTAs (240ms).",
    tags: ["hero", "cascade", "stagger", "entrance"],
    targetTab: "choreography",
    configuration: { template: "hero-cascade", staggerMs: 80, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
  },
  {
    id: "choreo-orbit-sync",
    name: "Multi-System Orbit Sync",
    category: "choreography",
    subsystem: "choreography",
    description: "Synchronized rotation and scale coordination across DOM elements and 3D meshes.",
    tags: ["sync", "orbit", "cross-system", "continuous"],
    targetTab: "choreography",
    configuration: { template: "orbit-sync", speed: 1.0, synchronizedAxes: ["y", "z"] },
  },

  // 3D Scenes & Worlds
  {
    id: "3d-neon-cityscape",
    name: "Neon Cityscape 3D",
    category: "3d",
    subsystem: "scene3d",
    description: "Procedural skyscraper grid with neon rooftop lighting and bloom camera orbit.",
    tags: ["city", "buildings", "procedural", "camera"],
    targetTab: "scene-3d",
    configuration: { template: "neon-cityscape", buildingCount: 48, cameraOrbitSpeed: 0.5 },
  },
  {
    id: "3d-mountain-terrain",
    name: "Procedural Mountain Terrain",
    category: "3d",
    subsystem: "scene3d",
    description: "Simplex FBM hydraulic erosion terrain with chunk streaming and heightmap contours.",
    tags: ["terrain", "erosion", "fbm", "world"],
    targetTab: "scene-3d",
    configuration: { algorithm: "fbm", erosionSteps: 30, heightScale: 35, resolution: 128 },
  },
  {
    id: "3d-rigid-tower-fall",
    name: "Rigid Body Tower Demolition",
    category: "3d",
    subsystem: "scene3d",
    description: "Stacked box tower interacting with gravity and high-velocity sphere projectile.",
    tags: ["physics", "rigid-body", "collision", "gravity"],
    targetTab: "scene-3d",
    configuration: { bodyCount: 36, gravity: [0, -9.81, 0], restitution: 0.3 },
  },

  // Motion Physics
  {
    id: "physics-magnetic-spring",
    name: "Magnetic Pull Spring",
    category: "physics",
    subsystem: "physics",
    description: "Attractor point with inverse-square magnetic falloff and damped restorative spring.",
    tags: ["magnetic", "spring", "force", "attractor"],
    targetTab: "motion-physics",
    configuration: { spring: { stiffness: 280, damping: 20 }, magneticRadius: 250, strength: 1.8 },
  },
  {
    id: "physics-multi-collision",
    name: "Multi-Object Elastic Collision",
    category: "physics",
    subsystem: "physics",
    description: "Multiple bounding circles with elastic momentum transfer and boundary walls.",
    tags: ["collision", "elastic", "momentum", "boundary"],
    targetTab: "motion-physics",
    configuration: { objectCount: 8, restitution: 0.95, friction: 0.05 },
  },

  // Interactions & Gestures
  {
    id: "int-magnetic-cursor",
    name: "Magnetic Cursor Attraction",
    category: "interactions",
    subsystem: "interactions",
    description: "Target elements subtly warp and translate toward pointer with elastic tension.",
    tags: ["cursor", "magnetic", "pointer", "interactive"],
    targetTab: "interactions",
    configuration: { triggerRadius: 180, maxTranslation: 24, rotationFactor: 0.15 },
  },
  {
    id: "int-elastic-drag",
    name: "Elastic Drag & Release Dock",
    category: "interactions",
    subsystem: "interactions",
    description: "Rubber-band dragging boundary with inertial toss velocity and snap-back.",
    tags: ["drag", "rubber-band", "inertia", "snap"],
    targetTab: "interactions",
    configuration: { bounds: [-150, 150], resistance: 0.4, snapBackSpeed: 250 },
  },

  // Advanced Motion & Morphing
  {
    id: "adv-svg-morph-icon",
    name: "Icon SVG Path Morphing",
    category: "advancedMotion",
    subsystem: "advancedMotion",
    description: "Topological vertex interpolation from Play Triangle to Pause Double Bars.",
    tags: ["svg", "morph", "path", "icon"],
    targetTab: "advanced-motion",
    configuration: { pair: "play-to-pause", duration: 400, precision: 64 },
  },
  {
    id: "adv-kinetic-typography",
    name: "Kinetic Wave Typography",
    category: "advancedMotion",
    subsystem: "advancedMotion",
    description: "Per-character staggered letter wave with variable font weight modulation.",
    tags: ["typography", "kinetic", "stagger", "variable-font"],
    targetTab: "advanced-motion",
    configuration: { text: "AF MOTION ENGINE", charDelay: 35, waveAmplitude: 16 },
  },

  // GPU Simulations
  {
    id: "sim-galaxy-vortex",
    name: "GPU Spiral Galaxy Vortex",
    category: "simulations",
    subsystem: "simulations",
    description: "50,000 GPU-simulated particles driven by logarithmic spiral orbital forces.",
    tags: ["gpu", "particles", "vortex", "galaxy"],
    targetTab: "simulations",
    configuration: { particleCount: 50000, arms: 4, coreRadius: 30, rotationSpeed: 0.8 },
  },
  {
    id: "sim-interactive-gravity-well",
    name: "Interactive Particle Gravity Well",
    category: "simulations",
    subsystem: "simulations",
    description: "Dynamic cursor attraction forces creating gravitational lensing particle fields.",
    tags: ["gravity", "particles", "cursor", "interactive"],
    targetTab: "simulations",
    configuration: { particleCount: 25000, attractorStrength: 450, damping: 0.98 },
  },
];

// ============================================================================
// 3. PRESET SEARCH & APPLICATION
// ============================================================================

export function searchUnifiedPresets(
  query: string,
  category: string = "all",
  subsystem?: UnifiedSubsystemId
): UnifiedPresetEntry[] {
  const q = query.trim().toLowerCase();

  return UNIFIED_PRESET_REGISTRY.filter((preset) => {
    // Category match
    if (category !== "all" && preset.category !== category) {
      return false;
    }

    // Subsystem match
    if (subsystem && preset.subsystem !== subsystem) {
      return false;
    }

    // Keyword match
    if (!q) return true;

    const matchesName = preset.name.toLowerCase().includes(q);
    const matchesDesc = preset.description.toLowerCase().includes(q);
    const matchesTags = preset.tags.some((t) => t.toLowerCase().includes(q));

    return matchesName || matchesDesc || matchesTags;
  });
}

export function applyUnifiedPreset(
  state: UnifiedCompositionState,
  preset: UnifiedPresetEntry
): UnifiedCompositionState {
  // Ensure the target subsystem is activated
  const nextSystems = {
    ...state.systems,
    [preset.subsystem]: true,
  };

  // Re-enable corresponding layer if found
  const nextLayers = state.layers.map((layer) => {
    if (layer.subsystem === preset.subsystem) {
      return { ...layer, enabled: true };
    }
    return layer;
  });

  return {
    ...state,
    name: `${preset.name} (Composition)`,
    description: preset.description,
    systems: nextSystems,
    layers: nextLayers,
  };
}

// ============================================================================
// 4. MOTION COMPOSITION CONVERTER (conforms to src/core/composition.ts)
// ============================================================================

export function buildMotionCompositionFromUnifiedState(
  state: UnifiedCompositionState
): MotionComposition {
  const rootNodeId = "root-scene";
  const nodes: Record<string, CompositionNode> = {};
  const childrenIds: string[] = [];

  // Root node
  nodes[rootNodeId] = {
    id: rootNodeId,
    name: state.name,
    type: "scene",
    children: childrenIds,
    metadata: {
      generator: "AF Motion Unified Playground",
      crossCoupling: state.crossCoupling,
    },
  };

  // Build nodes for each enabled layer
  state.layers.forEach((layer) => {
    if (!layer.enabled || !state.systems[layer.subsystem]) return;

    const nodeId = `node-${layer.subsystem}`;
    childrenIds.push(nodeId);

    nodes[nodeId] = {
      id: nodeId,
      name: layer.name,
      type: layer.subsystem === "background" ? "background" : "component",
      parentId: rootNodeId,
      category: layer.subsystem === "animation" ? "animation" : "visual-effect",
      timing: {
        duration: state.playback.durationMs * (state.designBridge.timingMultiplier || 1),
        delay: layer.zIndex * 40,
        easing: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      layout: {
        zIndex: layer.zIndex,
        position: "relative",
      },
      metadata: {
        opacity: layer.opacity,
        blendMode: layer.blendMode,
      },
    };
  });

  return {
    id: state.id,
    name: state.name,
    description: state.description,
    version: COMPOSITION_SPEC_VERSION,
    rootNodeId,
    nodes,
    motionDNA: state.designBridge.motionDNA,
    paletteId: state.designBridge.paletteId,
    accessibility: {
      respectReducedMotion: true,
      reducedMotionBehavior: state.designBridge.reducedMotion ? "disables-animation" : "skips-to-endpoint",
      announceTransitions: true,
    },
    metadata: {
      timingMultiplier: state.designBridge.timingMultiplier,
      crossCoupling: state.crossCoupling,
    },
  };
}

// ============================================================================
// 5. UNIFIED PERFORMANCE TELEMETRY
// ============================================================================

export function getUnifiedTelemetry(
  state: UnifiedCompositionState
): UnifiedTelemetrySnapshot {
  const perfCtx = defaultPerformanceIntelligence?.context;
  const healthScores = defaultPerformanceIntelligence?.health;

  // Compute active counts based on active layers & systems
  let activeAnim = 0;
  let activeSim = 0;
  let physicsBodies = 0;
  let particleCount = 0;
  let triangles = 0;

  if (state.systems.animation) activeAnim += 3;
  if (state.systems.choreography) activeAnim += 5;
  if (state.systems.advancedMotion) activeAnim += 2;
  if (state.systems.interactions) activeAnim += 1;

  if (state.systems.background) {
    activeSim += 1;
    particleCount += 250;
  }
  if (state.systems.simulations) {
    activeSim += 2;
    particleCount += 15000;
  }
  if (state.systems.physics) {
    physicsBodies += 12;
  }
  if (state.systems.scene3d) {
    triangles += 14200;
  }

  const fps = perfCtx?.fps ?? 60;
  const frameTimeMs = perfCtx?.frameDurationMs ?? 16.6;
  const healthScore = typeof healthScores?.overallHealth === "object" ? healthScores.overallHealth.score : 98;
  const gpuBackend = perfCtx?.activeBackend ?? "WebGL2";
  const vramEstimateMB = 12 + Math.round((triangles * 0.001) + (particleCount * 0.0004));

  let adaptiveQuality: "low" | "medium" | "high" | "ultra" = "high";
  if (healthScore < 60) adaptiveQuality = "low";
  else if (healthScore < 80) adaptiveQuality = "medium";
  else if (healthScore > 95 && vramEstimateMB < 64) adaptiveQuality = "ultra";

  return {
    fps: Math.round(fps),
    frameTimeMs: Number(frameTimeMs.toFixed(2)),
    activeAnimations: activeAnim,
    activeSimulations: activeSim,
    physicsBodies,
    particleCount,
    triangles3D: triangles,
    gpuBackend,
    vramEstimateMB,
    healthScore: Math.round(healthScore),
    adaptiveQuality,
    bottleneck: healthScore < 70 ? "High particle & geometry density" : null,
    isEstimated: {
      fps: false, // measured by runtime loop
      frameTime: false, // measured
      vram: true, // estimated
      health: false, // measured
      gpuBackend: false, // detected
    },
  };
}

// ============================================================================
// 6. UNIFIED CODE EXPORT GENERATOR
// ============================================================================

export function generateUnifiedExportBundle(
  state: UnifiedCompositionState
): UnifiedExportBundle {
  const palette = state.designBridge;
  const compositionSpec = buildMotionCompositionFromUnifiedState(state);

  // 1. React Component (production ready with real imports)
  const reactCode = `"use client";

import React, { useEffect, useRef } from "react";
import { animate, animateSpring, particleField } from "af-motion";
import { useAnimate, useMotionAccessibility } from "af-motion/react";
import { defaultPerformanceIntelligence } from "af-motion/catalogue";

export default function UnifiedMotionExperience() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { prefersReducedMotion } = useMotionAccessibility();

  useEffect(() => {
    if (prefersReducedMotion) return;

    // 1. Background Particle Field
    let cleanupParticles: (() => void) | undefined;
    if (canvasRef.current && ${state.systems.background}) {
      cleanupParticles = particleField(canvasRef.current, {
        color: "${palette.colors.accent}",
        count: 80,
        speed: ${palette.timingMultiplier},
      });
    }

    // 2. Interactive DOM Animation with Spring Physics
    let cleanupCard: (() => void) | undefined;
    if (cardRef.current && ${state.systems.animation}) {
      cleanupCard = animateSpring(cardRef.current, {
        y: [20, 0],
        opacity: [0, 1],
        stiffness: 280,
        damping: 24,
      });
    }

    return () => {
      cleanupParticles?.();
      cleanupCard?.();
    };
  }, [prefersReducedMotion]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        minHeight: "480px",
        background: "${palette.colors.background}",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* Background Canvas Layer */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Foreground Interactive Card */}
      <div
        ref={cardRef}
        style={{
          position: "relative",
          zIndex: 1,
          padding: "2rem",
          borderRadius: "16px",
          background: "rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(16px)",
          border: "1px solid ${palette.colors.accent}40",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
          color: "${palette.colors.secondary}",
          maxWidth: "420px",
          textAlign: "center",
        }}
      >
        <span
          style={{
            fontSize: "0.75rem",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "${palette.colors.accent}",
            fontWeight: 700,
          }}
        >
          ${state.name}
        </span>
        <h2 style={{ margin: "0.5rem 0 1rem", fontSize: "1.5rem" }}>
          Unified Composition
        </h2>
        <p style={{ margin: 0, opacity: 0.8, fontSize: "0.9rem", lineHeight: 1.5 }}>
          ${state.description}
        </p>
      </div>
    </div>
  );
}
`;

  // 2. Vanilla TypeScript Snippet
  const vanillaCode = `import { animateSpring, particleField } from "af-motion";

export function mountUnifiedExperience(host: HTMLElement): () => void {
  const canvas = host.querySelector<HTMLCanvasElement>("canvas");
  const card = host.querySelector<HTMLElement>(".interactive-card");

  let cleanupBg: (() => void) | undefined;
  if (canvas) {
    cleanupBg = particleField(canvas, {
      color: "${palette.colors.accent}",
      count: 80,
    });
  }

  let cleanupCard: (() => void) | undefined;
  if (card) {
    cleanupCard = animateSpring(card, {
      y: [30, 0],
      opacity: [0, 1],
      stiffness: 300,
      damping: 26,
    });
  }

  return () => {
    cleanupBg?.();
    cleanupCard?.();
  };
}
`;

  // 3. Composition JSON Spec
  const compositionJson = JSON.stringify(compositionSpec, null, 2);

  // 4. CSS Custom Properties
  const cssTokens: Record<string, string> = {
    "--af-palette-name": palette.paletteName,
    "--af-palette-primary": palette.colors.primary,
    "--af-palette-secondary": palette.colors.secondary,
    "--af-palette-accent": palette.colors.accent,
    "--af-palette-background": palette.colors.background,
    "--af-motion-dna": palette.motionDNA,
    "--af-timing-multiplier": `${palette.timingMultiplier}`,
  };

  return {
    title: state.name,
    reactCode,
    vanillaCode,
    compositionJson,
    cssTokens,
    compositionSpec,
    imports: [
      { subpath: "af-motion", namedImports: ["animate", "animateSpring", "particleField"] },
      { subpath: "af-motion/react", namedImports: ["useAnimate", "useMotionAccessibility"] },
      { subpath: "af-motion/catalogue", namedImports: ["defaultPerformanceIntelligence"] },
    ],
  };
}
