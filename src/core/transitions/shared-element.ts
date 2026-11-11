/**
 * AF Motion Shared Element Transition Engine
 *
 * Lightweight, framework-independent registry and FLIP layout delta solver
 * for seamless shared-element movement between views, cards, modals, and pages.
 */

import type { AnimatableProperties } from "../animate.js";
import { measureLayout } from "../layout/measure.js";
import type {
  SharedElementRect,
  SharedElementRegistrationOptions,
  SharedElementRole,
  SharedElementSnapshot,
  SharedElementStyles,
} from "./types.js";

/**
 * Extracts key animatable styles from an element for shared element snapshots.
 */
function extractStyles(element: HTMLElement | null): SharedElementStyles {
  if (!element || typeof window === "undefined") {
    return {
      opacity: 1,
      borderRadius: "0px",
      transform: "none",
      zIndex: "auto",
    };
  }

  const computed = window.getComputedStyle(element);
  return {
    opacity: Number.parseFloat(computed.opacity) || 1,
    borderRadius: computed.borderRadius || "0px",
    transform: computed.transform || "none",
    zIndex: computed.zIndex || "auto",
    boxShadow: computed.boxShadow,
    backgroundColor: computed.backgroundColor,
  };
}

export class SharedElementRegistry {
  private readonly elements = new Map<string, HTMLElement>();
  private readonly sources = new Map<string, HTMLElement>();
  private readonly destinations = new Map<string, HTMLElement>();
  private readonly optionsMap = new Map<string, SharedElementRegistrationOptions>();
  private readonly capturedRects = new Map<string, SharedElementRect>();
  private readonly snapshots = new Map<string, SharedElementSnapshot>();

  /**
   * Registers an active DOM element under a shared-element ID with optional role and hierarchy metadata.
   */
  public register(
    id: string,
    element: HTMLElement,
    options?: SharedElementRegistrationOptions
  ): void {
    if (!id || !element) return;

    const role = options?.role ?? "auto";

    if (role === "source") {
      this.sources.set(id, element);
    } else if (role === "destination") {
      this.destinations.set(id, element);
    } else {
      // Auto: if not registered, first becomes source, next becomes destination
      if (!this.elements.has(id)) {
        this.sources.set(id, element);
      } else {
        this.destinations.set(id, element);
      }
    }

    this.elements.set(id, element);
    if (options) {
      this.optionsMap.set(id, options);
    }
  }

  /**
   * Unregisters a shared-element ID (or specific role).
   */
  public unregister(id: string, role?: SharedElementRole): void {
    if (!role || role === "auto") {
      this.elements.delete(id);
      this.sources.delete(id);
      this.destinations.delete(id);
      this.optionsMap.delete(id);
      this.capturedRects.delete(id);
      this.snapshots.delete(id);
      this.snapshots.delete(`${id}:source`);
      this.snapshots.delete(`${id}:destination`);
    } else if (role === "source") {
      this.sources.delete(id);
      this.snapshots.delete(`${id}:source`);
    } else if (role === "destination") {
      this.destinations.delete(id);
      this.snapshots.delete(`${id}:destination`);
    }
  }

  /**
   * Captures and stores the current bounding client rect for a shared element.
   * Backward-compatible with Prompt 83 API.
   */
  public captureRect(id: string, rect?: SharedElementRect): SharedElementRect | null {
    if (rect) {
      this.capturedRects.set(id, rect);
      return rect;
    }

    const el = this.elements.get(id);
    if (!el || typeof el.getBoundingClientRect !== "function") {
      return this.capturedRects.get(id) ?? null;
    }

    const measured = measureLayout(el, false);
    const captured: SharedElementRect = {
      top: measured.top,
      left: measured.left,
      width: measured.width,
      height: measured.height,
    };

    this.capturedRects.set(id, captured);
    return captured;
  }

  /**
   * Captures a rich snapshot including geometry, computed styles, and parent relationship.
   */
  public capture(
    id: string,
    role: SharedElementRole = "auto",
    rect?: SharedElementRect
  ): SharedElementSnapshot | null {
    const el = role === "source"
      ? (this.sources.get(id) ?? this.elements.get(id))
      : role === "destination"
      ? (this.destinations.get(id) ?? this.elements.get(id))
      : this.elements.get(id);

    const targetRect = rect ?? (el ? measureLayout(el, false) : this.capturedRects.get(id));
    if (!targetRect) return null;

    const options = this.optionsMap.get(id);
    const styles = extractStyles(el ?? null);

    const snapshot: SharedElementSnapshot = {
      id,
      role,
      element: el ?? null,
      rect: {
        top: targetRect.top,
        left: targetRect.left,
        width: targetRect.width,
        height: targetRect.height,
      },
      styles,
      timestamp: Date.now(),
      nestedUnder: options?.nestedUnder,
    };

    const key = role === "auto" ? id : `${id}:${role}`;
    this.snapshots.set(key, snapshot);
    this.capturedRects.set(id, snapshot.rect);

    return snapshot;
  }

