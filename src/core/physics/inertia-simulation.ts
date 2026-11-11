/**
 * AF Motion — Advanced Inertia, Momentum, Friction & Gravity Simulation Engine
 *
 * Implements headless momentum simulations combining mass, multi-model friction,
 * aerodynamic drag, directional gravity, external forces, and impulses.
 */

import type {
  AdvancedInertiaOptions,
  AdvancedInertiaControls,
  AdvancedInertiaConfig,
  InertiaState,
  InertiaStepResult,
  InertiaUpdateListener,
  InertiaSettleListener,
  InertiaCompleteListener,
} from "./inertia-types.js";
import type {
  PhysicsValue,
  PhysicsSimulationContext,
  PhysicsLifecycleState,
  PhysicsStepOptions,
} from "./types.js";
import {
  clonePhysicsValue,
  addValues,
  scaleValue,
  valueMagnitude,
  isPhysicsValue,
} from "./math.js";
import {
  calculateMomentum,
  calculateKineticEnergy,
  calculateInertiaAcceleration,
  isInertiaSettled,
  applyPositionBounds,
  integrateInertiaStep,
} from "./inertia-math.js";
import { resolveInertiaConfig } from "./inertia-presets.js";
import { assertValidInertiaConfig } from "./inertia-validation.js";
import { PhysicsLifecycleError, PhysicsNumericalError } from "./validation.js";

/**
 * Creates an independent, headless inertia and momentum simulation instance.
 */
