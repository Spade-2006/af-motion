import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  BUILT_IN_CHOREOGRAPHIES,
  CHOREOGRAPHY_SCHEMA_VERSION,
  createMotionChoreography,
  exportChoreographiesDocument,
  exportChoreographyJson,
  getChoreography,
  importChoreographyFromJson,
  listChoreographies,
  registerChoreography,
  removeChoreography,
  resetChoreographyRegistry,
  searchChoreographies,
  validateChoreography,
  type ChoreographyDefinition,
} from "../src/presets";
import { registerMotionDNA, removeMotionDNA } from "../src/index";

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
  resetChoreographyRegistry();
});

afterEach(() => {
  removeMotionDNA("testDna");
  resetChoreographyRegistry();
  vi.unstubAllGlobals();
});

describe("Advanced Choreography - Execution & Composition", () => {
  it("orchestrates sequential presets with slot target bindings", async () => {
    const headline = target();
    const subhead = target();
    const cta = target();

    const choreo = createMotionChoreography("heroEntrance", {
      targets: {
        headline,
        subhead,
        cta,
      },
    });

    expect(choreo.finished).toBeInstanceOf(Promise);
    await advance(2200, 50);

    await expect(choreo.finished).resolves.toBeUndefined();
    expect(headline.style.getPropertyValue("opacity")).toBe("1");
  });

  it("throws when required declared target slots are missing", () => {
    expect(() => {
      createMotionChoreography("heroEntrance", {
        targets: {
          headline: target(),
          // missing subhead and cta
        },
      });
    }).toThrow(/Missing target binding for slot/);
  });

  it("executes parallel groups containing presets and custom animations", async () => {
    const card = target();
    const content = target();

    const choreo = createMotionChoreography("cardReveal", {
      targets: {
        card,
        content,
      },
    });

    await advance(800, 50);
    await expect(choreo.finished).resolves.toBeUndefined();
  });

  it("supports reverse() on pure sequential choreographies", async () => {
    const el1 = target();
    const el2 = target();

    const choreo = createMotionChoreography([
      { type: "preset", preset: "fadeIn", target: el1, duration: 200 },
      { type: "preset", preset: "slideUp", target: el2, duration: 200 },
    ]);

    expect(typeof choreo.reverse).toBe("function");
    await advance(100, 50);
    choreo.reverse?.();
    await advance(100, 50);
  });

  it("applies step overrides by label", async () => {
    const el = target();
    const choreo = createMotionChoreography(
      [
        { type: "preset", preset: "fadeIn", target: el, label: "fadeStep", duration: 500 },
      ],
      {
        stepOverrides: {
          fadeStep: { duration: 100 },
        },
      }
    );

    await advance(150, 50);
    await expect(choreo.finished).resolves.toBeUndefined();
  });

  it("integrates Motion DNA across all choreography steps", async () => {
    registerMotionDNA("testDna", { duration: 50, easing: "linear" });
    const el = target();

    const choreo = createMotionChoreography(
      [
        { type: "preset", preset: "fadeIn", target: el },
      ],
      {
        motionDNA: "testDna",
      }
    );

    await advance(100, 50);
    await expect(choreo.finished).resolves.toBeUndefined();
  });

  it("integrates Design System easing and timing tokens", async () => {
    const el = target();
    const choreo = createMotionChoreography(
      [
        { type: "preset", preset: "fadeIn", target: el },
      ],
      {
        designSystem: "ds-default",
      }
    );

    await advance(500, 50);
    await expect(choreo.finished).resolves.toBeUndefined();
  });

  it("supports pause() and play()/resume()", async () => {
    const pauseFn = vi.fn();
    const resumeFn = vi.fn();
    const cleanupFn = vi.fn();

    const choreo = createMotionChoreography([
      {
        type: "parallel",
        actions: [
          {
            type: "effect",
            effect: {
              start: () => ({ pause: pauseFn, resume: resumeFn, destroy: cleanupFn }),
            },
          },
          {
            type: "animation",
            target: target(),
            properties: { opacity: [0, 1] },
            options: { duration: 200 },
          },
        ],
      },
    ]);

    choreo.pause();
    choreo.pause(); // idempotent
    expect(pauseFn).toHaveBeenCalledTimes(1);

    choreo.play?.(); // resumes
    choreo.resume(); // idempotent
    expect(resumeFn).toHaveBeenCalledTimes(1);

    choreo.cancel();
    await expect(choreo.finished).rejects.toMatchObject({ name: "AbortError" });
    expect(cleanupFn).toHaveBeenCalledTimes(1);
  });

  it("cancels cleanly and rejects finished with AbortError", async () => {
    const el = target();
    const choreo = createMotionChoreography([
      {
        type: "parallel",
        actions: [
          { type: "preset", preset: "fadeIn", target: el, duration: 500 },
        ],
      },
    ]);

    choreo.finished.catch(() => {});
    choreo.cancel();
    choreo.cancel(); // idempotent

    await expect(choreo.finished).rejects.toMatchObject({ name: "AbortError" });
  });
});

