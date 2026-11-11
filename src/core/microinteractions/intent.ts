/**
 * AF Motion Microinteraction Intent Classification
 *
 * Deterministic natural-language interpretation and keyword classification
 * for component categories, interaction states, and feedback archetypes.
 */

import type {
  ClassifiedMicrointeractionIntent,
  InteractionState,
  MicroComponentCategory,
  MicrointeractionContext,
  MicrointeractionFeedbackType,
} from "./types.js";

const CATEGORY_KEYWORDS: Record<MicroComponentCategory, readonly string[]> = {
  button: ["button", "btn", "cta", "submit", "action"],
  "icon-button": ["icon button", "icon-button", "toolbar icon", "action icon"],
  card: ["card", "tile", "panel", "box", "item card"],
  surface: ["surface", "backdrop", "sheet", "board", "canvas"],
  input: ["input", "text field", "textarea", "form field", "search bar"],
  "text-field": ["text-field", "textfield", "textbox"],
  checkbox: ["checkbox", "check box", "check"],
  radio: ["radio", "radio button", "radio group"],
  toggle: ["toggle", "switch", "flip switch"],
  dropdown: ["dropdown", "select", "combobox", "picker"],
  menu: ["menu", "context menu", "menu item"],
  tooltip: ["tooltip", "hint", "popover"],
  tabs: ["tab", "tabs", "tab-bar", "segmented control"],
  accordion: ["accordion", "expandable", "collapsible"],
  disclosure: ["disclosure", "details", "summary"],
  "nav-item": ["nav item", "nav-item", "navigation item", "breadcrumb"],
  link: ["link", "anchor", "hyperlink"],
  dialog: ["dialog", "modal", "alert dialog", "popup"],
  modal: ["modal dialog", "lightbox"],
  toast: ["toast", "notification", "snackbar", "banner"],
  notification: ["notification alert", "badge"],
  slider: ["slider", "range", "scrubber", "fader"],
  "media-control": ["media", "play button", "pause", "volume", "scrub"],
  custom: ["custom", "widget", "interactive element"],
};

const STATE_KEYWORDS: Record<InteractionState, readonly string[]> = {
  "focus-visible": ["focus-visible", "keyboard focus", "accessibility ring", "focus ring"],
  focus: ["focus", "tab over"],
  hover: ["hover", "mouse over", "point", "cursor"],
  press: ["press", "click", "tap", "push", "depress", "tactile"],
  release: ["release", "lift off", "unpress"],
  active: ["active", "checked", "turned on", "on state"],
  selected: ["selected", "chosen", "picked"],
  disabled: ["disabled", "inactive", "dimmed"],
  loading: ["loading", "spinner", "fetching", "busy", "progress"],
  success: ["success", "confirmed", "completed", "saved", "done", "pop"],
  error: ["error", "invalid", "failed", "shake", "warning", "rejected"],
  expanded: ["expanded", "open", "unfold", "opened"],
  collapsed: ["collapsed", "close", "fold", "closed"],
  dragging: ["dragging", "drag", "pickup", "moving"],
  dropping: ["dropping", "drop", "released"],
  idle: ["idle", "rest", "default state"],
};

const FEEDBACK_KEYWORDS: Record<MicrointeractionFeedbackType, readonly string[]> = {
  "scale-press": ["scale", "press-down", "shrink", "depress", "tactile"],
  "hover-lift": ["lift", "elevate", "float", "rise", "hover-lift"],
  "focus-ring": ["focus ring", "halo", "outline", "glow outline"],
  ripple: ["ripple", "wave", "splash", "ink"],
  "glow-pulse": ["glow", "pulse", "shine", "illuminate"],
  "shake-error": ["shake", "wobble", "vibrate", "error shake", "jiggle"],
  "pop-success": ["pop", "bounce", "punch", "success pop", "celebrate"],
  "toggle-slide": ["slide", "track", "thumb", "flip"],
  "disclosure-expand": ["expand", "unfold", "reveal", "accordion slide"],
  "drag-elevation": ["drag lift", "shadow raise", "elevation"],
  "subtle-color": ["tint", "fade", "subtle color", "color shift"],
};

/**
 * Classifies microinteraction intent from a context or natural-language query.
 */
export function classifyMicrointeractionIntent(
  input: MicrointeractionContext | string
): ClassifiedMicrointeractionIntent {
  const text = (typeof input === "string" ? input : input.intent ?? "").toLowerCase();
  const matchedKeywords: string[] = [];

  let matchedCategory: MicroComponentCategory =
    typeof input !== "string" && input.category ? input.category : "button";
  let categoryScore = typeof input !== "string" && input.category ? 1.0 : 0;

  if (!categoryScore && text) {
    for (const [cat, words] of Object.entries(CATEGORY_KEYWORDS)) {
      for (const word of words) {
        if (text.includes(word)) {
          matchedCategory = cat as MicroComponentCategory;
          categoryScore = 0.85;
          matchedKeywords.push(word);
          break;
        }
      }
      if (categoryScore > 0) break;
    }
  }

  let matchedState: InteractionState =
    typeof input !== "string" && input.toState ? input.toState : "hover";
  let stateScore = typeof input !== "string" && input.toState ? 1.0 : 0;

  if (!stateScore && text) {
    for (const [st, words] of Object.entries(STATE_KEYWORDS)) {
      for (const word of words) {
        if (text.includes(word)) {
          matchedState = st as InteractionState;
          stateScore = 0.85;
          matchedKeywords.push(word);
          break;
        }
      }
      if (stateScore > 0) break;
    }
  }

  let matchedFeedback: MicrointeractionFeedbackType = "hover-lift";
  if (matchedState === "press") matchedFeedback = "scale-press";
  else if (matchedState === "focus" || matchedState === "focus-visible") matchedFeedback = "focus-ring";
  else if (matchedState === "error") matchedFeedback = "shake-error";
  else if (matchedState === "success") matchedFeedback = "pop-success";
  else if (matchedState === "expanded" || matchedState === "collapsed") matchedFeedback = "disclosure-expand";
  else if (matchedState === "dragging") matchedFeedback = "drag-elevation";
  else if (matchedCategory === "toggle") matchedFeedback = "toggle-slide";

  if (text) {
    for (const [fb, words] of Object.entries(FEEDBACK_KEYWORDS)) {
      for (const word of words) {
        if (text.includes(word)) {
          matchedFeedback = fb as MicrointeractionFeedbackType;
          matchedKeywords.push(word);
          break;
        }
      }
    }
  }

  const confidence = matchedKeywords.length > 0 ? Math.min(0.95, 0.4 + matchedKeywords.length * 0.2) : 0.4;

  return {
    category: matchedCategory,
    targetState: matchedState,
    feedbackType: matchedFeedback,
    confidence,
    matchedKeywords: Object.freeze(matchedKeywords),
  };
}
