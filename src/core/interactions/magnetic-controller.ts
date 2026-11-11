/**
 * AF Motion Magnetic Interaction Engine
 *
 * Provides smooth, spring-driven magnetic attraction and repulsion for DOM elements
 * responding to pointer proximity, displacement limits, axis constraints, anchor points,
 * distance falloffs, and transform layering composition.
 */

import { subscribeAnimationFrames } from "../animation.js";
import { onReducedMotionChange, prefersReducedMotion } from "../motion.js";
import { removeTransformLayer, setTransformLayer } from "../transform.js";
import { normalizeInputEvent } from "./input-normalizer.js";
import type {
  MagneticAnchor,
  MagneticAxis,
  MagneticController,
  MagneticControllerOptions,
  MagneticFalloff,
  MagneticMode,
  MagneticState,
  Point2D,
} from "./types.js";

const DEFAULT_RADIUS = 150;
const DEFAULT_STRENGTH = 0.35;
const DEFAULT_MAX_DISPLACEMENT = 40;
const DEFAULT_STIFFNESS = 200;
const DEFAULT_DAMPING = 20;
const DEFAULT_MASS = 1;

function computeFalloff(rho: number, falloff: MagneticFalloff): number {
  const r = Math.max(0, Math.min(1, rho));
  switch (falloff) {
    case "linear":
      return 1 - r;
    case "exponential": {
      const e2 = Math.exp(-2);
      return (Math.exp(-2 * r) - e2) / (1 - e2);
    }
    case "smoothstep":
      return 1 - (3 * r * r - 2 * r * r * r);
    case "inverse-square":
      return (1 - r) * (1 - r);
    default:
      return 1 - r;
  }
}

