/**
 * AF Motion — CPU, Memory, Display & Hardware Intelligence
 *
 * Safe probing of CPU cores, device memory, JS heap metrics, display characteristics,
 * battery and network conditions with explicit status tracking and zero fabrication.
 */

import type {
  CpuCapabilityInfo,
  MemoryCapabilityInfo,
  DisplayCapabilityInfo,
  NetworkCapabilityInfo,
  BatteryCapabilityInfo,
  MockEnvironment,
  ValueWithStatus,
} from "./types.js";

function makeValue<T>(
  value: T,
  status: ValueWithStatus<T>["status"],
  details?: string
): ValueWithStatus<T> {
  return { value, status, details };
}

/**
 * Detects CPU capabilities: concurrency, WebAssembly, SharedArrayBuffer, and Worker support.
 */
export function detectCpuCapabilities(mockEnv?: MockEnvironment): CpuCapabilityInfo {
  if (mockEnv?.hardwareConcurrency !== undefined) {
    return {
      concurrency: makeValue(mockEnv.hardwareConcurrency, "detected", "Mocked CPU concurrency"),
      wasmSupported: makeValue(true, "detected", "Mocked WASM support"),
      sharedArrayBuffer: makeValue(mockEnv.sharedArrayBuffer ?? true, "detected", "Mocked SharedArrayBuffer"),
      simdSupported: makeValue(true, "estimated", "Mocked SIMD"),
      workerAvailable: makeValue(true, "detected", "Mocked Worker"),
    };
  }

  // 1. Concurrency
  let concurrency = 1;
  let concurrencyStatus: ValueWithStatus<number>["status"] = "unknown";
  try {
    if (typeof navigator !== "undefined" && typeof navigator.hardwareConcurrency === "number") {
      concurrency = Math.max(1, navigator.hardwareConcurrency);
      concurrencyStatus = "detected";
    } else {
      concurrency = 2; // conservative estimate for unknown runtime
      concurrencyStatus = "estimated";
    }
  } catch {
    concurrency = 1;
    concurrencyStatus = "unknown";
  }

  // 2. WebAssembly
  let wasmSupported = false;
  let wasmStatus: ValueWithStatus<boolean>["status"] = "unsupported";
  try {
    if (typeof WebAssembly !== "undefined" && typeof WebAssembly.validate === "function") {
      wasmSupported = true;
      wasmStatus = "detected";
    }
  } catch {
    wasmStatus = "unsupported";
  }

  // 3. SharedArrayBuffer
  let sabSupported = false;
  let sabStatus: ValueWithStatus<boolean>["status"] = "unsupported";
  try {
    if (typeof SharedArrayBuffer !== "undefined") {
      sabSupported = true;
      sabStatus = "detected";
    }
  } catch {
    sabStatus = "unsupported";
  }

  // 4. Web Workers
  let workerAvailable = false;
  let workerStatus: ValueWithStatus<boolean>["status"] = "unsupported";
  try {
    if (typeof Worker !== "undefined") {
      workerAvailable = true;
      workerStatus = "detected";
    }
  } catch {
    workerStatus = "unsupported";
  }

  return {
    concurrency: makeValue(concurrency, concurrencyStatus),
    wasmSupported: makeValue(wasmSupported, wasmStatus),
    sharedArrayBuffer: makeValue(sabSupported, sabStatus),
    simdSupported: makeValue(wasmSupported, wasmSupported ? "estimated" : "unsupported"),
    workerAvailable: makeValue(workerAvailable, workerStatus),
  };
}

/**
 * Detects device memory and JavaScript heap metrics where exposed.
 */
