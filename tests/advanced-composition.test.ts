// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  createAdvancedComposition,
  createAdvancedTimeline,
  validateAdvancedComposition,
  registerMotionAdapter,
  getMotionAdapter,
  getAdvancedCompositionPreset,
  listAdvancedCompositionPresets,
  type AdvancedMotionCompositionDefinition,
  type MotionEngineAdapter,
} from "../src/catalogue.js";

describe("Prompt 116 — Unified Advanced Motion Composition", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // 1. COMPOSITION VALIDATION & CYCLE DETECTION
  // ---------------------------------------------------------------------------
  describe("1. Composition Validation & Cycle Detection", () => {
    it("validates valid composition structure and returns no errors", () => {
      const validDef: AdvancedMotionCompositionDefinition = {
        id: "comp-valid",
        name: "Valid Composition",
        participants: [
          {
            id: "step1",
            system: "custom",
            duration: 300,
            run: () => undefined,
          },
          {
            id: "step2",
            system: "custom",
            at: ">",
            duration: 400,
            dependsOn: ["step1"],
            run: () => undefined,
          },
        ],
      };

      const result = validateAdvancedComposition(validDef);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("detects empty id and duplicate participant IDs", () => {
      const invalidDef: AdvancedMotionCompositionDefinition = {
        id: "",
        participants: [
          { id: "duplicate", system: "custom", run: () => undefined },
          { id: "duplicate", system: "custom", run: () => undefined },
        ],
      };

      const result = validateAdvancedComposition(invalidDef);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === "EMPTY_ID")).toBe(true);
      expect(result.errors.some((e) => e.code === "DUPLICATE_ID")).toBe(true);
    });

    it("detects missing dependencies", () => {
      const missingDepDef: AdvancedMotionCompositionDefinition = {
        id: "comp-missing",
        participants: [
          {
            id: "partA",
            system: "custom",
            dependsOn: ["non-existent-part"],
            run: () => undefined,
          },
        ],
      };

      const result = validateAdvancedComposition(missingDepDef);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === "MISSING_DEPENDENCY")).toBe(true);
    });

    it("detects circular dependencies using DFS graph traversal", () => {
      const cycleDef: AdvancedMotionCompositionDefinition = {
        id: "comp-cycle",
        participants: [
          { id: "A", system: "custom", dependsOn: ["B"], run: () => undefined },
          { id: "B", system: "custom", dependsOn: ["C"], run: () => undefined },
          { id: "C", system: "custom", dependsOn: ["A"], run: () => undefined },
        ],
      };

      const result = validateAdvancedComposition(cycleDef);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === "CIRCULAR_DEPENDENCY")).toBe(true);
    });

    it("throws structured error on invalid composition creation", () => {
      expect(() => {
        createAdvancedComposition({
          id: "invalid-comp",
          participants: [
            { id: "X", system: "custom", dependsOn: ["Y"], run: () => undefined },
            { id: "Y", system: "custom", dependsOn: ["X"], run: () => undefined },
          ],
        });
      }).toThrow(/Invalid AdvancedMotionComposition/);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. TIMELINE & SCHEDULING ENGINE
  // ---------------------------------------------------------------------------
  describe("2. Timeline & Scheduling Engine", () => {
    it("computes sequential and parallel track timings correctly", () => {
      const comp = createAdvancedComposition({
        id: "comp-timeline",
        participants: [
          { id: "p1", system: "custom", duration: 200, run: () => undefined },
          { id: "p2", system: "custom", at: ">", duration: 300, run: () => undefined },
          { id: "p3", system: "custom", at: "<", duration: 150, run: () => undefined },
        ],
      });

      const tracks = comp.getTracks();
      expect(tracks).toHaveLength(3);

      expect(tracks[0]?.startTime).toBe(0);
      expect(tracks[0]?.endTime).toBe(200);

      // p2 starts after p1 (">" operator)
      expect(tracks[1]?.startTime).toBe(200);
      expect(tracks[1]?.endTime).toBe(500);

      // p3 starts with p2 ("<" operator)
      expect(tracks[2]?.startTime).toBe(200);
      expect(tracks[2]?.endTime).toBe(350);

      expect(comp.duration).toBe(500);
    });

    it("supports relative offsets and named labels", () => {
      const comp = createAdvancedComposition({
        id: "comp-offsets",
        labels: { midpoint: 300 },
        participants: [
          { id: "p1", system: "custom", duration: 200, run: () => undefined },
          { id: "p2", system: "custom", at: "+=50", duration: 200, run: () => undefined },
          { id: "p3", system: "custom", at: "midpoint", duration: 250, run: () => undefined },
        ],
      });

      const tracks = comp.getTracks();
      expect(tracks[1]?.startTime).toBe(250);
      expect(tracks[2]?.startTime).toBe(300);
      expect(comp.duration).toBe(550);
    });

    it("AdvancedTimeline builder incrementally configures tracks", () => {
      const timeline = createAdvancedTimeline();
      timeline
        .add({ id: "t1", system: "custom", duration: 100, run: () => undefined })
        .add({ id: "t2", system: "custom", at: ">", duration: 200, run: () => undefined })
        .addLabel("halfway", 150);

      const schedule = timeline.getSchedule("custom-built");
      expect(schedule.tracks).toHaveLength(2);
      expect(schedule.totalDuration).toBe(300);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. MULTI-SYSTEM ADAPTERS & INTEGRATION
  // ---------------------------------------------------------------------------
  describe("3. Multi-System Adapters & Integration", () => {
    it("registers and uses custom motion engine adapters", () => {
      const customAdapter: MotionEngineAdapter = {
        system: "custom",
        createInstance: (config) => ({
          id: config.id,
          system: "custom",
          start: vi.fn(),
          pause: vi.fn(),
          resume: vi.fn(),
          reverse: vi.fn(),
          seek: vi.fn(),
          cancel: vi.fn(),
          finish: vi.fn(),
          dispose: vi.fn(),
          getProgress: () => 0.5,
          getState: () => "running",
        }),
      };

      registerMotionAdapter("custom", customAdapter);
      expect(getMotionAdapter("custom")).toBe(customAdapter);

      const comp = createAdvancedComposition({
        id: "custom-adapter-test",
        participants: [
          { id: "cust1", system: "custom", duration: 100, run: () => undefined },
        ],
      });

      expect(comp.getParticipantProgress("cust1")).toBe(0.5);
    });

    it("orchestrates actual DOM participants across animation and typography", () => {
      const heading = document.createElement("h1");
      heading.textContent = "Motion System";
      const box = document.createElement("div");
      document.body.appendChild(heading);
      document.body.appendChild(box);

      const comp = createAdvancedComposition({
        id: "multi-system-run",
        participants: [
          {
            id: "title-kinetic",
            system: "typography",
            target: heading,
            options: { by: "words", preset: "fade-in" },
            duration: 100,
          },
          {
            id: "box-anim",
            system: "animation",
            target: box,
            keyframes: { opacity: [0, 1] },
            at: ">",
            duration: 100,
          },
        ],
      });

      expect(comp.getTracks()).toHaveLength(2);
      expect(comp.duration).toBe(200);

      comp.seek(0.5);
      expect(comp.progress).toBe(0.5);
      expect(comp.getParticipantState("title-kinetic")).toBe("completed");
      expect(comp.getParticipantState("box-anim")).toBe("running");
    });
  });

  // ---------------------------------------------------------------------------
  // 4. UNIFIED CONTROLLER LIFECYCLE & SEEKING
  // ---------------------------------------------------------------------------
  describe("4. Unified Controller Lifecycle & Seeking", () => {
    it("advances through play, pause, resume, seek, and finish", async () => {
      let progressUpdate = 0;

      const comp = createAdvancedComposition({
        id: "lifecycle-comp",
        participants: [
          { id: "p1", system: "custom", duration: 80, run: () => undefined },
          { id: "p2", system: "custom", at: ">", duration: 80, run: () => undefined },
        ],
        onUpdate: (p) => {
          progressUpdate = p;
        },
      });

      expect(comp.getState()).toBe("idle");
      const playPromise = comp.play();
      expect(comp.getState()).toBe("running");
      expect(comp.isPlaying).toBe(true);

      comp.pause();
      expect(comp.getState()).toBe("paused");
      expect(comp.isPlaying).toBe(false);

      comp.resume();
      expect(comp.getState()).toBe("running");

      comp.seek(0.5);
      expect(comp.progress).toBe(0.5);

      comp.finish();
      await playPromise;

      expect(comp.getState()).toBe("completed");
      expect(comp.progress).toBe(1);
    });

    it("seeks by label marker correctly", () => {
      const comp = createAdvancedComposition({
        id: "label-seek-comp",
        labels: { introDone: 200 },
        participants: [
          { id: "p1", system: "custom", duration: 400, run: () => undefined },
        ],
      });

      comp.seek("introDone");
      expect(comp.progress).toBe(0.5);
    });

    it("cancels and resets all active tracks", () => {
      const comp = createAdvancedComposition({
        id: "cancel-comp",
        participants: [
          { id: "p1", system: "custom", duration: 200, run: () => undefined },
        ],
      });

      comp.seek(0.5);
      comp.cancel();

      expect(comp.getState()).toBe("cancelled");
      expect(comp.getParticipantState("p1")).toBe("cancelled");
    });

    it("disposes resources cleanly and handles idempotent calls", () => {
      const comp = createAdvancedComposition({
        id: "dispose-comp",
        participants: [
          { id: "p1", system: "custom", duration: 200, run: () => undefined },
        ],
      });

      comp.dispose();
      expect(comp.getState()).toBe("disposed");
      expect(comp.getTracks()).toHaveLength(0);

      // Repeated calls must be safe and idempotent
      expect(() => comp.dispose()).not.toThrow();
      expect(() => comp.cancel()).not.toThrow();
      expect(() => comp.pause()).not.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // 5. RECIPES & PRESETS
  // ---------------------------------------------------------------------------
  describe("5. Presets & Composition Recipes", () => {
    it("lists all 8 built-in advanced composition presets", () => {
      const presets = listAdvancedCompositionPresets();
      expect(presets).toHaveLength(8);
      expect(presets).toContain("svg-morph-and-path");
      expect(presets).toContain("typography-and-path");
      expect(presets).toContain("shared-element-and-layout");
      expect(presets).toContain("typography-and-shared-element");
      expect(presets).toContain("multi-element-coordinated-reveal");
      expect(presets).toContain("morphing-scene-transition");
      expect(presets).toContain("cinematic-page-transition");
      expect(presets).toContain("physics-path-choreography");
    });

    it("instantiates composition definition from preset with overrides", () => {
      const def = getAdvancedCompositionPreset("svg-morph-and-path", {
        id: "custom-morph-path",
        duration: 1000,
      });

      expect(def.id).toBe("custom-morph-path");
      expect(def.duration).toBe(1000);
      expect(def.participants.length).toBeGreaterThanOrEqual(2);
      expect(def.participants[0]?.system).toBe("motion-path");
      expect(def.participants[1]?.system).toBe("svg-morph");
    });

    it("throws when requesting an unknown preset name", () => {
      expect(() => {
        getAdvancedCompositionPreset("non-existent-preset" as any);
      }).toThrow(/Unknown advanced composition preset/);
    });
  });

  // ---------------------------------------------------------------------------
  // 6. ACCESSIBILITY & REDUCED MOTION
  // ---------------------------------------------------------------------------
  describe("6. Accessibility & Reduced Motion", () => {
    it("settles instantly across all participants when prefers-reduced-motion is active", async () => {
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query.includes("prefers-reduced-motion: reduce"),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const comp = createAdvancedComposition({
        id: "reduced-comp",
        respectReducedMotion: true,
        participants: [
          { id: "p1", system: "custom", duration: 500, run: () => undefined },
        ],
      });

      await comp.play();
      expect(comp.getState()).toBe("completed");
      expect(comp.progress).toBe(1);
    });
  });
});
