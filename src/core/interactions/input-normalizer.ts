/**
 * AF Motion Universal Input Normalizer
 *
 * Normalizes browser-specific Pointer, Mouse, Touch, and Keyboard events
 * into a single unified event representation.
 */

import type {
  InputSourceType,
  InteractionPoint,
  ModifierKeys,
  NormalizedInputEvent,
  Point2D,
  PointerType,
} from "./types.js";

function getRelativePoint(
  clientX: number,
  clientY: number,
  target: EventTarget | null
): Point2D {
  if (
    typeof HTMLElement !== "undefined" &&
    target instanceof HTMLElement &&
    typeof target.getBoundingClientRect === "function"
  ) {
    try {
      const rect = target.getBoundingClientRect();
      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    } catch {
      // Fallback if detached or getBoundingClientRect fails
    }
  }
  return { x: clientX, y: clientY };
}

function extractPoint(
  rawEvent: any,
  target: EventTarget | null
): InteractionPoint | null {
  let clientX: number | undefined;
  let clientY: number | undefined;
  let pageX: number | undefined;
  let pageY: number | undefined;
  let screenX: number | undefined;
  let screenY: number | undefined;

  if (rawEvent.touches && rawEvent.touches.length > 0) {
    const touch = rawEvent.touches[0];
    clientX = touch.clientX;
    clientY = touch.clientY;
    pageX = touch.pageX;
    pageY = touch.pageY;
    screenX = touch.screenX;
    screenY = touch.screenY;
  } else if (rawEvent.changedTouches && rawEvent.changedTouches.length > 0) {
    const touch = rawEvent.changedTouches[0];
    clientX = touch.clientX;
    clientY = touch.clientY;
    pageX = touch.pageX;
    pageY = touch.pageY;
    screenX = touch.screenX;
    screenY = touch.screenY;
  } else if (typeof rawEvent.clientX === "number") {
    clientX = rawEvent.clientX;
    clientY = rawEvent.clientY;
    pageX = rawEvent.pageX ?? rawEvent.clientX;
    pageY = rawEvent.pageY ?? rawEvent.clientY;
    screenX = rawEvent.screenX ?? rawEvent.clientX;
    screenY = rawEvent.screenY ?? rawEvent.clientY;
  }

  if (clientX === undefined || clientY === undefined) {
    return null;
  }

  const rel = getRelativePoint(clientX, clientY, target);

  return {
    x: rel.x,
    y: rel.y,
    clientX,
    clientY,
    pageX: pageX ?? clientX,
    pageY: pageY ?? clientY,
    screenX: screenX ?? clientX,
    screenY: screenY ?? clientY,
  };
}

export function normalizeInputEvent(
  originalEvent: Event,
  targetOverride?: EventTarget | null
): NormalizedInputEvent {
  const target = targetOverride ?? originalEvent.target;
  const raw = originalEvent as any;

  let source: InputSourceType = "pointer";
  let pointerType: PointerType = "mouse";
  let pointerId: number | null = null;
  let isPrimary = true;
  let pressure = 0;
  let tiltX = 0;
  let tiltY = 0;
  let twist = 0;
  let width: number | undefined = undefined;
  let height: number | undefined = undefined;
  let movement: Point2D = { x: 0, y: 0 };
  let key: string | null = null;
  let code: string | null = null;
  let repeat = false;

  const eventType = originalEvent.type;

  if (eventType.startsWith("key")) {
    source = "keyboard";
    pointerType = "keyboard";
    key = raw.key ?? null;
    code = raw.code ?? null;
    repeat = Boolean(raw.repeat);
  } else if (eventType.startsWith("touch") || (typeof TouchEvent !== "undefined" && originalEvent instanceof TouchEvent)) {
    source = "touch";
    pointerType = "touch";
    if (raw.changedTouches && raw.changedTouches.length > 0) {
      pointerId = raw.changedTouches[0].identifier;
      isPrimary = raw.changedTouches[0].identifier === 0;
      width = raw.changedTouches[0].radiusX ? raw.changedTouches[0].radiusX * 2 : undefined;
      height = raw.changedTouches[0].radiusY ? raw.changedTouches[0].radiusY * 2 : undefined;
    }
    pressure = raw.touches?.length ? 1 : 0;
  } else if (
    (typeof PointerEvent !== "undefined" && originalEvent instanceof PointerEvent) ||
    "pointerId" in raw
  ) {
    source = "pointer";
    pointerId = typeof raw.pointerId === "number" ? raw.pointerId : 1;
    pointerType = (raw.pointerType as PointerType) || "mouse";
    isPrimary = raw.isPrimary ?? true;
    pressure = typeof raw.pressure === "number" ? raw.pressure : (raw.buttons ? 0.5 : 0);
    tiltX = raw.tiltX ?? 0;
    tiltY = raw.tiltY ?? 0;
    twist = raw.twist ?? 0;
    width = typeof raw.width === "number" ? raw.width : undefined;
    height = typeof raw.height === "number" ? raw.height : undefined;
    movement = {
      x: raw.movementX ?? 0,
      y: raw.movementY ?? 0,
    };
  } else if (eventType.startsWith("mouse")) {
    source = "mouse";
    pointerType = "mouse";
    pointerId = 1;
    isPrimary = true;
    pressure = raw.buttons ? 0.5 : 0;
    movement = {
      x: raw.movementX ?? 0,
      y: raw.movementY ?? 0,
    };
  }

  const point = extractPoint(raw, target);

  const modifiers: ModifierKeys = {
    alt: Boolean(raw.altKey),
    ctrl: Boolean(raw.ctrlKey),
    meta: Boolean(raw.metaKey),
    shift: Boolean(raw.shiftKey),
  };

  let defaultPrevented = false;
  let propagationStopped = false;

  return {
    source,
    type: eventType,
    pointerId,
    pointerType,
    isPrimary,
    point,
    movement,
    pressure,
    tiltX,
    tiltY,
    twist,
    width,
    height,
    modifiers,
    key,
    code,
    repeat,
    timeStamp: originalEvent.timeStamp || Date.now(),
    target,
    originalEvent,
    preventDefault() {
      defaultPrevented = true;
      if (typeof originalEvent.preventDefault === "function") {
        originalEvent.preventDefault();
      }
    },
    stopPropagation() {
      propagationStopped = true;
      if (typeof originalEvent.stopPropagation === "function") {
        originalEvent.stopPropagation();
      }
    },
  };
}
