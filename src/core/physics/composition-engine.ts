/**
 * AF Motion — Unified Physics Motion Composition Engine
 *
 * Orchestrates multi-body systems, modular behavior execution, kinematic constraints,
 * collision manifolds, deterministic fixed-step stepping, and shared RAF animation loops.
 */

import type {
  PhysicsVector,
  PhysicsValue,
  PhysicsSimulationContext,
  PhysicsLifecycleState,
} from "./types.js";
import type {
  PhysicsCompositionConfig,
  PhysicsCompositionControls,
  PhysicsCompositionState,
  PhysicsCompositionUpdateListener,
  PhysicsCompositionSettleListener,
  PhysicsCompositionCompleteListener,
  PhysicsBehavior,
  BehaviorExecutionContext,
} from "./composition-types.js";
import type {
  CollisionBody,
  CollisionBodyConfig,
  CollisionConstraint,
  CollisionConstraintConfig,
  CollisionContact,
  CollisionWorld,
} from "./collision-types.js";
import { createCollisionWorld } from "./collision-world.js";
import { magnitude, isPhysicsVector } from "./math.js";
import { assertValidPhysicsCompositionConfig, correctPhysicsCompositionConfig } from "./composition-validation.js";
import { PhysicsLifecycleError } from "./validation.js";
import { subscribeAnimationFrames } from "../animation.js";
import { onReducedMotionChange, prefersReducedMotion } from "../motion.js";

/**
 * Creates an independent, unified physics motion composition instance.
 */
