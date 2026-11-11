/**
 * AF Motion Interactive Particle Fields & Forces — Force Field Implementations
 *
 * Implements attraction, repulsion, vortex, directional, gravitational,
 * turbulence, drag, custom, and fluid/wind-coupled force fields with configurable falloffs.
 */

import type {
  AttractionForceConfig,
  CustomForceConfig,
  DirectionalForceConfig,
  DragForceConfig,
  FlowCoupledForceConfig,
  ForceField,
  ForceFieldConfig,
  ForceVector3Tuple,
  GravitationalForceConfig,
  ParticleFalloffType,
  ParticleForceType,
  RepulsionForceConfig,
  TurbulenceForceConfig,
  VortexForceConfig,
} from "./types.js";

let forceFieldIdSeq = 0;

export function computeFalloff(distance: number, radius: number, falloff: ParticleFalloffType): number {
  if (radius <= 0 || falloff === "none") return 1.0;
  if (distance >= radius) return 0.0;

  const ratio = Math.max(0, Math.min(1, distance / radius));

  switch (falloff) {
    case "linear":
      return 1.0 - ratio;
    case "inverse-distance":
      return 1.0 / (1.0 + distance);
    case "inverse-square":
      return 1.0 / (1.0 + ratio * ratio);
    case "smoothstep":
      return (1.0 - ratio) * (1.0 - ratio) * (3.0 - 2.0 * (1.0 - ratio));
    case "exponential":
      return Math.exp(-3.0 * ratio);
    default:
      return 1.0 - ratio;
  }
}

abstract class BaseForceField implements ForceField {
  readonly id: string;
  abstract readonly type: ParticleForceType;
  enabled = true;
  weight: number;
  priority: number;
  position: ForceVector3Tuple;
  radius: number;
  falloff: ParticleFalloffType;
  maxForce: number;

  constructor(config: {
    id?: string;
    enabled?: boolean;
    weight?: number;
    priority?: number;
    position?: ForceVector3Tuple;
    radius?: number;
    falloff?: ParticleFalloffType;
    maxForce?: number;
  }) {
    this.id = config.id ?? `force-${++forceFieldIdSeq}`;
    this.enabled = config.enabled ?? true;
    this.weight = config.weight ?? 1.0;
    this.priority = config.priority ?? 0;
    this.position = config.position ? [...config.position] : [0, 0, 0];
    this.radius = Math.max(0, config.radius ?? 0);
    this.falloff = config.falloff ?? "linear";
    this.maxForce = Math.max(0, config.maxForce ?? 1000);
  }

  abstract evaluate(
    px: number,
    py: number,
    pz: number,
    vx: number,
    vy: number,
    vz: number,
    mass: number,
    time: number,
  ): ForceVector3Tuple;
}

export class AttractionForceField extends BaseForceField {
  readonly type = "attraction" as const;
  strength: number;
  minDistance: number;

  constructor(config: AttractionForceConfig) {
    super(config);
    if (config.radius === undefined) this.radius = 0.5;
    this.strength = config.strength;
    this.minDistance = Math.max(0.0001, config.minDistance ?? 0.01);
  }

  evaluate(px: number, py: number, pz: number): ForceVector3Tuple {
    if (!this.enabled || this.weight === 0) return [0, 0, 0];

    const dx = this.position[0] - px;
    const dy = this.position[1] - py;
    const dz = this.position[2] - pz;
    const dist = Math.hypot(dx, dy, dz);

    if (dist > this.radius && this.radius > 0) return [0, 0, 0];
    const effectiveDist = Math.max(dist, this.minDistance);
    const falloffFactor = computeFalloff(effectiveDist, this.radius, this.falloff);

    const mag = Math.min(this.maxForce, this.strength * falloffFactor * this.weight);
    const nx = dx / effectiveDist;
    const ny = dy / effectiveDist;
    const nz = dz / effectiveDist;

    return [nx * mag, ny * mag, nz * mag];
  }
}

export class RepulsionForceField extends BaseForceField {
  readonly type = "repulsion" as const;
  strength: number;
  minDistance: number;

