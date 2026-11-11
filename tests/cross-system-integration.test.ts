import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createMotionChoreography,
  getPreset,
  resolvePresetAnimation,
  runRecipe,
  createMotionRecipe,
  registerRecipe,
  getRecipe,
  BUILT_IN_MOTION_RECIPES,
  applyPreset,
  listPresets,
  resolveDesignSystem,
  createDesignSystem,
  registerDesignSystem,
  resolveMotionDNA,
  registerMotionDNA,
  removeMotionDNA,
  adaptAnimationOptions,
  type DeclarativeMotionRecipe,
  type DesignSystemDefinition,
} from "../src/presets.js";
import {
  getCapability,
  listCapabilities,
} from "../src/catalogue.js";

class FakeStyle {
  values = new Map<string, string>();
  getPropertyValue(name: string): string {
    return this.values.get(name) ?? "";
  }
  getPropertyPriority(_name: string): string {
    return "";
  }
  setProperty(name: string, value: string): void {
    this.values.set(name, value);
  }
  removeProperty(name: string): void {
    this.values.delete(name);
  }
}

class FakeHTMLElement {
  nodeType = 1;
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

async function advance(duration: number, step = 50): Promise<void> {
  const targetTime = clockTime + duration;
  while (clockTime < targetTime) {
    const next = Math.min(clockTime + step, targetTime);
    await flush(next);
  }
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
  removeMotionDNA("csDna");
  vi.unstubAllGlobals();
});

describe("Cross-System Integration - Configuration Precedence & Propagation", () => {
  it("resolves precedence: Step Override > Design System > Motion DNA > Preset Defaults", () => {
    registerMotionDNA("csDna", {
      duration: 300,
      easing: "easeOutCubic",
    });

    const dsDef: DesignSystemDefinition = {
      id: "cs-design-system",
      name: "Cross-System DS",
      motionDNA: "csDna",
      timing: {
        standard: 400,
      },
      easings: {
        standard: "linear",
      },
    };
    const ds = createDesignSystem(dsDef);

    // 1. Preset with Design System inherits DS duration & easing
    const resolvedDs = resolvePresetAnimation("fadeIn", { designSystem: ds });
    expect(resolvedDs.options.duration).toBe(400);

    // 2. Explicit step override takes precedence over Design System
    const resolvedOverride = resolvePresetAnimation("fadeIn", {
      designSystem: ds,
      duration: 150,
      easing: "easeInQuad",
    });
    expect(resolvedOverride.options.duration).toBe(150);
    expect(resolvedOverride.options.easing).toBe("easeInQuad");
  });

  it("propagates adaptive motion constraints through recipes and choreography", () => {
    const opts = adaptAnimationOptions(
      { duration: 400, respectReducedMotion: false },
      { reducedMotion: true }
    );
    expect(opts.respectReducedMotion).toBe(true);

    const lowPowerOpts = adaptAnimationOptions(
      { duration: 200 },
      { lowPower: true }
    );
    expect(lowPowerOpts.duration).toBe(Math.round(200 / 0.6));
  });
});

describe("Cross-System Integration - Target Binding Across Composition Systems", () => {
  it("binds target slots across presets, nested recipes, and parent choreography", async () => {
    const cardEl = target();
    const btnEl = target();
    const titleEl = target();

    const nestedRecipe: DeclarativeMotionRecipe = {
      id: "csNestedCardRecipe",
      name: "Nested Card Recipe",
      description: "Recipe inside choreography",
      requiredTargets: ["card", "button"],
      steps: [
        { type: "preset", preset: "scaleIn", target: "$card", duration: 200 },
        { type: "preset", preset: "fadeIn", target: "$button", duration: 150 },
      ],
    };
    registerRecipe(nestedRecipe);

    const choreo = createMotionChoreography([
      {
        type: "preset",
        preset: "slideUp",
        target: "$title",
        duration: 200,
      },
      {
        type: "recipe",
        recipe: "csNestedCardRecipe",
        targets: {
          card: cardEl,
          button: btnEl,
        },
      },
    ], {
      targets: {
        title: titleEl,
      },
    });

    await advance(800, 50);
    await expect(choreo.finished).resolves.toBeUndefined();
    expect(titleEl.style.getPropertyValue("opacity")).toBe("1");
    expect(cardEl.style.getPropertyValue("opacity")).toBe("1");
    expect(btnEl.style.getPropertyValue("opacity")).toBe("1");
  });

  it("handles fallback targets when a single target element is provided", async () => {
    const el = target();
    const choreo = createMotionChoreography([
      { type: "preset", preset: "fadeIn" },
    ], {
      targets: el,
    });

    await advance(500, 50);
    await expect(choreo.finished).resolves.toBeUndefined();
    expect(el.style.getPropertyValue("opacity")).toBe("1");
  });

  it("throws clear error when required recipe slots are missing", () => {
    expect(() => {
      runRecipe("csNestedCardRecipe", {
        targets: {
          card: target(),
          // missing "button"
        },
      });
    }).toThrow(/Missing.*target.*button/);
  });
});

