import { BUILT_IN_PALETTE_INPUTS } from "./built-in-palettes.js";

export interface SemanticColorTokens {
  readonly primary: string;
  readonly secondary: string;
  readonly accent: string;
  readonly background: string;
  readonly surface: string;
  readonly text: string;
  readonly muted: string;
  readonly border: string;
  readonly success: string;
  readonly warning: string;
  readonly error: string;
  readonly info: string;
}

export type SemanticColorToken = keyof SemanticColorTokens;

export interface PaletteColorNames {
  readonly primary: string;
  readonly secondary: string;
  readonly accent: string;
}

export interface ColorPalette {
  readonly name: string;
  readonly tokens: SemanticColorTokens;
  readonly colorNames?: PaletteColorNames;
}

export interface PaletteInput {
  readonly name: string;
  readonly primary: string;
  readonly secondary: string;
  readonly accent: string;
  readonly overrides?: Partial<SemanticColorTokens>;
  readonly colorNames?: PaletteColorNames;
}

export type PaletteDefinition = ColorPalette | PaletteInput;

export type PaletteChangeListener = (palette: ColorPalette | undefined) => void;

export interface PaletteRegistryApi {
  /** Retrieves a registered palette, or undefined when the name is unknown. */
  get(name: string): ColorPalette | undefined;
  /** Returns the names of registered custom palettes. */
  list(): readonly string[];
  /** Registers a palette. Names must be unique. */
  register(palette: PaletteDefinition): void;
  /** Removes a registered custom palette. */
  remove(name: string): boolean;
  /** Activates a registered palette and notifies subscribers when it changes. */
  activate(name: string): void;
  /** Returns the active palette, or undefined when none is active. */
  getActive(): ColorPalette | undefined;
  /** Subscribes to active-palette changes and returns an unsubscribe function. */
  subscribe(listener: PaletteChangeListener): () => void;
}

const SEMANTIC_COLOR_TOKENS = [
  "primary",
  "secondary",
  "accent",
  "background",
  "surface",
  "text",
  "muted",
  "border",
  "success",
  "warning",
  "error",
  "info",
] as const satisfies readonly SemanticColorToken[];

const HEX_COLOR_PATTERN = /^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i;
const customPalettes = new Map<string, ColorPalette>();
const paletteChangeListeners = new Set<PaletteChangeListener>();
let activePaletteName: string | undefined;

function validateName(name: unknown): asserts name is string {
  if (typeof name !== "string" || name.trim() === "" || name !== name.trim()) {
    throw new TypeError("Palette name must be a non-empty string without surrounding whitespace");
  }
}

function validateHexColor(color: unknown, token: SemanticColorToken): asserts color is string {
  if (typeof color !== "string" || !HEX_COLOR_PATTERN.test(color)) {
    throw new TypeError(`Palette token "${token}" must be a valid HEX color`);
  }
}

function validateTokenKeys(tokens: object): void {
  for (const token of Object.keys(tokens)) {
    if (!(SEMANTIC_COLOR_TOKENS as readonly string[]).includes(token)) {
      throw new TypeError(`Unknown semantic color token "${token}"`);
    }
  }
}

function validateColorNames(colorNames: unknown): PaletteColorNames | undefined {
  if (colorNames === undefined) return undefined;
  if (colorNames === null || typeof colorNames !== "object" || Array.isArray(colorNames)) {
    throw new TypeError("Palette color names must be an object");
  }
  const keys = Object.keys(colorNames);
  for (const key of keys) {
    if (key !== "primary" && key !== "secondary" && key !== "accent") {
      throw new TypeError(`Unknown palette color name key "${key}"`);
    }
  }
  const names = colorNames as Partial<Record<keyof PaletteColorNames, unknown>>;
  for (const token of ["primary", "secondary", "accent"] as const) {
    if (typeof names[token] !== "string" || names[token].trim() === "") {
      throw new TypeError(`Palette color name "${token}" must be a non-empty string`);
    }
  }
  return Object.freeze({
    primary: names.primary as string,
    secondary: names.secondary as string,
    accent: names.accent as string,
  });
}

function isBasePaletteInput(palette: PaletteDefinition): palette is PaletteInput {
  return ["primary", "secondary", "accent"].some((key) =>
    Object.prototype.hasOwnProperty.call(palette, key),
  );
}

