/**
 * AF Motion CLI — Template Registry
 *
 * Provides starter project templates and verified code examples using only
 * official public package subpaths without internal relative imports.
 */

import type { StarterTemplate, ExampleType } from "../types.js";

export const STARTER_CONFIG_JSON = JSON.stringify(
  {
    $schema: "https://af-motion.dev/schemas/config-v1.json",
    version: "1.0.0",
    defaultMotionDNA: "playful",
    defaultPalette: "Cobalt Classic",
    accessibility: {
      respectReducedMotion: true,
      fallbackDurationMs: 0,
    },
    performance: {
      targetFps: 60,
      gpuAcceleration: true,
      adaptiveQuality: true,
    },
  },
  null,
  2
);

export function getStarterTemplate(template: StarterTemplate): { filename: string; content: string } {
  switch (template) {
    case "vanilla-js":
      return {
        filename: "animation.js",
        content: `// AF Motion — Vanilla JavaScript Starter
import { animate } from "af-motion";

export function initializeMotion() {
  const target = document.querySelector("#hero-box");
  if (!target) return null;

  return animate(
    target,
    {
      transform: ["translateY(30px) scale(0.9)", "translateY(0px) scale(1)"],
      opacity: [0, 1],
    },
    {
      duration: 600,
      easing: "cubic-bezier(0.16, 1, 0.3, 1)",
    }
  );
}
`,
      };

    case "vanilla-ts":
      return {
        filename: "animation.ts",
        content: `// AF Motion — Vanilla TypeScript Starter
import { animate, type AnimationControls } from "af-motion";

export interface MotionOptions {
  duration?: number;
  delay?: number;
}

export function startEntrance(
  selector: string,
  options: MotionOptions = {}
): AnimationControls | null {
  const element = document.querySelector<HTMLElement>(selector);
  if (!element) return null;

  return animate(
    element,
    {
      transform: ["translateY(24px) scale(0.95)", "translateY(0px) scale(1)"],
      opacity: [0, 1],
    },
    {
      duration: options.duration ?? 500,
      delay: options.delay ?? 0,
      easing: "cubic-bezier(0.16, 1, 0.3, 1)",
    }
  );
}
`,
      };

    case "react-ts":
      return {
        filename: "AnimatedCard.tsx",
        content: `"use client";

import React from "react";
import { useAnimate, useMicrointeraction, Reveal } from "af-motion/react";

export interface AnimatedCardProps {
  title?: string;
  description?: string;
}

export function AnimatedCard({
  title = "AF Motion Card",
  description = "Hardware-accelerated React animation primitive.",
}: AnimatedCardProps): React.JSX.Element {
  const { ref: badgeRef, animate: animateBadge } = useAnimate<HTMLDivElement>();
  const { ref: buttonRef, handlers, isPressed } = useMicrointeraction<HTMLButtonElement>("button");

  const handlePulse = () => {
    animateBadge({ scale: [1, 1.15, 1] }, { duration: 300 });
  };

  return (
    <Reveal direction="up" distance={24} duration={500}>
      <div
        style={{
          padding: "24px",
          borderRadius: "16px",
          background: "#1e293b",
          color: "#ffffff",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.25)",
        }}
      >
        <div ref={badgeRef} style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "8px" }}>
          {title}
        </div>
        <p style={{ color: "#94a3b8", marginBottom: "16px" }}>{description}</p>
        <button
          ref={buttonRef}
          {...handlers}
          onClick={handlePulse}
          style={{
            padding: "10px 20px",
            borderRadius: "8px",
            background: "#0284c7",
            color: "#ffffff",
            border: "none",
            cursor: "pointer",
            fontWeight: 600,
            transform: isPressed ? "scale(0.95)" : "scale(1)",
            transition: "transform 0.1s ease",
          }}
        >
          Trigger Micro-Pulse
        </button>
      </div>
    </Reveal>
  );
}
`,
      };
  }
}

