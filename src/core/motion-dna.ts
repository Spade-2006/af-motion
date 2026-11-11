import { resolveEasing } from "../easing/easings.js";
import type { EasingOption } from "../easing/easings.js";
import type { DOMAnimationOptions } from "./animate.js";

export const MOTION_DNA_SCHEMA_VERSION = "1.0.0";

export type MotionDNAPersonality =
  | "snappy"
  | "energetic"
  | "calm"
  | "cinematic"
  | "minimal"
  | "playful";

export interface MotionDNASpringConfig {
  readonly stiffness: number;
  readonly damping: number;
  readonly mass: number;
}

export interface MotionDNACharacteristics {
  readonly personality?: MotionDNAPersonality;
  readonly intensity?: number;
  readonly distanceMultiplier?: number;
  readonly entranceEasing?: EasingOption;
  readonly exitEasing?: EasingOption;
  readonly interactionEasing?: EasingOption;
  readonly entranceDurationMultiplier?: number;
  readonly exitDurationMultiplier?: number;
  readonly hoverDurationMultiplier?: number;
  readonly pressDurationMultiplier?: number;
  readonly spring?: MotionDNASpringConfig;
}

export interface MotionDNAConfigurableParameter {
  readonly name: string;
  readonly type: string;
  readonly description: string;
  readonly default?: unknown;
  readonly range?: { readonly min?: number; readonly max?: number };
}

export interface MotionDNAProfileMetadata {
  readonly compatibleSystems: readonly string[];
  readonly configurableParameters: readonly MotionDNAConfigurableParameter[];
  readonly tags: readonly string[];
  readonly exampleUsage: string;
  readonly examples?: readonly string[];
}

export interface MotionDNA {
  readonly id?: string;
  readonly name?: string;
  readonly description?: string;
  readonly personality?: MotionDNAPersonality;
  readonly duration?: number;
  readonly delay?: number;
  readonly playbackRate?: number;
  readonly respectReducedMotion?: boolean;
  readonly easing?: EasingOption;
  readonly characteristics?: MotionDNACharacteristics;
  readonly metadata?: MotionDNAProfileMetadata;
  readonly compatibleSystems?: readonly string[];
  readonly configurableParameters?: readonly MotionDNAConfigurableParameter[];
  readonly tags?: readonly string[];
  readonly exampleUsage?: string;
}

export type MotionDNAOverrides = Partial<DOMAnimationOptions> & {
  readonly intensity?: number;
  readonly characteristics?: Partial<MotionDNACharacteristics>;
};

export interface MotionDNARegistryApi {
  get(name: string): MotionDNA | undefined;
  register(name: string, dna: MotionDNA): void;
  remove(name: string): boolean;
}

export interface MotionDNAValidationError {
  readonly parameter?: string;
  readonly message: string;
}

export interface MotionDNAValidationResult {
  readonly valid: boolean;
  readonly errors: readonly MotionDNAValidationError[];
}

export interface MotionDNADocument {
  readonly $schema: string;
  readonly version: string;
  readonly totalProfiles: number;
  readonly profiles: readonly MotionDNA[];
}

function freezeDeep<T>(value: T): Readonly<T> {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) {
    return value as Readonly<T>;
  }
  for (const key of Object.keys(value)) {
    const prop = (value as Record<string, unknown>)[key];
    if (prop !== null && typeof prop === "object") {
      freezeDeep(prop);
    }
  }
  return Object.freeze(value) as Readonly<T>;
}

const COMMON_CONFIG_PARAMS: readonly MotionDNAConfigurableParameter[] = [
  { name: "duration", type: "number", description: "Baseline animation duration in milliseconds.", range: { min: 0 } },
  { name: "delay", type: "number", description: "Delay before animation begins.", range: { min: 0 } },
  { name: "playbackRate", type: "number", description: "Playback speed multiplier.", range: { min: 0.1 } },
  { name: "respectReducedMotion", type: "boolean", description: "Whether to respect reduced-motion preference (defaults to true)." },
  { name: "easing", type: "EasingOption", description: "Default easing function or registered easing name." },
];

const COMPATIBLE_SYSTEMS: readonly string[] = [
  "animate",
  "animateSpring",
  "animateProgress",
  "presets",
  "recipes",
  "choreography",
  "effects",
];

// --- Built-in Motion DNA Profiles ---