export function createPhysicsComposition(
  rawConfig: PhysicsCompositionConfig = {}
): PhysicsCompositionControls {
  // Validate and sanitize config
  assertValidPhysicsCompositionConfig(rawConfig);
  const config = correctPhysicsCompositionConfig(rawConfig);

  const timestep = config.timestep ?? 1 / 60;
  const maxSubSteps = config.maxSubSteps ?? 10;
  let timeScale = config.timeScale ?? 1.0;

  // Initialize backing CollisionWorld
  const world: CollisionWorld = createCollisionWorld({
    timestep,
    maxSubSteps,
    gravity: config.gravity,
    bounds: config.bounds,
    bodies: config.bodies,
    constraints: config.constraints,
  });

  // Manage behaviors
  const behaviors = new Map<string, PhysicsBehavior>();
  if (config.behaviors) {
    for (const b of config.behaviors) {
      behaviors.set(b.id, b);
    }
  }

  // Lifecycle state
  let lifecycle: PhysicsLifecycleState = config.autoStart ? "running" : "idle";
  let simulatedTime = 0;
  let tick = 0;
  let accumulator = 0;
  let lastDeltaTime = 0;
  let isSettledState = false;

  // Event listener sets
  const updateListeners = new Set<PhysicsCompositionUpdateListener>();
  const settleListeners = new Set<PhysicsCompositionSettleListener>();
  const completeListeners = new Set<PhysicsCompositionCompleteListener>();

  function assertNotDisposed(action: string): void {
    if (lifecycle === "disposed" || world.isDisposed()) {
      throw new PhysicsLifecycleError(`Cannot perform '${action}' on a disposed PhysicsComposition.`);
    }
  }

  function getContext(): PhysicsSimulationContext {
    return {
      time: simulatedTime,
      tick,
      lastDeltaTime,
      accumulator,
      alpha: 0,
      lifecycleState: lifecycle,
    };
  }

  function computeIsSettled(): boolean {
    const bodies = world.getBodies();
    if (bodies.length === 0) return true;

    // Check all dynamic bodies
    for (const body of bodies) {
      if (body.type === "static") continue;
      const speed = magnitude(body.velocity);
      if (speed > 0.05) return false;
    }

    // Check behaviors with isSettled
    for (const b of behaviors.values()) {
      if (b.isSettled) {
        for (const body of bodies) {
          if (body.type === "static") continue;
          if (!b.targetBodyIds || b.targetBodyIds.includes(body.id)) {
            if (!b.isSettled(body)) return false;
          }
        }
      }
    }

    return true;
  }

  function buildStateSnapshot(): PhysicsCompositionState {
    const bodyMap = new Map<string, CollisionBody>();
    for (const b of world.getBodies()) {
      bodyMap.set(b.id, b);
    }

    return {
      time: simulatedTime,
      tick,
      lifecycle,
      settled: isSettledState,
      bodies: bodyMap,
      contacts: world.getContacts(),
      activeBehaviors: Array.from(behaviors.keys()),
    };
  }

  function emitUpdate(state: PhysicsCompositionState): void {
    for (const listener of updateListeners) listener(state);
  }

  function emitSettle(state: PhysicsCompositionState): void {
    for (const listener of settleListeners) listener(state);
  }

  function emitComplete(state: PhysicsCompositionState): void {
    for (const listener of completeListeners) listener(state);
  }

  // Advance simulation step
  function step(deltaTime = timestep): PhysicsCompositionState {
    assertNotDisposed("step");

    if (lifecycle === "paused" || lifecycle === "completed" || isSettledState) {
      return buildStateSnapshot();
    }

    if (lifecycle === "idle") {
      lifecycle = "running";
    }

    lastDeltaTime = deltaTime;
    const effectiveDt = Math.max(0, deltaTime) * timeScale;
    accumulator += effectiveDt;

    let stepsTaken = 0;
    const bodyList = world.getBodies();
    const allBodiesMap = new Map<string, CollisionBody>();
    for (const b of bodyList) allBodiesMap.set(b.id, b);

    // Sort behaviors by priority
    const sortedBehaviors = Array.from(behaviors.values()).sort(
      (a, b) => (a.priority ?? 0) - (b.priority ?? 0)
    );

    while (accumulator >= timestep && stepsTaken < maxSubSteps) {
      // 1. Run behaviors across target bodies
      for (const behavior of sortedBehaviors) {
        for (const body of bodyList) {
          if (body.type === "static") continue;
          if (!behavior.targetBodyIds || behavior.targetBodyIds.includes(body.id)) {
            const ctx: BehaviorExecutionContext = {
              body,
              allBodies: allBodiesMap,
              dt: timestep,
              time: simulatedTime,
              tick,
              world,
            };
            behavior.step(ctx);
          }
        }
      }

      // 2. Advance collision world (integrates positions, constraints, impulses, and boundaries)
      world.step(timestep);

      tick++;
      simulatedTime += timestep;
      accumulator -= timestep;
      stepsTaken++;

      // 3. Evaluate settling
      const currentlySettled = computeIsSettled();
      if (currentlySettled && !isSettledState) {
        isSettledState = true;
        lifecycle = "completed";
        const state = buildStateSnapshot();
        emitSettle(state);
        emitComplete(state);
        break;
      }
    }

    const currentState = buildStateSnapshot();
    emitUpdate(currentState);
    return currentState;
  }

  const controls: PhysicsCompositionControls = {
    start(): void {
      assertNotDisposed("start");
      if (lifecycle === "running") return;
      lifecycle = "running";
    },

    pause(): void {
      assertNotDisposed("pause");
      if (lifecycle === "running") {
        lifecycle = "paused";
      }
    },

    resume(): void {
      assertNotDisposed("resume");
      if (lifecycle === "paused") {
        lifecycle = "running";
      }
    },

    stop(): void {
      if (lifecycle === "disposed") return;
      lifecycle = "idle";
    },

    reset(): void {
      assertNotDisposed("reset");
      simulatedTime = 0;
      tick = 0;
      accumulator = 0;
      isSettledState = false;
      lifecycle = config.autoStart ? "running" : "idle";
      world.reset();
    },

    step,

    dispose(): void {
      if (lifecycle === "disposed") return;
      lifecycle = "disposed";

      for (const b of behaviors.values()) {
        if (b.dispose) b.dispose();
      }
      behaviors.clear();
      updateListeners.clear();
      settleListeners.clear();
      completeListeners.clear();
      world.dispose();
    },

    getState(): PhysicsCompositionState {
      assertNotDisposed("getState");
      return buildStateSnapshot();
    },

    getContext(): PhysicsSimulationContext {
      assertNotDisposed("getContext");
      return getContext();
    },

    addBody(bodyConfig: CollisionBodyConfig): CollisionBody {
      assertNotDisposed("addBody");
      isSettledState = false;
      return world.addBody(bodyConfig);
    },

    removeBody(id: string): boolean {
      assertNotDisposed("removeBody");
      return world.removeBody(id);
    },

    getBody(id: string): CollisionBody | undefined {
      assertNotDisposed("getBody");
      return world.getBody(id);
    },

    getBodies(): CollisionBody[] {
      assertNotDisposed("getBodies");
      return world.getBodies();
    },

    addBehavior(behavior: PhysicsBehavior): void {
      assertNotDisposed("addBehavior");
      behaviors.set(behavior.id, behavior);
      isSettledState = false;
    },

    removeBehavior(id: string): boolean {
      assertNotDisposed("removeBehavior");
      const b = behaviors.get(id);
      if (b && b.dispose) b.dispose();
      return behaviors.delete(id);
    },

    getBehaviors(): PhysicsBehavior[] {
      assertNotDisposed("getBehaviors");
      return Array.from(behaviors.values());
    },

    addConstraint(cConfig: CollisionConstraintConfig): CollisionConstraint {
      assertNotDisposed("addConstraint");
      isSettledState = false;
      return world.addConstraint(cConfig);
    },

    removeConstraint(id: string): boolean {
      assertNotDisposed("removeConstraint");
      return world.removeConstraint(id);
    },

    getConstraints(): CollisionConstraint[] {
      assertNotDisposed("getConstraints");
      return world.getConstraints();
    },

    getWorld(): CollisionWorld {
      assertNotDisposed("getWorld");
      return world;
    },

    isSettled(): boolean {
      return isSettledState;
    },

    isRunning(): boolean {
      return lifecycle === "running";
    },

    isPaused(): boolean {
      return lifecycle === "paused";
    },

    isDisposed(): boolean {
      return lifecycle === "disposed";
    },

    onUpdate(listener: PhysicsCompositionUpdateListener): () => void {
      assertNotDisposed("onUpdate");
      updateListeners.add(listener);
      return () => updateListeners.delete(listener);
    },

    onSettle(listener: PhysicsCompositionSettleListener): () => void {
      assertNotDisposed("onSettle");
      settleListeners.add(listener);
      return () => settleListeners.delete(listener);
    },

    onComplete(listener: PhysicsCompositionCompleteListener): () => void {
      assertNotDisposed("onComplete");
      completeListeners.add(listener);
      return () => completeListeners.delete(listener);
    },
  };

  return controls;
}

