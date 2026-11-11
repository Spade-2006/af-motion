/**
 * AF Motion Custom Gesture Definition Registry
 *
 * Declarative registration and validation of custom user-defined gestures and built-in templates.
 */

import { GestureConfigurationError } from "./errors.js";
import type { CustomGestureDefinition } from "./types.js";

const registry = new Map<string, CustomGestureDefinition>();

export const BUILT_IN_GESTURE_DEFINITIONS: readonly CustomGestureDefinition[] = [
  {
    id: "tap",
    name: "Tap",
    pointerCount: 1,
    maxDistance: 10,
    maxDurationMs: 300,
  },
  {
    id: "double-tap",
    name: "Double Tap",
    pointerCount: 1,
    maxDistance: 20,
    maxDurationMs: 600,
  },
  {
    id: "long-press",
    name: "Long Press",
    pointerCount: 1,
    maxDistance: 10,
    minDurationMs: 450,
  },
  {
    id: "drag",
    name: "Drag",
    pointerCount: 1,
    minDistance: 5,
  },
  {
    id: "pan",
    name: "Pan",
    minDistance: 5,
  },
  {
    id: "swipe-left",
    name: "Swipe Left",
    pointerCount: 1,
    direction: "left",
    minDistance: 35,
    maxDurationMs: 400,
    minVelocity: 150,
  },
  {
    id: "swipe-right",
    name: "Swipe Right",
    pointerCount: 1,
    direction: "right",
    minDistance: 35,
    maxDurationMs: 400,
    minVelocity: 150,
  },
  {
    id: "swipe-up",
    name: "Swipe Up",
    pointerCount: 1,
    direction: "up",
    minDistance: 35,
    maxDurationMs: 400,
    minVelocity: 150,
  },
  {
    id: "swipe-down",
    name: "Swipe Down",
    pointerCount: 1,
    direction: "down",
    minDistance: 35,
    maxDurationMs: 400,
    minVelocity: 150,
  },
  {
    id: "edge-swipe-left",
    name: "Edge Swipe Left",
    pointerCount: 1,
    direction: "right",
    edge: "left",
    edgeThreshold: 30,
    minDistance: 40,
    maxDurationMs: 400,
  },
  {
    id: "edge-swipe-right",
    name: "Edge Swipe Right",
    pointerCount: 1,
    direction: "left",
    edge: "right",
    edgeThreshold: 30,
    minDistance: 40,
    maxDurationMs: 400,
  },
  {
    id: "hold-and-drag",
    name: "Hold and Drag",
    pointerCount: 1,
    minDurationMs: 400,
    minDistance: 15,
  },
  {
    id: "two-finger-tap",
    name: "Two-Finger Tap",
    pointerCount: 2,
    maxDistance: 15,
    maxDurationMs: 350,
  },
  {
    id: "two-finger-swipe-down",
    name: "Two-Finger Swipe Down",
    pointerCount: 2,
    direction: "down",
    minDistance: 40,
    maxDurationMs: 400,
    minVelocity: 150,
  },
  {
    id: "two-finger-swipe-up",
    name: "Two-Finger Swipe Up",
    pointerCount: 2,
    direction: "up",
    minDistance: 40,
    maxDurationMs: 400,
    minVelocity: 150,
  },
  {
    id: "three-finger-swipe-left",
    name: "Three-Finger Swipe Left",
    pointerCount: 3,
    direction: "left",
    minDistance: 40,
    maxDurationMs: 500,
    minVelocity: 120,
  },
  {
    id: "three-finger-swipe-right",
    name: "Three-Finger Swipe Right",
    pointerCount: 3,
    direction: "right",
    minDistance: 40,
    maxDurationMs: 500,
    minVelocity: 120,
  },
  {
    id: "pinch-in",
    name: "Pinch In",
    pointerCount: 2,
    minScaleChange: 0.1,
  },
  {
    id: "pinch-out",
    name: "Pinch Out",
    pointerCount: 2,
    minScaleChange: 0.1,
  },
  {
    id: "rotate-cw",
    name: "Rotate Clockwise",
    pointerCount: 2,
    minRotationChange: 15,
  },
  {
    id: "rotate-ccw",
    name: "Rotate Counter-Clockwise",
    pointerCount: 2,
    minRotationChange: 15,
  },
];

// Initialize with built-ins
for (const def of BUILT_IN_GESTURE_DEFINITIONS) {
  registry.set(def.id, def);
}

function validateDefinition(def: CustomGestureDefinition): void {
  if (!def || typeof def !== "object") {
    throw new GestureConfigurationError("Gesture definition must be a non-null object.");
  }
  if (!def.id || typeof def.id !== "string" || def.id.trim().length === 0) {
    throw new GestureConfigurationError("Gesture definition must have a non-empty string 'id'.");
  }
  if (/\s/.test(def.id)) {
    throw new GestureConfigurationError(`Gesture id "${def.id}" cannot contain whitespace.`);
  }

  const checkNonNegative = (val: number | undefined, name: string) => {
    if (val !== undefined) {
      if (typeof val !== "number" || !Number.isFinite(val) || val < 0) {
        throw new GestureConfigurationError(`${name} must be a finite number >= 0.`);
      }
    }
  };

  checkNonNegative(def.minDistance, "minDistance");
  checkNonNegative(def.maxDistance, "maxDistance");
  checkNonNegative(def.minDurationMs, "minDurationMs");
  checkNonNegative(def.maxDurationMs, "maxDurationMs");
  checkNonNegative(def.minVelocity, "minVelocity");
  checkNonNegative(def.maxVelocity, "maxVelocity");
  checkNonNegative(def.minLinearity, "minLinearity");
  checkNonNegative(def.edgeThreshold, "edgeThreshold");

  if (def.minDistance !== undefined && def.maxDistance !== undefined && def.minDistance > def.maxDistance) {
    throw new GestureConfigurationError("minDistance cannot be greater than maxDistance.");
  }
  if (def.minDurationMs !== undefined && def.maxDurationMs !== undefined && def.minDurationMs > def.maxDurationMs) {
    throw new GestureConfigurationError("minDurationMs cannot be greater than maxDurationMs.");
  }
  if (def.minVelocity !== undefined && def.maxVelocity !== undefined && def.minVelocity > def.maxVelocity) {
    throw new GestureConfigurationError("minVelocity cannot be greater than maxVelocity.");
  }
}

/**
 * Registers a custom gesture definition.
 * Returns an unregister function.
 */
export function registerGesture(definition: CustomGestureDefinition): () => void {
  validateDefinition(definition);
  registry.set(definition.id, definition);
  return () => {
    registry.delete(definition.id);
  };
}

/**
 * Unregisters a gesture by its unique identifier.
 */
export function unregisterGesture(id: string): boolean {
  return registry.delete(id);
}

/**
 * Returns all currently registered gesture definitions.
 */
export function getRegisteredGestures(): readonly CustomGestureDefinition[] {
  return Array.from(registry.values());
}

/**
 * Retrieves a registered gesture definition by id.
 */
export function getGestureDefinition(id: string): CustomGestureDefinition | undefined {
  return registry.get(id);
}

/**
 * Clears custom gestures, restoring defaults.
 */
export function resetGestureRegistry(): void {
  registry.clear();
  for (const def of BUILT_IN_GESTURE_DEFINITIONS) {
    registry.set(def.id, def);
  }
}
