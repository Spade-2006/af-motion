import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { animateSequence } from "../src/core/animation-sequence";

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

describe("animateSequence()", () => {
  it("runs steps sequentially across the same or different targets", async () => {
    const first = makeElement();
    const second = makeElement();
    const order: string[] = [];
    const sequence = animateSequence([
      {
        target: first,
        properties: { opacity: [0, 1] },
        options: { duration: 100, onComplete: () => order.push("first") },
      },
      {
        target: second,
        properties: { width: ["0px", "20px"] },
        options: { duration: 100, onComplete: () => order.push("second") },
      },
      {
        target: first,
        properties: { opacity: [1, 0] },
        options: { duration: 100, onComplete: () => order.push("third") },
      },
    ], { onComplete: () => order.push("complete") });

    expect(styleOf(first).get("opacity")).toBe("0");
    expect(styleOf(second).get("width")).toBeUndefined();
    flushFrame(0);
    flushFrame(100);
    expect(order).toEqual(["first"]);
    expect(styleOf(second).get("width")).toBe("0px");
    flushFrame(101);
    flushFrame(201);
    expect(order).toEqual(["first", "second"]);
    flushFrame(202);
    flushFrame(302);
    await expect(sequence.finished).resolves.toBeUndefined();
    expect(order).toEqual(["first", "second", "third", "complete"]);
    expect(styleOf(first).get("opacity")).toBe("0");
    expect(styleOf(second).get("width")).toBe("20px");
    expect(frames.size).toBe(0);
  });

  it("resolves an empty sequence and runs its completion callback once", async () => {
    const onComplete = vi.fn();
    const sequence = animateSequence([], { onComplete });
    await expect(sequence.finished).resolves.toBeUndefined();
    sequence.cancel();
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(frames.size).toBe(0);
  });

  it("cancels the active step and prevents subsequent steps", async () => {
    const element = makeElement();
    const laterStep = vi.fn();
    const sequence = animateSequence([
      { target: element, properties: { opacity: [0, 1] }, options: { duration: 100 } },
      { target: element, properties: { width: ["0px", "10px"] }, options: { onComplete: laterStep } },
    ]);
    flushFrame(0);
    sequence.cancel();
    await expect(sequence.finished).rejects.toMatchObject({ name: "AbortError" });
    expect(cancelFrame).toHaveBeenCalled();
    flushFrame(200);
    expect(laterStep).not.toHaveBeenCalled();
    expect(styleOf(element).get("width")).toBeUndefined();
    expect(frames.size).toBe(0);
  });

  it("rejects completion when a step cannot start", async () => {
    const element = makeElement();
    const sequence = animateSequence([
      { target: element, properties: { opacity: [0, 1] }, options: { duration: 10 } },
      { target: element, properties: { width: ["0px", "10px"] }, options: { duration: -1 } },
    ]);
    flushFrame(0);
    flushFrame(10);
    await expect(sequence.finished).rejects.toThrow(RangeError);
    expect(frames.size).toBe(0);
  });

  it("rejects when a step completion callback throws and does not start later steps", async () => {
    const element = makeElement();
    const error = new Error("step callback failed");
    const laterComplete = vi.fn();
    const sequence = animateSequence([
      {
        target: element,
        properties: { opacity: [0, 1] },
        options: { duration: 0, onComplete: () => { throw error; } },
      },
      { target: element, properties: { width: ["0px", "10px"] }, options: { onComplete: laterComplete } },
    ]);
    flushFrame(0);
    await expect(sequence.finished).rejects.toBe(error);
    expect(laterComplete).not.toHaveBeenCalled();
    expect(styleOf(element).get("width")).toBeUndefined();
  });

  it("pauses, resumes, reverses, and carries the playback rate into later steps", async () => {
    const element = makeElement();
    const sequence = animateSequence([
      { target: element, properties: { opacity: [0, 1] }, options: { duration: 100 } },
      { target: element, properties: { width: ["0px", "10px"] }, options: { duration: 100 } },
    ]);

    sequence.setPlaybackRate(2);
    expect(sequence.getPlaybackRate()).toBe(2);
    sequence.pause();
    flushFrame(0);
    expect(styleOf(element).get("opacity")).toBe("0");

    sequence.resume();
    flushFrame(0);
    flushFrame(25);
    expect(styleOf(element).get("opacity")).toBe("0.5");

    sequence.reverse();
    flushFrame(50);
    expect(styleOf(element).get("opacity")).toBe("0");
    expect(styleOf(element).get("width")).toBe("0px");
    expect(sequence.getPlaybackRate()).toBe(2);

    flushFrame(50);
    expect(styleOf(element).get("width")).toBe("0px");
    flushFrame(75);
    expect(styleOf(element).get("width")).toBe("5px");
    sequence.cancel();
    await expect(sequence.finished).rejects.toMatchObject({ name: "AbortError" });
  });

  it("runs group and step lifecycle callbacks in sequence", async () => {
    const element = makeElement();
    const events: string[] = [];
    const sequence = animateSequence([
      {
        target: element,
        properties: { opacity: [0, 1] },
        options: {
          duration: 10,
          onStart: () => events.push("step-start"),
          onUpdate: (progress) => events.push(`step-update:${progress}`),
          onComplete: () => events.push("step-complete"),
          onCancel: () => events.push("step-cancel"),
        },
      },
    ], {
      onStart: () => events.push("group-start"),
      onComplete: () => events.push("group-complete"),
      onCancel: () => events.push("group-cancel"),
    });

    flushFrame(0);
    expect(events).toEqual(["group-start", "step-start", "step-update:0"]);
    flushFrame(10);
    await expect(sequence.finished).resolves.toBeUndefined();
    expect(events).toEqual([
      "group-start",
      "step-start",
      "step-update:0",
      "step-update:1",
      "step-complete",
      "group-complete",
    ]);
  });

  it("runs step and group cancellation callbacks without starting delayed steps", async () => {
    const element = makeElement();
    const events: string[] = [];
    const sequence = animateSequence([
      {
        target: element,
        properties: { opacity: [0, 1] },
        options: {
          delay: 100,
          onStart: () => events.push("step-start"),
          onCancel: () => events.push("step-cancel"),
        },
      },
    ], {
      onStart: () => events.push("group-start"),
      onCancel: () => events.push("group-cancel"),
    });

    sequence.cancel();
    await expect(sequence.finished).rejects.toMatchObject({ name: "AbortError" });
    expect(events).toEqual(["step-cancel", "group-cancel"]);
    expect(frames.size).toBe(0);
  });
});
