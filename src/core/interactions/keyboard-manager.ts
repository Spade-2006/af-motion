/**
 * AF Motion Keyboard Interaction Manager
 *
 * Handles keyboard navigation, configurable key bindings, modifier checks,
 * accessibility activation (Enter/Space), and cancellation (Escape).
 */

import type {
  KeyBinding,
  KeyboardOptions,
  ModifierKeys,
  NormalizedInputEvent,
} from "./types.js";

export class KeyboardManager {
  private readonly options: KeyboardOptions;
  private readonly bindings: KeyBinding[];

  constructor(options: KeyboardOptions = {}) {
    this.options = options;
    this.bindings = options.bindings ? [...options.bindings] : [];
  }

  public handleKeyDown(event: NormalizedInputEvent): boolean {
    if (this.options.enabled === false) return false;

    this.options.onKeyDown?.(event);

    const key = event.key;
    if (!key) return false;

    // Accessibility activations
    if (key === "Enter" || key === " " || key === "Spacebar") {
      this.options.onActivate?.(event);
    }

    // Cancellation
    if (key === "Escape" || key === "Esc") {
      this.options.onCancel?.(event);
    }

    // Check custom bindings
    for (const binding of this.bindings) {
      if (this.matchesBinding(key, event.modifiers, binding)) {
        if (binding.preventDefault) {
          event.preventDefault();
        }
        binding.action(event);
        return true;
      }
    }

    return false;
  }

  public handleKeyUp(event: NormalizedInputEvent): void {
    if (this.options.enabled === false) return;
    this.options.onKeyUp?.(event);
  }

  public addBinding(binding: KeyBinding): () => void {
    this.bindings.push(binding);
    return () => {
      const idx = this.bindings.indexOf(binding);
      if (idx !== -1) this.bindings.splice(idx, 1);
    };
  }

  private matchesBinding(
    key: string,
    modifiers: ModifierKeys,
    binding: KeyBinding
  ): boolean {
    const keys = Array.isArray(binding.key) ? binding.key : [binding.key];
    const keyMatches = keys.some(
      (k) => k.toLowerCase() === key.toLowerCase()
    );

    if (!keyMatches) return false;

    if (binding.modifiers) {
      if (binding.modifiers.alt !== undefined && binding.modifiers.alt !== modifiers.alt) return false;
      if (binding.modifiers.ctrl !== undefined && binding.modifiers.ctrl !== modifiers.ctrl) return false;
      if (binding.modifiers.meta !== undefined && binding.modifiers.meta !== modifiers.meta) return false;
      if (binding.modifiers.shift !== undefined && binding.modifiers.shift !== modifiers.shift) return false;
    }

    return true;
  }
}
