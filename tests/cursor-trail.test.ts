import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import { cursorTrail } from "../src/effects/cursor-trail";
import type { CursorTrailControls, CursorTrailOptions } from "../src/effects/cursor-trail";

class FakeStyle {
  values = new Map<string, string>();
  setProperty(name: string, value: string): void {
    this.values.set(name, value);
  }
  getPropertyValue(name: string): string {
    return this.values.get(name) ?? "";
  }
}

class FakeAnimation {
  cancel = vi.fn();
  onfinish: (() => void) | null = null;
  finish(): void {
    this.onfinish?.();
  }
}

class FakeElement {
  parentElement: FakeElement | null = null;
  childNodes: FakeElement[] = [];
  style = new FakeStyle();
  attributes = new Map<string, string>();
  listeners = new Map<string, Set<(event: PointerEvent) => void>>();
  animations: Array<{ keyframes: Keyframe[] | PropertyIndexedKeyframes | null; options?: number | KeyframeAnimationOptions }> = [];
  animationInstances: FakeAnimation[] = [];
  rect = { left: 10, top: 20, right: 110, bottom: 80, width: 100, height: 60 };
  animate = vi.fn((keyframes: Keyframe[] | PropertyIndexedKeyframes | null, options?: number | KeyframeAnimationOptions) => {
    this.animations.push({ keyframes, options });
    const animation = new FakeAnimation();
    this.animationInstances.push(animation);
    return animation as unknown as Animation;
  });
  get firstChild(): FakeElement | null {
    return this.childNodes[0] ?? null;
  }
  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }
  appendChild<T extends FakeElement>(node: T): T {
    return this.insertBefore(node, null);
  }
  insertBefore<T extends FakeElement>(node: T, before: FakeElement | null): T {
    if (node.parentElement) node.parentElement.removeChild(node);
    const index = before === null ? -1 : this.childNodes.indexOf(before);
    if (index < 0) this.childNodes.push(node);
    else this.childNodes.splice(index, 0, node);
    node.parentElement = this;
    return node;
  }
  removeChild<T extends FakeElement>(node: T): T {
    this.childNodes.splice(this.childNodes.indexOf(node), 1);
    node.parentElement = null;
    return node;
  }
  addEventListener(type: string, listener: (event: PointerEvent) => void): void {
    const listeners = this.listeners.get(type) ?? new Set<(event: PointerEvent) => void>();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }
  removeEventListener(type: string, listener: (event: PointerEvent) => void): void {
    this.listeners.get(type)?.delete(listener);
  }
  getBoundingClientRect(): DOMRect {
    return this.rect as DOMRect;
  }
  emit(type: string, clientX: number, clientY: number, pointerType = "mouse"): void {
    const event = { clientX, clientY, pointerType, currentTarget: this } as unknown as PointerEvent;
    for (const listener of this.listeners.get(type) ?? []) listener(event);
  }
}

let selectorResults: Record<string, unknown[]>;
let reducedMotion: boolean;
let preferenceListeners: Set<(event: { matches: boolean }) => void>;
let body: FakeElement;
let documentElement: FakeElement;
let fakeDocument: FakeElement & {
  body: FakeElement;
  documentElement: FakeElement;
  querySelectorAll: (selector: string) => unknown[];
};

function asTarget(element: FakeElement): HTMLElement {
  return element as unknown as HTMLElement;
}

function overlayFrom(target: FakeElement): FakeElement {
  return body.firstChild!;
}

function particlesIn(overlay: FakeElement): FakeElement[] {
  return overlay.childNodes;
}

beforeEach(() => {
  selectorResults = {};
  reducedMotion = false;
  preferenceListeners = new Set();
  body = new FakeElement();
  documentElement = new FakeElement();
  fakeDocument = Object.assign(new FakeElement(), {
    body,
    documentElement,
      createElement: () => new FakeElement(),
      querySelectorAll: (selector: string) => {
      if (selector === "!!bad") throw new DOMException("bad selector", "SyntaxError");
      return selectorResults[selector] ?? [];
    },
  });
  vi.stubGlobal("HTMLElement", FakeElement);
  vi.stubGlobal("matchMedia", () => ({
    matches: reducedMotion,
    addEventListener: (_type: string, listener: (event: { matches: boolean }) => void) => {
      preferenceListeners.add(listener);
    },
    removeEventListener: (_type: string, listener: (event: { matches: boolean }) => void) => {
      preferenceListeners.delete(listener);
    },
  }));
  vi.stubGlobal("document", fakeDocument);
});

afterEach(() => vi.unstubAllGlobals());

