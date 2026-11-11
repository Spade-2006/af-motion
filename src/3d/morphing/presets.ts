/**
 * AF Motion — 3D Morph Presets
 *
 * Pre-configured procedural geometric morph pairings (Sphere <-> Box, Torus <-> Sphere, etc.)
 * with matched topology, normalized bounding dimensions, and smooth vertex transitions.
 */

import {
  generateBoxGeometry,
  generateSphereGeometry,
  generateTorusGeometry,
  generateCylinderGeometry,
  generateConeGeometry,
  generatePlaneGeometry,
} from "../geometry/generators.js";
import type { GeometryBufferData } from "../geometry/types.js";
import { resampleGeometry } from "./correspondence.js";
import { createMorphGeometry } from "./geometry.js";
import type { MorphGeometry3D } from "./types.js";

/**
 * Creates a normalized Sphere to Box morph geometry.
 */
export function createSphereToBoxMorph(subdivisions: number = 16): MorphGeometry3D {
  const sphere = generateSphereGeometry({
    type: "sphere",
    radius: 1.0,
    widthSegments: subdivisions,
    heightSegments: subdivisions,
  });

  const box = generateBoxGeometry({
    type: "box",
    width: 1.6,
    height: 1.6,
    depth: 1.6,
    widthSegments: Math.max(1, Math.floor(subdivisions / 2)),
    heightSegments: Math.max(1, Math.floor(subdivisions / 2)),
    depthSegments: Math.max(1, Math.floor(subdivisions / 2)),
  });

  // Resample box to match sphere vertex count
  const sphereVCount = Math.floor(sphere.positions.length / 3);
  const matchedBox = resampleGeometry(box, sphereVCount);

  const morph = createMorphGeometry(sphere);
  morph.id = "preset-sphere-to-box";
  morph.targets = [
    {
      id: "box-target",
      name: "Box Target",
      positions: matchedBox.positions,
      normals: matchedBox.normals,
      uvs: matchedBox.uvs,
      weight: 0,
    },
  ];

  return morph;
}

/**
 * Creates a normalized Box to Sphere morph geometry.
 */
export function createCubeToSphereMorph(subdivisions: number = 16): MorphGeometry3D {
  const box = generateBoxGeometry({
    type: "box",
    width: 1.5,
    height: 1.5,
    depth: 1.5,
    widthSegments: subdivisions,
    heightSegments: subdivisions,
    depthSegments: subdivisions,
  });

  const sphere = generateSphereGeometry({
    type: "sphere",
    radius: 1.0,
    widthSegments: subdivisions,
    heightSegments: subdivisions,
  });

  const boxVCount = Math.floor(box.positions.length / 3);
  const matchedSphere = resampleGeometry(sphere, boxVCount);

  const morph = createMorphGeometry(box);
  morph.id = "preset-cube-to-sphere";
  morph.targets = [
    {
      id: "sphere-target",
      name: "Sphere Target",
      positions: matchedSphere.positions,
      normals: matchedSphere.normals,
      uvs: matchedSphere.uvs,
      weight: 0,
    },
  ];

  return morph;
}

/**
 * Creates a Torus to Sphere morph geometry.
 */
export function createTorusToSphereMorph(
  radialSegments: number = 16,
  tubularSegments: number = 16
): MorphGeometry3D {
  const torus = generateTorusGeometry({
    type: "torus",
    radius: 1.2,
    tube: 0.4,
    radialSegments,
    tubularSegments,
  });

  const sphere = generateSphereGeometry({
    type: "sphere",
    radius: 1.2,
    widthSegments: radialSegments,
    heightSegments: tubularSegments,
  });

  const torusVCount = Math.floor(torus.positions.length / 3);
  const matchedSphere = resampleGeometry(sphere, torusVCount);

  const morph = createMorphGeometry(torus);
  morph.id = "preset-torus-to-sphere";
  morph.targets = [
    {
      id: "sphere-target",
      name: "Sphere Target",
      positions: matchedSphere.positions,
      normals: matchedSphere.normals,
      uvs: matchedSphere.uvs,
      weight: 0,
    },
  ];

  return morph;
}

/**
 * Creates a Cylinder to Cone morph geometry.
 */
export function createCylinderToConeMorph(radialSegments: number = 16): MorphGeometry3D {
  const cylinder = generateCylinderGeometry({
    type: "cylinder",
    radiusTop: 0.8,
    radiusBottom: 0.8,
    height: 2.0,
    radialSegments,
    heightSegments: 4,
  });

  const cone = generateConeGeometry({
    type: "cone",
    radius: 1.0,
    height: 2.0,
    radialSegments,
    heightSegments: 4,
  });

  const cylVCount = Math.floor(cylinder.positions.length / 3);
  const matchedCone = resampleGeometry(cone, cylVCount);

  const morph = createMorphGeometry(cylinder);
  morph.id = "preset-cylinder-to-cone";
  morph.targets = [
    {
      id: "cone-target",
      name: "Cone Target",
      positions: matchedCone.positions,
      normals: matchedCone.normals,
      uvs: matchedCone.uvs,
      weight: 0,
    },
  ];

  return morph;
}

/**
 * Creates a Plane to Wave morph geometry.
 */
export function createPlaneToWaveMorph(
  widthSegments: number = 16,
  heightSegments: number = 16,
  amplitude: number = 0.5
): MorphGeometry3D {
  const plane = generatePlaneGeometry({
    type: "plane",
    width: 2.0,
    height: 2.0,
    widthSegments,
    heightSegments,
  });

  const vCount = Math.floor(plane.positions.length / 3);
  const wavePositions = new Float32Array(plane.positions);

  // Deform Z coordinate with sinusoidal wave
  for (let i = 0; i < vCount; i++) {
    const x = wavePositions[i * 3];
    const y = wavePositions[i * 3 + 1];
    wavePositions[i * 3 + 2] = Math.sin(x * Math.PI) * Math.cos(y * Math.PI) * amplitude;
  }

  const morph = createMorphGeometry(plane);
  morph.id = "preset-plane-to-wave";
  morph.targets = [
    {
      id: "wave-target",
      name: "Wave Target",
      positions: wavePositions,
      weight: 0,
    },
  ];

  return morph;
}

/**
 * Lists all available built-in 3D morph presets.
 */
export function listMorphPresets(): string[] {
  return [
    "sphere-to-box",
    "cube-to-sphere",
    "torus-to-sphere",
    "cylinder-to-cone",
    "plane-to-wave",
  ];
}
