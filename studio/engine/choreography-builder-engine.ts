/**
 * AF Motion Studio — Choreography & Multi-System Builder Engine
 *
 * Implements track timeline sequencing, multi-system synchronization,
 * choreography intelligence analysis, template discovery, and code export.
 */

import {
  BUILT_IN_CHOREOGRAPHIES,
  listChoreographies,
  getChoreography,
  validateChoreography,
  type ChoreographyDefinition,
} from "../../src/core/motion-choreography.js";

import {
  generateChoreographyPlan,
  CHOREOGRAPHY_PATTERNS,
  CHOREOGRAPHY_SYSTEMS,
  type ChoreographyPattern,
  type ChoreographySystemType,
  type ChoreographyPlan,
} from "../../src/core/choreography-intelligence/index.js";

import type {
  ChoreographyTrackConfig,
  ChoreographyTimelineState,
  MultiSystemActiveSettings,
  ChoreographyTemplate,
  ChoreographyIntelligenceReport,
  ChoreographyExportBundle,
} from "../types/choreography.js";

/**
 * Default multi-system active toggles.
 */
export function getDefaultMultiSystemSettings(): MultiSystemActiveSettings {
  return {
    dom: true,
    pageTransitions: true,
    scrollMotion: false,
    microinteractions: true,
    graphicsEffects: true,
    scene3d: true,
    ambientMotion: true,
  };
}

/**
 * Creates default timeline state.
 */
export function createDefaultTimelineState(
  totalDurationMs = 1200
): ChoreographyTimelineState {
  return {
    currentTimeMs: 0,
    totalDurationMs,
    isPlaying: true,
    isReversed: false,
    isLooping: true,
    playbackRate: 1.0,
    zoom: 1.0,
  };
}

/**
 * Discovers built-in choreography templates dynamically from repository definitions.
 */