export function getExampleContent(type: ExampleType, lang: "ts" | "js"): { filename: string; content: string } {
  const ext = lang === "ts" ? "ts" : "js";

  switch (type) {
    case "basic":
      return {
        filename: `example-basic.${ext}`,
        content: `// Basic Hardware-Accelerated WAAPI Animation
import { animate } from "af-motion";

const target = document.querySelector(".card");
if (target) {
  const controls = animate(
    target,
    {
      transform: ["scale(0.9) translateY(20px)", "scale(1) translateY(0px)"],
      opacity: [0, 1],
    },
    {
      duration: 600,
      easing: "cubic-bezier(0.16, 1, 0.3, 1)",
    }
  );

  await controls.finished;
  console.log("Animation complete");
}
`,
      };

    case "reveal-stagger":
      return {
        filename: `example-reveal-stagger.${ext}`,
        content: `// Scroll Reveal and List Stagger Choreography
import { reveal, stagger } from "af-motion";

// 1. Reveal element when entering viewport
reveal(".section-header", {
  properties: {
    opacity: [0, 1],
    transform: ["translateY(30px)", "translateY(0px)"],
  },
  duration: 600,
  once: true,
});

// 2. Cascade elements with stagger delay offset
stagger(".list-item", {
  properties: {
    opacity: [0, 1],
    transform: ["translateY(20px)", "translateY(0px)"],
  },
  stagger: 80,
  duration: 400,
});
`,
      };

    case "spring":
      return {
        filename: `example-spring.${ext}`,
        content: `// Damped Physical Spring Simulation
import { animateSpring } from "af-motion";

const element = document.querySelector(".spring-ball");
if (element) {
  animateSpring({
    from: 0,
    to: 100,
    config: {
      stiffness: 260,
      damping: 18,
      mass: 1,
    },
    onUpdate: ({ position }) => {
      element.style.transform = \`translateY(\${position}px)\`;
    },
    onComplete: () => {
      console.log("Spring settled at equilibrium");
    },
  });
}
`,
      };

    case "timeline":
      return {
        filename: `example-timeline.${ext}`,
        content: `// Coordinated Timeline Choreography
import { createTimeline } from "af-motion";

const timeline = createTimeline();

timeline
  .add({
    target: ".hero-title",
    properties: { opacity: [0, 1], transform: ["translateY(20px)", "translateY(0px)"] },
    duration: 400,
  })
  .add({
    target: ".hero-subtitle",
    properties: { opacity: [0, 1] },
    duration: 350,
    delay: -100, // Overlap with previous animation
  })
  .add({
    target: ".cta-button",
    properties: { transform: ["scale(0.8)", "scale(1)"], opacity: [0, 1] },
    duration: 300,
  });

timeline.play();
`,
      };

    case "react":
      return {
        filename: `example-react.${lang === "ts" ? "tsx" : "jsx"}`,
        content: `"use client";

import React from "react";
import { useAnimate, useMicrointeraction, useMotionAccessibility, Reveal } from "af-motion/react";

export function HeroFeature() {
  const { ref: titleRef, animate } = useAnimate<HTMLHeadingElement>();
  const { ref: btnRef, handlers, isPressed } = useMicrointeraction("button");
  const { accessibilityScore } = useMotionAccessibility({ duration: 400 });

  const handleHeroClick = () => {
    animate({ scale: [1, 1.1, 1] }, { duration: 300 });
  };

  return (
    <Reveal direction="down" duration={500}>
      <div className="hero-banner">
        <h1 ref={titleRef}>Next-Gen Web Motion (Score: {accessibilityScore}/100)</h1>
        <button
          ref={btnRef}
          {...handlers}
          onClick={handleHeroClick}
          style={{ transform: isPressed ? "scale(0.96)" : "scale(1)" }}
        >
          Interactive Tactile Action
        </button>
      </div>
    </Reveal>
  );
}
`,
      };

    case "motion-dna":
      return {
        filename: `example-motion-dna.${ext}`,
        content: `// Motion DNA Kinetic Personality Integration
import { applyMotionDNA, animate } from "af-motion";

// 1. Resolve Motion DNA animation options (snappy, energetic, calm, cinematic, playful)
const motionOptions = applyMotionDNA("playful", {
  duration: 450,
});

// 2. Animate target element with the resolved kinetic DNA
const card = document.querySelector(".product-card");
if (card) {
  animate(
    card,
    {
      transform: ["scale(0.9) translateY(20px)", "scale(1) translateY(0px)"],
      opacity: [0, 1],
    },
    motionOptions
  );
}
`,
      };

    case "3d":
      return {
        filename: `example-3d-scene.${ext}`,
        content: `// 3D Scene Initialization
import { Scene3DEngine } from "af-motion/catalogue";

const container = document.querySelector("#canvas-container");
if (container) {
  const engine = new Scene3DEngine({
    container,
    antialias: true,
    alpha: true,
  });

  engine.addMesh({
    id: "cube",
    geometry: { type: "box", width: 2, height: 2, depth: 2 },
    material: { type: "standard", color: "#38bdf8", roughness: 0.2 },
    position: [0, 0, 0],
  });

  engine.startRenderLoop();
}
`,
      };

    case "ai-quality":
      return {
        filename: `example-ai-quality.${ext}`,
        content: `// Deterministic Offline Motion Quality Evaluation
import { evaluateMotionQuality, generateMotionRecommendations } from "af-motion/catalogue";

const analysisInput = {
  configuration: {
    duration: 300,
    easing: "cubic-bezier(0.16, 1, 0.3, 1)",
  },
  contextHint: "button-click",
};

// 1. Evaluate motion heuristics (timing, smoothness, aesthetics, accessibility)
const report = evaluateMotionQuality(analysisInput);
console.log("Overall Score:", report.scores.overall, "/ 100");
console.log("Grade:", report.grade);

// 2. Generate evidence-based recommendations
const recommendations = generateMotionRecommendations(analysisInput, report.findings);
console.log("Actionable Heuristics:", recommendations.length);
`,
      };

    case "design-to-motion":
      return {
        filename: `example-design-to-motion.${ext}`,
        content: `// Offline Deterministic Design-to-Motion Generation
import { designToMotionEngine } from "af-motion/catalogue";

const result = designToMotionEngine.generateSync({
  naturalLanguage: "Create an elegant modal entrance with smooth fade and scale",
  tokens: {
    motionDNA: "elegant",
    paletteName: "Cobalt Classic",
  },
});

console.log("Generated Elements:", result.plan.elementPlans.length);
console.log("Quality Score:", result.validation.qualityScore);
console.log("Validation Issues:", result.validation.issues.length);
`,
      };
  }
}
