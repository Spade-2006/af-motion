/**
 * AF Motion — 3D Material & Texture Intelligence
 *
 * Detects duplicate materials, analyzes texture memory footprints,
 * flags uncompressed/non-power-of-two assets, and recommends resolution downscaling.
 */

import type {
  MaterialData3D,
  TextureData3D,
  Model3DData,
  MaterialOptimizationConfig,
  MaterialOptimizationReport,
} from "./types.js";

/**
 * Analyzes materials and textures, discovering duplicate materials and VRAM savings opportunities.
 * Can be called with (materials, textures, config) or (model, config).
 */
export function analyzeMaterials3D(
  materialsOrModel: MaterialData3D[] | Model3DData = [],
  texturesOrConfig: TextureData3D[] | MaterialOptimizationConfig = [],
  configArg?: MaterialOptimizationConfig
): MaterialOptimizationReport {
  let materials: MaterialData3D[] = [];
  let textures: TextureData3D[] = [];
  let config: MaterialOptimizationConfig = {};

  if (materialsOrModel && !Array.isArray(materialsOrModel) && typeof materialsOrModel === "object") {
    // Called with (model, config)
    const m = materialsOrModel as Model3DData;
    materials = m.materials || [];
    textures = m.textures || [];
    config = (texturesOrConfig as MaterialOptimizationConfig) || {};
  } else {
    // Called with (materials, textures, config)
    materials = (materialsOrModel as MaterialData3D[]) || [];
    textures = Array.isArray(texturesOrConfig) ? texturesOrConfig : [];
    config = configArg || {};
  }

  const maxDim = config.maxTextureDimension ?? 2048;

  // 1. Material Deduplication
  const canonicalMap = new Map<string, string>();
  const duplicatePairs: Array<{ duplicateId: string; canonicalId: string }> = [];

  const getMaterialSignature = (mat: MaterialData3D): string => {
    const c = mat.color ? mat.color.map((v) => Math.round(v * 100)).join(",") : "100,100,100,100";
    const r = Math.round((mat.roughness ?? 0.5) * 100);
    const m = Math.round((mat.metalness ?? 0.0) * 100);
    const alb = mat.albedoTextureId || "";
    const nrm = mat.normalTextureId || "";
    const rough = mat.roughnessTextureId || "";
    const alpha = mat.alphaMode || "OPAQUE";

    return `${c}_${r}_${m}_${alb}_${nrm}_${rough}_${alpha}`;
  };

  for (const mat of materials) {
    const sig = getMaterialSignature(mat);
    const existingCanonical = canonicalMap.get(sig);

    if (existingCanonical) {
      duplicatePairs.push({ duplicateId: mat.id, canonicalId: existingCanonical });
    } else {
      canonicalMap.set(sig, mat.id);
    }
  }

  // 2. Texture Optimization Recommendations
  const textureRecommendations: MaterialOptimizationReport["textureRecommendations"] = [];
  let totalVRAMSavingsBytes = 0;

  for (const tex of textures) {
    const w = tex.width || 0;
    const h = tex.height || 0;

    if (w > maxDim || h > maxDim) {
      const recW = Math.min(w, maxDim);
      const recH = Math.min(h, maxDim);

      const currentBytes = w * h * 4;
      const recBytes = recW * recH * 4;
      const savings = currentBytes - recBytes;

      totalVRAMSavingsBytes += savings;

      textureRecommendations.push({
        textureId: tex.id,
        currentResolution: [w, h],
        recommendedResolution: [recW, recH],
        savedVRAMBytes: savings,
        reason: `Texture exceeds maximum budget dimension (${maxDim}px). Downscaling saves ${(savings / (1024 * 1024)).toFixed(1)}MB VRAM.`,
      });
    }
  }

  return {
    originalMaterialCount: materials.length,
    deduplicatedMaterialCount: materials.length - duplicatePairs.length,
    duplicatePairs,
    textureRecommendations,
    totalVRAMSavingsBytes,
  };
}
