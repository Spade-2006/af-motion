import {
  getActivePalette,
  getPalette,
  subscribeToPaletteChanges,
} from "./palettes.js";

export interface PaletteColorOptions {
  /** Registered built-in/custom palette to use, or "active" to follow activation changes. */
  palette?: string | "active";
  /** Explicit colors take precedence over palette colors. */
  colors?: readonly string[];
  /** Colors to use when no active palette is available. */
  fallback?: readonly string[];
}

export type PaletteColorsListener = (colors: readonly string[]) => void;

function validateColorList(name: string, colors: readonly string[] | undefined): void {
  if (colors === undefined) return;
  if (!Array.isArray(colors) || colors.length === 0) {
    throw new TypeError(`${name} must be a non-empty array of colors`);
  }
  for (const [index, color] of colors.entries()) {
    if (typeof color !== "string" || color.trim() === "") {
      throw new TypeError(`${name}[${index}] must be a non-empty color string`);
    }
  }
}

function validateOptions(options: PaletteColorOptions): void {
  if (options === null || typeof options !== "object" || Array.isArray(options)) {
    throw new TypeError("Palette color options must be an object");
  }
  if (
    options.palette !== undefined &&
    (typeof options.palette !== "string" || options.palette.trim() === "" || options.palette !== options.palette.trim())
  ) {
    throw new TypeError("palette must be a registered palette name or \"active\"");
  }
  validateColorList("colors", options.colors);
  validateColorList("fallback", options.fallback);
  if (options.palette === undefined && options.colors === undefined && options.fallback === undefined) {
    throw new TypeError("Palette color options must include a palette, colors, or fallback");
  }
}

function paletteColors(name: string): readonly string[] {
  const palette = name === "active" ? getActivePalette() : getPalette(name);
  if (!palette && name !== "active") throw new TypeError(`Unknown palette "${name}"`);
  return palette
    ? [palette.tokens.primary, palette.tokens.secondary, palette.tokens.accent]
    : [];
}

function immutableColors(colors: readonly string[]): readonly string[] {
  return Object.freeze([...colors]);
}

/** Resolves explicit colors or a registered palette into an immutable effect-ready color list. */
export function resolvePaletteColors(options: PaletteColorOptions): readonly string[] {
  validateOptions(options);
  const resolvedPalette = options.palette === undefined
    ? []
    : paletteColors(options.palette);
  if (options.colors) return immutableColors(options.colors);
  if (resolvedPalette.length > 0) return immutableColors(resolvedPalette);
  if (options.fallback) return immutableColors(options.fallback);
  throw new TypeError("No active palette is available and no fallback colors were provided");
}

/**
 * Subscribes to active-palette changes when `palette` is "active".
 * Named palettes and explicit color lists are static and return an inert unsubscribe function.
 */
export function subscribeToPaletteColors(
  options: PaletteColorOptions,
  listener: PaletteColorsListener,
): () => void {
  validateOptions(options);
  if (typeof listener !== "function") {
    throw new TypeError("Palette colors listener must be a function");
  }
  if (options.colors !== undefined || options.palette !== "active") {
    if (options.palette !== undefined && options.palette !== "active") paletteColors(options.palette);
    return () => undefined;
  }
  if (options.fallback === undefined) {
    throw new TypeError("Active palette subscriptions require fallback colors");
  }
  const fallback = options.fallback;

  return subscribeToPaletteChanges((palette) => {
    if (palette) {
      listener(immutableColors([
        palette.tokens.primary,
        palette.tokens.secondary,
        palette.tokens.accent,
      ]));
    } else {
      listener(immutableColors(fallback));
    }
  });
}
