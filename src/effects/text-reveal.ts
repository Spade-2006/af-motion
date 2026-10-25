import type { EasingFunction } from "../core/animation.js";
import { resolveTargets } from "../core/animate.js";
import type { AnimateTarget } from "../core/animate.js";
import { onReducedMotionChange, prefersReducedMotion } from "../core/motion.js";
import { splitText } from "./split-text.js";

export type TextRevealMode = "characters" | "words";
export type TextRevealDirection = "up" | "down" | "left" | "right" | "none";
export type TextRevealTrigger = "scroll" | "immediate";

export interface TextRevealOptions {
  /** Units to reveal. Defaults to "words". */
  by?: TextRevealMode;
  /** Reveal duration in milliseconds. Defaults to 600. */
  duration?: number;
  /** Delay between units in milliseconds. Defaults to 50. */
  stagger?: number;
  /** CSS timing function or a progress easing function. Defaults to "ease". */
  easing?: string | EasingFunction;
  /** Direction units travel as they appear. Defaults to "up". */
  direction?: TextRevealDirection;
  /** Start immediately or when each target enters the viewport. Defaults to "immediate". */
  trigger?: TextRevealTrigger;
}

export interface TextRevealControls {
  /** Cancels pending starts, disconnects observers, and restores the original DOM. Safe to repeat. */
  destroy(): void;
}

interface RevealTarget {
  element: HTMLElement;
  units: HTMLSpanElement[];
  started: boolean;
}

const DEFAULT_BY: TextRevealMode = "words";
const DEFAULT_DURATION = 600;
const DEFAULT_STAGGER = 50;
const DEFAULT_DIRECTION: TextRevealDirection = "up";
const DEFAULT_TRIGGER: TextRevealTrigger = "immediate";
let nextClassId = 0;

