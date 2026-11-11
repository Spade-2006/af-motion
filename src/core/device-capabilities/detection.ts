/**
 * AF Motion — Consolidated Device Capability Detection Engine
 *
 * Core coordinator assembling runtime, hardware, graphics, display, network,
 * classification, and scoring into a comprehensive DeviceCapabilityProfile.
 */

import type {
  DeviceCapabilityProfile,
  DeviceDetectionOptions,
  MockEnvironment,
} from "./types.js";
import { detectRuntimeEnvironment } from "./runtime.js";
import {
  detectCpuCapabilities,
  detectMemoryCapabilities,
  detectDisplayCapabilities,
  detectNetworkCapabilities,
  detectBatteryCapabilities,
} from "./hardware.js";
import { detectDetailedGraphics } from "./graphics.js";
import { classifyDevice } from "./classification.js";
import { calculateCapabilityScores } from "./scoring.js";

const PROFILE_SCHEMA_VERSION = "1.0.0";
let cachedProfile: DeviceCapabilityProfile | null = null;

/**
 * Builds a consolidated device capability profile synchronously.
 */
export function detectDeviceCapabilities(
  options: DeviceDetectionOptions = {}
): DeviceCapabilityProfile {
  const { forceRefresh = false, mockEnvironment, testCanvas } = options;

  if (cachedProfile && !forceRefresh && !mockEnvironment && !testCanvas) {
    return cachedProfile;
  }

  // 1. Runtime environment
  const runtime = detectRuntimeEnvironment(mockEnvironment);

  // 2. CPU & Memory
  const cpu = detectCpuCapabilities(mockEnvironment);
  const memory = detectMemoryCapabilities(mockEnvironment);

  // 3. Graphics (WebGL & WebGPU)
  const graphics = detectDetailedGraphics({ testCanvas, mockEnv: mockEnvironment });

  // 4. Display, Network & Battery
  const display = detectDisplayCapabilities(mockEnvironment);
  const network = detectNetworkCapabilities(mockEnvironment);
  const battery = detectBatteryCapabilities(mockEnvironment);

  // 5. Device classification
  const classification = classifyDevice({
    runtime,
    cpu,
    memory,
    webgl: graphics.webgl,
    display,
  });

  // 6. Capability scoring
  const scores = calculateCapabilityScores({
    runtime,
    cpu,
    memory,
    webgl: graphics.webgl,
    webgpu: graphics.webgpu,
    display,
  });

  const profile: DeviceCapabilityProfile = Object.freeze({
    version: PROFILE_SCHEMA_VERSION,
    category: classification.category,
    categoryRationale: classification.rationale,
    scores,
    runtime,
    cpu,
    memory,
    webgl: graphics.webgl,
    webgpu: graphics.webgpu,
    supportedGraphicsBackends: graphics.supportedBackends,
    activeGraphicsBackend: graphics.activeBackend,
    display,
    network,
    battery,
    detectedAt: Date.now(),
  });

  if (!mockEnvironment && !testCanvas) {
    cachedProfile = profile;
  }

  return profile;
}

/**
 * Performs asynchronous advanced capability detection (probes WebGPU adapters, battery status, etc.).
 */
export async function detectDeviceCapabilitiesAsync(
  options: DeviceDetectionOptions = {}
): Promise<DeviceCapabilityProfile> {
  const { signal } = options;

  if (signal?.aborted) {
    throw new Error("Device capability detection aborted.");
  }

  // First generate base synchronous profile
  const baseProfile = detectDeviceCapabilities({ ...options, forceRefresh: true });

  // Asynchronously probe WebGPU adapter if API is present
  let updatedWebGPU = baseProfile.webgpu;
  if (typeof navigator !== "undefined" && "gpu" in navigator && (navigator as any).gpu) {
    try {
      const gpu = (navigator as any).gpu;
      if (typeof gpu.requestAdapter === "function") {
        const adapterPromise = gpu.requestAdapter();

        const adapter = signal
          ? await Promise.race([
              adapterPromise,
              new Promise((_, reject) => {
                signal.addEventListener("abort", () => reject(new Error("Aborted")), { once: true });
              }),
            ])
          : await adapterPromise;

        if (adapter) {
          const limits: Record<string, number> = {};
          if (adapter.limits) {
            for (const key in adapter.limits) {
              limits[key] = adapter.limits[key];
            }
          }

          const features: string[] = [];
          if (adapter.features) {
            for (const f of adapter.features) {
              features.push(String(f));
            }
          }

          updatedWebGPU = {
            ...baseProfile.webgpu,
            adapterAvailable: { value: true, status: "detected" },
            limits: { value: limits, status: "detected" },
            features: { value: features, status: "detected" },
          };
        }
      }
    } catch {
      // Permission blocked or adapter request failed gracefully
    }
  }

  // Asynchronously probe battery if API is present
  let updatedBattery = baseProfile.battery;
  if (typeof navigator !== "undefined" && "getBattery" in navigator) {
    try {
      const getBattery = (navigator as any).getBattery;
      if (typeof getBattery === "function") {
        const b = await getBattery();
        if (b) {
          updatedBattery = {
            charging: { value: b.charging, status: "detected" },
            level: { value: b.level, status: "detected" },
            chargingTime: { value: b.chargingTime, status: "detected" },
            dischargingTime: { value: b.dischargingTime, status: "detected" },
          };
        }
      }
    } catch {
      // Battery API disallowed
    }
  }

  const asyncProfile: DeviceCapabilityProfile = Object.freeze({
    ...baseProfile,
    webgpu: updatedWebGPU,
    battery: updatedBattery,
    detectedAt: Date.now(),
  });

  if (!options.mockEnvironment && !options.testCanvas) {
    cachedProfile = asyncProfile;
  }

  return asyncProfile;
}

/**
 * Returns currently cached capability profile, or runs synchronous detection if not yet populated.
 */
export function getDeviceCapabilityProfile(): DeviceCapabilityProfile {
  return cachedProfile ?? detectDeviceCapabilities();
}

/**
 * Clears cache and re-runs device capability detection.
 */
export function refreshDeviceCapabilities(
  options: DeviceDetectionOptions = {}
): DeviceCapabilityProfile {
  cachedProfile = null;
  return detectDeviceCapabilities({ ...options, forceRefresh: true });
}

/**
 * Resets cached profile for testing purposes.
 */
export function resetCachedDeviceProfile(): void {
  cachedProfile = null;
}
