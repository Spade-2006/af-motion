/**
 * AF Motion — Runtime Environment Detection
 *
 * Distinguishes Browser, Web Worker, Dedicated Worker, Node.js, and SSR contexts
 * without executing browser globals during module evaluation.
 */

import type {
  RuntimeEnvironment,
  RuntimeEnvironmentInfo,
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
 * Detects the runtime execution environment defensively.
 */
export function detectRuntimeEnvironment(
  mockEnv?: MockEnvironment
): RuntimeEnvironmentInfo {
  // If mock environment is supplied, prioritize it for deterministic testing
  if (mockEnv) {
    const isBrowser = mockEnv.isBrowser ?? false;
    const isWorker = mockEnv.isWorker ?? false;
    const isNode = mockEnv.isNode ?? false;
    const isSSR = mockEnv.isSSR ?? false;

    let env: RuntimeEnvironment = "unknown";
    if (isSSR) env = "ssr";
    else if (isNode) env = "node";
    else if (isWorker) env = "worker";
    else if (isBrowser) env = "browser";

    return {
      environment: makeValue(env, "detected", "Mocked runtime environment"),
      isBrowser,
      isWorker,
      isNode,
      isSSR,
      offscreenCanvasSupported: makeValue(isBrowser || isWorker, "estimated", "Mocked OffscreenCanvas"),
      userAgent: makeValue(mockEnv.userAgent ?? "MockAgent/1.0", "detected"),
      platform: makeValue(mockEnv.platform ?? "MockPlatform", "detected"),
      browserName: makeValue("MockBrowser", "detected"),
    };
  }

  // 1. Detect Node.js
  const g = typeof globalThis !== "undefined" ? (globalThis as any) : undefined;
  const isNode =
    g != null &&
    typeof g.process !== "undefined" &&
    g.process?.versions != null &&
    g.process?.versions?.node != null;

  // 2. Detect Browser Window & Document
  const hasWindow = typeof window !== "undefined";
  const hasDocument = typeof document !== "undefined";
  const isBrowser = hasWindow && hasDocument;

  // 3. Detect Web Worker
  const isWorker =
    g != null &&
    typeof g.WorkerGlobalScope !== "undefined" &&
    typeof self !== "undefined" &&
    self instanceof g.WorkerGlobalScope;

  // 4. Detect SSR (Node environment attempting to render or where window is absent)
  const isSSR = isNode && !isBrowser;

  let environment: RuntimeEnvironment = "unknown";
  if (isSSR) {
    environment = "ssr";
  } else if (isNode) {
    environment = "node";
  } else if (isWorker) {
    environment = "dedicated-worker";
  } else if (isBrowser) {
    environment = "browser";
  }

  // OffscreenCanvas detection
  let offscreenCanvas = false;
  let offscreenStatus: ValueWithStatus<boolean>["status"] = "unsupported";
  try {
    if (typeof OffscreenCanvas !== "undefined") {
      offscreenCanvas = true;
      offscreenStatus = "detected";
    }
  } catch {
    offscreenStatus = "unsupported";
  }

  // UserAgent & Platform detection
  let userAgent = "unknown";
  let uaStatus: ValueWithStatus<string>["status"] = "unavailable";
  let platform = "unknown";
  let platformStatus: ValueWithStatus<string>["status"] = "unavailable";
  let browserName = "unknown";

  try {
    if (typeof navigator !== "undefined") {
      if (typeof navigator.userAgent === "string") {
        userAgent = navigator.userAgent;
        uaStatus = "detected";

        // Simple browser detection from UA
        if (userAgent.includes("Chrome") && !userAgent.includes("Edg")) {
          browserName = "Chrome";
        } else if (userAgent.includes("Edg")) {
          browserName = "Edge";
        } else if (userAgent.includes("Firefox")) {
          browserName = "Firefox";
        } else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) {
          browserName = "Safari";
        } else {
          browserName = "Browser";
        }
      }

      if (typeof navigator.platform === "string") {
        platform = navigator.platform;
        platformStatus = "detected";
      }
    }
  } catch {
    uaStatus = "unavailable";
    platformStatus = "unavailable";
  }

  return {
    environment: makeValue(environment, "detected"),
    isBrowser,
    isWorker,
    isNode,
    isSSR,
    offscreenCanvasSupported: makeValue(offscreenCanvas, offscreenStatus),
    userAgent: makeValue(userAgent, uaStatus),
    platform: makeValue(platform, platformStatus),
    browserName: makeValue(browserName, uaStatus),
  };
}
