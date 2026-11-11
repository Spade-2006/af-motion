/**
 * AF Motion — Advanced Spring Physics Type System
 *
 * Strongly typed contracts for mass-spring-damper simulations,
 * damping regimes, dynamic retargeting, and animation controls.
 */

import type {
  PhysicsValue,
  IntegratorType,
  PhysicsLifecycleState,
  PhysicsSimulationContext,
  PhysicsStepOptions,
} from "./types.js";

/**
 * Three fundamental damping regimes of a second-order harmonic oscillator.
 */
export type SpringDampingBehavior = "underdamped" | "critically-damped" | "overdamped";

/**
 * Advanced configuration options for spring physics simulations.
 */
export interface AdvancedSpringConfig {
  /**
   * Spring stiffness coefficient (k).
   * Dictates the restorative force pulling towards equilibrium.
   * Must be finite and > 0. Default: 170.
   */
  stiffness?: number;

  /**
   * Damping coefficient (c).
   * Friction / resistance force proportional to velocity.
   * Must be finite and >= 0. Default: 26.
   */
  damping?: number;

  /**
   * Mass of the physical entity (m).
   * Dictates inertia and resistance to acceleration.
   * Must be finite and > 0. Default: 1.0.
   */
  mass?: number;

  /**
   * Initial spatial position (scalar or vector).
   * Default: 0.
   */
  from?: PhysicsValue;

  /**
   * Equilibrium / target position (scalar or vector).
   * Default: 1.
   */
  target?: PhysicsValue;

  /**
   * Initial velocity in position units per second (scalar or vector).
   * Default: 0.
   */
  initialVelocity?: PhysicsValue;

  /**
   * Distance from target below which the spring considers position settled.
   * Must be finite and > 0. Default: 0.01.
   */
  restDelta?: number;

  /**
   * Speed below which the spring considers velocity settled.
   * Must be finite and > 0. Default: 0.01.
   */
  restSpeed?: number;

  /**
   * Discrete timestep in seconds for numerical integration steps.
   * Default: 1/60 (~0.016667s). Must be finite and > 0.
   */
  timestep?: number;

  /**
   * Numerical integration algorithm.
   * Default: 'semi-implicit-euler'.
   */
  integrator?: IntegratorType;

  /**
   * Simulation time multiplier.
   * Default: 1.0. Must be finite and >= 0.
   */
  timeScale?: number;

  /**
   * Maximum sub-steps per tick to prevent the spiral of death.
   * Default: 10. Must be an integer >= 1.
   */
  maxSubSteps?: number;

  /**
   * Precision threshold snapping small micro-oscillations to zero.
   * Default: 1e-5.
   */
  precision?: number;

  /**
   * Optional maximum duration limit in seconds.
   * If reached, forces the spring to settle at the target.
   */
  maxDuration?: number;

  /**
   * Automatically start advancing on creation.
   * Default: false.
   */
  autoStart?: boolean;

  /**
   * Respect system reduced motion preferences.
   * Default: true.
   */
  respectReducedMotion?: boolean;
}

/**
 * Complete snapshot of the spring's mechanical state.
 */
export interface SpringState {
  /**
   * Current spatial position (scalar or vector).
   */
  readonly position: PhysicsValue;

  /**
   * Current velocity (scalar or vector).
   */
  readonly velocity: PhysicsValue;

  /**
   * Current instantaneous acceleration (scalar or vector).
   */
  readonly acceleration: PhysicsValue;

  /**
   * Current target / equilibrium position.
   */
  readonly target: PhysicsValue;

  /**
   * Whether the spring has settled at the target equilibrium.
   */
  readonly settled: boolean;

  /**
   * Damping regime classification.
   */
  readonly dampingBehavior: SpringDampingBehavior;

  /**
   * Damping ratio (zeta = c / (2 * sqrt(k * m))).
   */
  readonly dampingRatio: number;

  /**
   * Undamped natural frequency in rad/s (omega0 = sqrt(k / m)).
   */
  readonly naturalFrequency: number;
}

/**
 * Diagnostic result returned by each spring simulation step.
 */
export interface SpringStepResult {
  readonly position: PhysicsValue;
  readonly velocity: PhysicsValue;
  readonly acceleration: PhysicsValue;
  readonly settled: boolean;
  readonly stepsTaken: number;
  readonly clamped: boolean;
  readonly context: PhysicsSimulationContext;
}

/**
 * Options when dynamically updating a spring's target.
 */
export interface SpringRetargetOptions {
  /**
   * Whether to preserve the current velocity (true, default) or reset it to zero (false).
   */
  preserveVelocity?: boolean;

  /**
   * If true, snaps immediately to the new target without further animation.
   */
  immediate?: boolean;
}

/**
 * Standard spring preset names.
 */
export type SpringPresetName =
  | "gentle"
  | "smooth"
  | "snappy"
  | "bouncy"
  | "stiff"
  | "heavy"
  | "soft"
  | "elastic"
  | "critical";

/**
 * Spring preset structure.
 */
export interface SpringPreset {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly behavior: SpringDampingBehavior;
  readonly config: Required<
    Pick<AdvancedSpringConfig, "stiffness" | "damping" | "mass" | "restDelta" | "restSpeed">> &
    Partial<AdvancedSpringConfig>;
}

