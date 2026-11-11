import { onReducedMotionChange, prefersReducedMotion } from "../../core/motion.js";
import { getActivePalette, getPalette, subscribeToPaletteChanges } from "../../core/palettes.js";

interface InlineStyleValue {
  readonly value: string;
  readonly priority: string;
}

interface TargetRecord {
  count: number;
  position: InlineStyleValue;
  isolation: InlineStyleValue;
  restorePosition: boolean;
  restoreIsolation: boolean;
  backgroundElements: (HTMLElement | SVGElement)[];
}

export interface CanvasBackgroundState {
  readonly element: HTMLElement;
  readonly canvas: HTMLCanvasElement;
  readonly context: CanvasRenderingContext2D;
  width: number;
  height: number;
}

export interface MotionFrameSchedulerOptions<T> {
  readonly speed: number;
  readonly animated: boolean;
  readonly errorName: string;
  readonly update: (state: T, elapsedSeconds: number, time: number) => void;
  readonly renderStatic: () => void;
}

export interface MotionFrameScheduler<T> {
  readonly isReducedMotion: boolean;
  setVisible(state: T, visible: boolean): void;
  destroy(): void;
}

const targetRecords = new WeakMap<HTMLElement, TargetRecord>();

export function resolveBackgroundColors(
  name: string | undefined,
  fallback: readonly string[],
): readonly string[] {
  if (name === undefined) return fallback;
  const palette = name === "active" ? getActivePalette() : getPalette(name);
  if (!palette && name !== "active") throw new TypeError(`Unknown palette "${name}"`);
  return palette
    ? [palette.tokens.primary, palette.tokens.secondary, palette.tokens.accent]
    : fallback;
}

export function subscribeToActiveBackgroundPalette(
  name: string | undefined,
  fallback: readonly string[],
  onColors: (colors: readonly string[]) => void,
): () => void {
  if (name !== "active") return () => undefined;
  let lastColors = resolveBackgroundColors(name, fallback);
  return subscribeToPaletteChanges((palette) => {
    const nextColors = palette
      ? [palette.tokens.primary, palette.tokens.secondary, palette.tokens.accent]
      : fallback;
    if (
      nextColors.length === lastColors.length &&
      nextColors.every((color, index) => color === lastColors[index])
    ) {
      return;
    }
    lastColors = nextColors;
    onColors(nextColors);
  });
}

export function validateBackgroundColors(colors: readonly string[]): void {
  if (!Array.isArray(colors) || colors.length === 0) {
    throw new TypeError("colors must be an array containing at least one CSS color");
  }
  for (const color of colors) {
    if (typeof color !== "string" || color.trim() === "") {
      throw new TypeError("each color must be a non-empty CSS color string");
    }
    if (typeof CSS !== "undefined" && typeof CSS.supports === "function" && !CSS.supports("color", color)) {
      throw new TypeError(`Invalid CSS color "${color}"`);
    }
  }
}

export function resizeCanvasToElement(
  state: CanvasBackgroundState,
  width: number,
  height: number,
): void {
  const nextWidth = Math.max(0, width);
  const nextHeight = Math.max(0, height);
  const dpr = typeof devicePixelRatio === "number" ? Math.max(1, Math.min(devicePixelRatio, 2)) : 1;
  const pixelWidth = Math.round(nextWidth * dpr);
  const pixelHeight = Math.round(nextHeight * dpr);

  if (
    state.width === nextWidth &&
    state.height === nextHeight &&
    state.canvas.width === pixelWidth &&
    state.canvas.height === pixelHeight
  ) {
    return;
  }

  state.width = nextWidth;
  state.height = nextHeight;
  state.canvas.width = pixelWidth;
  state.canvas.height = pixelHeight;
  state.context.setTransform(dpr, 0, 0, dpr, 0, 0);
}

export function releaseBackgroundCanvas(canvas: HTMLCanvasElement): void {
  canvas.width = 0;
  canvas.height = 0;
}

function readInlineStyle(element: HTMLElement, property: string): InlineStyleValue {
  return {
    value: element.style.getPropertyValue(property),
    priority: element.style.getPropertyPriority(property),
  };
}

function restoreInlineStyle(element: HTMLElement, property: string, value: InlineStyleValue): void {
  if (value.value === "") element.style.removeProperty(property);
  else element.style.setProperty(property, value.value, value.priority);
}

function getNextSibling(container: HTMLElement, node: HTMLElement | SVGElement): Node | null {
  if ("nextSibling" in node && (node as unknown as { nextSibling?: Node | null }).nextSibling !== undefined) {
    return (node as unknown as { nextSibling: Node | null }).nextSibling;
  }
  const children = (container as unknown as { children?: (HTMLElement | SVGElement)[] }).children;
  if (Array.isArray(children)) {
    const index = children.indexOf(node);
    if (index >= 0 && index + 1 < children.length) {
      return children[index + 1] as unknown as Node;
    }
  }
  return null;
}

