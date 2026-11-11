import React from "react";
import { cn } from "@/utils/cn";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  readonly children: React.ReactNode;
  readonly variant?: "default" | "glow" | "outline" | "cyan" | "violet" | "emerald";
  readonly size?: "sm" | "md";
}

const VARIANT_MAP = {
  default: "bg-white/[0.06] text-slate-300 border-white/[0.08]",
  glow: "bg-indigo-500/10 text-indigo-300 border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.25)]",
  outline: "bg-transparent text-slate-400 border-white/[0.12]",
  cyan: "bg-cyan-500/10 text-cyan-300 border-cyan-500/30 shadow-[0_0_12px_rgba(56,189,248,0.25)]",
  violet: "bg-purple-500/10 text-purple-300 border-purple-500/30 shadow-[0_0_12px_rgba(168,85,247,0.25)]",
  emerald: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.25)]",
};

const SIZE_MAP = {
  sm: "text-[11px] px-2.5 py-0.5 tracking-wider font-medium",
  md: "text-xs px-3 py-1 tracking-wide font-medium",
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  size = "md",
  className,
  ...props
}) => {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full border transition-all duration-200 uppercase",
        VARIANT_MAP[variant],
        SIZE_MAP[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
