import React, { useState } from "react";
import { cn } from "@/utils/cn";

export interface TooltipProps {
  readonly content: string;
  readonly children: React.ReactNode;
  readonly position?: "top" | "bottom" | "left" | "right";
  readonly className?: string;
}

const POSITION_MAP = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
};

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = "top",
  className,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className={cn("relative inline-flex", className)}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          role="tooltip"
          className={cn(
            "absolute z-50 whitespace-nowrap rounded-lg bg-[#181c28] border border-white/[0.12] px-2.5 py-1 text-xs font-medium text-slate-200 shadow-xl pointer-events-none transition-opacity duration-150 animate-in fade-in",
            POSITION_MAP[position]
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
};
