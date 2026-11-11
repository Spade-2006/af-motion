/**
 * AF Motion 3D Procedural Geometry Validation and Correction
 */

import type {
  Geometry3DType,
  GeometryValidationResult,
  ProceduralGeometryDescriptor,
} from "./types.js";

const VALID_GEOMETRY_TYPES = new Set<Geometry3DType>([
  "box",
  "sphere",
  "plane",
  "cylinder",
  "cone",
  "torus",
  "capsule",
  "ring",
  "rounded-box",
  "extrude",
  "parametric",
]);

export function validateGeometryDescriptor(
  descriptor: unknown
): GeometryValidationResult {
  const errors: string[] = [];

  if (!descriptor || typeof descriptor !== "object") {
    return { valid: false, errors: ["Geometry descriptor must be an object."] };
  }

  const d = descriptor as Record<string, unknown>;
  const type = d.type as Geometry3DType;

  if (!type || !VALID_GEOMETRY_TYPES.has(type)) {
    errors.push(`Invalid geometry type '${String(type)}'. Supported: ${Array.from(VALID_GEOMETRY_TYPES).join(", ")}`);
    return { valid: false, errors };
  }

  const checkPositive = (name: string, val: unknown) => {
    if (val !== undefined && (typeof val !== "number" || !Number.isFinite(val) || val <= 0)) {
      errors.push(`Field '${name}' must be a positive finite number.`);
    }
  };

  const checkNonNegative = (name: string, val: unknown) => {
    if (val !== undefined && (typeof val !== "number" || !Number.isFinite(val) || val < 0)) {
      errors.push(`Field '${name}' must be a non-negative finite number.`);
    }
  };

  const checkIntegerMin = (name: string, val: unknown, min: number) => {
    if (val !== undefined && (typeof val !== "number" || !Number.isInteger(val) || val < min)) {
      errors.push(`Field '${name}' must be an integer >= ${min}.`);
    }
  };

  switch (type) {
    case "box":
      checkPositive("width", d.width);
      checkPositive("height", d.height);
      checkPositive("depth", d.depth);
      checkIntegerMin("widthSegments", d.widthSegments, 1);
      checkIntegerMin("heightSegments", d.heightSegments, 1);
      checkIntegerMin("depthSegments", d.depthSegments, 1);
      break;

    case "sphere":
      checkPositive("radius", d.radius);
      checkIntegerMin("widthSegments", d.widthSegments, 3);
      checkIntegerMin("heightSegments", d.heightSegments, 2);
      break;

    case "plane":
      checkPositive("width", d.width);
      checkPositive("height", d.height);
      checkIntegerMin("widthSegments", d.widthSegments, 1);
      checkIntegerMin("heightSegments", d.heightSegments, 1);
      break;

    case "cylinder":
      checkNonNegative("radiusTop", d.radiusTop);
      checkNonNegative("radiusBottom", d.radiusBottom);
      if (d.radiusTop === 0 && d.radiusBottom === 0) {
        errors.push("Cylinder cannot have both radiusTop and radiusBottom equal to 0.");
      }
      checkPositive("height", d.height);
      checkIntegerMin("radialSegments", d.radialSegments, 3);
      break;

    case "cone":
      checkPositive("radius", d.radius);
      checkPositive("height", d.height);
      checkIntegerMin("radialSegments", d.radialSegments, 3);
      break;

    case "torus":
      checkPositive("radius", d.radius);
      checkPositive("tube", d.tube);
      checkIntegerMin("radialSegments", d.radialSegments, 3);
      checkIntegerMin("tubularSegments", d.tubularSegments, 3);
      break;

    case "capsule":
      checkPositive("radius", d.radius);
      checkNonNegative("length", d.length);
      checkIntegerMin("capSubdivisions", d.capSubdivisions, 1);
      checkIntegerMin("radialSegments", d.radialSegments, 3);
      break;

    case "ring":
      checkNonNegative("innerRadius", d.innerRadius);
      checkPositive("outerRadius", d.outerRadius);
      if (typeof d.innerRadius === "number" && typeof d.outerRadius === "number" && d.innerRadius >= d.outerRadius) {
        errors.push("Ring 'innerRadius' must be less than 'outerRadius'.");
      }
      checkIntegerMin("thetaSegments", d.thetaSegments, 3);
      break;

    case "rounded-box":
      checkPositive("width", d.width);
      checkPositive("height", d.height);
      checkPositive("depth", d.depth);
      checkNonNegative("radius", d.radius);
      checkIntegerMin("smoothness", d.smoothness, 1);
      break;

    case "extrude":
      if (!Array.isArray(d.points) || d.points.length < 3) {
        errors.push("Extrude geometry 'points' must be an array of at least 3 [x, y] coordinates.");
      }
      checkPositive("depth", d.depth);
      checkNonNegative("bevelThickness", d.bevelThickness);
      checkNonNegative("bevelSize", d.bevelSize);
      checkIntegerMin("bevelSegments", d.bevelSegments, 1);
      break;

    case "parametric":
      checkIntegerMin("uSegments", d.uSegments, 1);
      checkIntegerMin("vSegments", d.vSegments, 1);
      break;
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function correctGeometryDescriptor(
  descriptor: ProceduralGeometryDescriptor
): ProceduralGeometryDescriptor {
  const type = descriptor.type;

  switch (type) {
    case "box":
      return {
        type: "box",
        width: typeof descriptor.width === "number" && descriptor.width > 0 ? descriptor.width : 1,
        height: typeof descriptor.height === "number" && descriptor.height > 0 ? descriptor.height : 1,
        depth: typeof descriptor.depth === "number" && descriptor.depth > 0 ? descriptor.depth : 1,
        widthSegments: Math.max(1, Math.round(descriptor.widthSegments ?? 1)),
        heightSegments: Math.max(1, Math.round(descriptor.heightSegments ?? 1)),
        depthSegments: Math.max(1, Math.round(descriptor.depthSegments ?? 1)),
      };

    case "sphere":
      return {
        type: "sphere",
        radius: typeof descriptor.radius === "number" && descriptor.radius > 0 ? descriptor.radius : 0.5,
        widthSegments: Math.max(3, Math.round(descriptor.widthSegments ?? 32)),
        heightSegments: Math.max(2, Math.round(descriptor.heightSegments ?? 16)),
        phiStart: descriptor.phiStart ?? 0,
        phiLength: descriptor.phiLength ?? Math.PI * 2,
        thetaStart: descriptor.thetaStart ?? 0,
        thetaLength: descriptor.thetaLength ?? Math.PI,
      };

    case "plane":
      return {
        type: "plane",
        width: typeof descriptor.width === "number" && descriptor.width > 0 ? descriptor.width : 1,
        height: typeof descriptor.height === "number" && descriptor.height > 0 ? descriptor.height : 1,
        widthSegments: Math.max(1, Math.round(descriptor.widthSegments ?? 1)),
        heightSegments: Math.max(1, Math.round(descriptor.heightSegments ?? 1)),
      };

    case "cylinder": {
      const radiusTop = typeof descriptor.radiusTop === "number" && descriptor.radiusTop >= 0 ? descriptor.radiusTop : 0.5;
      const radiusBottom = typeof descriptor.radiusBottom === "number" && descriptor.radiusBottom >= 0 ? descriptor.radiusBottom : 0.5;
      return {
        type: "cylinder",
        radiusTop: radiusTop === 0 && radiusBottom === 0 ? 0.5 : radiusTop,
        radiusBottom: radiusTop === 0 && radiusBottom === 0 ? 0.5 : radiusBottom,
        height: typeof descriptor.height === "number" && descriptor.height > 0 ? descriptor.height : 1,
        radialSegments: Math.max(3, Math.round(descriptor.radialSegments ?? 32)),
        heightSegments: Math.max(1, Math.round(descriptor.heightSegments ?? 1)),
        openEnded: Boolean(descriptor.openEnded),
        thetaStart: descriptor.thetaStart ?? 0,
        thetaLength: descriptor.thetaLength ?? Math.PI * 2,
      };
    }

    case "cone":
      return {
        type: "cone",
        radius: typeof descriptor.radius === "number" && descriptor.radius > 0 ? descriptor.radius : 0.5,
        height: typeof descriptor.height === "number" && descriptor.height > 0 ? descriptor.height : 1,
        radialSegments: Math.max(3, Math.round(descriptor.radialSegments ?? 32)),
        heightSegments: Math.max(1, Math.round(descriptor.heightSegments ?? 1)),
        openEnded: Boolean(descriptor.openEnded),
        thetaStart: descriptor.thetaStart ?? 0,
        thetaLength: descriptor.thetaLength ?? Math.PI * 2,
      };

    case "torus":
      return {
        type: "torus",
        radius: typeof descriptor.radius === "number" && descriptor.radius > 0 ? descriptor.radius : 0.5,
        tube: typeof descriptor.tube === "number" && descriptor.tube > 0 ? descriptor.tube : 0.2,
        radialSegments: Math.max(3, Math.round(descriptor.radialSegments ?? 16)),
        tubularSegments: Math.max(3, Math.round(descriptor.tubularSegments ?? 32)),
        arc: descriptor.arc ?? Math.PI * 2,
      };

    case "capsule":
      return {
        type: "capsule",
        radius: typeof descriptor.radius === "number" && descriptor.radius > 0 ? descriptor.radius : 0.25,
        length: typeof descriptor.length === "number" && descriptor.length >= 0 ? descriptor.length : 1,
        capSubdivisions: Math.max(1, Math.round(descriptor.capSubdivisions ?? 8)),
        radialSegments: Math.max(3, Math.round(descriptor.radialSegments ?? 16)),
      };

    case "ring": {
      const outer = typeof descriptor.outerRadius === "number" && descriptor.outerRadius > 0 ? descriptor.outerRadius : 1;
      const inner = typeof descriptor.innerRadius === "number" && descriptor.innerRadius >= 0 && descriptor.innerRadius < outer
        ? descriptor.innerRadius
        : outer * 0.5;
      return {
        type: "ring",
        innerRadius: inner,
        outerRadius: outer,
        thetaSegments: Math.max(3, Math.round(descriptor.thetaSegments ?? 32)),
        phiSegments: Math.max(1, Math.round(descriptor.phiSegments ?? 1)),
        thetaStart: descriptor.thetaStart ?? 0,
        thetaLength: descriptor.thetaLength ?? Math.PI * 2,
      };
    }

    case "rounded-box": {
      const w = typeof descriptor.width === "number" && descriptor.width > 0 ? descriptor.width : 1;
      const h = typeof descriptor.height === "number" && descriptor.height > 0 ? descriptor.height : 1;
      const d = typeof descriptor.depth === "number" && descriptor.depth > 0 ? descriptor.depth : 1;
      const maxRadius = Math.min(w, h, d) * 0.49;
      const r = typeof descriptor.radius === "number" && descriptor.radius >= 0
        ? Math.min(descriptor.radius, maxRadius)
        : maxRadius * 0.2;

      return {
        type: "rounded-box",
        width: w,
        height: h,
        depth: d,
        radius: r,
        smoothness: Math.max(1, Math.round(descriptor.smoothness ?? 4)),
      };
    }

    case "extrude": {
      let points = descriptor.points;
      if (!Array.isArray(points) || points.length < 3) {
        points = [
          [-0.5, -0.5],
          [0.5, -0.5],
          [0.5, 0.5],
          [-0.5, 0.5],
        ];
      }
      return {
        type: "extrude",
        points,
        depth: typeof descriptor.depth === "number" && descriptor.depth > 0 ? descriptor.depth : 0.2,
        bevelEnabled: Boolean(descriptor.bevelEnabled ?? true),
        bevelThickness: typeof descriptor.bevelThickness === "number" && descriptor.bevelThickness >= 0 ? descriptor.bevelThickness : 0.05,
        bevelSize: typeof descriptor.bevelSize === "number" && descriptor.bevelSize >= 0 ? descriptor.bevelSize : 0.05,
        bevelSegments: Math.max(1, Math.round(descriptor.bevelSegments ?? 3)),
      };
    }

    case "parametric":
      return {
        type: "parametric",
        evaluatorName: descriptor.evaluatorName ?? "plane",
        evaluator: descriptor.evaluator,
        uSegments: Math.max(1, Math.round(descriptor.uSegments ?? 20)),
        vSegments: Math.max(1, Math.round(descriptor.vSegments ?? 20)),
      };
  }
}
