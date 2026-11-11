/**
 * AF Motion Fluid & Flow Simulation Engine — Flow Fields
 *
 * Implements directional, radial, vortex, curl-noise, custom, and composite
 * force fields with divergence-free mathematical guarantees and field blending.
 */

import type {
  CompositeFlowFieldConfig,
  CurlNoiseFlowFieldConfig,
  CustomFlowFieldConfig,
  DirectionalFlowFieldConfig,
  FlowField,
  FlowFieldConfig,
  FlowFieldType,
  RadialFlowFieldConfig,
  Vector2Tuple,
  VortexFlowFieldConfig,
} from "./types.js";

let fieldIdSeq = 0;

abstract class BaseFlowField implements FlowField {
  readonly id: string;
  abstract readonly type: FlowFieldType;
  enabled = true;
  weight: number;

  constructor(id?: string, weight = 1.0) {
    this.id = id ?? `flow-field-${++fieldIdSeq}`;
    this.weight = weight;
  }

  abstract evaluate(x: number, y: number, time: number): Vector2Tuple;
}

export class DirectionalFlowField extends BaseFlowField {
  readonly type = "directional" as const;
  private readonly dirX: number;
  private readonly dirY: number;

  constructor(config: DirectionalFlowFieldConfig) {
    super(config.id, config.weight ?? 1.0);
    const [dx, dy] = config.direction;
    const len = Math.sqrt(dx * dx + dy * dy);
    const strength = config.strength ?? 1.0;
    if (len > 0) {
      this.dirX = (dx / len) * strength;
      this.dirY = (dy / len) * strength;
    } else {
      this.dirX = 0;
      this.dirY = 0;
    }
  }

  evaluate(_x: number, _y: number, _time: number): Vector2Tuple {
    if (!this.enabled || this.weight === 0) return [0, 0];
    return [this.dirX * this.weight, this.dirY * this.weight];
  }
}

export class RadialFlowField extends BaseFlowField {
  readonly type = "radial" as const;
  private readonly cx: number;
  private readonly cy: number;
  private readonly strength: number;
  private readonly radius: number;
  private readonly falloff: "linear" | "inverse-square";

  constructor(config: RadialFlowFieldConfig) {
    super(config.id, config.weight ?? 1.0);
    this.cx = config.center[0];
    this.cy = config.center[1];
    this.strength = config.strength;
    this.radius = Math.max(0.001, config.radius ?? 0.5);
    this.falloff = config.falloff ?? "linear";
  }

  evaluate(x: number, y: number, _time: number): Vector2Tuple {
    if (!this.enabled || this.weight === 0) return [0, 0];

    const dx = x - this.cx;
    const dy = y - this.cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist <= 0.0001 || dist > this.radius) return [0, 0];

    const nx = dx / dist;
    const ny = dy / dist;

    let factor = 0;
    if (this.falloff === "linear") {
      factor = 1 - dist / this.radius;
    } else {
      factor = 1 / (1 + (dist / this.radius) * (dist / this.radius));
    }

    const s = this.strength * factor * this.weight;
    return [nx * s, ny * s];
  }
}

export class VortexFlowField extends BaseFlowField {
  readonly type = "vortex" as const;
  private readonly cx: number;
  private readonly cy: number;
  private readonly strength: number;
  private readonly radius: number;
  private readonly inwardPull: number;

  constructor(config: VortexFlowFieldConfig) {
    super(config.id, config.weight ?? 1.0);
    this.cx = config.center[0];
    this.cy = config.center[1];
    this.strength = config.strength;
    this.radius = Math.max(0.001, config.radius ?? 0.5);
    this.inwardPull = config.inwardPull ?? 0.0;
  }

  evaluate(x: number, y: number, _time: number): Vector2Tuple {
    if (!this.enabled || this.weight === 0) return [0, 0];

    const dx = x - this.cx;
    const dy = y - this.cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist <= 0.0001 || dist > this.radius) return [0, 0];

    const factor = 1 - dist / this.radius;
    const s = this.strength * factor * this.weight;

    // Perpendicular tangent vector (-dy, dx)
    const tx = (-dy / dist) * s;
    const ty = (dx / dist) * s;

    // Optional inward radial pull
    const rx = (-dx / dist) * this.inwardPull * s;
    const ry = (-dy / dist) * this.inwardPull * s;

    return [tx + rx, ty + ry];
  }
}

/**
 * Divergence-free Curl-Noise Flow Field
 * F = (dPsi/dy, -dPsi/dx) where Psi is a scalar potential function.
 * Since div(curl(Psi)) = 0, this creates perfectly incompressible fluid motion.
 */
