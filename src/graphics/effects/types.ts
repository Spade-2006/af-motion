/**
 * AF Motion Advanced Graphics Effects Contracts
 *
 * Types for distortion, fluid visuals, particle simulation,
 * and post-processing visual enhancement effects.
 */

import type { GraphicsEffect } from "../types.js";

// ============================================================================
// 1. DISTORTION TYPES
// ============================================================================

export type DistortionType =
  | "wave"
  | "ripple"
  | "chromatic-aberration"
  | "pixel-displacement"
  | "heat-haze"
  | "lens"
  | "noise"
  | "refraction";

export interface DistortionOptions {
  readonly type?: DistortionType;
  readonly intensity?: number;
  readonly scale?: number;
  readonly direction?: "horizontal" | "vertical" | "both" | "radial";
  readonly speed?: number;
  readonly seed?: number | string;
  readonly quality?: "low" | "medium" | "high";
  readonly center?: readonly [number, number];
}

// ============================================================================
// 2. FLUID TYPES
// ============================================================================

export type FluidType =
  | "metaball"
  | "flow-field"
  | "liquid-gradient"
  | "liquid-transition"
  | "gooey-blend"
  | "liquid-surface";

export interface FluidOptions {
  readonly type?: FluidType;
  readonly colors?: readonly string[];
  readonly viscosity?: number;
  readonly speed?: number;
  readonly density?: number;
  readonly turbulent?: boolean;
  readonly seed?: number | string;
  readonly quality?: "low" | "medium" | "high";
}

// ============================================================================
// 3. PARTICLE TYPES
// ============================================================================

export type ParticleShape = "circle" | "square" | "triangle" | "star" | "spark";

export type ParticleOrigin = "center" | "top" | "bottom" | "random" | readonly [number, number];

export interface ParticleEmitterOptions {
  readonly rate?: number;
  readonly burstCount?: number;
  readonly maxParticles?: number;
  readonly origin?: ParticleOrigin;
  readonly lifetime?: readonly [number, number];
  readonly speed?: readonly [number, number];
  readonly angle?: readonly [number, number];
  readonly gravity?: readonly [number, number];
  readonly size?: readonly [number, number];
  readonly colors?: readonly string[];
  readonly shape?: ParticleShape;
  readonly fade?: boolean;
  readonly shrink?: boolean;
  readonly rotationSpeed?: readonly [number, number];
  readonly seed?: number | string;
}

export interface ParticleOptions extends ParticleEmitterOptions {
  readonly mode?: "continuous" | "burst";
  readonly autoStart?: boolean;
}

export interface ParticleState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ax: number;
  ay: number;
  size: number;
  initialSize: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  opacity: number;
  lifetime: number;
  age: number;
  active: boolean;
  shape: ParticleShape;
}

// ============================================================================
// 4. ADVANCED POST-PROCESSING EFFECTS
// ============================================================================

export type AdvancedEffectType =
  | "glow-bloom"
  | "vignette"
  | "noise-overlay"
  | "scanlines"
  | "light-streaks"
  | "gradient-animation"
  | "background-transition";

export interface AdvancedEffectOptions {
  readonly type?: AdvancedEffectType;
  readonly intensity?: number;
  readonly color?: string;
  readonly secondaryColor?: string;
  readonly blendMode?: string;
  readonly speed?: number;
  readonly opacity?: number;
  readonly seed?: number | string;
  readonly transitionProgress?: number;
}

// ============================================================================
// COMPOSER & RE-EXPORTS
// ============================================================================

export interface ComposedGraphicsEffect extends GraphicsEffect {
  readonly effects: readonly GraphicsEffect[];
}
