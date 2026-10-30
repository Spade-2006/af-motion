import type { AnimationControls, AnimationOptions } from "./animation.js";
/** A single element, or a CSS selector resolved with `document.querySelectorAll`. */
export type AnimateTarget = HTMLElement | SVGElement | string;
export type AnimationValue = string | number;
/**
 * Maps CSS property names (camelCase, kebab-case or `--custom`) to `[from, to]`.
 *
 * Interpolation rules:
 * - Compatible numeric values are interpolated only when their surrounding
 *   CSS syntax and units match (e.g. `"10px"` -> `"20px"`,
 *   `"translateY(24px)"` -> `"translateY(0px)"`).
 * - Compatible `rgb()`/`rgba()` values interpolate their color channels.
 * - Otherwise (e.g. `"red"` -> `"blue"`, `"10px"` -> `"2em"`, `"none"` -> `"block"`)
 *   the value cannot be interpolated: `from` is used until the eased progress
 *   reaches 1, then `to` is applied.
 */
export type AnimatableProperties = Record<string, readonly [AnimationValue, AnimationValue]>;
export interface DOMAnimationOptions extends AnimationOptions {
    /**
     * When true (default) and the user prefers reduced motion, the animation
     * jumps to its final values on the next frame, ignoring delay and duration.
     * `onComplete` still fires.
     */
    respectReducedMotion?: boolean;
}
export declare function toCssName(name: string): string;
export declare function resolveTargets(target: AnimateTarget): HTMLElement[];
/**
 * Animates CSS properties of HTML elements and attributes of SVG elements.
 *
 * - Only the listed properties are written (via `style.setProperty`); other inline
 *   styles are untouched.
 * - `from` values are applied synchronously (unless reduced motion applies), so
 *   delayed animations start from the correct state.
 * - On completion the exact `to` values remain. On `cancel()` the current values stay.
 * - A selector that matches no animatable element is not an error: nothing is animated,
 *   no callbacks fire, and no-op controls are returned.
 * - `repeat` replays the animation the requested number of additional times; `Infinity` loops forever.
 * - `yoyo` reverses direction at each repeat boundary.
 * - Throws `SyntaxError` for an invalid selector, and `TypeError` for an invalid
 *   target or property definition. Invalid duration/delay throw `RangeError`.
 */
export declare function animate(target: AnimateTarget, properties: AnimatableProperties, options?: DOMAnimationOptions): AnimationControls;
//# sourceMappingURL=animate.d.ts.map