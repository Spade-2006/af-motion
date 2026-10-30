import { animate } from "../core/animate.js";
import type { AnimateTarget } from "../core/animate.js";
import { animateProgress } from "../core/animation.js";
import type { AnimationControls, AnimationOptions } from "../core/animation.js";

export interface DrawSVGOptions extends AnimationOptions {
  /** Extra delay between paths, in milliseconds. Defaults to 0. */
  stagger?: number;
  /** Starts fully drawn and animates to the undrawn state. Defaults to false. */
  reverse?: boolean;
}

export interface DrawSVGControls extends AnimationControls {
  /** Cancels active path animations and restores original dash attributes and styles. */
  destroy(): void;
}

interface SVGPathLike extends SVGElement {
  getTotalLength(): number;
}

interface PathSnapshot {
  dasharray: string | null;
  dashoffset: string | null;
  styleDasharray: string;
  styleDashoffset: string;
}

const PATH_SELECTOR = "path";

function isPathElement(element: Element): element is SVGPathLike {
  return (
    (typeof SVGPathElement !== "undefined" && element instanceof SVGPathElement) ||
    element.tagName.toLowerCase() === "path"
  );
}

function pathElements(target: AnimateTarget): SVGPathLike[] {
  if (typeof target === "string") {
    if (typeof document === "undefined") {
      throw new Error(`Cannot resolve selector "${target}": document is not available`);
    }
    let matches: NodeListOf<Element>;
    try {
      matches = document.querySelectorAll(target);
    } catch (error) {
      throw new SyntaxError(`Invalid CSS selector "${target}"`, { cause: error });
    }
    return Array.from(matches).flatMap((element) =>
      isPathElement(element)
        ? [element]
        : Array.from(element.querySelectorAll(PATH_SELECTOR)).filter(isPathElement),
    );
  }

  if (typeof SVGElement !== "undefined" && !(target instanceof SVGElement)) {
    throw new TypeError("drawSVG() target must be an SVGElement or a CSS selector string");
  }
  if (!isPathElement(target)) {
    return Array.from(target.querySelectorAll(PATH_SELECTOR)).filter(isPathElement);
  }
  return [target];
}

function assertFiniteNonNegative(name: string, value: number): void {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be a finite number >= 0, received ${String(value)}`);
  }
}

function readStyleValue(path: SVGPathLike, name: string): string {
  return typeof path.style?.getPropertyValue === "function"
    ? path.style.getPropertyValue(name)
    : "";
}

function restoreStyleValue(path: SVGPathLike, name: string, value: string): void {
  if (value === "") path.style.removeProperty(name);
  else path.style.setProperty(name, value);
}

function restoreAttribute(path: SVGPathLike, name: string, value: string | null): void {
  if (value === null) path.removeAttribute(name);
  else path.setAttribute(name, value);
}

/**
 * Draws SVG paths by animating their stroke dash offset through the shared animation engine.
 *
 * A path or SVG container target is accepted; a selector may match paths or containers.
 * `destroy()` is idempotent and restores each path's original dash attributes and inline styles.
 */
export function drawSVG(
  target: AnimateTarget,
  options: DrawSVGOptions = {},
): DrawSVGControls {
  const {
    duration = 1000,
    delay = 0,
    stagger = 0,
    easing,
    reverse = false,
    playbackRate,
    respectReducedMotion,
    onStart,
    onUpdate,
    onComplete,
    onCancel,
  } = options;

  assertFiniteNonNegative("duration", duration);
  assertFiniteNonNegative("delay", delay);
  assertFiniteNonNegative("stagger", stagger);
  if (typeof reverse !== "boolean") {
    throw new TypeError(`reverse must be a boolean, received ${String(reverse)}`);
  }

  const paths = pathElements(target);
  const snapshots = new Map<SVGPathLike, PathSnapshot>();
  const controls: AnimationControls[] = [];
  let destroyed = false;
  let cancelled = false;
  let started = false;
  let completed = 0;

  for (const path of paths) {
    const length = path.getTotalLength();
    if (!Number.isFinite(length) || length < 0) {
      throw new RangeError(`SVG path length must be a finite number >= 0, received ${String(length)}`);
    }
    snapshots.set(path, {
      dasharray: path.getAttribute("stroke-dasharray"),
      dashoffset: path.getAttribute("stroke-dashoffset"),
      styleDasharray: readStyleValue(path, "stroke-dasharray"),
      styleDashoffset: readStyleValue(path, "stroke-dashoffset"),
    });

    const start = reverse ? 0 : length;
    path.setAttribute("stroke-dasharray", String(length));
    path.setAttribute("stroke-dashoffset", String(start));
  }

  const restore = (): void => {
    for (const [path, snapshot] of snapshots) {
      restoreAttribute(path, "stroke-dasharray", snapshot.dasharray);
      restoreAttribute(path, "stroke-dashoffset", snapshot.dashoffset);
      restoreStyleValue(path, "stroke-dasharray", snapshot.styleDasharray);
      restoreStyleValue(path, "stroke-dashoffset", snapshot.styleDashoffset);
    }
  };

  const destroy = (): void => {
    if (destroyed) return;
    destroyed = true;
    cancelled = true;
    for (const control of controls) control.cancel();
    restore();
  };

  if (paths.length === 0) {
    const validation = animateProgress({
      duration,
      delay,
      easing,
      playbackRate,
      respectReducedMotion,
    });
    validation.cancel();
    return {
      seek: () => undefined,
      pause: () => undefined,
      resume: () => undefined,
      reverse: () => undefined,
      setPlaybackRate: () => undefined,
      getPlaybackRate: () => playbackRate ?? 1,
      cancel: () => undefined,
      destroy: () => undefined,
    };
  }

  paths.forEach((path, index) => {
    const pathDelay = delay + index * stagger;
    if (!Number.isFinite(pathDelay)) throw new RangeError("delay plus stagger offsets must be finite");
    controls.push(
      animate(path, {
        "stroke-dashoffset": [reverse ? 0 : path.getTotalLength(), reverse ? path.getTotalLength() : 0],
      }, {
        duration,
        delay: pathDelay,
        ...(easing === undefined ? {} : { easing }),
        ...(playbackRate === undefined ? {} : { playbackRate }),
        ...(respectReducedMotion === undefined ? {} : { respectReducedMotion }),
        onStart: () => {
          if (started) return;
          started = true;
          onStart?.();
        },
        onUpdate,
        onComplete: () => {
          completed += 1;
          if (completed === paths.length && !cancelled && !destroyed) onComplete?.();
        },
      }),
    );
  });

  return {
    seek: (progress) => {
      for (const control of controls) control.seek(progress);
    },
    pause: () => {
      for (const control of controls) control.pause();
    },
    resume: () => {
      for (const control of controls) control.resume();
    },
    reverse: () => {
      for (const control of controls) control.reverse();
    },
    setPlaybackRate: (rate) => {
      for (const control of controls) control.setPlaybackRate(rate);
    },
    getPlaybackRate: () => controls[0]?.getPlaybackRate() ?? playbackRate ?? 1,
    cancel: () => {
      if (cancelled || destroyed) return;
      cancelled = true;
      for (const control of controls) control.cancel();
      onCancel?.();
    },
    destroy,
  };
}
