import React, { useRef, useState, useEffect } from "react";
import { cn } from "@/utils/cn";
import { useMotionAccessibility } from "af-motion/react";

export interface MagneticElementProps {
  readonly children: React.ReactNode;
  readonly strength?: number;
  readonly className?: string;
}

export const MagneticElement: React.FC<MagneticElementProps> = ({
  children,
  strength = 0.25,
  className,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const accessibility = useMotionAccessibility({ duration: 300 });

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      setPrefersReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    }
  }, [accessibility.respectsReducedMotion]);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const el = ref.current;
    if (!el) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = (e.clientX - centerX) * strength;
      const deltaY = (e.clientY - centerY) * strength;

      setPosition({ x: deltaX, y: deltaY });
    };

    const handleMouseLeave = () => {
      setPosition({ x: 0, y: 0 });
    };

    el.addEventListener("mousemove", handleMouseMove);
    el.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      el.removeEventListener("mousemove", handleMouseMove);
      el.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [strength, prefersReducedMotion]);

  const transformStyle = prefersReducedMotion
    ? undefined
    : {
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        transition: position.x === 0 && position.y === 0 ? "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)" : "transform 0.1s ease-out",
      };

  return (
    <div
      ref={ref}
      style={transformStyle}
      className={cn("inline-flex will-change-transform", className)}
    >
      {children}
    </div>
  );
};
