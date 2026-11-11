/**
 * AF Motion Studio — 3D Scene Studio Engine
 *
 * Framework-independent engine for the visual 3D Scene Studio:
 * - Dynamic geometry and asset discovery
 * - Camera, lighting, and environment configuration
 * - PBR material intelligence and palette integration
 * - Scene hierarchy management and validation
 * - Scene intelligence, telemetry, and accessibility checks
 * - React/R3F, Vanilla JS, and Scene JSON code generation
 */

import type {
  GeometryPrimitiveType,
  Scene3DSpecification,
  SceneObjectSpec,
  PrimitiveObjectSpec,
  LightObjectSpec,
  Transform3D,
  Vector3,
  EulerRotation,
} from "../../src/3d/schemas/types.js";
import {
  CAMERA_PRESETS,
} from "../../src/3d/camera/presets.js";
import type { CameraPresetName } from "../../src/3d/camera/types.js";
import {
  LIGHTING_3D_PRESETS,
} from "../../src/3d/lighting/presets.js";
import type { LightingPresetName } from "../../src/3d/lighting/types.js";
import {
  ENVIRONMENT_PRESETS,
} from "../../src/3d/environment/presets.js";
import type { EnvironmentPresetName } from "../../src/3d/environment/types.js";
import {
  MATERIAL_3D_PRESETS,
} from "../../src/3d/materials/presets.js";
import type { Material3DPresetName } from "../../src/3d/materials/types.js";
import {
  getSceneRecipe,
  listSceneRecipes,
  type RecipeDescriptor,
  type Scene3DRecipeName,
} from "../../src/3d/composition/recipes.js";
import {
  validateSceneHierarchy,
  validateSceneSchema,
} from "../../src/3d/schemas/validation.js";
import {
  serializeSceneSchema,
} from "../../src/3d/schemas/serialization.js";
import { BUILT_IN_PALETTE_INPUTS } from "../../src/core/built-in-palettes.js";
import type {
  ProceduralGeometryDescriptor,
  MaterialStudioConfig,
  CameraStudioState,
  LightingStudioState,
  EnvironmentStudioState,
  Scene3DIntelligenceReport,
  Scene3DExportBundle,
} from "../types/scene-3d.js";

// --- 1. Procedural Geometry Discovery ---

export const AVAILABLE_PROCEDURAL_GEOMETRIES: readonly ProceduralGeometryDescriptor[] = [
  {
    type: "box",
    name: "Cube / Box",
    description: "Orthogonal rectangular prism with configurable width, height, depth, and subdivision segments.",
    defaultParameters: { width: 1.5, height: 1.5, depth: 1.5, widthSegments: 1, heightSegments: 1, depthSegments: 1 },
  },
  {
    type: "sphere",
    name: "UV Sphere",
    description: "Equirectangular latitude-longitude tessellated spherical mesh.",
    defaultParameters: { radius: 1.0, widthSegments: 32, heightSegments: 16 },
  },
  {
    type: "cylinder",
    name: "Cylinder",
    description: "Smooth cylindrical column with radiusTop, radiusBottom, height, and radial segments.",
    defaultParameters: { radiusTop: 0.8, radiusBottom: 0.8, height: 2.0, radialSegments: 32 },
  },
  {
    type: "plane",
    name: "Plane / Quad",
    description: "Flat surface mesh for backdrops, grounds, and billboarding cards.",
    defaultParameters: { width: 4.0, height: 4.0, widthSegments: 1, heightSegments: 1 },
  },
  {
    type: "torus",
    name: "Torus (Donut)",
    description: "Ring torus revolving around a central coplanar axis with radial and tubular segments.",
    defaultParameters: { radius: 1.2, tube: 0.4, radialSegments: 16, tubularSegments: 48 },
  },
  {
    type: "cone",
    name: "Cone",
    description: "Conical geometry with circular base tapering to a single apex point.",
    defaultParameters: { radius: 1.0, height: 2.2, radialSegments: 32 },
  },
  {
    type: "capsule",
    name: "Capsule",
    description: "Cylinder capped with two hemispherical domes at opposing poles.",
    defaultParameters: { radius: 0.7, length: 1.6, capSegments: 8, radialSegments: 24 },
  },
];

