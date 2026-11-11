/**
 * AF Motion Advanced Effects Schemas & AI Capabilities
 *
 * Schemas, validators, configuration correctors, and AI Motion Registry capabilities
 * for distortion, fluid, particle, and advanced post-processing effects.
 */

import type { ValidationReport } from "../schema.js";
import type {
  AdvancedEffectOptions,
  AdvancedEffectType,
  DistortionOptions,
  DistortionType,
  FluidOptions,
  FluidType,
  ParticleOptions,
  ParticleShape,
} from "./types.js";

export const EFFECTS_SCHEMA_VERSION = "1.0.0";

// ============================================================================
// 1. DISTORTION SCHEMAS & VALIDATION
// ============================================================================

export const VALID_DISTORTION_TYPES: readonly DistortionType[] = [
  "wave",
  "ripple",
  "chromatic-aberration",
  "pixel-displacement",
  "heat-haze",
  "lens",
  "noise",
  "refraction",
];

export const DISTORTION_OPTIONS_SCHEMA = {
  type: "object",
  properties: {
    type: { type: "string", enum: VALID_DISTORTION_TYPES },
    intensity: { type: "number", minimum: 0, maximum: 1 },
    scale: { type: "number", minimum: 1, maximum: 200 },
    direction: { type: "string", enum: ["horizontal", "vertical", "both", "radial"] },
    speed: { type: "number" },
    seed: { type: ["number", "string"] },
    quality: { type: "string", enum: ["low", "medium", "high"] },
    center: { type: "array", items: { type: "number" }, minItems: 2, maxItems: 2 },
  },
} as const;

export function validateDistortionOptions(input: unknown): ValidationReport {
  const errors: string[] = [];
  if (input !== undefined && (input === null || typeof input !== "object" || Array.isArray(input))) {
    return { valid: false, errors: ["Distortion options must be an object if provided"] };
  }

  if (input && typeof input === "object") {
    const opts = input as DistortionOptions;
    if (opts.type !== undefined && !VALID_DISTORTION_TYPES.includes(opts.type)) {
      errors.push(`Invalid distortion type "${opts.type}". Expected one of: ${VALID_DISTORTION_TYPES.join(", ")}`);
    }
    if (opts.intensity !== undefined && (typeof opts.intensity !== "number" || opts.intensity < 0 || opts.intensity > 1)) {
      errors.push("intensity must be a number between 0 and 1");
    }
  }

  return { valid: errors.length === 0, errors: Object.freeze(errors) };
}

export function correctDistortionOptions(input: unknown): DistortionOptions {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return { type: "wave", intensity: 0.5, scale: 20, speed: 1.0 };
  }

  const raw = input as Partial<DistortionOptions>;
  return {
    ...raw,
    type: raw.type && VALID_DISTORTION_TYPES.includes(raw.type) ? raw.type : "wave",
    intensity: typeof raw.intensity === "number" ? Math.max(0, Math.min(1, raw.intensity)) : 0.5,
    scale: typeof raw.scale === "number" ? Math.max(1, Math.min(200, raw.scale)) : 20,
    speed: typeof raw.speed === "number" ? raw.speed : 1.0,
  };
}

// ============================================================================
// 2. FLUID SCHEMAS & VALIDATION
// ============================================================================

export const VALID_FLUID_TYPES: readonly FluidType[] = [
  "metaball",
  "flow-field",
  "liquid-gradient",
  "liquid-transition",
  "gooey-blend",
  "liquid-surface",
];

export const FLUID_OPTIONS_SCHEMA = {
  type: "object",
  properties: {
    type: { type: "string", enum: VALID_FLUID_TYPES },
    colors: { type: "array", items: { type: "string" } },
    viscosity: { type: "number", minimum: 0, maximum: 1 },
    speed: { type: "number" },
    density: { type: "number", minimum: 1, maximum: 50 },
    turbulent: { type: "boolean" },
    seed: { type: ["number", "string"] },
  },
} as const;

