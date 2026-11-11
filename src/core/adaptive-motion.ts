import { applyMotionDNA } from "./motion-dna.js";
import type { MotionDNA, MotionDNAOverrides } from "./motion-dna.js";
import { resolveEasing, type EasingOption } from "../easing/easings.js";
import { onReducedMotionChange, prefersReducedMotion } from "./motion.js";
import type { DOMAnimationOptions } from "./animate.js";

export const ADAPTIVE_MOTION_SCHEMA_VERSION = "1.0.0";

export type AdaptiveReducedMotion = "respect" | "ignore";

export interface AdaptiveMotionProfile extends MotionDNAOverrides {
  /** Optional Motion DNA identity used as the timing/easing baseline. */
  motionDNA?: string;
  /** Motion intensity from above zero to 1; lower values lengthen animation duration. Defaults to 1. */
  intensity?: number;
  /** Intensity used when `conditions.lowPower` is true. Defaults to `intensity`. */
  lowPowerIntensity?: number;
  /** How an explicitly reduced-motion condition affects compatible animation options. Defaults to "respect". */
  reducedMotion?: AdaptiveReducedMotion;
}

export interface AdaptiveMotionConditions {
  /** Explicit reduced-motion condition supplied by the caller. */
  reducedMotion?: boolean;
  /** Explicit low-power condition supplied by the caller. */
  lowPower?: boolean;
  /** Per-resolution intensity override. Takes precedence over profile intensity values. */
  intensity?: number;
}

export type AdaptiveMotionOverrides = MotionDNAOverrides;

export interface RuntimeContext {
  readonly reducedMotion: boolean;
  readonly lowPower: boolean;
  readonly saveData: boolean;
  readonly hardwareConcurrency: number;
  readonly viewportWidth: number;
  readonly viewportHeight: number;
  readonly isMobile: boolean;
  readonly reducedTransparency: boolean;
}

export interface AdaptiveMotionConfig {
  readonly enabled?: boolean;
  readonly intensity?: number;
  readonly lowPowerIntensity?: number;
  readonly mobileIntensity?: number;
  readonly reducedMotion?: AdaptiveReducedMotion;
  readonly autoDetect?: boolean;
  readonly conditions?: AdaptiveMotionConditions;
}

export interface AdaptiveMotionState {
  readonly enabled: boolean;
  readonly context: RuntimeContext;
  readonly config: AdaptiveMotionConfig;
  readonly effectiveIntensity: number;
  readonly isReducedMotion: boolean;
}

function validateProfileIntensity(name: string, value: number): void {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0 || value > 1) {
    throw new RangeError(`${name} must be a finite number > 0 and <= 1, received ${String(value)}`);
  }
}

function validateMotionOptions(options: MotionDNAOverrides): void {
  for (const [name, value] of Object.entries(options)) {
    if (!["duration", "delay", "playbackRate", "respectReducedMotion", "easing"].includes(name)) {
      throw new TypeError(`Unknown animation option "${name}"`);
    }
    if (name === "duration" || name === "delay") {
      if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
        throw new RangeError(`${name} must be a finite number >= 0, received ${String(value)}`);
      }
    } else if (name === "playbackRate") {
      if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
        throw new RangeError(`playbackRate must be a finite number > 0, received ${String(value)}`);
      }
    } else if (name === "respectReducedMotion") {
      if (typeof value !== "boolean") throw new TypeError("respectReducedMotion must be a boolean");
    } else if (name === "easing") {
      if (typeof value !== "string" && typeof value !== "function") {
        throw new TypeError("easing must be a function or a registered easing name");
      }
      resolveEasing(value as EasingOption);
    }
  }
}

function validateProfile(profile: AdaptiveMotionProfile): void {
  if (profile === null || typeof profile !== "object" || Array.isArray(profile)) {
    throw new TypeError("Adaptive motion profile must be an object");
  }
  if (profile.intensity !== undefined) validateProfileIntensity("intensity", profile.intensity);
  if (profile.lowPowerIntensity !== undefined) {
    validateProfileIntensity("lowPowerIntensity", profile.lowPowerIntensity);
  }
  if (
    profile.reducedMotion !== undefined &&
    profile.reducedMotion !== "respect" &&
    profile.reducedMotion !== "ignore"
  ) {
    throw new TypeError('reducedMotion must be "respect" or "ignore"');
  }
  const { motionDNA: _motionDNA, intensity: _intensity, lowPowerIntensity: _lowPowerIntensity,
    reducedMotion: _reducedMotion, ...motionOptions } = profile;
  validateMotionOptions(motionOptions);
  if (profile.motionDNA !== undefined) applyMotionDNA(profile.motionDNA, motionOptions);
}

