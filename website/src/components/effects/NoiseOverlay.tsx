import React from "react";
import { cn } from "@/utils/cn";

export interface NoiseOverlayProps {
  readonly opacity?: number;
  readonly className?: string;
}

export const NoiseOverlay: React.FC<NoiseOverlayProps> = ({
  opacity = 0.035,
  className,
}) => {
  return (
    <div
      aria-hidden="true"
      style={{ opacity }}
      className={cn(
        "fixed inset-0 pointer-events-none z-40 bg-repeat bg-[radial-gradient(rgba(255,255,255,0.15)_1px,transparent_0)] bg-[size:16px_16px]",
        className
      )}
    />
  );
};
