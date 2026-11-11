/**
 * AF Motion Scroll Intelligence Runtime Engine
 *
 * High-performance, framework-independent scroll engine with passive event
 * listening, single-RAF batching, layout-cached metrics, and 2D-to-3D synchronization.
 */

import type { AnimatableProperties } from "../animate.js";
import { prefersReducedMotion } from "../motion.js";
import type {
  ScrollPlan,
  ScrollRuntimeCallbacks,
  ScrollRuntimeControls,
  ScrollRuntimeProgressState,
} from "./types.js";
import type { ScrollSceneController } from "../../3d/scroll/controller.js";

function parseOffsetPixel(
  offset: string | number,
  elementRect: { top: number; height: number },
  viewportHeight: number
): number {
  if (typeof offset === "number") {
    return offset <= 1 ? offset * viewportHeight : offset;
  }

  const parts = offset.toLowerCase().split(" ");
  const elAnchor = parts[0] ?? "top";
  const vpAnchor = parts[1] ?? "bottom";

  let elY = elementRect.top;
  if (elAnchor === "center") elY += elementRect.height * 0.5;
  else if (elAnchor === "bottom") elY += elementRect.height;

  let vpY = viewportHeight;
  if (vpAnchor === "top") vpY = 0;
  else if (vpAnchor === "center") vpY = viewportHeight * 0.5;
  else if (vpAnchor.endsWith("%")) {
    const pct = parseFloat(vpAnchor) / 100;
    vpY = viewportHeight * pct;
  }

  return elY - vpY;
}

