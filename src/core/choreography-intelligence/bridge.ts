/**
 * AF Motion Cross-System Synchronization Bridge
 *
 * Coordinates normalized timeline progress across DOM, Graphics, and 3D scenes,
 * providing error isolation, rate independence, late-joining, and playback controls.
 */

import type {
  ChoreographyParticipant,
  CrossSystemSyncBridgeControls,
} from "./types.js";

export interface CrossSystemSyncBridgeOptions {
  readonly duration?: number; // duration in ms (default 1000)
  readonly easing?: string | ((t: number) => number);
  readonly participants?: readonly ChoreographyParticipant[];
  readonly onUpdate?: (progress: number) => void;
  readonly onComplete?: () => void;
}

function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value));
}

export class CrossSystemSyncBridge implements CrossSystemSyncBridgeControls {
  private participantsMap = new Map<string, ChoreographyParticipant>();
  private startedParticipants = new Set<string>();
  private completedParticipants = new Set<string>();
  private listeners = new Set<(progress: number) => void>();
  private currentProgress = 0;
  private isRunning = false;
  private isUpdating = false;
  private rafId: number | null = null;
  private duration: number;
  private options: CrossSystemSyncBridgeOptions;

  constructor(options: CrossSystemSyncBridgeOptions = {}) {
    this.options = options;
    this.duration = options.duration ?? 1000;

    if (options.participants) {
      for (const p of options.participants) {
        this.addParticipant(p);
      }
    }
  }

  public getProgress(): number {
    return this.currentProgress;
  }

  public isPlaying(): boolean {
    return this.isRunning;
  }

  public getParticipants(): readonly ChoreographyParticipant[] {
    return Array.from(this.participantsMap.values());
  }

  public addParticipant(participant: ChoreographyParticipant): () => void {
    this.participantsMap.set(participant.id, participant);

    // If bridge is already midway through execution, update late-joining participant immediately
    if (this.currentProgress > 0) {
      this.dispatchToParticipant(participant, this.currentProgress);
    }

    return () => this.removeParticipant(participant.id);
  }

  public removeParticipant(id: string): void {
    this.participantsMap.delete(id);
    this.startedParticipants.delete(id);
    this.completedParticipants.delete(id);
  }

