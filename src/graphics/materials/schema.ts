/**
 * AF Motion Materials & Glass Validation Schemas
 *
 * Schemas, validators, configuration correction, and AI capability registration
 * for materials, surfaces, lighting, and glass presets.
 */

import type { ValidationReport } from "../schema.js";
import { FROSTED_GLASS_PRESET, MATTE_MATERIAL } from "./presets.js";
import type {
  GlassMaterialOptions,
  LightingConfig,
  MaterialDefinition,
  SurfaceDefinition,
} from "./types.js";

export const MATERIALS_SCHEMA_VERSION = "1.0.0";

export const SURFACE_DEFINITION_SCHEMA = {
  type: "object",
  properties: {
    roughness: { type: "number", minimum: 0, maximum: 1 },
    smoothness: { type: "number", minimum: 0, maximum: 1 },
    opacity: { type: "number", minimum: 0, maximum: 1 },
    transmission: { type: "number", minimum: 0, maximum: 1 },
    baseColor: { type: "string" },
    border: {
      type: "object",
      properties: {
        width: { type: ["number", "string"] },
        style: { type: "string" },
        color: { type: "string" },
        radius: { type: ["number", "string"] },
        glow: { type: "string" },
      },
    },
    elevation: { type: "number", minimum: 0 },
    depth: { type: "number", minimum: 0 },
    highlight: {
      type: "object",
      properties: {
        color: { type: "string" },
        intensity: { type: "number", minimum: 0, maximum: 1 },
        angle: { type: "number" },
        spread: { type: "number" },
      },
    },
    reflectivity: { type: "number", minimum: 0, maximum: 1 },
    refractiveIndex: { type: "number", minimum: 1 },
    textureRef: { type: "string" },
    blendMode: {
      type: "string",
      enum: ["normal", "multiply", "screen", "overlay", "soft-light"],
    },
  },
} as const;

export const LIGHTING_CONFIG_SCHEMA = {
  type: "object",
  properties: {
    ambient: {
      type: "object",
      properties: {
        color: { type: "string" },
        intensity: { type: "number", minimum: 0, maximum: 2 },
      },
    },
    directional: {
      type: "object",
      properties: {
        direction: { type: "array", items: { type: "number" }, minItems: 3, maxItems: 3 },
        color: { type: "string" },
        intensity: { type: "number", minimum: 0, maximum: 5 },
      },
    },
    point: {
      type: "object",
      properties: {
        position: { type: "array", items: { type: "number" }, minItems: 3, maxItems: 3 },
        color: { type: "string" },
        intensity: { type: "number", minimum: 0, maximum: 5 },
        attenuation: { type: "number", minimum: 0 },
      },
    },
    highlight: {
      type: "object",
      properties: {
        color: { type: "string" },
        blur: { type: ["number", "string"] },
        angle: { type: "number" },
      },
    },
    shadows: {
      type: "array",
      items: {
        type: "object",
        properties: {
          offset: { type: "array", items: { type: "number" }, minItems: 2, maxItems: 2 },
          blur: { type: "number", minimum: 0 },
          spread: { type: "number" },
          color: { type: "string" },
          opacity: { type: "number", minimum: 0, maximum: 1 },
          inset: { type: "boolean" },
        },
      },
    },
    environment: {
      type: "object",
      properties: {
        preset: { type: "string", enum: ["studio", "dramatic", "ambient-soft", "neon", "sunset"] },
        intensity: { type: "number", minimum: 0 },
        tint: { type: "string" },
      },
    },
  },
} as const;

export const MATERIAL_DEFINITION_SCHEMA = {
  type: "object",
  required: ["id", "name", "type", "surface"],
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    type: {
      type: "string",
      enum: ["matte", "metallic", "glass", "plastic", "emissive", "translucent", "custom"],
    },
    version: { type: "string" },
    surface: SURFACE_DEFINITION_SCHEMA,
    lighting: LIGHTING_CONFIG_SCHEMA,
    uniforms: { type: "object" },
    customShaders: {
      type: "object",
      properties: {
        vertexShader: { type: "string" },
        fragmentShader: { type: "string" },
      },
    },
  },
} as const;

