import { applyMotionDNA } from "./motion-dna.js";
import type { MotionDNA, MotionDNAOverrides } from "./motion-dna.js";

export type EffectCompositionInstance =
  | { destroy(): void; pause?(): void; resume?(): void }
  | { cancel(): void; pause?(): void; resume?(): void };

export interface EffectCompositionEntry {
  /** Starts an effect and returns its native cleanup controls. */
  start: () => EffectCompositionInstance;
  /** Effects without this field receive no Motion DNA options. */
  motionDNA?: never;
}

export interface MotionDNACompositionEntry {
  /** Starts an effect with resolved animation options from the named Motion DNA. */
  start: (options: MotionDNA) => EffectCompositionInstance;
  motionDNA: {
    name: string;
    overrides?: MotionDNAOverrides;
  };
}

export type ComposableEffect = EffectCompositionEntry | MotionDNACompositionEntry;

export interface EffectCompositionControls {
  /** Cleans up every effect in reverse start order. Safe to call repeatedly. */
  destroy(): void;
  /** Alias for destroy(). */
  cancel(): void;
  /** Pauses effects that expose a pause control; other effects continue unchanged. */
  pause(): void;
  /** Resumes effects that expose a resume control. */
  resume(): void;
}

function isCompositionInstance(value: unknown): value is EffectCompositionInstance {
  if (value === null || typeof value !== "object") return false;
  const instance = value as { destroy?: unknown; cancel?: unknown };
  return typeof instance.destroy === "function" || typeof instance.cancel === "function";
}

function dispose(instance: EffectCompositionInstance): void {
  if ("destroy" in instance) {
    instance.destroy();
  } else {
    instance.cancel();
  }
}

/** Starts an ordered set of compatible effects and owns their shared cleanup. */
export function composeEffects(entries: readonly ComposableEffect[]): EffectCompositionControls {
  if (!Array.isArray(entries)) {
    throw new TypeError("Effect composition entries must be an array");
  }

  const started: EffectCompositionInstance[] = [];
  let destroyed = false;
  let paused = false;

  const control = (method: "pause" | "resume"): void => {
    if (destroyed || (method === "pause" ? paused : !paused)) return;
    paused = method === "pause";
    const errors: unknown[] = [];
    for (const instance of started) {
      try {
        instance[method]?.();
      } catch (error) {
        errors.push(error);
      }
    }
    if (errors.length > 0) {
      throw new AggregateError(errors, `One or more composed effects failed to ${method}`);
    }
  };

  const destroy = (): void => {
    if (destroyed) return;
    destroyed = true;
    const errors: unknown[] = [];
    for (const instance of started.reverse()) {
      try {
        dispose(instance);
      } catch (error) {
        errors.push(error);
      }
    }
    started.length = 0;
    if (errors.length > 0) {
      throw new AggregateError(errors, "One or more composed effects failed to clean up");
    }
  };

  try {
    for (const [index, entry] of entries.entries()) {
      if (entry === null || typeof entry !== "object" || typeof entry.start !== "function") {
        throw new TypeError(`Effect composition entry ${index} must provide a start function`);
      }
      const instance = "motionDNA" in entry && entry.motionDNA !== undefined
        ? entry.start(applyMotionDNA(entry.motionDNA.name, entry.motionDNA.overrides))
        : entry.start();
      if (!isCompositionInstance(instance)) {
        throw new TypeError(`Effect composition entry ${index} must return destroy() or cancel() controls`);
      }
      started.push(instance);
    }
  } catch (error) {
    try {
      destroy();
    } catch (cleanupError) {
      throw new AggregateError([error, cleanupError], "Effect composition failed to start and clean up");
    }
    throw error;
  }

  return {
    destroy,
    cancel: destroy,
    pause: () => control("pause"),
    resume: () => control("resume"),
  };
}
