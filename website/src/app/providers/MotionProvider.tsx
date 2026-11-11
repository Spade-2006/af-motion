import React, { createContext, useContext, useEffect, useState } from "react";
import { useMotionAccessibility } from "af-motion/react";

interface MotionContextValue {
  readonly prefersReducedMotion: boolean;
  readonly isMotionReady: boolean;
}

const MotionContext = createContext<MotionContextValue>({
  prefersReducedMotion: false,
  isMotionReady: false,
});

export const MotionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isMotionReady, setIsMotionReady] = useState(false);

  // Validate accessibility against standard transition config
  const accessibilityReport = useMotionAccessibility({ duration: 300 });

  useEffect(() => {
    setIsMotionReady(true);
    if (typeof window !== "undefined" && window.matchMedia) {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setPrefersReducedMotion(mediaQuery.matches);

      const handleChange = (e: MediaQueryListEvent) => {
        setPrefersReducedMotion(e.matches);
      };

      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [accessibilityReport.respectsReducedMotion]);

  return (
    <MotionContext.Provider value={{ prefersReducedMotion, isMotionReady }}>
      {children}
    </MotionContext.Provider>
  );
};

export function useWebsiteMotion(): MotionContextValue {
  return useContext(MotionContext);
}