export function detectMemoryCapabilities(mockEnv?: MockEnvironment): MemoryCapabilityInfo {
  if (mockEnv?.deviceMemory !== undefined) {
    return {
      deviceMemoryGB: makeValue(mockEnv.deviceMemory, "detected", "Mocked device memory"),
      jsHeapLimitMB: makeValue(mockEnv.jsHeapSizeLimit ?? 2048, "detected", "Mocked JS heap limit"),
      totalJSHeapMB: makeValue(mockEnv.totalJSHeapSize ?? 256, "detected", "Mocked total heap"),
      usedJSHeapMB: makeValue(mockEnv.usedJSHeapSize ?? 128, "detected", "Mocked used heap"),
    };
  }

  // 1. Device Memory API (Chrome/Edge on Desktop/Android)
  let deviceMemory: number | null = null;
  let memoryStatus: ValueWithStatus<number | null>["status"] = "unsupported";
  try {
    if (typeof navigator !== "undefined" && "deviceMemory" in navigator) {
      const mem = (navigator as { deviceMemory?: number }).deviceMemory;
      if (typeof mem === "number" && Number.isFinite(mem)) {
        deviceMemory = mem;
        memoryStatus = "detected";
      }
    }
  } catch {
    memoryStatus = "unavailable";
  }

  // 2. Performance Memory API (Chromium-specific)
  let jsHeapLimitMB: number | null = null;
  let totalJSHeapMB: number | null = null;
  let usedJSHeapMB: number | null = null;
  let heapStatus: ValueWithStatus<number | null>["status"] = "unsupported";

  try {
    if (typeof performance !== "undefined" && "memory" in performance) {
      const pMem = (performance as any).memory;
      if (pMem && typeof pMem === "object") {
        if (typeof pMem.jsHeapSizeLimit === "number") {
          jsHeapLimitMB = Math.round(pMem.jsHeapSizeLimit / (1024 * 1024));
        }
        if (typeof pMem.totalJSHeapSize === "number") {
          totalJSHeapMB = Math.round(pMem.totalJSHeapSize / (1024 * 1024));
        }
        if (typeof pMem.usedJSHeapSize === "number") {
          usedJSHeapMB = Math.round(pMem.usedJSHeapSize / (1024 * 1024));
        }
        heapStatus = "detected";
      }
    }
  } catch {
    heapStatus = "unavailable";
  }

  return {
    deviceMemoryGB: makeValue(deviceMemory, memoryStatus),
    jsHeapLimitMB: makeValue(jsHeapLimitMB, heapStatus),
    totalJSHeapMB: makeValue(totalJSHeapMB, heapStatus),
    usedJSHeapMB: makeValue(usedJSHeapMB, heapStatus),
  };
}

/**
 * Detects display metrics, pixel ratio, viewport boundaries, and accessibility preferences.
 */
export function detectDisplayCapabilities(mockEnv?: MockEnvironment): DisplayCapabilityInfo {
  if (mockEnv?.dpr !== undefined || mockEnv?.reducedMotion !== undefined) {
    return {
      dpr: makeValue(mockEnv.dpr ?? 1, "detected", "Mocked DPR"),
      viewportWidth: makeValue(1920, "detected", "Mocked Viewport"),
      viewportHeight: makeValue(1080, "detected", "Mocked Viewport"),
      screenWidth: makeValue(1920, "detected", "Mocked Screen"),
      screenHeight: makeValue(1080, "detected", "Mocked Screen"),
      colorDepth: makeValue(24, "detected", "Mocked Depth"),
      colorSpace: makeValue("srgb", "detected", "Mocked ColorSpace"),
      reducedMotion: makeValue(mockEnv.reducedMotion ?? false, "detected", "Mocked Reduced Motion"),
      reducedTransparency: makeValue(false, "detected"),
      highContrast: makeValue(false, "detected"),
      colorScheme: makeValue("dark", "detected"),
    };
  }

  const isBrowser = typeof window !== "undefined";

  let dpr = 1;
  let dprStatus: ValueWithStatus<number>["status"] = "unknown";
  let vpWidth = 0;
  let vpHeight = 0;
  let screenW = 0;
  let screenH = 0;
  let colorDepth = 24;
  let colorSpace: "srgb" | "display-p3" = "srgb";

  let reducedMotion = false;
  let reducedTransparency = false;
  let highContrast = false;
  let colorScheme: "light" | "dark" | "unknown" = "unknown";

  if (isBrowser) {
    try {
      if (typeof window.devicePixelRatio === "number" && !Number.isNaN(window.devicePixelRatio)) {
        dpr = Math.max(1, window.devicePixelRatio);
        dprStatus = "detected";
      }
      vpWidth = window.innerWidth || 0;
      vpHeight = window.innerHeight || 0;

      if (window.screen) {
        screenW = window.screen.width || 0;
        screenH = window.screen.height || 0;
        colorDepth = window.screen.colorDepth || 24;
      }

      if (typeof window.matchMedia === "function") {
        reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        reducedTransparency = window.matchMedia("(prefers-reduced-transparency: reduce)").matches;
        highContrast = window.matchMedia("(forced-colors: active)").matches;

        if (window.matchMedia("(color-gamut: p3)").matches) {
          colorSpace = "display-p3";
        }

        if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
          colorScheme = "dark";
        } else if (window.matchMedia("(prefers-color-scheme: light)").matches) {
          colorScheme = "light";
        }
      }
    } catch {
      dprStatus = "unknown";
    }
  }

  return {
    dpr: makeValue(dpr, dprStatus),
    viewportWidth: makeValue(vpWidth, isBrowser ? "detected" : "unknown"),
    viewportHeight: makeValue(vpHeight, isBrowser ? "detected" : "unknown"),
    screenWidth: makeValue(screenW, isBrowser ? "detected" : "unknown"),
    screenHeight: makeValue(screenH, isBrowser ? "detected" : "unknown"),
    colorDepth: makeValue(colorDepth, isBrowser ? "detected" : "unknown"),
    colorSpace: makeValue(colorSpace, isBrowser ? "detected" : "unknown"),
    reducedMotion: makeValue(reducedMotion, isBrowser ? "detected" : "unknown"),
    reducedTransparency: makeValue(reducedTransparency, isBrowser ? "detected" : "unknown"),
    highContrast: makeValue(highContrast, isBrowser ? "detected" : "unknown"),
    colorScheme: makeValue(colorScheme, isBrowser ? "detected" : "unknown"),
  };
}

