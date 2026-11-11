/**
 * AF Motion Particle Effect Engine
 *
 * Frame-independent, deterministic particle simulation with pooling,
 * multiple emitter shapes, burst/continuous modes, and lifecycle controls.
 */

import type { GraphicsEffect, GraphicsEffectUpdateContext } from "../../types.js";
import { createPRNG, hashSeed } from "../../textures/prng.js";
import type { ParticleOptions, ParticleShape, ParticleState } from "../types.js";
import { ParticlePool } from "./pool.js";

let particleCounter = 0;

export function createParticleEffect(options?: ParticleOptions): GraphicsEffect<ParticleOptions> {
  const id = `particles-${++particleCounter}`;
  const maxParticles = Math.max(10, Math.min(2000, options?.maxParticles ?? 300));
  const pool = new ParticlePool(maxParticles);
  const mode = options?.mode ?? "continuous";
  const rate = options?.rate ?? 50; // particles per second
  const burstCount = options?.burstCount ?? 50;
  const lifetimeRange = options?.lifetime ?? [1.0, 2.5];
  const speedRange = options?.speed ?? [40, 120];
  const angleRange = options?.angle ?? [0, 360];
  const gravity = options?.gravity ?? [0, 40];
  const sizeRange = options?.size ?? [3, 8];
  const colors = options?.colors && options.colors.length > 0
    ? options.colors
    : ["#38bdf8", "#818cf8", "#f43f5e", "#fbbf24", "#ffffff"];
  const shape: ParticleShape = options?.shape ?? "circle";
  const fade = options?.fade !== false;
  const shrink = options?.shrink !== false;
  const rotSpeedRange = options?.rotationSpeed ?? [-180, 180];
  const seed = hashSeed(options?.seed);
  const prng = createPRNG(seed);

  let isPaused = !(options?.autoStart ?? true);
  let emissionCarry = 0;
  let burstDone = false;

  function spawnParticle(w: number, h: number): ParticleState | null {
    const p = pool.acquire();
    if (!p) return null;

    // Resolve Origin
    if (Array.isArray(options?.origin)) {
      p.x = options!.origin![0];
      p.y = options!.origin![1];
    } else if (options?.origin === "bottom") {
      p.x = prng.range(0, w);
      p.y = h;
    } else if (options?.origin === "top") {
      p.x = prng.range(0, w);
      p.y = 0;
    } else if (options?.origin === "random") {
      p.x = prng.range(0, w);
      p.y = prng.range(0, h);
    } else {
      // "center"
      p.x = w * 0.5;
      p.y = h * 0.5;
    }

    const ang = prng.range(angleRange[0], angleRange[1]) * (Math.PI / 180);
    const spd = prng.range(speedRange[0], speedRange[1]);
    p.vx = Math.cos(ang) * spd;
    p.vy = Math.sin(ang) * spd;
    p.ax = gravity[0];
    p.ay = gravity[1];

    const sz = prng.range(sizeRange[0], sizeRange[1]);
    p.size = sz;
    p.initialSize = sz;
    p.color = prng.pick(colors);
    p.opacity = 1.0;
    p.lifetime = prng.range(lifetimeRange[0], lifetimeRange[1]);
    p.age = 0;
    p.rotation = prng.range(0, 360) * (Math.PI / 180);
    p.rotationSpeed = prng.range(rotSpeedRange[0], rotSpeedRange[1]) * (Math.PI / 180);
    p.shape = shape;

    return p;
  }

  return {
    id,
    name: `Particles (${mode})`,
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

      const c2d = ctx as CanvasRenderingContext2D;
      const { width, height } = context;
      // Cap delta time to prevent explosion on tab backgrounding
      const dt = Math.min(context.deltaTime / 1000, 0.1);

      if (!isPaused) {
        // Spawning
        if (mode === "burst" && !burstDone) {
          burstDone = true;
          for (let i = 0; i < burstCount; i++) {
            spawnParticle(width, height);
          }
        } else if (mode === "continuous") {
          emissionCarry += rate * dt;
          while (emissionCarry >= 1) {
            spawnParticle(width, height);
            emissionCarry -= 1;
          }
        }

        // Updating
        pool.forEachActive((p) => {
          p.age += dt;
          if (p.age >= p.lifetime) {
            pool.release(p);
            return;
          }

          const progress = p.age / p.lifetime;
          if (fade) {
            p.opacity = Math.max(0, 1 - progress);
          }
          if (shrink) {
            p.size = Math.max(0.5, p.initialSize * (1 - progress));
          }

          p.vx += p.ax * dt;
          p.vy += p.ay * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.rotation += p.rotationSpeed * dt;
        });
      }

      // Drawing
      c2d.save();
      pool.forEachActive((p) => {
        c2d.save();
        c2d.translate(p.x, p.y);
        c2d.rotate(p.rotation);
        c2d.globalAlpha = p.opacity;
        c2d.fillStyle = p.color;

        switch (p.shape) {
          case "square":
            c2d.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            break;

          case "triangle":
            c2d.beginPath();
            c2d.moveTo(0, -p.size);
            c2d.lineTo(p.size, p.size);
            c2d.lineTo(-p.size, p.size);
            c2d.closePath();
            c2d.fill();
            break;

          case "star":
          case "spark":
            c2d.fillRect(-p.size / 2, -p.size * 0.15, p.size, p.size * 0.3);
            c2d.fillRect(-p.size * 0.15, -p.size / 2, p.size * 0.3, p.size);
            break;

          case "circle":
          default:
            c2d.beginPath();
            c2d.arc(0, 0, p.size, 0, Math.PI * 2);
            c2d.fill();
            break;
        }

        c2d.restore();
      });
      c2d.restore();
    },
    dispose(): void {
      pool.releaseAll();
    },
  };
}