export class CurlNoiseFlowField extends BaseFlowField {
  readonly type = "curl-noise" as const;
  private readonly frequency: number;
  private readonly strength: number;
  private readonly octaves: number;
  private readonly timeScale: number;

  constructor(config: CurlNoiseFlowFieldConfig = { type: "curl-noise" }) {
    super(config.id, config.weight ?? 1.0);
    this.frequency = config.frequency ?? 4.0;
    this.strength = config.strength ?? 1.0;
    this.octaves = Math.max(1, Math.min(4, config.octaves ?? 2));
    this.timeScale = config.timeScale ?? 0.5;
  }

  private potential(x: number, y: number, t: number): number {
    let val = 0;
    let freq = this.frequency;
    let amp = 1.0;

    for (let o = 0; o < this.octaves; o++) {
      const s1 = Math.sin(x * freq + t * 0.7);
      const c1 = Math.cos(y * freq - t * 0.5);
      const s2 = Math.sin((x + y) * freq * 0.7 + t);
      val += (s1 * c1 + s2) * amp;
      freq *= 2.0;
      amp *= 0.5;
    }
    return val;
  }

  evaluate(x: number, y: number, time: number): Vector2Tuple {
    if (!this.enabled || this.weight === 0) return [0, 0];

    const t = time * this.timeScale;
    const eps = 0.001;

    // Central difference derivatives:
    // dPsi/dy:
    const psiY1 = this.potential(x, y + eps, t);
    const psiY0 = this.potential(x, y - eps, t);
    const dPsiDy = (psiY1 - psiY0) / (2 * eps);

    // dPsi/dx:
    const psiX1 = this.potential(x + eps, y, t);
    const psiX0 = this.potential(x - eps, y, t);
    const dPsiDx = (psiX1 - psiX0) / (2 * eps);

    // F = (dPsi/dy, -dPsi/dx)
    const scale = this.strength * this.weight;
    return [dPsiDy * scale, -dPsiDx * scale];
  }
}

export class CustomFlowField extends BaseFlowField {
  readonly type = "custom" as const;
  private readonly customEval: (x: number, y: number, time: number) => Vector2Tuple;

  constructor(config: CustomFlowFieldConfig) {
    super(config.id, config.weight ?? 1.0);
    this.customEval = config.evaluate;
  }

  evaluate(x: number, y: number, time: number): Vector2Tuple {
    if (!this.enabled || this.weight === 0) return [0, 0];
    const [vx, vy] = this.customEval(x, y, time);
    return [vx * this.weight, vy * this.weight];
  }
}

export class CompositeFlowField extends BaseFlowField {
  readonly type = "composite" as const;
  private readonly fields: FlowField[];

  constructor(config: CompositeFlowFieldConfig) {
    super(config.id, config.weight ?? 1.0);
    this.fields = config.fields.map(createFlowField);
  }

  evaluate(x: number, y: number, time: number): Vector2Tuple {
    if (!this.enabled || this.weight === 0) return [0, 0];

    let totalVx = 0;
    let totalVy = 0;

    for (let i = 0; i < this.fields.length; i++) {
      const field = this.fields[i];
      if (field.enabled && field.weight > 0) {
        const [vx, vy] = field.evaluate(x, y, time);
        totalVx += vx;
        totalVy += vy;
      }
    }

    return [totalVx * this.weight, totalVy * this.weight];
  }

  addField(field: FlowField | FlowFieldConfig): FlowField {
    const instance = "enabled" in field ? (field as FlowField) : createFlowField(field);
    this.fields.push(instance);
    return instance;
  }

  removeField(id: string): boolean {
    const idx = this.fields.findIndex((f) => f.id === id);
    if (idx !== -1) {
      this.fields.splice(idx, 1);
      return true;
    }
    return false;
  }

  getFields(): readonly FlowField[] {
    return this.fields;
  }
}

export function createFlowField(config: FlowFieldConfig): FlowField {
  switch (config.type) {
    case "directional":
      return new DirectionalFlowField(config);
    case "radial":
      return new RadialFlowField(config);
    case "vortex":
      return new VortexFlowField(config);
    case "curl-noise":
      return new CurlNoiseFlowField(config);
    case "custom":
      return new CustomFlowField(config);
    case "composite":
      return new CompositeFlowField(config);
    default:
      throw new Error(`Unsupported flow field type: ${(config as { type: string }).type}`);
  }
}
