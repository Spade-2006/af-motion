/**
 * AF Motion AI 3D Scene Generation
 *
 * Deterministic pipeline for generating complete, validated, capability-safe
 * 3D scene specifications from natural-language descriptions or structured intents.
 */

import { SCENE_SPECIFICATION_VERSION } from "../schemas/schemas.js";
import type {
  Camera3DConfig,
  Lighting3DConfig,
  MaterialSpec,
  PrimitiveGeometrySpec,
  PrimitiveObjectSpec,
  Scene3DSpecification,
  SceneObjectSpec,
} from "../schemas/types.js";
import { validateSceneSchema, type ValidationReport } from "../schemas/validation.js";
import { correctSceneSchema } from "../schemas/correction.js";
import { resolve3DSceneFallbacks, type FallbackResolutionOptions } from "./fallback.js";
import { getSceneRecipe, type Scene3DRecipeName } from "./recipes.js";
import type { Scene3DFallbackDecision, Scene3DIntent } from "./types.js";
import { CAMERA_PRESETS } from "../camera/presets.js";
import { LIGHTING_3D_PRESETS } from "../lighting/presets.js";
import { ENVIRONMENT_PRESETS } from "../environment/presets.js";
import { MATERIAL_3D_PRESETS } from "../materials/presets.js";

export interface Scene3DGenerationResult {
  readonly spec: Scene3DSpecification;
  readonly fallbackDecision: Scene3DFallbackDecision;
  readonly validationReport: ValidationReport;
  readonly appliedIntent: Scene3DIntent;
}

/**
 * Extracts structured intent from a natural-language description.
 */
export function parseNaturalLanguageSceneIntent(description: string): Scene3DIntent {
  const text = description.toLowerCase();

  // Recipe/Style detection
  let recipe: Scene3DRecipeName = "product-showcase";
  if (text.includes("cinematic") || text.includes("dramatic") || text.includes("movie") || text.includes("film")) {
    recipe = "cinematic-hero";
  } else if (text.includes("abstract") || text.includes("neon") || text.includes("glow") || text.includes("cyber")) {
    recipe = "abstract-environment";
  } else if (text.includes("portfolio") || text.includes("gallery") || text.includes("cards") || text.includes("grid")) {
    recipe = "interactive-portfolio";
  } else if (text.includes("story") || text.includes("journey") || text.includes("waypoint") || text.includes("chapter")) {
    recipe = "spatial-storytelling";
  } else if (text.includes("arch") || text.includes("building") || text.includes("isometric") || text.includes("room")) {
    recipe = "architectural-viz";
  } else if (text.includes("floating") || text.includes("levitat") || text.includes("bobbing")) {
    recipe = "floating-object";
  } else if (text.includes("scroll") || text.includes("breakdown") || text.includes("scrub")) {
    recipe = "scroll-product-narrative";
  }

  // Camera detection
  let cameraStaging: Scene3DIntent["cameraStaging"] = undefined;
  if (text.includes("isometric") || text.includes("orthographic")) cameraStaging = "isometric";
  else if (text.includes("portrait")) cameraStaging = "portrait";
  else if (text.includes("wide") || text.includes("panoramic")) cameraStaging = "wide";
  else if (text.includes("top-down") || text.includes("overhead")) cameraStaging = "top-down";
  else if (text.includes("cinematic")) cameraStaging = "cinematic";

  // Lighting detection
  let lightingPreset: Scene3DIntent["lightingPreset"] = undefined;
  if (text.includes("cinematic")) lightingPreset = "cinematic";
  else if (text.includes("dramatic") || text.includes("moody")) lightingPreset = "dramatic";
  else if (text.includes("daylight") || text.includes("sun")) lightingPreset = "daylight";
  else if (text.includes("sunset") || text.includes("golden hour")) lightingPreset = "sunset";
  else if (text.includes("neon") || text.includes("synthwave")) lightingPreset = "neon";
  else if (text.includes("product") || text.includes("clean")) lightingPreset = "product";

  // Material detection
  let materialPreset: Scene3DIntent["materialPreset"] = undefined;
  if (text.includes("chrome") || text.includes("silver") || text.includes("metal")) materialPreset = "chrome";
  else if (text.includes("gold") || text.includes("golden")) materialPreset = "gold";
  else if (text.includes("glass") || text.includes("crystal") || text.includes("transparent")) materialPreset = "frosted-glass";
  else if (text.includes("plastic") || text.includes("matte")) materialPreset = "matte-plastic";
  else if (text.includes("velvet") || text.includes("fabric")) materialPreset = "velvet";
  else if (text.includes("neon") || text.includes("glow")) materialPreset = "neon-glow";

  // Reduced motion
  const reducedMotion = text.includes("reduced motion") || text.includes("no motion") || text.includes("static");

  return {
    description,
    visualStyle: recipe,
    cameraStaging,
    lightingPreset,
    materialPreset,
    reducedMotion,
  };
}

/**
 * Generates a complete, capability-checked, validated 3D scene from an intent or prompt.
 */
