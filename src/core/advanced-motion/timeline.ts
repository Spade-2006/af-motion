/**
 * AF Motion Advanced Timeline & Dependency Scheduler
 *
 * Computes deterministic track schedules, resolves relative offsets,
 * maps timeline labels, enforces topological dependencies, and calculates total duration.
 */

import { createParticipantInstance } from "./adapters.js";
import type {
  AdvancedMotionCompositionDefinition,
  MotionParticipantConfig,
  ScheduledTrack,
} from "./types.js";

/**
 * Parses time offsets such as "+=150", "-=100", ">", "<", or direct milliseconds / labels.
 */
export function parseTimelineOffset(
  at: number | string | undefined,
  previousTrackEnd: number,
  previousTrackStart: number,
  labels: Record<string, number> = {}
): number {
  if (at === undefined) {
    return previousTrackEnd;
  }

  if (typeof at === "number") {
    return Math.max(0, at);
  }

  const trimmed = at.trim();

  // Special operators
  if (trimmed === ">") {
    return previousTrackEnd;
  }
  if (trimmed === "<") {
    return previousTrackStart;
  }

  // Relative offset: "+=150" or "-=100"
  if (trimmed.startsWith("+=")) {
    const val = Number.parseFloat(trimmed.slice(2));
    return Math.max(0, previousTrackEnd + (Number.isNaN(val) ? 0 : val));
  }
  if (trimmed.startsWith("-=")) {
    const val = Number.parseFloat(trimmed.slice(2));
    return Math.max(0, previousTrackEnd - (Number.isNaN(val) ? 0 : val));
  }

  // Label lookup
  if (labels[trimmed] !== undefined) {
    return labels[trimmed]!;
  }

  // Milliseconds string: "350ms" or "2s"
  if (trimmed.endsWith("ms")) {
    const val = Number.parseFloat(trimmed.slice(0, -2));
    return Math.max(0, Number.isNaN(val) ? 0 : val);
  }
  if (trimmed.endsWith("s")) {
    const val = Number.parseFloat(trimmed.slice(0, -1));
    return Math.max(0, Number.isNaN(val) ? 0 : val * 1000);
  }

  const directNum = Number.parseFloat(trimmed);
  return Math.max(0, Number.isNaN(directNum) ? 0 : directNum);
}

/**
 * Computes deterministic scheduled tracks from composition participants.
 */
export function scheduleCompositionTracks(
  definition: AdvancedMotionCompositionDefinition
): { tracks: ScheduledTrack[]; totalDuration: number } {
  const participants = definition.participants ?? [];
  const labels: Record<string, number> = { ...(definition.labels ?? {}) };
  const tracks: ScheduledTrack[] = [];
  const trackMap = new Map<string, ScheduledTrack>();

  let prevStart = 0;
  let prevEnd = 0;

  for (let i = 0; i < participants.length; i++) {
    const p = participants[i]!;
    const duration = p.duration ?? (p as any).options?.duration ?? 350;
    const delay = p.delay ?? 0;

    let startTime = parseTimelineOffset(p.at, prevEnd, prevStart, labels) + delay;

    // Enforce explicit dependencies: must start at or after all dependencies finish
    if (p.dependsOn && p.dependsOn.length > 0) {
      let maxDepEnd = 0;
      for (const depId of p.dependsOn) {
        const depTrack = trackMap.get(depId);
        if (depTrack) {
          maxDepEnd = Math.max(maxDepEnd, depTrack.endTime);
        }
      }
      startTime = Math.max(startTime, maxDepEnd + delay);
    }

    const endTime = startTime + duration;
    const instance = createParticipantInstance(p);

    const track: ScheduledTrack = {
      participant: p,
      instance,
      startTime,
      endTime,
      duration,
      state: "idle",
      progress: 0,
    };

    tracks.push(track);
    trackMap.set(p.id, track);

    // Register label if defined on participant
    if (p.label) {
      labels[p.label] = startTime;
    }

    prevStart = startTime;
    prevEnd = endTime;
  }

  // Calculate total duration: max of all end times, or explicit composition duration
  const naturalDuration = tracks.reduce((max, t) => Math.max(max, t.endTime), 0);
  const totalDuration = Math.max(naturalDuration, definition.duration ?? 0);

  return { tracks, totalDuration };
}

/**
 * Standalone Advanced Timeline class for incremental track building.
 */
export class AdvancedTimeline {
  private readonly participants: MotionParticipantConfig[] = [];
  private readonly labels: Record<string, number> = {};

  public add(participant: MotionParticipantConfig): this {
    this.participants.push(participant);
    return this;
  }

  public addLabel(name: string, timeMs: number): this {
    this.labels[name] = Math.max(0, timeMs);
    return this;
  }

  public getSchedule(id = "timeline"): { tracks: ScheduledTrack[]; totalDuration: number } {
    return scheduleCompositionTracks({
      id,
      participants: this.participants,
      labels: this.labels,
    });
  }
}

/**
 * Creates an Advanced Timeline builder.
 */
export function createAdvancedTimeline(): AdvancedTimeline {
  return new AdvancedTimeline();
}