  constructor(config: RepulsionForceConfig) {
    super(config);
    if (config.radius === undefined) this.radius = 0.5;
    this.strength = config.strength;
    this.minDistance = Math.max(0.0001, config.minDistance ?? 0.01);
  }

  evaluate(px: number, py: number, pz: number): ForceVector3Tuple {
    if (!this.enabled || this.weight === 0) return [0, 0, 0];

    const dx = px - this.position[0];
    const dy = py - this.position[1];
    const dz = pz - this.position[2];
    const dist = Math.hypot(dx, dy, dz);

    if (dist > this.radius && this.radius > 0) return [0, 0, 0];
    const effectiveDist = Math.max(dist, this.minDistance);
    const falloffFactor = computeFalloff(effectiveDist, this.radius, this.falloff);

    const mag = Math.min(this.maxForce, this.strength * falloffFactor * this.weight);
    const nx = dx / effectiveDist;
    const ny = dy / effectiveDist;
    const nz = dz / effectiveDist;

    return [nx * mag, ny * mag, nz * mag];
  }
}

export class VortexForceField extends BaseForceField {
  readonly type = "vortex" as const;
  strength: number;
  axis: ForceVector3Tuple;
  inwardPull: number;

  constructor(config: VortexForceConfig) {
    super(config);
    if (config.radius === undefined) this.radius = 0.5;
    this.strength = config.strength;
    const a = config.axis ?? [0, 0, 1];
    const len = Math.hypot(a[0], a[1], a[2]) || 1;
    this.axis = [a[0] / len, a[1] / len, a[2] / len];
    this.inwardPull = config.inwardPull ?? 0.0;
  }

  evaluate(px: number, py: number, pz: number): ForceVector3Tuple {
    if (!this.enabled || this.weight === 0) return [0, 0, 0];

    const rx = px - this.position[0];
    const ry = py - this.position[1];
    const rz = pz - this.position[2];
    const dist = Math.hypot(rx, ry, rz);

    if (dist > this.radius && this.radius > 0) return [0, 0, 0];
    if (dist <= 0.0001) return [0, 0, 0];

    // Cross product: axis x r
    const tx = this.axis[1] * rz - this.axis[2] * ry;
    const ty = this.axis[2] * rx - this.axis[0] * rz;
    const tz = this.axis[0] * ry - this.axis[1] * rx;
    const tLen = Math.hypot(tx, ty, tz) || 1;

    const falloffFactor = computeFalloff(dist, this.radius, this.falloff);
    const mag = Math.min(this.maxForce, this.strength * falloffFactor * this.weight);

    // Tangential rotation
    const rotX = (tx / tLen) * mag;
    const rotY = (ty / tLen) * mag;
    const rotZ = (tz / tLen) * mag;

    // Optional inward radial pull
    const radX = (-rx / dist) * this.inwardPull * mag;
    const radY = (-ry / dist) * this.inwardPull * mag;
    const radZ = (-rz / dist) * this.inwardPull * mag;

    return [rotX + radX, rotY + radY, rotZ + radZ];
  }
}

export class DirectionalForceField extends BaseForceField {
  readonly type = "directional" as const;
  direction: ForceVector3Tuple;
  strength: number;

  constructor(config: DirectionalForceConfig) {
    super(config);
    const d = config.direction;
    const len = Math.hypot(d[0], d[1], d[2]) || 1;
    this.direction = [d[0] / len, d[1] / len, d[2] / len];
    this.strength = config.strength;
  }

  evaluate(px: number, py: number, pz: number): ForceVector3Tuple {
    if (!this.enabled || this.weight === 0) return [0, 0, 0];

    let falloffFactor = 1.0;
    if (this.radius > 0) {
      const dist = Math.hypot(
        px - this.position[0],
        py - this.position[1],
        pz - this.position[2],
      );
      if (dist > this.radius) return [0, 0, 0];
      falloffFactor = computeFalloff(dist, this.radius, this.falloff);
    }

    const mag = Math.min(this.maxForce, this.strength * falloffFactor * this.weight);
    return [this.direction[0] * mag, this.direction[1] * mag, this.direction[2] * mag];
  }
}

