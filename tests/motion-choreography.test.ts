import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createMotionChoreography,
  registerMotionDNA,
  removeMotionDNA,
} from "../src/index";

class FakeStyle {
  values = new Map<string, string>();
  setProperty(name: string, value: string): void {
    this.values.set(name, value);
  }
}

class FakeHTMLElement {
  style = new FakeStyle();
}

let frames: Map<number, FrameRequestCallback>;
let nextId: number;
let clockTime: number;

async function flush(time: number): Promise<void> {
  clockTime = time;
  const callbacks = [...frames.values()];
  frames.clear();
  for (const callback of callbacks) callback(time);
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

function target(): HTMLElement {
  return new FakeHTMLElement() as unknown as HTMLElement;
}

beforeEach(() => {
  frames = new Map();
  nextId = 1;
  clockTime = 0;
  vi.stubGlobal("performance", { now: () => clockTime } as Performance);
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    const id = nextId++;
    frames.set(id, callback);
    return id;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
  vi.stubGlobal("HTMLElement", FakeHTMLElement);
  vi.stubGlobal("matchMedia", () => ({ matches: false }));
  vi.stubGlobal("document", {
    querySelectorAll: (selector: string) => {
      if (selector === "[invalid") throw new SyntaxError("invalid selector");
      return [];
    },
  });
});

afterEach(() => {
  removeMotionDNA("choreographyMotion");
  vi.unstubAllGlobals();
});

describe("createMotionChoreography()", () => {
  it("runs animations sequentially and parallel groups concurrently with scoped effects", async () => {
    registerMotionDNA("choreographyMotion", { duration: 20, easing: "linear" });
    const order: string[] = [];
    const choreography = createMotionChoreography([
      {
        type: "animation",
        target: target(),
        properties: { opacity: [0, 1] },
        motionDNA: { name: "choreographyMotion" },
        options: { onStart: () => order.push("first start"), onComplete: () => order.push("first end") },
      },
      {
        type: "parallel",
        actions: [
          {
            type: "effect",
            effect: {
              motionDNA: { name: "choreographyMotion", overrides: { duration: 10 } },
              start: (options) => {
                order.push(`effect start ${options.duration}`);
                return { destroy: () => order.push("effect end") };
              },
            },
          },
          {
            type: "animation",
            target: target(),
            properties: { opacity: [0, 1] },
            motionDNA: { name: "choreographyMotion" },
            options: { onComplete: () => order.push("parallel one end") },
          },
          {
            type: "animation",
            target: target(),
            properties: { opacity: [0, 1] },
            options: { duration: 20, onComplete: () => order.push("parallel two end") },
          },
        ],
      },
      {
        type: "animation",
        target: target(),
        properties: { opacity: [0, 1] },
        options: { duration: 20, onComplete: () => order.push("last end") },
      },
    ]);

    await flush(0);
    await flush(20);
    expect(order).toEqual(["first start", "first end", "effect start 10"]);
    await flush(21);
    await flush(41);
    expect(order).toContain("parallel one end");
    expect(order).toContain("parallel two end");
    expect(order).toContain("effect end");
    expect(order.indexOf("effect end")).toBeGreaterThan(order.indexOf("parallel two end"));
    await flush(42);
    await flush(62);
    await expect(choreography.finished).resolves.toBeUndefined();
    expect(order[order.length - 1]).toBe("last end");
  });

  it("evaluates a branch when reached and runs only the selected actions", async () => {
    let expanded = false;
    const condition = vi.fn(() => expanded);
    const order: string[] = [];
    const choreography = createMotionChoreography([
      {
        type: "animation",
        target: target(),
        properties: { opacity: [0, 1] },
        options: { duration: 10, onComplete: () => { expanded = true; } },
      },
      {
        type: "branch",
        condition,
        then: [{
          type: "animation",
          target: target(),
          properties: { opacity: [0, 1] },
          options: { duration: 10, onComplete: () => order.push("expanded") },
        }],
        else: [{
          type: "animation",
          target: target(),
          properties: { opacity: [0, 1] },
          options: { duration: 10, onComplete: () => order.push("compact") },
        }],
      },
    ]);

    await flush(0);
    expect(condition).not.toHaveBeenCalled();
    await flush(10);
    expect(condition).toHaveBeenCalledTimes(1);
    await flush(11);
    await flush(21);
    await expect(choreography.finished).resolves.toBeUndefined();
    expect(order).toEqual(["expanded"]);
  });

  it("cancels and cleans up actions started from a selected branch", async () => {
    const cleanup = vi.fn();
    const choreography = createMotionChoreography([{
      type: "branch",
      condition: () => true,
      then: [{
        type: "parallel",
        actions: [
          { type: "effect", effect: { start: () => ({ destroy: cleanup }) } },
          {
            type: "animation",
            target: target(),
            properties: { opacity: [0, 1] },
            options: { duration: 100 },
          },
        ],
      }],
    }]);

    choreography.cancel();

    await expect(choreography.finished).rejects.toMatchObject({ name: "AbortError" });
    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(frames.size).toBe(0);
  });

  it("cleans up active animations and effects when cancelled", async () => {
    const cleanup = vi.fn();
    const choreography = createMotionChoreography([{
      type: "parallel",
      actions: [
        { type: "effect", effect: { start: () => ({ destroy: cleanup }) } },
        {
          type: "animation",
          target: target(),
          properties: { opacity: [0, 1] },
          options: { duration: 100 },
        },
      ],
    }]);

    choreography.cancel();

    await expect(choreography.finished).rejects.toMatchObject({ name: "AbortError" });
    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(frames.size).toBe(0);
  });

  it("cleans up earlier effects and animations when a parallel action fails to start", async () => {
    const cleanup = vi.fn();
    const choreography = createMotionChoreography([{
      type: "parallel",
      actions: [
        { type: "effect", effect: { start: () => ({ destroy: cleanup }) } },
        {
          type: "animation",
          target: target(),
          properties: { opacity: [0, 1] },
          options: { duration: 100 },
        },
        {
          type: "animation",
          target: "[invalid",
          properties: { opacity: [0, 1] },
        },
      ],
    }]);

    await expect(choreography.finished).rejects.toThrow(/Invalid CSS selector/);
    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(frames.size).toBe(0);
  });

  it("rejects parallel groups without an animation duration", () => {
    expect(() => createMotionChoreography([{
      type: "parallel",
      actions: [{ type: "effect", effect: { start: () => ({ destroy: () => undefined }) } }],
    }])).toThrow(/at least one animation/);
  });

  it("pauses and resumes compatible effects in an active parallel group", async () => {
    const pause = vi.fn();
    const resume = vi.fn();
    const cleanup = vi.fn();
    const choreography = createMotionChoreography([{
      type: "parallel",
      actions: [
        {
          type: "effect",
          effect: { start: () => ({ pause, resume, destroy: cleanup }) },
        },
        {
          type: "animation",
          target: target(),
          properties: { opacity: [0, 1] },
          options: { duration: 100 },
        },
      ],
    }]);

    choreography.pause();
    choreography.pause();
    expect(pause).toHaveBeenCalledTimes(1);
    choreography.resume();
    choreography.resume();
    expect(resume).toHaveBeenCalledTimes(1);
    choreography.cancel();
    await expect(choreography.finished).rejects.toMatchObject({ name: "AbortError" });
    expect(cleanup).toHaveBeenCalledTimes(1);
  });
});
