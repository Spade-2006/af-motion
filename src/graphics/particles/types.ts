/**
 * AF Motion Advanced Particle Engine — Type Definitions
 *
 * High-performance, framework-independent particle system architecture
 * supporting millions-scale GPU-accelerated simulation and deterministic CPU fallback.
 */

import type { ComputeBackendType, ComputeDevice } from "../gpu-simulation/types.js";
import type { GraphicsQualityLevel } from "../composition/types.js";
import type { ColorRGBA } from "../textures/canvas-utils.js";

export type ParticleVector3Tuple = readonly [number, number, number];
export type ParticleVector4Tuple = readonly [number, number, number, number];

type Vector3Tuple = ParticleVector3Tuple;
type Vector4Tuple = ParticleVector4Tuple;

export type ParticleBlendMode = "alpha" | "additive" | "multiply" | "screen";

export type ParticleRenderStrategy = "gpu-points" | "gpu-quads" | "canvas2d" | "auto";

export type EmitterShapeType =
  | "point"
  | "line"
  | "circle"
  | "rectangle"
  | "sphere"
  | "box"
  | "cone"
  | "custom";

export type BoundaryAction = "bounce" | "wrap" | "kill" | "none";

export type ParticleColorInput = ColorRGBA | ParticleVector4Tuple | string;
type ColorInput = ParticleColorInput;

export interface ParticleSpawnData {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  ax: number;
  ay: number;
  az: number;
  life: number;
  maxLife: number;
  startSize: number;
  endSize: number;
  startRotation: number;
  angularVelocity: number;
  startOpacity: number;
  endOpacity: number;
  startColor: ParticleVector4Tuple;
  endColor: ParticleVector4Tuple;
  mass: number;
}

export interface PointEmitterShape {
  readonly type: "point";
  readonly position?: ParticleVector3Tuple;
}

export interface LineEmitterShape {
  readonly type: "line";
  readonly start: ParticleVector3Tuple;
  readonly end: ParticleVector3Tuple;
}

export interface CircleEmitterShape {
  readonly type: "circle";
  readonly center?: ParticleVector3Tuple;
  readonly radius: number;
  readonly innerRadius?: number;
  readonly plane?: "xy" | "xz" | "yz";
}

export interface RectangleEmitterShape {
  readonly type: "rectangle";
  readonly center?: ParticleVector3Tuple;
  readonly width: number;
  readonly height: number;
  readonly plane?: "xy" | "xz" | "yz";
}

export interface SphereEmitterShape {
  readonly type: "sphere";
  readonly center?: ParticleVector3Tuple;
  readonly radius: number;
  readonly innerRadius?: number;
  readonly surfaceOnly?: boolean;
}

export interface BoxEmitterShape {
  readonly type: "box";
  readonly center?: ParticleVector3Tuple;
  readonly dimensions: ParticleVector3Tuple;
}

export interface ConeEmitterShape {
  readonly type: "cone";
  readonly apex?: ParticleVector3Tuple;
  readonly direction: ParticleVector3Tuple;
  readonly angle: number;
  readonly baseRadius: number;
  readonly height: number;
}

export interface CustomEmitterShape {
  readonly type: "custom";
  readonly generate: (index: number, prng: () => number) => Partial<ParticleSpawnData>;
}

export type EmitterShape =
  | PointEmitterShape
  | LineEmitterShape
  | CircleEmitterShape
  | RectangleEmitterShape
  | SphereEmitterShape
  | BoxEmitterShape
  | ConeEmitterShape
  | CustomEmitterShape;

export interface ParticleEmitterConfig {
  readonly id?: string;
  readonly shape?: EmitterShape;
  readonly rate?: number;
  readonly burstCount?: number;
  readonly maxParticles?: number;
  readonly lifetime?: number | readonly [number, number];
  readonly speed?: number | readonly [number, number];
  readonly direction?: ParticleVector3Tuple;
  readonly spread?: number;
  readonly size?: number | readonly [number, number];
  readonly opacity?: number | readonly [number, number];
  readonly rotation?: number | readonly [number, number];
  readonly angularVelocity?: number | readonly [number, number];
  readonly color?: ParticleColorInput | readonly [ParticleColorInput, ParticleColorInput];
  readonly mass?: number | readonly [number, number];
  readonly seed?: number;
  readonly enabled?: boolean;
}

export interface ParticleEmitter {
  readonly id: string;
  readonly config: ParticleEmitterConfig;
  enabled: boolean;
  rate: number;
  update(dt: number, pool: ParticleDataPool, prng: () => number): number;
  burst(count: number, pool: ParticleDataPool, prng: () => number): number;
}

export interface ParticleAccessor {
  readonly index: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  ax: number;
  ay: number;
  az: number;
  life: number;
  maxLife: number;
  size: number;
  rotation: number;
  angularVelocity: number;
  opacity: number;
  mass: number;
  color: ParticleVector4Tuple;
}

export type ParticleBehaviorType =
  | "gravity"
  | "directional-force"
  | "radial-force"
  | "attraction"
  | "repulsion"
  | "drag"
  | "friction"
  | "turbulence"
  | "velocity-limits"
  | "boundary-constraints"
  | "custom";

export interface GravityBehavior {
  readonly id?: string;
  readonly type: "gravity";
  readonly force?: ParticleVector3Tuple;
  readonly gpuCompatible?: true;
}

