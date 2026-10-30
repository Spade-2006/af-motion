import type { AnimateTarget } from "../core/animate.js";
export interface BorderBeamOptions {
    /** Beam color. Defaults to violet. */
    color?: string;
    /** Angular width of the travelling beam in degrees. Must be in (0, 360]. Defaults to 120. */
    size?: number;
    /** Animation duration in milliseconds. Must be > 0. Defaults to 3000. */
    duration?: number;
    /** Border thickness in pixels. Must be > 0. Defaults to 1. */
    borderWidth?: number;
    /** Border corner radius in pixels. Must be >= 0. Defaults to 16. */
    radius?: number;
    /** Starts the beam paused. Defaults to false. */
    paused?: boolean;
}
export interface BorderBeamControls {
    /** Pauses the travelling beam. Safe to call repeatedly. */
    pause(): void;
    /** Resumes the travelling beam unless reduced motion is preferred. Safe to call repeatedly. */
    resume(): void;
    /** Removes the beam and restores target styles. Safe to call repeatedly. */
    destroy(): void;
}
/**
 * Adds a glowing border beam behind target content. The beam uses the Web Animations API,
 * and falls back to a subtle static border when reduced motion is enabled.
 */
export declare function borderBeam(target: AnimateTarget, options?: BorderBeamOptions): BorderBeamControls;
//# sourceMappingURL=border-beam.d.ts.map