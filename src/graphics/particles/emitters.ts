/**
 * AF Motion Advanced Particle Engine — Emitter System
 *
 * Implements configurable geometric particle emitters (point, line, circle,
 * rectangle, sphere, box, cone, custom) with continuous and burst spawning.
 */

import { parseColor, randomDirectionInCone, resolveRange } from "./random.js";
import type {
  EmitterShape,
  ParticleColorInput as ColorInput,
  ParticleDataPool,
  ParticleEmitter,
  ParticleEmitterConfig,
  ParticleSpawnData,
  ParticleVector3Tuple as Vector3Tuple,
  ParticleVector4Tuple as Vector4Tuple,
} from "./types.js";

let emitterSeq = 0;

export class ParticleEmitterImpl implements ParticleEmitter {
  readonly id: string;
  readonly config: ParticleEmitterConfig;
  enabled: boolean;
  rate: number;
  private spawnAccumulator = 0;

  constructor(config: ParticleEmitterConfig) {
    this.id = config.id || `emitter_${++emitterSeq}`;
    this.config = config;
    this.enabled = config.enabled ?? true;
    this.rate = Math.max(0, config.rate ?? 50);
  }

  update(dt: number, pool: ParticleDataPool, prng: () => number): number {
    if (!this.enabled || this.rate <= 0 || dt <= 0) return 0;

    this.spawnAccumulator += this.rate * dt;
    const toSpawn = Math.floor(this.spawnAccumulator);
    if (toSpawn <= 0) return 0;

    this.spawnAccumulator -= toSpawn;
    return this.spawnParticles(toSpawn, pool, prng);
  }

  burst(count: number, pool: ParticleDataPool, prng: () => number): number {
    if (!this.enabled || count <= 0) return 0;
    return this.spawnParticles(count, pool, prng);
  }

  private spawnParticles(count: number, pool: ParticleDataPool, prng: () => number): number {
    let spawned = 0;
    for (let i = 0; i < count; i++) {
      const data = this.generateParticleData(prng);
      const slot = pool.spawn(data);
      if (slot < 0) {
        // Pool full
        break;
      }
      spawned++;
    }
    return spawned;
  }

  private generateParticleData(prng: () => number): ParticleSpawnData {
    const cfg = this.config;
    const shape = cfg.shape || { type: "point" };

    // 1. Position from emitter shape
    const [x, y, z] = sampleShapePosition(shape, prng);

    // 2. Velocity & direction
    const baseDir: Vector3Tuple = cfg.direction || [0, 1, 0];
    const spread = cfg.spread ?? Math.PI / 4;
    const unitDir = randomDirectionInCone(baseDir, spread, prng);
    const speed = resolveRange(cfg.speed, 50, prng);

    const vx = unitDir[0] * speed;
    const vy = unitDir[1] * speed;
    const vz = unitDir[2] * speed;

    // 3. Lifetime
    const maxLife = Math.max(0.01, resolveRange(cfg.lifetime, 2, prng));

    // 4. Size
    let startSize = 4;
    let endSize = 0;
    if (cfg.size !== undefined) {
      if (typeof cfg.size === "number") {
        startSize = cfg.size;
        endSize = cfg.size;
      } else {
        startSize = cfg.size[0];
        endSize = cfg.size[1];
      }
    }

    // 5. Opacity
    let startOpacity = 1;
    let endOpacity = 0;
    if (cfg.opacity !== undefined) {
      if (typeof cfg.opacity === "number") {
        startOpacity = cfg.opacity;
        endOpacity = cfg.opacity;
      } else {
        startOpacity = cfg.opacity[0];
        endOpacity = cfg.opacity[1];
      }
    }

    // 6. Rotation & angular velocity
    const startRotation = resolveRange(cfg.rotation, 0, prng);
    const angularVelocity = resolveRange(cfg.angularVelocity, 0, prng);

    // 7. Colors
    let startColor: Vector4Tuple = [1, 1, 1, 1];
    let endColor: Vector4Tuple = [1, 1, 1, 0];
    if (cfg.color) {
      if (Array.isArray(cfg.color) && (typeof cfg.color[0] === "string" || typeof cfg.color[0] === "object")) {
        const colors = cfg.color as readonly [ColorInput, ColorInput];
        startColor = parseColor(colors[0], [1, 1, 1, 1]);
        endColor = parseColor(colors[1], [1, 1, 1, 0]);
      } else {
        startColor = parseColor(cfg.color as ColorInput, [1, 1, 1, 1]);
        endColor = [...startColor];
      }
    }

    // 8. Mass
    const mass = Math.max(0.001, resolveRange(cfg.mass, 1, prng));

    return {
      x,
      y,
      z,
      vx,
      vy,
      vz,
      ax: 0,
      ay: 0,
      az: 0,
      life: maxLife,
      maxLife,
      startSize,
      endSize,
      startRotation,
      angularVelocity,
      startOpacity,
      endOpacity,
      startColor,
      endColor,
      mass,
    };
  }
}

