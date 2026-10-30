import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMotionStates, registerMotionDNA, removeMotionDNA } from "../src/index";

class FakeStyle {
  values = new Map<string, string>();
  priorities = new Map<string, string>();
  getPropertyValue(name: string): string {
    return this.values.get(name) ?? "";
  }
  getPropertyPriority(name: string): string {
    return this.priorities.get(name) ?? "";
  }
  setProperty(name: string, value: string, priority = ""): void {
    this.values.set(name, value);
    this.priorities.set(name, priority);
  }
  removeProperty(name: string): void {
    this.values.delete(name);
    this.priorities.delete(name);
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
}

function target(element: FakeHTMLElement): HTMLElement {
  return element as unknown as HTMLElement;
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
  vi.stubGlobal("getComputedStyle", (element: FakeHTMLElement) => ({
    getPropertyValue: (name: string) => element.style.getPropertyValue(name),
  }));
});

afterEach(() => {
  removeMotionDNA("stateMotion");
  vi.unstubAllGlobals();
});

describe("createMotionStates()", () => {
  it("initializes and transitions between named states with Motion DNA", async () => {
    registerMotionDNA("stateMotion", { duration: 100, easing: "linear" });
    const element = new FakeHTMLElement();
    const states = createMotionStates(target(element), {
      hidden: { values: { opacity: 0, transform: "scale(0.9)" } },
      visible: {
        values: { opacity: 1, transform: "scale(1)" },
        motionDNA: { name: "stateMotion" },
      },
    }, { initialState: "hidden" });

    expect(states.currentState).toBe("hidden");
    expect(element.style.getPropertyValue("opacity")).toBe("0");
    const transition = states.transitionTo("visible");
    await flush(0);
    await flush(50);
    expect(element.style.getPropertyValue("opacity")).toBe("0.5");
    await flush(100);
    await expect(transition.finished).resolves.toBeUndefined();
    expect(states.currentState).toBe("visible");
    states.destroy();
    expect(element.style.getPropertyValue("opacity")).toBe("");
  });

  it("replaces an active transition from its current rendered value", async () => {
    const element = new FakeHTMLElement();
    element.style.setProperty("opacity", "0");
    const states = createMotionStates(target(element), {
      middle: { values: { opacity: 0.5 } },
      end: { values: { opacity: 1 } },
    });

    const first = states.transitionTo("middle", { duration: 100, easing: "linear" });
    await flush(0);
    await flush(40);
    expect(element.style.getPropertyValue("opacity")).toBe("0.2");

    const second = states.transitionTo("end", { duration: 100, easing: "linear" });
    await expect(first.finished).rejects.toMatchObject({ name: "AbortError" });
    expect(element.style.getPropertyValue("opacity")).toBe("0.2");
    await flush(50);
    await flush(150);
    await expect(second.finished).resolves.toBeUndefined();
    expect(element.style.getPropertyValue("opacity")).toBe("1");
    states.destroy();
    expect(frames.size).toBe(0);
  });

  it("rejects unknown states and cancels/restores safely on destroy", async () => {
    const element = new FakeHTMLElement();
    element.style.setProperty("opacity", "0.25", "important");
    const states = createMotionStates(target(element), {
      active: { values: { opacity: 1 } },
    });
    expect(() => states.transitionTo("missing")).toThrow(/Unknown motion state/);
    const transition = states.transitionTo("active", { duration: 200 });
    states.destroy();
    await expect(transition.finished).rejects.toMatchObject({ name: "AbortError" });
    expect(element.style.getPropertyValue("opacity")).toBe("0.25");
    expect(element.style.getPropertyPriority("opacity")).toBe("important");
    expect(frames.size).toBe(0);
    expect(() => states.transitionTo("active")).toThrow(/destroyed/);
    states.destroy();
  });

  it("applies per-transition options over DNA defaults and rejects invalid definitions", async () => {
    registerMotionDNA("stateMotion", { duration: 200, easing: "linear" });
    const element = new FakeHTMLElement();
    const states = createMotionStates(target(element), {
      first: { values: { opacity: 0 } },
      second: { values: { opacity: 1 } },
    }, { initialState: "first", motionDNA: { name: "stateMotion" } });

    const transition = states.transitionTo("second", { duration: 40 });
    await flush(0);
    await flush(40);
    await expect(transition.finished).resolves.toBeUndefined();
    states.destroy();
    expect(() => createMotionStates(target(element), {})).toThrow(/At least one/);
    expect(() => createMotionStates(target(element), {
      first: { values: { opacity: 0 } },
    }, { initialState: "missing" })).toThrow(/Unknown motion state/);
  });
});
