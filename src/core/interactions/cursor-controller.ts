/**
 * AF Motion Cursor Controller
 *
 * Configurable, high-performance cursor intelligence system supporting custom cursor visuals,
 * smoothing, lag/delayed tracking, velocity, acceleration, direction, hover detection,
 * proximity sensing, visibility controls, and touch graceful fallback.
 */

import { subscribeAnimationFrames } from "../animation.js";
import { onReducedMotionChange, prefersReducedMotion } from "../motion.js";
import { removeTransformLayer, setTransformLayer } from "../transform.js";
import { normalizeInputEvent } from "./input-normalizer.js";
import type {
  CursorController,
  CursorControllerOptions,
  CursorMode,
  CursorProximityTarget,
  CursorState,
  Point2D,
} from "./types.js";

interface TimestampedPoint {
  readonly x: number;
  readonly y: number;
  readonly time: number;
}

export function createCursorController(
  element: HTMLElement | null = null,
  options: CursorControllerOptions = {}
): CursorController {
  let smoothing = options.smoothing ?? 0.15;
  const lagMs = options.lagMs ?? 0;
  const hideNativeCursor = options.hideNativeCursor ?? false;
  const hoverSelector = options.hoverSelector ?? "a, button, [data-interactive], input, select, textarea";
  const snapToCenterOnHover = options.snapToCenterOnHover ?? false;
  const touchFallback = options.touchFallback ?? "hide";
  const respectReducedMotion = options.respectReducedMotion !== false;

  let isEnabled = true;
  let isDestroyed = false;
  let isVisible = false;
  let currentMode: CursorMode = options.mode ?? "default";
  let customState: string | null = null;

  // Position state
  let currentX = 0;
  let currentY = 0;
  let targetX = 0;
  let targetY = 0;
  let prevX = 0;
  let prevY = 0;
  let velocityX = 0;
  let velocityY = 0;
  let prevVelocityX = 0;
  let prevVelocityY = 0;
  let accelerationX = 0;
  let accelerationY = 0;
  let angle = 0;
  let scale = 1.0;
  let opacity = 1.0;

  let isHovering = false;
  let hoveredElement: HTMLElement | null = null;
  let lastFrameTime = typeof performance !== "undefined" ? performance.now() : Date.now();

  const history: TimestampedPoint[] = [];
  const proximityTargets = new Set<CursorProximityTarget>();
  const activeProximitySet = new Set<HTMLElement>();

  // Add initial proximity targets
  if (options.proximityTargets) {
    for (const item of options.proximityTargets) {
      if ("element" in item) {
        proximityTargets.add(item);
      } else {
        proximityTargets.add({ element: item, radius: options.proximityRadius ?? 100 });
      }
    }
  }

  // Hide native cursor if requested
  const previousDocumentCursor = typeof document !== "undefined" ? document.documentElement.style.cursor : "";
  if (hideNativeCursor && typeof document !== "undefined") {
    document.documentElement.style.cursor = "none";
  }

  function getEffectiveSmoothing(): number {
    if (respectReducedMotion && prefersReducedMotion()) {
      return 0;
    }
    return Math.max(0, Math.min(1, smoothing));
  }

  function buildState(): CursorState {
    const speed = Math.hypot(velocityX, velocityY);
    return {
      x: Number(currentX.toFixed(2)),
      y: Number(currentY.toFixed(2)),
      targetX: Number(targetX.toFixed(2)),
      targetY: Number(targetY.toFixed(2)),
      velocityX: Number(velocityX.toFixed(2)),
      velocityY: Number(velocityY.toFixed(2)),
      speed: Number(speed.toFixed(2)),
      accelerationX: Number(accelerationX.toFixed(2)),
      accelerationY: Number(accelerationY.toFixed(2)),
      angle: Number(angle.toFixed(1)),
      isVisible,
      isHovering,
      hoveredElement,
      mode: currentMode,
      customState,
      scale,
      opacity,
    };
  }

  function updateElementTransform(): void {
    if (!element || isDestroyed) return;

    if (!isVisible) {
      element.style.display = "none";
      return;
    }

    element.style.display = "";
    const transformStr = `translate3d(${currentX}px, ${currentY}px, 0px) scale(${scale})`;
    setTransformLayer(element, options, transformStr);
    element.style.opacity = String(opacity);
  }

  function checkHover(pointerX: number, pointerY: number): void {
    if (typeof document === "undefined" || !document.elementFromPoint) return;

    const el = document.elementFromPoint(pointerX, pointerY) as HTMLElement | null;
    let interactive: HTMLElement | null = null;

    if (el) {
      interactive = el.closest(hoverSelector) as HTMLElement | null;
    }

    if (interactive !== hoveredElement) {
      const oldEl = hoveredElement;
      hoveredElement = interactive;
      isHovering = interactive !== null;

      const state = buildState();
      if (oldEl) {
        options.onHoverEnd?.(oldEl, state);
      }
      if (interactive) {
        options.onHoverStart?.(interactive, state);
        if (snapToCenterOnHover) {
          const rect = interactive.getBoundingClientRect();
          targetX = rect.left + rect.width / 2;
          targetY = rect.top + rect.height / 2;
        }
      }
      options.onStateChange?.(state);
    }
  }

  function checkProximity(pointerX: number, pointerY: number): void {
    for (const prox of proximityTargets) {
      const el = prox.element;
      if (!el.isConnected) continue;

      const radius = prox.radius ?? options.proximityRadius ?? 100;
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dist = Math.hypot(pointerX - centerX, pointerY - centerY);

      if (dist <= radius) {
        const normDist = Math.max(0, Math.min(1, dist / radius));
        if (!activeProximitySet.has(el)) {
          activeProximitySet.add(el);
          prox.onEnter?.(el, dist);
        }
        prox.onProximity?.(el, dist, normDist);
      } else {
        if (activeProximitySet.has(el)) {
          activeProximitySet.delete(el);
          prox.onLeave?.(el);
        }
      }
    }
  }

  function handlePointer(event: Event): void {
    if (!isEnabled || isDestroyed) return;
    const norm = normalizeInputEvent(event, null);
    if (!norm.point) return;

    // Handle touch fallback
    if (norm.source === "touch" || norm.pointerType === "touch") {
      if (touchFallback === "hide") {
        if (isVisible) {
          isVisible = false;
          updateElementTransform();
          options.onStateChange?.(buildState());
        }
        return;
      }
      if (touchFallback === "ignore") {
        return;
      }
    }

    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    const px = norm.point.x;
    const py = norm.point.y;

    if (!isVisible) {
      isVisible = true;
      currentX = px;
      currentY = py;
      prevX = px;
      prevY = py;
      options.onStateChange?.(buildState());
    }

    if (lagMs > 0) {
      history.push({ x: px, y: py, time: now });
      while (history.length > 100 || (history.length > 1 && now - history[0].time > lagMs * 2)) {
        history.shift();
      }
    } else {
      targetX = px;
      targetY = py;
      if (getEffectiveSmoothing() <= 0.001) {
        currentX = px;
        currentY = py;
        updateElementTransform();
        options.onPositionChange?.(buildState());
      }
    }

    checkHover(px, py);
    checkProximity(px, py);
  }

  function handlePointerLeave(): void {
    if (isVisible) {
      isVisible = false;
      if (hoveredElement) {
        const el = hoveredElement;
        hoveredElement = null;
        isHovering = false;
        options.onHoverEnd?.(el, buildState());
      }
      updateElementTransform();
      options.onStateChange?.(buildState());
    }
  }

  // Animation frame loop for smooth interpolation and kinematics
  const unsubscribeFrames = subscribeAnimationFrames((now) => {
    if (!isEnabled || isDestroyed || !isVisible) {
      lastFrameTime = now;
      return;
    }

    const dt = Math.max(0.001, Math.min(0.1, (now - lastFrameTime) / 1000));
    lastFrameTime = now;

    // Resolve target position if lag is configured
    if (lagMs > 0 && history.length > 0) {
      const targetTime = now - lagMs;
      let chosen = history[0];
      for (let i = history.length - 1; i >= 0; i--) {
        if (history[i].time <= targetTime) {
          chosen = history[i];
          break;
        }
      }
      targetX = chosen.x;
      targetY = chosen.y;
    }

    const effSmoothing = getEffectiveSmoothing();

    if (effSmoothing <= 0.001) {
      currentX = targetX;
      currentY = targetY;
    } else {
      // Exponential smoothing factor: alpha = 1 - exp(-dt / tau)
      const tau = effSmoothing * 0.25;
      const alpha = 1 - Math.exp(-dt / tau);
      currentX += (targetX - currentX) * alpha;
      currentY += (targetY - currentY) * alpha;
    }

    // Kinematics calculations
    const dx = currentX - prevX;
    const dy = currentY - prevY;
    prevX = currentX;
    prevY = currentY;

    const newVx = dx / dt;
    const newVy = dy / dt;
    accelerationX = (newVx - velocityX) / dt;
    accelerationY = (newVy - velocityY) / dt;
    velocityX = newVx;
    velocityY = newVy;

    if (Math.hypot(dx, dy) > 0.5) {
      angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    }

    updateElementTransform();
    options.onPositionChange?.(buildState());
  });

  // Reduced motion listener
  const unsubscribeReducedMotion = onReducedMotionChange(() => {
    if (respectReducedMotion && prefersReducedMotion()) {
      currentX = targetX;
      currentY = targetY;
      velocityX = 0;
      velocityY = 0;
      accelerationX = 0;
      accelerationY = 0;
      updateElementTransform();
    }
  });

  // Register window pointer events
  const cleanups: (() => void)[] = [];
  const add = (targetEl: EventTarget, type: string, handler: (e: Event) => void) => {
    targetEl.addEventListener(type, handler, { passive: true });
    cleanups.push(() => targetEl.removeEventListener(type, handler));
  };

  if (typeof window !== "undefined") {
    add(window, "pointermove", handlePointer);
    add(window, "pointerdown", handlePointer);
    add(window, "mousemove", handlePointer);
    add(window, "touchmove", handlePointer);
    add(document, "mouseleave", handlePointerLeave);
  }

  function setMode(mode: CursorMode): void {
    if (currentMode === mode) return;
    currentMode = mode;
    options.onStateChange?.(buildState());
  }

  function setCustomState(stateName: string | null): void {
    if (customState === stateName) return;
    customState = stateName;
    options.onStateChange?.(buildState());
  }

  function setVisibility(visible: boolean): void {
    if (isVisible === visible) return;
    isVisible = visible;
    updateElementTransform();
    options.onStateChange?.(buildState());
  }

  function setPosition(x: number, y: number, immediate = false): void {
    targetX = x;
    targetY = y;
    if (immediate) {
      currentX = x;
      currentY = y;
      prevX = x;
      prevY = y;
      velocityX = 0;
      velocityY = 0;
      accelerationX = 0;
      accelerationY = 0;
    }
    updateElementTransform();
    options.onPositionChange?.(buildState());
  }

  function addProximityTarget(target: HTMLElement | CursorProximityTarget): () => void {
    const prox: CursorProximityTarget =
      "element" in target ? target : { element: target, radius: options.proximityRadius ?? 100 };
    proximityTargets.add(prox);
    return () => {
      proximityTargets.delete(prox);
      activeProximitySet.delete(prox.element);
    };
  }

  function removeProximityTarget(el: HTMLElement): void {
    for (const prox of proximityTargets) {
      if (prox.element === el) {
        proximityTargets.delete(prox);
        activeProximitySet.delete(el);
      }
    }
  }

  function enable(): void {
    isEnabled = true;
  }

  function disable(): void {
    isEnabled = false;
    if (isVisible) {
      isVisible = false;
      updateElementTransform();
      options.onStateChange?.(buildState());
    }
  }

  function reset(): void {
    currentX = 0;
    currentY = 0;
    targetX = 0;
    targetY = 0;
    prevX = 0;
    prevY = 0;
    velocityX = 0;
    velocityY = 0;
    accelerationX = 0;
    accelerationY = 0;
    history.length = 0;
    activeProximitySet.clear();
    if (hoveredElement) {
      hoveredElement = null;
      isHovering = false;
    }
    updateElementTransform();
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

    if (element) {
      removeTransformLayer(element, options);
      element.style.display = "";
      element.style.opacity = "";
    }

    if (hideNativeCursor && typeof document !== "undefined") {
      document.documentElement.style.cursor = previousDocumentCursor;
    }

    proximityTargets.clear();
    activeProximitySet.clear();
  }

  return {
    element,
    getState: buildState,
    setMode,
    setCustomState,
    setVisibility,
    setPosition,
    addProximityTarget,
    removeProximityTarget,
    enable,
    disable,
    reset,
    destroy,
  };
}