export const BUILT_IN_MOTION_DNA: readonly MotionDNA[] = [
  {
    id: "dna-snappy",
    name: "snappy",
    personality: "snappy",
    description: "Crisp, responsive, low-latency motion identity for productivity dashboards, toolbars, and high-frequency UI.",
    duration: 200,
    delay: 0,
    playbackRate: 1,
    respectReducedMotion: true,
    easing: "easeOutQuad",
    characteristics: {
      personality: "snappy",
      intensity: 1.2,
      distanceMultiplier: 0.75,
      entranceEasing: "easeOutQuad",
      exitEasing: "easeInQuad",
      interactionEasing: "easeOutQuad",
      entranceDurationMultiplier: 1.0,
      exitDurationMultiplier: 0.75,
      hoverDurationMultiplier: 0.5,
      pressDurationMultiplier: 0.35,
      spring: { stiffness: 300, damping: 25, mass: 1 },
    },
    metadata: {
      compatibleSystems: COMPATIBLE_SYSTEMS,
      configurableParameters: COMMON_CONFIG_PARAMS,
      tags: ["snappy", "quick", "responsive", "productive", "compact"],
      exampleUsage: 'const options = applyMotionDNA("snappy");',
      examples: ['const options = applyMotionDNA("snappy");'],
    },
    compatibleSystems: COMPATIBLE_SYSTEMS,
    configurableParameters: COMMON_CONFIG_PARAMS,
    tags: ["snappy", "quick", "responsive", "productive", "compact"],
    exampleUsage: 'const options = applyMotionDNA("snappy");',
  },
  {
    id: "dna-energetic",
    name: "energetic",
    personality: "energetic",
    description: "Dynamic, punchy, high-momentum motion identity with subtle overshoot for marketing, onboarding, and CTAs.",
    duration: 320,
    delay: 0,
    playbackRate: 1,
    respectReducedMotion: true,
    easing: "easeOutCubic",
    characteristics: {
      personality: "energetic",
      intensity: 1.3,
      distanceMultiplier: 1.2,
      entranceEasing: "easeOutBack",
      exitEasing: "easeInCubic",
      interactionEasing: "easeOutBack",
      entranceDurationMultiplier: 1.0,
      exitDurationMultiplier: 0.7,
      hoverDurationMultiplier: 0.6,
      pressDurationMultiplier: 0.4,
      spring: { stiffness: 220, damping: 18, mass: 1 },
    },
    metadata: {
      compatibleSystems: COMPATIBLE_SYSTEMS,
      configurableParameters: COMMON_CONFIG_PARAMS,
      tags: ["energetic", "punchy", "vibrant", "marketing", "cta", "dynamic"],
      exampleUsage: 'const options = applyMotionDNA("energetic");',
      examples: ['const options = applyMotionDNA("energetic");'],
    },
    compatibleSystems: COMPATIBLE_SYSTEMS,
    configurableParameters: COMMON_CONFIG_PARAMS,
    tags: ["energetic", "punchy", "vibrant", "marketing", "cta", "dynamic"],
    exampleUsage: 'const options = applyMotionDNA("energetic");',
  },
  {
    id: "dna-calm",
    name: "calm",
    personality: "calm",
    description: "Graceful, fluid, organic motion identity for content-heavy reading, wellness, and editorial layouts.",
    duration: 500,
    delay: 0,
    playbackRate: 1,
    respectReducedMotion: true,
    easing: "easeOutSine",
    characteristics: {
      personality: "calm",
      intensity: 0.7,
      distanceMultiplier: 1.0,
      entranceEasing: "easeOutSine",
      exitEasing: "easeInSine",
      interactionEasing: "easeOutSine",
      entranceDurationMultiplier: 1.0,
      exitDurationMultiplier: 0.85,
      hoverDurationMultiplier: 0.75,
      pressDurationMultiplier: 0.5,
      spring: { stiffness: 120, damping: 20, mass: 1 },
    },
    metadata: {
      compatibleSystems: COMPATIBLE_SYSTEMS,
      configurableParameters: COMMON_CONFIG_PARAMS,
      tags: ["calm", "gentle", "serene", "reading", "editorial", "smooth"],
      exampleUsage: 'const options = applyMotionDNA("calm");',
      examples: ['const options = applyMotionDNA("calm");'],
    },
    compatibleSystems: COMPATIBLE_SYSTEMS,
    configurableParameters: COMMON_CONFIG_PARAMS,
    tags: ["calm", "gentle", "serene", "reading", "editorial", "smooth"],
    exampleUsage: 'const options = applyMotionDNA("calm");',
  },
  {
    id: "dna-cinematic",
    name: "cinematic",
    personality: "cinematic",
    description: "Theatrical, expansive, high-friction motion identity with deliberate pacing for hero showcases and storytelling.",
    duration: 600,
    delay: 0,
    playbackRate: 1,
    respectReducedMotion: true,
    easing: "easeOutCubic",
    characteristics: {
      personality: "cinematic",
      intensity: 0.9,
      distanceMultiplier: 1.5,
      entranceEasing: "easeOutCubic",
      exitEasing: "easeInCubic",
      interactionEasing: "easeOutCubic",
      entranceDurationMultiplier: 1.0,
      exitDurationMultiplier: 0.75,
      hoverDurationMultiplier: 0.6,
      pressDurationMultiplier: 0.45,
      spring: { stiffness: 140, damping: 22, mass: 1 },
    },
    metadata: {
      compatibleSystems: COMPATIBLE_SYSTEMS,
      configurableParameters: COMMON_CONFIG_PARAMS,
      tags: ["cinematic", "luxurious", "dramatic", "theatrical", "hero"],
      exampleUsage: 'const options = applyMotionDNA("cinematic");',
      examples: ['const options = applyMotionDNA("cinematic");'],
    },
    compatibleSystems: COMPATIBLE_SYSTEMS,
    configurableParameters: COMMON_CONFIG_PARAMS,
    tags: ["cinematic", "luxurious", "dramatic", "theatrical", "hero"],
    exampleUsage: 'const options = applyMotionDNA("cinematic");',
  },
  {
    id: "dna-minimal",
    name: "minimal",
    personality: "minimal",
    description: "Functional, unobtrusive, lightweight motion identity for data-dense grids, developer tools, and enterprise forms.",
    duration: 150,
    delay: 0,
    playbackRate: 1,
    respectReducedMotion: true,
    easing: "linear",
    characteristics: {
      personality: "minimal",
      intensity: 1.0,
      distanceMultiplier: 0.5,
      entranceEasing: "easeOutQuad",
      exitEasing: "easeInQuad",
      interactionEasing: "linear",
      entranceDurationMultiplier: 1.0,
      exitDurationMultiplier: 0.8,
      hoverDurationMultiplier: 0.4,
      pressDurationMultiplier: 0.3,
      spring: { stiffness: 350, damping: 30, mass: 1 },
    },
    metadata: {
      compatibleSystems: COMPATIBLE_SYSTEMS,
      configurableParameters: COMMON_CONFIG_PARAMS,
      tags: ["minimal", "subtle", "data", "grid", "enterprise", "accessible"],
      exampleUsage: 'const options = applyMotionDNA("minimal");',
      examples: ['const options = applyMotionDNA("minimal");'],
    },
    compatibleSystems: COMPATIBLE_SYSTEMS,
    configurableParameters: COMMON_CONFIG_PARAMS,
    tags: ["minimal", "subtle", "data", "grid", "enterprise", "accessible"],
    exampleUsage: 'const options = applyMotionDNA("minimal");',
  },
  {
    id: "dna-playful",
    name: "playful",
    personality: "playful",
    description: "Bouncy, energetic, joyful motion identity with spring rebound for badges, gamification, and delight moments.",
    duration: 380,
    delay: 0,
    playbackRate: 1,
    respectReducedMotion: true,
    easing: "easeOutBack",
    characteristics: {
      personality: "playful",
      intensity: 1.5,
      distanceMultiplier: 1.3,
      entranceEasing: "easeOutBack",
      exitEasing: "easeInBack",
      interactionEasing: "easeOutBack",
      entranceDurationMultiplier: 1.0,
      exitDurationMultiplier: 0.8,
      hoverDurationMultiplier: 0.5,
      pressDurationMultiplier: 0.35,
      spring: { stiffness: 180, damping: 14, mass: 1 },
    },
    metadata: {
      compatibleSystems: COMPATIBLE_SYSTEMS,
      configurableParameters: COMMON_CONFIG_PARAMS,
      tags: ["playful", "bouncy", "elastic", "onboarding", "delight", "bounce"],
      exampleUsage: 'const options = applyMotionDNA("playful");',
      examples: ['const options = applyMotionDNA("playful");'],
    },
    compatibleSystems: COMPATIBLE_SYSTEMS,
    configurableParameters: COMMON_CONFIG_PARAMS,
    tags: ["playful", "bouncy", "elastic", "onboarding", "delight", "bounce"],
    exampleUsage: 'const options = applyMotionDNA("playful");',
  },
];

