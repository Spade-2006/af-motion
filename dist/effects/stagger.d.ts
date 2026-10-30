import type { AnimatableProperties, AnimateTarget, DOMAnimationOptions } from "../core/animate.js";
import type { AnimationControls, EasingFunction } from "../core/animation.js";
export type StaggerFrom = "first" | "last";
export interface StaggerElementAnimation {
    /** Element-specific property ranges; defaults to `StaggerOptions.properties`. */
    properties?: AnimatableProperties;
    /** Per-element overrides; delay is added to the stagger offset. */
    options?: DOMAnimationOptions;
}
export interface StaggerOptions {
    /** `[from, to]` pairs passed to `animate()`. Defaults to a fade-and-rise. */
    properties?: AnimatableProperties;
    /** Per-element duration in milliseconds. Defaults to 600. */
    duration?: number;
    /** Delay before the first element starts, in milliseconds. Defaults to 0. */
    delay?: number;
    /** Extra delay between consecutive elements, in milliseconds. Defaults to 100. */
    stagger?: number;
    /** Which end of the target list starts first. Defaults to "first". */
    from?: StaggerFrom;
    /** Supplies animation properties and options for each element before it starts. */
    configure?: (element: HTMLElement, index: number, order: number) => StaggerElementAnimation | void;
    easing?: EasingFunction;
    /** Playback speed multiplier. Defaults to 1. */
    playbackRate?: number;
    /** Fires once, after every element has finished. Never fires after `cancel()`. */
    onComplete?: () => void;
    /** Forwarded to `animate()`; reduced motion makes all elements jump to their final state. */
    respectReducedMotion?: boolean;
}
export type StaggerControls = AnimationControls;
/**
 * Animates each target element with `animate()`, offsetting every element's delay by
 * `stagger` ms per position. No timers are used: the offset is the engine's own `delay`.
 *
 * - Elements are put in their `from` state immediately, so they don't flash before their turn.
 * - Validation matches `animate()`: invalid selectors, targets, properties, duration and
 *   delay throw before anything is animated. `stagger` must be a finite number >= 0 and
 *   `from` must be "first" or "last" (`RangeError` / `TypeError` respectively).
 * - A target matching no elements returns inert controls.
 * - Playback controls apply to every child animation; `cancel()` is safe to call repeatedly.
 */
export declare function stagger(target: AnimateTarget, options?: StaggerOptions): StaggerControls;
//# sourceMappingURL=stagger.d.ts.map