  public subscribe(listener: (progress: number) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public seek(progress: number): void {
    if (this.isUpdating) return; // Prevent re-entrant feedback loops
    this.isUpdating = true;

    try {
      const clamped = clamp(progress, 0, 1);
      this.currentProgress = clamped;

      for (const participant of this.participantsMap.values()) {
        this.dispatchToParticipant(participant, clamped);
      }

      if (this.options.onUpdate) {
        try {
          this.options.onUpdate(clamped);
        } catch {
          // Isolate callback failure
        }
      }

      for (const listener of this.listeners) {
        try {
          listener(clamped);
        } catch {
          // Isolate listener failure
        }
      }
    } finally {
      this.isUpdating = false;
    }
  }

  public play(): Promise<void> {
    this.cancelPlayback();
    this.isRunning = true;

    return new Promise<void>((resolve) => {
      const startProg = this.currentProgress;
      const targetProg = 1;
      const remainingDistance = Math.abs(targetProg - startProg);
      const activeDuration = Math.max(16, this.duration * remainingDistance);
      const startTime = typeof performance !== "undefined" ? performance.now() : Date.now();

      const tick = () => {
        if (!this.isRunning) {
          resolve();
          return;
        }

        const now = typeof performance !== "undefined" ? performance.now() : Date.now();
        const elapsed = now - startTime;
        const linearT = clamp(elapsed / activeDuration, 0, 1);

        const nextProg = startProg + (targetProg - startProg) * linearT;
        this.seek(nextProg);

        if (linearT >= 1 || nextProg >= 1) {
          this.isRunning = false;
          this.rafId = null;
          if (this.options.onComplete) {
            try {
              this.options.onComplete();
            } catch {
              // Isolate onComplete error
            }
          }
          resolve();
        } else {
          if (typeof requestAnimationFrame !== "undefined") {
            this.rafId = requestAnimationFrame(tick);
          } else {
            this.rafId = setTimeout(tick, 16) as any;
          }
        }
      };

      if (typeof requestAnimationFrame !== "undefined") {
        this.rafId = requestAnimationFrame(tick);
      } else {
        this.rafId = setTimeout(tick, 16) as any;
      }
    });
  }

  public reverse(): Promise<void> {
    this.cancelPlayback();
    this.isRunning = true;

    return new Promise<void>((resolve) => {
      const startProg = this.currentProgress;
      const targetProg = 0;
      const remainingDistance = Math.abs(targetProg - startProg);
      const activeDuration = Math.max(16, this.duration * remainingDistance);
      const startTime = typeof performance !== "undefined" ? performance.now() : Date.now();

      const tick = () => {
        if (!this.isRunning) {
          resolve();
          return;
        }

        const now = typeof performance !== "undefined" ? performance.now() : Date.now();
        const elapsed = now - startTime;
        const linearT = clamp(elapsed / activeDuration, 0, 1);

        const nextProg = startProg - (startProg - targetProg) * linearT;
        this.seek(nextProg);

        if (linearT >= 1 || nextProg <= 0) {
          this.isRunning = false;
          this.rafId = null;
          resolve();
        } else {
          if (typeof requestAnimationFrame !== "undefined") {
            this.rafId = requestAnimationFrame(tick);
          } else {
            this.rafId = setTimeout(tick, 16) as any;
          }
        }
      };

      if (typeof requestAnimationFrame !== "undefined") {
        this.rafId = requestAnimationFrame(tick);
      } else {
        this.rafId = setTimeout(tick, 16) as any;
      }
    });
  }

  public pause(): void {
    this.cancelPlayback();
    this.isRunning = false;
  }

  public resume(): void {
    if (!this.isRunning && this.currentProgress < 1) {
      this.play();
    }
  }

  public cancel(): void {
    this.cancelPlayback();
    this.isRunning = false;

    for (const participant of this.participantsMap.values()) {
      if (participant.onCancel) {
        try {
          participant.onCancel();
        } catch {
          // Isolate error
        }
      }
    }
  }

  public destroy(): void {
    this.cancel();
    this.participantsMap.clear();
    this.startedParticipants.clear();
    this.completedParticipants.clear();
    this.listeners.clear();
  }

  private cancelPlayback(): void {
    if (this.rafId !== null) {
      if (typeof cancelAnimationFrame !== "undefined") {
        cancelAnimationFrame(this.rafId);
      } else {
        clearTimeout(this.rafId);
      }
      this.rafId = null;
    }
  }

  private dispatchToParticipant(participant: ChoreographyParticipant, progress: number): void {
    const { startProgress, endProgress, onUpdate, onStart, onComplete } = participant;
    const range = Math.max(0.0001, endProgress - startProgress);
    const localProgress = clamp((progress - startProgress) / range, 0, 1);

    // Trigger onStart when progressing past startProgress
    if (progress >= startProgress && !this.startedParticipants.has(participant.id)) {
      this.startedParticipants.add(participant.id);
      if (onStart) {
        try {
          onStart();
        } catch {
          // Isolate failure
        }
      }
    }

    // Dispatch progress update
    if (onUpdate) {
      try {
        onUpdate(progress, localProgress);
      } catch {
        // Isolate failure - participant failure does not break the bridge
      }
    }

    // Trigger onComplete when reaching endProgress
    if (progress >= endProgress && !this.completedParticipants.has(participant.id)) {
      this.completedParticipants.add(participant.id);
      if (onComplete) {
        try {
          onComplete();
        } catch {
          // Isolate failure
        }
      }
    }
  }
}

export function createCrossSystemSyncBridge(
  options?: CrossSystemSyncBridgeOptions
): CrossSystemSyncBridge {
  return new CrossSystemSyncBridge(options);
}
