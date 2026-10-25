import { resolveTargets } from "../core/animate.js";
import type { AnimateTarget } from "../core/animate.js";
import { onReducedMotionChange, prefersReducedMotion } from "../core/motion.js";

export type CursorTrailTarget = AnimateTarget | Document;

export interface CursorTrailOptions {
  /** CSS particle color. Defaults to violet. */
  color?: string;
  /** Maximum number of simultaneously visible particles. Defaults to 12. */
  particleCount?: number;
  /** Particle diameter in pixels. Must be > 0. Defaults to 6. */
  size?: number;
  /** Particle lifetime in milliseconds. Must be > 0. Defaults to 500. */
  duration?: number;
  /** Track the document, an element, or all elements matching a selector. Defaults to document. */
  target?: CursorTrailTarget;
}

export interface CursorTrailControls {
  /** Removes listeners, cancels active animations, and removes the overlay. Safe to repeat. */
  destroy(): void;
}

interface Particle {
  element: HTMLSpanElement;
  animation: Animation;
}

interface CursorEventTarget {
  addEventListener(type: "pointermove", listener: (event: PointerEvent) => void): void;
  removeEventListener(type: "pointermove", listener: (event: PointerEvent) => void): void;
}

const DEFAULT_COLOR = "#8b5cf6";
const DEFAULT_PARTICLE_COUNT = 12;
const DEFAULT_SIZE = 6;
const DEFAULT_DURATION = 500;

function validateColor(color: string): void {
  if (typeof color !== "string" || color.trim() === "") {
    throw new TypeError("color must be a non-empty CSS color string");
  }
  if (typeof CSS !== "undefined" && typeof CSS.supports === "function" && !CSS.supports("color", color)) {
    throw new TypeError(`Invalid CSS color "${color}"`);
  }
}

function validatePositive(name: string, value: number): void {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a finite number > 0, received ${String(value)}`);
  }
}

function validateCount(count: number): void {
  if (!Number.isInteger(count) || count <= 0) {
    throw new RangeError(`particleCount must be a positive integer, received ${String(count)}`);
  }
}

/**
 * Emits a fading particle trail from pointer movement. Particle animations are individual
 * Web Animations; there is no per-frame JavaScript loop.
 */
export function cursorTrail(options: CursorTrailOptions = {}): CursorTrailControls {
  const {
    color = DEFAULT_COLOR,
    particleCount = DEFAULT_PARTICLE_COUNT,
    size = DEFAULT_SIZE,
    duration = DEFAULT_DURATION,
    target,
  } = options;

  validateColor(color);
  validateCount(particleCount);
  validatePositive("size", size);
  validatePositive("duration", duration);

  if (typeof document === "undefined") {
    throw new Error("cursorTrail() requires document, which is not available in this environment");
  }

  let listeners: CursorEventTarget[];
  if (target === undefined || target === document) {
    listeners = [document as unknown as CursorEventTarget];
  } else {
    listeners = resolveTargets(target as AnimateTarget) as CursorEventTarget[];
  }
  if (listeners.length === 0) return { destroy: () => undefined };

  const reducedInitially = prefersReducedMotion();
  if (!reducedInitially && typeof document.createElement !== "function") {
    throw new Error("cursorTrail() requires document.createElement, which is not available in this environment");
  }
  if (!reducedInitially && typeof document.createElement("span").animate !== "function") {
    throw new Error("cursorTrail() requires the Web Animations API when motion is enabled");
  }

  let reducedMotion = reducedInitially;
  let destroyed = false;
  let overlay: HTMLDivElement | null = null;
  const particles: Particle[] = [];
  const seenEvents = new WeakSet<PointerEvent>();

  const removeParticle = (particle: Particle): void => {
    const index = particles.indexOf(particle);
    if (index >= 0) particles.splice(index, 1);
    particle.animation.cancel();
    if (particle.element.parentElement === overlay) overlay?.removeChild(particle.element);
  };

  const clearParticles = (): void => {
    for (const particle of [...particles]) removeParticle(particle);
  };

  const removeOverlay = (): void => {
    clearParticles();
    if (overlay?.parentElement) overlay.parentElement.removeChild(overlay);
    overlay = null;
  };

  const ensureOverlay = (): HTMLDivElement => {
    if (overlay) return overlay;
    const layer = document.createElement("div");
    layer.setAttribute("aria-hidden", "true");
    layer.style.setProperty("position", "fixed");
    layer.style.setProperty("inset", "0");
    layer.style.setProperty("overflow", "hidden");
    layer.style.setProperty("pointer-events", "none");
    layer.style.setProperty("z-index", "2147483647");
    const parent = document.body ?? document.documentElement;
    if (!parent) throw new Error("cursorTrail() requires a document body or document element");
    parent.appendChild(layer);
    overlay = layer;
    return layer;
  };

  const onPointerMove = (event: PointerEvent): void => {
    if (destroyed || reducedMotion || event.pointerType === "touch" || seenEvents.has(event)) return;
    seenEvents.add(event);

    const currentTarget = event.currentTarget;
    if (target !== undefined && target !== document && currentTarget instanceof HTMLElement) {
      const rect = currentTarget.getBoundingClientRect();
      if (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      ) {
        return;
      }
    }

    const layer = ensureOverlay();
    if (typeof layer.animate !== "function") {
      throw new Error("cursorTrail() requires the Web Animations API to animate particles");
    }

    while (particles.length >= particleCount) {
      const oldest = particles[0];
      if (oldest) removeParticle(oldest);
    }

    const particle = document.createElement("span");
    particle.style.setProperty("position", "absolute");
    particle.style.setProperty("left", `${event.clientX}px`);
    particle.style.setProperty("top", `${event.clientY}px`);
    particle.style.setProperty("width", `${size}px`);
    particle.style.setProperty("height", `${size}px`);
    particle.style.setProperty("margin-left", `${-size / 2}px`);
    particle.style.setProperty("margin-top", `${-size / 2}px`);
    particle.style.setProperty("border-radius", "50%");
    particle.style.setProperty("background-color", color);
    particle.style.setProperty("pointer-events", "none");
    particle.style.setProperty("will-change", "transform, opacity");
    layer.appendChild(particle);

    let animation: Animation;
    try {
      animation = particle.animate(
        [
          { opacity: 0.9, transform: "scale(1)" },
          { opacity: 0, transform: "scale(0.2)" },
        ],
        { duration, easing: "ease-out", fill: "forwards" },
      );
    } catch (error) {
      layer.removeChild(particle);
      throw error;
    }
    const activeParticle: Particle = { element: particle, animation };
    particles.push(activeParticle);
    animation.onfinish = () => {
      const index = particles.indexOf(activeParticle);
      if (index >= 0) particles.splice(index, 1);
      if (particle.parentElement === overlay) overlay?.removeChild(particle);
    };
  };

  const registered: CursorEventTarget[] = [];
  try {
    for (const listener of listeners) {
      listener.addEventListener("pointermove", onPointerMove);
      registered.push(listener);
    }
  } catch (error) {
    for (const listener of registered) listener.removeEventListener("pointermove", onPointerMove);
    throw error;
  }

  const stopPreferenceListener = onReducedMotionChange((reduced) => {
    if (destroyed || reduced === reducedMotion) return;
    reducedMotion = reduced;
    if (reduced) removeOverlay();
  });

  return {
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      stopPreferenceListener();
      for (const listener of registered) listener.removeEventListener("pointermove", onPointerMove);
      removeOverlay();
    },
  };
}
