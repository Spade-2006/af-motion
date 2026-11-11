/**
 * AF Motion — Foundational Physics Stepper & Numerical Integrators
 *
 * Implements deterministic fixed-timestep integration, variable-rate accumulator,
 * bounded catch-up processing, and numerical stability verification.
 */

import type {
  PhysicsConfiguration,
  PhysicsState,
  PhysicsSimulationContext,
  IntegratorType,
  PhysicsValue,
} from "./types.js";
import {
  addValues,
  subValues,
  scaleValue,
  applyPrecision,
  clonePhysicsValue,
  isPhysicsValue,
} from "./math.js";
import { PhysicsNumericalError } from "./validation.js";

/**
 * Asserts that a state contains only finite numerical values.
 */
function assertFiniteState(state: PhysicsState, tick: number): void {
  if (!isPhysicsValue(state.position)) {
    throw new PhysicsNumericalError(
      `Numerical instability at tick ${tick}: position became non-finite (${JSON.stringify(state.position)}).`
    );
  }
  if (!isPhysicsValue(state.velocity)) {
    throw new PhysicsNumericalError(
      `Numerical instability at tick ${tick}: velocity became non-finite (${JSON.stringify(state.velocity)}).`
    );
  }
  if (state.acceleration !== undefined && !isPhysicsValue(state.acceleration)) {
    throw new PhysicsNumericalError(
      `Numerical instability at tick ${tick}: acceleration became non-finite (${JSON.stringify(state.acceleration)}).`
    );
  }
}

/**
 * Performs a single discrete integration step for a given state over fixed delta time dt.
 */
export function integrateSingleStep(
  state: PhysicsState,
  dt: number,
  integrator: IntegratorType,
  precision: number
): PhysicsState {
  const accel: PhysicsValue = state.acceleration ?? 0;
  let nextPos: PhysicsValue;
  let nextVel: PhysicsValue;

  switch (integrator) {
    case "euler": {
      // Explicit Euler: pos += vel * dt; vel += accel * dt;
      nextPos = addValues(state.position, scaleValue(state.velocity, dt));
      nextVel = addValues(state.velocity, scaleValue(accel, dt));
      break;
    }

    case "semi-implicit-euler": {
      // Symplectic / Semi-implicit Euler: vel += accel * dt; pos += nextVel * dt;
      nextVel = addValues(state.velocity, scaleValue(accel, dt));
      nextPos = addValues(state.position, scaleValue(nextVel, dt));
      break;
    }

    case "verlet": {
      // Velocity Verlet: pos += vel * dt + 0.5 * accel * dt^2; vel += accel * dt;
      const halfDtSq = 0.5 * dt * dt;
      nextPos = addValues(
        addValues(state.position, scaleValue(state.velocity, dt)),
        scaleValue(accel, halfDtSq)
      );
      nextVel = addValues(state.velocity, scaleValue(accel, dt));
      break;
    }

    case "rk4": {
      // 4th-Order Runge-Kutta for constant acceleration across the interval
      // k1_v = a; k1_x = v
      // k2_v = a; k2_x = v + k1_v * (dt / 2)
      // k3_v = a; k3_x = v + k2_v * (dt / 2)
      // k4_v = a; k4_x = v + k3_v * dt
      const k1_v = accel;
      const k1_x = state.velocity;

      const k2_v = accel;
      const k2_x = addValues(state.velocity, scaleValue(k1_v, 0.5 * dt));

      const k3_v = accel;
      const k3_x = addValues(state.velocity, scaleValue(k2_v, 0.5 * dt));

      const k4_v = accel;
      const k4_x = addValues(state.velocity, scaleValue(k3_v, dt));

      // dx = (dt / 6) * (k1_x + 2*k2_x + 2*k3_x + k4_x)
      const sumX = addValues(
        addValues(k1_x, scaleValue(k2_x, 2)),
        addValues(scaleValue(k3_x, 2), k4_x)
      );
      nextPos = addValues(state.position, scaleValue(sumX, dt / 6));

      // dv = (dt / 6) * (k1_v + 2*k2_v + 2*k3_v + k4_v)
      const sumV = addValues(
        addValues(k1_v, scaleValue(k2_v, 2)),
        addValues(scaleValue(k3_v, 2), k4_v)
      );
      nextVel = addValues(state.velocity, scaleValue(sumV, dt / 6));
      break;
    }
  }

  // Apply precision thresholds to snap micro-drifts to zero
  nextPos = applyPrecision(nextPos, precision);
  nextVel = applyPrecision(nextVel, precision);

  return {
    position: nextPos,
    velocity: nextVel,
    acceleration: state.acceleration !== undefined ? clonePhysicsValue(state.acceleration) : undefined,
    mass: state.mass,
  };
}

/**
 * Output of a deterministic multi-step simulation advance.
 */
export interface StepAdvanceResult {
  readonly state: PhysicsState;
  readonly context: PhysicsSimulationContext;
  readonly stepsTaken: number;
  readonly clamped: boolean;
}

/**
 * Advances a simulation deterministically over elapsed deltaTime seconds using an accumulator.
 */
export function stepSimulation(
  currentState: PhysicsState,
  currentContext: PhysicsSimulationContext,
  config: Required<PhysicsConfiguration>,
  deltaTime: number,
  maxSubStepsOverride?: number
): StepAdvanceResult {
  // If timeScale is 0 or elapsed time is <= 0, no progression occurs
  const effectiveDt = Math.max(0, deltaTime) * config.timeScale;
  const maxSubSteps = maxSubStepsOverride ?? config.maxSubSteps;
  const timestep = config.timestep;

  let accumulator = currentContext.accumulator + effectiveDt;
  let simulatedTime = currentContext.time;
  let tick = currentContext.tick;
  let state: PhysicsState = {
    position: clonePhysicsValue(currentState.position),
    velocity: clonePhysicsValue(currentState.velocity),
    acceleration: currentState.acceleration !== undefined ? clonePhysicsValue(currentState.acceleration) : undefined,
    mass: currentState.mass,
  };

  let stepsTaken = 0;
  let clamped = false;

  // Execute discrete fixed sub-steps
  while (accumulator >= timestep && stepsTaken < maxSubSteps) {
    state = integrateSingleStep(state, timestep, config.integrator, config.precision);
    tick++;
    simulatedTime += timestep;
    accumulator -= timestep;
    stepsTaken++;

    // Safety check after every discrete step
    assertFiniteState(state, tick);
  }

  // Bounded catch-up: if still above timestep after maxSubSteps, clamp accumulator
  // to avoid death-spiral frame drop accumulation.
  if (stepsTaken >= maxSubSteps && accumulator >= timestep) {
    accumulator = 0;
    clamped = true;
  }

  // Calculate interpolation factor alpha between previous and next fixed step
  const alpha = timestep > 0 ? accumulator / timestep : 0;

  const nextContext: PhysicsSimulationContext = {
    time: simulatedTime,
    tick,
    lastDeltaTime: deltaTime,
    accumulator,
    alpha,
    lifecycleState: currentContext.lifecycleState,
  };

  return {
    state,
    context: nextContext,
    stepsTaken,
    clamped,
  };
}
