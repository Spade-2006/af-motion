import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createElement, StrictMode } from "react";
import { renderToString } from "react-dom/server";

import {
  CHOREOGRAPHY_INTELLIGENCE_VERSION,
  CHOREOGRAPHY_PATTERNS,
  CHOREOGRAPHY_SYSTEMS,
  CHOREOGRAPHY_INTELLIGENCE_CAPABILITY,
  classifyChoreographyIntent,
  generateChoreographyPlan,
  createCrossSystemSyncBridge,
  CrossSystemSyncBridge,
  getChoreographyIntelligenceCapability,
  listSupportedChoreographyPatterns,
  listSupportedChoreographySystems,
  registerChoreographyIntelligenceCapability,
  type ChoreographyPattern,
  type ChoreographyParticipant,
} from "../src/catalogue.js";

import {
  useChoreography,
  useSynchronizedMotion,
  useChoreographyProgress,
  Choreography,
  ChoreographyGroup,
} from "../src/react.js";

describe("Prompt 86 — Automatic Choreography & 2D/3D Motion Synchronization", () => {
  describe("1. Choreography Intent Classification", () => {
    it("recognizes cross-system choreography patterns and participating systems", () => {
      const testCases: Array<{
        text: string;
        expectedPattern: ChoreographyPattern;
        expectedSystems: string[];
      }> = [
        {
          text: "multi element entrance cascade with staggered text",
          expectedPattern: "multi-element-entrance",
          expectedSystems: ["dom"],
        },
        {
          text: "dismiss all cards in multi element exit sequence",
          expectedPattern: "multi-element-exit",
          expectedSystems: ["dom"],
        },
        {
          text: "dom 3d sync camera pan with narrative text reveal",
          expectedPattern: "dom-3d-sync",
          expectedSystems: ["dom", "3d"],
        },
        {
          text: "dom graphics sync shader canvas with interactive ui",
          expectedPattern: "dom-graphics-sync",
          expectedSystems: ["dom", "graphics"],
        },
        {
          text: "full cross system orchestration with dom, graphics, and 3d scene",
          expectedPattern: "full-cross-system",
          expectedSystems: ["dom", "graphics", "3d"],
        },
        {
          text: "scroll choreography scrubbing narrative timeline",
          expectedPattern: "scroll-choreography",
          expectedSystems: ["dom"],
        },
        {
          text: "interactive storytelling sequence with multiple chapters",
          expectedPattern: "storytelling-sequence",
          expectedSystems: ["dom"],
        },
        {
          text: "loading to completion progress sequence",
          expectedPattern: "loading-completion",
          expectedSystems: ["dom"],
        },
      ];

      for (const tc of testCases) {
        const result = classifyChoreographyIntent(tc.text);
        expect(result.pattern).toBe(tc.expectedPattern);
        for (const sys of tc.expectedSystems) {
          expect(result.detectedSystems).toContain(sys);
        }
        expect(result.confidence).toBeGreaterThan(0.5);
        expect(result.matchedKeywords.length).toBeGreaterThan(0);
      }
    });

    it("falls back gracefully when input text has no matching keywords", () => {
      const fallback = classifyChoreographyIntent("random string without motion keywords");
      expect(fallback.pattern).toBe("multi-element-entrance");
      expect(fallback.detectedSystems).toContain("dom");
      expect(fallback.confidence).toBe(0.4);
      expect(fallback.matchedKeywords).toEqual([]);
    });
  });

  describe("2. Choreography Plan Generation", () => {
    it("generates deterministic plans for all 13 supported choreography patterns", () => {
      expect(CHOREOGRAPHY_PATTERNS).toHaveLength(13);

      for (const pattern of CHOREOGRAPHY_PATTERNS) {
        const result = generateChoreographyPlan({ pattern });
        expect(result.plan).toBeDefined();
        expect(result.plan.pattern).toBe(pattern);
        expect(result.plan.duration).toBeGreaterThan(0);
        expect(result.plan.participants.length).toBeGreaterThan(0);
        expect(result.plan.compatibilityScore).toBeGreaterThanOrEqual(80);
        expect(result.alternatives.length).toBeGreaterThan(0);
      }
    });

    it("assigns appropriate multi-system participants for cross-system patterns", () => {
      const fullSync = generateChoreographyPlan({ pattern: "full-cross-system" });
      const systems = fullSync.plan.participants.map((p) => p.system);
      expect(systems).toContain("3d");
      expect(systems).toContain("graphics");
      expect(systems).toContain("dom");
      expect(fullSync.plan.dependencies.length).toBeGreaterThan(0);

      const dom3d = generateChoreographyPlan({ pattern: "dom-3d-sync" });
      const dom3dSystems = dom3d.plan.participants.map((p) => p.system);
      expect(dom3dSystems).toContain("3d");
      expect(dom3dSystems).toContain("dom");
    });

    it("modulates duration and easing according to visual style and Motion DNA", () => {
      const editorial = generateChoreographyPlan({
        pattern: "staggered",
        visualStyle: "editorial",
        motionDNA: "editorial-flow",
      });
      expect(editorial.plan.easing).toBe("cubic-bezier(0.25, 1, 0.5, 1)");

      const brutalist = generateChoreographyPlan({
        pattern: "staggered",
        visualStyle: "brutalist",
      });
      expect(brutalist.plan.easing).toBe("steps(4, jump-end)");
      expect(brutalist.plan.duration).toBe(800);

      const snappy = generateChoreographyPlan({
        pattern: "staggered",
        motionDNA: "snappy",
      });
      expect(snappy.plan.duration).toBeLessThan(1200);
    });

    it("adapts plan properties and duration under reduced-motion preferences", () => {
      const normal = generateChoreographyPlan({
        pattern: "dom-3d-sync",
        reducedMotion: false,
      });
      const domParticipant = normal.plan.participants.find((p) => p.system === "dom");
      expect(domParticipant?.properties?.transform).toBeDefined();

      const reduced = generateChoreographyPlan({
        pattern: "dom-3d-sync",
        reducedMotion: true,
      });
      const reducedDom = reduced.plan.participants.find((p) => p.system === "dom");
      expect(reducedDom?.properties?.transform).toBeUndefined();
      expect(reducedDom?.properties?.opacity).toBeDefined();
      expect(reduced.plan.duration).toBeLessThanOrEqual(400);
      expect(reduced.warnings.some((w) => w.toLowerCase().includes("reduced motion"))).toBe(true);
    });
  });

  describe("3. Cross-System Synchronization Bridge", () => {
    it("distributes normalized progress and computes correct local progress ranges", () => {
      const onUpdateP1 = vi.fn();
      const onUpdateP2 = vi.fn();

      const bridge = createCrossSystemSyncBridge({
        duration: 1000,
        participants: [
          {
            id: "part-1",
            system: "3d",
            startProgress: 0,
            endProgress: 0.5,
            onUpdate: onUpdateP1,
          },
          {
            id: "part-2",
            system: "dom",
            startProgress: 0.5,
            endProgress: 1,
            onUpdate: onUpdateP2,
          },
        ],
      });

      // Seek to 0.25 (halfway through part-1, before part-2)
      bridge.seek(0.25);
      expect(bridge.getProgress()).toBe(0.25);
      expect(onUpdateP1).toHaveBeenCalledWith(0.25, 0.5); // local progress is 0.25 / 0.5 = 0.5
      expect(onUpdateP2).toHaveBeenCalledWith(0.25, 0);   // part-2 hasn't started yet

      // Seek to 0.75 (part-1 finished, halfway through part-2)
      bridge.seek(0.75);
      expect(bridge.getProgress()).toBe(0.75);
      expect(onUpdateP1).toHaveBeenCalledWith(0.75, 1);   // part-1 completed
      expect(onUpdateP2).toHaveBeenCalledWith(0.75, 0.5); // part-2 is halfway

      bridge.destroy();
    });

    it("triggers onStart and onComplete participant lifecycle callbacks cleanly", () => {
      const onStart = vi.fn();
      const onComplete = vi.fn();

      const bridge = createCrossSystemSyncBridge({
        participants: [
          {
            id: "part-lifecycle",
            system: "graphics",
            startProgress: 0.2,
            endProgress: 0.8,
            onStart,
            onComplete,
          },
        ],
      });

      bridge.seek(0.1);
      expect(onStart).not.toHaveBeenCalled();
      expect(onComplete).not.toHaveBeenCalled();

      bridge.seek(0.3);
      expect(onStart).toHaveBeenCalledTimes(1);
      expect(onComplete).not.toHaveBeenCalled();

      bridge.seek(0.9);
      expect(onComplete).toHaveBeenCalledTimes(1);

      bridge.destroy();
    });

    it("supports late-joining participants and dynamic removal", () => {
      const lateUpdate = vi.fn();
      const bridge = createCrossSystemSyncBridge({ duration: 500 });

      bridge.seek(0.6);

      // Late-join at progress 0.6
      const unregister = bridge.addParticipant({
        id: "late-part",
        system: "dom",
        startProgress: 0,
        endProgress: 1,
        onUpdate: lateUpdate,
      });

      expect(lateUpdate).toHaveBeenCalledWith(0.6, 0.6);
      expect(bridge.getParticipants()).toHaveLength(1);

      // Unregister dynamically
      unregister();
      expect(bridge.getParticipants()).toHaveLength(0);

      bridge.seek(0.8);
      // Late participant should not receive further updates
      expect(lateUpdate).toHaveBeenCalledTimes(1);

      bridge.destroy();
    });

    it("isolates participant errors so that failing participants do not crash the bridge", () => {
      const failingUpdate = vi.fn(() => {
        throw new Error("Render pipeline crash!");
      });
      const healthyUpdate = vi.fn();

      const bridge = createCrossSystemSyncBridge({
        participants: [
          {
            id: "failing-part",
            system: "3d",
            startProgress: 0,
            endProgress: 1,
            onUpdate: failingUpdate,
          },
          {
            id: "healthy-part",
            system: "dom",
            startProgress: 0,
            endProgress: 1,
            onUpdate: healthyUpdate,
          },
        ],
      });

      // Seeking should not throw despite the failing participant
      expect(() => bridge.seek(0.5)).not.toThrow();
      expect(failingUpdate).toHaveBeenCalled();
      expect(healthyUpdate).toHaveBeenCalledWith(0.5, 0.5);

      bridge.destroy();
    });

    it("supports cancellation and safe idempotent destruction", () => {
      const onCancel = vi.fn();
      const bridge = createCrossSystemSyncBridge({
        participants: [
          {
            id: "cancel-part",
            system: "dom",
            startProgress: 0,
            endProgress: 1,
            onCancel,
          },
        ],
      });

      bridge.cancel();
      expect(onCancel).toHaveBeenCalledTimes(1);

      // Destroy should be idempotent
      expect(() => bridge.destroy()).not.toThrow();
      expect(() => bridge.destroy()).not.toThrow();
    });
  });

  describe("4. React 18/19 Integrations (SSR & StrictMode)", () => {
    it("renders <Choreography /> and <ChoreographyGroup /> under SSR", () => {
      const html = renderToString(
        createElement(
          Choreography,
          {
            context: { pattern: "multi-element-entrance" },
            className: "hero-choreography",
          },
          createElement(ChoreographyGroup, { className: "group-box" }, "Choreographed Elements")
        )
      );

      expect(html).toContain("hero-choreography");
      expect(html).toContain("data-choreography-container=\"true\"");
      expect(html).toContain("group-box");
      expect(html).toContain("Choreographed Elements");
    });

    it("supports render props in <Choreography />", () => {
      const html = renderToString(
        createElement(
          Choreography,
          null,
          (controls) => createElement("span", null, `Progress: ${controls.progress}`)
        )
      );

      expect(html).toContain("Progress: 0");
    });

    it("renders cleanly inside React StrictMode without throws or leaks", () => {
      const html = renderToString(
        createElement(
          StrictMode,
          null,
          createElement(
            Choreography,
            { context: { pattern: "staggered" } },
            createElement("div", null, "Strict Mode Item")
          )
        )
      );

      expect(html).toContain("Strict Mode Item");
    });
  });

  describe("5. AI Capabilities and Registry Discovery", () => {
    it("exports version, supported patterns, and systems", () => {
      expect(CHOREOGRAPHY_INTELLIGENCE_VERSION).toBe("1.0.0");
      expect(listSupportedChoreographyPatterns()).toHaveLength(13);
      expect(listSupportedChoreographySystems()).toHaveLength(5);
      expect(CHOREOGRAPHY_SYSTEMS).toHaveLength(5);
    });

    it("conforms to AI Capability Specification and registers cleanly", () => {
      const cap = getChoreographyIntelligenceCapability();
      expect(cap.id).toBe("choreography-intelligence");
      expect(cap.category).toBe("choreography");
      expect(cap.features.length).toBeGreaterThan(0);
      expect(cap.supportedPatterns).toHaveLength(13);
      expect(cap.supportedSystems).toHaveLength(5);
      expect(CHOREOGRAPHY_INTELLIGENCE_CAPABILITY).toEqual(cap);

      const mockRegistry = { registerCapability: vi.fn() };
      registerChoreographyIntelligenceCapability(mockRegistry);
      expect(mockRegistry.registerCapability).toHaveBeenCalledWith(
        CHOREOGRAPHY_INTELLIGENCE_CAPABILITY,
        { override: true }
      );
    });
  });
});
