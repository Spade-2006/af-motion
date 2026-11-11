/**
 * AF Motion — 3D Physics Event Bus & Observability
 *
 * Strongly-typed event emitter for physics world events, collision lifecycles,
 * trigger encounters, and simulation metrics tracking with zero listener leaks.
 */

import type { PhysicsWorldEventMap } from "./types.js";

export type PhysicsEventListener<K extends keyof PhysicsWorldEventMap> = (
  payload: PhysicsWorldEventMap[K]
) => void;

/**
 * High-performance, leak-free event emitter for 3D physics worlds.
 */
export class PhysicsEventEmitter3D {
  private readonly listeners = new Map<
    keyof PhysicsWorldEventMap,
    Set<PhysicsEventListener<any>>
  >();

  /**
   * Registers a listener for a physics event. Returns an unsubscribe function.
   */
  on<K extends keyof PhysicsWorldEventMap>(
    event: K,
    listener: PhysicsEventListener<K>
  ): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(listener);

    return () => {
      this.off(event, listener);
    };
  }

  /**
   * Unregisters an existing listener.
   */
  off<K extends keyof PhysicsWorldEventMap>(
    event: K,
    listener: PhysicsEventListener<K>
  ): void {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(listener);
      if (set.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * Dispatches an event to all registered listeners safely.
   */
  emit<K extends keyof PhysicsWorldEventMap>(
    event: K,
    payload: PhysicsWorldEventMap[K]
  ): void {
    const set = this.listeners.get(event);
    if (!set || set.size === 0) return;

    for (const listener of set) {
      try {
        listener(payload);
      } catch (err) {
        // Prevent subscriber errors from disrupting simulation loop
        console.error(`Error in physics listener for event "${String(event)}":`, err);
      }
    }
  }

  /**
   * Clears all registered listeners.
   */
  clear(): void {
    this.listeners.clear();
  }

  /**
   * Returns listener count for a specific event or in total.
   */
  listenerCount(event?: keyof PhysicsWorldEventMap): number {
    if (event) {
      return this.listeners.get(event)?.size ?? 0;
    }
    let total = 0;
    for (const set of this.listeners.values()) {
      total += set.size;
    }
    return total;
  }
}