/**
 * Options for animating a physics composition on the shared RAF loop.
 */
export interface AnimatePhysicsCompositionOptions {
  composition: PhysicsCompositionControls;
  respectReducedMotion?: boolean;
}

/**
 * Animates a PhysicsComposition on AF Motion's shared RAF loop.
 */
export function animatePhysicsComposition(
  options: AnimatePhysicsCompositionOptions
): { cancel(): void; dispose(): void } {
  const { composition } = options;
  const respectReducedMotion = options.respectReducedMotion !== false;

  let active = true;
  let previousTime: number | null = null;
  let unsubscribeFrames: (() => void) | null = null;
  let unsubscribePreference = (): void => undefined;

  let reducedMotion = respectReducedMotion && prefersReducedMotion();

  const cleanup = (): void => {
    if (unsubscribeFrames) {
      unsubscribeFrames();
      unsubscribeFrames = null;
    }
    unsubscribePreference();
    unsubscribePreference = (): void => undefined;
  };

  const completeReducedMotion = (): void => {
    if (!active) return;
    active = false;
    cleanup();
    composition.dispose();
  };

  const tick = (time: number): void => {
    if (!active || composition.isDisposed()) return;

    if (reducedMotion) {
      completeReducedMotion();
      return;
    }

    if (!Number.isFinite(time)) return;

    if (previousTime === null) {
      previousTime = time;
      composition.step(0);
      if (composition.isSettled()) {
        active = false;
        cleanup();
      }
      return;
    }

    const elapsedSeconds = Math.max(0, (time - previousTime) / 1000);
    previousTime = time;

    composition.step(elapsedSeconds);

    if (composition.isSettled()) {
      active = false;
      cleanup();
    }
  };

  unsubscribePreference = respectReducedMotion
    ? onReducedMotionChange((reduced) => {
        if (!active) return;
        reducedMotion = reduced;
        if (reducedMotion) {
          completeReducedMotion();
        }
      })
    : (): void => undefined;

  if (reducedMotion) {
    completeReducedMotion();
  } else {
    composition.start();
    unsubscribeFrames = subscribeAnimationFrames(tick);
  }

  return {
    cancel(): void {
      if (!active) return;
      active = false;
      cleanup();
      composition.stop();
    },
    dispose(): void {
      if (!active) return;
      active = false;
      cleanup();
      composition.dispose();
    },
  };
}
