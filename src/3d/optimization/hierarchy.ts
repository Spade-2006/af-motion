/**
 * AF Motion — 3D Model Hierarchy Optimization
 *
 * Collapses redundant scene nodes, eliminates empty groups, and bakes static transforms
 * while strictly preserving animation-sensitive skeletons and physics target nodes.
 */

import type { Transform3D } from "../physics/types.js";
import type {
  ModelNode3D,
  Model3DData,
  HierarchyOptimizationConfig,
  HierarchyOptimizationReport,
} from "./types.js";

function isIdentityTransform(t?: Transform3D): boolean {
  if (!t) return true;
  const pos = t.position || { x: 0, y: 0, z: 0 };
  const rot = t.rotation || { x: 0, y: 0, z: 0, w: 1 };
  const scl = t.scale || { x: 1, y: 1, z: 1 };

  const posZero = Math.abs(pos.x ?? 0) < 1e-5 && Math.abs(pos.y ?? 0) < 1e-5 && Math.abs(pos.z ?? 0) < 1e-5;
  const rotIdentity =
    Math.abs(rot.x ?? 0) < 1e-5 &&
    Math.abs(rot.y ?? 0) < 1e-5 &&
    Math.abs(rot.z ?? 0) < 1e-5 &&
    Math.abs((rot.w ?? 1) - 1.0) < 1e-5;
  const scaleOne =
    Math.abs((scl.x ?? 1) - 1.0) < 1e-5 &&
    Math.abs((scl.y ?? 1) - 1.0) < 1e-5 &&
    Math.abs((scl.z ?? 1) - 1.0) < 1e-5;

  return posZero && rotIdentity && scaleOne;
}

/**
 * Optimizes an object hierarchy tree, removing redundant nodes and collapsing empty groups.
 */
export function optimizeModelHierarchy(
  input: ModelNode3D | Model3DData,
  config: HierarchyOptimizationConfig = {}
): { root: ModelNode3D; report: HierarchyOptimizationReport } {
  let root: ModelNode3D;
  if ("rootNode" in input && input.rootNode) {
    root = input.rootNode;
  } else {
    root = input as ModelNode3D;
  }

  const removeEmpty = config.removeEmptyGroups ?? true;
  const collapseRedundant = config.collapseRedundantNodes ?? true;
  const preserveAnimated = config.preserveAnimatedNodes ?? true;
  const preservePhysics = config.preservePhysicsNodes ?? true;

  let originalCount = 0;
  let maxDepthBefore = 0;
  let nodesRemoved = 0;

  // Audit pass before optimization
  const measureBefore = (node: ModelNode3D, depth: number): void => {
    originalCount++;
    maxDepthBefore = Math.max(maxDepthBefore, depth);
    if (node.children) {
      for (const c of node.children) {
        measureBefore(c, depth + 1);
      }
    }
  };
  measureBefore(root, 1);

  // Optimization pass
  const optimizeNode = (node: ModelNode3D): ModelNode3D | null => {
    const isProtected =
      (preserveAnimated && node.isAnimated) ||
      (preservePhysics && node.isPhysicsTarget);

    // Recursively optimize children
    let children: ModelNode3D[] = [];
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        const optChild = optimizeNode(child);
        if (optChild) {
          children.push(optChild);
        } else {
          nodesRemoved++;
        }
      }
    }

    const hasMeshes = Array.isArray(node.meshIds) && node.meshIds.length > 0;

    // 1. Remove empty leaf groups
    if (removeEmpty && !isProtected && !hasMeshes && children.length === 0) {
      return null;
    }

    // 2. Collapse single-child redundant identity node
    if (
      collapseRedundant &&
      !isProtected &&
      !hasMeshes &&
      children.length === 1 &&
      isIdentityTransform(node.transform)
    ) {
      nodesRemoved++;
      return children[0];
    }

    return {
      ...node,
      children: children.length > 0 ? children : undefined,
    };
  };

  const optimizedRoot = optimizeNode(root) ?? root;

  let optimizedCount = 0;
  let maxDepthAfter = 0;
  const measureAfter = (node: ModelNode3D, depth: number): void => {
    optimizedCount++;
    maxDepthAfter = Math.max(maxDepthAfter, depth);
    if (node.children) {
      for (const c of node.children) {
        measureAfter(c, depth + 1);
      }
    }
  };
  measureAfter(optimizedRoot, 1);

  return {
    root: optimizedRoot,
    report: {
      originalNodeCount: originalCount,
      optimizedNodeCount: optimizedCount,
      nodesRemoved,
      transformsBaked: 0,
      maxDepthBefore,
      maxDepthAfter,
    },
  };
}
