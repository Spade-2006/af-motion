/**
 * AF Motion Documentation — Comprehensive Developer Content Store
 *
 * Authoritative, verified documentation matching the actual repository implementation:
 * - 4 official package subpaths: af-motion, af-motion/react, af-motion/catalogue, af-motion/presets
 * - 19 visual design styles & 33 built-in palettes
 * - 5 Motion DNA profiles & procedural scene recipes
 * - Core animation primitives: animate, animateProgress, animateSpring, animateInertia, createTimeline
 * - Effects: reveal, stagger, magnetic, tilt, parallax, drag, pinch, swipe, drawSVG, morphSVG
 * - Backgrounds & simulations: aurora, cosmicBackground, particleField, fluidBackground, geometricBackground
 * - 11 procedural 3D geometries & PBR materials
 * - Complete React 18/19 integration (hooks, lifecycle, strict mode, SSR, accessibility)
 * - Complete AI Ecosystem (Motion Intelligence, Design-to-Motion, Scene Generation, Agents, Orchestration)
 * - Export formats, performance optimization, accessibility, and troubleshooting
 */

import type { DocSection, DocArticle } from "../types/index.js";

export const DOC_SECTIONS: readonly DocSection[] = [
  // =========================================================================
  // 1. Getting Started
  // =========================================================================
  {
    id: "getting-started",
    title: "Getting Started",
    icon: "🚀",
    description: "Welcome to AF Motion: overview, installation, and first animations.",
    articles: [
      {
        id: "overview",
        sectionId: "getting-started",
        title: "Product Overview",
        description: "High-performance framework-independent motion engine with React bindings, 19 visual design styles, 33 built-in palettes, and an AI-native Motion Intelligence system.",
        slug: "overview",
        headings: [
          { id: "what-is-af-motion", text: "What is AF Motion?", level: 2 },
          { id: "core-pillars", text: "Core Architectural Pillars", level: 2 },
          { id: "package-subpaths", text: "Package Subpaths & Exports", level: 2 },
          { id: "system-compatibility", text: "System & Runtime Compatibility", level: 2 },
        ],
        tags: ["intro", "overview", "architecture", "subpaths"],
        content: `
AF Motion is a production-grade web motion toolkit designed for modern web applications and AI coding agents.

### What is AF Motion?
AF Motion bridges the gap between raw web animation performance and visual design personality. It combines a framework-independent core engine with first-class React 18/19 bindings, 19 visual styles, 33 built-in color palettes, 2D/3D graphics synchronization, and an AI-native Motion Intelligence system.

### Core Architectural Pillars
- **Framework-Independent DAG Architecture**: The core animation engine, procedural textures, and 3D scene engine operate without React or DOM dependencies.
- **Strict Tree-Shaking**: Modular subpath exports ensure that importing only core animation functions excludes heavy graphics shaders, Three.js adapters, and React components.
- **GPU Accelerated Transforms**: Animations enforce hardware acceleration by animating exclusively \`transform\` (matrix3d) and \`opacity\`.
- **AI-Native Model Context Protocol (MCP)**: Native stdio server interface allowing AI coding agents (Claude Code, Cursor, Codex, Google Antigravity) to inspect, configure, and validate motion compositions.
- **Built-in Visual Personalities**: 19 registered visual design styles and 33 immutable color palettes.

### Official Package Subpaths
Always import directly from official subpaths:
\`\`\`typescript
// 1. Core DOM Animation Primitives & Backgrounds
import { animate, animateSpring, easings, aurora, particleField, tilt } from "af-motion";

// 2. React Hooks & Components
import { useAnimate, useInView, Reveal, Interactive, useMicrointeraction, useMotionAccessibility } from "af-motion/react";

// 3. Intelligence, Registries & Validation
import { aiMotionRegistry, visualStyleRegistry, recommendAnimation, validateMotionConfig } from "af-motion/catalogue";

// 4. Standard Recipes & Presets
import { listPresets, applyPreset } from "af-motion/presets";
\`\`\`
`,
        relatedSlugs: ["installation", "quickstart"],
      },
      {
        id: "installation",
        sectionId: "getting-started",
        title: "Installation & Setup",
        description: "Installing AF Motion via npm, pnpm, or yarn, with TypeScript and Next.js App Router setup.",
        slug: "installation",
        headings: [
          { id: "install-package", text: "Package Installation", level: 2 },
          { id: "compatibility-matrix", text: "SDK Compatibility Matrix", level: 2 },
          { id: "peer-dependencies", text: "Peer Dependencies and Framework Independence", level: 2 },
          { id: "nextjs-setup", text: "Next.js App Router Setup", level: 2 },
          { id: "typescript-configuration", text: "TypeScript Configuration and ESM Resolution", level: 2 },
        ],
        tags: ["install", "setup", "npm", "nextjs", "typescript", "compatibility", "esm"],
        content: `
### Package Installation
Install AF Motion into your project using your preferred package manager:

\`\`\`bash
# npm
npm install af-motion

# pnpm
pnpm add af-motion

# yarn
yarn add af-motion
\`\`\`

### SDK Compatibility Matrix
AF Motion is tested and supported across modern evergreen runtimes and bundlers:

| Environment | Supported Versions | Notes |
| :--- | :--- | :--- |
| **Node.js** | \`>= 18.0.0\` | Pure ESM package (\`"type": "module"\`). Node 20 or 22 recommended. |
| **React** | \`^18.0.0 || ^19.0.0\` | Optional peer dependency for \`af-motion/react\`. Core is framework-free. |
| **Next.js** | \`>= 13.4.0\` | Full App Router & Pages Router support. Requires \`"use client";\`. |
| **Vite** | \`>= 4.0.0\` | First-class out-of-the-box ESM resolution and tree-shaking. |
| **TypeScript** | \`>= 5.0.0\` | Requires \`"moduleResolution": "bundler"\` or \`"node16"\`. |
| **Browsers** | Evergreen (Chrome 90+, Safari 15+, Firefox 90+, Edge 90+) | Requires WebGL2 for advanced 3D shaders; falls back cleanly to 2D Canvas. |

### Peer Dependencies and Framework Independence
- **Framework Independence**: The core library (\`af-motion\`), Intelligence system (\`af-motion/catalogue\`), and Presets (\`af-motion/presets\`) have zero runtime dependencies and do not require React or ReactDOM.
- **Optional React Peer Dependency**: \`react\` and \`react-dom\` (\`^18.0.0 || ^19.0.0\`) are optional peer dependencies. If you are developing with Vanilla JS, Svelte, Vue, or WebGL without React, you do not need to install React.

### Next.js App Router Setup
AF Motion React hooks and components rely on client-side lifecycle and browser animation frames. When using the Next.js App Router, always ensure client component boundaries by placing \`"use client";\` at the top of your component files:

\`\`\`tsx
"use client";

import { Reveal } from "af-motion/react";

export function HeroBanner() {
  return (
    <Reveal direction="up" distance={30} duration={600}>
      <h1>High-Performance Motion</h1>
    </Reveal>
  );
}
\`\`\`

### TypeScript Configuration
AF Motion ships with comprehensive type definitions for all subpaths. Ensure \`moduleResolution\` is set to \`"bundler"\` or \`"node16"\` in your \`tsconfig.json\`:

\`\`\`json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true
  }
}
\`\`\`
`,
        relatedSlugs: ["overview", "quickstart"],
      },
      {
        id: "quickstart",
        sectionId: "getting-started",
        title: "Quickstart Guide",
        description: "Your first animation in 60 seconds: vanilla DOM, spring physics, and React components.",
        slug: "quickstart",
        headings: [
          { id: "vanilla-dom-quickstart", text: "1. Vanilla DOM Animation", level: 2 },
          { id: "spring-physics-quickstart", text: "2. Natural Spring Physics", level: 2 },
          { id: "react-hook-quickstart", text: "3. React Hook & Component", level: 2 },
          { id: "first-effects-quickstart", text: "4. First Interactive Effects", level: 2 },
        ],
        tags: ["quickstart", "tutorial", "first-steps", "basics"],
        content: `
### 1. Vanilla DOM Animation
Animate any HTML element directly using the framework-independent \`animate\` function:

\`\`\`typescript
import { animate } from "af-motion";

const button = document.querySelector(".cta-button") as HTMLElement;

const controls = animate(
  button,
  {
    transform: ["scale(0.95) translateY(10px)", "scale(1) translateY(0px)"],
    opacity: [0, 1],
  },
  {
    duration: 500,
    easing: "cubic-bezier(0.16, 1, 0.3, 1)",
    fill: "forwards",
  }
);

// Playback controls
controls.pause();
controls.play();
await controls.finished;
console.log("Animation complete!");
\`\`\`

### 2. Natural Spring Physics
For physical, interruptible motion without hardcoded easing curves, use \`animateSpring\`:

\`\`\`typescript
import { animateSpring } from "af-motion";

const card = document.querySelector(".interactive-card") as HTMLElement;

const spring = animateSpring(
  card,
  {
    transform: { from: "scale(1)", to: "scale(1.05)" },
  },
  {
    stiffness: 260,
    damping: 20,
    mass: 1,
  }
);
\`\`\`

### 3. React Hook & Component
In React applications, use \`useAnimate\` for programmatic control or declarative wrappers like \`<Reveal>\`:

\`\`\`tsx
"use client";

import { useAnimate, Reveal } from "af-motion/react";

export function CardGrid() {
  const [scope, animate] = useAnimate();

  const handleHover = () => {
    animate(".badge", { opacity: 1, y: 0 }, { duration: 300 });
  };

  return (
    <div ref={scope} onMouseEnter={handleHover}>
      <Reveal direction="up" delay={150}>
        <div className="card">
          <span className="badge" style={{ opacity: 0, transform: "translateY(5px)" }}>
            Featured
          </span>
          <h3>Interactive Experience</h3>
        </div>
      </Reveal>
    </div>
  );
}
\`\`\`

### 4. First Interactive Effects
Add instant polish with pre-built effects like Magnetic, Tilt, and Stagger:

\`\`\`typescript
import { magnetic, tilt, stagger } from "af-motion";

// 1. Magnetic attraction on pointer hover
const magneticButton = document.querySelector(".magnetic-btn") as HTMLElement;
magnetic(magneticButton, { strength: 0.3, radius: 100 });

// 2. 3D Card Tilt with specular glare
const card = document.querySelector(".tilt-card") as HTMLElement;
tilt(card, { maxTilt: 15, perspective: 1000, glare: true });

// 3. Staggered list element entrance
const items = document.querySelectorAll(".menu-item");
stagger(items, {
  opacity: [0, 1],
  transform: ["translateY(20px)", "translateY(0px)"],
  staggerDelay: 60,
  easing: "cubic-bezier(0.16, 1, 0.3, 1)",
});
\`\`\`
`,
        relatedSlugs: ["core-animation", "react-hooks", "effects-interactions"],
      },
    ],
  },

  // =========================================================================
  // 2. Core Library Engine
  // =========================================================================
  {
    id: "core-library",
    title: "Core Animation Engine",
    icon: "⚡",
    description: "Framework-independent DOM animations, physics, easing curves, and background shaders.",
    articles: [
      {
        id: "core-animation",
        sectionId: "core-library",
        title: "Animation Engine & Primitives",
        description: "Comprehensive guide to animate, animateProgress, playback controls, and lifecycle management.",
        slug: "core-animation",
        interactiveType: "core-animation",
        headings: [
          { id: "animate-function", text: "The animate() Function", level: 2 },
          { id: "animate-progress", text: "Normalized Progress Animation", level: 2 },
          { id: "animation-controls", text: "Animation Controls & Playback", level: 2 },
          { id: "timing-options", text: "Timing & Interpolation Options", level: 2 },
          { id: "lifecycle-management", text: "Lifecycle, Cancellation & Cleanup", level: 2 },
        ],
        tags: ["core", "animate", "playback", "controls", "dom"],
        content: `
The AF Motion core engine powers hardware-accelerated animations directly via the browser's native Web Animations API (WAAPI) and optimized requestAnimationFrame fallback loops.

### The animate() Function
The primary animation primitive animates single elements, NodeLists, or CSS selector queries:

\`\`\`typescript
import { animate } from "af-motion";

const controls = animate(
  target, // HTMLElement | HTMLElement[] | string
  keyframes, // Record<string, string[] | number[]>
  options // DOMAnimationOptions
);
\`\`\`

#### Parameter Reference
- **target**: Target DOM element, array of elements, or valid CSS selector string.
- **keyframes**: Keyframe object defining property tracks. Only hardware-accelerated properties (\`transform\`, \`opacity\`, \`filter\`) should be animated.
- **options**: Configuration options:
  - \`duration\` (number): Total duration in milliseconds (default: \`300\`).
  - \`delay\` (number): Milliseconds to wait before starting (default: \`0\`).
  - \`easing\` (string): Easing curve identifier or cubic-bezier string (default: \`"cubic-bezier(0.16, 1, 0.3, 1)"\`).
  - \`repeat\` (number): Number of iterations or \`Infinity\` (default: \`1\`).
  - \`direction\` (string): \`"normal" | "reverse" | "alternate" | "alternate-reverse"\`.
  - \`fill\` (string): \`"none" | "forwards" | "backwards" | "both"\` (default: \`"forwards"\`).

### Normalized Progress Animation
For custom canvas, SVG, or shader drivers, use \`animateProgress\` to drive values from 0.0 to 1.0:

\`\`\`typescript
import { animateProgress } from "af-motion";

const progressControls = animateProgress(
  (progress) => {
    // progress is guaranteed between 0.0 and 1.0
    canvasContext.globalAlpha = progress;
    canvasContext.clearRect(0, 0, width, height);
    drawScene(progress);
  },
  {
    duration: 800,
    easing: "ease-out-cubic",
  }
);
\`\`\`

### Animation Controls & Playback
Every call to \`animate()\` returns an \`AnimationControls\` instance exposing complete playback orchestration:

\`\`\`typescript
const controls = animate(element, { opacity: [0, 1] }, { duration: 600 });

// Playback state inspection
console.log(controls.playState); // "running" | "paused" | "finished" | "idle"

// Playback commands
controls.pause();
controls.play();
controls.reverse();
controls.cancel();
controls.finish();

// Seeking to specific normalized time (0 to 1) or milliseconds
controls.seek(0.5); // Jump to 50% progress

// Await completion via Promise
await controls.finished;
console.log("Animation successfully completed!");
\`\`\`

### Lifecycle, Cancellation & Cleanup
Proper cleanup prevents memory leaks in Single Page Applications and React lifecycle unmounts:

\`\`\`typescript
// Always stop or cancel controls on component unmount
function cleanup() {
  controls.cancel();
}
\`\`\`
`,
        relatedSlugs: ["easings", "effects-interactions", "advanced-animation"],
      },
      {
        id: "easings",
        sectionId: "core-library",
        title: "56 Built-in Easings & Curves",
        description: "Authoritative reference for all standard, cubic, elastic, exponential, and spring curve functions.",
        slug: "easings",
        interactiveType: "easing-explorer",
        headings: [
          { id: "easing-architecture", text: "Easing Architecture", level: 2 },
          { id: "standard-curves", text: "Standard CSS Curves", level: 2 },
          { id: "power-exponential", text: "Power & Exponential Families", level: 2 },
          { id: "back-elastic-bounce", text: "Back, Elastic & Bounce Curves", level: 2 },
          { id: "custom-cubic-bezier", text: "Custom Cubic-Bezier Construction", level: 2 },
        ],
        tags: ["easings", "curves", "cubic-bezier", "springs", "timing"],
        content: `
AF Motion includes a mathematically calibrated catalogue of 56 easing curves, available as CSS cubic-bezier strings and direct JavaScript evaluation functions \`(t: number) => number\`.

### Easing Architecture
Access curves via the \`easings\` namespace in \`af-motion\`:

\`\`\`typescript
import { easings } from "af-motion";

// Use as CSS string in animation options:
animate(el, { opacity: [0, 1] }, { easing: easings.easeOutExpo });

// Or evaluate mathematically in canvas/WebGL loops:
const value = easings.functions.easeOutExpo(0.5); // Returns 0.96875
\`\`\`

### Standard CSS Curves
- \`easings.linear\`: \`cubic-bezier(0, 0, 1, 1)\`
- \`easings.ease\`: \`cubic-bezier(0.25, 0.1, 0.25, 1)\`
- \`easings.easeIn\`: \`cubic-bezier(0.42, 0, 1, 1)\`
- \`easings.easeOut\`: \`cubic-bezier(0, 0, 0.58, 1)\`
- \`easings.easeInOut\`: \`cubic-bezier(0.42, 0, 0.58, 1)\`

### Power & Exponential Families
Calibrated for UI responsiveness and perceived natural deceleration:
- **Quad**: \`easeInQuad\`, \`easeOutQuad\`, \`easeInOutQuad\` (Quadratic $t^2$)
- **Cubic**: \`easeInCubic\`, \`easeOutCubic\`, \`easeInOutCubic\` (Cubic $t^3$)
- **Quart**: \`easeInQuart\`, \`easeOutQuart\`, \`easeInOutQuart\` (Quartic $t^4$)
- **Quint**: \`easeInQuint\`, \`easeOutQuint\`, \`easeInOutQuint\` (Quintic $t^5$)
- **Expo**: \`easeInExpo\`, \`easeOutExpo\`, \`easeInOutExpo\` ($2^{10(t-1)}$)
- **Circ**: \`easeInCirc\`, \`easeOutCirc\`, \`easeInOutCirc\` (Circular quadrant)

### Back, Elastic & Bounce Curves
- **Back**: Overshoots destination before settling (\`easeOutBack\`, \`easeInOutBack\`).
- **Elastic**: Damped harmonic oscillation simulating elastic cords (\`easeOutElastic\`).
- **Bounce**: Rebounding physics simulation for gravity-affected impacts (\`easeOutBounce\`).

### Custom Cubic-Bezier Construction
Build custom Bézier curves with exact control points:

\`\`\`typescript
import { registerEasing, getEasing } from "af-motion";

registerEasing("smoothStep", (t) => t * t * (3 - 2 * t));
const progress = getEasing("smoothStep")?.(0.4);
\`\`\`
`,
        relatedSlugs: ["core-animation", "motion-dna"],
      },
      {
        id: "effects-interactions",
        sectionId: "core-library",
        title: "Effects & Interactive Primitives",
        description: "Comprehensive guide to Reveal, Stagger, Magnetic, Tilt, Parallax, Drag, Swipe, and Morphing.",
        slug: "effects-interactions",
        interactiveType: "effects-interactions",
        headings: [
          { id: "reveal-stagger", text: "1. Reveal & Stagger Effects", level: 2 },
          { id: "magnetic-tilt", text: "2. Magnetic & 3D Tilt", level: 2 },
          { id: "parallax-scroll", text: "3. Parallax & Scroll Triggers", level: 2 },
          { id: "gestures-pointer", text: "4. Gestures: Drag, Swipe & Pinch", level: 2 },
          { id: "svg-morphing", text: "5. SVG Path Morphing & Drawing", level: 2 },
        ],
        tags: ["effects", "reveal", "stagger", "magnetic", "tilt", "parallax", "gestures", "svg"],
        content: `
AF Motion provides high-performance, GPU-accelerated interaction primitives that require zero setup and respect system accessibility preferences.

### 1. Reveal & Stagger Effects
Entrance animations optimized for layout stability and smooth rendering:

\`\`\`typescript
import { reveal, stagger } from "af-motion";

// Single element reveal
const card = document.querySelector(".card") as HTMLElement;
reveal(card, {
  direction: "up", // "up" | "down" | "left" | "right" | "fade" | "scale"
  distance: 30,
  duration: 600,
  easing: "cubic-bezier(0.16, 1, 0.3, 1)",
});

// Staggered list entrance
const items = document.querySelectorAll(".list-item");
stagger(items, {
  transform: ["translateY(24px)", "translateY(0px)"],
  opacity: [0, 1],
  staggerDelay: 50,
  from: "start", // "start" | "center" | "end" | "edges" | "random"
});
\`\`\`

### 2. Magnetic & 3D Tilt
Tactile microinteractions reacting dynamically to pointer movement:

\`\`\`typescript
import { magnetic, tilt } from "af-motion";

// Magnetic attraction
const btn = document.querySelector(".magnetic-btn") as HTMLElement;
const magControls = magnetic(btn, {
  strength: 0.35,
  radius: 120,
  elasticity: 0.2,
});

// 3D tilt with specular sheen
const card = document.querySelector(".tilt-card") as HTMLElement;
const tiltControls = tilt(card, {
  maxTilt: 16,
  perspective: 1200,
  glare: true,
  scale: 1.04,
});
\`\`\`

### 3. Parallax & Scroll Triggers
Scroll-driven transforms synchronized with viewport displacement:

\`\`\`typescript
import { parallax, inView } from "af-motion";

// Scroll-linked parallax offset
const heroImage = document.querySelector(".hero-img") as HTMLElement;
parallax(heroImage, {
  speed: -0.2, // Negative for upward parallax
  axis: "y",
});

// Viewport intersection trigger
inView(".animate-on-scroll", ({ target }) => {
  animate(target, { opacity: [0, 1], transform: ["scale(0.9)", "scale(1)"] }, { duration: 500 });
});
\`\`\`

### 4. Gestures: Drag, Swipe & Pinch
Touch and pointer gestures with velocity momentum and boundary constraints:

\`\`\`typescript
import { drag, swipe } from "af-motion";

// Momentum drag
const sheet = document.querySelector(".bottom-sheet") as HTMLElement;
drag(sheet, {
  axis: "y",
  bounds: { top: 0, bottom: 400 },
  snapPoints: [0, 200, 400],
  onDragEnd: (pos) => console.log("Snapped to:", pos),
});

// Multi-directional swipe detection
swipe(document.body, {
  onSwipeLeft: () => navigateNext(),
  onSwipeRight: () => navigatePrev(),
  threshold: 50,
});
\`\`\`

### 5. SVG Path Morphing & Drawing
Hardware-accelerated vector transitions:

\`\`\`typescript
import { drawSVG, morphSVG } from "af-motion";

// Stroke drawing
const path = document.querySelector(".signature-path") as SVGPathElement;
drawSVG(path, { duration: 1200, easing: "cubic-bezier(0.16, 1, 0.3, 1)" });

// Shape morphing between identical command-count path strings
morphSVG(path, {
  to: "M10,10 L90,10 L90,90 L10,90 Z",
  duration: 600,
});
\`\`\`
`,
        relatedSlugs: ["core-animation", "advanced-animation", "react-components"],
      },
      {
        id: "advanced-animation",
        sectionId: "core-library",
        title: "Advanced Animation & Physics",
        description: "Spring physics, multi-track choreography, timelines, GPU particles, and Performance Intelligence.",
        slug: "advanced-animation",
        interactiveType: "spring-physics",
        headings: [
          { id: "spring-physics", text: "1. Spring & Inertia Physics", level: 2 },
          { id: "choreography-timelines", text: "2. Choreography & Multi-Track Timelines", level: 2 },
          { id: "gpu-particles-fluid", text: "3. GPU Particles & Fluid Shaders", level: 2 },
          { id: "performance-intelligence", text: "4. Performance Intelligence & Adaptive Tiers", level: 2 },
        ],
        tags: ["springs", "physics", "choreography", "timeline", "particles", "performance"],
        content: `
For complex applications, AF Motion delivers advanced choreography tools, mathematical physics simulation, and real-time performance tier adaptation.

### 1. Spring & Inertia Physics
Natural springs simulate physical mass, stiffness, and damping ratios:

\`\`\`typescript
import { animateSpring, animateInertia } from "af-motion";

// Spring animation
const spring = animateSpring(
  element,
  { transform: { from: "scale(0.8)", to: "scale(1)" } },
  {
    stiffness: 280, // Spring rigidity
    damping: 18,    // Oscillation resistance
    mass: 1,        // Element inertia
  }
);

// Kinetic inertia flick with decay friction
animateInertia(element, {
  velocity: 1500, // Pixels per second
  friction: 0.92,
  onUpdate: (val) => {
    element.style.transform = \`translateX(\${val}px)\`;
  },
});
\`\`\`

### 2. Choreography & Multi-Track Timelines
Orchestrate multi-element scenes with absolute or label-relative timing offsets:

\`\`\`typescript
import { createTimeline } from "af-motion";

const tl = createTimeline();

tl.add(".hero-heading", { opacity: [0, 1], y: [30, 0] }, { duration: 500 })
  .add(".hero-subtext", { opacity: [0, 1], y: [20, 0] }, { duration: 400 }, "-=200") // 200ms overlap
  .add(".cta-button", { scale: [0.9, 1], opacity: [0, 1] }, { duration: 350 }, "+=100");

tl.play();
\`\`\`

### 3. GPU Particles & Fluid Shaders
Offload heavy graphics to Canvas2D and WebGL shaders:

\`\`\`typescript
import { particleField, fluidBackground, aurora } from "af-motion";

// Ambient particle canvas
const canvas = document.querySelector("#bg-canvas") as HTMLCanvasElement;
const particles = particleField(canvas, {
  count: 120,
  speed: 0.5,
  color: "#6366f1",
  interactive: true,
});

// Ambient Aurora borealis shader
aurora(canvas, {
  colors: ["#4f46e5", "#06b6d4", "#ec4899"],
  speed: 0.8,
  amplitude: 1.2,
});
\`\`\`

### 4. Performance Intelligence & Adaptive Tiers
AF Motion monitors runtime frame rates, memory usage, and dropped frames, automatically scaling quality tiers (\`high\`, \`medium\`, \`low\`, \`minimal\`):

\`\`\`typescript
import { PerformanceIntelligenceCoordinator } from "af-motion/catalogue";

const coordinator = new PerformanceIntelligenceCoordinator();
coordinator.onTierChange((tier) => {
  console.log("Adaptive quality switched to:", tier);
  if (tier === "low") {
    particles.setQuality({ count: 40, blur: 0 });
  }
});
\`\`\`
`,
        relatedSlugs: ["core-animation", "easings", "graphics-3d"],
      },
      {
        id: "background-effects",
        sectionId: "core-library",
        title: "Background Effects & Textures",
        description: "Shader-driven aurora waves, cosmic fields, floating orbs, and procedural noise textures.",
        slug: "background-effects",
        headings: [
          { id: "aurora-waves", text: "Aurora Waves", level: 2 },
          { id: "particle-fields", text: "Particle Fields & Mesh", level: 2 },
          { id: "cosmic-background", text: "Cosmic & Starfield", level: 2 },
          { id: "procedural-grids", text: "Geometric & Perspective Grids", level: 2 },
        ],
        tags: ["backgrounds", "aurora", "particles", "cosmic", "grid", "shaders"],
        content: `
AF Motion features procedural background canvas renderers engineered for 60fps performance and zero bundle impact when unused.

### Aurora Waves
Multi-chromatic flowing gradient simulation:
\`\`\`typescript
import { aurora } from "af-motion";

const controls = aurora("#bg-canvas", {
  colors: ["#3b82f6", "#8b5cf6", "#ec4899"],
  speed: 1.0,
  intensity: 0.7,
});
\`\`\`

### Particle Fields & Mesh
Interactive particle points connected by proximity webbing:
\`\`\`typescript
import { particleField } from "af-motion";

const pControls = particleField("#particles", {
  count: 80,
  maxDistance: 120,
  connectionOpacity: 0.15,
  pointColor: "#ffffff",
});
\`\`\`

### Cosmic & Starfield
Hyperdrive warp stars and galactic nebulae:
\`\`\`typescript
import { cosmicBackground } from "af-motion";

cosmicBackground("#space-canvas", {
  starCount: 300,
  nebulaIntensity: 0.5,
  warpSpeed: 0.2,
});
\`\`\`

### Geometric & Perspective Grids
Retro-futuristic perspective planes and isometric grids:
\`\`\`typescript
import { geometricBackground } from "af-motion";

geometricBackground("#grid-canvas", {
  effect: "perspective-floor",
  lineColor: "#38bdf8",
  speed: 1.2,
});
\`\`\`
`,
        relatedSlugs: ["core-animation", "advanced-animation", "graphics-3d"],
      },
    ],
  },

  // =========================================================================
  // 3. React Animation Development
  // =========================================================================
  {
    id: "react-animation",
    title: "React Animation Development",
    icon: "⚛️",
    description: "Hooks, forwardRef components, SSR hydration, strict mode compatibility, and microinteractions.",
    articles: [
      {
        id: "react-hooks",
        sectionId: "react-animation",
        title: "React Hooks Reference",
        description: "Official hooks: useAnimate, useInView, useScrollProgress, useMicrointeraction, and useMotionAccessibility.",
        slug: "react-hooks",
        interactiveType: "react-demo",
        headings: [
          { id: "use-animate", text: "useAnimate()", level: 2 },
          { id: "use-in-view", text: "useInView()", level: 2 },
          { id: "use-scroll-progress", text: "useScrollProgress() & useScrollVelocity()", level: 2 },
          { id: "use-microinteraction", text: "useMicrointeraction()", level: 2 },
          { id: "use-motion-accessibility", text: "useMotionAccessibility()", level: 2 },
        ],
        tags: ["react", "hooks", "useAnimate", "useInView", "accessibility"],
        content: `
The \`af-motion/react\` subpath exports production-grade React hooks designed for React 18 Concurrent Mode and React 19.

### useAnimate()
Scoped DOM query animation hook providing full declarative control:

\`\`\`tsx
"use client";

import { useAnimate } from "af-motion/react";

export function HeroBanner() {
  const [scope, animate] = useAnimate();

  const handleTrigger = async () => {
    await animate("h1", { opacity: [0, 1], y: [20, 0] }, { duration: 400 });
    await animate("p", { opacity: [0, 1] }, { duration: 300 });
  };

  return (
    <div ref={scope}>
      <button onClick={handleTrigger}>Play Intro</button>
      <h1 style={{ opacity: 0 }}>AF Motion React</h1>
      <p style={{ opacity: 0 }}>High performance web animation.</p>
    </div>
  );
}
\`\`\`

### useInView()
Tracks element viewport visibility with customizable thresholds:

\`\`\`tsx
"use client";

import { useRef } from "react";
import { useInView } from "af-motion/react";

export function AnimatedCard() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, threshold: 0.3 });

  return (
    <div
      ref={ref}
      style={{
        opacity: isInView ? 1 : 0,
        transform: isInView ? "none" : "translateY(30px)",
        transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <h3>Appears when scrolled into view</h3>
    </div>
  );
}
\`\`\`

### useScrollProgress() & useScrollVelocity()
Tracks page or container scroll metrics:

\`\`\`tsx
"use client";

import { useScrollProgress, useScrollVelocity } from "af-motion/react";

export function ProgressBar() {
  const { progress } = useScrollProgress();
  const { velocity } = useScrollVelocity();

  return (
    <div
      className="progress-bar"
      style={{
        transform: \`scaleX(\${progress})\`,
        filter: \`blur(\${Math.min(Math.abs(velocity) * 2, 4)}px)\`,
      }}
    />
  );
}
\`\`\`

### useMicrointeraction()
Binds interactive micro-feedback (spring scale, ripple, magnetic) to button or card elements:

\`\`\`tsx
"use client";

import { useMicrointeraction } from "af-motion/react";

export function TactileButton() {
  const { ref, props } = useMicrointeraction({
    variant: "tactile-press",
    scale: 0.96,
  });

  return (
    <button ref={ref} {...props} className="btn-primary">
      Click Me
    </button>
  );
}
\`\`\`

### useMotionAccessibility()
Detects OS \`prefers-reduced-motion\` setting dynamically:

\`\`\`tsx
"use client";

import { useMotionAccessibility } from "af-motion/react";

export function SafeAnimation() {
  const { prefersReducedMotion } = useMotionAccessibility();

  return (
    <div
      style={{
        transition: prefersReducedMotion ? "none" : "transform 0.5s ease",
      }}
    >
      Accessibility compliant content
    </div>
  );
}
\`\`\`
`,
        relatedSlugs: ["react-components", "react-guide", "core-animation"],
      },
      {
        id: "react-components",
        sectionId: "react-animation",
        title: "React Component Library",
        description: "Declarative React wrappers: Reveal, AnimatedText, Interactive, and GlassSurface.",
        slug: "react-components",
        headings: [
          { id: "reveal-component", text: "<Reveal>", level: 2 },
          { id: "animated-text-component", text: "<AnimatedText>", level: 2 },
          { id: "interactive-component", text: "<Interactive>", level: 2 },
          { id: "glass-surface-component", text: "<GlassSurface>", level: 2 },
        ],
        tags: ["react", "components", "Reveal", "AnimatedText", "GlassSurface"],
        content: `
AF Motion includes declarative React components featuring automatic cleanup, Strict Mode support, and full forwardRef delegation.

### <Reveal>
Wraps children with viewport entrance animations:

\`\`\`tsx
"use client";

import { Reveal } from "af-motion/react";

export function FeatureSection() {
  return (
    <section>
      <Reveal direction="down" duration={500}>
        <h2>Our Platform</h2>
      </Reveal>
      <Reveal direction="up" delay={200} distance={40}>
        <p>Built from the ground up for extraordinary speed.</p>
      </Reveal>
    </section>
  );
}
\`\`\`

### <AnimatedText>
Typewriter, character stagger, and text reveal effects:

\`\`\`tsx
"use client";

import { AnimatedText } from "af-motion/react";

export function HeroTitle() {
  return (
    <AnimatedText
      text="Design at the speed of thought."
      variant="typewriter"
      speed={45}
      cursor={true}
    />
  );
}
\`\`\`

### <Interactive>
Declarative microinteraction wrapper:

\`\`\`tsx
"use client";

import { Interactive } from "af-motion/react";

export function ActionButton() {
  return (
    <Interactive type="magnetic" strength={0.4}>
      <button className="cta">Hover Me</button>
    </Interactive>
  );
}
\`\`\`

### <GlassSurface>
Hardware-accelerated frosted glass container using WebGL backdrop filters:

\`\`\`tsx
"use client";

import { GlassSurface } from "af-motion/react";

export function FloatingNav() {
  return (
    <GlassSurface blur={16} opacity={0.65} border={true}>
      <nav>Nav Items</nav>
    </GlassSurface>
  );
}
\`\`\`
`,
        relatedSlugs: ["react-hooks", "react-guide", "visual-styles"],
      },
      {
        id: "react-guide",
        sectionId: "react-animation",
        title: "React Integration & Lifecycle Guide",
        description: "Best practices for React 18/19, Strict Mode double-invocation, SSR hydration, and cleanup.",
        slug: "react-guide",
        headings: [
          { id: "strict-mode-safety", text: "React Strict Mode Double-Invocation", level: 2 },
          { id: "ssr-hydration-safety", text: "SSR & Hydration Guarantees", level: 2 },
          { id: "proper-cleanup", text: "Effect Cleanup Patterns", level: 2 },
          { id: "nextjs-remix", text: "Framework Guidelines (Next.js & Remix)", level: 2 },
        ],
        tags: ["react", "strict-mode", "ssr", "hydration", "nextjs"],
        content: `
Integrating animations with React requires careful handling of component mounting, hydration timing, and cleanup.

### React Strict Mode Double-Invocation
In React 18 and 19 development mode, effects are mounted, unmounted, and remounted immediately to detect side-effect bugs. AF Motion hooks handle this automatically by cleaning up Web Animation API handles in their effect teardowns:

\`\`\`tsx
"use client";

import { useEffect, useRef } from "react";
import { animate } from "af-motion";

export function CustomCard() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const controls = animate(ref.current, { opacity: [0, 1] }, { duration: 400 });

    // ALWAYS return cancellation cleanup:
    return () => controls.cancel();
  }, []);

  return <div ref={ref}>Card Content</div>;
}
\`\`\`

### SSR & Hydration Guarantees
All \`af-motion/react\` hooks and components guard against server-side rendering execution. Window, document, and navigator references are safely evaluated only inside \`useEffect\` or \`useLayoutEffect\` after client hydration completes.

### Framework Guidelines (Next.js & Remix)
- In **Next.js App Router**: Mark files importing from \`af-motion/react\` with \`"use client";\`.
- In **Next.js Pages Router**: Safe to import directly; animation code executes in \`useEffect\`.
- In **Remix / React Router**: Ensure DOM references are guarded before triggering animations.
`,
        relatedSlugs: ["react-hooks", "react-components", "troubleshooting"],
      },
    ],
  },

  // =========================================================================
  // 4. Visual Design Intelligence & DNA
  // =========================================================================
  {
    id: "visual-design",
    title: "Visual Design Intelligence",
    icon: "🎨",
    description: "19 visual design styles, 33 built-in palettes, and 5 Motion DNA profiles.",
    articles: [
      {
        id: "visual-styles",
        sectionId: "visual-design",
        title: "19 Visual Design Styles",
        description: "Complete catalogue of all 19 visual design styles: Skeuomorphism, Neumorphism, Vaporwave, and more.",
        slug: "visual-styles",
        headings: [
          { id: "styles-overview", text: "Visual Style Registry", level: 2 },
          { id: "tactile-materials", text: "Tactile & Material Styles", level: 2 },
          { id: "modernist-historical", text: "Modernist & Historical Movements", level: 2 },
          { id: "retro-digital", text: "Retro, Cyber & Digital Aesthetics", level: 2 },
          { id: "using-styles", text: "Applying Styles in Code", level: 2 },
        ],
        tags: ["styles", "skeuomorphism", "neumorphism", "vaporwave", "design"],
        content: `
AF Motion features a registry of 19 curated visual design styles, complete with shader properties, lighting configurations, and synchronized motion tokens:

### 19 Visual Design Styles
1. **Skeuomorphism**: Realistic physical surfaces, specular bevels, leather, brushed metal, and tactile depth.
2. **Neumorphism**: Soft extruded debossed surfaces with ambient dual-source drop shadows.
3. **Art Nouveau**: Elegant organic curves, whiplash flourishes, and floral geometry.
4. **Liquid Chrome**: Metallic fluid shaders with reflective chromatic distortions.
5. **De Stijl**: Strict primary red/blue/yellow palettes, black orthographic grid lines, and asymmetric rectangles.
6. **Memphis**: Playful 1980s geometric confetti, squiggles, pastel color blocks, and bold borders.
7. **Psychedelic**: Trippy fractal color swirls, moire patterns, and vibrant fluid warps.
8. **Vaporwave**: Nostalgic 1990s retro aesthetics, cyan/magenta gradients, statue busts, and wireframe grids.
9. **Steampunk**: Victorian clockwork gears, brass rivets, copper pipes, and sepia warmth.
10. **Grunge**: Distressed textures, halftone print artifacts, spray paint stencils, and torn paper edges.
11. **Paper Cutout**: Multi-layered paper silhouettes with realistic ambient drop shadows.
12. **Glitch**: Digital signal corruption, RGB channel splits, scanlines, and pixel displacement.
13. **Anti-Design**: Deliberately chaotic layouts, raw system typography, high contrast, and brutalist clashes.
14. **3D Inflated**: Glossy bulbous balloon shapes with squishy physics deformations.
15. **Isometric**: Precise 30-degree orthographic angle geometry, clean vectors, and isometric grids.
16. **Ukiyo-e**: Japanese woodblock print textures, traditional sumi ink strokes, and wave patterns.
17. **Brutalism**: Raw unfinished concrete surfaces, monospace type, stark monochrome blocks, and high density.
18. **Bauhaus**: Primary geometry (circles, squares, triangles), functional typography, and primary color blocks.
19. **Mid-Century Modern**: Organic clean curves, tapered furniture legs, atomic age stars, and warm earthy tones.

### Applying Styles in Code
Query and apply styles via \`visualStyleRegistry\` from \`af-motion/catalogue\`:

\`\`\`typescript
import { visualStyleRegistry } from "af-motion/catalogue";

const style = visualStyleRegistry.get("vaporwave");
console.log(style.palette);       // Cyan/Magenta tokens
console.log(style.motionDefaults); // Spring & easing characteristics
\`\`\`
`,
        relatedSlugs: ["palettes", "motion-dna"],
      },
      {
        id: "palettes",
        sectionId: "visual-design",
        title: "33 Built-in Color Palettes",
        description: "Authoritative hex reference for all 33 built-in palettes, token bindings, and custom palette creation.",
        slug: "palettes",
        interactiveType: "palette-explorer",
        headings: [
          { id: "palettes-overview", text: "Built-in Palettes Overview", level: 2 },
          { id: "hex-definitions", text: "Authoritative Palette Tokens", level: 2 },
          { id: "activating-palettes", text: "Activating Palettes & CSS Variables", level: 2 },
          { id: "custom-palettes", text: "Registering Custom Palettes", level: 2 },
        ],
        tags: ["palettes", "colors", "tokens", "css-variables", "themes"],
        content: `
AF Motion includes exactly 33 professionally balanced color palettes. Each palette provides primary, secondary, accent, background, and surface color tokens.

### Authoritative Palette Tokens (Sample Reference)
- **Cobalt Classic**: Primary: \`#111111\`, Secondary: \`#FFFFFF\`, Accent: \`#0047AB\`, Background: \`#F4F6F9\`
- **Crimson Minimal**: Primary: \`#0D0D0D\`, Secondary: \`#FAFAFA\`, Accent: \`#E63946\`, Background: \`#121212\`
- **Neon Cyberpunk**: Primary: \`#0A0A12\`, Secondary: \`#00F0FF\`, Accent: \`#FF003C\`, Background: \`#05050A\`
- **Emerald Luxury**: Primary: \`#0F201B\`, Secondary: \`#D4AF37\`, Accent: \`#50C878\`, Background: \`#08120F\`
- **Obsidian Dark**: Primary: \`#1A1A1A\`, Secondary: \`#888888\`, Accent: \`#6366F1\`, Background: \`#000000\`

*(All 33 built-in palettes are immutable and verified without drift).*

### Activating Palettes & CSS Variables
Activate a palette globally to generate CSS variables on document root:

\`\`\`typescript
import { activatePalette } from "af-motion";

activatePalette("neon-cyberpunk");
// Sets:
// --af-color-primary: #0A0A12
// --af-color-secondary: #00F0FF
// --af-color-accent: #FF003C
// --af-color-background: #05050A
\`\`\`

### Registering Custom Palettes
Add your brand or project-specific palettes dynamically:

\`\`\`typescript
import { registerPalette } from "af-motion";

registerPalette({
  name: "My Brand Palette",
  primary: "#1e293b",
  secondary: "#f8fafc",
  accent: "#38bdf8",
  overrides: {
    background: "#0f172a",
    surface: "#1e293b",
  },
});
\`\`\`
`,
        relatedSlugs: ["visual-styles", "motion-dna"],
      },
      {
        id: "motion-dna",
        sectionId: "visual-design",
        title: "Motion DNA Profiles",
        description: "The 5 core Motion DNA personalities: precise, playful, elegant, energetic, and editorial-flow.",
        slug: "motion-dna",
        interactiveType: "motion-dna",
        headings: [
          { id: "motion-dna-concept", text: "What is Motion DNA?", level: 2 },
          { id: "five-personalities", text: "The 5 Core Personalities", level: 2 },
          { id: "applying-motion-dna", text: "Applying Motion DNA to Elements", level: 2 },
        ],
        tags: ["motion-dna", "personalities", "timing", "springs", "design-system"],
        content: `
Motion DNA defines the kinetic personality of an application. It provides calibrated durations, easing curves, and spring damping ratios across 5 personalities:

### The 5 Core Personalities
1. **Precise**:
   - *Character*: Utilitarian, crisp, highly responsive.
   - *Duration*: 150ms – 250ms.
   - *Spring*: High stiffness (350), critical damping (30), zero overshoot.
   - *Best For*: B2B SaaS, data grids, toolbars, developer tools.

2. **Playful**:
   - *Character*: Bouncy, lively, delightful.
   - *Duration*: 350ms – 500ms.
   - *Spring*: Moderate stiffness (220), under-damped (14), noticeable bounce.
   - *Best For*: Consumer apps, social platforms, gaming interfaces, onboarding.

3. **Elegant**:
   - *Character*: Luxurious, smooth, gradual deceleration.
   - *Duration*: 600ms – 900ms.
   - *Easing*: Deep exponential curves (\`cubic-bezier(0.16, 1, 0.3, 1)\`).
   - *Best For*: Fashion, luxury ecommerce, architectural portfolios, editorial showcases.

4. **Energetic**:
   - *Character*: Punchy, rapid attack, high momentum.
   - *Duration*: 200ms – 300ms.
   - *Spring*: Stiff (320), low damping (16), aggressive snap.
   - *Best For*: Fitness apps, esports, creative agencies, music players.

5. **Editorial-Flow**:
   - *Character*: Thoughtful, literary, synchronized with typography.
   - *Duration*: 500ms – 800ms.
   - *Easing*: Gentle cubic easing, staggered text lines.
   - *Best For*: Publishing, long-form journalism, blogs, creative documentation.

### Applying Motion DNA in Code
\`\`\`typescript
import { applyMotionDNA } from "af-motion";

const button = document.querySelector(".action-btn") as HTMLElement;
applyMotionDNA(button, "playful");
\`\`\`
`,
        relatedSlugs: ["visual-styles", "palettes"],
      },
    ],
  },

  // =========================================================================
  // 5. Motion Intelligence & Composition
  // =========================================================================
  {
    id: "motion-intelligence",
    title: "Motion Intelligence",
    icon: "🧠",
    description: "Motion intent classification, quality scoring, recommendations, and composition graphs.",
    articles: [
      {
        id: "intelligence-overview",
        sectionId: "motion-intelligence",
        title: "Motion Intelligence Engine",
        description: "Deterministic analysis of animation quality, spring physics, and WCAG accessibility compliance.",
        slug: "intelligence-overview",
        headings: [
          { id: "intelligence-architecture", text: "Architecture & Philosophy", level: 2 },
          { id: "quality-evaluation", text: "Multi-Dimensional Quality Scoring", level: 2 },
          { id: "actionable-recommendations", text: "Actionable Recommendations", level: 2 },
        ],
        tags: ["intelligence", "scoring", "audit", "recommendations"],
        content: `
AF Motion includes an AI-native Motion Intelligence system that evaluates animation configurations without requiring external LLM APIs.

### Architecture & Philosophy
- **Deterministic & Offline**: Operates via mathematical rule evaluation, heuristics, and physics telemetry.
- **Multi-Dimensional Quality Scoring (0–100)**: Evaluates smoothness, responsiveness, aesthetic appeal, and natural physics.
- **WCAG 2.2.2 Compliance**: Audits motion durations, flashing risks, and prefers-reduced-motion fallbacks.

### Multi-Dimensional Quality Scoring
\`\`\`typescript
import { evaluateMotionQuality } from "af-motion/catalogue";

const report = evaluateMotionQuality({
  configuration: {
    duration: 1200, // Too long for microinteraction
    easing: "linear",
  },
  intent: "button-click",
});

console.log(report.scores.overall);       // e.g. 54/100
console.log(report.scores.responsiveness); // Low score due to 1200ms duration
\`\`\`

### Actionable Recommendations
\`\`\`typescript
import { generateMotionRecommendations } from "af-motion/catalogue";

const recs = generateMotionRecommendations(report.findings);
recs.forEach((r) => console.log(\`[\${r.priority}] \${r.title}: \${r.summary}\`));
\`\`\`
`,
        relatedSlugs: ["choreography", "ai-ecosystem"],
      },
      {
        id: "choreography",
        sectionId: "motion-intelligence",
        title: "Multi-Track Choreography",
        description: "Composition graphs, parent-child hierarchies, track synchronization, and acyclicity guarantees.",
        slug: "choreography",
        headings: [
          { id: "composition-graphs", text: "Composition Graphs & Nodes", level: 2 },
          { id: "dag-acyclicity", text: "DAG Acyclicity Guarantees", level: 2 },
          { id: "track-synchronization", text: "Track Synchronization", level: 2 },
        ],
        tags: ["choreography", "composition", "dag", "timeline", "graphs"],
        content: `
The composition engine enables multi-element, multi-system coordination.

### Composition Graphs & Nodes
A \`MotionComposition\` represents a tree of animated elements and effects:
\`\`\`typescript
import { createComposition, addCompositionNode } from "af-motion/catalogue";

const comp = createComposition("hero-scene", { motionDNA: "elegant" });
addCompositionNode(comp, {
  id: "node-1",
  name: "Hero Title",
  type: "element",
  timing: { duration: 600, delay: 100 },
});
\`\`\`

### DAG Acyclicity Guarantees
AF Motion validates that all composition dependencies form a strict Directed Acyclic Graph (DAG), preventing infinite dependency loops.
`,
        relatedSlugs: ["intelligence-overview", "core-animation"],
      },
    ],
  },

  // =========================================================================
  // 6. Graphics & 3D Engine
  // =========================================================================
  {
    id: "graphics-3d",
    title: "Graphics & 3D Scene Engine",
    icon: "🌐",
    description: "11 procedural 3D geometries, PBR surface shaders, lighting, and camera motion.",
    articles: [
      {
        id: "3d-engine",
        sectionId: "graphics-3d",
        title: "3D Scene Engine & Geometries",
        description: "Creating procedural 3D scenes with spheres, toruses, icosahedrons, and mobius strips.",
        slug: "3d-engine",
        headings: [
          { id: "scene-creation", text: "Creating a 3D Scene", level: 2 },
          { id: "procedural-geometries", text: "11 Procedural Geometries", level: 2 },
          { id: "scene-lighting-camera", text: "Camera & Lighting Control", level: 2 },
        ],
        tags: ["3d", "geometries", "webgl", "camera", "scene"],
        content: `
AF Motion includes a lightweight, modular 3D scene engine that coordinates procedural geometry with DOM animations.

### Creating a 3D Scene
\`\`\`typescript
import { createScene3D } from "af-motion/catalogue";

const scene = createScene3D({
  canvas: document.querySelector("#webgl-canvas") as HTMLCanvasElement,
  camera: { type: "perspective", fov: 60, position: [0, 0, 5] },
});
\`\`\`

### 11 Procedural Geometries
Built-in parametric mesh generators:
1. **Cube / Box**: Textured rectangular prisms.
2. **Sphere**: UV and icosphere tessellations.
3. **Cylinder & Cone**: Capped and open cylindrical volumes.
4. **Torus**: Donut rings with variable tube radii.
5. **Torus Knot**: Complex 3D mathematical knots (p=2, q=3).
6. **Icosahedron**: 20-sided geodesic regular polyhedron.
7. **Dodecahedron**: 12-sided pentagonal polyhedron.
8. **Plane / Grid**: Deformable terrain plane.
9. **Mobius Strip**: Non-orientable single-sided surface.
10. **Klein Bottle**: Self-intersecting 4D topological projection.
11. **Superellipsoid**: Rounded organic box-sphere hybrids.
`,
        relatedSlugs: ["pbr-materials", "background-effects"],
      },
      {
        id: "pbr-materials",
        sectionId: "graphics-3d",
        title: "PBR Materials & Surface Intelligence",
        description: "Metallic roughness, transmission, glass refractions, and procedural noise shaders.",
        slug: "pbr-materials",
        headings: [
          { id: "pbr-models", text: "Physically-Based Rendering (PBR)", level: 2 },
          { id: "glass-refraction", text: "Glass & Transmission Shaders", level: 2 },
        ],
        tags: ["pbr", "materials", "glass", "shaders", "lighting"],
        content: `
High-fidelity surface materials calibrated for real-time WebGL rendering:

### Physically-Based Rendering (PBR)
Configure realistic surfaces using standard metallic-roughness models:
\`\`\`typescript
import { getMaterial3DPreset, validateMaterial3D } from "af-motion/catalogue";

const chromePreset = getMaterial3DPreset("chrome");
const metalValidation = validateMaterial3D({ ...chromePreset, roughness: 0.15, metalness: 0.95 });
\`\`\`
`,
        relatedSlugs: ["3d-engine", "visual-styles"],
      },
    ],
  },

  // =========================================================================
  // 7. AI Agent Ecosystem & MCP
  // =========================================================================
  {
    id: "ai-infrastructure",
    title: "AI Agent Ecosystem & MCP",
    icon: "🤖",
    description: "AI Ecosystem integration, Design-to-Motion, Scene Generation, Agent Workflows, and MCP Server.",
    articles: [
      {
        id: "ai-ecosystem",
        sectionId: "ai-infrastructure",
        title: "AI Ecosystem & Multi-Agent Orchestration",
        description: "Unified AI capability registry, deterministic local provider, end-to-end pipeline scenarios, and quality gates.",
        slug: "ai-ecosystem",
        interactiveType: "ai-demonstration",
        headings: [
          { id: "ecosystem-overview", text: "Ecosystem Architecture", level: 2 },
          { id: "unified-capabilities", text: "12 Unified AI Capabilities", level: 2 },
          { id: "deterministic-provider", text: "Hardened Deterministic Local Provider", level: 2 },
          { id: "end-to-end-pipeline", text: "4 End-to-End Execution Scenarios", level: 2 },
        ],
        tags: ["ai-ecosystem", "agents", "orchestration", "capabilities", "pipelines"],
        content: `
AF Motion provides a unified, deterministic AI ecosystem uniting motion intelligence, design synthesis, scene creation, and collaborative agent squads.

> **Offline & Deterministic Guarantee**: The built-in AI ecosystem operates entirely locally without external LLM dependencies, API keys, or cloud network latency.

### 12 Unified AI Capabilities
1. \`motion-analysis\`: Evaluates spring stiffness, damping ratios, and easing curves.
2. \`quality-evaluation\`: Multi-dimensional quality scoring (0–100).
3. \`motion-recommendations\`: Generates evidence-based optimization recommendations.
4. \`design-to-motion-generation\`: Transforms design specs into animation compositions.
5. \`scene-generation\`: Generates complete multi-system 3D/physics/particle scenes.
6. \`performance-analysis\`: Frame rate, memory footprint, and dropped frame audits.
7. \`accessibility-analysis\`: WCAG 2.2.2 motion guidelines and prefers-reduced-motion verification.
8. \`composition-validation\`: Verifies track timing and DAG acyclicity.
9. \`agent-workflows\`: Multi-step goal execution using safe tool approval boundaries.
10. \`multi-agent-orchestration\`: Orchestrates specialized agent squads across parallel waves.
11. \`conflict-resolution\`: Deterministic conflict resolution for competing motion properties.
12. \`export-generation\`: Multi-target code export (React TSX, Vanilla TS, Composition JSON).

### 4 End-to-End Execution Scenarios
\`\`\`typescript
import { executeAIEcosystemPipeline } from "af-motion/catalogue";

// Scenario A: Design-to-Motion Generation
const d2mResponse = await executeAIEcosystemPipeline({
  scenario: "design-to-motion",
  goal: "Create an elegant modal dialog with smooth spring scale",
  options: { motionDNA: "elegant", paletteId: "neon-cyberpunk" },
});

// Scenario B: Scene Generation
const sceneResponse = await executeAIEcosystemPipeline({
  scenario: "scene-generation",
  goal: "Generate a hero section with floating cards and particles",
  options: { motionDNA: "playful" },
});

// Scenario C: Multi-Agent Collaboration
const collabResponse = await executeAIEcosystemPipeline({
  scenario: "multi-agent-collaboration",
  goal: "Design and optimize a complete dashboard animation system",
  options: { strategy: "collaborative" },
});

// Scenario D: Quality Audit
const auditResponse = await executeAIEcosystemPipeline({
  scenario: "quality-audit",
  goal: "Audit microinteraction spring smoothness and a11y compliance",
});
\`\`\`
`,
        relatedSlugs: ["design-to-motion", "scene-generation", "agent-workflows", "mcp-server"],
      },
      {
        id: "design-to-motion",
        sectionId: "ai-infrastructure",
        title: "AI Design-to-Motion Generation",
        description: "Transforming design briefs, tokens, and specifications into production-ready animation code.",
        slug: "design-to-motion",
        headings: [
          { id: "d2m-pipeline", text: "Design-to-Motion Pipeline", level: 2 },
          { id: "natural-language-input", text: "Natural-Language Input", level: 2 },
          { id: "export-artifacts", text: "Generated Export Artifacts", level: 2 },
        ],
        tags: ["design-to-motion", "generation", "tokens", "artifacts"],
        content: `
The Design-to-Motion engine transforms structured specifications and natural-language prompts into verified compositions.

### Design-to-Motion Pipeline
\`\`\`typescript
import { designToMotionEngine } from "af-motion/catalogue";

const result = await designToMotionEngine.generate({
  naturalLanguage: "Create an elegant toast notification with slide-in entrance",
  tokens: {
    paletteName: "neon-cyberpunk",
    motionDNA: "precise",
  },
});

console.log(result.plan);           // Structured MotionPlan
console.log(result.composition);    // Validated MotionComposition
console.log(result.exportArtifacts);// React code, Vanilla TS, CSS tokens
\`\`\`
`,
        relatedSlugs: ["ai-ecosystem", "scene-generation"],
      },
      {
        id: "scene-generation",
        sectionId: "ai-infrastructure",
        title: "AI Scene & Animation Generation",
        description: "Generating complete multi-object, 3D, physics, and particle scenes from prompt specifications.",
        slug: "scene-generation",
        headings: [
          { id: "scene-gen-workflow", text: "Scene Generation Workflow", level: 2 },
          { id: "scene-categories", text: "Supported Scene Categories", level: 2 },
        ],
        tags: ["scene-generation", "3d", "physics", "particles"],
        content: `
Generates full multi-layer scenes incorporating 3D models, particle systems, physics simulation, and DOM choreography:

\`\`\`typescript
import { aiSceneGenerationEngine } from "af-motion/catalogue";

const scene = await aiSceneGenerationEngine.generate({
  naturalLanguage: {
    prompt: "Futuristic hero banner with rotating wireframe sphere and particle dust",
    categoryHint: "hero",
    targetDNA: "energetic",
  },
});
\`\`\`
`,
        relatedSlugs: ["ai-ecosystem", "design-to-motion", "3d-engine"],
      },
      {
        id: "agent-workflows",
        sectionId: "ai-infrastructure",
        title: "Intelligent Agents & Safe Tools",
        description: "Specialized AI agents, the Safe Tool Registry, human approval gates, and multi-agent orchestration.",
        slug: "agent-workflows",
        headings: [
          { id: "specialized-squad", text: "The Specialized Agent Squad", level: 2 },
          { id: "safe-tool-registry", text: "Safe Tool Registry & Permissions", level: 2 },
          { id: "multi-agent-orchestrator", text: "Multi-Agent Orchestrator", level: 2 },
        ],
        tags: ["agents", "tools", "permissions", "orchestration"],
        content: `
AF Motion includes 6 specialized agents coordinated by the multi-agent orchestrator:
1. \`agent-motion-intelligence\`: Evaluates visual appeal, natural physics, and rhythm.
2. \`agent-design-to-motion\`: Generates element plans, tokens, and compositions.
3. \`agent-scene-generation\`: Synthesizes 3D environments, particles, and lighting.
4. \`agent-performance-optimization\`: Analyzes FPS, frame drops, and memory footprint.
5. \`agent-accessibility\`: Verifies WCAG 2.2.2 motion guidelines and reduced motion.
6. \`agent-composition\`: Guarantees DAG acyclicity and timeline synchronization.

### Safe Tool Registry
All tool executions are validated against strict schema and permission boundaries (\`read\`, \`generate\`, \`validate\`, \`optimize\`):

\`\`\`typescript
import { safeToolRegistry } from "af-motion/catalogue";

const result = await safeToolRegistry.invoke("inspect_accessibility", {
  durationMs: 400,
  reducedMotionFallback: true,
});
\`\`\`
`,
        relatedSlugs: ["ai-ecosystem", "mcp-server"],
      },
      {
        id: "mcp-server",
        sectionId: "ai-infrastructure",
        title: "Model Context Protocol (MCP) Server",
        description: "Connecting AI coding agents to AF Motion via Model Context Protocol stdio tools and resources.",
        slug: "mcp-server",
        headings: [
          { id: "mcp-overview", text: "What is the MCP Server?", level: 2 },
          { id: "mcp-tools", text: "Exposed MCP Tools", level: 2 },
          { id: "mcp-resources", text: "MCP Resources & Prompts", level: 2 },
          { id: "connecting-agents", text: "Connecting Cursor, Claude Code & Antigravity", level: 2 },
        ],
        tags: ["mcp", "ai", "tools", "cursor", "claude-code", "antigravity"],
        content: `
AF Motion includes a built-in Model Context Protocol (MCP) server at \`bin/mcp-server.js\`.

### Exposed MCP Tools
- \`recommend_animation\`: Provides motion recommendations for an element.
- \`validate_motion_config\`: Audits animation configurations for performance and syntax.
- \`get_visual_style\`: Returns tokens and presets for any of the 19 visual styles.
- \`get_palette\`: Returns exact hex definitions for any of the 33 palettes.
- \`execute_ai_scenario\`: Executes end-to-end design, scene, or audit pipelines.
`,
        relatedSlugs: ["ai-ecosystem", "agent-skills"],
      },
      {
        id: "agent-skills",
        sectionId: "ai-infrastructure",
        title: "Agent Skills & Instructions",
        description: "Agent instruction manuals, skills/ directory routing, and deterministic workflows.",
        slug: "agent-skills",
        headings: [
          { id: "skills-directory", text: "The skills/ Architecture", level: 2 },
          { id: "deterministic-workflow", text: "The 10-Step Deterministic Agent Workflow", level: 2 },
        ],
        tags: ["skills", "agents", "instructions", "workflow"],
        content: `
AI agents operating in AF Motion reference the \`skills/\` directory:
- Master Router: \`skills/af-motion/SKILL.md\`
- React Animation: \`skills/react-animation/SKILL.md\`
- Motion Intelligence: \`skills/motion-intelligence/SKILL.md\`
- Visual Styles: \`skills/visual-styles/SKILL.md\`
`,
        relatedSlugs: ["mcp-server", "ai-ecosystem"],
      },
      {
        id: "agent-integrations",
        sectionId: "ai-infrastructure",
        title: "Coding Agent Integrations",
        description: "Configuring Claude Code, Cursor, GitHub Copilot, and Google Antigravity.",
        slug: "agent-integrations",
        headings: [
          { id: "cursor-config", text: "Cursor Configuration", level: 2 },
          { id: "claude-code-config", text: "Claude Code Configuration", level: 2 },
        ],
        tags: ["cursor", "claude-code", "copilot", "antigravity"],
        content: `
### Cursor Configuration
Add to \`.cursor/mcp.json\`:
\`\`\`json
{
  "mcpServers": {
    "af-motion": {
      "command": "node",
      "args": ["bin/mcp-server.js"]
    }
  }
}
\`\`\`
`,
        relatedSlugs: ["mcp-server", "agent-skills"],
      },
    ],
  },

  // =========================================================================
  // 8. AF Motion Studio Suite
  // =========================================================================
  {
    id: "studio-modules",
    title: "AF Motion Studio",
    icon: "🎛️",
    description: "Internal visual development environment for testing, previewing, and configuring animations.",
    articles: [
      {
        id: "studio-overview",
        sectionId: "studio-modules",
        title: "AF Motion Studio Suite",
        description: "Tour of the internal Studio modules: Playground, 3D Studio, Physics Studio, and Simulations.",
        slug: "studio-overview",
        headings: [
          { id: "studio-role", text: "Role of AF Motion Studio", level: 2 },
          { id: "studio-modules-list", text: "Studio Tooling Modules", level: 2 },
        ],
        tags: ["studio", "playground", "physics", "3d", "visual-tools"],
        content: `
AF Motion Studio is an internal visual development environment under \`studio/\`.

### Studio Tooling Modules
- **Animation Playground**: Interactive live parameter tweaking for DOM animations.
- **Visual Style Explorer**: Live preview of all 19 visual styles and 33 palettes.
- **3D Scene Studio**: WebGL procedural geometry editor with PBR lighting controls.
- **Motion Physics Studio**: Spring stiffness, damping, and collision visualizer.
- **GPU Particles & Simulations Studio**: WebGL fluid and particle configuration.
`,
        relatedSlugs: ["verified-examples", "performance-guide"],
      },
    ],
  },

  // =========================================================================
  // 9. Practical Examples & Recipes
  // =========================================================================
  {
    id: "examples",
    title: "Practical Examples",
    icon: "💡",
    description: "10 verified, compiling code recipes for common web animation use cases.",
    articles: [
      {
        id: "verified-examples",
        sectionId: "examples",
        title: "10 Verified Code Recipes",
        description: "Copy-pasteable production examples: modals, tooltips, cards, menus, and scroll stories.",
        slug: "verified-examples",
        interactiveType: "verified-recipes",
        headings: [
          { id: "recipe-1", text: "1. Core DOM Animation", level: 2 },
          { id: "recipe-2", text: "2. React Component Reveal", level: 2 },
          { id: "recipe-3", text: "3. Tactile Button Microinteraction", level: 2 },
          { id: "recipe-4", text: "4. Staggered Grid Entrance", level: 2 },
          { id: "recipe-5", text: "5. 3D Tilt Card with Glare", level: 2 },
          { id: "recipe-6", text: "6. Interactive Particle Canvas", level: 2 },
          { id: "recipe-7", text: "7. Scroll-Linked Progress & Velocity", level: 2 },
          { id: "recipe-8", text: "8. AI Motion Quality Audit", level: 2 },
          { id: "recipe-9", text: "9. Design-to-Motion Generation", level: 2 },
          { id: "recipe-10", text: "10. End-to-End AI Ecosystem Pipeline", level: 2 },
        ],
        tags: ["examples", "recipes", "code", "react", "vanilla"],
        content: `
Production-ready code recipes covering all AF Motion subpaths:

### 1. Core DOM Animation
\`\`\`typescript
import { animate } from "af-motion";

const el = document.querySelector(".box") as HTMLElement;
animate(el, { opacity: [0, 1], transform: ["scale(0.9)", "scale(1)"] }, { duration: 400 });
\`\`\`

### 2. React Component Reveal
\`\`\`tsx
"use client";

import { Reveal } from "af-motion/react";

export function Hero() {
  return (
    <Reveal direction="up" distance={25} duration={500}>
      <h1>Animated Headline</h1>
    </Reveal>
  );
}
\`\`\`

### 3. Tactile Button Microinteraction
\`\`\`tsx
"use client";

import { useMicrointeraction } from "af-motion/react";

export function Button() {
  const { ref, props } = useMicrointeraction({ variant: "tactile-press" });
  return <button ref={ref} {...props}>Click</button>;
}
\`\`\`

### 4. Staggered Grid Entrance
\`\`\`typescript
import { stagger } from "af-motion";

stagger(".grid-item", {
  transform: ["translateY(20px)", "none"],
  opacity: [0, 1],
  staggerDelay: 40,
});
\`\`\`

### 5. 3D Tilt Card with Glare
\`\`\`typescript
import { tilt } from "af-motion";

tilt(".card", { maxTilt: 15, glare: true });
\`\`\`

### 6. Interactive Particle Canvas
\`\`\`typescript
import { particleField } from "af-motion";

particleField("#canvas", { count: 100, interactive: true });
\`\`\`

### 7. Scroll-Linked Progress & Velocity
\`\`\`tsx
"use client";

import { useScrollProgress } from "af-motion/react";

export function ScrollBar() {
  const { progress } = useScrollProgress();
  return <div style={{ transform: \`scaleX(\${progress})\` }} />;
}
\`\`\`

### 8. AI Motion Quality Audit
\`\`\`typescript
import { evaluateMotionQuality } from "af-motion/catalogue";

const report = evaluateMotionQuality({
  configuration: { duration: 250, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
});
\`\`\`

### 9. Design-to-Motion Generation
\`\`\`typescript
import { designToMotionEngine } from "af-motion/catalogue";

const res = await designToMotionEngine.generate({
  naturalLanguage: "Playful bouncing notification",
});
\`\`\`

### 10. End-to-End AI Ecosystem Pipeline
\`\`\`typescript
import { executeAIEcosystemPipeline } from "af-motion/catalogue";

const result = await executeAIEcosystemPipeline({
  scenario: "design-to-motion",
  goal: "Create a modern banner",
});
\`\`\`
`,
        relatedSlugs: ["quickstart", "react-hooks", "core-animation"],
      },
    ],
  },

  // =========================================================================
  // 10. Developer Experience & Reference
  // =========================================================================
  {
    id: "developer-experience",
    title: "Developer Experience & Reference",
    icon: "🛠️",
    description: "API reference, export guides, performance tips, accessibility compliance, and troubleshooting.",
    articles: [
      {
        id: "api-reference",
        sectionId: "developer-experience",
        title: "API Reference & Types",
        description: "Exhaustive coverage map of all public exports across af-motion subpaths.",
        slug: "api-reference",
        headings: [
          { id: "subpath-core", text: "af-motion (Core)", level: 2 },
          { id: "subpath-react", text: "af-motion/react (React)", level: 2 },
          { id: "subpath-catalogue", text: "af-motion/catalogue (Intelligence & 3D)", level: 2 },
          { id: "subpath-presets", text: "af-motion/presets (Standard Recipes)", level: 2 },
        ],
        tags: ["api", "reference", "exports", "types", "coverage"],
        content: `
Authoritative subpath exports map for AF Motion:

### af-motion (Core DOM Animation & Primitives)
- \`animate(target, keyframes, options)\`: Core animation execution.
- \`animateProgress(onProgress, options)\`: Normalized 0.0-1.0 progress driver.
- \`animateSpring(target, keyframes, options)\`: Physical spring animation.
- \`animateInertia(target, options)\`: Kinetic momentum decay.
- \`createTimeline()\`: Multi-track sequenced timeline.
- \`reveal(target, options)\`: Directional entrance.
- \`stagger(targets, options)\`: Multi-element sequence stagger.
- \`magnetic(target, options)\`: Dynamic cursor attraction.
- \`tilt(target, options)\`: 3D perspective tilt.
- \`parallax(target, options)\`: Scroll displacement.
- \`aurora(canvas, options)\`: WebGL/2D gradient wave background.
- \`particleField(canvas, options)\`: Interactive particle network.
- \`easings\`: 56 built-in Bézier curves and evaluation functions.
- \`activatePalette(name)\`: Global CSS custom properties injection.

### af-motion/react (React 18/19 Bindings)
- \`useAnimate()\`: Scoped animation controller hook.
- \`useInView(ref, options)\`: Viewport intersection observer hook.
- \`useScrollProgress(options)\`: Normalized scroll progress hook.
- \`useScrollVelocity()\`: Scroll speed and direction telemetry.
- \`useMicrointeraction(options)\`: Tactile interaction feedback hook.
- \`useMotionAccessibility()\`: Reduced motion detection hook.
- \`<Reveal>\`: ForwardRef entrance animation component.
- \`<AnimatedText>\`: Typewriter and text stagger component.
- \`<Interactive>\`: Tactile microinteraction wrapper component.
- \`<GlassSurface>\`: Hardware-accelerated frosted glass container.

### af-motion/catalogue (Intelligence, 3D & AI Ecosystem)
- \`aiMotionRegistry\`: Registry of all registered motion capabilities.
- \`visualStyleRegistry\`: 19 visual design styles.
- \`evaluateMotionQuality(input)\`: Multi-dimensional quality scoring.
- \`generateMotionRecommendations(findings)\`: Optimization suggestion generator.
- \`designToMotionEngine\`: Brief-to-animation synthesis engine.
- \`aiSceneGenerationEngine\`: Multi-system scene generation engine.
- \`agentRegistry\`: 6 specialized creative agents.
- \`safeToolRegistry\`: Permission-enforced safe tool invocations.
- \`multiAgentOrchestrator\`: Multi-agent squad collaboration orchestrator.
- \`aiEcosystemCapabilityRegistry\`: 12 unified AI capabilities.
- \`deterministicLocalAIProvider\`: Hardened offline deterministic provider.
- \`executeAIEcosystemPipeline(request)\`: End-to-end scenario coordinator.

### af-motion/presets (Standard Presets)
- \`listPresets()\`: Enumerates standard animation presets.
- \`applyPreset(element, presetName, overrides)\`: Applies a standard animation recipe.
`,
        relatedSlugs: ["export-integration", "troubleshooting"],
      },
      {
        id: "export-integration",
        sectionId: "developer-experience",
        title: "Export & Multi-Framework Integration",
        description: "Exporting animations to Vanilla JS, TypeScript, React TSX, Composition JSON, and CSS variables.",
        slug: "export-integration",
        headings: [
          { id: "export-targets", text: "Supported Export Targets", level: 2 },
          { id: "react-tsx-export", text: "React TSX Components", level: 2 },
          { id: "composition-json-export", text: "Composition JSON Specs", level: 2 },
          { id: "css-token-export", text: "CSS Custom Properties", level: 2 },
        ],
        tags: ["export", "react", "typescript", "json", "css"],
        content: `
AF Motion allows developers and AI agents to export motion compositions into multiple production formats:

### Supported Export Targets
- **React TSX**: Ready-to-use React client components with imported hooks.
- **Vanilla TypeScript / JavaScript**: Zero-dependency WAAPI animation scripts.
- **Composition JSON**: Schema-validated JSON graphs describing nodes, timings, and tracks.
- **CSS Custom Properties**: CSS variable tokens for theme integration.
- **3D Scene Specs**: Three.js/WebGL scene descriptors.
`,
        relatedSlugs: ["api-reference", "react-guide"],
      },
      {
        id: "performance-guide",
        sectionId: "developer-experience",
        title: "Performance & GPU Optimization",
        description: "Hardware acceleration rules, avoiding layout thrashing, and adaptive quality scaling.",
        slug: "performance-guide",
        headings: [
          { id: "gpu-acceleration", text: "GPU Acceleration Rules", level: 2 },
          { id: "avoid-layout-thrashing", text: "Avoiding Layout Thrashing", level: 2 },
          { id: "adaptive-quality-scaling", text: "Adaptive Quality Scaling", level: 2 },
        ],
        tags: ["performance", "gpu", "transforms", "telemetry", "60fps"],
        content: `
Web animation performance directly affects battery life, device thermals, and user perception.

### GPU Acceleration Rules
- **Animate only \`transform\` and \`opacity\`**: These properties are composited on the GPU without triggering document layout or paint cycles.
- **NEVER animate layout properties**: Never animate \`width\`, \`height\`, \`top\`, \`left\`, \`margin\`, or \`padding\`. Use \`transform: scale(...)\` and \`transform: translate(...)\` instead.
- **Use \`will-change: transform\` sparingly**: Apply only during active animation sequences and remove upon completion to free GPU VRAM.

### Avoiding Layout Thrashing
Do not read layout properties (\`offsetWidth\`, \`getBoundingClientRect\`) immediately after writing styles. AF Motion automatically batches DOM measurements.
`,
        relatedSlugs: ["accessibility-guide", "core-animation"],
      },
      {
        id: "accessibility-guide",
        sectionId: "developer-experience",
        title: "Accessibility & Reduced Motion",
        description: "WCAG 2.2.2 motion guidelines, prefers-reduced-motion fallbacks, and vestibular safety.",
        slug: "accessibility-guide",
        headings: [
          { id: "wcag-motion-guidelines", text: "WCAG 2.2.2 Compliance", level: 2 },
          { id: "prefers-reduced-motion", text: "Honoring prefers-reduced-motion", level: 2 },
          { id: "vestibular-safety", text: "Vestibular Disorder Safety", level: 2 },
        ],
        tags: ["accessibility", "a11y", "reduced-motion", "wcag", "safety"],
        content: `
Motion accessibility is an essential engineering responsibility. Excessive or unskippable animations can trigger nausea and vestibular symptoms.

### WCAG 2.2.2 Compliance
- **Pause, Stop, Hide**: Animations running longer than 5 seconds must provide a user pause mechanism.
- **Flashing Limit**: Content must not flash more than 3 times in any 1-second period (WCAG 2.3.1).

### Honoring prefers-reduced-motion
AF Motion automatically detects user motion preferences. When \`prefers-reduced-motion: reduce\` is enabled:
- Animations jump directly to their final destination keyframes.
- Heavy parallax offsets are suppressed.
- Interactive components use instantaneous or opacity-only transitions.
`,
        relatedSlugs: ["performance-guide", "react-hooks"],
      },
      {
        id: "cli-tooling",
        sectionId: "developer-experience",
        title: "CLI Tooling & Developer Experience",
        description: "Official CLI for project scaffolding, environment diagnostics, configuration validation, and preset discovery.",
        slug: "cli-tooling",
        headings: [
          { id: "cli-installation", text: "Installation & Execution", level: 2 },
          { id: "cli-init", text: "af-motion init", level: 2 },
          { id: "cli-doctor", text: "af-motion doctor", level: 2 },
          { id: "cli-validate", text: "af-motion validate", level: 2 },
          { id: "cli-presets", text: "af-motion presets", level: 2 },
          { id: "cli-info", text: "af-motion info", level: 2 },
          { id: "cli-example", text: "af-motion example", level: 2 },
          { id: "cli-ci", text: "CI & Automation Workflows", level: 2 },
        ],
        tags: ["cli", "terminal", "init", "doctor", "validate", "presets", "examples", "ci"],
        content: `
AF Motion includes a zero-dependency, modular CLI for terminal-first development workflows.

### Installation & Execution
Run instantly without installation via \`npx\`:
\`\`\`bash
npx af-motion --help
\`\`\`

Or install as a local development dependency:
\`\`\`bash
npm install -D af-motion
npx af-motion <command>
\`\`\`

### af-motion init
Initialize an AF Motion project with starter templates and automatic framework detection:
\`\`\`bash
# Auto-detect framework and generate starter
npx af-motion init

# Explicitly choose template
npx af-motion init my-app --template react-ts
npx af-motion init --template vanilla-ts
\`\`\`
- **Protection**: Existing files are never overwritten without \`--force\`.
- **Config**: Generates an \`af-motion.config.json\` file configured with default Motion DNA, palette, and reduced motion settings.

### af-motion doctor
Run read-only diagnostics across Node.js runtime, package manifests, TypeScript configuration, and React peer dependencies:
\`\`\`bash
npx af-motion doctor
\`\`\`
Outputs categorized PASS, WARN, and FAIL checks with concrete remediation steps.

### af-motion validate
Validate configuration files or animation compositions against official schemas:
\`\`\`bash
npx af-motion validate af-motion.config.json
\`\`\`
Checks schema correctness, verified Motion DNA profiles, the 33 built-in palettes, and performance settings.

### af-motion presets
Discover, search, inspect, and export verified recipes:
\`\`\`bash
# List all presets or filter by category
npx af-motion presets --category entrance

# Inspect preset properties and easing
npx af-motion presets inspect fadeIn

# Export preset to a reusable TypeScript file
npx af-motion presets export fadeIn --format ts --out src/animations/fade.ts
\`\`\`

### af-motion info
Inspect installed AF Motion capabilities, version, subpath mappings, and AI capability registry:
\`\`\`bash
npx af-motion info
npx af-motion info --json
\`\`\`

### af-motion example
Generate standalone, compilable starter animation files:
\`\`\`bash
npx af-motion example spring --lang ts
npx af-motion example react --lang ts --out components/Hero.tsx
npx af-motion example basic --print
\`\`\`
Supported types: \`basic\`, \`reveal-stagger\`, \`spring\`, \`timeline\`, \`react\`, \`motion-dna\`, \`3d\`, \`ai-quality\`, \`design-to-motion\`.

### CI & Automation Workflows
All commands support non-interactive CI operation:
- Use \`--json\` for machine-readable stdout output.
- Use \`--no-color\` to strip ANSI escape codes in log pipelines.
- Standard exit codes: \`0\` (success), \`1\` (validation/check failure), \`2\` (syntax/argument error).
`,
        relatedSlugs: ["api-reference", "troubleshooting"],
      },
      {
        id: "troubleshooting",
        sectionId: "developer-experience",
        title: "Troubleshooting & FAQ",
        description: "Common pitfalls: Next.js SSR errors, React cleanup leaks, easing errors, and permission failures.",
        slug: "troubleshooting",
        headings: [
          { id: "faq-ssr-errors", text: "Window or Document is not defined (SSR)", level: 2 },
          { id: "faq-strict-mode", text: "Animation triggers twice in React development", level: 2 },
          { id: "faq-import-errors", text: "Module not found or incorrect subpath import", level: 2 },
          { id: "faq-performance-drops", text: "Jank or low FPS on mobile devices", level: 2 },
          { id: "faq-pure-esm", text: "Pure ESM and Module Resolution Errors", level: 2 },
        ],
        tags: ["troubleshooting", "faq", "errors", "fixes", "debugging"],
        content: `
Solutions to common development questions and error states:

### Window or Document is not defined (SSR)
- **Cause**: Core DOM animation code executing during Next.js or Remix server-side render.
- **Solution**: Add \`"use client";\` to the top of Next.js App Router files, or wrap DOM calls inside \`useEffect()\`.

### Animation triggers twice in React development
- **Cause**: React 18/19 Strict Mode deliberately unmounts and remounts components in local dev to detect missing cleanup.
- **Solution**: Return the controls cleanup function from \`useEffect\`: \`return () => controls.cancel();\`.

### Module not found or incorrect subpath import
- **Cause**: Importing from unexported internal paths like \`af-motion/src/...\`.
- **Solution**: Only import from the 4 official subpaths: \`af-motion\`, \`af-motion/react\`, \`af-motion/catalogue\`, and \`af-motion/presets\`.

### Jank or low FPS on mobile devices
- **Cause**: Animating non-GPU properties (\`width\`, \`height\`, \`margin\`) or running excessive particle counts.
- **Solution**: Animate only \`transform\` and \`opacity\`. Reduce particle counts on mobile devices using \`useMotionAccessibility()\`.
`,
        relatedSlugs: ["api-reference", "performance-guide", "installation"],
      },
    ],
  },
];
