import type { AnimateTarget } from "../core/animate.js";
import type { EasingFunction } from "../core/animation.js";
export interface MagneticOptions {
    /** Fraction of the cursor's distance from the element's center to follow. Defaults to 0.25. */
    strength?: number;
    /** Maximum translation per axis, in pixels. Defaults to 12. */
    maxTranslate?: number;
    /** Maximum pointer distance from the element center to apply attraction. Defaults to unlimited. */
    distance?: number;
    /** Duration of each movement tween in milliseconds. Defaults to 200. */
    duration?: number;
    /** Defaults to `easings.easeOutCubic`. */
    easing?: EasingFunction;
}
export interface MagneticControls {
    /** Removes listeners, cancels animations and restores original transforms. Safe to call repeatedly. */
    destroy(): void;
}
/**
 * Makes elements drift toward the cursor while it hovers them, then settle back.
 *
 * - The movement is appended to the element's existing transform (`<base> translate(x, y)`).
 *   The base is the inline transform, or the computed one when no inline transform is set
 *   (read once per hover, never per frame).
 * - The element's bounding box is measured once when the pointer enters. Pointer moves only
 *   do arithmetic and start a short tween from the current offset, so there are no layout
 *   reads per move or per frame. If the page scrolls or layout changes during a hover, the
 *   center is re-measured on the next enter.
 * - On leave the element tweens back to rest, then its original inline transform is restored
 *   exactly (or removed if there was none). Other inline styles are never touched.
 * - Reduced motion (checked on every pointer event) disables the effect entirely; an element
 *   that is mid-hover when the preference turns on settles back to rest. Touch pointers are ignored.
 * - Throws `RangeError` for invalid numbers, `TypeError` for a non-function easing, and the
 *   same selector/target errors as `animate()`. A target matching no elements returns inert controls.
 */
export declare function magnetic(target: AnimateTarget, options?: MagneticOptions): MagneticControls;
/** Alias for `magnetic()` with the same strength, translation, and distance options. */
export declare const magneticElement: typeof magnetic;
export type MagneticElementOptions = MagneticOptions;
export type MagneticElementControls = MagneticControls;
//# sourceMappingURL=magnetic.d.ts.map