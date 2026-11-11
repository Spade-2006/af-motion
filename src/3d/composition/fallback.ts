/**
 * AF Motion 3D Scene Fallback Engine
 *
 * Capability-aware fallback resolution: inspects scene specifications against
 * rendering capabilities, degrading lighting, materials, models, shadows, and
 * motion controls safely before rendering.
 */

import { detect3DCapabilities } from "../capabilities.js";
import type { Scene3DCapabilities } from "../types.js";
import type {
  LightObjectSpec,
  MaterialSpec,
  MeshObjectSpec,
  ModelObjectSpec,
  PrimitiveObjectSpec,
  Scene3DSpecification,
  SceneObjectSpec,
} from "../schemas/types.js";
import type { Scene3DFallbackDecision } from "./types.js";

export interface FallbackResolutionOptions {
  readonly capabilities?: Partial<Scene3DCapabilities>;
  readonly disableShadows?: boolean;
  readonly disableTransmission?: boolean;
  readonly allowModels?: boolean;
  readonly supportedModelFormats?: readonly string[];
  readonly forceReducedMotion?: boolean;
  readonly maxObjects?: number;
}

export function resolve3DSceneFallbacks(
  spec: Scene3DSpecification,
  options: FallbackResolutionOptions = {}
): Scene3DFallbackDecision {
  const detected = detect3DCapabilities();
  const caps: Scene3DCapabilities = {
    ...detected,
    ...(options.capabilities ?? {}),
  };

  const modifications: string[] = [];
  const warnings: string[] = [];
  const degradedFeatures: string[] = [];

  const canRender = caps.isSupported !== false && caps.webgl !== false;
  if (!canRender) {
    warnings.push("Environment lacks WebGL support; 3D rendering cannot proceed.");
  }

  const shouldDisableShadows =
    options.disableShadows === true ||
    caps.webgl2 === false;

  const shouldDisableTransmission =
    options.disableTransmission === true ||
    caps.floatTextures === false ||
    caps.webgl2 === false;

  const respectReducedMotion =
    options.forceReducedMotion === true ||
    caps.reducedMotion === true ||
    spec.respectReducedMotion === true;

  const supportedFormats = options.supportedModelFormats ?? ["gltf", "glb"];
  const allowModels = options.allowModels ?? true;

  // Process Objects recursively
  function processObject(obj: SceneObjectSpec): SceneObjectSpec {
    let modifiedObj = { ...obj };

    // 1. Shadows
    if (shouldDisableShadows && (modifiedObj.castShadow || modifiedObj.receiveShadow)) {
      modifiedObj = {
        ...modifiedObj,
        castShadow: false,
        receiveShadow: false,
      };
      if (!degradedFeatures.includes("shadows-disabled")) {
        degradedFeatures.push("shadows-disabled");
        modifications.push("Disabled shadows across scene objects due to hardware/configuration limits.");
      }
    }

    // 2. Light fallbacks
    if (modifiedObj.type === "light") {
      const lightObj = modifiedObj as LightObjectSpec;
      // Area lights or unknown types downgrade to point
      if ((lightObj.lightType as string) === "area") {
        modifiedObj = {
          ...lightObj,
          lightType: "point",
        };
        degradedFeatures.push("area-light-fallback");
        modifications.push(`Area light '${lightObj.id}' downgraded to point light.`);
      }
    }

    // 3. Model fallbacks (if models not allowed or unsupported format)
    if (modifiedObj.type === "model") {
      const modelObj = modifiedObj as ModelObjectSpec;
      const format = modelObj.model?.format;
      const isFormatSupported = format && supportedFormats.includes(format);

      if (!allowModels || !isFormatSupported) {
        const primitiveFallback: PrimitiveObjectSpec = {
          id: modelObj.id,
          name: modelObj.name ? `${modelObj.name} (Fallback)` : "Model Fallback",
          type: "primitive",
          transform: modelObj.transform,
          visible: modelObj.visible,
          castShadow: false,
          receiveShadow: false,
          parentId: modelObj.parentId,
          accessibility: modelObj.accessibility,
          interaction: modelObj.interaction,
          userData: {
            ...modelObj.userData,
            fallbackFromModelUrl: modelObj.model?.url,
          },
          geometry: {
            type: "primitive",
            primitive: "box",
            parameters: { width: 1, height: 1, depth: 1 },
          },
          material: modelObj.material ?? {
            type: "standard",
            color: "#6b7280",
            roughness: 0.5,
            metalness: 0.1,
          },
        };
        degradedFeatures.push("model-to-primitive");
        modifications.push(
          `Model '${modelObj.id}' (${modelObj.model?.url ?? "unknown"}) replaced with fallback primitive box.`
        );
        modifiedObj = primitiveFallback;
      }
    }

    // 4. Material transmission/physical fallbacks
    if ("material" in modifiedObj && modifiedObj.material) {
      const mat = modifiedObj.material as MaterialSpec;
      if (
        shouldDisableTransmission &&
        (mat.type === "physical" || (mat.transmission && mat.transmission > 0))
      ) {
        const downgradedMaterial: MaterialSpec = {
          ...mat,
          type: "standard",
          transmission: 0,
          opacity: mat.opacity ?? 0.85,
          transparent: mat.transparent ?? true,
        };
        degradedFeatures.push("transmission-to-standard");
        modifications.push(`Material on object '${modifiedObj.id}' downgraded from physical transmission to standard.`);
        modifiedObj = {
          ...modifiedObj,
          material: downgradedMaterial,
        } as SceneObjectSpec;
      }
    }

    // Process children
    if (modifiedObj.children && modifiedObj.children.length > 0) {
      modifiedObj = {
        ...modifiedObj,
        children: modifiedObj.children.map(processObject),
      };
    }

    return modifiedObj;
  }

  let resolvedObjects = spec.objects.map(processObject);

  // 5. Max objects limit
  if (options.maxObjects && resolvedObjects.length > options.maxObjects) {
    const originalCount = resolvedObjects.length;
    resolvedObjects = resolvedObjects.slice(0, options.maxObjects);
    modifications.push(
      `Object count (${originalCount}) exceeded max threshold (${options.maxObjects}); truncated to ${resolvedObjects.length}.`
    );
    warnings.push(`Scene objects truncated from ${originalCount} to ${options.maxObjects}.`);
    degradedFeatures.push("object-count-truncated");
  }

  // 6. Reduced motion degradation
  let resolvedAnimations = spec.animations;
  let resolvedInteraction = spec.interaction;

  if (respectReducedMotion) {
    if (spec.animations && spec.animations.length > 0) {
      // Disable autoPlay on animations
      resolvedAnimations = spec.animations.map((anim) => ({
        ...anim,
        autoPlay: false,
      }));
      degradedFeatures.push("reduced-motion-applied");
      modifications.push("Disabled autoPlay on scene animations due to reduced-motion preference.");
    }

    if (spec.interaction?.controls) {
      // Dampen controls
      resolvedInteraction = {
        ...spec.interaction,
        controls: {
          ...spec.interaction.controls,
          dampingFactor: Math.min(
            (spec.interaction.controls.dampingFactor ?? 0.05) * 1.5,
            0.2
          ),
        },
      };
      if (!degradedFeatures.includes("reduced-motion-applied")) {
        degradedFeatures.push("reduced-motion-applied");
      }
      modifications.push("Damped camera controls to respect reduced-motion preference.");
    }
  }

  const resolvedSpec: Scene3DSpecification = {
    ...spec,
    objects: resolvedObjects,
    animations: resolvedAnimations,
    interaction: resolvedInteraction,
  };

  return {
    originalSpec: spec,
    resolvedSpec,
    modifications: Object.freeze(modifications),
    warnings: Object.freeze(warnings),
    degradedFeatures: Object.freeze(degradedFeatures),
    canRender,
  };
}
