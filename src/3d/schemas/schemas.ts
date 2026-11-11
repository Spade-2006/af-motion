/**
 * AF Motion Machine-Readable 3D Scene JSON Schemas
 *
 * Draft-07 compatible schemas for transforms, objects, materials, and complete scenes.
 */

export const SCENE_SPECIFICATION_VERSION = "1.0.0";

export const TRANSFORM_3D_SCHEMA = {
  type: "object",
  properties: {
    position: {
      type: "array",
      items: { type: "number" },
      minItems: 3,
      maxItems: 3,
      default: [0, 0, 0],
    },
    rotation: {
      type: "array",
      items: { type: "number" },
      minItems: 3,
      maxItems: 3,
      default: [0, 0, 0],
    },
    quaternion: {
      type: "array",
      items: { type: "number" },
      minItems: 4,
      maxItems: 4,
    },
    scale: {
      type: "array",
      items: { type: "number" },
      minItems: 3,
      maxItems: 3,
      default: [1, 1, 1],
    },
  },
} as const;

export const MATERIAL_SCHEMA = {
  type: "object",
  required: ["type"],
  properties: {
    id: { type: "string" },
    type: {
      type: "string",
      enum: ["basic", "standard", "physical", "phong", "toon", "shadow", "custom"],
      default: "standard",
    },
    color: { type: "string", default: "#ffffff" },
    roughness: { type: "number", minimum: 0, maximum: 1, default: 0.5 },
    metalness: { type: "number", minimum: 0, maximum: 1, default: 0.0 },
    transmission: { type: "number", minimum: 0, maximum: 1 },
    ior: { type: "number", minimum: 1, maximum: 3 },
    opacity: { type: "number", minimum: 0, maximum: 1, default: 1.0 },
    transparent: { type: "boolean", default: false },
    wireframe: { type: "boolean", default: false },
    mapUrl: { type: "string" },
    normalMapUrl: { type: "string" },
    roughnessMapUrl: { type: "string" },
  },
} as const;

export const GEOMETRY_SCHEMA = {
  type: "object",
  required: ["type"],
  properties: {
    type: { type: "string", enum: ["primitive", "model", "custom"] },
    primitive: {
      type: "string",
      enum: ["box", "sphere", "cylinder", "plane", "torus", "cone", "capsule"],
    },
    format: { type: "string", enum: ["gltf", "glb", "obj", "fbx"] },
    url: { type: "string" },
    scale: { type: "number", default: 1 },
    parameters: { type: "object" },
  },
} as const;

export const INTERACTION_SCHEMA = {
  type: "object",
  required: ["trigger", "action"],
  properties: {
    trigger: { type: "string", enum: ["click", "hover", "drag", "pointer-move"] },
    action: { type: "string", enum: ["animate", "emit-event", "navigate", "highlight", "custom"] },
    targetId: { type: "string" },
    parameters: { type: "object" },
  },
} as const;

export const SCENE_OBJECT_SCHEMA = {
  type: "object",
  required: ["id", "type"],
  properties: {
    id: { type: "string", minLength: 1 },
    name: { type: "string" },
    type: {
      type: "string",
      enum: ["group", "mesh", "primitive", "light", "camera", "environment", "model", "interactive", "custom"],
    },
    transform: TRANSFORM_3D_SCHEMA,
    visible: { type: "boolean", default: true },
    castShadow: { type: "boolean", default: false },
    receiveShadow: { type: "boolean", default: false },
    parentId: { type: "string" },
    userData: { type: "object" },
  },
} as const;

export const COMPLETE_SCENE_SCHEMA = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "Scene3DSpecification",
  version: SCENE_SPECIFICATION_VERSION,
  type: "object",
  required: ["id", "version", "objects"],
  properties: {
    id: { type: "string", minLength: 1 },
    name: { type: "string" },
    version: { type: "string", default: SCENE_SPECIFICATION_VERSION },
    coordinateSystem: {
      type: "string",
      enum: ["right-handed-y-up", "left-handed-y-up"],
      default: "right-handed-y-up",
    },
    camera: { type: "object" },
    lighting: { type: "object" },
    environment: { type: "object" },
    renderer: { type: "object" },
    objects: {
      type: "array",
      items: SCENE_OBJECT_SCHEMA,
    },
    animations: { type: "array" },
    metadata: { type: "object" },
    autoStart: { type: "boolean", default: true },
    respectReducedMotion: { type: "boolean", default: true },
  },
} as const;
