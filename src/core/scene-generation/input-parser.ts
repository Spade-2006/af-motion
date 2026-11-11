/**
 * AF Motion AI Scene Input Parser (Prompt 143)
 *
 * Normalizes natural-language scene descriptions, structured scene specifications,
 * and design tokens into a validated, deterministic scene input representation.
 */

import type {
  AISceneGenerationInput,
  SceneCategory,
  StructuredSceneSpecification,
  MotionDNAPersonalityOption,
} from "./types.js";
import { BUILT_IN_PALETTE_INPUTS } from "../built-in-palettes.js";

export interface NormalizedSceneInput {
  readonly rawPrompt?: string;
  readonly category: SceneCategory;
  readonly motionDNA: MotionDNAPersonalityOption;
  readonly paletteName: string;
  readonly paletteColors: {
    readonly primary: string;
    readonly secondary: string;
    readonly accent: string;
    readonly background: string;
  };
  readonly timingMultiplier: number;
  readonly reducedMotion: boolean;
  readonly partialSpec?: Partial<StructuredSceneSpecification>;
  readonly validationIssues: readonly string[];
}

export function parseAndNormalizeSceneInput(input: AISceneGenerationInput): NormalizedSceneInput {
  const issues: string[] = [];

  // 1. Extract prompt
  let rawPrompt: string | undefined;
  if (typeof input.naturalLanguage === "string") {
    rawPrompt = input.naturalLanguage.trim();
  } else if (input.naturalLanguage?.prompt) {
    rawPrompt = input.naturalLanguage.prompt.trim();
  }

  // 2. Resolve Category
  const category = resolveCategory(input, rawPrompt);

  // 3. Resolve Palette
  const requestedPalette = input.paletteName ||
    (typeof input.naturalLanguage !== "string" ? input.naturalLanguage?.targetPalette : undefined) ||
    "Cobalt Classic";

  const matchedPalette = BUILT_IN_PALETTE_INPUTS.find(
    (p) => p.name.toLowerCase() === requestedPalette.toLowerCase()
  ) || BUILT_IN_PALETTE_INPUTS[0];

  // 4. Resolve Motion DNA
  const requestedDNA = input.motionDNA ||
    (typeof input.naturalLanguage !== "string" ? input.naturalLanguage?.targetDNA : undefined) ||
    resolveDNAFromPrompt(rawPrompt) ||
    "precise";

  // 5. Timing Multiplier & Reduced Motion
  const timingMultiplier =
    typeof input.timingMultiplier === "number" &&
    Number.isFinite(input.timingMultiplier) &&
    input.timingMultiplier > 0 &&
    input.timingMultiplier <= 20
      ? input.timingMultiplier
      : 1.0;
  const reducedMotion = Boolean(input.reducedMotion);

  return {
    rawPrompt,
    category,
    motionDNA: requestedDNA,
    paletteName: matchedPalette.name,
    paletteColors: {
      primary: matchedPalette.primary,
      secondary: matchedPalette.secondary,
      accent: matchedPalette.accent,
      background: "#0B0F19",
    },
    timingMultiplier,
    reducedMotion,
    partialSpec: input.specification,
    validationIssues: issues,
  };
}

function resolveCategory(input: AISceneGenerationInput, prompt?: string): SceneCategory {
  if (input.specification?.category) {
    return input.specification.category;
  }
  if (typeof input.naturalLanguage !== "string" && input.naturalLanguage?.categoryHint) {
    return input.naturalLanguage.categoryHint;
  }
  if (!prompt) return "hero";

  const p = prompt.toLowerCase();
  if (p.includes("hero") || p.includes("landing")) {
    return "hero";
  }
  if (p.includes("product") || p.includes("showcase") || p.includes("pedestal")) {
    return "product-showcase";
  }
  if (p.includes("physics") || p.includes("collision") || p.includes("gravity") || p.includes("rigid")) {
    return "physics-playground";
  }
  if (p.includes("particle") || p.includes("ambient") || p.includes("nebula")) {
    return "particle-environment";
  }
  if (p.includes("portfolio") || p.includes("gallery") || p.includes("exhibition")) {
    return "portfolio";
  }
  if (p.includes("cinematic") || p.includes("camera") || p.includes("movie")) {
    return "cinematic-sequence";
  }
  if (p.includes("scroll") || p.includes("story") || p.includes("timeline")) {
    return "scroll-storytelling";
  }
  if (p.includes("3d") || p.includes("world") || p.includes("terrain")) {
    return "3d-world";
  }
  if (p.includes("interactive") || p.includes("dashboard") || p.includes("interface")) {
    return "interactive-interface";
  }
  return "hero";
}

function resolveDNAFromPrompt(prompt?: string): MotionDNAPersonalityOption | null {
  if (!prompt) return null;
  const p = prompt.toLowerCase();
  if (p.includes("bouncy") || p.includes("playful") || p.includes("fun") || p.includes("squash")) return "playful";
  if (p.includes("stately") || p.includes("elegant") || p.includes("luxury") || p.includes("gentle")) return "elegant";
  if (p.includes("energetic") || p.includes("fast") || p.includes("punchy") || p.includes("snappy")) return "energetic";
  if (p.includes("editorial") || p.includes("story") || p.includes("typography")) return "editorial-flow";
  if (p.includes("precise") || p.includes("crisp") || p.includes("sharp")) return "precise";
  return null;
}
