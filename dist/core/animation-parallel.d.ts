import type { AnimatableProperties, AnimateTarget, DOMAnimationOptions } from "./animate.js";
export interface AnimationParallelStep {
    /** Target for this step; may be shared with other concurrently running steps. */
    target: AnimateTarget;
    /** Properties animated by this step. */
    properties: AnimatableProperties;
    /** Options passed to `animate()`; this step runs concurrently with its siblings. */
    options?: DOMAnimationOptions;
}
export interface AnimationParallelOptions {
    /** Called once when the first step begins, after its delay. */
    onStart?: () => void;
    /** Called once after all steps have completed successfully. */
    onComplete?: () => void;
    /** Called once when the group is explicitly cancelled. */
    onCancel?: () => void;
}
export interface AnimationParallelControls {
    /** Resolves after all steps complete; rejects if a step fails or the group is cancelled. */
    finished: Promise<void>;
    /** Pauses every active step. */
    pause(): void;
    /** Resumes every paused step. */
    resume(): void;
    /** Reverses playback of every active step. */
    reverse(): void;
    /** Sets the playback speed of active steps. */
    setPlaybackRate(rate: number): void;
    /** Returns the active steps' playback speed, or the configured group speed. */
    getPlaybackRate(): number;
    /** Cancels all active steps and rejects `finished` with an AbortError. Safe to call repeatedly. */
    cancel(): void;
}
/**
 * Runs DOM animations concurrently by delegating each step to the existing `animate()` engine.
 */
export declare function animateParallel(steps: readonly AnimationParallelStep[], options?: AnimationParallelOptions): AnimationParallelControls;
//# sourceMappingURL=animation-parallel.d.ts.map