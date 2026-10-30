import type { AnimatableProperties, AnimateTarget, DOMAnimationOptions } from "./animate.js";
export interface AnimationSequenceStep {
    /** Target for this step; may be the same target used by other steps. */
    target: AnimateTarget;
    /** Properties animated by this step. */
    properties: AnimatableProperties;
    /** Options passed to `animate()`. The step's onComplete runs before the next step starts. */
    options?: DOMAnimationOptions;
}
export interface AnimationSequenceOptions {
    /** Called once when the first step begins, after its delay. */
    onStart?: () => void;
    /** Called once after all steps have completed successfully. */
    onComplete?: () => void;
    /** Called once when the sequence is explicitly cancelled. */
    onCancel?: () => void;
}
export interface AnimationSequenceControls {
    /** Resolves after all steps complete; rejects if a step fails or the sequence is cancelled. */
    finished: Promise<void>;
    /** Pauses the active step and keeps subsequent steps paused until resumed. */
    pause(): void;
    /** Resumes the active step and allows subsequent steps to run. */
    resume(): void;
    /** Reverses playback of the active step; subsequent steps retain their configured direction. */
    reverse(): void;
    /** Sets the playback speed of the active and subsequent steps. */
    setPlaybackRate(rate: number): void;
    /** Returns the active step's playback speed, or the configured group speed. */
    getPlaybackRate(): number;
    /** Cancels the active step and prevents subsequent steps from starting. Safe to call repeatedly. */
    cancel(): void;
}
/**
 * Runs DOM animations one after another by delegating every step to the existing `animate()` engine.
 */
export declare function animateSequence(steps: readonly AnimationSequenceStep[], options?: AnimationSequenceOptions): AnimationSequenceControls;
//# sourceMappingURL=animation-sequence.d.ts.map