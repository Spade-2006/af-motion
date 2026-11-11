/**
 * AF Motion 3D Procedural Geometry Types
 *
 * Framework-independent geometry configurations, buffer data contracts,
 * and procedural shape descriptors.
 */

import type { BoundingBox3D } from "../schemas/types.js";

export type Geometry3DType =
  | "box"
  | "sphere"
  | "plane"
  | "cylinder"
  | "cone"
  | "torus"
  | "capsule"
  | "ring"
  | "rounded-box"
  | "extrude"
  | "parametric";

export interface GeometryBufferData {
  readonly type: Geometry3DType;
  readonly positions: Float32Array;
  readonly normals: Float32Array;
  readonly uvs: Float32Array;
  readonly indices?: Uint16Array | Uint32Array;
  readonly vertexCount: number;
  readonly triangleCount: number;
  readonly boundingBox: BoundingBox3D;
  readonly generatedAt?: number;
}

export interface BoxGeometryConfig {
  readonly type: "box";
  readonly width?: number;
  readonly height?: number;
  readonly depth?: number;
  readonly widthSegments?: number;
  readonly heightSegments?: number;
  readonly depthSegments?: number;
}

export interface SphereGeometryConfig {
  readonly type: "sphere";
  readonly radius?: number;
  readonly widthSegments?: number;
  readonly heightSegments?: number;
  readonly phiStart?: number;
  readonly phiLength?: number;
  readonly thetaStart?: number;
  readonly thetaLength?: number;
}

export interface PlaneGeometryConfig {
  readonly type: "plane";
  readonly width?: number;
  readonly height?: number;
  readonly widthSegments?: number;
  readonly heightSegments?: number;
}

export interface CylinderGeometryConfig {
  readonly type: "cylinder";
  readonly radiusTop?: number;
  readonly radiusBottom?: number;
  readonly height?: number;
  readonly radialSegments?: number;
  readonly heightSegments?: number;
  readonly openEnded?: boolean;
  readonly thetaStart?: number;
  readonly thetaLength?: number;
}

export interface ConeGeometryConfig {
  readonly type: "cone";
  readonly radius?: number;
  readonly height?: number;
  readonly radialSegments?: number;
  readonly heightSegments?: number;
  readonly openEnded?: boolean;
  readonly thetaStart?: number;
  readonly thetaLength?: number;
}

export interface TorusGeometryConfig {
  readonly type: "torus";
  readonly radius?: number;
  readonly tube?: number;
  readonly radialSegments?: number;
  readonly tubularSegments?: number;
  readonly arc?: number;
}

export interface CapsuleGeometryConfig {
  readonly type: "capsule";
  readonly radius?: number;
  readonly length?: number;
  readonly capSubdivisions?: number;
  readonly radialSegments?: number;
}

export interface RingGeometryConfig {
  readonly type: "ring";
  readonly innerRadius?: number;
  readonly outerRadius?: number;
  readonly thetaSegments?: number;
  readonly phiSegments?: number;
  readonly thetaStart?: number;
  readonly thetaLength?: number;
}

export interface RoundedBoxGeometryConfig {
  readonly type: "rounded-box";
  readonly width?: number;
  readonly height?: number;
  readonly depth?: number;
  readonly radius?: number;
  readonly smoothness?: number;
}

export interface ExtrudeGeometryConfig {
  readonly type: "extrude";
  readonly points: readonly (readonly [number, number])[];
  readonly depth?: number;
  readonly bevelEnabled?: boolean;
  readonly bevelThickness?: number;
  readonly bevelSize?: number;
  readonly bevelSegments?: number;
}

export type ParametricEvaluator = (
  u: number,
  v: number,
  target: [number, number, number]
) => void;

export interface ParametricGeometryConfig {
  readonly type: "parametric";
  readonly evaluatorName?: "plane" | "wave" | "sphere" | "klein" | "mobius" | "torus-knot";
  readonly evaluator?: ParametricEvaluator;
  readonly uSegments?: number;
  readonly vSegments?: number;
}

export type ProceduralGeometryDescriptor =
  | BoxGeometryConfig
  | SphereGeometryConfig
  | PlaneGeometryConfig
  | CylinderGeometryConfig
  | ConeGeometryConfig
  | TorusGeometryConfig
  | CapsuleGeometryConfig
  | RingGeometryConfig
  | RoundedBoxGeometryConfig
  | ExtrudeGeometryConfig
  | ParametricGeometryConfig;

export interface GeometryValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}
