import type { AnimateTarget } from "../core/animate.js";
import type { AnimationControls, AnimationOptions } from "../core/animation.js";
export interface DrawSVGOptions extends AnimationOptions {
    /** Extra delay between paths, in milliseconds. Defaults to 0. */
    stagger?: number;
    /** Starts fully drawn and animates to the undrawn state. Defaults to false. */
    reverse?: boolean;
}
export interface DrawSVGControls extends AnimationControls {
    /** Cancels active path animations and restores original dash attributes and styles. */
    destroy(): void;
}
/**
 * Draws SVG paths by animating their stroke dash offset through the shared animation engine.
 *
 * A path or SVG container target is accepted; a selector may match paths or containers.
 * `destroy()` is idempotent and restores each path's original dash attributes and inline styles.
 */
export declare function drawSVG(target: AnimateTarget, options?: DrawSVGOptions): DrawSVGControls;
//# sourceMappingURL=draw-svg.d.ts.map