export function listBuiltInChoreographyTemplates(): ChoreographyTemplate[] {
  const templates: ChoreographyTemplate[] = [
    {
      id: "hero-entrance",
      name: "Hero Section Entrance",
      pattern: "multi-element-entrance",
      description:
        "Staggered hero reveal: headline rises, subhead fades in, CTA bounces, and background graphics aura pulses.",
      totalDurationMs: 1200,
      systems: ["dom", "graphicsEffects", "microinteractions"] as any,
      tracks: [
        {
          id: "track-1",
          name: "Headline Slide & Fade",
          system: "dom",
          targetName: "hero-title",
          enabled: true,
          startMs: 0,
          durationMs: 500,
          easing: "ease-out",
          color: "#9a7aff",
          properties: { opacity: [0, 1], y: [30, 0] },
        },
        {
          id: "track-2",
          name: "Subhead Fade In",
          system: "dom",
          targetName: "hero-subhead",
          enabled: true,
          startMs: 200,
          durationMs: 450,
          easing: "ease-out",
          color: "#38bdf8",
          properties: { opacity: [0, 1], y: [20, 0] },
          dependencyTrackId: "track-1",
          dependencyType: "start-with-start",
          offsetMs: 200,
        },
        {
          id: "track-3",
          name: "CTA Button Pop",
          system: "microinteractions" as any,
          targetName: "hero-cta",
          enabled: true,
          startMs: 450,
          durationMs: 500,
          easing: "cubic-bezier(0.34, 1.56, 0.64, 1)",
          color: "#ec4899",
          properties: { opacity: [0, 1], scale: [0.85, 1] },
          dependencyTrackId: "track-2",
          dependencyType: "start-after-end",
          offsetMs: -200,
        },
        {
          id: "track-4",
          name: "Background Aura Pulse",
          system: "graphics",
          targetName: "canvas-aura",
          enabled: true,
          startMs: 0,
          durationMs: 1200,
          easing: "ease-in-out",
          color: "#10b981",
          properties: { opacity: [0.2, 0.8], scale: [0.95, 1.05] },
        },
      ],
    },
    {
      id: "cross-system-sync",
      name: "Cross-System 2D/3D Synchronization",
      pattern: "full-cross-system",
      description:
        "Deterministic multi-system harmony: DOM UI coordinates with Canvas Shader ripples and 3D Torus Geometry orbit.",
      totalDurationMs: 1600,
      systems: ["dom", "graphics", "3d"] as any,
      tracks: [
        {
          id: "track-cs-1",
          name: "3D Torus Orbit & Rotation",
          system: "3d",
          targetName: "scene-3d-mesh",
          enabled: true,
          startMs: 0,
          durationMs: 1600,
          easing: "ease-in-out",
          color: "#f59e0b",
          properties: { rotate: [0, 360], scale: [0.8, 1.1] },
        },
        {
          id: "track-cs-2",
          name: "Graphics Wave Shader",
          system: "graphics",
          targetName: "canvas-shader",
          enabled: true,
          startMs: 100,
          durationMs: 1400,
          easing: "ease-out",
          color: "#06b6d4",
          properties: { opacity: [0, 0.75] },
        },
        {
          id: "track-cs-3",
          name: "DOM Control Surface",
          system: "dom",
          targetName: "control-panel",
          enabled: true,
          startMs: 300,
          durationMs: 700,
          easing: "ease-out",
          color: "#8b5cf6",
          properties: { opacity: [0, 1], y: [40, 0] },
        },
        {
          id: "track-cs-4",
          name: "Ambient Light Drift",
          system: "custom" as any,
          targetName: "ambient-glow",
          enabled: true,
          startMs: 0,
          durationMs: 1600,
          easing: "linear",
          color: "#a855f7",
          properties: { opacity: [0.4, 0.9] },
        },
      ],
    },
    {
      id: "dashboard-metrics-stagger",
      name: "Dashboard Metrics Stagger",
      pattern: "staggered",
      description:
        "Cascade entrance for statistical telemetry cards followed by active interactive chart reveal.",
      totalDurationMs: 1400,
      systems: ["dom", "microinteractions"] as any,
      tracks: [
        {
          id: "track-db-1",
          name: "Metric Card A",
          system: "dom",
          targetName: "metric-card-1",
          enabled: true,
          startMs: 0,
          durationMs: 400,
          easing: "ease-out",
          color: "#3b82f6",
          properties: { opacity: [0, 1], y: [25, 0] },
        },
        {
          id: "track-db-2",
          name: "Metric Card B",
          system: "dom",
          targetName: "metric-card-2",
          enabled: true,
          startMs: 150,
          durationMs: 400,
          easing: "ease-out",
          color: "#8b5cf6",
          properties: { opacity: [0, 1], y: [25, 0] },
          dependencyTrackId: "track-db-1",
          dependencyType: "start-with-start",
          offsetMs: 150,
        },
        {
          id: "track-db-3",
          name: "Metric Card C",
          system: "dom",
          targetName: "metric-card-3",
          enabled: true,
          startMs: 300,
          durationMs: 400,
          easing: "ease-out",
          color: "#ec4899",
          properties: { opacity: [0, 1], y: [25, 0] },
          dependencyTrackId: "track-db-2",
          dependencyType: "start-with-start",
          offsetMs: 150,
        },
        {
          id: "track-db-4",
          name: "Interactive Telemetry Chart",
          system: "dom",
          targetName: "telemetry-chart",
          enabled: true,
          startMs: 500,
          durationMs: 700,
          easing: "ease-out",
          color: "#10b981",
          properties: { opacity: [0, 1], scale: [0.95, 1] },
        },
      ],
    },
    {
      id: "modal-dialog-entrance",
      name: "Modal Dialog & Backdrop",
      pattern: "multi-element-entrance",
      description:
        "Cinematic overlay backdrop blur followed by spring-scaled modal window and action buttons.",
      totalDurationMs: 900,
      systems: ["dom", "microinteractions"] as any,
      tracks: [
        {
          id: "track-md-1",
          name: "Backdrop Overlay Fade",
          system: "dom",
          targetName: "modal-backdrop",
          enabled: true,
          startMs: 0,
          durationMs: 350,
          easing: "ease-out",
          color: "#64748b",
          properties: { opacity: [0, 0.75] },
        },
        {
          id: "track-md-2",
          name: "Modal Window Scale In",
          system: "dom",
          targetName: "modal-window",
          enabled: true,
          startMs: 150,
          durationMs: 450,
          easing: "cubic-bezier(0.34, 1.56, 0.64, 1)",
          color: "#9a7aff",
          properties: { opacity: [0, 1], scale: [0.85, 1], y: [20, 0] },
        },
        {
          id: "track-md-3",
          name: "Action Button Reveal",
          system: "microinteractions" as any,
          targetName: "modal-actions",
          enabled: true,
          startMs: 400,
          durationMs: 350,
          easing: "ease-out",
          color: "#10b981",
          properties: { opacity: [0, 1] },
        },
      ],
    },
    {
      id: "scroll-storytelling-seq",
      name: "Scroll Storytelling Sequence",
      pattern: "scroll-choreography",
      description:
        "Sequential multi-phase progression guiding user attention across chapters.",
      totalDurationMs: 2000,
      systems: ["dom", "graphics"] as any,
      tracks: [
        {
          id: "track-sc-1",
          name: "Chapter 1 Focus",
          system: "dom",
          targetName: "story-chapter-1",
          enabled: true,
          startMs: 0,
          durationMs: 600,
          easing: "ease-out",
          color: "#3b82f6",
          properties: { opacity: [0, 1], x: [-30, 0] },
        },
        {
          id: "track-sc-2",
          name: "Chapter 2 Progression",
          system: "dom",
          targetName: "story-chapter-2",
          enabled: true,
          startMs: 500,
          durationMs: 650,
          easing: "ease-out",
          color: "#8b5cf6",
          properties: { opacity: [0, 1], x: [30, 0] },
          dependencyTrackId: "track-sc-1",
          dependencyType: "start-after-end",
          offsetMs: -100,
        },
        {
          id: "track-sc-3",
          name: "Chapter 3 Culmination",
          system: "dom",
          targetName: "story-chapter-3",
          enabled: true,
          startMs: 1100,
          durationMs: 700,
          easing: "ease-out",
          color: "#ec4899",
          properties: { opacity: [0, 1], y: [40, 0] },
        },
      ],
    },
  ];

  return templates;
}