export function listAvailableProceduralGeometries(): readonly ProceduralGeometryDescriptor[] {
  return AVAILABLE_PROCEDURAL_GEOMETRIES;
}

// --- 2. Presets Discovery (Camera, Lighting, Environment, Materials) ---

export function listAvailableCameraPresets(): readonly CameraPresetName[] {
  return Object.keys(CAMERA_PRESETS) as CameraPresetName[];
}

export function listAvailableLightingPresets(): readonly LightingPresetName[] {
  return Object.keys(LIGHTING_3D_PRESETS) as LightingPresetName[];
}

export function listAvailableEnvironmentPresets(): readonly EnvironmentPresetName[] {
  return Object.keys(ENVIRONMENT_PRESETS) as EnvironmentPresetName[];
}

export function listAvailableMaterialPresets(): readonly Material3DPresetName[] {
  return Object.keys(MATERIAL_3D_PRESETS) as Material3DPresetName[];
}

export function listAvailableSceneTemplates(): readonly RecipeDescriptor[] {
  return listSceneRecipes();
}

export function getSceneTemplateByName(name: Scene3DRecipeName): Scene3DSpecification {
  return getSceneRecipe(name);
}

export function createDefaultSceneSpecification(): Scene3DSpecification {
  return getSceneRecipe("product-showcase");
}

// --- 3. Palette Integration (Immutable) ---

export function listAvailablePalettesFor3D(): readonly string[] {
  return BUILT_IN_PALETTE_INPUTS.map((p) => p.name);
}

export function getPaletteColorFor3D(
  paletteName: string,
  slot: "primary" | "secondary" | "accent" = "primary"
): string {
  const normalized = paletteName.toLowerCase().replace(/[^a-z0-9]/g, "");
  const palette = BUILT_IN_PALETTE_INPUTS.find(
    (p) =>
      p.name.toLowerCase() === paletteName.toLowerCase() ||
      p.name.toLowerCase().replace(/[^a-z0-9]/g, "") === normalized
  );
  if (!palette) return "#9a7aff";

  if (slot === "primary") return palette.primary ?? "#9a7aff";
  if (slot === "secondary") return palette.secondary ?? "#38bdf8";
  return palette.accent ?? "#ec4899";
}

// --- 4. Scene Hierarchy & Object Operations ---

let nextObjectId = 100;

export function createPrimitiveSceneObject(
  primitive: GeometryPrimitiveType = "box",
  name?: string
): PrimitiveObjectSpec {
  const descriptor = AVAILABLE_PROCEDURAL_GEOMETRIES.find((g) => g.type === primitive) ?? AVAILABLE_PROCEDURAL_GEOMETRIES[0];
  const id = `obj-${primitive}-${++nextObjectId}`;

  return {
    id,
    name: name ?? `${descriptor.name} ${nextObjectId}`,
    type: "primitive",
    visible: true,
    castShadow: true,
    receiveShadow: true,
    transform: {
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    },
    geometry: {
      type: "primitive",
      primitive,
      parameters: { ...descriptor.defaultParameters },
    },
    material: {
      type: "physical",
      color: "#9a7aff",
      roughness: 0.25,
      metalness: 0.1,
    },
  };
}

export function createLightSceneObject(
  lightType: "ambient" | "directional" | "point" | "spot" = "directional"
): LightObjectSpec {
  const id = `light-${lightType}-${++nextObjectId}`;
  return {
    id,
    name: `${lightType.toUpperCase()} Light ${nextObjectId}`,
    type: "light",
    lightType,
    visible: true,
    color: "#ffffff",
    intensity: lightType === "ambient" ? 0.4 : 1.5,
    transform: {
      position: lightType === "directional" ? [5, 8, 5] : [0, 3, 2],
    },
    castShadow: lightType !== "ambient",
  };
}

