import React from "react";
import { Reveal, type RevealDirection } from "af-motion/react";
import { cn } from "@/utils/cn";

export interface MotionStaggerProps {
  readonly children: React.ReactNode;
  readonly staggerMs?: number;
  readonly baseDuration?: number;
  readonly direction?: RevealDirection;
  readonly className?: string;
}

export const MotionStagger: React.FC<MotionStaggerProps> = ({
  children,
  staggerMs = 80,
  baseDuration = 500,
  direction = "up",
  className,
}) => {
  const childArray = React.Children.toArray(children);

  return (
    <div className={cn("w-full", className)}>
      {childArray.map((child, index) => (
        <Reveal
          key={index}
          direction={direction}
          duration={baseDuration}
          delay={index * staggerMs}
          className="w-full"
        >
          {child}
        </Reveal>
      ))}
    </div>
  );
};
