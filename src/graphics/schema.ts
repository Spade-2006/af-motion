import type { GraphicsEffect, GraphicsEngineOptions, RendererOptions } from "./types.js";

export const GRAPHICS_SCHEMA_VERSION = "1.0.0";

export const RENDERER_OPTIONS_SCHEMA = {
  type: "object",
  properties: {
    backend: {
      type: "string",
      enum: ["canvas2d", "webgl", "webgl2", "webgpu", "null", "auto"],
      default: "auto",
      description: "Rendering backend to use, or auto to choose best available.",
    },
    alpha: {
      type: "boolean",
      default: true,
      description: "Whether the canvas context supports transparency.",
    },
    antialias: {
      type: "boolean",
      default: true,
      description: "Whether to enable hardware antialiasing where supported.",
    },
    powerPreference: {
      type: "string",
      enum: ["default", "high-performance", "low-power"],
      default: "default",
      description: "GPU power preference for dual-GPU systems.",
    },
    preserveDrawingBuffer: {
      type: "boolean",
      default: false,
      description: "Whether buffers are preserved after rendering.",
    },
    dpr: {
      type: "number",
      minimum: 0.5,
      maximum: 4,
      description: "Device pixel ratio multiplier.",
    },
    fallbackBackend: {
      type: "string",
      enum: ["canvas2d", "null"],
      default: "canvas2d",
      description: "Fallback backend if preferred backend fails.",
    },
  },
  additionalProperties: false,
} as const;

export const GRAPHICS_ENGINE_OPTIONS_SCHEMA = {
  type: "object",
  properties: {
    renderer: {
      type: "object",
      description: "Custom renderer instance or renderer configuration options.",
    },
    dpr: {
      type: ["number", "string"],
      description: "Device pixel ratio ('auto' or numeric multiplier).",
    },
    autoStart: {
      type: "boolean",
      default: true,
      description: "Automatically begin animation loop on canvas attach.",
    },
    pauseOnHidden: {
      type: "boolean",
      default: true,
      description: "Automatically suspend rendering loop when browser tab is hidden.",
    },
    respectReducedMotion: {
      type: "boolean",
      default: true,
      description: "Honor prefers-reduced-motion OS preferences.",
    },
    fpsLimit: {
      type: "number",
      minimum: 1,
      maximum: 240,
      description: "Optional maximum frame rate limiter.",
    },
  },
  additionalProperties: false,
} as const;

export const GRAPHICS_CAPABILITIES_SCHEMA = {
  type: "object",
  properties: {
    supportedBackends: {
      type: "array",
      items: { type: "string" },
      description: "List of detected rendering backends available on this device.",
    },
    activeBackend: {
      type: "string",
      description: "Currently active rendering backend.",
    },
    canvas: { type: "boolean" },
    webgl: { type: "boolean" },
    webgl2: { type: "boolean" },
    webgpu: { type: "boolean" },
    maxTextureSize: { type: "number" },
    dpr: { type: "number" },
    reducedMotion: { type: "boolean" },
    colorSpace: { type: "string" },
    antialias: { type: "boolean" },
    floatTextures: { type: "boolean" },
    instancedArrays: { type: "boolean" },
  },
  required: ["supportedBackends", "activeBackend", "canvas", "webgl", "maxTextureSize", "dpr"],
} as const;

export interface ValidationReport {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

export function validateRendererOptions(input: unknown): ValidationReport {
  const errors: string[] = [];

  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return { valid: false, errors: ["Renderer options must be a valid object"] };
  }

  const opts = input as RendererOptions;

  if (opts.backend !== undefined) {
    const validBackends = ["canvas2d", "webgl", "webgl2", "webgpu", "null", "auto"];
    if (!validBackends.includes(opts.backend)) {
      errors.push(`Invalid backend "${opts.backend}". Expected one of: ${validBackends.join(", ")}`);
    }
  }

  if (opts.powerPreference !== undefined) {
    const validPower = ["default", "high-performance", "low-power"];
    if (!validPower.includes(opts.powerPreference)) {
      errors.push(`Invalid powerPreference "${opts.powerPreference}". Expected one of: ${validPower.join(", ")}`);
    }
  }

