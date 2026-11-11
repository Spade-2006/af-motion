/**
 * AF Motion Device Capability Detection
 *
 * Detects pointer support, touch capability, maximum touch points,
 * hover capabilities, and primary input hardware.
 */

import type { DeviceCapabilities } from "./types.js";

/**
 * Inspects browser environment and media queries to determine input capabilities.
 * Safe for server-side rendering (SSR).
 */
export function getDeviceCapabilities(): DeviceCapabilities {
  if (typeof window === "undefined") {
    return {
      touchSupport: false,
      pointerSupport: false,
      maxTouchPoints: 0,
      primaryInput: "mouse",
      hoverSupport: true,
    };
  }

  const maxTouchPoints =
    typeof navigator !== "undefined" && typeof navigator.maxTouchPoints === "number"
      ? navigator.maxTouchPoints
      : 0;

  const touchSupport = maxTouchPoints > 0 || "ontouchstart" in window;
  const pointerSupport = typeof window.PointerEvent !== "undefined";

  let hoverSupport = true;
  let primaryInput: "mouse" | "touch" | "pen" = "mouse";

  if (typeof window.matchMedia === "function") {
    try {
      if (window.matchMedia("(hover: none)").matches) {
        hoverSupport = false;
      }
      if (window.matchMedia("(pointer: coarse)").matches) {
        primaryInput = "touch";
      }
    } catch {
      // In testing environments where matchMedia is mocked or unsupported
    }
  }

  if (touchSupport && !hoverSupport) {
    primaryInput = "touch";
  }

  return {
    touchSupport,
    pointerSupport,
    maxTouchPoints,
    primaryInput,
    hoverSupport,
  };
}
