import React from "react";
import { cn } from "@/utils/cn";
import { useMicrointeraction } from "af-motion/react";

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  readonly icon: React.ReactNode;
  readonly label: string;
  readonly variant?: "default" | "outline" | "ghost";
  readonly size?: "sm" | "md" | "lg";
}

const VARIANT_MAP = {
  default: "bg-white/[0.08] hover:bg-white/[0.14] text-slate-200 border border-white/[0.1]",
  outline: "bg-transparent hover:bg-white/[0.06] text-slate-300 border border-white/[0.15]",
  ghost: "bg-transparent hover:bg-white/[0.06] text-slate-400 hover:text-white border-transparent",
};

const SIZE_MAP = {
  sm: "w-8 h-8 rounded-lg text-sm",
  md: "w-10 h-10 rounded-xl text-base",
  lg: "w-12 h-12 rounded-xl text-lg",
};

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  label,
  variant = "default",
  size = "md",
  className,
  ...props
}) => {
  const { ref, handlers } = useMicrointeraction("button");

  return (
    <button
      ref={ref as any}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex items-center justify-center transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/50",
        VARIANT_MAP[variant],
        SIZE_MAP[size],
        className
      )}
      {...handlers}
      {...props}
    >
      {icon}
    </button>
  );
};
