/**
 * AF Motion Magnetic Group Controller
 *
 * Coordinates multi-element magnetic interactions, arbitrating pointer attraction
 * between adjacent elements to eliminate jitter, oscillation, and conflicting forces.
 */

import { createMagneticController } from "./magnetic-controller.js";
import { normalizeInputEvent } from "./input-normalizer.js";
import type {
  MagneticController,
  MagneticControllerOptions,
  MagneticGroupController,
  MagneticGroupMember,
  MagneticGroupOptions,
} from "./types.js";

export function createMagneticGroup(
  initialElements: readonly (HTMLElement | { element: HTMLElement; options?: MagneticControllerOptions })[],
  groupOptions: MagneticGroupOptions = {}
): MagneticGroupController {
  const prioritizeClosest = groupOptions.prioritizeClosest !== false;
  let isEnabled = true;
  let isDestroyed = false;

  const members: MagneticGroupMember[] = [];
  let activeMemberElement: HTMLElement | null = null;

  function addMember(element: HTMLElement, options?: MagneticControllerOptions): MagneticController {
    const existing = members.find((m) => m.element === element);
    if (existing) {
      return existing.controller;
    }

    const mergedOptions: MagneticControllerOptions = {
      ...(groupOptions.sharedRadius ? { radius: groupOptions.sharedRadius } : {}),
      ...options,
    };

    const controller = createMagneticController(element, mergedOptions);
    const member: MagneticGroupMember = {
      element,
      controller,
      options: mergedOptions,
    };
    members.push(member);
    return controller;
  }

  function removeMember(element: HTMLElement): void {
    const idx = members.findIndex((m) => m.element === element);
    if (idx !== -1) {
      const [removed] = members.splice(idx, 1);
      removed.controller.destroy();
      if (activeMemberElement === element) {
        activeMemberElement = null;
        groupOptions.onActiveMemberChange?.(null);
      }
    }
  }

  for (const item of initialElements) {
    if ("element" in item) {
      addMember(item.element, item.options);
    } else {
      addMember(item);
    }
  }

  function handlePointer(event: Event): void {
    if (!isEnabled || isDestroyed || members.length === 0) return;
    const norm = normalizeInputEvent(event, null);
    if (!norm.point) return;

    const px = norm.point.x;
    const py = norm.point.y;

    if (prioritizeClosest) {
      let closestElement: HTMLElement | null = null;
      let minDistance = Infinity;

      for (const m of members) {
        if (!m.element.isConnected) continue;
        const rect = m.element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dist = Math.hypot(px - centerX, py - centerY);
        const radius = m.options?.radius ?? groupOptions.sharedRadius ?? 150;

        if (dist <= radius && dist < minDistance) {
          minDistance = dist;
          closestElement = m.element;
        }
      }

      // If winner changed
      if (closestElement !== activeMemberElement) {
        activeMemberElement = closestElement;
        groupOptions.onActiveMemberChange?.(activeMemberElement);

        for (const m of members) {
          if (m.element === closestElement) {
            m.controller.enable();
          } else {
            // Disable and reset non-winning elements to prevent conflicting pull
            m.controller.reset();
          }
        }
      }
    }
  }

  const cleanups: (() => void)[] = [];
  const add = (targetEl: EventTarget, type: string, handler: (e: Event) => void) => {
    targetEl.addEventListener(type, handler, { passive: true });
    cleanups.push(() => targetEl.removeEventListener(type, handler));
  };

  if (typeof window !== "undefined") {
    add(window, "pointermove", handlePointer);
    add(window, "mousemove", handlePointer);
  }

  function enable(): void {
    isEnabled = true;
    for (const m of members) {
      m.controller.enable();
    }
  }

  function disable(): void {
    isEnabled = false;
    activeMemberElement = null;
    for (const m of members) {
      m.controller.disable();
    }
  }

  function reset(): void {
    activeMemberElement = null;
    for (const m of members) {
      m.controller.reset();
    }
  }

  function destroy(): void {
    if (isDestroyed) return;
    isDestroyed = true;

    for (const cleanup of cleanups) {
      cleanup();
    }
    cleanups.length = 0;

    for (const m of members) {
      m.controller.destroy();
    }
    members.length = 0;
    activeMemberElement = null;
  }

  return {
    get members() {
      return [...members];
    },
    addMember,
    removeMember,
    getActiveMember: () => activeMemberElement,
    enable,
    disable,
    reset,
    destroy,
  };
}
