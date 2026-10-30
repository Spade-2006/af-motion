import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createMotionRecipe,
  registerMotionDNA,
  removeMotionDNA,
  runMotionRecipe,
} from "../src/index";

class FakeHTMLElement {
  style = {
    setProperty: vi.fn(),
  };
}

beforeEach(() => {
  vi.stubGlobal("HTMLElement", FakeHTMLElement);
  vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1));
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  vi.stubGlobal("matchMedia", () => ({ matches: false }));
  vi.stubGlobal("document", {
    querySelectorAll: (selector: string) => {
      if (selector === "[invalid") throw new SyntaxError("invalid selector");
      return [];
    },
  });
});

afterEach(() => {
  removeMotionDNA("recipeMotion");
  vi.unstubAllGlobals();
});

describe("motion recipes", () => {
  it("builds configurable effect compositions with declared Motion DNA", () => {
    registerMotionDNA("recipeMotion", { duration: 240, easing: "linear" });
    const input = { distance: 18 };
    const optionsSeen: unknown[] = [];
    const recipe = createMotionRecipe({
      motionDNA: ["recipeMotion"],
      effects: (parameters, context) => {
        expect(Object.isFrozen(parameters)).toBe(true);
        return [{
          motionDNA: {
            name: "recipeMotion",
            overrides: { duration: parameters.distance * 10 },
          },
          start: (options) => {
            optionsSeen.push(options);
            return { destroy: () => undefined };
          },
        }];
      },
    });

    const run = runMotionRecipe(recipe, input);
    expect(optionsSeen).toEqual([{ duration: 180, easing: "linear" }]);
    expect(input).toEqual({ distance: 18 });
    run.destroy();
  });

  it("combines effects and choreography under unified lifecycle controls", async () => {
    const cleanup = vi.fn();
    const recipe = createMotionRecipe({
      effects: () => [{ start: () => ({ destroy: cleanup }) }],
      choreography: () => [{
        type: "animation",
        target: new FakeHTMLElement() as unknown as HTMLElement,
        properties: { opacity: [0, 1] },
      }],
    });
    const run = runMotionRecipe(recipe, {});

    expect(run.finished).toBeInstanceOf(Promise);
    run.cancel();
    await expect(run.finished).rejects.toMatchObject({ name: "AbortError" });
    expect(cleanup).toHaveBeenCalledTimes(1);
    run.destroy();
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it("cleans up effects when choreography startup fails", async () => {
    const cleanup = vi.fn();
    registerMotionDNA("recipeMotion", { duration: 100 });
    const recipe = createMotionRecipe({
      motionDNA: ["recipeMotion"],
      effects: () => [{ start: () => ({ destroy: cleanup }) }],
      choreography: () => [{
        type: "animation",
        target: "[invalid",
        properties: { opacity: [0, 1] },
        motionDNA: { name: "recipeMotion" },
      }],
    });
    const run = runMotionRecipe(recipe, {});

    await expect(run.finished).rejects.toThrow(/Invalid CSS selector/);
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it("requires at least one capability and declared DNA references", () => {
    expect(() => createMotionRecipe({})).toThrow(/effects or choreography/);
    const recipe = createMotionRecipe({
      effects: (_parameters, context) => {
        context.motionDNA("undeclared");
        return [];
      },
    });
    expect(() => runMotionRecipe(recipe, {})).toThrow(/not declared/);
  });

  it("shares pause and resume with effects that support them", () => {
    const pause = vi.fn();
    const resume = vi.fn();
    const recipe = createMotionRecipe({
      effects: () => [{
        start: () => ({ pause, resume, destroy: () => undefined }),
      }],
    });
    const run = runMotionRecipe(recipe, {});

    run.pause();
    run.resume();

    expect(pause).toHaveBeenCalledTimes(1);
    expect(resume).toHaveBeenCalledTimes(1);
    run.destroy();
  });
});
