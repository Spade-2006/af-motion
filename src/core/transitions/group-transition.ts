/**
 * AF Motion Shared Element Group & Nested Transitions
 *
 * Coordinated transitions across multiple shared elements with staggered timing,
 * parent-child hierarchy compensation, and unified playback controls.
 */

import { prefersReducedMotion } from "../motion.js";
import { createSharedElementTransition } from "./shared-element-transition.js";
import type {
  SharedElementGroupController,
  SharedElementGroupItem,
  SharedElementGroupOptions,
  SharedElementTransitionController,
  SharedElementTransitionState,
} from "./types.js";

/**
 * Calculates stagger delay offsets based on item index and ordering strategy.
 */
function calculateStaggerDelay(
  index: number,
  total: number,
  staggerMs: number,
  order: "forward" | "reverse" | "center-out" = "forward"
): number {
  if (staggerMs <= 0 || total <= 1) return 0;

  switch (order) {
    case "reverse":
      return (total - 1 - index) * staggerMs;
    case "center-out": {
      const mid = (total - 1) / 2;
      return Math.abs(index - mid) * staggerMs;
    }
    case "forward":
    default:
      return index * staggerMs;
  }
}

export class SharedElementGroupTransitionImpl implements SharedElementGroupController {
  private _state: SharedElementTransitionState = "idle";
  private _progress = 0;
  private _isPlaying = false;
  private controllers: SharedElementTransitionController[] = [];
  private readonly options: SharedElementGroupOptions;

  constructor(
    items: SharedElementGroupItem[],
    options: SharedElementGroupOptions = {}
  ) {
    this.options = options;
    const total = items.length;
    const stagger = options.stagger ?? 0;
    const order = options.order ?? "forward";

    for (let i = 0; i < total; i++) {
      const item = items[i]!;
      const delayOffset = calculateStaggerDelay(i, total, stagger, order);

      const ctrl = createSharedElementTransition({
        id: item.id,
        source: item.source,
        destination: item.destination,
        config: {
          ...item.config,
          duration: item.config?.duration ?? options.duration,
          easing: item.config?.easing ?? options.easing,
          delay: (item.config?.delay ?? 0) + delayOffset,
          respectReducedMotion: options.respectReducedMotion,
        },
      });

      this.controllers.push(ctrl);
    }
  }

  public get state(): SharedElementTransitionState {
    return this._state;
  }

  public get progress(): number {
    return this._progress;
  }

  public get isPlaying(): boolean {
    return this._isPlaying;
  }

  public getState(): SharedElementTransitionState {
    return this._state;
  }

  public async start(): Promise<void> {
    if (this.options.respectReducedMotion !== false && prefersReducedMotion()) {
      this._state = "completed";
      this._progress = 1;
      this.options.onComplete?.();
      return;
    }

    this._state = "animating";
    this._isPlaying = true;
    this.options.onStart?.();

    try {
      await Promise.all(this.controllers.map((c) => c.start()));
      this._state = "completed";
      this._progress = 1;
      this._isPlaying = false;
      this.options.onComplete?.();
    } catch {
      this._state = "cancelled";
      this._isPlaying = false;
      this.options.onCancel?.();
    }
  }

  public pause(): void {
    this._state = "paused";
    this._isPlaying = false;
    for (const c of this.controllers) {
      c.pause();
    }
  }

  public resume(): void {
    this._state = "animating";
    this._isPlaying = true;
    for (const c of this.controllers) {
      c.resume();
    }
  }

  public reverse(): void {
    for (const c of this.controllers) {
      c.reverse();
    }
  }

  public seek(progress: number): void {
    this._progress = Math.max(0, Math.min(1, progress));
    for (const c of this.controllers) {
      c.seek(this._progress);
    }
  }

  public cancel(): void {
    this._state = "cancelled";
    this._isPlaying = false;
    for (const c of this.controllers) {
      c.cancel();
    }
    this.options.onCancel?.();
  }

  public finish(): void {
    this._state = "completed";
    this._progress = 1;
    this._isPlaying = false;
    for (const c of this.controllers) {
      c.finish();
    }
    this.options.onComplete?.();
  }
}

/**
 * Creates a synchronized transition controller for a group of shared elements.
 */
export function createSharedElementGroupTransition(
  items: SharedElementGroupItem[],
  options?: SharedElementGroupOptions
): SharedElementGroupController {
  return new SharedElementGroupTransitionImpl(items, options);
}
