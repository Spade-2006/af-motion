export type PackageManager = "npm" | "pnpm" | "yarn" | "bun";

export interface PackageManagerCommand {
  readonly id: PackageManager;
  readonly label: string;
  readonly command: string;
  readonly cliNote: string;
}

export const PACKAGE_MANAGERS: readonly PackageManagerCommand[] = [
  {
    id: "npm",
    label: "npm",
    command: "npm install af-motion",
    cliNote: "npx af-motion init",
  },
  {
    id: "pnpm",
    label: "pnpm",
    command: "pnpm add af-motion",
    cliNote: "pnpm dlx af-motion init",
  },
  {
    id: "yarn",
    label: "yarn",
    command: "yarn add af-motion",
    cliNote: "yarn dlx af-motion init",
  },
  {
    id: "bun",
    label: "bun",
    command: "bun add af-motion",
    cliNote: "bunx af-motion init",
  },
] as const;

export const FIRST_ANIMATION_CODE = `import { animate, easings } from "af-motion";

// 1. Target element
const card = document.querySelector("[data-welcome-card]") as HTMLElement;

// 2. Animation configuration + execution
const controls = animate(
  card,
  {
    opacity: [0, 1],
    transform: ["translate3d(0, 20px, 0) scale(0.96)", "translate3d(0, 0, 0) scale(1)"],
  },
  {
    duration: 550,
    easing: easings.easeOutExpo,
  }
);

// Optional lifecycle control
// controls.pause(); controls.reverse(); controls.cancel();`;

export const REACT_INTEGRATION_CODE = `"use client";

import { useEffect, useRef } from "react";
import { animate, easings } from "af-motion";
import { Reveal, Interactive, useMotionAccessibility } from "af-motion/react";

export function OnboardingReactPanel() {
  const pulseRef = useRef<HTMLDivElement>(null);
  const { respectsReducedMotion, accessibilityScore } = useMotionAccessibility({
    duration: 450,
    property: "transform",
  });

  // Strict Mode safe imperative animation lifecycle
  useEffect(() => {
    if (respectsReducedMotion || !pulseRef.current) return;
    const controls = animate(
      pulseRef.current,
      { opacity: [0.7, 1], transform: ["translate3d(0, 8px, 0)", "translate3d(0, 0, 0)"] },
      { duration: 450, easing: easings.easeOutCubic }
    );
    return () => controls.cancel();
  }, [respectsReducedMotion]);

  return (
    <Reveal direction="up" duration={450}>
      <Interactive category="card">
        <div ref={pulseRef}>
          Accessibility Score: {accessibilityScore}
        </div>
      </Interactive>
    </Reveal>
  );
}`;

export interface OnboardingEffectCard {
  readonly id: string;
  readonly apiName: string;
  readonly title: string;
  readonly description: string;
  readonly playgroundDemoId: string;
}

export const ONBOARDING_EFFECTS: readonly OnboardingEffectCard[] = [
  {
    id: "reveal",
    apiName: "reveal()",
    title: "Reveal",
    description: "IntersectionObserver viewport entrances using GPU transform and opacity only.",
    playgroundDemoId: "stagger-reveal",
  },
  {
    id: "stagger",
    apiName: "stagger()",
    title: "Stagger",
    description: "Sequenced multi-element reveals with directional ordering and delay offsets.",
    playgroundDemoId: "stagger-reveal",
  },
  {
    id: "magnetic",
    apiName: "magnetic()",
    title: "Magnetic",
    description: "Elastic cursor attraction on primary CTAs with configurable pull radius.",
    playgroundDemoId: "magnetic-tilt",
  },
  {
    id: "tilt",
    apiName: "tilt()",
    title: "3D Tilt",
    description: "Bounded perspective rotation on cards responding smoothly to pointer movement.",
    playgroundDemoId: "magnetic-tilt",
  },
  {
    id: "parallax",
    apiName: "parallax()",
    title: "Parallax",
    description: "Scroll-linked vertical or horizontal depth translation with clamp bounds.",
    playgroundDemoId: "parallax-scroll",
  },
];

export interface OnboardingAdvancedCard {
  readonly id: string;
  readonly title: string;
  readonly whenToUse: string;
  readonly subpath: string;
  readonly playgroundDemoId: string;
}

export const ONBOARDING_ADVANCED_CAPABILITIES: readonly OnboardingAdvancedCard[] = [
  {
    id: "springs",
    title: "Spring Physics",
    whenToUse: "Use animateSpring() when UI motion needs physical velocity continuity or natural overshoot instead of fixed durations.",
    subpath: "af-motion",
    playgroundDemoId: "spring-physics",
  },
  {
    id: "timelines",
    title: "Timelines",
    whenToUse: "Use createTimeline() when orchestrating coordinated multi-element steps with playhead scrubbing and shared playback controls.",
    subpath: "af-motion",
    playgroundDemoId: "timeline-choreography",
  },
  {
    id: "dna",
    title: "Motion DNA",
    whenToUse: "Use applyMotionDNA() to standardize timing and curve personality (snappy, energetic, calm, cinematic, minimal, playful) across screens.",
    subpath: "af-motion",
    playgroundDemoId: "motion-dna",
  },
  {
    id: "presets",
    title: "39 Presets",
    whenToUse: "Use listPresets() and applyPreset() to apply audited entrance, exit, hover, text, scroll, and page transition recipes immediately.",
    subpath: "af-motion/presets",
    playgroundDemoId: "preset-explorer",
  },
  {
    id: "three-gpu",
    title: "3D & GPU Shaders",
    whenToUse: "Use aurora(), particleField(), and useScene3D() for ambient hero canvases and hardware-adaptive 3D surfaces.",
    subpath: "af-motion",
    playgroundDemoId: "three-gpu-showcase",
  },
  {
    id: "ai-ecosystem",
    title: "AI Motion Ecosystem",
    whenToUse: "Use evaluateMotionQuality() and designToMotionEngine in CI audits or agent workflows for deterministic, zero-network motion planning.",
    subpath: "af-motion/catalogue",
    playgroundDemoId: "ai-laboratory",
  },
];

export interface ChecklistMilestone {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly actionHref: string;
  readonly actionLabel: string;
}

export const CHECKLIST_MILESTONES: readonly ChecklistMilestone[] = [
  {
    id: "installed",
    label: "Installed AF Motion",
    description: "Copied or executed the package manager installation command.",
    actionHref: "#onboarding-step-1",
    actionLabel: "Step 1",
  },
  {
    id: "first-animation",
    label: "Created first animation",
    description: "Ran the core animate() call with target, keyframes, duration, and easing.",
    actionHref: "#onboarding-step-2",
    actionLabel: "Step 2",
  },
  {
    id: "explored-easing",
    label: "Explored an easing function",
    description: "Inspected one of the 12 built-in core easings or spring solver curves.",
    actionHref: "#playground/easing-explorer",
    actionLabel: "Easing Lab",
  },
  {
    id: "tried-effect",
    label: "Tried a visual effect",
    description: "Tested stagger, reveal, magnetic, tilt, or parallax interactions.",
    actionHref: "#playground/magnetic-tilt",
    actionLabel: "Effects Lab",
  },
  {
    id: "react-integration",
    label: "Explored React integration",
    description: "Reviewed Reveal, Interactive, \"use client\" boundaries, and Strict Mode cleanup.",
    actionHref: "#onboarding-step-3",
    actionLabel: "Step 3",
  },
];
