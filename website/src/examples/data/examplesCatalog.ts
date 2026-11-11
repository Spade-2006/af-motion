export type ExampleCategory =
  | "All"
  | "Getting Started"
  | "Buttons and Interactions"
  | "Cards and Components"
  | "Page Transitions"
  | "Scroll Experiences"
  | "Data Visualization"
  | "Physics and Motion"
  | "3D Experiences"
  | "Advanced Compositions";

export type ExampleDifficulty = "Beginner" | "Intermediate" | "Advanced";

export interface CuratedExampleSpec {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: Exclude<ExampleCategory, "All">;
  readonly difficulty: ExampleDifficulty;
  readonly subpath: "af-motion" | "af-motion/react" | "af-motion/catalogue" | "af-motion/presets";
  readonly apis: readonly string[];
  readonly playgroundDemoId?: string;
  readonly code: string;
}

export const EXAMPLE_CATEGORIES: readonly ExampleCategory[] = [
  "All",
  "Getting Started",
  "Buttons and Interactions",
  "Cards and Components",
  "Page Transitions",
  "Scroll Experiences",
  "Data Visualization",
  "Physics and Motion",
  "3D Experiences",
  "Advanced Compositions",
] as const;

export const CURATED_EXAMPLES: readonly CuratedExampleSpec[] = [
  {
    id: "entrance-card",
    name: "GPU Card Entrance",
    description:
      "Clean first animation combining transform translation and opacity fade on GPU composite layers.",
    category: "Getting Started",
    difficulty: "Beginner",
    subpath: "af-motion",
    apis: ["animate", "easings.easeOutExpo"],
    playgroundDemoId: "basic-animate",
    code: `import { animate, easings } from "af-motion";

const controls = animate(
  element,
  { opacity: [0, 1], transform: ["translate3d(0, 18px, 0)", "translate3d(0, 0, 0)"] },
  { duration: 520, easing: easings.easeOutExpo }
);`,
  },
  {
    id: "magnetic-cta",
    name: "Magnetic Tactile CTA",
    description:
      "Pointer-reactive button attraction with automatic spring return and event listener cleanup.",
    category: "Buttons and Interactions",
    difficulty: "Beginner",
    subpath: "af-motion",
    apis: ["magnetic", "animate"],
    playgroundDemoId: "magnetic-tilt",
    code: `import { magnetic } from "af-motion";

const handle = magnetic(buttonEl, { strength: 0.35 });
// On unmount: handle.destroy();`,
  },
  {
    id: "perspective-tilt-card",
    name: "3D Perspective Surface Card",
    description:
      "Interactive glass card applying bounded perspective tilt rotation across pointer hover.",
    category: "Cards and Components",
    difficulty: "Intermediate",
    subpath: "af-motion",
    apis: ["tilt"],
    playgroundDemoId: "magnetic-tilt",
    code: `import { tilt } from "af-motion";

const handle = tilt(cardEl, { maxTilt: 12, scale: 1.03 });
// On unmount: handle.destroy();`,
  },
  {
    id: "route-stagger-reveal",
    name: "Staggered Section Transition",
    description:
      "Sequential panel reveal choreography ideal for list views and route view mount transitions.",
    category: "Page Transitions",
    difficulty: "Intermediate",
    subpath: "af-motion",
    apis: ["stagger", "easings.easeOutCubic"],
    playgroundDemoId: "stagger-reveal",
    code: `import { stagger, easings } from "af-motion";

const controls = stagger(".route-panel", {
  properties: { opacity: [0, 1], transform: ["translate3d(0, 16px, 0)", "translate3d(0, 0, 0)"] },
  stagger: 70,
  duration: 450,
  easing: easings.easeOutCubic,
});`,
  },
  {
    id: "scroll-depth-track",
    name: "Scroll-Linked Parallax Layers",
    description:
      "Foreground and background parallax layers bound cleanly to scroll offset with bounded clamping.",
    category: "Scroll Experiences",
    difficulty: "Intermediate",
    subpath: "af-motion",
    apis: ["parallax", "scrollProgress"],
    playgroundDemoId: "parallax-scroll",
    code: `import { parallax, scrollProgress } from "af-motion";

const layer = parallax(bannerLayer, { speed: 0.35, axis: "y" });
const progress = scrollProgress({ onProgress: (p) => console.log(p) });
// On unmount: layer.destroy(); progress.destroy();`,
  },
  {
    id: "kpi-count-spring",
    name: "Animated KPI & Telemetry Metric",
    description:
      "Hardware-smoothed numeric counter using countUp() paired with exponential easing for dashboards.",
    category: "Data Visualization",
    difficulty: "Beginner",
    subpath: "af-motion",
    apis: ["countUp", "easings.easeOutExpo"],
    playgroundDemoId: "easing-explorer",
    code: `import { countUp, easings } from "af-motion";

const counter = countUp(metricEl, {
  from: 0,
  to: 98.4,
  decimals: 1,
  suffix: "%",
  duration: 900,
  easing: easings.easeOutExpo,
});`,
  },
  {
    id: "damped-spring-toggle",
    name: "Under-Damped Spring Detent",
    description:
      "Physical spring detent solver tracking continuous velocity and overshoot without fixed duration curves.",
    category: "Physics and Motion",
    difficulty: "Intermediate",
    subpath: "af-motion",
    apis: ["animateSpring"],
    playgroundDemoId: "spring-physics",
    code: `import { animateSpring } from "af-motion";

const spring = animateSpring({
  from: 0,
  to: 1,
  config: { stiffness: 240, damping: 16, mass: 1 },
  onUpdate: ({ position }) => {
    knobEl.style.transform = \`translate3d(\${position * 96}px, 0, 0)\`;
  },
});`,
  },
  {
    id: "gpu-aurora-backdrop",
    name: "GPU Aurora Procedural Canvas",
    description:
      "Canvas-based procedural aurora shader backdrop with explicit lifecycle destruction and reduced-motion static pose.",
    category: "3D Experiences",
    difficulty: "Advanced",
    subpath: "af-motion",
    apis: ["aurora", "particleField"],
    playgroundDemoId: "three-gpu-showcase",
    code: `import { aurora } from "af-motion";

const backdrop = aurora(canvasHost, {
  speed: 6,
  opacity: 0.7,
});
// On unmount: backdrop.destroy();`,
  },
  {
    id: "timeline-ai-choreography",
    name: "Synchronized Timeline + AI Quality Audit",
    description:
      "Three-step timeline composition paired with offline evaluateMotionQuality checks to guarantee 60fps safety.",
    category: "Advanced Compositions",
    difficulty: "Advanced",
    subpath: "af-motion/catalogue",
    apis: ["createTimeline", "evaluateMotionQuality"],
    playgroundDemoId: "timeline-choreography",
    code: `import { createTimeline, easings } from "af-motion";
import { evaluateMotionQuality } from "af-motion/catalogue";

const audit = evaluateMotionQuality({
  configuration: { duration: 480, easing: "easeOutExpo" },
});
const timeline = createTimeline()
  .add({ at: 0, target: nodeA, properties: { opacity: [0, 1] }, options: { duration: 300, easing: easings.easeOutCubic } })
  .add({ at: 120, target: nodeB, properties: { transform: ["scale(0.9)", "scale(1)"] }, options: { duration: 400 } });`,
  },
];
