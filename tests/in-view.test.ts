import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import { inView } from "../src/effects/in-view";
import type { InViewCallback, InViewControls, InViewOptions } from "../src/effects/in-view";

class FakeHTMLElement {}

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

let selectorResults: Record<string, unknown[]>;

function makeElement(): HTMLElement {
  return new FakeHTMLElement() as unknown as HTMLElement;
}

function observer(): FakeIntersectionObserver {
  return FakeIntersectionObserver.instances[0] as FakeIntersectionObserver;
}

beforeEach(() => {
  selectorResults = {};
  FakeIntersectionObserver.instances = [];
  vi.stubGlobal("HTMLElement", FakeHTMLElement);
  vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
  vi.stubGlobal("document", {
    querySelectorAll: (selector: string) => selectorResults[selector] ?? [],
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("inView()", () => {
  it("calls the callback with the entering element and entry", () => {
    const element = makeElement();
    const callback = vi.fn();
    inView(element, callback);

    observer().emit(element, true);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(
      element,
      expect.objectContaining({ isIntersecting: true }),
    );
  });

  it("runs the returned cleanup when the target leaves", () => {
    const element = makeElement();
    const cleanup = vi.fn();
    const callback = vi.fn(() => cleanup);
    inView(element, callback, { once: false });

    observer().emit(element, true);
    observer().emit(element, false);
    expect(cleanup).toHaveBeenCalledTimes(1);

    observer().emit(element, true);
    observer().emit(element, false);
    expect(callback).toHaveBeenCalledTimes(2);
    expect(cleanup).toHaveBeenCalledTimes(2);
  });

  it("supports one-time observation and cleans up after the first leave", () => {
    const element = makeElement();
    const cleanup = vi.fn();
    const callback = vi.fn(() => cleanup);
    inView(element, callback);

    observer().emit(element, true);
    observer().emit(element, false);
    observer().emit(element, true);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(observer().unobserve).toHaveBeenCalledWith(element);
  });

  it("observes each element matched by a selector independently", () => {
    const first = makeElement();
    const second = makeElement();
    selectorResults[".item"] = [first, second];
    const callback = vi.fn();
    inView(".item", callback, { rootMargin: "10px", threshold: 0.5 });

    expect([...observer().observed]).toEqual([first, second]);
    expect(observer().options).toEqual({ rootMargin: "10px", threshold: 0.5 });
    observer().emit(second, true);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(second, expect.anything());
  });

  it("runs visible-target cleanups on observer destruction and ignores late entries", () => {
    const first = makeElement();
    const second = makeElement();
    selectorResults[".item"] = [first, second];
    const firstCleanup = vi.fn();
    const secondCleanup = vi.fn();
    const callback = vi.fn((element: HTMLElement) => element === first ? firstCleanup : secondCleanup);
    const controls = inView(".item", callback);

    observer().emit(first, true);
    observer().emit(second, true);
    controls.destroy();
    controls.destroy();
    observer().emit(first, false);

    expect(observer().disconnect).toHaveBeenCalledTimes(1);
    expect(firstCleanup).toHaveBeenCalledTimes(1);
    expect(secondCleanup).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledTimes(2);
    expectTypeOf<InViewCallback>().toBeFunction();
    expectTypeOf<InViewControls["destroy"]>().toBeFunction();
    expectTypeOf<InViewOptions["once"]>().toEqualTypeOf<boolean | undefined>();
  });

  it("uses scrollTrigger's unsupported-environment behavior", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    expect(() => inView(makeElement(), vi.fn())).toThrow(/requires IntersectionObserver/);
  });
});
