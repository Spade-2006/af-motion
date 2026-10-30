import { resolveTargets } from "../core/animate.js";
import type { AnimateTarget } from "../core/animate.js";
import { acquirePointerCapture, releasePointerCapture } from "../core/pointer-capture.js";
import { animateInertia } from "../core/inertia.js";
import type { InertiaControls } from "../core/inertia.js";
import { removeTransformLayer, setTransformLayer } from "../core/transform.js";

export type DragAxis = "x" | "y" | "both";

export interface DragPosition {
  readonly x: number;
  readonly y: number;
}

export interface DragOptions {
  /** Axes that may move. Defaults to "both". */
  axis?: DragAxis;
  /** Optional movement bounds in pixels relative to the starting position. */
  bounds?: {
    minX?: number;
    maxX?: number;
    minY?: number;
    maxY?: number;
  };
  /**
   * Element (or selector) the dragged element must stay inside. Measured at the start of each
   * drag and combined with ounds (the tighter limit wins on each side).
   */
  container?: HTMLElement | string;
  /** Continue with decaying pointer velocity after release. Defaults to true. */
  inertia?: boolean;
  /** Exponential velocity decay per second. Must be > 0. Defaults to 8. */
  friction?: number;
  /** Called when a primary pointer starts dragging. */
  onDragStart?: (position: DragPosition) => void;
  /** Called as the element moves, including during inertia. */
  onDrag?: (position: DragPosition) => void;
  /** Called on release or cancellation; cancelled is true for pointer cancellation. */
  onDragEnd?: (position: DragPosition, cancelled: boolean) => void;
}

export interface DragControls {
  /** Cancels active dragging and momentum, removes listeners, and restores original styles. */
  destroy(): void;
}

interface DragState {
  x: number;
  y: number;
  pointerId: number | null;
  startX: number;
  startY: number;
  startOffsetX: number;
  startOffsetY: number;
  pointerX: number;
  pointerY: number;
  sampleTime: number;
  velocityX: number;
  velocityY: number;
  inertiaX: InertiaControls | null;
  inertiaY: InertiaControls | null;
  touchAction: string;
  touchActionPriority: string;
  limits: DragLimits;
}

interface DragLimits {
  minX?: number;
  maxX?: number;
  minY?: number;
  maxY?: number;
}

// A pointer held still before release should not fling with its last movement velocity.
const RELEASE_VELOCITY_WINDOW_MS = 100;

function validateBounds(bounds: DragOptions["bounds"]): void {
  if (bounds === undefined) return;
  if (bounds === null || typeof bounds !== "object" || Array.isArray(bounds)) {
    throw new TypeError("bounds must be an object");
  }
  for (const [name, value] of Object.entries(bounds)) {
    if (!["minX", "maxX", "minY", "maxY"].includes(name)) {
      throw new TypeError(`Unknown drag bound "${name}"`);
    }
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new RangeError(`${name} must be a finite number, received ${String(value)}`);
    }
  }
  if (bounds.minX !== undefined && bounds.maxX !== undefined && bounds.minX > bounds.maxX) {
    throw new RangeError("minX must be less than or equal to maxX");
  }
  if (bounds.minY !== undefined && bounds.maxY !== undefined && bounds.minY > bounds.maxY) {
    throw new RangeError("minY must be less than or equal to maxY");
  }
}

function tighten(
  explicitMin: number | undefined,
  explicitMax: number | undefined,
  containerMin: number,
  containerMax: number,
): [number, number] {
  const min = Math.max(explicitMin ?? -Infinity, containerMin);
  const max = Math.min(explicitMax ?? Infinity, containerMax);
  return [min, Math.max(min, max)];
}

function clamp(value: number, minimum: number | undefined, maximum: number | undefined): number {
  if (minimum !== undefined) value = Math.max(minimum, value);
  if (maximum !== undefined) value = Math.min(maximum, value);
  return value;
}

/**
 * Moves elements in response to an active pointer gesture. The transform is a composable layer,
 * so it can be combined with hover, tilt, and magnetic effects without replacing their transforms.
 */
