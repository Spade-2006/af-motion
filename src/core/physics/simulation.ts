/**
 * AF Motion — Foundational Physics Simulation Engine
 *
 * Implements independent, extensible physics simulations with complete lifecycle
 * management, deterministic stepping, state inspection, and event subscriptions.
 */

import type {
  PhysicsConfiguration,
  PhysicsState,
  PhysicsSimulationContext,
  PhysicsControls,
  PhysicsSimulationOptions,
  PhysicsStepOptions,
  PhysicsStepResult,
  PhysicsLifecycleState,
  PhysicsStateListener,
  PhysicsLifecycleListener,
  PhysicsCompleteListener,
} from "./types.js";
import { clonePhysicsValue, cloneVector, isPhysicsVector } from "./math.js";
import {
  assertValidPhysicsConfig,
  assertValidPhysicsState,
  PhysicsLifecycleError,
} from "./validation.js";
import { resolvePhysicsConfig } from "./presets.js";
import { stepSimulation } from "./stepper.js";

/**
 * Creates an independent, fully isolated physics simulation instance.
 */
export function createPhysicsSimulation(
  options: PhysicsSimulationOptions = {}
): PhysicsControls {
  // 1. Resolve & validate configuration
  const resolvedConfig = resolvePhysicsConfig(options.config);
  assertValidPhysicsConfig(resolvedConfig);

  // 2. Resolve & validate initial state
  const rawInitialPos = options.initialState?.position ?? 0;
  const rawInitialVel = options.initialState?.velocity ?? 0;
  const rawInitialAccel = options.initialState?.acceleration;
  const rawInitialMass = options.initialState?.mass ?? 1.0;

  const defaultInitialState: PhysicsState = {
    position: clonePhysicsValue(rawInitialPos),
    velocity: clonePhysicsValue(rawInitialVel),
    acceleration: rawInitialAccel !== undefined ? clonePhysicsValue(rawInitialAccel) : undefined,
    mass: rawInitialMass,
  };
  assertValidPhysicsState(defaultInitialState);

  // Keep a clean deep copy for reset()
  let baselineState: PhysicsState = {
    position: clonePhysicsValue(defaultInitialState.position),
    velocity: clonePhysicsValue(defaultInitialState.velocity),
    acceleration: defaultInitialState.acceleration !== undefined ? clonePhysicsValue(defaultInitialState.acceleration) : undefined,
    mass: defaultInitialState.mass,
  };

  // Active state
  let currentState: PhysicsState = {
    position: clonePhysicsValue(baselineState.position),
    velocity: clonePhysicsValue(baselineState.velocity),
    acceleration: baselineState.acceleration !== undefined ? clonePhysicsValue(baselineState.acceleration) : undefined,
    mass: baselineState.mass,
  };

  // Active configuration (mutable via setConfiguration)
  let activeConfig: Required<PhysicsConfiguration> = { ...resolvedConfig };

  // Active lifecycle state
  let lifecycle: PhysicsLifecycleState = activeConfig.autoStart ? "running" : "idle";

  // Active simulation context
  let currentContext: PhysicsSimulationContext = {
    time: 0,
    tick: 0,
    lastDeltaTime: 0,
    accumulator: 0,
    alpha: 0,
    lifecycleState: lifecycle,
  };

  // Event listener sets
  const updateListeners = new Set<PhysicsStateListener>();
  const lifecycleListeners = new Set<PhysicsLifecycleListener>();
  const completeListeners = new Set<PhysicsCompleteListener>();

  // Completion check callback
  const isCompleteCustom = options.isComplete;

  /**
   * Helper to notify lifecycle transitions.
   */
  function setLifecycle(next: PhysicsLifecycleState): void {
    if (lifecycle === "disposed" && next !== "disposed") {
      throw new PhysicsLifecycleError("Cannot transition lifecycle on a disposed simulation.");
    }
    if (lifecycle === next) return;

    lifecycle = next;
    currentContext = {
      ...currentContext,
      lifecycleState: lifecycle,
    };

    for (const listener of Array.from(lifecycleListeners)) {
      try {
        listener(lifecycle, currentContext);
      } catch (err) {
        // Prevent listener exceptions from breaking the simulation loop
        console.error("Physics lifecycle listener error:", err);
      }
    }
  }

  /**
   * Asserts that the simulation is alive and not disposed.
   */
  function assertNotDisposed(action: string): void {
    if (lifecycle === "disposed") {
      throw new PhysicsLifecycleError(
        `Cannot perform '${action}' on a disposed physics simulation.`
      );
    }
  }

  const controls: PhysicsControls = {
    start(): void {
      assertNotDisposed("start");
      if (lifecycle === "running") return; // Idempotent
      setLifecycle("running");
    },

    pause(): void {
      assertNotDisposed("pause");
      if (lifecycle === "paused" || lifecycle === "idle" || lifecycle === "completed") return;
      setLifecycle("paused");
    },

    resume(): void {
      assertNotDisposed("resume");
      if (lifecycle === "running" || lifecycle === "completed") return;
      setLifecycle("running");
    },

    stop(): void {
      assertNotDisposed("stop");
      if (lifecycle === "idle") return; // Idempotent
      setLifecycle("idle");
    },

    reset(newInitialState?: Partial<PhysicsState>): void {
      assertNotDisposed("reset");

      if (newInitialState) {
        const updatedBaseline: PhysicsState = {
          position: newInitialState.position !== undefined ? clonePhysicsValue(newInitialState.position) : baselineState.position,
          velocity: newInitialState.velocity !== undefined ? clonePhysicsValue(newInitialState.velocity) : baselineState.velocity,
          acceleration: newInitialState.acceleration !== undefined ? clonePhysicsValue(newInitialState.acceleration) : baselineState.acceleration,
          mass: newInitialState.mass ?? baselineState.mass,
        };
        assertValidPhysicsState(updatedBaseline);
        baselineState = updatedBaseline;
      }

      currentState = {
        position: clonePhysicsValue(baselineState.position),
        velocity: clonePhysicsValue(baselineState.velocity),
        acceleration: baselineState.acceleration !== undefined ? clonePhysicsValue(baselineState.acceleration) : undefined,
        mass: baselineState.mass,
      };

      currentContext = {
        time: 0,
        tick: 0,
        lastDeltaTime: 0,
        accumulator: 0,
        alpha: 0,
        lifecycleState: activeConfig.autoStart ? "running" : "idle",
      };

      setLifecycle(activeConfig.autoStart ? "running" : "idle");
    },

    step(deltaTimeOrOptions?: number | PhysicsStepOptions): PhysicsStepResult {
      assertNotDisposed("step");

      // Extract dt and options
      let dt = activeConfig.timestep;
      let maxSubStepsOverride: number | undefined = undefined;

      if (typeof deltaTimeOrOptions === "number") {
        dt = deltaTimeOrOptions;
      } else if (deltaTimeOrOptions && typeof deltaTimeOrOptions === "object") {
        if (deltaTimeOrOptions.deltaTime !== undefined) {
          dt = deltaTimeOrOptions.deltaTime;
        }
        if (deltaTimeOrOptions.maxSubSteps !== undefined) {
          maxSubStepsOverride = deltaTimeOrOptions.maxSubSteps;
        }
      }

      // If paused or completed, advance context tracking without advancing physical coordinates
      if (lifecycle === "paused" || lifecycle === "completed") {
        return {
          stepsTaken: 0,
          clamped: false,
          state: this.getState(),
          context: this.getContext(),
          completed: lifecycle === "completed",
        };
      }

      // If idle, calling step implicitly sets running
      if (lifecycle === "idle") {
        setLifecycle("running");
      }

      // Advance simulation deterministically
      const advance = stepSimulation(
        currentState,
        currentContext,
        activeConfig,
        dt,
        maxSubStepsOverride
      );

      currentState = advance.state;
      currentContext = advance.context;

      // Check completion condition if specified
      let isCompleted = false;
      if (isCompleteCustom && isCompleteCustom(currentState, currentContext)) {
        isCompleted = true;
        setLifecycle("completed");
        for (const listener of Array.from(completeListeners)) {
          try {
            listener(currentState, currentContext);
          } catch (err) {
            console.error("Physics completion listener error:", err);
          }
        }
      }

      // Notify update listeners
      for (const listener of Array.from(updateListeners)) {
        try {
          listener(currentState, currentContext);
        } catch (err) {
          console.error("Physics update listener error:", err);
        }
      }

      return {
        stepsTaken: advance.stepsTaken,
        clamped: advance.clamped,
        state: this.getState(),
        context: this.getContext(),
        completed: isCompleted,
      };
    },

    getState(): PhysicsState {
      assertNotDisposed("getState");
      return {
        position: clonePhysicsValue(currentState.position),
        velocity: clonePhysicsValue(currentState.velocity),
        acceleration: currentState.acceleration !== undefined ? clonePhysicsValue(currentState.acceleration) : undefined,
        mass: currentState.mass,
      };
    },

    setState(newState: Partial<PhysicsState>): void {
      assertNotDisposed("setState");
      const merged: PhysicsState = {
        position: newState.position !== undefined ? clonePhysicsValue(newState.position) : currentState.position,
        velocity: newState.velocity !== undefined ? clonePhysicsValue(newState.velocity) : currentState.velocity,
        acceleration: newState.acceleration !== undefined ? clonePhysicsValue(newState.acceleration) : currentState.acceleration,
        mass: newState.mass ?? currentState.mass,
      };
      assertValidPhysicsState(merged);
      currentState = merged;
    },

    getContext(): PhysicsSimulationContext {
      assertNotDisposed("getContext");
      return { ...currentContext };
    },

    getConfiguration(): Required<PhysicsConfiguration> {
      assertNotDisposed("getConfiguration");
      return { ...activeConfig };
    },

    setConfiguration(config: Partial<PhysicsConfiguration>): void {
      assertNotDisposed("setConfiguration");
      const next = { ...activeConfig, ...config };
      assertValidPhysicsConfig(next);
      activeConfig = next;
    },

    onUpdate(listener: PhysicsStateListener): () => void {
      assertNotDisposed("onUpdate");
      updateListeners.add(listener);
      return () => {
        updateListeners.delete(listener);
      };
    },

    onLifecycle(listener: PhysicsLifecycleListener): () => void {
      assertNotDisposed("onLifecycle");
      lifecycleListeners.add(listener);
      return () => {
        lifecycleListeners.delete(listener);
      };
    },

    onComplete(listener: PhysicsCompleteListener): () => void {
      assertNotDisposed("onComplete");
      completeListeners.add(listener);
      return () => {
        completeListeners.delete(listener);
      };
    },

    dispose(): void {
      if (lifecycle === "disposed") return; // Idempotent
      setLifecycle("disposed");
      updateListeners.clear();
      lifecycleListeners.clear();
      completeListeners.clear();
    },

    isRunning(): boolean {
      return lifecycle === "running";
    },

    isPaused(): boolean {
      return lifecycle === "paused";
    },

    isCompleted(): boolean {
      return lifecycle === "completed";
    },

    isDisposed(): boolean {
      return lifecycle === "disposed";
    },
  };

  return controls;
}
