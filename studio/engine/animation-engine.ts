/**
 * AF Motion Studio — Animation Engine Integration
 *
 * Drives Studio animation playback, timeline scrubbing, easing interpolation,
 * preset calculations, and reduced-motion safety.
 */

import type {
  AnimationPropertyValues,
  StudioAnimationConfig,
} from "../types/index.js";

export const ANIMATION_PRESETS: Record<
  string,
  {
    name: string;
    description: string;
    config: Partial<StudioAnimationConfig>;
  }
> = {
  fadeUp: {
    name: "Fade Up",
    description: "Smooth vertical ascent with gradual opacity reveal.",
    config: {
      duration: 650,
      easing: "cubic-bezier(0.16, 1, 0.3, 1)",
      properties: {
        x: 0,
        y: -40,
        scale: 1,
        rotate: 0,
        opacity: 1,
        blur: 0,
        borderRadius: 12,
      },
    },
  },
  popIn: {
    name: "Pop In",
    description: "Snappy scale overshoot with spring-like snap.",
    config: {
      duration: 500,
      easing: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      properties: {
        x: 0,
        y: 0,
        scale: 1.08,
        rotate: 0,
        opacity: 1,
        blur: 0,
        borderRadius: 12,
      },
    },
  },
  slideRight: {
    name: "Slide In Right",
    description: "Horizontal entrance sliding from left to center.",
    config: {
      duration: 600,
      easing: "cubic-bezier(0.25, 1, 0.5, 1)",
      properties: {
        x: 60,
        y: 0,
        scale: 1,
        rotate: 0,
        opacity: 1,
        blur: 0,
        borderRadius: 12,
      },
    },
  },
  springBounce: {
    name: "Spring Bounce",
    description: "High-energy rebound bounce with playful overshoot.",
    config: {
      duration: 800,
      easing: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
      properties: {
        x: 0,
        y: -25,
        scale: 1.12,
        rotate: 0,
        opacity: 1,
        blur: 0,
        borderRadius: 16,
      },
    },
  },
  gentlePulse: {
    name: "Gentle Pulse",
    description: "Subtle rhythmic breathing expansion.",
    config: {
      duration: 1200,
      easing: "easeInOut",
      properties: {
        x: 0,
        y: 0,
        scale: 1.06,
        rotate: 0,
        opacity: 0.95,
        blur: 0,
        borderRadius: 12,
      },
    },
  },
  spin3D: {
    name: "Spin & Tilt",
    description: "Full rotational spin with simultaneous scale expansion.",
    config: {
      duration: 900,
      easing: "cubic-bezier(0.25, 1, 0.5, 1)",
      properties: {
        x: 0,
        y: 0,
        scale: 1.05,
        rotate: 360,
        opacity: 1,
        blur: 0,
        borderRadius: 24,
      },
    },
  },
};

/**
 * Parses or evaluates easing function to return eased progress (0 to 1).
 */
export function evaluateEasing(easing: string, t: number): number {
  const clamped = Math.max(0, Math.min(1, t));

  if (easing === "linear") return clamped;
  if (easing === "easeIn") return clamped * clamped;
  if (easing === "easeOut") return clamped * (2 - clamped);
  if (easing === "easeInOut") {
    return clamped < 0.5
      ? 2 * clamped * clamped
      : -1 + (4 - 2 * clamped) * clamped;
  }

  // Basic approximation for cubic-bezier(x1, y1, x2, y2)
  const match = /cubic-bezier\(\s*([\d.]+)\s*,\s*(-?[\d.]+)\s*,\s*([\d.]+)\s*,\s*(-?[\d.]+)\s*\)/i.exec(easing);
  if (match) {
    const y1 = parseFloat(match[2]);
    const y2 = parseFloat(match[4]);
    // Smooth parametric cubic curve approximation
    const inv = 1 - clamped;
    return 3 * inv * inv * clamped * y1 + 3 * inv * clamped * clamped * y2 + clamped * clamped * clamped;
  }

  // Default smooth out
  return 1 - Math.pow(1 - clamped, 3);
}

/**
 * Calculates the interpolated style properties for a given animation progress.
 */
export function interpolateAnimationStyles(
  config: StudioAnimationConfig,
  progress: number
): {
  transform: string;
  opacity: number;
  filter: string;
  borderRadius: string;
  backgroundColor?: string;
} {
  if (config.reducedMotion) {
    return {
      transform: "none",
      opacity: 1,
      filter: "none",
      borderRadius: `${config.properties.borderRadius}px`,
      backgroundColor: config.properties.backgroundColor,
    };
  }

  const eased = evaluateEasing(config.easing, progress);
  const p = config.properties;

  const currentX = p.x * eased;
  const currentY = p.y * eased;
  const currentScale = 1 + (p.scale - 1) * eased;
  const currentRotate = p.rotate * eased;
  const currentOpacity = Math.max(0, Math.min(1, p.opacity * eased));
  const currentBlur = p.blur * (1 - eased);

  return {
    transform: `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0px) scale(${currentScale.toFixed(3)}) rotate(${currentRotate.toFixed(1)}deg)`,
    opacity: currentOpacity,
    filter: currentBlur > 0.1 ? `blur(${currentBlur.toFixed(1)}px)` : "none",
    borderRadius: `${p.borderRadius}px`,
    backgroundColor: p.backgroundColor,
  };
}

export function getDefaultAnimationConfig(): StudioAnimationConfig {
  return {
    target: "card",
    duration: 650,
    delay: 0,
    easing: "cubic-bezier(0.16, 1, 0.3, 1)",
    iterations: 1,
    direction: "normal",
    fill: "forwards",
    preset: "fadeUp",
    reducedMotion: false,
    properties: {
      x: 0,
      y: -30,
      scale: 1,
      rotate: 0,
      opacity: 1,
      blur: 0,
      borderRadius: 12,
    },
  };
}
