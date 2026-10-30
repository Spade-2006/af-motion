import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import { scrollTrigger } from "../src/effects/scroll-trigger";
import type { ScrollTriggerControls, ScrollTriggerOptions } from "../src/effects/scroll-trigger";

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

  emit(target: Element, isIntersecting: boolean, intersectionRatio = Number(isIntersecting)): void {
    this.callback([{
      target,
      isIntersecting,
      intersectionRatio,
    } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
  }
}

let selectorResults: Record<string, unknown[]>;

function makeElement(): HTMLElement {
  return new FakeHTMLElement() as unknown as HTMLElement;
}

beforeEach(() => {
  selectorResults = {};
  FakeIntersectionObserver.instances = [];
  vi.stubGlobal("HTMLElement", FakeHTMLElement);
  vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
  vi.stubGlobal("document", {
    querySelectorAll: (selector: string) => {
      if (selector === "!!bad") throw new DOMException("bad selector", "SyntaxError");
      return selectorResults[selector] ?? [];
    },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function observer(): FakeIntersectionObserver {
  return FakeIntersectionObserver.instances[0] as FakeIntersectionObserver;
}

describe("scrollTrigger()", () => {
  it("calls enter and leave only when the observed intersection state changes", () => {
    const element = makeElement();
    const onEnter = vi.fn();
    const onLeave = vi.fn();
    scrollTrigger(element, { onEnter, onLeave, once: false });

    observer().emit(element, false);
    observer().emit(element, true, 0.25);
    observer().emit(element, true, 0.5);
    observer().emit(element, false);

    expect(onEnter).toHaveBeenCalledTimes(1);
    expect(onEnter).toHaveBeenCalledWith(element, expect.objectContaining({ intersectionRatio: 0.25 }));
    expect(onLeave).toHaveBeenCalledTimes(1);
    expect(onLeave).toHaveBeenCalledWith(element, expect.objectContaining({ isIntersecting: false }));
  });

  it("passes threshold and root margin to IntersectionObserver", () => {
    scrollTrigger(makeElement(), {
      onEnter: vi.fn(),
      threshold: [0.2, 0.75],
      rootMargin: "10px 0px",
    });

    expect(observer().options).toEqual({ threshold: [0.2, 0.75], rootMargin: "10px 0px" });
  });

  it("stops observing after one enter/leave cycle by default", () => {
    const element = makeElement();
    const onEnter = vi.fn();
    const onLeave = vi.fn();
    scrollTrigger(element, { onEnter, onLeave });

    observer().emit(element, true);
    observer().emit(element, false);
    observer().emit(element, true);

    expect(onEnter).toHaveBeenCalledTimes(1);
    expect(onLeave).toHaveBeenCalledTimes(1);
    expect(observer().unobserve).toHaveBeenCalledTimes(1);
  });

  it("supports an enter-only one-time trigger", () => {
    const element = makeElement();
    const onEnter = vi.fn();
    scrollTrigger(element, { onEnter });

    observer().emit(element, true);
    observer().emit(element, false);
    observer().emit(element, true);

    expect(onEnter).toHaveBeenCalledTimes(1);
    expect(observer().unobserve).toHaveBeenCalledWith(element);
  });

  it("stops one-time observation even when enter callbacks throw", () => {
    const element = makeElement();
    const error = new Error("enter failed");
    const controls = scrollTrigger(element, { onEnter: () => { throw error; } });

    expect(() => observer().emit(element, true)).toThrow(error);
    observer().emit(element, true);

    expect(observer().unobserve).toHaveBeenCalledExactlyOnceWith(element);
    expect(observer().observed.has(element)).toBe(false);
    controls.destroy();
  });

  it("stops one-time observation even when leave callbacks throw", () => {
    const element = makeElement();
    const error = new Error("leave failed");
    const onEnter = vi.fn();
    const controls = scrollTrigger(element, {
      onEnter,
      onLeave: () => { throw error; },
    });

    observer().emit(element, true);
    expect(() => observer().emit(element, false)).toThrow(error);
    observer().emit(element, true);

    expect(onEnter).toHaveBeenCalledOnce();
    expect(observer().unobserve).toHaveBeenCalledExactlyOnceWith(element);
    expect(observer().observed.has(element)).toBe(false);
    controls.destroy();
  });

  it("observes all selector matches independently", () => {
    const first = makeElement();
    const second = makeElement();
    selectorResults[".item"] = [first, second];
    const onEnter = vi.fn();
    scrollTrigger(".item", { onEnter });

    expect([...observer().observed]).toEqual([first, second]);
    observer().emit(second, true);
    expect(onEnter).toHaveBeenCalledTimes(1);
    expect(onEnter).toHaveBeenCalledWith(second, expect.anything());
  });

  it("returns inert controls for a selector with no matches", () => {
    const controls = scrollTrigger(".missing", { onEnter: vi.fn() });
    expect(FakeIntersectionObserver.instances).toHaveLength(0);
    expect(() => controls.destroy()).not.toThrow();
  });

  it("reports unsupported IntersectionObserver environments clearly", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    expect(() => scrollTrigger(makeElement(), { onEnter: vi.fn() })).toThrow(/requires IntersectionObserver/);
  });

  it("validates options before observing targets", () => {
    const element = makeElement();
    expect(() => scrollTrigger(element, {})).toThrow(/requires onEnter or onLeave/);
    expect(() => scrollTrigger(element, { onEnter: vi.fn(), threshold: 1.5 })).toThrow(RangeError);
    expect(() => scrollTrigger(element, { onEnter: vi.fn(), threshold: [] })).not.toThrow();
    expect(() => scrollTrigger(element, { onEnter: vi.fn(), rootMargin: "" })).toThrow(/rootMargin/);
    expect(() => scrollTrigger(element, { onEnter: vi.fn(), once: "yes" as unknown as boolean })).toThrow(/once/);
    expect(FakeIntersectionObserver.instances).toHaveLength(1);
  });

  it("disconnects once, ignores late observer callbacks, and exports its public types", () => {
    const element = makeElement();
    const onEnter = vi.fn();
    const controls = scrollTrigger(element, { onEnter });

    controls.destroy();
    controls.destroy();
    observer().emit(element, true);

    expect(observer().disconnect).toHaveBeenCalledTimes(1);
    expect(onEnter).not.toHaveBeenCalled();
    expectTypeOf<ScrollTriggerControls["destroy"]>().toBeFunction();
    expectTypeOf<ScrollTriggerOptions["onEnter"]>().toEqualTypeOf<
      ((element: HTMLElement, entry: IntersectionObserverEntry) => void) | undefined
    >();
  });
});
