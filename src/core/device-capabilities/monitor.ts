/**
 * AF Motion — Live Capability Monitoring
 *
 * Event-driven, zero-polling live listener infrastructure observing WebGL context loss,
 * DPR changes, viewport resizing, visibility, reduced motion, and network events.
 */

import type {
  DeviceCapabilityProfile,
  CapabilityChangeListener,
  CapabilitySubscription,
} from "./types.js";
import {
  detectDeviceCapabilities,
  refreshDeviceCapabilities,
  getDeviceCapabilityProfile,
} from "./detection.js";

const listeners = new Set<CapabilityChangeListener>();
let cleanupFns: Array<() => void> = [];
let isMonitoring = false;

function notifyListeners(changedKeys: string[]): void {
  const newProfile = refreshDeviceCapabilities();
  for (const listener of listeners) {
    try {
      listener(newProfile, changedKeys);
    } catch {
      // Isolate listener errors
    }
  }
}

/**
 * Initializes global event-driven capability listeners once.
 */
function ensureMonitoringStarted(): void {
  if (isMonitoring) return;
  isMonitoring = true;

  if (typeof window === "undefined") return;

  // 1. Reduced Motion Preference
  try {
    if (typeof window.matchMedia === "function") {
      const media = window.matchMedia("(prefers-reduced-motion: reduce)");
      const onMotionChange = (): void => notifyListeners(["display.reducedMotion"]);
      if (typeof media.addEventListener === "function") {
        media.addEventListener("change", onMotionChange);
        cleanupFns.push(() => media.removeEventListener("change", onMotionChange));
      } else if (typeof (media as any).addListener === "function") {
        (media as any).addListener(onMotionChange);
        cleanupFns.push(() => (media as any).removeListener(onMotionChange));
      }
    }
  } catch {
    // Ignore matchMedia failure
  }

  // 2. Viewport & Orientation
  try {
    const onResize = (): void => notifyListeners(["display.viewport"]);
    window.addEventListener("resize", onResize, { passive: true });
    cleanupFns.push(() => window.removeEventListener("resize", onResize));

    if ("onorientationchange" in window) {
      window.addEventListener("orientationchange", onResize, { passive: true });
      cleanupFns.push(() => window.removeEventListener("orientationchange", onResize));
    }
  } catch {
    // Ignore window event failure
  }

  // 3. Document Visibility
  try {
    if (typeof document !== "undefined") {
      const onVisibility = (): void => notifyListeners(["runtime.visibility"]);
      document.addEventListener("visibilitychange", onVisibility, { passive: true });
      cleanupFns.push(() => document.removeEventListener("visibilitychange", onVisibility));
    }
  } catch {
    // Ignore document event failure
  }

  // 4. Online / Offline Network
  try {
    const onOnline = (): void => notifyListeners(["network.online"]);
    window.addEventListener("online", onOnline, { passive: true });
    window.addEventListener("offline", onOnline, { passive: true });
    cleanupFns.push(() => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOnline);
    });

    if (typeof navigator !== "undefined" && "connection" in navigator) {
      const conn = (navigator as any).connection;
      if (conn && typeof conn.addEventListener === "function") {
        const onConnChange = (): void => notifyListeners(["network.connection"]);
        conn.addEventListener("change", onConnChange, { passive: true });
        cleanupFns.push(() => conn.removeEventListener("change", onConnChange));
      }
    }
  } catch {
    // Ignore network event failure
  }
}

/**
 * Subscribes to live capability changes and returns a subscription with an unsubscribe callback.
 */
export function subscribeToCapabilityChanges(
  listener: CapabilityChangeListener
): CapabilitySubscription {
  listeners.add(listener);
  ensureMonitoringStarted();

  return {
    unsubscribe: () => {
      listeners.delete(listener);
      if (listeners.size === 0) {
        disposeCapabilityMonitor();
      }
    },
  };
}

/**
 * Removes all active event listeners and clears subscriber registries.
 */
export function disposeCapabilityMonitor(): void {
  for (const cleanup of cleanupFns) {
    try {
      cleanup();
    } catch {
      // Suppress cleanup error
    }
  }
  cleanupFns = [];
  listeners.clear();
  isMonitoring = false;
}

/**
 * Checks whether active capability monitoring is currently running.
 */
export function isCapabilityMonitoringActive(): boolean {
  return isMonitoring;
}