describe("Advanced Choreography - Registry & Management", () => {
  it("provides built-in choreographies", () => {
    expect(BUILT_IN_CHOREOGRAPHIES.length).toBeGreaterThanOrEqual(3);
    const hero = getChoreography("heroEntrance");
    expect(hero).toBeDefined();
    expect(hero?.name).toBe("Hero Entrance");
    expect(hero?.targets).toContain("headline");

    const page = getChoreography("pageTransition");
    expect(page).toBeDefined();
    expect(page?.targets).toContain("incoming");

    const card = getChoreography("cardReveal");
    expect(card).toBeDefined();
  });

  it("registers, retrieves, and lists custom choreographies", () => {
    const def: ChoreographyDefinition = {
      id: "customChoreo",
      name: "Custom Choreography",
      description: "A custom animation sequence",
      actions: [
        { type: "preset", preset: "fadeIn", target: "$box" },
      ],
      metadata: {
        category: "custom",
        tags: ["custom", "test"],
      },
    };

    registerChoreography(def);
    const retrieved = getChoreography("customChoreo");
    expect(retrieved).toBeDefined();
    expect(retrieved?.name).toBe("Custom Choreography");

    const all = listChoreographies();
    expect(all.some((c) => c.id === "customChoreo")).toBe(true);
  });

  it("enforces immutability on registered definitions", () => {
    const def: ChoreographyDefinition = {
      id: "immutableChoreo",
      name: "Immutable Choreography",
      actions: [
        { type: "preset", preset: "fadeIn", target: "$box" },
      ],
    };

    registerChoreography(def);
    const retrieved = getChoreography("immutableChoreo");
    expect(Object.isFrozen(retrieved)).toBe(true);
    expect(Object.isFrozen(retrieved?.actions)).toBe(true);
  });

  it("prevents overwriting or removing built-in choreographies", () => {
    expect(() => {
      registerChoreography({
        id: "heroEntrance",
        name: "Malicious Hero",
        actions: [{ type: "preset", preset: "fadeIn" }],
      });
    }).toThrow(/Cannot overwrite built-in choreography/);

    expect(() => {
      removeChoreography("heroEntrance");
    }).toThrow(/Cannot remove built-in choreography/);
  });

  it("searches choreographies by text, category, and tag", () => {
    const results = searchChoreographies("hero");
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].id).toBe("heroEntrance");

    const categoryResults = searchChoreographies({ category: "page-transition" });
    expect(categoryResults.some((c) => c.id === "pageTransition")).toBe(true);

    const tagResults = searchChoreographies({ tag: "stagger" });
    expect(tagResults.some((c) => c.id === "heroEntrance")).toBe(true);
  });

  it("removes custom choreographies and resets registry", () => {
    const def: ChoreographyDefinition = {
      id: "removableChoreo",
      name: "Removable Choreography",
      actions: [{ type: "preset", preset: "slideUp" }],
    };
    registerChoreography(def);
    expect(getChoreography("removableChoreo")).toBeDefined();

    const removed = removeChoreography("removableChoreo");
    expect(removed).toBe(true);
    expect(getChoreography("removableChoreo")).toBeUndefined();

    // Reset restores built-ins
    resetChoreographyRegistry();
    expect(getChoreography("heroEntrance")).toBeDefined();
  });
});

describe("Advanced Choreography - JSON & Schema", () => {
  it("validates choreography definitions", () => {
    expect(validateChoreography(null).valid).toBe(false);
    expect(validateChoreography({}).valid).toBe(false);
    expect(validateChoreography({ id: "", name: "test", actions: [] }).valid).toBe(false);

    const valid = validateChoreography({
      id: "validChoreo",
      name: "Valid Choreography",
      actions: [{ type: "preset", preset: "fadeIn" }],
    });
    expect(valid.valid).toBe(true);
    expect(valid.errors).toHaveLength(0);
  });

  it("exports and imports choreography JSON with schema version", () => {
    const json = exportChoreographyJson("heroEntrance");
    expect(typeof json).toBe("string");
    const parsed = JSON.parse(json);
    expect(parsed.$schemaVersion).toBe(CHOREOGRAPHY_SCHEMA_VERSION);
    expect(parsed.id).toBe("heroEntrance");

    const imported = importChoreographyFromJson(json);
    expect(imported.id).toBe("heroEntrance");
    expect(imported.name).toBe("Hero Entrance");
  });

  it("exports the full choreographies document", () => {
    const docJson = exportChoreographiesDocument();
    const doc = JSON.parse(docJson);
    expect(doc.$schemaVersion).toBe(CHOREOGRAPHY_SCHEMA_VERSION);
    expect(typeof doc.timestamp).toBe("string");
    expect(doc.count).toBeGreaterThanOrEqual(3);
    expect(Array.isArray(doc.choreographies)).toBe(true);
  });

  it("cancels deeply nested sequence inside parallel cleanly without unhandled rejections", async () => {
    const target1 = target();
    const target2 = target();

    const choreography = createMotionChoreography([
      {
        type: "parallel",
        actions: [
          {
            type: "sequence",
            actions: [
              {
                type: "animation",
                target: target1,
                properties: { opacity: [0, 1] },
                options: { duration: 500 },
              },
              {
                type: "animation",
                target: target1,
                properties: { opacity: [1, 0] },
                options: { duration: 500 },
              },
            ],
          },
          {
            type: "animation",
            target: target2,
            properties: { opacity: [0, 1] },
            options: { duration: 1000 },
          },
        ],
      },
    ]);

    await flush(50);
    choreography.cancel();

    await expect(choreography.finished).rejects.toThrow("Motion choreography was cancelled");
    expect(frames.size).toBe(0);
  });

  it("applies delay and offset correctly to recipe actions within choreography", async () => {
    const target1 = target();
    const choreography = createMotionChoreography([
      {
        type: "recipe",
        recipe: {
          id: "recipeWithDelay",
          name: "Recipe With Delay",
          steps: [
            {
              type: "preset",
              preset: "fadeIn",
              duration: 300,
            },
          ],
        },
        targets: target1,
        delay: 150,
        offset: 50,
      },
    ]);

    expect(choreography).toBeDefined();
    expect(typeof choreography.cancel).toBe("function");
    choreography.cancel();
    await expect(choreography.finished).rejects.toThrow("Motion choreography was cancelled");
  });
});
