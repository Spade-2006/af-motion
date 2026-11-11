import { useState, useEffect } from "react";
import { THEME_TOKENS } from "@/config/tokens";
import { useMotionAccessibility } from "af-motion/react";

export function useWebsiteMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const accessibility = useMotionAccessibility({ duration: 300 });

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setPrefersReducedMotion(mediaQuery.matches);

      const handleChange = (e: MediaQueryListEvent) => {
        setPrefersReducedMotion(e.matches);
      };

      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [accessibility.respectsReducedMotion]);

  return {
    prefersReducedMotion,
    tokens: THEME_TOKENS.motion,
    durations: THEME_TOKENS.motion.durations,
    spring: THEME_TOKENS.motion.spring,
    getDuration: (key: keyof typeof THEME_TOKENS.motion.durations) =>
      prefersReducedMotion ? 0 : THEME_TOKENS.motion.durations[key],
  };
}
