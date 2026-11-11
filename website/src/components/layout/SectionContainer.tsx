import React from "react";
import { cn } from "@/utils/cn";

export interface SectionContainerProps extends React.HTMLAttributes<HTMLElement> {
  readonly children: React.ReactNode;
  readonly spacing?: "compact" | "normal" | "spacious";
  readonly surface?: "transparent" | "subtle" | "elevated";
  readonly id?: string;
}

const SPACING_MAP = {
  compact: "py-12 sm:py-16",
  normal: "py-16 sm:py-24",
  spacious: "py-24 sm:py-32",
};

const SURFACE_MAP = {
  transparent: "bg-transparent",
  subtle: "bg-[#0b0d12]/60 border-y border-white/[0.04]",
  elevated: "bg-[#10131a]/80 border-y border-white/[0.06]",
};

export const SectionContainer: React.FC<SectionContainerProps> = ({
  children,
  spacing = "normal",
  surface = "transparent",
  id,
  className,
  ...props
}) => {
  return (
    <section
      id={id}
      className={cn(
        "relative w-full overflow-hidden transition-colors duration-300",
        SPACING_MAP[spacing],
        SURFACE_MAP[surface],
        className
      )}
      {...props}
    >
      {children}
    </section>
  );
};
