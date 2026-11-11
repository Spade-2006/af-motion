import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  BUILT_IN_MOTION_DNA,
  MOTION_DNA_SCHEMA_VERSION,
  applyMotionDNA,
  cloneMotionDNA,
  exportMotionDNADocument,
  exportMotionDNAJson,
  getMotionDNA,
  importMotionDNAFromJson,
  listMotionDNA,
  motionDNARegistry,
  registerMotionDNA,
  removeMotionDNA,
  resolveMotionDNA,
  searchMotionDNA,
  validateMotionDNA,
  type MotionDNA,
} from "../src/core/motion-dna.js";
import { applyPreset, getPreset, resolvePresetAnimation } from "../src/presets.js";
import { runRecipe, type DeclarativeMotionRecipe } from "../src/core/motion-recipe.js";

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

describe("Motion DNA System Integration", () => {
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
    removeMotionDNA("custom-calm");
    removeMotionDNA("brandCustom");
    vi.unstubAllGlobals();
    frames.clear();
  });

  describe("Built-in Motion DNA Profiles", () => {
    it("provides 6 distinct built-in profiles with consistent metadata", () => {
      expect(BUILT_IN_MOTION_DNA).toHaveLength(6);
      const personalities = BUILT_IN_MOTION_DNA.map((dna) => dna.personality);
      expect(personalities).toEqual(["snappy", "energetic", "calm", "cinematic", "minimal", "playful"]);

      for (const dna of BUILT_IN_MOTION_DNA) {
        expect(dna.id).toMatch(/^dna-[a-z]+$/);
        expect(dna.name).toBe(dna.personality);
        expect(dna.description.length).toBeGreaterThan(15);
        expect(dna.duration).toBeGreaterThan(0);
        expect(typeof dna.easing).toBe("string");
        expect(dna.respectReducedMotion).toBe(true);
        expect(dna.characteristics).toBeDefined();
        expect(dna.characteristics.intensity).toBeGreaterThan(0);
        expect(dna.characteristics.distanceMultiplier).toBeGreaterThan(0);
        expect(dna.metadata).toBeDefined();
        expect(dna.metadata.compatibleSystems.length).toBeGreaterThan(0);
        expect(dna.metadata.configurableParameters.length).toBeGreaterThan(0);
        expect(dna.metadata.examples.length).toBeGreaterThan(0);
      }
    });

    it("freezes built-in profiles and protects them from mutation, overwrite, or removal", () => {
      const snappy = getMotionDNA("snappy");
      expect(snappy).toBeDefined();
      expect(Object.isFrozen(snappy)).toBe(true);
      expect(Object.isFrozen(snappy!.characteristics)).toBe(true);

      // Attempted mutation throws in strict mode
      expect(() => {
        (snappy as any).duration = 999;
      }).toThrow();

      // Attempted overwrite throws
      expect(() => {
        registerMotionDNA("snappy", { duration: 999 });
      }).toThrow(/Cannot overwrite built-in Motion DNA/);

      // Attempted removal throws
      expect(() => {
        removeMotionDNA("snappy");
      }).toThrow(/Cannot remove built-in Motion DNA/);
    });

    it("retrieves profiles by personality name or full ID", () => {
      const byName = getMotionDNA("cinematic");
      const byId = getMotionDNA("dna-cinematic");
      expect(byName).toBeDefined();
      expect(byName).toBe(byId);
      expect(byName?.duration).toBe(600);
    });

    it("lists and searches Motion DNA profiles", () => {
      const all = listMotionDNA();
      expect(all.length).toBeGreaterThanOrEqual(6);

      const calmSearch = searchMotionDNA("calm");
      expect(calmSearch.length).toBeGreaterThanOrEqual(1);
      expect(calmSearch[0].personality).toBe("calm");

      const springSearch = searchMotionDNA("bounce");
      expect(springSearch.some((d) => d.personality === "playful")).toBe(true);
    });
  });

  describe("cloneMotionDNA and Custom Profiles", () => {
    it("clones a profile without mutating the original", () => {
      const original = getMotionDNA("calm")!;
      const cloned = cloneMotionDNA("calm", {
        name: "custom-calm",
        duration: 800,
        personality: "calm",
        characteristics: {
          intensity: 0.5,
        },
      });

      expect(cloned.name).toBe("custom-calm");
      expect(cloned.duration).toBe(800);
      expect(cloned.characteristics.intensity).toBe(0.5);
      // Inherited unchanged properties
      expect(cloned.characteristics.distanceMultiplier).toBe(original.characteristics.distanceMultiplier);
      expect(cloned.characteristics.entranceEasing).toBe(original.characteristics.entranceEasing);

      // Original is completely unchanged
      expect(original.name).toBe("calm");
      expect(original.duration).toBe(500);
      expect(original.characteristics.intensity).toBe(0.7);
    });

    it("registers and manages custom profiles in motionDNARegistry", () => {
      const customDNA: MotionDNA = {
        id: "dna-brand-custom",
        name: "brandCustom",
        description: "Custom branding identity for dashboard cards",
        personality: "energetic",
        duration: 350,
        easing: "easeOutCubic",
        respectReducedMotion: true,
        characteristics: {
          personality: "energetic",
          intensity: 1.1,
          distanceMultiplier: 1.0,
          entranceEasing: "easeOutCubic",
          exitEasing: "easeInCubic",
        },
      };

      registerMotionDNA("brandCustom", customDNA);
      expect(getMotionDNA("brandCustom")).toBeDefined();
      expect(getMotionDNA("brandCustom")?.duration).toBe(350);

      // Can be removed safely
      expect(removeMotionDNA("brandCustom")).toBe(true);
      expect(getMotionDNA("brandCustom")).toBeUndefined();
    });
  });

  describe("Validation & Precedence", () => {
    it("validates valid and invalid DNA structures", () => {
      const valid = validateMotionDNA({
        name: "testValid",
        duration: 300,
        personality: "snappy",
        characteristics: {
          intensity: 1.0,
          distanceMultiplier: 1.0,
        },
      });
      expect(valid.valid).toBe(true);
      expect(valid.errors).toHaveLength(0);

      const invalid = validateMotionDNA({
        name: "",
        duration: -50,
        personality: "invalid-personality" as any,
        characteristics: {
          intensity: -1,
        },
      });
      expect(invalid.valid).toBe(false);
      expect(invalid.errors.some((e) => e.parameter === "name")).toBe(true);
      expect(invalid.errors.some((e) => e.parameter === "duration")).toBe(true);
      expect(invalid.errors.some((e) => e.parameter === "personality")).toBe(true);
      expect(invalid.errors.some((e) => e.parameter === "characteristics.intensity")).toBe(true);
    });

    it("follows strict precedence: Preset Defaults < DNA Defaults < Preset/Recipe Config < Runtime Overrides", () => {
      // 1. Preset defaults
      const rawPreset = getPreset("fadeIn")!;
      const baseResolved = resolvePresetAnimation("fadeIn");
      expect(baseResolved.options.duration).toBe(rawPreset.animation.duration);

      // 2. DNA defaults override preset defaults
      const dnaResolved = resolvePresetAnimation("fadeIn", { motionDNA: "snappy" });
      const snappy = getMotionDNA("snappy")!;
      expect(dnaResolved.options.duration).toBe(snappy.duration);
      expect(dnaResolved.options.easing).toBe(snappy.characteristics.entranceEasing);

      // 3. Runtime overrides win over DNA defaults
      const overridden = resolvePresetAnimation("fadeIn", {
        motionDNA: "snappy",
        duration: 999,
        easing: "linear",
      });
      expect(overridden.options.duration).toBe(999);
      expect(overridden.options.easing).toBe("linear");
    });
  });

  describe("Preset Integration", () => {
    it("applies category-aware easings and duration multipliers from Motion DNA", () => {
      const energetic = getMotionDNA("energetic")!;

      // Entrance preset receives entranceEasing
      const entranceResolved = resolvePresetAnimation("fadeIn", { motionDNA: "energetic" });
      expect(entranceResolved.options.easing).toBe(energetic.characteristics.entranceEasing);

      // Exit preset receives exitEasing and exitDurationMultiplier
      const exitResolved = resolvePresetAnimation("slideOutUp", { motionDNA: "energetic" });
      expect(exitResolved.options.easing).toBe(energetic.characteristics.exitEasing);
      const expectedExitDuration = Math.round(energetic.duration * energetic.characteristics.exitDurationMultiplier!);
      expect(exitResolved.options.duration).toBe(expectedExitDuration);

      // Hover preset receives interactionEasing and hoverDurationMultiplier
      const hoverResolved = resolvePresetAnimation("hoverScale", { motionDNA: "energetic" });
      expect(hoverResolved.options.easing).toBe(energetic.characteristics.interactionEasing);
      const expectedHoverDuration = Math.round(energetic.duration * energetic.characteristics.hoverDurationMultiplier!);
      expect(hoverResolved.options.duration).toBe(expectedHoverDuration);
    });

    it("applies preset via applyPreset with motionDNA override", () => {
      const target = makeElement();
      const anim = applyPreset(target, "fadeIn", { motionDNA: "calm" });
      expect(anim).toBeDefined();
      expect(anim.cancel).toBeDefined();

      flushFrame(16);
      anim.cancel();
    });
  });

  describe("Declarative Recipe Integration", () => {
    it("applies motionDNA to declarative recipe runs", async () => {
      const el1 = makeElement();
      const el2 = makeElement();

      const recipe: DeclarativeMotionRecipe = {
        id: "test-dna-recipe",
        name: "testDnaRecipe",
        description: "Test recipe configured with Motion DNA",
        requiredTargets: ["card", "button"],
        steps: [
          { preset: "fadeIn", target: "$card" },
          { preset: "slideUp", target: "$button" },
        ],
      };

      const controls = runRecipe(recipe, {
        targets: { card: el1, button: el2 },
        motionDNA: "minimal",
      });

      controls.finished?.catch(() => {});
      expect(controls).toBeDefined();
      expect(typeof controls.pause).toBe("function");
      expect(typeof controls.cancel).toBe("function");

      flushFrame(16);
      controls.cancel();
    });

    it("supports recipe-level default motionDNA", () => {
      const el = makeElement();

      const recipe: DeclarativeMotionRecipe = {
        id: "test-recipe-default-dna",
        name: "testRecipeDefaultDna",
        description: "Recipe with baked-in motionDNA",
        motionDNA: "playful",
        steps: [{ preset: "scaleIn", target: el }],
      };

      const controls = runRecipe(recipe);
      controls.finished?.catch(() => {});
      expect(controls).toBeDefined();
      flushFrame(16);
      controls.cancel();
    });
  });

  describe("Reduced Motion Preservation", () => {
    it("preserves respectReducedMotion: true under all circumstances", () => {
      for (const dna of BUILT_IN_MOTION_DNA) {
        expect(dna.respectReducedMotion).toBe(true);
      }

      const resolved = resolvePresetAnimation("fadeIn", { motionDNA: "cinematic" });
      expect(resolved.options.respectReducedMotion).toBe(true);

      const applied = applyMotionDNA("energetic");
      expect(applied.respectReducedMotion).toBe(true);
    });
  });

  describe("JSON Export, Import and Documentation", () => {
    it("exports versioned Motion DNA JSON document with all registered profiles", () => {
      const doc = exportMotionDNADocument();
      expect(doc.$schema).toBe("https://af-motion.dev/schemas/motion-dna-v1.json");
      expect(doc.version).toBe(MOTION_DNA_SCHEMA_VERSION);
      expect(doc.totalProfiles).toBeGreaterThanOrEqual(6);
      expect(Array.isArray(doc.profiles)).toBe(true);
      expect(doc.profiles.some((p) => p.name === "snappy")).toBe(true);
    });

    it("exports and imports individual profile JSON with deep freeze", () => {
      const snappy = getMotionDNA("snappy")!;
      const json = exportMotionDNAJson(snappy, true);
      expect(typeof json).toBe("string");
      expect(json).toContain('"personality": "snappy"');

      const imported = importMotionDNAFromJson(json);
      expect(imported.name).toBe("snappy");
      expect(imported.duration).toBe(snappy.duration);
      expect(Object.isFrozen(imported)).toBe(true);
      expect(Object.isFrozen(imported.characteristics)).toBe(true);
    });

    it("rejects invalid JSON during import", () => {
      expect(() => importMotionDNAFromJson("")).toThrow(/must be a non-empty string/);
      expect(() => importMotionDNAFromJson('{"name": ""}')).toThrow(/Invalid Motion DNA JSON/);
    });
  });
});