export function validateFluidOptions(input: unknown): ValidationReport {
  const errors: string[] = [];
  if (input !== undefined && (input === null || typeof input !== "object" || Array.isArray(input))) {
    return { valid: false, errors: ["Fluid options must be an object if provided"] };
  }

  if (input && typeof input === "object") {
    const opts = input as FluidOptions;
    if (opts.type !== undefined && !VALID_FLUID_TYPES.includes(opts.type)) {
      errors.push(`Invalid fluid type "${opts.type}". Expected one of: ${VALID_FLUID_TYPES.join(", ")}`);
    }
    if (opts.viscosity !== undefined && (typeof opts.viscosity !== "number" || opts.viscosity < 0 || opts.viscosity > 1)) {
      errors.push("viscosity must be a number between 0 and 1");
    }
  }

  return { valid: errors.length === 0, errors: Object.freeze(errors) };
}

export function correctFluidOptions(input: unknown): FluidOptions {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return { type: "liquid-gradient", viscosity: 0.5, speed: 1.0 };
  }

  const raw = input as Partial<FluidOptions>;
  return {
    ...raw,
    type: raw.type && VALID_FLUID_TYPES.includes(raw.type) ? raw.type : "liquid-gradient",
    viscosity: typeof raw.viscosity === "number" ? Math.max(0, Math.min(1, raw.viscosity)) : 0.5,
    speed: typeof raw.speed === "number" ? raw.speed : 1.0,
    density: typeof raw.density === "number" ? Math.max(1, Math.min(50, Math.round(raw.density))) : 6,
  };
}

// ============================================================================
// 3. PARTICLE SCHEMAS & VALIDATION
// ============================================================================

export const VALID_PARTICLE_SHAPES: readonly ParticleShape[] = [
  "circle",
  "square",
  "triangle",
  "star",
  "spark",
];

export const PARTICLE_OPTIONS_SCHEMA = {
  type: "object",
  properties: {
    mode: { type: "string", enum: ["continuous", "burst"] },
    rate: { type: "number", minimum: 1, maximum: 500 },
    burstCount: { type: "number", minimum: 1, maximum: 1000 },
    maxParticles: { type: "number", minimum: 10, maximum: 2000 },
    shape: { type: "string", enum: VALID_PARTICLE_SHAPES },
    fade: { type: "boolean" },
    shrink: { type: "boolean" },
    autoStart: { type: "boolean" },
    seed: { type: ["number", "string"] },
  },
} as const;

export function validateParticleOptions(input: unknown): ValidationReport {
  const errors: string[] = [];
  if (input !== undefined && (input === null || typeof input !== "object" || Array.isArray(input))) {
    return { valid: false, errors: ["Particle options must be an object if provided"] };
  }

  if (input && typeof input === "object") {
    const opts = input as ParticleOptions;
    if (opts.shape !== undefined && !VALID_PARTICLE_SHAPES.includes(opts.shape)) {
      errors.push(`Invalid particle shape "${opts.shape}". Expected one of: ${VALID_PARTICLE_SHAPES.join(", ")}`);
    }
    if (opts.maxParticles !== undefined && (typeof opts.maxParticles !== "number" || opts.maxParticles < 10 || opts.maxParticles > 2000)) {
      errors.push("maxParticles must be a number between 10 and 2000");
    }
  }

  return { valid: errors.length === 0, errors: Object.freeze(errors) };
}

export function correctParticleOptions(input: unknown): ParticleOptions {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return { mode: "continuous", rate: 50, maxParticles: 300, shape: "circle" };
  }

  const raw = input as Partial<ParticleOptions>;
  return {
    ...raw,
    mode: raw.mode === "burst" ? "burst" : "continuous",
    rate: typeof raw.rate === "number" ? Math.max(1, Math.min(500, raw.rate)) : 50,
    burstCount: typeof raw.burstCount === "number" ? Math.max(1, Math.min(1000, raw.burstCount)) : 50,
    maxParticles: typeof raw.maxParticles === "number" ? Math.max(10, Math.min(2000, raw.maxParticles)) : 300,
    shape: raw.shape && VALID_PARTICLE_SHAPES.includes(raw.shape) ? raw.shape : "circle",
  };
}

// ============================================================================
// 4. ADVANCED EFFECTS SCHEMAS & VALIDATION
// ============================================================================

