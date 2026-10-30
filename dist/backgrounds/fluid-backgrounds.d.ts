import type { AnimateTarget } from "../core/animate.js";
export type FluidBackgroundEffect = "liquid-blobs" | "fluid-waves" | "liquid-gradient" | "ink-flow" | "metaballs";
export type FluidWaveDirection = "horizontal" | "vertical";
export interface FluidBackgroundBaseOptions {
    /** Visual treatment. Defaults to "liquid-blobs". */
    effect?: FluidBackgroundEffect;
    /** CSS colors for the effect, or palette primary/secondary/accent colors. */
    colors?: readonly string[];
    /** Registered built-in/custom palette name, or "active" to follow active palette changes. */
    palette?: string;
    /** Animation speed multiplier. Set to 0 for a static scene. Defaults to 1. */
    speed?: number;
    /** Overall effect intensity from 0 to 1. Defaults to 0.75. */
    intensity?: number;
}
export interface LiquidBlobsOptions extends FluidBackgroundBaseOptions {
    effect?: "liquid-blobs";
    /** Number of moving blobs from 1 to 32. Defaults to 5. */
    count?: number;
    /** Average blob radius in CSS pixels. Defaults to 100. */
    size?: number;
    /** Soft edge width in CSS pixels. Defaults to 32. */
    blur?: number;
}
export interface FluidWavesOptions extends FluidBackgroundBaseOptions {
    effect: "fluid-waves";
    /** Wave height in CSS pixels. Defaults to 36. */
    amplitude?: number;
    /** Number of wave cycles across the canvas. Defaults to 2.5. */
    frequency?: number;
    /** Axis along which the wave layers travel. Defaults to "horizontal". */
    direction?: FluidWaveDirection;
    /** Number of layered wave bands from 1 to 8. Defaults to 4. */
    layers?: number;
}
export interface LiquidGradientOptions extends FluidBackgroundBaseOptions {
    effect: "liquid-gradient";
    /** Number of softly blended color fields from 2 to 12. Defaults to 5. */
    count?: number;
    /** Field radius as a fraction of the canvas's longest side, from 0.1 to 1.5. Defaults to 0.65. */
    scale?: number;
}
export interface InkFlowOptions extends FluidBackgroundBaseOptions {
    effect: "ink-flow";
    /** Number of organic ink forms from 1 to 16. Defaults to 5. */
    count?: number;
    /** Average form radius in CSS pixels. Defaults to 80. */
    size?: number;
    /** Spread of each form as a fraction of the canvas, from 0.05 to 0.75. Defaults to 0.3. */
    spread?: number;
}
export interface MetaballsOptions extends FluidBackgroundBaseOptions {
    effect: "metaballs";
    /** Number of moving blobs from 1 to 24. Defaults to 6. */
    count?: number;
    /** Average blob radius in CSS pixels. Defaults to 64. */
    radius?: number;
    /** Link proximity multiplier from 1 to 4. Defaults to 1.8. */
    threshold?: number;
    /** Motion range multiplier from 0 to 2. Defaults to 1. */
    movement?: number;
}
export type FluidBackgroundOptions = LiquidBlobsOptions | FluidWavesOptions | LiquidGradientOptions | InkFlowOptions | MetaballsOptions | FluidBackgroundBaseOptions;
export interface FluidBackgroundControls {
    /** Stops animation, removes the canvas, and restores target styles. Safe to repeat. */
    destroy(): void;
}
/**
 * Draws efficient layered Canvas fluid effects without per-pixel simulation.
 * The API shares palette, resize, reduced-motion, visibility, and cleanup handling.
 */
export declare function fluidBackground(target: AnimateTarget, options?: FluidBackgroundOptions): FluidBackgroundControls;
//# sourceMappingURL=fluid-backgrounds.d.ts.map