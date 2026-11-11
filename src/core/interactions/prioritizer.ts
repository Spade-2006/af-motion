/**
 * AF Motion Interaction & Gesture Prioritizer
 *
 * Resolves conflicts between simultaneous interactions and gestures,
 * enforces priority policies, mutual exclusion, and cancellation.
 */

import type { GestureRecognizer } from "./gesture-recognizers.js";
import type {
  ConflictPolicy,
  GesturePrioritizationRule,
  GestureType,
  InteractionPriority,
} from "./types.js";

export function normalizePriority(priority?: InteractionPriority): number {
  if (typeof priority === "number") return priority;
  switch (priority) {
    case "critical":
      return 30;
    case "high":
      return 20;
    case "normal":
      return 10;
    case "low":
      return 0;
    default:
      return 10;
  }
}

export class InteractionPrioritizer {
  private readonly rules = new Map<GestureType, GesturePrioritizationRule>();

  constructor(rules: readonly GesturePrioritizationRule[] = []) {
    for (const rule of rules) {
      this.rules.set(rule.gesture, rule);
    }
  }

  public getRule(gesture: GestureType): GesturePrioritizationRule | undefined {
    return this.rules.get(gesture);
  }

  public getPriority(gesture: GestureType): number {
    const rule = this.rules.get(gesture);
    return normalizePriority(rule?.priority);
  }

  public getConflictPolicy(gesture: GestureType): ConflictPolicy {
    return this.rules.get(gesture)?.policy ?? "simultaneous";
  }

  public resolveConflicts(
    activeRecognizer: GestureRecognizer,
    allRecognizers: readonly GestureRecognizer[]
  ): void {
    const activeType = activeRecognizer.type;
    const activeRule = this.rules.get(activeType);
    const activePriority = this.getPriority(activeType);

    // If active recognizer is beginning/changing/recognized:
    const isActive =
      activeRecognizer.status === "began" ||
      activeRecognizer.status === "changed" ||
      activeRecognizer.status === "recognized";

    if (!isActive) return;

    for (const other of allRecognizers) {
      if (other === activeRecognizer) continue;

      const otherType = other.type;
      const otherPriority = this.getPriority(otherType);

      // Check explicit blocks
      if (activeRule?.blocks && activeRule.blocks.includes(otherType)) {
        other.cancel();
        continue;
      }

      // Check conflict policies
      const activePolicy = activeRule?.policy ?? "simultaneous";
      if (activePolicy === "exclusive") {
        if (activePriority >= otherPriority) {
          other.cancel();
        }
      }
    }
  }
}