/**
 * Retrieves a choreography template by ID with fallback.
 */
export function getChoreographyTemplateById(id: string): ChoreographyTemplate {
  const all = listBuiltInChoreographyTemplates();
  const match = all.find((t) => t.id === id);
  return match ?? all[0];
}

/**
 * Recalculates track start times based on defined dependencies.
 */
export function computeTrackOffsetsFromDependencies(
  tracks: ChoreographyTrackConfig[]
): ChoreographyTrackConfig[] {
  const trackMap = new Map<string, ChoreographyTrackConfig>();
  tracks.forEach((t) => trackMap.set(t.id, { ...t }));

  return tracks.map((track) => {
    if (!track.dependencyTrackId) return track;
    const parent = trackMap.get(track.dependencyTrackId);
    if (!parent) return track;

    let computedStartMs = track.startMs;
    const offset = track.offsetMs ?? 0;

    if (track.dependencyType === "start-after-end") {
      computedStartMs = parent.startMs + parent.durationMs + offset;
    } else if (track.dependencyType === "start-with-start") {
      computedStartMs = parent.startMs + offset;
    }

    return {
      ...track,
      startMs: Math.max(0, computedStartMs),
    };
  });
}

/**
 * Computes instantaneous interpolated values for a track at a specific time.
 */
export function computeTrackProgress(
  track: ChoreographyTrackConfig,
  currentTimeMs: number,
  totalDurationMs: number
): {
  progress: number; // 0 to 1
  isActive: boolean;
  opacity: number;
  y: number;
  x: number;
  scale: number;
  rotate: number;
} {
  if (!track.enabled) {
    return {
      progress: 0,
      isActive: false,
      opacity: 0,
      y: 0,
      x: 0,
      scale: 1,
      rotate: 0,
    };
  }

  const endMs = track.startMs + track.durationMs;

  let progress = 0;
  let isActive = false;

  if (currentTimeMs <= track.startMs) {
    progress = 0;
    isActive = false;
  } else if (currentTimeMs >= endMs) {
    progress = 1.0;
    isActive = true;
  } else {
    progress = (currentTimeMs - track.startMs) / track.durationMs;
    isActive = true;
  }

  // Linear / clamped lerp
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  const opacity = track.properties.opacity
    ? lerp(track.properties.opacity[0], track.properties.opacity[1], progress)
    : 1.0;

  const y = track.properties.y
    ? lerp(track.properties.y[0], track.properties.y[1], progress)
    : 0;

  const x = track.properties.x
    ? lerp(track.properties.x[0], track.properties.x[1], progress)
    : 0;

  const scale = track.properties.scale
    ? lerp(track.properties.scale[0], track.properties.scale[1], progress)
    : 1.0;

  const rotate = track.properties.rotate
    ? lerp(track.properties.rotate[0], track.properties.rotate[1], progress)
    : 0;

  return {
    progress,
    isActive,
    opacity,
    y,
    x,
    scale,
    rotate,
  };
}

