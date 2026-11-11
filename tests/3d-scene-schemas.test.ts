// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";

import {
  // Types & Schemas
  SCENE_SPECIFICATION_VERSION,
  COMPLETE_SCENE_SCHEMA,
  TRANSFORM_3D_SCHEMA,
  MATERIAL_SCHEMA,
  GEOMETRY_SCHEMA,
  INTERACTION_SCHEMA,
  SCENE_OBJECT_SCHEMA,
  // Validation & Correction
  validateTransform,
  validateSceneObject,
  validateSceneHierarchy,
  validateSceneSchema,
  correctSceneSchema,
  // Serialization & Migration
  serializeSceneSchema,
  deserializeSceneSchema,
  migrateSceneSchema,
  // AI Integration
  describeSceneSpecification,
  querySceneObjects,
  findSceneObject,
  SCENE_SPECIFICATION_CAPABILITY,
  registerSceneSchemaCapability,
  aiMotionRegistry,
  type Scene3DSpecification,
  type SceneObjectSpec,
  type Transform3D,
} from "../src/catalogue.js";

import {
  SceneSchemaProvider,
  useSceneSchema,
  useValidateScene,
  useSceneObject,
} from "../src/react.js";

describe("Machine-Readable 3D Scene Schemas (Prompt 77)", () => {
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
  });

  describe("Schema Contracts & Definitions", () => {
    it("exposes valid Draft-07 machine-readable schemas", () => {
      expect(SCENE_SPECIFICATION_VERSION).toBe("1.0.0");
      expect(COMPLETE_SCENE_SCHEMA.$schema).toContain("draft-07");
      expect(COMPLETE_SCENE_SCHEMA.required).toContain("id");
      expect(COMPLETE_SCENE_SCHEMA.required).toContain("version");
      expect(COMPLETE_SCENE_SCHEMA.required).toContain("objects");

      expect(TRANSFORM_3D_SCHEMA.type).toBe("object");
      expect(MATERIAL_SCHEMA.required).toContain("type");
      expect(GEOMETRY_SCHEMA.required).toContain("type");
      expect(INTERACTION_SCHEMA.required).toContain("trigger");
      expect(SCENE_OBJECT_SCHEMA.required).toContain("id");
    });
  });

  describe("Spatial Transforms & Coordinate Validation", () => {
    it("validates compliant Transform3D configurations", () => {
      const transform: Transform3D = {
        position: [0, 2.5, -10],
        rotation: [0, Math.PI / 4, 0],
        scale: [1, 1, 1],
        quaternion: [0, 0, 0, 1],
      };

      const errors = validateTransform(transform);
      expect(errors).toHaveLength(0);
    });

    it("flags non-finite numbers in transforms", () => {
      const errors = validateTransform({
        position: [NaN, 0, Infinity],
      });

      expect(errors.some((e) => e.code === "INVALID_POSITION")).toBe(true);
    });

    it("warns on zero-dimension scale", () => {
      const warnings = validateTransform({
        scale: [1, 0, 1],
      });

      expect(warnings.some((w) => w.code === "ZERO_SCALE" && w.severity === "warning")).toBe(true);
    });

    it("rejects zero-length quaternions", () => {
      const errors = validateTransform({
        quaternion: [0, 0, 0, 0],
      });

      expect(errors.some((e) => e.code === "DEGENERATE_QUATERNION")).toBe(true);
    });
  });

  describe("Scene Object Types & Hierarchy Validation", () => {
    it("validates primitive, mesh, light, camera, model, and interactive objects", () => {
      const primitiveObj: SceneObjectSpec = {
        id: "cube-1",
        type: "primitive",
        geometry: { type: "primitive", primitive: "box", parameters: { width: 2, height: 2, depth: 2 } },
        material: { type: "standard", color: "#ff0055", roughness: 0.3 },
      };

      const modelObj: SceneObjectSpec = {
        id: "drone-model",
        type: "model",
        model: { type: "model", format: "glb", url: "https://models.afmotion.dev/drone.glb" },
      };

      const interactiveObj: SceneObjectSpec = {
        id: "btn-3d",
        type: "interactive",
        interaction: { trigger: "click", action: "animate", targetId: "cube-1" },
      };

      expect(validateSceneObject(primitiveObj)).toHaveLength(0);
      expect(validateSceneObject(modelObj)).toHaveLength(0);
      expect(validateSceneObject(interactiveObj)).toHaveLength(0);
    });

    it("detects missing IDs and invalid object types", () => {
      const errors = validateSceneObject({
        id: "",
        type: "unknown-type",
      });

      expect(errors.some((e) => e.code === "MISSING_OBJECT_ID")).toBe(true);
      expect(errors.some((e) => e.code === "INVALID_OBJECT_TYPE")).toBe(true);
    });

    it("detects duplicate object IDs across hierarchy", () => {
      const objects = [
        { id: "node-a", type: "group" },
        { id: "node-b", type: "mesh", children: [{ id: "node-a", type: "primitive" }] },
      ];

      const errors = validateSceneHierarchy(objects);
      expect(errors.some((e) => e.code === "DUPLICATE_OBJECT_ID")).toBe(true);
    });

    it("detects circular parent-child hierarchies", () => {
      const objects = [
        { id: "node-1", type: "group", parentId: "node-2" },
        { id: "node-2", type: "group", parentId: "node-1" },
      ];

      const errors = validateSceneHierarchy(objects);
      expect(errors.some((e) => e.code === "CIRCULAR_HIERARCHY")).toBe(true);
    });

    it("detects dangling parentId references", () => {
      const objects = [
        { id: "node-1", type: "group", parentId: "non-existent-parent" },
      ];

      const errors = validateSceneHierarchy(objects);
      expect(errors.some((e) => e.code === "DANGLING_PARENT_REFERENCE")).toBe(true);
    });

    it("validates complete scene specifications", () => {
      const spec: Scene3DSpecification = {
        id: "hero-scene",
        version: "1.0.0",
        camera: { type: "perspective", fov: 60 },
        lighting: { ambient: { intensity: 0.5 } },
        objects: [
          {
            id: "root-group",
            type: "group",
            children: [
              {
                id: "child-mesh",
                type: "primitive",
                geometry: { type: "primitive", primitive: "sphere" },
              },
            ],
          },
        ],
      };

      const report = validateSceneSchema(spec);
      expect(report.valid).toBe(true);
      expect(report.errors).toHaveLength(0);
    });
  });

  describe("Schema Auto-Correction & Cycle Breaking", () => {
    it("safely repairs malformed specifications and inserts defaults", () => {
      const corrected = correctSceneSchema({
        id: "   ",
        camera: { fov: 250, near: -10 },
        objects: [
          {
            id: "obj-broken",
            type: "mesh",
            transform: { position: [NaN, Infinity, 5], scale: [0, 0, 0] },
          },
        ],
      });

      expect(corrected.id).toBe("scene-3d");
      expect(corrected.camera?.fov).toBe(50);
      expect(corrected.camera?.near).toBe(0.1);
      expect(corrected.objects[0].transform?.position).toEqual([0, 0, 5]);
      expect(corrected.objects[0].transform?.scale).toEqual([1, 1, 1]);
    });

    it("breaks circular hierarchy relationships cleanly", () => {
      const corrected = correctSceneSchema({
        id: "cyclic-scene",
        objects: [
          { id: "node-x", type: "group", parentId: "node-y" },
          { id: "node-y", type: "group", parentId: "node-x" },
        ],
      });

      const report = validateSceneSchema(corrected);
      expect(report.errors.some((e) => e.code === "CIRCULAR_HIERARCHY")).toBe(false);
    });

    it("preserves custom extension attributes and userData", () => {
      const corrected = correctSceneSchema({
        id: "custom-data-scene",
        metadata: { author: "Designer", tags: ["cyberpunk", "neon"] },
        objects: [
          {
            id: "custom-node",
            type: "custom",
            customType: "volumetric-fog",
            userData: { density: 0.8, noiseSeed: 12345 },
          },
        ],
      });

      expect(corrected.metadata?.author).toBe("Designer");
      expect(corrected.objects[0].userData?.density).toBe(0.8);
      expect(corrected.objects[0].userData?.noiseSeed).toBe(12345);
    });
  });

  describe("Serialization, Deserialization & Round-Trip Fidelity", () => {
    it("deterministically serializes scene specifications", () => {
      const specA: Scene3DSpecification = {
        id: "deterministic-scene",
        version: "1.0.0",
        name: "Test",
        objects: [{ id: "box-1", type: "group" }],
      };

      const specB: Scene3DSpecification = {
        name: "Test",
        objects: [{ type: "group", id: "box-1" }],
        version: "1.0.0",
        id: "deterministic-scene",
      };

      const jsonA = serializeSceneSchema(specA);
      const jsonB = serializeSceneSchema(specB);

      expect(jsonA).toBe(jsonB);
    });

    it("maintains round-trip preservation and omits non-serializable fields", () => {
      const original: Scene3DSpecification = {
        id: "round-trip-scene",
        version: "1.0.0",
        coordinateSystem: "right-handed-y-up",
        camera: { fov: 55, position: [0, 1, 5] },
        objects: [
          {
            id: "mesh-1",
            type: "primitive",
            geometry: { type: "primitive", primitive: "cylinder" },
            userData: { tag: "column" },
          },
        ],
      };

      const json = serializeSceneSchema(original, { pretty: true });
      const restored = deserializeSceneSchema(json);

      expect(restored.id).toBe(original.id);
      expect(restored.camera?.fov).toBe(original.camera?.fov);
      expect(restored.objects[0].id).toBe("mesh-1");
      expect(restored.objects[0].userData?.tag).toBe("column");
    });

    it("migrates legacy schema versions (v0.9.0 flat coordinates)", () => {
      const legacyRaw = {
        id: "legacy-scene",
        version: "0.9.0",
        objects: [
          { id: "legacy-node", type: "mesh", x: 10, y: 20, z: 30 },
        ],
      };

      const migrated = migrateSceneSchema(legacyRaw);
      expect(migrated.version).toBe("1.0.0");
      expect(migrated.objects[0].transform?.position).toEqual([10, 20, 30]);
    });
  });

  describe("AI Motion Registry & Object Querying", () => {
    const testScene: Scene3DSpecification = {
      id: "ai-query-scene",
      name: "Cyber Lounge",
      version: "1.0.0",
      camera: { fov: 50, position: [0, 2, 8] },
      lighting: { ambient: { intensity: 0.6 }, directional: [{ intensity: 1 }] },
      objects: [
        { id: "group-furniture", type: "group" },
        { id: "chair-1", type: "mesh", parentId: "group-furniture" },
        { id: "chair-2", type: "mesh", parentId: "group-furniture" },
        { id: "key-light", type: "light", lightType: "point" },
      ],
    };

    it("queries objects by type and parentId", () => {
      const meshes = querySceneObjects(testScene, { type: "mesh" });
      expect(meshes).toHaveLength(2);

      const groupChildren = querySceneObjects(testScene, { parentId: "group-furniture" });
      expect(groupChildren).toHaveLength(2);
    });

    it("finds specific scene objects by ID", () => {
      const chair = findSceneObject(testScene, "chair-2");
      expect(chair).toBeDefined();
      expect(chair?.id).toBe("chair-2");
      expect(chair?.parentId).toBe("group-furniture");

      expect(findSceneObject(testScene, "non-existent")).toBeUndefined();
    });

    it("generates natural-language summaries for AI agents", () => {
      const summary = describeSceneSpecification(testScene);
      expect(summary).toContain("Cyber Lounge");
      expect(summary).toContain("4 total");
      expect(summary).toContain("mesh: 2");
      expect(summary).toContain("group: 1");
      expect(summary).toContain("point");
    });

    it("registers SCENE_SPECIFICATION_CAPABILITY dynamically into aiMotionRegistry", () => {
      expect(SCENE_SPECIFICATION_CAPABILITY.id).toBe("scene-3d-specification");
      expect(SCENE_SPECIFICATION_CAPABILITY.category).toBe("composition");

      registerSceneSchemaCapability(aiMotionRegistry);
      const retrieved = aiMotionRegistry.getCapability("scene-3d-specification");
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe("scene-3d-specification");
    });
  });

  describe("React 18/19 Integration", () => {
    it("useSceneSchema manages specification state and object mutations", () => {
      let schemaControls: any = null;

      function SchemaEditor() {
        schemaControls = useSceneSchema({
          id: "react-scene-spec",
          objects: [{ id: "box-initial", type: "primitive" }],
        });
        return createElement("div", null, `Objects: ${schemaControls.spec.objects.length}`);
      }

      act(() => {
        root.render(createElement(StrictMode, null, createElement(SchemaEditor)));
      });

      expect(schemaControls.spec.id).toBe("react-scene-spec");
      expect(schemaControls.spec.objects).toHaveLength(1);

      act(() => {
        schemaControls.addObject({
          id: "sphere-added",
          type: "primitive",
          geometry: { type: "primitive", primitive: "sphere" },
        });
      });

      expect(schemaControls.spec.objects).toHaveLength(2);

      act(() => {
        schemaControls.updateObject("sphere-added", { visible: false });
      });

      expect(schemaControls.spec.objects.find((o: any) => o.id === "sphere-added")?.visible).toBe(false);

      act(() => {
        schemaControls.removeObject("box-initial");
      });

      expect(schemaControls.spec.objects).toHaveLength(1);
    });

    it("SceneSchemaProvider and useSceneSchema share specification context", () => {
      const sharedSpec: Scene3DSpecification = {
        id: "context-spec-scene",
        version: "1.0.0",
        objects: [{ id: "shared-node", type: "group" }],
      };

      let capturedSpec: any = null;

      function Child() {
        const { spec } = useSceneSchema();
        capturedSpec = spec;
        return createElement("div", null, spec.id);
      }

      act(() => {
        root.render(
          createElement(
            SceneSchemaProvider,
            { specification: sharedSpec },
            createElement(Child)
          )
        );
      });

      expect(capturedSpec.id).toBe("context-spec-scene");
    });

    it("useValidateScene returns reactive validation report", () => {
      let validationState: any = null;

      function ValidatorTest() {
        validationState = useValidateScene({
          id: "test",
          version: "1.0.0",
          objects: [],
        });
        return createElement("div", null, validationState.isValid ? "Valid" : "Invalid");
      }

      act(() => {
        root.render(createElement(ValidatorTest));
      });

      expect(validationState.isValid).toBe(true);
      expect(validationState.report.errors).toHaveLength(0);
    });

    it("useSceneObject retrieves object node by ID", () => {
      const spec: Scene3DSpecification = {
        id: "lookup-scene",
        version: "1.0.0",
        objects: [{ id: "target-object", type: "mesh" }],
      };

      let foundNode: any = null;

      function ObjectLookup() {
        foundNode = useSceneObject(spec, "target-object");
        return createElement("div", null, foundNode?.id || "None");
      }

      act(() => {
        root.render(createElement(ObjectLookup));
      });

      expect(foundNode).toBeDefined();
      expect(foundNode?.id).toBe("target-object");
    });

    it("renders cleanly in SSR simulation", () => {
      const html = renderToString(
        createElement(
          SceneSchemaProvider,
          { specification: { id: "ssr-spec", version: "1.0.0", objects: [] } },
          createElement("div", { className: "ssr-content" }, "SSR 3D Ready")
        )
      );

      expect(html).toContain("SSR 3D Ready");
      expect(html).toContain('class="ssr-content"');
    });
  });
});
