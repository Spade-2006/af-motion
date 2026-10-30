import type { AnimateTarget, AnimationValue, DOMAnimationOptions } from "./animate.js";
import type { MotionDNAOverrides } from "./motion-dna.js";
export interface MotionStateDefinition {
    /** CSS property values that define this state. */
    readonly values: Readonly<Record<string, AnimationValue>>;
    /** Per-state animation options. */
    readonly options?: DOMAnimationOptions;
    /** Optional Motion DNA identity for transitions to this state. */
    readonly motionDNA?: {
        name: string;
        overrides?: MotionDNAOverrides;
    };
}
export type MotionStateDefinitions = Readonly<Record<string, MotionStateDefinition>>;
export interface MotionStateTransitionOptions extends DOMAnimationOptions {
    /** Optional Motion DNA identity applied to this transition. */
    motionDNA?: {
        name: string;
        overrides?: MotionDNAOverrides;
    };
}
export interface MotionStateTransitionControls {
    readonly finished: Promise<void>;
    cancel(): void;
}
export interface MotionStateControls {
    readonly currentState: string | undefined;
    /** Transitions from the currently rendered styles to a named state. */
    transitionTo(name: string, options?: MotionStateTransitionOptions): MotionStateTransitionControls;
    /** Cancels an active transition, restores styles captured at creation, and destroys the controller. */
    destroy(): void;
}
/**
 * Creates a named visual-state controller. Each transition starts at the current rendered CSS
 * value and delegates interpolation, reduced-motion handling, and scheduling to `animate()`.
 */
export declare function createMotionStates(target: AnimateTarget, definitions: MotionStateDefinitions, options?: {
    initialState?: string;
    motionDNA?: {
        name: string;
        overrides?: MotionDNAOverrides;
    };
}): MotionStateControls;
//# sourceMappingURL=motion-states.d.ts.map