/**
 * AF Motion Unified Graphics API
 *
 * High-level unified entry point orchestrating engines, compositions,
 * capabilities, and resource management into a coherent interface.
 */

import { detectGraphicsCapabilities } from "../capabilities.js";
import { createGraphicsEngine } from "../engine.js";
import type {
  GraphicsCapabilities,
  GraphicsEngine,
} from "../types.js";
import { createGraphicsComposition } from "./engine.js";
import { resolveGraphicsFallback } from "./fallback.js";
import { resolveQualityProfile } from "./quality.js";
import type {
  GraphicsCompositionInstance,
  GraphicsFallbackDecision,
  GraphicsInstanceOptions,
  GraphicsQualityProfile,
} from "./types.js";

export interface GraphicsInstance {
  readonly engine: GraphicsEngine;
  readonly composition: GraphicsCompositionInstance | null;
  readonly capabilities: GraphicsCapabilities;
  readonly fallback: GraphicsFallbackDecision;
  readonly quality: GraphicsQualityProfile;
  attach(canvas: HTMLCanvasElement): Promise<void> | void;
  detach(): void;
  destroy(): void;
}

/**
 * Create a unified graphics instance managing lifecycle, capabilities,
 * quality scaling, and composition.
 */
export function createGraphicsInstance(options?: GraphicsInstanceOptions): GraphicsInstance {
  const capabilities = detectGraphicsCapabilities();
  const quality = resolveQualityProfile(options?.quality);
  const fallback = resolveGraphicsFallback(capabilities, {
    preferredBackend: options?.backend,
    respectReducedMotion: options?.respectReducedMotion,
  });

  if (options?.composition) {
    const composition = createGraphicsComposition(options.composition, {
      autoStart: options.autoStart,
      quality: options.quality,
      engine: options.engine,
    });
    return {
      engine: composition.engine,
      composition,
      capabilities,
      fallback,
      quality: composition.quality,
      attach: (c) => composition.attach(c),
      detach: () => composition.detach(),
      destroy: () => composition.destroy(),
    };
  }

  const engine = createGraphicsEngine({
    autoStart: options?.autoStart ?? true,
    respectReducedMotion: options?.respectReducedMotion ?? capabilities.reducedMotion,
    dpr: options?.dpr ?? quality.dprLimit,
    renderer: {
      backend: options?.backend === "auto" || !options?.backend ? fallback.targetBackend : options.backend,
    },
  });

  return {
    engine,
    composition: null,
    capabilities,
    fallback,
    quality,
    attach: (c) => engine.attach(c),
    detach: () => engine.detach(),
    destroy: () => engine.destroy(),
  };
}
