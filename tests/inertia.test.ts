import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import { animateInertia as createInertia } from "../src/core/inertia";
import type { InertiaControls, InertiaOptions, InertiaUpdate } from "../src/core/inertia";

let frames: Map<number, FrameRequestCallback>;
let nextFrameId: number;
let clockTime: number;
let reducedMotion: boolean;
let motionListeners: Set<(event: { matches: boolean }) => void>;
let controlsList: InertiaControls[];

function animateInertia(options: InertiaOptions): InertiaControls {
  const controls = createInertia(options);
  controlsList.push(controls);
  return controls;
}

function flushFrame(time: number): void {
  clockTime = time;
  const pending = [...frames.values()];
  frames.clear();
  for (const callback of pending) callback(time);
}

function setReducedMotion(reduced: boolean): void {
  reducedMotion = reduced;
  for (const listener of motionListeners) listener({ matches: reduced });
}

beforeEach(() => {
  frames = new Map();
  nextFrameId = 1;
  clockTime = 0;
  reducedMotion = false;
  motionListeners = new Set();
  controlsList = [];
  vi.stubGlobal("performance", { now: () => clockTime } as Performance);
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    const id = nextFrameId++;
    frames.set(id, callback);
    return id;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
  vi.stubGlobal("matchMedia", () => ({
    matches: reducedMotion,
    addEventListener: (_type: string, listener: (event: { matches: boolean }) => void) => motionListeners.add(listener),
    removeEventListener: (_type: string, listener: (event: { matches: boolean }) => void) => motionListeners.delete(listener),
  }));
});

afterEach(() => {
  for (const controls of controlsList) controls.cancel();
  vi.unstubAllGlobals();
});

