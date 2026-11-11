/**
 * AF Motion Design-to-Motion Input Parser (Prompt 142)
 *
 * Validates, normalizes, and synthesizes structured design specifications
 * from natural-language descriptions, structured inputs, and design tokens.
 */

import type {
  DesignToMotionInput,
  DesignStructuredSpecification,
  DesignStructuredElement,
  DesignTokenContext,
  DesignElementType,
  MotionDNAPersonalityOption,
} from "./types.js";
import { BUILT_IN_PALETTE_INPUTS } from "../built-in-palettes.js";

export interface NormalizedDesignInput {
  readonly specification: DesignStructuredSpecification;
  readonly tokens: Required<DesignTokenContext>;
  readonly rawPrompt?: string;
  readonly validationIssues: readonly string[];
}

const DEFAULT_DNA: MotionDNAPersonalityOption = "precise";

const VALID_ELEMENT_TYPES: ReadonlySet<string> = new Set([
  "button",
  "card",
  "modal",
  "dialog",
  "navigation",
  "header",
  "hero",
  "section",
  "badge",
  "icon",
  "image",
  "input",
  "text",
  "tooltip",
  "drawer",
  "list",
  "grid",
  "container",
]);

/**
 * Normalizes and validates the incoming DesignToMotionInput into a fully-qualified specification.
 */
export function parseAndNormalizeDesignInput(input: DesignToMotionInput): NormalizedDesignInput {
  const issues: string[] = [];

  // 1. Extract raw prompt if present
  let rawPrompt: string | undefined;
  if (typeof input.naturalLanguage === "string") {
    rawPrompt = input.naturalLanguage.trim();
  } else if (input.naturalLanguage?.prompt) {
    rawPrompt = input.naturalLanguage.prompt.trim();
  }

  // 2. Resolve Tokens
  const tokenInput = input.tokens ?? {};
  const paletteName = tokenInput.paletteName || "Neo Neon";
  const matchedPalette = BUILT_IN_PALETTE_INPUTS.find(
    (p) => p.name.toLowerCase() === paletteName.toLowerCase()
  ) || BUILT_IN_PALETTE_INPUTS[0];

  const resolvedTokens: Required<DesignTokenContext> = {
    paletteName: matchedPalette.name,
    paletteColors: tokenInput.paletteColors || {
      primary: matchedPalette.primary,
      secondary: matchedPalette.secondary,
      accent: matchedPalette.accent,
      background: "#0B0F19",
    },
    motionDNA: tokenInput.motionDNA || resolveDNAFromPrompt(rawPrompt) || DEFAULT_DNA,
    timingMultiplier:
      typeof tokenInput.timingMultiplier === "number" &&
      Number.isFinite(tokenInput.timingMultiplier) &&
      tokenInput.timingMultiplier > 0 &&
      tokenInput.timingMultiplier <= 20
        ? tokenInput.timingMultiplier
        : 1.0,
    reducedMotion: Boolean(tokenInput.reducedMotion),
    styleId: tokenInput.styleId || "minimal",
  };

  // 3. Resolve or Synthesize Structured Specification
  let specification: DesignStructuredSpecification;

  if (input.specification && Array.isArray(input.specification.elements) && input.specification.elements.length > 0) {
    // Validate provided specification
    const validElements: DesignStructuredElement[] = [];
    const seenIds = new Set<string>();

    for (const el of input.specification.elements) {
      if (!el.id) {
        issues.push(`Element missing required id, skipping.`);
        continue;
      }
      if (seenIds.has(el.id)) {
        issues.push(`Duplicate element id '${el.id}', skipping duplicate.`);
        continue;
      }
      seenIds.add(el.id);

      const type: DesignElementType = VALID_ELEMENT_TYPES.has(el.type) ? el.type : "container";
      if (!VALID_ELEMENT_TYPES.has(el.type)) {
        issues.push(`Element '${el.id}' has unknown type '${el.type}', falling back to 'container'.`);
      }

      validElements.push({
        ...el,
        type,
        importance: el.importance || (type === "hero" || type === "modal" ? "high" : "medium"),
      });
    }

    if (validElements.length === 0) {
      issues.push("All provided elements were invalid; falling back to synthesized specification.");
      specification = synthesizeSpecificationFromPrompt(rawPrompt || "Generic motion container", issues);
    } else {
      specification = {
        id: input.specification.id || `spec-${Date.now()}`,
        title: input.specification.title || "Custom Design Specification",
        elements: validElements,
        rootId: input.specification.rootId || validElements[0].id,
        viewportContext: input.specification.viewportContext || {
          width: 1280,
          height: 800,
          isMobile: false,
        },
      };
    }
  } else if (rawPrompt) {
    // Synthesize from natural-language prompt
    specification = synthesizeSpecificationFromPrompt(rawPrompt, issues);
  } else {
    // Empty input fallback
    issues.push("No natural language prompt or structured specification provided; creating default interactive surface.");
    specification = {
      id: "spec-default",
      title: "Default Interactive Surface",
      elements: [
        {
          id: "surface-1",
          type: "card",
          name: "Interactive Card",
          importance: "high",
          interactionCapabilities: ["hover", "press"],
          dimensions: { width: 360, height: 220 },
          semanticRole: "surface",
        },
      ],
      rootId: "surface-1",
      viewportContext: { width: 1280, height: 800, isMobile: false },
    };
  }

  return {
    specification,
    tokens: resolvedTokens,
    rawPrompt,
    validationIssues: issues,
  };
}