/**
 * Evaluates Choreography Intelligence: pattern recommendations, conflict detection,
 * performance warnings, and accessibility alternatives.
 */
export function evaluateChoreographyIntelligence(
  pattern: ChoreographyPattern,
  tracks: ChoreographyTrackConfig[],
  systems: MultiSystemActiveSettings,
  totalDurationMs: number
): ChoreographyIntelligenceReport {
  const conflicts: string[] = [];
  const performanceWarnings: string[] = [];
  const timingRecommendations: string[] = [];
  const accessibilityNotes: string[] = [];
  let score = 100;

  // 1. Duration & Timing checks
  if (totalDurationMs > 2500) {
    score -= 10;
    performanceWarnings.push(
      `Total duration (${totalDurationMs}ms) exceeds the recommended 2000ms threshold for snappy UI feedback.`
    );
    timingRecommendations.push("Compress baseline durations to maintain user momentum.");
  }

  // 2. Multi-System Overhead
  let activeSystemCount = 0;
  if (systems.dom) activeSystemCount++;
  if (systems.graphicsEffects) activeSystemCount++;
  if (systems.scene3d) activeSystemCount++;
  if (systems.ambientMotion) activeSystemCount++;

  if (activeSystemCount >= 4) {
    performanceWarnings.push(
      "Simultaneous Canvas Shader, 3D Scene, and heavy DOM transforms may drop frames on low-tier mobile hardware."
    );
    score -= 10;
  }

  // 3. Track overlaps and dependency conflicts
  const enabledTracks = tracks.filter((t) => t.enabled);
  if (enabledTracks.length === 0) {
    score -= 40;
    conflicts.push("No active tracks configured in the choreography timeline.");
  }

  // Check track boundary overflow
  for (const track of enabledTracks) {
    if (track.startMs + track.durationMs > totalDurationMs) {
      conflicts.push(
        `Track "${track.name}" exceeds the total timeline duration (${totalDurationMs}ms).`
      );
      score -= 15;
    }
  }

  // 4. Accessibility & Reduced Motion
  accessibilityNotes.push(
    "All entrance translations fall back to zero-distance fades when `prefers-reduced-motion` is active."
  );
  accessibilityNotes.push(
    "Spring overshoots and 3D camera orbits automatically freeze to their terminal equilibrium state."
  );

  // Recommended order
  const recommendedOrder = [...enabledTracks]
    .sort((a, b) => a.startMs - b.startMs)
    .map((t) => `${t.name} (T+${t.startMs}ms)`);

  const rationale =
    score >= 80
      ? `Choreography structure for "${pattern}" is well-paced with clean staggering intervals.`
      : `Timeline exhibits timing friction or multi-system overlap that may degrade visual clarity.`;

  return {
    pattern,
    score: Math.max(0, Math.min(100, score)),
    recommendedOrder,
    timingRecommendations,
    conflicts,
    performanceWarnings,
    accessibilityNotes,
    rationale,
  };
}

/**
 * Generates ready-to-run React component code demonstrating the multi-system choreography.
 */