/**
 * Samples a random 3D position vector from a given emitter shape.
 */
export function sampleShapePosition(shape: EmitterShape, prng: () => number): Vector3Tuple {
  switch (shape.type) {
    case "point": {
      const pos = shape.position || [0, 0, 0];
      return [pos[0], pos[1], pos[2]];
    }

    case "line": {
      const t = prng();
      return [
        shape.start[0] + (shape.end[0] - shape.start[0]) * t,
        shape.start[1] + (shape.end[1] - shape.start[1]) * t,
        shape.start[2] + (shape.end[2] - shape.start[2]) * t,
      ];
    }

    case "circle": {
      const c = shape.center || [0, 0, 0];
      const rMin = shape.innerRadius || 0;
      const rMax = shape.radius;
      // Uniform circular area sampling: sqrt for area proportionality
      const r = Math.sqrt(prng() * (rMax * rMax - rMin * rMin) + rMin * rMin);
      const theta = 2 * Math.PI * prng();
      const u = r * Math.cos(theta);
      const v = r * Math.sin(theta);

      const plane = shape.plane || "xy";
      if (plane === "xz") return [c[0] + u, c[1], c[2] + v];
      if (plane === "yz") return [c[0], c[1] + u, c[2] + v];
      return [c[0] + u, c[1] + v, c[2]];
    }

    case "rectangle": {
      const c = shape.center || [0, 0, 0];
      const u = (prng() - 0.5) * shape.width;
      const v = (prng() - 0.5) * shape.height;

      const plane = shape.plane || "xy";
      if (plane === "xz") return [c[0] + u, c[1], c[2] + v];
      if (plane === "yz") return [c[0], c[1] + u, c[2] + v];
      return [c[0] + u, c[1] + v, c[2]];
    }

    case "sphere": {
      const c = shape.center || [0, 0, 0];
      const rMin = shape.innerRadius || 0;
      const rMax = shape.radius;
      const r = shape.surfaceOnly
        ? rMax
        : Math.cbrt(prng() * (rMax * rMax * rMax - rMin * rMin * rMin) + rMin * rMin * rMin);

      const theta = 2 * Math.PI * prng();
      const phi = Math.acos(2 * prng() - 1);
      const sinPhi = Math.sin(phi);

      return [
        c[0] + r * sinPhi * Math.cos(theta),
        c[1] + r * sinPhi * Math.sin(theta),
        c[2] + r * Math.cos(phi),
      ];
    }

    case "box": {
      const c = shape.center || [0, 0, 0];
      return [
        c[0] + (prng() - 0.5) * shape.dimensions[0],
        c[1] + (prng() - 0.5) * shape.dimensions[1],
        c[2] + (prng() - 0.5) * shape.dimensions[2],
      ];
    }

    case "cone": {
      const apex = shape.apex || [0, 0, 0];
      const t = prng();
      const h = t * shape.height;
      const rAtH = t * shape.baseRadius;
      const theta = 2 * Math.PI * prng();
      const r = Math.sqrt(prng()) * rAtH;

      return [
        apex[0] + r * Math.cos(theta) + shape.direction[0] * h,
        apex[1] + r * Math.sin(theta) + shape.direction[1] * h,
        apex[2] + shape.direction[2] * h,
      ];
    }

    case "custom": {
      const generated = shape.generate(0, prng);
      return [generated.x || 0, generated.y || 0, generated.z || 0];
    }
  }
}

export function createParticleEmitter(config: ParticleEmitterConfig): ParticleEmitter {
  return new ParticleEmitterImpl(config);
}
