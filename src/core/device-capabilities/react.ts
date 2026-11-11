/**
 * AF Motion — React Device Capability Hooks
 *
 * React 18 & 19 compatible hooks for accessing device profiles, graphics ceilings,
 * and live capability changes with SSR safety and Strict Mode cleanup.
 */

"use client";

import { useState, useEffect, useRef } from "react";
import type {
  DeviceCapabilityProfile,
  DeviceDetectionOptions,
  CapabilityChangeListener,
} from "./types.js";
import {
  detectDeviceCapabilities,
  getDeviceCapabilityProfile,
} from "./detection.js";
import { subscribeToCapabilityChanges } from "./monitor.js";
import type { DetailedGraphicsReport } from "./graphics.js";
import { detectDetailedGraphics } from "./graphics.js";

/**
 * React hook to retrieve the current device capability profile.
 * SSR-safe: returns default initial profile on server, re-evaluates on client mount.
 */
export function useDeviceCapabilities(
  options: DeviceDetectionOptions = {}
): DeviceCapabilityProfile {
  const [profile, setProfile] = useState<DeviceCapabilityProfile>(() => {
    // If SSR or Node, return SSR-safe profile without accessing browser globals
    if (typeof window === "undefined" || typeof document === "undefined") {
      return detectDeviceCapabilities({ mockEnvironment: { isSSR: true } });
    }
    return getDeviceCapabilityProfile();
  });

  useEffect(() => {
    const current = detectDeviceCapabilities(options);
    setProfile(current);

    const subscription = subscribeToCapabilityChanges((newProfile) => {
      setProfile(newProfile);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return profile;
}

/**
 * React hook specifically for WebGL/WebGPU graphics capabilities.
 */
export function useDetailedGraphicsCapabilities(
  options: { testCanvas?: HTMLCanvasElement | null } = {}
): DetailedGraphicsReport {
  const [graphics, setGraphics] = useState<DetailedGraphicsReport>(() => {
    return detectDetailedGraphics(options);
  });

  useEffect(() => {
    setGraphics(detectDetailedGraphics(options));
  }, [options.testCanvas]);

  return graphics;
}

export { useDetailedGraphicsCapabilities as useGraphicsCapabilities };

/**
 * React hook to subscribe to live capability updates (e.g. orientation, reduced motion, network).
 */
export function useDeviceCapabilityChanges(
  onChange: CapabilityChangeListener
): void {
  const callbackRef = useRef<CapabilityChangeListener>(onChange);
  callbackRef.current = onChange;

  useEffect(() => {
    const subscription = subscribeToCapabilityChanges((profile, changedKeys) => {
      callbackRef.current(profile, changedKeys);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);
}
