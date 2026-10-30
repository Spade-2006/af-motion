import type { AnimateTarget } from "../core/animate.js";
import type { EasingFunction } from "../core/animation.js";
export type ParallaxAxis = "x" | "y";
export interface ParallaxOptions {
    /**
     * Fraction of the element's distance from the viewport center that is added as a translation.
     * Positive values make the layer move slower than the page, negative values faster. May be 0.
     * Defaults to 0.3.
     */
    speed?: number;
    /** Axis to translate along. Defaults to "y". */
    axis?: ParallaxAxis;
    /** Maximum absolute translation in pixels. Must be >= 0. Defaults to 100. */
    maxOffset?: number;
    /** Shapes the clamped offset: `easing(|offset| / maxOffset)`. Defaults to linear. */
    easing?: EasingFunction;
}
export interface ParallaxControls {
    /** Removes listeners, cancels the pending frame and restores original transforms. Safe to call repeatedly. */
    destroy(): void;
}
/**
 * Moves elements along one axis as the page scrolls, relative to the viewport center.
 *
 * - An element's offset is `-(elementCenter - viewportCenter) * speed`, clamped to `maxOffset` and
 *   shaped by `easing`. It is 0 when the element is centered in the viewport.
 * - One passive `scroll` listener and one `requestAnimationFrame` serve every element; at most one
 *   frame is pending, and nothing runs while the page is idle.
 * - Layout is read only when the effect starts, on `resize`, and when reduced motion is turned
 *   back off - never on scroll. Each element's resting position is cached in page coordinates
 *   (measured with its original transform in place), so scroll frames are pure arithmetic.
 *   Layout shifts that don't fire `resize` are not noticed until the next resize.
 * - Styles are written only when the rounded offset changes. The effect writes only `transform`,
 *   as `<original> translate(x, y)`, where the original is the inline transform, or the computed
 *   transform when no inline one is set. An element that never needs to move is never written to.
 * - Reduced motion (checked every frame and watched through `matchMedia` change events) restores
 *   every original transform and keeps the effect inactive until the preference is turned off.
 * - Throws `Error` when `window` or `requestAnimationFrame` is unavailable, `RangeError` for invalid
 *   numbers, `TypeError` for an invalid axis or easing, and the same selector/target errors as
 *   `animate()`. A target matching no elements returns inert controls.
 */
export declare function parallax(target: AnimateTarget, options?: ParallaxOptions): ParallaxControls;
//# sourceMappingURL=parallax.d.ts.map