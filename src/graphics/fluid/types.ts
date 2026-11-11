/**
 * AF Motion Fluid & Flow Simulation Engine — Type Definitions
 *
 * Framework-independent Eulerian fluid simulation architecture supporting
 * Navier-Stokes velocity advection, pressure projection, flow fields,
 * obstacle interaction, and particle coupling across GPU and CPU backends.
 */

import type { ComputeBackendType } from "../gpu-simulation/types.js";
import type { GraphicsQualityLevel } from "../composition/types.js";

export type FluidVector2Tuple = readonly [number, number];
export type FluidVector3Tuple = readonly [number, number, number];
export type Vector2Tuple = FluidVector2Tuple;

export type FluidBoundaryMode = "closed" | "open" | "periodic";

export type FluidVisualizationMode =
  | "density"
  | "velocity"
  | "vector-field"
  | "pressure"
  | "smoke"
  | "ink"
  | "color-field";

export type FlowFieldType =
  | "directional"
  | "radial"
  | "vortex"
  | "curl-noise"
  | "custom"
  | "composite";

export interface FluidGridDimensions {
  readonly width: number;
  readonly height: number;
  readonly depth?: number;
}

export interface DirectionalFlowFieldConfig {
  readonly type: "directional";
  readonly id?: string;
  readonly direction: Vector2Tuple;
  readonly strength?: number;
  readonly weight?: number;
}

export interface RadialFlowFieldConfig {
  readonly type: "radial";
  readonly id?: string;
  readonly center: Vector2Tuple;
  readonly strength: number;
  readonly radius?: number;
  readonly falloff?: "linear" | "inverse-square";
  readonly weight?: number;
}

export interface VortexFlowFieldConfig {
  readonly type: "vortex";
  readonly id?: string;
  readonly center: Vector2Tuple;
  readonly strength: number;
  readonly radius?: number;
  readonly inwardPull?: number;
  readonly weight?: number;
}

export interface CurlNoiseFlowFieldConfig {
  readonly type: "curl-noise";
  readonly id?: string;
  readonly frequency?: number;
  readonly strength?: number;
  readonly octaves?: number;
  readonly timeScale?: number;
  readonly weight?: number;
}

export interface CustomFlowFieldConfig {
  readonly type: "custom";
  readonly id?: string;
  readonly evaluate: (x: number, y: number, time: number) => Vector2Tuple;
  readonly weight?: number;
}

export interface CompositeFlowFieldConfig {
  readonly type: "composite";
  readonly id?: string;
  readonly fields: readonly FlowFieldConfig[];
  readonly weight?: number;
}

export type FlowFieldConfig =
  | DirectionalFlowFieldConfig
  | RadialFlowFieldConfig
  | VortexFlowFieldConfig
  | CurlNoiseFlowFieldConfig
  | CustomFlowFieldConfig
  | CompositeFlowFieldConfig;

export interface FlowField {
  readonly id: string;
  readonly type: FlowFieldType;
  enabled: boolean;
  weight: number;
  evaluate(x: number, y: number, time: number): Vector2Tuple;
}

export interface FluidForce {
  readonly id?: string;
  x: number;
  y: number;
  fx: number;
  fy: number;
  radius?: number;
  density?: number;
}

export type FluidObstacleShape =
  | { readonly type: "circle"; readonly center: Vector2Tuple; readonly radius: number }
  | { readonly type: "box"; readonly min: Vector2Tuple; readonly max: Vector2Tuple };

export interface FluidObstacle {
  readonly id: string;
  readonly shape: FluidObstacleShape;
  enabled: boolean;
  contains(x: number, y: number): boolean;
}

export interface FluidSolverConfig {
  readonly iterations?: number;
  readonly viscosity?: number;
  readonly dissipation?: number;
  readonly pressureRelaxation?: number;
  readonly boundaryMode?: FluidBoundaryMode;
  readonly maxDeltaTime?: number;
  readonly velocityDissipation?: number;
}

export interface FluidSolver {
  readonly config: FluidSolverConfig;
  step(grid: FluidGrid, dt: number, forces: readonly FluidForce[], time: number): void;
}

export interface FluidGrid {
  readonly width: number;
  readonly height: number;
  readonly size: number;
  readonly u: Float32Array;
  readonly v: Float32Array;
  readonly u0: Float32Array;
  readonly v0: Float32Array;
  readonly density: Float32Array;
  readonly density0: Float32Array;
  readonly pressure: Float32Array;
  readonly divergence: Float32Array;
  readonly obstacles: Uint8Array;
  swapVelocity(): void;
  swapDensity(): void;
  clear(): void;
  sampleVelocity(normX: number, normY: number): Vector2Tuple;
  sampleDensity(normX: number, normY: number): number;
}

export interface FluidRenderOptions {
  readonly mode?: FluidVisualizationMode;
  readonly colorRamp?: readonly [string, string] | readonly string[];
  readonly opacity?: number;
  readonly glyphScale?: number;
  readonly glyphSpacing?: number;
  readonly smokeColor?: readonly [number, number, number];
  readonly inkColor?: readonly [number, number, number];
}

export interface FluidSimulationMetrics {
  readonly gridWidth: number;
  readonly gridHeight: number;
  readonly activeCells: number;
  readonly fps: number;
  readonly stepTimeMs: number;
  readonly renderTimeMs: number;
  readonly memoryBytes: number;
  readonly backend: ComputeBackendType | "canvas2d";
}

export type FluidSimulationState = "idle" | "running" | "paused" | "disposed";

export interface FluidSimulationConfig {
  readonly id?: string;
  readonly resolution?: number | FluidGridDimensions;
  readonly solver?: FluidSolverConfig;
  readonly flowFields?: readonly FlowFieldConfig[];
  readonly obstacles?: readonly FluidObstacleShape[];
  readonly renderOptions?: FluidRenderOptions;
  readonly backend?: "auto" | ComputeBackendType;
  readonly quality?: GraphicsQualityLevel;
  readonly canvas?: HTMLCanvasElement | null;
  readonly fixedTimestep?: number;
  readonly autoStart?: boolean;
}

export interface FluidSimulation {
  readonly id: string;
  readonly state: FluidSimulationState;
  readonly grid: FluidGrid;
  readonly metrics: FluidSimulationMetrics;
  readonly backend: ComputeBackendType | "canvas2d";
  start(): void;
  pause(): void;
  resume(): void;
  reset(): void;
  dispose(): void;
  update(deltaTime?: number): void;
  render(canvas?: HTMLCanvasElement, context?: unknown): void;
  addForce(force: FluidForce): void;
  addObstacle(shape: FluidObstacleShape, id?: string): FluidObstacle;
  removeObstacle(id: string): boolean;
  addFlowField(field: FlowField | FlowFieldConfig): FlowField;
  removeFlowField(id: string): boolean;
  sampleVelocity(normX: number, normY: number): Vector2Tuple;
  sampleDensity(normX: number, normY: number): number;
  getObstacles(): readonly FluidObstacle[];
  getFlowFields(): readonly FlowField[];
}
