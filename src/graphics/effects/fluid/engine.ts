/**
 * AF Motion Fluid Effects Engine
 *
 * Lightweight fluid-like gradients, metaballs, liquid transitions, flow fields,
 * and animated liquid surfaces adhering to Prompt 71 GraphicsEffect contracts.
 */

import type { GraphicsEffect, GraphicsEffectUpdateContext } from "../../types.js";
import { createPRNG, hashSeed } from "../../textures/prng.js";
import type { FluidOptions, FluidType } from "../types.js";

let fluidCounter = 0;

export function createFluidEffect(options?: FluidOptions): GraphicsEffect<FluidOptions> {
  const id = `fluid-${++fluidCounter}`;
  const type: FluidType = options?.type ?? "liquid-gradient";
  const colors = options?.colors && options.colors.length > 0
    ? options.colors
    : ["#38bdf8", "#818cf8", "#c084fc", "#f472b6"];
  const speed = options?.speed ?? 1.0;
  const viscosity = options?.viscosity ?? 0.5;
  const density = Math.max(3, Math.min(20, Math.round(options?.density ?? 6)));
  const seed = hashSeed(options?.seed);
  const prng = createPRNG(seed);

  // Pre-generate initial blob positions for metaballs and gooey blending
  const blobs = Array.from({ length: density }, () => ({
    x: prng.range(0.2, 0.8),
    y: prng.range(0.2, 0.8),
    vx: prng.range(-0.15, 0.15),
    vy: prng.range(-0.15, 0.15),
    radius: prng.range(0.12, 0.28),
    color: prng.pick(colors),
  }));

  let accumulatedTime = 0;
  let isPaused = false;

  return {
    id,
    name: `FluidEffect (${type})`,
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
        case "liquid-gradient": {
          const g = c2d.createLinearGradient(
            width * (0.5 + Math.sin(t * 0.8) * 0.3),
            0,
            width * (0.5 - Math.cos(t * 0.6) * 0.3),
            height
          );
          colors.forEach((col, i) => {
            g.addColorStop(i / (colors.length - 1), col);
          });
          c2d.fillStyle = g;
          c2d.fillRect(0, 0, width, height);
          break;
        }

        case "metaball":
        case "gooey-blend": {
          // Render soft overlapping radial blobs
          blobs.forEach((blob, i) => {
            const bx = ((blob.x + Math.sin(t * (0.5 + i * 0.1)) * blob.vx * (1 - viscosity * 0.5)) % 1 + 1) % 1 * width;
            const by = ((blob.y + Math.cos(t * (0.4 + i * 0.1)) * blob.vy * (1 - viscosity * 0.5)) % 1 + 1) % 1 * height;
            const r = blob.radius * Math.min(width, height);

            const rg = c2d.createRadialGradient(bx, by, 0, bx, by, r);
            rg.addColorStop(0, blob.color);
            rg.addColorStop(1, "transparent");

            c2d.fillStyle = rg;
            c2d.fillRect(0, 0, width, height);
          });
          break;
        }

        case "flow-field": {
          c2d.lineWidth = 1.5;
          const numLines = density * 5;
          for (let i = 0; i < numLines; i++) {
            const startX = ((i / numLines) * width + Math.sin(t) * 20) % width;
            c2d.strokeStyle = colors[i % colors.length];
            c2d.beginPath();
            c2d.moveTo(startX, 0);
            for (let y = 0; y < height; y += 20) {
              const xOffset = Math.sin(y * 0.02 + t * 2 + i) * 30 * (1 - viscosity * 0.5);
              c2d.lineTo(startX + xOffset, y);
            }
            c2d.stroke();
          }
          break;
        }

        case "liquid-surface": {
          c2d.fillStyle = colors[0];
          c2d.beginPath();
          c2d.moveTo(0, height);
          for (let x = 0; x <= width; x += 15) {
            const y = height * 0.6 + Math.sin(x * 0.02 + t * 2.5) * 15 + Math.cos(x * 0.04 - t * 1.5) * 8;
            c2d.lineTo(x, y);
          }
          c2d.lineTo(width, height);
          c2d.closePath();
          c2d.fill();
          break;
        }

        case "liquid-transition":
        default: {
          const sweepY = ((t * 0.3) % 1.5) * height;
          const g = c2d.createLinearGradient(0, sweepY - 100, 0, sweepY);
          g.addColorStop(0, "transparent");
          g.addColorStop(1, colors[0]);
          c2d.fillStyle = g;
          c2d.fillRect(0, 0, width, height);
          break;
        }
      }

      c2d.restore();
    },
    dispose(): void {
      blobs.length = 0;
    },
  };
}
