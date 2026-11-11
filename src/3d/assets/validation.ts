/**
 * AF Motion 3D Asset Validation and Correction
 */

import type { Asset3DDefinition, Asset3DFormat } from "./types.js";

const VALID_FORMATS = new Set<Asset3DFormat>([
  "gltf",
  "glb",
  "obj",
  "fbx",
  "usdz",
  "json",
  "texture",
  "custom",
]);

export function inferAssetFormat(url: string): Asset3DFormat {
  if (!url || typeof url !== "string") return "custom";
  const cleanUrl = url.split("?")[0].split("#")[0].toLowerCase();
  if (cleanUrl.endsWith(".gltf")) return "gltf";
  if (cleanUrl.endsWith(".glb")) return "glb";
  if (cleanUrl.endsWith(".obj")) return "obj";
  if (cleanUrl.endsWith(".fbx")) return "fbx";
  if (cleanUrl.endsWith(".usdz")) return "usdz";
  if (cleanUrl.endsWith(".json")) return "json";
  if (/\.(png|jpe?g|webp|avif|ktx2|dds|hdr|exr)$/.test(cleanUrl)) return "texture";
  return "custom";
}

export function validateAssetDefinition(definition: unknown): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!definition || typeof definition !== "object") {
    return { valid: false, errors: ["Asset definition must be an object."] };
  }

  const def = definition as Record<string, unknown>;

  if (typeof def.id !== "string" || def.id.trim().length === 0) {
    errors.push("Asset 'id' must be a non-empty string.");
  }

  if (typeof def.url !== "string" || def.url.trim().length === 0) {
    errors.push("Asset 'url' must be a non-empty string.");
  }

  if (def.format !== undefined && (!VALID_FORMATS.has(def.format as Asset3DFormat))) {
    errors.push(`Invalid asset format '${String(def.format)}'. Supported: ${Array.from(VALID_FORMATS).join(", ")}`);
  }

  if (def.dependencies !== undefined) {
    if (!Array.isArray(def.dependencies)) {
      errors.push("Asset 'dependencies' must be an array of asset ID strings.");
    } else {
      for (let i = 0; i < def.dependencies.length; i++) {
        if (typeof def.dependencies[i] !== "string") {
          errors.push(`Dependency at index ${i} must be a string.`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function correctAssetDefinition(
  definition: Partial<Asset3DDefinition> & { url?: string }
): Asset3DDefinition {
  const url = typeof definition.url === "string" ? definition.url.trim() : "";
  const inferredFormat = inferAssetFormat(url);
  const format: Asset3DFormat =
    definition.format && VALID_FORMATS.has(definition.format)
      ? definition.format
      : inferredFormat;

  let id = typeof definition.id === "string" && definition.id.trim().length > 0
    ? definition.id.trim()
    : "";

  if (!id) {
    if (url) {
      const parts = url.split("/");
      const last = parts[parts.length - 1] || "asset";
      id = last.replace(/[?#].*$/, "") || `asset_${Date.now()}`;
    } else {
      id = `asset_${Date.now()}`;
    }
  }

  const validDependencies: string[] = [];
  if (Array.isArray(definition.dependencies)) {
    for (const dep of definition.dependencies) {
      if (typeof dep === "string" && dep.trim().length > 0) {
        validDependencies.push(dep.trim());
      }
    }
  }

  return {
    id,
    url,
    format,
    name: typeof definition.name === "string" ? definition.name.trim() : undefined,
    sizeBytes: typeof definition.sizeBytes === "number" && definition.sizeBytes >= 0 ? definition.sizeBytes : undefined,
    dependencies: validDependencies.length > 0 ? validDependencies : undefined,
    metadata: definition.metadata && typeof definition.metadata === "object" ? { ...definition.metadata } : undefined,
  };
}
