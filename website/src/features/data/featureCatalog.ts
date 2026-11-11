import type { FeatureCategorySpec, FeatureComparisonRow } from "../types";

export const FEATURE_CATEGORIES: readonly FeatureCategorySpec[] = [
  {
    id: "core-animation",
    indexLabel: "01",
    title: "Core Animation",
    shortTitle: "Core Engine",
    badge: "Runtime Engine",
    accent: "cyan",
    subpath: "af-motion",
    headline: "Deterministic property animation, curves, springs, and timelines",
    summary:
      "Drive GPU-composited transforms and opacity with sub-millisecond timing control, custom progress drivers, damped spring physics, and multi-track timelines.",
    problemSolved:
      "Manual requestAnimationFrame loops and scattered CSS transitions break synchronization under cancellation, scrubbing, and complex multi-step transitions.",
    capabilities: [
      "Property animation via animate() across transform, opacity, and numeric styles",
      "Progress-driven normalized animation loop via animateProgress()",
      "12 built-in core easing curves (easings) plus extensible registerEasing() registry",
      "Real-time damped spring physics solver (animateSpring) and momentum (animateInertia)",
      "Full playback controls (play, pause, reverse, cancel, finished promise)",
      "Multi-track timeline & choreography composition (createTimeline, animateSequence, animateParallel)",
    ],
    apiImports: [
      "animate",
      "animateProgress",
      "animateSpring",
      "easings",
      "registerEasing",
      "createTimeline",
    ],
    codeExample: `import { animate, animateSpring, createTimeline, easings } from "af-motion";

const hero = document.querySelector("[data-hero-card]") as HTMLElement;

// 1. Property animation with GPU transforms
const intro = animate(
  hero,
  { opacity: [0, 1], transform: ["translate3d(0, 24px, 0)", "translate3d(0, 0, 0)"] },
  { duration: 550, easing: easings.easeOutExpo }
);

// 2. Physical spring solver with velocity inheritance
const spring = animateSpring({
  from: 0,
  to: 1,
  config: { stiffness: 220, damping: 20 },
  onUpdate: ({ position }) => {
    hero.style.transform = \`translate3d(0, \${position * 12}px, 0)\`;
  },
});`,
    relatedCategories: ["visual-effects", "design-system", "framework-integrations"],
    playgroundDemoId: "basic-animate",
    playgroundLabel: "Open Core & Timeline Labs",
  },
  {
    id: "visual-effects",
    indexLabel: "02",
    title: "Visual Effects",
    shortTitle: "Visual Effects",
    badge: "Pointer & Scroll",
    accent: "purple",
    subpath: "af-motion",
    headline: "Tactile reveals, staggers, magnetic pull, tilt, and scroll depth",
    summary:
      "Compose responsive entrance choreography and physical pointer/scroll microinteractions without hand-rolling IntersectionObserver or pointer math.",
    problemSolved:
      "One-off hover handlers and scroll listeners frequently leak memory, jitter on resize, or trigger layout reflows across main-thread frames.",
    capabilities: [
      "Viewport reveal transitions (reveal) with clean teardown controls",
      "Sequenced collection entrances (stagger) supporting element lists and selectors",
      "Pointer-reactive magnetic attraction (magnetic, magneticElement)",
      "3D perspective tilt surfaces (tilt) with bounded specular rotation",
      "Scroll-linked depth translation and triggers (parallax, scrollProgress, scrollTrigger)",
      "Viewport observation & scroll velocity primitives (inView, scrollVelocity, scrollAnimate)",
    ],
    apiImports: [
      "reveal",
      "stagger",
      "magnetic",
      "tilt",
      "parallax",
      "scrollProgress",
    ],
    codeExample: `import { magnetic, tilt, stagger, easings } from "af-motion";

// Sequenced entrance across cards
const intro = stagger(".feature-card", {
  properties: { opacity: [0, 1], transform: ["translate3d(0, 16px, 0)", "translate3d(0, 0, 0)"] },
  stagger: 65,
  duration: 480,
  easing: easings.easeOutCubic,
});

// Pointer-driven microinteractions with teardown
const mag = magnetic(ctaButton, { strength: 0.35 });
const cardTilt = tilt(surfaceCard, { maxTilt: 10, scale: 1.02 });`,
    relatedCategories: ["core-animation", "framework-integrations", "three-gpu"],
    playgroundDemoId: "magnetic-tilt",
    playgroundLabel: "Open Effects Showcase",
  },
  {
    id: "motion-intelligence",
    indexLabel: "03",
    title: "Motion Intelligence",
    shortTitle: "AI Intelligence",
    badge: "Deterministic AI",
    accent: "emerald",
    subpath: "af-motion/catalogue",
    headline: "Quality auditing, Design-to-Motion synthesis, and offline agent workflows",
    summary:
      "Analyze motion configurations statically, receive concrete recommendations, synthesize motion from design specifications, and execute deterministic agent workflows offline.",
    problemSolved:
      "Generative UI tooling often hallucinates invalid properties or depends on remote LLM calls for routine timing, accessibility, and composition validation.",
    capabilities: [
      "Deterministic motion quality scoring and findings (evaluateMotionQuality)",
      "Actionable tuning recommendations (generateMotionRecommendations)",
      "Design specification to motion plan synthesis (designToMotionEngine)",
      "Multi-layer scene specification synthesis (aiSceneGenerationEngine)",
      "Audit-logged agent workflow execution (workflowExecutionEngine, listWorkflowTemplates)",
      "161 registered AI motion capabilities and 19 visual design styles",
    ],
    apiImports: [
      "evaluateMotionQuality",
      "generateMotionRecommendations",
      "designToMotionEngine",
      "aiSceneGenerationEngine",
      "listWorkflowTemplates",
    ],
    codeExample: `import {
  evaluateMotionQuality,
  generateMotionRecommendations,
  designToMotionEngine,
} from "af-motion/catalogue";

const audit = evaluateMotionQuality({
  configuration: { duration: 420, easing: "easeOutCubic" },
});

const recs = generateMotionRecommendations({ configuration: { duration: 420 } }, audit.findings);
const generated = designToMotionEngine.generateSync({
  naturalLanguage: { prompt: "Subtle elevated card reveal with snappy exit" },
});`,
    relatedCategories: ["design-system", "core-animation", "framework-integrations"],
    playgroundDemoId: "ai-laboratory",
    playgroundLabel: "Open AI Laboratory",
  },
  {
    id: "design-system",
    indexLabel: "04",
    title: "Motion Design System",
    shortTitle: "Design System",
    badge: "DNA, Palettes & Presets",
    accent: "indigo",
    subpath: "af-motion/presets",
    headline: "Unified palettes, Motion DNA personalities, and 39 built-in presets",
    summary:
      "Standardize brand feel across teams using 33 built-in palettes, 6 built-in Motion DNA timing personalities, and 39 machine-readable presets across 9 categories.",
    problemSolved:
      "Copying timing curves and spring constants across components creates inconsistent feel and makes sweeping brand motion updates fragile.",
    capabilities: [
      "33 curated color palettes with CSS variable application (listPalettes, activatePalette)",
      "6 built-in Motion DNA profiles (snappy, energetic, calm, cinematic, minimal, playful)",
      "39 standardized presets across 9 categories (listPresets, applyPreset)",
      "Design system token creation & validation (createDesignSystem, resolveDesignSystem)",
      "Centralized motion inheritance and overrides (applyMotionDNA)",
    ],
    apiImports: [
      "getMotionDNA",
      "applyMotionDNA",
      "listPalettes",
      "listPresets",
      "applyPreset",
      "createDesignSystem",
    ],
    codeExample: `import { getMotionDNA, applyMotionDNA, listPalettes } from "af-motion";
import { listPresets, applyPreset } from "af-motion/presets";

// Align timing & easing to a Motion DNA personality
const cinematic = getMotionDNA("cinematic");
const config = applyMotionDNA({ duration: 500 }, "snappy");

// Reuse one of 39 built-in presets across 9 categories
const entrancePresets = listPresets({ category: "entrance" });
applyPreset(panelElement, entrancePresets[0]?.id ?? "fade-up-subtle");`,
    relatedCategories: ["core-animation", "motion-intelligence", "framework-integrations"],
    playgroundDemoId: "motion-dna",
    playgroundLabel: "Explore Motion DNA & Presets",
    defaultDnaProfile: "snappy",
  },
  {
    id: "three-gpu",
    indexLabel: "05",
    title: "3D & GPU",
    shortTitle: "3D & GPU",
    badge: "Canvas & WebGL",
    accent: "sky",
    subpath: "af-motion",
    headline: "Procedural canvas backgrounds, interactive particles, and 3D hooks",
    summary:
      "Render shader-like aurora gradients, reactive particle fields, geometric meshes, fluid waves, and React Three Fiber scenes with graceful WebGL fallback.",
    problemSolved:
      "WebGL scenes and fullscreen canvases easily exhaust low-power devices or leak animation frames when mounted inside single-page transitions.",
    capabilities: [
      "Procedural GPU/Canvas backgrounds (aurora, particleField, particleBackground)",
      "Geometric, fluid, atmospheric & energy backgrounds (geometricBackground, fluidBackground)",
      "React 3D scene and morphing hooks (useScene3D, use3DMorph, InteractiveParticles)",
      "Runtime device graphics probing and adaptive quality boundaries (AdaptiveQualityProvider)",
      "Clean unmount teardown via .destroy() lifecycle handles",
    ],
    apiImports: [
      "aurora",
      "particleField",
      "geometricBackground",
      "use3DMorph",
      "InteractiveParticles",
      "useScene3D",
    ],
    codeExample: `import { aurora, particleField } from "af-motion";

// Mount hardware-friendly procedural canvas backgrounds with explicit teardown
const bgControls = aurora(canvasContainer, {
  speed: 6,
  opacity: 0.7,
});

const fieldControls = particleField(canvasContainer, {
  particleCount: 48,
});

// Clean up inside effect teardown:
// bgControls.destroy(); fieldControls.destroy();`,
    relatedCategories: ["visual-effects", "framework-integrations", "core-animation"],
    playgroundDemoId: "three-gpu-showcase",
    playgroundLabel: "Open 3D & GPU Lab",
  },
  {
    id: "framework-integrations",
    indexLabel: "06",
    title: "Framework Integrations",
    shortTitle: "Integrations",
    badge: "React 18/19 & ESM",
    accent: "amber",
    subpath: "af-motion/react",
    headline: "Framework-independent core paired with SSR-safe React bindings",
    summary:
      "Run AF Motion's zero-dependency engine in vanilla JS/TS, Web Components, Astro, or React 18/19 App Router applications with isolated modular entry points.",
    problemSolved:
      "Monolithic animation packages bundle React wrappers even for vanilla scripts or trigger SSR ReferenceError crashes during server pre-rendering.",
    capabilities: [
      "Pure ESM framework-independent core entry point (af-motion)",
      "Dedicated React 18 & 19 bindings (af-motion/react) with \"use client\" boundaries",
      "Hooks for elements, scroll & accessibility (useAnimate, useInView, useScrollProgress)",
      "Accessible validation hook & microinteractions (useMotionAccessibility, useMicrointeraction)",
      "Tree-shakeable subpaths: af-motion, af-motion/react, af-motion/catalogue, af-motion/presets",
      "Strict Mode safe cancellation in effect cleanup handlers",
    ],
    apiImports: [
      "Reveal",
      "Interactive",
      "useAnimate",
      "useInView",
      "useScrollProgress",
      "useMotionAccessibility",
    ],
    codeExample: `"use client";

import { Reveal, useAnimate, useMotionAccessibility } from "af-motion/react";

export function AccessibleCard() {
  const { ref, animate } = useAnimate<HTMLDivElement>();
  const { respectsReducedMotion, accessibilityScore } = useMotionAccessibility({
    duration: 450,
    property: "transform",
  });

  return (
    <Reveal direction="up" duration={450}>
      <div ref={ref} onMouseEnter={() => animate({ transform: "scale(1.02)" }, { duration: 220 })}>
        Accessibility score: {accessibilityScore} ({respectsReducedMotion ? "reduced" : "full"})
      </div>
    </Reveal>
  );
}`,
    relatedCategories: ["core-animation", "design-system", "visual-effects"],
    playgroundDemoId: "basic-animate",
    playgroundLabel: "Open Playground",
  },
];

