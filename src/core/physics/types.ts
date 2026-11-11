/**
 * AF Motion — Foundational Motion Physics Type System
 *
 * Core mathematical and simulation contracts for framework-independent
 * physics-based animations.
 */

/**
 * 2D or 3D coordinate vector representing position, velocity, acceleration, or force.
 */
export interface PhysicsVector {
  x: number;
  y?: number;
  z?: number;
}

/**
 * Represents a physics quantity as either a 1D scalar or a multi-dimensional vector.
 */
export type PhysicsValue = number | PhysicsVector;

/**
 * Aliases for velocity and acceleration types.
 */
export type PhysicsVelocity = PhysicsValue;
export type PhysicsAcceleration = PhysicsValue;

/**
 * Numerical integration method for simulation steps.
 */
export type IntegratorType = "euler" | "semi-implicit-euler" | "verlet" | "rk4";

/**
 * Lifecycle states of an independent physics simulation.
 */
export type PhysicsLifecycleState = "idle" | "running" | "paused" | "completed" | "disposed";

/**
 * Fundamental configuration parameters for a physics simulation.
 */
export interface PhysicsConfiguration {
  /**
   * Fixed timestep in seconds for numerical integration steps.
   * Default: 1/60 (~0.016667s). Must be a positive finite number.
   */
  timestep?: number;

  /**
   * Time scale multiplier applied to elapsed real time before advancing.
   * Default: 1.0. Must be a non-negative finite number (0 pauses progression).
   */
  timeScale?: number;

  /**
   * Maximum number of fixed sub-steps executed per frame to prevent the spiral of death.
   * Default: 10. Must be an integer >= 1.
   */
  maxSubSteps?: number;

  /**
   * Numerical threshold below which micro-velocities and displacements round to zero.
   * Default: 1e-5. Must be a non-negative finite number.
   */
  precision?: number;

  /**
   * Numerical integration algorithm.
   * Default: 'semi-implicit-euler'.
   */
  integrator?: IntegratorType;

  /**
   * Whether to automatically start simulation on initialization.
   * Default: false.
   */
  autoStart?: boolean;

  /**
   * Whether to respect the system prefers-reduced-motion setting.
   * Default: true.
   */
  respectReducedMotion?: boolean;
}

/**
 * Dynamic state vector of a physical body at any given tick.
 */
export interface PhysicsState {
  /**
   * Current spatial position (scalar or vector).
   */
  position: PhysicsValue;

  /**
   * Current velocity in position units per second (scalar or vector).
   */
  velocity: PhysicsValue;

  /**
   * Current acceleration in position units per second squared (scalar or vector).
   */
  acceleration?: PhysicsAcceleration;

  /**
   * Mass of the physical entity in kilograms or arbitrary mass units.
   * Default: 1.0. Must be > 0.
   */
  mass?: number;
}

/**
 * Complete runtime context representing the simulation timeline and accumulator.
 */
export interface PhysicsSimulationContext {
  /**
   * Total simulated time in seconds elapsed since initial start/reset.
   */
  readonly time: number;

  /**
   * Total number of discrete fixed simulation steps executed.
   */
  readonly tick: number;

  /**
   * Elapsed time in seconds provided in the most recent advance call.
   */
  readonly lastDeltaTime: number;

  /**
   * Residual time in seconds currently stored in the sub-step accumulator.
   */
  readonly accumulator: number;

  /**
   * Sub-step interpolation factor between previous and current state (0.0 to 1.0).
   * Useful for render interpolation between fixed physics steps.
   */
  readonly alpha: number;

  /**
   * Current lifecycle state of the simulation.
   */
  readonly lifecycleState: PhysicsLifecycleState;
}

/**
 * Options provided when advancing the simulation manually.
 */
export interface PhysicsStepOptions {
  /**
   * Elapsed time in seconds to advance.
   * If omitted, advances by exactly 1 fixed timestep.
   */
  deltaTime?: number;

  /**
   * Optional custom override for max sub-steps for this specific advance call.
   */
  maxSubSteps?: number;
}

/**
 * Diagnostic result of a simulation advance step.
 */
