/**
 * AF Motion Unified 3D Composition Engine
 *
 * Coordinates scene lifecycle, capability-safe fallbacks, asset loading,
 * interaction controls, scroll timeline synchronization, and adaptive quality.
 */

import { AssetManager3D } from "../assets/manager.js";
import { CameraControls3D } from "../interaction/camera-controls.js";
import { InteractionManager3D } from "../interaction/manager.js";
import { ScrollSceneController } from "../scroll/controller.js";
import type { Scene3DCapabilities } from "../types.js";
import type { Scene3DSpecification, SceneObjectSpec } from "../schemas/types.js";
import { resolve3DSceneFallbacks } from "./fallback.js";
import { Scene3DPerformanceMonitor } from "./quality.js";
import type {
  Scene3DCompositionDefinition,
  Scene3DCompositionInstance,
  Scene3DFallbackDecision,
  Scene3DQualityLevel,
} from "./types.js";

export interface Scene3DCompositionOptions {
  readonly domElement?: HTMLElement;
  readonly assetManager?: AssetManager3D;
  readonly capabilities?: Partial<Scene3DCapabilities>;
  readonly onQualityDegrade?: (level: Scene3DQualityLevel) => void;
  readonly onSpecChange?: (spec: Scene3DSpecification) => void;
}

export function createScene3DComposition(
  definition: Scene3DCompositionDefinition,
  options: Scene3DCompositionOptions = {}
): Scene3DCompositionInstance {
  const assetManager = options.assetManager ?? new AssetManager3D();

  // Performance Monitor
  const performanceMonitor = new Scene3DPerformanceMonitor({
    initialProfile: definition.performance?.qualityProfile ?? "high",
    onQualityDegrade: options.onQualityDegrade,
  });

  // Fallback decision
  let fallbackDecision: Scene3DFallbackDecision = resolve3DSceneFallbacks(
    definition.spec,
    {
      capabilities: options.capabilities,
      disableShadows: !performanceMonitor.getProfile().shadows,
      maxObjects: definition.performance?.maxObjects ?? performanceMonitor.getProfile().maxObjects,
    }
  );

  let currentSpec: Scene3DSpecification = fallbackDecision.resolvedSpec;

  // Interaction & Camera Controls
  let cameraControls: CameraControls3D | undefined;
  let interactionManager: InteractionManager3D | undefined;

  if (currentSpec.interaction?.controls || options.domElement) {
    cameraControls = new CameraControls3D(currentSpec.camera, {
      mode: currentSpec.interaction?.controls?.mode,
      enableOrbit: currentSpec.interaction?.controls?.enableOrbit,
      enablePan: currentSpec.interaction?.controls?.enablePan,
      enableZoom: currentSpec.interaction?.controls?.enableZoom,
      dampingFactor: currentSpec.interaction?.controls?.dampingFactor,
      minDistance: currentSpec.interaction?.controls?.minDistance,
      maxDistance: currentSpec.interaction?.controls?.maxDistance,
    });

    interactionManager = new InteractionManager3D(
      {
        enableHighlight: true,
        highlightColor: currentSpec.interaction?.defaultHighlightColor ?? "#6366f1",
      },
      cameraControls
    );

    if (options.domElement) {
      interactionManager.attach(options.domElement);
    }
  }

  // Scroll Controller
  let scrollController: ScrollSceneController | undefined;
  if (currentSpec.scrollTimeline) {
    scrollController = new ScrollSceneController({
      timeline: {
        id: currentSpec.scrollTimeline.id,
        name: currentSpec.scrollTimeline.name,
        keyframes: (currentSpec.scrollTimeline.keyframes as any) ?? [],
        sections: (currentSpec.scrollTimeline.sections as any) ?? [],
      },
      initialCamera: currentSpec.camera,
      respectReducedMotion: currentSpec.respectReducedMotion,
      container: options.domElement ?? undefined,
    });
  }

  // Deep update helper
  function updateObjectInList(
    objects: readonly SceneObjectSpec[],
    id: string,
    partial: Partial<SceneObjectSpec>
  ): readonly SceneObjectSpec[] {
    return objects.map((obj) => {
      if (obj.id === id) {
        return { ...obj, ...partial } as SceneObjectSpec;
      }
      if (obj.children && obj.children.length > 0) {
        return {
          ...obj,
          children: updateObjectInList(obj.children, id, partial),
        };
      }
      return obj;
    });
  }

  const instance: Scene3DCompositionInstance = {
    id: definition.id,
    definition,
    get spec() {
      return currentSpec;
    },
    assetManager,
    get interactionManager() {
      return interactionManager;
    },
    get cameraControls() {
      return cameraControls;
    },
    get scrollController() {
      return scrollController;
    },
    get fallbackDecision() {
      return fallbackDecision;
    },

    updateSpec(updater: (prev: Scene3DSpecification) => Scene3DSpecification): Scene3DSpecification {
      const nextRaw = updater(currentSpec);
      fallbackDecision = resolve3DSceneFallbacks(nextRaw, {
        capabilities: options.capabilities,
        disableShadows: !performanceMonitor.getProfile().shadows,
        maxObjects: definition.performance?.maxObjects ?? performanceMonitor.getProfile().maxObjects,
      });
      currentSpec = fallbackDecision.resolvedSpec;
      options.onSpecChange?.(currentSpec);
      return currentSpec;
    },

    updateObject(id: string, partial: Partial<SceneObjectSpec>): void {
      instance.updateSpec((prev) => ({
        ...prev,
        objects: updateObjectInList(prev.objects, id, partial),
      }));
    },

    setQuality(quality: Scene3DQualityLevel): void {
      performanceMonitor.setProfile(quality);
      // Re-evaluate fallbacks with updated quality
      fallbackDecision = resolve3DSceneFallbacks(definition.spec, {
        capabilities: options.capabilities,
        disableShadows: !performanceMonitor.getProfile().shadows,
        maxObjects: definition.performance?.maxObjects ?? performanceMonitor.getProfile().maxObjects,
      });
      currentSpec = fallbackDecision.resolvedSpec;
      options.onSpecChange?.(currentSpec);
    },

    destroy(): void {
      if (interactionManager) {
        interactionManager.detach();
      }
      if (scrollController) {
        scrollController.destroy();
      }
      assetManager.clear();
    },
  };

  return instance;
}
