// @vitest-environment jsdom

import { StrictMode, act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useInView } from "../src/react";
import type { InViewOptions } from "../src/effects/in-view";

class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];
  observed = new Set<Element>();
  observe = vi.fn((element: Element) => this.observed.add(element));
  unobserve = vi.fn((element: Element) => this.observed.delete(element));
  disconnect = vi.fn(() => this.observed.clear());

  constructor(
    readonly callback: IntersectionObserverCallback,
    readonly options?: IntersectionObserverInit,
  ) {
    FakeIntersectionObserver.instances.push(this);
  }

  emit(target: Element, isIntersecting: boolean): void {
    this.callback([{
      target,
      isIntersecting,
      intersectionRatio: Number(isIntersecting),
    } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
  }
}

let host: HTMLDivElement;
let root: Root;
let mounted: boolean;
let currentOptions: InViewOptions;

function Example() {
  const { ref, isInView } = useInView<HTMLDivElement>(currentOptions);
  return createElement("div", { ref, "data-in-view": String(isInView) });
}

function render(options: InViewOptions = {}): void {
  currentOptions = options;
  act(() => root.render(createElement(Example)));
  mounted = true;
}

function observer(index = 0): FakeIntersectionObserver {
  return FakeIntersectionObserver.instances[index] as FakeIntersectionObserver;
}

function isInView(): string | null {
  return host.firstElementChild?.getAttribute("data-in-view") ?? null;
}

beforeEach(() => {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  mounted = false;
  currentOptions = {};
  FakeIntersectionObserver.instances = [];
  vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
});

afterEach(() => {
  if (mounted) act(() => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
});

describe("useInView", () => {
  it("updates state when the element enters and leaves view", () => {
    render({ once: false });
    const element = host.firstElementChild as HTMLElement;

    expect(isInView()).toBe("false");
    act(() => observer().emit(element, true));
    expect(isInView()).toBe("true");
    act(() => observer().emit(element, false));
    expect(isInView()).toBe("false");
  });

  it("stops observing after its first visible cycle by default", () => {
    render();
    const element = host.firstElementChild as HTMLElement;
    const currentObserver = observer();

    act(() => currentObserver.emit(element, true));
    expect(isInView()).toBe("true");
    act(() => currentObserver.emit(element, false));
    expect(isInView()).toBe("false");
    act(() => currentObserver.emit(element, true));
    expect(isInView()).toBe("false");
    expect(currentObserver.observed.has(element)).toBe(false);
    expect(currentObserver.unobserve).toHaveBeenCalledWith(element);
  });

  it("disconnects the observer on unmount", () => {
    render();
    const element = host.firstElementChild as HTMLElement;
    const currentObserver = observer();

    act(() => root.unmount());
    mounted = false;

    expect(currentObserver.disconnect).toHaveBeenCalledTimes(1);
    expect(currentObserver.observed.size).toBe(0);
    act(() => currentObserver.emit(element, true));
    expect(host.firstElementChild).toBeNull();
  });

  it("recreates the observer with updated options and disconnects the previous one", () => {
    render({ rootMargin: "0px", threshold: 0.25, once: false });
    const firstObserver = observer();
    const element = host.firstElementChild as HTMLElement;

    render({ rootMargin: "10px", threshold: 0.75, once: true });

    expect(firstObserver.disconnect).toHaveBeenCalledTimes(1);
    expect(observer(1).options).toEqual({ rootMargin: "10px", threshold: 0.75 });
    expect(observer(1).observed.has(element)).toBe(true);
  });

  it("remains safe when Strict Mode replays effects", () => {
    function Example() {
      const { ref, isInView: visible } = useInView<HTMLDivElement>();
      return createElement("div", { ref, "data-in-view": String(visible) });
    }

    act(() => root.render(createElement(StrictMode, null, createElement(Example))));
    mounted = true;
    expect(FakeIntersectionObserver.instances).toHaveLength(2);
    expect(observer(0).disconnect).toHaveBeenCalledTimes(1);
    expect(observer(1).observed.size).toBe(1);
  });

  it("does not recreate the observer when array threshold values remain equal", () => {
    render({ threshold: [0, 0.5] });
    const firstObserver = observer();
    expect(FakeIntersectionObserver.instances).toHaveLength(1);

    render({ threshold: [0, 0.5] });
    expect(FakeIntersectionObserver.instances).toHaveLength(1);
    expect(firstObserver.disconnect).not.toHaveBeenCalled();

    render({ threshold: [0, 0.75] });
    expect(FakeIntersectionObserver.instances).toHaveLength(2);
    expect(firstObserver.disconnect).toHaveBeenCalledTimes(1);
  });

  it("calls onEnter, onLeave, and onChange callbacks with optional cleanup", () => {
    const cleanup = vi.fn();
    const onEnter = vi.fn(() => cleanup);
    const onLeave = vi.fn();
    const onChange = vi.fn();

    render({ once: false, onEnter, onLeave, onChange });
    const element = host.firstElementChild as HTMLElement;

    expect(isInView()).toBe("false");
    act(() => observer().emit(element, true));

    expect(isInView()).toBe("true");
    expect(onEnter).toHaveBeenCalledWith(element, expect.any(Object));
    expect(onChange).toHaveBeenCalledWith(true, element, expect.any(Object));

    act(() => observer().emit(element, false));
    expect(isInView()).toBe("false");
    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(onLeave).toHaveBeenCalledWith(element, expect.any(Object));
    expect(onChange).toHaveBeenCalledWith(false, element, expect.any(Object));
  });

  it("supports reactive: false for zero-render in-view tracking and external RefObject targets", () => {
    const onEnter = vi.fn();
    const externalElement = document.createElement("section");
    const externalRef = { current: externalElement };

    render({ target: externalRef, reactive: false, onEnter });

    expect(isInView()).toBe("false");
    expect(observer().observed.has(externalElement)).toBe(true);

    act(() => observer().emit(externalElement, true));
    expect(isInView()).toBe("false");
    expect(onEnter).toHaveBeenCalledTimes(1);
  });
});
