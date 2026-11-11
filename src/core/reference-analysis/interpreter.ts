/**
 * AF Motion Visual Reference Interpreter
 *
 * Deterministically analyzes structured visual references, classifies visual styles
 * against the 19 supported genres, pairs with the 33 palettes and 5 Motion DNA profiles,
 * and reports confidence and uncertainty.
 */

import { BUILT_IN_PALETTE_INPUTS } from "../built-in-palettes.js";
import type { PaletteInput } from "../palettes.js";
import { visualStyleRegistry } from "../visual-style-registry.js";
import type {
  ConfidenceReport,
  DesignTokenMapping,
  MotionDNAMappingResult,
  MotionDNAPersonality,
  PaletteMappingResult,
  StyleClassificationResult,
  UncertaintyArea,
  VisualDesignInterpretation,
  VisualReferenceInput,
  VisualStyleName,
} from "./types.js";

// Lookup map for the 33 built-in palettes by slugified id and lowercase name
const PALETTE_SLUG_MAP = new Map<string, PaletteInput>();
for (const p of BUILT_IN_PALETTE_INPUTS) {
  const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  PALETTE_SLUG_MAP.set(slug, p);
  PALETTE_SLUG_MAP.set(p.name.toLowerCase(), p);
}

/**
 * Classifies the visual style based on extracted properties and keywords.
 */
function classifyVisualStyle(input: VisualReferenceInput): {
  result: StyleClassificationResult;
  uncertainties: UncertaintyArea[];
} {
  const uncertainties: UncertaintyArea[] = [];
  const text = `${input.name} ${input.description ?? ""}`.toLowerCase();
  const surfaces = input.extractedProperties?.surfaces ?? [];
  const graphics = input.extractedProperties?.graphics;

  let chosenStyle: VisualStyleName = "minimal";
  let confidence = 0.85;
  let reasoning = "Defaulted to minimal modern aesthetic based on clean layout parameters.";
  let alternatives: VisualStyleName[] = ["editorial", "swiss"];

  // 1. Surface-driven classification
  const hasGlass = surfaces.some((s) => s.kind === "glass" || (s.blur && s.blur > 4));
  const hasNeumorphic = surfaces.some((s) => s.kind === "neumorphic");
  const hasBrutalist = surfaces.some((s) => s.kind === "brutalist" || (s.borderWidth && Number(s.borderWidth) >= 3));
  const hasClay = surfaces.some((s) => s.kind === "clay");
  const hasMetallic = surfaces.some((s) => s.kind === "metallic");

  if (hasGlass || text.includes("glass") || text.includes("frosted")) {
    chosenStyle = "glassmorphism";
    confidence = 0.95;
    reasoning = "Frosted translucent surface properties and backdrop blur detected.";
    alternatives = ["minimal", "neon"];
  } else if (hasNeumorphic || text.includes("neumorphic") || text.includes("soft shadow")) {
    chosenStyle = "neumorphism";
    confidence = 0.92;
    reasoning = "Soft extruded surface treatments with paired light/dark box shadows detected.";
    alternatives = ["claymorphism", "minimal"];
  } else if (hasBrutalist || text.includes("brutalist") || text.includes("neobrutalism")) {
    chosenStyle = "brutalist";
    confidence = 0.94;
    reasoning = "High-contrast thick borders, stark geometric layouts, and heavy shadow offsets detected.";
    alternatives = ["bauhaus", "swiss"];
  } else if (hasClay || text.includes("clay") || text.includes("pillowy")) {
    chosenStyle = "claymorphism";
    confidence = 0.9;
    reasoning = "Rounded pillowy surfaces with high border radius and pastel inner depth.";
    alternatives = ["neumorphism", "minimal"];
  } else if (text.includes("cyberpunk") || text.includes("sci-fi") || text.includes("hud")) {
    chosenStyle = "cyberpunk";
    confidence = 0.95;
    reasoning = "High-tech futuristic visual cues, neon accents, and dark base detected.";
    alternatives = ["neon", "vaporwave"];
  } else if (text.includes("editorial") || text.includes("magazine") || text.includes("typography")) {
    chosenStyle = "editorial";
    confidence = 0.92;
    reasoning = "Serif typography prominence and generous whitespace margins detected.";
    alternatives = ["swiss", "minimal"];
  } else if (text.includes("aurora") || graphics?.effectType === "aurora") {
    chosenStyle = "aurora";
    confidence = 0.94;
    reasoning = "Flowing multi-color mesh gradient and ambient curtain lighting detected.";
    alternatives = ["liquid", "neon"];
  } else if (hasMetallic || text.includes("steampunk")) {
    chosenStyle = "steampunk";
    confidence = 0.88;
    reasoning = "Metallic bronze/brass surface tokens and ornate industrial details.";
    alternatives = ["skeuomorphism", "retro-computing"];
  } else if (!input.extractedProperties?.surfaces && !input.description) {
    confidence = 0.55;
    uncertainties.push({
      property: "visualStyle",
      reason: "No surfaces or descriptive text supplied in reference input",
      assumedDefault: "minimal",
      confidence: 0.55,
    });
  }

  const KNOWN_REFERENCE_STYLES = new Set([
    "minimal",
    "glassmorphism",
    "brutalist",
    "brutalism",
    "neumorphism",
    "claymorphism",
    "cyberpunk",
    "editorial",
    "swiss",
    "bauhaus",
    "aurora",
    "steampunk",
    "skeuomorphism",
    "vaporwave",
    "psychedelic",
    "liquid",
    "neon",
    "retro-computing",
  ]);

  if (!visualStyleRegistry.hasVisualStyle(chosenStyle) && !KNOWN_REFERENCE_STYLES.has(chosenStyle)) {
    chosenStyle = "minimal";
  }

  return {
    result: {
      style: chosenStyle,
      confidence,
      reasoning,
      alternatives,
    },
    uncertainties,
  };
}