export const GLASS_OPTIONS_SCHEMA = {
  type: "object",
  properties: {
    preset: {
      type: "string",
      enum: ["frosted-glass", "clear-glass", "tinted-glass", "liquid-glass", "acrylic", "translucent-panel"],
    },
    blur: { type: "number", minimum: 0, maximum: 100 },
    opacity: { type: "number", minimum: 0, maximum: 1 },
    tint: { type: "string" },
    elevation: { type: "number", minimum: 0, maximum: 24 },
    edgeHighlight: { type: "boolean" },
    borderWidth: { type: ["number", "string"] },
    borderColor: { type: "string" },
    borderRadius: { type: ["number", "string"] },
    refractiveIndex: { type: "number", minimum: 1, maximum: 3 },
    highContrast: { type: "boolean" },
    reducedMotion: { type: "boolean" },
  },
} as const;

export function validateSurfaceDefinition(input: unknown): ValidationReport {
  const errors: string[] = [];
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return { valid: false, errors: ["Surface definition must be an object"] };
  }
  const s = input as SurfaceDefinition;
  if (s.roughness !== undefined && (typeof s.roughness !== "number" || s.roughness < 0 || s.roughness > 1)) {
    errors.push("Surface roughness must be a number between 0 and 1");
  }
  if (s.smoothness !== undefined && (typeof s.smoothness !== "number" || s.smoothness < 0 || s.smoothness > 1)) {
    errors.push("Surface smoothness must be a number between 0 and 1");
  }
  if (s.opacity !== undefined && (typeof s.opacity !== "number" || s.opacity < 0 || s.opacity > 1)) {
    errors.push("Surface opacity must be a number between 0 and 1");
  }
  return { valid: errors.length === 0, errors: Object.freeze(errors) };
}

export function validateLightingConfig(input: unknown): ValidationReport {
  const errors: string[] = [];
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return { valid: false, errors: ["Lighting config must be an object"] };
  }
  const l = input as LightingConfig;
  if (l.ambient?.intensity !== undefined && (typeof l.ambient.intensity !== "number" || l.ambient.intensity < 0)) {
    errors.push("Ambient intensity must be a non-negative number");
  }
  if (l.directional?.intensity !== undefined && (typeof l.directional.intensity !== "number" || l.directional.intensity < 0)) {
    errors.push("Directional intensity must be a non-negative number");
  }
  return { valid: errors.length === 0, errors: Object.freeze(errors) };
}

export function validateMaterialDefinition(input: unknown): ValidationReport {
  const errors: string[] = [];
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return { valid: false, errors: ["Material definition must be an object"] };
  }
  const m = input as MaterialDefinition;
  if (!m.id || typeof m.id !== "string" || m.id.trim() === "") {
    errors.push("Material requires a non-empty string 'id'");
  }
  if (!m.name || typeof m.name !== "string" || m.name.trim() === "") {
    errors.push("Material requires a non-empty string 'name'");
  }
  const validTypes = ["matte", "metallic", "glass", "plastic", "emissive", "translucent", "custom"];
  if (!m.type || !validTypes.includes(m.type)) {
    errors.push(`Material type must be one of: ${validTypes.join(", ")}`);
  }
  if (!m.surface || typeof m.surface !== "object") {
    errors.push("Material requires a valid 'surface' definition object");
  } else {
    const surfaceValidation = validateSurfaceDefinition(m.surface);
    if (!surfaceValidation.valid) {
      errors.push(...surfaceValidation.errors);
    }
  }
  return { valid: errors.length === 0, errors: Object.freeze(errors) };
}

export function validateGlassOptions(input: unknown): ValidationReport {
  const errors: string[] = [];
  if (input !== undefined && (input === null || typeof input !== "object" || Array.isArray(input))) {
    return { valid: false, errors: ["Glass options must be an object if provided"] };
  }
  if (input && typeof input === "object") {
    const g = input as GlassMaterialOptions;
    if (g.blur !== undefined && (typeof g.blur !== "number" || g.blur < 0)) {
      errors.push("blur must be a non-negative number");
    }
    if (g.opacity !== undefined && (typeof g.opacity !== "number" || g.opacity < 0 || g.opacity > 1)) {
      errors.push("opacity must be a number between 0 and 1");
    }
    if (g.elevation !== undefined && (typeof g.elevation !== "number" || g.elevation < 0)) {
      errors.push("elevation must be a non-negative number");
    }
  }
  return { valid: errors.length === 0, errors: Object.freeze(errors) };
}

