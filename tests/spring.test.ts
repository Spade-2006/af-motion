import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import { animateSpring as createSpring } from "../src/core/spring";
import type { SpringConfig, SpringControls, SpringOptions, SpringUpdate } from "../src/core/spring";

let frames: Map<number, FrameRequestCallback>;
let nextFrameId: number;
let clockTime: number;
let reducedMotion: boolean;
let motionListeners: Set<(event: { matches: boolean }) => void>;
let springControls: SpringControls[];

function animateSpring(options: SpringOptions): SpringControls {
  const controls = createSpring(options);
  springControls.push(controls);
  return controls;
}

function flushFrame(time: number): void {
  clockTime = time;
  const pending = [...frames.values()];
  frames.clear();
  for (const callback of pending) callback(time);
}

beforeEach(() => {
  frames = new Map();
  nextFrameId = 1;
  clockTime = 0;
  reducedMotion = false;
  motionListeners = new Set();
  springControls = [];
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
  for (const controls of springControls) controls.cancel();
  vi.unstubAllGlobals();
});

function setReducedMotion(reduced: boolean): void {
  reducedMotion = reduced;
  for (const listener of motionListeners) listener({ matches: reduced });
}

describe("animateSpring()", () => {
  it("produces underdamped motion that overshoots before settling", () => {
    const updates: SpringUpdate[] = [];
    const onComplete = vi.fn();
    animateSpring({
      from: 0,
      to: 1,
      config: { stiffness: 100, damping: 8, mass: 1, restDelta: 0.001, restSpeed: 0.001 },
      onUpdate: (state) => updates.push(state),
      onComplete,
    });

    flushFrame(0);
    for (let time = 16; time <= 5000 && frames.size > 0; time += 16) flushFrame(time);

    expect(updates.some(({ position }) => position > 1)).toBe(true);
    expect(updates.at(-1)).toEqual({ position: 1, velocity: 0 });
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(frames.size).toBe(0);
  });

  it("settles with greater damping and snaps to the requested target", () => {
    const updates: SpringUpdate[] = [];
    const onComplete = vi.fn();
    animateSpring({
      from: 5,
      to: -2,
      config: { stiffness: 200, damping: 40, restDelta: 0.01, restSpeed: 0.01 },
      onUpdate: (state) => updates.push(state),
      onComplete,
    });

    flushFrame(0);
    for (let time = 16; time <= 3000 && frames.size > 0; time += 16) flushFrame(time);

    expect(updates.length).toBeGreaterThan(2);
    expect(updates.at(-1)).toEqual({ position: -2, velocity: 0 });
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(frames.size).toBe(0);
  });

  it("applies initial velocity to the first physics step", () => {
    const updates: SpringUpdate[] = [];
    const controls = animateSpring({
      from: 0,
      to: 1,
      config: { initialVelocity: 100 },
      onUpdate: (state) => updates.push(state),
    });

    flushFrame(0);
    flushFrame(16);

    expect(updates[0]).toEqual({ position: 0, velocity: 100 });
    expect((updates[1]?.position ?? 0) > 0).toBe(true);
    controls.cancel();
  });

  it("validates spring parameters and callback inputs", () => {
    const onUpdate = vi.fn();
    const invalidConfigs: SpringConfig[] = [
      { stiffness: 0 },
      { stiffness: Number.NaN },
      { damping: -1 },
      { mass: 0 },
      { initialVelocity: Number.POSITIVE_INFINITY },
      { restDelta: 0 },
      { restSpeed: -1 },
    ];
    for (const config of invalidConfigs) {
      expect(() => animateSpring({ onUpdate, config })).toThrow(RangeError);
    }
    expect(() => animateSpring({ onUpdate, from: Number.NaN })).toThrow(RangeError);
    expect(() => animateSpring({ onUpdate, to: Number.POSITIVE_INFINITY })).toThrow(RangeError);
    expect(() => animateSpring({ onUpdate: undefined as unknown as SpringOptions["onUpdate"] })).toThrow(TypeError);
    expect(frames.size).toBe(0);
  });

  it("cancels scheduled frames and prevents later callbacks", () => {
    const onUpdate = vi.fn();
    const onComplete = vi.fn();
    const controls = animateSpring({ onUpdate, onComplete });

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

  it("settles to the target under reduced motion and cleans up the listener", () => {
    reducedMotion = true;
    const onUpdate = vi.fn();
    const onComplete = vi.fn();
    animateSpring({ from: 2, to: 10, onUpdate, onComplete });

    flushFrame(0);
    expect(onUpdate).toHaveBeenCalledWith({ position: 10, velocity: 0 });
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(motionListeners.size).toBe(0);
    expect(frames.size).toBe(0);
  });

  it("continues spring measurement while reduced motion is disabled", () => {
    reducedMotion = true;
    const onUpdate = vi.fn();
    animateSpring({ onUpdate, respectReducedMotion: false });
    flushFrame(0);
    flushFrame(16);
    expect(onUpdate).toHaveBeenLastCalledWith(expect.objectContaining({ position: expect.any(Number) }));
    expect(motionListeners.size).toBe(0);
  });

  it("exports the public spring types", () => {
    expectTypeOf<SpringOptions["config"]>().toEqualTypeOf<SpringConfig | undefined>();
    expectTypeOf<SpringOptions["onUpdate"]>().toBeFunction();
    expectTypeOf<SpringControls["cancel"]>().toBeFunction();
    expectTypeOf<SpringUpdate["velocity"]>().toBeNumber();
  });

  it("finishes without scheduling a second frame for an already-settled spring", () => {
    const onComplete = vi.fn();
    const onUpdate = vi.fn();
    animateSpring({
      from: 1,
      to: 1,
      config: { stiffness: 100, damping: 10 },
      onUpdate,
      onComplete,
    });
    flushFrame(0);
    flushFrame(16);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onUpdate).toHaveBeenLastCalledWith({ position: 1, velocity: 0 });
    expect(frames.size).toBe(0);
  });

  it("supports stopping re-entrantly from an update callback", () => {
    let controls!: SpringControls;
    const onComplete = vi.fn();
    controls = animateSpring({
      onUpdate: () => controls.cancel(),
      onComplete,
    });
    flushFrame(0);

    expect(frames.size).toBe(0);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("cleans up and propagates update callback errors", () => {
    const error = new Error("spring update failed");
    animateSpring({ onUpdate: () => { throw error; } });

    expect(() => flushFrame(0)).toThrow(error);
    expect(frames.size).toBe(0);
    expect(motionListeners.size).toBe(0);
  });
});
