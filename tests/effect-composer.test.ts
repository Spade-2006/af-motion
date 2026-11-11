import { afterEach, describe, expect, it, vi } from "vitest";
import {
  composeEffects,
  registerMotionDNA,
  removeMotionDNA,
} from "../src/index";

afterEach(() => {
  removeMotionDNA("composerMotion");
});

describe("composeEffects()", () => {
  it("starts effects in order and destroys them in reverse order once", () => {
    const calls: string[] = [];
    const composition = composeEffects([
      { start: () => { calls.push("start first"); return { destroy: () => calls.push("stop first") }; } },
      { start: () => { calls.push("start second"); return { cancel: () => calls.push("stop second") }; } },
    ]);

    expect(calls).toEqual(["start first", "start second"]);
    composition.destroy();
    composition.cancel();

    expect(calls).toEqual(["start first", "start second", "stop second", "stop first"]);
  });

  it("cleans up already-started effects when a later effect fails", () => {
    const cleanup = vi.fn();
    expect(() => composeEffects([
      { start: () => ({ destroy: cleanup }) },
      { start: () => { throw new Error("failed start"); } },
    ])).toThrow("failed start");
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it("does not destroy caller-owned pre-instantiated controls when a subsequent effect fails during initialization, while cleaning up factory-created effects", () => {
    const callerOwnedCleanup = vi.fn();
    const callerOwnedInstance = { destroy: callerOwnedCleanup, pause: vi.fn(), resume: vi.fn() };
    const factoryCleanup = vi.fn();

    expect(() => composeEffects([
      callerOwnedInstance,
      { start: () => ({ destroy: factoryCleanup }) },
      { start: () => { throw new Error("third effect failed"); } },
    ])).toThrow("third effect failed");

    // Factory effect must be cleaned up because composer started it
    expect(factoryCleanup).toHaveBeenCalledTimes(1);
    // Caller-owned effect must NOT be destroyed by composer's initialization failure
    expect(callerOwnedCleanup).not.toHaveBeenCalled();
  });

  it("passes resolved Motion DNA only to entries that request it", () => {
    registerMotionDNA("composerMotion", { duration: 300, easing: "linear" });
    const optionsSeen: unknown[] = [];
    const unrelatedOptionsSeen: unknown[] = [];
    const composition = composeEffects([
      {
        motionDNA: { name: "composerMotion", overrides: { duration: 120 } },
        start: (options) => {
          optionsSeen.push(options);
          return { destroy: () => undefined };
        },
      },
      {
        start: (options) => {
          unrelatedOptionsSeen.push(options);
          return { destroy: () => undefined };
        },
      },
    ]);

    expect(optionsSeen).toEqual([{ duration: 120, easing: "linear" }]);
    expect(unrelatedOptionsSeen).toEqual([undefined]);
    composition.destroy();
  });

  it("continues cleanup after an individual effect throws", () => {
    const laterCleanup = vi.fn();
    const composition = composeEffects([
      { start: () => ({ destroy: laterCleanup }) },
      { start: () => ({ destroy: () => { throw new Error("cleanup failed"); } }) },
    ]);

    expect(() => composition.destroy()).toThrow(/failed to clean up/);
    expect(laterCleanup).toHaveBeenCalledTimes(1);
  });

  it("pauses and resumes only effects that expose compatible controls", () => {
    const pause = vi.fn();
    const resume = vi.fn();
    const composition = composeEffects([
      { start: () => ({ destroy: () => undefined, pause, resume }) },
      { start: () => ({ destroy: () => undefined }) },
    ]);

    composition.pause();
    composition.pause();
    composition.resume();
    composition.resume();

    expect(pause).toHaveBeenCalledTimes(1);
    expect(resume).toHaveBeenCalledTimes(1);
    composition.destroy();
    composition.pause();
    expect(pause).toHaveBeenCalledTimes(1);
  });

  it("supports factory functions and pre-instantiated controls in the same composition", () => {
    const calls: string[] = [];
    const directInstance = {
      destroy: () => calls.push("stop direct"),
      pause: vi.fn(),
      resume: vi.fn(),
    };

    const composition = composeEffects([
      () => {
        calls.push("start factory");
        return { destroy: () => calls.push("stop factory") };
      },
      directInstance,
      {
        start: () => {
          calls.push("start entry");
          return { destroy: () => calls.push("stop entry") };
        },
      },
    ]);

    expect(calls).toEqual(["start factory", "start entry"]);
    expect(composition.effects).toHaveLength(3);

    composition.pause();
    expect(directInstance.pause).toHaveBeenCalledTimes(1);

    composition.destroy();
    expect(calls).toEqual([
      "start factory",
      "start entry",
      "stop entry",
      "stop direct",
      "stop factory",
    ]);
  });

  describe("real visual effect composition on shared target", () => {
    it("composes multiple overlay effects on one element without clobbering container styles", async () => {
      const { borderBeam } = await import("../src/effects/border-beam");
      const { shine } = await import("../src/effects/shine");

      class FakeStyle {
        values = new Map<string, string>();
        priorities = new Map<string, string>();
        getPropertyValue(name: string): string {
          return this.values.get(name) ?? "";
        }
        getPropertyPriority(name: string): string {
          return this.priorities.get(name) ?? "";
        }
        setProperty(name: string, value: string, priority = ""): void {
          this.values.set(name, value);
          this.priorities.set(name, priority);
        }
        removeProperty(name: string): string {
          const previous = this.getPropertyValue(name);
          this.values.delete(name);
          this.priorities.delete(name);
          return previous;
        }
      }

      class FakeAnimation {
        cancel = vi.fn();
        pause = vi.fn();
        play = vi.fn();
      }

      class FakeElement {
        parentElement: FakeElement | null = null;
        childNodes: FakeElement[] = [];
        style = new FakeStyle();
        attributes = new Map<string, string>();
        listeners = new Map<string, Set<EventListener>>();
        animate = vi.fn(() => new FakeAnimation() as unknown as Animation);
        get firstChild(): FakeElement | null {
          return this.childNodes[0] ?? null;
        }
        setAttribute(name: string, value: string): void {
          this.attributes.set(name, value);
        }
        addEventListener(type: string, listener: EventListener): void {
          const set = this.listeners.get(type) ?? new Set();
          set.add(listener);
          this.listeners.set(type, set);
        }
        removeEventListener(type: string, listener: EventListener): void {
          this.listeners.get(type)?.delete(listener);
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
          const index = this.childNodes.indexOf(node);
          if (index >= 0) this.childNodes.splice(index, 1);
          node.parentElement = null;
          return node;
        }
      }

      vi.stubGlobal("HTMLElement", FakeElement);
      vi.stubGlobal("HTMLDivElement", FakeElement);
      vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
      vi.stubGlobal("document", {
        createElement: () => new FakeElement(),
        querySelectorAll: () => [],
      });

      const element = new FakeElement();
      const target = element as unknown as HTMLElement;

      // Compose borderBeam and shine together on the same element
      const composition = composeEffects([
        borderBeam(target),
        shine(target),
      ]);

      expect(element.style.getPropertyValue("position")).toBe("relative");
      expect(element.style.getPropertyValue("isolation")).toBe("isolate");
      expect(element.childNodes).toHaveLength(2); // beam overlay + shine overlay

      // Destroy the first effect (borderBeam) individually
      composition.effects[0].destroy();

      // Container position: relative and isolation: isolate MUST remain intact for shine!
      expect(element.style.getPropertyValue("position")).toBe("relative");
      expect(element.style.getPropertyValue("isolation")).toBe("isolate");
      expect(element.childNodes).toHaveLength(1); // shine overlay remains

      // Destroy the remaining composition
      composition.destroy();

      // Now all effects on the container are destroyed -> original styles restored
      expect(element.style.getPropertyValue("position")).toBe("");
      expect(element.style.getPropertyValue("isolation")).toBe("");
      expect(element.childNodes).toHaveLength(0);

      vi.unstubAllGlobals();
    });
  });
});
