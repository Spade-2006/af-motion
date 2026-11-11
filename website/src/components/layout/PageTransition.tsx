import React from "react";
import { Reveal } from "af-motion/react";
import { cn } from "@/utils/cn";

export interface PageTransitionProps {
  readonly children: React.ReactNode;
  readonly className?: string;
  readonly duration?: number;
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  className,
  duration = 500,
}) => {
  return (
    <Reveal
      direction="up"
      duration={duration}
      className={cn("w-full min-h-screen", className)}
    >
      {children}
    </Reveal>
  );
};