export class ScrollIntelligenceRuntime {
  /**
   * Binds a scroll plan to a target DOM element.
   */
  public register(
    plan: ScrollPlan,
    target: HTMLElement,
    callbacks: ScrollRuntimeCallbacks = {},
    options?: { sync3DController?: ScrollSceneController }
  ): ScrollRuntimeControls {
    let lastScrollY = typeof window !== "undefined" ? window.scrollY : 0;
    let currentDirection: "down" | "up" = "down";
    let isPaused = false;
    let rafId: number | null = null;
    let maxReachedProgress = 0;
    let hasEntered = false;

    let currentState: ScrollRuntimeProgressState = {
      progress: 0,
      rawProgress: 0,
      direction: "down",
      velocity: 0,
      inView: false,
    };

    const isReduced = plan.respectReducedMotion && prefersReducedMotion();

    // Cache element measurements
    let cachedRect = { top: 0, height: 100 };
    const updateMeasurements = () => {
      if (typeof target.getBoundingClientRect === "function") {
        const domRect = target.getBoundingClientRect();
        const scrollY = typeof window !== "undefined" ? window.scrollY : 0;
        cachedRect = {
          top: domRect.top + scrollY,
          height: domRect.height,
        };
      }
    };
    updateMeasurements();

    const evaluateProgress = () => {
      if (typeof window === "undefined") return;

      const scrollY = window.scrollY;
      const viewportHeight = window.innerHeight || 800;
      const scrollHeight = document.documentElement.scrollHeight || 1000;

      const deltaY = scrollY - lastScrollY;
      if (deltaY > 0) currentDirection = "down";
      else if (deltaY < 0) currentDirection = "up";
      lastScrollY = scrollY;

      let progress = 0;
      let inView = true;

      if (plan.progressMode === "viewport") {
        const maxScroll = Math.max(1, scrollHeight - viewportHeight);
        progress = scrollY / maxScroll;
      } else if (plan.progressMode === "element") {
        const startDiff = parseOffsetPixel(plan.startOffset, cachedRect, viewportHeight);
        const endDiff = parseOffsetPixel(plan.endOffset, cachedRect, viewportHeight);
        const range = Math.max(1, startDiff - endDiff);
        progress = (scrollY - endDiff) / range;
        inView = progress > -0.2 && progress < 1.2;
      } else {
        // Container / sticky
        const maxScroll = Math.max(1, cachedRect.height);
        progress = (scrollY - cachedRect.top) / maxScroll;
      }

      const rawProgress = progress;
      if (plan.clamp) {
        progress = Math.max(0, Math.min(1, progress));
      }

      if (!plan.reversible) {
        maxReachedProgress = Math.max(maxReachedProgress, progress);
        progress = maxReachedProgress;
      }

      currentState = {
        progress,
        rawProgress,
        direction: currentDirection,
        velocity: deltaY,
        inView,
      };

      // Callbacks
      if (inView && !hasEntered) {
        hasEntered = true;
        callbacks.onEnter?.();
      } else if (!inView && hasEntered) {
        hasEntered = false;
        callbacks.onLeave?.();
      }
      callbacks.onProgress?.(currentState);

      // Apply animated properties directly
      if (!isReduced) {
        this.applyProperties(target, plan.properties, progress);
      } else if (plan.reducedMotionProperties) {
        this.applyProperties(target, plan.reducedMotionProperties, progress);
      }

      // Synchronize 3D Scene Controller if provided
      if (options?.sync3DController) {
        options.sync3DController.evaluate(progress);
      }
    };

    const onScroll = () => {
      if (isPaused) return;
      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          rafId = null;
          evaluateProgress();
        });
      }
    };

    const onResize = () => {
      updateMeasurements();
      onScroll();
    };

    const onVisibility = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        isPaused = true;
      } else {
        isPaused = false;
        onScroll();
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onResize, { passive: true });
      document.addEventListener("visibilitychange", onVisibility);
      // Initial evaluation
      evaluateProgress();
    }

    return {
      getState: () => currentState,
      pause: () => {
        isPaused = true;
      },
      resume: () => {
        isPaused = false;
        onScroll();
      },
      destroy: () => {
        if (typeof window !== "undefined") {
          window.removeEventListener("scroll", onScroll);
          window.removeEventListener("resize", onResize);
          document.removeEventListener("visibilitychange", onVisibility);
        }
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      },
    };
  }

  /**
   * Interpolates and applies CSS properties onto the target element style.
   */
  private applyProperties(
    target: HTMLElement,
    properties: Readonly<AnimatableProperties>,
    progress: number
  ): void {
    if (!target || !target.style) return;

    for (const [prop, values] of Object.entries(properties)) {
      if (!Array.isArray(values) || values.length < 2) continue;

      const fromVal = values[0];
      const toVal = values[values.length - 1];

      if (typeof fromVal === "number" && typeof toVal === "number") {
        const val = fromVal + (toVal - fromVal) * progress;
        (target.style as any)[prop] = val;
      } else if (typeof fromVal === "string" && typeof toVal === "string") {
        if (prop === "opacity") {
          const fromNum = parseFloat(fromVal);
          const toNum = parseFloat(toVal);
          target.style.opacity = String(fromNum + (toNum - fromNum) * progress);
        } else if (prop === "transform") {
          // Detect translation or scale
          if (fromVal.includes("scale") && toVal.includes("scale")) {
            const fromScale = parseFloat(fromVal.replace(/[^0-9.]/g, "")) || 0;
            const toScale = parseFloat(toVal.replace(/[^0-9.]/g, "")) || 1;
            const s = fromScale + (toScale - fromScale) * progress;
            target.style.transform = `scale(${s})`;
          } else if (fromVal.includes("translateY") && toVal.includes("translateY")) {
            const fromY = parseFloat(fromVal.replace(/[^0-9.-]/g, "")) || 0;
            const toY = parseFloat(toVal.replace(/[^0-9.-]/g, "")) || 0;
            const y = fromY + (toY - fromY) * progress;
            target.style.transform = `translateY(${y}px)`;
          } else {
            // General step interpolation
            target.style.transform = progress >= 0.5 ? toVal : fromVal;
          }
        } else {
          (target.style as any)[prop] = progress >= 0.5 ? toVal : fromVal;
        }
      }
    }
  }
}

export const scrollIntelligenceRuntime = new ScrollIntelligenceRuntime();
