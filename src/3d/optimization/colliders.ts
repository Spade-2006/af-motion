/**
 * AF Motion — 3D Automatic Collider Generation & Physics Fitting
 *
 * Recommends and generates optimal 3D physics colliders (Box, Sphere, Capsule, Convex)
 * based on geometric principal extents, aspect ratios, and computational budgets.
 */

import type { Vector3, Collider3D } from "../physics/types.js";
import type { GeometryBufferData } from "../geometry/types.js";
import type {
  Mesh3DData,
  Model3DData,
  ModelAnalysisReport,
  ColliderRecommendation,
  RecommendedColliderType,
} from "./types.js";
import {
  createBoxShape,
  createSphereShape,
  createCapsuleShape,
  createConvexShape,
  createCollider3D,
} from "../physics/collision/shapes.js";
import { analyzeModel3D } from "./analysis.js";

/**
 * Automatically fits and recommends an optimal 3D physics collider for a mesh or model.
 */
export function generateModelCollider(
  input: Mesh3DData | GeometryBufferData | Model3DData | ModelAnalysisReport,
  options: {
    preferredType?: "auto" | RecommendedColliderType;
    type?: "auto" | RecommendedColliderType;
    id?: string;
  } = {}
): ColliderRecommendation {
  const preferred = options.preferredType ?? options.type ?? "auto";

  let bounds: ModelAnalysisReport["bounds"];
  let positions: Float32Array | undefined;

  if ("bounds" in input && input.bounds && input.bounds.aabb) {
    bounds = input.bounds;
  } else {
    const report = analyzeModel3D(input);
    bounds = report.bounds;
    if ("positions" in input && input.positions instanceof Float32Array) {
      positions = input.positions;
    } else if ("meshes" in input && Array.isArray(input.meshes) && input.meshes[0]?.positions) {
      positions = input.meshes[0].positions;
    }
  }

  const { center, dimensions, boundingSphereRadius } = bounds;
  const dx = Math.max(0.01, dimensions.x);
  const dy = Math.max(0.01, dimensions.y);
  const dz = Math.max(0.01, dimensions.z);

  const halfExtents: Vector3 = {
    x: dx * 0.5,
    y: dy * 0.5,
    z: dz * 0.5,
  };

  // Determine aspect ratios
  const maxDim = Math.max(dx, dy, dz);
  const minDim = Math.min(dx, dy, dz);
  const midDim = dx + dy + dz - maxDim - minDim;

  let chosenType: RecommendedColliderType = "box";
  let reason = "Axis-aligned bounding box provides optimal performance balance.";
  let confidence = 0.85;
  let accuracyEstimate = 0.8;
  let computationalCost: "minimal" | "low" | "medium" | "high" = "minimal";

  if (preferred !== "auto") {
    chosenType = preferred;
    reason = `User preferred collider type: ${preferred}`;
  } else {
    // 1. Sphere check: all dimensions within 18% of each other
    if (minDim / maxDim > 0.82) {
      chosenType = "sphere";
      reason = "Geometry is nearly isometric; bounding sphere offers the fastest narrowphase resolution.";
      confidence = 0.95;
      accuracyEstimate = 0.9;
      computationalCost = "minimal";
    }
    // 2. Capsule check: one axis is dominant (> 1.8x others)
    else if (maxDim / midDim > 1.8 && midDim / minDim < 1.4) {
      chosenType = "capsule";
      reason = "Elongated geometry matches capsule shape with hemispherical caps.";
      confidence = 0.9;
      accuracyEstimate = 0.88;
      computationalCost = "low";
    }
    // 3. Convex check: large complexity where box has poor volume efficiency
    else if (boundingSphereRadius > 5 && maxDim / minDim > 2.5) {
      chosenType = "convex";
      reason = "Non-isometric geometry with concavities benefits from simplified convex hull.";
      confidence = 0.8;
      accuracyEstimate = 0.92;
      computationalCost = "medium";
    } else {
      chosenType = "box";
      reason = "Cuboid bounds provide optimal impulse stability and minimal solver cost.";
      confidence = 0.9;
      accuracyEstimate = 0.85;
      computationalCost = "minimal";
    }
  }

  let collider: Collider3D;
  const colId = options.id ?? `col-${chosenType}-${Date.now()}`;
  let radius: number | undefined;
  let height: number | undefined;
  let vertices: Float32Array | undefined;

  switch (chosenType) {
    case "sphere": {
      radius = boundingSphereRadius || maxDim * 0.5;
      collider = createCollider3D(createSphereShape(radius), {
        id: colId,
        offset: {
          position: center,
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          scale: { x: 1, y: 1, z: 1 },
        },
      });
      break;
    }

    case "capsule": {
      let axis: "x" | "y" | "z" = "y";
      radius = minDim * 0.5;
      height = maxDim - radius * 2;
      if (height < 0.1) height = maxDim * 0.5;

      if (dx === maxDim) axis = "x";
      else if (dz === maxDim) axis = "z";

      collider = createCollider3D(createCapsuleShape(radius, height, axis), {
        id: colId,
        offset: {
          position: center,
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          scale: { x: 1, y: 1, z: 1 },
        },
      });
      break;
    }

    case "convex": {
      if (positions && positions.length >= 24) {
        vertices = new Float32Array(24 * 3);
        const step = Math.floor(positions.length / (24 * 3));
        for (let i = 0; i < 24; i++) {
          const sIdx = i * step * 3;
          vertices[i * 3] = positions[sIdx] - center.x;
          vertices[i * 3 + 1] = positions[sIdx + 1] - center.y;
          vertices[i * 3 + 2] = positions[sIdx + 2] - center.z;
        }
      } else {
        vertices = new Float32Array([
          -halfExtents.x, -halfExtents.y, -halfExtents.z,
          -halfExtents.x, -halfExtents.y, halfExtents.z,
          -halfExtents.x, halfExtents.y, -halfExtents.z,
          -halfExtents.x, halfExtents.y, halfExtents.z,
          halfExtents.x, -halfExtents.y, -halfExtents.z,
          halfExtents.x, -halfExtents.y, halfExtents.z,
          halfExtents.x, halfExtents.y, -halfExtents.z,
          halfExtents.x, halfExtents.y, halfExtents.z,
        ]);
      }

      collider = createCollider3D(createConvexShape(vertices), {
        id: colId,
        offset: {
          position: center,
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          scale: { x: 1, y: 1, z: 1 },
        },
      });
      break;
    }

    case "box":
    default: {
      collider = createCollider3D(createBoxShape(halfExtents), {
        id: colId,
        offset: {
          position: center,
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          scale: { x: 1, y: 1, z: 1 },
        },
      });
      break;
    }
  }

  return {
    type: chosenType,
    collider,
    center,
    halfExtents: chosenType === "box" ? halfExtents : undefined,
    radius,
    height,
    vertices,
    confidence,
    accuracyEstimate,
    computationalCost,
    reason,
  };
}
