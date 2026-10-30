import type { MotionDNA, MotionDNAOverrides } from "./motion-dna.js";
export type EffectCompositionInstance = {
    destroy(): void;
    pause?(): void;
    resume?(): void;
} | {
    cancel(): void;
    pause?(): void;
    resume?(): void;
};
export interface EffectCompositionEntry {
    /** Starts an effect and returns its native cleanup controls. */
    start: () => EffectCompositionInstance;
    /** Effects without this field receive no Motion DNA options. */
    motionDNA?: never;
}
export interface MotionDNACompositionEntry {
    /** Starts an effect with resolved animation options from the named Motion DNA. */
    start: (options: MotionDNA) => EffectCompositionInstance;
    motionDNA: {
        name: string;
        overrides?: MotionDNAOverrides;
    };
}
export type ComposableEffect = EffectCompositionEntry | MotionDNACompositionEntry;
export interface EffectCompositionControls {
    /** Cleans up every effect in reverse start order. Safe to call repeatedly. */
    destroy(): void;
    /** Alias for destroy(). */
    cancel(): void;
    /** Pauses effects that expose a pause control; other effects continue unchanged. */
    pause(): void;
    /** Resumes effects that expose a resume control. */
    resume(): void;
}
/** Starts an ordered set of compatible effects and owns their shared cleanup. */
export declare function composeEffects(entries: readonly ComposableEffect[]): EffectCompositionControls;
//# sourceMappingURL=effect-composer.d.ts.map