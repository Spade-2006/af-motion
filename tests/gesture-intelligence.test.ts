// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  BUILT_IN_GESTURE_DEFINITIONS,
  calculateAngle,
  calculateLinearity,
  classifyAllGestures,
  classifyGesture,
  createGestureRecognizer,
  createGestureSequence,
  detectDirection,
  evaluateGestureMatch,
  explainGesture,
  getGestureDefinition,
  getRegisteredGestures,
  registerGesture,
  resetGestureRegistry,
  unregisterGesture,
  type CustomGestureDefinition,
  type GestureClassificationResult,
  type GestureSample,
} from "../src/catalogue.js";
import { GestureConfigurationError } from "../src/core/interactions/errors.js";

describe("Prompt 108 — Gesture Recognition Intelligence", () => {
  let element: HTMLDivElement;

  beforeEach(() => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    resetGestureRegistry();

    element = document.createElement("div");
    element.style.width = "400px";
    element.style.height = "400px";
    document.body.appendChild(element);

    vi.spyOn(element, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      width: 400,
      height: 400,
      right: 400,
      bottom: 400,
      x: 0,
      y: 0,
      toJSON: () => {},
    });
  });

  afterEach(() => {
    resetGestureRegistry();
    if (element.parentNode) {
      element.parentNode.removeChild(element);
    }
    vi.restoreAllMocks();
  });

  describe("1. Custom Gesture Registry & Validation", () => {
    it("initializes with complete set of built-in gesture definitions", () => {
      const registered = getRegisteredGestures();
      expect(registered.length).toBeGreaterThanOrEqual(18);

      const ids = registered.map((g) => g.id);
      expect(ids).toContain("tap");
      expect(ids).toContain("double-tap");
      expect(ids).toContain("long-press");
      expect(ids).toContain("drag");
      expect(ids).toContain("pan");
      expect(ids).toContain("swipe-left");
      expect(ids).toContain("swipe-right");
      expect(ids).toContain("swipe-up");
      expect(ids).toContain("swipe-down");
      expect(ids).toContain("edge-swipe-left");
      expect(ids).toContain("edge-swipe-right");
      expect(ids).toContain("hold-and-drag");
      expect(ids).toContain("two-finger-tap");
      expect(ids).toContain("pinch-in");
      expect(ids).toContain("pinch-out");
      expect(ids).toContain("rotate-cw");
      expect(ids).toContain("rotate-ccw");
    });

    it("registers and unregisters custom gesture definitions", () => {
      const customDef: CustomGestureDefinition = {
        id: "three-finger-flick",
        name: "Three-Finger Flick",
        pointerCount: 3,
        minDistance: 50,
        maxDurationMs: 250,
        minVelocity: 200,
      };

      const unregister = registerGesture(customDef);
      expect(getGestureDefinition("three-finger-flick")).toEqual(customDef);

      unregister();
      expect(getGestureDefinition("three-finger-flick")).toBeUndefined();
    });

    it("unregisters by id directly", () => {
      registerGesture({
        id: "test-gesture",
        minDistance: 10,
      });
      expect(getGestureDefinition("test-gesture")).toBeDefined();

      const removed = unregisterGesture("test-gesture");
      expect(removed).toBe(true);
      expect(getGestureDefinition("test-gesture")).toBeUndefined();
    });

    it("enforces strict validation on definition properties", () => {
      expect(() => registerGesture(null as any)).toThrow(GestureConfigurationError);
      expect(() => registerGesture({ id: "" })).toThrow(GestureConfigurationError);
      expect(() => registerGesture({ id: "invalid id with spaces" })).toThrow(GestureConfigurationError);
      expect(() => registerGesture({ id: "valid", minDistance: -10 })).toThrow(GestureConfigurationError);
      expect(() => registerGesture({ id: "valid", minDistance: 50, maxDistance: 20 })).toThrow(
        GestureConfigurationError
      );
      expect(() => registerGesture({ id: "valid", minDurationMs: 500, maxDurationMs: 100 })).toThrow(
        GestureConfigurationError
      );
      expect(() => registerGesture({ id: "valid", minVelocity: 300, maxVelocity: 100 })).toThrow(
        GestureConfigurationError
      );
    });

    it("resets registry back to initial built-in state", () => {
      registerGesture({ id: "temp-gesture", minDistance: 10 });
      expect(getGestureDefinition("temp-gesture")).toBeDefined();

      resetGestureRegistry();
      expect(getGestureDefinition("temp-gesture")).toBeUndefined();
      expect(getGestureDefinition("tap")).toBeDefined();
    });
  });

  describe("2. Direction & Linearity Geometry", () => {
    it("calculates angles accurately in 360 degrees", () => {
      expect(calculateAngle(10, 0)).toBe(0); // right
      expect(calculateAngle(0, 10)).toBe(90); // down
      expect(calculateAngle(-10, 0)).toBe(180); // left
      expect(calculateAngle(0, -10)).toBe(270); // up
      expect(calculateAngle(10, 10)).toBe(45); // down-right
    });

    it("detects cardinal and diagonal directions", () => {
      expect(detectDirection(50, 0)).toBe("right");
      expect(detectDirection(-50, 0)).toBe("left");
      expect(detectDirection(0, 50)).toBe("down");
      expect(detectDirection(0, -50)).toBe("up");
      expect(detectDirection(50, 50)).toBe("down-right");
      expect(detectDirection(-50, 50)).toBe("down-left");
      expect(detectDirection(-50, -50)).toBe("up-left");
      expect(detectDirection(50, -50)).toBe("up-right");
      expect(detectDirection(1, 1)).toBeNull(); // below minimum threshold
    });

    it("computes path linearity correctly", () => {
      const straightSample: GestureSample = {
        pointerCount: 1,
        durationMs: 100,
        distance: 100,
        deltaX: 100,
        deltaY: 0,
        velocityX: 1000,
        velocityY: 0,
        speed: 1000,
        startPoint: { x: 0, y: 0 },
        currentPoint: { x: 100, y: 0 },
        pathLength: 100,
      };
      expect(calculateLinearity(straightSample)).toBe(1.0);

      const curvedSample: GestureSample = {
        ...straightSample,
        distance: 70,
        pathLength: 140,
      };
      expect(calculateLinearity(curvedSample)).toBe(0.5);
    });
  });

  describe("3. Deterministic Gesture Classification & Scoring", () => {
    it("classifies tap with high confidence", () => {
      const sample: GestureSample = {
        pointerCount: 1,
        durationMs: 120,
        distance: 4,
        deltaX: 3,
        deltaY: 2,
        velocityX: 25,
        velocityY: 15,
        speed: 30,
        startPoint: { x: 100, y: 100 },
        currentPoint: { x: 103, y: 102 },
      };

      const result = classifyGesture(sample);
      expect(result.isMatch).toBe(true);
      expect(result.gestureId).toBe("tap");
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.explanation.summary).toContain("Tap");
    });

    it("classifies swipe in specific directions with high velocity", () => {
      const swipeLeftSample: GestureSample = {
        pointerCount: 1,
        durationMs: 180,
        distance: 80,
        deltaX: -80,
        deltaY: 2,
        velocityX: -400,
        velocityY: 10,
        speed: 400,
        startPoint: { x: 200, y: 200 },
        currentPoint: { x: 120, y: 202 },
        pathLength: 82,
      };

      const result = classifyGesture(swipeLeftSample);
      expect(result.isMatch).toBe(true);
      expect(result.gestureId).toBe("swipe-left");
      expect(result.confidence).toBeGreaterThan(0.85);
      expect(result.explanation.directionMatch).toBe(1.0);
    });

    it("rejects swipe if velocity is insufficient", () => {
      const slowSwipeSample: GestureSample = {
        pointerCount: 1,
        durationMs: 300,
        distance: 50,
        deltaX: 50,
        deltaY: 0,
        velocityX: 40, // min is 150
        velocityY: 0,
        speed: 40,
        startPoint: { x: 50, y: 50 },
        currentPoint: { x: 100, y: 50 },
      };

      const def = getGestureDefinition("swipe-right")!;
      const result = evaluateGestureMatch(slowSwipeSample, def);
      expect(result.isMatch).toBe(false);
      expect(result.explanation.velocityMatch).toBeLessThan(0.5);
    });

    it("classifies edge gestures when starting within boundary threshold", () => {
      const edgeSwipeSample: GestureSample = {
        pointerCount: 1,
        durationMs: 200,
        distance: 60,
        deltaX: 60,
        deltaY: 0,
        velocityX: 300,
        velocityY: 0,
        speed: 300,
        startPoint: { x: 15, y: 200 }, // bounds left = 0, threshold = 30 -> inside!
        currentPoint: { x: 75, y: 200 },
        targetBounds: { minX: 0, minY: 0, maxX: 400, maxY: 400 },
      };

      const def = getGestureDefinition("edge-swipe-left")!;
      const result = evaluateGestureMatch(edgeSwipeSample, def);
      expect(result.isMatch).toBe(true);
      expect(result.explanation.edgeMatch).toBe(1.0);

      // Same swipe starting far from edge should fail edge match
      const centerSwipeSample: GestureSample = {
        ...edgeSwipeSample,
        startPoint: { x: 150, y: 200 },
      };
      const centerResult = evaluateGestureMatch(centerSwipeSample, def);
      expect(centerResult.isMatch).toBe(false);
    });

    it("classifies two-finger pinch-in and pinch-out", () => {
      const pinchInSample: GestureSample = {
        pointerCount: 2,
        durationMs: 300,
        distance: 40,
        deltaX: 0,
        deltaY: 0,
        velocityX: 0,
        velocityY: 0,
        speed: 0,
        startPoint: { x: 200, y: 200 },
        currentPoint: { x: 200, y: 200 },
        scaleChange: 0.7, // contracted by 30%
      };

      const pinchInResult = evaluateGestureMatch(pinchInSample, getGestureDefinition("pinch-in")!);
      expect(pinchInResult.isMatch).toBe(true);
      expect(pinchInResult.explanation.scaleMatch).toBe(1.0);

      const pinchOutSample: GestureSample = {
        ...pinchInSample,
        scaleChange: 1.4, // expanded by 40%
      };
      const pinchOutResult = evaluateGestureMatch(pinchOutSample, getGestureDefinition("pinch-out")!);
      expect(pinchOutResult.isMatch).toBe(true);
      expect(pinchOutResult.explanation.scaleMatch).toBe(1.0);
    });

    it("classifies clockwise and counter-clockwise rotation", () => {
      const rotCwSample: GestureSample = {
        pointerCount: 2,
        durationMs: 250,
        distance: 10,
        deltaX: 0,
        deltaY: 0,
        velocityX: 0,
        velocityY: 0,
        speed: 0,
        startPoint: { x: 100, y: 100 },
        currentPoint: { x: 100, y: 100 },
        rotationChange: 45, // clockwise
      };

      const cwResult = evaluateGestureMatch(rotCwSample, getGestureDefinition("rotate-cw")!);
      expect(cwResult.isMatch).toBe(true);
      expect(cwResult.explanation.rotationMatch).toBe(1.0);

      const rotCcwSample: GestureSample = {
        ...rotCwSample,
        rotationChange: -40, // counter-clockwise
      };
      const ccwResult = evaluateGestureMatch(rotCcwSample, getGestureDefinition("rotate-ccw")!);
      expect(ccwResult.isMatch).toBe(true);
      expect(ccwResult.explanation.rotationMatch).toBe(1.0);
    });

    it("provides complete explainable breakdown in explainGesture", () => {
      const sample: GestureSample = {
        pointerCount: 1,
        durationMs: 200,
        distance: 50,
        deltaX: 50,
        deltaY: 0,
        velocityX: 250,
        velocityY: 0,
        speed: 250,
        startPoint: { x: 10, y: 10 },
        currentPoint: { x: 60, y: 10 },
        pathLength: 50,
      };

      const explanation = explainGesture(sample, getGestureDefinition("swipe-right")!);
      expect(explanation.directionMatch).toBe(1.0);
      expect(explanation.velocityMatch).toBe(1.0);
      expect(explanation.distanceMatch).toBe(1.0);
      expect(explanation.durationMatch).toBe(1.0);
      expect(explanation.pointerCountMatch).toBe(1.0);
      expect(explanation.linearity).toBe(1.0);
      expect(explanation.summary).toContain("Matched");
    });

    it("classifies all registered gestures sorted by confidence", () => {
      const sample: GestureSample = {
        pointerCount: 1,
        durationMs: 150,
        distance: 60,
        deltaX: 60,
        deltaY: 0,
        velocityX: 300,
        velocityY: 0,
        speed: 300,
        startPoint: { x: 100, y: 100 },
        currentPoint: { x: 160, y: 100 },
      };

      const all = classifyAllGestures(sample);
      expect(all.length).toBeGreaterThanOrEqual(18);
      expect(all[0].confidence).toBeGreaterThanOrEqual(all[1].confidence);
      expect(all[0].gestureId).toBe("swipe-right");
    });
  });

  describe("4. Gesture Sequence State Machine", () => {
    it("completes ordered multi-stage gesture sequence", () => {
      const onStageCompleted = vi.fn();
      const onSequenceCompleted = vi.fn();

      const sequence = createGestureSequence({
        id: "tap-to-swipe",
        stages: [{ gestureId: "tap" }, { gestureId: "swipe-right" }],
        onStageCompleted,
        onSequenceCompleted,
      });

      expect(sequence.getState().stageIndex).toBe(0);
      expect(sequence.getState().isMatched).toBe(false);

      const tapMatch: GestureClassificationResult = {
        gestureId: "tap",
        name: "Tap",
        confidence: 0.95,
        isMatch: true,
        explanation: {} as any,
        sample: {} as any,
        recognizedAt: 1000,
      };

      const fed1 = sequence.feed(tapMatch);
      expect(fed1).toBe(true);
      expect(sequence.getState().stageIndex).toBe(1);
      expect(onStageCompleted).toHaveBeenCalledTimes(1);
      expect(sequence.getState().isMatched).toBe(false);

      const swipeMatch: GestureClassificationResult = {
        gestureId: "swipe-right",
        name: "Swipe Right",
        confidence: 0.9,
        isMatch: true,
        explanation: {} as any,
        sample: {} as any,
        recognizedAt: 1200,
      };

      const fed2 = sequence.feed(swipeMatch);
      expect(fed2).toBe(true);
      expect(sequence.getState().isMatched).toBe(true);
      expect(sequence.getState().completedStages).toEqual(["tap", "swipe-right"]);
      expect(onSequenceCompleted).toHaveBeenCalledTimes(1);
      expect(onSequenceCompleted).toHaveBeenCalledWith([tapMatch, swipeMatch]);
    });

    it("supports optional stages with graceful skipping", () => {
      const onSequenceCompleted = vi.fn();

      const sequence = createGestureSequence({
        id: "optional-test",
        stages: [
          { gestureId: "tap" },
          { gestureId: "double-tap", optional: true },
          { gestureId: "swipe-right" },
        ],
        onSequenceCompleted,
      });

      const tapMatch: GestureClassificationResult = {
        gestureId: "tap",
        name: "Tap",
        confidence: 0.9,
        isMatch: true,
        explanation: {} as any,
        sample: {} as any,
        recognizedAt: 1000,
      };

      sequence.feed(tapMatch);
      expect(sequence.getState().stageIndex).toBe(1);

      // Skip double-tap and feed swipe-right directly
      const swipeMatch: GestureClassificationResult = {
        gestureId: "swipe-right",
        name: "Swipe Right",
        confidence: 0.9,
        isMatch: true,
        explanation: {} as any,
        sample: {} as any,
        recognizedAt: 1200,
      };

      const fed = sequence.feed(swipeMatch);
      expect(fed).toBe(true);
      expect(sequence.getState().isMatched).toBe(true);
      expect(onSequenceCompleted).toHaveBeenCalledTimes(1);
    });

    it("resets on mismatch and can restart immediately if candidate matches stage 0", () => {
      const onSequenceFailed = vi.fn();

      const sequence = createGestureSequence({
        stages: [{ gestureId: "tap" }, { gestureId: "swipe-right" }],
        onSequenceFailed,
      });

      const tapMatch: GestureClassificationResult = {
        gestureId: "tap",
        name: "Tap",
        confidence: 0.9,
        isMatch: true,
        explanation: {} as any,
        sample: {} as any,
        recognizedAt: 1000,
      };

      sequence.feed(tapMatch);
      expect(sequence.getState().stageIndex).toBe(1);

      // Wrong gesture at stage 1 -> resets, but candidate is tap, so restarts at stage 1!
      sequence.feed(tapMatch);
      expect(onSequenceFailed).toHaveBeenCalledTimes(1);
      expect(sequence.getState().stageIndex).toBe(1); // restarted
    });

    it("handles cancel and reset manually", () => {
      const onReset = vi.fn();
      const sequence = createGestureSequence({
        stages: [{ gestureId: "tap" }, { gestureId: "swipe-right" }],
        onReset,
      });

      sequence.feed({
        gestureId: "tap",
        name: "Tap",
        confidence: 0.9,
        isMatch: true,
        explanation: {} as any,
        sample: {} as any,
        recognizedAt: 1000,
      });
      expect(sequence.getState().stageIndex).toBe(1);

      sequence.reset();
      expect(sequence.getState().stageIndex).toBe(0);
      expect(onReset).toHaveBeenCalledTimes(1);

      sequence.cancel();
      expect(sequence.getState().stageIndex).toBe(0);
    });
  });

  describe("5. Gesture Intelligence Controller & DOM Integration", () => {
    it("attaches to DOM element and recognizes tap gesture", () => {
      const onGestureRecognized = vi.fn();

      const recognizer = createGestureRecognizer(element, {
        onGestureRecognized,
      });

      // Pointer down
      const downEvent = new MouseEvent("pointerdown", {
        clientX: 50,
        clientY: 50,
        bubbles: true,
      });
      Object.defineProperty(downEvent, "pointerId", { value: 1 });
      Object.defineProperty(downEvent, "pointerType", { value: "mouse" });
      Object.defineProperty(downEvent, "isPrimary", { value: true });
      element.dispatchEvent(downEvent);

      // Pointer up shortly after with minimal movement
      const upEvent = new MouseEvent("pointerup", {
        clientX: 52,
        clientY: 51,
        bubbles: true,
      });
      Object.defineProperty(upEvent, "pointerId", { value: 1 });
      Object.defineProperty(upEvent, "pointerType", { value: "mouse" });
      Object.defineProperty(upEvent, "isPrimary", { value: true });
      window.dispatchEvent(upEvent);

      expect(onGestureRecognized).toHaveBeenCalled();
      const result: GestureClassificationResult = onGestureRecognized.mock.calls[0][0];
      expect(result.isMatch).toBe(true);
      expect(result.gestureId).toBe("tap");

      recognizer.destroy();
    });

    it("evaluates candidate gestures during pointermove", () => {
      const onGestureCandidate = vi.fn();

      const recognizer = createGestureRecognizer(element, {
        onGestureCandidate,
      });

      const downEvent = new MouseEvent("pointerdown", {
        clientX: 100,
        clientY: 100,
        bubbles: true,
      });
      Object.defineProperty(downEvent, "pointerId", { value: 1 });
      element.dispatchEvent(downEvent);

      // Move 40px right
      const moveEvent = new MouseEvent("pointermove", {
        clientX: 140,
        clientY: 100,
        bubbles: true,
      });
      Object.defineProperty(moveEvent, "pointerId", { value: 1 });
      window.dispatchEvent(moveEvent);

      expect(onGestureCandidate).toHaveBeenCalled();
      recognizer.destroy();
    });

    it("drives gesture sequences through live DOM interaction", () => {
      const onSequenceCompleted = vi.fn();

      const recognizer = createGestureRecognizer(element, {
        sequences: [
          {
            id: "double-tap-seq",
            stages: [{ gestureId: "tap" }, { gestureId: "tap" }],
          },
        ],
        onSequenceCompleted,
      });

      // Tap 1
      const down1 = new MouseEvent("pointerdown", { clientX: 50, clientY: 50, bubbles: true });
      Object.defineProperty(down1, "pointerId", { value: 1 });
      element.dispatchEvent(down1);

      const up1 = new MouseEvent("pointerup", { clientX: 51, clientY: 50, bubbles: true });
      Object.defineProperty(up1, "pointerId", { value: 1 });
      window.dispatchEvent(up1);

      // Tap 2
      const down2 = new MouseEvent("pointerdown", { clientX: 50, clientY: 50, bubbles: true });
      Object.defineProperty(down2, "pointerId", { value: 1 });
      element.dispatchEvent(down2);

      const up2 = new MouseEvent("pointerup", { clientX: 51, clientY: 50, bubbles: true });
      Object.defineProperty(up2, "pointerId", { value: 1 });
      window.dispatchEvent(up2);

      expect(onSequenceCompleted).toHaveBeenCalledTimes(1);
      expect(onSequenceCompleted).toHaveBeenCalledWith("double-tap-seq", expect.any(Array));

      recognizer.destroy();
    });

    it("cleans up all listeners and sequences on destroy", () => {
      const onGestureRecognized = vi.fn();
      const recognizer = createGestureRecognizer(element, {
        onGestureRecognized,
      });

      recognizer.destroy();

      // Subsequent events should not trigger recognition
      const down = new MouseEvent("pointerdown", { clientX: 50, clientY: 50, bubbles: true });
      Object.defineProperty(down, "pointerId", { value: 1 });
      element.dispatchEvent(down);

      const up = new MouseEvent("pointerup", { clientX: 50, clientY: 50, bubbles: true });
      Object.defineProperty(up, "pointerId", { value: 1 });
      window.dispatchEvent(up);

      expect(onGestureRecognized).not.toHaveBeenCalled();
    });
  });
});
