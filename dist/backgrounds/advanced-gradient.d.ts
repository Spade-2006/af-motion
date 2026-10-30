import type { AnimateTarget } from "../core/animate.js";
export type AdvancedGradientType = "mesh" | "aurora" | "radial" | "conic";
export interface AdvancedGradientOptions {
    /** Visual gradient treatment. Defaults to "mesh". */
    type?: AdvancedGradientType;
    /** CSS colors used when no palette is selected. Defaults to violet, cyan, and pink. */
    colors?: readonly string[];
    /** Registered palette name, or "active" to use and follow the current active palette. */
    palette?: string | "active";
    /** Mesh/aurora animation cycle duration in seconds. Use 0 for a static gradient. Defaults to 12. */
    speed?: number;
    /** Gradient strength from 0 to 1. Defaults to 0.65. */
    intensity?: number;
    /** Gradient direction in degrees. Defaults to 135. */
    direction?: number;
    /** Overlay opacity from 0 to 1. Defaults to 0.8. */
    opacity?: number;
    /** Optional class applied to every generated overlay. */
    className?: string;
    /** Additional inline CSS declarations applied to every generated overlay. */
    style?: Readonly<Record<string, string>>;
}
export interface AdvancedGradientControls {
    /** Removes the overlay and releases styles, listeners, and generated keyframes. Safe to repeat. */
    destroy(): void;
}
/**
 * Adds a configurable animated gradient overlay behind target content.
 * Mesh and aurora types animate softly; radial and conic types use a static gradient.
 * Reduced-motion preferences disable animation while retaining the rendered background.
 */
export declare function advancedGradientBackground(target: AnimateTarget, options?: AdvancedGradientOptions): AdvancedGradientControls;
//# sourceMappingURL=advanced-gradient.d.ts.map