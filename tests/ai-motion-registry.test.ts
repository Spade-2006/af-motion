import { describe, expect, it, beforeEach } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import {
  aiMotionRegistry,
  createAIMotionRegistry,
  validateCapability,
  deriveJsonSchemaFromParameters,
  registerCapability,
  unregisterCapability,
  getCapabilitySchema,
  getCapabilityCategories,
  getCapabilityTags,
  exportRegistry,
  resetCapabilityRegistry,
  listRegistryCapabilities,
  getRegistryCapability,
  CAPABILITIES,
  BUILT_IN_MOTION_PRESETS,
  BUILT_IN_MOTION_RECIPES,
  BUILT_IN_MOTION_DNA,
  BUILT_IN_DESIGN_SYSTEMS,
  BUILT_IN_CHOREOGRAPHIES,
  type AIMotionCapability,
  type CapabilityFilterOptions,
} from "../src/catalogue.js";
import { useMotionRegistry, useCapabilities, useCapability } from "../src/react.js";
import { listPalettes } from "../src/core/palettes.js";

describe("AI Motion Registry", () => {
  beforeEach(() => {
    resetCapabilityRegistry();
  });

  describe("Built-in Capability Discovery & Unification", () => {
    it("indexes exactly 161 built-in capabilities covering all AF Motion systems with zero duplicates", () => {
      const all = listRegistryCapabilities();
      expect(all.length).toBe(161);

      // Verify no duplicates
      const ids = new Set<string>();
      for (const cap of all) {
        expect(ids.has(cap.id)).toBe(false);
        ids.add(cap.id);
      }
      expect(ids.size).toBe(161);

      // Verify exact count per category
      const byCategory: Record<string, number> = {};
      for (const cap of all) {
        byCategory[cap.category] = (byCategory[cap.category] || 0) + 1;
      }
      expect(byCategory).toEqual({
        "core-animation": 9,
        "visual-effect": 7,
        "text-effect": 7,
        background: 15,
        pointer: 6,
        scroll: 7,
        svg: 2,
        gesture: 3,
        composition: 7,
        react: 9,
        preset: 39,
        recipe: 5,
        "motion-dna": 6,
        "design-system": 3,
        choreography: 3,
        palette: 33,
      });

      // Verify 100% representation of all source subsystems
      expect(CAPABILITIES.length).toBe(72);
      for (const c of CAPABILITIES) {
        expect(aiMotionRegistry.hasCapability(c.id)).toBe(true);
      }
      expect(BUILT_IN_MOTION_PRESETS.length).toBe(39);
      for (const p of BUILT_IN_MOTION_PRESETS) {
        expect(aiMotionRegistry.hasCapability(p.id)).toBe(true);
      }
      expect(BUILT_IN_MOTION_RECIPES.length).toBe(5);
      for (const r of BUILT_IN_MOTION_RECIPES) {
        expect(aiMotionRegistry.hasCapability(r.id)).toBe(true);
      }
      expect(BUILT_IN_MOTION_DNA.length).toBe(6);
      for (const d of BUILT_IN_MOTION_DNA) {
        const id = d.id || ("dna-" + d.name.toLowerCase());
        expect(aiMotionRegistry.hasCapability(id)).toBe(true);
      }
      expect(BUILT_IN_DESIGN_SYSTEMS.length).toBe(3);
      for (const ds of BUILT_IN_DESIGN_SYSTEMS) {
        expect(aiMotionRegistry.hasCapability(ds.id)).toBe(true);
      }
      expect(BUILT_IN_CHOREOGRAPHIES.length).toBe(3);
      for (const ch of BUILT_IN_CHOREOGRAPHIES) {
        expect(aiMotionRegistry.hasCapability(ch.id)).toBe(true);
      }
      expect(listPalettes().length).toBe(33);
      for (const pal of listPalettes()) {
        const id = "palette-" + pal.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        expect(aiMotionRegistry.hasCapability(id)).toBe(true);
      }
    });

    it("indexes built-in capabilities across all major AF Motion systems", () => {
      const all = listRegistryCapabilities();
      expect(all.length).toBeGreaterThanOrEqual(140);

      // Verify representations from every system
      const categories = getCapabilityCategories();
      expect(categories).toContain("preset");
      expect(categories).toContain("recipe");
      expect(categories).toContain("motion-dna");
      expect(categories).toContain("design-system");
      expect(categories).toContain("choreography");
      expect(categories).toContain("palette");
      expect(categories).toContain("core-animation");
      expect(categories).toContain("visual-effect");
    });

    it("ensures every indexed capability has valid mandatory metadata", () => {
      const all = listRegistryCapabilities();
      const seenIds = new Set<string>();

      for (const cap of all) {
        expect(cap.id).toBeTypeOf("string");
        expect(cap.id.length).toBeGreaterThan(0);
        expect(seenIds.has(cap.id)).toBe(false);
        seenIds.add(cap.id);

        expect(cap.name).toBeTypeOf("string");
        expect(cap.name.length).toBeGreaterThan(0);

        expect(cap.category).toBeTypeOf("string");
        expect(cap.category.length).toBeGreaterThan(0);

        expect(cap.description).toBeTypeOf("string");
        expect(cap.description.length).toBeGreaterThan(0);

        expect(cap.custom).toBe(false);
      }
    });

    it("retrieves built-in capabilities from each category by unique ID", () => {
      // Core animation
      expect(getRegistryCapability("core-animate")).toBeDefined();
      expect(getRegistryCapability("core-animate")?.name).toBe("animate");

      // Preset
      expect(getRegistryCapability("preset-fade-in")).toBeDefined();
      expect(getRegistryCapability("preset-fade-in")?.category).toBe("preset");

      // Recipe
      expect(getRegistryCapability("recipe-hero-stagger")).toBeDefined();
      expect(getRegistryCapability("recipe-hero-stagger")?.category).toBe("recipe");

      // Motion DNA
      expect(getRegistryCapability("dna-snappy")).toBeDefined();
      expect(getRegistryCapability("dna-snappy")?.category).toBe("motion-dna");

      // Design System
      expect(getRegistryCapability("ds-default")).toBeDefined();
      expect(getRegistryCapability("ds-default")?.category).toBe("design-system");

      // Choreography
      expect(getRegistryCapability("heroEntrance")).toBeDefined();
      expect(getRegistryCapability("heroEntrance")?.category).toBe("choreography");

      // Palette
      expect(getRegistryCapability("palette-cobalt-classic")).toBeDefined();
      expect(getRegistryCapability("palette-cobalt-classic")?.category).toBe("palette");
    });
  });

  describe("Custom Capability Registration & Lifecycle", () => {
    const customTestCap: AIMotionCapability = {
      id: "custom-elastic-card",
      name: "Elastic Card Interaction",
      category: "interaction",
      description: "Interactive spring card with physical haptic boundary feedback.",
      tags: ["card", "elastic", "physics"],
      supportedTargets: ["HTMLElement"],
      parameters: [
        {
          name: "stiffness",
          kind: "option",
          type: "number",
          required: false,
          default: 180,
          description: "Spring stiffness value.",
          range: { min: 10, max: 1000 },
        },
      ],
      defaultConfiguration: {
        stiffness: 180,
      },
      compatibility: {
        browser: true,
        ssr: true,
      },
      react: {
        available: true,
        hookName: "useElasticCard",
      },
    };

    it("registers and retrieves a valid custom capability", () => {
      expect(aiMotionRegistry.hasCapability("custom-elastic-card")).toBe(false);

      registerCapability(customTestCap);

      expect(aiMotionRegistry.hasCapability("custom-elastic-card")).toBe(true);
      const retrieved = getRegistryCapability("custom-elastic-card");
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe("Elastic Card Interaction");
      expect(retrieved?.custom).toBe(true);
    });

    it("notifies subscribers when a capability is registered, unregistered, or reset", () => {
      let callCount = 0;
      const unsubscribe = aiMotionRegistry.subscribe(() => {
        callCount++;
      });

      registerCapability(customTestCap);
      expect(callCount).toBe(1);

      unregisterCapability("custom-elastic-card");
      expect(callCount).toBe(2);

      registerCapability(customTestCap);
      expect(callCount).toBe(3);

      resetCapabilityRegistry();
      expect(callCount).toBe(4);

      unsubscribe();
      registerCapability(customTestCap);
      expect(callCount).toBe(4); // No further calls after unsubscribe
    });

    it("prevents overwriting a built-in capability without override: true", () => {
      const maliciousAttempt: AIMotionCapability = {
        id: "core-animate",
        name: "Hacked Animate",
        category: "core-animation",
        description: "Attempting unauthorized overwrite of core animation.",
      };

      expect(() => registerCapability(maliciousAttempt)).toThrow(/override = true/);

      // Overwrite succeeds when explicit override option is passed
      expect(() => registerCapability(maliciousAttempt, { override: true })).not.toThrow();
      expect(getRegistryCapability("core-animate")?.name).toBe("Hacked Animate");

      // Reset restores original built-in
      resetCapabilityRegistry();
      expect(getRegistryCapability("core-animate")?.name).toBe("animate");
    });

    it("prevents unregistering a built-in capability", () => {
      expect(() => unregisterCapability("core-animate")).toThrow(/Cannot unregister built-in capability/);
    });

    it("validates capability fields during registration", () => {
      // Missing id
      expect(() =>
        registerCapability({
          id: "",
          name: "Test",
          category: "animation",
          description: "Long enough description",
        } as AIMotionCapability)
      ).toThrow(/id/i);

      // Invalid id characters
      expect(() =>
        registerCapability({
          id: "invalid id with spaces!",
          name: "Test",
          category: "animation",
          description: "Long enough description",
        } as AIMotionCapability)
      ).toThrow(/invalid characters/i);

      // Description too short
      expect(() =>
        registerCapability({
          id: "valid-id",
          name: "Test",
          category: "animation",
          description: "abc",
        } as AIMotionCapability)
      ).toThrow(/description/i);
    });
  });

  describe("Search & Filtering", () => {
    it("searches capabilities by keyword with relevance ranking", () => {
      const results = aiMotionRegistry.searchCapabilities("glow");
      expect(results.length).toBeGreaterThan(0);
      // Top result should be exact or high match for glow
      expect(results[0].id).toContain("glow");
    });

    it("searches capabilities by category and tags", () => {
      const presetResults = aiMotionRegistry.searchCapabilities({
        category: "preset",
        tags: ["fade"],
      });

      expect(presetResults.length).toBeGreaterThan(0);
      for (const cap of presetResults) {
        expect(cap.category).toBe("preset");
        expect(cap.tags?.some((t) => t.includes("fade"))).toBe(true);
      }
    });

    it("filters capabilities by multiple criteria", () => {
      const filter: CapabilityFilterOptions = {
        category: "preset",
        target: "HTMLElement",
        search: "slide",
      };

      const filtered = listRegistryCapabilities(filter);
      expect(filtered.length).toBeGreaterThan(0);
      for (const cap of filtered) {
        expect(cap.category).toBe("preset");
        expect(cap.name.toLowerCase() + cap.id.toLowerCase()).toContain("slide");
      }
    });

    it("supports customOnly filter option", () => {
      expect(listRegistryCapabilities({ customOnly: true }).length).toBe(0);

      registerCapability({
        id: "temp-custom",
        name: "Temporary Custom",
        category: "visual-effect",
        description: "A temporary custom capability for testing.",
      });

      const customOnly = listRegistryCapabilities({ customOnly: true });
      expect(customOnly.length).toBe(1);
      expect(customOnly[0].id).toBe("temp-custom");
    });

    it("returns distinct list of tags and categories", () => {
      const tags = getCapabilityTags();
      expect(tags.length).toBeGreaterThan(20);
      expect(tags).toContain("preset");
      expect(tags).toContain("recipe");
      expect(tags).toContain("palette");

      const categories = getCapabilityCategories();
      expect(categories.length).toBeGreaterThanOrEqual(10);
    });
  });

  describe("Schema Extraction & Validation", () => {
    it("retrieves schema and default configuration for capabilities", () => {
      const schemaInfo = getCapabilitySchema("preset-fade-in");
      expect(schemaInfo).toBeDefined();
      expect(schemaInfo?.id).toBe("preset-fade-in");
      expect(schemaInfo?.schema).toBeDefined();
      expect(schemaInfo?.schema.type).toBe("object");
      expect(schemaInfo?.defaultConfiguration).toBeDefined();
    });

    it("derives valid JSON schema from parameters", () => {
      const schema = deriveJsonSchemaFromParameters(
        [
          {
            name: "duration",
            kind: "option",
            type: "number",
            required: true,
            default: 300,
            description: "Duration in milliseconds.",
            range: { min: 0, max: 10000 },
          },
          {
            name: "easing",
            kind: "option",
            type: "string",
            required: false,
            default: "ease-out",
            description: "Easing curve.",
            enum: ["ease-out", "ease-in", "linear"],
          },
        ],
        { duration: 300, easing: "ease-out" }
      );

      expect(schema.type).toBe("object");
      expect(schema.required).toContain("duration");
      expect(schema.properties.duration.type).toBe("number");
      expect(schema.properties.duration.minimum).toBe(0);
      expect(schema.properties.duration.maximum).toBe(10000);
      expect(schema.properties.easing.enum).toEqual(["ease-out", "ease-in", "linear"]);
    });

    it("validates capability definitions with validateCapability()", () => {
      const invalidResult = validateCapability({ id: "123" });
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);

      const validResult = validateCapability({
        id: "valid-component-shake",
        name: "Component Shake",
        category: "interaction",
        description: "Haptic feedback shake effect for invalid form inputs.",
      });
      expect(validResult.valid).toBe(true);
      expect(validResult.errors.length).toBe(0);
    });
  });

  describe("Deterministic JSON Document Export", () => {
    it("exports registry metadata conforming to schema", () => {
      const doc = exportRegistry();
      expect(doc.$schema).toBe("https://af-motion.dev/schemas/ai-motion-registry-v1.json");
      expect(doc.version).toBe("1.0.0");
      expect(doc.totalCapabilities).toBeGreaterThanOrEqual(140);
      expect(doc.builtInCount).toBe(doc.totalCapabilities);
      expect(doc.customCount).toBe(0);
      expect(Array.isArray(doc.categories)).toBe(true);
      expect(Array.isArray(doc.tags)).toBe(true);
      expect(Array.isArray(doc.capabilities)).toBe(true);
    });

    it("supports export filtering by category and custom status", () => {
      registerCapability({
        id: "custom-particle-explosion",
        name: "Particle Explosion",
        category: "background",
        description: "Interactive particle bursting canvas background.",
      });

      const fullDoc = exportRegistry();
      expect(fullDoc.customCount).toBe(1);

      const builtInOnlyDoc = exportRegistry({ includeCustom: false });
      expect(builtInOnlyDoc.customCount).toBe(0);
      expect(builtInOnlyDoc.capabilities.some((c) => c.id === "custom-particle-explosion")).toBe(false);

      const presetDoc = exportRegistry({ category: "preset" });
      expect(presetDoc.categories).toEqual(["preset"]);
      for (const cap of presetDoc.capabilities) {
        expect(cap.category).toBe("preset");
      }
    });
  });

  describe("React Integration (Hooks & SSR Safety)", () => {
    it("renders smoothly in SSR via renderToString without window or DOM", () => {
      function SSRTestComponent() {
        const registry = useMotionRegistry();
        const capabilities = useCapabilities({ category: "preset" });
        const single = useCapability("preset-fade-in");

        return createElement(
          "div",
          { "data-testid": "ssr-container" },
          createElement("span", { id: "count" }, capabilities.length),
          createElement("span", { id: "single" }, single?.name ?? "none"),
          createElement("span", { id: "has" }, String(registry.hasCapability("preset-fade-in")))
        );
      }

      const html = renderToString(createElement(SSRTestComponent));
      expect(html).toContain('data-testid="ssr-container"');
      expect(html).toContain("fadeIn");
      expect(html).toContain("true");
    });

    it("ensures registry search and React hooks use consistent registry snapshots across registration cycles", () => {
      const initialVer = aiMotionRegistry.getVersion();
      const initialList = aiMotionRegistry.listCapabilities({ category: "interaction" });
      const initialSearch = aiMotionRegistry.searchCapabilities({ category: "interaction", term: "quantum" });
      expect(initialSearch.length).toBe(0);

      // Register custom capability
      registerCapability({
        id: "custom-quantum-hover",
        name: "Quantum Hover",
        category: "interaction",
        description: "Interactive quantum tunneling card hover state.",
      });

      const updatedVer = aiMotionRegistry.getVersion();
      expect(updatedVer).toBeGreaterThan(initialVer);

      // Verify list and search see the exact same updated snapshot
      const updatedList = aiMotionRegistry.listCapabilities({ category: "interaction" });
      const updatedSearch = aiMotionRegistry.searchCapabilities({ category: "interaction", term: "quantum" });

      expect(updatedList.length).toBe(initialList.length + 1);
      expect(updatedSearch.length).toBe(1);
      expect(updatedSearch[0].id).toBe("custom-quantum-hover");

      // Verify React hook renders the updated snapshot consistently
      function DynamicTestComponent() {
        const caps = useCapabilities({ category: "interaction" });
        const hasQuantum = caps.some((c) => c.id === "custom-quantum-hover");
        return createElement("span", { id: "has-quantum" }, String(hasQuantum));
      }

      const html = renderToString(createElement(DynamicTestComponent));
      expect(html).toContain("true");
    });

    it("provides stable references and zero-tearing with useSyncExternalStore", () => {
      const initialVer = aiMotionRegistry.getVersion();
      expect(initialVer).toBeTypeOf("number");

      // Registering a capability increments the version
      registerCapability({
        id: "custom-hover-scale",
        name: "Hover Scale",
        category: "interaction",
        description: "Smooth hover magnification interaction.",
      });

      expect(aiMotionRegistry.getVersion()).toBeGreaterThan(initialVer);
    });
  });

  describe("Isolated Registry Creation", () => {
    it("allows creating isolated custom registries with createAIMotionRegistry", () => {
      const isolated = createAIMotionRegistry([
        {
          id: "isolated-glow",
          name: "Isolated Glow",
          category: "effect",
          description: "Isolated glow effect for sandbox test.",
        },
      ]);

      expect(isolated.listCapabilities().length).toBe(1);
      expect(isolated.getCapability("isolated-glow")?.name).toBe("Isolated Glow");
      expect(isolated.hasCapability("core-animate")).toBe(false); // Does not pollute or inherit unpassed built-ins
    });
  });
});