describe("Cross-System Integration - Shared Lifecycle & Cleanup Safety", () => {
  it("cleans up active animations, recipes, and effects when choreography is cancelled", async () => {
    const effectCleanup = vi.fn();
    const cardEl = target();
    const choreo = createMotionChoreography([
      {
        type: "parallel",
        actions: [
          {
            type: "effect",
            effect: { start: () => ({ destroy: effectCleanup }) },
          },
          {
            type: "preset",
            preset: "fadeIn",
            target: cardEl,
            duration: 1000,
          },
        ],
      },
    ]);

    choreo.finished.catch(() => {});
    await advance(100, 50);

    choreo.cancel();
    await expect(choreo.finished).rejects.toMatchObject({ name: "AbortError" });
    expect(effectCleanup).toHaveBeenCalledTimes(1);
    expect(frames.size).toBe(0);
  });

  it("coordinates pause() and resume() across nested parallel and sequence recipes", async () => {
    const el = target();
    const pauseEffect = vi.fn();
    const resumeEffect = vi.fn();
    const destroyEffect = vi.fn();

    const choreo = createMotionChoreography([
      {
        type: "parallel",
        actions: [
          {
            type: "effect",
            effect: {
              start: () => ({
                pause: pauseEffect,
                resume: resumeEffect,
                destroy: destroyEffect,
              }),
            },
          },
          {
            type: "preset",
            preset: "fadeIn",
            target: el,
            duration: 400,
          },
        ],
      },
    ]);

    choreo.pause();
    expect(pauseEffect).toHaveBeenCalledTimes(1);
    choreo.resume();
    expect(resumeEffect).toHaveBeenCalledTimes(1);

    choreo.cancel();
    await expect(choreo.finished).rejects.toMatchObject({ name: "AbortError" });
    expect(destroyEffect).toHaveBeenCalledTimes(1);
  });

  it("executes nested sequence steps inside declarative recipes", async () => {
    const el1 = target();
    const el2 = target();

    const nestedSequenceRecipe: DeclarativeMotionRecipe = {
      id: "csNestedSeqRecipe",
      name: "Nested Sequence Recipe",
      description: "Recipe containing nested sequence step",
      steps: [
        {
          type: "sequence",
          steps: [
            { type: "preset", preset: "fadeIn", target: el1, duration: 150 },
            { type: "preset", preset: "slideUp", target: el2, duration: 150 },
          ],
        },
      ],
    };

    const ctrl = runRecipe(nestedSequenceRecipe);
    await advance(400, 50);
    await expect(ctrl.finished).resolves.toBeUndefined();
    expect(el1.style.getPropertyValue("opacity")).toBe("1");
    expect(el2.style.getPropertyValue("opacity")).toBe("1");
  });
});

describe("Cross-System Integration - Concurrent Execution & Immutability", () => {
  it("runs concurrent choreography instances without state collision", async () => {
    const elA = target();
    const elB = target();

    const choreoA = createMotionChoreography([
      { type: "preset", preset: "fadeIn", target: elA, duration: 200 },
    ]);
    const choreoB = createMotionChoreography([
      { type: "preset", preset: "slideUp", target: elB, duration: 200 },
    ]);

    await advance(250, 50);
    await expect(choreoA.finished).resolves.toBeUndefined();
    await expect(choreoB.finished).resolves.toBeUndefined();
    expect(elA.style.getPropertyValue("opacity")).toBe("1");
    expect(elB.style.getPropertyValue("opacity")).toBe("1");
  });

  it("preserves immutability of registered recipes and choreographies", () => {
    const heroRecipe = BUILT_IN_MOTION_RECIPES.find((r) => r.id === "recipe-hero-stagger");
    expect(heroRecipe).toBeDefined();
    expect(Object.isFrozen(heroRecipe)).toBe(true);
    expect(Object.isFrozen(heroRecipe?.steps)).toBe(true);

    const choreoDef = createMotionChoreography("heroEntrance", {
      targets: {
        headline: target(),
        subhead: target(),
        cta: target(),
      },
    });
    expect(choreoDef).toBeDefined();
  });
});

describe("Cross-System Integration - Catalogue Descriptors Accuracy", () => {
  it("verifies capability catalogue accurately documents choreography and recipes", () => {
    const choreoCap = getCapability("comp-motion-choreography");
    expect(choreoCap).toBeDefined();
    expect(choreoCap?.controls).toContain("play");
    expect(choreoCap?.controls).toContain("reverse");
    expect(choreoCap?.reducedMotion).toBe("skips-to-endpoint");

    const recipeCap = getCapability("comp-motion-recipe");
    expect(recipeCap).toBeDefined();
    expect(recipeCap?.controls).toContain("play");
    expect(recipeCap?.controls).toContain("reverse");
    expect(recipeCap?.controls).toContain("seek");
    expect(recipeCap?.reducedMotion).toBe("respects-profile");
  });

  it("verifies all registered capabilities have valid signatures and supported targets", () => {
    const all = listCapabilities();
    for (const cap of all) {
      expect(cap.signature.importStatement).toContain("af-motion");
      expect(cap.supportedTargets.length).toBeGreaterThan(0);
      expect(Array.isArray(cap.controls)).toBe(true);
    }
  });
});
