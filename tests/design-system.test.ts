import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  BUILT_IN_DESIGN_SYSTEMS,
  DESIGN_SYSTEM_SCHEMA_VERSION,
  cloneDesignSystem,
  createDesignSystem,
  exportDesignSystemJson,
  exportDesignSystemsDocument,
  getActiveDesignSystem,
  getDesignSystem,
  importDesignSystemFromJson,
  listDesignSystems,
  registerDesignSystem,
  removeDesignSystem,
  resetDesignSystemRegistry,
  resolveDesignSystem,
  resolveDesignToken,
  resolveMotionTiming,
  resolveMovementDistance,
  searchDesignSystems,
  setActiveDesignSystem,
  subscribeToDesignSystem,
  validateDesignSystem,
  type DesignSystem,
} from "../src/core/design-system.js";
import {
  activatePalette,
  getActivePalette,
  getPalette,
  listPalettes,
  registerPalette,
  removePalette,
} from "../src/core/palettes.js";
import { getPreset, resolvePresetAnimation } from "../src/presets.js";
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

function makeElement(): HTMLElement {
  return new FakeHTMLElement() as unknown as HTMLElement;
}

describe("Design System Integration Layer", () => {
  beforeEach(() => {
    resetDesignSystemRegistry();
  });

  afterEach(() => {
    resetDesignSystemRegistry();
    removePalette("customBrandPalette");
    removeDesignSystem("customBrand");
  });

  describe("Schema & Built-in Design Systems", () => {
    it("exposes schema version 1.0.0", () => {
      expect(DESIGN_SYSTEM_SCHEMA_VERSION).toBe("1.0.0");
    });

    it("provides 3 built-in theme-agnostic design systems with complete tokens", () => {
      expect(BUILT_IN_DESIGN_SYSTEMS.length).toBeGreaterThanOrEqual(3);
      const names = BUILT_IN_DESIGN_SYSTEMS.map((ds) => ds.name);
      expect(names).toContain("default");
      expect(names).toContain("minimal");
      expect(names).toContain("expressive");

      for (const ds of BUILT_IN_DESIGN_SYSTEMS) {
        expect(ds.id).toMatch(/^ds-[a-z]+$/);
        expect(ds.name.length).toBeGreaterThan(0);
        expect(ds.spacing).toBeDefined();
        expect(ds.timing).toBeDefined();
        expect(ds.easings).toBeDefined();
        expect(ds.interaction).toBeDefined();
        expect(Object.isFrozen(ds)).toBe(true);
      }
    });

    it("protects built-in design systems from overwrite or removal", () => {
      expect(() => {
        registerDesignSystem("default", {
          id: "ds-override",
          name: "default",
        });
      }).toThrow(/Cannot overwrite built-in design system/);

      expect(() => {
        removeDesignSystem("default");
      }).toThrow(/Cannot remove built-in design system/);
    });
  });

  describe("Palette Integration (Built-in & Custom)", () => {
    it("resolves built-in palettes (from approved 33 palettes) without modifying them", () => {
      const allPalettes = listPalettes();
      expect(allPalettes.length).toBe(33);

      const cobaltPalette = getPalette("Cobalt Classic");
      expect(cobaltPalette).toBeDefined();
      expect(cobaltPalette?.tokens.accent).toBe("#0047AB");

      const ds = createDesignSystem({
        id: "ds-cobalt-test",
        name: "cobaltTest",
        palette: "Cobalt Classic",
      });

      expect(ds.resolvedPalette).toBeDefined();
      expect(ds.resolvedPalette?.tokens.accent).toBe("#0047AB");
    });

    it("resolves user-defined custom palettes registered via paletteRegistry", () => {
      registerPalette({
        name: "customBrandPalette",
        primary: "#ff0055",
        secondary: "#00cc88",
        accent: "#ffee00",
      });

      const ds = createDesignSystem({
        id: "ds-custom-palette",
        name: "customPaletteDS",
        palette: "customBrandPalette",
      });

      expect(ds.resolvedPalette).toBeDefined();
      expect(ds.resolvedPalette?.tokens.primary).toBe("#ff0055");
    });
  });

  describe("Registration, Lookup, and Search", () => {
    it("registers and retrieves custom design systems by name or ID", () => {
      const customDS = {
        id: "ds-custom-brand",
        name: "customBrand",
        description: "Custom branding design system",
        palette: "Silver Signal",
        timing: {
          fast: 160,
          normal: 280,
          slow: 450,
        },
        spacing: {
          baseUnit: 8,
          distance: { moderate: 20 },
        },
        metadata: {
          tags: ["custom", "enterprise", "fintech"],
        },
      };

      registerDesignSystem("customBrand", customDS);

      const byName = getDesignSystem("customBrand");
      const byId = getDesignSystem("ds-custom-brand");

      expect(byName).toBeDefined();
      expect(byId).toBeDefined();
      expect(byName).toBe(byId);
      expect(byName?.timing?.normal).toBe(280);

      const searchResult = searchDesignSystems("fintech");
      expect(searchResult.some((ds) => ds.name === "customBrand")).toBe(true);

      expect(removeDesignSystem("customBrand")).toBe(true);
      expect(getDesignSystem("customBrand")).toBeUndefined();
    });
  });

  describe("Cloning and Deep Immutability", () => {
    it("clones a design system without mutating the original", () => {
      const original = getDesignSystem("default")!;
      const cloned = cloneDesignSystem("default", {
        name: "customDefault",
        timing: { normal: 400 },
        spacing: { baseUnit: 10 },
      });

      expect(cloned.name).toBe("customDefault");
      expect(cloned.timing?.normal).toBe(400);
      expect(cloned.spacing?.baseUnit).toBe(10);
      // Inherits untouched tokens
      expect(cloned.timing?.fast).toBe(original.timing?.fast);

      // Original remains pristine
      expect(original.name).toBe("default");
      expect(original.timing?.normal).toBe(300);
      expect(original.spacing?.baseUnit).toBe(8);

      // Deep freeze prevents property mutation
      expect(() => {
        (cloned as any).intensity = 99;
      }).toThrow();
    });
  });

  describe("Token Resolution Helpers", () => {
    it("resolves nested tokens by path via resolveDesignToken", () => {
      const ds = getDesignSystem("default")!;

      const moderateDist = resolveDesignToken<number>(ds, "spacing.distance.moderate");
      expect(moderateDist).toBe(16);

      const baseUnit = resolveDesignToken<number>(ds, "spacing.baseUnit");
      expect(baseUnit).toBe(8);

      const fallbackVal = resolveDesignToken(ds, "spacing.distance.nonexistent", 999);
      expect(fallbackVal).toBe(999);
    });

    it("resolves motion timing and movement distance scales", () => {
      const ds = getDesignSystem("default")!;
      expect(resolveMotionTiming(ds, "fast")).toBe(200);
      expect(resolveMotionTiming(ds, "normal")).toBe(300);
      expect(resolveMotionTiming(ds, "unknownCategory", 420)).toBe(420);

      expect(resolveMovementDistance(ds, "subtle")).toBe(8);
      expect(resolveMovementDistance(ds, "dramatic")).toBe(64);
      expect(resolveMovementDistance(ds, "missing", 33)).toBe(33);
    });
  });

  describe("Motion DNA and Preset Integration", () => {
    it("resolves Motion DNA references configured within a design system", () => {
      const ds = getDesignSystem("expressive")!;
      expect(ds.motionDNA).toBe("energetic");
      expect(ds.resolvedMotionDNA).toBeDefined();
      expect(ds.resolvedMotionDNA?.personality).toBe("energetic");
    });

    it("applies design system timing and easings to presets with strict precedence", () => {
      const basePreset = getPreset("fadeIn")!;
      expect(basePreset.animation.duration).toBe(400);

      // 1. Preset with design system applies design system timing (default timing.normal = 300)
      const dsResolved = resolvePresetAnimation("fadeIn", { designSystem: "default" });
      expect(dsResolved.options.duration).toBe(300);
      expect(dsResolved.options.easing).toBe("easeOutQuad");

      // 2. Preset with expressive design system applies expressive timing & easing
      const expResolved = resolvePresetAnimation("fadeIn", { designSystem: "expressive" });
      expect(expResolved.options.duration).toBe(360);
      expect(expResolved.options.easing).toBe("easeOutBack");

      // 3. Runtime overrides win over design system defaults
      const overridden = resolvePresetAnimation("fadeIn", {
        designSystem: "default",
        duration: 999,
        easing: "linear",
      });
      expect(overridden.options.duration).toBe(999);
      expect(overridden.options.easing).toBe("linear");
    });
  });

  describe("Declarative Motion Recipe Integration", () => {
    it("passes design system tokens across declarative recipe steps", () => {
      const el = makeElement();
      const recipe: DeclarativeMotionRecipe = {
        id: "test-ds-recipe",
        name: "testDsRecipe",
        description: "Recipe configured with design system tokens",
        steps: [{ preset: "fadeIn", target: el }],
      };

      const controls = runRecipe(recipe, {
        designSystem: "minimal",
      });

      controls.finished?.catch(() => {});
      expect(controls).toBeDefined();
      controls.cancel();
    });
  });

  describe("JSON Export, Import, and Validation", () => {
    it("serializes to JSON and imports with validation", () => {
      const original = getDesignSystem("minimal")!;
      const json = exportDesignSystemJson(original, true);
      expect(typeof json).toBe("string");
      expect(json).toContain('"name": "minimal"');

      const imported = importDesignSystemFromJson(json);
      expect(imported.id).toBe("ds-minimal");
      expect(imported.name).toBe("minimal");
      expect(imported.timing?.fast).toBe(150);
      expect(Object.isFrozen(imported)).toBe(true);
    });

    it("exports versioned design systems document", () => {
      const doc = exportDesignSystemsDocument();
      expect(doc.$schema).toBe("https://af-motion.dev/schemas/design-systems-v1.json");
      expect(doc.version).toBe(DESIGN_SYSTEM_SCHEMA_VERSION);
      expect(doc.totalDesignSystems).toBeGreaterThanOrEqual(3);
      expect(Array.isArray(doc.designSystems)).toBe(true);
    });

    it("rejects invalid design system definitions during validation", () => {
      const invalid = validateDesignSystem({
        id: "",
        name: "",
        timing: { fast: -50 },
        intensity: 0,
        palette: "nonexistentPalette",
      });

      expect(invalid.valid).toBe(false);
      expect(invalid.errors.some((e) => e.parameter === "id")).toBe(true);
      expect(invalid.errors.some((e) => e.parameter === "name")).toBe(true);
      expect(invalid.errors.some((e) => e.parameter === "timing.fast")).toBe(true);
      expect(invalid.errors.some((e) => e.parameter === "intensity")).toBe(true);
      expect(invalid.errors.some((e) => e.parameter === "palette")).toBe(true);
    });
  });

  describe("Active Design System and Subscriptions", () => {
    it("manages active design system, synchronizes palette, and notifies subscribers", () => {
      const notifications: string[] = [];
      const unsubscribe = subscribeToDesignSystem((system) => {
        if (system) notifications.push(system.name);
      });

      setActiveDesignSystem("expressive");
      expect(getActiveDesignSystem()?.name).toBe("expressive");
      // Palette synchronization: expressive uses Electric Teal palette
      expect(getActivePalette()?.name).toBe("Electric Teal");

      setActiveDesignSystem("minimal");
      expect(getActiveDesignSystem()?.name).toBe("minimal");
      // Minimal uses Silver Signal palette
      expect(getActivePalette()?.name).toBe("Silver Signal");

      expect(notifications).toEqual(["expressive", "minimal"]);

      unsubscribe();
      setActiveDesignSystem("default");
      // No further notifications after unsubscribe
      expect(notifications.length).toBe(2);
    });
  });
});