export function insertBackgroundElement(
  container: HTMLElement,
  child: HTMLElement | SVGElement,
): void {
  let record = targetRecords.get(container);
  if (!record) {
    acquireBackgroundTarget(container);
    record = targetRecords.get(container);
  }

  const elements = record?.backgroundElements;
  if (child.parentElement === container) {
    if (elements && !elements.includes(child)) {
      elements.push(child);
    }
    return;
  }

  let lastBackground: HTMLElement | SVGElement | null = null;
  if (elements && elements.length > 0) {
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      if (el && el.parentElement === container) {
        lastBackground = el;
        break;
      }
    }
  }

  if (lastBackground) {
    const next = getNextSibling(container, lastBackground);
    container.insertBefore(child, next);
  } else {
    container.insertBefore(child, container.firstChild);
  }

  if (elements && !elements.includes(child)) {
    elements.push(child);
  }
}

export function removeBackgroundElement(
  container: HTMLElement,
  child: HTMLElement | SVGElement,
): void {
  const record = targetRecords.get(container);
  if (record) {
    const idx = record.backgroundElements.indexOf(child);
    if (idx >= 0) {
      record.backgroundElements.splice(idx, 1);
    }
  }
  if (child.parentElement === container) {
    container.removeChild(child);
  }
}

export function acquireBackgroundTarget(
  element: HTMLElement,
  backgroundElement?: HTMLElement | SVGElement,
): void {
  let record = targetRecords.get(element);
  if (record) {
    record.count++;
  } else {
    const position = readInlineStyle(element, "position");
    const isolation = readInlineStyle(element, "isolation");
    const computed = typeof getComputedStyle === "function" ? getComputedStyle(element) : undefined;
    const restorePosition = (computed?.position ?? (position.value || "static")) === "static";
    const restoreIsolation = (computed?.isolation ?? isolation.value) !== "isolate";
    if (restorePosition) element.style.setProperty("position", "relative");
    if (restoreIsolation) element.style.setProperty("isolation", "isolate");
    record = {
      count: 1,
      position,
      isolation,
      restorePosition,
      restoreIsolation,
      backgroundElements: [],
    };
    targetRecords.set(element, record);
  }

  if (backgroundElement) {
    try {
      insertBackgroundElement(element, backgroundElement);
    } catch (error) {
      releaseBackgroundTarget(element);
      throw error;
    }
  }
}

export function releaseBackgroundTarget(
  element: HTMLElement,
  backgroundElement?: HTMLElement | SVGElement,
): void {
  if (backgroundElement) {
    removeBackgroundElement(element, backgroundElement);
  }

  const record = targetRecords.get(element);
  if (!record) return;
  record.count--;
  if (record.count > 0) return;
  targetRecords.delete(element);
  if (record.restorePosition) restoreInlineStyle(element, "position", record.position);
  if (record.restoreIsolation) restoreInlineStyle(element, "isolation", record.isolation);
}

export function createMotionFrameScheduler<T>(
  options: MotionFrameSchedulerOptions<T>,
): MotionFrameScheduler<T> {
  const reducedMotionInitial = prefersReducedMotion();
  if (
    options.animated &&
    options.speed > 0 &&
    !reducedMotionInitial &&
    (typeof requestAnimationFrame !== "function" || typeof cancelAnimationFrame !== "function")
  ) {
    throw new Error(`${options.errorName} requires requestAnimationFrame and cancelAnimationFrame when motion is enabled`);
  }

  const visible = new Set<T>();
  let destroyed = false;
  let reducedMotion = reducedMotionInitial;
  let documentVisible = typeof document === "undefined" || !document.hidden;
  let frameId: number | null = null;
  let previousTime: number | null = null;

  const stopFrame = (): void => {
    if (frameId === null) return;
    if (typeof cancelAnimationFrame === "function") cancelAnimationFrame(frameId);
    frameId = null;
    previousTime = null;
  };
  const tick = (time: number): void => {
    frameId = null;
    if (destroyed || reducedMotion || !documentVisible || visible.size === 0) return;
    const elapsed = Math.min(Math.max(0, (time - (previousTime ?? time)) / 1000), 0.05) * options.speed;
    previousTime = time;
    for (const state of visible) options.update(state, elapsed, time);
    schedule();
  };
  const schedule = (): void => {
    if (
      destroyed ||
      reducedMotion ||
      !options.animated ||
      options.speed === 0 ||
      !documentVisible ||
      visible.size === 0 ||
      frameId !== null
    ) return;
    frameId = requestAnimationFrame(tick);
  };
  const onVisibilityChange = (): void => {
    if (destroyed) return;
    documentVisible = !document.hidden;
    if (!documentVisible) stopFrame();
    else {
      previousTime = null;
      schedule();
    }
  };
  const onMotionChange = (preference: boolean): void => {
    if (destroyed) return;
    reducedMotion = preference;
    if (preference) {
      stopFrame();
      options.renderStatic();
    } else {
      previousTime = null;
      schedule();
    }
  };
  const hasVisibilityListener =
    typeof document !== "undefined" &&
    typeof document.addEventListener === "function" &&
    typeof document.removeEventListener === "function";
  if (hasVisibilityListener) document.addEventListener("visibilitychange", onVisibilityChange);
  const stopMotionListener = onReducedMotionChange(onMotionChange);

  return {
    get isReducedMotion() {
      return reducedMotion;
    },
    setVisible: (state, isVisible) => {
      if (destroyed) return;
      if (isVisible) visible.add(state);
      else visible.delete(state);
      if (visible.size === 0) stopFrame();
      else schedule();
    },
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      stopFrame();
      stopMotionListener();
      if (hasVisibilityListener) document.removeEventListener("visibilitychange", onVisibilityChange);
      visible.clear();
    },
  };
}
