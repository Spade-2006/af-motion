/**
 * AF Motion — Adaptive Quality Profiles & Presets
 *
 * Preset definitions (Ultra, High, Balanced, Performance, Battery Saver, Custom),
 * setting descriptors with bounds, priorities, and validation rules.
 */

import type {
  QualityPresetName,
  QualitySettingKey,
  QualityValues,
  QualityOverrides,
  UnifiedQualitySettings,
  QualityProfile,
  QualitySettingDescriptor,
} from "./types.js";

/**
 * Adaptation priority mapping (1 = degraded first, 15 = preserved longest).
 */
export const SETTING_ADAPTATION_PRIORITIES: Readonly<Record<QualitySettingKey, number>> = {
  postProcessing: 1,
  shadowQuality: 2,
  particleDensity: 3,
  fluidResolution: 4,
  environmentalDetail: 5,
  textureResolution: 6,
  lightingQuality: 7,
  materialQuality: 8,
  resolutionScale: 9,
  dpr: 10,
  modelLod: 11,
  geometryDetail: 12,
  animationQuality: 13,
  gpuSimulationQuality: 14,
  physicsFrequency: 15,
};

/**
 * Estimated performance impact categorization.
 */
export const SETTING_PERFORMANCE_IMPACT: Readonly<
  Record<QualitySettingKey, "low" | "medium" | "high">
> = {
  resolutionScale: "high",
  dpr: "high",
  geometryDetail: "medium",
  modelLod: "medium",
  shadowQuality: "high",
  lightingQuality: "medium",
  materialQuality: "medium",
  textureResolution: "medium",
  postProcessing: "high",
  particleDensity: "high",
  fluidResolution: "high",
  environmentalDetail: "medium",
  physicsFrequency: "high",
  animationQuality: "low",
  gpuSimulationQuality: "high",
};

/**
 * Numeric bounds for continuous settings.
 */
export const NUMERIC_SETTING_BOUNDS: Readonly<
  Partial<Record<QualitySettingKey, { min: number; max: number }>>
> = {
  resolutionScale: { min: 0.25, max: 1.0 },
  dpr: { min: 1.0, max: 3.0 },
  modelLod: { min: 0, max: 3 },
  particleDensity: { min: 0.1, max: 2.5 },
  fluidResolution: { min: 0.2, max: 1.0 },
  physicsFrequency: { min: 30, max: 120 },
};

/**
 * Preset quality raw values.
 */
export const QUALITY_PRESET_VALUES: Readonly<
  Record<Exclude<QualityPresetName, "custom">, QualityValues>
> = {
  ultra: {
    resolutionScale: 1.0,
    dpr: 3.0,
    geometryDetail: "ultra",
    modelLod: 0,
    shadowQuality: "high",
    lightingQuality: "advanced",
    materialQuality: "pbr",
    textureResolution: "full",
    postProcessing: "high",
    particleDensity: 1.5,
    fluidResolution: 1.0,
    environmentalDetail: "high",
    physicsFrequency: 120,
    animationQuality: "ultra",
    gpuSimulationQuality: "webgpu",
  },
  high: {
    resolutionScale: 1.0,
    dpr: 2.0,
    geometryDetail: "high",
    modelLod: 0,
    shadowQuality: "high",
    lightingQuality: "standard",
    materialQuality: "standard",
    textureResolution: "high",
    postProcessing: "high",
    particleDensity: 1.0,
    fluidResolution: 0.8,
    environmentalDetail: "high",
    physicsFrequency: 60,
    animationQuality: "high",
    gpuSimulationQuality: "webgl2",
  },
  balanced: {
    resolutionScale: 0.9,
    dpr: 1.5,
    geometryDetail: "medium",
    modelLod: 1,
    shadowQuality: "medium",
    lightingQuality: "standard",
    materialQuality: "standard",
    textureResolution: "medium",
    postProcessing: "medium",
    particleDensity: 0.7,
    fluidResolution: 0.6,
    environmentalDetail: "medium",
    physicsFrequency: 60,
    animationQuality: "medium",
    gpuSimulationQuality: "webgl2",
  },
  performance: {
    resolutionScale: 0.75,
    dpr: 1.0,
    geometryDetail: "low",
    modelLod: 2,
    shadowQuality: "low",
    lightingQuality: "simple",
    materialQuality: "basic",
    textureResolution: "low",
    postProcessing: "low",
    particleDensity: 0.4,
    fluidResolution: 0.4,
    environmentalDetail: "low",
    physicsFrequency: 60,
    animationQuality: "low",
    gpuSimulationQuality: "webgl2",
  },
  "battery-saver": {
    resolutionScale: 0.65,
    dpr: 1.0,
    geometryDetail: "low",
    modelLod: 2,
    shadowQuality: "disabled",
    lightingQuality: "simple",
    materialQuality: "basic",
    textureResolution: "low",
    postProcessing: "disabled",
    particleDensity: 0.25,
    fluidResolution: 0.3,
    environmentalDetail: "low",
    physicsFrequency: 30,
    animationQuality: "low",
    gpuSimulationQuality: "cpu",
  },
};

/**
 * Ordered list of presets from highest visual fidelity to lowest.
 */
