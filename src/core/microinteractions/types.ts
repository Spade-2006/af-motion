/**
 * AF Motion Intelligent Microinteraction Contracts
 *
 * Framework-independent contracts for context-aware microinteraction generation,
 * component categories, interaction states, triggers, feedback patterns, and runtime controllers.
 */

import type { AnimatableProperties } from "../animate.js";

export const MICROINTERACTION_VERSION = "1.0.0";

export type MicroComponentCategory =
  | "button"
  | "icon-button"
  | "card"
  | "surface"
  | "input"
  | "text-field"
  | "checkbox"
  | "radio"
  | "toggle"
  | "dropdown"
  | "menu"
  | "tooltip"
  | "tabs"
  | "accordion"
  | "disclosure"
  | "nav-item"
  | "link"
  | "dialog"
  | "modal"
  | "toast"
  | "notification"
  | "slider"
  | "media-control"
  | "custom";

export const MICRO_COMPONENT_CATEGORIES: readonly MicroComponentCategory[] = [
  "button",
  "icon-button",
  "card",
  "surface",
  "input",
  "text-field",
  "checkbox",
  "radio",
  "toggle",
  "dropdown",
  "menu",
  "tooltip",
  "tabs",
  "accordion",
  "disclosure",
  "nav-item",
  "link",
  "dialog",
  "modal",
  "toast",
  "notification",
  "slider",
  "media-control",
  "custom",
] as const;

export type InteractionState =
  | "idle"
  | "hover"
  | "focus"
  | "focus-visible"
  | "press"
  | "release"
  | "active"
  | "selected"
  | "disabled"
  | "loading"
  | "success"
  | "error"
  | "expanded"
  | "collapsed"
  | "dragging"
  | "dropping";

export const INTERACTION_STATES: readonly InteractionState[] = [
  "idle",
  "hover",
  "focus",
  "focus-visible",
  "press",
  "release",
  "active",
  "selected",
  "disabled",
  "loading",
  "success",
  "error",
  "expanded",
  "collapsed",
  "dragging",
  "dropping",
] as const;

export type MicrointeractionTrigger =
  | "pointer"
  | "keyboard"
  | "focus"
  | "toggle"
  | "drag"
  | "state-change"
  | "programmatic";

export const MICROINTERACTION_TRIGGERS: readonly MicrointeractionTrigger[] = [
  "pointer",
  "keyboard",
  "focus",
  "toggle",
  "drag",
  "state-change",
  "programmatic",
] as const;

export type MicrointeractionFeedbackType =
  | "scale-press"
  | "hover-lift"
  | "focus-ring"
  | "ripple"
  | "glow-pulse"
  | "shake-error"
  | "pop-success"
  | "toggle-slide"
  | "disclosure-expand"
  | "drag-elevation"
  | "subtle-color";

export const MICROINTERACTION_FEEDBACK_TYPES: readonly MicrointeractionFeedbackType[] = [
  "scale-press",
  "hover-lift",
  "focus-ring",
  "ripple",
  "glow-pulse",
  "shake-error",
  "pop-success",
  "toggle-slide",
  "disclosure-expand",
  "drag-elevation",
  "subtle-color",
] as const;

export interface MicrointeractionConfig {
  readonly properties: Readonly<AnimatableProperties>;
  readonly duration: number; // in milliseconds
  readonly delay?: number;
  readonly easing?: string;
  readonly spring?: {
    readonly stiffness?: number;
    readonly damping?: number;
    readonly mass?: number;
  };
  readonly transformOrigin?: string;
  readonly hapticFeedback?: boolean;
  readonly ariaLive?: "polite" | "assertive" | "off";
  readonly materialEffect?: "glass" | "metallic" | "shadow" | "glow" | "none";
}

export interface MicrointeractionPlan {
  readonly id: string;
  readonly name: string;
  readonly category: MicroComponentCategory;
  readonly trigger: MicrointeractionTrigger;
  readonly fromState: InteractionState;
  readonly toState: InteractionState;
  readonly feedbackType: MicrointeractionFeedbackType;
  readonly config: MicrointeractionConfig;
  readonly reducedMotionConfig: MicrointeractionConfig;
  readonly compatibilityScore: number;
  readonly explanation: string;
  readonly respectReducedMotion: boolean;
}

export interface MicrointeractionContext {
  readonly category?: MicroComponentCategory;
  readonly intent?: string;
  readonly trigger?: MicrointeractionTrigger;
  readonly fromState?: InteractionState;
  readonly toState?: InteractionState;
  readonly visualStyle?: string;
  readonly motionDNA?: string;
  readonly reducedMotion?: boolean;
  readonly deviceTier?: "low" | "medium" | "high";
  readonly disabled?: boolean;
}

export interface MicrointeractionResult {
  readonly plan: MicrointeractionPlan;
  readonly alternatives: readonly MicrointeractionPlan[];
  readonly compatibilityScore: number;
  readonly warnings: readonly string[];
  readonly explanation: string;
  readonly context: MicrointeractionContext;
}

export interface ClassifiedMicrointeractionIntent {
  readonly category: MicroComponentCategory;
  readonly targetState: InteractionState;
  readonly feedbackType: MicrointeractionFeedbackType;
  readonly confidence: number;
  readonly matchedKeywords: readonly string[];
}

export interface MicrointeractionRuntimeControls {
  readonly getState: () => InteractionState;
  readonly setState: (state: InteractionState) => void;
  readonly attach: (element: HTMLElement) => void;
  readonly detach: () => void;
  readonly destroy: () => void;
}
