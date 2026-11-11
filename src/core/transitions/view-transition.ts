/**
 * AF Motion View Transition Engine & Browser-Native Adapter
 *
 * Framework-independent view transition orchestration with automatic fallback,
 * lifecycle promises (ready, updateCallbackDone, finished), shared-element sync,
 * and seamless integration with document.startViewTransition().
 */

import { prefersReducedMotion } from "../motion.js";
import { sharedElementRegistry } from "./shared-element.js";
import { createSharedElementTransition } from "./shared-element-transition.js";
import { createSharedElementGroupTransition } from "./group-transition.js";
import type {
  SharedElementGroupItem,
  SharedElementTransitionConfig,
  ViewTransitionInstance,
  ViewTransitionOptions,
  ViewTransitionStatus,
} from "./types.js";

/**
 * Global tracking of current active view transition status.
 */
let currentViewTransitionState: ViewTransitionStatus = "idle";

/**
 * Returns current view transition state.
 */
export function getViewTransitionState(): ViewTransitionStatus {
  return currentViewTransitionState;
}

/**
 * Feature detection for browser-native document.startViewTransition().
 */
export function isViewTransitionSupported(): boolean {
  return (
    typeof document !== "undefined" &&
    typeof (document as any).startViewTransition === "function"
  );
}

/**
 * Manages fallback view transition orchestration when native API is unavailable.
 */
class FallbackViewTransition implements ViewTransitionInstance {
  private _status: ViewTransitionStatus = "pending";
  private _skip = false;

  private resolveReady!: () => void;
  private resolveUpdateDone!: () => void;
  private resolveFinished!: () => void;
  private rejectFinished!: (reason: unknown) => void;

  public readonly ready: Promise<void>;
  public readonly updateCallbackDone: Promise<void>;
  public readonly finished: Promise<void>;

  constructor(
    updateFn: () => void | Promise<void>,
    options: ViewTransitionOptions = {}
  ) {
    this.ready = new Promise<void>((resolve) => {
      this.resolveReady = resolve;
    });

    this.updateCallbackDone = new Promise<void>((resolve) => {
      this.resolveUpdateDone = resolve;
    });

    this.finished = new Promise<void>((resolve, reject) => {
      this.resolveFinished = resolve;
      this.rejectFinished = reject;
    });

    this.execute(updateFn, options);
  }

  public get status(): ViewTransitionStatus {
    return this._status;
  }

  public skipTransition(): void {
    this._skip = true;
    this._status = "skipped";
    currentViewTransitionState = "skipped";
    this.resolveFinished();
  }

  private async execute(
    updateFn: () => void | Promise<void>,
    options: ViewTransitionOptions
  ): Promise<void> {
    currentViewTransitionState = "pending";

    try {
      // 1. Before transition callback
      if (options.beforeTransition) {
        await options.beforeTransition();
      }

      // 2. Capture source shared elements before DOM mutation
      const sharedElementIds: string[] = Array.isArray(options.sharedElements)
        ? options.sharedElements
        : [];

      for (const id of sharedElementIds) {
        sharedElementRegistry.capture(id, "source");
      }

      // 3. Mark ready & execute DOM update callback
      this._status = "ready";
      currentViewTransitionState = "ready";
      this.resolveReady();

      await updateFn();
      this.resolveUpdateDone();

      if (this._skip) {
        return;
      }

      // 4. Capture destination shared elements after DOM mutation
      this._status = "animating";
      currentViewTransitionState = "animating";

      const groupItems: SharedElementGroupItem[] = [];
      for (const id of sharedElementIds) {
        sharedElementRegistry.capture(id, "destination");
        groupItems.push({
          id,
          config: typeof options.sharedElements === "object" && !Array.isArray(options.sharedElements)
            ? (options.sharedElements as SharedElementTransitionConfig)
            : undefined,
        });
      }

      // 5. Animate shared elements if any are registered
      if (groupItems.length > 0 && !prefersReducedMotion()) {
        const groupController = createSharedElementGroupTransition(groupItems, {
          duration: options.duration ?? 350,
          easing: options.easing ?? "easeInOutCubic",
          respectReducedMotion: options.respectReducedMotion,
        });
        await groupController.start();
      }

      // 6. After transition callback
      if (options.afterTransition) {
        await options.afterTransition();
      }

      this._status = "finished";
      currentViewTransitionState = "finished";
      options.onComplete?.();
      this.resolveFinished();
    } catch (err) {
      this._status = "failed";
      currentViewTransitionState = "failed";
      options.onError?.(err);
      this.rejectFinished(err);
    }
  }
}