export class GravitationalForceField extends BaseForceField {
  readonly type = "gravitational" as const;
  mass: number;
  G: number;
  softening: number;

  constructor(config: GravitationalForceConfig) {
    super(config);
    this.mass = Math.max(0, config.mass);
    this.G = config.G ?? 9.81;
    this.softening = Math.max(0.001, config.softening ?? 0.05);
  }

  evaluate(px: number, py: number, pz: number, _vx: number, _vy: number, _vz: number, particleMass = 1): ForceVector3Tuple {
    if (!this.enabled || this.weight === 0) return [0, 0, 0];

    const dx = this.position[0] - px;
    const dy = this.position[1] - py;
    const dz = this.position[2] - pz;
    const distSq = dx * dx + dy * dy + dz * dz;
    const dist = Math.sqrt(distSq);

    if (dist > this.radius && this.radius > 0) return [0, 0, 0];

    const softDistSq = distSq + this.softening * this.softening;
    const F = (this.G * this.mass * particleMass) / softDistSq;
    const falloffFactor = computeFalloff(dist, this.radius, this.falloff);

    const mag = Math.min(this.maxForce, F * falloffFactor * this.weight);
    const softDist = Math.sqrt(softDistSq);

    return [(dx / softDist) * mag, (dy / softDist) * mag, (dz / softDist) * mag];
  }
}

export class TurbulenceForceField extends BaseForceField {
  readonly type = "turbulence" as const;
  frequency: number;
  strength: number;
  octaves: number;
  timeScale: number;

  constructor(config: TurbulenceForceConfig) {
    super(config);
    this.frequency = Math.max(0.01, config.frequency ?? 1.5);
    this.strength = config.strength ?? 5.0;
    this.octaves = Math.max(1, Math.min(4, config.octaves ?? 2));
    this.timeScale = config.timeScale ?? 0.5;
  }

  evaluate(px: number, py: number, pz: number, _vx: number, _vy: number, _vz: number, _mass: number, time = 0): ForceVector3Tuple {
    if (!this.enabled || this.weight === 0) return [0, 0, 0];

    if (this.radius > 0) {
      const dist = Math.hypot(
        px - this.position[0],
        py - this.position[1],
        pz - this.position[2],
      );
      if (dist > this.radius) return [0, 0, 0];
    }

    const t = time * this.timeScale;
    let fx = 0;
    let fy = 0;
    let fz = 0;
    let freq = this.frequency;
    let amp = 1.0;

    for (let o = 0; o < this.octaves; o++) {
      fx += Math.sin(py * freq + t * 1.3) * Math.cos(pz * freq - t * 0.7) * amp;
      fy += Math.sin(pz * freq + t * 0.9) * Math.cos(px * freq + t * 1.1) * amp;
      fz += Math.sin(px * freq - t * 1.5) * Math.cos(py * freq + t * 0.8) * amp;
      freq *= 2.0;
      amp *= 0.5;
    }

    const mag = Math.min(this.maxForce, this.strength * this.weight);
    return [fx * mag, fy * mag, fz * mag];
  }
}

export class DragForceField extends BaseForceField {
  readonly type = "drag" as const;
  damping: number;
  quadratic: boolean;

  constructor(config: DragForceConfig) {
    super(config);
    this.damping = Math.max(0, config.damping);
    this.quadratic = config.quadratic ?? false;
  }

  evaluate(
    px: number,
    py: number,
    pz: number,
    vx: number,
    vy: number,
    vz: number,
  ): ForceVector3Tuple {
    if (!this.enabled || this.weight === 0) return [0, 0, 0];

    let falloffFactor = 1.0;
    if (this.radius > 0) {
      const dist = Math.hypot(
        px - this.position[0],
        py - this.position[1],
        pz - this.position[2],
      );
      if (dist > this.radius) return [0, 0, 0];
      falloffFactor = computeFalloff(dist, this.radius, this.falloff);
    }

    const vSpeed = Math.hypot(vx, vy, vz);
    if (vSpeed <= 0.0001) return [0, 0, 0];

    const factor = this.quadratic ? this.damping * vSpeed : this.damping;
    const mag = Math.min(this.maxForce, factor * falloffFactor * this.weight);

    return [-vx * mag, -vy * mag, -vz * mag];
  }
}

