import type { SemanticColorToken } from "./palettes.js";
/** CSS custom properties use the stable `--af-motion-color-<token>` naming convention. */
export declare const PALETTE_CSS_VARIABLES: Readonly<Record<SemanticColorToken, string>>;
export interface ApplyActivePaletteOptions {
    /** Update the element whenever the active palette changes. */
    readonly subscribe?: boolean;
}
export type PaletteStyleCleanup = () => void;
/** Apply a registered palette's semantic tokens as inline CSS custom properties. */
export declare function applyPalette(target: HTMLElement, name: string): PaletteStyleCleanup;
/** Apply the active palette, optionally following later active-palette changes. */
export declare function applyActivePalette(target: HTMLElement, options?: ApplyActivePaletteOptions): PaletteStyleCleanup;
//# sourceMappingURL=palette-styles.d.ts.map