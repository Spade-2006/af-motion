import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  applyMotionDNA,
  getMotionDNA,
  motionDNARegistry,
  registerMotionDNA,
  removeMotionDNA,
} from "../src/core/motion-dna";
import { animateProgress } from "../src/core/animation";

let frames: Map<number, FrameRequestCallback>;
let nextFrameId: number;
let clockTime: number;

function flush(time: number): void {
  clockTime = time;
  const callbacks = [...frames.values()];
  frames.clear();
  for (const callback of callbacks) callback(time);
}

beforeEach(() => {
  frames = new Map();
  nextFrameId = 1;
  clockTime = 0;
  vi.stubGlobal("performance", { now: () => clockTime } as Performance);
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    const id = nextFrameId++;
    frames.set(id, callback);
    return id;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
  vi.stubGlobal("matchMedia", () => ({ matches: false }));
});

afterEach(() => {
  removeMotionDNA("brandMotion");
  vi.unstubAllGlobals();
});

describe("Motion DNA", () => {
  it("registers immutable named configurations and resolves per-animation overrides", () => {
    const dna = { duration: 200, delay: 10, easing: "easeOutQuad" };
    registerMotionDNA("brandMotion", dna);
    dna.duration = 400;

    expect(getMotionDNA("brandMotion")?.duration).toBe(200);
    const snapshot = getMotionDNA("brandMotion");
    if (snapshot) expect(Reflect.set(snapshot, "duration", 1)).toBe(false);
    expect(applyMotionDNA("brandMotion", { duration: 75, playbackRate: 2 })).toEqual({
      duration: 75,
      delay: 10,
      easing: "easeOutQuad",
      playbackRate: 2,
    });
    expect(motionDNARegistry.get("brandMotion")?.duration).toBe(200);
  });

  it("passes resolved DNA options directly to existing animation APIs", () => {
    registerMotionDNA("brandMotion", { duration: 100, easing: "linear" });
    const updates: number[] = [];
    const controls = animateProgress({
      ...applyMotionDNA("brandMotion"),
      onUpdate: (progress) => updates.push(progress),
    });

    flush(0);
    flush(50);
    flush(100);

    expect(updates).toEqual([0, 0.5, 1]);
    controls.cancel();
    expect(frames.size).toBe(0);
  });

  it("validates names and option values and supports removal", () => {
    expect(() => registerMotionDNA(" ", { duration: 100 })).toThrow(/name/);
    expect(() => registerMotionDNA("brandMotion", { duration: -1 })).toThrow(/duration/);
    expect(() => registerMotionDNA("brandMotion", { easing: "missingEasing" })).toThrow(/Unknown easing/);
    expect(() => applyMotionDNA("missingDNA")).toThrow(/Unknown Motion DNA/);

    registerMotionDNA("brandMotion", { playbackRate: 1.5 });
    expect(removeMotionDNA("brandMotion")).toBe(true);
    expect(removeMotionDNA("brandMotion")).toBe(false);
    expect(getMotionDNA("brandMotion")).toBeUndefined();
  });
});
