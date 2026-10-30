import { createElement, useCallback, useEffect, useRef, useState } from "react";
import type { HTMLAttributes, ReactNode, RefObject } from "react";
import { animate as animateElement } from "./core/animate.js";
import type { AnimatableProperties, DOMAnimationOptions } from "./core/animate.js";
import type { AnimationControls } from "./core/animation.js";
import { inView } from "./effects/in-view.js";
import type { InViewOptions } from "./effects/in-view.js";
import { scrollProgress } from "./effects/scroll-progress.js";
import type { ScrollProgressOptions } from "./effects/scroll-progress.js";
import { scrollVelocity } from "./effects/scroll-velocity.js";
import type { ScrollVelocityData, ScrollVelocityOptions } from "./effects/scroll-velocity.js";
import type { AnimateTarget } from "./core/animate.js";
import { reveal } from "./effects/reveal.js";
import { typewriter } from "./effects/typewriter.js";
import type { TypewriterOptions } from "./effects/typewriter.js";
import { textScramble } from "./effects/text-scramble.js";
import type { TextScrambleOptions } from "./effects/text-scramble.js";
import { gradientText } from "./effects/gradient-text.js";
import type { GradientTextOptions } from "./effects/gradient-text.js";

export type UseAnimateCallback = (
  properties: AnimatableProperties,
  options?: DOMAnimationOptions,
) => AnimationControls | null;

export interface UseAnimateResult<T extends HTMLElement> {
  ref: RefObject<T | null>;
  animate: UseAnimateCallback;
}

export interface UseInViewResult<T extends HTMLElement> {
  ref: RefObject<T | null>;
  isInView: boolean;
}

export interface UseScrollProgressResult<T extends HTMLElement> {
  ref: RefObject<T | null>;
  progress: number;
}

export type UseScrollProgressOptions = Omit<ScrollProgressOptions, "target"> & {
  /** Track page scrolling explicitly, even when the returned ref is attached. */
  target?: AnimateTarget | "window";
};

export interface UseScrollVelocityResult<T extends HTMLElement> {
  ref: RefObject<T | null>;
  data: ScrollVelocityData;
}

export type UseScrollVelocityOptions = Omit<ScrollVelocityOptions, "onUpdate"> & {
  /** Track page scrolling explicitly, even when the returned ref is attached. */
  target?: ScrollVelocityOptions["target"] | "window";
  onUpdate?: ScrollVelocityOptions["onUpdate"];
};

const INITIAL_SCROLL_VELOCITY: ScrollVelocityData = {
  velocity: 0,
  direction: "idle",
  position: 0,
  progress: 0,
};

export type RevealDirection = "up" | "down" | "left" | "right";

export interface RevealProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  children?: ReactNode;
  direction?: RevealDirection;
  duration?: number;
  delay?: number;
  once?: boolean;
}

interface AnimatedTextBaseProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  text: string;
}

export type AnimatedTextProps = AnimatedTextBaseProps & (
  | {
    effect: "typewriter";
    effectOptions?: Omit<TypewriterOptions, "phrases">;
  }
  | {
    effect: "scramble";
    effectOptions?: TextScrambleOptions;
  }
  | {
    effect: "gradient";
    effectOptions?: GradientTextOptions;
  }
);

const REVEAL_PROPERTIES: Record<RevealDirection, AnimatableProperties> = {
  up: { opacity: [0, 1], transform: ["translateY(24px)", "translateY(0px)"] },
  down: { opacity: [0, 1], transform: ["translateY(-24px)", "translateY(0px)"] },
  left: { opacity: [0, 1], transform: ["translateX(24px)", "translateX(0px)"] },
  right: { opacity: [0, 1], transform: ["translateX(-24px)", "translateX(0px)"] },
};

/**
 * Returns a DOM ref and an imperative animation function scoped to its element.
 * The returned function yields null until the ref points to an element.
 */
export function useAnimate<T extends HTMLElement = HTMLElement>(): UseAnimateResult<T> {
  const ref = useRef<T | null>(null);
  const activeControls = useRef(new Set<AnimationControls>());

  const animate = useCallback<UseAnimateCallback>((properties, options) => {
    const element = ref.current;
    if (!element) return null;

    let controls: AnimationControls | undefined;
    let hasFinished = false;
    const removeControls = (): void => {
      if (controls) activeControls.current.delete(controls);
      else hasFinished = true;
    };

    const result = animateElement(element, properties, {
      ...options,
      onComplete: () => {
        try {
          options?.onComplete?.();
        } finally {
          removeControls();
        }
      },
      onCancel: () => {
        try {
          options?.onCancel?.();
        } finally {
          removeControls();
        }
      },
    });
    controls = result;
    if (!hasFinished) activeControls.current.add(result);
    return result;
  }, []);

  useEffect(() => () => {
    const controls = Array.from(activeControls.current);
    activeControls.current.clear();
    const errors: unknown[] = [];
    for (const control of controls) {
      try {
        control.cancel();
      } catch (error) {
        errors.push(error);
      }
    }
    if (errors.length > 0) throw errors[0];
  }, []);

  return { ref, animate };
}