for (const profile of BUILT_IN_MOTION_DNA) {
  freezeDeep(profile);
}

const BUILT_IN_BY_ID = new Map<string, MotionDNA>();
const BUILT_IN_BY_NAME = new Map<string, MotionDNA>();

for (const profile of BUILT_IN_MOTION_DNA) {
  if (profile.id) BUILT_IN_BY_ID.set(profile.id, profile);
  if (profile.name) BUILT_IN_BY_NAME.set(profile.name, profile);
}

const BUILT_IN_IDS = new Set(BUILT_IN_MOTION_DNA.map((p) => p.id));
const BUILT_IN_NAMES = new Set(BUILT_IN_MOTION_DNA.map((p) => p.name));
const customDNA = new Map<string, MotionDNA>();

function validateName(name: string): void {
  if (typeof name !== "string" || name.trim() === "" || name !== name.trim()) {
    throw new TypeError("Motion DNA name must be a non-empty string without surrounding whitespace");
  }
}

const VALID_TOP_LEVEL_FIELDS = new Set([
  "duration",
  "delay",
  "playbackRate",
  "respectReducedMotion",
  "easing",
  "id",
  "name",
  "personality",
  "description",
  "characteristics",
  "metadata",
  "compatibleSystems",
  "configurableParameters",
  "tags",
  "exampleUsage",
]);