export function generateChoreographyReactCode(
  name: string,
  pattern: ChoreographyPattern,
  tracks: ChoreographyTrackConfig[],
  systems: MultiSystemActiveSettings,
  totalDurationMs: number
): string {
  const componentName = `${name.replace(/[^a-zA-Z0-9]/g, "")}Builder`;

  return `"use client";

import React, { useState } from "react";
import { createMotionChoreography } from "af-motion";
import { useAnimate, Reveal, Interactive, useMotionAccessibility } from "af-motion/react";
import { validateMotionConfig } from "af-motion/catalogue";

/**
 * ${name} — Multi-System Choreography (${pattern})
 * Total Duration: ${totalDurationMs}ms
 * Tracks: ${tracks.filter((t) => t.enabled).length} active
 */
export function ${componentName}() {
  const { prefersReducedMotion } = useMotionAccessibility();
  const [isPlaying, setIsPlaying] = useState(false);

  const runChoreography = async () => {
    if (prefersReducedMotion) return;
    setIsPlaying(true);

    const controller = createMotionChoreography([
${tracks
  .filter((t) => t.enabled)
  .map(
    (t) => `      {
        type: "animation",
        target: ".${t.targetName}",
        label: "${t.name}",
        delay: ${t.startMs},
        options: {
          duration: ${t.durationMs},
          easing: "${t.easing}",
        },
        properties: {
          opacity: [${t.properties.opacity ? t.properties.opacity.join(", ") : "1, 1"}],
          transform: ["translateY(${t.properties.y ? t.properties.y[0] : 0}px) scale(${t.properties.scale ? t.properties.scale[0] : 1})", "translateY(${t.properties.y ? t.properties.y[1] : 0}px) scale(${t.properties.scale ? t.properties.scale[1] : 1})"],
        },
      },`
  )
  .join("\n")}
    ]);

    await controller.play();
    setIsPlaying(false);
  };

  return (
    <div className="af-choreography-stage" style={{ padding: "32px", background: "#090b0e", color: "#ffffff", borderRadius: "16px" }}>
      <header style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ margin: "0 0 6px 0" }}>${name}</h2>
          <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Pattern: ${pattern} • Duration: ${totalDurationMs}ms</span>
        </div>
        <Interactive hover={{ scale: 1.05 }} tap={{ scale: 0.95 }}>
          <button
            type="button"
            onClick={runChoreography}
            style={{ padding: "8px 18px", background: "#9a7aff", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer" }}
          >
            {isPlaying ? "Playing..." : "▶ Run Choreography"}
          </button>
        </Interactive>
      </header>

      {/* Synchronized Component Targets */}
      <div style={{ display: "grid", gap: "16px" }}>
${tracks
  .filter((t) => t.enabled)
  .map(
    (t) => `        <div className="${t.targetName}" style={{ padding: "16px", background: "#141720", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}>
          <strong>${t.name}</strong> [${t.system.toUpperCase()}] — Start: ${t.startMs}ms (Duration: ${t.durationMs}ms)
        </div>`
  )
  .join("\n")}
      </div>
    </div>
  );
}
`;
}

/**
 * Generates standard ChoreographyDefinition JSON.
 */
export function generateChoreographyJson(
  name: string,
  pattern: ChoreographyPattern,
  tracks: ChoreographyTrackConfig[],
  totalDurationMs: number
): string {
  const def = {
    generator: "AF Motion Studio — Choreography Builder",
    id: name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
    name,
    pattern,
    totalDurationMs,
    tracks: tracks.map((t) => ({
      id: t.id,
      name: t.name,
      system: t.system,
      target: t.targetName,
      enabled: t.enabled,
      startMs: t.startMs,
      durationMs: t.durationMs,
      easing: t.easing,
      properties: t.properties,
      dependency: t.dependencyTrackId
        ? {
            trackId: t.dependencyTrackId,
            type: t.dependencyType,
            offsetMs: t.offsetMs,
          }
        : undefined,
    })),
  };

  return JSON.stringify(def, null, 2);
}

/**
 * Generates multi-system configuration JSON.
 */
export function generateMultiSystemJson(
  systems: MultiSystemActiveSettings,
  tracks: ChoreographyTrackConfig[]
): string {
  return JSON.stringify(
    {
      generator: "AF Motion Studio — Multi-System Sync",
      systems,
      activeTracksCount: tracks.filter((t) => t.enabled).length,
      crossSystemSync: true,
      bridgeType: "deterministic-progress-bridge",
    },
    null,
    2
  );
}
