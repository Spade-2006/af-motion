import type { ComposableEffect } from "./effect-composer.js";
import type { AnimatableProperties, AnimateTarget, DOMAnimationOptions } from "./animate.js";
import type { MotionDNAOverrides } from "./motion-dna.js";
export interface MotionChoreographyAnimation {
    type: "animation";
    target: AnimateTarget;
    properties: AnimatableProperties;
    options?: DOMAnimationOptions;
    motionDNA?: {
        name: string;
        overrides?: MotionDNAOverrides;
    };
}
export interface MotionChoreographyEffect {
    type: "effect";
    effect: ComposableEffect;
}
export interface MotionChoreographyParallel {
    type: "parallel";
    actions: readonly (MotionChoreographyAnimation | MotionChoreographyEffect)[];
}
export interface MotionChoreographyBranch {
    type: "branch";
    /** Evaluated when this action is reached; may read caller-owned state. */
    condition: () => boolean;
    then: readonly MotionChoreographyAction[];
    else?: readonly MotionChoreographyAction[];
}
export type MotionChoreographyAction = MotionChoreographyAnimation | MotionChoreographyParallel | MotionChoreographyBranch;
export interface MotionChoreographyControls {
    /** Resolves when all choreography actions complete; rejects on failure or cancellation. */
    readonly finished: Promise<void>;
    pause(): void;
    resume(): void;
    /** Cancels active animations and cleans up active effects. Safe to repeat. */
    cancel(): void;
}
/** Runs ordered animations, conditional branches, and effect/animation parallel groups. */
export declare function createMotionChoreography(definition: readonly MotionChoreographyAction[]): MotionChoreographyControls;
//# sourceMappingURL=motion-choreography.d.ts.map