function validateDNA(dna: MotionDNA): void {
  if (dna === null || typeof dna !== "object" || Array.isArray(dna)) {
    throw new TypeError("Motion DNA must be an object");
  }
  for (const [name, value] of Object.entries(dna)) {
    if (!VALID_TOP_LEVEL_FIELDS.has(name)) {
      throw new TypeError(`Unknown Motion DNA option "${name}"`);
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
      if (typeof value !== "boolean") {
        throw new TypeError(`respectReducedMotion must be a boolean, received ${String(value)}`);
      }
    } else if (name === "easing") {
      if (typeof value !== "string" && typeof value !== "function") {
        throw new TypeError("easing must be a function or a registered easing name");
      }
      resolveEasing(value);
    } else if (name === "characteristics") {
      if (value !== null && typeof value === "object" && !Array.isArray(value)) {
        const c = value as MotionDNACharacteristics;
        if (c.intensity !== undefined && (typeof c.intensity !== "number" || !Number.isFinite(c.intensity) || c.intensity <= 0)) {
          throw new RangeError(`intensity must be a finite number > 0, received ${String(c.intensity)}`);
        }
        if (c.entranceEasing !== undefined) resolveEasing(c.entranceEasing);
        if (c.exitEasing !== undefined) resolveEasing(c.exitEasing);
        if (c.interactionEasing !== undefined) resolveEasing(c.interactionEasing);
      }
    }
  }
}

/**
 * Returns a registered or built-in Motion DNA profile by ID or name.
 */
export function getMotionDNA(name: string): MotionDNA | undefined {
  validateName(name);
  return (
    BUILT_IN_BY_NAME.get(name) ??
    BUILT_IN_BY_ID.get(name) ??
    customDNA.get(name)
  );
}

/**
 * Lists all registered Motion DNA profiles, including built-ins and custom additions.
 */
export function listMotionDNA(): readonly MotionDNA[] {
  const custom = Array.from(customDNA.values());
  return Object.freeze([...BUILT_IN_MOTION_DNA, ...custom]);
}

/**
 * Searches Motion DNA profiles by query keyword matching ID, name, description, personality, or tags.
 */
export function searchMotionDNA(query: string): readonly MotionDNA[] {
  if (!query || typeof query !== "string") return [];
  const normalized = query.trim().toLowerCase();
  if (normalized.length === 0) return [];

  const all = listMotionDNA();
  return Object.freeze(
    all.filter((profile) => {
      const id = profile.id?.toLowerCase() ?? "";
      const name = profile.name?.toLowerCase() ?? "";
      const desc = profile.description?.toLowerCase() ?? "";
      const personality = (profile.personality ?? profile.characteristics?.personality ?? "").toLowerCase();
      const tags = profile.tags ?? profile.metadata?.tags ?? [];

      return (
        id.includes(normalized) ||
        name.includes(normalized) ||
        desc.includes(normalized) ||
        personality.includes(normalized) ||
        tags.some((tag) => tag.toLowerCase().includes(normalized))
      );
    }),
  );
}