export const VALID_ADVANCED_EFFECT_TYPES: readonly AdvancedEffectType[] = [
  "glow-bloom",
  "vignette",
  "noise-overlay",
  "scanlines",
  "light-streaks",
  "gradient-animation",
  "background-transition",
];

export const ADVANCED_EFFECT_OPTIONS_SCHEMA = {
  type: "object",
  properties: {
    type: { type: "string", enum: VALID_ADVANCED_EFFECT_TYPES },
    intensity: { type: "number", minimum: 0, maximum: 1 },
    color: { type: "string" },
    secondaryColor: { type: "string" },
    speed: { type: "number" },
    opacity: { type: "number", minimum: 0, maximum: 1 },
    transitionProgress: { type: "number", minimum: 0, maximum: 1 },
  },
} as const;

export function validateAdvancedEffectOptions(input: unknown): ValidationReport {
  const errors: string[] = [];
  if (input !== undefined && (input === null || typeof input !== "object" || Array.isArray(input))) {
    return { valid: false, errors: ["Advanced effect options must be an object if provided"] };
  }

  if (input && typeof input === "object") {
    const opts = input as AdvancedEffectOptions;
    if (opts.type !== undefined && !VALID_ADVANCED_EFFECT_TYPES.includes(opts.type)) {
      errors.push(`Invalid effect type "${opts.type}". Expected one of: ${VALID_ADVANCED_EFFECT_TYPES.join(", ")}`);
    }
    if (opts.intensity !== undefined && (typeof opts.intensity !== "number" || opts.intensity < 0 || opts.intensity > 1)) {
      errors.push("intensity must be a number between 0 and 1");
    }
  }

  return { valid: errors.length === 0, errors: Object.freeze(errors) };
}

export function correctAdvancedEffectOptions(input: unknown): AdvancedEffectOptions {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return { type: "vignette", intensity: 0.5, speed: 1.0, opacity: 0.8 };
  }

  const raw = input as Partial<AdvancedEffectOptions>;
  return {
    ...raw,
    type: raw.type && VALID_ADVANCED_EFFECT_TYPES.includes(raw.type) ? raw.type : "vignette",
    intensity: typeof raw.intensity === "number" ? Math.max(0, Math.min(1, raw.intensity)) : 0.5,
    speed: typeof raw.speed === "number" ? raw.speed : 1.0,
    opacity: typeof raw.opacity === "number" ? Math.max(0, Math.min(1, raw.opacity)) : 0.8,
  };
}

// ============================================================================
// AI MOTION REGISTRY CAPABILITIES
// ============================================================================

export const DISTORTION_CAPABILITY = {
  id: "graphics-distortion",
  name: "createDistortionEffect",
  category: "graphics" as const,
  description: "Configurable wave, ripple, chromatic aberration, heat haze, and lens distortion graphics effect.",
  tags: ["distortion", "wave", "ripple", "chromatic-aberration", "heat-haze", "lens"],
  version: EFFECTS_SCHEMA_VERSION,
  parameters: [
    {
      name: "options",
      kind: "option" as const,
      type: "DistortionOptions",
      required: false,
      description: "Distortion parameters including type, intensity, scale, and speed.",
    },
  ],
  supportedTargets: ["HTMLCanvasElement"],
  signature: {
    importStatement: 'import { createDistortionEffect } from "af-motion/catalogue";',
    invocation: "const effect = createDistortionEffect({ type: 'wave', intensity: 0.6 });",
    exampleCode: "engine.registerEffect(createDistortionEffect({ type: 'heat-haze' }));",
  },
  controls: ["pause", "resume", "dispose"],
  callbacks: [],
  reducedMotion: "static-fallback" as const,
  compatibility: { browser: true, ssr: false, requiresCanvas: true },
  react: {
    available: true,
    componentName: "DistortionCanvas",
    hookName: "useDistortion",
    importPath: "af-motion/react",
  },
};