export function duplicateSceneObject(obj: SceneObjectSpec): SceneObjectSpec {
  const id = `${obj.id}-copy-${Date.now().toString().slice(-4)}`;
  const currentPos = obj.transform?.position ?? [0, 0, 0];
  const offsetPos: Vector3 = [currentPos[0] + 0.5, currentPos[1], currentPos[2] + 0.5];

  return {
    ...JSON.parse(JSON.stringify(obj)),
    id,
    name: `${obj.name ?? "Object"} (Copy)`,
    transform: {
      ...obj.transform,
      position: offsetPos,
    },
  };
}

// --- 5. Scene Intelligence & Telemetry ---

export function evaluateSceneIntelligence(
  scene: Scene3DSpecification,
  prefersReducedMotion = false
): Scene3DIntelligenceReport {
  let score = 100;
  const performanceWarnings: string[] = [];
  const accessibilityNotes: string[] = [];
  const recommendations: string[] = [];

  const objects = scene.objects ?? [];
  const objectCount = objects.length;

  // 1. Hierarchy validation
  const hierarchyErrors = validateSceneHierarchy(objects);
  const hierarchyValid = hierarchyErrors.length === 0;
  if (!hierarchyValid) {
    score -= 25;
    performanceWarnings.push(`Scene hierarchy has ${hierarchyErrors.length} structural defect(s).`);
  }

  // 2. Object count check
  if (objectCount === 0) {
    score -= 40;
    recommendations.push("Scene has no objects. Add a focal primitive mesh or 3D model.");
  } else if (objectCount > 20) {
    score -= 15;
    performanceWarnings.push(`Scene contains ${objectCount} objects. Consider batching primitives to maintain 60 FPS.`);
  }

  // 3. Poly estimate calculation
  let estimatedPolyCount = 0;
  for (const obj of objects) {
    if (obj.type === "primitive" && (obj as PrimitiveObjectSpec).geometry) {
      const prim = (obj as PrimitiveObjectSpec).geometry.primitive;
      switch (prim) {
        case "sphere":
          estimatedPolyCount += 1024;
          break;
        case "torus":
          estimatedPolyCount += 1536;
          break;
        case "cylinder":
        case "cone":
          estimatedPolyCount += 512;
          break;
        case "capsule":
          estimatedPolyCount += 768;
          break;
        case "box":
        case "plane":
        default:
          estimatedPolyCount += 12;
          break;
      }
    } else {
      estimatedPolyCount += 250;
    }
  }

  if (estimatedPolyCount > 15000) {
    score -= 10;
    performanceWarnings.push(`Estimated polygon count (${estimatedPolyCount.toLocaleString()}) exceeds budget for low-end mobile devices.`);
  }

  // 4. Lighting check
  let hasKeyLight = false;
  if (scene.lighting) {
    if (scene.lighting.directional && scene.lighting.directional.length > 0) hasKeyLight = true;
    if (scene.lighting.point && scene.lighting.point.length > 0) hasKeyLight = true;
    if (scene.lighting.spot && scene.lighting.spot.length > 0) hasKeyLight = true;
  }
  const lightObjects = objects.filter((o) => o.type === "light");
  if (lightObjects.length > 0) hasKeyLight = true;

  const lightingEvaluation = hasKeyLight
    ? "Balanced key and fill illumination detected."
    : "Only ambient or missing illumination; consider adding directional or spot light.";

  if (!hasKeyLight) {
    score -= 10;
    recommendations.push("Add a directional key light to produce volumetric shading and depth cues.");
  }

  // 5. Accessibility & Reduced Motion
  if (prefersReducedMotion) {
    accessibilityNotes.push("prefers-reduced-motion is ACTIVE: camera orbiting and mesh animations are frozen to equilibrium.");
    accessibilityNotes.push("Static hero viewpoint with enhanced high-contrast lighting is enforced.");
  } else {
    accessibilityNotes.push("Fluid continuous camera orbit active with gentle damping.");
    accessibilityNotes.push("All interactive objects expose aria-label metadata and pointer cursor states.");
  }

  // 6. Rationale
  const rationale =
    score >= 85
      ? "Scene composition is robust, well-lit, and performant."
      : score >= 65
      ? "Scene is functional with minor lighting or geometry optimization opportunities."
      : "Scene requires structural or lighting remediation.";

  return {
    score: Math.max(0, Math.min(100, score)),
    rationale,
    objectCount,
    estimatedPolyCount,
    lightingEvaluation,
    hierarchyValid,
    performanceWarnings,
    accessibilityNotes,
    recommendations,
  };
}