/**
 * Registers a custom Motion DNA profile. Built-in profile names are reserved.
 */
export function registerMotionDNA(name: string, dna: MotionDNA): void {
  validateName(name);
  if (BUILT_IN_NAMES.has(name) || BUILT_IN_IDS.has(name)) {
    throw new TypeError(`Cannot overwrite built-in Motion DNA "${name}"`);
  }
  validateDNA(dna);
  const frozen = freezeDeep({ ...dna });
  customDNA.set(name, frozen);
  if (dna.id) customDNA.set(dna.id, frozen);
}

/**
 * Removes a custom Motion DNA profile. Built-in profiles cannot be removed.
 */
export function removeMotionDNA(name: string): boolean {
  validateName(name);
  if (BUILT_IN_NAMES.has(name) || BUILT_IN_IDS.has(name)) {
    throw new TypeError(`Cannot remove built-in Motion DNA "${name}"`);
  }
  const item = customDNA.get(name);
  if (item && item.id) {
    customDNA.delete(item.id);
  }
  return customDNA.delete(name);
}

/**
 * Clones an existing Motion DNA profile and applies overrides without mutating the original.
 */
export function cloneMotionDNA(
  source: string | MotionDNA,
  overrides: Partial<MotionDNA> = {},
): MotionDNA {
  const sourceDNA = typeof source === "string" ? getMotionDNA(source) : source;
  if (!sourceDNA) {
    throw new TypeError(`Unknown Motion DNA profile "${String(source)}"`);
  }

  const merged: MotionDNA = {
    ...sourceDNA,
    ...overrides,
    personality: overrides.personality ?? overrides.characteristics?.personality ?? sourceDNA.personality,
    characteristics: {
      ...sourceDNA.characteristics,
      ...(overrides.characteristics ?? {}),
      personality: overrides.characteristics?.personality ?? overrides.personality ?? sourceDNA.characteristics?.personality ?? sourceDNA.personality,
    },
    metadata: {
      compatibleSystems: overrides.metadata?.compatibleSystems ?? sourceDNA.metadata?.compatibleSystems ?? COMPATIBLE_SYSTEMS,
      configurableParameters: overrides.metadata?.configurableParameters ?? sourceDNA.metadata?.configurableParameters ?? COMMON_CONFIG_PARAMS,
      tags: overrides.metadata?.tags ?? sourceDNA.metadata?.tags ?? sourceDNA.tags ?? [],
      exampleUsage: overrides.metadata?.exampleUsage ?? sourceDNA.metadata?.exampleUsage ?? sourceDNA.exampleUsage ?? "",
      examples: overrides.metadata?.examples ?? sourceDNA.metadata?.examples ?? [],
    },
  };

  validateDNA(merged);
  return freezeDeep(merged);
}

/**
 * Resolves a Motion DNA profile or identity name into a frozen MotionDNA object.
 */
export function resolveMotionDNA(
  source: string | MotionDNA,
  overrides?: MotionDNAOverrides,
): MotionDNA {
  if (typeof source === "string") {
    const dna = getMotionDNA(source);
    if (!dna) {
      throw new TypeError(`Unknown Motion DNA profile "${source}"`);
    }
    if (!overrides) return dna;
    return cloneMotionDNA(dna, overrides as Partial<MotionDNA>);
  }
  if (!overrides) return freezeDeep(source);
  return cloneMotionDNA(source, overrides as Partial<MotionDNA>);
}

/**
 * Validates a Motion DNA configuration object.
 */
