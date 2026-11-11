import React from "react";
import { cn } from "@/utils/cn";

export interface SectionDividerProps {
  readonly className?: string;
  readonly showDot?: boolean;
}

export const SectionDivider: React.FC<SectionDividerProps> = ({
  className,
  showDot = true,
}) => {
  return (
    <div className={cn("relative w-full flex items-center justify-center my-12", className)}>
      <div className="w-full h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
      {showDot && (
        <div className="absolute w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)] border border-indigo-400" />
      )}
    </div>
  );
};