/**
 * Infer Motion DNA personality from natural language keywords if user hasn't explicitly set it.
 */
function resolveDNAFromPrompt(prompt?: string): MotionDNAPersonalityOption | null {
  if (!prompt) return null;
  const lower = prompt.toLowerCase();
  if (lower.includes("bouncy") || lower.includes("playful") || lower.includes("fun") || lower.includes("elastic")) {
    return "playful";
  }
  if (lower.includes("elegant") || lower.includes("stately") || lower.includes("luxury") || lower.includes("gentle")) {
    return "elegant";
  }
  if (lower.includes("energetic") || lower.includes("punchy") || lower.includes("fast") || lower.includes("snappy")) {
    return "energetic";
  }
  if (lower.includes("editorial") || lower.includes("narrative") || lower.includes("typography") || lower.includes("story")) {
    return "editorial-flow";
  }
  if (lower.includes("precise") || lower.includes("crisp") || lower.includes("clean") || lower.includes("subtle")) {
    return "precise";
  }
  return null;
}

/**
 * Synthesizes a structured design specification from natural-language descriptions.
 */
function synthesizeSpecificationFromPrompt(prompt: string, issues: string[]): DesignStructuredSpecification {
  const lower = prompt.toLowerCase();

  if (lower.includes("modal") || lower.includes("dialog") || lower.includes("popup")) {
    return {
      id: "spec-modal",
      title: "Modal Dialog Specification",
      elements: [
        {
          id: "modal-backdrop",
          type: "container",
          name: "Backdrop Overlay",
          importance: "background",
          semanticRole: "overlay",
          opacity: 0.7,
          dimensions: { width: "100%", height: "100%" },
        },
        {
          id: "modal-dialog",
          type: "modal",
          name: "Modal Container",
          parentId: "modal-backdrop",
          importance: "high",
          semanticRole: "surface",
          dimensions: { width: 480, height: 320 },
          position: { positionType: "fixed" },
          interactionCapabilities: ["focus"],
        },
        {
          id: "modal-confirm-btn",
          type: "button",
          name: "Action Button",
          parentId: "modal-dialog",
          importance: "medium",
          semanticRole: "trigger",
          interactionCapabilities: ["hover", "press"],
        },
      ],
      rootId: "modal-backdrop",
      viewportContext: { width: 1280, height: 800, isMobile: false },
    };
  }

  if (lower.includes("card") || lower.includes("grid") || lower.includes("stagger")) {
    return {
      id: "spec-cards-grid",
      title: "Staggered Cards Grid Specification",
      elements: [
        {
          id: "cards-container",
          type: "grid",
          name: "Cards Grid",
          importance: "high",
          semanticRole: "surface",
          layout: { display: "grid", gap: 20 },
          dimensions: { width: 1100, height: 400 },
        },
        {
          id: "card-1",
          type: "card",
          name: "Feature Card 1",
          parentId: "cards-container",
          importance: "medium",
          semanticRole: "surface",
          interactionCapabilities: ["hover", "press"],
          dimensions: { width: 340, height: 260 },
        },
        {
          id: "card-2",
          type: "card",
          name: "Feature Card 2",
          parentId: "cards-container",
          importance: "medium",
          semanticRole: "surface",
          interactionCapabilities: ["hover", "press"],
          dimensions: { width: 340, height: 260 },
        },
        {
          id: "card-3",
          type: "card",
          name: "Feature Card 3",
          parentId: "cards-container",
          importance: "medium",
          semanticRole: "surface",
          interactionCapabilities: ["hover", "press"],
          dimensions: { width: 340, height: 260 },
        },
      ],
      rootId: "cards-container",
      viewportContext: { width: 1280, height: 800, isMobile: false },
    };
  }

  if (lower.includes("button") || lower.includes("tactile") || lower.includes("press") || lower.includes("click")) {
    return {
      id: "spec-tactile-btn",
      title: "Tactile Interactive Button Specification",
      elements: [
        {
          id: "btn-primary",
          type: "button",
          name: "Interactive Button",
          importance: "high",
          semanticRole: "trigger",
          dimensions: { width: 180, height: 48 },
          interactionCapabilities: ["hover", "press", "magnetic"],
        },
      ],
      rootId: "btn-primary",
      viewportContext: { width: 1280, height: 800, isMobile: false },
    };
  }

  if (lower.includes("nav") || lower.includes("menu") || lower.includes("header") || lower.includes("drawer")) {
    return {
      id: "spec-navigation",
      title: "Navigation Header Specification",
      elements: [
        {
          id: "nav-bar",
          type: "navigation",
          name: "Header Navigation",
          importance: "high",
          semanticRole: "surface",
          dimensions: { width: "100%", height: 64 },
          layout: { display: "flex", flexDir: "row", gap: 16 },
        },
        {
          id: "nav-item-1",
          type: "button",
          name: "Nav Link 1",
          parentId: "nav-bar",
          semanticRole: "trigger",
          interactionCapabilities: ["hover", "press"],
        },
        {
          id: "nav-item-2",
          type: "button",
          name: "Nav Link 2",
          parentId: "nav-bar",
          semanticRole: "trigger",
          interactionCapabilities: ["hover", "press"],
        },
        {
          id: "nav-item-3",
          type: "button",
          name: "Nav CTA Button",
          parentId: "nav-bar",
          importance: "high",
          semanticRole: "trigger",
          interactionCapabilities: ["hover", "press"],
        },
      ],
      rootId: "nav-bar",
      viewportContext: { width: 1280, height: 800, isMobile: false },
    };
  }

  if (lower.includes("hero") || lower.includes("landing") || lower.includes("heading") || lower.includes("title")) {
    return {
      id: "spec-hero-section",
      title: "Hero Section Specification",
      elements: [
        {
          id: "hero-section",
          type: "hero",
          name: "Hero Section Container",
          importance: "high",
          semanticRole: "surface",
          dimensions: { width: "100%", height: 600 },
        },
        {
          id: "hero-badge",
          type: "badge",
          name: "Pill Tag Badge",
          parentId: "hero-section",
          importance: "low",
          semanticRole: "decorative",
        },
        {
          id: "hero-title",
          type: "text",
          name: "Headline Title",
          parentId: "hero-section",
          importance: "high",
          semanticRole: "content",
          typography: { fontSize: 56, fontWeight: 800 },
        },
        {
          id: "hero-subtitle",
          type: "text",
          name: "Subheadline Description",
          parentId: "hero-section",
          importance: "medium",
          semanticRole: "content",
          typography: { fontSize: 20 },
        },
        {
          id: "hero-cta",
          type: "button",
          name: "Primary CTA Button",
          parentId: "hero-section",
          importance: "high",
          semanticRole: "trigger",
          interactionCapabilities: ["hover", "press"],
        },
      ],
      rootId: "hero-section",
      viewportContext: { width: 1280, height: 800, isMobile: false },
    };
  }

  // Default generic section
  return {
    id: "spec-interactive-section",
    title: "Interactive Section Specification",
    elements: [
      {
        id: "section-main",
        type: "section",
        name: "Main Section",
        importance: "high",
        semanticRole: "surface",
        dimensions: { width: "100%", height: 400 },
      },
      {
        id: "section-content",
        type: "card",
        name: "Content Surface",
        parentId: "section-main",
        importance: "medium",
        semanticRole: "surface",
        interactionCapabilities: ["hover", "press"],
        dimensions: { width: 420, height: 280 },
      },
    ],
    rootId: "section-main",
    viewportContext: { width: 1280, height: 800, isMobile: false },
  };
}