export interface PhysicsStepResult {
  /**
   * Number of discrete fixed sub-steps calculated during this advance call.
   */
  readonly stepsTaken: number;

  /**
   * Whether the accumulator exceeded maxSubSteps and was clamped to prevent runaway catch-up.
   */
  readonly clamped: boolean;

  /**
   * Snapshot of the physics state after this advance.
   */
  readonly state: PhysicsState;

  /**
   * Snapshot of the simulation context after this advance.
   */
  readonly context: PhysicsSimulationContext;

  /**
   * Whether the simulation has reached a resting state or completion condition.
   */
  readonly completed: boolean;
}

/**
 * Named preset bundling recommended configuration parameters.
 */
export interface PhysicsPreset {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly config: Required<PhysicsConfiguration>;
}

/**
 * Listener callback signatures.
 */
export type PhysicsStateListener = (state: PhysicsState, context: PhysicsSimulationContext) => void;
export type PhysicsLifecycleListener = (lifecycle: PhysicsLifecycleState, context: PhysicsSimulationContext) => void;
export type PhysicsCompleteListener = (state: PhysicsState, context: PhysicsSimulationContext) => void;

/**
 * Construction options for an independent physics simulation.
 */
export interface PhysicsSimulationOptions {
  /**
   * Configuration parameters or preset overrides.
   */
  config?: PhysicsConfiguration;

  /**
   * Initial state of the body.
   */
  initialState?: Partial<PhysicsState>;

  /**
   * Optional custom condition callback to determine when simulation completes.
   * If not provided, simulation continues until explicitly paused, stopped, or disposed.
   */
  isComplete?: (state: PhysicsState, context: PhysicsSimulationContext) => boolean;
}

/**
 * Public controller interface for an active physics simulation instance.
 */
export interface PhysicsControls {
  /**
   * Starts the simulation if idle, or resumes if paused.
   */
  start(): void;

  /**
   * Pauses simulation time progression.
   */
  pause(): void;

  /**
   * Resumes a paused simulation.
   */
  resume(): void;

  /**
   * Stops the simulation and marks it idle.
   */
  stop(): void;

  /**
   * Resets the simulation to the initial state (or specified new state),
   * zeroing out accumulated time, ticks, and alpha.
   */
  reset(newInitialState?: Partial<PhysicsState>): void;

  /**
   * Advances the simulation deterministically by deltaTime seconds (or 1 fixed timestep).
   */
  step(deltaTimeOrOptions?: number | PhysicsStepOptions): PhysicsStepResult;

  /**
   * Returns a snapshot of the current state.
   */
  getState(): PhysicsState;

  /**
   * Directly sets/overrides the current physics state.
   */
  setState(newState: Partial<PhysicsState>): void;

  /**
   * Returns a snapshot of the current simulation context.
   */
  getContext(): PhysicsSimulationContext;

  /**
   * Returns the current resolved configuration.
   */
  getConfiguration(): Required<PhysicsConfiguration>;

  /**
   * Updates configuration parameters dynamically.
   */
  setConfiguration(config: Partial<PhysicsConfiguration>): void;

  /**
   * Subscribes to state updates after each simulation step.
   * Returns an unsubscribe function.
   */
  onUpdate(listener: PhysicsStateListener): () => void;

  /**
   * Subscribes to lifecycle transitions.
   * Returns an unsubscribe function.
   */
  onLifecycle(listener: PhysicsLifecycleListener): () => void;

  /**
   * Subscribes to completion events.
   * Returns an unsubscribe function.
   */
  onComplete(listener: PhysicsCompleteListener): () => void;

  /**
   * Disposes the simulation, clears all listener subscriptions, and releases resources.
   */
  dispose(): void;

  /**
   * Returns whether the simulation is currently active and running.
   */
  isRunning(): boolean;

  /**
   * Returns whether the simulation is currently paused.
   */
  isPaused(): boolean;

  /**
   * Returns whether the simulation has completed.
   */
  isCompleted(): boolean;

  /**
   * Returns whether the simulation has been permanently disposed.
   */
  isDisposed(): boolean;
}
