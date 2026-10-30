import type { AnimatableProperties, AnimateTarget } from "../core/animate.js";
import type { EasingFunction } from "../core/animation.js";
export interface RevealOptions {
    /** `[from, to]` pairs passed to `animate()`. Defaults to a fade-and-rise. */
    properties?: AnimatableProperties;
    /** Duration in milliseconds. Defaults to 600. */
    duration?: number;
    /** Delay in milliseconds. Defaults to 0. */
    delay?: number;
    easing?: EasingFunction;
    /** IntersectionObserver threshold (0..1 or a list). Defaults to 0.15. */
    threshold?: number | number[];
    /** IntersectionObserver rootMargin. Defaults to "0px". */
    rootMargin?: string;
    /** Animate each element only the first time it is revealed. Defaults to true. */
    once?: boolean;
}
export interface RevealControls {
    /** Disconnects the observer and cancels running animations. Safe to call repeatedly. */
    destroy(): void;
}
/**
 * Animates elements the first time (or every time, with `once: false`) they scroll into view.
 *
 * - Elements are put in their `from` state immediately so they don't flash before
 *   being revealed. With reduced motion, `animate()` skips this and content stays visible,
 *   then jumps to its final state when revealed.
 * - Options and properties are validated up front; errors are thrown synchronously
 *   from `reveal()` rather than later inside an observer callback.
 * - Throws `Error` if `IntersectionObserver` is unavailable.
 * - A target matching no elements returns inert controls.
 */
export declare function reveal(target: AnimateTarget, options?: RevealOptions): RevealControls;
//# sourceMappingURL=reveal.d.ts.map