import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { animateParallel } from "../src/core/animation-parallel";

class FakeStyle {
  values = new Map<string, string>();
  setProperty(name: string, value: string): void {
    this.values.set(name, value);
  }
  get(name: string): string | undefined {
    return this.values.get(name);
  }
}

class FakeHTMLElement {
  style = new FakeStyle();
}

let frames: Map<number, FrameRequestCallback>;
let nextId: number;
let cancelFrame: ReturnType<typeof vi.fn>;
let clockTime: number;

function flushFrame(time: number): void {
  clockTime = time;
  const pending = [...frames.values()];
  frames.clear();
  for (const callback of pending) callback(time);
}

function makeElement(): HTMLElement {
  return new FakeHTMLElement() as unknown as HTMLElement;
}

function styleOf(element: HTMLElement): FakeStyle {
  return element.style as unknown as FakeStyle;
}

beforeEach(() => {
  frames = new Map();
  nextId = 1;
  clockTime = 0;
  cancelFrame = vi.fn((id: number) => frames.delete(id));
  vi.stubGlobal("performance", { now: () => clockTime } as Performance);
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    const id = nextId++;
    frames.set(id, callback);
    return id;
  });
  vi.stubGlobal("cancelAnimationFrame", cancelFrame);
  vi.stubGlobal("HTMLElement", FakeHTMLElement);
  vi.stubGlobal("matchMedia", () => ({ matches: false }));
});

afterEach(() => vi.unstubAllGlobals());

