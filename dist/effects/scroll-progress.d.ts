import type { AnimateTarget } from "../core/animate.js";
export type ScrollProgressPosition = "top" | "bottom";
export interface ScrollProgressOptions {
    /** Viewport edge for the fixed bar. Defaults to "top". */
    position?: ScrollProgressPosition;
    /** Bar color. Defaults to violet. */
    color?: string;
    /** Bar thickness in pixels. Must be > 0. Defaults to 3. */
    height?: number;
    /** CSS transition smoothing duration in seconds. Must be between 0 and 2. Defaults to 0.15. */
    smoothing?: number;
    /** Alias for smoothing, matching the original API example. */
    easing?: number;
    /** Scrollable element (or selector resolving to exactly one element) to track instead of the page. */
    target?: AnimateTarget;
    /** Called when the measured normalized scroll progress changes. */
    onUpdate?: (progress: number) => void;
}
export interface ScrollProgressControls {
    /** Returns the latest measured normalized scroll progress. */
    getProgress(): number;
    /** Cancels pending updates, removes listeners and the generated bar. Safe to repeat. */
    destroy(): void;
}
/**
 * Displays page or element scroll progress in a fixed bar. Scroll/resize events are batched
 * into at most one animation frame; reduced motion updates the bar immediately.
 */
export declare function scrollProgress(options?: ScrollProgressOptions): ScrollProgressControls;
//# sourceMappingURL=scroll-progress.d.ts.map