import React from "react";
import { cn } from "@/utils/cn";
import { Interactive } from "af-motion/react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly children: React.ReactNode;
  readonly variant?: "default" | "elevated" | "interactive" | "glow";
  readonly interactive?: boolean;
}

const VARIANT_MAP = {
  default:
    "bg-[#0e1118]/80 border-white/[0.08] hover:border-white/[0.14] shadow-[0_4px_20px_-2px_rgba(0,0,0,0.5)]",
  elevated:
    "bg-[#131620] border-white/[0.10] hover:border-white/[0.20] shadow-[0_12px_36px_-4px_rgba(0,0,0,0.7)]",
  interactive:
    "bg-[#11141e]/90 border-white/[0.08] hover:border-indigo-500/40 hover:shadow-[0_0_28px_rgba(99,102,241,0.18)] cursor-pointer",
  glow:
    "bg-[#131724]/90 border-indigo-500/30 shadow-[0_0_32px_rgba(99,102,241,0.22)]",
};

export const Card: React.FC<CardProps> = ({
  children,
  variant = "default",
  interactive = false,
  className,
  ...props
}) => {
  const baseClasses = cn(
    "relative rounded-2xl border p-6 transition-all duration-300 backdrop-blur-md overflow-hidden",
    VARIANT_MAP[variant],
    className
  );

  if (interactive || variant === "interactive") {
    return (
      <Interactive
        category="card"
        className={baseClasses}
      >
        {children}
      </Interactive>
    );
  }

  return (
    <div className={baseClasses} {...props}>
      {children}
    </div>
  );
};
