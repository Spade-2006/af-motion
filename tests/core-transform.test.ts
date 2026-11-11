import { describe, expect, it } from "vitest";
import { acquireEffectTarget, releaseEffectTarget, removeTransformLayer, setTransformLayer } from "../src/core/transform";

class FakeStyle {
  private values = new Map<string, string>();
  private priorities = new Map<string, string>();

  get transform(): string {
    return this.values.get("transform") ?? "";
  }

  getPropertyValue(name: string): string {
    return this.values.get(name) ?? "";
  }

  getPropertyPriority(name: string): string {
    return this.priorities.get(name) ?? "";
  }

  setProperty(name: string, value: string, priority = ""): void {
    this.values.set(name, value);
    if (priority) this.priorities.set(name, priority);
    else this.priorities.delete(name);
  }

  removeProperty(name: string): void {
    this.values.delete(name);
    this.priorities.delete(name);
  }
}

class FakeHTMLElement {
  style = new FakeStyle();
}

function transformOf(element: FakeHTMLElement): string | undefined {
  return element.style.transform || undefined;
}

describe("transform layers", () => {
  it("composes independent owner layers after the original transform", () => {
    const element = new FakeHTMLElement();
    element.style.setProperty("transform", "rotate(10deg)");
    const first = {};
    const second = {};

    setTransformLayer(element as unknown as HTMLElement, first, "translateX(12px)");
    setTransformLayer(element as unknown as HTMLElement, second, "scale(1.1)");

    expect(transformOf(element)).toBe("rotate(10deg) translateX(12px) scale(1.1)");
  });

  it("updates and removes each owner's layer without disturbing others", () => {
    const element = new FakeHTMLElement();
    element.style.setProperty("transform", "rotate(10deg)");
    const first = {};
    const second = {};
    const target = element as unknown as HTMLElement;

    setTransformLayer(target, first, "translateX(12px)");
    setTransformLayer(target, second, "scale(1.1)");
    setTransformLayer(target, first, "translateX(20px)");
    removeTransformLayer(target, first);

    expect(transformOf(element)).toBe("rotate(10deg) scale(1.1)");
    removeTransformLayer(target, second);
    expect(transformOf(element)).toBe("rotate(10deg)");
  });

  it("restores an absent original transform after the final layer is removed", () => {
    const element = new FakeHTMLElement();
    const owner = {};
    const target = element as unknown as HTMLElement;

    setTransformLayer(target, owner, "translateY(8px)");
    removeTransformLayer(target, owner);

    expect(transformOf(element)).toBeUndefined();
  });

  it("preserves original transform priority while layers are active and after removal", () => {
    const element = new FakeHTMLElement();
    element.style.setProperty("transform", "rotate(10deg)", "important");
    const owner = {};
    const target = element as unknown as HTMLElement;

    setTransformLayer(target, owner, "translateY(8px)");
    expect(transformOf(element)).toBe("rotate(10deg) translateY(8px)");
    expect(element.style.getPropertyPriority("transform")).toBe("important");

    removeTransformLayer(target, owner);
    expect(transformOf(element)).toBe("rotate(10deg)");
    expect(element.style.getPropertyPriority("transform")).toBe("important");
  });

  describe("shared effect target acquisition", () => {
    it("maintains container position and isolation while any effect remains active", () => {
      const element = new FakeHTMLElement();
      const target = element as unknown as HTMLElement;

      acquireEffectTarget(target);
      expect(element.style.getPropertyValue("position")).toBe("relative");
      expect(element.style.getPropertyValue("isolation")).toBe("isolate");

      // Second effect acquires same container
      acquireEffectTarget(target);
      expect(element.style.getPropertyValue("position")).toBe("relative");

      // First effect is released - container must stay relative and isolated
      releaseEffectTarget(target);
      expect(element.style.getPropertyValue("position")).toBe("relative");
      expect(element.style.getPropertyValue("isolation")).toBe("isolate");

      // Final effect is released - container styles restored cleanly
      releaseEffectTarget(target);
      expect(element.style.getPropertyValue("position")).toBe("");
      expect(element.style.getPropertyValue("isolation")).toBe("");
    });
  });
});
