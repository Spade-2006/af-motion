/**
 * AF Motion — Initial Quality Recommendation Engine
 *
 * Synthesizes hardware capabilities, GPU/CPU benchmarks, power state,
 * display traits, and user preferences into explainable initial quality profiles.
 */

import type { DeviceCapabilityProfile } from "../device-capabilities/types.js";
import { getDeviceCapabilityProfile } from "../device-capabilities/detection.js";
import type {
  QualityPresetName,
  QualityRecommendation,
  UserQualityPreferences,
  QualityValues,
} from "./types.js";
import {
  QUALITY_PRESET_VALUES,
  clampNumericSetting,
} from "./profile.js";

function confidenceToNumeric(conf: "high" | "medium" | "low"): number {
  if (conf === "high") return 1.0;
  if (conf === "medium") return 0.7;
  return 0.4;
}

/**
 * Generates an initial quality recommendation based on device capability signals.
 */
export function getRecommendedQuality(
  capabilities?: DeviceCapabilityProfile,
  preferences: UserQualityPreferences = {}
): QualityRecommendation {
  const profile = capabilities ?? getDeviceCapabilityProfile();
  const rationale: string[] = [];

  const scores = {
    cpu: profile.scores.cpu.score,
    memory: profile.scores.memory.score,
    gpu: profile.scores.gpu.score,
    composite: profile.scores.overallScore,
  };

  const deviceCategory = profile.category;
  let recommendedPreset: Exclude<QualityPresetName, "custom"> = "balanced";
  let confidence =
    confidenceToNumeric(profile.scores.gpu.confidence) * 0.5 +
    confidenceToNumeric(profile.scores.cpu.confidence) * 0.5;

  // 1. Initial baseline from composite capability score & GPU capabilities
  if (scores.composite >= 85 && scores.gpu >= 80) {
    recommendedPreset = "ultra";
    rationale.push(`High composite score (${scores.composite}) and GPU score (${scores.gpu}) qualify for Ultra quality.`);
  } else if (scores.composite >= 65 && scores.gpu >= 60) {
    recommendedPreset = "high";
    rationale.push(`Robust composite score (${scores.composite}) and GPU capabilities support High quality.`);
  } else if (scores.composite >= 40 && scores.gpu >= 35) {
    recommendedPreset = "balanced";
    rationale.push(`Moderate capability profile (${scores.composite}) targets Balanced 60 FPS quality.`);
  } else {
    recommendedPreset = "performance";
    rationale.push(`Resource-constrained hardware (${scores.composite}) defaults to Performance tier.`);
  }

  // 2. Hardware backend constraints
  const hasWebGPU = profile.webgpu.apiAvailable.value === true;
  const hasWebGL2 = profile.webgl.webgl2.value === true;
  if (!hasWebGL2 && !hasWebGPU) {
    if (recommendedPreset === "ultra" || recommendedPreset === "high") {
      recommendedPreset = "balanced";
      rationale.push("WebGL2 is unavailable; clamped from high to Balanced.");
    }
  }

  // 3. Device category heuristics
  if (deviceCategory === "low-end-mobile") {
    if (recommendedPreset !== "performance" && (recommendedPreset as string) !== "battery-saver") {
      recommendedPreset = "performance";
      rationale.push("Device classified as low-end mobile; clamped to Performance tier.");
    }
  } else if (deviceCategory === "high-end-desktop" && hasWebGPU && scores.gpu >= 75) {
    if (recommendedPreset === "high") {
      recommendedPreset = "ultra";
      rationale.push("High-end desktop with WebGPU support promoted to Ultra.");
    }
  }

  // 4. Power & Battery awareness
  const battery = profile.battery;
  const isBatteryRestricted =
    battery &&
    battery.level.status === "detected" &&
    battery.level.value !== null &&
    battery.level.value !== undefined &&
    battery.level.value <= 0.2 &&
    battery.charging.value === false;

  const isSaveData =
    profile.network.saveData.status === "detected" &&
    profile.network.saveData.value === true;

  if (isBatteryRestricted) {
    recommendedPreset = "battery-saver";
    const pct = battery.level.value !== null && battery.level.value !== undefined
      ? Math.round(battery.level.value * 100)
      : 20;
    rationale.push(`Battery critically low (${pct}%) and not charging; enforced Battery Saver.`);
    confidence = Math.max(confidence, 0.9);
  } else if (isSaveData) {
    if (recommendedPreset === "ultra" || recommendedPreset === "high") {
      recommendedPreset = "balanced";
      rationale.push("Data saver / save-data mode detected; reduced texture and bandwidth demands to Balanced.");
    }
  }

  // 5. User preference modifications
  if (preferences.initialPreset && preferences.initialPreset !== "custom") {
    recommendedPreset = preferences.initialPreset;
    rationale.push(`User requested initial preset override: "${preferences.initialPreset}".`);
  } else if (preferences.preference === "power") {
    if (recommendedPreset !== "battery-saver") {
      recommendedPreset = "battery-saver";
      rationale.push("User preference set to 'power'; applied Battery Saver preset.");
    }
  } else if (preferences.preference === "performance") {
    if (recommendedPreset === "ultra") recommendedPreset = "high";
    else if (recommendedPreset === "high") recommendedPreset = "balanced";
    else if (recommendedPreset === "balanced") recommendedPreset = "performance";
    rationale.push("User preference set to 'performance'; shifted down one quality tier for higher frame stability.");
  } else if (preferences.preference === "quality") {
    if (recommendedPreset === "performance") recommendedPreset = "balanced";
    else if (recommendedPreset === "balanced" && scores.composite >= 55) recommendedPreset = "high";
    rationale.push("User preference set to 'quality'; prioritized visual fidelity.");
  }

  // 6. Assemble baseline values and apply dimensional adaptations
  const baselineValues: QualityValues = { ...QUALITY_PRESET_VALUES[recommendedPreset] };

  // Display and DPR ceiling
  if (preferences.maxDpr !== undefined) {
    baselineValues.dpr = Math.min(baselineValues.dpr, preferences.maxDpr);
    rationale.push(`DPR capped to ${preferences.maxDpr} by user preference.`);
  } else if (profile.display.dpr.status === "detected" && profile.display.dpr.value) {
    baselineValues.dpr = Math.min(baselineValues.dpr, profile.display.dpr.value);
  }

  // Reduced motion preference
  const isReducedMotion =
    profile.display.reducedMotion.status === "detected" &&
    profile.display.reducedMotion.value === true;

  if (isReducedMotion) {
    baselineValues.particleDensity = Math.min(baselineValues.particleDensity, 0.3);
    baselineValues.animationQuality = "low";
    baselineValues.environmentalDetail = "low";
    rationale.push("prefers-reduced-motion is active; subdued particle density and animation complexity.");
  }

  // Custom user overrides
  if (preferences.overrides) {
    for (const [k, v] of Object.entries(preferences.overrides)) {
      if (v !== undefined) {
        (baselineValues as any)[k] = typeof v === "number" ? clampNumericSetting(k as any, v) : v;
        rationale.push(`Applied explicit user override on '${k}': ${String(v)}.`);
      }
    }
  }

  return {
    preset: preferences.initialPreset ?? recommendedPreset,
    values: baselineValues,
    rationale,
    scores,
    deviceCategory,
    confidence: Number(confidence.toFixed(2)),
  };
}
