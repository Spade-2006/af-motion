import type { AnimateTarget } from "../core/animate.js";
import type { EasingFunction } from "../core/animation.js";
export interface TiltOptions {
    /** Maximum rotation per axis in degrees, reached at the element's edge. Defaults to 10. */
    maxTilt?: number;
    /** Perspective distance in pixels. Must be > 0. Defaults to 800. */
    perspective?: number;
    /** Scale while hovered. Must be > 0. Defaults to 1.02. */
    scale?: number;
    /** Duration of each tilt/reset tween in milliseconds. Defaults to 300. */
    speed?: number;
    /** Defaults to `easings.easeOutCubic`. */
    easing?: EasingFunction;
}
export interface TiltControls {
    /** Removes listeners, cancels animations and restores original styles. Safe to call repeatedly. */
    destroy(): void;
}
/**
 * Tilts elements in 3D toward the cursor while it hovers them, then settles back.
 *
 * - Rotation is proportional to the cursor's offset from the element's center, normalised by
 *   half the element's size and clamped to [-1, 1]: `rotateY = x * maxTilt`, `rotateX = -y * maxTilt`.
 *   Hovering the element's top edge therefore tilts its top away from the viewer.
 * - Perspective is applied through the transform itself (`<base> perspective(Npx) rotateX() rotateY()
 *   scale()`, composed with other effects via shared transform layers), so no parent or perspective-related style is written, and `transform-origin`,
 *   `transform-style` and every other style are left untouched.
 * - The base is the inline transform, or the computed one when no inline transform is set.
 *   When a hover ends the original inline transform is restored exactly (or removed if there was
 *   none); `destroy()` does the same immediately.
 * - The element is measured once when a hover begins (not on moves or frames, and not when
 *   re-entering while still settling back). Each element runs at most one tween at a time; a new
 *   pointer position replaces it, starting from the current values, and an unchanged target is ignored.
 * - Reduced motion (checked on every pointer event and watched via `matchMedia` change events)
 *   disables the effect and immediately restores the neutral state. Touch pointers are ignored,
 *   and `pointercancel` behaves like `pointerleave`.
 * - Throws `RangeError` for invalid numbers, `TypeError` for a non-function easing, and the same
 *   selector/target errors as `animate()`. A target matching no elements returns inert controls.
 */
export declare function tilt(target: AnimateTarget, options?: TiltOptions): TiltControls;
//# sourceMappingURL=tilt.d.ts.map