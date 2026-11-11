import React from "react";
import { useScrollProgress } from "af-motion/react";
import { cn } from "@/utils/cn";

export interface ScrollProgressProps {
  readonly className?: string;
  readonly height?: number;
}

export const ScrollProgress: React.FC<ScrollProgressProps> = ({
  className,
  height = 3,
}) => {
  const { progress } = useScrollProgress();

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(progress * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 pointer-events-none bg-transparent",
        className
      )}
      style={{ height: `${height}px` }}
    >
      <div
        className="h-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-500 shadow-[0_0_12px_rgba(99,102,241,0.5)] transition-transform duration-75 origin-left"
        style={{ transform: `scaleX(${progress})` }}
      />
    </div>
  );
};