describe("animateParallel()", () => {
  it("starts every step concurrently and resolves after all complete", async () => {
    const first = makeElement();
    const second = makeElement();
    const order: string[] = [];
    const onComplete = vi.fn(() => order.push("all"));
    const parallel = animateParallel([
      {
        target: first,
        properties: { opacity: [0, 1] },
        options: { duration: 100, onComplete: () => order.push("first") },
      },
      {
        target: second,
        properties: { width: ["0px", "20px"] },
        options: { duration: 200, onComplete: () => order.push("second") },
      },
    ], { onComplete });

    expect(styleOf(first).get("opacity")).toBe("0");
    expect(styleOf(second).get("width")).toBe("0px");
    expect(frames.size).toBe(1);
    flushFrame(0);
    flushFrame(100);
    expect(order).toEqual(["first"]);
    expect(onComplete).not.toHaveBeenCalled();
    expect(frames.size).toBe(1);
    flushFrame(200);
    await expect(parallel.finished).resolves.toBeUndefined();
    expect(order).toEqual(["first", "second", "all"]);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(styleOf(first).get("opacity")).toBe("1");
    expect(styleOf(second).get("width")).toBe("20px");
  });

  it("resolves an empty input immediately and calls onComplete once", async () => {
    const onComplete = vi.fn();
    const parallel = animateParallel([], { onComplete });
    await expect(parallel.finished).resolves.toBeUndefined();
    parallel.cancel();
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(frames.size).toBe(0);
  });

  it("cancels every remaining step and rejects instead of resolving", async () => {
    const first = makeElement();
    const second = makeElement();
    const firstComplete = vi.fn();
    const secondComplete = vi.fn();
    const onComplete = vi.fn();
    const parallel = animateParallel([
      { target: first, properties: { opacity: [0, 1] }, options: { duration: 100, onComplete: firstComplete } },
      { target: second, properties: { width: ["0px", "10px"] }, options: { duration: 100, onComplete: secondComplete } },
    ], { onComplete });
    expect(frames.size).toBe(1);
    parallel.cancel();
    parallel.cancel();
    await expect(parallel.finished).rejects.toMatchObject({ name: "AbortError" });
    expect(cancelFrame).toHaveBeenCalledTimes(1);
    expect(frames.size).toBe(0);
    flushFrame(200);
    expect(firstComplete).not.toHaveBeenCalled();
    expect(secondComplete).not.toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("rejects on a child startup error and cancels already-started animations", async () => {
    const first = makeElement();
    const parallel = animateParallel([
      { target: first, properties: { opacity: [0, 1] }, options: { duration: 100 } },
      { target: first, properties: { width: ["0px", "10px"] }, options: { duration: -1 } },
    ]);
    await expect(parallel.finished).rejects.toThrow(RangeError);
    expect(cancelFrame).toHaveBeenCalledTimes(1);
    expect(frames.size).toBe(0);
  });

  it("rejects when a step or group completion callback throws", async () => {
    const element = makeElement();
    const stepError = new Error("step failed");
    const stepFailure = animateParallel([
      {
        target: element,
        properties: { opacity: [0, 1] },
        options: { duration: 0, onComplete: () => { throw stepError; } },
      },
      { target: element, properties: { width: ["0px", "10px"] }, options: { duration: 100 } },
    ]);
    flushFrame(0);
    await expect(stepFailure.finished).rejects.toBe(stepError);
    expect(frames.size).toBe(0);

    const groupError = new Error("group failed");
    const groupFailure = animateParallel([
      { target: element, properties: { opacity: [0, 1] }, options: { duration: 0 } },
    ], { onComplete: () => { throw groupError; } });
    flushFrame(0);
    await expect(groupFailure.finished).rejects.toBe(groupError);
  });

  it("applies pause, resume, reverse, and playback-rate controls to active steps", async () => {
    const first = makeElement();
    const second = makeElement();
    const parallel = animateParallel([
      { target: first, properties: { opacity: [0, 1] }, options: { duration: 100 } },
      { target: second, properties: { width: ["0px", "10px"] }, options: { duration: 100 } },
    ]);

    parallel.setPlaybackRate(2);
    expect(parallel.getPlaybackRate()).toBe(2);
    parallel.pause();
    expect(frames.size).toBe(0);
    parallel.resume();
    flushFrame(0);
    flushFrame(25);
    expect(styleOf(first).get("opacity")).toBe("0.5");
    expect(styleOf(second).get("width")).toBe("5px");
    parallel.reverse();
    flushFrame(50);
    flushFrame(50);
    expect(styleOf(first).get("opacity")).toBe("0");
    expect(styleOf(second).get("width")).toBe("0px");
    await expect(parallel.finished).resolves.toBeUndefined();
  });

  it("runs group and step lifecycle callbacks and completes after all steps", async () => {
    const first = makeElement();
    const second = makeElement();
    const events: string[] = [];
    const parallel = animateParallel([
      {
        target: first,
        properties: { opacity: [0, 1] },
        options: {
          duration: 10,
          onStart: () => events.push("first-start"),
          onUpdate: (progress) => events.push(`first-update:${progress}`),
          onComplete: () => events.push("first-complete"),
          onCancel: () => events.push("first-cancel"),
        },
      },
      {
        target: second,
        properties: { width: ["0px", "10px"] },
        options: {
          duration: 20,
          onStart: () => events.push("second-start"),
          onComplete: () => events.push("second-complete"),
        },
      },
    ], {
      onStart: () => events.push("group-start"),
      onComplete: () => events.push("group-complete"),
      onCancel: () => events.push("group-cancel"),
    });

    flushFrame(0);
    expect(events).toContain("group-start");
    expect(events).toContain("first-start");
    expect(events).toContain("second-start");
    flushFrame(10);
    expect(events).toContain("first-complete");
    expect(events).not.toContain("group-complete");
    flushFrame(20);
    await expect(parallel.finished).resolves.toBeUndefined();
    expect(events.slice(-2)).toEqual(["second-complete", "group-complete"]);
    expect(events).not.toContain("group-cancel");
  });

  it("runs child and group cancellation callbacks exactly once", async () => {
    const element = makeElement();
    const stepOnCancel = vi.fn();
    const groupOnCancel = vi.fn();
    const parallel = animateParallel([
      {
        target: element,
        properties: { opacity: [0, 1] },
        options: { onCancel: stepOnCancel },
      },
    ], { onCancel: groupOnCancel });

    parallel.cancel();
    parallel.cancel();
    await expect(parallel.finished).rejects.toMatchObject({ name: "AbortError" });
    expect(stepOnCancel).toHaveBeenCalledTimes(1);
    expect(groupOnCancel).toHaveBeenCalledTimes(1);
  });
});