export function createInertiaSimulation(
  options: AdvancedInertiaOptions = {}
): AdvancedInertiaControls {
  // 1. Resolve and validate configuration
  const resolvedConfig = resolveInertiaConfig(options.config);
  if (options.from !== undefined) resolvedConfig.from = clonePhysicsValue(options.from);
  if (options.initialVelocity !== undefined) resolvedConfig.initialVelocity = clonePhysicsValue(options.initialVelocity);
  if (options.gravity !== undefined) resolvedConfig.gravity = clonePhysicsValue(options.gravity);

  assertValidInertiaConfig(resolvedConfig);

  // Active configuration
  let config: Required<AdvancedInertiaConfig> = { ...resolvedConfig };

  // Baseline state for reset()
  let baselineFrom = clonePhysicsValue(config.from);
  let baselineVelocity = clonePhysicsValue(config.initialVelocity);
  let baselineGravity = clonePhysicsValue(config.gravity);

  // Active coordinates
  let position: PhysicsValue = clonePhysicsValue(baselineFrom);
  let velocity: PhysicsValue = clonePhysicsValue(baselineVelocity);
  let gravity: PhysicsValue = clonePhysicsValue(baselineGravity);
  let externalForce: PhysicsValue = 0;

  // Initial acceleration and force
  let { acceleration, netForce } = calculateInertiaAcceleration(
    velocity,
    config.mass,
    gravity,
    config.friction,
    config.linearFriction,
    config.drag,
    externalForce
  );

  // Settled state
  let settled = isInertiaSettled(velocity, gravity, externalForce, config.minVelocity);

  // Lifecycle state
  let lifecycle: PhysicsLifecycleState = config.autoStart ? "running" : "idle";

  // Context tracking
  let simulatedTime = 0;
  let tick = 0;
  let accumulator = 0;
  let alpha = 0;
  let lastDeltaTime = 0;

  // Event listener sets
  const updateListeners = new Set<InertiaUpdateListener>();
  const settleListeners = new Set<InertiaSettleListener>();
  const completeListeners = new Set<InertiaCompleteListener>();

  // Attach options listeners
  if (options.onUpdate) updateListeners.add(options.onUpdate);
  if (options.onSettle) settleListeners.add(options.onSettle);
  if (options.onComplete) completeListeners.add(options.onComplete);

  function assertNotDisposed(action: string): void {
    if (lifecycle === "disposed") {
      throw new PhysicsLifecycleError(`Cannot perform '${action}' on a disposed inertia simulation.`);
    }
  }

  function getContext(): PhysicsSimulationContext {
    return {
      time: simulatedTime,
      tick,
      lastDeltaTime,
      accumulator,
      alpha,
      lifecycleState: lifecycle,
    };
  }

  function getState(): InertiaState {
    assertNotDisposed("getState");
    const speed = valueMagnitude(velocity);
    return {
      position: clonePhysicsValue(position),
      velocity: clonePhysicsValue(velocity),
      acceleration: clonePhysicsValue(acceleration),
      netForce: clonePhysicsValue(netForce),
      mass: config.mass,
      settled,
      speed,
      momentum: calculateMomentum(velocity, config.mass),
      kineticEnergy: calculateKineticEnergy(velocity, config.mass),
    };
  }

  const controls: AdvancedInertiaControls = {
    start(): void {
      assertNotDisposed("start");
      if (lifecycle === "running") return;
      if (settled) {
        if (!isInertiaSettled(velocity, gravity, externalForce, config.minVelocity)) {
          settled = false;
        }
      }
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
      assertNotDisposed("stop");
      if (lifecycle !== "idle") {
        lifecycle = "idle";
      }
    },

    reset(newInitialState?: Partial<AdvancedInertiaConfig>): void {
      assertNotDisposed("reset");

      if (newInitialState) {
        if (newInitialState.from !== undefined) baselineFrom = clonePhysicsValue(newInitialState.from);
        if (newInitialState.initialVelocity !== undefined) baselineVelocity = clonePhysicsValue(newInitialState.initialVelocity);
        if (newInitialState.gravity !== undefined) baselineGravity = clonePhysicsValue(newInitialState.gravity);
        if (newInitialState.mass !== undefined) config.mass = newInitialState.mass;
        if (newInitialState.friction !== undefined) config.friction = newInitialState.friction;
        if (newInitialState.linearFriction !== undefined) config.linearFriction = newInitialState.linearFriction;
        if (newInitialState.drag !== undefined) config.drag = newInitialState.drag;
        assertValidInertiaConfig(config);
      }

      position = clonePhysicsValue(baselineFrom);
      velocity = clonePhysicsValue(baselineVelocity);
      gravity = clonePhysicsValue(baselineGravity);
      externalForce = 0;

      const calc = calculateInertiaAcceleration(
        velocity,
        config.mass,
        gravity,
        config.friction,
        config.linearFriction,
        config.drag,
        externalForce
      );
      acceleration = calc.acceleration;
      netForce = calc.netForce;

      settled = isInertiaSettled(velocity, gravity, externalForce, config.minVelocity);
      simulatedTime = 0;
      tick = 0;
      accumulator = 0;
      alpha = 0;
      lastDeltaTime = 0;
      lifecycle = config.autoStart ? "running" : "idle";
    },

    applyForce(force: PhysicsValue): void {
      assertNotDisposed("applyForce");
      if (!isPhysicsValue(force)) {
        throw new PhysicsNumericalError(`Invalid force value: ${JSON.stringify(force)}`);
      }
      externalForce = addValues(externalForce, force);
      settled = false;
      if (lifecycle === "completed" || lifecycle === "idle") {
        lifecycle = "running";
      }
    },

    clearForce(): void {
      assertNotDisposed("clearForce");
      externalForce = 0;
    },

    applyImpulse(impulse: PhysicsValue): void {
      assertNotDisposed("applyImpulse");
      if (!isPhysicsValue(impulse)) {
        throw new PhysicsNumericalError(`Invalid impulse value: ${JSON.stringify(impulse)}`);
      }
      // Delta velocity: dv = impulse / mass
      const dv = scaleValue(impulse, 1 / config.mass);
      velocity = addValues(velocity, dv);
      settled = false;
      if (lifecycle === "completed" || lifecycle === "idle") {
        lifecycle = "running";
      }
    },

    injectVelocity(deltaVelocity: PhysicsValue): void {
      assertNotDisposed("injectVelocity");
      if (!isPhysicsValue(deltaVelocity)) {
        throw new PhysicsNumericalError(`Invalid delta velocity value: ${JSON.stringify(deltaVelocity)}`);
      }
      velocity = addValues(velocity, deltaVelocity);
      settled = false;
      if (lifecycle === "completed" || lifecycle === "idle") {
        lifecycle = "running";
      }
    },

    setVelocity(newVel: PhysicsValue): void {
      assertNotDisposed("setVelocity");
      if (!isPhysicsValue(newVel)) {
        throw new PhysicsNumericalError(`Invalid velocity value: ${JSON.stringify(newVel)}`);
      }
      velocity = clonePhysicsValue(newVel);
      settled = false;
      if (lifecycle === "completed" || lifecycle === "idle") {
        lifecycle = "running";
      }
    },

    setPosition(newPos: PhysicsValue): void {
      assertNotDisposed("setPosition");
      if (!isPhysicsValue(newPos)) {
        throw new PhysicsNumericalError(`Invalid position value: ${JSON.stringify(newPos)}`);
      }
      position = clonePhysicsValue(newPos);
    },

    reverseVelocity(): void {
      assertNotDisposed("reverseVelocity");
      velocity = scaleValue(velocity, -1);
      settled = false;
    },

    setGravity(newGravity: PhysicsValue): void {
      assertNotDisposed("setGravity");
      if (!isPhysicsValue(newGravity)) {
        throw new PhysicsNumericalError(`Invalid gravity value: ${JSON.stringify(newGravity)}`);
      }
      gravity = clonePhysicsValue(newGravity);
      config.gravity = clonePhysicsValue(newGravity);
      settled = false;
    },

    setFriction(newFriction: number): void {
      assertNotDisposed("setFriction");
      if (typeof newFriction !== "number" || !Number.isFinite(newFriction) || newFriction < 0) {
        throw new PhysicsNumericalError(`friction must be a non-negative finite number, received ${newFriction}`);
      }
      config.friction = newFriction;
    },

    setTimeScale(scale: number): void {
      assertNotDisposed("setTimeScale");
      if (typeof scale !== "number" || !Number.isFinite(scale) || scale < 0) {
        throw new PhysicsNumericalError(`timeScale must be a non-negative finite number, received ${scale}`);
      }
      config.timeScale = scale;
    },

    step(deltaTimeOrOptions?: number | PhysicsStepOptions): InertiaStepResult {
      assertNotDisposed("step");

      let dt = config.timestep;
      let maxSubStepsOverride: number | undefined = undefined;

      if (typeof deltaTimeOrOptions === "number") {
        dt = deltaTimeOrOptions;
      } else if (deltaTimeOrOptions && typeof deltaTimeOrOptions === "object") {
        if (deltaTimeOrOptions.deltaTime !== undefined) dt = deltaTimeOrOptions.deltaTime;
        if (deltaTimeOrOptions.maxSubSteps !== undefined) maxSubStepsOverride = deltaTimeOrOptions.maxSubSteps;
      }

      lastDeltaTime = dt;

      // If paused or completed or settled, do not advance coordinates
      if (lifecycle === "paused" || lifecycle === "completed" || settled) {
        return {
          position: clonePhysicsValue(position),
          velocity: clonePhysicsValue(velocity),
          acceleration: clonePhysicsValue(acceleration),
          netForce: clonePhysicsValue(netForce),
          settled,
          stepsTaken: 0,
          clamped: false,
          context: getContext(),
        };
      }

      if (lifecycle === "idle") {
        lifecycle = "running";
      }

      const effectiveDt = Math.max(0, dt) * config.timeScale;
      const maxSubSteps = maxSubStepsOverride ?? config.maxSubSteps;
      const timestep = config.timestep;

      accumulator += effectiveDt;
      let stepsTaken = 0;
      let clamped = false;

      while (accumulator >= timestep && stepsTaken < maxSubSteps) {
        const stepRes = integrateInertiaStep(
          position,
          velocity,
          config.mass,
          gravity,
          config.friction,
          config.linearFriction,
          config.drag,
          externalForce,
          config.terminalVelocity,
          timestep
        );

        position = stepRes.position;
        velocity = stepRes.velocity;
        acceleration = stepRes.acceleration;
        netForce = stepRes.netForce;

        // Apply spatial boundary clamps
        const bounded = applyPositionBounds(position, velocity, config.min, config.max);
        position = bounded.position;
        velocity = bounded.velocity;

        tick++;
        simulatedTime += timestep;
        accumulator -= timestep;
        stepsTaken++;

        // Check settling threshold after discrete fixed sub-step
        if (isInertiaSettled(velocity, gravity, externalForce, config.minVelocity)) {
          settled = true;
          velocity = typeof velocity === "number" ? 0 : { x: 0, y: velocity.y !== undefined ? 0 : undefined, z: velocity.z !== undefined ? 0 : undefined };
          acceleration = 0;
          netForce = 0;
          accumulator = 0;
          lifecycle = "completed";
          break;
        }
      }

      // Clamp accumulator if remaining above timestep
      if (stepsTaken >= maxSubSteps && accumulator >= timestep) {
        accumulator = 0;
        clamped = true;
      }

      alpha = timestep > 0 ? accumulator / timestep : 0;

      const currentState = getState();
      const currentContext = getContext();

      // Trigger update callbacks
      for (const listener of Array.from(updateListeners)) {
        try {
          listener(currentState, currentContext);
        } catch (err) {
          console.error("Inertia update listener error:", err);
        }
      }

      if (settled) {
        for (const listener of Array.from(settleListeners)) {
          try {
            listener(currentState, currentContext);
          } catch (err) {
            console.error("Inertia settle listener error:", err);
          }
        }
        for (const listener of Array.from(completeListeners)) {
          try {
            listener(currentState, currentContext);
          } catch (err) {
            console.error("Inertia complete listener error:", err);
          }
        }
      }

      return {
        position: clonePhysicsValue(position),
        velocity: clonePhysicsValue(velocity),
        acceleration: clonePhysicsValue(acceleration),
        netForce: clonePhysicsValue(netForce),
        settled,
        stepsTaken,
        clamped,
        context: currentContext,
      };
    },

    getState,
    getContext,

    getConfiguration(): Required<AdvancedInertiaConfig> {
      assertNotDisposed("getConfiguration");
      return { ...config };
    },

    setConfiguration(newConfig: Partial<AdvancedInertiaConfig>): void {
      assertNotDisposed("setConfiguration");
      const merged = { ...config, ...newConfig };
      assertValidInertiaConfig(merged);
      config = merged;
    },

    isSettled(): boolean {
      return settled;
    },

    isCompleted(): boolean {
      return lifecycle === "completed" || settled;
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

    onUpdate(listener: InertiaUpdateListener): () => void {
      assertNotDisposed("onUpdate");
      updateListeners.add(listener);
      return () => {
        updateListeners.delete(listener);
      };
    },

    onSettle(listener: InertiaSettleListener): () => void {
      assertNotDisposed("onSettle");
      settleListeners.add(listener);
      return () => {
        settleListeners.delete(listener);
      };
    },

    onComplete(listener: InertiaCompleteListener): () => void {
      assertNotDisposed("onComplete");
      completeListeners.add(listener);
      return () => {
        completeListeners.delete(listener);
      };
    },

    dispose(): void {
      if (lifecycle === "disposed") return;
      lifecycle = "disposed";
      updateListeners.clear();
      settleListeners.clear();
      completeListeners.clear();
    },
  };

  return controls;
}
