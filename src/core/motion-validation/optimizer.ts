/**
 * AF Motion Performance & Accessibility Optimizer
 *
 * Safe, behavior-preserving optimization engine converting layout-triggering styles
 * into GPU-accelerated transforms, dampening excessive filters, and ensuring accessibility.
 */

import { validateMotionConfig } from "./validator.js";
import type {
  MotionOptimizationOptions,
  MotionOptimizationResult,
  OptimizationLevel,
} from "./types.js";

function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map((item) => deepClone(item)) as any;
  const copy: any = {};
  for (const [k, v] of Object.entries(obj)) {
    copy[k] = deepClone(v);
  }
  return copy;
}

/**
 * Optimizes a motion configuration according to the specified safety level.
 */
export function optimizeMotion<T = any>(
  config: T,
  options: MotionOptimizationOptions = {}
): MotionOptimizationResult<T> {
  const level: OptimizationLevel = options.level ?? "safe";
  const validationBefore = validateMotionConfig(config);
  const optimized: any = deepClone(config);
  const applied: string[] = [];
  const tradeoffs: string[] = [];

  // Determine property target object
  let propsRef = optimized.properties ?? (optimized.config ? optimized.config.properties : undefined);
  if (!propsRef && optimized.plan) propsRef = optimized.plan.properties;

  // 1. Safe Optimizations
  if (propsRef && typeof propsRef === "object") {
    // Convert top/marginTop -> translateY
    if ("top" in propsRef || "marginTop" in propsRef) {
      const origVal = propsRef.top ?? propsRef.marginTop;
      delete propsRef.top;
      delete propsRef.marginTop;
      propsRef.transform = Array.isArray(origVal)
        ? origVal.map((v) => `translateY(${v})`)
        : [`translateY(0px)`, `translateY(${origVal})`];
      applied.push("Converted layout-triggering 'top'/'marginTop' to GPU-accelerated 'translateY()'.");
    }

    // Convert left/marginLeft -> translateX
    if ("left" in propsRef || "marginLeft" in propsRef) {
      const origVal = propsRef.left ?? propsRef.marginLeft;
      delete propsRef.left;
      delete propsRef.marginLeft;
      propsRef.transform = Array.isArray(origVal)
        ? origVal.map((v) => `translateX(${v})`)
        : [`translateX(0px)`, `translateX(${origVal})`];
      applied.push("Converted layout-triggering 'left'/'marginLeft' to GPU-accelerated 'translateX()'.");
    }

    // Convert width/height expansion to scale when safe
    if ("width" in propsRef && typeof propsRef.width === "string" && propsRef.width.includes("%")) {
      delete propsRef.width;
      propsRef.transform = ["scaleX(0)", "scaleX(1)"];
      propsRef.transformOrigin = ["0% 50%", "0% 50%"];
      applied.push("Converted full-width expansion to GPU-accelerated 'scaleX()'.");
    }
  }

  // Enforce reduced-motion compliance
  if (optimized.respectReducedMotion === false) {
    optimized.respectReducedMotion = true;
    applied.push("Enabled respectReducedMotion for WCAG accessibility compliance.");
  }

  // Provide reducedMotion fallback if large movements exist
  if (!optimized.reducedMotionProperties && !optimized.reducedMotionConfig) {
    optimized.reducedMotionProperties = { opacity: [0, 1] };
    applied.push("Added automatic reduced-motion opacity fallback.");
  }

  // Resolve seizure risks (WCAG 2.3.1 three-flashes rule)
  const durationRef = optimized.duration ?? (optimized.config ? optimized.config.duration : undefined);
  const repeatRef = optimized.repeat ?? (optimized.options ? optimized.options.repeat : 0);

  if (typeof durationRef === "number" && durationRef <= 100 && (repeatRef >= 3 || repeatRef === Infinity)) {
    if (optimized.duration) optimized.duration = 340;
    if (optimized.config && optimized.config.duration) optimized.config.duration = 340;
    applied.push("Increased rapid oscillation duration to 340ms to eliminate seizure hazard (< 3 flashes/sec).");
  }

  // 2. Balanced Optimizations
  if (level === "balanced" || level === "aggressive") {
    // Dampen excessive blur filters
    if (propsRef && propsRef.filter && typeof propsRef.filter === "string") {
      propsRef.filter = propsRef.filter.replace(/blur\(\d+px\)/g, "blur(12px)");
      applied.push("Dampened blur filter radius to 12px for smooth mobile fill rate.");
      tradeoffs.push("Blur effect has slightly softer radius to protect GPU fill rate.");
    }

    // Normalize excessive durations
    if (typeof durationRef === "number" && durationRef > 3000) {
      if (optimized.duration) optimized.duration = 1200;
      if (optimized.config && optimized.config.duration) optimized.config.duration = 1200;
      applied.push(`Normalized excessive duration (${durationRef}ms -> 1200ms) for snappy UI responsiveness.`);
      tradeoffs.push("Pacing accelerated to eliminate sluggish UI feedback.");
    }

    // Align Motion DNA timing
    const dna = optimized.motionDNA ?? (optimized.config ? optimized.config.motionDNA : undefined);
    if (dna === "snappy" && typeof durationRef === "number" && durationRef > 400) {
      if (optimized.duration) optimized.duration = 240;
      if (optimized.config && optimized.config.duration) optimized.config.duration = 240;
      applied.push("Adjusted duration to 240ms to align with 'snappy' Motion DNA.");
    }
  }

  // 3. Aggressive Optimizations
  if (level === "aggressive") {
    // Strip all heavy filters
    if (propsRef && propsRef.filter) {
      delete propsRef.filter;
      applied.push("Stripped CSS filter entirely in aggressive optimization mode.");
      tradeoffs.push("Visual blur/shadow styling removed in favor of maximum frame rate.");
    }

    // Clamp duration to <= 300ms
    if (typeof durationRef === "number" && durationRef > 300) {
      if (optimized.duration) optimized.duration = 300;
      if (optimized.config && optimized.config.duration) optimized.config.duration = 300;
      applied.push("Aggressively clamped duration to 300ms.");
      tradeoffs.push("Pacing compressed into compact interaction burst.");
    }
  }

  const validationAfter = validateMotionConfig(optimized);

  return {
    optimizedConfig: Object.freeze(optimized),
    originalConfig: config,
    level,
    appliedOptimizations: Object.freeze(applied),
    remainingTradeoffs: Object.freeze(tradeoffs),
    validationBefore,
    validationAfter,
  };
}
