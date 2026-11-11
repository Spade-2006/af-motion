/**
 * AF Motion — Deterministic Device Classification
 *
 * Multi-signal device categorization (Low/Standard/High Mobile & Desktop, Tablet, Unknown)
 * balancing hardware concurrency, memory estimates, GPU limits, and touch characteristics.
 */

import type {
  DeviceCategory,
  CpuCapabilityInfo,
  MemoryCapabilityInfo,
  WebGLCapabilitiesInfo,
  DisplayCapabilityInfo,
  RuntimeEnvironmentInfo,
} from "./types.js";

export interface DeviceClassificationResult {
  readonly category: DeviceCategory;
  readonly rationale: string;
  readonly isMobile: boolean;
  readonly isTablet: boolean;
  readonly isDesktop: boolean;
}

/**
 * Classifies a device profile into a deterministic category with explainable rationale.
 */
export function classifyDevice(signals: {
  runtime: RuntimeEnvironmentInfo;
  cpu: CpuCapabilityInfo;
  memory: MemoryCapabilityInfo;
  webgl: WebGLCapabilitiesInfo;
  display: DisplayCapabilityInfo;
  touchSupport?: boolean;
}): DeviceClassificationResult {
  const { runtime, cpu, memory, webgl, display } = signals;

  if (runtime.isSSR || runtime.isNode) {
    return {
      category: "unknown",
      rationale: "Server or headless Node.js environment detected.",
      isMobile: false,
      isTablet: false,
      isDesktop: false,
    };
  }

  const concurrency = cpu.concurrency.value;
  const memGB = memory.deviceMemoryGB.value;
  const maxTex = webgl.maxTextureSize.value;
  const hasWebGL2 = webgl.webgl2.value;

  const vpW = display.viewportWidth.value;
  const vpH = display.viewportHeight.value;
  const minDim = Math.min(vpW, vpH);
  const maxDim = Math.max(vpW, vpH);

  const ua = runtime.userAgent.value.toLowerCase();
  const touch = signals.touchSupport ?? (typeof navigator !== "undefined" && (navigator.maxTouchPoints > 0 || "ontouchstart" in (globalThis as any)));

  // Tablet heuristic: touch screen with minimum viewport dimension >= 600px
  const isTablet = touch && (minDim >= 600 || ua.includes("ipad") || (ua.includes("android") && !ua.includes("mobile")));

  // Mobile heuristic: touch screen or mobile user agent
  const isMobile = !isTablet && (touch && minDim < 600 || ua.includes("mobile") || ua.includes("iphone") || ua.includes("android"));

  const isDesktop = !isMobile && !isTablet && (runtime.isBrowser || !touch);

  if (isTablet) {
    return {
      category: "tablet",
      rationale: `Touch device with tablet dimensions (${vpW}x${vpH}, minDim ${minDim}px >= 600px).`,
      isMobile: false,
      isTablet: true,
      isDesktop: false,
    };
  }

  if (isMobile) {
    // 1. High-end Mobile
    if (hasWebGL2 && (concurrency >= 8 || (memGB !== null && memGB >= 6)) && maxTex >= 4096) {
      return {
        category: "high-end-mobile",
        rationale: `High-end mobile: WebGL2 enabled, ${concurrency} CPU cores, ${memGB ? `${memGB}GB RAM, ` : ""}max texture size ${maxTex}px.`,
        isMobile: true,
        isTablet: false,
        isDesktop: false,
      };
    }

    // 2. Low-end Mobile
    if (!hasWebGL2 || concurrency <= 2 || (memGB !== null && memGB <= 2) || maxTex <= 2048) {
      return {
        category: "low-end-mobile",
        rationale: `Low-end mobile: ${!hasWebGL2 ? "No WebGL2" : `max texture size ${maxTex}px`}, ${concurrency} CPU cores${memGB ? `, ${memGB}GB RAM` : ""}.`,
        isMobile: true,
        isTablet: false,
        isDesktop: false,
      };
    }

    // 3. Standard Mobile
    return {
      category: "standard-mobile",
      rationale: `Standard mobile: WebGL2 active, ${concurrency} CPU cores, max texture size ${maxTex}px.`,
      isMobile: true,
      isTablet: false,
      isDesktop: false,
    };
  }

  if (isDesktop) {
    // 1. High-end Desktop
    if (hasWebGL2 && concurrency >= 8 && maxTex >= 8192 && (memGB === null || memGB >= 8)) {
      return {
        category: "high-end-desktop",
        rationale: `High-end desktop: WebGL2, ${concurrency} CPU cores, max texture size ${maxTex}px${memGB ? `, ${memGB}GB RAM` : ""}.`,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
      };
    }

    // 2. Low-end Desktop
    if (!hasWebGL2 || concurrency <= 2 || maxTex <= 4096 || (memGB !== null && memGB <= 4)) {
      return {
        category: "low-end-desktop",
        rationale: `Low-end desktop: ${!hasWebGL2 ? "No WebGL2" : `${concurrency} CPU cores, max texture size ${maxTex}px`}${memGB ? `, ${memGB}GB RAM` : ""}.`,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
      };
    }

    // 3. Standard Desktop
    return {
      category: "standard-desktop",
      rationale: `Standard desktop: WebGL2, ${concurrency} CPU cores, max texture size ${maxTex}px.`,
      isMobile: false,
      isTablet: false,
      isDesktop: true,
    };
  }

  return {
    category: "unknown",
    rationale: "Insufficient multi-signal data to classify device.",
    isMobile: false,
    isTablet: false,
    isDesktop: false,
  };
}
