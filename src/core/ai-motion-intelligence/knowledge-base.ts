/**
 * AF Motion AI Motion Pattern Knowledge Base
 *
 * Curated knowledge base of validated, production-grade motion patterns
 * providing architectural guidelines, timing preferences, and accessibility rules.
 */

import type { MotionPatternDefinition } from "./types.js";

export const BUILT_IN_MOTION_PATTERNS: readonly MotionPatternDefinition[] = [
  {
    id: "pat-premium-modal-entrance",
    name: "Premium Modal Sheet Entrance",
    intent: "entrance",
    description: "Gentle scale-up and fade with subtle vertical rise and heavy backdrop blur.",
    suitableContexts: ["dialog", "modal", "sheet", "popover"],
    timing: {
      duration: 380,
      easing: "cubic-bezier(0.16, 1, 0.3, 1)",
    },
    performanceConsiderations: "Animate transform scale and opacity only; isolate backdrop filter to container.",
    accessibilityConsiderations: "Skip directly to 100% scale and opacity if prefers-reduced-motion is active.",
    configuration: {
      opacity: [0, 1],
      scale: [0.94, 1],
      translateY: [16, 0],
      duration: 380,
      easing: "cubic-bezier(0.16, 1, 0.3, 1)",
    },
    tags: ["modal", "entrance", "premium", "sheet"],
  },
  {
    id: "pat-tactile-button-press",
    name: "Tactile Button Press Feedback",
    intent: "feedback",
    description: "Rapid responsive spring compression with immediate feedback and elastic release.",
    suitableContexts: ["button", "card-action", "pill", "tab-item"],
    timing: {
      duration: 180,
      easing: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    },
    performanceConsiderations: "Sub-millisecond compositor response; uses transform scale(0.96).",
    accessibilityConsiderations: "Safe under all reduced-motion configurations due to subtle scale (< 4%).",
    configuration: {
      scale: [1, 0.96, 1],
      duration: 180,
      easing: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    },
    tags: ["button", "press", "feedback", "tactile"],
  },
  {
    id: "pat-scroll-card-reveal",
    name: "Scroll-Linked Stagger Card Cascade",
    intent: "scroll-storytelling",
    description: "Hierarchical sequential card reveals triggered as the viewport crosses section threshold.",
    suitableContexts: ["feature-grid", "testimonial-carousel", "pricing-table"],
    timing: {
      duration: 550,
      delay: 60,
      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    },
    performanceConsiderations: "Utilize IntersectionObserver threshold with will-change: transform during transition.",
    accessibilityConsiderations: "Disable sequential delay and render static layout when motion is reduced.",
    configuration: {
      opacity: [0, 1],
      translateY: [24, 0],
      duration: 550,
      stagger: 60,
    },
    tags: ["scroll", "stagger", "cascade", "grid"],
  },
  {
    id: "pat-magnetic-cursor-follow",
    name: "Magnetic Interactive Pointer Attraction",
    intent: "interaction",
    description: "Spring-damped displacement of focal element toward the user's cursor within proximity radius.",
    suitableContexts: ["hero-cta", "floating-badge", "cursor-follower"],
    timing: {
      duration: 300,
      easing: "cubic-bezier(0.25, 1, 0.5, 1)",
    },
    performanceConsiderations: "Calculate distance using squared Euclidean distance (dx*dx + dy*dy) to avoid Math.sqrt.",
    accessibilityConsiderations: "Disable pointer pull completely under prefers-reduced-motion or touch devices.",
    configuration: {
      magneticRadius: 180,
      maxTranslation: 20,
      stiffness: 280,
      damping: 24,
    },
    tags: ["cursor", "magnetic", "pointer", "interactive"],
  },
  {
    id: "pat-ambient-particle-drift",
    name: "Ambient Depth Particle Drift",
    intent: "ambient",
    description: "Continuous floating stardust with subtle speed variances and soft opacity pulsing.",
    suitableContexts: ["hero-background", "dashboard-backdrop", "header-atmosphere"],
    timing: {
      duration: 8000,
      easing: "linear",
    },
    performanceConsiderations: "Limit to 120 particles on mobile; pause requestAnimationFrame when document is hidden.",
    accessibilityConsiderations: "Reduce opacity to 0.15 or freeze particle coordinates under reduced-motion.",
    configuration: {
      particleCount: 80,
      speed: 0.6,
      opacity: 0.4,
      iterations: "infinite",
    },
    tags: ["particles", "ambient", "background", "canvas"],
  },
  {
    id: "pat-svg-icon-morph",
    name: "Topological SVG Icon Morphing",
    intent: "morphing",
    description: "Continuous polygon and spline interpolation between matching vertex count SVG paths.",
    suitableContexts: ["play-pause", "menu-close", "arrow-checkmark"],
    timing: {
      duration: 320,
      easing: "cubic-bezier(0.4, 0, 0.2, 1)",
    },
    performanceConsiderations: "Pre-equalize path commands during initialization to prevent runtime spline sampling.",
    accessibilityConsiderations: "Directly swap SVG path string with instant transition under reduced-motion.",
    configuration: {
      duration: 320,
      precision: 64,
      easing: "cubic-bezier(0.4, 0, 0.2, 1)",
    },
    tags: ["svg", "morph", "icon", "vector"],
  },
];

/**
 * Searches the pattern knowledge base for matching patterns based on intent and context.
 */
export function queryPatternKnowledgeBase(
  intent?: string,
  context?: string
): MotionPatternDefinition[] {
  return BUILT_IN_MOTION_PATTERNS.filter((pattern) => {
    if (intent && pattern.intent !== intent) {
      return false;
    }
    if (context) {
      const c = context.toLowerCase();
      const matchesContext = pattern.suitableContexts.some((ctx) => ctx.toLowerCase().includes(c));
      const matchesTags = pattern.tags.some((t) => t.toLowerCase().includes(c));
      if (!matchesContext && !matchesTags) {
        return false;
      }
    }
    return true;
  });
}
