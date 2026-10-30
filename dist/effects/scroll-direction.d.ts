import type { AnimateTarget } from "../core/animate.js";
export type ScrollDirection = "up" | "down" | "idle";
export interface ScrollDirectionOptions {
    /** Minimum accumulated scroll movement in pixels before changing direction. Defaults to 12. */
    threshold?: number;
    /** Window, an element, or a selector resolving to exactly one scrollable element. Defaults to window. */
    target?: Window | AnimateTarget;
    /** Called only when the detected direction changes. */
    onChange: (direction: ScrollDirection) => void;
}
export interface ScrollDirectionControls {
    /** Cancels a pending measurement and removes the scroll listener. Safe to call repeatedly. */
    destroy(): void;
}
/**
 * Detects scroll direction only after movement crosses a pixel threshold.
 * Passive events are batched into one animation frame, and no animation is created.
 */
export declare function scrollDirection(options: ScrollDirectionOptions): ScrollDirectionControls;
//# sourceMappingURL=scroll-direction.d.ts.map