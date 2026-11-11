import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  BUILT_IN_MOTION_PRESETS,
  MOTION_PRESET_CATEGORIES,
  PRESET_SCHEMA_VERSION,
  applyPreset,
  composePresetParallel,
  composePresetSequence,
  exportPresetDocument,
  exportPresetsJson,
  getPreset,
  getPresetsByCategory,
  listPresetCategories,
  listPresets,
  presetToParallelStep,
  presetToSequenceStep,
  registerPreset,
  removePreset,
  resolvePresetAnimation,
  searchPresets,
  validatePreset,
  validatePresetOverrides,
  type MotionPreset,
  type MotionPresetCategory,
} from "../src/presets";

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
  removePreset("custom-test-preset");
  removePreset("customTest");
  vi.unstubAllGlobals();
});

describe("AF Motion Preset System", () => {
  describe("Categories and Registry Coverage", () => {
    it("exposes all 9 required motion categories", () => {
      const expected: MotionPresetCategory[] = [
        "entrance",
        "exit",
        "hover",
        "click-interaction",
        "text",
        "scroll",
        "background",
        "page-transition",
        "choreography",
      ];
      expect(listPresetCategories()).toEqual(expected);
      expect(MOTION_PRESET_CATEGORIES).toEqual(expected);
    });

    it("registers at least 30 built-in presets covering every category", () => {
      const all = listPresets();
      expect(all.length).toBeGreaterThanOrEqual(30);

      for (const category of listPresetCategories()) {
        const inCategory = getPresetsByCategory(category);
        expect(inCategory.length).toBeGreaterThan(0);
      }
    });

    it("ensures each preset has complete metadata, tags, and valid configuration", () => {
      for (const preset of listPresets()) {
        expect(preset.id).toBeTypeOf("string");
        expect(preset.id.startsWith("preset-")).toBe(true);
        expect(preset.name).toBeTypeOf("string");
        expect(preset.name.length).toBeGreaterThan(0);
        expect(preset.description.length).toBeGreaterThan(10);
        expect(listPresetCategories()).toContain(preset.category);
        expect(Array.isArray(preset.supportedTargets)).toBe(true);
        expect(preset.supportedTargets.length).toBeGreaterThan(0);
        expect(Array.isArray(preset.tags)).toBe(true);
        expect(preset.tags.length).toBeGreaterThan(0);
        expect(preset.signature).toBeDefined();
        expect(preset.signature.importStatement).toMatch(/from ["']af-motion\/presets/);

        if (preset.animation) {
          expect(preset.animation.properties).toBeDefined();
          expect(Object.keys(preset.animation.properties).length).toBeGreaterThan(0);
          for (const values of Object.values(preset.animation.properties)) {
            expect(Array.isArray(values)).toBe(true);
            expect(values.length).toBeGreaterThanOrEqual(2);
          }
        } else if (preset.choreography) {
          expect(preset.choreography.steps.length).toBeGreaterThan(0);
        } else {
          throw new Error(`Preset ${preset.id} has neither animation nor choreography`);
        }
      }
    });
  });

  describe("Lookup & Search", () => {
    it("supports lookup by ID or name", () => {
      const byId = getPreset("preset-slide-up");
      expect(byId).toBeDefined();
      expect(byId?.name).toBe("slideUp");
      expect(byId?.category).toBe("entrance");

      const byName = getPreset("slideUp");
      expect(byName).toBeDefined();
      expect(byName?.id).toBe("preset-slide-up");

      expect(getPreset("non-existent-preset")).toBeUndefined();
    });

    it("supports keyword searching across description, category, and tags", () => {
      const bounceMatches = searchPresets("bounce");
      expect(bounceMatches.some((p) => p.name === "bounceIn" || p.name === "clickBounce")).toBe(true);

      const exitMatches = searchPresets("exit");
      expect(exitMatches.length).toBeGreaterThan(0);
      expect(exitMatches.every((p) => p.category === "exit" || p.tags.includes("exit"))).toBe(true);

      const glowMatches = searchPresets("glow");
      expect(glowMatches.some((p) => p.name === "hoverGlow" || p.name === "textGlow")).toBe(true);

      expect(searchPresets("")).toEqual([]);
      // @ts-expect-error test invalid query
      expect(searchPresets(null)).toEqual([]);
    });
  });

  describe("Immutability & Overrides", () => {
    it("prevents mutation of registered presets when resolving animation overrides", () => {
      const originalPreset = getPreset("fadeIn");
      expect(originalPreset).toBeDefined();
      expect(originalPreset?.animation?.duration).toBe(400);

      const resolved = resolvePresetAnimation("fadeIn", { duration: 999, delay: 150 });
      expect(resolved.options.duration).toBe(999);
      expect(resolved.options.delay).toBe(150);

      // Verify original preset remains unaffected
      const checkAgain = getPreset("fadeIn");
      expect(checkAgain?.animation?.duration).toBe(400);
      expect(checkAgain?.animation?.delay).toBeUndefined();
    });

    it("throws when resolving an unknown preset", () => {
      expect(() => resolvePresetAnimation("nonExistent")).toThrow(/Unknown motion preset/);
    });

    it("prevents overwriting or removing built-in presets", () => {
      const duplicate: MotionPreset = {
        id: "preset-fade-in",
        name: "fadeIn",
        category: "entrance",
        description: "Hacked preset",
        supportedTargets: ["HTMLElement"],
        reducedMotion: "skips-to-endpoint",
        tags: ["hack"],
        signature: {
          importStatement: "",
          invocation: "",
          exampleCode: "",
        },
        configurableParameters: [],
        animation: { properties: { opacity: [0, 1] } },
      };

      expect(() => registerPreset(duplicate)).toThrow(/Cannot overwrite built-in/);
      expect(removePreset("preset-fade-in")).toBe(false);
      expect(removePreset("fadeIn")).toBe(false);
    });
  });

  describe("Runtime Execution & Composition", () => {
    it("runs an animation preset using applyPreset", () => {
      const element = makeElement();
      const controls = applyPreset(element, "fadeIn", { duration: 100, easing: (p) => p });

      expect(styleOf(element).get("opacity")).toBe("0");
      flushFrame(0);
      flushFrame(50);
      expect(styleOf(element).get("opacity")).toBe("0.5");
      flushFrame(100);
      expect(styleOf(element).get("opacity")).toBe("1");
      controls.cancel();
    });

    it("converts presets into sequence steps and composes them", () => {
      const element = makeElement();
      const step1 = presetToSequenceStep(element, "slideUp", { duration: 100 });
      expect(step1.target).toBe(element);
      expect(step1.properties.transform).toBeDefined();

      const sequenceControls = composePresetSequence(element, [
        "slideUp",
        { preset: "fadeIn", overrides: { duration: 200 } },
      ]);
      expect(sequenceControls).toBeDefined();
      expect(typeof sequenceControls.pause).toBe("function");
      expect(typeof sequenceControls.cancel).toBe("function");
      sequenceControls.finished.catch(() => {});
      sequenceControls.cancel();
    });

    it("converts presets into parallel steps and composes them", () => {
      const el1 = makeElement();
      const el2 = makeElement();

      const parallelStep = presetToParallelStep(el1, "scaleIn");
      expect(parallelStep.target).toBe(el1);
      expect(parallelStep.properties.transform).toBeDefined();

      const parallelControls = composePresetParallel([
        { target: el1, preset: "scaleIn" },
        { target: el2, preset: "fadeIn", overrides: { duration: 250 } },
      ]);
      expect(parallelControls).toBeDefined();
      expect(typeof parallelControls.cancel).toBe("function");
      parallelControls.finished.catch(() => {});
      parallelControls.cancel();
    });
  });

  describe("Custom Preset Registration", () => {
    it("allows registering, retrieving, applying, and removing a valid custom preset", () => {
      const custom: MotionPreset = {
        id: "preset-custom-pop",
        name: "customPop",
        category: "entrance",
        description: "Custom celebratory pop animation.",
        supportedTargets: ["HTMLElement"],
        reducedMotion: "skips-to-endpoint",
        tags: ["custom", "pop"],
        signature: {
          importStatement: 'import { applyPreset } from "af-motion/presets";',
          invocation: 'applyPreset(target, "customPop")',
          exampleCode: 'applyPreset(".target", "customPop");',
        },
        configurableParameters: [],
        animation: {
          properties: { opacity: [0, 1], transform: ["scale(0.5)", "scale(1.1)"] },
          duration: 350,
        },
      };

      registerPreset(custom);
      expect(getPreset("preset-custom-pop")).toBeDefined();
      expect(getPreset("customPop")).toBeDefined();

      const element = makeElement();
      const controls = applyPreset(element, "customPop");
      expect(controls).toBeDefined();
      controls.cancel();

      expect(removePreset("preset-custom-pop")).toBe(true);
      expect(getPreset("customPop")).toBeUndefined();
    });
  });

  describe("Validation & Serialization", () => {
    it("validates preset schema correctly", () => {
      const valid = validatePreset(BUILT_IN_MOTION_PRESETS[0]);
      expect(valid.valid).toBe(true);
      expect(valid.errors.length).toBe(0);

      const invalid = validatePreset({ id: "", name: "" });
      expect(invalid.valid).toBe(false);
      expect(invalid.errors.some((e) => e.parameter === "id")).toBe(true);
      expect(invalid.errors.some((e) => e.parameter === "category")).toBe(true);
    });

    it("validates preset overrides correctly", () => {
      expect(validatePresetOverrides("fadeIn", { duration: -50 }).valid).toBe(false);
      expect(validatePresetOverrides("fadeIn", { playbackRate: 0 }).valid).toBe(false);
      expect(validatePresetOverrides("fadeIn", { duration: 500, delay: 100 }).valid).toBe(true);
      expect(validatePresetOverrides("nonExistent", {}).valid).toBe(false);
    });

    it("exports standalone JSON and versioned preset document", () => {
      const json = exportPresetsJson();
      expect(typeof json).toBe("string");
      const parsed = JSON.parse(json);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(BUILT_IN_MOTION_PRESETS.length);

      const doc = exportPresetDocument();
      expect(doc.version).toBe(PRESET_SCHEMA_VERSION);
      expect(doc.categories).toEqual(MOTION_PRESET_CATEGORIES);
      expect(doc.totalPresets).toBe(BUILT_IN_MOTION_PRESETS.length);
      expect(doc.presets.length).toBe(BUILT_IN_MOTION_PRESETS.length);
    });
  });
});
