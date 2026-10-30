import { subscribeAnimationFrames } from "./animation.js";
import { onReducedMotionChange, prefersReducedMotion } from "./motion.js";

export interface InertiaOptions {
  /** Starting position. Defaults to 0. */
  from?: number;
  /** Initial velocity in position units per second. Defaults to 1000. */
  initialVelocity?: number;
  /** Exponential velocity decay per second. Must be finite and > 0. Defaults to 8. */
  friction?: number;
  /** Minimum speed in position units per second at which motion settles. Defaults to 10. */
  minVelocity?: number;
  /** Optional lower position bound. */
  min?: number;
  /** Optional upper position bound. */
  max?: number;
  /** Called on each shared animation frame with position and velocity. */
  onUpdate: (state: InertiaUpdate) => void;
  /** Called once when velocity settles, a bound is reached, or reduced motion completes. */
  onComplete?: () => void;
  /** Defaults to true. */
  respectReducedMotion?: boolean;
}

export interface InertiaUpdate {
  position: number;
  velocity: number;
}

export interface InertiaControls {
  /** Stops the inertia motion and suppresses subsequent update and completion callbacks. */
  cancel(): void;
}

const DEFAULT_INITIAL_VELOCITY = 1000;
const DEFAULT_FRICTION = 8;
const DEFAULT_MIN_VELOCITY = 10;
const MAX_FRAME_DELTA_SECONDS = 0.064;

function validateFinite(name: string, value: number): void {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new RangeError(`${name} must be a finite number, received ${String(value)}`);
  }
}

/** Animates position using exponentially decaying velocity on the shared frame scheduler. */
export function animateInertia(options: InertiaOptions): InertiaControls {
  if (options === null || typeof options !== "object" || Array.isArray(options)) {
    throw new TypeError("animateInertia() options must be an object");
  }
  if (typeof options.onUpdate !== "function") {
    throw new TypeError("onUpdate must be a function");
  }
  if (options.onComplete !== undefined && typeof options.onComplete !== "function") {
    throw new TypeError("onComplete must be a function");
  }
  if (options.respectReducedMotion !== undefined && typeof options.respectReducedMotion !== "boolean") {
    throw new TypeError("respectReducedMotion must be a boolean");
  }

  let position = options.from ?? 0;
  let velocity = options.initialVelocity ?? DEFAULT_INITIAL_VELOCITY;
  const friction = options.friction ?? DEFAULT_FRICTION;
  const minVelocity = options.minVelocity ?? DEFAULT_MIN_VELOCITY;
  const min = options.min;
  const max = options.max;
  validateFinite("from", position);
  validateFinite("initialVelocity", velocity);
  validateFinite("friction", friction);
  if (friction <= 0) throw new RangeError("friction must be greater than zero");
  validateFinite("minVelocity", minVelocity);
  if (minVelocity < 0) throw new RangeError("minVelocity must be non-negative");
  if (min !== undefined) validateFinite("min", min);
  if (max !== undefined) validateFinite("max", max);
  if (min !== undefined && max !== undefined && min > max) {
    throw new RangeError("min must be less than or equal to max");
  }

  if (min !== undefined) position = Math.max(min, position);
  if (max !== undefined) position = Math.min(max, position);

  const respectReducedMotion = options.respectReducedMotion ?? true;
  let reducedMotion = respectReducedMotion && prefersReducedMotion();
  let active = true;
  let previousTime: number | null = null;
  let unsubscribeFrames: (() => void) | null = null;
  let unsubscribePreference = (): void => undefined;

  const cleanup = (): void => {
    unsubscribeFrames?.();
    unsubscribeFrames = null;
    unsubscribePreference();
    unsubscribePreference = (): void => undefined;
  };

  const emit = (): void => {
    try {
      options.onUpdate({ position, velocity });
    } catch (error) {
      active = false;
      cleanup();
      throw error;
    }
  };

  const complete = (snapToRest = false): void => {
    if (!active) return;
    if (snapToRest) velocity = 0;
    cleanup();
    emit();
    if (!active) return;
    active = false;
    options.onComplete?.();
  };

  const tick = (time: number): void => {
    if (!active || !Number.isFinite(time)) return;
    if (reducedMotion) {
      complete(true);
      return;
    }
    if (previousTime === null) {
      previousTime = time;
      if (Math.abs(velocity) <= minVelocity) {
        complete(true);
      } else {
        emit();
      }
      return;
    }

    const elapsed = Math.min(Math.max((time - previousTime) / 1000, 0), MAX_FRAME_DELTA_SECONDS);
    previousTime = time;
    const decay = Math.exp(-friction * elapsed);
    const displacement = velocity * (1 - decay) / friction;
    const nextPosition = position + displacement;
    if (!Number.isFinite(nextPosition) || !Number.isFinite(decay * velocity)) {
      // Numeric overflow: settle at the last finite position instead of emitting Infinity/NaN.
      complete(true);
      return;
    }
    const hitLowerBound = min !== undefined && nextPosition <= min && velocity < 0;
    const hitUpperBound = max !== undefined && nextPosition >= max && velocity > 0;

    if (hitLowerBound || hitUpperBound) {
      const bound = hitLowerBound ? min : max;
      if (bound === undefined) return;
      position = bound;
      velocity = 0;
      complete();
      return;
    }

    position = nextPosition;
    velocity *= decay;
    if (Math.abs(velocity) <= minVelocity) {
      complete(true);
      return;
    }
    emit();
  };

  unsubscribePreference = respectReducedMotion
    ? onReducedMotionChange((reduced) => {
      if (active) reducedMotion = reduced;
    })
    : (): void => undefined;
  unsubscribeFrames = subscribeAnimationFrames(tick);

  return {
    cancel: () => {
      if (!active) return;
      active = false;
      cleanup();
    },
  };
}