function validateTime(name: string, value: number): void {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be a finite number >= 0, received ${String(value)}`);
  }
}

function easingCss(easing: string | EasingFunction): string {
  if (typeof easing === "string") {
    const value = easing.trim();
    if (value === "") throw new TypeError("easing must be a non-empty CSS timing function or function");
    if (typeof CSS !== "undefined" && typeof CSS.supports === "function" &&
        !CSS.supports("transition-timing-function", value)) {
      throw new TypeError(`Invalid CSS timing function "${value}"`);
    }
    return value;
  }
  if (typeof easing !== "function") {
    throw new TypeError("easing must be a CSS timing function or function");
  }

  const samples = Array.from({ length: 21 }, (_, index) => {
    const progress = index / 20;
    const value = easing(progress);
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new TypeError(`easing must return finite numbers, received ${String(value)} at ${progress}`);
    }
    return `${value} ${progress * 100}%`;
  });
  return `linear(${samples.join(", ")})`;
}

function initialTransform(direction: TextRevealDirection): string {
  switch (direction) {
    case "up":
      return "translateY(1em)";
    case "down":
      return "translateY(-1em)";
    case "left":
      return "translateX(1em)";
    case "right":
      return "translateX(-1em)";
    case "none":
      return "none";
  }
}

function getRevealUnits(element: HTMLElement, className: string): HTMLSpanElement[] {
  const units: HTMLSpanElement[] = [];
  const visit = (parent: Node): void => {
    for (const child of Array.from(parent.childNodes)) {
      if (child instanceof HTMLElement && child.classList.contains(className)) {
        units.push(child as HTMLSpanElement);
      }
      visit(child);
    }
  };
  visit(element);
  return units;
}

function setFinalState(target: RevealTarget, duration: number, stagger: number, easing: string): void {
  target.units.forEach((unit, index) => {
    unit.style.setProperty(
      "transition",
      `opacity ${duration}ms ${easing} ${index * stagger}ms, transform ${duration}ms ${easing} ${index * stagger}ms`,
    );
  });
  target.element.getBoundingClientRect();
  for (const unit of target.units) {
    unit.style.setProperty("opacity", "1");
    unit.style.setProperty("transform", "none");
  }
}

/**
 * Reveals characters or words with CSS transitions, optionally when each target enters view.
 * Generated wrappers are removed and the original DOM tree restored on destroy.
 */
export function textReveal(target: AnimateTarget, options: TextRevealOptions = {}): TextRevealControls {
  const {
    by = DEFAULT_BY,
    duration = DEFAULT_DURATION,
    stagger = DEFAULT_STAGGER,
    easing = "ease",
    direction = DEFAULT_DIRECTION,
    trigger = DEFAULT_TRIGGER,
  } = options;

  if (by !== "characters" && by !== "words") {
    throw new TypeError(`by must be "characters" or "words", received ${String(by)}`);
  }
  validateTime("duration", duration);
  validateTime("stagger", stagger);
  if (direction !== "up" && direction !== "down" && direction !== "left" &&
      direction !== "right" && direction !== "none") {
    throw new TypeError(`direction must be "up", "down", "left", "right", or "none", received ${String(direction)}`);
  }
  if (trigger !== "scroll" && trigger !== "immediate") {
    throw new TypeError(`trigger must be "scroll" or "immediate", received ${String(trigger)}`);
  }
  const cssEasing = easingCss(easing);
  const elements = resolveTargets(target);
  if (elements.length === 0) return { destroy: () => undefined };

  const reducedMotion = prefersReducedMotion();
  if (!reducedMotion &&
      (typeof requestAnimationFrame !== "function" || typeof cancelAnimationFrame !== "function")) {
    throw new Error("textReveal() requires requestAnimationFrame and cancelAnimationFrame when motion is enabled");
  }
  if (!reducedMotion && trigger === "scroll" && typeof IntersectionObserver === "undefined") {
    throw new Error("textReveal() with trigger 'scroll' requires IntersectionObserver");
  }

  const className = `af-text-reveal-${nextClassId++}`;
  const splitControls = splitText(target, { by, className });
  const targets: RevealTarget[] = [];
  try {
    for (const element of elements) {
      targets.push({ element, units: getRevealUnits(element, className), started: false });
    }
  } catch (error) {
    splitControls.destroy();
    throw error;
  }
  const initial = initialTransform(direction);
  let destroyed = false;
  let observer: IntersectionObserver | undefined;
  const frames = new Set<number>();
  const targetByElement = new Map(targets.map((state) => [state.element, state]));

  const revealTarget = (state: RevealTarget): void => {
    if (destroyed || state.started) return;
    state.started = true;
    if (reducedMotion) {
      for (const unit of state.units) {
        unit.style.setProperty("opacity", "1");
        unit.style.setProperty("transform", "none");
      }
      return;
    }
    state.element.getBoundingClientRect();
    for (const unit of state.units) {
      unit.style.setProperty(
        "transition",
        `opacity ${duration}ms ${cssEasing}, transform ${duration}ms ${cssEasing}`,
      );
    }
    const frame = requestAnimationFrame(() => {
      frames.delete(frame);
      if (destroyed) return;
      setFinalState(state, duration, stagger, cssEasing);
    });
    frames.add(frame);
  };

  let stopPreferenceListener = (): void => undefined;
  const finishImmediately = (): void => {
    for (const frame of frames) cancelAnimationFrame(frame);
    frames.clear();
    observer?.disconnect();
    for (const state of targets) {
      state.started = true;
      for (const unit of state.units) {
        unit.style.setProperty("transition", "none");
        unit.style.setProperty("opacity", "1");
        unit.style.setProperty("transform", "none");
      }
    }
    stopPreferenceListener();
  };

  try {
    for (const state of targets) {
      for (const [index, unit] of state.units.entries()) {
        unit.style.setProperty("display", "inline-block");
        unit.style.setProperty("opacity", reducedMotion ? "1" : "0");
        unit.style.setProperty("transform", reducedMotion ? "none" : initial);
        unit.style.setProperty("transition", "none");
        unit.style.setProperty("will-change", reducedMotion ? "auto" : "opacity, transform");
        unit.style.setProperty("transition-delay", `${index * stagger}ms`);
      }
    }

    if (reducedMotion) {
      for (const state of targets) revealTarget(state);
    } else if (trigger === "scroll") {
      observer = new IntersectionObserver((entries) => {
        if (destroyed) return;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const state = targetByElement.get(entry.target as HTMLElement);
          if (!state) continue;
          revealTarget(state);
          observer?.unobserve(state.element);
        }
      });
      for (const state of targets) observer.observe(state.element);
    } else {
      for (const state of targets) revealTarget(state);
    }
  } catch (error) {
    observer?.disconnect();
    for (const frame of frames) cancelAnimationFrame(frame);
    splitControls.destroy();
    throw error;
  }

  if (!reducedMotion) {
    stopPreferenceListener = onReducedMotionChange((reduced) => {
      if (reduced && !destroyed) finishImmediately();
    });
  }

  return {
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      observer?.disconnect();
      stopPreferenceListener();
      for (const frame of frames) cancelAnimationFrame(frame);
      frames.clear();
      splitControls.destroy();
    },
  };
}
