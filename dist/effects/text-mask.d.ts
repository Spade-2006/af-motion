import type { EasingFunction } from "../core/animation.js";
import type { AnimateTarget } from "../core/animate.js";
export type TextMaskDirection = "up" | "down" | "left" | "right";
export type TextMaskTrigger = "scroll" | "immediate";
export interface TextMaskOptions {
    /** Reveal duration in milliseconds. Defaults to 900. */
    duration?: number;
    /** CSS timing function or progress easing function. Defaults to "ease". */
    easing?: string | EasingFunction;
    /** Direction the clipping edge moves as the text is revealed. Defaults to "up". */
    direction?: TextMaskDirection;
    /** Color of the masked overlay. Defaults to transparent. */
    color?: string;
    /** Start immediately or when each target enters the viewport. Defaults to "immediate". */
    trigger?: TextMaskTrigger;
}
export interface TextMaskControls {
    /** Cancels pending transitions, disconnects observers, and restores the original DOM. Safe to repeat. */
    destroy(): void;
}
/**
 * Reveals existing text through a directional CSS clip mask without replacing its content.
 * The temporary wrapper is removed on destroy, restoring the original child nodes.
 */
export declare function textMask(target: AnimateTarget, options?: TextMaskOptions): TextMaskControls;
//# sourceMappingURL=text-mask.d.ts.map