import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { animateProgress as createAnimation } from "../src/core/animation";
import type { AnimationControls, AnimationOptions } from "../src/core/animation";
import { registerEasing, removeEasing } from "../src/easing/easings";

let callbacks: Map<number, FrameRequestCallback>;
let nextId: number;
let clockTime: number;
let animationControls: AnimationControls[];

function installVisibilityDocument(initiallyHidden = false): {
  setHidden(hidden: boolean): void;
  addListener: ReturnType<typeof vi.fn>;
  removeListener: ReturnType<typeof vi.fn>;
} {
  let hidden = initiallyHidden;
  const listeners = new Set<EventListener>();
  const addListener = vi.fn((_type: string, listener: EventListener) => listeners.add(listener));
  const removeListener = vi.fn((_type: string, listener: EventListener) => listeners.delete(listener));
  vi.stubGlobal("document", {
    get hidden() {
      return hidden;
    },
    addEventListener: addListener,
    removeEventListener: removeListener,
  } as unknown as Document);
  return {
    setHidden: (nextHidden) => {
      hidden = nextHidden;
      for (const listener of listeners) listener(new Event("visibilitychange"));
    },
    addListener,
    removeListener,
  };
}

function animateProgress(options: AnimationOptions = {}): AnimationControls {
  const controls = createAnimation(options);
  animationControls.push(controls);
  return controls;
}

function flushFrame(time: number): void {
  clockTime = time;
  const pending = [...callbacks.entries()];
  callbacks.clear();
  for (const [, callback] of pending) callback(time);
}

