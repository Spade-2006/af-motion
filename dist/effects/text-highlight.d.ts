import type { AnimateTarget } from "../core/animate.js";
export type TextHighlightStyle = "marker" | "underline" | "box";
export type TextHighlightTrigger = "scroll" | "immediate";
export interface TextHighlightOptions {
    /** Highlight appearance. Defaults to "marker". */
    style?: TextHighlightStyle;
    /** CSS color for the highlight. Defaults to lime. */
    color?: string;
    /** Drawing duration in milliseconds. Must be >= 0. Defaults to 700. */
    duration?: number;
    /** Start immediately or when the target enters the viewport. Defaults to "immediate". */
    trigger?: TextHighlightTrigger;
}
export interface TextHighlightControls {
    /** Disconnects observers, cancels pending frames and restores the original child nodes. Safe to repeat. */
    destroy(): void;
}
/**
 * Reveals a marker, underline, or box behind existing text without replacing its content.
 * An inline wrapper is removed on destroy, restoring the original child nodes.
 */
export declare function textHighlight(target: AnimateTarget, options?: TextHighlightOptions): TextHighlightControls;
//# sourceMappingURL=text-highlight.d.ts.map