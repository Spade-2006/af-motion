/**
 * AF Motion — Inertia, Momentum, Friction & Gravity Type System
 *
 * Strongly typed contracts for mass-aware momentum simulations,
 * multi-model friction and drag resistance, external forces, and directional gravity.
 */

import type {
  PhysicsValue,
  IntegratorType,
  PhysicsSimulationContext,
  PhysicsStepOptions,
} from "./types.js";

/**
 * Advanced configuration options for inertia and momentum simulations.
 */
export interface AdvancedInertiaConfig {
  /**
   * Mass of the body in mass units / kilograms (m).
   * Determines resistance to acceleration (F = m * a) and momentum (p = m * v).
   * Must be finite and > 0. Default: 1.0.
   */
  mass?: number;

  /**
   * Viscous / exponential friction coefficient (gamma).
   * Opposes velocity proportionally: F_viscous = -m * gamma * v.
   * Must be finite and >= 0. Default: 4.0.
   */
  friction?: number;

  /**
   * Constant kinetic / Coulomb friction coefficient (mu).
   * Opposes the direction of motion with constant magnitude: F_kinetic = -mu * m * norm(v).
   * Must be finite and >= 0. Default: 0.
   */
  linearFriction?: number;

  /**
   * Aerodynamic drag / quadratic air resistance coefficient (c_d).
   * Opposes velocity quadratically: F_drag = -c_d * |v| * v.
   * Must be finite and >= 0. Default: 0.
   */
  drag?: number;

  /**
   * Directional gravity acceleration vector or scalar (g).
   * Generates weight force: F_gravity = m * g.
   * Scalar (e.g. 9.8 or 980) or vector (e.g. { x: 0, y: 9.8 } or { x: 0, y: -980, z: 0 }).
   * Default: 0.
   */
  gravity?: PhysicsValue;

  /**
   * Optional maximum speed / terminal velocity clamp.
   * If speed exceeds this value, velocity is clamped to this magnitude.
   * Must be finite and > 0.
   */
  terminalVelocity?: number;

  /**
   * Minimum speed threshold below which motion is considered settled.
   * Default: 0.5. Must be finite and >= 0.
   */
  minVelocity?: number;

  /**
   * Initial spatial position (scalar or vector).
   * Default: 0.
   */
  from?: PhysicsValue;

  /**
   * Initial velocity vector or scalar (v0).
   * Default: 0.
   */
  initialVelocity?: PhysicsValue;

  /**
   * Optional lower bound coordinate. If position exceeds lower bound,
   * movement is clamped and velocity in that axis is zeroed.
   */
  min?: PhysicsValue;

  /**
   * Optional upper bound coordinate. If position exceeds upper bound,
   * movement is clamped and velocity in that axis is zeroed.
   */
  max?: PhysicsValue;

  /**
   * Discrete fixed timestep in seconds for numerical integration steps.
   * Default: 1/60 (~0.016667s). Must be finite and > 0.
   */
  timestep?: number;

  /**
   * Numerical integration algorithm.
   * Default: 'semi-implicit-euler'.
   */
  integrator?: IntegratorType;

  /**
   * Simulation time progression multiplier.
   * Default: 1.0. Must be finite and >= 0.
   */
  timeScale?: number;

  /**
   * Maximum sub-steps per frame to prevent the spiral of death.
   * Default: 10. Must be an integer >= 1.
   */
  maxSubSteps?: number;

  /**
   * Precision threshold snapping small micro-velocities to zero.
   * Default: 1e-5.
   */
  precision?: number;

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
 * Complete snapshot of the inertia simulation state.
 */
export interface InertiaState {
  /**
   * Current spatial position (scalar or vector).
   */
  readonly position: PhysicsValue;

  /**
   * Current instantaneous velocity (scalar or vector).
   */
  readonly velocity: PhysicsValue;

  /**
   * Current instantaneous acceleration (scalar or vector).
   */
  readonly acceleration: PhysicsValue;

  /**
   * Total net force acting on the body: F_net = F_gravity + F_friction + F_drag + F_external.
   */
  readonly netForce: PhysicsValue;

  /**
   * Mass of the body.
   */
  readonly mass: number;

  /**
   * Whether the body has settled at rest.
   */
  readonly settled: boolean;

  /**
   * Current speed (Euclidean magnitude of velocity).
   */
  readonly speed: number;

  /**
   * Momentum vector or scalar (p = m * v).
   */
  readonly momentum: PhysicsValue;