function validateConditions(conditions: AdaptiveMotionConditions): void {
  if (conditions === null || typeof conditions !== "object" || Array.isArray(conditions)) {
    throw new TypeError("Adaptive motion conditions must be an object");
  }
  for (const name of ["reducedMotion", "lowPower"] as const) {
    if (conditions[name] !== undefined && typeof conditions[name] !== "boolean") {
      throw new TypeError(`${name} condition must be a boolean`);
    }
  }
  if (conditions.intensity !== undefined) validateProfileIntensity("condition intensity", conditions.intensity);
}

/**
 * Resolves a deterministic animation-option snapshot from a profile and caller-supplied conditions.
 * The returned options are suitable for existing animation APIs; no media queries or monitoring are created.
 */
export function resolveAdaptiveMotion(
  profile: AdaptiveMotionProfile,
  conditions: AdaptiveMotionConditions = {},
  overrides: AdaptiveMotionOverrides = {},
): MotionDNA {
  validateProfile(profile);
  validateConditions(conditions);
  if (overrides === null || typeof overrides !== "object" || Array.isArray(overrides)) {
    throw new TypeError("Adaptive motion overrides must be an object");
  }
  validateMotionOptions(overrides);

  const { motionDNA, intensity, lowPowerIntensity, reducedMotion, ...profileOptions } = profile;
  const baseline: MotionDNA = motionDNA
    ? applyMotionDNA(motionDNA, profileOptions)
    : profileOptions;
  const effectiveIntensity = conditions.intensity ??
    (conditions.lowPower ? lowPowerIntensity ?? intensity : intensity) ??
    1;
  const resolved: MotionDNA = {
    ...baseline,
    ...(effectiveIntensity === 1 && baseline.duration === undefined
      ? {}
      : { duration: (baseline.duration ?? 1000) / effectiveIntensity }),
    ...(conditions.reducedMotion !== true
      ? {}
      : { respectReducedMotion: (reducedMotion ?? "respect") === "respect" }),
  };
  return { ...resolved, ...overrides };
}

// --- Unified Adaptive Motion Intelligence Layer ---

const DEFAULT_CONFIG: AdaptiveMotionConfig = {
  enabled: true,
  intensity: 1.0,
  lowPowerIntensity: 0.6,
  mobileIntensity: 1.0,
  reducedMotion: "respect",
  autoDetect: true,
};

let activeConfig: AdaptiveMotionConfig = { ...DEFAULT_CONFIG };

const subscribers = new Set<(state: AdaptiveMotionState) => void>();
let unsubscribeReducedMotion: (() => void) | null = null;
let boundResizeListener: (() => void) | null = null;

function notifySubscribers(): void {
  if (subscribers.size === 0) return;
  const state = inspectAdaptiveMotion();
  for (const subscriber of subscribers) {
    try {
      subscriber(state);
    } catch {
      // Ignore subscriber errors to preserve other subscribers
    }
  }
}

function ensureListeners(): void {
  if (subscribers.size === 0) return;
  if (!unsubscribeReducedMotion) {
    unsubscribeReducedMotion = onReducedMotionChange(() => {
      notifySubscribers();
    });
  }
  if (!boundResizeListener && typeof window !== "undefined" && typeof window.addEventListener === "function") {
    boundResizeListener = () => {
      notifySubscribers();
    };
    window.addEventListener("resize", boundResizeListener);
  }
}

function teardownListenersIfIdle(): void {
  if (subscribers.size > 0) return;
  if (unsubscribeReducedMotion) {
    unsubscribeReducedMotion();
    unsubscribeReducedMotion = null;
  }
  if (boundResizeListener && typeof window !== "undefined" && typeof window.removeEventListener === "function") {
    window.removeEventListener("resize", boundResizeListener);
    boundResizeListener = null;
  }
}

