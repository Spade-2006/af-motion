/**
 * AF Motion — 3D World Chunking & Streaming Engine
 *
 * Coordinates continuous spatial chunk streaming around dynamic viewer positions,
 * lazy chunk generation, distance-based LOD transitions, and LRU cache recycling.
 */

import type { Vector3, AABB3D } from "../physics/types.js";
import type { Terrain3D, HeightmapData } from "../terrain/types.js";
import type { WorldPopulation } from "./types.js";
import type {
  WorldStreamingConfig,
  WorldChunk3D,
  WorldStreamingManager,
} from "./types.js";
import { buildChunkMeshBuffers } from "../terrain/chunks.js";

/**
 * Creates and manages procedural world spatial streaming and chunk caching.
 */
export function createWorldStreamingManager(
  terrain: Terrain3D,
  population: WorldPopulation,
  config: WorldStreamingConfig = {}
): WorldStreamingManager {
  const chunkSize = config.chunkSize ?? 64;
  const viewRadiusChunks = config.viewRadiusChunks ?? 2;
  const maxCachedChunks = config.maxCachedChunks ?? 64;

  const loadedChunks = new Map<string, WorldChunk3D>();
  const cachedChunks = new Map<string, WorldChunk3D>();

  const getChunkKey = (cx: number, cz: number): string => `${cx}:${cz}`;

  const loadChunk = (cx: number, cz: number): WorldChunk3D => {
    const key = getChunkKey(cx, cz);

    // 1. Check if already loaded
    if (loadedChunks.has(key)) {
      return loadedChunks.get(key)!;
    }

    // 2. Check cache
    if (cachedChunks.has(key)) {
      const cached = cachedChunks.get(key)!;
      cachedChunks.delete(key);
      cached.disposed = false;
      loadedChunks.set(key, cached);
      return cached;
    }

    // 3. Generate new chunk
    const halfSize = chunkSize * 0.5;
    const centerX = cx * chunkSize;
    const centerZ = cz * chunkSize;

    const minX = centerX - halfSize;
    const maxX = centerX + halfSize;
    const minZ = centerZ - halfSize;
    const maxZ = centerZ + halfSize;

    // Find grid range in terrain heightmap
    const hm = terrain.heightmap;
    const uMin = Math.max(0, Math.min(1, (minX + hm.width * 0.5) / hm.width));
    const uMax = Math.max(0, Math.min(1, (maxX + hm.width * 0.5) / hm.width));
    const vMin = Math.max(0, Math.min(1, (minZ + hm.length * 0.5) / hm.length));
    const vMax = Math.max(0, Math.min(1, (maxZ + hm.length * 0.5) / hm.length));

    const startCol = Math.floor(uMin * (hm.cols - 1));
    const endCol = Math.min(hm.cols - 1, Math.ceil(uMax * (hm.cols - 1)));
    const startRow = Math.floor(vMin * (hm.rows - 1));
    const endRow = Math.min(hm.rows - 1, Math.ceil(vMax * (hm.rows - 1)));

    // Find min and max height in chunk region
    let minH = Infinity;
    let maxH = -Infinity;
    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const h = hm.heights[r * hm.cols + c];
        if (h < minH) minH = h;
        if (h > maxH) maxH = h;
      }
    }
    if (!Number.isFinite(minH)) minH = hm.minHeight;
    if (!Number.isFinite(maxH)) maxH = hm.maxHeight;

    const bounds: AABB3D = {
      min: { x: minX, y: minH, z: minZ },
      max: { x: maxX, y: maxH, z: maxZ },
    };

    const buffers = buildChunkMeshBuffers(hm, startCol, endCol, startRow, endRow, 1);

    // Filter vegetation within this chunk
    const chunkVeg = population.instances.filter(
      (inst) =>
        inst.position.x >= minX &&
        inst.position.x <= maxX &&
        inst.position.z >= minZ &&
        inst.position.z <= maxZ
    );

    const chunk: WorldChunk3D = {
      key,
      cx,
      cz,
      bounds,
      terrainChunk: {
        id: `chunk-${key}`,
        chunkX: cx,
        chunkZ: cz,
        worldBounds: bounds,
        lodLevel: 0,
        buffers,
        disposed: false,
      },
      vegetation: chunkVeg,
      lodLevel: 0,
      disposed: false,
    };

    loadedChunks.set(key, chunk);
    return chunk;
  };

  const unloadChunk = (cx: number, cz: number): void => {
    const key = getChunkKey(cx, cz);
    const chunk = loadedChunks.get(key);
    if (!chunk) return;

    loadedChunks.delete(key);

    // Cache if capacity permits
    if (cachedChunks.size >= maxCachedChunks) {
      // Evict oldest cached chunk
      const oldestKey = cachedChunks.keys().next().value;
      if (oldestKey) {
        const evicted = cachedChunks.get(oldestKey)!;
        evicted.disposed = true;
        cachedChunks.delete(oldestKey);
      }
    }

    cachedChunks.set(key, chunk);
  };

  const updateViewerPosition = (viewerPos: Vector3): void => {
    const centerChunkX = Math.round(viewerPos.x / chunkSize);
    const centerChunkZ = Math.round(viewerPos.z / chunkSize);

    const activeKeys = new Set<string>();

    // Load chunks within radius
    for (let dz = -viewRadiusChunks; dz <= viewRadiusChunks; dz++) {
      for (let dx = -viewRadiusChunks; dx <= viewRadiusChunks; dx++) {
        const cx = centerChunkX + dx;
        const cz = centerChunkZ + dz;
        const key = getChunkKey(cx, cz);
        activeKeys.add(key);

        if (!loadedChunks.has(key)) {
          loadChunk(cx, cz);
        }
      }
    }

    // Unload chunks outside radius
    for (const [key, chunk] of loadedChunks.entries()) {
      if (!activeKeys.has(key)) {
        unloadChunk(chunk.cx, chunk.cz);
      }
    }
  };

  const clear = (): void => {
    for (const chunk of loadedChunks.values()) {
      chunk.disposed = true;
    }
    for (const chunk of cachedChunks.values()) {
      chunk.disposed = true;
    }
    loadedChunks.clear();
    cachedChunks.clear();
  };

  return {
    loadedChunks,
    cachedChunks,
    updateViewerPosition,
    loadChunk,
    unloadChunk,
    clear,
  };
}
