/**
 * AF Motion 3D Procedural Geometry Generators
 *
 * Framework-independent mathematical generators for 11 procedural 3D geometries.
 * Computes deterministic vertices, normals, UVs, indices, and bounding boxes.
 */

import type { BoundingBox3D } from "../schemas/types.js";
import type {
  BoxGeometryConfig,
  CapsuleGeometryConfig,
  ConeGeometryConfig,
  CylinderGeometryConfig,
  ExtrudeGeometryConfig,
  GeometryBufferData,
  ParametricEvaluator,
  ParametricGeometryConfig,
  PlaneGeometryConfig,
  ProceduralGeometryDescriptor,
  RingGeometryConfig,
  RoundedBoxGeometryConfig,
  SphereGeometryConfig,
  TorusGeometryConfig,
} from "./types.js";
import { correctGeometryDescriptor } from "./validation.js";

/**
 * Computes min, max, size, and center from a flat Float32Array of [x, y, z] vertex positions.
 */
export function computeBoundingBoxFromPositions(positions: Float32Array): BoundingBox3D {
  if (positions.length === 0) {
    return {
      min: [0, 0, 0],
      max: [0, 0, 0],
      size: [0, 0, 0],
      center: [0, 0, 0],
    };
  }

  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;

  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    const z = positions[i + 2];
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (z < minZ) minZ = z;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
    if (z > maxZ) maxZ = z;
  }

  const sizeX = maxX - minX;
  const sizeY = maxY - minY;
  const sizeZ = maxZ - minZ;

  return {
    min: [minX, minY, minZ],
    max: [maxX, maxY, maxZ],
    size: [sizeX, sizeY, sizeZ],
    center: [minX + sizeX / 2, minY + sizeY / 2, minZ + sizeZ / 2],
  };
}

/**
 * Creates indices array (Uint16Array if count < 65536, else Uint32Array).
 */
function createIndicesArray(indices: number[]): Uint16Array | Uint32Array {
  return indices.length > 65535 ? new Uint32Array(indices) : new Uint16Array(indices);
}