/**
 * Matches extracted color roles or dominant colors to one of the 33 built-in palettes.
 */
function matchPalette(
  input: VisualReferenceInput,
  classifiedStyle: VisualStyleName
): { result: PaletteMappingResult; uncertainties: UncertaintyArea[] } {
  const uncertainties: UncertaintyArea[] = [];
  const extProps = input.extractedProperties;
  const paletteHint = extProps?.paletteName?.toLowerCase();

  // Direct palette name match if requested
  if (paletteHint && PALETTE_SLUG_MAP.has(paletteHint)) {
    const p = PALETTE_SLUG_MAP.get(paletteHint)!;
    const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    return {
      result: {
        matchedPaletteId: slug,
        matchedPaletteName: p.name,
        colors: {
          primary: p.primary,
          secondary: p.secondary,
          accent: p.accent,
        },
        confidence: 0.98,
      },
      uncertainties,
    };
  }

  // Style-directed default palette pairing from the 33 built-in palettes
  let matchedSlug = "cobalt-classic";
  let confidence = 0.85;

  switch (classifiedStyle) {
    case "cyberpunk":
    case "neon":
      matchedSlug = "neon-abyss";
      confidence = 0.92;
      break;
    case "vaporwave":
    case "psychedelic":
      matchedSlug = "chromatic-riot";
      confidence = 0.9;
      break;
    case "brutalist":
    case "swiss":
    case "bauhaus":
      matchedSlug = "primary-pop";
      confidence = 0.91;
      break;
    case "editorial":
      matchedSlug = "ember-editorial";
      confidence = 0.88;
      break;
    case "aurora":
    case "liquid":
      matchedSlug = "electric-teal";
      confidence = 0.89;
      break;
    case "steampunk":
    case "skeuomorphism":
      matchedSlug = "burnt-chocolate";
      confidence = 0.88;
      break;
    case "neumorphism":
    case "claymorphism":
      matchedSlug = "amber-frost";
      confidence = 0.87;
      break;
    default:
      matchedSlug = "cobalt-classic";
      confidence = 0.82;
      break;
  }

  if (!extProps?.dominantColors && !extProps?.colorRoles) {
    confidence = 0.6;
    uncertainties.push({
      property: "palette",
      reason: "No dominant colors or color roles extracted from reference",
      assumedDefault: matchedSlug,
      confidence: 0.6,
    });
  }

  const p = PALETTE_SLUG_MAP.get(matchedSlug) ?? BUILT_IN_PALETTE_INPUTS[0];
  const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  const colors: Record<string, string> = {
    primary: p.primary,
    secondary: p.secondary,
    accent: p.accent,
    background: p.primary === "#111111" || p.primary === "#0A0A0A" ? "#0F0F12" : "#FFFFFF",
    surface: p.primary === "#111111" || p.primary === "#0A0A0A" ? "#18181D" : "#F4F4F6",
    text: p.primary === "#111111" || p.primary === "#0A0A0A" ? "#FFFFFF" : "#111111",
  };

  // Merge extracted color roles if provided
  if (extProps?.colorRoles) {
    for (const role of extProps.colorRoles) {
      colors[role.role] = role.value;
    }
  }

  return {
    result: {
      matchedPaletteId: slug,
      matchedPaletteName: p.name,
      colors,
      confidence,
    },
    uncertainties,
  };
}