  if (opts.dpr !== undefined && (typeof opts.dpr !== "number" || isNaN(opts.dpr) || opts.dpr <= 0)) {
    errors.push("dpr must be a positive number greater than 0");
  }

  return { valid: errors.length === 0, errors: Object.freeze(errors) };
}

export function validateGraphicsEngineOptions(input: unknown): ValidationReport {
  const errors: string[] = [];

  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return { valid: false, errors: ["Graphics engine options must be a valid object"] };
  }

  const opts = input as GraphicsEngineOptions;

  if (opts.fpsLimit !== undefined) {
    if (typeof opts.fpsLimit !== "number" || isNaN(opts.fpsLimit) || opts.fpsLimit <= 0) {
      errors.push("fpsLimit must be a positive number greater than 0");
    }
  }

  if (opts.dpr !== undefined && opts.dpr !== "auto") {
    if (typeof opts.dpr !== "number" || isNaN(opts.dpr) || opts.dpr <= 0) {
      errors.push("dpr must be 'auto' or a positive number greater than 0");
    }
  }

  return { valid: errors.length === 0, errors: Object.freeze(errors) };
}

export function validateGraphicsEffect(input: unknown): ValidationReport {
  const errors: string[] = [];

  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return { valid: false, errors: ["GraphicsEffect must be a valid object"] };
  }

  const effect = input as GraphicsEffect;

  if (!effect.id || typeof effect.id !== "string" || effect.id.trim() === "") {
    errors.push("GraphicsEffect requires a non-empty string 'id'");
  }

  if (!effect.name || typeof effect.name !== "string" || effect.name.trim() === "") {
    errors.push("GraphicsEffect requires a non-empty string 'name'");
  }

  if (typeof effect.render !== "function") {
    errors.push("GraphicsEffect requires a 'render' function");
  }

  return { valid: errors.length === 0, errors: Object.freeze(errors) };
}

export function validateGraphicsEffectConfig(input: unknown): ValidationReport {
  if (input !== undefined && (input === null || typeof input !== "object")) {
    return { valid: false, errors: ["GraphicsEffect config must be an object if defined"] };
  }
  return { valid: true, errors: Object.freeze([]) };
}

export const GRAPHICS_RENDERING_CAPABILITY = {
  id: "graphics-rendering",
  name: "createGraphicsEngine",
  category: "graphics" as const,
  description: "Framework-independent 2D Canvas & WebGL graphics rendering engine with capability detection, effect lifecycle management, and resource ownership tracking.",
  tags: ["graphics", "canvas", "webgl", "renderer", "shader", "engine"],
  version: GRAPHICS_SCHEMA_VERSION,
  parameters: [
    {
      name: "options",
      kind: "option" as const,
      type: "GraphicsEngineOptions",
      required: false,
      description: "Configuration options for the graphics engine including renderer, DPR, and frame rate limit.",
    },
  ],
  supportedTargets: ["HTMLCanvasElement"],
  signature: {
    importStatement: 'import { createGraphicsEngine } from "af-motion/catalogue";',
    invocation: "const engine = createGraphicsEngine(options?); await engine.attach(canvas);",
    exampleCode: 'const engine = createGraphicsEngine({ autoStart: true });\nawait engine.attach(canvas);\nengine.registerEffect(myEffect);',
  },
  controls: ["attach", "detach", "registerEffect", "unregisterEffect", "start", "stop", "pause", "resume", "requestFrame", "resize", "destroy"],
  callbacks: ["onStateChange"],
  reducedMotion: "static-fallback" as const,
  compatibility: { browser: true, ssr: false, requiresCanvas: true },
  react: {
    available: true,
    componentName: "GraphicsCanvas",
    hookName: "useGraphics",
    importPath: "af-motion/react",
  },
};

export function registerGraphicsCapability(registry: { registerCapability: (cap: any, opts?: any) => void }): void {
  registry.registerCapability(GRAPHICS_RENDERING_CAPABILITY, { override: true });
}
