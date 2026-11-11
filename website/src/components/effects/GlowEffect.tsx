import React from "react";
import { cn } from "@/utils/cn";

export interface GlowEffectProps {
  readonly color?: "cyan" | "indigo" | "violet" | "emerald";
  readonly size?: "sm" | "md" | "lg";
  readonly className?: string;
}

const COLOR_MAP = {
  cyan: "bg-cyan-500/15 shadow-[0_0_60px_rgba(56,189,248,0.3)]",
  indigo: "bg-indigo-500/15 shadow-[0_0_60px_rgba(99,102,241,0.3)]",
  violet: "bg-purple-500/15 shadow-[0_0_60px_rgba(168,85,247,0.3)]",
  emerald: "bg-emerald-500/15 shadow-[0_0_60px_rgba(16,185,129,0.3)]",
};

const SIZE_MAP = {
  sm: "w-24 h-24 blur-xl",
  md: "w-48 h-48 blur-2xl",
  lg: "w-80 h-80 blur-3xl",
};

export const GlowEffect: React.FC<GlowEffectProps> = ({
  color = "indigo",
  size = "md",
  className,
}) => {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "absolute rounded-full pointer-events-none -z-10",
        COLOR_MAP[color],
        SIZE_MAP[size],
        className
      )}
    />
  );
};
