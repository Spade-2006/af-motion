import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { animateProgress } from "../src/core/animation";

let callbacks: Map<number, FrameRequestCallback>;
let nextId: number;

function flushFrame(time: number): void {
  const pending = [...callbacks.entries()];
  callbacks.clear();
  for (const [, callback] of pending) callback(time);
}

beforeEach(() => {
  callbacks = new Map();
  nextId = 1;
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    const id = nextId++;
    callbacks.set(id, callback);
    return id;
  });
  vi.stubGlobal("cancelAnimationFrame", vi.fn((id: number) => {
    callbacks.delete(id);
  }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("animateProgress", () => {
  it("progresses linearly and completes once", () => {
    const onUpdate = vi.fn();
    const onComplete = vi.fn();
    animateProgress({ duration: 100, onUpdate, onComplete });

    flushFrame(0);
    flushFrame(50);
    flushFrame(100);

    expect(onUpdate.mock.calls.map(([p]) => p)).toEqual([0, 0.5, 1]);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(callbacks.size).toBe(0);
  });

  it("uses a 1000ms default duration", () => {
    const onUpdate = vi.fn();
    animateProgress({ onUpdate });
    flushFrame(0);
    flushFrame(250);
    expect(onUpdate).toHaveBeenLastCalledWith(0.25);
  });

  it("clamps progress when a frame overshoots", () => {
    const onUpdate = vi.fn();
    const onComplete = vi.fn();
    animateProgress({ duration: 100, onUpdate, onComplete });
    flushFrame(0);
    flushFrame(500);
    expect(onUpdate).toHaveBeenLastCalledWith(1);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("waits for the delay before updating", () => {
    const onUpdate = vi.fn();
    const onComplete = vi.fn();
    animateProgress({ duration: 100, delay: 200, onUpdate, onComplete });

    flushFrame(0);
    flushFrame(150);
    expect(onUpdate).not.toHaveBeenCalled();

    flushFrame(250);
    expect(onUpdate).toHaveBeenLastCalledWith(0.5);
    flushFrame(300);
    expect(onUpdate).toHaveBeenLastCalledWith(1);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("handles zero duration with a single update at 1", () => {
    const onUpdate = vi.fn();
    const onComplete = vi.fn();
    animateProgress({ duration: 0, onUpdate, onComplete });

    flushFrame(0);

    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(onUpdate).toHaveBeenCalledWith(1);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(callbacks.size).toBe(0);
  });

  it("handles zero duration with a delay", () => {
    const onUpdate = vi.fn();
    const onComplete = vi.fn();
    animateProgress({ duration: 0, delay: 100, onUpdate, onComplete });
    flushFrame(0);
    expect(onComplete).not.toHaveBeenCalled();
    flushFrame(100);
    expect(onUpdate).toHaveBeenCalledWith(1);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("does not require callbacks", () => {
    animateProgress({ duration: 10 });
    expect(() => {
      flushFrame(0);
      flushFrame(10);
    }).not.toThrow();
  });

  it("cancel stops updates and completion and cancels the pending frame", () => {
    const onUpdate = vi.fn();
    const onComplete = vi.fn();
    const controls = animateProgress({ duration: 100, onUpdate, onComplete });

    flushFrame(0);
    controls.cancel();
    expect(cancelAnimationFrame).toHaveBeenCalled();
    flushFrame(50);
    flushFrame(100);

    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(onComplete).not.toHaveBeenCalled();
    expect(callbacks.size).toBe(0);
  });

  it("cancel before the first frame prevents all callbacks", () => {
    const onUpdate = vi.fn();
    const onComplete = vi.fn();
    animateProgress({ duration: 0, onUpdate, onComplete }).cancel();
    flushFrame(0);
    expect(onUpdate).not.toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("cancel is idempotent and safe after completion", () => {
    const onComplete = vi.fn();
    const controls = animateProgress({ duration: 0, onComplete });
    flushFrame(0);
    controls.cancel();
    controls.cancel();
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("cancelling inside onUpdate on the final frame suppresses completion", () => {
    const onComplete = vi.fn();
    const controls = animateProgress({
      duration: 0,
      onUpdate: () => controls.cancel(),
      onComplete,
    });
    flushFrame(0);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("cancelling inside onUpdate stops further frames", () => {
    const onUpdate = vi.fn(() => controls.cancel());
    const controls = animateProgress({ duration: 100, onUpdate });
    flushFrame(0);
    expect(callbacks.size).toBe(0);
    flushFrame(50);
    expect(onUpdate).toHaveBeenCalledTimes(1);
  });

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    "rejects invalid duration %s",
    (duration) => {
      expect(() => animateProgress({ duration })).toThrow(RangeError);
      expect(callbacks.size).toBe(0);
    },
  );

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    "rejects invalid delay %s",
    (delay) => {
      expect(() => animateProgress({ delay })).toThrow(RangeError);
      expect(callbacks.size).toBe(0);
    },
  );

  it("applies a custom easing function, ending at easing(1)", () => {
    const onUpdate = vi.fn();
    animateProgress({ duration: 100, easing: (t) => t * t, onUpdate });
    flushFrame(0);
    flushFrame(50);
    flushFrame(100);
    expect(onUpdate.mock.calls.map(([p]) => p)).toEqual([0, 0.25, 1]);
  });
});
