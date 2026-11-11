/**
 * AF Motion Composition Layer Ordering & Dependency Resolution
 *
 * Topological dependency sorting, cycle detection, and immutable layer operations.
 */

import type { GraphicsLayer } from "./types.js";

/**
 * Validate that all layer dependencies reference existing layers in the composition.
 */
export function validateLayerDependencies(
  layers: readonly GraphicsLayer[]
): { readonly valid: boolean; readonly errors: readonly string[] } {
  const errors: string[] = [];
  const knownIds = new Set(layers.map((l) => l.id));

  for (const layer of layers) {
    if (layer.dependsOn) {
      for (const depId of layer.dependsOn) {
        if (!knownIds.has(depId)) {
          errors.push(`Layer "${layer.id}" depends on unknown layer "${depId}"`);
        }
      }
    }
  }

  return { valid: errors.length === 0, errors: Object.freeze(errors) };
}

/**
 * Topologically sort composition layers by dependency relationships and layer order.
 */
export function sortCompositionLayers(
  layers: readonly GraphicsLayer[]
): readonly GraphicsLayer[] {
  const validation = validateLayerDependencies(layers);
  if (!validation.valid) {
    throw new Error(`Invalid composition dependencies: ${validation.errors.join("; ")}`);
  }

  const layerMap = new Map(layers.map((l) => [l.id, l]));
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const sorted: GraphicsLayer[] = [];

  function visit(layer: GraphicsLayer): void {
    if (visiting.has(layer.id)) {
      throw new Error(`Circular dependency detected in composition layers at "${layer.id}"`);
    }

    if (!visited.has(layer.id)) {
      visiting.add(layer.id);

      if (layer.dependsOn) {
        for (const depId of layer.dependsOn) {
          const dep = layerMap.get(depId);
          if (dep) {
            visit(dep);
          }
        }
      }

      visiting.delete(layer.id);
      visited.add(layer.id);
      sorted.push(layer);
    }
  }

  // Initial sort by layer order to ensure deterministic traversal
  const initialSorted = [...layers].sort((a, b) => a.order - b.order);
  for (const layer of initialSorted) {
    visit(layer);
  }

  return Object.freeze(sorted);
}

/**
 * Immutably update a single layer in the composition.
 */
export function updateCompositionLayer(
  layers: readonly GraphicsLayer[],
  layerId: string,
  patch: Partial<GraphicsLayer>
): readonly GraphicsLayer[] {
  const updated = layers.map((layer) => {
    if (layer.id === layerId) {
      return { ...layer, ...patch };
    }
    return layer;
  });
  return sortCompositionLayers(updated);
}

/**
 * Immutably add a layer to the composition, replacing if duplicate id.
 */
export function addCompositionLayer(
  layers: readonly GraphicsLayer[],
  newLayer: GraphicsLayer
): readonly GraphicsLayer[] {
  const filtered = layers.filter((l) => l.id !== newLayer.id);
  return sortCompositionLayers([...filtered, newLayer]);
}

/**
 * Immutably remove a layer from the composition.
 */
export function removeCompositionLayer(
  layers: readonly GraphicsLayer[],
  layerId: string
): readonly GraphicsLayer[] {
  const filtered = layers.filter((l) => l.id !== layerId);
  return sortCompositionLayers(filtered);
}
