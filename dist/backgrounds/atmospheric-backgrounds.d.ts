import type { AnimateTarget } from "../core/animate.js";
export type AtmosphericBackgroundEffect = "aurora" | "fog" | "rainfall" | "snowfall" | "sunbeams";
export type AtmosphericDirection = "left" | "right";
export interface AtmosphericBackgroundBaseOptions {
    /** Visual treatment. Defaults to "aurora". */
    effect?: AtmosphericBackgroundEffect;
    /** CSS colors for the effect, or palette primary/secondary/accent colors. */
    colors?: readonly string[];
    /** Registered built-in/custom palette name, or "active" to follow active palette changes. */
    palette?: string;
    /** Animation speed multiplier. Must be greater than 0. Defaults to 1. */
    speed?: number;
    /** Overall visual intensity from 0 to 1. Defaults to 0.7. */
    intensity?: number;
}
export interface AuroraBorealisOptions extends AtmosphericBackgroundBaseOptions {
    effect?: "aurora";
    /** Number of flowing gradient ribbons from 1 to 8. Defaults to 4. */
    waveCount?: number;
    /** Gradient softness in pixels. Defaults to 60. */
    softness?: number;
}
export interface FogMistOptions extends AtmosphericBackgroundBaseOptions {
    effect: "fog";
    /** Number of drifting fog banks from 1 to 16. Defaults to 6. */
    density?: number;
    /** Fog edge softness from 0 to 1. Defaults to 0.85. */
    softness?: number;
    /** Horizontal fog drift direction. Defaults to "right". */
    direction?: AtmosphericDirection;
}
export interface RainfallOptions extends AtmosphericBackgroundBaseOptions {
    effect: "rainfall";
    /** Raindrops per 10,000 CSS square pixels. Capped at 3,000 drops per target. Defaults to 18. */
    density?: number;
    /** Rain speed in CSS pixels per second. Defaults to 560. */
    dropSpeed?: number;
    /** Rain angle in degrees from vertical, between -60 and 60. Defaults to 8. */
    angle?: number;
    /** Streak length in CSS pixels. Defaults to 16. */
    streakLength?: number;
    /** Adds a subtle glow at the lower edge. Defaults to false. */
    surfaceGlow?: boolean;
}
export interface SnowfallOptions extends AtmosphericBackgroundBaseOptions {
    effect: "snowfall";
    /** Snowflakes per 10,000 CSS square pixels. Capped at 1,800 flakes per target. Defaults to 12. */
    density?: number;
    /** Snowflake radius range in CSS pixels. Defaults to 3. */
    size?: number;
    /** Falling speed in CSS pixels per second. Defaults to 48. */
    fallSpeed?: number;
    /** Horizontal wind offset in CSS pixels per second. Defaults to 8. */
    wind?: number;
    /** Side-to-side drift amplitude in CSS pixels. Defaults to 12. */
    drift?: number;
}
export interface SunbeamsOptions extends AtmosphericBackgroundBaseOptions {
    effect: "sunbeams";
    /** Normalized light origin within the target. Defaults to { x: 0.5, y: 0.05 }. */
    origin?: Readonly<{
        x: number;
        y: number;
    }>;
    /** Angular spread of the light rays in degrees, from 5 to 120. Defaults to 48. */
    spread?: number;
    /** Animated sway amount in degrees, from 0 to 30. Defaults to 5. */
    movement?: number;
}
export type AtmosphericBackgroundOptions = AuroraBorealisOptions | FogMistOptions | RainfallOptions | SnowfallOptions | SunbeamsOptions | AtmosphericBackgroundBaseOptions;
export interface AtmosphericBackgroundControls {
    /** Stops animation, removes the effect, and restores target styles. Safe to repeat. */
    destroy(): void;
}
/**
 * Adds aurora, fog, rain, snow, or sunbeam ambience. Aurora delegates to the
 * existing aurora effect; the Canvas effects share responsive motion-aware cleanup.
 */
export declare function atmosphericBackground(target: AnimateTarget, options?: AtmosphericBackgroundOptions): AtmosphericBackgroundControls;
//# sourceMappingURL=atmospheric-backgrounds.d.ts.map