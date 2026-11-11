// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";

import {
  createInteractionManager,
  interact,
  InteractionManager,
  normalizeInputEvent,
  PointerTracker,
  TapRecognizer,
  DoubleTapRecognizer,
  LongPressRecognizer,
  DragRecognizer,
  PanRecognizer,
  SwipeRecognizer,
  PinchRecognizer,
  RotationRecognizer,
  KeyboardManager,
  InteractionPrioritizer,
  normalizePriority,
  GestureConfigurationError,
  type NormalizedInputEvent,
  type TapGesture,
  type DoubleTapGesture,
  type LongPressGesture,
  type DragGesture,
  type PanGesture,
  type SwipeGesture,
  type PinchGesture,
  type RotationGesture,
} from "../src/catalogue.js";

import { useInteraction } from "../src/react.js";

describe("Prompt 105 — Universal Interaction & Gestures", () => {
  let element: HTMLDivElement;

  beforeEach(() => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    element = document.createElement("div");
    element.style.width = "200px";
    element.style.height = "200px";
    document.body.appendChild(element);

    vi.spyOn(element, "getBoundingClientRect").mockReturnValue({
      left: 100,
      top: 50,
      width: 200,
      height: 200,
      right: 300,
      bottom: 250,
      x: 100,
      y: 50,
      toJSON: () => ({}),
    });
  });

  afterEach(() => {
    element.remove();
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // 1. UNIVERSAL INPUT NORMALIZATION
  // -------------------------------------------------------------------------
  describe("1. Universal Input Normalization", () => {
    it("normalizes pointer events with relative coordinates and pointer metadata", () => {
      const raw = new Event("pointerdown") as any;
      raw.pointerId = 42;
      raw.pointerType = "touch";
      raw.isPrimary = true;
      raw.clientX = 150;
      raw.clientY = 100;
      raw.pageX = 150;
      raw.pageY = 100;
      raw.screenX = 500;
      raw.screenY = 600;
      raw.movementX = 5;
      raw.movementY = -2;
      raw.pressure = 0.8;
      raw.tiltX = 15;
      raw.tiltY = -10;
      raw.twist = 45;
      raw.altKey = true;
      raw.shiftKey = false;
      raw.ctrlKey = false;
      raw.metaKey = true;

      const norm = normalizeInputEvent(raw, element);

      expect(norm.source).toBe("pointer");
      expect(norm.pointerId).toBe(42);
      expect(norm.pointerType).toBe("touch");
      expect(norm.isPrimary).toBe(true);
      expect(norm.point).toEqual({
        x: 50, // 150 - 100
        y: 50, // 100 - 50
        clientX: 150,
        clientY: 100,
        pageX: 150,
        pageY: 100,
        screenX: 500,
        screenY: 600,
      });
      expect(norm.movement).toEqual({ x: 5, y: -2 });
      expect(norm.pressure).toBe(0.8);
      expect(norm.tiltX).toBe(15);
      expect(norm.tiltY).toBe(-10);
      expect(norm.twist).toBe(45);
      expect(norm.modifiers).toEqual({
        alt: true,
        ctrl: false,
        meta: true,
        shift: false,
      });
    });

    it("normalizes mouse events with fallback coordinates and buttons", () => {
      const raw = new MouseEvent("mousedown", {
        clientX: 120,
        clientY: 70,
        buttons: 1,
      });

      const norm = normalizeInputEvent(raw, element);

      expect(norm.source).toBe("mouse");
      expect(norm.pointerType).toBe("mouse");
      expect(norm.isPrimary).toBe(true);
      expect(norm.point?.x).toBe(20);
      expect(norm.point?.y).toBe(20);
      expect(norm.pressure).toBe(0.5);
    });

    it("normalizes keyboard events and modifier keys", () => {
      const raw = new KeyboardEvent("keydown", {
        key: "Enter",
        code: "Enter",
        repeat: true,
        ctrlKey: true,
      });

      const norm = normalizeInputEvent(raw, element);

      expect(norm.source).toBe("keyboard");
      expect(norm.pointerType).toBe("keyboard");
      expect(norm.key).toBe("Enter");
      expect(norm.code).toBe("Enter");
      expect(norm.repeat).toBe(true);
      expect(norm.modifiers.ctrl).toBe(true);
      expect(norm.point).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // 2. POINTER TRACKER & MULTI-POINTER GEOMETRY
  // -------------------------------------------------------------------------
  describe("2. Pointer Tracker & Multi-Pointer Tracking", () => {
    it("tracks single pointer movement and computes velocity", () => {
      const tracker = new PointerTracker();

      const downEvent: NormalizedInputEvent = {
        source: "pointer",
        type: "pointerdown",
        pointerId: 1,
        pointerType: "mouse",
        isPrimary: true,
        point: { x: 10, y: 10, clientX: 10, clientY: 10, pageX: 10, pageY: 10, screenX: 10, screenY: 10 },
        movement: { x: 0, y: 0 },
        pressure: 0.5,
        tiltX: 0,
        tiltY: 0,
        twist: 0,
        modifiers: { alt: false, ctrl: false, meta: false, shift: false },
        key: null,
        code: null,
        repeat: false,
        timeStamp: 1000,
        target: element,
        originalEvent: new Event("pointerdown"),
        preventDefault: () => {},
        stopPropagation: () => {},
      };

      const tracked = tracker.trackDown(downEvent);
      expect(tracked).not.toBeNull();
      expect(tracker.pointerCount).toBe(1);
      expect(tracked?.distance).toBe(0);

      // Move 50ms later to (40, 50) -> dx=30, dy=40 (dist=50)
      const moveEvent: NormalizedInputEvent = {
        ...downEvent,
        type: "pointermove",
        point: { x: 40, y: 50, clientX: 40, clientY: 50, pageX: 40, pageY: 50, screenX: 40, screenY: 50 },
        timeStamp: 1050,
      };

      const updated = tracker.trackMove(moveEvent);
      expect(updated?.distance).toBe(50);
      expect(updated?.deltaX).toBe(30);
      expect(updated?.deltaY).toBe(40);
      // velocity in px/s over 0.05s: vx = 30 / 0.05 = 600, vy = 40 / 0.05 = 800
      expect(updated?.velocityX).toBeCloseTo(600, -1);
      expect(updated?.velocityY).toBeCloseTo(800, -1);

      // Up
      const up = tracker.trackUp(moveEvent);
      expect(up?.distance).toBe(50);
      expect(tracker.pointerCount).toBe(0);
    });

    it("computes multi-pointer centroid, distance, and angle", () => {
      const tracker = new PointerTracker();

      const makeEvent = (id: number, x: number, y: number): NormalizedInputEvent => ({
        source: "pointer",
        type: "pointerdown",
        pointerId: id,
        pointerType: "touch",
        isPrimary: id === 1,
        point: { x, y, clientX: x, clientY: y, pageX: x, pageY: y, screenX: x, screenY: y },
        movement: { x: 0, y: 0 },
        pressure: 1,
        tiltX: 0,
        tiltY: 0,
        twist: 0,
        modifiers: { alt: false, ctrl: false, meta: false, shift: false },
        key: null,
        code: null,
        repeat: false,
        timeStamp: 1000,
        target: element,
        originalEvent: new Event("pointerdown"),
        preventDefault: () => {},
        stopPropagation: () => {},
      });

      tracker.trackDown(makeEvent(1, 0, 0));
      tracker.trackDown(makeEvent(2, 60, 80));

      expect(tracker.pointerCount).toBe(2);
      const multi = tracker.getMultiPointerState();

      expect(multi.count).toBe(2);
      expect(multi.center).toEqual({ x: 30, y: 40 });
      expect(multi.distance).toBe(100); // 3-4-5 right triangle: sqrt(60^2 + 80^2) = 100
      expect(multi.angleDegrees).toBeCloseTo(53.13, 1);
    });
  });

  // -------------------------------------------------------------------------
  // 3. GESTURE RECOGNIZERS
  // -------------------------------------------------------------------------
  describe("3. Gesture Recognizers", () => {
    it("recognizes tap gestures within threshold and rejects when moved too far", () => {
      const onTap = vi.fn();
      const recognizer = new TapRecognizer({ maxDelayMs: 300, maxDistance: 10, onTap });
      const tracker = new PointerTracker();

      const makeEv = (type: string, x: number, y: number, time: number): NormalizedInputEvent => ({
        source: "pointer",
        type,
        pointerId: 1,
        pointerType: "mouse",
        isPrimary: true,
        point: { x, y, clientX: x, clientY: y, pageX: x, pageY: y, screenX: x, screenY: y },
        movement: { x: 0, y: 0 },
        pressure: 0.5,
        tiltX: 0,
        tiltY: 0,
        twist: 0,
        modifiers: { alt: false, ctrl: false, meta: false, shift: false },
        key: null,
        code: null,
        repeat: false,
        timeStamp: time,
        target: element,
        originalEvent: new Event(type),
        preventDefault: () => {},
        stopPropagation: () => {},
      });

      // Successful tap
      const down1 = makeEv("pointerdown", 20, 20, 100);
      const p1 = tracker.trackDown(down1)!;
      recognizer.processDown(down1, p1, tracker);

      const up1 = makeEv("pointerup", 22, 21, 200);
      const pUp1 = tracker.trackUp(up1)!;
      recognizer.processUp(up1, pUp1, tracker);

      expect(onTap).toHaveBeenCalledTimes(1);
      const gesture = onTap.mock.calls[0][0] as TapGesture;
      expect(gesture.type).toBe("tap");
      expect(gesture.duration).toBe(100);

      // Failed tap (moved too far: dx=30)
      const down2 = makeEv("pointerdown", 20, 20, 500);
      const p2 = tracker.trackDown(down2)!;
      recognizer.processDown(down2, p2, tracker);

      const move2 = makeEv("pointermove", 55, 20, 550);
      const pMove2 = tracker.trackMove(move2)!;
      recognizer.processMove(move2, pMove2, tracker);

      const up2 = makeEv("pointerup", 55, 20, 600);
      const pUp2 = tracker.trackUp(up2)!;
      recognizer.processUp(up2, pUp2, tracker);

      expect(onTap).toHaveBeenCalledTimes(1); // not called again
    });

    it("recognizes double tap gestures within interval", () => {
      const onDoubleTap = vi.fn();
      const recognizer = new DoubleTapRecognizer({ maxDelayMs: 300, onDoubleTap });
      const tracker = new PointerTracker();

      const makeEv = (x: number, y: number, time: number): NormalizedInputEvent => ({
        source: "pointer",
        type: "pointerup",
        pointerId: 1,
        pointerType: "mouse",
        isPrimary: true,
        point: { x, y, clientX: x, clientY: y, pageX: x, pageY: y, screenX: x, screenY: y },
        movement: { x: 0, y: 0 },
        pressure: 0,
        tiltX: 0,
        tiltY: 0,
        twist: 0,
        modifiers: { alt: false, ctrl: false, meta: false, shift: false },
        key: null,
        code: null,
        repeat: false,
        timeStamp: time,
        target: element,
        originalEvent: new Event("pointerup"),
        preventDefault: () => {},
        stopPropagation: () => {},
      });

      // First tap at t=100
      const ev1 = makeEv(50, 50, 100);
      const p1 = tracker.trackDown(ev1)!;
      recognizer.processUp(ev1, p1, tracker);

      // Second tap at t=250 (150ms interval)
      const ev2 = makeEv(52, 51, 250);
      const p2 = tracker.trackDown(ev2)!;
      recognizer.processUp(ev2, p2, tracker);

      expect(onDoubleTap).toHaveBeenCalledTimes(1);
      const gesture = onDoubleTap.mock.calls[0][0] as DoubleTapGesture;
      expect(gesture.type).toBe("double-tap");
      expect(gesture.interval).toBe(150);
    });

    it("recognizes long press and cancels if moved or released early", () => {
      vi.useFakeTimers();
      const onLongPress = vi.fn();
      const recognizer = new LongPressRecognizer({ minDurationMs: 400, onLongPress });
      const tracker = new PointerTracker();

      const makeEv = (type: string, x: number, y: number): NormalizedInputEvent => ({
        source: "pointer",
        type,
        pointerId: 1,
        pointerType: "touch",
        isPrimary: true,
        point: { x, y, clientX: x, clientY: y, pageX: x, pageY: y, screenX: x, screenY: y },
        movement: { x: 0, y: 0 },
        pressure: 1,
        tiltX: 0,
        tiltY: 0,
        twist: 0,
        modifiers: { alt: false, ctrl: false, meta: false, shift: false },
        key: null,
        code: null,
        repeat: false,
        timeStamp: Date.now(),
        target: element,
        originalEvent: new Event(type),
        preventDefault: () => {},
        stopPropagation: () => {},
      });

      const down = makeEv("pointerdown", 50, 50);
      const p = tracker.trackDown(down)!;
      recognizer.processDown(down, p, tracker);

      // Advance by 300ms (not yet triggered)
      vi.advanceTimersByTime(300);
      expect(onLongPress).not.toHaveBeenCalled();

      // Advance past 400ms
      vi.advanceTimersByTime(150);
      expect(onLongPress).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });

    it("recognizes drag gestures with axis constraints and bounds", () => {
      const onDragStart = vi.fn();
      const onDrag = vi.fn();
      const onDragEnd = vi.fn();

      const recognizer = new DragRecognizer({
        axis: "x",
        threshold: 5,
        bounds: { minX: -50, maxX: 50 },
        onDragStart,
        onDrag,
        onDragEnd,
      });

      const tracker = new PointerTracker();

      const makeEv = (type: string, x: number, y: number): NormalizedInputEvent => ({
        source: "pointer",
        type,
        pointerId: 1,
        pointerType: "mouse",
        isPrimary: true,
        point: { x, y, clientX: x, clientY: y, pageX: x, pageY: y, screenX: x, screenY: y },
        movement: { x: 0, y: 0 },
        pressure: 0.5,
        tiltX: 0,
        tiltY: 0,
        twist: 0,
        modifiers: { alt: false, ctrl: false, meta: false, shift: false },
        key: null,
        code: null,
        repeat: false,
        timeStamp: Date.now(),
        target: element,
        originalEvent: new Event(type),
        preventDefault: () => {},
        stopPropagation: () => {},
      });

      const down = makeEv("pointerdown", 0, 0);
      const pDown = tracker.trackDown(down)!;
      recognizer.processDown(down, pDown, tracker);

      // Move past threshold (dx = 20, dy = 10)
      const move1 = makeEv("pointermove", 20, 10);
      const pMove1 = tracker.trackMove(move1)!;
      recognizer.processMove(move1, pMove1, tracker);

      expect(onDragStart).toHaveBeenCalledTimes(1);
      const startGesture = onDragStart.mock.calls[0][0] as DragGesture;
      expect(startGesture.offset.x).toBe(20);
      expect(startGesture.offset.y).toBe(0); // axis locked to 'x'

      // Move beyond bounds (dx = 80, bounds.maxX = 50)
      const move2 = makeEv("pointermove", 80, 20);
      const pMove2 = tracker.trackMove(move2)!;
      recognizer.processMove(move2, pMove2, tracker);

      expect(onDrag).toHaveBeenCalledTimes(1);
      const dragGesture = onDrag.mock.calls[0][0] as DragGesture;
      expect(dragGesture.offset.x).toBe(50); // clamped to bounds.maxX

      // Up
      const up = makeEv("pointerup", 80, 20);
      const pUp = tracker.trackUp(up)!;
      recognizer.processUp(up, pUp, tracker);

      expect(onDragEnd).toHaveBeenCalledTimes(1);
    });

    it("recognizes directional swipe gestures", () => {
      const onSwipe = vi.fn();
      const recognizer = new SwipeRecognizer({
        minDistance: 30,
        maxDuration: 300,
        onSwipe,
      });

      const tracker = new PointerTracker();

      // Swipe left: starts at (100, 50), ends at (20, 50) -> dx = -80 in 150ms
      const down = {
        source: "pointer" as const,
        type: "pointerdown",
        pointerId: 1,
        pointerType: "touch" as const,
        isPrimary: true,
        point: { x: 100, y: 50, clientX: 100, clientY: 50, pageX: 100, pageY: 50, screenX: 100, screenY: 50 },
        movement: { x: 0, y: 0 },
        pressure: 1,
        tiltX: 0,
        tiltY: 0,
        twist: 0,
        modifiers: { alt: false, ctrl: false, meta: false, shift: false },
        key: null,
        code: null,
        repeat: false,
        timeStamp: 1000,
        target: element,
        originalEvent: new Event("pointerdown"),
        preventDefault: () => {},
        stopPropagation: () => {},
      };

      const pDown = tracker.trackDown(down)!;
      recognizer.processDown();

      const up = {
        ...down,
        type: "pointerup",
        point: { x: 20, y: 50, clientX: 20, clientY: 50, pageX: 20, pageY: 50, screenX: 20, screenY: 50 },
        timeStamp: 1150,
      };

      const pUp = tracker.trackUp(up)!;
      recognizer.processUp(up, pUp);

      expect(onSwipe).toHaveBeenCalledTimes(1);
      const swipeGesture = onSwipe.mock.calls[0][0] as SwipeGesture;
      expect(swipeGesture.direction).toBe("left");
      expect(swipeGesture.distance).toBe(80);
      expect(swipeGesture.duration).toBe(150);
    });

    it("recognizes two-pointer pinch and rotation gestures", () => {
      const onPinch = vi.fn();
      const onRotation = vi.fn();

      const pinchRec = new PinchRecognizer({ minDistance: 5, onPinch });
      const rotRec = new RotationRecognizer({ threshold: 1, onRotation });
      const tracker = new PointerTracker();

      const makeEv = (id: number, x: number, y: number): NormalizedInputEvent => ({
        source: "pointer",
        type: "pointermove",
        pointerId: id,
        pointerType: "touch",
        isPrimary: id === 1,
        point: { x, y, clientX: x, clientY: y, pageX: x, pageY: y, screenX: x, screenY: y },
        movement: { x: 0, y: 0 },
        pressure: 1,
        tiltX: 0,
        tiltY: 0,
        twist: 0,
        modifiers: { alt: false, ctrl: false, meta: false, shift: false },
        key: null,
        code: null,
        repeat: false,
        timeStamp: Date.now(),
        target: element,
        originalEvent: new Event("pointermove"),
        preventDefault: () => {},
        stopPropagation: () => {},
      });

      // Pointers start at distance 50 horizontally: (0, 0) and (50, 0)
      tracker.trackDown(makeEv(1, 0, 0));
      tracker.trackDown(makeEv(2, 50, 0));

      pinchRec.processDown(makeEv(2, 50, 0), tracker.getPointer(2)!, tracker);
      rotRec.processDown(makeEv(2, 50, 0), tracker.getPointer(2)!, tracker);

      // Pointers expand to distance 100 and rotate 90 degrees: (0, 0) and (0, 100)
      const ev1 = makeEv(1, 0, 0);
      const ev2 = makeEv(2, 0, 100);
      tracker.trackMove(ev1);
      const p2 = tracker.trackMove(ev2)!;

      pinchRec.processMove(ev2, p2, tracker);
      rotRec.processMove(ev2, p2, tracker);

      expect(onPinch).toHaveBeenCalled();
      const pinchResult = onPinch.mock.calls[0][0] as PinchGesture;
      expect(pinchResult.scale).toBeCloseTo(2, 1); // 100 / 50 = 2

      expect(onRotation).toHaveBeenCalled();
      const rotResult = onRotation.mock.calls[0][0] as RotationGesture;
      expect(rotResult.rotation).toBeCloseTo(90, 0); // rotated from (50,0) to (0,100) = 90 deg
    });
  });

  // -------------------------------------------------------------------------
  // 4. KEYBOARD INTERACTION & ACCESSIBILITY
  // -------------------------------------------------------------------------
  describe("4. Keyboard Interactions & Accessibility", () => {
    it("handles activation keys and escape cancellation", () => {
      const onActivate = vi.fn();
      const onCancel = vi.fn();

      const km = new KeyboardManager({
        enabled: true,
        onActivate,
        onCancel,
      });

      const makeKey = (key: string): NormalizedInputEvent => ({
        source: "keyboard",
        type: "keydown",
        pointerId: null,
        pointerType: "keyboard",
        isPrimary: true,
        point: null,
        movement: { x: 0, y: 0 },
        pressure: 0,
        tiltX: 0,
        tiltY: 0,
        twist: 0,
        modifiers: { alt: false, ctrl: false, meta: false, shift: false },
        key,
        code: key,
        repeat: false,
        timeStamp: Date.now(),
        target: element,
        originalEvent: new Event("keydown"),
        preventDefault: () => {},
        stopPropagation: () => {},
      });

      km.handleKeyDown(makeKey("Enter"));
      km.handleKeyDown(makeKey(" "));
      expect(onActivate).toHaveBeenCalledTimes(2);

      km.handleKeyDown(makeKey("Escape"));
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it("matches custom key bindings with modifier requirements", () => {
      const action = vi.fn();
      const km = new KeyboardManager({
        bindings: [
          {
            key: "s",
            modifiers: { ctrl: true },
            action,
          },
        ],
      });

      const makeEv = (key: string, ctrl: boolean): NormalizedInputEvent => ({
        source: "keyboard",
        type: "keydown",
        pointerId: null,
        pointerType: "keyboard",
        isPrimary: true,
        point: null,
        movement: { x: 0, y: 0 },
        pressure: 0,
        tiltX: 0,
        tiltY: 0,
        twist: 0,
        modifiers: { alt: false, ctrl, meta: false, shift: false },
        key,
        code: `Key${key.toUpperCase()}`,
        repeat: false,
        timeStamp: Date.now(),
        target: element,
        originalEvent: new Event("keydown"),
        preventDefault: () => {},
        stopPropagation: () => {},
      });

      // Pressed 's' without ctrl
      km.handleKeyDown(makeEv("s", false));
      expect(action).not.toHaveBeenCalled();

      // Pressed 's' with ctrl
      km.handleKeyDown(makeEv("s", true));
      expect(action).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // 5. PRIORITIZATION & CONFLICT RESOLUTION
  // -------------------------------------------------------------------------
  describe("5. Prioritization & Conflict Resolution", () => {
    it("normalizes priority levels correctly", () => {
      expect(normalizePriority("critical")).toBe(30);
      expect(normalizePriority("high")).toBe(20);
      expect(normalizePriority("normal")).toBe(10);
      expect(normalizePriority("low")).toBe(0);
      expect(normalizePriority(15)).toBe(15);
    });

    it("resolves conflicts by cancelling lower priority gestures under exclusive policy", () => {
      const prioritizer = new InteractionPrioritizer([
        {
          gesture: "drag",
          priority: "high",
          policy: "exclusive",
          blocks: ["tap", "long-press"],
        },
        {
          gesture: "tap",
          priority: "normal",
        },
      ]);

      const dragRec = new DragRecognizer();
      dragRec.status = "began";

      const tapRec = new TapRecognizer();
      tapRec.status = "possible";

      prioritizer.resolveConflicts(dragRec, [dragRec, tapRec]);

      expect(tapRec.status).toBe("cancelled");
    });
  });

  // -------------------------------------------------------------------------
  // 6. INTERACTION MANAGER & LIFECYCLE
  // -------------------------------------------------------------------------
  describe("6. Interaction Manager Lifecycle & Teardown", () => {
    it("attaches event listeners and dispatches to recognizers", () => {
      const onTap = vi.fn();
      const manager = createInteractionManager(element, {
        tap: { onTap },
      });

      // Dispatch synthetic pointerdown and pointerup
      const down = new MouseEvent("pointerdown", { bubbles: true, clientX: 110, clientY: 60 });
      const up = new MouseEvent("pointerup", { bubbles: true, clientX: 110, clientY: 60 });

      element.dispatchEvent(down);
      element.dispatchEvent(up);

      expect(onTap).toHaveBeenCalledTimes(1);

      manager.destroy();
    });

    it("cleans up listeners and cancels active interactions on destroy()", () => {
      const onTap = vi.fn();
      const manager = interact(element, {
        tap: { onTap },
      });

      manager.destroy();

      const down = new MouseEvent("pointerdown", { bubbles: true, clientX: 110, clientY: 60 });
      const up = new MouseEvent("pointerup", { bubbles: true, clientX: 110, clientY: 60 });

      element.dispatchEvent(down);
      element.dispatchEvent(up);

      expect(onTap).not.toHaveBeenCalled();
    });

    it("updates options dynamically without rebuilding from scratch", () => {
      const onTap1 = vi.fn();
      const onTap2 = vi.fn();

      const manager = createInteractionManager(element, {
        tap: { onTap: onTap1 },
      });

      manager.updateOptions({
        tap: { onTap: onTap2 },
      });

      const down = new MouseEvent("pointerdown", { bubbles: true, clientX: 110, clientY: 60 });
      const up = new MouseEvent("pointerup", { bubbles: true, clientX: 110, clientY: 60 });

      element.dispatchEvent(down);
      element.dispatchEvent(up);

      expect(onTap1).not.toHaveBeenCalled();
      expect(onTap2).toHaveBeenCalledTimes(1);

      manager.destroy();
    });
  });

  // -------------------------------------------------------------------------
  // 7. REACT HOOK INTEGRATION
  // -------------------------------------------------------------------------
  describe("7. React Hook useInteraction", () => {
    it("mounts interaction manager on DOM node and cleans up on unmount", () => {
      const container = document.createElement("div");
      document.body.appendChild(container);
      const root = createRoot(container);

      const onTap = vi.fn();

      function TestComponent() {
        const { ref, isInteracting } = useInteraction({
          tap: { onTap },
        });

        return createElement("button", {
          ref,
          "data-interacting": isInteracting ? "true" : "false",
        }, "Click me");
      }

      act(() => {
        root.render(createElement(TestComponent));
      });

      const btn = container.querySelector("button")!;
      expect(btn).not.toBeNull();

      act(() => {
        btn.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, clientX: 10, clientY: 10 }));
        btn.dispatchEvent(new MouseEvent("pointerup", { bubbles: true, clientX: 10, clientY: 10 }));
      });

      expect(onTap).toHaveBeenCalledTimes(1);

      // Unmount
      act(() => {
        root.unmount();
      });

      // No lingering triggers
      act(() => {
        btn.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, clientX: 10, clientY: 10 }));
        btn.dispatchEvent(new MouseEvent("pointerup", { bubbles: true, clientX: 10, clientY: 10 }));
      });

      expect(onTap).toHaveBeenCalledTimes(1);
      container.remove();
    });
  });

  // -------------------------------------------------------------------------
  // 8. ERROR HANDLING & CONFIGURATION VALIDATION
  // -------------------------------------------------------------------------
  describe("8. Error Handling & Validation", () => {
    it("throws GestureConfigurationError for negative thresholds", () => {
      expect(() => new TapRecognizer({ maxDelayMs: -10 })).toThrow(GestureConfigurationError);
      expect(() => new LongPressRecognizer({ minDurationMs: -5 })).toThrow(GestureConfigurationError);
      expect(() => new DragRecognizer({ threshold: -1 })).toThrow(GestureConfigurationError);
      expect(() => new SwipeRecognizer({ minDistance: -20 })).toThrow(GestureConfigurationError);
      expect(() => new PinchRecognizer({ minDistance: -1 })).toThrow(GestureConfigurationError);
      expect(() => new RotationRecognizer({ threshold: -5 })).toThrow(GestureConfigurationError);
    });
  });
});