  /**
   * Kinetic energy of the body: E_k = 0.5 * m * |v|^2.
   */
  readonly kineticEnergy: number;
}

/**
 * Diagnostic result returned by each inertia simulation step.
 */
export interface InertiaStepResult {
  readonly position: PhysicsValue;
  readonly velocity: PhysicsValue;
  readonly acceleration: PhysicsValue;
  readonly netForce: PhysicsValue;
  readonly settled: boolean;
  readonly stepsTaken: number;
  readonly clamped: boolean;
  readonly context: PhysicsSimulationContext;
}

/**
 * Standard inertia preset names.
 */
export type InertiaPresetName =
  | "natural"
  | "heavy"
  | "light"
  | "high-friction"
  | "low-friction"
  | "air-resistance"
  | "gravity"
  | "zero-gravity"
  | "fast-deceleration";

/**
 * Named preset structure for inertia configurations.
 */
export interface InertiaPreset {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly config: Partial<AdvancedInertiaConfig>;
}

/**
 * Callback signatures for inertia events.
 */
export type InertiaUpdateListener = (state: InertiaState, context: PhysicsSimulationContext) => void;
export type InertiaSettleListener = (state: InertiaState, context: PhysicsSimulationContext) => void;
export type InertiaCompleteListener = (state: InertiaState, context: PhysicsSimulationContext) => void;

/**
 * Options for creating an independent inertia simulation instance.
 */
export interface AdvancedInertiaOptions {
  /**
   * Configuration object or named preset identifier.
   */
  config?: AdvancedInertiaConfig | InertiaPresetName;

  /**
   * Starting position override.
   */
  from?: PhysicsValue;

  /**
   * Initial velocity override.
   */
  initialVelocity?: PhysicsValue;

  /**
   * Gravity vector/scalar override.
   */
  gravity?: PhysicsValue;

  /**
   * Called on every simulation step.
   */
  onUpdate?: InertiaUpdateListener;

  /**
   * Called once when the body decelerates to rest.
   */
  onSettle?: InertiaSettleListener;

  /**
   * Called once when the simulation reaches completion or settles.
   */
  onComplete?: InertiaCompleteListener;
}

/**
 * Public controller interface for an active inertia simulation instance.
 */
export interface AdvancedInertiaControls {
  /**
   * Starts or resumes the inertia simulation.
   */
  start(): void;

  /**
   * Pauses the simulation without losing position, velocity, or momentum.
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
   * Resets the simulation to its initial state or baseline.
   */
  reset(newInitialState?: Partial<AdvancedInertiaConfig>): void;

  /**
   * Manually steps the inertia simulation forward by deltaTime seconds.
   */
  step(deltaTimeOrOptions?: number | PhysicsStepOptions): InertiaStepResult;

  /**
   * Applies an external force (F) that acts on the body.
   * Can be sustained or continuous.
   */
  applyForce(force: PhysicsValue): void;

  /**
   * Clears any active continuous external force.
   */
  clearForce(): void;

  /**
   * Applies an instantaneous impulse (J), altering velocity by: delta_v = J / mass.
   */
  applyImpulse(impulse: PhysicsValue): void;

  /**
   * Injects or adds velocity to the current velocity vector.
   */
  injectVelocity(deltaVelocity: PhysicsValue): void;

  /**
   * Directly sets the current velocity vector.
   */
  setVelocity(newVelocity: PhysicsValue): void;

  /**
   * Directly overrides the current position coordinates.
   */
  setPosition(newPosition: PhysicsValue): void;

  /**
   * Inverts the direction of the velocity vector.
   */
  reverseVelocity(): void;

  /**
   * Dynamically updates the gravity vector.
   */
  setGravity(gravity: PhysicsValue): void;

  /**
   * Dynamically updates the friction coefficient.
   */
  setFriction(friction: number): void;

  /**
   * Updates the simulation time scaling factor dynamically.
   */
  setTimeScale(scale: number): void;

  /**
   * Returns a snapshot of the current state.
   */
  getState(): InertiaState;

  /**
   * Returns a snapshot of the current simulation context.
   */
  getContext(): PhysicsSimulationContext;

  /**
   * Returns the current resolved configuration.
   */
  getConfiguration(): Required<AdvancedInertiaConfig>;

  /**
   * Dynamically updates physical configuration parameters.
   */
  setConfiguration(config: Partial<AdvancedInertiaConfig>): void;

  /**
   * Returns whether the body has settled at rest.
   */
  isSettled(): boolean;

  /**
   * Returns whether the simulation has completed.
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
  onUpdate(listener: InertiaUpdateListener): () => void;

  /**
   * Subscribes to settling events. Returns an unsubscribe function.
   */
  onSettle(listener: InertiaSettleListener): () => void;

  /**
   * Subscribes to completion events. Returns an unsubscribe function.
   */
  onComplete(listener: InertiaCompleteListener): () => void;

  /**
   * Disposes the simulation and releases all resources and listener subscriptions.
   */
  dispose(): void;
}

/**
 * Options for animated inertia on the shared requestAnimationFrame loop.
 */
export interface AdvancedInertiaAnimationOptions extends AdvancedInertiaOptions {
  /**
   * Function invoked on each animation frame with updated inertia state and context.
   */
  onUpdate: InertiaUpdateListener;
}

/**
 * Controls for RAF-driven animated inertia.
 */
export interface AdvancedInertiaAnimationControls extends AdvancedInertiaControls {
  /**
   * Cancels the animation, stopping the RAF loop and suppressing further callbacks.
   */
  cancel(): void;
}
