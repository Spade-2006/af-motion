/**
 * AF Motion — 3D Topology Analysis & Consistency
 *
 * Inspects geometric manifold topology, verifies vertex and index connectivity,
 * and harmonizes winding orders for cross-model morph stability.
 */

import type { GeometryBufferData } from "../geometry/types.js";
import type { Mesh3DData } from "../optimization/types.js";

type AnyMesh = Mesh3DData | GeometryBufferData;

export interface TopologyStats {
  vertexCount: number;
  triangleCount: number;
  indexed: boolean;
  indexCount: number;
  isClosedManifold: boolean;
  sharedEdgeCount: number;
  boundaryEdgeCount: number;
}

/**
 * Computes topological statistics of a 3D geometry buffer.
 */
export function computeTopologyStats(mesh: AnyMesh): TopologyStats {
  const vCount = Math.floor(mesh.positions.length / 3);
  const indices = mesh.indices;
  const indexed = !!(indices && indices.length > 0);
  const triCount = indexed ? Math.floor(indices.length / 3) : Math.floor(vCount / 3);

  // Build edge connectivity map to detect closed surface and boundaries
  const edgeMap = new Map<string, number>();

  const addEdge = (a: number, b: number): void => {
    const min = Math.min(a, b);
    const max = Math.max(a, b);
    const key = `${min}_${max}`;
    edgeMap.set(key, (edgeMap.get(key) || 0) + 1);
  };

  if (indexed && indices) {
    for (let i = 0; i < indices.length; i += 3) {
      addEdge(indices[i], indices[i + 1]);
      addEdge(indices[i + 1], indices[i + 2]);
      addEdge(indices[i + 2], indices[i]);
    }
  } else {
    for (let i = 0; i < vCount - 2; i += 3) {
      addEdge(i, i + 1);
      addEdge(i + 1, i + 2);
      addEdge(i + 2, i);
    }
  }

  let sharedEdgeCount = 0;
  let boundaryEdgeCount = 0;

  for (const count of edgeMap.values()) {
    if (count === 2) {
      sharedEdgeCount++;
    } else if (count === 1) {
      boundaryEdgeCount++;
    }
  }

  const isClosedManifold = boundaryEdgeCount === 0 && sharedEdgeCount > 0;

  return {
    vertexCount: vCount,
    triangleCount: triCount,
    indexed,
    indexCount: indexed && indices ? indices.length : 0,
    isClosedManifold,
    sharedEdgeCount,
    boundaryEdgeCount,
  };
}

/**
 * Compares topological structure between two geometries.
 */
export function compareTopology(
  meshA: AnyMesh,
  meshB: AnyMesh
): {
  identical: boolean;
  vertexCountMatch: boolean;
  triangleCountMatch: boolean;
  indicesMatch: boolean;
  statsA: TopologyStats;
  statsB: TopologyStats;
} {
  const statsA = computeTopologyStats(meshA);
  const statsB = computeTopologyStats(meshB);

  const vertexCountMatch = statsA.vertexCount === statsB.vertexCount;
  const triangleCountMatch = statsA.triangleCount === statsB.triangleCount;
  let indicesMatch = false;

  if (statsA.indexed && statsB.indexed && meshA.indices && meshB.indices) {
    if (meshA.indices.length === meshB.indices.length) {
      indicesMatch = true;
      for (let i = 0; i < meshA.indices.length; i++) {
        if (meshA.indices[i] !== meshB.indices[i]) {
          indicesMatch = false;
          break;
        }
      }
    }
  } else if (!statsA.indexed && !statsB.indexed) {
    indicesMatch = vertexCountMatch;
  }

  return {
    identical: vertexCountMatch && triangleCountMatch && indicesMatch,
    vertexCountMatch,
    triangleCountMatch,
    indicesMatch,
    statsA,
    statsB,
  };
}