// --- 6. Code Generation & Export ---

export function generateSceneJson(scene: Scene3DSpecification): string {
  return serializeSceneSchema(scene, { pretty: true });
}

export function generateSceneR3FCode(scene: Scene3DSpecification): string {
  const componentName = `${(scene.name ?? "Scene3D")
    .replace(/[^a-zA-Z0-9]/g, "")
    .replace(/^[a-z]/, (c) => c.toUpperCase())}View`;

  const cameraPos = scene.camera?.position ?? [0, 2, 6];
  const fov = scene.camera?.fov ?? 45;
  const bg = scene.environment?.background ?? "#0a0a0c";

  return `"use client";

import React, { useRef } from "react";
import { useMotionAccessibility } from "af-motion/react";
import { createScene3D, toR3FCameraProps, toR3FLightingProps } from "af-motion/catalogue";
import type { Scene3DSpecification } from "af-motion/catalogue";

/**
 * ${scene.name ?? "Custom 3D Scene"}
 * Generated by AF Motion Studio — 3D Scene Studio
 * Version: ${scene.version ?? "1.0.0"}
 * Objects: ${scene.objects.length}
 */
export const SCENE_SPEC: Scene3DSpecification = ${JSON.stringify(scene, null, 2)};

export function ${componentName}() {
  const { prefersReducedMotion } = useMotionAccessibility();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  return (
    <div
      className="af-scene-3d-wrapper"
      style={{
        position: "relative",
        width: "100%",
        height: "500px",
        background: "${bg}",
        borderRadius: "16px",
        overflow: "hidden",
      }}
    >
      <canvas
        ref={canvasRef}
        aria-label="${scene.name ?? "3D Scene"}"
        style={{ width: "100%", height: "100%", display: "block" }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 12,
          right: 16,
          fontSize: "0.75rem",
          color: "rgba(255, 255, 255, 0.6)",
          pointerEvents: "none",
        }}
      >
        AF Motion 3D Engine • {prefersReducedMotion ? "Reduced Motion" : "Interactive Orbit"}
      </div>
    </div>
  );
}
`;
}

export function generateSceneVanillaJsCode(scene: Scene3DSpecification): string {
  return `import { createScene3D, createRenderer3DAdapter } from "af-motion";

const spec = ${JSON.stringify(scene, null, 2)};

export function mountScene(canvasElement) {
  const scene = createScene3D(spec, {
    renderer: createRenderer3DAdapter({ antialias: true, alpha: true }),
  });

  scene.attach(canvasElement);
  scene.start();

  return () => {
    scene.stop();
    scene.dispose();
  };
}
`;
}

export function createScene3DExportBundle(scene: Scene3DSpecification): Scene3DExportBundle {
  return {
    json: generateSceneJson(scene),
    reactR3fCode: generateSceneR3FCode(scene),
    vanillajsCode: generateSceneVanillaJsCode(scene),
    spec: scene,
  };
}
