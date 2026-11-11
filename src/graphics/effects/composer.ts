/**
 * AF Motion Graphics Effects Composer
 *
 * Composes multiple GraphicsEffect instances into a unified, ordered pipeline
 * forwarding lifecycle, render, resize, and disposal operations.
 */

import type {
  GraphicsEffect,
  GraphicsEffectInitContext,
  GraphicsEffectUpdateContext,
} from "../types.js";
import type { ComposedGraphicsEffect } from "./types.js";

let composerCounter = 0;

export function composeGraphicsEffects(
  ...effects: readonly GraphicsEffect[]
): ComposedGraphicsEffect {
  const id = `composed-effects-${++composerCounter}`;
  const flattened = effects.filter(Boolean);

  return {
    id,
    name: `ComposedEffects [${flattened.map((e) => e.name).join(", ")}]`,
    version: "1.0.0",
    effects: flattened,
    accessibility: {
      supportsReducedMotion: flattened.every((e) => e.accessibility?.supportsReducedMotion !== false),
      respectsReducedMotion: flattened.every((e) => e.accessibility?.respectsReducedMotion !== false),
      staticFallback: flattened.some((e) => e.accessibility?.staticFallback),
    },
    async init(context: GraphicsEffectInitContext): Promise<void> {
      for (const effect of flattened) {
        await effect.init?.(context);
      }
    },
    render(context: GraphicsEffectUpdateContext): void {
      for (const effect of flattened) {
        effect.render(context);
      }
    },
    resize(width: number, height: number, dpr: number): void {
      for (const effect of flattened) {
        effect.resize?.(width, height, dpr);
      }
    },
    pause(): void {
      for (const effect of flattened) {
        effect.pause?.();
      }
    },
    resume(): void {
      for (const effect of flattened) {
        effect.resume?.();
      }
    },
    dispose(): void {
      for (const effect of flattened) {
        effect.dispose?.();
      }
    },
  };
}
