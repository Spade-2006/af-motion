import { getPalette, type ColorPalette, type PaletteInput, activatePalette } from "./palettes.js";
import { getMotionDNA, resolveMotionDNA, type MotionDNA } from "./motion-dna.js";
import { resolveEasing, type EasingOption } from "../easing/easings.js";

export const DESIGN_SYSTEM_SCHEMA_VERSION = "1.0.0";

export interface DesignSystemTypographyTokens {
  readonly fontFamilies?: {
    readonly sans?: string;
    readonly serif?: string;
    readonly mono?: string;
    readonly [key: string]: string | undefined;
  };
  readonly fontSizes?: {
    readonly xs?: string | number;
    readonly sm?: string | number;
    readonly md?: string | number;
    readonly lg?: string | number;
    readonly xl?: string | number;
    readonly "2xl"?: string | number;
    readonly [key: string]: string | number | undefined;
  };
  readonly lineHeights?: {
    readonly tight?: number | string;
    readonly normal?: number | string;
    readonly loose?: number | string;
    readonly [key: string]: number | string | undefined;
  };
  readonly letterSpacings?: {
    readonly tight?: string;
    readonly normal?: string;
    readonly wide?: string;
    readonly [key: string]: string | undefined;
  };
}

export interface DesignSystemSpacingTokens {
  readonly baseUnit?: number;
  readonly space?: {
    readonly none?: number;
    readonly xs?: number;
    readonly sm?: number;
    readonly md?: number;
    readonly lg?: number;
    readonly xl?: number;
    readonly "2xl"?: number;
    readonly [key: string]: number | undefined;
  };
  readonly distance?: {
    readonly subtle?: number;
    readonly moderate?: number;
    readonly pronounced?: number;
    readonly dramatic?: number;
    readonly [key: string]: number | undefined;
  };
}

export interface DesignSystemMotionTimingTokens {
  readonly instant?: number;
  readonly fastest?: number;
  readonly fast?: number;
  readonly normal?: number;
  readonly slow?: number;
  readonly deliberate?: number;
  readonly [key: string]: number | undefined;
}

export interface DesignSystemEasingTokens {
  readonly standard?: EasingOption;
  readonly entrance?: EasingOption;
  readonly exit?: EasingOption;
  readonly expressive?: EasingOption;
  readonly snappy?: EasingOption;
  readonly bounce?: EasingOption;
  readonly [key: string]: EasingOption | undefined;
}

export interface DesignSystemInteractionTokens {
  readonly hoverScale?: number;
  readonly pressScale?: number;
  readonly focusRingWidth?: number;
  readonly elevationDistance?: number;
  readonly transitionDuration?: number;
  readonly [key: string]: number | undefined;
}

export interface DesignSystemMetadata {
  readonly author?: string;
  readonly license?: string;
  readonly description?: string;
  readonly tags?: readonly string[];
  readonly [key: string]: unknown;
}

export interface DesignSystemDefinition {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  /** Palette name (from built-in or registered custom palettes) or full color palette */
  readonly palette?: string | ColorPalette | PaletteInput;
  /** Optional Motion DNA identity name or full MotionDNA object */
  readonly motionDNA?: string | MotionDNA;
  /** Typography tokens relevant to motion/transitions */
  readonly typography?: DesignSystemTypographyTokens;
  /** Spacing and movement scales */
  readonly spacing?: DesignSystemSpacingTokens;
  /** Durations for various timing categories */
  readonly timing?: DesignSystemMotionTimingTokens;
  /** Preferred easing curves for interactions and transitions */
  readonly easings?: DesignSystemEasingTokens;
  /** Interaction conventions (hover, press, elevation) */
  readonly interaction?: DesignSystemInteractionTokens;
  /** Overall motion intensity multiplier (default 1.0) */
  readonly intensity?: number;
  /** Machine-readable metadata */
  readonly metadata?: DesignSystemMetadata;
}

