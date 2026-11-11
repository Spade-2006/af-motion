/**
 * AF Motion Graphics Composition Schemas & AI Capabilities
 *
 * Schemas, validators, configuration correctors, and AI Motion Registry capability
 * for unified graphics compositions and multi-layer rendering pipelines.
 */

import type { ValidationReport } from "../schema.js";
import { sortCompositionLayers } from "./ordering.js";
import type {
  GraphicsCompositionDefinition,
  GraphicsLayer,
  GraphicsQualityLevel,
} from "./types.js";

export const COMPOSITION_SCHEMA_VERSION = "1.0.0";

export const GRAPHICS_LAYER_SCHEMA = {
  type: "object",
  required: ["id", "name", "type", "order"],
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    type: { type: "string", enum: ["effect", "material", "texture", "particles", "custom"] },
    order: { type: "number" },
    enabled: { type: "boolean" },
    opacity: { type: "number", minimum: 0, maximum: 1 },
    blendMode: { type: "string" },
    dependsOn: { type: "array", items: { type: "string" } },
  },
} as const;

export const GRAPHICS_COMPOSITION_SCHEMA = {
  type: "object",
  required: ["id", "name", "layers"],
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    version: { type: "string" },
    layers: {
      type: "array",
      items: GRAPHICS_LAYER_SCHEMA,
    },
    quality: { type: "string", enum: ["low", "medium", "high", "ultra"] },
    autoAdaptQuality: { type: "boolean" },
    respectReducedMotion: { type: "boolean" },
  },
} as const;

export function validateGraphicsLayer(input: unknown): ValidationReport {
  const errors: string[] = [];
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return { valid: false, errors: ["Graphics layer must be an object"] };
  }

  const layer = input as Partial<GraphicsLayer>;
  if (!layer.id || typeof layer.id !== "string") {
    errors.push("Layer requires a non-empty string 'id'");
  }
  if (!layer.name || typeof layer.name !== "string") {
    errors.push("Layer requires a non-empty string 'name'");
  }
  if (!layer.type || !["effect", "material", "texture", "particles", "custom"].includes(layer.type)) {
    errors.push("Layer requires a valid 'type' ('effect', 'material', 'texture', 'particles', 'custom')");
  }
  if (typeof layer.order !== "number") {
    errors.push("Layer requires a numeric 'order'");
  }

  return { valid: errors.length === 0, errors: Object.freeze(errors) };
}

export function validateGraphicsComposition(input: unknown): ValidationReport {
  const errors: string[] = [];
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return { valid: false, errors: ["Graphics composition must be a valid object"] };
  }

  const comp = input as Partial<GraphicsCompositionDefinition>;
  if (!comp.id || typeof comp.id !== "string") {
    errors.push("Composition requires a non-empty string 'id'");
  }
  if (!comp.name || typeof comp.name !== "string") {
    errors.push("Composition requires a non-empty string 'name'");
  }
  if (!Array.isArray(comp.layers)) {
    errors.push("Composition requires a 'layers' array");
  } else {
    for (const layer of comp.layers) {
      const layerRes = validateGraphicsLayer(layer);
      if (!layerRes.valid) {
        errors.push(...layerRes.errors);
      }
    }
  }

  return { valid: errors.length === 0, errors: Object.freeze(errors) };
}

export function correctGraphicsComposition(input: unknown): GraphicsCompositionDefinition {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return {
      id: "composition-default",
      name: "Default Composition",
      layers: [],
      quality: "high",
    };
  }

  const raw = input as Partial<GraphicsCompositionDefinition>;
  const validQualities: GraphicsQualityLevel[] = ["low", "medium", "high", "ultra"];
  const quality = raw.quality && validQualities.includes(raw.quality) ? raw.quality : "high";

  const rawLayers = Array.isArray(raw.layers) ? raw.layers : [];
  const layers: GraphicsLayer[] = rawLayers.map((l, index) => ({
    id: l.id || `layer-${index + 1}`,
    name: l.name || `Layer ${index + 1}`,
    type: l.type && ["effect", "material", "texture", "particles", "custom"].includes(l.type) ? l.type : "custom",
    order: typeof l.order === "number" ? l.order : index,
    enabled: l.enabled !== false,
    opacity: typeof l.opacity === "number" ? Math.max(0, Math.min(1, l.opacity)) : 1.0,
    blendMode: l.blendMode,
    effect: l.effect,
    texture: l.texture,
    surface: l.surface,
    dependsOn: Array.isArray(l.dependsOn) ? l.dependsOn : undefined,
  }));

  let sortedLayers: readonly GraphicsLayer[] = layers;
  try {
    sortedLayers = sortCompositionLayers(layers);
  } catch {
    // If dependency cycle in malformed config, fall back to numerical order
    sortedLayers = [...layers].sort((a, b) => a.order - b.order);
  }

  return {
    id: typeof raw.id === "string" && raw.id.trim() ? raw.id.trim() : "composition-corrected",
    name: typeof raw.name === "string" && raw.name.trim() ? raw.name.trim() : "Corrected Composition",
    version: raw.version ?? COMPOSITION_SCHEMA_VERSION,
    layers: sortedLayers,
    quality,
    autoAdaptQuality: Boolean(raw.autoAdaptQuality),
    respectReducedMotion: Boolean(raw.respectReducedMotion),
  };
}

export const GRAPHICS_COMPOSITION_CAPABILITY = {
  id: "graphics-composition",
  name: "createGraphicsComposition",
  category: "graphics" as const,
  description: "Unified multi-layer graphics composition coordinating renderers, materials, procedural textures, particle engines, and post-processing effects with adaptive quality management.",
  tags: ["composition", "graphics", "layers", "pipeline", "quality", "adaptation"],
  version: COMPOSITION_SCHEMA_VERSION,
  parameters: [
    {
      name: "definition",
      kind: "positional" as const,
      type: "GraphicsCompositionDefinition",
      required: true,
      description: "Composition definition containing ordered layers, materials, lighting, and quality preferences.",
    },
    {
      name: "options",
      kind: "option" as const,
      type: "CreateCompositionOptions",
      required: false,
      description: "Composition runtime options such as autoStart.",
    },
  ],
  supportedTargets: ["HTMLCanvasElement"],
  signature: {
    importStatement: 'import { createGraphicsComposition } from "af-motion/catalogue";',
    invocation: "const composition = createGraphicsComposition(definition); await composition.attach(canvas);",
    exampleCode: "const composition = createGraphicsComposition({ id: 'hero', name: 'Hero Scene', layers: [...] });",
  },
  controls: ["attach", "detach", "updateLayer", "setQuality", "getPerformanceStats", "destroy"],
  callbacks: [],
  reducedMotion: "static-fallback" as const,
  compatibility: { browser: true, ssr: false, requiresCanvas: true },
  react: {
    available: true,
    componentName: "GraphicsCompositionView",
    hookName: "useGraphicsComposition",
    importPath: "af-motion/react",
  },
};

export function registerGraphicsCompositionCapability(registry: {
  registerCapability: (cap: any, opts?: any) => void;
}): void {
  registry.registerCapability(GRAPHICS_COMPOSITION_CAPABILITY, { override: true });
}
