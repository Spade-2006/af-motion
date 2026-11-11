/**
 * AF Motion Studio — Advanced Motion & Morphing Engine (Prompt 137)
 *
 * Provides factory states, path interpolation and validation, motion path sampling,
 * kinetic typography segmentation, view transition fallback detection, preset management,
 * Performance Intelligence telemetry, and multi-format code generation.
 */

import { defaultPerformanceIntelligence } from "../../src/core/performance-intelligence/index.js";
import type {
  AdvancedMotionStudioState,
  AdvancedMotionPreset,
  AdvancedMotionDiagnosticsData,
} from "../types/advanced-motion.js";

export function createDefaultAdvancedMotionStudioState(): AdvancedMotionStudioState {
  const isViewTransitionNative =
    typeof document !== "undefined" && typeof (document as any).startViewTransition === "function";

  return {
    viewMode: "layout",
    layout: {
      staggerMs: 40,
      staggerDirection: "forward",
      duration: 500,
      easing: "cubic-bezier(0.2, 0, 0, 1)",
      layoutMode: "grid",
      layoutItems: [
        { id: "item-1", label: "Alpha Module", width: 140, height: 90, order: 1, color: "rgba(59, 130, 246, 0.2)" },
        { id: "item-2", label: "Beta Node", width: 140, height: 90, order: 2, color: "rgba(16, 185, 129, 0.2)" },
        { id: "item-3", label: "Gamma Kernel", width: 140, height: 90, order: 3, color: "rgba(168, 85, 247, 0.2)" },
        { id: "item-4", label: "Delta Relay", width: 140, height: 90, order: 4, color: "rgba(245, 158, 11, 0.2)" },
        { id: "item-5", label: "Epsilon Core", width: 140, height: 90, order: 5, color: "rgba(236, 72, 153, 0.2)" },
        { id: "item-6", label: "Zeta Buffer", width: 140, height: 90, order: 6, color: "rgba(20, 184, 166, 0.2)" },
      ],
      flipData: {
        dx: 0,
        dy: 0,
        dw: 1,
        dh: 1,
        transform: "translate(0px, 0px) scale(1, 1)",
      },
    },
    svgMorph: {
      sourcePath: "M 50 10 C 72 10 90 28 90 50 C 90 72 72 90 50 90 C 28 90 10 72 10 50 C 10 28 28 10 50 10 Z",
      targetPath: "M 10 10 L 90 10 L 90 90 L 10 90 Z",
      progress: 0.5,
      duration: 800,
      easing: "easeInOutCubic",
      loop: true,
      normalizeWinding: true,
      isValidSource: true,
      isValidTarget: true,
      validationError: null,
    },
    motionPath: {
      pathType: "bezier",
      pathString: "M 40 160 C 140 20, 260 260, 460 120",
      points: [
        { x: 40, y: 160, cx2: 140, cy2: 20 },
        { x: 460, y: 120, cx1: 260, cy1: 260 },
      ],
      progress: 0.35,
      duration: 1200,
      autoRotate: true,
      loop: true,
      reverse: false,
      traversalMode: "constant-distance",
      pathLength: 485.4,
      currentCoord: { x: 198, y: 124 },
      tangent: { x: 0.85, y: -0.52 },
      normal: { x: 0.52, y: 0.85 },
      curvature: 0.012,
    },
    typography: {
      text: "Dynamic Kinetic Typography in AF Motion",
      segmentation: "word",
      preset: "slide",
      duration: 650,
      delay: 0,
      staggerMs: 50,
      easing: "cubic-bezier(0.16, 1, 0.3, 1)",
      direction: "left-to-right",
      followMotionPath: false,
    },
    sharedElement: {
      activeView: "list",
      sharedId: "hero-card-1",
      sourceBounds: { x: 40, y: 40, width: 140, height: 110 },
      targetBounds: { x: 20, y: 20, width: 340, height: 220 },
      borderRadius: 12,
      crossfade: true,
      duration: 550,
    },
    viewTransition: {
      isNativeSupported: isViewTransitionNative,
      transitionPreset: "crossfade",
      duration: 400,
      currentView: "view-a",
      isSimulated: !isViewTransitionNative,
      lastEvent: "Ready",
    },
    composition: {
      id: "comp-master-journey",
      name: "Master Advanced Motion Journey",
      duration: 3200,
      progress: 0.3,
      isPlaying: false,
      isReversed: false,
      speed: 1,
      steps: [
        { id: "step-1", name: "Text Reveal", system: "typography", startOffset: "0", duration: 800, status: "completed" },
        { id: "step-2", name: "Layout FLIP Grid", system: "layout", startOffset: "+=200", duration: 600, status: "running" },
        { id: "step-3", name: "SVG Shape Morph", system: "svg-morph", startOffset: "<", duration: 800, status: "idle" },
        { id: "step-4", name: "Motion Path Orbit", system: "motion-path", startOffset: "+=100", duration: 1200, status: "idle" },
      ],
    },
    showExportModal: false,
  };
}

