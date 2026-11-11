/**
 * AF Motion Studio — Shared Type Definitions
 *
 * Types for Studio modules: Animation Playground, Background Studio,
 * Preview Stage, Timeline Controller, Code Generator, and future extension slots.
 */

export type StudioTab =
  | "animation"
  | "background"
  | "dual"
  | "export"
  | "style-explorer"
  | "design-systems"
  | "choreography"
  | "scene-3d"
  | "motion-physics"
  | "interactions"
  | "advanced-motion"
  | "simulations"
  | "unified";

export type ViewportPreset = "desktop" | "tablet" | "mobile";

export type PreviewTargetKind = "card" | "button" | "badge" | "icon" | "text";

export interface AnimationPropertyValues {
  x: number; // px offset
  y: number; // px offset
  scale: number;
  rotate: number; // deg
  opacity: number; // 0 to 1
  blur: number; // px
  borderRadius: number; // px
  backgroundColor?: string;
}

export interface CustomKeyframe {
  offset: number; // 0 to 1
  properties: Partial<AnimationPropertyValues>;
}

export interface StudioAnimationConfig {
  target: PreviewTargetKind;
  properties: AnimationPropertyValues;
  duration: number; // ms
  delay: number; // ms
  easing: string;
  iterations: number | "infinite";
  direction: "normal" | "reverse" | "alternate";
  fill: "none" | "forwards" | "backwards" | "both";
  preset?: string;
  reducedMotion: boolean;
  keyframes?: CustomKeyframe[];
}

export type BackgroundType =
  | "solid"
  | "gradient"
  | "animated-gradient"
  | "particles"
  | "aurora"
  | "grid"
  | "dots"
  | "waves"
  | "noise";

export interface StudioBackgroundConfig {
  type: BackgroundType;
  paletteId: string;
  paletteName: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  speed: number; // 0.1 to 3.0
  density: number; // for particles, dots (10 to 100)
  scale: number; // for noise, waves (0.5 to 3.0)
  angle: number; // for gradient (0 to 360 deg)
  intensity: number; // 0 to 1
  quality: "low" | "medium" | "high";
  fpsCap: 30 | 60;
}

export interface StudioTimelineState {
  currentTimeMs: number;
  durationMs: number;
  progress: number; // 0 to 1
  isPlaying: boolean;
  isReversed: boolean;
  isLooping: boolean;
  fps: number;
}

export interface StudioExportBundle {
  title: string;
  reactCode: string;
  configJson: string;
  cssVariables: Record<string, string>;
  imports: Array<{ subpath: string; namedImports: string[] }>;
}

export interface FutureModuleMetadata {
  id: string;
  name: string;
  prompt: string;
  description: string;
  status: "coming-soon" | "active";
}

export * from "./style-explorer.js";
export * from "./design-systems.js";
export * from "./choreography.js";
export * from "./scene-3d.js";
export * from "./motion-physics.js";
export * from "./interactions.js";
export * from "./advanced-motion.js";
export * from "./gpu-simulations.js";
export * from "./unified-playground.js";
