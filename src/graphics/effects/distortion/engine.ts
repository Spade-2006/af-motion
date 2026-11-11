/**
 * AF Motion Distortion Effect Engine
 *
 * Configurable wave, ripple, chromatic aberration, heat haze, lens,
 * and noise displacement effects adhering to Prompt 71 GraphicsEffect contracts.
 */

import type { GraphicsEffect, GraphicsEffectUpdateContext } from "../../types.js";
import { createPRNG, hashSeed } from "../../textures/prng.js";
import type { DistortionOptions, DistortionType } from "../types.js";

let distortionCounter = 0;

export function createDistortionEffect(
  options?: DistortionOptions
): GraphicsEffect<DistortionOptions> {
  const id = `distortion-${++distortionCounter}`;
  const type: DistortionType = options?.type ?? "wave";
  const intensity = options?.intensity ?? 0.5;
  const scale = options?.scale ?? 20;
  const speed = options?.speed ?? 1.0;
  const seed = hashSeed(options?.seed);
  const prng = createPRNG(seed);

  let isPaused = false;
  let accumulatedTime = 0;

  return {
    id,
    name: `Distortion (${type})`,
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
        case "wave": {
          const amplitude = intensity * 15;
          const frequency = scale * 0.05;
          c2d.fillStyle = `rgba(255, 255, 255, ${Math.min(0.2, intensity * 0.25)})`;
          c2d.beginPath();
          c2d.moveTo(0, height * 0.5);
          for (let x = 0; x <= width; x += 10) {
            const y = height * 0.5 + Math.sin(x * frequency + t * 3) * amplitude;
            c2d.lineTo(x, y);
          }
          c2d.lineTo(width, height);
          c2d.lineTo(0, height);
          c2d.closePath();
          c2d.fill();
          break;
        }

        case "ripple": {
          const cx = options?.center ? options.center[0] * width : width * 0.5;
          const cy = options?.center ? options.center[1] * height : height * 0.5;
          const maxRadius = Math.hypot(width, height) * 0.6;
          const ringSpacing = Math.max(10, scale);
          c2d.strokeStyle = `rgba(255, 255, 255, ${Math.min(0.3, intensity * 0.35)})`;
          c2d.lineWidth = 1.5;

          for (let r = (t * 40) % ringSpacing; r < maxRadius; r += ringSpacing) {
            c2d.beginPath();
            c2d.arc(cx, cy, r, 0, Math.PI * 2);
            c2d.stroke();
          }
          break;
        }

        case "chromatic-aberration": {
          const offset = Math.round(intensity * 8);
          if (offset > 0) {
            c2d.globalCompositeOperation = "screen";
            // Red channel wash
            c2d.fillStyle = "rgba(255, 0, 0, 0.08)";
            c2d.fillRect(offset, 0, width, height);
            // Cyan / Blue channel wash
            c2d.fillStyle = "rgba(0, 255, 255, 0.08)";
            c2d.fillRect(-offset, 0, width, height);
          }
          break;
        }

        case "heat-haze": {
          const bandHeight = Math.max(8, scale);
          c2d.fillStyle = "rgba(255, 255, 255, 0.04)";
          for (let y = 0; y < height; y += bandHeight * 2) {
            const shift = Math.sin(y * 0.05 + t * 4) * intensity * 6;
            c2d.fillRect(shift, y, width, bandHeight);
          }
          break;
        }

        case "lens": {
          const cx = width * 0.5;
          const cy = height * 0.5;
          const radius = Math.min(width, height) * 0.45;
          const gradient = c2d.createRadialGradient(cx, cy, radius * 0.5, cx, cy, radius);
          gradient.addColorStop(0, "rgba(255, 255, 255, 0)");
          gradient.addColorStop(1, `rgba(0, 0, 0, ${intensity * 0.3})`);
          c2d.fillStyle = gradient;
          c2d.fillRect(0, 0, width, height);
          break;
        }

        case "pixel-displacement": {
          const blockSize = Math.max(8, Math.round(scale));
          c2d.fillStyle = "rgba(255, 255, 255, 0.06)";
          for (let y = 0; y < height; y += blockSize * 2) {
            for (let x = 0; x < width; x += blockSize * 2) {
              if (prng.boolean(intensity * 0.4)) {
                c2d.fillRect(x, y, blockSize, blockSize);
              }
            }
          }
          break;
        }

        case "noise":
        case "refraction":
        default: {
          const shift = Math.sin(t * 2) * intensity * 10;
          c2d.fillStyle = `rgba(255, 255, 255, ${intensity * 0.05})`;
          c2d.fillRect(shift, 0, width, height);
          break;
        }
      }

      c2d.restore();
    },
    dispose(): void {
      // Cleanup effect state
    },
  };
}