export function createMagneticController(
  target: HTMLElement,
  initialOptions: MagneticControllerOptions = {}
): MagneticController {
  const optionsToken = {}; // unique token for transform layering
  let opts: MagneticControllerOptions = { ...initialOptions };

  let isEnabled = true;
  let isDestroyed = false;
  let isAttracted = false;

  // Spring state
  let currentOffsetX = 0;
  let currentOffsetY = 0;
  let targetOffsetX = 0;
  let targetOffsetY = 0;
  let velocityX = 0;
  let velocityY = 0;

  // Cached anchor coordinates
  let anchorViewportX = 0;
  let anchorViewportY = 0;
  let lastPointerX = 0;
  let lastPointerY = 0;
  let currentDistance = 0;
  let currentNormDistance = 1;
  let currentAngle = 0;

  let hasTransformApplied = false;
  let lastFrameTime = typeof performance !== "undefined" ? performance.now() : Date.now();

  function measureAnchor(): void {
    if (!target.isConnected) return;
    try {
      const rect = target.getBoundingClientRect();
      const anchor: MagneticAnchor = opts.anchor ?? { x: 0.5, y: 0.5, isFraction: true };
      const isFraction = anchor.isFraction !== false;

      anchorViewportX = rect.left + (isFraction ? rect.width * anchor.x : anchor.x);
      anchorViewportY = rect.top + (isFraction ? rect.height * anchor.y : anchor.y);
    } catch {
      // Fallback
    }
  }

  function buildState(): MagneticState {
    return {
      isAttracted,
      distance: Number(currentDistance.toFixed(1)),
      normalizedDistance: Number(currentNormDistance.toFixed(3)),
      angle: Number(currentAngle.toFixed(1)),
      offsetX: Number(currentOffsetX.toFixed(2)),
      offsetY: Number(currentOffsetY.toFixed(2)),
      targetX: Number(targetOffsetX.toFixed(2)),
      targetY: Number(targetOffsetY.toFixed(2)),
      pointerX: Number(lastPointerX.toFixed(1)),
      pointerY: Number(lastPointerY.toFixed(1)),
      isRepelling: opts.mode === "repel",
    };
  }

  function handlePointer(event: Event): void {
    if (!isEnabled || isDestroyed) return;
    const norm = normalizeInputEvent(event, null);
    if (!norm.point) return;

    if (opts.respectReducedMotion !== false && prefersReducedMotion()) {
      targetOffsetX = 0;
      targetOffsetY = 0;
      return;
    }

    lastPointerX = norm.point.x;
    lastPointerY = norm.point.y;

    measureAnchor();

    const dx = lastPointerX - anchorViewportX;
    const dy = lastPointerY - anchorViewportY;
    const dist = Math.hypot(dx, dy);
    currentDistance = dist;

    const radius = opts.radius ?? DEFAULT_RADIUS;
    currentNormDistance = Math.max(0, Math.min(1, dist / radius));

    if (dist > 0.001) {
      currentAngle = (Math.atan2(dy, dx) * 180) / Math.PI;
    }

    if (dist <= radius) {
      const wasAttracted = isAttracted;
      isAttracted = true;

      const strength = opts.strength ?? DEFAULT_STRENGTH;
      const maxDisplacement = opts.maxDisplacement ?? DEFAULT_MAX_DISPLACEMENT;
      const falloff = opts.falloff ?? "smoothstep";
      const resistance = Math.max(0, Math.min(1, opts.resistance ?? 0));
      const falloffFactor = computeFalloff(currentNormDistance, falloff);

      const isRepel = opts.mode === "repel";
      const dirSign = isRepel ? -1 : 1;

      const unitX = dist > 0 ? (dx / dist) * dirSign : 0;
      const unitY = dist > 0 ? (dy / dist) * dirSign : 0;

      const rawDisplacement = dist * strength * falloffFactor * (1 - resistance);
      const clampedDisplacement = Math.min(rawDisplacement, maxDisplacement);

      let calcX = unitX * clampedDisplacement;
      let calcY = unitY * clampedDisplacement;

      // Axis constraint
      const axis: MagneticAxis = opts.axis ?? "both";
      if (axis === "x") {
        calcY = 0;
      } else if (axis === "y") {
        calcX = 0;
      }

      // Snapping points check
      if (opts.snapPoints && opts.snapPoints.length > 0) {
        const snapDist = opts.snapDistance ?? 15;
        for (const pt of opts.snapPoints) {
          if (Math.hypot(calcX - pt.x, calcY - pt.y) <= snapDist) {
            calcX = pt.x;
            calcY = pt.y;
            opts.onSnap?.(pt, buildState());
            break;
          }
        }
      }

      targetOffsetX = calcX;
      targetOffsetY = calcY;

      const state = buildState();
      if (!wasAttracted) {
        opts.onAttractStart?.(state);
      }
      opts.onAttractUpdate?.(state);
    } else {
      if (isAttracted) {
        isAttracted = false;
        targetOffsetX = 0;
        targetOffsetY = 0;
        opts.onAttractEnd?.(buildState());
      }
    }
  }

  // Animation frame loop using spring physics
  const unsubscribeFrames = subscribeAnimationFrames((now) => {
    if (!isEnabled || isDestroyed) {
      lastFrameTime = now;
      return;
    }

    const dt = Math.max(0.001, Math.min(0.064, (now - lastFrameTime) / 1000));
    lastFrameTime = now;

    const stiffness = opts.springConfig?.stiffness ?? DEFAULT_STIFFNESS;
    const damping = opts.springConfig?.damping ?? DEFAULT_DAMPING;
    const mass = opts.springConfig?.mass ?? DEFAULT_MASS;

    // Critically damped spring simulation for X
    const forceX = -stiffness * (currentOffsetX - targetOffsetX) - damping * velocityX;
    const accelX = forceX / mass;
    velocityX += accelX * dt;
    currentOffsetX += velocityX * dt;

    // Critically damped spring simulation for Y
    const forceY = -stiffness * (currentOffsetY - targetOffsetY) - damping * velocityY;
    const accelY = forceY / mass;
    velocityY += accelY * dt;
    currentOffsetY += velocityY * dt;

    const distToTarget = Math.hypot(currentOffsetX - targetOffsetX, currentOffsetY - targetOffsetY);
    const speed = Math.hypot(velocityX, velocityY);

    if (distToTarget < 0.05 && speed < 0.05 && targetOffsetX === 0 && targetOffsetY === 0) {
      currentOffsetX = 0;
      currentOffsetY = 0;
      velocityX = 0;
      velocityY = 0;

      if (hasTransformApplied) {
        hasTransformApplied = false;
        removeTransformLayer(target, optionsToken);
      }
      return;
    }

    // Apply transform via layer manager
    hasTransformApplied = true;
    const transformStr = `translate3d(${currentOffsetX.toFixed(2)}px, ${currentOffsetY.toFixed(2)}px, 0px)`;
    setTransformLayer(target, optionsToken, transformStr);
  });

  const unsubscribeReducedMotion = onReducedMotionChange(() => {
    if (opts.respectReducedMotion !== false && prefersReducedMotion()) {
      currentOffsetX = 0;
      currentOffsetY = 0;
      targetOffsetX = 0;
      targetOffsetY = 0;
      velocityX = 0;
      velocityY = 0;
      if (hasTransformApplied) {
        hasTransformApplied = false;
        removeTransformLayer(target, optionsToken);
      }
    }
  });

  // Attach window pointer events
  const cleanups: (() => void)[] = [];
  const add = (targetEl: EventTarget, type: string, handler: (e: Event) => void) => {
    targetEl.addEventListener(type, handler, { passive: true });
    cleanups.push(() => targetEl.removeEventListener(type, handler));
  };

  if (typeof window !== "undefined") {
    add(window, "pointermove", handlePointer);
    add(window, "mousemove", handlePointer);
    add(window, "touchmove", handlePointer);
  }

  function updateOptions(newOptions: Partial<MagneticControllerOptions>): void {
    opts = { ...opts, ...newOptions };
  }

  function setMode(mode: MagneticMode): void {
    opts = { ...opts, mode };
  }

  function enable(): void {
    isEnabled = true;
  }

  function disable(): void {
    isEnabled = false;
    isAttracted = false;
    targetOffsetX = 0;
    targetOffsetY = 0;
  }

  function reset(): void {
    isAttracted = false;
    currentOffsetX = 0;
    currentOffsetY = 0;
    targetOffsetX = 0;
    targetOffsetY = 0;
    velocityX = 0;
    velocityY = 0;
    if (hasTransformApplied) {
      hasTransformApplied = false;
      removeTransformLayer(target, optionsToken);
    }
  }

  function destroy(): void {
    if (isDestroyed) return;
    isDestroyed = true;

    unsubscribeFrames();
    unsubscribeReducedMotion();

    for (const cleanup of cleanups) {
      cleanup();
    }
    cleanups.length = 0;

    reset();
  }

  return {
    target,
    getState: buildState,
    updateOptions,
    setMode,
    enable,
    disable,
    reset,
    destroy,
  };
}