export const FEATURE_COMPARISONS: readonly FeatureComparisonRow[] = [
  {
    dimension: "Abstraction Layer",
    leftTitle: "Core Animation (animate / animateSpring)",
    leftSummary: "Direct frame-level control over keyframes, easings, velocity, and pause/reverse handles.",
    leftWhenToUse: "Custom bespoke interactions, scrubbed timelines, or imperative physics choreography.",
    rightTitle: "Higher-Level Effects (reveal / stagger / tilt)",
    rightSummary: "Pre-configured observers, pointer listeners, and multi-element stagger scheduling.",
    rightWhenToUse: "Standard UI polish, card grids, buttons, and viewport entrances without boilerplate.",
  },
  {
    dimension: "Runtime Integration",
    leftTitle: "Framework-Independent Core (af-motion)",
    leftSummary: "Pure DOM and math primitives with zero React peer requirement.",
    leftWhenToUse: "Vanilla TS, Astro, Svelte, Vue, Solid, or custom element wrappers.",
    rightTitle: "React 18/19 Bindings (af-motion/react)",
    rightSummary: "Declarative components and ref-managed hooks marked with \"use client\" for App Router.",
    rightWhenToUse: "React component trees needing Strict Mode cleanup and reduced-motion context.",
  },
  {
    dimension: "Styling & Feel",
    leftTitle: "Manual Per-Call Configuration",
    leftSummary: "Specify explicit duration, delay, and curve on every call site.",
    leftWhenToUse: "One-off hero centerpieces requiring custom signature timing curves.",
    rightTitle: "Motion DNA (applyMotionDNA)",
    rightSummary: "Inherit cohesive speed, bounce, and easing personality across an entire product surface.",
    rightWhenToUse: "Multi-screen applications enforcing consistent motion language across teams.",
  },
  {
    dimension: "Orchestration Scale",
    leftTitle: "Individual Standalone Animations",
    leftSummary: "Independent animation controls scoped to a single DOM node or spring value.",
    leftWhenToUse: "Hover feedback, button presses, or isolated state transitions.",
    rightTitle: "Timeline Compositions (createTimeline)",
    rightSummary: "Coordinated multi-track sequences with shared playhead, seek, pause, and offsets.",
    rightWhenToUse: "Page intros, onboarding step transitions, and synchronized multi-element choreography.",
  },
  {
    dimension: "Authoring Workflow",
    leftTitle: "Manual Parameter Authoring",
    leftSummary: "Developer chooses curves, durations, and validates accessibility manually.",
    leftWhenToUse: "Hand-tuned microinteractions with exact designer-specified curves.",
    rightTitle: "Deterministic AI Workflows (af-motion/catalogue)",
    rightSummary: "Offline quality evaluation, design-to-motion synthesis, and rule-based audit recommendations.",
    rightWhenToUse: "Automated CI motion audits, MCP coding agents, and rapid prototyping without external LLMs.",
  },
];

export function getFeatureCategoryById(id: string): FeatureCategorySpec | undefined {
  return FEATURE_CATEGORIES.find((cat) => cat.id === id);
}
