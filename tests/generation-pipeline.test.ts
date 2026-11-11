// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import {
  aiMotionRegistry,
  PIPELINE_VERSION,
  generateMotion,
  generateMotionSync,
  resetCapabilityRegistry,
  type GenerationRequest,
  type GenerationResult,
  type GenerationStage,
} from "../src/catalogue.js";
import {
  useGenerateMotion,
} from "../src/react.js";

let host: HTMLDivElement;
let root: Root;

beforeEach(() => {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  host.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  resetCapabilityRegistry();
});

function testHook<T>(callback: () => T) {
  let value!: T;
  function TestComponent() {
    value = callback();
    return null;
  }
  act(() => {
    root.render(createElement(TestComponent));
  });
  return {
    get current() {
      return value;
    },
    rerender() {
      act(() => {
        root.render(createElement(TestComponent));
      });
    },
  };
}

describe("Prompt 63 — AI Generation Pipeline & React Integration", () => {
  describe("Pipeline Contracts & Version", () => {
    it("exports pipeline version and core generation functions", () => {
      expect(PIPELINE_VERSION).toBe("1.0.0");
      expect(typeof generateMotion).toBe("function");
      expect(typeof generateMotionSync).toBe("function");
    });
  });

  describe("End-to-End Pipeline Execution (Sync & Async)", () => {
    it("executes full generation pipeline from natural language prompt", async () => {
      const request: GenerationRequest = {
        prompt: "Create a modern dark SaaS landing page for an AI developer platform with smooth entrance animations and cosmic background",
        motionDNA: "precise-tech",
        paletteId: "cyberpunk-neon",
      };

      const result = await generateMotion(request);

      expect(result.success).toBe(true);
      expect(result.cancelled).toBe(false);
      expect(result.stage).toBe("complete");

      // Verify Design Interpretation
      expect(result.designInterpretation).toBeDefined();
      expect(result.designInterpretation?.confidence).toBeGreaterThan(0.3);
      expect(result.context.designContext?.category).toBeDefined();

      // Verify Motion Interpretation
      expect(result.motionInterpretation).toBeDefined();
      expect(result.motionInterpretation?.specification).toBeDefined();

      // Verify Composition
      expect(result.composition).toBeDefined();
      expect(result.composition?.motionDNA).toBe("precise-tech");
      expect(result.composition?.paletteId).toBe("cyberpunk-neon");
      expect(Object.keys(result.composition!.nodes).length).toBeGreaterThan(1);

      // Verify Validation & Correction
      expect(result.validation).toBeDefined();
      expect(result.correction).toBeDefined();

      // Verify React Output
      expect(result.reactOutput).toBeDefined();
      expect(result.reactOutput?.componentCode).toContain("useComposition");
      expect(result.reactOutput?.requiredImports.length).toBeGreaterThan(0);
      expect(result.reactOutput?.componentHierarchy.length).toBeGreaterThan(1);
      expect(result.reactOutput?.integrationInstructions.length).toBeGreaterThan(0);

      // Verify Diagnostics
      expect(result.diagnostics.completedStages).toContain("interpreting_design");
      expect(result.diagnostics.completedStages).toContain("interpreting_motion");
      expect(result.diagnostics.completedStages).toContain("building_composition");
      expect(result.diagnostics.completedStages).toContain("validating");
      expect(result.diagnostics.completedStages).toContain("correcting");
      expect(result.diagnostics.completedStages).toContain("generating_react");
      expect(result.diagnostics.durationMs).toBeGreaterThanOrEqual(0);
    });

    it("executes generateMotionSync synchronously with identical deterministic output", () => {
      const request: GenerationRequest = {
        prompt: "Clean minimal portfolio showcase with card grid and subtle hover",
      };

      const res1 = generateMotionSync(request);
      const res2 = generateMotionSync(request);

      expect(res1.success).toBe(true);
      expect(res2.success).toBe(true);
      expect(res1.composition?.type).toBe(res2.composition?.type);
      expect(Object.keys(res1.composition?.nodes ?? {})).toEqual(
        Object.keys(res2.composition?.nodes ?? {}),
      );
      expect(res1.context.resolvedCapabilityIds).toEqual(res2.context.resolvedCapabilityIds);
    });

    it("infers card-grid scene type for ecommerce and portfolio prompts", () => {
      const result = generateMotionSync({
        prompt: "Product pricing cards grid with staggered entrance",
      });

      expect(result.success).toBe(true);
      expect(result.sceneType).toBe("card-grid");
      expect(result.composition?.metadata?.sceneType).toBe("card-grid");
    });

    it("infers background capability from prompt keywords (cosmic / fluid / grid)", () => {
      const cosmicRes = generateMotionSync({
        prompt: "Deep cosmic starfield hero section",
      });
      expect(cosmicRes.context.resolvedCapabilityIds).toContain("bg-cosmic");

      const fluidRes = generateMotionSync({
        prompt: "Liquid fluid wave background for wellness app",
      });
      expect(fluidRes.context.resolvedCapabilityIds).toContain("bg-fluid");
    });
  });

  describe("Stage Control & Progress Reporting", () => {
    it("reports stage-level progress in strictly increasing order", async () => {
      const stagesReceived: GenerationStage[] = [];
      const progressesReceived: number[] = [];

      await generateMotion(
        { prompt: "Interactive feature showcase" },
        {
          onProgress: (stage, progress) => {
            stagesReceived.push(stage);
            progressesReceived.push(progress);
          },
        },
      );

      expect(stagesReceived).toContain("interpreting_design");
      expect(stagesReceived).toContain("interpreting_motion");
      expect(stagesReceived).toContain("building_composition");
      expect(stagesReceived).toContain("complete");

      // Verify progresses are monotonically increasing
      for (let i = 1; i < progressesReceived.length; i++) {
        expect(progressesReceived[i]).toBeGreaterThanOrEqual(progressesReceived[i - 1]);
      }
    });
  });

  describe("Cancellation & Error Handling", () => {
    it("handles pre-aborted cancellation signal cleanly", async () => {
      const controller = new AbortController();
      controller.abort();

      const result = await generateMotion(
        { prompt: "Cancelled generation test" },
        { signal: controller.signal },
      );

      expect(result.success).toBe(false);
      expect(result.cancelled).toBe(true);
      expect(result.stage).toBe("cancelled");
    });

    it("rejects invalid requests with structured error and diagnostics", async () => {
      const result = await generateMotion(null as unknown as GenerationRequest);

      expect(result.success).toBe(false);
      expect(result.stage).toBe("failed");
      expect(result.error?.code).toBe("INVALID_REQUEST");
      expect(result.diagnostics.issuesCount).toBeGreaterThan(0);
    });
  });

  describe("React Integration (useGenerateMotion)", () => {
    it("manages generation lifecycle reactively with loading and completion states", async () => {
      const hook = testHook(() => useGenerateMotion());

      expect(hook.current.isGenerating).toBe(false);
      expect(hook.current.result).toBeNull();
      expect(hook.current.stage).toBe("idle");

      let res!: GenerationResult;
      await act(async () => {
        res = await hook.current.generate({
          prompt: "Interactive hero button with magnetic hover effect",
        });
      });

      expect(hook.current.isGenerating).toBe(false);
      expect(hook.current.result).toBe(res);
      expect(hook.current.stage).toBe("complete");
      expect(hook.current.progress).toBe(1.0);
    });

    it("supports manual cancellation via cancel()", async () => {
      const hook = testHook(() => useGenerateMotion());

      let genPromise!: Promise<GenerationResult>;
      act(() => {
        genPromise = hook.current.generate({
          prompt: "Long running generation that will be aborted",
        });
        hook.current.cancel();
      });

      await act(async () => {
        await genPromise;
      });

      expect(hook.current.isGenerating).toBe(false);
      expect(hook.current.stage).toBe("cancelled");
    });

    it("supports reset() to return hook to initial idle state", async () => {
      const hook = testHook(() => useGenerateMotion());

      await act(async () => {
        await hook.current.generate({ prompt: "Quick test" });
      });

      expect(hook.current.result).not.toBeNull();

      act(() => {
        hook.current.reset();
      });

      expect(hook.current.result).toBeNull();
      expect(hook.current.stage).toBe("idle");
      expect(hook.current.error).toBeNull();
    });

    it("autoRun triggers generation on mount", async () => {
      const hook = testHook(() =>
        useGenerateMotion(
          { prompt: "Auto-run dashboard header" },
          { autoRun: true },
        ),
      );

      // Wait a tick for the effect to fire
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      hook.rerender();
      expect(hook.current.result).not.toBeNull();
      expect(hook.current.result?.success).toBe(true);
    });

    it("renders cleanly in SSR without errors", () => {
      function SSRTestComponent() {
        const gen = useGenerateMotion();
        return createElement("div", { "data-testid": "gen" }, gen.stage);
      }

      const html = renderToString(createElement(SSRTestComponent));
      expect(html).toContain('data-testid="gen"');
      expect(html).toContain("idle");
    });
  });
});
