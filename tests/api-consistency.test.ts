// @vitest-environment jsdom

import { describe, expect, expectTypeOf, it } from "vitest";
import {
  composeEffects,
  createMotionChoreography,
  createMotionRecipe,
  stagger,
} from "../src/index";
import type {
  EffectCompositionControls,
  MotionChoreographyControls,
  MotionRecipeControls,
  StaggerControls,
} from "../src/index";
import { useParallel, useSequence, useTimeline } from "../src/react";
import type {
  UseParallelResult,
  UseSequenceResult,
  UseTimelineResult,
} from "../src/react";

describe("lifecycle method consistency across composition and effects", () => {
  it("ensures MotionChoreographyControls, MotionRecipeControls, and EffectCompositionControls all provide destroy() and cancel()", () => {
    expectTypeOf<MotionChoreographyControls["destroy"]>().toBeFunction();
    expectTypeOf<MotionChoreographyControls["cancel"]>().toBeFunction();
    expectTypeOf<MotionRecipeControls["destroy"]>().toBeFunction();
    expectTypeOf<MotionRecipeControls["cancel"]>().toBeFunction();
    expectTypeOf<EffectCompositionControls["destroy"]>().toBeFunction();
    expectTypeOf<EffectCompositionControls["cancel"]>().toBeFunction();
  });

  it("MotionChoreography destroy() cancels active choreography identically to cancel()", async () => {
    const choreography = createMotionChoreography([
      {
        type: "animation",
        target: document.createElement("div"),
        properties: { opacity: [0, 1] },
        options: { duration: 1000 },
      },
    ]);

    expect(typeof choreography.destroy).toBe("function");
    expect(typeof choreography.cancel).toBe("function");

    choreography.destroy();
    await expect(choreography.finished).rejects.toThrow("Motion choreography was cancelled");
  });

  it("StaggerControls provides destroy() matching DrawSVGControls and MorphSVGControls", () => {
    expectTypeOf<StaggerControls["destroy"]>().toBeFunction();
    expectTypeOf<StaggerControls["cancel"]>().toBeFunction();

    const element = document.createElement("div");
    const controls = stagger(element, { duration: 1000 });
    expect(typeof controls.destroy).toBe("function");
    expect(typeof controls.cancel).toBe("function");

    expect(() => controls.destroy()).not.toThrow();
  });

  it("StaggerControls destroy() handles empty matching targets safely", () => {
    const controls = stagger(".non-existent-selector-12345", { duration: 1000 });
    expect(typeof controls.destroy).toBe("function");
    expect(() => controls.destroy()).not.toThrow();
  });
});

describe("React animation hook result consistency", () => {
  it("provides uniform controlsRef and named instance accessors across useSequence, useParallel, and useTimeline", () => {
    expectTypeOf<UseSequenceResult["controlsRef"]>().not.toBeUndefined();
    expectTypeOf<UseSequenceResult["sequence"]>().not.toBeUndefined();

    expectTypeOf<UseParallelResult["controlsRef"]>().not.toBeUndefined();
    expectTypeOf<UseParallelResult["parallel"]>().not.toBeUndefined();

    expectTypeOf<UseTimelineResult["controlsRef"]>().not.toBeUndefined();
    expectTypeOf<UseTimelineResult["timeline"]>().not.toBeUndefined();
  });
});