export function validateSvgPath(pathStr: string): { isValid: boolean; error?: string } {
  if (!pathStr || pathStr.trim().length === 0) {
    return { isValid: false, error: "SVG path data cannot be empty." };
  }
  const clean = pathStr.trim();
  if (!/^[mM]/.test(clean)) {
    return { isValid: false, error: "SVG path must begin with a moveto command ('M' or 'm')." };
  }
  if (!/^[mMzZlLhHvVcCsSqQtTaA0-9\s,\.\-]+$/.test(clean)) {
    return { isValid: false, error: "SVG path contains invalid command characters." };
  }
  return { isValid: true };
}

export function sampleBezierCurve(
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
  t: number
): { x: number; y: number; angle: number } {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;

  const x = uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x;
  const y = uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y;

  const dx = 3 * uu * (p1.x - p0.x) + 6 * u * t * (p2.x - p1.x) + 3 * tt * (p3.x - p2.x);
  const dy = 3 * uu * (p1.y - p0.y) + 6 * u * t * (p2.y - p1.y) + 3 * tt * (p3.y - p2.y);

  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  return { x, y, angle };
}

export function listAvailableAdvancedMotionPresets(): AdvancedMotionPreset[] {
  return [
    // Layout
    {
      id: "preset-layout-smooth",
      name: "Smooth Rearrangement",
      category: "layout",
      description: "Fluid FLIP re-ordering animation with 0.2s duration and natural easeOut curve.",
      apply: (state) => ({
        ...state,
        layout: {
          ...state.layout,
          duration: 350,
          staggerMs: 25,
          staggerDirection: "forward",
        },
      }),
    },
    {
      id: "preset-layout-staggered-grid",
      name: "Staggered Grid",
      category: "layout",
      description: "Center-outward radiating stagger wave across multi-column responsive grid.",
      apply: (state) => ({
        ...state,
        layout: {
          ...state.layout,
          staggerMs: 60,
          staggerDirection: "center",
          duration: 600,
        },
      }),
    },
    {
      id: "preset-layout-expand",
      name: "Expand & Collapse",
      category: "layout",
      description: "Single-item dimension magnification with simultaneous surrounding element repositioning.",
      apply: (state) => ({
        ...state,
        layout: {
          ...state.layout,
          duration: 450,
          layoutMode: "list",
        },
      }),
    },
    {
      id: "preset-layout-nested",
      name: "Nested Layout Transition",
      category: "layout",
      description: "Coordinated parent-container resize with synchronized child component layout.",
      apply: (state) => ({
        ...state,
        layout: {
          ...state.layout,
          duration: 550,
          staggerMs: 40,
        },
      }),
    },

    // SVG Morphing
    {
      id: "preset-morph-circle-square",
      name: "Circle to Square",
      category: "svg-morph",
      description: "Smooth 4-cubic segment morph from unit circle to rounded square geometry.",
      apply: (state) => ({
        ...state,
        svgMorph: {
          ...state.svgMorph,
          sourcePath: "M 50 10 C 72 10 90 28 90 50 C 90 72 72 90 50 90 C 28 90 10 72 10 50 C 10 28 28 10 50 10 Z",
          targetPath: "M 10 10 L 90 10 L 90 90 L 10 90 Z",
          duration: 800,
        },
      }),
    },
    {
      id: "preset-morph-star-poly",
      name: "Shape Transformation",
      category: "svg-morph",
      description: "5-pointed star contour warping into regular hexagon with winding alignment.",
      apply: (state) => ({
        ...state,
        svgMorph: {
          ...state.svgMorph,
          sourcePath: "M 50 5 L 61 38 L 95 38 L 68 59 L 79 92 L 50 71 L 21 92 L 32 59 L 5 38 L 39 38 Z",
          targetPath: "M 50 10 L 85 30 L 85 70 L 50 90 L 15 70 L 15 30 Z",
          duration: 1000,
        },
      }),
    },
    {
      id: "preset-morph-icon",
      name: "Icon Morph",
      category: "svg-morph",
      description: "Hamburger menu icon transforming seamlessly into close X cross.",
      apply: (state) => ({
        ...state,
        svgMorph: {
          ...state.svgMorph,
          sourcePath: "M 15 25 L 85 25 M 15 50 L 85 50 M 15 75 L 85 75",
          targetPath: "M 20 20 L 80 80 M 20 80 L 80 20",
          duration: 600,
        },
      }),
    },
    {
      id: "preset-morph-organic",
      name: "Organic Morph",
      category: "svg-morph",
      description: "Continuous organic blob oscillation with cubic spline interpolation.",
      apply: (state) => ({
        ...state,
        svgMorph: {
          ...state.svgMorph,
          sourcePath: "M 50 15 C 80 10 95 40 85 70 C 75 95 40 90 20 75 C 5 55 20 20 50 15 Z",
          targetPath: "M 50 10 C 90 25 80 80 50 90 C 15 80 10 35 50 10 Z",
          duration: 1200,
          loop: true,
        },
      }),
    },

    // Motion Paths
    {
      id: "preset-path-curve",
      name: "Smooth Curve",
      category: "motion-path",
      description: "Gentle S-curve traversal with continuous tangent orientation calculation.",
      apply: (state) => ({
        ...state,
        motionPath: {
          ...state.motionPath,
          pathString: "M 40 160 C 140 20, 260 260, 460 120",
          duration: 1000,
          autoRotate: true,
        },
      }),
    },
    {
      id: "preset-path-orbit",
      name: "Circular Orbit",
      category: "motion-path",
      description: "Continuous orbital trajectory with constant-speed arc-length parameterization.",
      apply: (state) => ({
        ...state,
        motionPath: {
          ...state.motionPath,
          pathString: "M 250 80 A 100 100 0 1 0 250 280 A 100 100 0 1 0 250 80 Z",
          duration: 2000,
          loop: true,
          autoRotate: true,
        },
      }),
    },
    {
      id: "preset-path-waypoint",
      name: "Waypoint Journey",
      category: "motion-path",
      description: "Multi-checkpoint trajectory connecting spatial waypoints with Catmull-Rom smoothing.",
      apply: (state) => ({
        ...state,
        motionPath: {
          ...state.motionPath,
          pathString: "M 40 40 L 160 180 L 320 60 L 460 200",
          duration: 1500,
          autoRotate: false,
        },
      }),
    },
    {
      id: "preset-path-3d",
      name: "3D Path Following",
      category: "motion-path",
      description: "Spatial depth trajectory with 3D orientation frame banking and pitch control.",
      apply: (state) => ({
        ...state,
        motionPath: {
          ...state.motionPath,
          pathString: "M 50 200 C 150 50, 300 300, 450 100",
          duration: 1800,
          autoRotate: true,
        },
      }),
    },

    // Typography
    {
      id: "preset-typo-typewriter",
      name: "Typewriter",
      category: "typography",
      description: "Character-by-character discrete typewriter cadence with blinking cursor.",
      apply: (state) => ({
        ...state,
        typography: {
          ...state.typography,
          segmentation: "character",
          preset: "typewriter",
          staggerMs: 40,
        },
      }),
    },
    {
      id: "preset-typo-word-reveal",
      name: "Word Reveal",
      category: "typography",
      description: "Staggered upward slide and fade entrance segmented by lexical word boundaries.",
      apply: (state) => ({
        ...state,
        typography: {
          ...state.typography,
          segmentation: "word",
          preset: "slide",
          staggerMs: 65,
        },
      }),
    },
    {
      id: "preset-typo-char-stagger",
      name: "Character Stagger",
      category: "typography",
      description: "Cascading scale and blur transition across individual Unicode graphemes.",
      apply: (state) => ({
        ...state,
        typography: {
          ...state.typography,
          segmentation: "character",
          preset: "blur",
          staggerMs: 30,
        },
      }),
    },
    {
      id: "preset-typo-wave",
      name: "Wave Text",
      category: "typography",
      description: "Harmonic vertical sine wave ripple travelling through heading characters.",
      apply: (state) => ({
        ...state,
        typography: {
          ...state.typography,
          segmentation: "character",
          preset: "wave",
          staggerMs: 35,
        },
      }),
    },
    {
      id: "preset-typo-path",
      name: "Path Typography",
      category: "typography",
      description: "Glyphs positioned and animated tangentially along active motion path.",
      apply: (state) => ({
        ...state,
        typography: {
          ...state.typography,
          followMotionPath: true,
          segmentation: "character",
          preset: "slide",
        },
      }),
    },

    // Transitions
    {
      id: "preset-trans-shared-element",
      name: "Shared Element",
      category: "transitions",
      description: "Hero image and title morphing across list view and detail view with FLIP interpolation.",
      apply: (state) => ({
        ...state,
        sharedElement: {
          ...state.sharedElement,
          duration: 500,
          crossfade: true,
        },
      }),
    },
    {
      id: "preset-trans-crossfade",
      name: "Crossfade",
      category: "transitions",
      description: "Standard dual-buffer opacity crossfade between two application states.",
      apply: (state) => ({
        ...state,
        viewTransition: {
          ...state.viewTransition,
          transitionPreset: "crossfade",
          duration: 350,
        },
      }),
    },
    {
      id: "preset-trans-slide",
      name: "Slide Transition",
      category: "transitions",
      description: "Directional horizontal slide with synchronized entrance and exit panes.",
      apply: (state) => ({
        ...state,
        viewTransition: {
          ...state.viewTransition,
          transitionPreset: "slide-left",
          duration: 400,
        },
      }),
    },
    {
      id: "preset-trans-page",
      name: "Directional Page Transition",
      category: "transitions",
      description: "Native view transition API wrapper with zoom and lateral transform fallbacks.",
      apply: (state) => ({
        ...state,
        viewTransition: {
          ...state.viewTransition,
          transitionPreset: "zoom",
          duration: 450,
        },
      }),
    },

    // Composition
    {
      id: "preset-comp-multi-stage",
      name: "Multi-Stage Reveal",
      category: "composition",
      description: "Sequential choreography: kinetic typography header -> layout grid expansion -> SVG badge morph.",
      apply: (state) => ({
        ...state,
        composition: {
          ...state.composition,
          duration: 2800,
        },
      }),
    },
    {
      id: "preset-comp-morph-hero",
      name: "Morphing Hero",
      category: "composition",
      description: "SVG shape morph coupled in parallel with motion path trajectory and text entrance.",
      apply: (state) => ({
        ...state,
        composition: {
          ...state.composition,
          duration: 2400,
        },
      }),
    },
    {
      id: "preset-comp-typo-journey",
      name: "Typography Journey",
      category: "composition",
      description: "Kinetic characters travelling continuously along orbital motion path with staggered reveal.",
      apply: (state) => ({
        ...state,
        typography: {
          ...state.typography,
          followMotionPath: true,
        },
      }),
    },
    {
      id: "preset-comp-page-trans",
      name: "Coordinated Page Transition",
      category: "composition",
      description: "Full multi-system transition coordinating view transition, shared cards, and text exit.",
      apply: (state) => ({
        ...state,
        composition: {
          ...state.composition,
          duration: 3000,
        },
      }),
    },
  ];
}

