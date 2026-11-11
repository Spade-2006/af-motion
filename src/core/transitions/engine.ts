/**
 * AF Motion Automatic Transition Engine
 *
 * Deterministic generation of entrance, exit, and page transitions with
 * direction awareness, shared-element movement, and intelligence-guided timing.
 */

import type { AnimatableProperties } from "../animate.js";
import { recommendAnimation } from "../animation-intelligence/engine.js";
import { sharedElementRegistry } from "./shared-element.js";
import type {
  PageTransitionConfig,
  PageTransitionDefinition,
  TransitionConfig,
  TransitionDefinition,
  TransitionDirection,
  TransitionPattern,
} from "./types.js";

function formatDistance(dist: number | string | undefined, defaultVal = 20): string {
  if (dist === undefined) return `${defaultVal}px`;
  return typeof dist === "number" ? `${dist}px` : dist;
}

function resolvePacing(config?: TransitionConfig): { duration: number; easing: string } {
  if (config?.duration && config?.easing) {
    return { duration: config.duration, easing: config.easing };
  }

  // Animation Intelligence recommendation if component or style is provided
  if (config?.componentType || config?.visualStyle || config?.motionDNA) {
    const rec = recommendAnimation({
      componentType: config.componentType ?? "card",
      intent: "disclosure",
      visualStyle: config.visualStyle,
      motionDNA: config.motionDNA,
      reducedMotion: config.respectReducedMotion,
    });
    return {
      duration: config?.duration ?? rec.selected.duration,
      easing: config?.easing ?? rec.selected.easing,
    };
  }

  // Motion DNA fallback
  const dna = config?.motionDNA;
  if (dna === "snappy") return { duration: 200, easing: "easeOutQuad" };
  if (dna === "energetic") return { duration: 320, easing: "easeOutBack" };
  if (dna === "calm") return { duration: 500, easing: "easeInOutSine" };
  if (dna === "cinematic") return { duration: 750, easing: "easeInOutCubic" };
  if (dna === "minimal") return { duration: 220, easing: "easeOutCubic" };
  if (dna === "playful") return { duration: 350, easing: "easeOutBack" };

  return {
    duration: config?.duration ?? 300,
    easing: config?.easing ?? "easeOutCubic",
  };
}

/**
 * Generates animatable properties for an entrance or exit transition.
 */
export function generateTransitionProperties(
  pattern: TransitionPattern,
  type: "enter" | "exit",
  config?: TransitionConfig
): AnimatableProperties {
  if (config?.properties) {
    return config.properties;
  }

  const isEnter = type === "enter";
  const dist = formatDistance(config?.distance, 24);
  const scaleVal = config?.scale ?? 0.94;
  const blurVal = config?.blur ? (typeof config.blur === "number" ? `${config.blur}px` : config.blur) : "8px";
  const dir: TransitionDirection = config?.direction ?? (isEnter ? "up" : "down");

  switch (pattern) {
    case "fade":
      return {
        opacity: isEnter ? [0, 1] : [1, 0],
      };

    case "slide": {
      let fromTransform = `translateY(${dist})`;
      let toTransform = "translateY(0px)";

      if (dir === "up") {
        fromTransform = isEnter ? `translateY(${dist})` : "translateY(0px)";
        toTransform = isEnter ? "translateY(0px)" : `translateY(-${dist})`;
      } else if (dir === "down") {
        fromTransform = isEnter ? `translateY(-${dist})` : "translateY(0px)";
        toTransform = isEnter ? "translateY(0px)" : `translateY(${dist})`;
      } else if (dir === "left" || dir === "forward") {
        fromTransform = isEnter ? `translateX(${dist})` : "translateX(0px)";
        toTransform = isEnter ? "translateX(0px)" : `translateX(-${dist})`;
      } else if (dir === "right" || dir === "backward") {
        fromTransform = isEnter ? `translateX(-${dist})` : "translateX(0px)";
        toTransform = isEnter ? "translateX(0px)" : `translateX(${dist})`;
      }

      return {
        opacity: isEnter ? [0, 1] : [1, 0],
        transform: [fromTransform, toTransform],
      };
    }

    case "scale":
      return {
        opacity: isEnter ? [0, 1] : [1, 0],
        transform: isEnter
          ? [`scale(${scaleVal})`, "scale(1)"]
          : ["scale(1)", `scale(${scaleVal})`],
      };

    case "blur":
      return {
        opacity: isEnter ? [0, 1] : [1, 0],
        filter: isEnter ? [`blur(${blurVal})`, "blur(0px)"] : ["blur(0px)", `blur(${blurVal})`],
      };

    case "reveal":
      return {
        opacity: isEnter ? [0, 1] : [1, 0],
        clipPath: isEnter
          ? ["inset(0 100% 0 0)", "inset(0 0% 0 0)"]
          : ["inset(0 0% 0 0)", "inset(0 100% 0 0)"],
      };

    case "clip-reveal": {
      const clipDir = config?.clipDirection ?? "bottom";
      let startClip = "inset(100% 0 0 0)";
      let endClip = "inset(0 0 0 0)";

      if (clipDir === "top") {
        startClip = "inset(0 0 100% 0)";
      } else if (clipDir === "left") {
        startClip = "inset(0 0 0 100%)";
      } else if (clipDir === "right") {
        startClip = "inset(0 100% 0 0)";
      } else if (clipDir === "center") {
        startClip = "circle(0% at 50% 50%)";
        endClip = "circle(100% at 50% 50%)";
      }

      return {
        opacity: isEnter ? [0, 1] : [1, 0],
        clipPath: isEnter ? [startClip, endClip] : [endClip, startClip],
      };
    }

    case "shared-element": {
      if (config?.sharedElementId) {
        const captured = sharedElementRegistry.getCapturedRect(config.sharedElementId);
        if (captured) {
          // If we have a captured source rect, compute FLIP transform
          return sharedElementRegistry.computeTransform(captured, captured);
        }
      }
      // Fallback if no target rect available
      return {
        opacity: isEnter ? [0, 1] : [1, 0],
        transform: isEnter ? ["scale(0.95)", "scale(1)"] : ["scale(1)", "scale(0.95)"],
      };
    }

    case "coordinated":
    default:
      return {
        opacity: isEnter ? [0, 1] : [1, 0],
        transform: isEnter
          ? [`translateY(${dist}) scale(${scaleVal})`, "translateY(0px) scale(1)"]
          : ["translateY(0px) scale(1)", `translateY(-${dist}) scale(${scaleVal})`],
      };
  }
}

