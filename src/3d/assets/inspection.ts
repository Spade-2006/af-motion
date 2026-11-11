/**
 * AF Motion 3D Scene Graph Inspection & Resource Disposal
 *
 * Framework-independent inspection and deep resource cleanup for 3D model
 * scene graphs, geometries, materials, animations, and textures.
 */

import type { BoundingBox3D } from "../schemas/types.js";
import type { ModelInspectionMetadata } from "./types.js";

/**
 * Traverses a 3D scene graph or object tree and extracts comprehensive metadata.
 */
export function inspectModelGraph(root: unknown): ModelInspectionMetadata {
  if (!root || typeof root !== "object") {
    return {
      vertexCount: 0,
      triangleCount: 0,
      meshCount: 0,
      materialCount: 0,
      nodeCount: 0,
      hasAnimations: false,
      animationClips: [],
      meshNames: [],
      materialNames: [],
      inspectedAt: Date.now(),
    };
  }

  const rootObj = root as Record<string, unknown>;
  let vertexCount = 0;
  let triangleCount = 0;
  let meshCount = 0;
  let nodeCount = 0;

  const meshNames: string[] = [];
  const materialNamesSet = new Set<string>();

  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;
  let hasBounds = false;

  const updateBounds = (x: number, y: number, z: number) => {
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    minZ = Math.min(minZ, z);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
    maxZ = Math.max(maxZ, z);
    hasBounds = true;
  };

  const traverse = (node: unknown) => {
    if (!node || typeof node !== "object") return;
    nodeCount++;

    const n = node as Record<string, unknown>;
    const name = typeof n.name === "string" ? n.name : "";

    // Check if it's a mesh or contains geometry
    const isMesh = Boolean(n.isMesh || n.geometry);
    if (isMesh) {
      meshCount++;
      if (name) meshNames.push(name);

      const geom = n.geometry as Record<string, unknown> | undefined;
      if (geom) {
        // Three.js BufferGeometry
        const attrs = geom.attributes as Record<string, unknown> | undefined;
        if (attrs && attrs.position) {
          const pos = attrs.position as Record<string, unknown>;
          const count = typeof pos.count === "number" ? pos.count : 0;
          vertexCount += count;

          const idx = geom.index as Record<string, unknown> | undefined;
          if (idx && typeof idx.count === "number") {
            triangleCount += Math.floor(idx.count / 3);
          } else {
            triangleCount += Math.floor(count / 3);
          }

          // Geometry bounds calculation
          if (typeof geom.computeBoundingBox === "function" && !geom.boundingBox) {
            try {
              geom.computeBoundingBox();
            } catch {
              // Ignore failure in non-standard geometries
            }
          }

          const bb = geom.boundingBox as Record<string, any> | undefined;
          if (bb && bb.min && bb.max) {
            updateBounds(bb.min.x, bb.min.y, bb.min.z);
            updateBounds(bb.max.x, bb.max.y, bb.max.z);
          } else if (Array.isArray(pos.array) || pos.array instanceof Float32Array) {
            const arr = pos.array as ArrayLike<number>;
            for (let i = 0; i < arr.length; i += 3) {
              updateBounds(arr[i], arr[i + 1], arr[i + 2]);
            }
          }
        }
      }

      // Material discovery
      const mat = n.material;
      if (mat) {
        if (Array.isArray(mat)) {
          for (const m of mat) {
            if (m && typeof m === "object") {
              const mName = (m as { name?: string }).name || `material_${materialNamesSet.size + 1}`;
              materialNamesSet.add(mName);
            }
          }
        } else if (typeof mat === "object") {
          const mName = (mat as { name?: string }).name || `material_${materialNamesSet.size + 1}`;
          materialNamesSet.add(mName);
        }
      }
    }

    // Traverse children
    if (Array.isArray(n.children)) {
      for (const child of n.children) {
        traverse(child);
      }
    }
  };

  // Inspect the scene or model graph
  const targetScene = (rootObj.scene || rootObj) as unknown;
  traverse(targetScene);

  // Discover animations
  const animationClips: { name: string; duration: number; tracksCount: number }[] = [];
  const rawAnimations = (rootObj.animations || (rootObj.scene as Record<string, unknown> | undefined)?.animations) as unknown;
  if (Array.isArray(rawAnimations)) {
    for (let i = 0; i < rawAnimations.length; i++) {
      const clip = rawAnimations[i] as Record<string, unknown>;
      if (clip && typeof clip === "object") {
        const cName = typeof clip.name === "string" && clip.name ? clip.name : `animation_${i}`;
        const cDuration = typeof clip.duration === "number" ? clip.duration : 0;
        const tracks = Array.isArray(clip.tracks) ? clip.tracks.length : 0;
        animationClips.push({
          name: cName,
          duration: cDuration,
          tracksCount: tracks,
        });
      }
    }
  }

  let boundingBox: BoundingBox3D | undefined;
  if (hasBounds) {
    const sizeX = maxX - minX;
    const sizeY = maxY - minY;
    const sizeZ = maxZ - minZ;
    const centerX = minX + sizeX / 2;
    const centerY = minY + sizeY / 2;
    const centerZ = minZ + sizeZ / 2;

    boundingBox = {
      min: [minX, minY, minZ],
      max: [maxX, maxY, maxZ],
      size: [sizeX, sizeY, sizeZ],
      center: [centerX, centerY, centerZ],
    };
  }

  return {
    vertexCount,
    triangleCount,
    meshCount,
    materialCount: materialNamesSet.size,
    nodeCount,
    hasAnimations: animationClips.length > 0,
    animationClips,
    boundingBox,
    meshNames,
    materialNames: Array.from(materialNamesSet),
    inspectedAt: Date.now(),
  };
}

