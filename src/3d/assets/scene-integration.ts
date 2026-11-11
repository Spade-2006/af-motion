/**
 * AF Motion 3D Scene Schema Asset Integration
 *
 * Discovers and preloads assets referenced in Prompt 77 Scene Specifications.
 */

import type { Scene3DSpecification, SceneObjectSpec, ModelObjectSpec } from "../schemas/types.js";
import type { Asset3DDefinition, Asset3DLoadOptions } from "./types.js";
import { AssetManager3D, getDefaultAssetManager } from "./manager.js";

/**
 * Scans a scene graph for all model and texture asset references.
 */
export function discoverSceneAssetReferences(
  scene: Scene3DSpecification
): Asset3DDefinition[] {
  const assets: Asset3DDefinition[] = [];
  const visitedUrls = new Set<string>();

  const traverse = (node: SceneObjectSpec) => {
    if (node.type === "model") {
      const modelNode = node as ModelObjectSpec;
      if (modelNode.model && modelNode.model.url && !visitedUrls.has(modelNode.model.url)) {
        visitedUrls.add(modelNode.model.url);
        assets.push({
          id: modelNode.id,
          url: modelNode.model.url,
          format: modelNode.model.format,
          metadata: {
            scale: modelNode.model.scale,
            draco: modelNode.model.draco,
          },
        });
      }
    }

    // Check material textures
    const mat = (node as any).material;
    if (mat) {
      const urls = [mat.mapUrl, mat.normalMapUrl, mat.roughnessMapUrl].filter(Boolean);
      for (const url of urls) {
        if (!visitedUrls.has(url)) {
          visitedUrls.add(url);
          assets.push({
            id: `texture_${node.id}_${url.split("/").pop() || "tex"}`,
            url,
            format: "texture",
          });
        }
      }
    }

    if (Array.isArray(node.children)) {
      for (const child of node.children) {
        traverse(child);
      }
    }
  };

  if (Array.isArray(scene.objects)) {
    for (const obj of scene.objects) {
      traverse(obj);
    }
  }

  return assets;
}

/**
 * Preloads all assets required by a scene specification.
 */
export async function preloadSceneAssets(
  scene: Scene3DSpecification,
  options?: {
    manager?: AssetManager3D;
    loadOptions?: Asset3DLoadOptions;
  }
): Promise<{
  total: number;
  loaded: number;
  errors: Record<string, string>;
}> {
  const manager = options?.manager || getDefaultAssetManager();
  const assets = discoverSceneAssetReferences(scene);
  const errors: Record<string, string> = {};
  let loaded = 0;

  await Promise.all(
    assets.map(async (assetDef) => {
      try {
        await manager.load(assetDef, options?.loadOptions);
        loaded++;
      } catch (err: unknown) {
        errors[assetDef.id] = err instanceof Error ? err.message : String(err);
      }
    })
  );

  return {
    total: assets.length,
    loaded,
    errors,
  };
}
