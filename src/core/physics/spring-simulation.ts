/**
 * AF Motion — Advanced Spring Physics Simulation Engine
 *
 * Implements independent, headless mass-spring-damper simulations with
 * dynamic retargeting, velocity injection, damping regimes, and settling detection.
 */

import type {
  AdvancedSpringOptions,
  AdvancedSpringControls,
  AdvancedSpringConfig,
  SpringState,
  SpringStepResult,
  SpringRetargetOptions,
  SpringUpdateListener,
  SpringSettleListener,
  SpringCompleteListener,
  SpringRetargetListener,
} from "./spring-types.js";
import type {
  PhysicsValue,
  PhysicsSimulationContext,
  PhysicsLifecycleState,
  PhysicsStepOptions,
} from "./types.js";
import {
  clonePhysicsValue,
  subValues,
  scaleValue,
  valueMagnitude,
  isPhysicsValue,
} from "./math.js";
import {
  calculateDampingRatio,
  calculateNaturalFrequency,
  classifyDampingBehavior,
  calculateSpringAcceleration,
  isSpringSettled,
  integrateSpringEuler,
  integrateSpringRK4,
} from "./spring-math.js";
import { resolveSpringConfig } from "./spring-presets.js";
import { assertValidSpringConfig } from "./spring-validation.js";
import { PhysicsLifecycleError, PhysicsNumericalError } from "./validation.js";

/**
 * Creates an independent, headless spring simulation instance.
 */