/**
 * Creates an entrance transition definition.
 */
export function createEntranceTransition(
  config?: TransitionConfig
): TransitionDefinition {
  const pattern = config?.pattern ?? "slide";
  const pacing = resolvePacing(config);
  const properties = generateTransitionProperties(pattern, "enter", config);
  const respectReducedMotion = config?.respectReducedMotion ?? true;

  return {
    id: `entrance-${pattern}-${Date.now().toString(36)}`,
    name: `Entrance (${pattern})`,
    pattern,
    properties,
    duration: pacing.duration,
    delay: config?.delay ?? 0,
    easing: pacing.easing,
    respectReducedMotion,
    reducedMotionProperties: { opacity: [0, 1] },
    stagger: config?.stagger,
  };
}

/**
 * Creates an exit transition definition.
 */
export function createExitTransition(
  config?: TransitionConfig
): TransitionDefinition {
  const pattern = config?.pattern ?? "fade";
  const pacing = resolvePacing(config);
  const properties = generateTransitionProperties(pattern, "exit", config);
  const respectReducedMotion = config?.respectReducedMotion ?? true;

  return {
    id: `exit-${pattern}-${Date.now().toString(36)}`,
    name: `Exit (${pattern})`,
    pattern,
    properties,
    duration: Math.round(pacing.duration * 0.85), // exits are naturally slightly snappier
    delay: config?.delay ?? 0,
    easing: "easeInCubic",
    respectReducedMotion,
    reducedMotionProperties: { opacity: [1, 0] },
    stagger: config?.stagger,
  };
}

/**
 * Creates a coordinated enter/exit page transition definition.
 */
export function createPageTransition(
  config?: PageTransitionConfig,
  navContext?: { direction?: "forward" | "backward" }
): PageTransitionDefinition {
  const pattern = config?.pattern ?? "slide";
  const mode = config?.mode ?? "out-in";
  const directionAware = config?.directionAware ?? true;

  const isBackward = navContext?.direction === "backward";

  // Invert enter/exit slide direction for backward navigation
  const enterDir: TransitionDirection = directionAware
    ? isBackward
      ? "right"
      : "left"
    : config?.enter?.direction ?? "up";

  const exitDir: TransitionDirection = directionAware
    ? isBackward
      ? "right"
      : "left"
    : config?.exit?.direction ?? "up";

  const enter = createEntranceTransition({
    pattern,
    duration: config?.duration,
    easing: config?.easing,
    ...config?.enter,
    direction: enterDir,
  });

  const exit = createExitTransition({
    pattern,
    duration: config?.duration,
    easing: config?.easing,
    ...config?.exit,
    direction: exitDir,
  });

  return {
    mode,
    enter,
    exit,
    directionAware,
  };
}
