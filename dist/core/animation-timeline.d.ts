import type { AnimatableProperties, AnimateTarget, DOMAnimationOptions } from "./animate.js";
export type AnimationTimelinePosition = number | string | {
    label: string;
    offset?: number;
} | {
    previous: "start" | "end";
    offset?: number;
};
export interface AnimationTimelineStep {
    /** Absolute milliseconds, a named label, or a position relative to the previous entry. */
    at: AnimationTimelinePosition;
    /** Target for this step; may be shared with other timeline entries. */
    target: AnimateTarget;
    /** Properties animated by this step. */
    properties: AnimatableProperties;
    /** Options passed to `animate()` when this timeline entry starts. */
    options?: DOMAnimationOptions;
}
export interface AnimationTimelineControls {
    /** Resolves after every entry completes; rejects if an entry fails or the timeline is cancelled. */
    readonly finished: Promise<void>;
    /** Adds a step at an explicit or relative timeline position. Steps may overlap. */
    add(step: AnimationTimelineStep): AnimationTimelineControls;
    /** Adds a child timeline at an explicit or relative timeline position. */
    addTimeline(timeline: AnimationTimelineControls, at: AnimationTimelinePosition): AnimationTimelineControls;
    /** Defines a label at an absolute timeline position in milliseconds. */
    addLabel(name: string, at: number): AnimationTimelineControls;
    /** Starts the timeline. Calling again after playback begins has no effect. */
    play(): void;
    /** Pauses active animations and freezes pending offsets. */
    pause(): void;
    /** Resumes a paused timeline. */
    resume(): void;
    /** Moves the playhead to a finite, non-negative time in milliseconds. */
    seek(timeMs: number): void;
    /** Cancels the current run and replays the timeline from time zero. */
    restart(): void;
    /** Sets the timeline playback speed. Must be finite and greater than zero. */
    setPlaybackRate(rate: number): void;
    /** Returns the timeline playback speed. */
    getPlaybackRate(): number;
    /** Cancels active animations and rejects `finished`. Safe to repeat. */
    cancel(): void;
}
/** Creates a timeline that schedules every step through the existing `animate()` engine. */
export declare function createTimeline(): AnimationTimelineControls;
//# sourceMappingURL=animation-timeline.d.ts.map