beforeEach(() => {
  callbacks = new Map();
  nextId = 1;
  clockTime = 0;
  animationControls = [];
  vi.stubGlobal("performance", { now: () => clockTime } as Performance);
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
  for (const controls of animationControls) controls.cancel();
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

  it("repeats the animation without restarting its delay", () => {
    const onUpdate = vi.fn();
    const onComplete = vi.fn();
    animateProgress({ duration: 100, delay: 50, repeat: 1, onUpdate, onComplete });

    flushFrame(0);
    flushFrame(50);
    flushFrame(100);
    flushFrame(150);
    expect(onUpdate.mock.calls.map(([progress]) => progress)).toEqual([0, 0.5, 1]);
    expect(onComplete).not.toHaveBeenCalled();
    flushFrame(200);

    expect(onUpdate.mock.calls.map(([progress]) => progress)).toEqual([0, 0.5, 1, 0.5]);
    flushFrame(250);
    expect(onUpdate).toHaveBeenLastCalledWith(1);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("alternates direction at finite repeat boundaries", () => {
    const onUpdate = vi.fn();
    const onComplete = vi.fn();
    const controls = animateProgress({ duration: 100, repeat: 1, yoyo: true, onUpdate, onComplete });

    flushFrame(0);
    flushFrame(100);
    flushFrame(150);
    flushFrame(200);

    expect(onUpdate.mock.calls.map(([progress]) => progress)).toEqual([0, 1, 0.5, 0]);
    expect(onComplete).toHaveBeenCalledOnce();
    controls.cancel();
  });

  it("supports yoyo with infinite repetition without completing", () => {
    const onUpdate = vi.fn();
    const onComplete = vi.fn();
    const controls = animateProgress({
      duration: 100,
      repeat: Infinity,
      yoyo: true,
      onUpdate,
      onComplete,
    });

    flushFrame(0);
    flushFrame(100);
    flushFrame(150);
    flushFrame(250);
    flushFrame(300);

    expect(onUpdate.mock.calls.map(([progress]) => progress)).toEqual([0, 1, 0.5, 0, 0.5]);
    expect(onComplete).not.toHaveBeenCalled();
    expect(callbacks.size).toBe(1);
    controls.cancel();
  });

  it("validates yoyo and preserves forward playback when disabled", () => {
    const onUpdate = vi.fn();
    animateProgress({ duration: 100, repeat: 1, yoyo: false, onUpdate });
    flushFrame(0);
    flushFrame(100);
    flushFrame(150);
    expect(onUpdate.mock.calls.map(([progress]) => progress)).toEqual([0, 1, 0.5]);

    expect(() => animateProgress({ yoyo: "yes" as unknown as boolean })).toThrow(TypeError);
  });

  it("loops forever with Infinity without completing or recursively scheduling", () => {
    const onStart = vi.fn();
    const onUpdate = vi.fn();
    const onComplete = vi.fn();
    const controls = animateProgress({
      duration: 100,
      repeat: Infinity,
      onStart,
      onUpdate,
      onComplete,
    });

    flushFrame(0);
    flushFrame(100);
    flushFrame(150);
    flushFrame(250);

    expect(onStart).toHaveBeenCalledOnce();
    expect(onUpdate.mock.calls.map(([progress]) => progress)).toEqual([0, 1, 0.5, 1]);
    expect(onComplete).not.toHaveBeenCalled();
    expect(callbacks.size).toBe(1);
    controls.cancel();
  });

  it("cancels an infinite loop and fires onCancel once", () => {
    const onCancel = vi.fn();
    const onUpdate = vi.fn();
    const controls = animateProgress({ duration: 100, repeat: Infinity, onUpdate, onCancel });

    flushFrame(0);
    controls.cancel();
    controls.cancel();
    flushFrame(1000);

    expect(onUpdate).toHaveBeenCalledOnce();
    expect(onCancel).toHaveBeenCalledOnce();
    expect(callbacks.size).toBe(0);
  });

  it("settles an infinite loop when reduced motion is preferred", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    const onComplete = vi.fn();
    const controls = animateProgress({ duration: 100, repeat: Infinity, onComplete });

    flushFrame(0);

    expect(onComplete).toHaveBeenCalledOnce();
    expect(callbacks.size).toBe(0);
    controls.cancel();
  });

  it("settles an infinite loop when seeking to its endpoint", () => {
    const onComplete = vi.fn();
    const controls = animateProgress({ duration: 100, repeat: Infinity, onComplete });

    controls.seek(1);
    flushFrame(1000);

    expect(onComplete).toHaveBeenCalledOnce();
    expect(callbacks.size).toBe(0);
  });

  it.each([-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY * -1])(
    "rejects invalid repeat %s",
    (repeat) => {
      expect(() => animateProgress({ repeat })).toThrow(RangeError);
      expect(callbacks.size).toBe(0);
    },
  );

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

  it("completes safely at the start when a zero-duration animation is reversed before its first frame", () => {
    const onUpdate = vi.fn();
    const onComplete = vi.fn();
    const controls = animateProgress({ duration: 0, onUpdate, onComplete });
    controls.reverse();
    flushFrame(0);

    expect(onUpdate).toHaveBeenCalledWith(0);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(callbacks.size).toBe(0);
  });

  it("completes immediately when reduced motion is initially preferred", () => {
    const onUpdate = vi.fn();
    const onComplete = vi.fn();
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    animateProgress({ duration: 100, delay: 500, onUpdate, onComplete });

    flushFrame(0);

    expect(onUpdate).toHaveBeenCalledWith(1);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(callbacks.size).toBe(0);
  });

  it("finishes at the endpoint when reduced motion becomes preferred", () => {
    const onUpdate = vi.fn();
    const onComplete = vi.fn();
    const listeners = new Set<(event: { matches: boolean }) => void>();
    const removeListener = vi.fn((_: string, listener: (event: { matches: boolean }) => void) => {
      listeners.delete(listener);
    });
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener: (_: string, listener: (event: { matches: boolean }) => void) => {
        listeners.add(listener);
      },
      removeEventListener: removeListener,
    }));
    animateProgress({ duration: 100, delay: 500, onUpdate, onComplete });

    flushFrame(0);
    for (const listener of listeners) listener({ matches: true });
    flushFrame(10);

    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(onUpdate).toHaveBeenCalledWith(1);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(listeners.size).toBe(0);
    expect(removeListener).toHaveBeenCalledTimes(1);
  });

  it("does not alter normal motion and removes its preference listener on cancel", () => {
    let listener: ((event: { matches: boolean }) => void) | undefined;
    const removeListener = vi.fn();
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener: (_: string, callback: (event: { matches: boolean }) => void) => {
        listener = callback;
      },
      removeEventListener: removeListener,
    }));
    const onUpdate = vi.fn();
    const controls = animateProgress({ duration: 100, onUpdate });

    flushFrame(0);
    flushFrame(50);
    expect(onUpdate).toHaveBeenLastCalledWith(0.5);
    controls.cancel();
    listener?.({ matches: true });
    flushFrame(100);

    expect(onUpdate).toHaveBeenCalledTimes(2);
    expect(removeListener).toHaveBeenCalledTimes(1);
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
    const onCancel = vi.fn();
    const controls = animateProgress({
      duration: 0,
      onUpdate: () => controls.cancel(),
      onComplete,
      onCancel,
    });
    flushFrame(0);
    expect(onComplete).not.toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalledTimes(1);
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

  it("seeks to normalized progress and continues from that point", () => {
    const onUpdate = vi.fn();
    const controls = animateProgress({ duration: 100, onUpdate });
    flushFrame(0);
    controls.seek(0.5);
    expect(onUpdate).toHaveBeenLastCalledWith(0.5);
    flushFrame(25);
    expect(onUpdate).toHaveBeenLastCalledWith(0.75);
    flushFrame(50);
    expect(onUpdate).toHaveBeenLastCalledWith(1);
  });

  it("completes at most once and cannot restart by seeking after completion", () => {
    const onUpdate = vi.fn();
    const onComplete = vi.fn();
    const controls = animateProgress({ duration: 100, repeat: Infinity, onUpdate, onComplete });

    controls.seek(1);
    controls.seek(1);
    controls.seek(0.25);
    flushFrame(100);

    expect(onComplete).toHaveBeenCalledOnce();
    expect(onUpdate).toHaveBeenCalledOnce();
    expect(callbacks.size).toBe(0);
  });

  it("does not recommit completion when the terminal update seeks re-entrantly", () => {
    const onComplete = vi.fn();
    let controls: ReturnType<typeof animateProgress>;
    controls = animateProgress({
      duration: 100,
      onUpdate: (progress) => {
        if (progress === 1) controls.seek(0);
      },
      onComplete,
    });

    flushFrame(0);
    flushFrame(100);
    controls.seek(1);

    expect(onComplete).toHaveBeenCalledOnce();
    expect(callbacks.size).toBe(0);
  });

  it("does not revive an animation after a terminal update throws", () => {
    const onComplete = vi.fn();
    const controls = animateProgress({
      duration: 100,
      onUpdate: (progress) => {
        if (progress === 1) throw new Error("update failed");
      },
      onComplete,
    });

    flushFrame(0);
    expect(() => flushFrame(100)).toThrow("update failed");
    controls.seek(1);

    expect(onComplete).not.toHaveBeenCalled();
    expect(callbacks.size).toBe(0);
  });

  it("does not revive an animation cancelled from onStart during seek", () => {
    const onUpdate = vi.fn();
    const onCancel = vi.fn();
    let controls: ReturnType<typeof animateProgress>;
    controls = animateProgress({
      onStart: () => controls.cancel(),
      onUpdate,
      onCancel,
    });

    controls.seek(0.5);

    expect(onUpdate).not.toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalledOnce();
    expect(callbacks.size).toBe(0);
  });

  it("cancels once at a repeat boundary without completing", () => {
    const onComplete = vi.fn();
    const onCancel = vi.fn();
    let controls: ReturnType<typeof animateProgress>;
    controls = animateProgress({
      duration: 100,
      repeat: 1,
      onUpdate: (progress) => {
        if (progress === 1) controls.cancel();
      },
      onComplete,
      onCancel,
    });

    flushFrame(0);
    flushFrame(100);
    flushFrame(200);
    controls.cancel();

    expect(onComplete).not.toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalledOnce();
    expect(callbacks.size).toBe(0);
  });

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY, 1.1])(
    "rejects invalid seek progress %s",
    (progress) => {
      const controls = animateProgress();
      expect(() => controls.seek(progress)).toThrow(RangeError);
      controls.cancel();
    },
  );

  it("resolves a registered easing name", () => {
    registerEasing("testPowerEase", (progress) => progress ** 2);
    const onUpdate = vi.fn();
    animateProgress({ duration: 100, easing: "testPowerEase", onUpdate });

    flushFrame(0);
    flushFrame(50);
    expect(onUpdate).toHaveBeenLastCalledWith(0.25);
    removeEasing("testPowerEase");
  });

  it("rejects unknown easing names before scheduling a frame", () => {
    expect(() => animateProgress({ easing: "notRegistered" })).toThrow(TypeError);
    expect(callbacks.size).toBe(0);
  });

  it("fires lifecycle callbacks in order after delay and only once", () => {
    const events: string[] = [];
    const controls = animateProgress({
      duration: 20,
      delay: 10,
      onStart: () => events.push("start"),
      onUpdate: (progress) => events.push(`update:${progress}`),
      onComplete: () => events.push("complete"),
      onCancel: () => events.push("cancel"),
    });

    flushFrame(0);
    flushFrame(10);
    expect(events).toEqual(["start", "update:0"]);
    flushFrame(30);
    expect(events).toEqual(["start", "update:0", "update:1", "complete"]);
    controls.cancel();
    expect(events).not.toContain("cancel");
  });

  it("fires onCancel once even before start or while paused", () => {
    const beforeStart = vi.fn();
    const first = animateProgress({ onStart: vi.fn(), onCancel: beforeStart });
    first.cancel();
    first.cancel();
    expect(beforeStart).toHaveBeenCalledTimes(1);

    const onStart = vi.fn();
    const onCancel = vi.fn();
    const paused = animateProgress({ onStart, onCancel });
    flushFrame(0);
    paused.pause();
    paused.cancel();
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(callbacks.size).toBe(0);
  });

  it("fires onStart before the zero-duration update and completion", () => {
    const events: string[] = [];
    animateProgress({
      duration: 0,
      onStart: () => events.push("start"),
      onUpdate: (progress) => events.push(`update:${progress}`),
      onComplete: () => events.push("complete"),
      onCancel: () => events.push("cancel"),
    });
    flushFrame(0);
    expect(events).toEqual(["start", "update:1", "complete"]);
  });

  it("does not fire onStart again when reversing and completes at the start", () => {
    const onStart = vi.fn();
    const onComplete = vi.fn();
    const controls = animateProgress({ duration: 100, onStart, onComplete });
    flushFrame(0);
    flushFrame(50);
    controls.reverse();
    flushFrame(100);
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("cleans up and propagates an onUpdate exception", () => {
    const error = new Error("update failed");
    animateProgress({ onUpdate: () => { throw error; } });
    expect(() => flushFrame(0)).toThrow(error);
    expect(callbacks.size).toBe(0);
  });

  it("pauses and resumes without counting paused time", () => {
    const onUpdate = vi.fn();
    const onComplete = vi.fn();
    const controls = animateProgress({ duration: 100, onUpdate, onComplete });

    flushFrame(0);
    flushFrame(25);
    clockTime = 40;
    controls.pause();
    expect(callbacks.size).toBe(0);
    flushFrame(100);
    controls.resume();
    flushFrame(100);
    flushFrame(125);

    expect(onUpdate.mock.calls.map(([progress]) => progress)).toEqual([0, 0.25, 0.4, 0.65]);
    expect(onComplete).not.toHaveBeenCalled();
    expect(callbacks.size).toBe(1);
  });

  it("preserves the remaining delay when paused", () => {
    const onUpdate = vi.fn();
    const controls = animateProgress({ duration: 100, delay: 50, onUpdate });

    flushFrame(0);
    flushFrame(20);
    controls.pause();
    flushFrame(500);
    controls.resume();
    flushFrame(500);
    expect(onUpdate).not.toHaveBeenCalled();
    flushFrame(530);
    expect(onUpdate).toHaveBeenCalledWith(0);
    flushFrame(560);
    expect(onUpdate).toHaveBeenLastCalledWith(0.3);
  });

  it("reverses from the current progress and completes at the start", () => {
    const onUpdate = vi.fn();
    const onComplete = vi.fn();
    const controls = animateProgress({ duration: 100, onUpdate, onComplete });

    flushFrame(0);
    flushFrame(50);
    controls.reverse();
    flushFrame(75);
    expect(onUpdate).toHaveBeenLastCalledWith(0.25);
    flushFrame(100);

    expect(onUpdate).toHaveBeenLastCalledWith(0);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(callbacks.size).toBe(0);
    controls.reverse();
    expect(callbacks.size).toBe(0);
  });

  it("accounts elapsed time using the old playback rate before changing rate", () => {
    const onUpdate = vi.fn();
    const controls = animateProgress({ duration: 100, onUpdate });
    flushFrame(0);
    flushFrame(20);

    clockTime = 40;
    controls.setPlaybackRate(2);
    flushFrame(50);

    expect(onUpdate.mock.calls[onUpdate.mock.calls.length - 1]?.[0]).toBeCloseTo(0.6);
    flushFrame(60);
    expect(onUpdate.mock.calls[onUpdate.mock.calls.length - 1]?.[0]).toBeCloseTo(0.8);
  });

  it("reverses at the control-call time rather than retroactively reversing elapsed time", () => {
    const onUpdate = vi.fn();
    const controls = animateProgress({ duration: 100, onUpdate });
    flushFrame(0);
    flushFrame(20);

    clockTime = 40;
    controls.reverse();
    flushFrame(50);

    expect(onUpdate.mock.calls[onUpdate.mock.calls.length - 1]?.[0]).toBeCloseTo(0.3);
  });

  it("preserves the remaining delay when reversing before the animation starts", () => {
    const events: string[] = [];
    const controls = animateProgress({
      duration: 100,
      delay: 50,
      onStart: () => events.push("start"),
      onUpdate: (progress) => events.push(`update:${progress}`),
      onComplete: () => events.push("complete"),
    });
    flushFrame(0);

    clockTime = 20;
    controls.reverse();
    flushFrame(50);

    expect(events).toEqual(["start", "update:0", "complete"]);
  });

  it("rejects zero playback rate without changing the active animation", () => {
    const onUpdate = vi.fn();
    const controls = animateProgress({ duration: 100, onUpdate });
    flushFrame(0);
    flushFrame(20);

    expect(() => controls.setPlaybackRate(0)).toThrow(RangeError);
    flushFrame(40);
    expect(onUpdate).toHaveBeenLastCalledWith(0.4);
  });

  it("applies and updates playback rate", () => {
    const onUpdate = vi.fn();
    const controls = animateProgress({ duration: 100, playbackRate: 2, onUpdate });

    expect(controls.getPlaybackRate()).toBe(2);
    flushFrame(0);
    flushFrame(25);
    expect(onUpdate).toHaveBeenLastCalledWith(0.5);

    controls.setPlaybackRate(0.5);
    expect(controls.getPlaybackRate()).toBe(0.5);
    flushFrame(50);
    expect(onUpdate).toHaveBeenLastCalledWith(0.625);
  });

  it("drives concurrent animations from one shared frame loop", () => {
    const firstUpdate = vi.fn();
    const secondUpdate = vi.fn();
    animateProgress({ duration: 100, onUpdate: firstUpdate });
    animateProgress({ duration: 100, onUpdate: secondUpdate });

    expect(callbacks.size).toBe(1);
    flushFrame(0);
    expect(callbacks.size).toBe(1);
    flushFrame(50);

    expect(firstUpdate).toHaveBeenLastCalledWith(0.5);
    expect(secondUpdate).toHaveBeenLastCalledWith(0.5);
    expect(callbacks.size).toBe(1);
  });

  it("unregisters completed animations and stops the shared loop when all finish", () => {
    const firstComplete = vi.fn();
    const secondComplete = vi.fn();
    animateProgress({ duration: 50, onComplete: firstComplete });
    animateProgress({ duration: 100, onComplete: secondComplete });

    expect(callbacks.size).toBe(1);
    flushFrame(0);
    flushFrame(50);
    expect(firstComplete).toHaveBeenCalledTimes(1);
    expect(secondComplete).not.toHaveBeenCalled();
    expect(callbacks.size).toBe(1);

    flushFrame(100);
    expect(secondComplete).toHaveBeenCalledTimes(1);
    expect(callbacks.size).toBe(0);
  });

  it("cancels the shared frame only after the last animation is cancelled", () => {
    const onCancel = vi.fn();
    const first = animateProgress({ onCancel });
    const second = animateProgress({ onCancel });
    const cancelFrame = vi.mocked(cancelAnimationFrame);

    expect(callbacks.size).toBe(1);
    first.cancel();
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(callbacks.size).toBe(1);

    second.cancel();
    expect(onCancel).toHaveBeenCalledTimes(2);
    expect(callbacks.size).toBe(0);
    expect(cancelFrame).toHaveBeenCalledTimes(1);
  });

  it("suspends concurrent animations while hidden and excludes hidden time", () => {
    const visibility = installVisibilityDocument();
    const firstUpdate = vi.fn();
    const secondUpdate = vi.fn();
    const firstComplete = vi.fn();
    const secondComplete = vi.fn();
    animateProgress({ duration: 100, onUpdate: firstUpdate, onComplete: firstComplete });
    animateProgress({ duration: 100, onUpdate: secondUpdate, onComplete: secondComplete });

    expect(visibility.addListener).toHaveBeenCalledTimes(1);
    expect(callbacks.size).toBe(1);
    flushFrame(0);
    flushFrame(50);
    expect(firstUpdate).toHaveBeenLastCalledWith(0.5);
    expect(secondUpdate).toHaveBeenLastCalledWith(0.5);

    visibility.setHidden(true);
    expect(callbacks.size).toBe(0);
    clockTime = 550;
    expect(firstComplete).not.toHaveBeenCalled();
    expect(secondComplete).not.toHaveBeenCalled();

    visibility.setHidden(false);
    expect(callbacks.size).toBe(1);
    flushFrame(550);
    expect(firstUpdate).toHaveBeenLastCalledWith(0.5);
    expect(secondUpdate).toHaveBeenLastCalledWith(0.5);
    flushFrame(600);

    expect(firstComplete).toHaveBeenCalledTimes(1);
    expect(secondComplete).toHaveBeenCalledTimes(1);
    expect(callbacks.size).toBe(0);
    expect(visibility.removeListener).toHaveBeenCalledTimes(1);
  });

  it("preserves delay elapsed before the document was hidden", () => {
    const visibility = installVisibilityDocument();
    const onStart = vi.fn();
    const onUpdate = vi.fn();
    animateProgress({ delay: 100, duration: 100, onStart, onUpdate });
    flushFrame(0);
    flushFrame(50);
    expect(onStart).not.toHaveBeenCalled();

    visibility.setHidden(true);
    clockTime = 550;
    visibility.setHidden(false);
    flushFrame(550);
    expect(onStart).not.toHaveBeenCalled();
    flushFrame(600);
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onUpdate).toHaveBeenCalledWith(0);
  });

  it("registers visibility tracking only for active animations and removes it when idle", () => {
    const visibility = installVisibilityDocument(true);
    const controls = animateProgress();
    expect(visibility.addListener).toHaveBeenCalledTimes(1);
    expect(callbacks.size).toBe(0);

    controls.cancel();
    expect(visibility.removeListener).toHaveBeenCalledTimes(1);
    visibility.setHidden(false);
    expect(callbacks.size).toBe(0);
  });

  it("falls back safely when document visibility events are unavailable", () => {
    let hidden = true;
    vi.stubGlobal("document", {
      get hidden() {
        return hidden;
      },
    });
    const onUpdate = vi.fn();
    animateProgress({ duration: 100, onUpdate });

    flushFrame(0);
    expect(onUpdate).not.toHaveBeenCalled();
    expect(callbacks.size).toBe(1);

    hidden = false;
    clockTime = 500;
    flushFrame(500);
    expect(onUpdate).toHaveBeenCalledWith(0);
    flushFrame(550);
    expect(onUpdate).toHaveBeenLastCalledWith(0.5);
  });

  it("does not dispatch a later animation cancelled re-entrantly in an update", () => {
    const secondUpdate = vi.fn();
    let second: ReturnType<typeof animateProgress>;
    const first = animateProgress({
      onUpdate: () => second.cancel(),
    });
    second = animateProgress({ onUpdate: secondUpdate });

    flushFrame(0);

    expect(secondUpdate).not.toHaveBeenCalled();
    expect(callbacks.size).toBe(1);
    first.cancel();
    expect(callbacks.size).toBe(0);
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    "rejects invalid playback rate %s",
    (playbackRate) => {
      expect(() => animateProgress({ playbackRate })).toThrow(RangeError);
      const controls = animateProgress();
      expect(() => controls.setPlaybackRate(playbackRate)).toThrow(RangeError);
      controls.cancel();
      expect(callbacks.size).toBe(0);
    },
  );
});
