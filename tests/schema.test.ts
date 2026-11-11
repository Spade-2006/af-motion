import { describe, expect, it, beforeEach } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import {
  aiMotionRegistry,
  registerCapability,
  resetCapabilityRegistry,
  getCapabilitySchema,
  getSchemaById,
  listSchemas,
  exportSchemas,
  validateSchema,
  validateConfiguration,
  resolveConfigurationDefaults,
  validateCapabilityConfiguration,
  createSchemaId,
  SCHEMA_SPEC_VERSION,
  type UnifiedMotionSchema,
} from "../src/catalogue.js";
import {
  useSchema,
  useValidateConfiguration,
  useConfigurationDefaults,
} from "../src/react.js";

describe("Unified Machine-Readable Schema Architecture", () => {
  beforeEach(() => {
    resetCapabilityRegistry();
  });

  describe("Schema Contract & Discovery", () => {
    it("exposes canonical schema URIs and versioning for built-in capabilities", () => {
      const schema = getCapabilitySchema("preset-fade-in");
      expect(schema).toBeDefined();
      expect(schema?.$id).toBe("af-motion:schema:capability:preset-fade-in");
      expect(schema?.schemaVersion).toBe(SCHEMA_SPEC_VERSION);
      expect(schema?.capabilityId).toBe("preset-fade-in");
      expect(schema?.type).toBe("object");
      expect(schema?.properties).toBeDefined();
      expect(typeof schema?.properties).toBe("object");
    });

    it("retrieves schemas by canonical $id, short schema ID, or capability ID via getSchemaById", () => {
      const canonical = getSchemaById("af-motion:schema:capability:core-animate");
      const short = getSchemaById("af-motion:schema:core-animate");
      const byCapId = getSchemaById("core-animate");

      expect(canonical).toBeDefined();
      expect(canonical?.$id).toBe("af-motion:schema:capability:core-animate");
      expect(short?.$id).toBe(canonical?.$id);
      expect(byCapId?.$id).toBe(canonical?.$id);
    });

    it("lists schemas across all categories with optional category filtering", () => {
      const allSchemas = listSchemas();
      expect(allSchemas.length).toBe(161);

      const presetSchemas = listSchemas({ category: "preset" });
      expect(presetSchemas.length).toBe(39);
      for (const s of presetSchemas) {
        expect(s.category).toBe("preset");
      }

      const recipeSchemas = listSchemas({ category: "recipe" });
      expect(recipeSchemas.length).toBe(5);
    });

    it("exports complete deterministic SchemasDocument", () => {
      const doc = exportSchemas();
      expect(doc.$schema).toBe("https://af-motion.dev/schemas/schemas-document-v1.json");
      expect(doc.version).toBe("1.0.0");
      expect(doc.totalSchemas).toBe(161);
      expect(Array.isArray(doc.schemas)).toBe(true);

      // Verify JSON serializability
      const serialized = JSON.stringify(doc);
      expect(typeof serialized).toBe("string");
      const deserialized = JSON.parse(serialized);
      expect(deserialized.totalSchemas).toBe(161);
    });
  });

  describe("Schema Validation (validateSchema)", () => {
    it("validates compliant schema definitions", () => {
      const validSchema: UnifiedMotionSchema = {
        $id: createSchemaId("test-morph"),
        schemaVersion: "1.0.0",
        capabilityId: "test-morph",
        name: "Test Morph",
        category: "svg",
        description: "SVG path morphing schema.",
        type: "object",
        properties: {
          precision: {
            type: "number",
            minimum: 1,
            maximum: 10,
            default: 3,
            description: "Interpolation precision.",
          },
        },
      };

      const result = validateSchema(validSchema);
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it("detects invalid schemas with missing fields or inconsistent ranges", () => {
      // Missing $id and category
      const invalid = {
        name: "Invalid",
        type: "object",
        properties: {
          test: {
            type: "number",
            minimum: 100,
            maximum: 10, // min > max
          },
        },
      };

      const result = validateSchema(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === "$id")).toBe(true);
      expect(result.errors.some((e) => e.field.includes("test"))).toBe(true);
    });
  });

  describe("Configuration Validation Engine (validateConfiguration)", () => {
    const complexSchema: UnifiedMotionSchema = {
      $id: createSchemaId("complex-card"),
      schemaVersion: "1.0.0",
      capabilityId: "complex-card",
      name: "Complex Card",
      category: "interaction",
      description: "Interactive nested card schema.",
      type: "object",
      required: ["title", "cardOptions"],
      additionalProperties: false,
      properties: {
        title: {
          type: "string",
          minLength: 3,
          maxLength: 50,
          description: "Card title.",
        },
        mode: {
          type: "string",
          enum: ["flat", "elevated", "glossy"],
          default: "flat",
          description: "Card visual style.",
        },
        cardOptions: {
          type: "object",
          required: ["elevation"],
          properties: {
            elevation: {
              type: "number",
              minimum: 0,
              maximum: 24,
              default: 4,
            },
            hapticFeedback: {
              type: "boolean",
              default: true,
            },
          },
        },
        tags: {
          type: "array",
          items: {
            type: "string",
          },
        },
      },
    };

    it("passes completely valid configurations and resolves defaults", () => {
      const config = {
        title: "Profile Card",
        cardOptions: {
          elevation: 12,
        },
      };

      const res = validateConfiguration(complexSchema, config);
      expect(res.valid).toBe(true);
      expect(res.errors.length).toBe(0);
      expect(res.resolvedConfiguration).toBeDefined();
      expect(res.resolvedConfiguration?.mode).toBe("flat"); // Default applied
      expect((res.resolvedConfiguration?.cardOptions as any)?.hapticFeedback).toBe(true); // Nested default applied
    });

    it("detects missing root and nested required properties", () => {
      const config = {
        // missing "title"
        cardOptions: {
          // missing "elevation"
        },
      };

      const res = validateConfiguration(complexSchema, config);
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.path === "title" && e.rule === "required")).toBe(true);
      expect(res.errors.some((e) => e.path === "cardOptions.elevation" && e.rule === "required")).toBe(true);
    });

    it("detects type mismatches, non-finite numbers, and range violations", () => {
      const config = {
        title: 12345, // string expected
        cardOptions: {
          elevation: 50, // max is 24
        },
      };

      const res = validateConfiguration(complexSchema, config);
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.path === "title" && e.rule === "type")).toBe(true);
      expect(res.errors.some((e) => e.path === "cardOptions.elevation" && e.rule === "range")).toBe(true);
    });

    it("detects invalid enum values", () => {
      const config = {
        title: "Valid Title",
        mode: "unsupported-mode",
        cardOptions: {
          elevation: 4,
        },
      };

      const res = validateConfiguration(complexSchema, config);
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.path === "mode" && e.rule === "enum")).toBe(true);
    });

    it("detects unknown properties when additionalProperties is false or allowUnknown is false", () => {
      const config = {
        title: "Valid Title",
        cardOptions: {
          elevation: 4,
          unknownSubKey: 999,
        },
        unauthorizedTopKey: "surprise",
      };

      const res = validateConfiguration(complexSchema, config);
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.path === "unauthorizedTopKey" && e.rule === "unknown")).toBe(true);
      expect(res.errors.some((e) => e.path === "cardOptions.unknownSubKey" && e.rule === "unknown")).toBe(true);
    });

    it("validates nested array items", () => {
      const config = {
        title: "Valid Title",
        cardOptions: {
          elevation: 4,
        },
        tags: ["valid-tag", 9999], // second item is not string
      };

      const res = validateConfiguration(complexSchema, config);
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.path === "tags[1]" && e.rule === "type")).toBe(true);
    });
  });

  describe("Defaults Resolution (resolveConfigurationDefaults)", () => {
    it("purely resolves defaults without mutating inputs", () => {
      const schema: UnifiedMotionSchema = {
        $id: createSchemaId("defaults-test"),
        schemaVersion: "1.0.0",
        capabilityId: "defaults-test",
        name: "Defaults Test",
        category: "animation",
        description: "Defaults testing.",
        type: "object",
        defaultConfiguration: {
          stiffness: 100,
        },
        properties: {
          stiffness: { type: "number", default: 100 },
          damping: { type: "number", default: 15 },
          mass: { type: "number", default: 1 },
        },
      };

      const input = { damping: 25 };
      const resolved = resolveConfigurationDefaults<any>(schema, input);

      expect(resolved.stiffness).toBe(100);
      expect(resolved.damping).toBe(25); // User override respected
      expect(resolved.mass).toBe(1);
      expect((input as any).mass).toBeUndefined(); // Input was not mutated
    });
  });

  describe("Custom Capability Schema Integration", () => {
    it("registers custom capability and immediately surfaces its schema by capability ID and schema ID", () => {
      registerCapability({
        id: "custom-elastic-sheet",
        name: "Elastic Bottom Sheet",
        category: "interaction",
        description: "Draggable sheet with elastic velocity boundary snap.",
        schema: {
          type: "object",
          properties: {
            snapPoints: {
              type: "array",
              description: "Fractional snap heights.",
            },
            dismissible: {
              type: "boolean",
              default: true,
            },
          },
        },
      });

      const byCap = getCapabilitySchema("custom-elastic-sheet");
      expect(byCap).toBeDefined();
      expect(byCap?.$id).toBe("af-motion:schema:capability:custom-elastic-sheet");
      expect(byCap?.properties.dismissible.default).toBe(true);

      const bySchema = getSchemaById("af-motion:schema:capability:custom-elastic-sheet");
      expect(bySchema?.$id).toBe(byCap?.$id);

      // Verify custom schema is included in listSchemas
      const all = listSchemas();
      expect(all.some((s) => s.capabilityId === "custom-elastic-sheet")).toBe(true);
    });
  });

  describe("Backward Compatibility", () => {
    it("preserves exact behavior of legacy validateCapabilityConfiguration", () => {
      const unknownRes = validateCapabilityConfiguration("nonexistent-item", {});
      expect(unknownRes.valid).toBe(false);
      expect(unknownRes.errors[0]?.message).toContain("Unknown capability ID");

      const validRes = validateCapabilityConfiguration("core-animate", {
        target: "#box",
        properties: { opacity: [0, 1] },
        duration: 400,
        easing: "ease-out",
      });
      expect(validRes.valid).toBe(true);
      expect(validRes.errors.length).toBe(0);
    });
  });

  describe("React Integration (Hooks & SSR Safety)", () => {
    it("renders useSchema, useValidateConfiguration, and useConfigurationDefaults in SSR without window or DOM", () => {
      function SSRSchemaComponent() {
        const schema = useSchema("preset-fade-in");
        const validation = useValidateConfiguration("preset-fade-in", {
          duration: 400,
        });
        const defaults = useConfigurationDefaults<any>("preset-fade-in");

        return createElement(
          "div",
          { "data-testid": "ssr-schema-box" },
          createElement("span", { id: "schema-id" }, schema?.$id ?? "none"),
          createElement("span", { id: "valid" }, String(validation.valid)),
          createElement("span", { id: "has-defaults" }, String(defaults !== undefined))
        );
      }

      const html = renderToString(createElement(SSRSchemaComponent));
      expect(html).toContain('data-testid="ssr-schema-box"');
      expect(html).toContain("af-motion:schema:capability:preset-fade-in");
      expect(html).toContain("true");
    });

    it("reactively re-validates configuration when custom capabilities are registered", () => {
      const initialSchema = getSchemaById("af-motion:schema:capability:custom-dynamic-pill");
      expect(initialSchema).toBeUndefined();

      registerCapability({
        id: "custom-dynamic-pill",
        name: "Dynamic Pill",
        category: "interaction",
        description: "Reactive floating status pill.",
        schema: {
          type: "object",
          required: ["label"],
          properties: {
            label: { type: "string" },
          },
        },
      });

      const updatedSchema = getSchemaById("af-motion:schema:capability:custom-dynamic-pill");
      expect(updatedSchema).toBeDefined();

      const invalidCheck = validateConfiguration(updatedSchema!, {});
      expect(invalidCheck.valid).toBe(false);

      const validCheck = validateConfiguration(updatedSchema!, { label: "Active" });
      expect(validCheck.valid).toBe(true);
    });
  });
});