/**
 * Tracks whether the referenced element is in view. Observation starts after mount
 * and is recreated when observer options change.
 */
export function useInView<T extends HTMLElement = HTMLElement>(
  options: InViewOptions = {},
): UseInViewResult<T> {
  const ref = useRef<T | null>(null);
  const [isInView, setIsInView] = useState(false);
  const { rootMargin, threshold, once } = options;

  useEffect(() => {
    setIsInView(false);
    const element = ref.current;
    if (!element) return;

    let active = true;
    const controls = inView(element, () => {
      if (active) setIsInView(true);
      return () => {
        if (active) setIsInView(false);
      };
    }, { rootMargin, threshold, once });

    return () => {
      active = false;
      controls.destroy();
    };
  }, [rootMargin, threshold, once]);

  return { ref, isInView };
}

/**
 * Tracks normalized page scroll progress, or the progress of a referenced
 * scroll container. An explicit `target` takes precedence over the returned ref.
 */
export function useScrollProgress<T extends HTMLElement = HTMLElement>(
  options: UseScrollProgressOptions = {},
): UseScrollProgressResult<T> {
  const ref = useRef<T | null>(null);
  const [progress, setProgress] = useState(0);
  const {
    position,
    color,
    height,
    smoothing,
    easing,
    target,
    onUpdate,
  } = options;

  useEffect(() => {
    setProgress(0);
    let active = true;
    const controls = scrollProgress({
      position,
      color,
      height,
      smoothing,
      easing,
      target: target === "window" ? undefined : target ?? ref.current ?? undefined,
      onUpdate: (value) => {
        if (active) setProgress(value);
        onUpdate?.(value);
      },
    });

    return () => {
      active = false;
      controls.destroy();
    };
  }, [position, color, height, smoothing, easing, target, onUpdate]);

  return { ref, progress };
}

/**
 * Tracks scroll velocity, direction, position, and normalized progress for the
 * page or a referenced scroll container.
 */
export function useScrollVelocity<T extends HTMLElement = HTMLElement>(
  options: UseScrollVelocityOptions = {},
): UseScrollVelocityResult<T> {
  const ref = useRef<T | null>(null);
  const [data, setData] = useState(INITIAL_SCROLL_VELOCITY);
  const { smoothing, target, onUpdate } = options;

  useEffect(() => {
    setData(INITIAL_SCROLL_VELOCITY);
    let active = true;
    const controls = scrollVelocity({
      smoothing,
      target: target === "window" ? undefined : target ?? ref.current ?? undefined,
      onUpdate: (nextData) => {
        if (active) setData(nextData);
        onUpdate?.(nextData);
      },
    });

    return () => {
      active = false;
      controls.destroy();
    };
  }, [smoothing, target, onUpdate]);

  return { ref, data };
}

/**
 * Renders children in a visible div, then reveals it when it enters the viewport.
 * Without client-side JavaScript, the children remain normally visible.
 */
export function Reveal({
  children,
  direction = "up",
  duration = 600,
  delay,
  once = true,
  ...divProps
}: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const controls = reveal(element, {
      properties: REVEAL_PROPERTIES[direction],
      duration,
      delay,
      once,
    });
    return () => controls.destroy();
  }, [direction, duration, delay, once]);

  return createElement("div", { ...divProps, ref }, children);
}

/**
 * Renders accessible static text while applying the selected visual text effect
 * to a separate, aria-hidden copy.
 */
export function AnimatedText({ text, effect, effectOptions, ...spanProps }: AnimatedTextProps) {
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    switch (effect) {
      case "typewriter":
        return typewriter(element, {
          ...effectOptions,
          phrases: [text],
          loop: effectOptions?.loop ?? false,
          cursor: effectOptions?.cursor ?? "",
        }).destroy;
      case "scramble":
        return textScramble(element, effectOptions).destroy;
      case "gradient":
        return gradientText(element, effectOptions).destroy;
    }
  }, [text, effect, effectOptions]);

  return createElement(
    "span",
    { ...spanProps, "aria-label": text },
    createElement("span", { ref, "aria-hidden": true }, text),
  );
}