/**
 * Maps motion characteristics to one of the 5 Motion DNA profiles.
 */
function matchMotionDNA(
  input: VisualReferenceInput,
  classifiedStyle: VisualStyleName
): { result: MotionDNAMappingResult; uncertainties: UncertaintyArea[] } {
  const uncertainties: UncertaintyArea[] = [];
  const motionProps = input.extractedProperties?.motion;
  const text = `${input.name} ${input.description ?? ""}`.toLowerCase();

  let dna: MotionDNAPersonality = "precise";
  let timingMultiplier = 1.0;
  let confidence = 0.85;
  let reasoning = "Mapped from component density and clean functional requirements.";

  const hasSnappy = motionProps?.feel === "snappy" || text.includes("snappy") || text.includes("fast");
  const hasBouncy = motionProps?.feel === "bouncy" || text.includes("bouncy");
  const hasSmooth = motionProps?.feel === "smooth" || text.includes("smooth");

  if (hasSnappy || classifiedStyle === "cyberpunk" || classifiedStyle === "brutalist") {
    dna = "energetic";
    timingMultiplier = 0.8;
    confidence = 0.92;
    reasoning = "High-energy snappy motion with shortened durations matching fast visual theme.";
  } else if (hasBouncy || classifiedStyle === "claymorphism") {
    dna = "playful";
    timingMultiplier = 1.15;
    confidence = 0.9;
    reasoning = "Bouncy spring curves and playful overshoot detected.";
  } else if (hasSmooth || classifiedStyle === "glassmorphism" || classifiedStyle === "aurora") {
    dna = "elegant";
    timingMultiplier = 1.1;
    confidence = 0.91;
    reasoning = "Silky gradual easing matching luminous translucent surfaces.";
  } else if (classifiedStyle === "editorial" || motionProps?.hasParallax || text.includes("editorial")) {
    dna = "editorial-flow";
    timingMultiplier = 1.25;
    confidence = 0.89;
    reasoning = "Expansive scroll-driven storytelling pacing with deliberate easing.";
  }

  if (!motionProps && !text.includes("motion") && !text.includes("animation")) {
    confidence = 0.65;
    uncertainties.push({
      property: "motionDNA",
      reason: "No explicit motion characteristics supplied in reference; derived from style context",
      assumedDefault: dna,
      confidence: 0.65,
    });
  }

  return {
    result: {
      matchedDNA: dna,
      timingMultiplier,
      confidence,
      reasoning,
    },
    uncertainties,
  };
}

/**
 * Derives concrete design tokens based on classification and palette.
 */
