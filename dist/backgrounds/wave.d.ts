import type { AnimateTarget } from "../core/animate.js";
export interface WaveBackgroundOptions {
    /** CSS colors filled by the waves. Defaults to violet and cyan. */
    colors?: readonly string[];
    /** Vertical wave height in SVG units. Must be >= 0. Defaults to 30. */
    amplitude?: number;
    /** Number of wave cycles across the SVG width. Must be > 0 and <= 100. Defaults to 2. */
    frequency?: number;
    /** Duration of one animation cycle in seconds. Set to 0 for static waves. Defaults to 8. */
    speed?: number;
    /** Overlay opacity between 0 and 1. Defaults to 0.6. */
    opacity?: number;
}
export interface WaveBackgroundControls {
    /** Removes the waves, keyframes and temporary target styles. Safe to repeat. */
    destroy(): void;
}
/**
 * Adds responsive SVG waves behind target content. Positive speed animates with CSS keyframes;
 * zero speed or a reduced-motion preference keeps the waves static.
 */
export declare function waveBackground(target: AnimateTarget, options?: WaveBackgroundOptions): WaveBackgroundControls;
//# sourceMappingURL=wave.d.ts.map