export function correctMaterialConfig(input: unknown): MaterialDefinition {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return MATTE_MATERIAL;
  }
  const raw = input as Partial<MaterialDefinition>;
  const validTypes = ["matte", "metallic", "glass", "plastic", "emissive", "translucent", "custom"];
  const type = raw.type && validTypes.includes(raw.type) ? raw.type : "matte";

  const surface: SurfaceDefinition = {
    ...raw.surface,
    roughness: typeof raw.surface?.roughness === "number" ? Math.max(0, Math.min(1, raw.surface.roughness)) : 0.5,
    smoothness: typeof raw.surface?.smoothness === "number" ? Math.max(0, Math.min(1, raw.surface.smoothness)) : 0.5,
    opacity: typeof raw.surface?.opacity === "number" ? Math.max(0, Math.min(1, raw.surface.opacity)) : 1.0,
    baseColor: typeof raw.surface?.baseColor === "string" ? raw.surface.baseColor : "#f8fafc",
    elevation: typeof raw.surface?.elevation === "number" ? Math.max(0, raw.surface.elevation) : 1,
  };

  return {
    id: typeof raw.id === "string" && raw.id.trim() ? raw.id.trim() : "corrected-material",
    name: typeof raw.name === "string" && raw.name.trim() ? raw.name.trim() : "Corrected Material",
    type,
    version: raw.version ?? MATERIALS_SCHEMA_VERSION,
    surface,
    lighting: raw.lighting,
    uniforms: raw.uniforms,
  };
}

export function correctGlassConfig(input: unknown): GlassMaterialOptions {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return FROSTED_GLASS_PRESET;
  }
  const raw = input as Partial<GlassMaterialOptions>;
  const validPresets = ["frosted-glass", "clear-glass", "tinted-glass", "liquid-glass", "acrylic", "translucent-panel"];
  const preset = raw.preset && validPresets.includes(raw.preset) ? raw.preset : "frosted-glass";

  return {
    preset,
    blur: typeof raw.blur === "number" ? Math.max(0, Math.min(100, raw.blur)) : 16,
    opacity: typeof raw.opacity === "number" ? Math.max(0, Math.min(1, raw.opacity)) : 0.25,
    tint: typeof raw.tint === "string" ? raw.tint : "rgba(255, 255, 255, 0.2)",
    elevation: typeof raw.elevation === "number" ? Math.max(0, Math.min(24, raw.elevation)) : 2,
    edgeHighlight: raw.edgeHighlight !== false,
    borderWidth: raw.borderWidth ?? "1px",
    borderColor: raw.borderColor ?? "rgba(255, 255, 255, 0.3)",
    borderRadius: raw.borderRadius ?? "16px",
    refractiveIndex: typeof raw.refractiveIndex === "number" ? Math.max(1, Math.min(3, raw.refractiveIndex)) : 1.45,
    highContrast: Boolean(raw.highContrast),
    reducedMotion: Boolean(raw.reducedMotion),
  };
}

export const MATERIALS_SYSTEM_CAPABILITY = {
  id: "materials-system",
  name: "computeGlassStyle",
  category: "graphics" as const,
  description: "Material, surface, lighting, and progressive glass effect infrastructure with CSS backdrop-filter fallback and shader uniforms.",
  tags: ["materials", "surfaces", "lighting", "glass", "frosted-glass", "acrylic"],
  version: MATERIALS_SCHEMA_VERSION,
  parameters: [
    {
      name: "preset",
      kind: "option" as const,
      type: "GlassPresetName",
      required: false,
      description: "Glass preset name (frosted-glass, clear-glass, tinted-glass, liquid-glass, acrylic, translucent-panel).",
    },
    {
      name: "options",
      kind: "option" as const,
      type: "GlassMaterialOptions",
      required: false,
      description: "Glass customization options including blur, opacity, tint, and highContrast.",
    },
  ],
  supportedTargets: ["HTMLElement", "HTMLCanvasElement"],
  signature: {
    importStatement: 'import { computeGlassStyle, getMaterialPreset } from "af-motion/catalogue";',
    invocation: "const style = computeGlassStyle('frosted-glass', options);",
    exampleCode: "const style = computeGlassStyle('acrylic', { blur: 24, tint: 'rgba(255,255,255,0.3)' });",
  },
  controls: ["computeGlassStyle", "computeSurfaceStyle", "resolveLighting", "getMaterialPreset"],
  callbacks: [],
  reducedMotion: "static-fallback" as const,
  compatibility: { browser: true, ssr: true, requiresCanvas: false },
  react: {
    available: true,
    componentName: "GlassSurface",
    hookName: "useGlass",
    importPath: "af-motion/react",
  },
};

export function registerMaterialsCapability(registry: { registerCapability: (cap: any, opts?: any) => void }): void {
  registry.registerCapability(MATERIALS_SYSTEM_CAPABILITY, { override: true });
}
