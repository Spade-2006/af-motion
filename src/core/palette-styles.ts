import {
  getActivePalette,
  getPalette,
  subscribeToPaletteChanges,
} from "./palettes.js";
import type {
  ColorPalette,
  SemanticColorToken,
  SemanticColorTokens,
} from "./palettes.js";

/** CSS custom properties use the stable `--af-motion-color-<token>` naming convention. */
export const PALETTE_CSS_VARIABLES: Readonly<Record<SemanticColorToken, string>> = Object.freeze({
  primary: "--af-motion-color-primary",
  secondary: "--af-motion-color-secondary",
  accent: "--af-motion-color-accent",
  background: "--af-motion-color-background",
  surface: "--af-motion-color-surface",
  text: "--af-motion-color-text",
  muted: "--af-motion-color-muted",
  border: "--af-motion-color-border",
  success: "--af-motion-color-success",
  warning: "--af-motion-color-warning",
  error: "--af-motion-color-error",
  info: "--af-motion-color-info",
});

export interface ApplyActivePaletteOptions {
  /** Update the element whenever the active palette changes. */
  readonly subscribe?: boolean;
}

export type PaletteStyleCleanup = () => void;

interface OriginalProperty {
  readonly value: string;
  readonly priority: string;
}

function getStyle(target: HTMLElement): CSSStyleDeclaration {
  if (
    target === null ||
    typeof target !== "object" ||
    target.style === null ||
    typeof target.style !== "object" ||
    typeof target.style.getPropertyValue !== "function" ||
    typeof target.style.getPropertyPriority !== "function" ||
    typeof target.style.setProperty !== "function" ||
    typeof target.style.removeProperty !== "function"
  ) {
    throw new TypeError("Palette target must be a DOM element with an inline style declaration");
  }
  return target.style;
}

function snapshotProperties(style: CSSStyleDeclaration): ReadonlyMap<string, OriginalProperty> {
  const originals = new Map<string, OriginalProperty>();
  for (const property of Object.values(PALETTE_CSS_VARIABLES)) {
    originals.set(property, {
      value: style.getPropertyValue(property),
      priority: style.getPropertyPriority(property),
    });
  }
  return originals;
}

function writeTokens(style: CSSStyleDeclaration, tokens: SemanticColorTokens): void {
  for (const token of Object.keys(PALETTE_CSS_VARIABLES) as SemanticColorToken[]) {
    style.setProperty(PALETTE_CSS_VARIABLES[token], tokens[token]);
  }
}

function restoreProperties(
  style: CSSStyleDeclaration,
  originals: ReadonlyMap<string, OriginalProperty>,
  owned: ReadonlySet<string>,
): void {
  for (const [property, original] of originals) {
    if (!owned.has(property)) continue;
    if (original.value === "") style.removeProperty(property);
    else style.setProperty(property, original.value, original.priority);
  }
}

function createPaletteApplication(
  target: HTMLElement,
  initialPalette: ColorPalette | undefined,
  subscribe: boolean,
): PaletteStyleCleanup {
  const style = getStyle(target);
  const originals = snapshotProperties(style);
  const owned = new Set<string>();
  let closed = false;
  const apply = (palette: ColorPalette | undefined): void => {
    if (closed) return;
    if (palette) {
      writeTokens(style, palette.tokens);
      for (const property of Object.values(PALETTE_CSS_VARIABLES)) owned.add(property);
    } else {
      restoreProperties(style, originals, owned);
    }
  };
  if (initialPalette) apply(initialPalette);
  const unsubscribe = subscribe ? subscribeToPaletteChanges(apply) : () => undefined;

  return () => {
    if (closed) return;
    closed = true;
    unsubscribe();
    restoreProperties(style, originals, owned);
  };
}

/** Apply a registered palette's semantic tokens as inline CSS custom properties. */
export function applyPalette(target: HTMLElement, name: string): PaletteStyleCleanup {
  const palette = getPalette(name);
  if (!palette) throw new TypeError(`Unknown palette "${name}"`);
  return createPaletteApplication(target, palette, false);
}

/** Apply the active palette, optionally following later active-palette changes. */
export function applyActivePalette(
  target: HTMLElement,
  options: ApplyActivePaletteOptions = {},
): PaletteStyleCleanup {
  if (options === null || typeof options !== "object" || Array.isArray(options)) {
    throw new TypeError("Active palette options must be an object");
  }
  if (options.subscribe !== undefined && typeof options.subscribe !== "boolean") {
    throw new TypeError("Active palette subscribe option must be a boolean");
  }
  return createPaletteApplication(target, getActivePalette(), options.subscribe === true);
}
