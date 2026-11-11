/**
 * AF Motion 3D Geometry Three.js Adapter
 *
 * Optional conversion of procedural geometry descriptors and buffer data
 * into Three.js BufferGeometry instances.
 */

import type { GeometryBufferData, ProceduralGeometryDescriptor } from "./types.js";
import { generateProceduralGeometry } from "./generators.js";

/**
 * Converts a procedural geometry descriptor or buffer data into a Three.js BufferGeometry.
 */
export function toThreeGeometry(
  descriptorOrBuffer: ProceduralGeometryDescriptor | GeometryBufferData,
  threeInstance?: any
): any {
  // If Three.js is not passed, check global scope safely at call time
  const THREE = threeInstance || (typeof globalThis !== "undefined" && (globalThis as any).THREE);

  if (!THREE) {
    return null;
  }

  // Obtain buffer data
  const bufferData: GeometryBufferData =
    "positions" in descriptorOrBuffer
      ? descriptorOrBuffer
      : generateProceduralGeometry(descriptorOrBuffer);

  const geometry = new THREE.BufferGeometry();

  // Set position attribute
  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(bufferData.positions, 3)
  );

  // Set normal attribute
  if (bufferData.normals && bufferData.normals.length > 0) {
    geometry.setAttribute(
      "normal",
      new THREE.BufferAttribute(bufferData.normals, 3)
    );
  }

  // Set uv attribute
  if (bufferData.uvs && bufferData.uvs.length > 0) {
    geometry.setAttribute(
      "uv",
      new THREE.BufferAttribute(bufferData.uvs, 2)
    );
  }

  // Set index
  if (bufferData.indices && bufferData.indices.length > 0) {
    geometry.setIndex(new THREE.BufferAttribute(bufferData.indices, 1));
  }

  // Compute or set bounding box and sphere
  if (typeof geometry.computeBoundingBox === "function") {
    try {
      geometry.computeBoundingBox();
    } catch {
      // Ignore
    }
  }

  if (typeof geometry.computeBoundingSphere === "function") {
    try {
      geometry.computeBoundingSphere();
    } catch {
      // Ignore
    }
  }

  return geometry;
}

/**
 * Disposes a Three.js geometry instance.
 */
export function disposeThreeGeometry(geometry: any): void {
  if (geometry && typeof geometry.dispose === "function") {
    try {
      geometry.dispose();
    } catch {
      // Ignore
    }
  }
}