/**
 * Detects network connectivity and bandwidth indicators where available.
 */
export function detectNetworkCapabilities(mockEnv?: MockEnvironment): NetworkCapabilityInfo {
  if (mockEnv?.online !== undefined || mockEnv?.effectiveType !== undefined) {
    return {
      online: makeValue(mockEnv.online ?? true, "detected", "Mocked Network"),
      effectiveType: makeValue(mockEnv.effectiveType ?? "4g", "detected", "Mocked Network"),
      downlinkMbps: makeValue(10, "detected", "Mocked Network"),
      rttMs: makeValue(50, "detected", "Mocked Network"),
      saveData: makeValue(mockEnv.saveData ?? false, "detected", "Mocked Network"),
    };
  }

  let online = true;
  let effectiveType = "unknown";
  let downlinkMbps: number | null = null;
  let rttMs: number | null = null;
  let saveData = false;
  let status: ValueWithStatus<boolean>["status"] = "unknown";

  try {
    if (typeof navigator !== "undefined") {
      if (typeof navigator.onLine === "boolean") {
        online = navigator.onLine;
        status = "detected";
      }

      if ("connection" in navigator) {
        const conn = (navigator as any).connection;
        if (conn && typeof conn === "object") {
          if (typeof conn.effectiveType === "string") effectiveType = conn.effectiveType;
          if (typeof conn.downlink === "number") downlinkMbps = conn.downlink;
          if (typeof conn.rtt === "number") rttMs = conn.rtt;
          if (typeof conn.saveData === "boolean") saveData = conn.saveData;
        }
      }
    }
  } catch {
    status = "unavailable";
  }

  return {
    online: makeValue(online, status),
    effectiveType: makeValue(effectiveType, effectiveType !== "unknown" ? "detected" : "unsupported"),
    downlinkMbps: makeValue(downlinkMbps, downlinkMbps !== null ? "detected" : "unsupported"),
    rttMs: makeValue(rttMs, rttMs !== null ? "detected" : "unsupported"),
    saveData: makeValue(saveData, status),
  };
}

/**
 * Detects battery level and charging state if Battery Status API is available.
 */
export function detectBatteryCapabilities(mockEnv?: MockEnvironment): BatteryCapabilityInfo {
  if (mockEnv?.batteryCharging !== undefined || mockEnv?.batteryLevel !== undefined) {
    return {
      charging: makeValue(mockEnv.batteryCharging ?? true, "detected", "Mocked Battery"),
      level: makeValue(mockEnv.batteryLevel ?? 1.0, "detected", "Mocked Battery"),
      chargingTime: makeValue(0, "detected"),
      dischargingTime: makeValue(Infinity, "detected"),
    };
  }

  // Synchronous initial detection returns unsupported/unavailable until async probe queries
  return {
    charging: makeValue(null, "unknown", "Battery status requires async probe"),
    level: makeValue(null, "unknown", "Battery status requires async probe"),
    chargingTime: makeValue(null, "unknown"),
    dischargingTime: makeValue(null, "unknown"),
  };
}