export class CustomForceField extends BaseForceField {
  readonly type = "custom" as const;
  private readonly customFn: (
    px: number,
    py: number,
    pz: number,
    vx: number,
    vy: number,
    vz: number,
    mass: number,
    time: number,
  ) => ForceVector3Tuple;

  constructor(config: CustomForceConfig) {
    super(config);
    this.customFn = config.evaluate;
  }

  evaluate(
    px: number,
    py: number,
    pz: number,
    vx: number,
    vy: number,
    vz: number,
    mass: number,
    time: number,
  ): ForceVector3Tuple {
    if (!this.enabled || this.weight === 0) return [0, 0, 0];

    if (this.radius > 0) {
      const dist = Math.hypot(
        px - this.position[0],
        py - this.position[1],
        pz - this.position[2],
      );
      if (dist > this.radius) return [0, 0, 0];
    }

    const [fx, fy, fz] = this.customFn(px, py, pz, vx, vy, vz, mass, time);
    return [fx * this.weight, fy * this.weight, fz * this.weight];
  }
}

export class FlowCoupledForceField extends BaseForceField {
  readonly type = "flow-coupled" as const;
  flowField?: FlowCoupledForceConfig["flowField"];
  windSystem?: FlowCoupledForceConfig["windSystem"];
  dragCoefficient: number;

  constructor(config: FlowCoupledForceConfig) {
    super(config);
    this.flowField = config.flowField;
    this.windSystem = config.windSystem;
    this.dragCoefficient = Math.max(0, config.dragCoefficient ?? 1.5);
  }

  evaluate(
    px: number,
    py: number,
    pz: number,
    vx: number,
    vy: number,
    vz: number,
    _mass: number,
    time: number,
  ): ForceVector3Tuple {
    if (!this.enabled || this.weight === 0) return [0, 0, 0];

    let targetVx = 0;
    let targetVy = 0;
    let targetVz = 0;

    if (this.flowField && this.flowField.enabled) {
      const [u, v] = this.flowField.evaluate(px, py, time);
      targetVx += u;
      targetVy += v;
    }

    if (this.windSystem) {
      const [wx, wy, wz] = this.windSystem.sampleWind(px, py, pz, time);
      targetVx += wx;
      targetVy += wy;
      targetVz += wz;
    }

    // Relative flow drag: F = (v_flow - v) * drag
    const diffX = targetVx - vx;
    const diffY = targetVy - vy;
    const diffZ = targetVz - vz;

    const mag = this.dragCoefficient * this.weight;
    return [diffX * mag, diffY * mag, diffZ * mag];
  }
}

export function createForceField(config: ForceFieldConfig): ForceField {
  switch (config.type) {
    case "attraction":
      return new AttractionForceField(config);
    case "repulsion":
      return new RepulsionForceField(config);
    case "vortex":
      return new VortexForceField(config);
    case "directional":
      return new DirectionalForceField(config);
    case "gravitational":
      return new GravitationalForceField(config);
    case "turbulence":
      return new TurbulenceForceField(config);
    case "drag":
      return new DragForceField(config);
    case "custom":
      return new CustomForceField(config);
    case "flow-coupled":
      return new FlowCoupledForceField(config);
    default:
      throw new Error(`Unsupported force field type: ${(config as { type: string }).type}`);
  }
}

export function createAttractionField(config: AttractionForceConfig): ForceField {
  return new AttractionForceField(config);
}

export function createRepulsionField(config: RepulsionForceConfig): ForceField {
  return new RepulsionForceField(config);
}

export function createVortexField(config: VortexForceConfig): ForceField {
  return new VortexForceField(config);
}

export function createTurbulenceField(config: TurbulenceForceConfig): ForceField {
  return new TurbulenceForceField(config);
}
