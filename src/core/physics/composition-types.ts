/**
 * AF Motion — Physics-Based Motion Composition Type System
 *
 * Defines contracts for multi-system physics composition, reusable behaviors,
 * multi-body orchestration, deterministic lifecycle controls, and choreography integration.
 */

import type { PhysicsVector, PhysicsValue, PhysicsSimulationContext, PhysicsLifecycleState } from "./types.js";
import type { AdvancedSpringConfig } from "./spring-types.js";
import type { AdvancedInertiaConfig } from "./inertia-types.js";
import type {
  CollisionBody,
  CollisionBodyConfig,
  CollisionConstraint,
  CollisionConstraintConfig,
  CollisionContact,
  CollisionWorld,
} from "./collision-types.js";

/**
 * Supported physics behavior types.
 */
export type PhysicsBehaviorType =
  | "spring"
  | "inertia"
  | "gravity"
  | "bounded"
  | "collision"
  | "constrained"
  | "hybrid"
  | "multi-force";

/**
 * Context provided to a physics behavior during each simulation sub-step.
 */
export interface BehaviorExecutionContext {
  readonly body: CollisionBody;
  readonly allBodies: ReadonlyMap<string, CollisionBody>;
  readonly dt: number;
  readonly time: number;
  readonly tick: number;
  readonly world?: CollisionWorld;
}

/**
 * Core interface for a modular physics motion behavior.
 */
export interface PhysicsBehavior {
  /**
   * Unique identifier for the behavior instance.
   */
  readonly id: string;

  /**
   * Behavioral classification.
   */
  readonly type: PhysicsBehaviorType;

  /**
   * Execution priority order (lower runs earlier; default: 0).
   */
  readonly priority?: number;

  /**
   * IDs of bodies this behavior applies to. If empty or omitted, applies to all dynamic bodies.
   */
  readonly targetBodyIds?: readonly string[];

  /**
   * Invoked on each discrete simulation sub-step.
   */
  step(context: BehaviorExecutionContext): void;

  /**
   * Evaluates whether this behavior has settled to rest.
   */
  isSettled?(body: CollisionBody): boolean;

  /**
   * Cleans up resources when the behavior is detached or disposed.
   */
  dispose?(): void;
}

/**
 * Multi-body composition snapshot state.
 */
export interface PhysicsCompositionState {
  readonly time: number;
  readonly tick: number;
  readonly lifecycle: PhysicsLifecycleState;
  readonly settled: boolean;
  readonly bodies: ReadonlyMap<string, CollisionBody>;
  readonly contacts: readonly CollisionContact[];
  readonly activeBehaviors: readonly string[];
}

/**
 * Listener callback signatures for composition events.
 */
export type PhysicsCompositionUpdateListener = (state: PhysicsCompositionState) => void;
export type PhysicsCompositionSettleListener = (state: PhysicsCompositionState) => void;
export type PhysicsCompositionCompleteListener = (state: PhysicsCompositionState) => void;

/**
 * Configuration options for creating a unified PhysicsComposition.
 */
export interface PhysicsCompositionConfig {
  /**
   * Optional custom identifier for the composition instance.
   */
  id?: string;

  /**
   * Global simulation fixed timestep in seconds. Default: 1/60.
   */
  timestep?: number;

  /**
   * Maximum sub-steps per frame to prevent the spiral of death. Default: 10.
   */
  maxSubSteps?: number;

  /**
   * Global time scale multiplier. Default: 1.0.
   */
  timeScale?: number;

  /**
   * Global gravity vector applied to dynamic bodies.
   */
  gravity?: PhysicsValue;

  /**
   * Global bounding box region for all bodies.
   */
  bounds?: {
    min: PhysicsValue;
    max: PhysicsValue;
  };

  /**
   * Initial rigid bodies participating in the composition.
   */
  bodies?: CollisionBodyConfig[];

  /**
   * Initial kinematic constraints.
   */
  constraints?: CollisionConstraintConfig[];

