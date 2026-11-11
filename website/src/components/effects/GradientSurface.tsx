import React from "react";
import { cn } from "@/utils/cn";

export interface GradientSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly variant?: "cyan" | "indigo" | "violet" | "subtle";
  readonly intensity?: "low" | "medium" | "high";
  readonly position?: "top" | "center" | "bottom";
}

const VARIANT_MAP = {
  cyan: "from-cyan-500/20 via-sky-600/10 to-transparent",
  indigo: "from-indigo-600/25 via-blue-900/10 to-transparent",
  violet: "from-purple-600/20 via-indigo-900/10 to-transparent",
  subtle: "from-white/[0.04] via-white/[0.01] to-transparent",
};

const POSITION_MAP = {
  top: "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2",
  center: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
  bottom: "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2",
};

export const GradientSurface: React.FC<GradientSurfaceProps> = ({
  variant = "indigo",
  position = "top",
  className,
  ...props
}) => {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "absolute pointer-events-none -z-10 w-[600px] sm:w-[900px] h-[350px] sm:h-[500px] rounded-full blur-[120px] bg-gradient-radial opacity-60",
        VARIANT_MAP[variant],
        POSITION_MAP[position],
        className
      )}
      {...props}
    />
  );
};
