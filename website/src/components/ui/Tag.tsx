import React from "react";
import { cn } from "@/utils/cn";

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  readonly children: React.ReactNode;
  readonly active?: boolean;
}

export const Tag: React.FC<TagProps> = ({
  children,
  active = false,
  className,
  ...props
}) => {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-md font-mono text-[11px] font-medium border transition-colors duration-150",
        active
          ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
          : "bg-[#141722] text-slate-400 border-white/[0.08] hover:border-white/[0.15] hover:text-slate-300",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