/**
 * Detects current runtime environment and device context in an SSR-safe manner.
 */
export function detectRuntimeContext(overrides?: Partial<RuntimeContext>): RuntimeContext {
  const hasWindow = typeof window !== "undefined";
  const reducedMotion = prefersReducedMotion();
  const saveData = typeof navigator !== "undefined"
    ? Boolean((navigator as any).connection?.saveData)
    : false;
  const hardwareConcurrency = typeof navigator !== "undefined" && typeof navigator.hardwareConcurrency === "number"
    ? navigator.hardwareConcurrency
    : 4;
  const viewportWidth = hasWindow && typeof window.innerWidth === "number" ? window.innerWidth : 1024;
  const viewportHeight = hasWindow && typeof window.innerHeight === "number" ? window.innerHeight : 768;
  const isMobile = viewportWidth > 0 && viewportWidth < 768;
  const reducedTransparency = typeof matchMedia === "function"
    ? matchMedia("(prefers-reduced-transparency: reduce)")?.matches === true
    : false;

  const base: RuntimeContext = {
    reducedMotion,
    lowPower: saveData, // Conservative: only infer low-power when user explicitly enabled Data Saver
    saveData,
    hardwareConcurrency,
    viewportWidth,
    viewportHeight,
    isMobile,
    reducedTransparency,
  };

  if (!overrides) return Object.freeze(base);
  return Object.freeze({ ...base, ...overrides });
}

/**
 * Returns a read-only snapshot of the active adaptive motion configuration.
 */
export function getAdaptiveMotionConfig(): Readonly<AdaptiveMotionConfig> {
  return Object.freeze({ ...activeConfig });
}

/**
 * Updates the global adaptive motion configuration.
 */
export function setAdaptiveMotionConfig(config: Partial<AdaptiveMotionConfig>): void {
  if (config === null || typeof config !== "object" || Array.isArray(config)) {
    throw new TypeError("Adaptive motion config must be an object");
  }
  if (config.intensity !== undefined) {
    if (typeof config.intensity !== "number" || !Number.isFinite(config.intensity) || config.intensity <= 0 || config.intensity > 2) {
      throw new RangeError(`intensity must be a finite number > 0 and <= 2, received ${String(config.intensity)}`);
    }
  }
  if (config.lowPowerIntensity !== undefined) {
    if (typeof config.lowPowerIntensity !== "number" || !Number.isFinite(config.lowPowerIntensity) || config.lowPowerIntensity <= 0 || config.lowPowerIntensity > 2) {
      throw new RangeError(`lowPowerIntensity must be a finite number > 0 and <= 2, received ${String(config.lowPowerIntensity)}`);
    }
  }
  if (config.mobileIntensity !== undefined) {
    if (typeof config.mobileIntensity !== "number" || !Number.isFinite(config.mobileIntensity) || config.mobileIntensity <= 0 || config.mobileIntensity > 2) {
      throw new RangeError(`mobileIntensity must be a finite number > 0 and <= 2, received ${String(config.mobileIntensity)}`);
    }
  }
  if (config.reducedMotion !== undefined && config.reducedMotion !== "respect" && config.reducedMotion !== "ignore") {
    throw new TypeError('reducedMotion must be "respect" or "ignore"');
  }
  if (config.enabled !== undefined && typeof config.enabled !== "boolean") {
    throw new TypeError("enabled must be a boolean");
  }

  activeConfig = {
    ...activeConfig,
    ...config,
  };
  notifySubscribers();
}

/**
 * Resets adaptive motion configuration to factory defaults.
 */
export function resetAdaptiveMotionConfig(): void {
  activeConfig = { ...DEFAULT_CONFIG };
  notifySubscribers();
}

/**
 * Explicitly enables or disables adaptive motion.
 */
export function setAdaptiveMotionEnabled(enabled: boolean): void {
  setAdaptiveMotionConfig({ enabled });
}

/**
 * Alias for setAdaptiveMotionEnabled(true).
 */
export function enableAdaptiveMotion(enabled = true): void {
  setAdaptiveMotionConfig({ enabled });
}

