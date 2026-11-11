import React from "react";
import { cn } from "@/utils/cn";
import { useMicrointeraction } from "af-motion/react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: "primary" | "secondary" | "outline" | "ghost" | "cyan";
  readonly size?: "sm" | "md" | "lg";
  readonly iconLeading?: React.ReactNode;
  readonly iconTrailing?: React.ReactNode;
  readonly isLoading?: boolean;
}

const VARIANT_MAP = {
  primary:
    "bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-[0_0_24px_rgba(99,102,241,0.35)] border border-indigo-400/30 hover:shadow-[0_0_32px_rgba(99,102,241,0.5)]",
  cyan:
    "bg-cyan-600 hover:bg-cyan-500 text-white font-medium shadow-[0_0_24px_rgba(56,189,248,0.35)] border border-cyan-400/30 hover:shadow-[0_0_32px_rgba(56,189,248,0.5)]",
  secondary:
    "bg-white/[0.08] hover:bg-white/[0.12] text-slate-200 border border-white/[0.12] hover:border-white/[0.2] backdrop-blur-md",
  outline:
    "bg-transparent hover:bg-white/[0.05] text-slate-300 border border-white/[0.15] hover:border-white/[0.3]",
  ghost:
    "bg-transparent hover:bg-white/[0.06] text-slate-400 hover:text-white border-transparent",
};

const SIZE_MAP = {
  sm: "text-xs px-3.5 py-1.5 rounded-lg gap-1.5",
  md: "text-sm px-5 py-2.5 rounded-xl gap-2",
  lg: "text-base px-6 py-3.5 rounded-xl gap-2.5",
};

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  iconLeading,
  iconTrailing,
  isLoading,
  disabled,
  className,
  ...props
}) => {
  const { ref, handlers } = useMicrointeraction("button");

  return (
    <button
      ref={ref as any}
      disabled={disabled || isLoading}
      className={cn(
        "inline-flex items-center justify-center font-medium transition-all duration-200 select-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed",
        VARIANT_MAP[variant],
        SIZE_MAP[size],
        className
      )}
      {...handlers}
      {...props}
    >
      {isLoading ? (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      ) : (
        iconLeading
      )}
      <span>{children}</span>
      {!isLoading && iconTrailing}
    </button>
  );
};
