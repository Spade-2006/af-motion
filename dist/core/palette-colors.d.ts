export interface PaletteColorOptions {
    /** Registered built-in/custom palette to use, or "active" to follow activation changes. */
    palette?: string | "active";
    /** Explicit colors take precedence over palette colors. */
    colors?: readonly string[];
    /** Colors to use when no active palette is available. */
    fallback?: readonly string[];
}
export type PaletteColorsListener = (colors: readonly string[]) => void;
/** Resolves explicit colors or a registered palette into an immutable effect-ready color list. */
export declare function resolvePaletteColors(options: PaletteColorOptions): readonly string[];
/**
 * Subscribes to active-palette changes when `palette` is "active".
 * Named palettes and explicit color lists are static and return an inert unsubscribe function.
 */
export declare function subscribeToPaletteColors(options: PaletteColorOptions, listener: PaletteColorsListener): () => void;
//# sourceMappingURL=palette-colors.d.ts.map