// -------------------------------------------------------------
// 1. Box Generator
// -------------------------------------------------------------
export function generateBoxGeometry(rawConfig?: BoxGeometryConfig): GeometryBufferData {
  const config = (rawConfig ? correctGeometryDescriptor(rawConfig) : correctGeometryDescriptor({ type: "box" })) as BoxGeometryConfig;
  const { width = 1, height = 1, depth = 1, widthSegments = 1, heightSegments = 1, depthSegments = 1 } = config;

  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  let numberOfVertices = 0;

  const buildPlane = (
    u: 0 | 1 | 2,
    v: 0 | 1 | 2,
    w: 0 | 1 | 2,
    udir: number,
    vdir: number,
    widthVal: number,
    heightVal: number,
    depthVal: number,
    gridX: number,
    gridY: number
  ) => {
    const segmentWidth = widthVal / gridX;
    const segmentHeight = heightVal / gridY;
    const widthHalf = widthVal / 2;
    const heightHalf = heightVal / 2;
    const depthHalf = depthVal / 2;
    const gridX1 = gridX + 1;
    const gridY1 = gridY + 1;

    let vertexCounter = 0;

    const normal = [0, 0, 0];
    normal[w] = depthVal > 0 ? 1 : -1;

    for (let iy = 0; iy < gridY1; iy++) {
      const y = iy * segmentHeight - heightHalf;
      for (let ix = 0; ix < gridX1; ix++) {
        const x = ix * segmentWidth - widthHalf;
        const vertex = [0, 0, 0];
        vertex[u] = x * udir;
        vertex[v] = y * vdir;
        vertex[w] = depthHalf;

        positions.push(vertex[0], vertex[1], vertex[2]);
        normals.push(normal[0], normal[1], normal[2]);
        uvs.push(ix / gridX, 1 - iy / gridY);
        vertexCounter += 1;
      }
    }

    for (let iy = 0; iy < gridY; iy++) {
      for (let ix = 0; ix < gridX; ix++) {
        const a = numberOfVertices + ix + gridX1 * iy;
        const b = numberOfVertices + ix + gridX1 * (iy + 1);
        const c = numberOfVertices + (ix + 1) + gridX1 * (iy + 1);
        const d = numberOfVertices + (ix + 1) + gridX1 * iy;

        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }

    numberOfVertices += vertexCounter;
  };

  buildPlane(2, 1, 0, -1, -1, depth, height, width, depthSegments, heightSegments); // +px
  buildPlane(2, 1, 0, 1, -1, depth, height, -width, depthSegments, heightSegments); // -nx
  buildPlane(0, 2, 1, 1, 1, width, depth, height, widthSegments, depthSegments); // +py
  buildPlane(0, 2, 1, 1, -1, width, depth, -height, widthSegments, depthSegments); // -ny
  buildPlane(0, 1, 2, 1, -1, width, height, depth, widthSegments, heightSegments); // +pz
  buildPlane(0, 1, 2, -1, -1, width, height, -depth, widthSegments, heightSegments); // -nz

  const posArr = new Float32Array(positions);
  return {
    type: "box",
    positions: posArr,
    normals: new Float32Array(normals),
    uvs: new Float32Array(uvs),
    indices: createIndicesArray(indices),
    vertexCount: posArr.length / 3,
    triangleCount: indices.length / 3,
    boundingBox: computeBoundingBoxFromPositions(posArr),
    generatedAt: Date.now(),
  };
}

// -------------------------------------------------------------
// 2. Sphere Generator
// -------------------------------------------------------------
export function generateSphereGeometry(rawConfig?: SphereGeometryConfig): GeometryBufferData {
  const config = (rawConfig ? correctGeometryDescriptor(rawConfig) : correctGeometryDescriptor({ type: "sphere" })) as SphereGeometryConfig;
  const {
    radius = 0.5,
    widthSegments = 32,
    heightSegments = 16,
    phiStart = 0,
    phiLength = Math.PI * 2,
    thetaStart = 0,
    thetaLength = Math.PI,
  } = config;

  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const grid: number[][] = [];
  let index = 0;

  for (let iy = 0; iy <= heightSegments; iy++) {
    const verticesRow: number[] = [];
    const v = iy / heightSegments;
    const uOffset = iy === 0 ? 0.5 / widthSegments : iy === heightSegments ? -0.5 / widthSegments : 0;

    for (let ix = 0; ix <= widthSegments; ix++) {
      const u = ix / widthSegments;

      const x = -radius * Math.cos(phiStart + u * phiLength) * Math.sin(thetaStart + v * thetaLength);
      const y = radius * Math.cos(thetaStart + v * thetaLength);
      const z = radius * Math.sin(phiStart + u * phiLength) * Math.sin(thetaStart + v * thetaLength);

      positions.push(x, y, z);

      // Normal = unit vector from origin
      const len = Math.hypot(x, y, z) || 1;
      normals.push(x / len, y / len, z / len);
      uvs.push(u + uOffset, 1 - v);

      verticesRow.push(index++);
    }
    grid.push(verticesRow);
  }

  for (let iy = 0; iy < heightSegments; iy++) {
    for (let ix = 0; ix < widthSegments; ix++) {
      const a = grid[iy][ix + 1];
      const b = grid[iy][ix];
      const c = grid[iy + 1][ix];
      const d = grid[iy + 1][ix + 1];

      if (iy !== 0 || thetaStart > 0) indices.push(a, b, d);
      if (iy !== heightSegments - 1 || thetaStart + thetaLength < Math.PI) indices.push(b, c, d);
    }
  }

  const posArr = new Float32Array(positions);
  return {
    type: "sphere",
    positions: posArr,
    normals: new Float32Array(normals),
    uvs: new Float32Array(uvs),
    indices: createIndicesArray(indices),
    vertexCount: posArr.length / 3,
    triangleCount: indices.length / 3,
    boundingBox: computeBoundingBoxFromPositions(posArr),
    generatedAt: Date.now(),
  };
}

// -------------------------------------------------------------
// 3. Plane Generator
// -------------------------------------------------------------
export function generatePlaneGeometry(rawConfig?: PlaneGeometryConfig): GeometryBufferData {
  const config = (rawConfig ? correctGeometryDescriptor(rawConfig) : correctGeometryDescriptor({ type: "plane" })) as PlaneGeometryConfig;
  const { width = 1, height = 1, widthSegments = 1, heightSegments = 1 } = config;

  const widthHalf = width / 2;
  const heightHalf = height / 2;
  const gridX1 = widthSegments + 1;
  const gridY1 = heightSegments + 1;
  const segmentWidth = width / widthSegments;
  const segmentHeight = height / heightSegments;

  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let iy = 0; iy < gridY1; iy++) {
    const y = iy * segmentHeight - heightHalf;
    for (let ix = 0; ix < gridX1; ix++) {
      const x = ix * segmentWidth - widthHalf;
      positions.push(x, -y, 0);
      normals.push(0, 0, 1);
      uvs.push(ix / widthSegments, 1 - iy / heightSegments);
    }
  }

  for (let iy = 0; iy < heightSegments; iy++) {
    for (let ix = 0; ix < widthSegments; ix++) {
      const a = ix + gridX1 * iy;
      const b = ix + gridX1 * (iy + 1);
      const c = ix + 1 + gridX1 * (iy + 1);
      const d = ix + 1 + gridX1 * iy;
      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const posArr = new Float32Array(positions);
  return {
    type: "plane",
    positions: posArr,
    normals: new Float32Array(normals),
    uvs: new Float32Array(uvs),
    indices: createIndicesArray(indices),
    vertexCount: posArr.length / 3,
    triangleCount: indices.length / 3,
    boundingBox: computeBoundingBoxFromPositions(posArr),
    generatedAt: Date.now(),
  };
}

// -------------------------------------------------------------
// 4. Cylinder Generator
// -------------------------------------------------------------
export function generateCylinderGeometry(rawConfig?: CylinderGeometryConfig): GeometryBufferData {
  const config = (rawConfig ? correctGeometryDescriptor(rawConfig) : correctGeometryDescriptor({ type: "cylinder" })) as CylinderGeometryConfig;
  const {
    radiusTop = 0.5,
    radiusBottom = 0.5,
    height = 1,
    radialSegments = 32,
    heightSegments = 1,
    openEnded = false,
    thetaStart = 0,
    thetaLength = Math.PI * 2,
  } = config;

  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  let index = 0;
  const indexArray: number[][] = [];
  const halfHeight = height / 2;

  // Slope for normals
  const slope = (radiusBottom - radiusTop) / height;

  // Torso
  for (let y = 0; y <= heightSegments; y++) {
    const indexRow: number[] = [];
    const v = y / heightSegments;
    const radius = v * (radiusBottom - radiusTop) + radiusTop;

    for (let x = 0; x <= radialSegments; x++) {
      const u = x / radialSegments;
      const theta = u * thetaLength + thetaStart;
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);

      positions.push(radius * sinTheta, -v * height + halfHeight, radius * cosTheta);

      const nX = sinTheta;
      const nY = slope;
      const nZ = cosTheta;
      const nLen = Math.hypot(nX, nY, nZ) || 1;
      normals.push(nX / nLen, nY / nLen, nZ / nLen);

      uvs.push(u, 1 - v);
      indexRow.push(index++);
    }
    indexArray.push(indexRow);
  }

  for (let x = 0; x < radialSegments; x++) {
    for (let y = 0; y < heightSegments; y++) {
      const a = indexArray[y][x];
      const b = indexArray[y + 1][x];
      const c = indexArray[y + 1][x + 1];
      const d = indexArray[y][x + 1];

      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  // Caps
  if (!openEnded) {
    const generateCap = (top: boolean) => {
      const centerIndexStart = index;
      const radius = top ? radiusTop : radiusBottom;
      const sign = top ? 1 : -1;

      // Center vertex
      positions.push(0, halfHeight * sign, 0);
      normals.push(0, sign, 0);
      uvs.push(0.5, 0.5);
      index++;

      for (let x = 0; x <= radialSegments; x++) {
        const u = x / radialSegments;
        const theta = u * thetaLength + thetaStart;
        const cosTheta = Math.cos(theta);
        const sinTheta = Math.sin(theta);

        positions.push(radius * sinTheta, halfHeight * sign, radius * cosTheta);
        normals.push(0, sign, 0);
        uvs.push(cosTheta * 0.5 + 0.5, sinTheta * 0.5 * sign + 0.5);
        index++;
      }

      for (let x = 0; x < radialSegments; x++) {
        const c = centerIndexStart;
        const i1 = centerIndexStart + 1 + x;
        const i2 = centerIndexStart + 2 + x;

        if (top) {
          indices.push(i1, i2, c);
        } else {
          indices.push(i2, i1, c);
        }
      }
    };

    if (radiusTop > 0) generateCap(true);
    if (radiusBottom > 0) generateCap(false);
  }

  const posArr = new Float32Array(positions);
  return {
    type: "cylinder",
    positions: posArr,
    normals: new Float32Array(normals),
    uvs: new Float32Array(uvs),
    indices: createIndicesArray(indices),
    vertexCount: posArr.length / 3,
    triangleCount: indices.length / 3,
    boundingBox: computeBoundingBoxFromPositions(posArr),
    generatedAt: Date.now(),
  };
}

// -------------------------------------------------------------
// 5. Cone Generator
// -------------------------------------------------------------
export function generateConeGeometry(rawConfig?: ConeGeometryConfig): GeometryBufferData {
  const config = (rawConfig ? correctGeometryDescriptor(rawConfig) : correctGeometryDescriptor({ type: "cone" })) as ConeGeometryConfig;
  const cylinderConfig: CylinderGeometryConfig = {
    type: "cylinder",
    radiusTop: 0,
    radiusBottom: config.radius ?? 0.5,
    height: config.height ?? 1,
    radialSegments: config.radialSegments ?? 32,
    heightSegments: config.heightSegments ?? 1,
    openEnded: config.openEnded ?? false,
    thetaStart: config.thetaStart ?? 0,
    thetaLength: config.thetaLength ?? Math.PI * 2,
  };

  const geom = generateCylinderGeometry(cylinderConfig);
  return {
    ...geom,
    type: "cone",
  };
}

// -------------------------------------------------------------
// 6. Torus Generator
// -------------------------------------------------------------
export function generateTorusGeometry(rawConfig?: TorusGeometryConfig): GeometryBufferData {
  const config = (rawConfig ? correctGeometryDescriptor(rawConfig) : correctGeometryDescriptor({ type: "torus" })) as TorusGeometryConfig;
  const {
    radius = 0.5,
    tube = 0.2,
    radialSegments = 16,
    tubularSegments = 32,
    arc = Math.PI * 2,
  } = config;

  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let j = 0; j <= radialSegments; j++) {
    for (let i = 0; i <= tubularSegments; i++) {
      const u = (i / tubularSegments) * arc;
      const v = (j / radialSegments) * Math.PI * 2;

      const x = (radius + tube * Math.cos(v)) * Math.cos(u);
      const y = (radius + tube * Math.cos(v)) * Math.sin(u);
      const z = tube * Math.sin(v);

      positions.push(x, y, z);

      // Center of torus ring cross-section
      const cx = radius * Math.cos(u);
      const cy = radius * Math.sin(u);
      const cz = 0;

      const nx = x - cx;
      const ny = y - cy;
      const nz = z - cz;
      const nLen = Math.hypot(nx, ny, nz) || 1;

      normals.push(nx / nLen, ny / nLen, nz / nLen);
      uvs.push(i / tubularSegments, j / radialSegments);
    }
  }

  for (let j = 1; j <= radialSegments; j++) {
    for (let i = 1; i <= tubularSegments; i++) {
      const a = (tubularSegments + 1) * j + i - 1;
      const b = (tubularSegments + 1) * (j - 1) + i - 1;
      const c = (tubularSegments + 1) * (j - 1) + i;
      const d = (tubularSegments + 1) * j + i;

      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const posArr = new Float32Array(positions);
  return {
    type: "torus",
    positions: posArr,
    normals: new Float32Array(normals),
    uvs: new Float32Array(uvs),
    indices: createIndicesArray(indices),
    vertexCount: posArr.length / 3,
    triangleCount: indices.length / 3,
    boundingBox: computeBoundingBoxFromPositions(posArr),
    generatedAt: Date.now(),
  };
}

// -------------------------------------------------------------
// 7. Capsule Generator
// -------------------------------------------------------------
export function generateCapsuleGeometry(rawConfig?: CapsuleGeometryConfig): GeometryBufferData {
  const config = (rawConfig ? correctGeometryDescriptor(rawConfig) : correctGeometryDescriptor({ type: "capsule" })) as CapsuleGeometryConfig;
  const { radius = 0.25, length = 1, capSubdivisions = 8, radialSegments = 16 } = config;

  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const halfLength = length / 2;
  const totalRings = capSubdivisions * 2 + 1; // top cap + bottom cap + cylinder slice

  let index = 0;
  const grid: number[][] = [];

  for (let r = 0; r <= totalRings; r++) {
    const row: number[] = [];
    let phi = 0;
    let yOffset = 0;

    if (r <= capSubdivisions) {
      // Top hemisphere
      phi = (r / capSubdivisions) * (Math.PI / 2);
      yOffset = halfLength;
    } else {
      // Bottom hemisphere
      const br = r - capSubdivisions - 1;
      phi = Math.PI / 2 + (br / capSubdivisions) * (Math.PI / 2);
      yOffset = -halfLength;
    }

    const sinPhi = Math.sin(phi);
    const cosPhi = Math.cos(phi);

    for (let s = 0; s <= radialSegments; s++) {
      const u = s / radialSegments;
      const theta = u * Math.PI * 2;
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);

      const x = radius * sinPhi * cosTheta;
      const y = radius * cosPhi + yOffset;
      const z = radius * sinPhi * sinTheta;

      positions.push(x, y, z);

      // Normal
      const nx = sinPhi * cosTheta;
      const ny = cosPhi;
      const nz = sinPhi * sinTheta;
      normals.push(nx, ny, nz);

      uvs.push(u, r / totalRings);
      row.push(index++);
    }
    grid.push(row);
  }

  for (let r = 0; r < totalRings; r++) {
    for (let s = 0; s < radialSegments; s++) {
      const a = grid[r][s];
      const b = grid[r + 1][s];
      const c = grid[r + 1][s + 1];
      const d = grid[r][s + 1];

      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const posArr = new Float32Array(positions);
  return {
    type: "capsule",
    positions: posArr,
    normals: new Float32Array(normals),
    uvs: new Float32Array(uvs),
    indices: createIndicesArray(indices),
    vertexCount: posArr.length / 3,
    triangleCount: indices.length / 3,
    boundingBox: computeBoundingBoxFromPositions(posArr),
    generatedAt: Date.now(),
  };
}

// -------------------------------------------------------------
// 8. Ring Generator
// -------------------------------------------------------------
export function generateRingGeometry(rawConfig?: RingGeometryConfig): GeometryBufferData {
  const config = (rawConfig ? correctGeometryDescriptor(rawConfig) : correctGeometryDescriptor({ type: "ring" })) as RingGeometryConfig;
  const {
    innerRadius = 0.5,
    outerRadius = 1,
    thetaSegments = 32,
    phiSegments = 1,
    thetaStart = 0,
    thetaLength = Math.PI * 2,
  } = config;

  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let j = 0; j <= phiSegments; j++) {
    const radius = innerRadius + (j / phiSegments) * (outerRadius - innerRadius);
    for (let i = 0; i <= thetaSegments; i++) {
      const u = i / thetaSegments;
      const theta = thetaStart + u * thetaLength;
      const cos = Math.cos(theta);
      const sin = Math.sin(theta);

      positions.push(radius * cos, radius * sin, 0);
      normals.push(0, 0, 1);
      uvs.push((cos * radius) / outerRadius * 0.5 + 0.5, (sin * radius) / outerRadius * 0.5 + 0.5);
    }
  }

  for (let j = 0; j < phiSegments; j++) {
    const thetaSegmentLen = thetaSegments + 1;
    for (let i = 0; i < thetaSegments; i++) {
      const a = i + j * thetaSegmentLen;
      const b = i + (j + 1) * thetaSegmentLen;
      const c = i + 1 + (j + 1) * thetaSegmentLen;
      const d = i + 1 + j * thetaSegmentLen;

      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const posArr = new Float32Array(positions);
  return {
    type: "ring",
    positions: posArr,
    normals: new Float32Array(normals),
    uvs: new Float32Array(uvs),
    indices: createIndicesArray(indices),
    vertexCount: posArr.length / 3,
    triangleCount: indices.length / 3,
    boundingBox: computeBoundingBoxFromPositions(posArr),
    generatedAt: Date.now(),
  };
}

// -------------------------------------------------------------
// 9. Rounded Box Generator
// -------------------------------------------------------------
export function generateRoundedBoxGeometry(rawConfig?: RoundedBoxGeometryConfig): GeometryBufferData {
  const config = (rawConfig ? correctGeometryDescriptor(rawConfig) : correctGeometryDescriptor({ type: "rounded-box" })) as RoundedBoxGeometryConfig;
  const { width = 1, height = 1, depth = 1, radius = 0.1, smoothness = 4 } = config;

  // We start from a base box with segments scaled by smoothness
  const segments = Math.max(2, smoothness * 2);
  const baseBox = generateBoxGeometry({
    type: "box",
    width,
    height,
    depth,
    widthSegments: segments,
    heightSegments: segments,
    depthSegments: segments,
  });

  const positions = new Float32Array(baseBox.positions);
  const normals = new Float32Array(baseBox.normals.length);

  const halfW = width / 2;
  const halfH = height / 2;
  const halfD = depth / 2;

  // Spherical deformation on corner zones
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    const z = positions[i + 2];

    const innerX = Math.max(-halfW + radius, Math.min(halfW - radius, x));
    const innerY = Math.max(-halfH + radius, Math.min(halfH - radius, y));
    const innerZ = Math.max(-halfD + radius, Math.min(halfD - radius, z));

    const dx = x - innerX;
    const dy = y - innerY;
    const dz = z - innerZ;
    const dist = Math.hypot(dx, dy, dz);

    if (dist > 0) {
      const scale = radius / dist;
      positions[i] = innerX + dx * scale;
      positions[i + 1] = innerY + dy * scale;
      positions[i + 2] = innerZ + dz * scale;

      normals[i] = dx / dist;
      normals[i + 1] = dy / dist;
      normals[i + 2] = dz / dist;
    } else {
      normals[i] = baseBox.normals[i];
      normals[i + 1] = baseBox.normals[i + 1];
      normals[i + 2] = baseBox.normals[i + 2];
    }
  }

  return {
    type: "rounded-box",
    positions,
    normals,
    uvs: baseBox.uvs,
    indices: baseBox.indices,
    vertexCount: positions.length / 3,
    triangleCount: baseBox.triangleCount,
    boundingBox: computeBoundingBoxFromPositions(positions),
    generatedAt: Date.now(),
  };
}

// -------------------------------------------------------------
// 10. Extrude Generator
// -------------------------------------------------------------
export function generateExtrudeGeometry(rawConfig?: ExtrudeGeometryConfig): GeometryBufferData {
  const config = (rawConfig ? correctGeometryDescriptor(rawConfig) : correctGeometryDescriptor({
    type: "extrude",
    points: [
      [-0.5, -0.5],
      [0.5, -0.5],
      [0.5, 0.5],
      [-0.5, 0.5],
    ],
  })) as ExtrudeGeometryConfig;

  const { points, depth = 0.2, bevelEnabled = true, bevelThickness = 0.05, bevelSize = 0.05, bevelSegments = 3 } = config;

  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const nPoints = points.length;
  const halfDepth = depth / 2;

  // Front and back face vertex generation
  const buildFace = (z: number, sign: number) => {
    const startIndex = positions.length / 3;

    for (let i = 0; i < nPoints; i++) {
      const [px, py] = points[i];
      positions.push(px, py, z);
      normals.push(0, 0, sign);
      uvs.push(px + 0.5, py + 0.5);
    }

    // Triangulate convex fan from vertex 0
    for (let i = 1; i < nPoints - 1; i++) {
      if (sign > 0) {
        indices.push(startIndex, startIndex + i, startIndex + i + 1);
      } else {
        indices.push(startIndex, startIndex + i + 1, startIndex + i);
      }
    }
  };

  buildFace(halfDepth, 1); // Front face
  buildFace(-halfDepth, -1); // Back face

  // Side quads connecting corresponding perimeter points
  for (let i = 0; i < nPoints; i++) {
    const next = (i + 1) % nPoints;
    const [p1x, p1y] = points[i];
    const [p2x, p2y] = points[next];

    // Compute side normal
    const edgeX = p2x - p1x;
    const edgeY = p2y - p1y;
    const sideNx = edgeY;
    const sideNy = -edgeX;
    const sideLen = Math.hypot(sideNx, sideNy) || 1;
    const normX = sideNx / sideLen;
    const normY = sideNy / sideLen;

    const baseIdx = positions.length / 3;

    // 4 vertices for side quad
    positions.push(p1x, p1y, halfDepth);
    normals.push(normX, normY, 0);
    uvs.push(i / nPoints, 1);

    positions.push(p2x, p2y, halfDepth);
    normals.push(normX, normY, 0);
    uvs.push((i + 1) / nPoints, 1);

    positions.push(p2x, p2y, -halfDepth);
    normals.push(normX, normY, 0);
    uvs.push((i + 1) / nPoints, 0);

    positions.push(p1x, p1y, -halfDepth);
    normals.push(normX, normY, 0);
    uvs.push(i / nPoints, 0);

    indices.push(baseIdx, baseIdx + 1, baseIdx + 2);
    indices.push(baseIdx, baseIdx + 2, baseIdx + 3);
  }

  const posArr = new Float32Array(positions);
  return {
    type: "extrude",
    positions: posArr,
    normals: new Float32Array(normals),
    uvs: new Float32Array(uvs),
    indices: createIndicesArray(indices),
    vertexCount: posArr.length / 3,
    triangleCount: indices.length / 3,
    boundingBox: computeBoundingBoxFromPositions(posArr),
    generatedAt: Date.now(),
  };
}

// -------------------------------------------------------------
// 11. Parametric Geometry Generator
// -------------------------------------------------------------
const BUILT_IN_PARAMETRIC_FUNCTIONS: Record<string, ParametricEvaluator> = {
  plane: (u, v, target) => {
    target[0] = (u - 0.5) * 2;
    target[1] = (v - 0.5) * 2;
    target[2] = 0;
  },
  wave: (u, v, target) => {
    const x = (u - 0.5) * 4;
    const y = (v - 0.5) * 4;
    target[0] = x;
    target[1] = Math.sin(x * 2) * 0.2 + Math.cos(y * 2) * 0.2;
    target[2] = y;
  },
  sphere: (u, v, target) => {
    const phi = u * Math.PI * 2;
    const theta = v * Math.PI;
    target[0] = 0.5 * Math.sin(theta) * Math.cos(phi);
    target[1] = 0.5 * Math.cos(theta);
    target[2] = 0.5 * Math.sin(theta) * Math.sin(phi);
  },
  mobius: (u, v, target) => {
    const s = (u - 0.5) * Math.PI * 2;
    const t = (v - 0.5) * 0.5;
    target[0] = (1 + t * Math.cos(s / 2)) * Math.cos(s);
    target[1] = (1 + t * Math.cos(s / 2)) * Math.sin(s);
    target[2] = t * Math.sin(s / 2);
  },
  klein: (u, v, target) => {
    const uVal = u * Math.PI;
    const vVal = v * 2 * Math.PI;
    target[0] = (2 / 3) * (1 - Math.cos(uVal) / 2) * Math.cos(uVal) * (1 + Math.sin(vVal)) +
      (2 / 15) * (1 - Math.cos(uVal) / 2) * Math.cos(vVal) * (1 + Math.sin(vVal));
    target[1] = (2 / 15) * Math.sin(vVal);
    target[2] = (2 / 3) * (1 - Math.cos(uVal) / 2) * Math.sin(uVal) * (1 + Math.sin(vVal));
  },
  "torus-knot": (u, v, target) => {
    const p = 2;
    const q = 3;
    const phi = u * Math.PI * 2;
    const r = 0.5 * (2 + Math.sin(q * phi));
    target[0] = r * Math.cos(p * phi);
    target[1] = r * Math.sin(p * phi);
    target[2] = 0.5 * Math.cos(q * phi);
  },
};

export function generateParametricGeometry(rawConfig?: ParametricGeometryConfig): GeometryBufferData {
  const config = (rawConfig ? correctGeometryDescriptor(rawConfig) : correctGeometryDescriptor({ type: "parametric" })) as ParametricGeometryConfig;
  const { uSegments = 20, vSegments = 20, evaluatorName = "wave", evaluator } = config;

  const fn: ParametricEvaluator = evaluator || BUILT_IN_PARAMETRIC_FUNCTIONS[evaluatorName] || BUILT_IN_PARAMETRIC_FUNCTIONS.wave;

  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const eps = 0.0001;
  const p0: [number, number, number] = [0, 0, 0];
  const pU: [number, number, number] = [0, 0, 0];
  const pV: [number, number, number] = [0, 0, 0];

  for (let i = 0; i <= uSegments; i++) {
    const u = i / uSegments;
    for (let j = 0; j <= vSegments; j++) {
      const v = j / vSegments;

      fn(u, v, p0);
      positions.push(p0[0], p0[1], p0[2]);
      uvs.push(u, v);

      // Estimate surface normal via finite difference tangents
      fn(Math.min(1, u + eps), v, pU);
      fn(u, Math.min(1, v + eps), pV);

      const duX = pU[0] - p0[0];
      const duY = pU[1] - p0[1];
      const duZ = pU[2] - p0[2];

      const dvX = pV[0] - p0[0];
      const dvY = pV[1] - p0[1];
      const dvZ = pV[2] - p0[2];

      // Cross product du x dv
      const nx = duY * dvZ - duZ * dvY;
      const ny = duZ * dvX - duX * dvZ;
      const nz = duX * dvY - duY * dvX;
      const nLen = Math.hypot(nx, ny, nz) || 1;

      normals.push(nx / nLen, ny / nLen, nz / nLen);
    }
  }

  for (let i = 0; i < uSegments; i++) {
    for (let j = 0; j < vSegments; j++) {
      const a = i * (vSegments + 1) + j;
      const b = (i + 1) * (vSegments + 1) + j;
      const c = (i + 1) * (vSegments + 1) + (j + 1);
      const d = i * (vSegments + 1) + (j + 1);

      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const posArr = new Float32Array(positions);
  return {
    type: "parametric",
    positions: posArr,
    normals: new Float32Array(normals),
    uvs: new Float32Array(uvs),
    indices: createIndicesArray(indices),
    vertexCount: posArr.length / 3,
    triangleCount: indices.length / 3,
    boundingBox: computeBoundingBoxFromPositions(posArr),
    generatedAt: Date.now(),
  };
}

// -------------------------------------------------------------
// Unified Procedural Geometry Generator Dispatcher
// -------------------------------------------------------------
export function generateProceduralGeometry(
  descriptor: ProceduralGeometryDescriptor
): GeometryBufferData {
  switch (descriptor.type) {
    case "box":
      return generateBoxGeometry(descriptor);
    case "sphere":
      return generateSphereGeometry(descriptor);
    case "plane":
      return generatePlaneGeometry(descriptor);
    case "cylinder":
      return generateCylinderGeometry(descriptor);
    case "cone":
      return generateConeGeometry(descriptor);
    case "torus":
      return generateTorusGeometry(descriptor);
    case "capsule":
      return generateCapsuleGeometry(descriptor);
    case "ring":
      return generateRingGeometry(descriptor);
    case "rounded-box":
      return generateRoundedBoxGeometry(descriptor);
    case "extrude":
      return generateExtrudeGeometry(descriptor);
    case "parametric":
      return generateParametricGeometry(descriptor);
  }
}
