import type { AnimateTarget } from "../core/animate.js";
export type EnergyBackgroundEffect = "lightning" | "plasma-field" | "laser-beams" | "energy-pulse" | "electric-arcs";
export interface EnergyBackgroundBaseOptions {
    /** Visual treatment. Defaults to "lightning". */
    effect?: EnergyBackgroundEffect;
    /** CSS colors for the effect, or palette primary/secondary/accent colors. */
    colors?: readonly string[];
    /** Registered built-in/custom palette name, or "active" to follow active palette changes. */
    palette?: string;
    /** Animation speed multiplier. Set to 0 for a static scene. Defaults to 1. */
    speed?: number;
    /** Overall effect intensity from 0 to 1. Defaults to 0.75. */
    intensity?: number;
}
export interface LightningOptions extends EnergyBackgroundBaseOptions {
    effect?: "lightning";
    /** Electrical strikes per minute. Defaults to 12. */
    frequency?: number;
    /** Branches per bolt from 0 to 12. Defaults to 4. */
    branchCount?: number;
    /** Bolt brightness from 0 to 1. Defaults to 1. */
    brightness?: number;
}
export interface PlasmaFieldOptions extends EnergyBackgroundBaseOptions {
    effect: "plasma-field";
    /** Number of flowing colour formations from 2 to 10. Defaults to 5. */
    formationCount?: number;
    /** Formation scale relative to the canvas from 0.1 to 1. Defaults to 0.55. */
    scale?: number;
}
export interface LaserBeamsOptions extends EnergyBackgroundBaseOptions {
    effect: "laser-beams";
    /** Number of beams from 1 to 32. Defaults to 8. */
    count?: number;
    /** Beam angle in degrees from -80 to 80. Defaults to -12. */
    angle?: number;
    /** Glow radius in CSS pixels from 0 to 80. Defaults to 18. */
    glow?: number;
    /** Beam width in CSS pixels from 0.25 to 12. Defaults to 2. */
    width?: number;
    /** Maximum beam sweep in degrees from 0 to 45. Defaults to 8. */
    movement?: number;
}
export interface EnergyPulseOptions extends EnergyBackgroundBaseOptions {
    effect: "energy-pulse";
    /** Normalized pulse origin within the target. Defaults to { x: 0.5, y: 0.5 }. */
    origin?: Readonly<{
        x: number;
        y: number;
    }>;
    /** Seconds between expanding pulses. Defaults to 1.8. */
    interval?: number;
    /** Ring expansion speed in CSS pixels per second. Defaults to 220. */
    pulseSpeed?: number;
    /** Ring line width in CSS pixels. Defaults to 3. */
    width?: number;
}
export interface ElectricArcsOptions extends EnergyBackgroundBaseOptions {
    effect: "electric-arcs";
    /** Arc paths per 10,000 CSS square pixels, capped at 64 per target. Defaults to 8. */
    density?: number;
    /** Arc flicker intensity from 0 to 1. Defaults to 0.65. */
    flicker?: number;
    /** Branches per arc from 0 to 8. Defaults to 2. */
    branchCount?: number;
    /** Arc stroke width in CSS pixels. Defaults to 1.5. */
    width?: number;
}
export type EnergyBackgroundOptions = LightningOptions | PlasmaFieldOptions | LaserBeamsOptions | EnergyPulseOptions | ElectricArcsOptions | EnergyBackgroundBaseOptions;
export interface EnergyBackgroundControls {
    /** Stops animation, removes the canvas, and restores target styles. Safe to repeat. */
    destroy(): void;
}
/**
 * Renders Canvas energy effects with bounded path/gradient work and shared
 * palette-aware, responsive, reduced-motion-safe lifecycle management.
 */
export declare function energyBackground(target: AnimateTarget, options?: EnergyBackgroundOptions): EnergyBackgroundControls;
//# sourceMappingURL=energy-effects.d.ts.map