  /**
   * Captures snapshots for all registered elements.
   */
  public captureAll(role: SharedElementRole = "auto"): Map<string, SharedElementSnapshot> {
    const results = new Map<string, SharedElementSnapshot>();
    const ids = new Set<string>([
      ...this.elements.keys(),
      ...this.sources.keys(),
      ...this.destinations.keys(),
    ]);

    for (const id of ids) {
      const snap = this.capture(id, role);
      if (snap) {
        results.set(id, snap);
      }
    }
    return results;
  }

  /**
   * Retrieves the last captured bounding rect for an element.
   */
  public getCapturedRect(id: string): SharedElementRect | null {
    return this.capturedRects.get(id) ?? null;
  }

  /**
   * Retrieves the last captured snapshot for an element.
   */
  public getSnapshot(id: string, role: SharedElementRole = "auto"): SharedElementSnapshot | null {
    if (role !== "auto") {
      const specific = this.snapshots.get(`${id}:${role}`);
      if (specific) return specific;
    }
    return this.snapshots.get(id) ?? null;
  }

  /**
   * Retrieves the live DOM element registered under an ID and optional role.
   */
  public getElement(id: string, role?: SharedElementRole): HTMLElement | null {
    if (role === "source") return this.sources.get(id) ?? null;
    if (role === "destination") return this.destinations.get(id) ?? null;
    return this.elements.get(id) ?? this.destinations.get(id) ?? this.sources.get(id) ?? null;
  }

  /**
   * Returns matching source and destination elements or snapshots for a given ID.
   */
  public getMatch(id: string): {
    source: HTMLElement | SharedElementSnapshot | null;
    destination: HTMLElement | SharedElementSnapshot | null;
  } {
    const sourceEl = this.sources.get(id) ?? null;
    const destEl = this.destinations.get(id) ?? null;
    const sourceSnap = this.snapshots.get(`${id}:source`) ?? null;
    const destSnap = this.snapshots.get(`${id}:destination`) ?? null;

    return {
      source: sourceEl ?? sourceSnap ?? this.elements.get(id) ?? null,
      destination: destEl ?? destSnap ?? null,
    };
  }

  /**
   * Checks whether an ID is registered.
   */
  public has(id: string, role?: SharedElementRole): boolean {
    if (role === "source") return this.sources.has(id);
    if (role === "destination") return this.destinations.has(id);
    return this.elements.has(id) || this.sources.has(id) || this.destinations.has(id);
  }

  /**
   * Returns parent shared-element ID if nested.
   */
  public getNestedUnder(id: string): string | undefined {
    return this.optionsMap.get(id)?.nestedUnder;
  }

  /**
   * Computes FLIP inverse transform properties from sourceRect to targetRect.
   */
  public computeTransform(
    sourceRect: SharedElementRect,
    targetRect: SharedElementRect
  ): AnimatableProperties {
    const deltaX = Math.round(sourceRect.left - targetRect.left);
    const deltaY = Math.round(sourceRect.top - targetRect.top);
    const scaleX = Number((sourceRect.width / Math.max(1, targetRect.width)).toFixed(4));
    const scaleY = Number((sourceRect.height / Math.max(1, targetRect.height)).toFixed(4));

    return {
      transform: [
        `translate3d(${deltaX}px, ${deltaY}px, 0px) scale(${scaleX}, ${scaleY})`,
        "translate3d(0px, 0px, 0px) scale(1, 1)",
      ],
      transformOrigin: ["top left", "top left"],
    };
  }

  /**
   * Clears all stored element references and captured geometry.
   */
  public clear(): void {
    this.elements.clear();
    this.sources.clear();
    this.destinations.clear();
    this.optionsMap.clear();
    this.capturedRects.clear();
    this.snapshots.clear();
  }
}

/**
 * Creates an independent SharedElementRegistry instance.
 */
export function createSharedElementRegistry(): SharedElementRegistry {
  return new SharedElementRegistry();
}

/**
 * Default global SharedElementRegistry singleton.
 */
export const sharedElementRegistry = new SharedElementRegistry();

/**
 * Helper to register a shared element in the global registry.
 */
export function registerSharedElement(
  id: string,
  element: HTMLElement,
  options?: SharedElementRegistrationOptions
): () => void {
  sharedElementRegistry.register(id, element, options);
  return () => {
    sharedElementRegistry.unregister(id, options?.role);
  };
}