export function drag(target: AnimateTarget, options: DragOptions = {}): DragControls {
  if (options === null || typeof options !== "object" || Array.isArray(options)) {
    throw new TypeError("options must be an object");
  }
  const axis = options.axis ?? "both";
  const inertia = options.inertia ?? true;
  const friction = options.friction ?? 8;
  if (axis !== "x" && axis !== "y" && axis !== "both") {
    throw new TypeError(`axis must be "x", "y", or "both", received ${String(axis)}`);
  }
  if (typeof inertia !== "boolean") throw new TypeError("inertia must be a boolean");
  if (typeof friction !== "number" || !Number.isFinite(friction) || friction <= 0) {
    throw new RangeError(`friction must be a finite number > 0, received ${String(friction)}`);
  }
  for (const [name, callback] of [
    ["onDragStart", options.onDragStart],
    ["onDrag", options.onDrag],
    ["onDragEnd", options.onDragEnd],
  ] as const) {
    if (callback !== undefined && typeof callback !== "function") {
      throw new TypeError(`${name} must be a function`);
    }
  }
  validateBounds(options.bounds);
  const container = options.container;
  if (container !== undefined && typeof container !== "string" && !(container instanceof HTMLElement)) {
    throw new TypeError("container must be an HTMLElement or selector string");
  }

  const elements = resolveTargets(target);
  if (elements.length === 0) return { destroy: () => undefined };

  const states = new Map<HTMLElement, DragState>();
  const cleanups: Array<() => void> = [];
  let destroyed = false;
  const resolveLimits = (element: HTMLElement, state: DragState): DragLimits => {
    const bounds = options.bounds;
    const containerElement = container === undefined ? undefined : resolveTargets(container)[0];
    if (!containerElement || containerElement === element) return { ...bounds };
    const outer = containerElement.getBoundingClientRect();
    const inner = element.getBoundingClientRect();
    const values = [outer.left, outer.right, outer.top, outer.bottom, inner.left, inner.right, inner.top, inner.bottom];
    if (!values.every(Number.isFinite)) return { ...bounds };
    const [minX, maxX] = tighten(bounds?.minX, bounds?.maxX, state.x + outer.left - inner.left, state.x + outer.right - inner.right);
    const [minY, maxY] = tighten(bounds?.minY, bounds?.maxY, state.y + outer.top - inner.top, state.y + outer.bottom - inner.bottom);
    return { minX, maxX, minY, maxY };
  };
  const render = (element: HTMLElement, state: DragState): void => {
    if (state.x === 0 && state.y === 0) {
      removeTransformLayer(element, state);
      return;
    }
    setTransformLayer(element, state, `translate(${state.x}px, ${state.y}px)`);
  };
  const emitDrag = (element: HTMLElement, state: DragState): void => {
    render(element, state);
    options.onDrag?.({ x: state.x, y: state.y });
  };

  for (const element of elements) {
    const state: DragState = {
      x: 0,
      y: 0,
      pointerId: null,
      startX: 0,
      startY: 0,
      startOffsetX: 0,
      startOffsetY: 0,
      pointerX: 0,
      pointerY: 0,
      sampleTime: 0,
      velocityX: 0,
      velocityY: 0,
      inertiaX: null,
      inertiaY: null,
      touchAction: element.style.getPropertyValue("touch-action"),
      touchActionPriority: element.style.getPropertyPriority("touch-action"),
      limits: { ...options.bounds },
    };
    states.set(element, state);
    element.style.setProperty("touch-action", "none");

    const stopInertia = (): void => {
      state.inertiaX?.cancel();
      state.inertiaY?.cancel();
      state.inertiaX = null;
      state.inertiaY = null;
    };
    const releasePointer = (): void => {
      const pointerId = state.pointerId;
      state.pointerId = null;
      if (pointerId !== null) releasePointerCapture(element, pointerId);
    };

    const onPointerDown = (event: PointerEvent): void => {
      if (
        destroyed ||
        state.pointerId !== null ||
        event.isPrimary === false ||
        (event.button !== undefined && event.button !== 0)
      ) return;
      event.preventDefault();
      stopInertia();
      state.pointerId = event.pointerId;
      state.startX = event.clientX;
      state.startY = event.clientY;
      state.startOffsetX = state.x;
      state.startOffsetY = state.y;
      state.pointerX = event.clientX;
      state.pointerY = event.clientY;
      state.sampleTime = event.timeStamp;
      state.velocityX = 0;
      state.velocityY = 0;
      state.limits = resolveLimits(element, state);
      acquirePointerCapture(element, event.pointerId);
      options.onDragStart?.({ x: state.x, y: state.y });
    };

    const onPointerMove = (event: PointerEvent): void => {
      if (destroyed || state.pointerId !== event.pointerId) return;
      const elapsed = event.timeStamp - state.sampleTime;
      if (elapsed > 0) {
        state.velocityX = ((event.clientX - state.pointerX) / elapsed) * 1000;
        state.velocityY = ((event.clientY - state.pointerY) / elapsed) * 1000;
      }
      state.pointerX = event.clientX;
      state.pointerY = event.clientY;
      state.sampleTime = event.timeStamp;
      const bounds = state.limits;
      state.x = axis === "y" ? state.x : clamp(
        state.startOffsetX + event.clientX - state.startX,
        bounds?.minX,
        bounds?.maxX,
      );
      state.y = axis === "x" ? state.y : clamp(
        state.startOffsetY + event.clientY - state.startY,
        bounds?.minY,
        bounds?.maxY,
      );
      emitDrag(element, state);
    };

    const finish = (event: PointerEvent, cancelled: boolean): void => {
      if (destroyed || state.pointerId !== event.pointerId) return;
      const staleRelease = event.timeStamp - state.sampleTime > RELEASE_VELOCITY_WINDOW_MS;
      releasePointer();
      options.onDragEnd?.({ x: state.x, y: state.y }, cancelled);
      if (destroyed || cancelled || !inertia) return;

      if (staleRelease) return;

      if (axis !== "y" && state.velocityX !== 0) {
        let control: InertiaControls;
        control = animateInertia({
          from: state.x,
          initialVelocity: state.velocityX,
          friction,
          min: state.limits.minX,
          max: state.limits.maxX,
          onUpdate: ({ position }) => {
            state.x = position;
            emitDrag(element, state);
          },
          onComplete: () => {
            if (state.inertiaX === control) state.inertiaX = null;
          },
        });
        state.inertiaX = control;
      }
      if (axis !== "x" && state.velocityY !== 0) {
        let control: InertiaControls;
        control = animateInertia({
          from: state.y,
          initialVelocity: state.velocityY,
          friction,
          min: state.limits.minY,
          max: state.limits.maxY,
          onUpdate: ({ position }) => {
            state.y = position;
            emitDrag(element, state);
          },
          onComplete: () => {
            if (state.inertiaY === control) state.inertiaY = null;
          },
        });
        state.inertiaY = control;
      }
    };
    const onPointerUp = (event: PointerEvent): void => finish(event, false);
    const onPointerCancel = (event: PointerEvent): void => finish(event, true);
    const onLostPointerCapture = (event: PointerEvent): void => finish(event, true);

    element.addEventListener("pointerdown", onPointerDown);
    element.addEventListener("pointermove", onPointerMove);
    element.addEventListener("pointerup", onPointerUp);
    element.addEventListener("pointercancel", onPointerCancel);
    element.addEventListener("lostpointercapture", onLostPointerCapture);
    cleanups.push(() => {
      element.removeEventListener("pointerdown", onPointerDown);
      element.removeEventListener("pointermove", onPointerMove);
      element.removeEventListener("pointerup", onPointerUp);
      element.removeEventListener("pointercancel", onPointerCancel);
      element.removeEventListener("lostpointercapture", onLostPointerCapture);
      stopInertia();
      releasePointer();
    });
  }

  return {
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      let failure: unknown;
      let failed = false;
      const attempt = (step: () => void): void => {
        try {
          step();
        } catch (error) {
          if (!failed) failure = error;
          failed = true;
        }
      };
      for (const cleanup of cleanups) attempt(cleanup);
      for (const [element, state] of states) {
        attempt(() => removeTransformLayer(element, state));
        attempt(() => {
          if (state.touchAction === "") element.style.removeProperty("touch-action");
          else element.style.setProperty("touch-action", state.touchAction, state.touchActionPriority);
        });
      }
      states.clear();
      if (failed) throw failure;
    },
  };
}
