/**
 * AF Motion Procedural Texture Validation Schemas
 *
 * Schemas, validators, configuration correction, and AI capability registration
 * for procedural textures and pattern generators.
 */

import type { ValidationReport } from "../schema.js";
import type {
  ProceduralTextureConfig,
  ProceduralTextureOptions,
  TextureGeneratorName,
} from "./types.js";

export const TEXTURE_SCHEMA_VERSION = "1.0.0";

export const VALID_TEXTURE_GENERATORS: readonly TextureGeneratorName[] = [
  "noise",
  "paper",
  "fabric",
  "marble",
  "wood",
  "metal-brush",
  "halftone",
  "dots",
  "stripes",
  "organic-gradient",
  "topographic",
  "imperfections",
] as const;

export const TEXTURE_OPTIONS_SCHEMA = {
  type: "object",
  properties: {
    seed: { type: ["number", "string"] },
    width: { type: "number", minimum: 8, maximum: 2048 },
    height: { type: "number", minimum: 8, maximum: 2048 },
    quality: { type: "string", enum: ["low", "medium", "high"] },
    dpr: { type: "number", minimum: 0.5, maximum: 4 },
    color: { type: "string" },
    secondaryColor: { type: "string" },
    accentColor: { type: "string" },
    opacity: { type: "number", minimum: 0, maximum: 1 },
    intensity: { type: "number", minimum: 0 },
    scale: {
      anyOf: [
        { type: "number" },
        { type: "array", items: { type: "number" }, minItems: 2, maxItems: 2 },
      ],
    },
    contrast: { type: "number", minimum: 0 },
    roughness: { type: "number", minimum: 0, maximum: 1 },
    angle: { type: "number" },
    frequency: { type: "number", minimum: 0 },
    custom: { type: "object" },
  },
} as const;

export const TEXTURE_CONFIG_SCHEMA = {
  type: "object",
  required: ["generator"],
  properties: {
    generator: {
      type: "string",
      enum: VALID_TEXTURE_GENERATORS,
    },
    options: TEXTURE_OPTIONS_SCHEMA,
  },
} as const;

export function validateTextureOptions(input: unknown): ValidationReport {
  const errors: string[] = [];
  if (input !== undefined && (input === null || typeof input !== "object" || Array.isArray(input))) {
    return { valid: false, errors: ["Texture options must be an object if provided"] };
  }

  if (input && typeof input === "object") {
    const opts = input as ProceduralTextureOptions;
    if (opts.width !== undefined && (typeof opts.width !== "number" || opts.width < 8 || opts.width > 2048)) {
      errors.push("width must be a number between 8 and 2048");
    }
    if (opts.height !== undefined && (typeof opts.height !== "number" || opts.height < 8 || opts.height > 2048)) {
      errors.push("height must be a number between 8 and 2048");
    }
    if (opts.opacity !== undefined && (typeof opts.opacity !== "number" || opts.opacity < 0 || opts.opacity > 1)) {
      errors.push("opacity must be a number between 0 and 1");
    }
    if (opts.quality !== undefined && !["low", "medium", "high"].includes(opts.quality)) {
      errors.push("quality must be 'low', 'medium', or 'high'");
    }
  }

  return { valid: errors.length === 0, errors: Object.freeze(errors) };
}

export function validateTextureConfig(input: unknown): ValidationReport {
  const errors: string[] = [];
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return { valid: false, errors: ["Texture configuration must be a valid object"] };
  }

  const cfg = input as Partial<ProceduralTextureConfig>;
  if (!cfg.generator || typeof cfg.generator !== "string") {
    errors.push("Texture configuration requires a 'generator' name string");
  } else if (!VALID_TEXTURE_GENERATORS.includes(cfg.generator as TextureGeneratorName)) {
    errors.push(`Invalid generator "${cfg.generator}". Expected one of: ${VALID_TEXTURE_GENERATORS.join(", ")}`);
  }

  if (cfg.options !== undefined) {
    const optRes = validateTextureOptions(cfg.options);
    if (!optRes.valid) {
      errors.push(...optRes.errors);
    }
  }

  return { valid: errors.length === 0, errors: Object.freeze(errors) };
}

export function correctTextureConfig(input: unknown): ProceduralTextureConfig {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return { generator: "noise", options: { quality: "medium" } };
  }

  const raw = input as Partial<ProceduralTextureConfig>;
  const generator: TextureGeneratorName =
    raw.generator && VALID_TEXTURE_GENERATORS.includes(raw.generator as TextureGeneratorName)
      ? (raw.generator as TextureGeneratorName)
      : "noise";

  const rawOpts = raw.options ?? {};
  const options: ProceduralTextureOptions = {
    ...rawOpts,
    width: typeof rawOpts.width === "number" ? Math.max(8, Math.min(2048, rawOpts.width)) : undefined,
    height: typeof rawOpts.height === "number" ? Math.max(8, Math.min(2048, rawOpts.height)) : undefined,
    opacity: typeof rawOpts.opacity === "number" ? Math.max(0, Math.min(1, rawOpts.opacity)) : undefined,
    quality: rawOpts.quality && ["low", "medium", "high"].includes(rawOpts.quality) ? rawOpts.quality : "medium",
  };

  return {
    generator,
    options,
  };
}

export const TEXTURE_GENERATION_CAPABILITY = {
  id: "procedural-textures",
  name: "generateProceduralTexture",
  category: "graphics" as const,
  description: "Deterministic procedural texture and pattern generator supporting 12 material and graphic patterns, bounded LRU caching, and progressive backends.",
  tags: ["textures", "patterns", "procedural", "canvas", "css", "materials", "noise", "marble", "paper", "wood"],
  version: TEXTURE_SCHEMA_VERSION,
  parameters: [
    {
      name: "config",
      kind: "positional" as const,
      type: "ProceduralTextureConfig",
      required: true,
      description: "Texture generator configuration including generator name and options.",
    },
    {
      name: "options",
      kind: "option" as const,
      type: "GenerateTextureExecutionOptions",
      required: false,
      description: "Execution options including caching and resource manager integration.",
    },
  ],
  supportedTargets: ["HTMLElement", "HTMLCanvasElement"],
  signature: {
    importStatement: 'import { generateProceduralTexture, applyTextureToSurface } from "af-motion/catalogue";',
    invocation: "const texture = generateProceduralTexture({ generator: 'marble', options: { seed: 42 } });",
    exampleCode: "const texture = generateProceduralTexture({ generator: 'paper', options: { color: '#faf8f5' } });\nconst style = applyTextureToSurface(surface, texture);",
  },
  controls: ["generateProceduralTexture", "applyTextureToSurface", "listTextureGenerators"],
  callbacks: [],
  reducedMotion: "static-fallback" as const,
  compatibility: { browser: true, ssr: true, requiresCanvas: false },
  react: {
    available: true,
    componentName: "ProceduralTexture",
    hookName: "useTexture",
    importPath: "af-motion/react",
  },
};

export function registerTextureCapability(registry: { registerCapability: (cap: any, opts?: any) => void }): void {
  registry.registerCapability(TEXTURE_GENERATION_CAPABILITY, { override: true });
}