export const FLUID_EFFECTS_CAPABILITY = {
  id: "graphics-fluid",
  name: "createFluidEffect",
  category: "graphics" as const,
  description: "Lightweight fluid-like gradient, metaballs, flow fields, and liquid surfaces graphics effect.",
  tags: ["fluid", "metaball", "flow-field", "liquid-gradient", "viscosity"],
  version: EFFECTS_SCHEMA_VERSION,
  parameters: [
    {
      name: "options",
      kind: "option" as const,
      type: "FluidOptions",
      required: false,
      description: "Fluid parameters including type, colors, viscosity, density, and speed.",
    },
  ],
  supportedTargets: ["HTMLCanvasElement"],
  signature: {
    importStatement: 'import { createFluidEffect } from "af-motion/catalogue";',
    invocation: "const effect = createFluidEffect({ type: 'metaball', viscosity: 0.7 });",
    exampleCode: "engine.registerEffect(createFluidEffect({ type: 'liquid-gradient' }));",
  },
  controls: ["pause", "resume", "dispose"],
  callbacks: [],
  reducedMotion: "static-fallback" as const,
  compatibility: { browser: true, ssr: false, requiresCanvas: true },
  react: {
    available: true,
    componentName: "FluidCanvas",
    hookName: "useFluidEffect",
    importPath: "af-motion/react",
  },
};

export const PARTICLE_EFFECTS_CAPABILITY = {
  id: "graphics-particles",
  name: "createParticleEffect",
  category: "graphics" as const,
  description: "High-performance particle engine with bounded pooling, gravity, multiple shapes, and burst/continuous modes.",
  tags: ["particles", "emitter", "sparkles", "burst", "physics"],
  version: EFFECTS_SCHEMA_VERSION,
  parameters: [
    {
      name: "options",
      kind: "option" as const,
      type: "ParticleOptions",
      required: false,
      description: "Particle configuration including rate, burstCount, shape, gravity, and lifetime.",
    },
  ],
  supportedTargets: ["HTMLCanvasElement"],
  signature: {
    importStatement: 'import { createParticleEffect } from "af-motion/catalogue";',
    invocation: "const effect = createParticleEffect({ mode: 'continuous', rate: 80 });",
    exampleCode: "engine.registerEffect(createParticleEffect({ shape: 'star', burstCount: 60 }));",
  },
  controls: ["pause", "resume", "dispose"],
  callbacks: [],
  reducedMotion: "static-fallback" as const,
  compatibility: { browser: true, ssr: false, requiresCanvas: true },
  react: {
    available: true,
    componentName: "ParticleCanvas",
    hookName: "useParticles",
    importPath: "af-motion/react",
  },
};

export const ADVANCED_EFFECTS_CAPABILITY = {
  id: "graphics-advanced-effects",
  name: "createAdvancedEffect",
  category: "graphics" as const,
  description: "Post-processing visual enhancement effects including glow/bloom, vignette, scanlines, and light streaks.",
  tags: ["vignette", "scanlines", "bloom", "glow", "post-processing"],
  version: EFFECTS_SCHEMA_VERSION,
  parameters: [
    {
      name: "options",
      kind: "option" as const,
      type: "AdvancedEffectOptions",
      required: false,
      description: "Advanced post-processing parameters including effect type, intensity, and colors.",
    },
  ],
  supportedTargets: ["HTMLCanvasElement"],
  signature: {
    importStatement: 'import { createAdvancedEffect, composeGraphicsEffects } from "af-motion/catalogue";',
    invocation: "const effect = createAdvancedEffect({ type: 'vignette', intensity: 0.7 });",
    exampleCode: "engine.registerEffect(createAdvancedEffect({ type: 'scanlines' }));",
  },
  controls: ["pause", "resume", "dispose"],
  callbacks: [],
  reducedMotion: "static-fallback" as const,
  compatibility: { browser: true, ssr: false, requiresCanvas: true },
  react: {
    available: true,
    componentName: "AdvancedEffectsCanvas",
    hookName: "useAdvancedEffect",
    importPath: "af-motion/react",
  },
};

export function registerGraphicsEffectsCapabilities(registry: {
  registerCapability: (cap: any, opts?: any) => void;
}): void {
  registry.registerCapability(DISTORTION_CAPABILITY, { override: true });
  registry.registerCapability(FLUID_EFFECTS_CAPABILITY, { override: true });
  registry.registerCapability(PARTICLE_EFFECTS_CAPABILITY, { override: true });
  registry.registerCapability(ADVANCED_EFFECTS_CAPABILITY, { override: true });
}
