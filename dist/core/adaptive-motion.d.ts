import type { MotionDNA, MotionDNAOverrides } from "./motion-dna.js";
export type AdaptiveReducedMotion = "respect" | "ignore";
export interface AdaptiveMotionProfile extends MotionDNAOverrides {
    /** Optional Motion DNA identity used as the timing/easing baseline. */
    motionDNA?: string;
    /** Motion intensity from above zero to 1; lower values lengthen animation duration. Defaults to 1. */
    intensity?: number;
    /** Intensity used when `conditions.lowPower` is true. Defaults to `intensity`. */
    lowPowerIntensity?: number;
    /** How an explicitly reduced-motion condition affects compatible animation options. Defaults to "respect". */
    reducedMotion?: AdaptiveReducedMotion;
}
export interface AdaptiveMotionConditions {
    /** Explicit reduced-motion condition supplied by the caller. */
    reducedMotion?: boolean;
    /** Explicit low-power condition supplied by the caller. */
    lowPower?: boolean;
    /** Per-resolution intensity override. Takes precedence over profile intensity values. */
    intensity?: number;
}
export type AdaptiveMotionOverrides = MotionDNAOverrides;
/**
 * Resolves a deterministic animation-option snapshot from a profile and caller-supplied conditions.
 * The returned options are suitable for existing animation APIs; no media queries or monitoring are created.
 */
export declare function resolveAdaptiveMotion(profile: AdaptiveMotionProfile, conditions?: AdaptiveMotionConditions, overrides?: AdaptiveMotionOverrides): MotionDNA;
//# sourceMappingURL=adaptive-motion.d.ts.map