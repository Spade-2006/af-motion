import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  animatePreset,
  animatePresetSequence,
  getAnimationPreset,
  getAnimationSequencePreset,
  registerAnimationPreset,
  registerAnimationSequencePreset,
  removeAnimationPreset,
  removeAnimationSequencePreset,
} from "../src/core/animation-presets";

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
let clockTime: number;

function flushFrame(time: number): void {
  clockTime = time;
  const callbacks = [...frames.values()];
  frames.clear();
  for (const callback of callbacks) callback(time);
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
  vi.stubGlobal("performance", { now: () => clockTime } as Performance);
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    const id = nextId++;
    frames.set(id, callback);
    return id;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
  vi.stubGlobal("HTMLElement", FakeHTMLElement);
  vi.stubGlobal("matchMedia", () => ({ matches: false }));
});

afterEach(() => {
  for (const name of ["customFade", "mutablePreset", "invalidPreset"]) {
    removeAnimationPreset(name);
  }
  removeAnimationSequencePreset("fadeAndFadeOut");
  vi.unstubAllGlobals();
});

describe("animation presets", () => {
  it.each([
    ["fadeIn", "opacity", 0, 1],
    ["fadeOut", "opacity", 1, 0],
    ["slideUp", "transform", "translateY(24px)", "translateY(0px)"],
    ["slideDown", "transform", "translateY(-24px)", "translateY(0px)"],
    ["scaleIn", "transform", "scale(0.9)", "scale(1)"],
    ["scaleOut", "transform", "scale(1)", "scale(0.9)"],
  ])("provides the %s built-in preset", (name, property, from, to) => {
    expect(getAnimationPreset(name)?.properties[property]).toEqual([from, to]);
  });

  it("runs a preset through animate and applies option overrides", () => {
    const element = makeElement();
    const onComplete = vi.fn();
    const controls = animatePreset(element, "fadeIn", {
      duration: 100,
      easing: (progress) => progress,
      onComplete,
    });

    expect(styleOf(element).get("opacity")).toBe("0");
    flushFrame(0);
    flushFrame(50);
    expect(styleOf(element).get("opacity")).toBe("0.5");
    flushFrame(100);
    expect(styleOf(element).get("opacity")).toBe("1");
    expect(onComplete).toHaveBeenCalledTimes(1);
    controls.cancel();
  });

  it("registers, retrieves, runs, and removes custom presets", () => {
    registerAnimationPreset("customFade", {
      properties: { opacity: [0.2, 0.8] },
      options: { duration: 200 },
    });

    expect(getAnimationPreset("customFade")).toEqual({
      properties: { opacity: [0.2, 0.8] },
      options: { duration: 200 },
    });
    const element = makeElement();
    const controls = animatePreset(element, "customFade");
    expect(styleOf(element).get("opacity")).toBe("0.2");
    controls.cancel();
    expect(removeAnimationPreset("customFade")).toBe(true);
    expect(getAnimationPreset("customFade")).toBeUndefined();
    expect(removeAnimationPreset("customFade")).toBe(false);
  });

  it("does not mutate or expose shared preset definitions", () => {
    const properties = { opacity: [0.1, 0.9] as const };
    const options = { duration: 250 };
    const callerDefinition = { properties, options };
    registerAnimationPreset("mutablePreset", callerDefinition);

    properties.opacity = [0.3, 0.7];
    options.duration = 500;
    const retrieved = getAnimationPreset("mutablePreset");
    expect(retrieved?.properties.opacity).toEqual([0.1, 0.9]);
    expect(retrieved?.options?.duration).toBe(250);

    if (retrieved) {
      expect(Reflect.set(retrieved.properties, "opacity", [0, 1])).toBe(false);
      if (retrieved.options) expect(Reflect.set(retrieved.options, "duration", 1)).toBe(false);
      expect(Reflect.set(retrieved.properties.opacity, "0", 0)).toBe(false);
    }
    expect(getAnimationPreset("mutablePreset")?.properties.opacity).toEqual([0.1, 0.9]);
    expect(getAnimationPreset("mutablePreset")?.options?.duration).toBe(250);
  });

  it("rejects unknown names and attempts to overwrite built-ins", () => {
    expect(() => animatePreset(makeElement(), "notRegistered")).toThrow(/Unknown animation preset/);
    expect(() => getAnimationPreset(" ")).toThrow(TypeError);
    expect(() => registerAnimationPreset("fadeIn", { properties: { opacity: [0, 1] } })).toThrow(
      /Cannot replace built-in/,
    );
    expect(removeAnimationPreset("fadeIn")).toBe(false);
  });

  it("rejects invalid custom definitions", () => {
    expect(() =>
      registerAnimationPreset("invalidPreset", { properties: {} }),
    ).toThrow(/non-empty object/);
    expect(() =>
      registerAnimationPreset("invalidPreset", {
        properties: { opacity: [0] as unknown as readonly [number, number] },
      }),
    ).toThrow(/\[from, to\] pair/    );
  });

  it("registers reusable immutable sequences of named presets", () => {
    const steps = [{ preset: "fadeIn" }, { preset: "fadeOut", overrides: { duration: 200 } }];
    registerAnimationSequencePreset("fadeAndFadeOut", { steps });
    steps[1].overrides.duration = 500;

    expect(getAnimationSequencePreset("fadeAndFadeOut")?.steps[1].overrides?.duration).toBe(200);
    const retrieved = getAnimationSequencePreset("fadeAndFadeOut");
    if (retrieved) expect(Reflect.set(retrieved.steps[0], "preset", "scaleIn")).toBe(false);
    expect(getAnimationSequencePreset("fadeAndFadeOut")?.steps[0].preset).toBe("fadeIn");
  });

  it("plays sequence presets through the shared sequence controls with per-step overrides", async () => {
    registerAnimationSequencePreset("fadeAndFadeOut", {
      steps: [{ preset: "fadeIn" }, { preset: "fadeOut" }],
      options: { onComplete: () => undefined },
    });
    const element = makeElement();
    const onComplete = vi.fn();
    const controls = animatePresetSequence(element, "fadeAndFadeOut", {
      steps: [{ duration: 50 }, { duration: 50 }],
      onComplete,
    });

    expect(styleOf(element).get("opacity")).toBe("0");
    flushFrame(0);
    flushFrame(50);
    expect(styleOf(element).get("opacity")).toBe("1");
    flushFrame(100);
    flushFrame(150);
    expect(styleOf(element).get("opacity")).toBe("0");
    await expect(controls.finished).resolves.toBeUndefined();
    expect(onComplete).toHaveBeenCalledTimes(1);
    controls.cancel();
  });

  it("rejects sequence presets with unknown named presets or excessive overrides", () => {
    expect(() =>
      registerAnimationSequencePreset("invalidPreset", { steps: [{ preset: "missing" }] }),
    ).toThrow(/Unknown animation preset/);
    registerAnimationSequencePreset("fadeAndFadeOut", { steps: [{ preset: "fadeIn" }] });
    expect(() =>
      animatePresetSequence(makeElement(), "fadeAndFadeOut", { steps: [{}, {}] }),
    ).toThrow(/more step overrides than steps/);
  });

  it("cancels the active sequence step without starting later presets", async () => {
    registerAnimationSequencePreset("fadeAndFadeOut", {
      steps: [{ preset: "fadeIn" }, { preset: "fadeOut" }],
    });
    const element = makeElement();
    const controls = animatePresetSequence(element, "fadeAndFadeOut");

    controls.cancel();

    await expect(controls.finished).rejects.toMatchObject({ name: "AbortError" });
    expect(styleOf(element).get("opacity")).toBe("0");
    expect(frames.size).toBe(0);
  });
});
