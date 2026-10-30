import type { AnimationControls, AnimationOptions } from "../core/animation.js";
export type MorphSVGTarget = SVGElement | string;
export interface MorphSVGOptions extends AnimationOptions {
}
export interface MorphSVGControls extends AnimationControls {
    /** Cancels active morphs and restores each path's original `d` attribute. */
    destroy(): void;
}
/**
 * Morphs compatible SVG path data by interpolating matching command and number tokens.
 * Incompatible path structures are rejected instead of approximated.
 */
export declare function morphSVG(target: MorphSVGTarget, toPath: string, options?: MorphSVGOptions): MorphSVGControls;
//# sourceMappingURL=morph-svg.d.ts.map