/**
 * Deeply disposes a 3D model, its geometries, materials, and textures.
 */
export function deepDisposeModel(root: unknown): void {
  if (!root || typeof root !== "object") return;

  const disposeMaterial = (mat: any) => {
    if (!mat || typeof mat !== "object") return;

    // Dispose textures attached to material
    const textureKeys = [
      "map",
      "alphaMap",
      "bumpMap",
      "normalMap",
      "displacementMap",
      "roughnessMap",
      "metalnessMap",
      "emissiveMap",
      "lightMap",
      "aoMap",
      "envMap",
    ];

    for (const key of textureKeys) {
      if (mat[key] && typeof mat[key].dispose === "function") {
        try {
          mat[key].dispose();
        } catch {
          // Ignore texture disposal errors
        }
      }
    }

    if (typeof mat.dispose === "function") {
      try {
        mat.dispose();
      } catch {
        // Ignore material disposal errors
      }
    }
  };

  const traverseAndDispose = (node: any) => {
    if (!node || typeof node !== "object") return;

    if (node.geometry && typeof node.geometry.dispose === "function") {
      try {
        node.geometry.dispose();
      } catch {
        // Ignore geometry disposal error
      }
    }

    if (node.material) {
      if (Array.isArray(node.material)) {
        for (const m of node.material) {
          disposeMaterial(m);
        }
      } else {
        disposeMaterial(node.material);
      }
    }

    if (Array.isArray(node.children)) {
      for (const child of node.children) {
        traverseAndDispose(child);
      }
    }
  };

  const rootObj = root as Record<string, unknown>;
  const sceneOrRoot = rootObj.scene || root;
  traverseAndDispose(sceneOrRoot);
}

/**
 * Clones a 3D model for independent scene-graph placement without sharing transforms.
 */
export function instantiateModel<T = unknown>(model: T): T {
  if (!model || typeof model !== "object") return model;

  const m = model as Record<string, any>;
  if (typeof m.clone === "function") {
    try {
      return m.clone(true) as T;
    } catch {
      // Fall through to scene cloning
    }
  }

  if (m.scene && typeof m.scene.clone === "function") {
    try {
      return {
        ...m,
        scene: m.scene.clone(true),
      } as T;
    } catch {
      // Fall through
    }
  }

  return model;
}
