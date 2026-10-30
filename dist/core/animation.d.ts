import type { EasingOption } from "../easing/easings.js";
export type EasingFunction = (progress: number) => number;
export interface AnimationOptions {
    /** Duration in milliseconds. Defaults to 1000. */
    duration?: number;
    /** Delay in milliseconds before the animation starts. Defaults to 0. */
    delay?: number;
    /** Number of additional times to play after the initial iteration. Use Infinity to loop forever. Defaults to 0. */
    repeat?: number;
    /** Reverses direction at each repeat boundary. Defaults to false. */
    yoyo?: boolean;
    /** Playback speed multiplier. Defaults to 1. Must be finite and greater than 0. */
    playbackRate?: number;
    /** Defaults to true; completes at the current direction's endpoint when motion is reduced. */
    respectReducedMotion?: boolean;
    /** Maps linear progress (0..1) to eased progress. Defaults to linear. */
    easing?: EasingOption;
    /** Called once when the delay ends and the first update is about to run. */
    onStart?: () => void;
    /** Called for each animation frame, with eased progress. */
    onUpdate?: (progress: number) => void;
    /** Called once when playback reaches either endpoint. */
    onComplete?: () => void;
    /** Called once when an active animation is explicitly cancelled. */
    onCancel?: () => void;
}
export interface AnimationControls {
    /** Sets normalized playback progress immediately and continues toward the end. */
    seek(progress: number): void;
    /** Pauses the animation without losing its current progress. */
    pause(): void;
    /** Resumes a paused animation. */
    resume(): void;
    /** Reverses playback from the current progress. */
    reverse(): void;
    /** Changes playback speed. Must be finite and greater than 0. */
    setPlaybackRate(rate: number): void;
    /** Returns the current playback speed multiplier. */
    getPlaybackRate(): number;
    /** Stops the animation, suppresses future updates/completion, and calls `onCancel` once. */
    cancel(): void;
}
export declare function subscribeAnimationFrames(callback: (time: number) => void): () => void;
export declare function animateProgress(options?: AnimationOptions): AnimationControls;
//# sourceMappingURL=animation.d.ts.map