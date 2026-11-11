/**
 * AF Motion Layout Group Coordination
 *
 * Coordinates multi-element layout transitions, batch measurement cycles,
 * and customizable staggering without layout thrashing.
 */

import type { AnimationControls } from "../animation.js";
import { normalizeDuration } from "./presets.js";
import { areRectsEqual, measureLayout } from "./measure.js";
import { createLayoutController, LayoutControllerImpl } from "./controller.js";
import type {
  LayoutController,
  LayoutControllerOptions,
  LayoutGroup,
  LayoutGroupOptions,
  LayoutRect,
  LayoutStaggerDirection,
} from "./types.js";

let nextGroupId = 0;

export class LayoutGroupImpl implements LayoutGroup {
  public readonly id: string;
  private options: LayoutGroupOptions;
  private members = new Map<string, LayoutController>();
  private elementToId = new WeakMap<HTMLElement, string>();
  private isDestroyed = false;

  constructor(options: LayoutGroupOptions = {}) {
    this.id = options.id ?? `layout-group-${++nextGroupId}`;
    this.options = options;
  }

  public add(
    elementOrController: HTMLElement | LayoutController,
    options: Partial<LayoutControllerOptions> = {}
  ): LayoutController {
    if (this.isDestroyed) {
      throw new Error(`Cannot add member to destroyed LayoutGroup ${this.id}`);
    }

    let controller: LayoutController;

    if ("getState" in elementOrController) {
      controller = elementOrController;
      this.members.set(controller.id, controller);
      this.elementToId.set(controller.element, controller.id);
    } else {
      const existingId = this.elementToId.get(elementOrController);
      if (existingId && this.members.has(existingId)) {
        return this.members.get(existingId)!;
      }

      const { id: _groupId, ...groupRestOptions } = this.options;
      controller = createLayoutController(elementOrController, {
        ...groupRestOptions,
        ...options,
        autoObserve: options.autoObserve ?? false, // Groups typically manage batching manually or via observers
      });
      this.members.set(controller.id, controller);
      this.elementToId.set(elementOrController, controller.id);
    }

    return controller;
  }

  public remove(elementOrId: HTMLElement | string): void {
    const id = typeof elementOrId === "string" ? elementOrId : this.elementToId.get(elementOrId);
    if (!id) return;

    const controller = this.members.get(id);
    if (controller) {
      this.elementToId.delete(controller.element);
      this.members.delete(id);
    }
  }

  public get(elementOrId: HTMLElement | string): LayoutController | undefined {
    const id = typeof elementOrId === "string" ? elementOrId : this.elementToId.get(elementOrId);
    return id ? this.members.get(id) : undefined;
  }

  public getAll(): readonly LayoutController[] {
    return Array.from(this.members.values());
  }

  /**
   * Reads layout rects for all members in a single batched pass.
   */
  public measureAll(): Map<string, LayoutRect> {
    const map = new Map<string, LayoutRect>();
    for (const [id, controller] of this.members.entries()) {
      map.set(id, controller.measure());
    }
    return map;
  }

  /**
   * Records the initial "First" layout rect for all members in a single batched pass.
   */
  public recordAll(): void {
    for (const controller of this.members.values()) {
      controller.record();
    }
  }

  /**
   * Computes stagger delays and executes FLIP transitions across all member elements.
   */
  public animateAll(overrideOptions?: Partial<LayoutGroupOptions>): readonly AnimationControls[] {
    if (this.isDestroyed || this.members.size === 0) return [];

    const mergedOptions: LayoutGroupOptions = {
      ...this.options,
      ...overrideOptions,
    };

    const controllers = Array.from(this.members.values());
    const total = controllers.length;
    const rawStagger = mergedOptions.stagger !== undefined ? normalizeDuration(mergedOptions.stagger) : 0;
    const direction: LayoutStaggerDirection = mergedOptions.staggerDirection ?? "forward";

    const controlsList: AnimationControls[] = [];

    // Phase 1: All measurements have already been recorded by recordAll() or will be read now
    for (let index = 0; index < total; index++) {
      const controller = controllers[index];

      // Calculate stagger delay for this index
      let delay = 0;
      if (rawStagger > 0) {
        if (direction === "forward") {
          delay = index * rawStagger;
        } else if (direction === "reverse") {
          delay = (total - 1 - index) * rawStagger;
        } else if (direction === "center") {
          const center = (total - 1) / 2;
          delay = Math.abs(index - center) * rawStagger;
        } else if (direction === "random") {
          // Deterministic hash based on index and total
          const pseudorandom = ((index * 9301 + 49297) % 233280) / 233280;
          delay = pseudorandom * (total - 1) * rawStagger;
        }
      }

      const ctrl = controller.animate({
        ...mergedOptions,
        delay: (mergedOptions.delay ?? 0) + delay,
      });

      if (ctrl) {
        controlsList.push(ctrl);
      }
    }

    return controlsList;
  }

  public updateOptions(options: Partial<LayoutGroupOptions>): void {
    this.options = { ...this.options, ...options };
    for (const controller of this.members.values()) {
      controller.updateOptions(this.options);
    }
  }

  public cancelAll(): void {
    for (const controller of this.members.values()) {
      controller.cancel();
    }
  }

  public destroy(): void {
    if (this.isDestroyed) return;
    this.isDestroyed = true;
    for (const controller of this.members.values()) {
      controller.destroy();
    }
    this.members.clear();
  }
}

/**
 * Creates and returns a coordinated multi-element layout group.
 */
export function createLayoutGroup(options?: LayoutGroupOptions): LayoutGroup {
  return new LayoutGroupImpl(options);
}

/**
 * Performs a batch layout update safely:
 * 1. Read phase: Record all First rects.
 * 2. Mutation phase: Run DOM mutation callback.
 * 3. Animate phase: Measure Last rects and animate FLIP transitions.
 */
export function batchLayoutUpdate(
  updateFn: () => void,
  groupOrControllers: LayoutGroup | readonly LayoutController[]
): readonly AnimationControls[] {
  const controllers: readonly LayoutController[] = Array.isArray(groupOrControllers)
    ? groupOrControllers
    : "getAll" in groupOrControllers
    ? groupOrControllers.getAll()
    : [];

  // Read Phase
  for (let i = 0; i < controllers.length; i++) {
    controllers[i].record();
  }

  // Mutation Phase
  updateFn();

  // Write / Animate Phase
  if ("animateAll" in groupOrControllers && typeof groupOrControllers.animateAll === "function") {
    return groupOrControllers.animateAll();
  }

  const controls: AnimationControls[] = [];
  for (let i = 0; i < controllers.length; i++) {
    const ctrl = controllers[i].animate();
    if (ctrl) controls.push(ctrl);
  }
  return controls;
}
