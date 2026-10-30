import type { AnimateTarget } from "../core/animate.js";
export type SplitTextMode = "characters" | "words" | "lines";
export interface SplitTextOptions {
    /** Units to wrap. Defaults to "words". */
    by?: SplitTextMode;
    /** Base class applied to every generated span. Defaults to "af-split". */
    className?: string;
}
export interface SplitTextControls {
    /** Restores the exact original child nodes and removes resize listeners/observers. Safe to repeat. */
    destroy(): void;
}
/**
 * Wraps characters, words, or rendered lines in spans while preserving the original DOM tree.
 * Line mode groups words by their rendered top coordinate and updates after target resizes.
 */
export declare function splitText(target: AnimateTarget, options?: SplitTextOptions): SplitTextControls;
//# sourceMappingURL=split-text.d.ts.map