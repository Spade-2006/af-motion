import type { AnimationOptions } from "./animation.js";
export type MotionDNA = Readonly<Pick<AnimationOptions, "duration" | "delay" | "playbackRate" | "respectReducedMotion" | "easing">>;
export type MotionDNAOverrides = Partial<MotionDNA>;
export interface MotionDNARegistryApi {
    /** Returns an immutable snapshot, or undefined when the name is unknown. */
    get(name: string): MotionDNA | undefined;
    /** Registers or replaces a named motion identity. */
    register(name: string, dna: MotionDNA): void;
    /** Removes a named motion identity. */
    remove(name: string): boolean;
}
export declare function getMotionDNA(name: string): MotionDNA | undefined;
export declare function registerMotionDNA(name: string, dna: MotionDNA): void;
export declare function removeMotionDNA(name: string): boolean;
/**
 * Resolves a registered motion identity with per-animation overrides.
 * The returned options are a fresh object and can be passed to any AF Motion API
 * accepting AnimationOptions or DOMAnimationOptions.
 */
export declare function applyMotionDNA(name: string, overrides?: MotionDNAOverrides): MotionDNA;
export declare const motionDNARegistry: Readonly<MotionDNARegistryApi>;
//# sourceMappingURL=motion-dna.d.ts.map