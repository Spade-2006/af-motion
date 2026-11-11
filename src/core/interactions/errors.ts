/**
 * AF Motion Universal Interaction & Gestures — Structured Errors
 */

export class InteractionError extends Error {
  public readonly code: string;

  constructor(message: string, code: string = "INTERACTION_ERROR") {
    super(`[AF Motion Interaction] ${message}`);
    this.name = "InteractionError";
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class GestureConfigurationError extends InteractionError {
  constructor(message: string) {
    super(message, "GESTURE_CONFIG_ERROR");
    this.name = "GestureConfigurationError";
  }
}

export class InteractionLifecycleError extends InteractionError {
  constructor(message: string) {
    super(message, "INTERACTION_LIFECYCLE_ERROR");
    this.name = "InteractionLifecycleError";
  }
}
