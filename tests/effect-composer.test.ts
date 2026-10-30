import { afterEach, describe, expect, it, vi } from "vitest";
import {
  composeEffects,
  registerMotionDNA,
  removeMotionDNA,
} from "../src/index";

afterEach(() => {
  removeMotionDNA("composerMotion");
});

describe("composeEffects()", () => {
  it("starts effects in order and destroys them in reverse order once", () => {
    const calls: string[] = [];
    const composition = composeEffects([
      { start: () => { calls.push("start first"); return { destroy: () => calls.push("stop first") }; } },
      { start: () => { calls.push("start second"); return { cancel: () => calls.push("stop second") }; } },
    ]);

    expect(calls).toEqual(["start first", "start second"]);
    composition.destroy();
    composition.cancel();

    expect(calls).toEqual(["start first", "start second", "stop second", "stop first"]);
  });

  it("cleans up already-started effects when a later effect fails", () => {
    const cleanup = vi.fn();
    expect(() => composeEffects([
      { start: () => ({ destroy: cleanup }) },
      { start: () => { throw new Error("failed start"); } },
    ])).toThrow("failed start");
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it("passes resolved Motion DNA only to entries that request it", () => {
    registerMotionDNA("composerMotion", { duration: 300, easing: "linear" });
    const optionsSeen: unknown[] = [];
    const unrelatedOptionsSeen: unknown[] = [];
    const composition = composeEffects([
      {
        motionDNA: { name: "composerMotion", overrides: { duration: 120 } },
        start: (options) => {
          optionsSeen.push(options);
          return { destroy: () => undefined };
        },
      },
      {
        start: (options) => {
          unrelatedOptionsSeen.push(options);
          return { destroy: () => undefined };
        },
      },
    ]);

    expect(optionsSeen).toEqual([{ duration: 120, easing: "linear" }]);
    expect(unrelatedOptionsSeen).toEqual([undefined]);
    composition.destroy();
  });

  it("continues cleanup after an individual effect throws", () => {
    const laterCleanup = vi.fn();
    const composition = composeEffects([
      { start: () => ({ destroy: laterCleanup }) },
      { start: () => ({ destroy: () => { throw new Error("cleanup failed"); } }) },
    ]);

    expect(() => composition.destroy()).toThrow(/failed to clean up/);
    expect(laterCleanup).toHaveBeenCalledTimes(1);
  });

  it("pauses and resumes only effects that expose compatible controls", () => {
    const pause = vi.fn();
    const resume = vi.fn();
    const composition = composeEffects([
      { start: () => ({ destroy: () => undefined, pause, resume }) },
      { start: () => ({ destroy: () => undefined }) },
    ]);

    composition.pause();
    composition.pause();
    composition.resume();
    composition.resume();

    expect(pause).toHaveBeenCalledTimes(1);
    expect(resume).toHaveBeenCalledTimes(1);
    composition.destroy();
    composition.pause();
    expect(pause).toHaveBeenCalledTimes(1);
  });
});
