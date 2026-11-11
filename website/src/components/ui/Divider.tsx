import React from "react";
import { cn } from "@/utils/cn";

export interface DividerProps {
  readonly orientation?: "horizontal" | "vertical";
  readonly glow?: boolean;
  readonly className?: string;
}

export const Divider: React.FC<DividerProps> = ({
  orientation = "horizontal",
  glow = false,
  className,
}) => {
  if (orientation === "vertical") {
    return (
      <div
        className={cn(
          "w-px self-stretch bg-white/[0.08]",
          glow && "shadow-[0_0_8px_rgba(99,102,241,0.4)] bg-indigo-500/40",
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "h-px w-full bg-white/[0.08]",
        glow && "shadow-[0_0_8px_rgba(99,102,241,0.4)] bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent",
        className
      )}
    />
  );
};