function deriveDesignTokens(
  input: VisualReferenceInput,
  palette: PaletteMappingResult,
  style: VisualStyleName
): DesignTokenMapping {
  const extProps = input.extractedProperties;

  // Radii
  const radii: Record<string, string> = {
    sm: "4px",
    md: "8px",
    lg: "16px",
    full: "9999px",
  };
  if (style === "brutalist" || style === "bauhaus" || style === "swiss") {
    radii.sm = "0px";
    radii.md = "0px";
    radii.lg = "0px";
  } else if (style === "claymorphism") {
    radii.sm = "12px";
    radii.md = "20px";
    radii.lg = "32px";
  }

  // Shadows
  const shadows: Record<string, string> = {
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
  };
  if (style === "brutalist") {
    shadows.sm = "2px 2px 0px #000000";
    shadows.md = "4px 4px 0px #000000";
    shadows.lg = "8px 8px 0px #000000";
    shadows.card = "6px 6px 0px #000000";
  } else if (style === "neumorphism") {
    shadows.sm = "3px 3px 6px rgba(0,0,0,0.1), -3px -3px 6px rgba(255,255,255,0.7)";
    shadows.md = "6px 6px 12px rgba(0,0,0,0.12), -6px -6px 12px rgba(255,255,255,0.8)";
    shadows.card = "8px 8px 16px rgba(0,0,0,0.15), -8px -8px 16px rgba(255,255,255,0.85)";
  } else if (style === "glassmorphism") {
    shadows.card = "0 8px 32px 0 rgba(31, 38, 135, 0.37)";
  }

  // Typography
  const typo = extProps?.typography;
  const fonts: Record<string, string> = {
    heading: typo?.headingFont ?? (style === "editorial" ? "Georgia, serif" : "Inter, sans-serif"),
    body: typo?.bodyFont ?? "Inter, sans-serif",
    code: typo?.codeFont ?? "JetBrains Mono, monospace",
  };

  // Spacing
  const spacing: Record<string, string> = {
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "48px",
  };

  return {
    colors: palette.colors,
    radii,
    shadows,
    spacing,
    fonts,
  };
}

/**
 * Interprets a structured visual reference input into a validated visual design interpretation.
 */
export function interpretVisualReference(
  input: VisualReferenceInput
): VisualDesignInterpretation {
  const { result: styleClassification, uncertainties: styleUncertainties } =
    classifyVisualStyle(input);

  const { result: paletteMapping, uncertainties: paletteUncertainties } =
    matchPalette(input, styleClassification.style);

  const { result: motionDNA, uncertainties: motionUncertainties } =
    matchMotionDNA(input, styleClassification.style);

  const designTokens = deriveDesignTokens(input, paletteMapping, styleClassification.style);

  // Compile capabilities required
  const capabilities: string[] = ["core-animate", "recommendAnimation"];
  if (styleClassification.style === "glassmorphism") capabilities.push("GlassSurface");
  if (input.extractedProperties?.motion?.hasSpringFeedback) capabilities.push("useMicrointeraction", "Interactive");
  if (input.extractedProperties?.motion?.hasParallax) capabilities.push("useParallax", "useScrollProgress");
  if (input.extractedProperties?.graphics?.hasBackgroundEffect) capabilities.push("aurora", "particleField");
  if (input.extractedProperties?.scene3D?.has3DScene) capabilities.push("Scene3DView", "generate3DSceneFromIntent");

  const allUncertainties = [
    ...styleUncertainties,
    ...paletteUncertainties,
    ...motionUncertainties,
  ];

  const overallScore = Math.round(
    ((styleClassification.confidence + paletteMapping.confidence + motionDNA.confidence) / 3) * 100
  ) / 100;

  const confidenceReport: ConfidenceReport = {
    overallScore,
    styleConfidence: styleClassification.confidence,
    paletteConfidence: paletteMapping.confidence,
    motionConfidence: motionDNA.confidence,
    uncertaintyAreas: allUncertainties,
  };

  return {
    referenceName: input.name,
    styleClassification,
    paletteMapping,
    motionDNA,
    designTokens,
    surfaces: input.extractedProperties?.surfaces ?? [],
    layout: input.extractedProperties?.layout ?? { type: "single-column", alignment: "center" },
    graphics: input.extractedProperties?.graphics,
    scene3D: input.extractedProperties?.scene3D,
    capabilitiesRequired: [...new Set(capabilities)],
    confidenceReport,
  };
}