describe("animateInertia()", () => {
  it("decelerates exponentially while moving in the initial velocity direction", () => {
    const updates: InertiaUpdate[] = [];
    const onComplete = vi.fn();
    animateInertia({
      from: 5,
      initialVelocity: 100,
      friction: 2,
      minVelocity: 1,
      onUpdate: (state) => updates.push(state),
      onComplete,
    });

    flushFrame(0);
    flushFrame(100);
    expect(updates[1]?.position).toBeGreaterThan(5);
    expect(updates[1]?.velocity).toBeLessThan(100);
    expect(updates[1]?.velocity).toBeGreaterThan(0);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("supports negative initial velocity and settles with zero velocity", () => {
    const updates: InertiaUpdate[] = [];
    const onComplete = vi.fn();
    animateInertia({
      from: 100,
      initialVelocity: -500,
      friction: 10,
      minVelocity: 5,
      onUpdate: (state) => updates.push(state),
      onComplete,
    });

    flushFrame(0);
    for (let time = 16; time <= 3000 && frames.size > 0; time += 16) flushFrame(time);

    expect(updates.length).toBeGreaterThan(2);
    expect(updates[1]?.position).toBeLessThan(100);
    expect(updates.at(-1)?.velocity).toBe(0);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(frames.size).toBe(0);
  });

  it("clamps at either configured bound and completes without overshooting", () => {
    const updates: InertiaUpdate[] = [];
    const onComplete = vi.fn();
    animateInertia({
      from: 0,
      initialVelocity: 1000,
      friction: 1,
      minVelocity: 0,
      max: 20,
      onUpdate: (state) => updates.push(state),
      onComplete,
    });
    flushFrame(0);
    flushFrame(100);

    expect(updates.at(-1)).toEqual({ position: 20, velocity: 0 });
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(frames.size).toBe(0);

    const lowerUpdates: InertiaUpdate[] = [];
    animateInertia({
      from: 10,
      initialVelocity: -1000,
      friction: 1,
      minVelocity: 0,
      min: 0,
      onUpdate: (state) => lowerUpdates.push(state),
    });
    flushFrame(116);
    flushFrame(216);
    expect(lowerUpdates.at(-1)).toEqual({ position: 0, velocity: 0 });
  });

  it("completes immediately on its first frame when velocity is below minimum", () => {
    const onUpdate = vi.fn();
    const onComplete = vi.fn();
    animateInertia({ initialVelocity: 1, minVelocity: 2, onUpdate, onComplete });
    flushFrame(0);

    expect(onUpdate).toHaveBeenCalledWith({ position: 0, velocity: 0 });
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(frames.size).toBe(0);
  });

  it("cancels scheduled frames and prevents further callbacks", () => {
    const onUpdate = vi.fn();
    const onComplete = vi.fn();
    const controls = animateInertia({ onUpdate, onComplete });
    flushFrame(0);
    expect(frames.size).toBe(1);

    controls.cancel();
    controls.cancel();
    expect(frames.size).toBe(0);
    flushFrame(100);
    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(onComplete).not.toHaveBeenCalled();
    expect(motionListeners.size).toBe(0);
  });

  it("completes in place when reduced motion is preferred, including preference changes", () => {
    const onUpdate = vi.fn();
    const onComplete = vi.fn();
    const controls = animateInertia({ from: 10, initialVelocity: 100, onUpdate, onComplete });
    flushFrame(0);
    setReducedMotion(true);
    flushFrame(16);

    expect(onUpdate).toHaveBeenLastCalledWith({ position: 10, velocity: 0 });
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(motionListeners.size).toBe(0);
    expect(frames.size).toBe(0);
    controls.cancel();
  });

  it("validates options, finite values, bounds, and callback types before scheduling", () => {
    const onUpdate = vi.fn();
    expect(() => animateInertia({ onUpdate, initialVelocity: Number.NaN })).toThrow(RangeError);
    expect(() => animateInertia({ onUpdate, friction: 0 })).toThrow(RangeError);
    expect(() => animateInertia({ onUpdate, minVelocity: -1 })).toThrow(RangeError);
    expect(() => animateInertia({ onUpdate, from: Number.POSITIVE_INFINITY })).toThrow(RangeError);
    expect(() => animateInertia({ onUpdate, min: 10, max: 0 })).toThrow(RangeError);
    expect(() => animateInertia({ onUpdate: undefined as unknown as InertiaOptions["onUpdate"] })).toThrow(TypeError);
    expect(frames.size).toBe(0);
  });

  it("settles at a finite position instead of overflowing", () => {
    const onUpdate = vi.fn();
    const onComplete = vi.fn();
    animateInertia({ from: 1.79e308, initialVelocity: 1.7e308, friction: 1, minVelocity: 0, onUpdate, onComplete });
    flushFrame(0);
    flushFrame(16);
    flushFrame(32);
    expect(onComplete).toHaveBeenCalledOnce();
    for (const [{ position, velocity }] of onUpdate.mock.calls) {
      expect(Number.isFinite(position)).toBe(true);
      expect(Number.isFinite(velocity)).toBe(true);
    }
    expect(frames.size).toBe(0);
  });

  it("uses custom friction and minVelocity as stopping thresholds", () => {
    const fast = vi.fn();
    const slow = vi.fn();
    animateInertia({ initialVelocity: 1000, friction: 40, minVelocity: 200, onUpdate: fast });
    animateInertia({ initialVelocity: 1000, friction: 2, minVelocity: 200, onUpdate: slow });
    for (let t = 0; t <= 640; t += 16) flushFrame(t);
    expect(fast.mock.calls.at(-1)![0].velocity).toBe(0);
    expect(slow.mock.calls.at(-1)![0].velocity).toBeGreaterThan(200);
    expect(frames.size).toBe(1);
  });
  it("reports public inertia types", () => {
    expectTypeOf<InertiaOptions["onUpdate"]>().toBeFunction();
    expectTypeOf<InertiaUpdate["position"]>().toBeNumber();
    expectTypeOf<InertiaControls["cancel"]>().toBeFunction();
  });
});