export function generate3DSceneFromIntent(
  intentOrPrompt: Scene3DIntent | string,
  options: FallbackResolutionOptions = {}
): Scene3DGenerationResult {
  const intent: Scene3DIntent =
    typeof intentOrPrompt === "string"
      ? parseNaturalLanguageSceneIntent(intentOrPrompt)
      : intentOrPrompt;

  // 1. Resolve Recipe Base
  const recipeName = (intent.visualStyle as Scene3DRecipeName) || "product-showcase";
  const baseSpec = getSceneRecipe(recipeName);

  // 2. Apply Intent Overrides
  let cameraConfig: Camera3DConfig = baseSpec.camera ?? {
    type: "perspective",
    fov: 45,
    position: [0, 1.5, 6],
    target: [0, 0, 0],
  };

  if (intent.cameraStaging && CAMERA_PRESETS[intent.cameraStaging]) {
    const p = CAMERA_PRESETS[intent.cameraStaging];
    cameraConfig = {
      ...cameraConfig,
      type: p.type,
      fov: p.fov ?? cameraConfig.fov,
      position: p.position ? [p.position[0], p.position[1], p.position[2]] : cameraConfig.position,
      target: p.target ? [p.target[0], p.target[1], p.target[2]] : cameraConfig.target,
      zoom: p.zoom,
    };
  }

  let lightingConfig: Lighting3DConfig = baseSpec.lighting ?? {
    ambient: { color: "#ffffff", intensity: 0.5 },
    directional: [{ color: "#ffffff", intensity: 1.0, position: [5, 5, 5] }],
  };

  if (intent.lightingPreset && LIGHTING_3D_PRESETS[intent.lightingPreset]) {
    const l = LIGHTING_3D_PRESETS[intent.lightingPreset];
    lightingConfig = {
      ambient: l.ambient ? { ...l.ambient } : lightingConfig.ambient,
      directional: l.directional ? [...l.directional] : lightingConfig.directional,
      point: l.point ? [...l.point] : lightingConfig.point,
      spot: l.spot ? [...l.spot] : lightingConfig.spot,
    };
  }

  let envConfig = baseSpec.environment;
  if (intent.environmentPreset && ENVIRONMENT_PRESETS[intent.environmentPreset]) {
    const e = ENVIRONMENT_PRESETS[intent.environmentPreset];
    envConfig = {
      background: e.background,
      transparent: e.transparent,
      fog: e.fog ? { ...e.fog } : undefined,
      ground: e.ground ? { ...e.ground } : undefined,
    };
  }

  // 3. Resolve Objects
  let sceneObjects = [...baseSpec.objects];
  if (intent.objects && intent.objects.length > 0) {
    sceneObjects = intent.objects.map((o, idx) => {
      const objId = o.id ?? `intent-obj-${idx + 1}`;
      const name = o.name ?? `Object ${idx + 1}`;
      const pos = o.position ?? [0, 0, 0];
      const scale = o.scale ?? [1, 1, 1];

      let matSpec: MaterialSpec = { type: "standard", color: "#3b82f6" };
      const matPresetKey = o.materialPreset ?? intent.materialPreset;
      if (matPresetKey && MATERIAL_3D_PRESETS[matPresetKey]) {
        const p = MATERIAL_3D_PRESETS[matPresetKey];
        matSpec = {
          type: p.type ?? "standard",
          color: p.color ?? "#ffffff",
          roughness: p.roughness ?? 0.5,
          metalness: p.metalness ?? 0.5,
          transmission: p.transmission,
          transparent: p.transparent,
          opacity: p.opacity,
        };
      }

      if (o.modelUrl) {
        return {
          id: objId,
          name,
          type: "model",
          transform: { position: pos, scale },
          model: {
            type: "model",
            format: o.modelUrl.endsWith(".glb") ? "glb" : "gltf",
            url: o.modelUrl,
          },
          material: matSpec,
        } as SceneObjectSpec;
      }

      const primType = (o.primitive as PrimitiveGeometrySpec["primitive"]) || "box";
      return {
        id: objId,
        name,
        type: "primitive",
        transform: { position: pos, scale },
        geometry: {
          type: "primitive",
          primitive: primType,
        },
        material: matSpec,
      } as PrimitiveObjectSpec;
    });
  } else if (intent.materialPreset && MATERIAL_3D_PRESETS[intent.materialPreset]) {
    // Override material on hero objects
    const p = MATERIAL_3D_PRESETS[intent.materialPreset];
    sceneObjects = sceneObjects.map((obj) => {
      if ("material" in obj && obj.material) {
        return {
          ...obj,
          material: {
            ...obj.material,
            type: p.type ?? "standard",
            color: p.color ?? obj.material.color,
            roughness: p.roughness ?? obj.material.roughness,
            metalness: p.metalness ?? obj.material.metalness,
            transmission: p.transmission ?? obj.material.transmission,
          },
        } as SceneObjectSpec;
      }
      return obj;
    });
  }

  // 4. Construct Spec
  const rawSpec: Scene3DSpecification = {
    ...baseSpec,
    id: `generated-scene-${Date.now().toString(36)}`,
    name: intent.description ? `Generated: ${intent.description.slice(0, 30)}` : baseSpec.name,
    version: SCENE_SPECIFICATION_VERSION,
    camera: cameraConfig,
    lighting: lightingConfig,
    environment: envConfig,
    objects: sceneObjects,
    respectReducedMotion: intent.reducedMotion ?? baseSpec.respectReducedMotion ?? true,
  };

  // 5. Sanitize & Correct
  const correctedSpec = correctSceneSchema(rawSpec);

  // 6. Capability-Aware Fallbacks
  const fallbackDecision = resolve3DSceneFallbacks(correctedSpec, {
    ...options,
    forceReducedMotion: intent.reducedMotion ?? options.forceReducedMotion,
  });

  // 7. Validate
  const validationReport = validateSceneSchema(fallbackDecision.resolvedSpec);

  return {
    spec: fallbackDecision.resolvedSpec,
    fallbackDecision,
    validationReport,
    appliedIntent: intent,
  };
}
