/**
 * AF Motion Advanced Effects Engine
 *
 * Glow/bloom, vignette, noise overlay, scanlines, light streaks,
 * gradient animations, and background transitions adhering to Prompt 71.
 */

import type { GraphicsEffect, GraphicsEffectUpdateContext } from "../../types.js";
import { createPRNG, hashSeed } from "../../textures/prng.js";
import type { AdvancedEffectOptions, AdvancedEffectType } from "../types.js";

let advancedCounter = 0;

export function createAdvancedEffect(
  options?: AdvancedEffectOptions
): GraphicsEffect<AdvancedEffectOptions> {
  const id = `advanced-${++advancedCounter}`;
  const type: AdvancedEffectType = options?.type ?? "vignette";
  const intensity = options?.intensity ?? 0.5;
  const speed = options?.speed ?? 1.0;
  const opacity = options?.opacity ?? 0.8;
  const color = options?.color ?? "#000000";
  const secondaryColor = options?.secondaryColor ?? "#ffffff";
  const seed = hashSeed(options?.seed);
  const prng = createPRNG(seed);

  let accumulatedTime = 0;
  let isPaused = false;

  return {
    id,
    name: `AdvancedEffect (${type})`,
    version: "1.0.0",
    config: options,
    accessibility: {
      supportsReducedMotion: true,
      respectsReducedMotion: true,
      staticFallback: true,
    },
    pause(): void {
      isPaused = true;
    },
    resume(): void {
      isPaused = false;
    },
    render(context: GraphicsEffectUpdateContext): void {
      const ctx = context.rawContext;
      if (!ctx || typeof ctx !== "object" || !("fillRect" in ctx)) {
        return;
      }

      if (!isPaused) {
        accumulatedTime += (context.deltaTime / 1000) * speed;
      }

      const c2d = ctx as CanvasRenderingContext2D;
      const { width, height } = context;
      const t = accumulatedTime;

      c2d.save();

      switch (type) {
        case "vignette": {
          const cx = width * 0.5;
          const cy = height * 0.5;
          const radius = Math.hypot(width, height) * 0.5;
          const grad = c2d.createRadialGradient(cx, cy, radius * (1 - intensity * 0.6), cx, cy, radius);
          grad.addColorStop(0, "rgba(0, 0, 0, 0)");
          grad.addColorStop(1, color);
          c2d.fillStyle = grad;
          c2d.globalAlpha = opacity;
          c2d.fillRect(0, 0, width, height);
          break;
        }

        case "scanlines": {
          const lineSpacing = Math.max(2, Math.round(4 / (intensity || 1)));
          const rollOffset = (t * 20) % lineSpacing;
          c2d.fillStyle = color;
          c2d.globalAlpha = opacity * 0.25;
          for (let y = rollOffset; y < height; y += lineSpacing) {
            c2d.fillRect(0, y, width, 1);
          }
          break;
        }

        case "glow-bloom": {
          c2d.globalCompositeOperation = "lighter";
          const cx = width * 0.5;
          const cy = height * 0.5;
          const r = Math.min(width, height) * 0.45;
          const grad = c2d.createRadialGradient(cx, cy, 0, cx, cy, r);
          grad.addColorStop(0, secondaryColor);
          grad.addColorStop(1, "rgba(0, 0, 0, 0)");
          c2d.fillStyle = grad;
          c2d.globalAlpha = opacity * intensity * 0.4;
          c2d.fillRect(0, 0, width, height);
          break;
        }

        case "light-streaks": {
          c2d.globalCompositeOperation = "screen";
          const streakY = height * (0.5 + Math.sin(t) * 0.2);
          const grad = c2d.createLinearGradient(0, streakY - 15, 0, streakY + 15);
          grad.addColorStop(0, "rgba(255, 255, 255, 0)");
          grad.addColorStop(0.5, secondaryColor);
          grad.addColorStop(1, "rgba(255, 255, 255, 0)");
          c2d.fillStyle = grad;
          c2d.globalAlpha = opacity * intensity * 0.5;
          c2d.fillRect(0, streakY - 15, width, 30);
          break;
        }

        case "noise-overlay": {
          // Subtle film grain
          const grainCount = Math.floor(width * height * 0.002 * intensity);
          c2d.fillStyle = secondaryColor;
          c2d.globalAlpha = opacity * 0.15;
          for (let i = 0; i < grainCount; i++) {
            c2d.fillRect(prng.range(0, width), prng.range(0, height), 1, 1);
          }
          break;
        }

        case "gradient-animation": {
          const angle = t * 0.5;
          const x1 = width * (0.5 + Math.cos(angle) * 0.5);
          const y1 = height * (0.5 + Math.sin(angle) * 0.5);
          const x2 = width * (0.5 - Math.cos(angle) * 0.5);
          const y2 = height * (0.5 - Math.sin(angle) * 0.5);
          const grad = c2d.createLinearGradient(x1, y1, x2, y2);
          grad.addColorStop(0, color);
          grad.addColorStop(1, secondaryColor);
          c2d.fillStyle = grad;
          c2d.globalAlpha = opacity;
          c2d.fillRect(0, 0, width, height);
          break;
        }

        case "background-transition":
        default: {
          const progress = Math.max(0, Math.min(1, options?.transitionProgress ?? (Math.sin(t) + 1) * 0.5));
          c2d.fillStyle = color;
          c2d.fillRect(0, 0, width, height);
          c2d.fillStyle = secondaryColor;
          c2d.globalAlpha = progress;
          c2d.fillRect(0, 0, width, height);
          break;
        }
      }

      c2d.restore();
    },
    dispose(): void {
      // Cleanup effect
    },
  };
}