export interface DesignSystem extends DesignSystemDefinition {
  /** Resolved active ColorPalette object if palette was specified */
  readonly resolvedPalette?: ColorPalette;
  /** Resolved active MotionDNA object if motionDNA was specified */
  readonly resolvedMotionDNA?: MotionDNA;
}

export interface DesignSystemValidationError {
  readonly parameter?: string;
  readonly message: string;
}

export interface DesignSystemValidationResult {
  readonly valid: boolean;
  readonly errors: readonly DesignSystemValidationError[];
}

export interface DesignSystemsDocument {
  readonly $schema: string;
  readonly version: string;
  readonly totalDesignSystems: number;
  readonly designSystems: readonly DesignSystem[];
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

function validateName(name: string): void {
  if (typeof name !== "string" || name.trim() === "" || name !== name.trim()) {
    throw new TypeError("Design system name must be a non-empty string without surrounding whitespace");
  }
}

function resolveInternalPalette(palette: string | ColorPalette | PaletteInput | undefined): ColorPalette | undefined {
  if (!palette) return undefined;
  if (typeof palette === "string") {
    return getPalette(palette);
  }
  if ("tokens" in palette) {
    return palette as ColorPalette;
  }
  return undefined;
}

function resolveInternalMotionDNA(motionDNA: string | MotionDNA | undefined): MotionDNA | undefined {
  if (!motionDNA) return undefined;
  if (typeof motionDNA === "string") {
    return getMotionDNA(motionDNA);
  }
  return motionDNA;
}

/**
 * Validates a design system definition against required fields and constraints.
 */
export function validateDesignSystem(system: unknown): DesignSystemValidationResult {
  const errors: DesignSystemValidationError[] = [];
  if (system === null || typeof system !== "object" || Array.isArray(system)) {
    return { valid: false, errors: [{ message: "Design system must be a non-null object" }] };
  }

  const s = system as Partial<DesignSystemDefinition>;

  if (typeof s.id !== "string" || s.id.trim() === "") {
    errors.push({ parameter: "id", message: "id must be a non-empty string" });
  }

  if (typeof s.name !== "string" || s.name.trim() === "") {
    errors.push({ parameter: "name", message: "name must be a non-empty string" });
  }

  if (s.palette !== undefined) {
    if (typeof s.palette === "string") {
      if (s.palette.trim() === "") {
        errors.push({ parameter: "palette", message: "palette name must be a non-empty string" });
      } else if (!getPalette(s.palette)) {
        errors.push({ parameter: "palette", message: `Unknown color palette "${s.palette}"` });
      }
    } else if (typeof s.palette !== "object" || s.palette === null) {
      errors.push({ parameter: "palette", message: "palette must be a string name or ColorPalette object" });
    }
  }

  if (s.motionDNA !== undefined) {
    if (typeof s.motionDNA === "string") {
      if (s.motionDNA.trim() === "") {
        errors.push({ parameter: "motionDNA", message: "motionDNA name must be a non-empty string" });
      } else if (!getMotionDNA(s.motionDNA)) {
        errors.push({ parameter: "motionDNA", message: `Unknown Motion DNA profile "${s.motionDNA}"` });
      }
    } else if (typeof s.motionDNA !== "object" || s.motionDNA === null) {
      errors.push({ parameter: "motionDNA", message: "motionDNA must be a string name or MotionDNA object" });
    }
  }

  if (s.intensity !== undefined) {
    if (typeof s.intensity !== "number" || !Number.isFinite(s.intensity) || s.intensity <= 0 || s.intensity > 3) {
      errors.push({ parameter: "intensity", message: "intensity must be a finite number > 0 and <= 3" });
    }
  }

  if (s.timing !== undefined) {
    if (typeof s.timing !== "object" || s.timing === null || Array.isArray(s.timing)) {
      errors.push({ parameter: "timing", message: "timing must be an object" });
    } else {
      for (const [key, val] of Object.entries(s.timing)) {
        if (typeof val !== "number" || !Number.isFinite(val) || val < 0) {
          errors.push({ parameter: `timing.${key}`, message: `timing.${key} must be a number >= 0` });
        }
      }
    }
  }

  if (s.spacing !== undefined) {
    if (typeof s.spacing !== "object" || s.spacing === null || Array.isArray(s.spacing)) {
      errors.push({ parameter: "spacing", message: "spacing must be an object" });
    } else {
      if (s.spacing.baseUnit !== undefined && (typeof s.spacing.baseUnit !== "number" || s.spacing.baseUnit <= 0)) {
        errors.push({ parameter: "spacing.baseUnit", message: "baseUnit must be a number > 0" });
      }
    }
  }

  if (s.easings !== undefined) {
    if (typeof s.easings !== "object" || s.easings === null || Array.isArray(s.easings)) {
      errors.push({ parameter: "easings", message: "easings must be an object" });
    } else {
      for (const [key, val] of Object.entries(s.easings)) {
        if (typeof val === "string") {
          try {
            resolveEasing(val);
          } catch {
            errors.push({ parameter: `easings.${key}`, message: `Unknown easing "${val}"` });
          }
        } else if (typeof val !== "function") {
          errors.push({ parameter: `easings.${key}`, message: `easings.${key} must be a registered easing name or function` });
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Creates and resolves a design system from a definition with deep freeze immutability.
 */
export function createDesignSystem(definition: DesignSystemDefinition): DesignSystem {
  const validation = validateDesignSystem(definition);
  if (!validation.valid) {
    throw new TypeError(`Invalid design system definition: ${validation.errors.map((e) => e.message).join(", ")}`);
  }

  const resolvedPalette = resolveInternalPalette(definition.palette);
  const resolvedMotionDNA = resolveInternalMotionDNA(definition.motionDNA);

  const full: DesignSystem = {
    ...definition,
    resolvedPalette,
    resolvedMotionDNA,
  };

  return freezeDeep(full);
}

// --- Built-in Theme-Agnostic Design Systems ---

export const BUILT_IN_DESIGN_SYSTEMS: readonly DesignSystem[] = [
  createDesignSystem({
    id: "ds-default",
    name: "default",
    description: "Balanced, neutral modern design system with standard scales and harmonious pacing.",
    palette: "Cobalt Classic",
    motionDNA: "snappy",
    spacing: {
      baseUnit: 8,
      space: { none: 0, xs: 4, sm: 8, md: 16, lg: 24, xl: 32, "2xl": 48 },
      distance: { subtle: 8, moderate: 16, pronounced: 32, dramatic: 64 },
    },
    timing: {
      instant: 0,
      fastest: 100,
      fast: 200,
      normal: 300,
      slow: 500,
      deliberate: 750,
    },
    easings: {
      standard: "easeOutQuad",
      entrance: "easeOutQuad",
      exit: "easeInQuad",
      expressive: "easeOutCubic",
      snappy: "easeOutQuad",
    },
    interaction: {
      hoverScale: 1.04,
      pressScale: 0.96,
      focusRingWidth: 2,
      elevationDistance: 4,
      transitionDuration: 180,
    },
    intensity: 1.0,
    metadata: {
      tags: ["default", "neutral", "modern", "general-purpose"],
      description: "Default baseline design system for AF Motion components.",
    },
  }),
  createDesignSystem({
    id: "ds-minimal",
    name: "minimal",
    description: "Functional, low-latency enterprise identity with subtle movements and high information density.",
    palette: "Silver Signal",
    motionDNA: "minimal",
    spacing: {
      baseUnit: 4,
      space: { none: 0, xs: 2, sm: 4, md: 8, lg: 16, xl: 24, "2xl": 32 },
      distance: { subtle: 4, moderate: 8, pronounced: 16, dramatic: 32 },
    },
    timing: {
      instant: 0,
      fastest: 80,
      fast: 150,
      normal: 220,
      slow: 350,
      deliberate: 500,
    },
    easings: {
      standard: "easeOutQuad",
      entrance: "easeOutQuad",
      exit: "easeInQuad",
      expressive: "easeOutQuad",
      snappy: "linear",
    },
    interaction: {
      hoverScale: 1.02,
      pressScale: 0.98,
      focusRingWidth: 2,
      elevationDistance: 2,
      transitionDuration: 120,
    },
    intensity: 1.0,
    metadata: {
      tags: ["minimal", "enterprise", "compact", "developer-tools", "data-dense"],
    },
  }),
  createDesignSystem({
    id: "ds-expressive",
    name: "expressive",
    description: "Dynamic, punchy consumer brand identity with lively spring physics and pronounced spacing.",
    palette: "Electric Teal",
    motionDNA: "energetic",
    spacing: {
      baseUnit: 8,
      space: { none: 0, xs: 4, sm: 8, md: 16, lg: 24, xl: 32, "2xl": 48 },
      distance: { subtle: 12, moderate: 24, pronounced: 48, dramatic: 80 },
    },
    timing: {
      instant: 0,
      fastest: 120,
      fast: 220,
      normal: 360,
      slow: 550,
      deliberate: 850,
    },
    easings: {
      standard: "easeOutCubic",
      entrance: "easeOutBack",
      exit: "easeInCubic",
      expressive: "easeOutBack",
      snappy: "easeOutQuad",
      bounce: "easeOutBack",
    },
    interaction: {
      hoverScale: 1.06,
      pressScale: 0.94,
      focusRingWidth: 3,
      elevationDistance: 8,
      transitionDuration: 220,
    },
    intensity: 1.2,
    metadata: {
      tags: ["expressive", "marketing", "delight", "onboarding", "bold"],
    },
  }),
];

const BUILT_IN_BY_ID = new Map<string, DesignSystem>();
const BUILT_IN_BY_NAME = new Map<string, DesignSystem>();

for (const ds of BUILT_IN_DESIGN_SYSTEMS) {
  BUILT_IN_BY_ID.set(ds.id, ds);
  BUILT_IN_BY_NAME.set(ds.name, ds);
}

const BUILT_IN_NAMES = new Set(BUILT_IN_DESIGN_SYSTEMS.map((d) => d.name));
const BUILT_IN_IDS = new Set(BUILT_IN_DESIGN_SYSTEMS.map((d) => d.id));

const customDesignSystems = new Map<string, DesignSystem>();
const designSystemChangeListeners = new Set<(system: DesignSystem | undefined) => void>();
let activeDesignSystemName: string | undefined = "default";

/**
 * Registers a user-defined design system in the registry. Built-in names are protected.
 */
export function registerDesignSystem(name: string, system: DesignSystemDefinition): void {
  validateName(name);
  if (BUILT_IN_NAMES.has(name) || BUILT_IN_IDS.has(name)) {
    throw new TypeError(`Cannot overwrite built-in design system "${name}"`);
  }

  const resolved = createDesignSystem(system);
  customDesignSystems.set(name, resolved);
  if (resolved.id) {
    customDesignSystems.set(resolved.id, resolved);
  }

  if (activeDesignSystemName === name) {
    notifyDesignSystemChange();
  }
}

/**
 * Retrieves a registered or built-in design system by ID or name.
 */
export function getDesignSystem(nameOrId: string): DesignSystem | undefined {
  validateName(nameOrId);
  return (
    BUILT_IN_BY_NAME.get(nameOrId) ??
    BUILT_IN_BY_ID.get(nameOrId) ??
    customDesignSystems.get(nameOrId)
  );
}

/**
 * Lists all registered design systems (built-ins + custom additions).
 */
export function listDesignSystems(): readonly DesignSystem[] {
  const custom = Array.from(new Set(customDesignSystems.values()));
  return Object.freeze([...BUILT_IN_DESIGN_SYSTEMS, ...custom]);
}

/**
 * Searches design systems by keyword query matching ID, name, description, or tags.
 */
export function searchDesignSystems(query: string): readonly DesignSystem[] {
  if (!query || typeof query !== "string") return [];
  const normalized = query.trim().toLowerCase();
  if (normalized.length === 0) return [];

  const all = listDesignSystems();
  return Object.freeze(
    all.filter((ds) => {
      const id = ds.id.toLowerCase();
      const name = ds.name.toLowerCase();
      const desc = ds.description?.toLowerCase() ?? "";
      const tags = (ds.metadata?.tags as readonly string[] | undefined) ?? [];

      return (
        id.includes(normalized) ||
        name.includes(normalized) ||
        desc.includes(normalized) ||
        tags.some((tag) => tag.toLowerCase().includes(normalized))
      );
    }),
  );
}

/**
 * Clones a design system and applies overrides without mutating the original.
 */
export function cloneDesignSystem(
  source: string | DesignSystem,
  overrides: Partial<DesignSystemDefinition> = {},
): DesignSystem {
  const sourceDS = typeof source === "string" ? getDesignSystem(source) : source;
  if (!sourceDS) {
    throw new TypeError(`Unknown design system "${String(source)}"`);
  }

  const merged: DesignSystemDefinition = {
    ...sourceDS,
    ...overrides,
    typography: {
      ...sourceDS.typography,
      ...(overrides.typography ?? {}),
      fontFamilies: {
        ...(sourceDS.typography?.fontFamilies ?? {}),
        ...(overrides.typography?.fontFamilies ?? {}),
      },
      fontSizes: {
        ...(sourceDS.typography?.fontSizes ?? {}),
        ...(overrides.typography?.fontSizes ?? {}),
      },
    },
    spacing: {
      ...sourceDS.spacing,
      ...(overrides.spacing ?? {}),
      space: {
        ...(sourceDS.spacing?.space ?? {}),
        ...(overrides.spacing?.space ?? {}),
      },
      distance: {
        ...(sourceDS.spacing?.distance ?? {}),
        ...(overrides.spacing?.distance ?? {}),
      },
    },
    timing: {
      ...sourceDS.timing,
      ...(overrides.timing ?? {}),
    },
    easings: {
      ...sourceDS.easings,
      ...(overrides.easings ?? {}),
    },
    interaction: {
      ...sourceDS.interaction,
      ...(overrides.interaction ?? {}),
    },
    metadata: {
      ...sourceDS.metadata,
      ...(overrides.metadata ?? {}),
    },
  };

  return createDesignSystem(merged);
}

/**
 * Removes a custom design system from the registry. Built-in systems cannot be removed.
 */
export function removeDesignSystem(name: string): boolean {
  validateName(name);
  if (BUILT_IN_NAMES.has(name) || BUILT_IN_IDS.has(name)) {
    throw new TypeError(`Cannot remove built-in design system "${name}"`);
  }

  const ds = customDesignSystems.get(name);
  if (ds && ds.id) {
    customDesignSystems.delete(ds.id);
  }
  const removed = customDesignSystems.delete(name);

  if (removed && activeDesignSystemName === name) {
    activeDesignSystemName = "default";
    notifyDesignSystemChange();
  }

  return removed;
}

/**
 * Resolves a design system by name or object, applying optional overrides.
 */
export function resolveDesignSystem(
  source: string | DesignSystem,
  overrides?: Partial<DesignSystemDefinition>,
): DesignSystem {
  if (typeof source === "string") {
    const ds = getDesignSystem(source);
    if (!ds) {
      throw new TypeError(`Unknown design system "${source}"`);
    }
    if (!overrides) return ds;
    return cloneDesignSystem(ds, overrides);
  }
  if (!overrides) return freezeDeep(source);
  return cloneDesignSystem(source, overrides);
}

/**
 * Traverses and resolves any nested design system token by dot-notated path with optional fallback.
 */
export function resolveDesignToken<T = unknown>(
  system: DesignSystem,
  tokenPath: string,
  fallback?: T,
): T {
  if (!tokenPath || typeof tokenPath !== "string") return fallback as T;
  const parts = tokenPath.split(".");
  let current: any = system;
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== "object") {
      return fallback as T;
    }
    current = current[part];
  }
  return (current !== undefined ? current : fallback) as T;
}

/**
 * Resolves a motion timing duration from the design system timing scale or fallback.
 */
export function resolveMotionTiming(
  system: DesignSystem,
  keyOrCategory: string,
  fallback?: number,
): number {
  if (system.timing && (system.timing as Record<string, number | undefined>)[keyOrCategory] !== undefined) {
    return (system.timing as Record<string, number>)[keyOrCategory];
  }
  if (fallback !== undefined) {
    return fallback;
  }
  if (system.resolvedMotionDNA?.duration !== undefined) {
    return system.resolvedMotionDNA.duration;
  }
  return 300;
}

/**
 * Resolves a movement distance from the design system spacing distance scale or fallback.
 */
export function resolveMovementDistance(
  system: DesignSystem,
  keyOrScale: string,
  fallback = 16,
): number {
  if (system.spacing?.distance && (system.spacing.distance as Record<string, number | undefined>)[keyOrScale] !== undefined) {
    return (system.spacing.distance as Record<string, number>)[keyOrScale];
  }
  return fallback;
}

// --- Active Design System & Theme Subscriptions ---

function notifyDesignSystemChange(): void {
  const active = getActiveDesignSystem();
  for (const listener of [...designSystemChangeListeners]) {
    try {
      listener(active);
    } catch {
      // Ignore listener error
    }
  }
}

/**
 * Returns the currently active design system.
 */
export function getActiveDesignSystem(): DesignSystem | undefined {
  return activeDesignSystemName ? getDesignSystem(activeDesignSystemName) : undefined;
}

/**
 * Sets the active design system, optionally activating its palette, and notifies subscribers.
 */
export function setActiveDesignSystem(nameOrSystem: string | DesignSystem | undefined): void {
  if (nameOrSystem === undefined) {
    activeDesignSystemName = undefined;
    notifyDesignSystemChange();
    return;
  }

  const ds = typeof nameOrSystem === "string" ? getDesignSystem(nameOrSystem) : nameOrSystem;
  if (!ds) {
    throw new TypeError(`Unknown design system "${String(nameOrSystem)}"`);
  }

  if (activeDesignSystemName === ds.name) return;
  activeDesignSystemName = ds.name;

  // Synchronize palette if registered
  if (typeof ds.palette === "string") {
    try {
      activatePalette(ds.palette);
    } catch {
      // Best-effort palette sync
    }
  }

  notifyDesignSystemChange();
}

/**
 * Subscribes to active design system changes, returning an unsubscribe cleanup function.
 */
export function subscribeToDesignSystem(listener: (system: DesignSystem | undefined) => void): () => void {
  if (typeof listener !== "function") {
    throw new TypeError("Design system listener must be a function");
  }

  designSystemChangeListeners.add(listener);
  return () => {
    designSystemChangeListeners.delete(listener);
  };
}

/**
 * Resets custom design systems and restores active design system to "default" (for test isolation).
 */
export function resetDesignSystemRegistry(): void {
  customDesignSystems.clear();
  activeDesignSystemName = "default";
}

// --- Machine-Readable Export & Import ---

/**
 * Serializes a design system to formatted JSON.
 */
export function exportDesignSystemJson(system: DesignSystem, pretty = true): string {
  return JSON.stringify(system, null, pretty ? 2 : undefined);
}

/**
 * Exports all registered design systems as a versioned document.
 */
export function exportDesignSystemsDocument(): DesignSystemsDocument {
  const all = listDesignSystems();
  return {
    $schema: "https://af-motion.dev/schemas/design-systems-v1.json",
    version: DESIGN_SYSTEM_SCHEMA_VERSION,
    totalDesignSystems: all.length,
    designSystems: all,
  };
}

/**
 * Imports and validates a design system from a JSON string.
 */
export function importDesignSystemFromJson(json: string): DesignSystem {
  if (typeof json !== "string" || json.trim() === "") {
    throw new TypeError("Design system JSON must be a non-empty string");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(json, (k, v) => (k === "__proto__" || k === "constructor" || k === "prototype" ? undefined : v));
  } catch (e: any) {
    throw new TypeError(`Invalid design system JSON: ${e.message}`);
  }

  return createDesignSystem(parsed as DesignSystemDefinition);
}