export interface DirectionalForceBehavior {
  readonly id?: string;
  readonly type: "directional-force";
  readonly force: ParticleVector3Tuple;
  readonly gpuCompatible?: true;
}

export interface RadialForceBehavior {
  readonly id?: string;
  readonly type: "radial-force";
  readonly center: ParticleVector3Tuple;
  readonly strength: number;
  readonly radius?: number;
  readonly gpuCompatible?: true;
}

export interface AttractionBehavior {
  readonly id?: string;
  readonly type: "attraction";
  readonly target: ParticleVector3Tuple;
  readonly strength: number;
  readonly radius?: number;
  readonly falloff?: "linear" | "inverse-square";
  readonly gpuCompatible?: true;
}

export interface RepulsionBehavior {
  readonly id?: string;
  readonly type: "repulsion";
  readonly center: ParticleVector3Tuple;
  readonly strength: number;
  readonly radius?: number;
  readonly gpuCompatible?: true;
}

export interface DragBehavior {
  readonly id?: string;
  readonly type: "drag";
  readonly coefficient: number;
  readonly gpuCompatible?: true;
}

export interface FrictionBehavior {
  readonly id?: string;
  readonly type: "friction";
  readonly coefficient: number;
  readonly gpuCompatible?: true;
}

export interface TurbulenceBehavior {
  readonly id?: string;
  readonly type: "turbulence";
  readonly frequency: number;
  readonly strength: number;
  readonly octaves?: number;
  readonly gpuCompatible?: true;
}

export interface VelocityLimitsBehavior {
  readonly id?: string;
  readonly type: "velocity-limits";
  readonly minSpeed?: number;
  readonly maxSpeed?: number;
  readonly gpuCompatible?: true;
}

export interface BoundaryConstraintsBehavior {
  readonly id?: string;
  readonly type: "boundary-constraints";
  readonly bounds: readonly [number, number, number, number, number, number];
  readonly action?: BoundaryAction;
  readonly restitution?: number;
  readonly gpuCompatible?: true;
}

export interface CustomBehavior {
  readonly id?: string;
  readonly type: "custom";
  readonly execute: (particle: ParticleAccessor, dt: number) => void;
  readonly gpuCompatible?: false;
}

export type ParticleBehavior =
  | GravityBehavior
  | DirectionalForceBehavior
  | RadialForceBehavior
  | AttractionBehavior
  | RepulsionBehavior
  | DragBehavior
  | FrictionBehavior
  | TurbulenceBehavior
  | VelocityLimitsBehavior
  | BoundaryConstraintsBehavior
  | CustomBehavior;

export interface ParticleDataPool {
  readonly capacity: number;
  readonly count: number;
  readonly buffer: Float32Array;
  readonly stride: number;
  spawn(data: ParticleSpawnData): number;
  kill(index: number): void;
  getAccessor(index: number): ParticleAccessor;
  clear(): void;
  getActiveIndices(): Int32Array;
}

export interface ParticleSystemMetrics {
  readonly particleCount: number;
  readonly maxParticles: number;
  readonly emitterCount: number;
  readonly behaviorCount: number;
  readonly fps: number;
  readonly stepTimeMs: number;
  readonly renderTimeMs: number;
  readonly memoryBytes: number;
  readonly backend: ComputeBackendType | "canvas2d";
}

export type ParticleSystemState = "idle" | "running" | "paused" | "stopped" | "disposed";

export interface ParticleRenderOptions {
  readonly strategy?: ParticleRenderStrategy;
  readonly blendMode?: ParticleBlendMode;
  readonly pointSizeMultiplier?: number;
  readonly texture?: HTMLImageElement | HTMLCanvasElement | null;
  readonly softParticles?: boolean;
}

export interface ParticleSystemConfig {
  readonly id?: string;
  readonly maxParticles?: number;
  readonly emitters?: readonly (ParticleEmitterConfig | ParticleEmitter)[];
  readonly behaviors?: readonly ParticleBehavior[];
  readonly renderOptions?: ParticleRenderOptions;
  readonly backend?: "auto" | ComputeBackendType;
  readonly quality?: GraphicsQualityLevel;
  readonly device?: ComputeDevice;
  readonly canvas?: HTMLCanvasElement | null;
  readonly fixedTimestep?: number;
  readonly substeps?: number;
  readonly seed?: number;
  readonly autoStart?: boolean;
}

export interface ParticleSystem {
  readonly id: string;
  readonly state: ParticleSystemState;
  readonly particleCount: number;
  readonly maxParticles: number;
  readonly metrics: ParticleSystemMetrics;
  readonly backend: ComputeBackendType | "canvas2d";
  start(): void;
  pause(): void;
  resume(): void;
  stop(): void;
  reset(): void;
  clear(): void;
  dispose(): void;
  burst(count: number, emitterIndexOrId?: number | string): number;
  update(deltaTime?: number): void;
  render(canvas?: HTMLCanvasElement, context?: unknown): void;
  addEmitter(emitter: ParticleEmitter | ParticleEmitterConfig): ParticleEmitter;
  removeEmitter(emitterId: string): boolean;
  addBehavior(behavior: ParticleBehavior): void;
  removeBehavior(behaviorId: string): boolean;
  getEmitters(): readonly ParticleEmitter[];
  getBehaviors(): readonly ParticleBehavior[];
}