export function validateMotionDNA(dna: unknown): MotionDNAValidationResult {
  const errors: MotionDNAValidationError[] = [];
  if (dna === null || typeof dna !== "object" || Array.isArray(dna)) {
    return { valid: false, errors: [{ message: "Motion DNA must be an object" }] };
  }

  const d = dna as Partial<MotionDNA>;
  if (d.name !== undefined && (typeof d.name !== "string" || d.name.trim() === "")) {
    errors.push({ parameter: "name", message: "name must be a non-empty string" });
  }
  if (d.duration !== undefined && (typeof d.duration !== "number" || !Number.isFinite(d.duration) || d.duration < 0)) {
    errors.push({ parameter: "duration", message: "duration must be a finite number >= 0" });
  }
  if (d.delay !== undefined && (typeof d.delay !== "number" || !Number.isFinite(d.delay) || d.delay < 0)) {
    errors.push({ parameter: "delay", message: "delay must be a finite number >= 0" });
  }
  if (d.playbackRate !== undefined && (typeof d.playbackRate !== "number" || !Number.isFinite(d.playbackRate) || d.playbackRate <= 0)) {
    errors.push({ parameter: "playbackRate", message: "playbackRate must be a finite number > 0" });
  }
  if (d.respectReducedMotion !== undefined && typeof d.respectReducedMotion !== "boolean") {
    errors.push({ parameter: "respectReducedMotion", message: "respectReducedMotion must be a boolean" });
  }

  const validPersonalities = new Set(["snappy", "energetic", "calm", "cinematic", "minimal", "playful"]);
  if (d.personality !== undefined && !validPersonalities.has(d.personality as string)) {
    errors.push({ parameter: "personality", message: `personality must be one of: ${Array.from(validPersonalities).join(", ")}` });
  }

  if (d.characteristics) {
    if (d.characteristics.personality !== undefined && !validPersonalities.has(d.characteristics.personality as string)) {
      errors.push({ parameter: "characteristics.personality", message: `personality must be one of: ${Array.from(validPersonalities).join(", ")}` });
    }
    if (d.characteristics.intensity !== undefined && (typeof d.characteristics.intensity !== "number" || !Number.isFinite(d.characteristics.intensity) || d.characteristics.intensity <= 0)) {
      errors.push({ parameter: "characteristics.intensity", message: "intensity must be a finite number > 0" });
    }
    if (d.characteristics.distanceMultiplier !== undefined && (typeof d.characteristics.distanceMultiplier !== "number" || !Number.isFinite(d.characteristics.distanceMultiplier) || d.characteristics.distanceMultiplier < 0)) {
      errors.push({ parameter: "characteristics.distanceMultiplier", message: "distanceMultiplier must be a number >= 0" });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Resolves a registered Motion DNA profile and produces DOMAnimationOptions with caller overrides.
 */
export function applyMotionDNA(
  name: string,
  overrides?: MotionDNAOverrides,
): DOMAnimationOptions {
  const dna = resolveMotionDNA(name, overrides);

  const duration = overrides?.duration ?? dna.duration;
  const delay = overrides?.delay ?? dna.delay;
  const playbackRate = overrides?.playbackRate ?? dna.playbackRate;
  const easing = overrides?.easing ?? dna.easing;
  const respectReducedMotion =
    overrides?.respectReducedMotion !== undefined
      ? overrides.respectReducedMotion
      : dna.respectReducedMotion;

  const result: DOMAnimationOptions = {};
  if (duration !== undefined) result.duration = duration;
  if (delay !== undefined) result.delay = delay;
  if (playbackRate !== undefined) result.playbackRate = playbackRate;
  if (easing !== undefined) result.easing = easing;
  if (respectReducedMotion !== undefined) result.respectReducedMotion = respectReducedMotion;

  return result;
}

/**
 * Serializes a Motion DNA profile to JSON.
 */
export function exportMotionDNAJson(dna: MotionDNA, pretty = true): string {
  return JSON.stringify(dna, null, pretty ? 2 : undefined);
}

/**
 * Exports all registered Motion DNA profiles as a versioned document.
 */
export function exportMotionDNADocument(): MotionDNADocument {
  const all = listMotionDNA();
  return {
    $schema: "https://af-motion.dev/schemas/motion-dna-v1.json",
    version: MOTION_DNA_SCHEMA_VERSION,
    totalProfiles: all.length,
    profiles: all,
  };
}

/**
 * Imports and validates a Motion DNA profile from JSON.
 */
export function importMotionDNAFromJson(json: string): MotionDNA {
  if (typeof json !== "string" || json.trim() === "") {
    throw new TypeError("Motion DNA JSON must be a non-empty string");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(json, (k, v) => (k === "__proto__" || k === "constructor" || k === "prototype" ? undefined : v));
  } catch (e: any) {
    throw new TypeError(`Invalid Motion DNA JSON: ${e.message}`);
  }
  const validation = validateMotionDNA(parsed);
  if (!validation.valid) {
    throw new TypeError(`Invalid Motion DNA JSON: ${validation.errors.map((e) => e.message).join(", ")}`);
  }
  validateDNA(parsed as MotionDNA);
  return freezeDeep(parsed as MotionDNA);
}

export const motionDNARegistry: MotionDNARegistryApi = {
  get: getMotionDNA,
  register: registerMotionDNA,
  remove: removeMotionDNA,
};