/**
 * Starts a view transition, using document.startViewTransition() when available
 * or falling back seamlessly to AF Motion's FLIP orchestration.
 */
export function startViewTransition(
  updateFn: () => void | Promise<void>,
  options: ViewTransitionOptions = {}
): ViewTransitionInstance {
  const useNative = options.strategy !== "custom-only" && isViewTransitionSupported();

  if (useNative) {
    currentViewTransitionState = "pending";

    // Native browser View Transition
    let resolveReady!: () => void;
    let resolveUpdateDone!: () => void;
    let resolveFinished!: () => void;
    let rejectFinished!: (reason: unknown) => void;

    const readyPromise = new Promise<void>((res) => {
      resolveReady = res;
    });
    const updateDonePromise = new Promise<void>((res) => {
      resolveUpdateDone = res;
    });
    const finishedPromise = new Promise<void>((res, rej) => {
      resolveFinished = res;
      rejectFinished = rej;
    });

    let nativeInstance: any = null;

    try {
      options.beforeTransition?.();

      // Capture source shared elements
      const sharedElementIds: string[] = Array.isArray(options.sharedElements)
        ? options.sharedElements
        : [];
      for (const id of sharedElementIds) {
        sharedElementRegistry.capture(id, "source");
      }

      nativeInstance = (document as any).startViewTransition(async () => {
        try {
          await updateFn();
          resolveUpdateDone();
        } catch (err) {
          options.onError?.(err);
          throw err;
        }
      });

      currentViewTransitionState = "ready";
      resolveReady();

      if (nativeInstance.ready) {
        nativeInstance.ready.then(() => {
          currentViewTransitionState = "animating";
        });
      }

      if (nativeInstance.finished) {
        nativeInstance.finished
          .then(async () => {
            currentViewTransitionState = "finished";
            if (options.afterTransition) {
              await options.afterTransition();
            }
            options.onComplete?.();
            resolveFinished();
          })
          .catch((err: unknown) => {
            currentViewTransitionState = "failed";
            options.onError?.(err);
            rejectFinished(err);
          });
      }

      return {
        ready: nativeInstance.ready ?? readyPromise,
        updateCallbackDone: nativeInstance.updateCallbackDone ?? updateDonePromise,
        finished: nativeInstance.finished ?? finishedPromise,
        get status(): ViewTransitionStatus {
          return currentViewTransitionState;
        },
        skipTransition(): void {
          nativeInstance?.skipTransition?.();
          currentViewTransitionState = "skipped";
        },
      };
    } catch (err) {
      currentViewTransitionState = "failed";
      options.onError?.(err);
      // Fallback if native startViewTransition throws synchronously
      return new FallbackViewTransition(updateFn, options);
    }
  }

  // Fallback View Transition
  return new FallbackViewTransition(updateFn, options);
}

/**
 * Creates a reusable view transition orchestrator function.
 */
export function createViewTransition(
  defaultOptions: ViewTransitionOptions = {}
): (updateFn: () => void | Promise<void>, overrideOptions?: ViewTransitionOptions) => ViewTransitionInstance {
  return (updateFn, overrideOptions) => {
    return startViewTransition(updateFn, { ...defaultOptions, ...overrideOptions });
  };
}
