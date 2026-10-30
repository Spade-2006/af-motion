import type { AnimateTarget } from "../core/animate.js";
export type ScrollVelocityDirection = "up" | "down" | "idle";
export interface ScrollVelocityData {
    /** Smoothed scroll velocity in pixels per second. */
    velocity: number;
    /** Direction of the latest scroll movement, or "idle" when position is unchanged. */
    direction: ScrollVelocityDirection;
    /** Current scroll position in pixels. */
    position: number;
    /** Current normalized scroll position from 0 to 1. */
    progress: number;
}
export interface ScrollVelocityOptions {
    /** Fraction of the previous velocity retained per update, from 0 (no smoothing) to 1 (maximum smoothing). Defaults to 0.2. */
    smoothing?: number;
    /** Window, an element, or a selector resolving to exactly one scrollable element. Defaults to window. */
    target?: Window | AnimateTarget;
    /** Receives scroll measurements after each scheduled update and the initial state. */
    onUpdate: (data: ScrollVelocityData) => void;
}
export interface ScrollVelocityControls {
    /** Cancels pending measurements and removes listeners. Safe to call repeatedly. */
    destroy(): void;
}
/**
 * Tracks scroll direction, normalized progress, and smoothed velocity in px/s.
 * Scroll events are passively observed and measurements are batched through requestAnimationFrame.
 */
export declare function scrollVelocity(options: ScrollVelocityOptions): ScrollVelocityControls;
//# sourceMappingURL=scroll-velocity.d.ts.map