  /**
   * Initial modular motion behaviors.
   */
  behaviors?: PhysicsBehavior[];

  /**
   * Whether to automatically start simulation on creation. Default: false.
   */
  autoStart?: boolean;

  /**
   * Respect system reduced motion preferences. Default: true.
   */
  respectReducedMotion?: boolean;
}

/**
 * Unified control interface for a multi-system physics composition.
 */
export interface PhysicsCompositionControls {
  /**
   * Starts simulation progression.
   */
  start(): void;

  /**
   * Pauses simulation progression.
   */
  pause(): void;

  /**
   * Resumes paused simulation.
   */
  resume(): void;

  /**
   * Stops simulation progression.
   */
  stop(): void;

  /**
   * Resets simulation coordinates and time to initial state.
   */
  reset(): void;

  /**
   * Advances simulation deterministically by deltaTime seconds.
   */
  step(deltaTime?: number): PhysicsCompositionState;

  /**
   * Releases all resources, behaviors, listeners, and bodies.
   */
  dispose(): void;

  /**
   * Returns a snapshot of the current composition state.
   */
  getState(): PhysicsCompositionState;

  /**
   * Returns a snapshot of the simulation context.
   */
  getContext(): PhysicsSimulationContext;

  /**
   * Dynamically adds a new body to the composition.
   */
  addBody(config: CollisionBodyConfig): CollisionBody;

  /**
   * Removes a body by ID.
   */
  removeBody(id: string): boolean;

  /**
   * Retrieves a body by ID.
   */
  getBody(id: string): CollisionBody | undefined;

  /**
   * Returns all participating bodies.
   */
  getBodies(): CollisionBody[];

  /**
   * Dynamically adds a behavior to the composition.
   */
  addBehavior(behavior: PhysicsBehavior): void;

  /**
   * Removes a behavior by ID.
   */
  removeBehavior(id: string): boolean;

  /**
   * Returns all active behaviors.
   */
  getBehaviors(): PhysicsBehavior[];

  /**
   * Dynamically adds a physical constraint.
   */
  addConstraint(config: CollisionConstraintConfig): CollisionConstraint;

  /**
   * Removes a constraint by ID.
   */
  removeConstraint(id: string): boolean;

  /**
   * Returns all active constraints.
   */
  getConstraints(): CollisionConstraint[];

  /**
   * Accesses the underlying collision world instance.
   */
  getWorld(): CollisionWorld;

  /**
   * Returns whether all active behaviors and bodies are settled at rest.
   */
  isSettled(): boolean;

  /**
   * Returns whether the composition is currently active and running.
   */
  isRunning(): boolean;

  /**
   * Returns whether the composition is paused.
   */
  isPaused(): boolean;

  /**
   * Returns whether the composition has been disposed.
   */
  isDisposed(): boolean;

  /**
   * Subscribes to step updates. Returns an unsubscribe function.
   */
  onUpdate(listener: PhysicsCompositionUpdateListener): () => void;

  /**
   * Subscribes to settle events. Returns an unsubscribe function.
   */
  onSettle(listener: PhysicsCompositionSettleListener): () => void;

  /**
   * Subscribes to completion events. Returns an unsubscribe function.
   */
  onComplete(listener: PhysicsCompositionCompleteListener): () => void;
}

/**
 * Standard composition recipe descriptor.
 */
export interface PhysicsCompositionRecipe {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  create(overrides?: Partial<PhysicsCompositionConfig>): PhysicsCompositionConfig;
}

/**
 * Options for adapting a physics composition into a choreography sequence or participant.
 */
export interface PhysicsChoreographyOptions {
  /**
   * Label for choreography tracking.
   */
  label?: string;

  /**
   * Start delay in milliseconds before the physics composition begins advancing. Default: 0.
   */
  delay?: number;

  /**
   * Optional maximum run duration in milliseconds before forcing completion.
   */
  timeout?: number;
}
