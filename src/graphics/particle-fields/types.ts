/**
 * AF Motion Interactive Particle Fields & Forces — Type Definitions
 *
 * Framework-independent architecture for interactive spatial force fields,
 * pointer attraction/repulsion, gesture-driven impulses, fluid coupling,
 * and high-performance spatial-partitioned field composition.
 */

import type { ParticleVector3Tuple, ParticleDataPool } from "../particles/types.js";
import type { FlowField } from "../fluid/types.js";
import type { WindSystem } from "../environment/types.js";
import type { GestureType } from "../../core/interactions/types.js";

export type ForceVector3Tuple = ParticleVector3Tuple;

export type ParticleForceType =
  | "attraction"
  | "repulsion"
  | "vortex"
  | "directional"
  | "gravitational"
  | "turbulence"
  | "drag"
  | "custom"
  | "flow-coupled";

export type ParticleFalloffType =
  | "none"
  | "linear"
  | "inverse-distance"
  | "inverse-square"
  | "smoothstep"
  | "exponential";

export interface BaseForceFieldConfig {
  readonly id?: string;
  readonly type: ParticleForceType;
  readonly enabled?: boolean;
  readonly weight?: number;
  readonly priority?: number;
  readonly position?: ForceVector3Tuple;
  readonly radius?: number;
  readonly falloff?: ParticleFalloffType;
  readonly maxForce?: number;
}

export interface AttractionForceConfig extends BaseForceFieldConfig {
  readonly type: "attraction";
  readonly strength: number;
  readonly minDistance?: number;
}

export interface RepulsionForceConfig extends BaseForceFieldConfig {
  readonly type: "repulsion";
  readonly strength: number;
  readonly minDistance?: number;
}

export interface VortexForceConfig extends BaseForceFieldConfig {
  readonly type: "vortex";
  readonly strength: number;
  readonly axis?: ForceVector3Tuple; // default [0, 0, 1] for 2D/XY plane rotation
  readonly inwardPull?: number;
}

export interface DirectionalForceConfig extends BaseForceFieldConfig {
  readonly type: "directional";
  readonly direction: ForceVector3Tuple;
  readonly strength: number;
}

export interface GravitationalForceConfig extends BaseForceFieldConfig {
  readonly type: "gravitational";
  readonly mass: number;
  readonly G?: number;
  readonly softening?: number;
}

export interface TurbulenceForceConfig extends BaseForceFieldConfig {
  readonly type: "turbulence";
  readonly frequency?: number;
  readonly strength?: number;
  readonly octaves?: number;
  readonly timeScale?: number;
}

export interface DragForceConfig extends BaseForceFieldConfig {
  readonly type: "drag";
  readonly damping: number;
  readonly quadratic?: boolean;
}

export interface CustomForceConfig extends BaseForceFieldConfig {
  readonly type: "custom";
  readonly evaluate: (
    px: number,
    py: number,
    pz: number,
    vx: number,
    vy: number,
    vz: number,
    mass: number,
    time: number,
  ) => ForceVector3Tuple;
}

export interface FlowCoupledForceConfig extends BaseForceFieldConfig {
  readonly type: "flow-coupled";
  readonly flowField?: FlowField;
  readonly windSystem?: WindSystem;
  readonly dragCoefficient?: number;
}

export type ForceFieldConfig =
  | AttractionForceConfig
  | RepulsionForceConfig
  | VortexForceConfig
  | DirectionalForceConfig
  | GravitationalForceConfig
  | TurbulenceForceConfig
  | DragForceConfig
  | CustomForceConfig
  | FlowCoupledForceConfig;

export interface ForceField {
  readonly id: string;
  readonly type: ParticleForceType;
  enabled: boolean;
  weight: number;
  priority: number;
  position: ForceVector3Tuple;
  radius: number;
  falloff: ParticleFalloffType;
  maxForce: number;

  evaluate(
    px: number,
    py: number,
    pz: number,
    vx: number,
    vy: number,
    vz: number,
    mass: number,
    time: number,
  ): ForceVector3Tuple;

  update?(dt: number, time: number): void;
}

export interface InteractivePointer {
  readonly id: number | string;
  x: number;
  y: number;
  z?: number;
  vx: number;
  vy: number;
  vz?: number;
  active: boolean;
  primaryButton: boolean;
  pressure?: number;
}

export interface PointerInteractionConfig {
  readonly mode?: "attract" | "repel" | "vortex" | "velocity-drag" | "burst";
  readonly radius?: number;
  readonly strength?: number;
  readonly burstCount?: number;
  readonly burstSpeed?: number;
  readonly smoothVelocity?: boolean;
}

export interface GestureForceAction {
  readonly gesture: GestureType;
  readonly action:
    | "burst"
    | "radial-shockwave"
    | "displace"
    | "momentum-inject"
    | "expand"
    | "compress"
    | "vortex"
    | "singularity";
  readonly strength?: number;
  readonly radius?: number;
}

export interface ForceFieldManagerConfig {
  readonly maxAcceleration?: number;
  readonly defaultFalloff?: ParticleFalloffType;
  readonly spatialPartitioning?: boolean;
  readonly spatialCellSize?: number;
}

export interface ParticleFieldMetrics {
  readonly activeFields: number;
  readonly particleCount: number;
  readonly forcesEvaluated: number;
  readonly evaluationTimeMs: number;
  readonly memoryBytes: number;
  readonly spatialIndexEnabled: boolean;
}

export interface InteractiveParticleSystemConfig {
  readonly id?: string;
  readonly maxParticles?: number;
  readonly forces?: readonly ForceFieldConfig[];
  readonly pointerInteraction?: PointerInteractionConfig;
  readonly gestureMappings?: readonly GestureForceAction[];
  readonly composition?: ForceFieldManagerConfig;
  readonly canvas?: HTMLCanvasElement | null;
  readonly autoStart?: boolean;
}
