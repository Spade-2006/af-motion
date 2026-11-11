/**
 * AF Motion — React Adaptive Quality Hooks & Providers
 *
 * React 18 & 19 compatible hooks and components with Strict Mode safety,
 * SSR safety, and minimal re-render subscriptions.
 */

"use client";

import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  IAdaptiveQualityController,
  AdaptiveQualityControllerOptions,
  QualityProfile,
  PerformanceMetrics,
  QualityPresetName,
  QualitySettingKey,
  UnifiedQualitySettings,
  QualityAdaptationEvent,
} from "./types.js";
import {
  createAdaptiveQualityController,
  AdaptiveQualityController,
} from "./controller.js";
import { createQualityProfile } from "./profile.js";

export const AdaptiveQualityContext = createContext<IAdaptiveQualityController | null>(null);

export interface AdaptiveQualityProviderProps {
  controller?: IAdaptiveQualityController;
  options?: AdaptiveQualityControllerOptions;
  children?: ReactNode;
}

/**
 * Provides an AdaptiveQualityController to child React components via Context.
 */
export function AdaptiveQualityProvider({
  controller: externalController,
  options,
  children,
}: AdaptiveQualityProviderProps) {
  const internalControllerRef = useRef<AdaptiveQualityController | null>(null);

  if (!externalController && !internalControllerRef.current) {
    internalControllerRef.current = createAdaptiveQualityController(options);
  }

  const effectiveController = externalController ?? internalControllerRef.current!;

  useEffect(() => {
    return () => {
      // Only dispose if we created it internally
      if (internalControllerRef.current) {
        internalControllerRef.current.dispose();
        internalControllerRef.current = null;
      }
    };
  }, []);

  return createElement(
    AdaptiveQualityContext.Provider,
    { value: effectiveController },
    children
  );
}

/**
 * Accesses or creates an AdaptiveQualityController.
 */
export function useAdaptiveQuality(
  options?: AdaptiveQualityControllerOptions
): IAdaptiveQualityController {
  const contextController = useContext(AdaptiveQualityContext);
  const localControllerRef = useRef<AdaptiveQualityController | null>(null);

  if (!contextController && !localControllerRef.current) {
    localControllerRef.current = createAdaptiveQualityController(options);
  }

  useEffect(() => {
    return () => {
      if (localControllerRef.current) {
        localControllerRef.current.dispose();
        localControllerRef.current = null;
      }
    };
  }, []);

  return contextController ?? localControllerRef.current!;
}

/**
 * Hook to access and subscribe to the active QualityProfile.
 * SSR-safe: returns default SSR profile initially.
 */
export function useQualityProfile(
  controllerOrOptions?: IAdaptiveQualityController | AdaptiveQualityControllerOptions
): QualityProfile {
  const contextController = useContext(AdaptiveQualityContext);

  const controller = useMemo(() => {
    if (controllerOrOptions && "getQualityProfile" in controllerOrOptions) {
      return controllerOrOptions;
    }
    if (contextController) {
      return contextController;
    }
    return createAdaptiveQualityController(
      typeof controllerOrOptions === "object" && !("getQualityProfile" in controllerOrOptions)
        ? controllerOrOptions
        : undefined
    );
  }, [controllerOrOptions, contextController]);

  const [profile, setProfile] = useState<QualityProfile>(() => {
    if (typeof window === "undefined") {
      return createQualityProfile("balanced");
    }
    return controller.getQualityProfile();
  });

  useEffect(() => {
    setProfile(controller.getQualityProfile());

    const sub = controller.subscribe((newProfile) => {
      setProfile(newProfile);
    });

    return () => {
      sub.unsubscribe();
    };
  }, [controller]);

  return profile;
}

/**
 * Hook to query rolling PerformanceMetrics from an active controller.
 */
export function usePerformanceMetrics(
  controller?: IAdaptiveQualityController
): PerformanceMetrics {
  const activeController = useAdaptiveQuality();
  const target = controller ?? activeController;

  const [metrics, setMetrics] = useState<PerformanceMetrics>(() => target.getPerformanceMetrics());

  useEffect(() => {
    const sub = target.subscribe(() => {
      setMetrics(target.getPerformanceMetrics());
    });
    return () => {
      sub.unsubscribe();
    };
  }, [target]);

  return metrics;
}

/**
 * Full adaptive quality management hook exposing profile, metrics, history, and mutation actions.
 */
export function useQualityAdaptation(controller?: IAdaptiveQualityController) {
  const activeController = useAdaptiveQuality();
  const target = controller ?? activeController;
  const profile = useQualityProfile(target);

  const setQualityPreset = (preset: QualityPresetName) => {
    target.setQualityPreset(preset);
  };

  const setQualityOverride = <K extends QualitySettingKey>(
    key: K,
    value: UnifiedQualitySettings[K]["current"]
  ) => {
    target.setQualityOverride(key, value);
  };

  const clearQualityOverride = (key: QualitySettingKey) => {
    target.clearQualityOverride(key);
  };

  const lockQualitySettings = (locked: boolean) => {
    target.lockQualitySettings(locked);
  };

  const resetToRecommendedQuality = () => {
    target.resetToRecommendedQuality();
  };

  return {
    profile,
    metrics: target.getPerformanceMetrics(),
    history: target.getQualityAdaptationHistory(),
    effectiveResolution: (width: number, height: number) => target.getEffectiveResolution(width, height),
    systemPolicies: target.getSystemPolicies(),
    setQualityPreset,
    setQualityOverride,
    clearQualityOverride,
    lockQualitySettings,
    resetToRecommendedQuality,
  };
}

/**
 * Boundary component that provides isolated quality fallback when unhandled errors occur.
 */
export function AdaptiveQualityBoundary({
  fallbackQuality = "performance",
  children,
}: {
  fallbackQuality?: QualityPresetName;
  children: ReactNode;
}) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleError = () => {
      setHasError(true);
    };
    if (typeof window !== "undefined") {
      window.addEventListener("error", handleError);
      return () => window.removeEventListener("error", handleError);
    }
  }, []);

  const fallbackController = useMemo(() => {
    return createAdaptiveQualityController({
      preferences: { initialPreset: fallbackQuality },
    });
  }, [fallbackQuality]);

  if (hasError) {
    return createElement(
      AdaptiveQualityProvider,
      { controller: fallbackController, children },
      children
    );
  }

  return createElement("div", { style: { display: "contents" } }, children);
}
