import React, { useEffect, useRef } from "react";
import { animate, easings } from "af-motion";
import { Reveal, type RevealDirection } from "af-motion/react";
import { useWebsiteMotion } from "@/app/providers/MotionProvider";
import { cn } from "@/utils/cn";

export interface MotionRevealProps {
  readonly children: React.ReactNode;
  readonly direction?: RevealDirection;
  readonly duration?: number;
  readonly delay?: number;
  readonly threshold?: number;
  readonly trigger?: "in-view" | "mount";
  readonly className?: string;
}

export const MotionReveal: React.FC<MotionRevealProps> = ({
  children,
  direction = "up",
  duration = 550,
  delay = 0,
  threshold = 0.08,
  trigger = "in-view",
  className,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const { prefersReducedMotion } = useWebsiteMotion();

  useEffect(() => {
    if (trigger !== "mount" || prefersReducedMotion) return;
    const el = mountRef.current;
    if (!el) return;

    const offset =
      direction === "up"
        ? "translate3d(0, 14px, 0)"
        : direction === "down"
        ? "translate3d(0, -14px, 0)"
        : direction === "left"
        ? "translate3d(14px, 0, 0)"
        : "translate3d(-14px, 0, 0)";

    const controls = animate(
      el,
      {
        opacity: [0.85, 1],
        transform: [offset, "translate3d(0, 0, 0)"],
      },
      {
        duration,
        delay,
        easing: easings.easeOutExpo,
      }
    );

    return () => {
      controls.cancel();
    };
  }, [trigger, direction, duration, delay, prefersReducedMotion]);

  if (trigger === "mount") {
    return (
      <div ref={mountRef} className={cn("w-full min-w-0", className)}>
        {children}
      </div>
    );
  }

  return (
    <Reveal
      direction={direction}
      duration={duration}
      delay={delay}
      threshold={threshold}
      className={cn("w-full min-w-0", className)}
    >
      {children}
    </Reveal>
  );
};