function validatePalette(palette: PaletteDefinition): ColorPalette {
  if (palette === null || typeof palette !== "object" || Array.isArray(palette)) {
    throw new TypeError("Palette must be an object");
  }
  validateName(palette.name);
  const colorNames = validateColorNames(palette.colorNames);

  let sourceTokens: Partial<Record<SemanticColorToken, string>>;
  if (isBasePaletteInput(palette)) {
    const input = palette;
    const baseColors = {
      primary: input.primary,
      secondary: input.secondary,
      accent: input.accent,
    };
    for (const token of ["primary", "secondary", "accent"] as const) {
      validateHexColor(baseColors[token], token);
    }
    const overrides = input.overrides === undefined ? {} : input.overrides;
    if (overrides === null || typeof overrides !== "object" || Array.isArray(overrides)) {
      throw new TypeError("Palette semantic token overrides must be an object");
    }
    validateTokenKeys(overrides);
    sourceTokens = {
      ...baseColors,
      background: input.secondary,
      surface: input.secondary,
      text: input.primary,
      muted: input.secondary,
      border: input.secondary,
      success: input.accent,
      warning: input.accent,
      error: input.accent,
      info: input.accent,
      ...overrides,
    };
  } else {
    const input = palette as ColorPalette;
    if (
      input.tokens === null ||
      typeof input.tokens !== "object" ||
      Array.isArray(input.tokens)
    ) {
      throw new TypeError("Palette tokens must be an object");
    }
    validateTokenKeys(input.tokens);
    sourceTokens = input.tokens;
  }

  const tokens: Partial<Record<SemanticColorToken, string>> = {};
  for (const token of SEMANTIC_COLOR_TOKENS) {
    if (!Object.prototype.hasOwnProperty.call(sourceTokens, token)) {
      throw new TypeError(`Palette is missing required semantic color token "${token}"`);
    }
    const color: unknown = sourceTokens[token];
    validateHexColor(color, token);
    tokens[token] = color;
  }

  return Object.freeze({
    name: palette.name,
    tokens: Object.freeze(tokens as SemanticColorTokens),
    ...(colorNames ? { colorNames } : {}),
  });
}

function clonePalette(palette: ColorPalette): ColorPalette {
  const tokens: Partial<Record<SemanticColorToken, string>> = {};
  for (const token of SEMANTIC_COLOR_TOKENS) tokens[token] = palette.tokens[token];
  return Object.freeze({
    name: palette.name,
    tokens: Object.freeze(tokens as SemanticColorTokens),
    ...(palette.colorNames ? { colorNames: Object.freeze({ ...palette.colorNames }) } : {}),
  });
}

const builtInPalettes = new Map<string, ColorPalette>(
  BUILT_IN_PALETTE_INPUTS.map((palette) => {
    const validatedPalette = validatePalette(palette);
    return [validatedPalette.name, validatedPalette];
  }),
);

export function registerPalette(palette: PaletteDefinition): void {
  const validatedPalette = validatePalette(palette);
  if (builtInPalettes.has(validatedPalette.name)) {
    throw new TypeError(`Cannot replace built-in palette "${validatedPalette.name}"`);
  }
  if (customPalettes.has(validatedPalette.name)) {
    throw new TypeError(`Palette "${validatedPalette.name}" is already registered`);
  }
  customPalettes.set(validatedPalette.name, validatedPalette);
}

export function getPalette(name: string): ColorPalette | undefined {
  validateName(name);
  const palette = builtInPalettes.get(name) ?? customPalettes.get(name);
  return palette ? clonePalette(palette) : undefined;
}

export function listPalettes(): readonly string[] {
  return Object.freeze([...builtInPalettes.keys(), ...customPalettes.keys()]);
}

function notifyPaletteChange(): void {
  const activePalette = getActivePalette();
  for (const listener of [...paletteChangeListeners]) {
    listener(activePalette);
  }
}

export function activatePalette(name: string): void {
  validateName(name);
  if (!builtInPalettes.has(name) && !customPalettes.has(name)) {
    throw new TypeError(`Unknown palette "${name}"`);
  }
  if (activePaletteName === name) return;
  activePaletteName = name;
  notifyPaletteChange();
}

export function getActivePalette(): ColorPalette | undefined {
  return activePaletteName === undefined ? undefined : getPalette(activePaletteName);
}

export function subscribeToPaletteChanges(listener: PaletteChangeListener): () => void {
  if (typeof listener !== "function") {
    throw new TypeError("Palette change listener must be a function");
  }
  paletteChangeListeners.add(listener);
  return () => {
    paletteChangeListeners.delete(listener);
  };
}

export function removePalette(name: string): boolean {
  validateName(name);
  if (builtInPalettes.has(name)) return false;
  const removed = customPalettes.delete(name);
  if (removed && activePaletteName === name) {
    activePaletteName = undefined;
    notifyPaletteChange();
  }
  return removed;
}

export const paletteRegistry: Readonly<PaletteRegistryApi> = Object.freeze({
  activate: activatePalette,
  getActive: getActivePalette,
  get: getPalette,
  list: listPalettes,
  register: registerPalette,
  remove: removePalette,
  subscribe: subscribeToPaletteChanges,
});
