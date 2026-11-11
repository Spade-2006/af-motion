/**
 * AF Motion 3D Raycasting & Hit Testing Adapters
 *
 * Framework-independent spatial hit-testing and optional Three.js Raycaster adapter.
 */

import type { Vector3Tuple } from "../types.js";
import type { RaycastAdapter3D, RaycastHit3D } from "./types.js";

/**
 * Creates a basic spatial raycaster that tests against object bounding boxes or positions.
 */
export function createBoundingBoxRaycaster(
  objectCatalog?: readonly {
    id: string;
    position: Vector3Tuple;
    radius?: number;
    userData?: Record<string, unknown>;
  }[]
): RaycastAdapter3D {
  return {
    raycast: (ndcX: number, ndcY: number) => {
      if (!objectCatalog || objectCatalog.length === 0) return [];

      const hits: RaycastHit3D[] = [];

      for (const obj of objectCatalog) {
        // Simple screen projection approximation
        const radius = obj.radius ?? 1;
        const dx = obj.position[0] - ndcX * 5;
        const dy = obj.position[1] - ndcY * 5;
        const dist2D = Math.hypot(dx, dy);

        if (dist2D <= radius) {
          hits.push({
            objectId: obj.id,
            point: [obj.position[0], obj.position[1], obj.position[2]],
            distance: Math.sqrt(dx * dx + dy * dy + obj.position[2] * obj.position[2]),
            userData: obj.userData,
          });
        }
      }

      return hits.sort((a, b) => a.distance - b.distance);
    },
  };
}

/**
 * Creates an optional Three.js Raycaster adapter using THREE.Raycaster and THREE.Vector2.
 */
export function createThreeRaycastAdapter(
  threeInstance?: any,
  getCamera?: () => any,
  getScene?: () => any
): RaycastAdapter3D {
  const THREE = threeInstance || (typeof globalThis !== "undefined" && (globalThis as any).THREE);

  return {
    raycast: (ndcX: number, ndcY: number, targetObjects?: readonly any[]) => {
      if (!THREE) return [];

      const camera = getCamera?.();
      const scene = getScene?.();
      if (!camera) return [];

      try {
        const raycaster = new THREE.Raycaster();
        const pointer = new THREE.Vector2(ndcX, ndcY);
        raycaster.setFromCamera(pointer, camera);

        const candidates = targetObjects && targetObjects.length > 0
          ? (targetObjects as any[])
          : scene
            ? scene.children
            : [];

        if (!candidates || candidates.length === 0) return [];

        const intersects = raycaster.intersectObjects(candidates, true);

        return intersects.map((hit: any) => {
          let objectId = hit.object?.userData?.id || hit.object?.name || `obj_${hit.object?.id ?? 0}`;
          if (!objectId && hit.object?.parent) {
            objectId = hit.object.parent.userData?.id || hit.object.parent.name;
          }

          const point: Vector3Tuple = hit.point
            ? [hit.point.x, hit.point.y, hit.point.z]
            : [0, 0, 0];

          const normal: Vector3Tuple | undefined = hit.face?.normal
            ? [hit.face.normal.x, hit.face.normal.y, hit.face.normal.z]
            : undefined;

          return {
            objectId: String(objectId),
            point,
            distance: hit.distance ?? 0,
            normal,
            meshName: hit.object?.name,
            userData: hit.object?.userData,
          };
        });
      } catch {
        return [];
      }
    },
  };
}
