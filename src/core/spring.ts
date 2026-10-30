import { subscribeAnimationFrames } from "./animation.js";
import { onReducedMotionChange, prefersReducedMotion } from "./motion.js";

export interface SpringConfig {
  /** Spring stiffness. Must be finite and greater than zero. Defaults to 170. */
  stiffness?: number;
  /** Friction coefficient. Must be finite and non-negative. Defaults to 26. */
  damping?: number;
  /** Mass. Must be finite and greater than zero. Defaults to 1. */
  mass?: number;
  /** Initial velocity in position units per second. Defaults to 0. */
  initialVelocity?: number;
  /** Position error at which the spring may settle. Defaults to 0.01. */
  restDelta?: number;
  /** Absolute velocity below which the spring may settle. Defaults to 0.01. */
  restSpeed?: number;
}

export interface SpringUpdate {
  position: number;
  velocity: number;
}

export interface SpringOptions {
  /** Starting position. Defaults to 0. */
  from?: number;
  /** Target position. Defaults to 1. */
  to?: number;
  /** Spring constants and settling thresholds. */
  config?: SpringConfig;
  /** Called on each shared animation frame with position and velocity. */
  onUpdate: (state: SpringUpdate) => void;
  /** Called once when the spring settles or reduced motion completes it. */
  onComplete?: () => void;
  /** Defaults to true. */
  respectReducedMotion?: boolean;
}

export interface SpringControls {
  /** Stops the spring and suppresses subsequent update and completion callbacks. */
  cancel(): void;
}

const DEFAULTS: Required<SpringConfig> = {
  stiffness: 170,
  damping: 26,
  mass: 1,
  initialVelocity: 0,
  restDelta: 0.01,
  restSpeed: 0.01,
};

const MAX_FRAME_DELTA_SECONDS = 0.064;
const MAX_STEP_SECONDS = 1 / 120;

function validateFinite(name: string, value: number): void {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new RangeError(`${name} must be a finite number, received ${String(value)}`);
  }
}

function validateConfig(config: Required<SpringConfig>): void {
  validateFinite("stiffness", config.stiffness);
  if (config.stiffness <= 0) throw new RangeError("stiffness must be greater than zero");
  validateFinite("damping", config.damping);
  if (config.damping < 0) throw new RangeError("damping must be non-negative");
  validateFinite("mass", config.mass);
  if (config.mass <= 0) throw new RangeError("mass must be greater than zero");
  validateFinite("initialVelocity", config.initialVelocity);
  validateFinite("restDelta", config.restDelta);
  if (config.restDelta <= 0) throw new RangeError("restDelta must be greater than zero");
  validateFinite("restSpeed", config.restSpeed);
  if (config.restSpeed <= 0) throw new RangeError("restSpeed must be greater than zero");
}

/** Animates a scalar spring using the library's shared animation-frame scheduler. */
export function animateSpring(options: SpringOptions): SpringControls {
  if (options === null || typeof options !== "object" || Array.isArray(options)) {
    throw new TypeError("animateSpring() options must be an object");
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

  const from = options.from ?? 0;
  const to = options.to ?? 1;
  validateFinite("from", from);
  validateFinite("to", to);
  if (options.config !== undefined && (options.config === null || typeof options.config !== "object")) {
    throw new TypeError("config must be an object");
  }
  const config: Required<SpringConfig> = { ...DEFAULTS, ...options.config };
  validateConfig(config);

  const respectReducedMotion = options.respectReducedMotion ?? true;
  let position = from;
  let velocity = config.initialVelocity;
  let previousTime: number | null = null;
  let active = true;
  const reducedAtStart = respectReducedMotion && prefersReducedMotion();
  let reducedMotion = reducedAtStart;
  let unsubscribeFrames: (() => void) | null = null;
  let unsubscribePreference = (): void => undefined;

  const cleanup = (): void => {
    unsubscribeFrames?.();
    unsubscribeFrames = null;
    unsubscribePreference();
    unsubscribePreference = (): void => undefined;
  };

  const complete = (): void => {
    if (!active) return;
    position = to;
    velocity = 0;
    cleanup();
    try {
      options.onUpdate({ position, velocity });
    } catch (error) {
      active = false;
      throw error;
    }
    if (!active) return;
    active = false;
    options.onComplete?.();
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

  const tick = (time: number): void => {
    if (!active) return;
    if (reducedMotion) {
      complete();
      return;
    }
    if (!Number.isFinite(time)) return;

    if (previousTime === null) {
      previousTime = time;
      if (Math.abs(to - position) <= config.restDelta && Math.abs(velocity) <= config.restSpeed) {
        complete();
        return;
      }
      emit();
      return;
    }

    const elapsed = Math.min(Math.max((time - previousTime) / 1000, 0), MAX_FRAME_DELTA_SECONDS);
    previousTime = time;
    let remaining = elapsed;
    while (remaining > 0) {
      const step = Math.min(remaining, MAX_STEP_SECONDS);
      const acceleration = (config.stiffness * (to - position) - config.damping * velocity) / config.mass;
      velocity += acceleration * step;
      position += velocity * step;
      remaining -= step;
    }

    if (Math.abs(to - position) <= config.restDelta && Math.abs(velocity) <= config.restSpeed) {
      complete();
      return;
    }
    emit();
  };

  unsubscribePreference = respectReducedMotion
    ? onReducedMotionChange((reduced) => {
      if (!active) return;
      reducedMotion = reduced;
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
