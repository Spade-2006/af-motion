import React from "react";
import { Reveal } from "af-motion/react";
import { cn } from "@/utils/cn";

export interface MotionTextProps {
  readonly text: string;
  readonly as?: "h1" | "h2" | "h3" | "h4" | "p" | "span" | "div";
  readonly split?: "words" | "lines";
  readonly duration?: number;
  readonly staggerMs?: number;
  readonly className?: string;
}

export const MotionText: React.FC<MotionTextProps> = ({
  text,
  as: Component = "div",
  split = "words",
  duration = 500,
  staggerMs = 50,
  className,
}) => {
  const segments = split === "words" ? text.split(" ") : text.split("\n");

  return (
    <Component className={cn("inline-flex flex-wrap gap-x-2", className)}>
      {segments.map((segment, index) => (
        <span key={index} className="inline-block overflow-hidden py-1">
          <Reveal
            direction="up"
            duration={duration}
            delay={index * staggerMs}
            className="inline-block"
          >
            {segment}
          </Reveal>
        </span>
      ))}
    </Component>
  );
};
