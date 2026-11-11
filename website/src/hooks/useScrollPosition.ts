import { useState, useEffect } from "react";

export interface ScrollPosition {
  readonly x: number;
  readonly y: number;
  readonly isScrolled: boolean;
}

export function useScrollPosition(threshold = 20): ScrollPosition {
  const [position, setPosition] = useState<ScrollPosition>({
    x: 0,
    y: 0,
    isScrolled: false,
  });

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setPosition({
        x: window.scrollX,
        y: scrollY,
        isScrolled: scrollY > threshold,
      });
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold]);

  return position;
}