export const ORDERED_PRESETS: readonly Exclude<QualityPresetName, "custom">[] = [
  "ultra",
  "high",
  "balanced",
  "performance",
  "battery-saver",
];

/**
 * Clamps numeric values according to dimension limits.
 */
export function clampNumericSetting(key: QualitySettingKey, value: number): number {
  const bounds = NUMERIC_SETTING_BOUNDS[key];
  if (!bounds) return value;
  return Math.max(bounds.min, Math.min(bounds.max, value));
}

/**
 * Builds a single setting descriptor.
 */
function createSettingDescriptor<K extends QualitySettingKey>(
  key: K,
  autoValue: UnifiedQualitySettings[K]["current"],
  preset: QualityPresetName,
  override?: UnifiedQualitySettings[K]["current"],
  isLocked = false
): QualitySettingDescriptor<UnifiedQualitySettings[K]["current"]> {
  const bounds = NUMERIC_SETTING_BOUNDS[key];
  let effectiveAuto = autoValue;
  if (typeof effectiveAuto === "number" && bounds) {
    effectiveAuto = clampNumericSetting(key, effectiveAuto) as any;
  }

  let effectiveOverride = override;
  if (effectiveOverride !== undefined && typeof effectiveOverride === "number" && bounds) {
    effectiveOverride = clampNumericSetting(key, effectiveOverride) as any;
  }

  const current = effectiveOverride !== undefined ? effectiveOverride : effectiveAuto;

  return {
    current,
    autoValue: effectiveAuto,
    min: bounds?.min,
    max: bounds?.max,
    qualityLevel: preset,
    adaptationPriority: SETTING_ADAPTATION_PRIORITIES[key],
    estimatedImpact: SETTING_PERFORMANCE_IMPACT[key],
    override: effectiveOverride,
    mode: effectiveOverride !== undefined ? "manual" : "auto",
    isLocked,
  };
}

/**
 * Constructs a full UnifiedQualitySettings object from raw values and overrides.
 */
export function buildUnifiedSettings(
  values: QualityValues,
  preset: QualityPresetName,
  overrides?: QualityOverrides,
  lockedSettings?: Set<QualitySettingKey>
): UnifiedQualitySettings {
  const keys = Object.keys(values) as QualitySettingKey[];
  const settings: any = {};

  for (const k of keys) {
    const autoVal = values[k];
    const userOverride = overrides?.[k];
    const isLocked = lockedSettings ? lockedSettings.has(k) : false;
    settings[k] = createSettingDescriptor(k, autoVal, preset, userOverride, isLocked);
  }

  return settings as UnifiedQualitySettings;
}

/**
 * Extracts raw current values from a UnifiedQualitySettings map.
 */
export function extractQualityValues(settings: UnifiedQualitySettings): QualityValues {
  const keys = Object.keys(settings) as QualitySettingKey[];
  const values: any = {};
  for (const k of keys) {
    values[k] = settings[k].current;
  }
  return values as QualityValues;
}

/**
 * Creates a complete QualityProfile from a preset name or custom options.
 */
export function createQualityProfile(
  presetOrOverrides: QualityPresetName | QualityOverrides = "high",
  overrides?: QualityOverrides,
  options: {
    isAutoAdaptive?: boolean;
    isLocked?: boolean;
    lockedSettings?: Set<QualitySettingKey>;
  } = {}
): QualityProfile {
  let preset: QualityPresetName;
  let baseValues: QualityValues;
  let combinedOverrides: QualityOverrides = { ...overrides };

  if (typeof presetOrOverrides === "string") {
    preset = presetOrOverrides;
    if (preset === "custom") {
      baseValues = { ...QUALITY_PRESET_VALUES.balanced };
    } else {
      baseValues = { ...QUALITY_PRESET_VALUES[preset] };
    }
  } else {
    preset = "custom";
    baseValues = { ...QUALITY_PRESET_VALUES.balanced };
    combinedOverrides = { ...presetOrOverrides, ...overrides };
  }

  const settings = buildUnifiedSettings(
    baseValues,
    preset,
    Object.keys(combinedOverrides).length > 0 ? combinedOverrides : undefined,
    options.lockedSettings
  );

  const values = extractQualityValues(settings);

  return {
    preset,
    settings,
    values,
    isAutoAdaptive: options.isAutoAdaptive ?? true,
    isLocked: options.isLocked ?? false,
    timestamp: Date.now(),
  };
}

/**
 * Returns the next lower preset in the degradation ladder, or null if already at lowest.
 */
export function getLowerPreset(
  current: QualityPresetName
): Exclude<QualityPresetName, "custom"> | null {
  if (current === "custom") return "balanced";
  const idx = ORDERED_PRESETS.indexOf(current);
  if (idx < 0 || idx >= ORDERED_PRESETS.length - 1) return null;
  return ORDERED_PRESETS[idx + 1];
}

/**
 * Returns the next higher preset in the recovery ladder, or null if already at highest.
 */
export function getHigherPreset(
  current: QualityPresetName
): Exclude<QualityPresetName, "custom"> | null {
  if (current === "custom") return "balanced";
  const idx = ORDERED_PRESETS.indexOf(current);
  if (idx <= 0) return null;
  return ORDERED_PRESETS[idx - 1];
}
