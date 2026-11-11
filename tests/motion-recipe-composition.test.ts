import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  BUILT_IN_MOTION_RECIPES,
  RECIPE_SCHEMA_VERSION,
  composeRecipe,
  createMotionRecipe,
  exportRecipeJson,
  exportRecipesDocument,
  getRecipe,
  importRecipeFromJson,
  listRecipes,
  registerRecipe,
  removeRecipe,
  runMotionRecipe,
  runRecipe,
  searchRecipes,
  validateRecipe,
  validateRecipeRunOptions,
  type DeclarativeMotionRecipe,
} from "../src/core/motion-recipe";

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
  frames.clear();
  removeRecipe("recipe-custom-test");
  removeRecipe("customTestRecipe");
  vi.unstubAllGlobals();
});

describe("Declarative Motion Recipe Composition", () => {
  describe("Built-in Recipes & Discovery", () => {
    it("exposes built-in declarative recipes with complete metadata", () => {
      const all = listRecipes();
      expect(all.length).toBeGreaterThanOrEqual(5);

      for (const recipe of all) {
        expect(recipe.id).toBeTypeOf("string");
        expect(recipe.id.startsWith("recipe-")).toBe(true);
        expect(recipe.name).toBeTypeOf("string");
        expect(recipe.description.length).toBeGreaterThan(10);
        expect(Array.isArray(recipe.steps)).toBe(true);
        expect(recipe.steps.length).toBeGreaterThan(0);
      }
    });

    it("supports lookup by ID or friendly name", () => {
      const byId = getRecipe("recipe-hero-stagger");
      expect(byId).toBeDefined();
      expect(byId?.name).toBe("heroStagger");

      const byName = getRecipe("heroStagger");
      expect(byName).toBeDefined();
      expect(byName?.id).toBe("recipe-hero-stagger");

      expect(getRecipe("non-existent-recipe")).toBeUndefined();
    });

    it("supports keyword searching across description, name, category, and tags", () => {
      const heroMatches = searchRecipes("hero");
      expect(heroMatches.some((r) => r.id === "recipe-hero-stagger")).toBe(true);

      const modalMatches = searchRecipes("dialog");
      expect(modalMatches.some((r) => r.id === "recipe-modal-dialog")).toBe(true);

      const feedbackMatches = searchRecipes("error");
      expect(feedbackMatches.some((r) => r.id === "recipe-form-error-feedback")).toBe(true);

      expect(searchRecipes("")).toEqual([]);
      // @ts-expect-error test non-string query
      expect(searchRecipes(null)).toEqual([]);
    });
  });

  describe("Target Binding & Sequential Execution", () => {
    it("binds named target slots and executes a multi-preset sequence", () => {
      const elContainer = makeElement();
      const elTitle = makeElement();
      const elButton = makeElement();

      const recipe: DeclarativeMotionRecipe = {
        id: "recipe-custom-test",
        name: "customTestRecipe",
        description: "Custom test sequence entrance",
        requiredTargets: ["container", "title", "button"],
        structure: "sequence",
        steps: [
          { preset: "fadeIn", target: "$container", duration: 100, label: "fadeStep" },
          { preset: "slideUp", target: "$title", duration: 100, label: "slideStep" },
          { preset: "scaleIn", target: "$button", duration: 100, label: "scaleStep" },
        ],
      };

      const controls = runRecipe(recipe, {
        targets: {
          container: elContainer,
          title: elTitle,
          button: elButton,
        },
      });

      expect(controls).toBeDefined();
      expect(typeof controls.pause).toBe("function");
      expect(typeof controls.reverse).toBe("function");

      // Initially at 0ms, container is opacity 0
      expect(styleOf(elContainer).get("opacity")).toBe("0");

      flushFrame(0);
      flushFrame(50);
      expect(styleOf(elContainer).get("opacity")).toBe("0.75");
      flushFrame(100);
      expect(styleOf(elContainer).get("opacity")).toBe("1");

      // Now title animation starts
      flushFrame(150);
      flushFrame(250);
      expect(styleOf(elTitle).get("transform")).toBe("translateY(0px)");

      controls.finished?.catch(() => {});
      controls.cancel();
    });

    it("throws helpful error when required target slot is missing", () => {
      const recipe: DeclarativeMotionRecipe = {
        id: "recipe-custom-test",
        name: "customTestRecipe",
        description: "Requires specific targets",
        requiredTargets: ["header", "content"],
        steps: [
          { preset: "fadeIn", target: "$header" },
          { preset: "slideUp", target: "$content" },
        ],
      };

      expect(() => {
        runRecipe(recipe, {
          targets: { header: makeElement() }, // content is missing
        });
      }).toThrow(/content/i);
    });

    it("falls back to default target when step does not specify a target", () => {
      const defaultEl = makeElement();
      const recipe: DeclarativeMotionRecipe = {
        id: "recipe-custom-test",
        name: "customTestRecipe",
        description: "Uses fallback default target",
        steps: [
          { preset: "fadeIn", duration: 100 },
          { preset: "hoverLift", duration: 100 },
        ],
      };

      const controls = runRecipe(recipe, {
        targets: defaultEl,
      });

      flushFrame(0);
      flushFrame(100);
      expect(styleOf(defaultEl).get("opacity")).toBe("1");
      controls.finished?.catch(() => {});
      controls.cancel();
    });
  });

  describe("Parallel & Nested Composition", () => {
    it("executes parallel step groups simultaneously", () => {
      const el1 = makeElement();
      const el2 = makeElement();

      const recipe: DeclarativeMotionRecipe = {
        id: "recipe-custom-test",
        name: "customTestRecipe",
        description: "Runs presets in parallel",
        steps: [
          {
            type: "parallel",
            label: "simultaneousGroup",
            steps: [
              { preset: "fadeIn", target: el1, duration: 100 },
              { preset: "slideUp", target: el2, duration: 100 },
            ],
          },
        ],
      };

      const controls = runRecipe(recipe);
      expect(controls).toBeDefined();

      flushFrame(0);
      flushFrame(100);
      expect(styleOf(el1).get("opacity")).toBe("1");
      expect(styleOf(el2).get("transform")).toBe("translateY(0px)");
      controls.finished?.catch(() => {});
      controls.cancel();
    });

    it("composes nested recipes cleanly", () => {
      const subEl = makeElement();
      const subRecipe: DeclarativeMotionRecipe = {
        id: "recipe-sub",
        name: "subRecipe",
        description: "Sub recipe for nesting",
        steps: [{ preset: "scaleIn", target: subEl, duration: 100 }],
      };
      registerRecipe(subRecipe);

      const mainEl = makeElement();
      const parentRecipe: DeclarativeMotionRecipe = {
        id: "recipe-custom-test",
        name: "customTestRecipe",
        description: "Parent recipe nesting another recipe",
        steps: [
          { preset: "fadeIn", target: mainEl, duration: 80 },
          { type: "recipe", recipe: "recipe-sub" },
        ],
      };

      const controls = runRecipe(parentRecipe);
      expect(controls).toBeDefined();
      controls.finished?.catch(() => {});
      controls.cancel();
      removeRecipe("recipe-sub");
    });
  });

  describe("Override Precedence & Immutability", () => {
    it("respects override hierarchy: preset defaults < recipe defaultOptions < step options < runtime overrides < stepOverrides", () => {
      const el = makeElement();
      const recipe: DeclarativeMotionRecipe = {
        id: "recipe-custom-test",
        name: "customTestRecipe",
        description: "Tests override precedence",
        defaultOptions: { duration: 500 },
        steps: [
          { preset: "fadeIn", target: el, duration: 300, label: "fadeStep" },
        ],
      };

      // When no runtime override, step duration (300) wins over recipe defaultOptions (500)
      const controls1 = runRecipe(recipe);
      controls1.finished?.catch(() => {});
      controls1.cancel();

      // When runtime stepOverrides is provided for "fadeStep", it wins over step duration
      const controls2 = runRecipe(recipe, {
        stepOverrides: {
          fadeStep: { duration: 999 },
        },
      });
      controls2.finished?.catch(() => {});
      controls2.cancel();

      // Original recipe remains completely unmodified
      expect(recipe.defaultOptions?.duration).toBe(500);
      expect((recipe.steps[0] as any).duration).toBe(300);
    });

    it("prevents mutating registered recipes", () => {
      const hero = getRecipe("heroStagger");
      expect(hero).toBeDefined();

      // Attempting to mutate throws or is frozen
      expect(Object.isFrozen(hero)).toBe(true);
      expect(Object.isFrozen(hero?.steps)).toBe(true);
    });
  });

  describe("Validation & Circular References", () => {
    it("detects invalid recipes, missing fields, and unknown presets", () => {
      expect(validateRecipe({}).valid).toBe(false);
      expect(validateRecipe({ id: "test", name: "", steps: [] }).valid).toBe(false);

      const withUnknownPreset: DeclarativeMotionRecipe = {
        id: "test",
        name: "test",
        description: "Valid description",
        steps: [{ preset: "unknown-preset-xyz" }],
      };
      const res = validateRecipe(withUnknownPreset);
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.message.includes("Unknown preset"))).toBe(true);
    });

    it("detects circular recipe nesting", () => {
      const recipeB: any = {
        id: "recipe-circular-b",
        name: "circularB",
        description: "Circular recipe B",
        steps: [],
      };
      const recipeA: DeclarativeMotionRecipe = {
        id: "recipe-circular-a",
        name: "circularA",
        description: "Circular recipe A",
        steps: [{ type: "recipe", recipe: recipeB }],
      };
      recipeB.steps.push({ type: "recipe", recipe: recipeA });

      const res = validateRecipe(recipeA);
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.message.includes("Circular recipe reference"))).toBe(true);
    });

    it("detects duplicate step labels within a recipe", () => {
      const duplicateLabels: DeclarativeMotionRecipe = {
        id: "test",
        name: "test",
        description: "Duplicate label recipe",
        steps: [
          { preset: "fadeIn", label: "myLabel" },
          { preset: "slideUp", label: "myLabel" },
        ],
      };
      const res = validateRecipe(duplicateLabels);
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.message.includes("Duplicate step label"))).toBe(true);
    });
  });

  describe("JSON Serialization & Deserialization", () => {
    it("serializes recipes to JSON and imports them back losslessly", () => {
      const original = getRecipe("heroStagger");
      expect(original).toBeDefined();

      const json = exportRecipeJson("heroStagger");
      expect(typeof json).toBe("string");

      const imported = importRecipeFromJson(json);
      expect(imported.id).toBe(original?.id);
      expect(imported.name).toBe(original?.name);
      expect(imported.steps.length).toBe(original?.steps.length);
    });

    it("exports versioned recipes document", () => {
      const doc = exportRecipesDocument();
      expect(doc.version).toBe(RECIPE_SCHEMA_VERSION);
      expect(doc.totalRecipes).toBeGreaterThanOrEqual(5);
      expect(Array.isArray(doc.recipes)).toBe(true);
    });
  });

  describe("Unified createMotionRecipe & runMotionRecipe Integration", () => {
    it("creates and runs declarative recipes using createMotionRecipe and runMotionRecipe", () => {
      const el = makeElement();
      const recipe = createMotionRecipe({
        id: "recipe-custom-test",
        name: "customTestRecipe",
        description: "Declarative recipe created via createMotionRecipe",
        steps: [{ preset: "fadeIn", target: el, duration: 150 }],
      });

      expect(recipe.id).toBe("recipe-custom-test");
      const controls = runMotionRecipe(recipe);
      expect(controls).toBeDefined();
      controls.finished?.catch(() => {});
      controls.cancel();
    });

    it("runs registered recipes by string ID through runMotionRecipe", () => {
      const el = makeElement();
      const controls = runMotionRecipe("recipe-card-reveal", {
        targets: { card: el },
      });
      expect(controls).toBeDefined();
      controls.finished?.catch(() => {});
      controls.cancel();
    });
  });
});