/**
 * Alias for setAdaptiveMotionEnabled(false).
 */
export function disableAdaptiveMotion(): void {
  setAdaptiveMotionConfig({ enabled: false });
}

/**
 * Returns true if adaptive motion is currently enabled.
 */
export function isAdaptiveMotionEnabled(): boolean {
  return activeConfig.enabled ?? true;
}

/**
 * Inspects the current state of adaptive motion, resolving effective intensity and reduced-motion status.
 */
export function inspectAdaptiveMotion(conditions?: AdaptiveMotionConditions): AdaptiveMotionState {
  if (conditions !== undefined) {
    validateConditions(conditions);
  }

  const context = detectRuntimeContext();
  const enabled = activeConfig.enabled ?? true;

  // Reduced motion determination: explicit condition > user config > system context
  const isReducedMotion = conditions?.reducedMotion !== undefined
    ? conditions.reducedMotion
    : activeConfig.reducedMotion === "ignore"
      ? false
      : context.reducedMotion;

  // Effective intensity calculation: explicit condition > low power > mobile > general intensity
  let effectiveIntensity = 1.0;
  if (enabled) {
    if (conditions?.intensity !== undefined) {
      effectiveIntensity = conditions.intensity;
    } else {
      const isLowPower = conditions?.lowPower ?? (activeConfig.conditions?.lowPower ?? context.lowPower);
      if (isLowPower) {
        effectiveIntensity = activeConfig.lowPowerIntensity ?? 0.6;
      } else if (context.isMobile && activeConfig.mobileIntensity !== undefined) {
        effectiveIntensity = activeConfig.mobileIntensity;
      } else if (activeConfig.intensity !== undefined) {
        effectiveIntensity = activeConfig.intensity;
      }
    }
  }

  return Object.freeze({
    enabled,
    context,
    config: Object.freeze({ ...activeConfig }),
    effectiveIntensity,
    isReducedMotion,
  });
}

/**
 * Subscribes a listener to adaptive motion changes (media queries, viewport changes, and config updates).
 * Returns an unsubscribe cleanup function.
 */
export function subscribeAdaptiveMotion(listener: (state: AdaptiveMotionState) => void): () => void {
  if (typeof listener !== "function") {
    throw new TypeError("Adaptive motion listener must be a function");
  }

  subscribers.add(listener);
  ensureListeners();

  return () => {
    subscribers.delete(listener);
    teardownListenersIfIdle();
  };
}

/**
 * Adapts animation options according to current adaptive motion state, applying deterministic precedence:
 * Accessibility / Reduced-Motion > User Adaptive Intensity > Motion DNA > Presets > Runtime Overrides.
 */
export function adaptAnimationOptions(
  options: DOMAnimationOptions,
  conditions?: AdaptiveMotionConditions,
): DOMAnimationOptions {
  if (options === null || typeof options !== "object" || Array.isArray(options)) {
    throw new TypeError("Animation options must be an object");
  }

  const state = inspectAdaptiveMotion(conditions);

  // If adaptation is disabled and no conditions explicitly supplied
  if (!state.enabled && !conditions) {
    return {
      ...options,
      ...(state.isReducedMotion ? { respectReducedMotion: true } : {}),
    };
  }

  const intensity = state.effectiveIntensity;
  const result: DOMAnimationOptions = { ...options };

  // Scale duration if present and > 0
  if (typeof options.duration === "number" && options.duration > 0 && intensity !== 1) {
    result.duration = Math.round(options.duration / intensity);
  }

  // Scale property duration if present
  if (options.propertyDuration && typeof options.propertyDuration === "object" && intensity !== 1) {
    const scaled: Record<string, number> = {};
    for (const [prop, val] of Object.entries(options.propertyDuration)) {
      if (typeof val === "number" && val > 0) {
        scaled[prop] = Math.round(val / intensity);
      } else {
        scaled[prop] = val;
      }
    }
    result.propertyDuration = scaled;
  }

  // Precedence rule: Accessibility / reduced-motion constraints are strictly enforced
  if (state.isReducedMotion) {
    result.respectReducedMotion = true;
  }

  return result;
}