describe("cursorTrail()", () => {
  it("creates configured fading particles at pointer coordinates and caps the active count", () => {
    const controls = cursorTrail({
      target: fakeDocument as unknown as Document,
      color: "#8b5cf6",
      particleCount: 2,
      size: 8,
      duration: 700,
    });
    fakeDocument.emit("pointermove", 45, 90);
    const overlay = overlayFrom(body);
    const first = overlay.firstChild!;
    expect(overlay.attributes.get("aria-hidden")).toBe("true");
    expect(overlay.style.getPropertyValue("position")).toBe("fixed");
    expect(overlay.style.getPropertyValue("pointer-events")).toBe("none");
    expect(overlay.style.getPropertyValue("z-index")).toBe("2147483647");
    expect(first.style.getPropertyValue("left")).toBe("45px");
    expect(first.style.getPropertyValue("top")).toBe("90px");
    expect(first.style.getPropertyValue("width")).toBe("8px");
    expect(first.style.getPropertyValue("background-color")).toBe("#8b5cf6");
    expect(first.animations[0]?.options).toMatchObject({ duration: 700, easing: "ease-out", fill: "forwards" });

    fakeDocument.emit("pointermove", 46, 92);
    fakeDocument.emit("pointermove", 47, 93);
    expect(particlesIn(overlay)).toHaveLength(2);
    expect(first.animationInstances[0]?.cancel).toHaveBeenCalledTimes(1);
    controls.destroy();
  });

  it("tracks only movement within element targets and multiple matching targets", () => {
    const firstTarget = new FakeElement();
    const secondTarget = new FakeElement();
    selectorResults[".hero"] = [firstTarget, {}, secondTarget];
    const controls = cursorTrail({ target: ".hero", particleCount: 4 });

    firstTarget.emit("pointermove", 50, 50);
    const overlay = overlayFrom(body);
    expect(particlesIn(overlay)).toHaveLength(1);
    firstTarget.emit("pointermove", 150, 50);
    expect(particlesIn(overlay)).toHaveLength(1);
    secondTarget.emit("pointermove", 70, 45);
    expect(particlesIn(overlay)).toHaveLength(2);
    secondTarget.emit("pointermove", 40, 60, "touch");
    expect(particlesIn(overlay)).toHaveLength(2);
    controls.destroy();
    expect(body.childNodes).toHaveLength(0);
    expect(firstTarget.listeners.get("pointermove")?.size ?? 0).toBe(0);
    expect(secondTarget.listeners.get("pointermove")?.size ?? 0).toBe(0);
  });

  it("creates no overlay or particles and suppresses events for reduced motion", () => {
    reducedMotion = true;
    const target = new FakeElement();
    const controls = cursorTrail({ target: asTarget(target) });
    target.emit("pointermove", 20, 25);
    expect(body.childNodes).toHaveLength(0);
    expect(target.listeners.get("pointermove")?.size).toBe(1);

    reducedMotion = false;
    for (const listener of preferenceListeners) listener({ matches: false });
    target.emit("pointermove", 20, 25);
    expect(body.childNodes).toHaveLength(1);
    const overlay = overlayFrom(target);

    reducedMotion = true;
    for (const listener of preferenceListeners) listener({ matches: true });
    expect(body.childNodes).toHaveLength(0);
    expect(overlay.childNodes).toHaveLength(0);
    target.emit("pointermove", 25, 30);
    expect(body.childNodes).toHaveLength(0);
    controls.destroy();
  });

  it("destroys idempotently, removing listeners, particles, animations, and overlay", () => {
    const controls = cursorTrail();
    fakeDocument.emit("pointermove", 12, 34);
    const overlay = overlayFrom(body);
    const particle = overlay.firstChild!;
    controls.destroy();
    controls.destroy();
    expect(fakeDocument.listeners.get("pointermove")?.size ?? 0).toBe(0);
    expect(body.childNodes).toHaveLength(0);
    expect(particle.animationInstances[0]?.cancel).toHaveBeenCalledTimes(1);
    fakeDocument.emit("pointermove", 40, 50);
    expect(body.childNodes).toHaveLength(0);
  });

  it("validates options and selector before registering listeners or creating DOM", () => {
    expect(() => cursorTrail({ particleCount: 0 })).toThrow(RangeError);
    expect(() => cursorTrail({ particleCount: 1.5 })).toThrow(RangeError);
    expect(() => cursorTrail({ size: 0 })).toThrow(RangeError);
    expect(() => cursorTrail({ duration: Number.POSITIVE_INFINITY })).toThrow(RangeError);
    expect(() => cursorTrail({ color: "" })).toThrow(TypeError);
    expect(() => cursorTrail({ target: "!!bad" })).toThrow(SyntaxError);
    expect(body.childNodes).toHaveLength(0);
    expect(fakeDocument.listeners.get("pointermove")?.size ?? 0).toBe(0);
    expectTypeOf<CursorTrailOptions["target"]>().toEqualTypeOf<HTMLElement | string | Document | undefined>();
    expectTypeOf<CursorTrailControls["destroy"]>().toBeFunction();
  });
});
