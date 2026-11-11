/**
 * AF Motion 3D Scene Specification AI Integration
 *
 * Exposes machine-readable scene querying, natural-language inspection,
 * and AI Motion Registry capability metadata.
 */

import { COMPLETE_SCENE_SCHEMA, SCENE_SPECIFICATION_VERSION } from "./schemas.js";
import type { Scene3DSpecification, SceneObjectSpec, SceneObjectType } from "./types.js";

/**
 * Traverse scene hierarchy and collect all objects matching optional criteria.
 */
export function querySceneObjects(
  spec: Scene3DSpecification,
  filter?: {
    readonly type?: SceneObjectType;
    readonly parentId?: string;
  }
): readonly SceneObjectSpec[] {
  const matches: SceneObjectSpec[] = [];

  function traverse(nodes: readonly SceneObjectSpec[]) {
    for (const node of nodes) {
      let isMatch = true;
      if (filter?.type && node.type !== filter.type) {
        isMatch = false;
      }
      if (filter?.parentId && node.parentId !== filter.parentId) {
        isMatch = false;
      }

      if (isMatch) {
        matches.push(node);
      }

      if (Array.isArray(node.children)) {
        traverse(node.children);
      }
    }
  }

  traverse(spec.objects);
  return matches;
}

/**
 * Find an object anywhere in the scene hierarchy by its ID.
 */
export function findSceneObject(
  spec: Scene3DSpecification,
  objectId: string
): SceneObjectSpec | undefined {
  let found: SceneObjectSpec | undefined = undefined;

  function traverse(nodes: readonly SceneObjectSpec[]) {
    for (const node of nodes) {
      if (node.id === objectId) {
        found = node;
        return;
      }
      if (Array.isArray(node.children)) {
        traverse(node.children);
        if (found) return;
      }
    }
  }

  traverse(spec.objects);
  return found;
}

/**
 * Produce an inspectable structured summary for AI models and generation agents.
 */
export function describeSceneSpecification(spec: Scene3DSpecification): string {
  const allObjects = querySceneObjects(spec);
  const byType: Record<string, number> = {};
  for (const obj of allObjects) {
    byType[obj.type] = (byType[obj.type] || 0) + 1;
  }

  const typeSummary = Object.entries(byType)
    .map(([t, count]) => `${t}: ${count}`)
    .join(", ");

  const pointCount =
    (spec.lighting?.point?.length || 0) +
    allObjects.filter((o) => o.type === "light" && (o as any).lightType === "point").length;
  const spotCount =
    (spec.lighting?.spot?.length || 0) +
    allObjects.filter((o) => o.type === "light" && (o as any).lightType === "spot").length;

  const lines = [
    `Scene: "${spec.name || spec.id}" (id: ${spec.id}, v${spec.version})`,
    `Coordinate System: ${spec.coordinateSystem || "right-handed-y-up"}`,
    `Camera: ${spec.camera?.type || "perspective"} (fov: ${spec.camera?.fov || 50}, pos: [${(spec.camera?.position || [0, 0, 5]).join(", ")}])`,
    `Objects (${allObjects.length} total): ${typeSummary || "empty"}`,
    `Lighting: ambient=${spec.lighting?.ambient ? "yes" : "none"}, directional=${spec.lighting?.directional?.length || 0}, point=${pointCount}, spot=${spotCount}`,
  ];

  return lines.join("\n");
}

/**
 * AI Motion Capability for 3D Scene Specifications.
 */
export const SCENE_SPECIFICATION_CAPABILITY = {
  id: "scene-3d-specification",
  name: "Scene3DSpecification",
  category: "composition" as const,
  description:
    "Machine-readable 3D scene specification supporting spatial hierarchies, cameras, materials, primitive geometries, model references, and interaction contracts.",
  tags: ["3d", "schema", "specification", "scene-graph", "hierarchy", "transform"],
  version: SCENE_SPECIFICATION_VERSION,
  parameters: [
    {
      name: "specification",
      kind: "positional" as const,
      type: "Scene3DSpecification",
      required: true,
      description: "Structured 3D scene definition containing object graph and camera setups.",
    },
    {
      name: "options",
      kind: "option" as const,
      type: "SerializationOptions",
      required: false,
      description: "Formatting and serialization options.",
    },
  ],
  supportedTargets: ["Object"],
  signature: {
    importStatement: 'import { validateSceneSchema, correctSceneSchema } from "af-motion/catalogue";',
    invocation: "const report = validateSceneSchema(specification);",
    exampleCode: "const validSpec = correctSceneSchema({ id: 'hero-3d', objects: [...] });",
  },
  controls: ["validate", "correct", "serialize", "deserialize", "query"],
  callbacks: [],
  reducedMotion: "static-fallback" as const,
  compatibility: { browser: true, ssr: true, requiresDom: false },
  react: {
    available: true,
    componentName: "SceneSchemaProvider",
    hookName: "useSceneSchema",
    importPath: "af-motion/react",
  },
  schema: COMPLETE_SCENE_SCHEMA,
};

/**
 * Dynamically register the Scene Specification capability with an AI Motion Registry.
 */
export function registerSceneSchemaCapability(registry: {
  registerCapability: (cap: any, opts?: any) => void;
}): void {
  registry.registerCapability(SCENE_SPECIFICATION_CAPABILITY, { override: true });
}
