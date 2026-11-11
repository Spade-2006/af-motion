/**
 * AF Motion Unified Advanced Motion Composition Controller
 *
 * Coordinates playback, seeking, pausing, reversal, shared RAF animation,
 * and lifecycle safety across multiple synchronized motion engines.
 */

import { animateProgress, type AnimationControls } from "../animation.js";
import { prefersReducedMotion } from "../motion.js";
import { scheduleCompositionTracks } from "./timeline.js";
import { validateAdvancedComposition } from "./validation.js";
import type {
  AdvancedMotionCompositionController,
  AdvancedMotionCompositionDefinition,
  CompositionPlaybackState,
  MotionParticipantState,
  ScheduledTrack,
} from "./types.js";

export class AdvancedMotionCompositionControllerImpl
  implements AdvancedMotionCompositionController
{
  public readonly id: string;
  private readonly definition: AdvancedMotionCompositionDefinition;
  private readonly tracks: ScheduledTrack[] = [];
  private readonly trackMap = new Map<string, ScheduledTrack>();
  private readonly totalDuration: number;

  private _state: CompositionPlaybackState = "idle";
  private _progress = 0;
  private _isPlaying = false;
  private _error: Error | null = null;
  private animControls: AnimationControls | null = null;

  private resolvePlayPromise: (() => void) | null = null;
  private rejectPlayPromise: ((err: Error) => void) | null = null;

  constructor(definition: AdvancedMotionCompositionDefinition) {
    this.id = definition.id;
    this.definition = definition;

    // Validate composition upfront
    const validation = validateAdvancedComposition(definition);
    if (!validation.valid) {
      const err = new Error(
        `Invalid AdvancedMotionComposition "${definition.id}": ${validation.errors.map((e) => e.message).join(", ")}`
      );
      this._error = err;
      throw err;
    }

    const scheduled = scheduleCompositionTracks(definition);
    this.tracks = scheduled.tracks;
    this.totalDuration = Math.max(1, scheduled.totalDuration);

    for (const track of this.tracks) {
      this.trackMap.set(track.participant.id, track);
    }
  }

  public get state(): CompositionPlaybackState {
    return this._state;
  }

  public get progress(): number {
    return this._progress;
  }

  public get isPlaying(): boolean {
    return this._isPlaying;
  }

  public get duration(): number {
    return this.totalDuration;
  }

  public get error(): Error | null {
    return this._error;
  }

  public get activeParticipants(): readonly string[] {
    const currentTime = this._progress * this.totalDuration;
    return this.tracks
      .filter((t) => currentTime >= t.startTime && currentTime <= t.endTime)
      .map((t) => t.participant.id);
  }

  public getState(): CompositionPlaybackState {
    return this._state;
  }

  public getTracks(): readonly ScheduledTrack[] {
    return this.tracks;
  }

  public getParticipantProgress(id: string): number {
    const track = this.trackMap.get(id);
    if (!track) return 0;
    return track.instance.getProgress() ?? track.progress;
  }

  public getParticipantState(id: string): MotionParticipantState | undefined {
    return this.trackMap.get(id)?.state;
  }

  /**
   * Applies global timeline progress (0 to 1) across all scheduled participant tracks.
   */
  private applyProgress(globalProgress: number): void {
    this._progress = Math.max(0, Math.min(1, globalProgress));
    const currentTime = this._progress * this.totalDuration;

    for (const track of this.tracks) {
      if (currentTime < track.startTime) {
        track.progress = 0;
        track.state = "pending";
        track.instance.seek(0);
      } else if (currentTime >= track.endTime) {
        track.progress = 1;
        track.state = "completed";
        track.instance.seek(1);
      } else {
        const localProgress = track.duration > 0
          ? (currentTime - track.startTime) / track.duration
          : 1;
        track.progress = Math.max(0, Math.min(1, localProgress));
        track.state = "running";
        track.instance.seek(track.progress);
      }
    }

    this.definition.onUpdate?.(this._progress);
  }

  /**
   * Plays the composition from current progress to completion.
   */
  public play(): Promise<void> {
    if (this._state === "disposed") {
      return Promise.reject(new Error("Cannot play disposed composition."));
    }

    return new Promise<void>((resolve, reject) => {
      this.resolvePlayPromise = resolve;
      this.rejectPlayPromise = reject;

      // Handle reduced-motion preference
      const isReduced = this.definition.respectReducedMotion !== false && prefersReducedMotion();
      if (isReduced) {
        this.applyProgress(1);
        this._state = "completed";
        this._isPlaying = false;
        this.definition.onComplete?.();
        resolve();
        return;
      }

      this._state = "running";
      this._isPlaying = true;
      this.definition.onStart?.();

      const remainingDuration = (1 - this._progress) * this.totalDuration;

      this.animControls = animateProgress({
        duration: Math.max(1, remainingDuration),
        onUpdate: (p) => {
          this.applyProgress(this._progress + p * (1 - this._progress));
        },
        onComplete: () => {
          this._state = "completed";
          this._isPlaying = false;
          this.applyProgress(1);
          this.definition.onComplete?.();
          this.resolvePlayPromise?.();
          this.resolvePlayPromise = null;
        },
      });
    });
  }

  public pause(): void {
    if (this._state === "running") {
      this.animControls?.pause();
      this._state = "paused";
      this._isPlaying = false;
      for (const track of this.tracks) {
        if (track.state === "running") {
          track.instance.pause();
          track.state = "paused";
        }
      }
    }
  }

  public resume(): void {
    if (this._state === "paused") {
      this.animControls?.resume();
      this._state = "running";
      this._isPlaying = true;
      for (const track of this.tracks) {
        if (track.state === "paused") {
          track.instance.resume();
          track.state = "running";
        }
      }
    }
  }

  public reverse(): void {
    if (this.animControls) {
      this.animControls.reverse();
    }
    for (const track of this.tracks) {
      track.instance.reverse();
    }
  }

  public seek(progressOrLabel: number | string): void {
    let targetProgress = 0;

    if (typeof progressOrLabel === "string") {
      const labels = this.definition.labels ?? {};
      const targetTime = labels[progressOrLabel];
      if (targetTime !== undefined) {
        targetProgress = targetTime / this.totalDuration;
      } else {
        targetProgress = Number.parseFloat(progressOrLabel) || 0;
      }
    } else {
      targetProgress = progressOrLabel;
    }

    this.applyProgress(targetProgress);
  }

  public restart(): Promise<void> {
    this.cancel();
    this.applyProgress(0);
    return this.play();
  }

  public cancel(): void {
    if (this._state === "disposed") return;

    this._state = "cancelled";
    this._isPlaying = false;

    if (this.animControls) {
      this.animControls.cancel();
      this.animControls = null;
    }

    for (const track of this.tracks) {
      track.instance.cancel();
      track.state = "cancelled";
    }

    this.definition.onCancel?.();
    this.resolvePlayPromise?.();
    this.resolvePlayPromise = null;
  }

  public finish(): void {
    if (this._state === "disposed" || this._state === "completed") return;

    if (this.animControls) {
      this.animControls.cancel();
      this.animControls = null;
    }

    this.applyProgress(1);
    this._state = "completed";
    this._isPlaying = false;

    for (const track of this.tracks) {
      track.instance.finish();
      track.state = "completed";
    }

    this.definition.onComplete?.();
    this.resolvePlayPromise?.();
    this.resolvePlayPromise = null;
  }

  public dispose(): void {
    this.cancel();
    this._state = "disposed";

    for (const track of this.tracks) {
      track.instance.dispose();
    }

    this.tracks.length = 0;
    this.trackMap.clear();
  }
}

/**
 * Creates an advanced motion composition controller.
 */
export function createAdvancedComposition(
  definition: AdvancedMotionCompositionDefinition
): AdvancedMotionCompositionController {
  return new AdvancedMotionCompositionControllerImpl(definition);
}
