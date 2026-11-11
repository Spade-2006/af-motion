import React from "react";
import type { DemoComponentProps, DemoDefinition } from "../types";

export const DEMO_REGISTRY: readonly DemoDefinition[] = [
  {
    id: "basic-animate",
    title: "Basic Animation Engine (animate)",
    shortLabel: "Core animate()",
    category: "Core",
    subpath: "af-motion",
    description:
      "Configure GPU transform properties, opacity, duration, delay, easing, and playback loops directly with AF Motion's core animate() API.",
    load: () => import("../demos/BasicAnimationDemo"),
  },
  {
    id: "easing-explorer",
    title: "Easing Curve Laboratory",
    shortLabel: "Easing Explorer",
    category: "Timing & Physics",
    subpath: "af-motion",
    description:
      "Inspect and compare AF Motion's 12 built-in core easing curves with live SVG trajectories and synchronized progress dots.",
    load: () => import("../demos/EasingExplorerDemo"),
  },
  {
    id: "spring-physics",
    title: "Spring Physics Solver",
    shortLabel: "Spring Physics",
    category: "Timing & Physics",
    subpath: "af-motion",
    description:
      "Tune stiffness, damping, mass, and initial velocity to compare under-damped, critically damped, and over-damped motion.",
    load: () => import("../demos/SpringPhysicsDemo"),
  },
  {
    id: "stagger-reveal",
    title: "Stagger & Reveal Effects",
    shortLabel: "Stagger & Reveal",
    category: "Effects",
    subpath: "af-motion",
    description:
      "Orchestrate multi-element sequenced entrances with stagger intervals, direction vectors, and GPU transforms.",
    load: () =>
      import("../demos/EffectsShowcaseDemo").then((m) => ({
        default: (props: DemoComponentProps) => (
          <m.EffectsShowcaseDemo {...props} initialTab="stagger" />
        ),
      })),
  },
  {
    id: "magnetic-tilt",
    title: "Magnetic & 3D Perspective Tilt",
    shortLabel: "Magnetic & Tilt",
    category: "Effects",
    subpath: "af-motion",
    description:
      "Test pointer-reactive magnetic button attraction and interactive 3D card perspective tilt.",
    load: () =>
      import("../demos/EffectsShowcaseDemo").then((m) => ({
        default: (props: DemoComponentProps) => (
          <m.EffectsShowcaseDemo {...props} initialTab="magnetic" />
        ),
      })),
  },
  {
    id: "parallax-scroll",
    title: "Scroll & Parallax Depth",
    shortLabel: "Parallax Layer",
    category: "Effects",
    subpath: "af-motion",
    description:
      "Adjust speed ratios, clamp bounds, and axis vectors using AF Motion's scroll-linked parallax() primitive.",
    load: () =>
      import("../demos/EffectsShowcaseDemo").then((m) => ({
        default: (props: DemoComponentProps) => (
          <m.EffectsShowcaseDemo {...props} initialTab="parallax" />
        ),
      })),
  },
  {
    id: "timeline-choreography",
    title: "Timeline & Choreography Studio",
    shortLabel: "Timeline Editor",
    category: "Choreography",
    subpath: "af-motion",
    description:
      "Compose multi-track timelines with configurable start offsets, durations, and interactive playhead scrubbing.",
    load: () => import("../demos/TimelineDemo"),
  },
  {
    id: "motion-dna",
    title: "Motion DNA Personalities",
    shortLabel: "Motion DNA (6)",
    category: "Choreography",
    subpath: "af-motion",
    description:
      "Compare AF Motion's 6 built-in Motion DNA profiles (snappy, energetic, calm, cinematic, minimal, playful) side-by-side.",
    load: () => import("../demos/MotionDNADemo"),
  },
  {
    id: "three-gpu-showcase",
    title: "3D & GPU Shaders Showcase",
    shortLabel: "3D & GPU Lab",
    category: "3D & GPU",
    subpath: "af-motion/catalogue",
    description:
      "Lazy-loaded WebGL 3D procedural geometries, PBR materials, aurora shaders, and hardware-accelerated particle fields.",
    isHeavy: true,
    load: () => import("../demos/ThreeAndGPUDemo"),
  },
  {
    id: "ai-laboratory",
    title: "Deterministic AI Motion Lab",
    shortLabel: "AI Laboratory",
    category: "AI & Presets",
    subpath: "af-motion/catalogue",
    description:
      "Explore offline Motion Intelligence quality audits, Design-to-Motion synthesis, Scene Generation, and Agent Workflow plans.",
    isHeavy: true,
    load: () => import("../demos/AILaboratoryDemo"),
  },
  {
    id: "preset-explorer",
    title: "Built-in Preset Explorer (39)",
    shortLabel: "Preset Explorer",
    category: "AI & Presets",
    subpath: "af-motion/presets",
    description:
      "Browse, search, preview, and export all 39 categorized AF Motion animation presets.",
    isHeavy: true,
    load: () => import("../demos/PresetExplorerDemo"),
  },
];

export function getDemoById(id: string): DemoDefinition {
  return DEMO_REGISTRY.find((d) => d.id === id) ?? DEMO_REGISTRY[0];
}