export function createSpringSimulation(
  options: AdvancedSpringOptions = {}
): AdvancedSpringControls {
  // 1. Resolve and validate configuration
  const resolvedConfig = resolveSpringConfig(options.config);
  if (options.from !== undefined) resolvedConfig.from = clonePhysicsValue(options.from);
  if (options.target !== undefined) resolvedConfig.target = clonePhysicsValue(options.target);
  if (options.initialVelocity !== undefined) resolvedConfig.initialVelocity = clonePhysicsValue(options.initialVelocity);

  assertValidSpringConfig(resolvedConfig);

  // Active configuration
  let config: Required<AdvancedSpringConfig> = { ...resolvedConfig };

  // Baseline state for reset()
  let baselineFrom = clonePhysicsValue(config.from);
  let baselineTarget = clonePhysicsValue(config.target);
  let baselineVelocity = clonePhysicsValue(config.initialVelocity);

  // Active coordinates
  let position: PhysicsValue = clonePhysicsValue(baselineFrom);
  let velocity: PhysicsValue = clonePhysicsValue(baselineVelocity);
  let target: PhysicsValue = clonePhysicsValue(baselineTarget);
  let acceleration: PhysicsValue = calculateSpringAcceleration(
    position,
    velocity,
    target,
    config.stiffness,
    config.damping,
    config.mass
  );

  // Settled state
  let settled = isSpringSettled(position, velocity, target, config.restDelta, config.restSpeed);
  if (settled) {
    position = clonePhysicsValue(target);
    velocity = typeof velocity === "number" ? 0 : { x: 0, y: velocity.y !== undefined ? 0 : undefined, z: velocity.z !== undefined ? 0 : undefined };
    acceleration = typeof acceleration === "number" ? 0 : { x: 0, y: acceleration.y !== undefined ? 0 : undefined, z: acceleration.z !== undefined ? 0 : undefined };
  }

  // Lifecycle state
  let lifecycle: PhysicsLifecycleState = config.autoStart ? "running" : "idle";

  // Context tracking
  let simulatedTime = 0;
  let tick = 0;
  let accumulator = 0;
  let alpha = 0;
  let lastDeltaTime = 0;

  // Event listener sets
  const updateListeners = new Set<SpringUpdateListener>();
  const settleListeners = new Set<SpringSettleListener>();
  const completeListeners = new Set<SpringCompleteListener>();
  const retargetListeners = new Set<SpringRetargetListener>();

  // Attach options listeners
  if (options.onUpdate) updateListeners.add(options.onUpdate);
  if (options.onSettle) settleListeners.add(options.onSettle);
  if (options.onComplete) completeListeners.add(options.onComplete);
  if (options.onRetarget) retargetListeners.add(options.onRetarget);

  function assertNotDisposed(action: string): void {
    if (lifecycle === "disposed") {
      throw new PhysicsLifecycleError(`Cannot perform '${action}' on a disposed spring simulation.`);
    }
  }

  function getDampingRatio(): number {
    return calculateDampingRatio(config.stiffness, config.damping, config.mass);
  }

  function getNaturalFrequency(): number {
    return calculateNaturalFrequency(config.stiffness, config.mass);
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

  function getState(): SpringState {
    assertNotDisposed("getState");
    const ratio = getDampingRatio();
    return {
      position: clonePhysicsValue(position),
      velocity: clonePhysicsValue(velocity),
      acceleration: clonePhysicsValue(acceleration),
      target: clonePhysicsValue(target),
      settled,
      dampingBehavior: classifyDampingBehavior(ratio),
      dampingRatio: ratio,
      naturalFrequency: getNaturalFrequency(),
    };
  }

  const controls: AdvancedSpringControls = {
    start(): void {
      assertNotDisposed("start");
      if (lifecycle === "running") return;
      if (settled) {
        // If already settled, reset settled flag only if position differs from target
        if (!isSpringSettled(position, velocity, target, config.restDelta, config.restSpeed)) {
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

    reset(newInitialState?: Partial<AdvancedSpringConfig>): void {
      assertNotDisposed("reset");

      if (newInitialState) {
        if (newInitialState.from !== undefined) baselineFrom = clonePhysicsValue(newInitialState.from);
        if (newInitialState.target !== undefined) baselineTarget = clonePhysicsValue(newInitialState.target);
        if (newInitialState.initialVelocity !== undefined) baselineVelocity = clonePhysicsValue(newInitialState.initialVelocity);
        if (newInitialState.stiffness !== undefined) config.stiffness = newInitialState.stiffness;
        if (newInitialState.damping !== undefined) config.damping = newInitialState.damping;
        if (newInitialState.mass !== undefined) config.mass = newInitialState.mass;
        assertValidSpringConfig(config);
      }

      position = clonePhysicsValue(baselineFrom);
      velocity = clonePhysicsValue(baselineVelocity);
      target = clonePhysicsValue(baselineTarget);
      acceleration = calculateSpringAcceleration(position, velocity, target, config.stiffness, config.damping, config.mass);

      settled = isSpringSettled(position, velocity, target, config.restDelta, config.restSpeed);
      simulatedTime = 0;
      tick = 0;
      accumulator = 0;
      alpha = 0;
      lastDeltaTime = 0;
      lifecycle = config.autoStart ? "running" : "idle";
    },

    setTarget(newTarget: PhysicsValue, immediate = false): void {
      this.retarget(newTarget, { preserveVelocity: !immediate, immediate });
    },

    retarget(newTarget: PhysicsValue, retargetOpts?: SpringRetargetOptions): void {
      assertNotDisposed("retarget");
      if (!isPhysicsValue(newTarget)) {
        throw new PhysicsNumericalError(`Invalid spring target value: ${JSON.stringify(newTarget)}`);
      }

      const prevTarget = clonePhysicsValue(target);
      target = clonePhysicsValue(newTarget);

      const immediate = retargetOpts?.immediate === true;
      const preserveVel = retargetOpts?.preserveVelocity !== false;

      if (immediate) {
        position = clonePhysicsValue(target);
        velocity = typeof velocity === "number" ? 0 : { x: 0, y: velocity.y !== undefined ? 0 : undefined, z: velocity.z !== undefined ? 0 : undefined };
        acceleration = typeof acceleration === "number" ? 0 : { x: 0, y: acceleration.y !== undefined ? 0 : undefined, z: acceleration.z !== undefined ? 0 : undefined };
        settled = true;
      } else {
        if (!preserveVel) {
          velocity = typeof velocity === "number" ? 0 : { x: 0, y: velocity.y !== undefined ? 0 : undefined, z: velocity.z !== undefined ? 0 : undefined };
        }
        // Retargeting wakes the spring back up smoothly without position teleportation!
        settled = false;
        acceleration = calculateSpringAcceleration(position, velocity, target, config.stiffness, config.damping, config.mass);
        if (lifecycle === "completed" || lifecycle === "idle") {
          lifecycle = "running";
        }
      }

      for (const listener of Array.from(retargetListeners)) {
        try {
          listener(target, prevTarget);
        } catch (err) {
          console.error("Spring retarget listener error:", err);
        }
      }
    },

    setVelocity(newVel: PhysicsValue): void {
      assertNotDisposed("setVelocity");
      if (!isPhysicsValue(newVel)) {
        throw new PhysicsNumericalError(`Invalid velocity value: ${JSON.stringify(newVel)}`);
      }
      velocity = clonePhysicsValue(newVel);
      settled = false;
      acceleration = calculateSpringAcceleration(position, velocity, target, config.stiffness, config.damping, config.mass);
      if (lifecycle === "completed" || lifecycle === "idle") {
        lifecycle = "running";
      }
    },

    injectVelocity(deltaVel: PhysicsValue): void {
      assertNotDisposed("injectVelocity");
      if (!isPhysicsValue(deltaVel)) {
        throw new PhysicsNumericalError(`Invalid delta velocity value: ${JSON.stringify(deltaVel)}`);
      }
      // Add impulse to current velocity
      if (typeof velocity === "number" && typeof deltaVel === "number") {
        velocity += deltaVel;
      } else {
        const vVec = typeof velocity === "number" ? { x: velocity } : velocity;
        const dVec = typeof deltaVel === "number" ? { x: deltaVel } : deltaVel;
        velocity = {
          x: vVec.x + dVec.x,
          y: vVec.y !== undefined || dVec.y !== undefined ? (vVec.y ?? 0) + (dVec.y ?? 0) : undefined,
          z: vVec.z !== undefined || dVec.z !== undefined ? (vVec.z ?? 0) + (dVec.z ?? 0) : undefined,
        };
      }
      settled = false;
      acceleration = calculateSpringAcceleration(position, velocity, target, config.stiffness, config.damping, config.mass);
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
      settled = isSpringSettled(position, velocity, target, config.restDelta, config.restSpeed);
      acceleration = calculateSpringAcceleration(position, velocity, target, config.stiffness, config.damping, config.mass);
    },

    reverseVelocity(): void {
      assertNotDisposed("reverseVelocity");
      velocity = scaleValue(velocity, -1);
      settled = false;
      acceleration = calculateSpringAcceleration(position, velocity, target, config.stiffness, config.damping, config.mass);
    },

    setTimeScale(scale: number): void {
      assertNotDisposed("setTimeScale");
      if (typeof scale !== "number" || !Number.isFinite(scale) || scale < 0) {
        throw new PhysicsNumericalError(`timeScale must be a non-negative finite number, received ${scale}`);
      }
      config.timeScale = scale;
    },

    step(deltaTimeOrOptions?: number | PhysicsStepOptions): SpringStepResult {
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

      // If paused or completed or settled, do not advance physical coordinates
      if (lifecycle === "paused" || lifecycle === "completed" || settled) {
        return {
          position: clonePhysicsValue(position),
          velocity: clonePhysicsValue(velocity),
          acceleration: clonePhysicsValue(acceleration),
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
        // Integrate discrete fixed sub-step
        if (config.integrator === "rk4") {
          const stepRes = integrateSpringRK4(
            position,
            velocity,
            target,
            config.stiffness,
            config.damping,
            config.mass,
            timestep
          );
          position = stepRes.position;
          velocity = stepRes.velocity;
          acceleration = stepRes.acceleration;
        } else {
          // Default semi-implicit Euler
          const stepRes = integrateSpringEuler(
            position,
            velocity,
            target,
            config.stiffness,
            config.damping,
            config.mass,
            timestep
          );
          position = stepRes.position;
          velocity = stepRes.velocity;
          acceleration = stepRes.acceleration;
        }

        tick++;
        simulatedTime += timestep;
        accumulator -= timestep;
        stepsTaken++;

        // Check settling threshold after each discrete fixed sub-step
        if (isSpringSettled(position, velocity, target, config.restDelta, config.restSpeed)) {
          settled = true;
          position = clonePhysicsValue(target);
          velocity = typeof velocity === "number" ? 0 : { x: 0, y: velocity.y !== undefined ? 0 : undefined, z: velocity.z !== undefined ? 0 : undefined };
          acceleration = typeof acceleration === "number" ? 0 : { x: 0, y: acceleration.y !== undefined ? 0 : undefined, z: acceleration.z !== undefined ? 0 : undefined };
          accumulator = 0;
          lifecycle = "completed";
          break;
        }

        // Check maxDuration timeout if configured
        if (config.maxDuration && config.maxDuration > 0 && simulatedTime >= config.maxDuration) {
          settled = true;
          position = clonePhysicsValue(target);
          velocity = typeof velocity === "number" ? 0 : { x: 0, y: velocity.y !== undefined ? 0 : undefined, z: velocity.z !== undefined ? 0 : undefined };
          acceleration = typeof acceleration === "number" ? 0 : { x: 0, y: acceleration.y !== undefined ? 0 : undefined, z: acceleration.z !== undefined ? 0 : undefined };
          accumulator = 0;
          lifecycle = "completed";
          break;
        }
      }

      // Clamp accumulator if remaining above timestep to prevent spiral of death
      if (stepsTaken >= maxSubSteps && accumulator >= timestep) {
        accumulator = 0;
        clamped = true;
      }

      alpha = timestep > 0 ? accumulator / timestep : 0;

      const currentState = getState();
      const currentContext = getContext();

      // Trigger callbacks
      for (const listener of Array.from(updateListeners)) {
        try {
          listener(currentState, currentContext);
        } catch (err) {
          console.error("Spring update listener error:", err);
        }
      }

      if (settled) {
        for (const listener of Array.from(settleListeners)) {
          try {
            listener(currentState, currentContext);
          } catch (err) {
            console.error("Spring settle listener error:", err);
          }
        }
        for (const listener of Array.from(completeListeners)) {
          try {
            listener(currentState, currentContext);
          } catch (err) {
            console.error("Spring complete listener error:", err);
          }
        }
      }

      return {
        position: clonePhysicsValue(position),
        velocity: clonePhysicsValue(velocity),
        acceleration: clonePhysicsValue(acceleration),
        settled,
        stepsTaken,
        clamped,
        context: currentContext,
      };
    },

    getState,

    getContext(): PhysicsSimulationContext {
      assertNotDisposed("getContext");
      return getContext();
    },

    getConfiguration(): Required<AdvancedSpringConfig> {
      assertNotDisposed("getConfiguration");
      return { ...config };
    },

    setConfiguration(newConfig: Partial<AdvancedSpringConfig>): void {
      assertNotDisposed("setConfiguration");
      const merged = { ...config, ...newConfig };
      assertValidSpringConfig(merged);
      config = merged;
      // Recalculate acceleration with updated constants
      acceleration = calculateSpringAcceleration(position, velocity, target, config.stiffness, config.damping, config.mass);
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

    onUpdate(listener: SpringUpdateListener): () => void {
      assertNotDisposed("onUpdate");
      updateListeners.add(listener);
      return () => {
        updateListeners.delete(listener);
      };
    },

    onSettle(listener: SpringSettleListener): () => void {
      assertNotDisposed("onSettle");
      settleListeners.add(listener);
      return () => {
        settleListeners.delete(listener);
      };
    },

    onComplete(listener: SpringCompleteListener): () => void {
      assertNotDisposed("onComplete");
      completeListeners.add(listener);
      return () => {
        completeListeners.delete(listener);
      };
    },

    onRetarget(listener: SpringRetargetListener): () => void {
      assertNotDisposed("onRetarget");
      retargetListeners.add(listener);
      return () => {
        retargetListeners.delete(listener);
      };
    },

    dispose(): void {
      if (lifecycle === "disposed") return;
      lifecycle = "disposed";
      updateListeners.clear();
      settleListeners.clear();
      completeListeners.clear();
      retargetListeners.clear();
    },
  };

  return controls;
}
