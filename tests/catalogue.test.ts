import { describe, expect, expectTypeOf, it } from "vitest";
import {
  CAPABILITIES,
  CAPABILITY_CATEGORIES,
  SCHEMA_VERSION,
  exportCatalogueDocument,
  exportCatalogueJson,
  getCapabilitiesByCategory,
  getCapability,
  listCapabilities,
  listCategories,
  searchCapabilities,
  validateCapabilityConfiguration,
  type CapabilityCategory,
  type CapabilityMetadata,
  type ParameterKind,
  type ReducedMotionBehavior,
} from "../src/catalogue";
import fs from "node:fs";
import path from "node:path";

describe("AF Motion Capability Catalogue", () => {
  it("exposes all 10 required capability categories", () => {
    const expectedCategories: CapabilityCategory[] = [
      "core-animation",
      "visual-effect",
      "text-effect",
      "background",
      "pointer",
      "scroll",
      "svg",
      "gesture",
      "composition",
      "react",
    ];

    expect(listCategories()).toEqual(expectedCategories);
    expect(CAPABILITY_CATEGORIES).toEqual(expectedCategories);
  });

  it("registers at least 70 capabilities covering all categories", () => {
    const all = listCapabilities();
    expect(all.length).toBeGreaterThanOrEqual(70);

    for (const category of listCategories()) {
      const inCat = getCapabilitiesByCategory(category);
      expect(inCat.length).toBeGreaterThan(0);
    }
  });

  it("ensures every capability has unique ID, name, description, and valid category", () => {
    const all = listCapabilities();
    const seenIds = new Set<string>();
    const seenNames = new Set<string>();

    for (const cap of all) {
      expect(cap.id).toBeTypeOf("string");
      expect(cap.id.length).toBeGreaterThan(0);
      expect(seenIds.has(cap.id)).toBe(false);
      seenIds.add(cap.id);

      expect(cap.name).toBeTypeOf("string");
      expect(cap.name.length).toBeGreaterThan(0);

      expect(listCategories()).toContain(cap.category);
      expect(cap.description).toBeTypeOf("string");
      expect(cap.description.length).toBeGreaterThan(10);

      expect(Array.isArray(cap.supportedTargets)).toBe(true);
      expect(cap.supportedTargets.length).toBeGreaterThan(0);

      expect(Array.isArray(cap.parameters)).toBe(true);
      const validKinds: ParameterKind[] = ["positional", "option", "prop"];
      for (const param of cap.parameters) {
        expect(param.name).toBeTypeOf("string");
        expect(param.type).toBeTypeOf("string");
        expect(typeof param.required).toBe("boolean");
        expect(param.description).toBeTypeOf("string");
        expect(validKinds).toContain(param.kind);
      }

      expect(Array.isArray(cap.controls)).toBe(true);
      expect(Array.isArray(cap.callbacks)).toBe(true);
      if (cap.callbackDescriptors) {
        expect(Array.isArray(cap.callbackDescriptors)).toBe(true);
        for (const cb of cap.callbackDescriptors) {
          expect(cb.name).toBeTypeOf("string");
          expect(cb.description).toBeTypeOf("string");
          expect(Array.isArray(cb.parameters)).toBe(true);
          for (const p of cb.parameters) {
            expect(p.name).toBeTypeOf("string");
            expect(p.type).toBeTypeOf("string");
            expect(p.description).toBeTypeOf("string");
          }
        }
      }

      // Usage signature check
      expect(cap.signature).toBeDefined();
      expect(cap.signature.importStatement).toMatch(/from ["']af-motion/);
      expect(cap.signature.invocation.length).toBeGreaterThan(0);
      expect(cap.signature.exampleCode.length).toBeGreaterThan(0);

      const validReducedMotion: ReducedMotionBehavior[] = [
        "skips-to-endpoint",
        "disables-animation",
        "static-fallback",
        "respects-profile",
        "not-applicable",
      ];
      expect(validReducedMotion).toContain(cap.reducedMotion);

      expect(cap.compatibility).toBeDefined();
      expect(typeof cap.compatibility.browser).toBe("boolean");
      expect(typeof cap.compatibility.ssr).toBe("boolean");
    }
  });

  it("supports programmatic lookup by ID", () => {
    const animateMeta = getCapability("core-animate");
    expect(animateMeta).toBeDefined();
    expect(animateMeta?.name).toBe("animate");
    expect(animateMeta?.category).toBe("core-animation");
    expect(animateMeta?.controls).toContain("cancel");
    expect(animateMeta?.callbacks).toContain("onStart");
    expect(animateMeta?.callbackDescriptors.some((d) => d.name === "onStart")).toBe(true);

    const auroraMeta = getCapability("bg-aurora");
    expect(auroraMeta).toBeDefined();
    expect(auroraMeta?.name).toBe("aurora");
    expect(auroraMeta?.category).toBe("background");
    expect(auroraMeta?.compatibility.requiresCanvas).toBe(true);

    const useInViewMeta = getCapability("react-use-in-view");
    expect(useInViewMeta).toBeDefined();
    expect(useInViewMeta?.name).toBe("useInView");
    expect(useInViewMeta?.category).toBe("react");
    expect(useInViewMeta?.callbacks).toContain("onEnter");

    expect(getCapability("non-existent-capability-xyz")).toBeUndefined();
  });

  it("supports category filtering", () => {
    const coreAnimations = getCapabilitiesByCategory("core-animation");
    expect(coreAnimations.some((c) => c.name === "animate")).toBe(true);
    expect(coreAnimations.some((c) => c.name === "createTimeline")).toBe(true);
    expect(coreAnimations.some((c) => c.name === "animateSpring")).toBe(true);

    const visualEffects = getCapabilitiesByCategory("visual-effect");
    expect(visualEffects.some((c) => c.name === "reveal")).toBe(true);
    expect(visualEffects.some((c) => c.name === "stagger")).toBe(true);
    expect(visualEffects.some((c) => c.name === "glow")).toBe(true);

    const reactEntries = getCapabilitiesByCategory("react");
    expect(reactEntries.some((c) => c.name === "useAnimate")).toBe(true);
    expect(reactEntries.some((c) => c.name === "Reveal")).toBe(true);
    expect(reactEntries.some((c) => c.name === "AnimatedText")).toBe(true);
  });

  it("supports keyword searching across name, description, and tags", () => {
    const springResults = searchCapabilities("spring");
    expect(springResults.some((c) => c.id === "core-animate-spring")).toBe(true);

    const canvasResults = searchCapabilities("canvas");
    expect(canvasResults.some((c) => c.category === "background")).toBe(true);

    const typingResults = searchCapabilities("typing");
    expect(typingResults.some((c) => c.id === "text-typewriter")).toBe(true);

    expect(searchCapabilities("")).toEqual([]);
    // @ts-expect-error test non-string input
    expect(searchCapabilities(null)).toEqual([]);
  });

  it("serializes to valid standalone JSON for AI agents and MCP tools", () => {
    const json = exportCatalogueJson();
    expect(typeof json).toBe("string");
    const parsed = JSON.parse(json);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(CAPABILITIES.length);

    const parsedFirst = parsed[0];
    expect(parsedFirst.id).toBe("core-animate");
    expect(parsedFirst.parameters).toBeDefined();
  });

  it("exports a versioned schema document conforming to SCHEMA_VERSION", () => {
    const doc = exportCatalogueDocument();
    expect(doc.version).toBe(SCHEMA_VERSION);
    expect(doc.categories).toEqual(CAPABILITY_CATEGORIES);
    expect(doc.totalCapabilities).toBe(CAPABILITIES.length);
    expect(Array.isArray(doc.capabilities)).toBe(true);
    expect(doc.capabilities.length).toBe(CAPABILITIES.length);
  });

  describe("validateCapabilityConfiguration", () => {
    it("returns error for unknown capability IDs", () => {
      const res = validateCapabilityConfiguration("unknown-id-12345", {});
      expect(res.valid).toBe(false);
      expect(res.errors[0]?.message).toContain("Unknown capability ID");
    });

    it("detects missing required parameters", () => {
      const res = validateCapabilityConfiguration("core-animate", {});
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.parameter === "target")).toBe(true);
      expect(res.errors.some((e) => e.parameter === "properties")).toBe(true);
    });

    it("detects out-of-range numeric options", () => {
      const res = validateCapabilityConfiguration("core-animate", {
        target: "#hero",
        properties: { opacity: [0, 1] },
        duration: -100,
      });
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.parameter === "duration" && e.message.includes("minimum"))).toBe(true);
    });

    it("detects invalid enum values", () => {
      const res = validateCapabilityConfiguration("effect-reveal", {
        target: "#title",
        direction: "sideways",
      });
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.parameter === "direction" && e.message.includes("one of"))).toBe(true);
    });

    it("passes validation for completely valid configurations", () => {
      const res = validateCapabilityConfiguration("core-animate", {
        target: "#hero",
        properties: { opacity: [0, 1] },
        duration: 500,
        easing: "easeOut",
      });
      expect(res.valid).toBe(true);
      expect(res.errors.length).toBe(0);
    });
  });

  it("ensures catalogue is exported in package.json subpaths without inflating root", () => {
    const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../package.json"), "utf8"));
    expect(pkg.exports["./catalogue"]).toBeDefined();
    expect(pkg.exports["./catalogue"].import).toBe("./dist/catalogue.js");
    expect(pkg.exports["./catalog"]).toBeDefined();
    expect(pkg.exports["./catalog"].import).toBe("./dist/catalogue.js");
  });
});
