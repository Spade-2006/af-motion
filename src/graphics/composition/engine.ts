/**
 * AF Motion Unified Graphics Composition Engine
 *
 * Coordinates multi-layer rendering, materials, procedural textures,
 * particle systems, post-processing, and adaptive quality monitoring.
 */

import { detectGraphicsCapabilities } from "../capabilities.js";
import { createGraphicsEngine } from "../engine.js";
import type { GraphicsEffect, GraphicsEffectUpdateContext, GraphicsEngine } from "../types.js";
import { resolveGraphicsFallback } from "./fallback.js";
import { sortCompositionLayers } from "./ordering.js";
import { AdaptiveQualityMonitor, resolveQualityProfile } from "./quality.js";
import type {
  GraphicsCompositionDefinition,
  GraphicsCompositionInstance,
  GraphicsLayer,
  GraphicsPerformanceStats,
  GraphicsQualityLevel,
  GraphicsQualityProfile,
} from "./types.js";

let compositionCounter = 0;

export interface CreateCompositionOptions {
  readonly autoStart?: boolean;
  readonly quality?: GraphicsQualityLevel | GraphicsQualityProfile;
  readonly engine?: GraphicsEngine;
}

export function createGraphicsComposition(
  definition: GraphicsCompositionDefinition,
  options?: CreateCompositionOptions
): GraphicsCompositionInstance {
  const id = definition.id || `composition-${++compositionCounter}`;
  const capabilities = detectGraphicsCapabilities();
  const fallback = resolveGraphicsFallback(capabilities, {
    respectReducedMotion: definition.respectReducedMotion,
  });

  const rawQuality = options?.quality ?? definition.quality ?? fallback.qualityLevel;
  const initialQuality: GraphicsQualityLevel =
    typeof rawQuality === "string" ? rawQuality : rawQuality.level;
  const qualityMonitor = new AdaptiveQualityMonitor(initialQuality);
  const qualityProfile = resolveQualityProfile(qualityMonitor.currentQuality);

  let currentLayers = sortCompositionLayers(definition.layers ?? []);

  // Create or reuse unified graphics engine
  const engine: GraphicsEngine =
    options?.engine ??
    createGraphicsEngine({
      autoStart: options?.autoStart ?? true,
      respectReducedMotion: definition.respectReducedMotion ?? capabilities.reducedMotion,
      renderer: {
        backend: fallback.targetBackend,
        dpr: qualityProfile.dprLimit,
      },
    });

  let isAttached = false;

  // Unified master effect coordinating all active layers
  const masterEffect: GraphicsEffect = {
    id: `${id}-master`,
    name: `CompositionMaster [${definition.name || id}]`,
    version: "1.0.0",
    render(context: GraphicsEffectUpdateContext): void {
      // Record frame performance for adaptive quality
      if (definition.autoAdaptQuality) {
        qualityMonitor.recordFrame(context.deltaTime);
      }

      const ctx = context.rawContext;
      if (!ctx || typeof ctx !== "object" || !("save" in ctx)) {
        return;
      }
      const c2d = ctx as CanvasRenderingContext2D;

      for (const layer of currentLayers) {
        if (layer.enabled === false) continue;

        c2d.save();
        if (layer.opacity !== undefined && layer.opacity < 1.0) {
          c2d.globalAlpha = Math.max(0, Math.min(1, layer.opacity));
        }
        if (layer.blendMode) {
          c2d.globalCompositeOperation = layer.blendMode as GlobalCompositeOperation;
        }

        // Render layer effect if present
        if (layer.effect && typeof layer.effect.render === "function") {
          layer.effect.render(context);
        }

        c2d.restore();
      }
    },
    dispose(): void {
      for (const layer of currentLayers) {
        layer.effect?.dispose?.();
      }
    },
  };

  engine.registerEffect(masterEffect);

  return {
    id,
    definition,
    engine,
    get quality() {
      return resolveQualityProfile(qualityMonitor.currentQuality);
    },
    fallback,
    get layers() {
      return currentLayers;
    },
    get isAttached() {
      return isAttached;
    },
    async attach(canvas: HTMLCanvasElement): Promise<void> {
      isAttached = true;
      await engine.attach(canvas);
    },
    detach(): void {
      isAttached = false;
      engine.detach();
    },
    updateLayer(layerId: string, partial: Partial<GraphicsLayer>): void {
      currentLayers = sortCompositionLayers(
        currentLayers.map((l) => (l.id === layerId ? { ...l, ...partial } : l))
      );
    },
    setQuality(quality: GraphicsQualityLevel): void {
      qualityMonitor.setQuality(quality);
      const prof = resolveQualityProfile(quality);
      engine.resize(undefined, undefined, prof.dprLimit);
    },
    getPerformanceStats(): GraphicsPerformanceStats {
      return {
        fps: qualityMonitor.getEstimatedFps(),
        avgFrameTimeMs: qualityMonitor.getAverageFrameTime(),
        activeLayersCount: currentLayers.filter((l) => l.enabled !== false).length,
        totalParticlesCount: 0,
        currentQuality: qualityMonitor.currentQuality,
      };
    },
    destroy(): void {
      isAttached = false;
      engine.destroy();
    },
  };
}
