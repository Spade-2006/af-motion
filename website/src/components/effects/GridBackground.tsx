import React from "react";
import { cn } from "@/utils/cn";

export interface GridBackgroundProps {
  readonly variant?: "dots" | "grid";
  readonly fadeEdges?: boolean;
  readonly className?: string;
}

export const GridBackground: React.FC<GridBackgroundProps> = ({
  variant = "grid",
  fadeEdges = true,
  className,
}) => {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "absolute inset-0 pointer-events-none -z-20 overflow-hidden",
        className
      )}
    >
      <div
        className={cn(
          "w-full h-full",
          variant === "grid"
            ? "bg-cyber-grid"
            : "bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:24px_24px]"
        )}
      />
      {fadeEdges && (
        <div className="absolute inset-0 bg-gradient-to-t from-[#07080a] via-transparent to-[#07080a]" />
      )}
    </div>
  );
};
