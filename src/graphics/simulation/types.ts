/**
 * AF Motion Simulation Optimization & Lifecycle Types
 *
 * Framework-independent type definitions for unified simulation coordination,
 * shared timestep management, resource pooling, and multi-system composition.
 */

export type SimulationSubsystemType =
  | "gpu-compute"
  | "particle"
  | "fluid"
  | "environment"
  | "particle-field"
  | "physics-3d"
  | "custom";

export type SimulationCoordinatorState =
  | "idle"
  | "running"
  | "paused"
  | "stopped"
  | "disposed";

export type CoordinatorState = SimulationCoordinatorState;

export type SimulationQuality = "low" | "medium" | "high" | "ultra";

export type SimulationCoordinatorTimestepMode = "fixed" | "variable" | "substep";

export type CoordinatorTimestepMode = SimulationCoordinatorTimestepMode;

export interface SimulationTimestepConfig {
  /** Timestep progression mode. Default is 'variable'. */
  readonly mode?: SimulationCoordinatorTimestepMode;
  /** Fixed timestep in seconds when mode is 'fixed' or 'substep'. Default: 1/60 (0.01667s). */
  readonly fixedDelta?: number;
  /** Maximum frame delta in seconds to prevent simulation divergence ('spiral of death'). Default: 0.1s. */
  readonly maxDelta?: number;
  /** Number of internal integration substeps per frame. Default: 1. */
  readonly substeps?: number;
  /** Global time scale multiplier. Default: 1.0. */
  readonly timeScale?: number;
}

export interface SimulationParticipant {
  /** Unique identifier for the simulation participant. */
  readonly id: string;
  /** Classification of the subsystem. */
  readonly type: SimulationSubsystemType;
  /** Execution and rendering priority (lower values evaluate first). Default: 0. */
  readonly priority?: number;
  /** Underlying simulation instance reference. */
  readonly instance?: unknown;
  /** Step the simulation forward by delta time dt (in seconds). */
  step(dt: number, totalTime: number): void;
  /** Optional render pass to the shared canvas. */
  render?(
    canvas: HTMLCanvasElement,
    ctx?: CanvasRenderingContext2D | WebGL2RenderingContext | null
  ): void;
  /** Pause participant internal timers if any. */
  pause?(): void;
  /** Resume participant internal timers if any. */
  resume?(): void;
  /** Reset participant simulation state to initial values. */
  reset?(): void;
  /** Apply runtime quality changes (particle count, grid resolution, etc.). */
  setQuality?(quality: SimulationQuality): void;
  /** Free participant resources and memory. */
  dispose(): void;
  /** Handle WebGL / WebGPU context loss. */
  onContextLost?(): void;
  /** Handle WebGL / WebGPU context restoration. */
  onContextRestored?(): void;
}

export interface SimulationCoordinatorMetrics {
  readonly state: SimulationCoordinatorState;
  readonly participantCount: number;
  readonly fps: number;
  readonly frameTimeMs: number;
  readonly stepTimeMs: number;
  readonly renderTimeMs: number;
  readonly totalSimulationTime: number;
  readonly frameCount: number;
  readonly quality: SimulationQuality;
  readonly isReducedMotion: boolean;
}

export interface SimulationCoordinatorConfig {
  /** Shared canvas element for simulation rendering. */
  readonly canvas?: HTMLCanvasElement | null;
  /** Automatically start the simulation coordinator loop upon initialization. Default: true. */
  readonly autoStart?: boolean;
  /** Timestep configuration parameters. */
  readonly timestep?: SimulationTimestepConfig;
  /** Initial quality level. Default: 'high'. */
  readonly quality?: SimulationQuality;
  /** Whether to respect prefers-reduced-motion media query. Default: true. */
  readonly respectReducedMotion?: boolean;
  /** Whether to pause when the document/tab is hidden. Default: true. */
  readonly visibilityAware?: boolean;
  /** Clear the canvas context before each render pass. Default: true. */
  readonly clearBeforeRender?: boolean;
  /** Background clear color when clearBeforeRender is active. Default: null (transparent). */
  readonly clearColor?: string | null;
  /** Notification hook fired on each simulation step. */
  readonly onStep?: (dt: number, totalTime: number) => void;
  /** Notification hook fired on lifecycle state changes. */
  readonly onStateChange?: (state: SimulationCoordinatorState) => void;
}

export interface SimulationCoordinator {
  /** Register a simulation subsystem participant. Returns an unregister callback. */
  register(participant: SimulationParticipant): () => void;
  /** Unregister a simulation participant by its unique id. */
  unregister(id: string): void;
  /** Retrieve a registered participant by id. */
  getParticipant(id: string): SimulationParticipant | undefined;
  /** Retrieve all active participants sorted by priority. */
  listParticipants(): readonly SimulationParticipant[];
  /** Start the coordinator animation loop. */
  start(): void;
  /** Pause the coordinator animation loop. */
  pause(): void;
  /** Resume the coordinator animation loop. */
  resume(): void;
  /** Reset all registered participants and simulation time to zero. */
  reset(): void;
  /** Deterministically step the entire simulation system forward by dt (or fixedDelta). */
  step(dt?: number): void;
  /** Trigger an explicit render pass across all participants. */
  render(): void;
  /** Cleanly dispose the coordinator and all participants. */
  dispose(): void;
  /** Change the global quality level across all participants. */
  setQuality(quality: SimulationQuality): void;
  /** Get current quality level. */
  getQuality(): SimulationQuality;
  /** Get current coordinator lifecycle state. */
  getState(): SimulationCoordinatorState;
  /** Get real-time simulation metrics. */
  getMetrics(): SimulationCoordinatorMetrics;
  /** Update the shared canvas target. */
  setCanvas(canvas: HTMLCanvasElement | null): void;
  /** Get the current canvas target. */
  getCanvas(): HTMLCanvasElement | null;
  /** Explicitly trigger context lost event across participants. */
  handleContextLost(): void;
  /** Explicitly trigger context restored event across participants. */
  handleContextRestored(): void;
}
