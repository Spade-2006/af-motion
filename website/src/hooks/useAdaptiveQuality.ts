import { useState, useEffect } from "react";
import type { QualityTier } from "@/components/three/SignatureHeroSculpture";

export interface AdaptiveQualityState {
  readonly qualityTier: QualityTier;
  readonly isMobile: boolean;
  readonly isTablet: boolean;
  readonly dpr: [number, number];
}

export function useAdaptiveQuality(): AdaptiveQualityState {
  const [state, setState] = useState<AdaptiveQualityState>({
    qualityTier: "high",
    isMobile: false,
    isTablet: false,
    dpr: [1, 2],
  });

  useEffect(() => {
    const updateQuality = () => {
      const width = window.innerWidth;
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;
      const lowCores =
        typeof navigator !== "undefined" &&
        typeof navigator.hardwareConcurrency === "number" &&
        navigator.hardwareConcurrency <= 4;

      if (isMobile) {
        setState({
          qualityTier: "low",
          isMobile: true,
          isTablet: false,
          dpr: [1, 1.5],
        });
      } else if (isTablet || lowCores) {
        setState({
          qualityTier: "medium",
          isMobile: false,
          isTablet,
          dpr: [1, 1.75],
        });
      } else {
        setState({
          qualityTier: "high",
          isMobile: false,
          isTablet: false,
          dpr: [1, 2],
        });
      }
    };

    updateQuality();
    window.addEventListener("resize", updateQuality, { passive: true });
    return () => window.removeEventListener("resize", updateQuality);
  }, []);

  return state;
}
