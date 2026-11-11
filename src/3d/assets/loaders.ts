/**
 * AF Motion 3D Asset Loaders
 *
 * Pluggable loader implementations including mock loaders for testing and
 * optional Three.js loaders (GLTFLoader, OBJLoader) with cancellation and progress.
 */

import type { Asset3DDefinition, Asset3DLoadOptions, AssetLoader3D, ModelInspectionMetadata } from "./types.js";
import { inspectModelGraph, deepDisposeModel, instantiateModel } from "./inspection.js";

/**
 * Creates a mock asset loader for testing, simulation, and SSR environments.
 */
export function createMockAssetLoader(options?: {
  delayMs?: number;
  mockDataFactory?: (def: Asset3DDefinition) => unknown;
  mockError?: string;
}): AssetLoader3D {
  const delayMs = options?.delayMs ?? 10;
  const mockError = options?.mockError;

  return {
    name: "mock-asset-loader",
    formats: ["gltf", "glb", "obj", "fbx", "usdz", "json", "texture", "custom"],
    canLoad: () => true,
    load: async (definition: Asset3DDefinition, loadOptions?: Asset3DLoadOptions) => {
      if (loadOptions?.signal?.aborted) {
        throw new Error("Asset loading aborted.");
      }

      // Simulate loading progress
      const steps = 4;
      for (let i = 1; i <= steps; i++) {
        if (delayMs > 0) {
          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
              if (loadOptions?.signal?.aborted) {
                reject(new Error("Asset loading aborted."));
              } else {
                resolve();
              }
            }, delayMs / steps);

            if (loadOptions?.signal) {
              loadOptions.signal.addEventListener(
                "abort",
                () => {
                  clearTimeout(timeout);
                  reject(new Error("Asset loading aborted."));
                },
                { once: true }
              );
            }
          });
        }

        if (loadOptions?.onProgress) {
          loadOptions.onProgress(i / steps);
        }
      }

      if (mockError) {
        throw new Error(mockError);
      }

      if (options?.mockDataFactory) {
        return options.mockDataFactory(definition);
      }

      // Return standard mock model structure
      return {
        id: definition.id,
        isMockModel: true,
        url: definition.url,
        scene: {
          name: `Scene_${definition.id}`,
          children: [
            {
              isMesh: true,
              name: `Mesh_${definition.id}`,
              geometry: {
                attributes: {
                  position: {
                    count: 24,
                    array: new Float32Array(72),
                  },
                },
                index: { count: 36 },
                boundingBox: {
                  min: { x: -1, y: -1, z: -1 },
                  max: { x: 1, y: 1, z: 1 },
                },
              },
              material: {
                name: `Material_${definition.id}`,
                dispose: () => {},
              },
            },
          ],
        },
        animations: [
          {
            name: "idle",
            duration: 2.5,
            tracks: [{}, {}],
          },
        ],
      };
    },
    inspect: (data: unknown): ModelInspectionMetadata => inspectModelGraph(data),
    dispose: (data: unknown) => deepDisposeModel(data),
    clone: (data: unknown) => instantiateModel(data),
  };
}

/**
 * Creates an optional Three.js GLTF/GLB loader adapter.
 */
export function createThreeGLTFLoader(options?: {
  threeInstance?: any;
  gltfLoaderConstructor?: any;
  dracoDecoderPath?: string;
}): AssetLoader3D {
  return {
    name: "three-gltf-loader",
    formats: ["gltf", "glb"],
    canLoad: (def) => def.format === "gltf" || def.format === "glb" || def.url.endsWith(".gltf") || def.url.endsWith(".glb"),
    load: async (definition: Asset3DDefinition, loadOptions?: Asset3DLoadOptions) => {
      if (loadOptions?.signal?.aborted) {
        throw new Error("Asset loading aborted.");
      }

      let GLTFLoaderClass = options?.gltfLoaderConstructor;
      if (!GLTFLoaderClass && options?.threeInstance?.GLTFLoader) {
        GLTFLoaderClass = options.threeInstance.GLTFLoader;
      }

      // If GLTFLoader is not available, fail with clean descriptive error
      if (!GLTFLoaderClass) {
        throw new Error(
          `Three.js GLTFLoader is not available. Please supply 'gltfLoaderConstructor' or install 'three/addons/loaders/GLTFLoader.js' to load '${definition.url}'.`
        );
      }

      const loader = new GLTFLoaderClass();

      return new Promise<any>((resolve, reject) => {
        if (loadOptions?.signal) {
          loadOptions.signal.addEventListener(
            "abort",
            () => reject(new Error("Asset loading aborted.")),
            { once: true }
          );
        }

        loader.load(
          definition.url,
          (gltf: any) => resolve(gltf),
          (xhr: any) => {
            if (loadOptions?.onProgress && xhr.total && xhr.total > 0) {
              loadOptions.onProgress(Math.min(1, xhr.loaded / xhr.total));
            }
          },
          (error: any) => {
            const msg = error instanceof Error ? error.message : String(error);
            reject(new Error(`Failed to load GLTF asset from '${definition.url}': ${msg}`));
          }
        );
      });
    },
    inspect: (data: unknown): ModelInspectionMetadata => inspectModelGraph(data),
    dispose: (data: unknown) => deepDisposeModel(data),
    clone: (data: unknown) => instantiateModel(data),
  };
}

/**
 * Creates an optional Three.js OBJ loader adapter.
 */
export function createThreeOBJLoader(options?: {
  threeInstance?: any;
  objLoaderConstructor?: any;
}): AssetLoader3D {
  return {
    name: "three-obj-loader",
    formats: ["obj"],
    canLoad: (def) => def.format === "obj" || def.url.endsWith(".obj"),
    load: async (definition: Asset3DDefinition, loadOptions?: Asset3DLoadOptions) => {
      if (loadOptions?.signal?.aborted) {
        throw new Error("Asset loading aborted.");
      }

      let OBJLoaderClass = options?.objLoaderConstructor;
      if (!OBJLoaderClass && options?.threeInstance?.OBJLoader) {
        OBJLoaderClass = options.threeInstance.OBJLoader;
      }

      if (!OBJLoaderClass) {
        throw new Error(
          `Three.js OBJLoader is not available. Please supply 'objLoaderConstructor' or install 'three/addons/loaders/OBJLoader.js' to load '${definition.url}'.`
        );
      }

      const loader = new OBJLoaderClass();

      return new Promise<any>((resolve, reject) => {
        if (loadOptions?.signal) {
          loadOptions.signal.addEventListener(
            "abort",
            () => reject(new Error("Asset loading aborted.")),
            { once: true }
          );
        }

        loader.load(
          definition.url,
          (obj: any) => resolve({ scene: obj }),
          (xhr: any) => {
            if (loadOptions?.onProgress && xhr.total && xhr.total > 0) {
              loadOptions.onProgress(Math.min(1, xhr.loaded / xhr.total));
            }
          },
          (error: any) => {
            const msg = error instanceof Error ? error.message : String(error);
            reject(new Error(`Failed to load OBJ asset from '${definition.url}': ${msg}`));
          }
        );
      });
    },
    inspect: (data: unknown): ModelInspectionMetadata => inspectModelGraph(data),
    dispose: (data: unknown) => deepDisposeModel(data),
    clone: (data: unknown) => instantiateModel(data),
  };
}