export function loadAdvancedMotionPreset(
  presetId: string,
  state: AdvancedMotionStudioState
): AdvancedMotionStudioState {
  const presets = listAvailableAdvancedMotionPresets();
  const found = presets.find((p) => p.id === presetId);
  if (!found) return state;
  return found.apply(state);
}

export function getAdvancedMotionDiagnostics(
  state: AdvancedMotionStudioState
): AdvancedMotionDiagnosticsData {
  const health = defaultPerformanceIntelligence.health;
  const context = defaultPerformanceIntelligence.context;

  return {
    fps: context?.fps ?? 60,
    activeAnimations: 4,
    activeTracks: state.composition.steps.length,
    pathLength: state.motionPath.pathLength,
    morphProgress: state.svgMorph.progress,
    isLayoutActive: true,
    viewTransitionSupported: state.viewTransition.isNativeSupported,
    healthScore: Math.round(health.overallHealth.score),
    healthStatus: health.overallHealth.status,
  };
}

export function generateAdvancedMotionExportBundle(state: AdvancedMotionStudioState) {
  const { layout, svgMorph, motionPath, typography, sharedElement, viewTransition, composition } = state;

  const reactHookCode = `import React, { useRef } from "react";
import {
  useLayoutAnimation,
  useSvgMorph,
  useMotionPath,
  useKineticTypography,
} from "af-motion/react";

export function AdvancedMotionDemo() {
  const layoutContainerRef = useRef<HTMLDivElement>(null);
  const svgPathRef = useRef<SVGPathElement>(null);
  const followerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);

  // 1. Automatic Layout Animation (FLIP)
  const layout = useLayoutAnimation(layoutContainerRef, {
    duration: ${layout.duration},
    stagger: ${layout.staggerMs},
    staggerDirection: "${layout.staggerDirection}",
  });

  // 2. SVG Path Morphing
  const morph = useSvgMorph(svgPathRef, {
    from: "${svgMorph.sourcePath}",
    to: "${svgMorph.targetPath}",
    duration: ${svgMorph.duration},
    loop: ${svgMorph.loop},
  });

  // 3. Motion Path Follower
  const path = useMotionPath(followerRef, {
    path: "${motionPath.pathString}",
    duration: ${motionPath.duration},
    autoRotate: ${motionPath.autoRotate},
    loop: ${motionPath.loop},
  });

  // 4. Kinetic Typography
  const typo = useKineticTypography(textRef, {
    by: "${typography.segmentation}",
    preset: "${typography.preset}",
    stagger: ${typography.staggerMs},
    duration: ${typography.duration},
  });

  return (
    <div className="advanced-motion-container p-6">
      <h1 ref={textRef} className="text-3xl font-bold">${typography.text}</h1>
      <svg className="w-32 h-32 my-4" viewBox="0 0 100 100">
        <path ref={svgPathRef} fill="#3b82f6" />
      </svg>
      <div ref={layoutContainerRef} className="grid grid-cols-3 gap-4">
        {/* Animated layout items */}
      </div>
      <div ref={followerRef} className="w-6 h-6 rounded-full bg-emerald-400" />
    </div>
  );
}`;

  const reactComponentCode = `import React from "react";
import {
  LayoutGroup,
  MorphSVG,
  MotionPathFollower,
  KineticText,
  SharedElement,
} from "af-motion/react";

export function DeclarativeAdvancedMotion() {
  return (
    <div className="space-y-6">
      {/* Declarative Kinetic Typography */}
      <KineticText
        by="${typography.segmentation}"
        preset="${typography.preset}"
        stagger={${typography.staggerMs}}
        duration={${typography.duration}}
      >
        ${typography.text}
      </KineticText>

      {/* Declarative SVG Path Morph */}
      <svg viewBox="0 0 100 100" className="w-24 h-24">
        <MorphSVG
          from="${svgMorph.sourcePath}"
          to="${svgMorph.targetPath}"
          duration={${svgMorph.duration}}
          loop={${svgMorph.loop}}
          fill="#8b5cf6"
        />
      </svg>

      {/* Shared Element Hero Transition */}
      <SharedElement id="${sharedElement.sharedId}">
        <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
          <h3>Shared Hero Element</h3>
        </div>
      </SharedElement>

      {/* Automatic Layout Group */}
      <LayoutGroup id="card-grid">
        <div className="grid grid-cols-3 gap-3">
          {/* Card components with layout prop */}
        </div>
      </LayoutGroup>
    </div>
  );
}`;

  const vanillaCode = `import {
  createLayoutController,
  animateSvgMorph,
  createMotionPathEngine,
  createKineticTypographyEngine,
  createSharedElementController,
  createViewTransitionAdapter,
} from "af-motion";

// 1. Layout Animation
const layoutController = createLayoutController(document.querySelector("#grid"), {
  duration: ${layout.duration},
  stagger: ${layout.staggerMs},
});

// 2. SVG Morphing
const morphAnimation = animateSvgMorph(document.querySelector("#morph-target"), {
  from: "${svgMorph.sourcePath}",
  to: "${svgMorph.targetPath}",
  duration: ${svgMorph.duration},
  loop: ${svgMorph.loop},
});

// 3. Motion Path Engine
const pathEngine = createMotionPathEngine({
  path: "${motionPath.pathString}",
  duration: ${motionPath.duration},
  autoRotate: ${motionPath.autoRotate},
  onUpdate: (state) => console.log("Path point:", state.point),
});

// 4. View Transition
const viewTransition = createViewTransitionAdapter({
  preset: "${viewTransition.transitionPreset}",
  duration: ${viewTransition.duration},
});

// Cleanup resources
function cleanup() {
  layoutController.destroy();
  morphAnimation.stop();
  pathEngine.destroy();
}`;

  const compositionCode = `import {
  createAdvancedMotionController,
} from "af-motion";

// Unified Multi-System Composition (${composition.name})
const compositionController = createAdvancedMotionController({
  id: "${composition.id}",
  duration: ${composition.duration},
  participants: [
    {
      id: "typo-track",
      system: "typography",
      target: "#kinetic-title",
      options: {
        by: "${typography.segmentation}",
        preset: "${typography.preset}",
        stagger: ${typography.staggerMs},
      },
      duration: ${typography.duration},
    },
    {
      id: "layout-track",
      system: "layout",
      target: "#app-grid",
      at: "+=200",
      duration: ${layout.duration},
    },
    {
      id: "morph-track",
      system: "svg-morph",
      target: "#hero-shape",
      to: "${svgMorph.targetPath}",
      at: "<",
      duration: ${svgMorph.duration},
    },
    {
      id: "path-track",
      system: "motion-path",
      target: "#satellite-orb",
      path: "${motionPath.pathString}",
      at: "+=100",
      duration: ${motionPath.duration},
    },
  ],
});

// Play composition
compositionController.play();`;

  const jsonSchema = JSON.stringify(
    {
      version: "1.0.0",
      layout,
      svgMorph,
      motionPath,
      typography,
      sharedElement,
      viewTransition,
      composition,
    },
    null,
    2
  );

  return {
    reactHookCode,
    reactComponentCode,
    vanillaCode,
    compositionCode,
    jsonSchema,
  };
}