/**
 * Callback signatures for spring events.
 */
export type SpringUpdateListener = (state: SpringState, context: PhysicsSimulationContext) => void;
export type SpringSettleListener = (state: SpringState, context: PhysicsSimulationContext) => void;
export type SpringCompleteListener = (state: SpringState, context: PhysicsSimulationContext) => void;
export type SpringRetargetListener = (newTarget: PhysicsValue, previousTarget: PhysicsValue) => void;

/**
 * Options for creating an independent spring simulation instance.
 */
export interface AdvancedSpringOptions {
  /**
   * Spring physical parameters or named preset identifier.
   */
  config?: AdvancedSpringConfig | SpringPresetName;

  /**
   * Starting position override.
   */
  from?: PhysicsValue;

  /**
   * Target position override.
   */
  target?: PhysicsValue;

  /**
   * Initial velocity override.
   */
  initialVelocity?: PhysicsValue;

  /**
   * Called on every simulation step.
   */
  onUpdate?: SpringUpdateListener;

  /**
   * Called once when the spring satisfies rest conditions and settles.
   */
  onSettle?: SpringSettleListener;

  /**
   * Called once when the simulation reaches completion or settles.
   */
  onComplete?: SpringCompleteListener;

  /**
   * Called whenever the target is retargeted during simulation.
   */
  onRetarget?: SpringRetargetListener;
}

/**
 * Public controller interface for an active spring simulation instance.
 */
export interface AdvancedSpringControls {
  /**
   * Starts or resumes the spring simulation.
   */
  start(): void;

  /**
   * Pauses the simulation without losing position, velocity, or progress.
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
   * Resets the spring to its initial state (or specified new position and velocity).
   */
  reset(newInitialState?: Partial<AdvancedSpringConfig>): void;

  /**
   * Manually steps the spring simulation forward by deltaTime seconds.
   */
  step(deltaTimeOrOptions?: number | PhysicsStepOptions): SpringStepResult;

  /**
   * Returns a snapshot of the current spring state.
   */
  getState(): SpringState;

  /**
   * Returns a snapshot of the current simulation context.
   */
  getContext(): PhysicsSimulationContext;

  /**
   * Dynamically updates the target position without introducing discontinuities in position or velocity.
   */
  setTarget(newTarget: PhysicsValue, immediate?: boolean): void;

  /**
   * Re-targets the spring with configurable velocity preservation.
   */
  retarget(newTarget: PhysicsValue, options?: SpringRetargetOptions): void;

  /**
   * Sets the velocity directly (velocity injection).
   */
  setVelocity(newVelocity: PhysicsValue): void;

  /**
   * Injects an impulse or delta velocity to the current velocity vector.
   */
  injectVelocity(deltaVelocity: PhysicsValue): void;

  /**
   * Overrides the current position directly.
   */
  setPosition(newPosition: PhysicsValue): void;

  /**
   * Inverts the direction of the current velocity vector.
   */
  reverseVelocity(): void;

  /**
   * Updates the simulation time scaling factor dynamically.
   */
  setTimeScale(scale: number): void;

  /**
   * Returns the current resolved configuration.
   */
  getConfiguration(): Required<AdvancedSpringConfig>;

  /**
   * Updates physical parameters dynamically.
   */
  setConfiguration(config: Partial<AdvancedSpringConfig>): void;

  /**
   * Returns whether the spring has settled at equilibrium.
   */
  isSettled(): boolean;

  /**
   * Returns whether the spring simulation has completed.
   */
  isCompleted(): boolean;

  /**
   * Returns whether the simulation is currently active and running.
   */
  isRunning(): boolean;

  /**
   * Returns whether the simulation is currently paused.
   */
  isPaused(): boolean;

  /**
   * Returns whether the simulation has been disposed.
   */
  isDisposed(): boolean;

  /**
   * Subscribes to step updates. Returns an unsubscribe function.
   */
  onUpdate(listener: SpringUpdateListener): () => void;

  /**
   * Subscribes to settling events. Returns an unsubscribe function.
   */
  onSettle(listener: SpringSettleListener): () => void;

  /**
   * Subscribes to completion events. Returns an unsubscribe function.
   */
  onComplete(listener: SpringCompleteListener): () => void;

  /**
   * Subscribes to retargeting events. Returns an unsubscribe function.
   */
  onRetarget(listener: SpringRetargetListener): () => void;

  /**
   * Disposes the simulation and releases all resources and listener subscriptions.
   */
  dispose(): void;
}

/**
 * Options for animated springs on the shared requestAnimationFrame loop.
 */
export interface AdvancedSpringAnimationOptions extends AdvancedSpringOptions {
  /**
   * Function invoked on each animation frame with updated spring state and context.
   */
  onUpdate: SpringUpdateListener;
}

/**
 * Controls for RAF-driven animated spring.
 */
export interface AdvancedSpringAnimationControls extends AdvancedSpringControls {
  /**
   * Cancels the animation, stopping the RAF loop and suppressing further callbacks.
   */
  cancel(): void;
}
