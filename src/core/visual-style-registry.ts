/**
 * AF Motion Visual Style Registry & Schema Foundation
 *
 * Centralized, extensible, framework-independent registry and compatibility engine
 * for visual design styles, establishing the design language foundation for AF Motion.
 */

import {
  type UnifiedMotionSchema,
  createUnifiedSchema,
} from "./schema.js";

export const VISUAL_STYLE_SCHEMA_SPEC_VERSION = "1.0.0";

export type VisualStyleCategory =
  | "retro"
  | "skeuomorphic"
  | "modernist"
  | "experimental"
  | "expressive"
  | "dimensional"
  | "traditional"
  | "minimal"
  | "cyber";

export interface VisualStyleTypography {
  readonly headingFont: string;
  readonly bodyFont: string;
  readonly scaleRatio: number;
  readonly fontWeights: {
    readonly heading: number | string;
    readonly body: number | string;
  };
  readonly letterSpacing?: string;
  readonly textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
  readonly lineHeights?: {
    readonly heading: number | string;
    readonly body: number | string;
  };
}

export interface VisualStyleShapeLanguage {
  readonly cornerRadius: string;
  readonly borderWidth: string;
  readonly borderStyle: "solid" | "dashed" | "dotted" | "double" | "none";
  readonly geometricTendency: "sharp" | "rounded" | "fluid" | "organic" | "rigid" | "distorted";
  readonly aspectRatios?: readonly string[];
}

export interface VisualStyleLayout {
  readonly density: "compact" | "normal" | "spacious" | "dense";
  readonly gridStructure: "strict" | "asymmetric" | "broken" | "dense" | "minimal";
  readonly alignment: "left" | "center" | "justified" | "off-grid";
  readonly whitespaceRule: "generous" | "tight" | "chaotic" | "structured";
}

export interface VisualStyleGraphics {
  readonly iconography: "line" | "solid" | "duotone" | "realistic" | "abstract" | "hand-drawn";
  readonly borders: "clean" | "heavy" | "ornate" | "embossed" | "glitched" | "none";
  readonly dividers: "subtle" | "prominent" | "decorative" | "none";
  readonly decorativeElements: readonly string[];
}

export interface VisualStyleTextures {
  readonly primaryTexture: "none" | "noise" | "grain" | "paper" | "metallic" | "glass" | "halftone" | "mesh" | "leather" | "wood" | "fabric";
  readonly patternStyle: "none" | "geometric" | "dots" | "stripes" | "organic" | "wood" | "circuit" | "mesh" | "abstract";
  readonly intensity: number;
}

export interface VisualStyleSurfaces {
  readonly materialType: "flat" | "plastic" | "glass" | "paper" | "metal" | "clay" | "liquid" | "holographic";
  readonly opacity: number;
  readonly blur: string;
  readonly backdropFilter?: string;
}

export interface VisualStyleLighting {
  readonly lightSource: "top-left" | "top" | "center" | "ambient" | "harsh-direct" | "neon" | "diffuse";
  readonly shadowStyle: "none" | "soft" | "hard" | "inner" | "layered" | "glow" | "colored";
  readonly elevationLevels: readonly string[];
  readonly highlights: boolean;
}

export interface VisualStyleBackground {
  readonly primaryTreatment: "solid" | "gradient" | "pattern" | "canvas" | "textured";
  readonly compatibleBackgroundCapabilities: readonly string[];
  readonly recommendedBackground: string;
  readonly overlay?: string;
}

export interface VisualStyleComponents {
  readonly buttonTreatment: {
    readonly borderRadius: string;
    readonly shadow: string;
    readonly border: string;
    readonly hoverTransform: string;
  };
  readonly cardTreatment: {
    readonly borderRadius: string;
    readonly shadow: string;
    readonly border: string;
    readonly background: string;
  };
  readonly inputTreatment: {
    readonly borderRadius: string;
    readonly border: string;
    readonly focusRing: string;
  };
}

export interface VisualStyleMotion {
  readonly compatibleMotionDNA: readonly string[];
  readonly recommendedPresets: readonly string[];
  readonly animationIntensity: "subtle" | "moderate" | "expressive" | "dramatic";
  readonly transitionPacing: "snappy" | "smooth" | "measured" | "elastic";
}

export interface VisualStyleGraphicsCompatibility {
  readonly canvasSupported: boolean;
  readonly svgPreferred: boolean;
  readonly blendingModes: readonly string[];
}

export interface VisualStyleThreeDCompatibility {
  readonly depthLevel: "flat" | "2.5d" | "pseudo-3d" | "full-3d";
  readonly cameraAngle: "isometric" | "perspective" | "orthographic" | "front";
  readonly lightingModel: "flat" | "phong" | "pbr" | "unlit" | "matcap" | "diffuse";
  readonly materialReflectivity: number;
}

export interface VisualStyleResponsive {
  readonly mobileAdaptations: readonly string[];
  readonly breakpointStrategy: "desktop-first" | "mobile-first" | "fluid";
}

export interface VisualStyleAccessibility {
  readonly contrastTarget: "AA" | "AAA";
  readonly reducedMotionBehavior: "disable-transforms" | "fade-only" | "static-fallback";
  readonly readabilityNotes: string;
}

export interface VisualStyleReactMetadata {
  readonly recommendedComponents: readonly string[];
  readonly cssVariablesPrefix: string;
  readonly styleProperties: Readonly<Record<string, string>>;
}

export interface VisualStyleDefinition {
  readonly id: string;
  readonly version: string;
  readonly name: string;
  readonly description: string;
  readonly category: VisualStyleCategory;
  readonly philosophy: string;
  readonly personality: readonly string[];
  readonly recommendedPalettes: readonly string[];
  readonly typography: VisualStyleTypography;
  readonly shapeLanguage: VisualStyleShapeLanguage;
  readonly layout: VisualStyleLayout;
  readonly graphics: VisualStyleGraphics;
  readonly textures: VisualStyleTextures;
  readonly surfaces: VisualStyleSurfaces;
  readonly lighting: VisualStyleLighting;
  readonly background: VisualStyleBackground;
  readonly components: VisualStyleComponents;
  readonly motion: VisualStyleMotion;
  readonly graphicsCompatibility: VisualStyleGraphicsCompatibility;
  readonly threeDCompatibility: VisualStyleThreeDCompatibility;
  readonly responsive: VisualStyleResponsive;
  readonly accessibility: VisualStyleAccessibility;
  readonly react: VisualStyleReactMetadata;
  readonly examples: readonly string[];
  readonly tags: readonly string[];
  readonly custom?: boolean;
}

export interface VisualStyleFilter {
  readonly category?: VisualStyleCategory;
  readonly tag?: string;
  readonly palette?: string;
  readonly motionDNA?: string;
  readonly backgroundCapability?: string;
  readonly depthLevel?: "flat" | "2.5d" | "pseudo-3d" | "full-3d";
}

export interface StyleCompatibilityContext {
  readonly paletteId?: string;
  readonly paletteName?: string;
  readonly motionDNA?: string;
  readonly backgroundCapability?: string;
  readonly designSystem?: string;
  readonly threeDDepth?: string;
  readonly accessibilityStrict?: boolean;
}

export interface StyleConflict {
  readonly type: "palette" | "motion" | "background" | "3d" | "accessibility";
  readonly message: string;
  readonly severity: "warning" | "error";
  readonly resolution?: string;
}

export interface StyleCompatibilityReport {
  readonly compatible: boolean;
  readonly score: number;
  readonly conflicts: readonly StyleConflict[];
  readonly recommendations: readonly string[];
  readonly suggestedPalettes: readonly string[];
  readonly suggestedMotionDNA: readonly string[];
  readonly suggestedBackgrounds: readonly string[];
}

export interface ResolvedVisualStyle {
  readonly styleId: string;
  readonly styleName: string;
  readonly category: VisualStyleCategory;
  readonly palette: {
    readonly name: string;
    readonly primary: string;
    readonly secondary: string;
    readonly accent: string;
    readonly background: string;
    readonly surface: string;
  };
  readonly typography: VisualStyleTypography;
  readonly shapeLanguage: VisualStyleShapeLanguage;
  readonly surfaces: VisualStyleSurfaces;
  readonly lighting: VisualStyleLighting;
  readonly background: VisualStyleBackground;
  readonly components: VisualStyleComponents;
  readonly motion: VisualStyleMotion;
  readonly responsive: VisualStyleResponsive;
  readonly accessibility: VisualStyleAccessibility;
  readonly cssVariables: Readonly<Record<string, string>>;
}

export interface VisualStyleRegistry {
  registerVisualStyle(style: VisualStyleDefinition, options?: { override?: boolean }): void;
  unregisterVisualStyle(id: string): boolean;
  getVisualStyle(id: string): VisualStyleDefinition | undefined;
  hasVisualStyle(id: string): boolean;
  listVisualStyles(filter?: VisualStyleFilter): readonly VisualStyleDefinition[];
  searchVisualStyles(query: string): readonly VisualStyleDefinition[];
  getCompatibleStyles(context: StyleCompatibilityContext): readonly VisualStyleDefinition[];
  registerCustomVisualStyle(style: VisualStyleDefinition): void;
  validateVisualStyleDefinition(style: unknown): { valid: boolean; errors: string[] };
  exportVisualStylesJson(options?: { pretty?: boolean }): string;
  importVisualStylesFromJson(json: string, options?: { override?: boolean }): { imported: number; errors: string[] };
  subscribe(listener: () => void): () => void;
  getVersion(): number;
  count(): number;
  getCategories(): readonly VisualStyleCategory[];
  getTags(): readonly string[];
  reset(): void;
}

// -------------------------------------------------------------------------------------------------
// Foundation Definitions for the 19 Visual Styles
// -------------------------------------------------------------------------------------------------

const BUILT_IN_STYLES: readonly VisualStyleDefinition[] = [
  {
    id: "skeuomorphism",
    version: "1.0.0",
    name: "Skeuomorphism",
    description: "Realistic digital emulation of physical textures, materials, bevels, gloss, and leather.",
    category: "skeuomorphic",
    philosophy: "Ground digital interactions in tangible, physical-world metaphors to provide intuitive affordances.",
    personality: ["tactile", "physical", "crafted", "nostalgic", "detailed"],
    recommendedPalettes: ["Earth & Amber", "Cobalt Classic", "Burnt Chocolate", "Earthbound"],
    typography: {
      headingFont: "Georgia, serif",
      bodyFont: "system-ui, -apple-system, sans-serif",
      scaleRatio: 1.25,
      fontWeights: { heading: 700, body: 400 },
      letterSpacing: "0px",
    },
    shapeLanguage: {
      cornerRadius: "8px",
      borderWidth: "1px",
      borderStyle: "solid",
      geometricTendency: "rounded",
    },
    layout: {
      density: "normal",
      gridStructure: "strict",
      alignment: "left",
      whitespaceRule: "structured",
    },
    graphics: {
      iconography: "realistic",
      borders: "embossed",
      dividers: "decorative",
      decorativeElements: ["drop-shadows", "bevels", "insets", "highlights"],
    },
    textures: {
      primaryTexture: "leather",
      patternStyle: "organic",
      intensity: 0.6,
    },
    surfaces: {
      materialType: "metal",
      opacity: 1,
      blur: "0px",
    },
    lighting: {
      lightSource: "top",
      shadowStyle: "layered",
      elevationLevels: [
        "0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.6)",
        "0 4px 8px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.7)",
      ],
      highlights: true,
    },
    background: {
      primaryTreatment: "textured",
      compatibleBackgroundCapabilities: ["bg-noise", "bg-atmospheric"],
      recommendedBackground: "bg-noise",
    },
    components: {
      buttonTreatment: {
        borderRadius: "6px",
        shadow: "0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.8)",
        border: "1px solid rgba(0,0,0,0.3)",
        hoverTransform: "translateY(1px)",
      },
      cardTreatment: {
        borderRadius: "8px",
        shadow: "0 4px 12px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.5)",
        border: "1px solid rgba(0,0,0,0.2)",
        background: "linear-gradient(to bottom, #ffffff, #e6e6e6)",
      },
      inputTreatment: {
        borderRadius: "4px",
        border: "1px solid rgba(0,0,0,0.4)",
        focusRing: "inset 0 1px 3px rgba(0,0,0,0.5), 0 0 5px rgba(0,71,171,0.5)",
      },
    },
    motion: {
      compatibleMotionDNA: ["dna-calm", "dna-cinematic"],
      recommendedPresets: ["preset-fade-in"],
      animationIntensity: "subtle",
      transitionPacing: "measured",
    },
    graphicsCompatibility: {
      canvasSupported: true,
      svgPreferred: true,
      blendingModes: ["multiply", "overlay"],
    },
    threeDCompatibility: {
      depthLevel: "2.5d",
      cameraAngle: "perspective",
      lightingModel: "phong",
      materialReflectivity: 0.6,
    },
    responsive: {
      mobileAdaptations: ["reduce-bevel-intensity", "simplify-textures"],
      breakpointStrategy: "desktop-first",
    },
    accessibility: {
      contrastTarget: "AA",
      reducedMotionBehavior: "fade-only",
      readabilityNotes: "Ensure simulated textures and insets do not reduce text contrast below 4.5:1.",
    },
    react: {
      recommendedComponents: ["Button", "Card", "Input", "Panel"],
      cssVariablesPrefix: "--af-style-skeuomorphism",
      styleProperties: {
        "--af-surface-bevel": "inset 0 1px 0 rgba(255,255,255,0.6)",
        "--af-surface-shadow": "0 2px 5px rgba(0,0,0,0.35)",
      },
    },
    examples: ["Glossy button", "Embossed badge", "Stitched leather card"],
    tags: ["tactile", "retro", "physical", "apple-ios6", "realistic"],
  },
  {
    id: "neumorphism",
    version: "1.0.0",
    name: "Neumorphism",
    description: "Soft UI featuring subtle extruded shapes created by paired light and dark drop shadows on monochromatic surfaces.",
    category: "skeuomorphic",
    philosophy: "Create continuous, extruded surfaces where UI elements emerge from and recede into the canvas.",
    personality: ["soft", "minimal", "clean", "futuristic", "serene"],
    recommendedPalettes: ["Platinum Mocha", "Silver Signal", "Sage & Olive", "Earthbound"],
    typography: {
      headingFont: "Inter, system-ui, sans-serif",
      bodyFont: "Inter, system-ui, sans-serif",
      scaleRatio: 1.25,
      fontWeights: { heading: 600, body: 400 },
      letterSpacing: "-0.01em",
    },
    shapeLanguage: {
      cornerRadius: "16px",
      borderWidth: "0px",
      borderStyle: "none",
      geometricTendency: "rounded",
    },
    layout: {
      density: "spacious",
      gridStructure: "strict",
      alignment: "left",
      whitespaceRule: "generous",
    },
    graphics: {
      iconography: "line",
      borders: "none",
      dividers: "subtle",
      decorativeElements: ["extruded-surfaces", "debossed-wells", "concave-curves"],
    },
    textures: {
      primaryTexture: "none",
      patternStyle: "none",
      intensity: 0,
    },
    surfaces: {
      materialType: "plastic",
      opacity: 1,
      blur: "0px",
    },
    lighting: {
      lightSource: "top-left",
      shadowStyle: "layered",
      elevationLevels: [
        "4px 4px 10px rgba(163,177,198,0.6), -4px -4px 10px rgba(255,255,255,0.8)",
        "8px 8px 16px rgba(163,177,198,0.7), -8px -8px 16px rgba(255,255,255,0.9)",
      ],
      highlights: true,
    },
    background: {
      primaryTreatment: "solid",
      compatibleBackgroundCapabilities: ["bg-spotlight", "bg-gradient"],
      recommendedBackground: "bg-spotlight",
    },
    components: {
      buttonTreatment: {
        borderRadius: "12px",
        shadow: "5px 5px 10px rgba(163,177,198,0.6), -5px -5px 10px rgba(255,255,255,0.8)",
        border: "none",
        hoverTransform: "scale(0.98)",
      },
      cardTreatment: {
        borderRadius: "20px",
        shadow: "10px 10px 20px rgba(163,177,198,0.5), -10px -10px 20px rgba(255,255,255,0.9)",
        border: "none",
        background: "#e0e5ec",
      },
      inputTreatment: {
        borderRadius: "10px",
        border: "none",
        focusRing: "inset 4px 4px 8px rgba(163,177,198,0.7), inset -4px -4px 8px rgba(255,255,255,0.9)",
      },
    },
    motion: {
      compatibleMotionDNA: ["dna-calm", "dna-snappy"],
      recommendedPresets: ["preset-fade-in"],
      animationIntensity: "subtle",
      transitionPacing: "smooth",
    },
    graphicsCompatibility: {
      canvasSupported: false,
      svgPreferred: true,
      blendingModes: ["normal"],
    },
    threeDCompatibility: {
      depthLevel: "2.5d",
      cameraAngle: "front",
      lightingModel: "diffuse",
      materialReflectivity: 0.1,
    },
    responsive: {
      mobileAdaptations: ["decrease-blur-radius", "increase-contrast-borders"],
      breakpointStrategy: "fluid",
    },
    accessibility: {
      contrastTarget: "AA",
      reducedMotionBehavior: "disable-transforms",
      readabilityNotes: "Requires explicit high-contrast borders in accessibility mode to meet WCAG AA.",
    },
    react: {
      recommendedComponents: ["NeumorphicButton", "NeumorphicCard", "NeumorphicInput"],
      cssVariablesPrefix: "--af-style-neumorphism",
      styleProperties: {
        "--af-neumorphic-light-shadow": "-6px -6px 14px rgba(255,255,255,0.9)",
        "--af-neumorphic-dark-shadow": "6px 6px 14px rgba(163,177,198,0.6)",
      },
    },
    examples: ["Soft extruded toggle", "Recessed slider well", "Floating pill switch"],
    tags: ["soft-ui", "extruded", "monochrome", "minimal", "calm"],
  },
  {
    id: "art-nouveau",
    version: "1.0.0",
    name: "Art Nouveau",
    description: "Flowing organic rhythms, sinuous whiplash curves, nature-inspired motifs, and ornate elegance.",
    category: "traditional",
    philosophy: "Harmonize decorative organic elegance with functional structure, inspired by natural flora and botanical fluidity.",
    personality: ["elegant", "organic", "ornate", "botanical", "flowing"],
    recommendedPalettes: ["Sage & Olive", "Forest Lavender", "Mauve Terracotta", "Emerald Vermilion"],
    typography: {
      headingFont: "Cinzel Decorative, Playfair Display, serif",
      bodyFont: "EB Garamond, Georgia, serif",
      scaleRatio: 1.333,
      fontWeights: { heading: 600, body: 400 },
      letterSpacing: "0.04em",
    },
    shapeLanguage: {
      cornerRadius: "24px",
      borderWidth: "1.5px",
      borderStyle: "solid",
      geometricTendency: "organic",
    },
    layout: {
      density: "spacious",
      gridStructure: "asymmetric",
      alignment: "center",
      whitespaceRule: "generous",
    },
    graphics: {
      iconography: "hand-drawn",
      borders: "ornate",
      dividers: "decorative",
      decorativeElements: ["whiplash-curves", "floral-vines", "tendril-frames", "leaf-motifs"],
    },
    textures: {
      primaryTexture: "paper",
      patternStyle: "organic",
      intensity: 0.4,
    },
    surfaces: {
      materialType: "paper",
      opacity: 0.95,
      blur: "0px",
    },
    lighting: {
      lightSource: "ambient",
      shadowStyle: "soft",
      elevationLevels: ["0 4px 16px rgba(45,35,25,0.1)"],
      highlights: false,
    },
    background: {
      primaryTreatment: "pattern",
      compatibleBackgroundCapabilities: ["bg-atmospheric", "bg-fluid"],
      recommendedBackground: "bg-fluid",
    },
    components: {
      buttonTreatment: {
        borderRadius: "9999px",
        shadow: "0 2px 8px rgba(0,0,0,0.1)",
        border: "1.5px solid #2e4a36",
        hoverTransform: "translateY(-1px)",
      },
      cardTreatment: {
        borderRadius: "24px",
        shadow: "0 8px 24px rgba(0,0,0,0.06)",
        border: "1px solid rgba(46,74,54,0.2)",
        background: "#faf7f2",
      },
      inputTreatment: {
        borderRadius: "16px",
        border: "1.5px solid rgba(46,74,54,0.3)",
        focusRing: "0 0 0 3px rgba(46,74,54,0.15)",
      },
    },
    motion: {
      compatibleMotionDNA: ["dna-calm", "dna-cinematic"],
      recommendedPresets: ["preset-fade-in"],
      animationIntensity: "moderate",
      transitionPacing: "smooth",
    },
    graphicsCompatibility: {
      canvasSupported: true,
      svgPreferred: true,
      blendingModes: ["multiply"],
    },
    threeDCompatibility: {
      depthLevel: "flat",
      cameraAngle: "front",
      lightingModel: "flat",
      materialReflectivity: 0,
    },
    responsive: {
      mobileAdaptations: ["hide-intricate-border-vines", "simplify-tendril-svgs"],
      breakpointStrategy: "fluid",
    },
    accessibility: {
      contrastTarget: "AAA",
      reducedMotionBehavior: "fade-only",
      readabilityNotes: "Decorative flourishes must be aria-hidden; maintain serif font legibility.",
    },
    react: {
      recommendedComponents: ["OrnateFrame", "BotanicalDivider", "WhiplashButton"],
      cssVariablesPrefix: "--af-style-art-nouveau",
      styleProperties: {
        "--af-botanical-stroke": "#2e4a36",
        "--af-parchment-bg": "#faf7f2",
      },
    },
    examples: ["Botanical hero banner", "Gilded floral menu", "Whiplash divider"],
    tags: ["vintage", "organic", "floral", "whiplash", "decorative"],
  },
  {
    id: "liquid-chrome",
    version: "1.0.0",
    name: "Liquid Chrome",
    description: "Futuristic molten metallic surfaces, high-specular iridescence, fluid ripples, and reflective mercury sheen.",
    category: "dimensional",
    philosophy: "Capture the fluid, boundary-blurring aesthetics of speculative cyber-physical metals and liquid reflections.",
    personality: ["futuristic", "metallic", "iridescent", "specular", "fluid"],
    recommendedPalettes: ["Silver Signal", "Neon Abyss", "Electric Eclipse", "Electric Teal"],
    typography: {
      headingFont: "Syne, Space Grotesk, sans-serif",
      bodyFont: "Inter, sans-serif",
      scaleRatio: 1.333,
      fontWeights: { heading: 700, body: 400 },
      letterSpacing: "-0.03em",
      textTransform: "uppercase",
    },
    shapeLanguage: {
      cornerRadius: "9999px",
      borderWidth: "1px",
      borderStyle: "solid",
      geometricTendency: "fluid",
    },
    layout: {
      density: "spacious",
      gridStructure: "asymmetric",
      alignment: "left",
      whitespaceRule: "generous",
    },
    graphics: {
      iconography: "solid",
      borders: "clean",
      dividers: "subtle",
      decorativeElements: ["molten-blobs", "specular-highlights", "caustic-ripples"],
    },
    textures: {
      primaryTexture: "metallic",
      patternStyle: "mesh",
      intensity: 0.8,
    },
    surfaces: {
      materialType: "liquid",
      opacity: 0.9,
      blur: "16px",
      backdropFilter: "blur(20px) saturate(200%)",
    },
    lighting: {
      lightSource: "ambient",
      shadowStyle: "glow",
      elevationLevels: ["0 8px 32px rgba(0,255,255,0.2)"],
      highlights: true,
    },
    background: {
      primaryTreatment: "canvas",
      compatibleBackgroundCapabilities: ["bg-fluid", "bg-advanced-gradient", "bg-cosmic"],
      recommendedBackground: "bg-fluid",
    },
    components: {
      buttonTreatment: {
        borderRadius: "9999px",
        shadow: "0 0 20px rgba(255,255,255,0.4), inset 0 1px 2px rgba(255,255,255,0.8)",
        border: "1px solid rgba(255,255,255,0.6)",
        hoverTransform: "scale(1.04) rotate(0.5deg)",
      },
      cardTreatment: {
        borderRadius: "28px",
        shadow: "0 12px 40px rgba(0,0,0,0.5)",
        border: "1px solid rgba(255,255,255,0.25)",
        background: "linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05))",
      },
      inputTreatment: {
        borderRadius: "9999px",
        border: "1px solid rgba(255,255,255,0.3)",
        focusRing: "0 0 15px rgba(200,220,255,0.6)",
      },
    },
    motion: {
      compatibleMotionDNA: ["dna-cinematic", "dna-energetic"],
      recommendedPresets: ["preset-scale-in", "preset-fade-in"],
      animationIntensity: "dramatic",
      transitionPacing: "elastic",
    },
    graphicsCompatibility: {
      canvasSupported: true,
      svgPreferred: false,
      blendingModes: ["screen", "overlay", "color-dodge"],
    },
    threeDCompatibility: {
      depthLevel: "full-3d",
      cameraAngle: "perspective",
      lightingModel: "matcap",
      materialReflectivity: 0.95,
    },
    responsive: {
      mobileAdaptations: ["lower-canvas-resolution", "fallback-static-gradient"],
      breakpointStrategy: "mobile-first",
    },
    accessibility: {
      contrastTarget: "AA",
      reducedMotionBehavior: "static-fallback",
      readabilityNotes: "Specular sheen must remain behind text containers with opaque backdrop filters.",
    },
    react: {
      recommendedComponents: ["ChromeCanvas", "MoltenBadge", "MercuryCard"],
      cssVariablesPrefix: "--af-style-liquid-chrome",
      styleProperties: {
        "--af-chrome-gradient": "linear-gradient(135deg, #e0e5eb 0%, #ffffff 50%, #8a99a8 100%)",
        "--af-chrome-highlight": "rgba(255,255,255,0.85)",
      },
    },
    examples: ["Molten hero title", "Mercury sphere button", "Chrome navigation dock"],
    tags: ["chrome", "metallic", "specular", "fluid", "futuristic", "3d"],
  },
  {
    id: "de-stijl",
    version: "1.0.0",
    name: "De Stijl",
    description: "Pure abstraction based on strict vertical and horizontal thick black grids with primary colors and asymmetric balance.",
    category: "modernist",
    philosophy: "Reduce visual art to its purest essentials: straight black lines, right angles, and primary colors (Mondrian).",
    personality: ["geometric", "purist", "balanced", "asymmetric", "rational"],
    recommendedPalettes: ["Primary Pop", "Cobalt Classic", "Chromatic Riot"],
    typography: {
      headingFont: "Futura, Trebuchet MS, sans-serif",
      bodyFont: "Helvetica Neue, Arial, sans-serif",
      scaleRatio: 1.414,
      fontWeights: { heading: 800, body: 400 },
      letterSpacing: "0.02em",
      textTransform: "uppercase",
    },
    shapeLanguage: {
      cornerRadius: "0px",
      borderWidth: "4px",
      borderStyle: "solid",
      geometricTendency: "rigid",
      aspectRatios: ["1:1", "4:3", "16:9"],
    },
    layout: {
      density: "compact",
      gridStructure: "strict",
      alignment: "left",
      whitespaceRule: "structured",
    },
    graphics: {
      iconography: "solid",
      borders: "heavy",
      dividers: "prominent",
      decorativeElements: ["primary-blocks", "black-gridlines", "asymmetric-quadrants"],
    },
    textures: {
      primaryTexture: "none",
      patternStyle: "geometric",
      intensity: 0,
    },
    surfaces: {
      materialType: "flat",
      opacity: 1,
      blur: "0px",
    },
    lighting: {
      lightSource: "ambient",
      shadowStyle: "none",
      elevationLevels: ["none"],
      highlights: false,
    },
    background: {
      primaryTreatment: "pattern",
      compatibleBackgroundCapabilities: ["bg-grid", "bg-geometric"],
      recommendedBackground: "bg-grid",
    },
    components: {
      buttonTreatment: {
        borderRadius: "0px",
        shadow: "none",
        border: "4px solid #000000",
        hoverTransform: "translate(-2px, -2px)",
      },
      cardTreatment: {
        borderRadius: "0px",
        shadow: "none",
        border: "4px solid #000000",
        background: "#ffffff",
      },
      inputTreatment: {
        borderRadius: "0px",
        border: "4px solid #000000",
        focusRing: "4px solid #0047AB",
      },
    },
    motion: {
      compatibleMotionDNA: ["dna-snappy", "dna-minimal"],
      recommendedPresets: ["preset-slide-in-left", "preset-slide-in-right"],
      animationIntensity: "moderate",
      transitionPacing: "snappy",
    },
    graphicsCompatibility: {
      canvasSupported: false,
      svgPreferred: true,
      blendingModes: ["normal"],
    },
    threeDCompatibility: {
      depthLevel: "flat",
      cameraAngle: "front",
      lightingModel: "flat",
      materialReflectivity: 0,
    },
    responsive: {
      mobileAdaptations: ["stack-mondrian-cells-vertically", "reduce-gridline-width-to-3px"],
      breakpointStrategy: "desktop-first",
    },
    accessibility: {
      contrastTarget: "AAA",
      reducedMotionBehavior: "disable-transforms",
      readabilityNotes: "High contrast by default with black borders and white backgrounds.",
    },
    react: {
      recommendedComponents: ["MondrianGrid", "PrimaryBlock", "RigidCard"],
      cssVariablesPrefix: "--af-style-de-stijl",
      styleProperties: {
        "--af-grid-stroke": "4px solid #000000",
        "--af-primary-red": "#E63946",
        "--af-primary-blue": "#0047AB",
        "--af-primary-yellow": "#FFD166",
      },
    },
    examples: ["Mondrian quadrant hero", "Asymmetric primary card grid", "Strict block button"],
    tags: ["mondrian", "primary", "grid", "geometric", "modernist", "rigid"],
  },
  {
    id: "memphis",
    version: "1.0.0",
    name: "Memphis",
    description: "Postmodern 1980s exuberance with clashing vibrant colors, squiggles, confetti sprinkles, and geometric asymmetry.",
    category: "retro",
    philosophy: "Rebel against rigid functionalism through playful geometry, vibrant clashing palettes, and eccentric pop ornamentation.",
    personality: ["playful", "eccentric", "vibrant", "irreverent", "bold"],
    recommendedPalettes: ["Primary Pop", "Chromatic Riot", "Strawberry Riot", "Peach Voltage"],
    typography: {
      headingFont: "Cabinet Grotesk, Righteous, sans-serif",
      bodyFont: "Plus Jakarta Sans, sans-serif",
      scaleRatio: 1.333,
      fontWeights: { heading: 900, body: 500 },
      letterSpacing: "0.01em",
    },
    shapeLanguage: {
      cornerRadius: "12px",
      borderWidth: "3px",
      borderStyle: "solid",
      geometricTendency: "sharp",
      aspectRatios: ["1:1", "16:9"],
    },
    layout: {
      density: "spacious",
      gridStructure: "asymmetric",
      alignment: "left",
      whitespaceRule: "generous",
    },
    graphics: {
      iconography: "solid",
      borders: "heavy",
      dividers: "decorative",
      decorativeElements: ["squiggles", "confetti-dots", "floating-triangles", "terrazzo-chips"],
    },
    textures: {
      primaryTexture: "none",
      patternStyle: "dots",
      intensity: 0.5,
    },
    surfaces: {
      materialType: "plastic",
      opacity: 1,
      blur: "0px",
    },
    lighting: {
      lightSource: "top-left",
      shadowStyle: "hard",
      elevationLevels: ["5px 5px 0px #000000", "8px 8px 0px #000000"],
      highlights: false,
    },
    background: {
      primaryTreatment: "pattern",
      compatibleBackgroundCapabilities: ["bg-geometric", "bg-grid"],
      recommendedBackground: "bg-geometric",
    },
    components: {
      buttonTreatment: {
        borderRadius: "12px",
        shadow: "4px 4px 0px #000000",
        border: "3px solid #000000",
        hoverTransform: "translate(-2px, -2px)",
      },
      cardTreatment: {
        borderRadius: "16px",
        shadow: "6px 6px 0px #000000",
        border: "3px solid #000000",
        background: "#ffffff",
      },
      inputTreatment: {
        borderRadius: "8px",
        border: "3px solid #000000",
        focusRing: "4px solid #FF007F",
      },
    },
    motion: {
      compatibleMotionDNA: ["dna-playful", "dna-energetic"],
      recommendedPresets: ["preset-scale-in", "preset-slide-up"],
      animationIntensity: "expressive",
      transitionPacing: "elastic",
    },
    graphicsCompatibility: {
      canvasSupported: false,
      svgPreferred: true,
      blendingModes: ["normal"],
    },
    threeDCompatibility: {
      depthLevel: "pseudo-3d",
      cameraAngle: "isometric",
      lightingModel: "flat",
      materialReflectivity: 0,
    },
    responsive: {
      mobileAdaptations: ["reduce-floating-confetti-elements", "scale-down-hard-shadows"],
      breakpointStrategy: "mobile-first",
    },
    accessibility: {
      contrastTarget: "AA",
      reducedMotionBehavior: "fade-only",
      readabilityNotes: "High contrast black borders maintain legible boundaries despite vibrant color blocks.",
    },
    react: {
      recommendedComponents: ["MemphisCard", "SquiggleDivider", "PopButton"],
      cssVariablesPrefix: "--af-style-memphis",
      styleProperties: {
        "--af-hard-shadow": "6px 6px 0px #000000",
        "--af-border-stroke": "3px solid #000000",
      },
    },
    examples: ["Pop card with hard shadow", "Squiggle decorative header", "Floating triangle badge"],
    tags: ["80s", "postmodern", "squiggles", "playful", "vibrant", "confetti"],
  },
  {
    id: "psychedelic",
    version: "1.0.0",
    name: "Psychedelic",
    description: "1960s counter-culture optical art with vibrating contrasting hues, fluid liquid typography, and kaleidoscopic geometry.",
    category: "expressive",
    philosophy: "Evoke altered perceptual states through saturated color vibration, sinuous liquid forms, and hypnotic radial symmetries.",
    personality: ["trippy", "vibrant", "kaleidoscopic", "expressive", "mesmerizing"],
    recommendedPalettes: ["Chromatic Riot", "Neon Rebellion", "Electric Teal", "Strawberry Riot"],
    typography: {
      headingFont: "Cooper Black, Cheee, cursive",
      bodyFont: "Work Sans, sans-serif",
      scaleRatio: 1.333,
      fontWeights: { heading: 900, body: 400 },
      letterSpacing: "-0.01em",
    },
    shapeLanguage: {
      cornerRadius: "32px",
      borderWidth: "2px",
      borderStyle: "solid",
      geometricTendency: "fluid",
    },
    layout: {
      density: "normal",
      gridStructure: "broken",
      alignment: "center",
      whitespaceRule: "chaotic",
    },
    graphics: {
      iconography: "duotone",
      borders: "ornate",
      dividers: "decorative",
      decorativeElements: ["optical-spirals", "kaleidoscope-stars", "melted-blobs"],
    },
    textures: {
      primaryTexture: "mesh",
      patternStyle: "organic",
      intensity: 0.7,
    },
    surfaces: {
      materialType: "liquid",
      opacity: 0.9,
      blur: "0px",
    },
    lighting: {
      lightSource: "ambient",
      shadowStyle: "colored",
      elevationLevels: ["0 10px 30px rgba(255,0,128,0.3)"],
      highlights: true,
    },
    background: {
      primaryTreatment: "canvas",
      compatibleBackgroundCapabilities: ["bg-fluid", "bg-aurora", "bg-advanced-gradient"],
      recommendedBackground: "bg-fluid",
    },
    components: {
      buttonTreatment: {
        borderRadius: "9999px",
        shadow: "0 0 15px rgba(255,100,200,0.5)",
        border: "2px solid #ffffff",
        hoverTransform: "scale(1.05) rotate(-1deg)",
      },
      cardTreatment: {
        borderRadius: "32px",
        shadow: "0 10px 30px rgba(0,0,0,0.2)",
        border: "2px solid rgba(255,255,255,0.4)",
        background: "rgba(255,255,255,0.85)",
      },
      inputTreatment: {
        borderRadius: "20px",
        border: "2px solid #FF007F",
        focusRing: "0 0 12px rgba(255,0,128,0.4)",
      },
    },
    motion: {
      compatibleMotionDNA: ["dna-playful", "dna-energetic"],
      recommendedPresets: ["preset-scale-in"],
      animationIntensity: "dramatic",
      transitionPacing: "elastic",
    },
    graphicsCompatibility: {
      canvasSupported: true,
      svgPreferred: true,
      blendingModes: ["difference", "color-dodge"],
    },
    threeDCompatibility: {
      depthLevel: "pseudo-3d",
      cameraAngle: "perspective",
      lightingModel: "flat",
      materialReflectivity: 0.5,
    },
    responsive: {
      mobileAdaptations: ["tone-down-optical-frequencies", "reduce-liquid-warp-speed"],
      breakpointStrategy: "fluid",
    },
    accessibility: {
      contrastTarget: "AA",
      reducedMotionBehavior: "static-fallback",
      readabilityNotes: "Avoid intense high-frequency flashing or pulsating patterns for photosensitive safety.",
    },
    react: {
      recommendedComponents: ["LiquidTitle", "KaleidoBackground", "SwirlCard"],
      cssVariablesPrefix: "--af-style-psychedelic",
      styleProperties: {
        "--af-glow-pink": "0 0 20px #FF007F",
        "--af-glow-cyan": "0 0 20px #00F5D4",
      },
    },
    examples: ["Warped liquid hero", "Optical swirl card", "Kaleidoscopic radial avatar"],
    tags: ["60s", "trippy", "kaleidoscope", "optical", "colorful", "liquid"],
  },
  {
    id: "vaporwave",
    version: "1.0.0",
    name: "Vaporwave",
    description: "Nostalgic 1990s early-internet aesthetics: pink-and-cyan gradients, wireframe horizons, glitched statues, and synthwave vibes.",
    category: "retro",
    philosophy: "Deconstruct consumer capitalism and late-20th-century technology through melancholic, neon-drenched retro-futurism.",
    personality: ["nostalgic", "neon", "surreal", "dreamy", "cybernetic"],
    recommendedPalettes: ["Neon Abyss", "Electric Teal", "Electric Eclipse", "Amethyst Circuit"],
    typography: {
      headingFont: "VT323, MS Gothic, monospace",
      bodyFont: "MS Sans Serif, Tahoma, sans-serif",
      scaleRatio: 1.25,
      fontWeights: { heading: 700, body: 400 },
      letterSpacing: "0.08em",
    },
    shapeLanguage: {
      cornerRadius: "4px",
      borderWidth: "2px",
      borderStyle: "solid",
      geometricTendency: "rigid",
    },
    layout: {
      density: "normal",
      gridStructure: "strict",
      alignment: "left",
      whitespaceRule: "structured",
    },
    graphics: {
      iconography: "duotone",
      borders: "embossed",
      dividers: "prominent",
      decorativeElements: ["neon-sun", "wireframe-grid", "greek-busts", "pixel-icons"],
    },
    textures: {
      primaryTexture: "noise",
      patternStyle: "stripes",
      intensity: 0.4,
    },
    surfaces: {
      materialType: "glass",
      opacity: 0.85,
      blur: "10px",
    },
    lighting: {
      lightSource: "neon",
      shadowStyle: "glow",
      elevationLevels: ["0 0 15px rgba(255,113,206,0.5), 0 0 25px rgba(1,205,254,0.3)"],
      highlights: true,
    },
    background: {
      primaryTreatment: "canvas",
      compatibleBackgroundCapabilities: ["bg-grid", "bg-cosmic", "bg-aurora"],
      recommendedBackground: "bg-grid",
    },
    components: {
      buttonTreatment: {
        borderRadius: "2px",
        shadow: "0 0 10px #FF71CE",
        border: "2px solid #01CDFE",
        hoverTransform: "translateY(-1px)",
      },
      cardTreatment: {
        borderRadius: "4px",
        shadow: "0 0 20px rgba(255,113,206,0.3)",
        border: "2px solid #FF71CE",
        background: "rgba(10, 10, 30, 0.85)",
      },
      inputTreatment: {
        borderRadius: "2px",
        border: "2px solid #01CDFE",
        focusRing: "0 0 10px #01CDFE",
      },
    },
    motion: {
      compatibleMotionDNA: ["dna-cinematic", "dna-calm"],
      recommendedPresets: ["preset-fade-in", "preset-slide-up"],
      animationIntensity: "moderate",
      transitionPacing: "smooth",
    },
    graphicsCompatibility: {
      canvasSupported: true,
      svgPreferred: true,
      blendingModes: ["screen", "color-dodge"],
    },
    threeDCompatibility: {
      depthLevel: "2.5d",
      cameraAngle: "perspective",
      lightingModel: "unlit",
      materialReflectivity: 0.3,
    },
    responsive: {
      mobileAdaptations: ["flatten-wireframe-horizon", "reduce-neon-glow-spread"],
      breakpointStrategy: "desktop-first",
    },
    accessibility: {
      contrastTarget: "AA",
      reducedMotionBehavior: "disable-transforms",
      readabilityNotes: "High-contrast neon text on dark navy/purple backgrounds ensures strong contrast.",
    },
    react: {
      recommendedComponents: ["VaporWindow", "WireframeGrid", "NeonButton"],
      cssVariablesPrefix: "--af-style-vaporwave",
      styleProperties: {
        "--af-vapor-pink": "#FF71CE",
        "--af-vapor-cyan": "#01CDFE",
        "--af-vapor-purple": "#B967FF",
      },
    },
    examples: ["Wireframe horizon hero", "Retro 95 dialog window", "Glowing neon badge"],
    tags: ["90s", "synthwave", "retro-future", "neon", "wireframe", "nostalgia"],
  },
  {
    id: "steampunk",
    version: "1.0.0",
    name: "Steampunk",
    description: "Victorian industrial sci-fi featuring polished brass, rivets, copper tubes, pressure gauges, and clockwork cogs.",
    category: "skeuomorphic",
    philosophy: "Imagine a Victorian future powered by steam, mechanical gears, clockwork craftsmanship, and warm burnished metals.",
    personality: ["industrial", "ornate", "mechanical", "vintage", "crafted"],
    recommendedPalettes: ["Earthbound", "Burnt Chocolate", "Mocha Gold", "Earth & Amber"],
    typography: {
      headingFont: "Rye, Victorian, serif",
      bodyFont: "IM Fell English, Georgia, serif",
      scaleRatio: 1.25,
      fontWeights: { heading: 700, body: 400 },
      letterSpacing: "0.03em",
    },
    shapeLanguage: {
      cornerRadius: "4px",
      borderWidth: "3px",
      borderStyle: "solid",
      geometricTendency: "rigid",
    },
    layout: {
      density: "dense",
      gridStructure: "strict",
      alignment: "left",
      whitespaceRule: "structured",
    },
    graphics: {
      iconography: "realistic",
      borders: "ornate",
      dividers: "prominent",
      decorativeElements: ["brass-rivets", "clockwork-gears", "copper-pipes", "pressure-gauges"],
    },
    textures: {
      primaryTexture: "metallic",
      patternStyle: "circuit",
      intensity: 0.6,
    },
    surfaces: {
      materialType: "metal",
      opacity: 1,
      blur: "0px",
    },
    lighting: {
      lightSource: "top-left",
      shadowStyle: "hard",
      elevationLevels: ["0 4px 10px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,215,0,0.4)"],
      highlights: true,
    },
    background: {
      primaryTreatment: "textured",
      compatibleBackgroundCapabilities: ["bg-noise", "bg-atmospheric"],
      recommendedBackground: "bg-noise",
    },
    components: {
      buttonTreatment: {
        borderRadius: "4px",
        shadow: "0 3px 6px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,220,120,0.6)",
        border: "2px solid #8B5A2B",
        hoverTransform: "translateY(1px)",
      },
      cardTreatment: {
        borderRadius: "6px",
        shadow: "0 6px 18px rgba(0,0,0,0.6)",
        border: "3px solid #b87333",
        background: "linear-gradient(to bottom, #3d2b1f, #241911)",
      },
      inputTreatment: {
        borderRadius: "3px",
        border: "2px solid #8B5A2B",
        focusRing: "0 0 6px rgba(212,175,55,0.7)",
      },
    },
    motion: {
      compatibleMotionDNA: ["dna-snappy", "dna-calm"],
      recommendedPresets: ["preset-fade-in"],
      animationIntensity: "moderate",
      transitionPacing: "measured",
    },
    graphicsCompatibility: {
      canvasSupported: true,
      svgPreferred: true,
      blendingModes: ["multiply", "overlay"],
    },
    threeDCompatibility: {
      depthLevel: "2.5d",
      cameraAngle: "front",
      lightingModel: "phong",
      materialReflectivity: 0.7,
    },
    responsive: {
      mobileAdaptations: ["reduce-gear-animations", "hide-decorative-rivets"],
      breakpointStrategy: "desktop-first",
    },
    accessibility: {
      contrastTarget: "AA",
      reducedMotionBehavior: "disable-transforms",
      readabilityNotes: "Keep antique font sizes legible on dark mahogany backgrounds.",
    },
    react: {
      recommendedComponents: ["GearGauge", "BrassButton", "VictorianPanel"],
      cssVariablesPrefix: "--af-style-steampunk",
      styleProperties: {
        "--af-brass-gold": "#d4af37",
        "--af-copper-stroke": "#b87333",
      },
    },
    examples: ["Clockwork hero panel", "Pressure gauge stat display", "Riveted brass card"],
    tags: ["victorian", "gears", "industrial", "brass", "copper", "mechanical"],
  },
  {
    id: "grunge",
    version: "1.0.0",
    name: "Grunge",
    description: "1990s alternative grit with distressed textures, photocopy noise, ripped paper edges, tape, and raw typography.",
    category: "expressive",
    philosophy: "Embrace raw imperfections, tactile distressing, analog decay, and anti-corporate underground zine energy.",
    personality: ["gritty", "distressed", "raw", "edgy", "rebellious"],
    recommendedPalettes: ["Burnt Chocolate", "Crimson Midnight", "Forest Crimson", "Earthbound"],
    typography: {
      headingFont: "Permanent Marker, Impact, sans-serif",
      bodyFont: "Courier Prime, monospace",
      scaleRatio: 1.333,
      fontWeights: { heading: 900, body: 400 },
      letterSpacing: "-0.02em",
      textTransform: "uppercase",
    },
    shapeLanguage: {
      cornerRadius: "0px",
      borderWidth: "2px",
      borderStyle: "solid",
      geometricTendency: "distorted",
    },
    layout: {
      density: "dense",
      gridStructure: "broken",
      alignment: "left",
      whitespaceRule: "tight",
    },
    graphics: {
      iconography: "hand-drawn",
      borders: "glitched",
      dividers: "prominent",
      decorativeElements: ["masking-tape", "ink-splatters", "torn-edges", "halftone-burns"],
    },
    textures: {
      primaryTexture: "grain",
      patternStyle: "none",
      intensity: 0.75,
    },
    surfaces: {
      materialType: "paper",
      opacity: 0.95,
      blur: "0px",
    },
    lighting: {
      lightSource: "ambient",
      shadowStyle: "hard",
      elevationLevels: ["3px 3px 0px rgba(0,0,0,0.8)"],
      highlights: false,
    },
    background: {
      primaryTreatment: "textured",
      compatibleBackgroundCapabilities: ["bg-noise", "bg-spotlight"],
      recommendedBackground: "bg-noise",
    },
    components: {
      buttonTreatment: {
        borderRadius: "0px",
        shadow: "3px 3px 0px #000000",
        border: "2px solid #000000",
        hoverTransform: "rotate(-1deg) scale(1.02)",
      },
      cardTreatment: {
        borderRadius: "0px",
        shadow: "4px 4px 0px #000000",
        border: "2px solid #000000",
        background: "#e8e5df",
      },
      inputTreatment: {
        borderRadius: "0px",
        border: "2px solid #000000",
        focusRing: "2px solid #e63946",
      },
    },
    motion: {
      compatibleMotionDNA: ["dna-snappy", "dna-energetic"],
      recommendedPresets: ["preset-scale-in"],
      animationIntensity: "expressive",
      transitionPacing: "snappy",
    },
    graphicsCompatibility: {
      canvasSupported: true,
      svgPreferred: true,
      blendingModes: ["multiply", "darken"],
    },
    threeDCompatibility: {
      depthLevel: "flat",
      cameraAngle: "front",
      lightingModel: "flat",
      materialReflectivity: 0,
    },
    responsive: {
      mobileAdaptations: ["lower-noise-alpha", "simplify-svg-edge-masks"],
      breakpointStrategy: "mobile-first",
    },
    accessibility: {
      contrastTarget: "AAA",
      reducedMotionBehavior: "disable-transforms",
      readabilityNotes: "Distressing noise must not obscure body text; maintain clear contrast.",
    },
    react: {
      recommendedComponents: ["TornCard", "DistressedButton", "ZineHeader"],
      cssVariablesPrefix: "--af-style-grunge",
      styleProperties: {
        "--af-grit-color": "#202020",
        "--af-raw-paper": "#e8e5df",
      },
    },
    examples: ["Zine poster hero", "Taped photo card", "Distressed stamp button"],
    tags: ["90s", "grit", "analog", "zine", "punk", "distressed"],
  },
  {
    id: "paper-cutout",
    version: "1.0.0",
    name: "Paper Cutout",
    description: "Layered dimensional papercraft with deep soft drop shadows, clean organic contours, and tactile depth.",
    category: "skeuomorphic",
    philosophy: "Create rich visual depth through physical layers of sculpted paper, cast shadows, and tactile materiality.",
    personality: ["tactile", "crafted", "layered", "gentle", "dimensional"],
    recommendedPalettes: ["Sage & Olive", "Earth & Amber", "Dusty Romance", "Cerulean Rose"],
    typography: {
      headingFont: "Quicksand, Nunito, sans-serif",
      bodyFont: "Inter, sans-serif",
      scaleRatio: 1.25,
      fontWeights: { heading: 700, body: 400 },
      letterSpacing: "0px",
    },
    shapeLanguage: {
      cornerRadius: "20px",
      borderWidth: "0px",
      borderStyle: "none",
      geometricTendency: "organic",
    },
    layout: {
      density: "spacious",
      gridStructure: "strict",
      alignment: "left",
      whitespaceRule: "generous",
    },
    graphics: {
      iconography: "solid",
      borders: "none",
      dividers: "subtle",
      decorativeElements: ["layered-waves", "cutout-silhouettes", "paper-shadows"],
    },
    textures: {
      primaryTexture: "paper",
      patternStyle: "none",
      intensity: 0.35,
    },
    surfaces: {
      materialType: "paper",
      opacity: 1,
      blur: "0px",
    },
    lighting: {
      lightSource: "top",
      shadowStyle: "layered",
      elevationLevels: [
        "0 3px 6px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)",
        "0 10px 20px rgba(0,0,0,0.12), 0 3px 6px rgba(0,0,0,0.08)",
        "0 20px 35px rgba(0,0,0,0.16), 0 5px 12px rgba(0,0,0,0.1)",
      ],
      highlights: false,
    },
    background: {
      primaryTreatment: "pattern",
      compatibleBackgroundCapabilities: ["bg-atmospheric", "bg-wave"],
      recommendedBackground: "bg-wave",
    },
    components: {
      buttonTreatment: {
        borderRadius: "14px",
        shadow: "0 4px 8px rgba(0,0,0,0.12)",
        border: "none",
        hoverTransform: "translateY(-2px)",
      },
      cardTreatment: {
        borderRadius: "20px",
        shadow: "0 10px 25px rgba(0,0,0,0.1)",
        border: "none",
        background: "#ffffff",
      },
      inputTreatment: {
        borderRadius: "12px",
        border: "1px solid rgba(0,0,0,0.1)",
        focusRing: "0 0 0 3px rgba(0,0,0,0.1)",
      },
    },
    motion: {
      compatibleMotionDNA: ["dna-calm", "dna-playful"],
      recommendedPresets: ["preset-fade-in", "preset-scale-in"],
      animationIntensity: "moderate",
      transitionPacing: "smooth",
    },
    graphicsCompatibility: {
      canvasSupported: false,
      svgPreferred: true,
      blendingModes: ["normal"],
    },
    threeDCompatibility: {
      depthLevel: "2.5d",
      cameraAngle: "front",
      lightingModel: "flat",
      materialReflectivity: 0,
    },
    responsive: {
      mobileAdaptations: ["collapse-paper-depth-layers", "lighten-shadow-blur"],
      breakpointStrategy: "fluid",
    },
    accessibility: {
      contrastTarget: "AA",
      reducedMotionBehavior: "fade-only",
      readabilityNotes: "Paper layers provide natural depth without reducing text legibility.",
    },
    react: {
      recommendedComponents: ["PaperLayer", "CutoutCard", "PapercraftButton"],
      cssVariablesPrefix: "--af-style-paper-cutout",
      styleProperties: {
        "--af-paper-shadow-1": "0 4px 10px rgba(0,0,0,0.08)",
        "--af-paper-shadow-2": "0 12px 25px rgba(0,0,0,0.12)",
      },
    },
    examples: ["Layered landscape hero", "Multi-depth stat card", "Sculpted paper menu"],
    tags: ["paper", "cutout", "layered", "tactile", "shadows", "depth"],
  },
  {
    id: "glitch",
    version: "1.0.0",
    name: "Glitch",
    description: "Digital artifact aesthetic with RGB chromatic aberration, scanlines, data tearing, and high-tech dissonance.",
    category: "cyber",
    philosophy: "Turn system failure, signal corruption, and technological noise into a deliberate high-energy aesthetic.",
    personality: ["chaotic", "cybernetic", "dissonant", "high-energy", "disruptive"],
    recommendedPalettes: ["Neon Abyss", "Electric Eclipse", "Amethyst Circuit", "Midnight Voltage"],
    typography: {
      headingFont: "Orbitron, VT323, monospace",
      bodyFont: "Share Tech Mono, monospace",
      scaleRatio: 1.333,
      fontWeights: { heading: 800, body: 400 },
      letterSpacing: "0.06em",
      textTransform: "uppercase",
    },
    shapeLanguage: {
      cornerRadius: "0px",
      borderWidth: "1px",
      borderStyle: "solid",
      geometricTendency: "distorted",
    },
    layout: {
      density: "compact",
      gridStructure: "broken",
      alignment: "left",
      whitespaceRule: "tight",
    },
    graphics: {
      iconography: "solid",
      borders: "glitched",
      dividers: "prominent",
      decorativeElements: ["scanlines", "rgb-split-offsets", "tearing-artifacts", "hex-codes"],
    },
    textures: {
      primaryTexture: "noise",
      patternStyle: "circuit",
      intensity: 0.6,
    },
    surfaces: {
      materialType: "glass",
      opacity: 0.9,
      blur: "0px",
    },
    lighting: {
      lightSource: "neon",
      shadowStyle: "colored",
      elevationLevels: ["-2px 0 0 rgba(255,0,0,0.8), 2px 0 0 rgba(0,255,255,0.8)"],
      highlights: false,
    },
    background: {
      primaryTreatment: "canvas",
      compatibleBackgroundCapabilities: ["bg-noise", "bg-grid", "bg-energy"],
      recommendedBackground: "bg-noise",
    },
    components: {
      buttonTreatment: {
        borderRadius: "0px",
        shadow: "-2px 0 #FF0055, 2px 0 #00FFFF",
        border: "1px solid #00FFFF",
        hoverTransform: "translate(1px, -1px)",
      },
      cardTreatment: {
        borderRadius: "0px",
        shadow: "0 0 15px rgba(0,255,255,0.3)",
        border: "1px solid rgba(0,255,255,0.4)",
        background: "rgba(5, 5, 15, 0.95)",
      },
      inputTreatment: {
        borderRadius: "0px",
        border: "1px solid #FF0055",
        focusRing: "0 0 8px #FF0055",
      },
    },
    motion: {
      compatibleMotionDNA: ["dna-snappy", "dna-energetic"],
      recommendedPresets: ["preset-scale-in"],
      animationIntensity: "dramatic",
      transitionPacing: "snappy",
    },
    graphicsCompatibility: {
      canvasSupported: true,
      svgPreferred: true,
      blendingModes: ["screen", "difference"],
    },
    threeDCompatibility: {
      depthLevel: "flat",
      cameraAngle: "front",
      lightingModel: "unlit",
      materialReflectivity: 0,
    },
    responsive: {
      mobileAdaptations: ["throttle-rgb-split-offsets", "disable-rapid-flicker"],
      breakpointStrategy: "mobile-first",
    },
    accessibility: {
      contrastTarget: "AA",
      reducedMotionBehavior: "static-fallback",
      readabilityNotes: "Flicker and horizontal tearing must pause or stop when prefers-reduced-motion is active.",
    },
    react: {
      recommendedComponents: ["GlitchText", "ChromaticCard", "ScanlineOverlay"],
      cssVariablesPrefix: "--af-style-glitch",
      styleProperties: {
        "--af-glitch-cyan": "#00FFFF",
        "--af-glitch-magenta": "#FF0055",
      },
    },
    examples: ["Chromatic aberration title", "Scanline data feed card", "Glitched CTA button"],
    tags: ["glitch", "rgb-split", "cyber", "scanlines", "dissonant", "hacker"],
  },
  {
    id: "anti-design",
    version: "1.0.0",
    name: "Anti-design",
    description: "Radical subversion of traditional UI rules: intentional asymmetry, jarring contrasts, overlapping text, and raw chaos.",
    category: "experimental",
    philosophy: "Disrupt predictable corporate UI uniformity through confrontational layouts, deliberate friction, and expressive dissonance.",
    personality: ["provocative", "chaotic", "unapologetic", "disruptive", "raw"],
    recommendedPalettes: ["Neon Rebellion", "Lemon Afterdark", "Chromatic Riot"],
    typography: {
      headingFont: "Druk Wide, Impact, sans-serif",
      bodyFont: "Courier New, monospace",
      scaleRatio: 1.414,
      fontWeights: { heading: 900, body: 400 },
      letterSpacing: "-0.04em",
      textTransform: "uppercase",
    },
    shapeLanguage: {
      cornerRadius: "0px",
      borderWidth: "3px",
      borderStyle: "dashed",
      geometricTendency: "distorted",
    },
    layout: {
      density: "dense",
      gridStructure: "broken",
      alignment: "off-grid",
      whitespaceRule: "chaotic",
    },
    graphics: {
      iconography: "hand-drawn",
      borders: "glitched",
      dividers: "prominent",
      decorativeElements: ["overlapping-banners", "warning-stripes", "rotated-labels"],
    },
    textures: {
      primaryTexture: "grain",
      patternStyle: "stripes",
      intensity: 0.5,
    },
    surfaces: {
      materialType: "flat",
      opacity: 1,
      blur: "0px",
    },
    lighting: {
      lightSource: "ambient",
      shadowStyle: "none",
      elevationLevels: ["none"],
      highlights: false,
    },
    background: {
      primaryTreatment: "pattern",
      compatibleBackgroundCapabilities: ["bg-noise", "bg-grid"],
      recommendedBackground: "bg-noise",
    },
    components: {
      buttonTreatment: {
        borderRadius: "0px",
        shadow: "none",
        border: "3px solid #000000",
        hoverTransform: "rotate(3deg) scale(1.05)",
      },
      cardTreatment: {
        borderRadius: "0px",
        shadow: "none",
        border: "3px dashed #000000",
        background: "#ffff00",
      },
      inputTreatment: {
        borderRadius: "0px",
        border: "3px solid #000000",
        focusRing: "4px solid #FF00FF",
      },
    },
    motion: {
      compatibleMotionDNA: ["dna-energetic", "dna-playful"],
      recommendedPresets: ["preset-scale-in"],
      animationIntensity: "dramatic",
      transitionPacing: "elastic",
    },
    graphicsCompatibility: {
      canvasSupported: false,
      svgPreferred: true,
      blendingModes: ["difference"],
    },
    threeDCompatibility: {
      depthLevel: "flat",
      cameraAngle: "front",
      lightingModel: "flat",
      materialReflectivity: 0,
    },
    responsive: {
      mobileAdaptations: ["un-rotate-text-elements", "straighten-overlaps-for-tap-targets"],
      breakpointStrategy: "fluid",
    },
    accessibility: {
      contrastTarget: "AA",
      reducedMotionBehavior: "disable-transforms",
      readabilityNotes: "Crucial interaction targets must remain at least 44x44px despite overlapping aesthetic elements.",
    },
    react: {
      recommendedComponents: ["BrokenGrid", "WarningBanner", "AsymmetricCard"],
      cssVariablesPrefix: "--af-style-anti-design",
      styleProperties: {
        "--af-caution-yellow": "#FFFF00",
        "--af-toxic-magenta": "#FF00FF",
      },
    },
    examples: ["Tilted hero banner", "Overlapping marquee headline", "Raw dashed card"],
    tags: ["experimental", "brutalist", "chaotic", "rebel", "provocative", "raw"],
  },
  {
    id: "3d-inflated",
    version: "1.0.0",
    name: "3D Inflated",
    description: "Playful bubblegum 3D forms: plump pillowy volumes, candy gloss reflections, soft rounded geometry, and inflatable tactile joy.",
    category: "dimensional",
    philosophy: "Infuse digital interfaces with bubbly optimism and soft, inflated, tactile 3D toy-like warmth.",
    personality: ["playful", "bubbly", "plump", "friendly", "cheerful"],
    recommendedPalettes: ["Strawberry Riot", "Peach Voltage", "Primary Pop", "Cerulean Rose"],
    typography: {
      headingFont: "Fredoka, Baloo 2, sans-serif",
      bodyFont: "Nunito, sans-serif",
      scaleRatio: 1.333,
      fontWeights: { heading: 800, body: 500 },
      letterSpacing: "-0.01em",
    },
    shapeLanguage: {
      cornerRadius: "36px",
      borderWidth: "0px",
      borderStyle: "none",
      geometricTendency: "rounded",
    },
    layout: {
      density: "spacious",
      gridStructure: "strict",
      alignment: "center",
      whitespaceRule: "generous",
    },
    graphics: {
      iconography: "solid",
      borders: "none",
      dividers: "subtle",
      decorativeElements: ["bubble-spheres", "inflatable-donuts", "pillowy-clouds"],
    },
    textures: {
      primaryTexture: "none",
      patternStyle: "dots",
      intensity: 0.2,
    },
    surfaces: {
      materialType: "clay",
      opacity: 1,
      blur: "0px",
    },
    lighting: {
      lightSource: "top-left",
      shadowStyle: "soft",
      elevationLevels: ["0 15px 30px rgba(0,0,0,0.12), inset 0 -4px 8px rgba(0,0,0,0.1)"],
      highlights: true,
    },
    background: {
      primaryTreatment: "gradient",
      compatibleBackgroundCapabilities: ["bg-floating-orbs", "bg-fluid"],
      recommendedBackground: "bg-floating-orbs",
    },
    components: {
      buttonTreatment: {
        borderRadius: "9999px",
        shadow: "0 8px 16px rgba(0,0,0,0.15), inset 0 2px 4px rgba(255,255,255,0.8)",
        border: "none",
        hoverTransform: "scale(1.06) translateY(-2px)",
      },
      cardTreatment: {
        borderRadius: "36px",
        shadow: "0 18px 40px rgba(0,0,0,0.1)",
        border: "none",
        background: "#ffffff",
      },
      inputTreatment: {
        borderRadius: "24px",
        border: "2px solid #ffccd5",
        focusRing: "0 0 0 4px #ffb3c1",
      },
    },
    motion: {
      compatibleMotionDNA: ["dna-playful", "dna-energetic"],
      recommendedPresets: ["preset-scale-in"],
      animationIntensity: "expressive",
      transitionPacing: "elastic",
    },
    graphicsCompatibility: {
      canvasSupported: true,
      svgPreferred: true,
      blendingModes: ["normal"],
    },
    threeDCompatibility: {
      depthLevel: "full-3d",
      cameraAngle: "perspective",
      lightingModel: "pbr",
      materialReflectivity: 0.4,
    },
    responsive: {
      mobileAdaptations: ["reduce-shadow-spread", "scale-pillowy-padding"],
      breakpointStrategy: "fluid",
    },
    accessibility: {
      contrastTarget: "AA",
      reducedMotionBehavior: "fade-only",
      readabilityNotes: "Soft pastel buttons require high-contrast text color overrides.",
    },
    react: {
      recommendedComponents: ["PillowyCard", "InflatableButton", "BubbleBadge"],
      cssVariablesPrefix: "--af-style-3d-inflated",
      styleProperties: {
        "--af-bubble-shadow": "0 15px 35px rgba(255,100,150,0.25)",
        "--af-bubble-radius": "36px",
      },
    },
    examples: ["Pillowy 3D CTA", "Floating inflatable card", "Candy bubble stat display"],
    tags: ["3d", "inflated", "bubbly", "pillowy", "playful", "candy"],
  },
  {
    id: "isometric",
    version: "1.0.0",
    name: "Isometric",
    description: "30-degree orthographic projection delivering clean pseudo-3D engineering precision, layered blocks, and architectural dioramas.",
    category: "dimensional",
    philosophy: "Present complex systems, architectures, and components with technical isometric clarity without perspective distortion.",
    personality: ["architectural", "precise", "structured", "technical", "isometric"],
    recommendedPalettes: ["Electric Teal", "Cobalt Classic", "Royal Atlas", "Solar Cobalt"],
    typography: {
      headingFont: "Space Grotesk, Rajdhani, sans-serif",
      bodyFont: "Inter, sans-serif",
      scaleRatio: 1.25,
      fontWeights: { heading: 700, body: 400 },
      letterSpacing: "-0.01em",
    },
    shapeLanguage: {
      cornerRadius: "4px",
      borderWidth: "1.5px",
      borderStyle: "solid",
      geometricTendency: "rigid",
      aspectRatios: ["16:9", "4:3"],
    },
    layout: {
      density: "normal",
      gridStructure: "strict",
      alignment: "left",
      whitespaceRule: "structured",
    },
    graphics: {
      iconography: "solid",
      borders: "clean",
      dividers: "subtle",
      decorativeElements: ["isometric-cubes", "orthographic-grids", "slanted-planes"],
    },
    textures: {
      primaryTexture: "none",
      patternStyle: "geometric",
      intensity: 0.3,
    },
    surfaces: {
      materialType: "plastic",
      opacity: 0.95,
      blur: "0px",
    },
    lighting: {
      lightSource: "top-left",
      shadowStyle: "hard",
      elevationLevels: ["4px 6px 0px rgba(0,0,0,0.2)"],
      highlights: true,
    },
    background: {
      primaryTreatment: "pattern",
      compatibleBackgroundCapabilities: ["bg-grid", "bg-geometric"],
      recommendedBackground: "bg-grid",
    },
    components: {
      buttonTreatment: {
        borderRadius: "4px",
        shadow: "3px 4px 0px #002244",
        border: "1.5px solid #002244",
        hoverTransform: "translate(-2px, -2px)",
      },
      cardTreatment: {
        borderRadius: "8px",
        shadow: "6px 8px 0px rgba(0,34,68,0.15)",
        border: "1.5px solid rgba(0,34,68,0.2)",
        background: "#ffffff",
      },
      inputTreatment: {
        borderRadius: "4px",
        border: "1.5px solid #002244",
        focusRing: "3px solid #00ffff",
      },
    },
    motion: {
      compatibleMotionDNA: ["dna-snappy", "dna-minimal"],
      recommendedPresets: ["preset-slide-up"],
      animationIntensity: "moderate",
      transitionPacing: "snappy",
    },
    graphicsCompatibility: {
      canvasSupported: true,
      svgPreferred: true,
      blendingModes: ["normal"],
    },
    threeDCompatibility: {
      depthLevel: "2.5d",
      cameraAngle: "isometric",
      lightingModel: "flat",
      materialReflectivity: 0.2,
    },
    responsive: {
      mobileAdaptations: ["flatten-isometric-tilt-on-small-screens", "linearize-slanted-planes"],
      breakpointStrategy: "desktop-first",
    },
    accessibility: {
      contrastTarget: "AA",
      reducedMotionBehavior: "disable-transforms",
      readabilityNotes: "Keep text flat in standard 2D plane for optimal readability while illustrations remain isometric.",
    },
    react: {
      recommendedComponents: ["IsometricStage", "IsoCubeCard", "IsoGrid"],
      cssVariablesPrefix: "--af-style-isometric",
      styleProperties: {
        "--af-iso-angle": "rotateX(60deg) rotateZ(-45deg)",
        "--af-iso-shadow": "5px 7px 0px rgba(0,0,0,0.18)",
      },
    },
    examples: ["Isometric dashboard diorama", "30-degree cube card", "Orthographic architectural grid"],
    tags: ["isometric", "architectural", "precision", "3d", "orthographic", "cubes"],
  },
  {
    id: "ukiyo-e",
    version: "1.0.0",
    name: "Ukiyo-e",
    description: "Traditional Japanese woodblock print aesthetic: bold calligraphic black line work, flat mineral colors, and nature motifs.",
    category: "traditional",
    philosophy: "Channel the floating world ('Ukiyo') aesthetic with clean woodblock line contours, atmospheric gradients, and wave motifs.",
    personality: ["poetic", "traditional", "woodblock", "refined", "zen"],
    recommendedPalettes: ["Cobalt Classic", "Emerald Vermilion", "Forest Crimson", "Earth & Amber"],
    typography: {
      headingFont: "Shippori Mincho, Noto Serif JP, serif",
      bodyFont: "Noto Sans JP, sans-serif",
      scaleRatio: 1.333,
      fontWeights: { heading: 700, body: 400 },
      letterSpacing: "0.05em",
    },
    shapeLanguage: {
      cornerRadius: "4px",
      borderWidth: "1.5px",
      borderStyle: "solid",
      geometricTendency: "organic",
    },
    layout: {
      density: "spacious",
      gridStructure: "asymmetric",
      alignment: "left",
      whitespaceRule: "generous",
    },
    graphics: {
      iconography: "hand-drawn",
      borders: "clean",
      dividers: "decorative",
      decorativeElements: ["woodblock-waves", "cloud-scrolls", "vermilion-hanko-stamps", "fine-black-outlines"],
    },
    textures: {
      primaryTexture: "paper",
      patternStyle: "organic",
      intensity: 0.5,
    },
    surfaces: {
      materialType: "paper",
      opacity: 0.95,
      blur: "0px",
    },
    lighting: {
      lightSource: "ambient",
      shadowStyle: "none",
      elevationLevels: ["none"],
      highlights: false,
    },
    background: {
      primaryTreatment: "textured",
      compatibleBackgroundCapabilities: ["bg-wave", "bg-atmospheric"],
      recommendedBackground: "bg-wave",
    },
    components: {
      buttonTreatment: {
        borderRadius: "2px",
        shadow: "none",
        border: "1.5px solid #1a1a1a",
        hoverTransform: "translateY(-1px)",
      },
      cardTreatment: {
        borderRadius: "4px",
        shadow: "none",
        border: "1.5px solid #1a1a1a",
        background: "#f7f4ea",
      },
      inputTreatment: {
        borderRadius: "2px",
        border: "1.5px solid #1a1a1a",
        focusRing: "2px solid #c93a2b",
      },
    },
    motion: {
      compatibleMotionDNA: ["dna-calm", "dna-cinematic"],
      recommendedPresets: ["preset-fade-in"],
      animationIntensity: "subtle",
      transitionPacing: "smooth",
    },
    graphicsCompatibility: {
      canvasSupported: true,
      svgPreferred: true,
      blendingModes: ["multiply"],
    },
    threeDCompatibility: {
      depthLevel: "flat",
      cameraAngle: "front",
      lightingModel: "flat",
      materialReflectivity: 0,
    },
    responsive: {
      mobileAdaptations: ["scale-woodblock-wave-illustrations", "retain-washi-paper-warmth"],
      breakpointStrategy: "fluid",
    },
    accessibility: {
      contrastTarget: "AAA",
      reducedMotionBehavior: "fade-only",
      readabilityNotes: "Deep sumi black ink ensures maximum contrast against cream washi paper backgrounds.",
    },
    react: {
      recommendedComponents: ["HankoStamp", "WashiCard", "WoodblockHeader"],
      cssVariablesPrefix: "--af-style-ukiyo-e",
      styleProperties: {
        "--af-sumi-ink": "#1a1a1a",
        "--af-washi-bg": "#f7f4ea",
        "--af-hanko-red": "#c93a2b",
      },
    },
    examples: ["Great wave hero illustration", "Washi paper card with red seal", "Sumi ink divider"],
    tags: ["japanese", "woodblock", "washi", "traditional", "ink", "zen"],
  },
  {
    id: "brutalism",
    version: "1.0.0",
    name: "Brutalism",
    description: "Raw architectural unadorned honesty: unpolished surfaces, exposed grid scaffolding, heavy black borders, and stark utility.",
    category: "modernist",
    philosophy: "Expose structural truth without decorative apology: raw borders, naked layout grids, and unflinching typography.",
    personality: ["raw", "stark", "utilitarian", "uncompromising", "bold"],
    recommendedPalettes: ["Cobalt Classic", "Midnight Voltage", "Primary Pop", "Crimson Midnight"],
    typography: {
      headingFont: "Druk, Syne, Arial Black, sans-serif",
      bodyFont: "IBM Plex Mono, monospace",
      scaleRatio: 1.414,
      fontWeights: { heading: 900, body: 500 },
      letterSpacing: "-0.03em",
      textTransform: "uppercase",
    },
    shapeLanguage: {
      cornerRadius: "0px",
      borderWidth: "3px",
      borderStyle: "solid",
      geometricTendency: "rigid",
      aspectRatios: ["1:1", "16:9"],
    },
    layout: {
      density: "dense",
      gridStructure: "strict",
      alignment: "left",
      whitespaceRule: "structured",
    },
    graphics: {
      iconography: "solid",
      borders: "heavy",
      dividers: "prominent",
      decorativeElements: ["solid-black-rules", "crosshair-markers", "index-numbers"],
    },
    textures: {
      primaryTexture: "none",
      patternStyle: "none",
      intensity: 0,
    },
    surfaces: {
      materialType: "flat",
      opacity: 1,
      blur: "0px",
    },
    lighting: {
      lightSource: "ambient",
      shadowStyle: "hard",
      elevationLevels: ["4px 4px 0px #000000", "8px 8px 0px #000000"],
      highlights: false,
    },
    background: {
      primaryTreatment: "solid",
      compatibleBackgroundCapabilities: ["bg-grid", "bg-noise"],
      recommendedBackground: "bg-grid",
    },
    components: {
      buttonTreatment: {
        borderRadius: "0px",
        shadow: "4px 4px 0px #000000",
        border: "3px solid #000000",
        hoverTransform: "translate(-2px, -2px)",
      },
      cardTreatment: {
        borderRadius: "0px",
        shadow: "6px 6px 0px #000000",
        border: "3px solid #000000",
        background: "#ffffff",
      },
      inputTreatment: {
        borderRadius: "0px",
        border: "3px solid #000000",
        focusRing: "4px solid #000000",
      },
    },
    motion: {
      compatibleMotionDNA: ["dna-snappy", "dna-minimal"],
      recommendedPresets: ["preset-slide-up", "preset-fade-in"],
      animationIntensity: "moderate",
      transitionPacing: "snappy",
    },
    graphicsCompatibility: {
      canvasSupported: false,
      svgPreferred: true,
      blendingModes: ["normal"],
    },
    threeDCompatibility: {
      depthLevel: "flat",
      cameraAngle: "front",
      lightingModel: "flat",
      materialReflectivity: 0,
    },
    responsive: {
      mobileAdaptations: ["scale-down-massive-headings", "reduce-hard-shadow-offset-to-3px"],
      breakpointStrategy: "mobile-first",
    },
    accessibility: {
      contrastTarget: "AAA",
      reducedMotionBehavior: "disable-transforms",
      readabilityNotes: "Exceeds AAA contrast standards by design with pure black-on-white high contrast.",
    },
    react: {
      recommendedComponents: ["BrutalistButton", "BrutalistCard", "ScaffoldHeader"],
      cssVariablesPrefix: "--af-style-brutalism",
      styleProperties: {
        "--af-brutal-border": "3px solid #000000",
        "--af-brutal-shadow": "5px 5px 0px #000000",
      },
    },
    examples: ["Heavy stark headline hero", "Exposed grid card", "Hard-shadow block button"],
    tags: ["brutalist", "raw", "monochrome", "architectural", "bold", "stark"],
  },
  {
    id: "bauhaus",
    version: "1.0.0",
    name: "Bauhaus",
    description: "Form follows function: elemental primary shapes (circle, triangle, square), sans-serif typography, and rhythmic asymmetry.",
    category: "modernist",
    philosophy: "Merge fine arts, crafts, and industrial technology into clean, functional harmony where form strictly follows function.",
    personality: ["functional", "elemental", "rational", "harmonious", "timeless"],
    recommendedPalettes: ["Primary Pop", "Cobalt Classic", "Chromatic Riot"],
    typography: {
      headingFont: "Futura, Univers, sans-serif",
      bodyFont: "Helvetica Neue, Arial, sans-serif",
      scaleRatio: 1.333,
      fontWeights: { heading: 700, body: 400 },
      letterSpacing: "0.01em",
    },
    shapeLanguage: {
      cornerRadius: "0px",
      borderWidth: "2px",
      borderStyle: "solid",
      geometricTendency: "sharp",
      aspectRatios: ["1:1", "4:3"],
    },
    layout: {
      density: "normal",
      gridStructure: "strict",
      alignment: "left",
      whitespaceRule: "structured",
    },
    graphics: {
      iconography: "solid",
      borders: "clean",
      dividers: "prominent",
      decorativeElements: ["red-square", "yellow-triangle", "blue-circle"],
    },
    textures: {
      primaryTexture: "none",
      patternStyle: "geometric",
      intensity: 0,
    },
    surfaces: {
      materialType: "flat",
      opacity: 1,
      blur: "0px",
    },
    lighting: {
      lightSource: "ambient",
      shadowStyle: "none",
      elevationLevels: ["none"],
      highlights: false,
    },
    background: {
      primaryTreatment: "solid",
      compatibleBackgroundCapabilities: ["bg-geometric", "bg-grid"],
      recommendedBackground: "bg-geometric",
    },
    components: {
      buttonTreatment: {
        borderRadius: "0px",
        shadow: "none",
        border: "2px solid #000000",
        hoverTransform: "translateY(-1px)",
      },
      cardTreatment: {
        borderRadius: "0px",
        shadow: "none",
        border: "2px solid #000000",
        background: "#ffffff",
      },
      inputTreatment: {
        borderRadius: "0px",
        border: "2px solid #000000",
        focusRing: "2px solid #0047AB",
      },
    },
    motion: {
      compatibleMotionDNA: ["dna-minimal", "dna-snappy"],
      recommendedPresets: ["preset-slide-up", "preset-fade-in"],
      animationIntensity: "subtle",
      transitionPacing: "snappy",
    },
    graphicsCompatibility: {
      canvasSupported: false,
      svgPreferred: true,
      blendingModes: ["normal"],
    },
    threeDCompatibility: {
      depthLevel: "flat",
      cameraAngle: "front",
      lightingModel: "flat",
      materialReflectivity: 0,
    },
    responsive: {
      mobileAdaptations: ["stack-elemental-shapes", "preserve-primary-rhythms"],
      breakpointStrategy: "desktop-first",
    },
    accessibility: {
      contrastTarget: "AAA",
      reducedMotionBehavior: "fade-only",
      readabilityNotes: "Exemplary legibility through geometric sans-serif type and high contrast.",
    },
    react: {
      recommendedComponents: ["ElementalShape", "BauhausGrid", "RationalCard"],
      cssVariablesPrefix: "--af-style-bauhaus",
      styleProperties: {
        "--af-bauhaus-blue": "#0047AB",
        "--af-bauhaus-yellow": "#FFD166",
        "--af-bauhaus-red": "#EF476F",
      },
    },
    examples: ["Elemental primary hero", "Geometric circle-triangle badge", "Functional typography card"],
    tags: ["bauhaus", "modernist", "german", "functional", "primary", "rational"],
  },
  {
    id: "mid-century-modern",
    version: "1.0.0",
    name: "Mid-century Modern",
    description: "1950s atomic-age optimism: organic curves, warm teak and walnut woods, kidney bean tables, and sunburst motifs.",
    category: "retro",
    philosophy: "Celebrate post-war optimism by marrying clean industrial functionality with warm organic shapes and earthy color accents.",
    personality: ["warm", "atomic", "optimistic", "organic", "sophisticated"],
    recommendedPalettes: ["Earth & Amber", "Sage & Olive", "Mauve Terracotta", "Burnt Chocolate"],
    typography: {
      headingFont: "Century Gothic, Brandon Grotesque, sans-serif",
      bodyFont: "Jost, Futura, sans-serif",
      scaleRatio: 1.25,
      fontWeights: { heading: 600, body: 400 },
      letterSpacing: "0.02em",
    },
    shapeLanguage: {
      cornerRadius: "16px",
      borderWidth: "1px",
      borderStyle: "solid",
      geometricTendency: "organic",
      aspectRatios: ["16:9", "4:3"],
    },
    layout: {
      density: "spacious",
      gridStructure: "strict",
      alignment: "left",
      whitespaceRule: "generous",
    },
    graphics: {
      iconography: "line",
      borders: "clean",
      dividers: "subtle",
      decorativeElements: ["atomic-sunbursts", "boomerang-curves", "kidney-shapes"],
    },
    textures: {
      primaryTexture: "wood",
      patternStyle: "geometric",
      intensity: 0.3,
    },
    surfaces: {
      materialType: "flat",
      opacity: 0.98,
      blur: "0px",
    },
    lighting: {
      lightSource: "top-left",
      shadowStyle: "soft",
      elevationLevels: ["0 4px 12px rgba(60,40,20,0.08)"],
      highlights: false,
    },
    background: {
      primaryTreatment: "solid",
      compatibleBackgroundCapabilities: ["bg-spotlight", "bg-wave"],
      recommendedBackground: "bg-spotlight",
    },
    components: {
      buttonTreatment: {
        borderRadius: "9999px",
        shadow: "0 2px 6px rgba(0,0,0,0.1)",
        border: "1px solid #7c4728",
        hoverTransform: "translateY(-1px)",
      },
      cardTreatment: {
        borderRadius: "16px",
        shadow: "0 6px 18px rgba(0,0,0,0.06)",
        border: "1px solid rgba(124,71,40,0.15)",
        background: "#fbf8f3",
      },
      inputTreatment: {
        borderRadius: "12px",
        border: "1px solid #7c4728",
        focusRing: "0 0 0 3px rgba(124,71,40,0.15)",
      },
    },
    motion: {
      compatibleMotionDNA: ["dna-calm", "dna-snappy"],
      recommendedPresets: ["preset-fade-in", "preset-slide-up"],
      animationIntensity: "subtle",
      transitionPacing: "smooth",
    },
    graphicsCompatibility: {
      canvasSupported: false,
      svgPreferred: true,
      blendingModes: ["normal"],
    },
    threeDCompatibility: {
      depthLevel: "flat",
      cameraAngle: "front",
      lightingModel: "flat",
      materialReflectivity: 0.1,
    },
    responsive: {
      mobileAdaptations: ["retain-warm-cream-canvas", "scale-atomic-motifs"],
      breakpointStrategy: "fluid",
    },
    accessibility: {
      contrastTarget: "AA",
      reducedMotionBehavior: "fade-only",
      readabilityNotes: "Warm cream background with dark walnut body text ensures superior reading comfort.",
    },
    react: {
      recommendedComponents: ["KidneyCard", "AtomicBadge", "TeakButton"],
      cssVariablesPrefix: "--af-style-mcm",
      styleProperties: {
        "--af-teak-accent": "#c17c4e",
        "--af-walnut-dark": "#3e2719",
        "--af-mcm-cream": "#fbf8f3",
      },
    },
    examples: ["Atomic sunburst hero", "Kidney curve feature card", "Teak pill button"],
    tags: ["50s", "atomic", "retro", "wood", "warm", "organic"],
  },
];

// -------------------------------------------------------------------------------------------------
// Unified Schema Generator
// -------------------------------------------------------------------------------------------------

export function createVisualStyleSchema(): UnifiedMotionSchema {
  return createUnifiedSchema({
    id: "comp-visual-style",
    category: "composition",
    name: "VisualStyleDefinition",
    description: "Machine-readable contract for AF Motion visual design style definitions.",
    schema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Unique identifier for the visual style." },
        version: { type: "string", description: "Semantic version string." },
        name: { type: "string", description: "Human-readable name." },
        category: {
          type: "string",
          enum: ["retro", "skeuomorphic", "modernist", "experimental", "expressive", "dimensional", "traditional", "minimal", "cyber"],
          description: "Visual style classification category.",
        },
        philosophy: { type: "string", description: "Design philosophy and aesthetic tenets." },
        personality: { type: "array", description: "Personality keywords." },
        recommendedPalettes: { type: "array", description: "Compatible AF Motion palette names." },
        typography: { type: "object", description: "Typography scale and font preferences." },
        shapeLanguage: { type: "object", description: "Shape, corner radius, and border specifications." },
        layout: { type: "object", description: "Layout density and grid alignment." },
        graphics: { type: "object", description: "Iconography, dividers, and decorative accents." },
        textures: { type: "object", description: "Texture and pattern properties." },
        surfaces: { type: "object", description: "Material type, opacity, and backdrop filters." },
        lighting: { type: "object", description: "Shadows, elevation, and light source orientation." },
        background: { type: "object", description: "Background treatments and capability pairings." },
        components: { type: "object", description: "Component-specific styling presets." },
        motion: { type: "object", description: "Compatible Motion DNA and animation intensity." },
        graphicsCompatibility: { type: "object", description: "Canvas and SVG compatibility flags." },
        threeDCompatibility: { type: "object", description: "3D depth and projection characteristics." },
        responsive: { type: "object", description: "Responsive adaptation guidelines." },
        accessibility: { type: "object", description: "Contrast targets and reduced motion rules." },
        react: { type: "object", description: "React implementation metadata and CSS tokens." },
      },
      required: ["id", "version", "name", "category", "philosophy", "typography", "shapeLanguage", "components", "motion"],
    },
    tags: ["design", "style", "theme", "composition"],
  });
}

// -------------------------------------------------------------------------------------------------
// Validation Function
// -------------------------------------------------------------------------------------------------

export function validateVisualStyleDefinition(style: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!style || typeof style !== "object" || Array.isArray(style)) {
    return { valid: false, errors: ["VisualStyleDefinition must be a non-null object."] };
  }

  const s = style as Record<string, unknown>;

  if (typeof s.id !== "string" || !s.id.trim()) {
    errors.push('Property "id" must be a non-empty string.');
  }
  if (typeof s.version !== "string" || !s.version.trim()) {
    errors.push('Property "version" must be a non-empty string.');
  }
  if (typeof s.name !== "string" || !s.name.trim()) {
    errors.push('Property "name" must be a non-empty string.');
  }

  const validCategories: VisualStyleCategory[] = [
    "retro", "skeuomorphic", "modernist", "experimental", "expressive", "dimensional", "traditional", "minimal", "cyber",
  ];
  if (!validCategories.includes(s.category as VisualStyleCategory)) {
    errors.push(`Property "category" must be one of: [${validCategories.join(", ")}].`);
  }

  if (typeof s.philosophy !== "string") {
    errors.push('Property "philosophy" must be a string.');
  }
  if (!s.typography || typeof s.typography !== "object") {
    errors.push('Property "typography" must be an object.');
  }
  if (!s.shapeLanguage || typeof s.shapeLanguage !== "object") {
    errors.push('Property "shapeLanguage" must be an object.');
  }
  if (!s.components || typeof s.components !== "object") {
    errors.push('Property "components" must be an object.');
  }
  if (!s.motion || typeof s.motion !== "object") {
    errors.push('Property "motion" must be an object.');
  }

  return { valid: errors.length === 0, errors };
}

// -------------------------------------------------------------------------------------------------
// Style Compatibility Engine
// -------------------------------------------------------------------------------------------------

export function checkStyleCompatibility(
  styleOrId: string | VisualStyleDefinition,
  context: StyleCompatibilityContext = {},
): StyleCompatibilityReport {
  let style: VisualStyleDefinition | undefined;
  if (typeof styleOrId === "string") {
    style = visualStyleRegistry.getVisualStyle(styleOrId);
  } else {
    style = styleOrId;
  }

  if (!style) {
    return {
      compatible: false,
      score: 0,
      conflicts: [
        {
          type: "palette",
          message: `Unknown visual style: "${String(styleOrId)}".`,
          severity: "error",
        },
      ],
      recommendations: ["Register the visual style before testing compatibility."],
      suggestedPalettes: [],
      suggestedMotionDNA: [],
      suggestedBackgrounds: [],
    };
  }

  const conflicts: StyleConflict[] = [];
  const recommendations: string[] = [];
  let score = 1.0;

  // 1. Palette Compatibility Check
  const targetPalette = context.paletteName || context.paletteId;
  if (targetPalette) {
    const isRecommended = style.recommendedPalettes.some(
      (p) =>
        p.toLowerCase() === targetPalette.toLowerCase() ||
        p.toLowerCase().replace(/[^a-z0-9]/g, "") === targetPalette.toLowerCase().replace(/[^a-z0-9]/g, ""),
    );

    if (!isRecommended) {
      score -= 0.2;
      conflicts.push({
        type: "palette",
        message: `Palette "${targetPalette}" is not in the recommended list for ${style.name}.`,
        severity: "warning",
        resolution: `Recommended palettes: ${style.recommendedPalettes.join(", ")}.`,
      });
      recommendations.push(`Consider switching to one of ${style.name}'s native palettes: ${style.recommendedPalettes[0]}.`);
    }
  }

  // 2. Motion DNA Compatibility Check
  if (context.motionDNA) {
    const isMotionCompatible = style.motion.compatibleMotionDNA.some(
      (m) =>
        m.toLowerCase() === context.motionDNA!.toLowerCase() ||
        m.toLowerCase().replace(/dna-/, "") === context.motionDNA!.toLowerCase().replace(/dna-/, ""),
    );

    if (!isMotionCompatible) {
      score -= 0.25;
      conflicts.push({
        type: "motion",
        message: `Motion DNA "${context.motionDNA}" contrasts with ${style.name}'s motion personality.`,
        severity: "warning",
        resolution: `Recommended Motion DNA: ${style.motion.compatibleMotionDNA.join(", ")}.`,
      });
      recommendations.push(`Pair with compatible Motion DNA: "${style.motion.compatibleMotionDNA[0]}".`);
    }
  }

  // 3. Background Capability Compatibility Check
  if (context.backgroundCapability) {
    const isBgCompatible = style.background.compatibleBackgroundCapabilities.some(
      (bg) => bg.toLowerCase() === context.backgroundCapability!.toLowerCase(),
    );

    if (!isBgCompatible) {
      score -= 0.15;
      conflicts.push({
        type: "background",
        message: `Background "${context.backgroundCapability}" is not optimized for ${style.name}.`,
        severity: "warning",
        resolution: `Recommended background: ${style.background.recommendedBackground}.`,
      });
      recommendations.push(`Use recommended background capability "${style.background.recommendedBackground}".`);
    }
  }

  // 4. 3D Depth Check
  if (context.threeDDepth) {
    if (context.threeDDepth !== style.threeDCompatibility.depthLevel) {
      score -= 0.1;
      conflicts.push({
        type: "3d",
        message: `Requested 3D depth level "${context.threeDDepth}" differs from ${style.name}'s native "${style.threeDCompatibility.depthLevel}".`,
        severity: "warning",
      });
    }
  }

  // 5. Accessibility Strict Check
  if (context.accessibilityStrict && style.accessibility.contrastTarget === "AA") {
    recommendations.push(`For strict AAA accessibility with ${style.name}, apply high-contrast border overrides.`);
  }

  score = Math.max(0, Math.min(1, Math.round(score * 100) / 100));

  return {
    compatible: conflicts.every((c) => c.severity !== "error") && score >= 0.5,
    score,
    conflicts,
    recommendations,
    suggestedPalettes: style.recommendedPalettes,
    suggestedMotionDNA: style.motion.compatibleMotionDNA,
    suggestedBackgrounds: style.background.compatibleBackgroundCapabilities,
  };
}

// -------------------------------------------------------------------------------------------------
// Style Resolution Engine
// -------------------------------------------------------------------------------------------------

export function resolveVisualStyle(
  styleOrId: string | VisualStyleDefinition,
  overrides?: Partial<ResolvedVisualStyle>,
): ResolvedVisualStyle | undefined {
  let style: VisualStyleDefinition | undefined;
  if (typeof styleOrId === "string") {
    style = visualStyleRegistry.getVisualStyle(styleOrId);
  } else {
    style = styleOrId;
  }

  if (!style) return undefined;

  const prefix = style.react.cssVariablesPrefix;

  const defaultCssVariables: Record<string, string> = {
    [`${prefix}-corner-radius`]: style.shapeLanguage.cornerRadius,
    [`${prefix}-border-width`]: style.shapeLanguage.borderWidth,
    [`${prefix}-border-style`]: style.shapeLanguage.borderStyle,
    [`${prefix}-opacity`]: String(style.surfaces.opacity),
    [`${prefix}-blur`]: style.surfaces.blur,
    [`${prefix}-shadow`]: style.lighting.elevationLevels[0] ?? "none",
    ...style.react.styleProperties,
  };

  const resolved: ResolvedVisualStyle = {
    styleId: style.id,
    styleName: style.name,
    category: style.category,
    palette: {
      name: overrides?.palette?.name ?? style.recommendedPalettes[0] ?? "Cobalt Classic",
      primary: overrides?.palette?.primary ?? "#111111",
      secondary: overrides?.palette?.secondary ?? "#FFFFFF",
      accent: overrides?.palette?.accent ?? "#0047AB",
      background: overrides?.palette?.background ?? "#FFFFFF",
      surface: overrides?.palette?.surface ?? "#FFFFFF",
    },
    typography: {
      ...style.typography,
      ...(overrides?.typography ?? {}),
    },
    shapeLanguage: {
      ...style.shapeLanguage,
      ...(overrides?.shapeLanguage ?? {}),
    },
    surfaces: {
      ...style.surfaces,
      ...(overrides?.surfaces ?? {}),
    },
    lighting: {
      ...style.lighting,
      ...(overrides?.lighting ?? {}),
    },
    background: {
      ...style.background,
      ...(overrides?.background ?? {}),
    },
    components: {
      ...style.components,
      ...(overrides?.components ?? {}),
    },
    motion: {
      ...style.motion,
      ...(overrides?.motion ?? {}),
    },
    responsive: {
      ...style.responsive,
      ...(overrides?.responsive ?? {}),
    },
    accessibility: {
      ...style.accessibility,
      ...(overrides?.accessibility ?? {}),
    },
    cssVariables: {
      ...defaultCssVariables,
      ...(overrides?.cssVariables ?? {}),
    },
  };

  return resolved;
}

// -------------------------------------------------------------------------------------------------
// Visual Style Registry Implementation
// -------------------------------------------------------------------------------------------------

export function createVisualStyleRegistry(initialStyles: readonly VisualStyleDefinition[] = BUILT_IN_STYLES): VisualStyleRegistry {
  const builtInMap = new Map<string, VisualStyleDefinition>();
  const customMap = new Map<string, VisualStyleDefinition>();
  const listeners = new Set<() => void>();
  let version = 0;
  let cachedList: readonly VisualStyleDefinition[] | null = null;

  for (const style of initialStyles) {
    builtInMap.set(style.id, Object.freeze({ ...style, custom: false }));
  }

  function notify(): void {
    version++;
    cachedList = null;
    for (const listener of listeners) {
      try {
        listener();
      } catch {}
    }
  }

  function getAllStyles(): readonly VisualStyleDefinition[] {
    if (cachedList) return cachedList;
    const list: VisualStyleDefinition[] = [];
    for (const s of builtInMap.values()) {
      if (!customMap.has(s.id)) {
        list.push(s);
      }
    }
    for (const s of customMap.values()) {
      list.push(s);
    }
    cachedList = Object.freeze(list);
    return cachedList;
  }

  return {
    registerVisualStyle(style: VisualStyleDefinition, options?: { override?: boolean }): void {
      const validation = validateVisualStyleDefinition(style);
      if (!validation.valid) {
        throw new Error(`Cannot register invalid VisualStyleDefinition: ${validation.errors.join("; ")}`);
      }

      if (builtInMap.has(style.id) && !options?.override) {
        throw new Error(`Visual style "${style.id}" is a built-in style. Pass override: true to replace it.`);
      }

      customMap.set(style.id, Object.freeze({ ...style, custom: true }));
      notify();
    },

    unregisterVisualStyle(id: string): boolean {
      if (customMap.has(id)) {
        customMap.delete(id);
        notify();
        return true;
      }
      return false;
    },

    getVisualStyle(id: string): VisualStyleDefinition | undefined {
      return customMap.get(id) ?? builtInMap.get(id);
    },

    hasVisualStyle(id: string): boolean {
      return customMap.has(id) || builtInMap.has(id);
    },

    listVisualStyles(filter?: VisualStyleFilter): readonly VisualStyleDefinition[] {
      let list = getAllStyles();

      if (!filter) return list;

      if (filter.category) {
        list = list.filter((s) => s.category === filter.category);
      }
      if (filter.tag) {
        const queryTag = filter.tag.toLowerCase();
        list = list.filter((s) => s.tags.some((t) => t.toLowerCase() === queryTag));
      }
      if (filter.palette) {
        const queryPal = filter.palette.toLowerCase();
        list = list.filter((s) => s.recommendedPalettes.some((p) => p.toLowerCase().includes(queryPal)));
      }
      if (filter.motionDNA) {
        const queryDNA = filter.motionDNA.toLowerCase();
        list = list.filter((s) => s.motion.compatibleMotionDNA.some((m) => m.toLowerCase().includes(queryDNA)));
      }
      if (filter.backgroundCapability) {
        const queryBg = filter.backgroundCapability.toLowerCase();
        list = list.filter((s) => s.background.compatibleBackgroundCapabilities.some((bg) => bg.toLowerCase().includes(queryBg)));
      }
      if (filter.depthLevel) {
        list = list.filter((s) => s.threeDCompatibility.depthLevel === filter.depthLevel);
      }

      return list;
    },

    searchVisualStyles(query: string): readonly VisualStyleDefinition[] {
      if (!query || !query.trim()) return getAllStyles();

      const q = query.toLowerCase().trim();
      return getAllStyles().filter(
        (s) =>
          s.id.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.philosophy.toLowerCase().includes(q) ||
          s.tags.some((t) => t.toLowerCase().includes(q)) ||
          s.personality.some((p) => p.toLowerCase().includes(q)),
      );
    },

    getCompatibleStyles(context: StyleCompatibilityContext): readonly VisualStyleDefinition[] {
      return getAllStyles().filter((style) => {
        const report = checkStyleCompatibility(style, context);
        return report.compatible;
      });
    },

    registerCustomVisualStyle(style: VisualStyleDefinition): void {
      this.registerVisualStyle(style, { override: true });
    },

    validateVisualStyleDefinition,

    exportVisualStylesJson(options?: { pretty?: boolean }): string {
      return JSON.stringify(getAllStyles(), null, options?.pretty ? 2 : undefined);
    },

    importVisualStylesFromJson(json: string, options?: { override?: boolean }): { imported: number; errors: string[] } {
      const errors: string[] = [];
      let imported = 0;

      try {
        const parsed = JSON.parse(json, (k, v) => (k === "__proto__" || k === "constructor" || k === "prototype" ? undefined : v));
        const items = Array.isArray(parsed) ? parsed : [parsed];

        for (const item of items) {
          const val = validateVisualStyleDefinition(item);
          if (val.valid) {
            try {
              this.registerVisualStyle(item as VisualStyleDefinition, options);
              imported++;
            } catch (regErr: unknown) {
              errors.push(regErr instanceof Error ? regErr.message : String(regErr));
            }
          } else {
            errors.push(`Invalid style "${item?.id ?? "unknown"}": ${val.errors.join("; ")}`);
          }
        }
      } catch (err: unknown) {
        errors.push(`JSON parse failure: ${err instanceof Error ? err.message : String(err)}`);
      }

      return { imported, errors };
    },

    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    getVersion(): number {
      return version;
    },

    count(): number {
      return getAllStyles().length;
    },

    getCategories(): readonly VisualStyleCategory[] {
      const set = new Set<VisualStyleCategory>();
      for (const s of getAllStyles()) {
        set.add(s.category);
      }
      return Array.from(set);
    },

    getTags(): readonly string[] {
      const set = new Set<string>();
      for (const s of getAllStyles()) {
        for (const t of s.tags) {
          set.add(t);
        }
      }
      return Array.from(set).sort();
    },

    reset(): void {
      customMap.clear();
      notify();
    },
  };
}

/**
 * Global singleton Visual Style Registry pre-populated with all 19 foundation styles.
 */
export const visualStyleRegistry: VisualStyleRegistry = createVisualStyleRegistry();

// ============================================================================
// Style Implementations: Skeuomorphism, Neumorphism & Art Nouveau (Prompt 65)
// ============================================================================

export type SkeuomorphicMaterial = "leather" | "metal" | "glass" | "plastic";

export interface SkeuomorphicStyleOptions {
  readonly material?: SkeuomorphicMaterial;
  readonly elevation?: number;
  readonly pressed?: boolean;
  readonly highlight?: boolean;
  readonly highContrast?: boolean;
  readonly customAccent?: string;
}

export interface SkeuomorphicStyleResult {
  readonly background: string;
  readonly boxShadow: string;
  readonly border: string;
  readonly color: string;
  readonly textShadow: string;
  readonly borderRadius: string;
  readonly backdropFilter?: string;
}

export function computeSkeuomorphicStyle(
  options: SkeuomorphicStyleOptions = {},
): SkeuomorphicStyleResult {
  const {
    material = "metal",
    elevation = 1,
    pressed = false,
    highContrast = false,
  } = options;

  switch (material) {
    case "leather": {
      const bg = pressed
        ? "linear-gradient(180deg, #2a1b11 0%, #342316 50%, #3e2b1d 100%)"
        : "linear-gradient(180deg, #443224 0%, #362417 50%, #291a10 100%)";
      const border = highContrast ? "2px solid #ffffff" : "1px solid #1a1007";
      const shadow = pressed
        ? "inset 0 3px 6px rgba(0,0,0,0.7), 0 1px 1px rgba(255,255,255,0.1)"
        : elevation === 0
          ? "inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.5)"
          : elevation === 1
            ? "0 2px 4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.5)"
            : elevation === 2
              ? "0 4px 10px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(0,0,0,0.6)"
              : "0 8px 18px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.3)";
      return {
        background: bg,
        border,
        boxShadow: shadow,
        color: "#f4eedb",
        textShadow: pressed ? "0 1px 0 rgba(0,0,0,0.9)" : "0 -1px 0 rgba(0,0,0,0.9)",
        borderRadius: "8px",
      };
    }
    case "glass": {
      const bg = pressed
        ? "linear-gradient(180deg, rgba(240,245,255,0.2) 0%, rgba(255,255,255,0.35) 100%)"
        : "linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 49%, rgba(240,245,255,0.08) 50%, rgba(255,255,255,0.25) 100%)";
      const border = highContrast ? "2px solid #000000" : "1px solid rgba(255,255,255,0.6)";
      const shadow = pressed
        ? "inset 0 2px 6px rgba(0,0,0,0.25), 0 1px 2px rgba(255,255,255,0.3)"
        : elevation === 0
          ? "inset 0 1px 1px rgba(255,255,255,0.8)"
          : elevation === 1
            ? "0 4px 12px rgba(0,0,0,0.12), inset 0 1px 1px rgba(255,255,255,0.85)"
            : elevation === 2
              ? "0 8px 24px rgba(0,0,0,0.18), inset 0 1px 1px rgba(255,255,255,0.9)"
              : "0 14px 32px rgba(0,0,0,0.24), inset 0 1px 2px rgba(255,255,255,0.95)";
      return {
        background: bg,
        border,
        boxShadow: shadow,
        color: "#0f172a",
        textShadow: "0 1px 2px rgba(255,255,255,0.6)",
        borderRadius: "10px",
        backdropFilter: "blur(12px) saturate(160%)",
      };
    }
    case "plastic": {
      const bg = pressed
        ? "linear-gradient(180deg, #1d4ed8 0%, #2563eb 50%, #3b82f6 100%)"
        : "linear-gradient(180deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)";
      const border = highContrast ? "2px solid #ffffff" : "1px solid #1e40af";
      const shadow = pressed
        ? "inset 0 3px 6px rgba(0,0,0,0.4), 0 1px 1px rgba(255,255,255,0.3)"
        : elevation === 0
          ? "inset 0 1px 0 rgba(255,255,255,0.6), inset 0 -1px 1px rgba(0,0,0,0.3)"
          : elevation === 1
            ? "0 2px 5px rgba(30,64,175,0.4), inset 0 1px 0 rgba(255,255,255,0.7), inset 0 -1px 2px rgba(0,0,0,0.35)"
            : elevation === 2
              ? "0 4px 10px rgba(30,64,175,0.45), inset 0 1px 0 rgba(255,255,255,0.8), inset 0 -1px 2px rgba(0,0,0,0.4)"
              : "0 8px 18px rgba(30,64,175,0.5), inset 0 1px 1px rgba(255,255,255,0.85)";
      return {
        background: bg,
        border,
        boxShadow: shadow,
        color: "#ffffff",
        textShadow: "0 -1px 1px rgba(0,0,0,0.5)",
        borderRadius: "8px",
      };
    }
    case "metal":
    default: {
      const bg = pressed
        ? "linear-gradient(180deg, #b8c0c9 0%, #cad1db 50%, #dbe0e7 100%)"
        : "linear-gradient(180deg, #f7f8fa 0%, #e1e5eb 48%, #caced5 52%, #bec5ce 100%)";
      const border = highContrast ? "2px solid #000000" : "1px solid #9ea5af";
      const shadow = pressed
        ? "inset 0 2px 5px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.8)"
        : elevation === 0
          ? "inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(0,0,0,0.2)"
          : elevation === 1
            ? "0 2px 4px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(0,0,0,0.2)"
            : elevation === 2
              ? "0 4px 8px rgba(0,0,0,0.25), inset 0 1px 1px rgba(255,255,255,1), inset 0 -1px 1px rgba(0,0,0,0.25)"
              : "0 8px 16px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,1)";
      return {
        background: bg,
        border,
        boxShadow: shadow,
        color: "#1f2937",
        textShadow: pressed ? "none" : "0 1px 0 rgba(255,255,255,0.9)",
        borderRadius: "6px",
      };
    }
  }
}

export type NeumorphicShape = "flat" | "convex" | "concave" | "pressed";
export type NeumorphicLightSource = "top-left" | "top-right" | "bottom-left" | "bottom-right";

export interface NeumorphicStyleOptions {
  readonly shape?: NeumorphicShape;
  readonly surfaceColor?: string;
  readonly distance?: number;
  readonly blur?: number;
  readonly intensity?: number;
  readonly lightSource?: NeumorphicLightSource;
  readonly accessibleContrast?: boolean;
  readonly pressed?: boolean;
}

export interface NeumorphicStyleResult {
  readonly background: string;
  readonly boxShadow: string;
  readonly border: string;
  readonly color: string;
  readonly outline?: string;
  readonly borderRadius: string;
}

function isColorDark(hexOrRgb: string): boolean {
  if (hexOrRgb.startsWith("#")) {
    let hex = hexOrRgb.slice(1);
    if (hex.length === 3) {
      hex = hex.split("").map((c) => c + c).join("");
    }
    const r = parseInt(hex.substring(0, 2), 16) || 0;
    const g = parseInt(hex.substring(2, 4), 16) || 0;
    const b = parseInt(hex.substring(4, 6), 16) || 0;
    return (r * 299 + g * 587 + b * 114) / 1000 < 128;
  }
  return false;
}

function adjustBrightness(hex: string, percent: number): string {
  if (!hex.startsWith("#")) return hex;
  let clean = hex.slice(1);
  if (clean.length === 3) {
    clean = clean.split("").map((c) => c + c).join("");
  }
  let r = parseInt(clean.substring(0, 2), 16) || 0;
  let g = parseInt(clean.substring(2, 4), 16) || 0;
  let b = parseInt(clean.substring(4, 6), 16) || 0;

  r = Math.min(255, Math.max(0, Math.round(r + 255 * percent)));
  g = Math.min(255, Math.max(0, Math.round(g + 255 * percent)));
  b = Math.min(255, Math.max(0, Math.round(b + 255 * percent)));

  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export function computeNeumorphicStyle(
  options: NeumorphicStyleOptions = {},
): NeumorphicStyleResult {
  const {
    shape = "flat",
    surfaceColor = "#e0e5ec",
    distance = 6,
    blur = 12,
    intensity = 0.15,
    lightSource = "top-left",
    accessibleContrast = false,
    pressed = false,
  } = options;

  const isDark = isColorDark(surfaceColor);

  let darkX = distance;
  let darkY = distance;
  let lightX = -distance;
  let lightY = -distance;

  if (lightSource === "top-right") {
    lightX = distance;
    lightY = -distance;
    darkX = -distance;
    darkY = distance;
  } else if (lightSource === "bottom-left") {
    lightX = -distance;
    lightY = distance;
    darkX = distance;
    darkY = -distance;
  } else if (lightSource === "bottom-right") {
    lightX = distance;
    lightY = distance;
    darkX = -distance;
    darkY = -distance;
  }

  const darkAlpha = isDark ? 0.45 + intensity * 0.3 : 0.25 + intensity * 0.35;
  const lightAlpha = isDark ? 0.06 + intensity * 0.08 : 0.75 + intensity * 0.2;

  const darkRgba = isDark
    ? `rgba(0, 0, 0, ${darkAlpha.toFixed(2)})`
    : `rgba(163, 177, 198, ${darkAlpha.toFixed(2)})`;
  const lightRgba = `rgba(255, 255, 255, ${lightAlpha.toFixed(2)})`;

  const isPressedState = pressed || shape === "pressed";

  let boxShadow = "";
  if (isPressedState) {
    boxShadow = `inset ${darkX}px ${darkY}px ${blur}px ${darkRgba}, inset ${lightX}px ${lightY}px ${blur}px ${lightRgba}`;
  } else {
    boxShadow = `${darkX}px ${darkY}px ${blur}px ${darkRgba}, ${lightX}px ${lightY}px ${blur}px ${lightRgba}`;
  }

  let background = surfaceColor;
  if (!isPressedState) {
    if (shape === "convex") {
      background = `linear-gradient(145deg, ${adjustBrightness(surfaceColor, 0.06)}, ${adjustBrightness(surfaceColor, -0.06)})`;
    } else if (shape === "concave") {
      background = `linear-gradient(145deg, ${adjustBrightness(surfaceColor, -0.06)}, ${adjustBrightness(surfaceColor, 0.06)})`;
    }
  }

  const border = accessibleContrast
    ? isDark
      ? "1px solid rgba(255, 255, 255, 0.3)"
      : "1px solid rgba(0, 0, 0, 0.25)"
    : "1px solid transparent";

  const outline = accessibleContrast
    ? isDark
      ? "1px solid rgba(255, 255, 255, 0.15)"
      : "1px solid rgba(0, 0, 0, 0.1)"
    : "none";

  const color = isDark ? "#f1f5f9" : "#1e293b";

  return {
    background,
    boxShadow,
    border,
    color,
    outline,
    borderRadius: "16px",
  };
}

export type ArtNouveauVariant = "parchment" | "sage" | "terracotta" | "dark-emerald";

export interface ArtNouveauStyleOptions {
  readonly variant?: ArtNouveauVariant;
  readonly cornerRadius?: string;
  readonly ornateBorder?: boolean;
  readonly asymmetric?: boolean;
  readonly highContrast?: boolean;
}

export interface ArtNouveauStyleResult {
  readonly background: string;
  readonly borderColor: string;
  readonly borderWidth: string;
  readonly borderStyle: string;
  readonly borderRadius: string;
  readonly color: string;
  readonly accentColor: string;
  readonly boxShadow: string;
  readonly fontFamily: string;
  readonly letterSpacing: string;
}

export function computeArtNouveauStyle(
  options: ArtNouveauStyleOptions = {},
): ArtNouveauStyleResult {
  const {
    variant = "parchment",
    cornerRadius = "24px",
    ornateBorder = true,
    asymmetric = false,
    highContrast = false,
  } = options;

  let bg = "#faf7f0";
  let border = "#2e4a36";
  let text = "#233327";
  let accent = "#c69255";

  if (variant === "sage") {
    bg = "#e8efe9";
    border = "#1b3b28";
    text = "#1b3b28";
    accent = "#b07d4b";
  } else if (variant === "terracotta") {
    bg = "#fcf3ef";
    border = "#8b3a2b";
    text = "#4a1c14";
    accent = "#d48b55";
  } else if (variant === "dark-emerald") {
    bg = "#14241b";
    border = "#d4af37";
    text = "#f4f1ea";
    accent = "#e5c158";
  }

  const radius = asymmetric ? "32px 12px 32px 12px" : cornerRadius;
  const borderWidth = highContrast ? "2px" : ornateBorder ? "1.5px" : "1px";
  const borderColor = highContrast ? (variant === "dark-emerald" ? "#ffffff" : "#000000") : border;

  return {
    background: bg,
    borderColor,
    borderWidth,
    borderStyle: "solid",
    borderRadius: radius,
    color: highContrast ? (variant === "dark-emerald" ? "#ffffff" : "#000000") : text,
    accentColor: accent,
    boxShadow: "0 6px 20px rgba(0, 0, 0, 0.06)",
    fontFamily: "Cinzel Decorative, Playfair Display, 'EB Garamond', Georgia, serif",
    letterSpacing: "0.03em",
  };
}

export const ART_NOUVEAU_WHIPLASH_PATH =
  "M 0 20 C 30 5, 50 35, 80 20 C 110 5, 130 35, 160 20 C 190 5, 210 35, 240 20";
export const ART_NOUVEAU_CORNER_PATH =
  "M 4 36 C 4 18, 18 4, 36 4 C 24 10, 10 24, 4 36 Z M 4 24 C 8 14, 14 8, 24 4";
export const ART_NOUVEAU_DIVIDER_PATH =
  "M 0 15 C 40 0, 60 30, 100 15 C 120 7, 130 5, 150 15 C 170 25, 180 23, 200 15 C 240 0, 260 30, 300 15";

export interface StyleMotionConfig {
  readonly preset: string;
  readonly transition: string;
  readonly spring: {
    readonly stiffness: number;
    readonly damping: number;
    readonly mass: number;
  };
}

export function getStyleMotionConfig(styleId: string): StyleMotionConfig {
  switch (styleId) {
    case "skeuomorphism":
      return {
        preset: "preset-bounce",
        transition: "transform 150ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 150ms ease",
        spring: { stiffness: 350, damping: 25, mass: 1 },
      };
    case "neumorphism":
      return {
        preset: "preset-fade-in",
        transition: "box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1), transform 200ms ease, background 200ms ease",
        spring: { stiffness: 220, damping: 30, mass: 0.8 },
      };
    case "art-nouveau":
      return {
        preset: "preset-fade-in",
        transition: "all 300ms cubic-bezier(0.25, 0.1, 0.25, 1)",
        spring: { stiffness: 180, damping: 35, mass: 1.2 },
      };
    case "liquid-chrome":
      return {
        preset: "preset-scale-in",
        transition: "all 250ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        spring: { stiffness: 280, damping: 22, mass: 0.9 },
      };
    case "de-stijl":
      return {
        preset: "preset-slide-in-left",
        transition: "transform 100ms ease, background-color 120ms ease",
        spring: { stiffness: 450, damping: 30, mass: 1 },
      };
    case "memphis":
      return {
        preset: "preset-scale-in",
        transition: "transform 150ms cubic-bezier(0.68, -0.55, 0.27, 1.55), box-shadow 150ms ease",
        spring: { stiffness: 380, damping: 18, mass: 0.9 },
      };
    case "psychedelic":
      return {
        preset: "preset-scale-in",
        transition: "transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 250ms ease, background 300ms ease",
        spring: { stiffness: 320, damping: 20, mass: 1 },
      };
    case "vaporwave":
      return {
        preset: "preset-fade-in",
        transition: "all 200ms cubic-bezier(0.2, 0.8, 0.2, 1)",
        spring: { stiffness: 220, damping: 28, mass: 1 },
      };
    case "steampunk":
      return {
        preset: "preset-fade-in",
        transition: "transform 150ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 150ms ease",
        spring: { stiffness: 420, damping: 32, mass: 1.4 },
      };
    case "grunge":
      return {
        preset: "preset-scale-in",
        transition: "transform 120ms steps(3, end), box-shadow 120ms ease",
        spring: { stiffness: 450, damping: 22, mass: 1 },
      };
    case "paper-cutout":
      return {
        preset: "preset-slide-in-up",
        transition: "transform 180ms cubic-bezier(0.34, 1.3, 0.64, 1), box-shadow 180ms ease",
        spring: { stiffness: 300, damping: 24, mass: 0.9 },
      };
    case "glitch":
      return {
        preset: "preset-scale-in",
        transition: "transform 80ms steps(2, jump-none), text-shadow 80ms steps(2, jump-none), box-shadow 100ms ease",
        spring: { stiffness: 500, damping: 15, mass: 0.7 },
      };
    case "anti-design":
      return {
        preset: "preset-scale-in",
        transition: "transform 100ms cubic-bezier(0.68, -0.55, 0.27, 1.55), box-shadow 100ms ease",
        spring: { stiffness: 480, damping: 18, mass: 0.8 },
      };
    case "3d-inflated":
      return {
        preset: "preset-scale-in",
        transition: "transform 240ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 240ms ease",
        spring: { stiffness: 260, damping: 14, mass: 1.1 },
      };
    case "isometric":
      return {
        preset: "preset-slide-in-up",
        transition: "transform 150ms cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 150ms ease",
        spring: { stiffness: 380, damping: 28, mass: 1.2 },
      };
    case "ukiyo-e":
      return {
        preset: "preset-fade-in",
        transition: "all 300ms cubic-bezier(0.25, 0.1, 0.25, 1)",
        spring: { stiffness: 200, damping: 30, mass: 1 },
      };
    case "brutalism":
      return {
        preset: "preset-scale-in",
        transition: "transform 80ms ease, box-shadow 80ms ease",
        spring: { stiffness: 500, damping: 25, mass: 1 },
      };
    case "bauhaus":
      return {
        preset: "preset-slide-in-left",
        transition: "transform 140ms ease, background-color 140ms ease",
        spring: { stiffness: 400, damping: 28, mass: 1 },
      };
    case "mid-century-modern":
      return {
        preset: "preset-scale-in",
        transition: "transform 200ms cubic-bezier(0.34, 1.25, 0.64, 1), box-shadow 200ms ease",
        spring: { stiffness: 280, damping: 24, mass: 1 },
      };
    default:
      return {
        preset: "preset-fade-in",
        transition: "all 200ms ease",
        spring: { stiffness: 250, damping: 25, mass: 1 },
      };
  }
}



// ============================================================================
// Style Implementations: Liquid Chrome, De Stijl & Memphis (Prompt 66)
// ============================================================================

export type LiquidChromeVariant = "mirror" | "iridescent" | "dark-mercury" | "holographic";

export interface LiquidChromeStyleOptions {
  readonly variant?: LiquidChromeVariant;
  readonly elevation?: number;
  readonly pressed?: boolean;
  readonly highContrast?: boolean;
  readonly fluidBorder?: boolean;
}

export interface LiquidChromeStyleResult {
  readonly background: string;
  readonly border: string;
  readonly borderRadius: string;
  readonly boxShadow: string;
  readonly color: string;
  readonly textShadow: string;
  readonly backdropFilter?: string;
}

export function computeLiquidChromeStyle(
  options: LiquidChromeStyleOptions = {},
): LiquidChromeStyleResult {
  const {
    variant = "mirror",
    elevation = 1,
    pressed = false,
    highContrast = false,
    fluidBorder = true,
  } = options;

  let bg = "";
  let border = "";
  let textColor = "";
  let shadowGlow = "";
  let textShadow = "";

  switch (variant) {
    case "iridescent":
      bg = pressed
        ? "linear-gradient(135deg, #e0e7ff 0%, #fbcfe8 25%, #bae6fd 50%, #f5d0fe 75%, #e2e8f0 100%)"
        : "linear-gradient(135deg, #f8fafc 0%, #c7d2fe 25%, #f472b6 48%, #38bdf8 72%, #f1f5f9 100%)";
      border = highContrast
        ? "2px solid #000000"
        : fluidBorder
          ? "1px solid rgba(244, 114, 182, 0.6)"
          : "1px solid rgba(255, 255, 255, 0.6)";
      textColor = "#0f172a";
      shadowGlow = pressed
        ? "inset 0 2px 6px rgba(0, 0, 0, 0.25), 0 0 16px rgba(244, 114, 182, 0.4)"
        : elevation === 0
          ? "inset 0 1px 2px rgba(255, 255, 255, 0.9), 0 0 12px rgba(56, 189, 248, 0.25)"
          : elevation === 1
            ? "0 4px 16px rgba(0, 0, 0, 0.15), inset 0 1px 2px rgba(255, 255, 255, 0.9), 0 0 24px rgba(244, 114, 182, 0.35)"
            : "0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.95), 0 0 36px rgba(168, 85, 247, 0.4)";
      textShadow = "0 1px 2px rgba(255, 255, 255, 0.8)";
      break;

    case "dark-mercury":
      bg = pressed
        ? "linear-gradient(135deg, #090d16 0%, #1e293b 35%, #020617 65%, #1e293b 100%)"
        : "linear-gradient(135deg, #1e293b 0%, #475569 30%, #0f172a 60%, #334155 100%)";
      border = highContrast ? "2px solid #ffffff" : "1px solid rgba(148, 163, 184, 0.4)";
      textColor = "#f8fafc";
      shadowGlow = pressed
        ? "inset 0 3px 8px rgba(0, 0, 0, 0.8), 0 0 12px rgba(0, 255, 255, 0.2)"
        : elevation === 0
          ? "inset 0 1px 1px rgba(255, 255, 255, 0.2), 0 0 10px rgba(0, 0, 0, 0.5)"
          : elevation === 1
            ? "0 6px 20px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.3), 0 0 20px rgba(56, 189, 248, 0.25)"
            : "0 12px 36px rgba(0, 0, 0, 0.8), inset 0 1px 2px rgba(255, 255, 255, 0.4), 0 0 30px rgba(56, 189, 248, 0.4)";
      textShadow = "0 1px 3px rgba(0, 0, 0, 0.8)";
      break;

    case "holographic":
      bg = pressed
        ? "linear-gradient(135deg, #a855f7 0%, #06b6d4 35%, #10b981 70%, #ec4899 100%)"
        : "linear-gradient(135deg, #c084fc 0%, #38bdf8 30%, #34d399 65%, #f472b6 100%)";
      border = highContrast ? "2px solid #000000" : "1px solid rgba(255, 255, 255, 0.7)";
      textColor = "#0f172a";
      shadowGlow = pressed
        ? "inset 0 2px 6px rgba(0, 0, 0, 0.3), 0 0 20px rgba(56, 189, 248, 0.5)"
        : elevation === 0
          ? "inset 0 1px 2px rgba(255, 255, 255, 0.9), 0 0 14px rgba(192, 132, 252, 0.3)"
          : elevation === 1
            ? "0 4px 18px rgba(0, 0, 0, 0.15), inset 0 1px 2px rgba(255, 255, 255, 0.95), 0 0 24px rgba(56, 189, 248, 0.4)"
            : "0 8px 32px rgba(0, 0, 0, 0.25), inset 0 1px 2px rgba(255, 255, 255, 1), 0 0 36px rgba(244, 114, 182, 0.5)";
      textShadow = "0 1px 2px rgba(255, 255, 255, 0.9)";
      break;

    case "mirror":
    default:
      bg = pressed
        ? "linear-gradient(135deg, #cbd5e1 0%, #e2e8f0 30%, #94a3b8 60%, #cbd5e1 100%)"
        : "linear-gradient(135deg, #f1f5f9 0%, #ffffff 25%, #94a3b8 50%, #ffffff 75%, #64748b 100%)";
      border = highContrast ? "2px solid #000000" : "1px solid rgba(255, 255, 255, 0.85)";
      textColor = "#0f172a";
      shadowGlow = pressed
        ? "inset 0 3px 6px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(255, 255, 255, 0.6)"
        : elevation === 0
          ? "inset 0 1px 2px rgba(255, 255, 255, 0.95), 0 2px 6px rgba(0, 0, 0, 0.1)"
          : elevation === 1
            ? "0 4px 16px rgba(0, 0, 0, 0.15), inset 0 1px 2px rgba(255, 255, 255, 1), 0 0 15px rgba(255, 255, 255, 0.5)"
            : "0 10px 30px rgba(0, 0, 0, 0.22), inset 0 1px 2px rgba(255, 255, 255, 1), 0 0 25px rgba(255, 255, 255, 0.7)";
      textShadow = "0 1px 0 rgba(255, 255, 255, 0.9)";
      break;
  }

  return {
    background: bg,
    border,
    borderRadius: "9999px",
    boxShadow: shadowGlow,
    color: textColor,
    textShadow,
    backdropFilter: "blur(16px) saturate(180%)",
  };
}

export type DeStijlVariant = "white" | "red" | "blue" | "yellow" | "black" | "gray";

export interface DeStijlStyleOptions {
  readonly variant?: DeStijlVariant;
  readonly borderWidth?: number;
  readonly pressed?: boolean;
  readonly highContrast?: boolean;
}

export interface DeStijlStyleResult {
  readonly background: string;
  readonly border: string;
  readonly borderRadius: string;
  readonly boxShadow: string;
  readonly color: string;
  readonly fontFamily: string;
  readonly textTransform: "uppercase";
  readonly fontWeight: number;
}

export function computeDeStijlStyle(
  options: DeStijlStyleOptions = {},
): DeStijlStyleResult {
  const {
    variant = "white",
    borderWidth = 4,
    pressed = false,
    highContrast = false,
  } = options;

  let bg = "#ffffff";
  let text = "#000000";

  switch (variant) {
    case "red":
      bg = "#e63946";
      text = "#ffffff";
      break;
    case "blue":
      bg = "#0047ab";
      text = "#ffffff";
      break;
    case "yellow":
      bg = "#ffd166";
      text = "#000000";
      break;
    case "black":
      bg = "#000000";
      text = "#ffffff";
      break;
    case "gray":
      bg = "#e5e7eb";
      text = "#000000";
      break;
    case "white":
    default:
      bg = "#ffffff";
      text = "#000000";
      break;
  }

  const borderPx = highContrast ? Math.max(borderWidth, 4) : borderWidth;
  const borderColor = variant === "black" ? "#ffffff" : "#000000";
  const border = `${borderPx}px solid ${borderColor}`;

  return {
    background: bg,
    border,
    borderRadius: "0px",
    boxShadow: pressed ? "none" : "none",
    color: text,
    fontFamily: "Futura, 'Trebuchet MS', Arial, sans-serif",
    textTransform: "uppercase",
    fontWeight: 700,
  };
}

export type MemphisVariant = "coral" | "teal" | "lemon" | "lavender" | "mint" | "white";
export type MemphisPatternType = "dots" | "stripes" | "confetti" | "grid" | "none";

export interface MemphisStyleOptions {
  readonly variant?: MemphisVariant;
  readonly pattern?: MemphisPatternType;
  readonly shadowDistance?: number;
  readonly pressed?: boolean;
  readonly highContrast?: boolean;
}

export interface MemphisStyleResult {
  readonly background: string;
  readonly backgroundSize?: string;
  readonly border: string;
  readonly borderRadius: string;
  readonly boxShadow: string;
  readonly color: string;
  readonly fontFamily: string;
}

export function computeMemphisStyle(
  options: MemphisStyleOptions = {},
): MemphisStyleResult {
  const {
    variant = "lemon",
    pattern = "none",
    shadowDistance = 5,
    pressed = false,
    highContrast = false,
  } = options;

  let baseColor = "#ffe600";
  let textColor = "#000000";

  switch (variant) {
    case "coral":
      baseColor = "#ff5e7e";
      textColor = "#ffffff";
      break;
    case "teal":
      baseColor = "#00d2d3";
      textColor = "#000000";
      break;
    case "lavender":
      baseColor = "#b388ff";
      textColor = "#000000";
      break;
    case "mint":
      baseColor = "#00f5b8";
      textColor = "#000000";
      break;
    case "white":
      baseColor = "#ffffff";
      textColor = "#000000";
      break;
    case "lemon":
    default:
      baseColor = "#ffe600";
      textColor = "#000000";
      break;
  }

  let bg = baseColor;
  let bgSize: string | undefined;

  if (pattern === "dots") {
    bg = `radial-gradient(#000000 15%, transparent 16%) ${baseColor}`;
    bgSize = "14px 14px";
  } else if (pattern === "stripes") {
    bg = `repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(0,0,0,0.12) 8px, rgba(0,0,0,0.12) 16px) ${baseColor}`;
  } else if (pattern === "grid") {
    bg = `linear-gradient(to right, rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.1) 1px, transparent 1px) ${baseColor}`;
    bgSize = "16px 16px";
  }

  const borderPx = highContrast ? 4 : 3;
  const border = `${borderPx}px solid #000000`;

  const d = pressed ? Math.max(1, Math.round(shadowDistance * 0.4)) : shadowDistance;
  const boxShadow = `${d}px ${d}px 0px #000000`;

  return {
    background: bg,
    backgroundSize: bgSize,
    border,
    borderRadius: "12px",
    boxShadow,
    color: textColor,
    fontFamily: "'Cabinet Grotesk', Righteous, 'Plus Jakarta Sans', sans-serif",
  };
}

export const MEMPHIS_SQUIGGLE_PATH =
  "M 0 15 Q 15 0, 30 15 T 60 15 T 90 15 T 120 15 T 150 15";
export const MEMPHIS_ZIGZAG_PATH =
  "M 0 20 L 15 5 L 30 20 L 45 5 L 60 20 L 75 5 L 90 20";
export const MEMPHIS_TRIANGLE_PATH =
  "M 15 5 L 28 27 L 2 27 Z";
export const MEMPHIS_CIRCLE_PATH =
  "M 15 3 A 12 12 0 1 0 15 27 A 12 12 0 1 0 15 3";


// ============================================================================
// Style Implementations: Psychedelic, Vaporwave & Steampunk (Prompt 67)
// ============================================================================

export type PsychedelicVariant = "electric" | "swirl" | "cosmic-trip" | "optical";

export interface PsychedelicStyleOptions {
  readonly variant?: PsychedelicVariant;
  readonly elevation?: number;
  readonly wavy?: boolean;
  readonly pressed?: boolean;
  readonly highContrast?: boolean;
}

export interface PsychedelicStyleResult {
  readonly background: string;
  readonly border: string;
  readonly borderRadius: string;
  readonly boxShadow: string;
  readonly color: string;
  readonly textShadow: string;
  readonly fontFamily: string;
}

export function computePsychedelicStyle(
  options: PsychedelicStyleOptions = {},
): PsychedelicStyleResult {
  const {
    variant = "electric",
    elevation = 1,
    wavy = true,
    pressed = false,
    highContrast = false,
  } = options;

  let bg = "";
  let border = "";
  let textColor = "";
  let shadow = "";
  let textShadow = "";

  switch (variant) {
    case "swirl":
      bg = pressed
        ? "linear-gradient(135deg, #7b2cbf 0%, #b5179e 40%, #7209b7 100%)"
        : "linear-gradient(135deg, #f72585 0%, #7209b7 35%, #3a0ca3 70%, #4cc9f0 100%)";
      border = highContrast ? "2px solid #ffffff" : "2px solid rgba(255, 255, 255, 0.6)";
      textColor = "#ffffff";
      shadow = pressed
        ? "inset 0 3px 8px rgba(0,0,0,0.4), 0 0 15px rgba(247, 37, 133, 0.5)"
        : elevation === 0
          ? "0 0 12px rgba(114, 9, 183, 0.4)"
          : elevation === 1
            ? "0 6px 20px rgba(114, 9, 183, 0.5), 0 0 15px rgba(247, 37, 133, 0.4)"
            : "0 10px 30px rgba(114, 9, 183, 0.6), 0 0 25px rgba(76, 201, 240, 0.5)";
      textShadow = "0 2px 4px rgba(0, 0, 0, 0.6)";
      break;

    case "cosmic-trip":
      bg = pressed
        ? "linear-gradient(135deg, #ff7b00 0%, #9d4edd 50%, #ffea00 100%)"
        : "linear-gradient(135deg, #ffea00 0%, #ff7b00 35%, #9d4edd 70%, #ff007f 100%)";
      border = highContrast ? "2px solid #000000" : "2px solid rgba(255, 255, 255, 0.8)";
      textColor = "#0f172a";
      shadow = pressed
        ? "inset 0 2px 6px rgba(0,0,0,0.3), 0 0 14px rgba(255, 123, 0, 0.6)"
        : elevation === 0
          ? "0 0 10px rgba(255, 123, 0, 0.4)"
          : elevation === 1
            ? "0 4px 18px rgba(157, 78, 221, 0.4), 0 0 16px rgba(255, 234, 0, 0.5)"
            : "0 8px 30px rgba(157, 78, 221, 0.6), 0 0 25px rgba(255, 0, 127, 0.6)";
      textShadow = "0 1px 2px rgba(255, 255, 255, 0.8)";
      break;

    case "optical":
      bg = pressed
        ? "repeating-radial-gradient(circle at 50% 50%, #000000, #000000 10px, #ffffff 10px, #ffffff 20px)"
        : "repeating-linear-gradient(45deg, #000000, #000000 12px, #00f5d4 12px, #00f5d4 24px, #ff007f 24px, #ff007f 36px)";
      border = highContrast ? "3px solid #ffffff" : "2px solid #000000";
      textColor = "#ffffff";
      shadow = pressed
        ? "inset 0 4px 8px rgba(0,0,0,0.7), 0 0 12px #00f5d4"
        : elevation === 0
          ? "0 0 10px rgba(0, 245, 212, 0.5)"
          : elevation === 1
            ? "0 6px 20px rgba(0, 0, 0, 0.4), 0 0 15px rgba(255, 0, 127, 0.6)"
            : "0 10px 30px rgba(0, 0, 0, 0.6), 0 0 25px rgba(0, 245, 212, 0.7)";
      textShadow = "0 2px 4px #000000";
      break;

    case "electric":
    default:
      bg = pressed
        ? "linear-gradient(135deg, #00bbf9 0%, #00f5d4 50%, #fee440 100%)"
        : "linear-gradient(135deg, #ff007f 0%, #fee440 33%, #00f5d4 66%, #00bbf9 100%)";
      border = highContrast ? "2px solid #000000" : "2px solid rgba(255, 255, 255, 0.85)";
      textColor = "#0f172a";
      shadow = pressed
        ? "inset 0 3px 6px rgba(0,0,0,0.3), 0 0 15px rgba(0, 245, 212, 0.6)"
        : elevation === 0
          ? "0 0 10px rgba(255, 0, 127, 0.4)"
          : elevation === 1
            ? "0 4px 18px rgba(0, 0, 0, 0.2), 0 0 20px rgba(255, 0, 127, 0.5)"
            : "0 8px 30px rgba(0, 0, 0, 0.3), 0 0 30px rgba(0, 245, 212, 0.6)";
      textShadow = "0 1px 2px rgba(255, 255, 255, 0.8)";
      break;
  }

  const radius = wavy ? "32px 16px 36px 18px" : "9999px";

  return {
    background: bg,
    border,
    borderRadius: radius,
    boxShadow: shadow,
    color: textColor,
    textShadow,
    fontFamily: "'Cooper Black', Cheee, 'Work Sans', cursive, sans-serif",
  };
}

export type VaporwaveVariant = "sunset" | "cyber-grid" | "arcade" | "pastel";

export interface VaporwaveStyleOptions {
  readonly variant?: VaporwaveVariant;
  readonly elevation?: number;
  readonly glow?: boolean;
  readonly pressed?: boolean;
  readonly highContrast?: boolean;
}

export interface VaporwaveStyleResult {
  readonly background: string;
  readonly border: string;
  readonly borderRadius: string;
  readonly boxShadow: string;
  readonly color: string;
  readonly textShadow: string;
  readonly fontFamily: string;
  readonly backdropFilter?: string;
}

export function computeVaporwaveStyle(
  options: VaporwaveStyleOptions = {},
): VaporwaveStyleResult {
  const {
    variant = "sunset",
    elevation = 1,
    glow = true,
    pressed = false,
    highContrast = false,
  } = options;

  let bg = "";
  let border = "";
  let textColor = "";
  let shadow = "";
  let textShadow = "";
  let backdropFilter = "blur(10px)";

  switch (variant) {
    case "cyber-grid":
      bg = pressed
        ? "rgba(13, 2, 33, 0.95)"
        : "rgba(13, 2, 33, 0.85)";
      border = highContrast ? "2px solid #01cdfe" : "2px solid #ff71ce";
      textColor = "#01cdfe";
      shadow = glow
        ? pressed
          ? "inset 0 2px 8px rgba(1, 205, 254, 0.5), 0 0 10px #ff71ce"
          : elevation === 0
            ? "0 0 8px #ff71ce"
            : elevation === 1
              ? "0 0 15px rgba(255, 113, 206, 0.6), 0 0 25px rgba(1, 205, 254, 0.4)"
              : "0 0 25px rgba(255, 113, 206, 0.8), 0 0 40px rgba(1, 205, 254, 0.6)"
        : "none";
      textShadow = "0 0 8px #01cdfe";
      break;

    case "arcade":
      bg = pressed
        ? "rgba(30, 11, 54, 0.95)"
        : "rgba(30, 11, 54, 0.88)";
      border = highContrast ? "2px solid #05ffa1" : "2px solid #b967ff";
      textColor = "#05ffa1";
      shadow = glow
        ? pressed
          ? "inset 0 2px 8px rgba(5, 255, 161, 0.4), 0 0 10px #05ffa1"
          : elevation === 0
            ? "0 0 8px #05ffa1"
            : elevation === 1
              ? "0 0 15px rgba(5, 255, 161, 0.5), 0 0 25px rgba(185, 103, 255, 0.4)"
              : "0 0 25px rgba(5, 255, 161, 0.7), 0 0 35px rgba(185, 103, 255, 0.6)"
        : "none";
      textShadow = "0 0 8px #05ffa1";
      break;

    case "pastel":
      bg = pressed
        ? "linear-gradient(135deg, #d4b5ff 0%, #ffb3ba 50%, #97f9f9 100%)"
        : "linear-gradient(135deg, #ffb3ba 0%, #d4b5ff 50%, #97f9f9 100%)";
      border = highContrast ? "2px solid #000000" : "2px solid rgba(255, 255, 255, 0.8)";
      textColor = "#2a1b4e";
      shadow = glow
        ? pressed
          ? "inset 0 2px 6px rgba(0,0,0,0.2), 0 0 12px rgba(212, 181, 255, 0.5)"
          : elevation === 0
            ? "0 0 8px rgba(212, 181, 255, 0.4)"
            : elevation === 1
              ? "0 4px 16px rgba(42, 27, 78, 0.15), 0 0 18px rgba(255, 179, 186, 0.5)"
              : "0 8px 24px rgba(42, 27, 78, 0.2), 0 0 25px rgba(151, 249, 249, 0.6)"
        : "none";
      textShadow = "0 1px 2px rgba(255, 255, 255, 0.8)";
      break;

    case "sunset":
    default:
      bg = pressed
        ? "linear-gradient(180deg, #b967ff 0%, #ff71ce 50%, #01cdfe 100%)"
        : "linear-gradient(180deg, #ff71ce 0%, #b967ff 50%, #01cdfe 100%)";
      border = highContrast ? "2px solid #ffffff" : "2px solid #01cdfe";
      textColor = "#ffffff";
      shadow = glow
        ? pressed
          ? "inset 0 2px 6px rgba(0,0,0,0.3), 0 0 12px #ff71ce"
          : elevation === 0
            ? "0 0 10px #ff71ce"
            : elevation === 1
              ? "0 0 16px rgba(255, 113, 206, 0.6), 0 0 25px rgba(1, 205, 254, 0.4)"
              : "0 0 24px rgba(255, 113, 206, 0.8), 0 0 35px rgba(1, 205, 254, 0.6)"
        : "none";
      textShadow = "0 0 6px rgba(255, 255, 255, 0.8)";
      break;
  }

  return {
    background: bg,
    border,
    borderRadius: "4px",
    boxShadow: shadow,
    color: textColor,
    textShadow,
    fontFamily: "VT323, 'MS Gothic', 'MS Sans Serif', monospace",
    backdropFilter,
  };
}

export type SteampunkVariant = "brass" | "copper" | "bronze" | "parchment";

export interface SteampunkStyleOptions {
  readonly variant?: SteampunkVariant;
  readonly elevation?: number;
  readonly pressed?: boolean;
  readonly highContrast?: boolean;
}

export interface SteampunkStyleResult {
  readonly background: string;
  readonly border: string;
  readonly borderRadius: string;
  readonly boxShadow: string;
  readonly color: string;
  readonly textShadow: string;
  readonly fontFamily: string;
}

export function computeSteampunkStyle(
  options: SteampunkStyleOptions = {},
): SteampunkStyleResult {
  const {
    variant = "brass",
    elevation = 1,
    pressed = false,
    highContrast = false,
  } = options;

  let bg = "";
  let border = "";
  let textColor = "";
  let shadow = "";
  let textShadow = "";

  switch (variant) {
    case "copper":
      bg = pressed
        ? "linear-gradient(135deg, #8a4124 0%, #b87333 50%, #d3815e 100%)"
        : "linear-gradient(135deg, #d3815e 0%, #b87333 45%, #8a4124 100%)";
      border = highContrast ? "2px solid #ffffff" : "2px solid #5c2c18";
      textColor = "#fdeed9";
      shadow = pressed
        ? "inset 0 3px 6px rgba(0,0,0,0.7), 0 1px 0 rgba(255, 255, 255, 0.2)"
        : elevation === 0
          ? "inset 0 1px 0 rgba(255,255,255,0.4), 0 1px 3px rgba(0,0,0,0.4)"
          : elevation === 1
            ? "0 4px 10px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,220,180,0.6), inset 0 -1px 1px rgba(0,0,0,0.4)"
            : "0 8px 20px rgba(0,0,0,0.65), inset 0 1px 1px rgba(255,220,180,0.7)";
      textShadow = "0 1px 2px rgba(0, 0, 0, 0.8)";
      break;

    case "bronze":
      bg = pressed
        ? "linear-gradient(135deg, #2a1d12 0%, #4a3726 50%, #6c543e 100%)"
        : "linear-gradient(135deg, #6c543e 0%, #4a3726 50%, #2a1d12 100%)";
      border = highContrast ? "2px solid #ffffff" : "2px solid #1a120b";
      textColor = "#e6d5c3";
      shadow = pressed
        ? "inset 0 3px 6px rgba(0,0,0,0.8), 0 1px 0 rgba(255, 255, 255, 0.15)"
        : elevation === 0
          ? "inset 0 1px 0 rgba(255,255,255,0.3), 0 1px 3px rgba(0,0,0,0.5)"
          : elevation === 1
            ? "0 4px 12px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.3), inset 0 -1px 1px rgba(0,0,0,0.6)"
            : "0 10px 24px rgba(0,0,0,0.75), inset 0 1px 1px rgba(255,255,255,0.4)";
      textShadow = "0 1px 2px rgba(0, 0, 0, 0.9)";
      break;

    case "parchment":
      bg = pressed
        ? "linear-gradient(135deg, #e8dcbe 0%, #f5ecda 100%)"
        : "linear-gradient(135deg, #f5ecda 0%, #e8dcbe 100%)";
      border = highContrast ? "2px solid #000000" : "2px solid #5a4225";
      textColor = "#2d1f10";
      shadow = pressed
        ? "inset 0 2px 5px rgba(45, 31, 16, 0.4)"
        : elevation === 0
          ? "0 1px 3px rgba(45, 31, 16, 0.2)"
          : elevation === 1
            ? "0 4px 12px rgba(45, 31, 16, 0.25)"
            : "0 8px 20px rgba(45, 31, 16, 0.35)";
      textShadow = "none";
      break;

    case "brass":
    default:
      bg = pressed
        ? "linear-gradient(135deg, #997b1a 0%, #c49e29 50%, #e5c158 100%)"
        : "linear-gradient(135deg, #f5d77f 0%, #d4af37 40%, #a6841c 100%)";
      border = highContrast ? "2px solid #ffffff" : "2px solid #5a430c";
      textColor = "#2a1d04";
      shadow = pressed
        ? "inset 0 3px 6px rgba(0,0,0,0.6), 0 1px 0 rgba(255, 255, 255, 0.4)"
        : elevation === 0
          ? "inset 0 1px 0 rgba(255,255,255,0.6), 0 1px 3px rgba(0,0,0,0.4)"
          : elevation === 1
            ? "0 4px 10px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0,0,0,0.4)"
            : "0 8px 22px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.9)";
      textShadow = "0 1px 0 rgba(255, 255, 255, 0.7)";
      break;
  }

  return {
    background: bg,
    border,
    borderRadius: "4px",
    boxShadow: shadow,
    color: textColor,
    textShadow,
    fontFamily: "'Rye', 'Playfair Display', 'Cinzel', Georgia, serif",
  };
}

export const PSYCHEDELIC_WAVE_PATH =
  "M 0 25 C 25 5, 45 45, 75 25 C 105 5, 125 45, 155 25 C 185 5, 205 45, 235 25 C 265 5, 285 45, 315 25";
export const PSYCHEDELIC_FLOWER_PATH =
  "M 25 5 C 30 15, 45 15, 45 25 C 45 35, 30 35, 25 45 C 20 35, 5 35, 5 25 C 5 15, 20 15, 25 5 Z";

export const VAPORWAVE_SUNSET_PATH =
  "M 5 35 A 30 30 0 0 1 65 35 Z M 5 28 H 65 M 5 22 H 65 M 5 17 H 65";
export const VAPORWAVE_GRID_PATH =
  "M 0 35 L 70 35 M 0 25 L 70 25 M 0 18 L 70 18 M 0 12 L 70 12 M 10 35 L 25 0 M 35 35 L 35 0 M 60 35 L 45 0";

export const STEAMPUNK_GEAR_PATH =
  "M 22 5 L 28 5 L 29 10 L 35 12 L 39 8 L 43 12 L 40 17 L 44 22 L 49 22 L 49 28 L 44 29 L 42 35 L 46 39 L 42 43 L 37 40 L 32 44 L 32 49 L 26 49 L 25 44 L 19 42 L 15 46 L 11 42 L 14 37 L 10 32 L 5 32 L 5 26 L 10 25 L 12 19 L 8 15 L 12 11 L 17 14 L 22 10 Z M 27 21 A 6 6 0 1 0 27 33 A 6 6 0 1 0 27 21 Z";
export const STEAMPUNK_BRACKET_PATH =
  "M 4 36 L 4 12 C 4 8, 8 4, 12 4 L 36 4 L 36 10 L 14 10 C 12 10, 10 12, 10 14 L 10 36 Z M 8 8 L 14 14";

// ============================================================================
// Style Implementations: Grunge, Paper Cutout & Glitch (Prompt 68)
// ============================================================================

export type GrungeVariant = "distressed-paper" | "zine-dark" | "photocopy" | "decay";

export interface GrungeStyleOptions {
  readonly variant?: GrungeVariant;
  readonly elevation?: number;
  readonly roughEdges?: boolean;
  readonly pressed?: boolean;
  readonly highContrast?: boolean;
}

export interface GrungeStyleResult {
  readonly background: string;
  readonly border: string;
  readonly borderRadius: string;
  readonly boxShadow: string;
  readonly color: string;
  readonly textShadow: string;
  readonly fontFamily: string;
  readonly transform?: string;
}

export function computeGrungeStyle(
  options: GrungeStyleOptions = {},
): GrungeStyleResult {
  const {
    variant = "distressed-paper",
    elevation = 1,
    roughEdges = true,
    pressed = false,
    highContrast = false,
  } = options;

  let bg = "";
  let border = "";
  let textColor = "";
  let shadow = "";
  let textShadow = "none";
  let transform: string | undefined = undefined;

  switch (variant) {
    case "zine-dark":
      bg = pressed ? "#111111" : "#181818";
      border = highContrast ? "3px solid #ffffff" : "2px solid #e63946";
      textColor = "#f0f0f0";
      shadow = pressed
        ? "1px 1px 0px #e63946"
        : elevation === 0
          ? "2px 2px 0px #e63946"
          : elevation === 1
            ? "4px 4px 0px #e63946, 6px 6px 0px #000000"
            : "6px 6px 0px #e63946, 10px 10px 0px #000000";
      textShadow = "1px 1px 0px #e63946";
      if (pressed) transform = "translate(2px, 2px)";
      break;

    case "photocopy":
      bg = pressed ? "#000000" : "#ffffff";
      border = highContrast ? "3px solid #000000" : "3px solid #000000";
      textColor = pressed ? "#ffffff" : "#000000";
      shadow = pressed
        ? "1px 1px 0px #000000"
        : elevation === 0
          ? "3px 3px 0px #000000"
          : elevation === 1
            ? "5px 5px 0px #000000"
            : "8px 8px 0px #000000";
      if (pressed) transform = "translate(3px, 3px)";
      break;

    case "decay":
      bg = pressed ? "#22251f" : "#2c3028";
      border = highContrast ? "3px solid #ffffff" : "2px solid #5a5f50";
      textColor = "#d4a373";
      shadow = pressed
        ? "1px 1px 0px #131511"
        : elevation === 0
          ? "2px 2px 0px #131511"
          : elevation === 1
            ? "4px 4px 0px #131511, 0 0 10px rgba(212, 163, 115, 0.2)"
            : "6px 6px 0px #131511, 0 0 16px rgba(212, 163, 115, 0.3)";
      textShadow = "1px 1px 2px #131511";
      if (pressed) transform = "translate(2px, 2px)";
      break;

    case "distressed-paper":
    default:
      bg = pressed ? "#dedad3" : "#e8e5df";
      border = highContrast ? "3px solid #000000" : "2px solid #1a1a1a";
      textColor = "#1a1a1a";
      shadow = pressed
        ? "1px 1px 0px #000000"
        : elevation === 0
          ? "2px 2px 0px #000000"
          : elevation === 1
            ? "4px 4px 0px #000000"
            : "6px 6px 0px #000000";
      if (pressed) transform = "translate(2px, 2px)";
      break;
  }

  return {
    background: bg,
    border,
    borderRadius: roughEdges ? "0px" : "3px",
    boxShadow: shadow,
    color: textColor,
    textShadow,
    fontFamily: "'Permanent Marker', Impact, 'Courier Prime', monospace, sans-serif",
    ...(transform ? { transform } : {}),
  };
}

export type PaperCutoutVariant = "cardstock" | "kraft" | "pastel-stack" | "dark-construction";

export interface PaperCutoutStyleOptions {
  readonly variant?: PaperCutoutVariant;
  readonly elevation?: number;
  readonly foldedCorner?: boolean;
  readonly pressed?: boolean;
  readonly highContrast?: boolean;
}

export interface PaperCutoutStyleResult {
  readonly background: string;
  readonly border: string;
  readonly borderRadius: string;
  readonly boxShadow: string;
  readonly color: string;
  readonly textShadow: string;
  readonly fontFamily: string;
  readonly transform?: string;
}

export function computePaperCutoutStyle(
  options: PaperCutoutStyleOptions = {},
): PaperCutoutStyleResult {
  const {
    variant = "cardstock",
    elevation = 1,
    foldedCorner = false,
    pressed = false,
    highContrast = false,
  } = options;

  let bg = "";
  let border = "";
  let textColor = "";
  let shadow = "";
  let textShadow = "none";
  let transform: string | undefined = undefined;

  switch (variant) {
    case "kraft":
      bg = pressed ? "#e0ceb5" : "#ebdcc6";
      border = highContrast ? "2px solid #000000" : "1px solid rgba(78, 52, 26, 0.15)";
      textColor = "#3b2a1a";
      shadow = pressed
        ? "0 2px 4px rgba(78, 52, 26, 0.1)"
        : elevation === 0
          ? "0 1px 3px rgba(78, 52, 26, 0.12)"
          : elevation === 1
            ? "0 4px 12px rgba(78, 52, 26, 0.15), 0 1px 3px rgba(78, 52, 26, 0.08)"
            : elevation === 2
              ? "0 10px 24px rgba(78, 52, 26, 0.2), 0 3px 6px rgba(78, 52, 26, 0.1)"
              : "0 20px 38px rgba(78, 52, 26, 0.25), 0 6px 12px rgba(78, 52, 26, 0.12)";
      textShadow = "0 1px 0 rgba(255, 255, 255, 0.5)";
      if (pressed) transform = "translateY(2px)";
      break;

    case "pastel-stack":
      bg = pressed ? "#dbeceb" : "#eaf4f4";
      border = highContrast ? "2px solid #000000" : "1px solid rgba(74, 144, 164, 0.2)";
      textColor = "#1b3a4b";
      shadow = pressed
        ? "0 2px 5px rgba(74, 144, 164, 0.12)"
        : elevation === 0
          ? "0 2px 5px rgba(74, 144, 164, 0.15)"
          : elevation === 1
            ? "0 5px 14px rgba(74, 144, 164, 0.18), 0 1px 3px rgba(74, 144, 164, 0.1)"
            : elevation === 2
              ? "0 12px 28px rgba(74, 144, 164, 0.22), 0 4px 8px rgba(74, 144, 164, 0.12)"
              : "0 22px 44px rgba(74, 144, 164, 0.28), 0 8px 16px rgba(74, 144, 164, 0.15)";
      if (pressed) transform = "translateY(2px)";
      break;

    case "dark-construction":
      bg = pressed ? "#1c2024" : "#22272b";
      border = highContrast ? "2px solid #ffffff" : "1px solid rgba(255, 255, 255, 0.12)";
      textColor = "#f0f2f5";
      shadow = pressed
        ? "0 2px 6px rgba(0, 0, 0, 0.3)"
        : elevation === 0
          ? "0 2px 5px rgba(0, 0, 0, 0.3)"
          : elevation === 1
            ? "0 6px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08)"
            : elevation === 2
              ? "0 12px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.12)"
              : "0 22px 48px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.15)";
      if (pressed) transform = "translateY(2px)";
      break;

    case "cardstock":
    default:
      bg = pressed ? "#f2f0e8" : "#faf9f5";
      border = highContrast ? "2px solid #000000" : "1px solid rgba(0, 0, 0, 0.06)";
      textColor = "#2c3437";
      shadow = pressed
        ? "0 1px 3px rgba(0, 0, 0, 0.06)"
        : elevation === 0
          ? "0 1px 3px rgba(0, 0, 0, 0.08)"
          : elevation === 1
            ? "0 4px 10px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)"
            : elevation === 2
              ? "0 10px 24px rgba(0, 0, 0, 0.12), 0 3px 6px rgba(0, 0, 0, 0.06)"
              : "0 18px 36px rgba(0, 0, 0, 0.16), 0 6px 12px rgba(0, 0, 0, 0.08)";
      if (pressed) transform = "translateY(2px)";
      break;
  }

  const radius = foldedCorner ? "18px 18px 4px 18px" : "16px";

  return {
    background: bg,
    border,
    borderRadius: radius,
    boxShadow: shadow,
    color: textColor,
    textShadow,
    fontFamily: "'Quicksand', Nunito, Inter, sans-serif",
    ...(transform ? { transform } : {}),
  };
}

export type GlitchVariant = "cyber-terminal" | "rgb-split" | "matrix-green" | "hologram-dissonance";

export interface GlitchStyleOptions {
  readonly variant?: GlitchVariant;
  readonly elevation?: number;
  readonly scanlines?: boolean;
  readonly chromaticAberration?: boolean;
  readonly pressed?: boolean;
  readonly highContrast?: boolean;
}

export interface GlitchStyleResult {
  readonly background: string;
  readonly border: string;
  readonly borderRadius: string;
  readonly boxShadow: string;
  readonly color: string;
  readonly textShadow: string;
  readonly fontFamily: string;
  readonly backdropFilter?: string;
  readonly backgroundImage?: string;
  readonly backgroundSize?: string;
}

export function computeGlitchStyle(
  options: GlitchStyleOptions = {},
): GlitchStyleResult {
  const {
    variant = "cyber-terminal",
    elevation = 1,
    scanlines = false,
    chromaticAberration = true,
    pressed = false,
    highContrast = false,
  } = options;

  let bg = "";
  let border = "";
  let textColor = "";
  let shadow = "";
  let textShadow = "none";
  let backdropFilter: string | undefined = undefined;

  switch (variant) {
    case "rgb-split":
      bg = pressed ? "#000000" : "#050508";
      border = highContrast ? "2px solid #ffffff" : "1px solid #ff0055";
      textColor = "#ffffff";
      textShadow = chromaticAberration ? "-2px 0 #ff0055, 2px 0 #00ffff" : "0 0 6px #ffffff";
      shadow = pressed
        ? "inset -2px 0 0 #ff0055, inset 2px 0 0 #00ffff"
        : elevation === 0
          ? "-2px 0 0 rgba(255, 0, 85, 0.8), 2px 0 0 rgba(0, 255, 255, 0.8)"
          : elevation === 1
            ? "-3px 0 0 #ff0055, 3px 0 0 #00ffff, 0 0 15px rgba(255, 0, 85, 0.4)"
            : "-4px 0 0 #ff0055, 4px 0 0 #00ffff, 0 0 25px rgba(0, 255, 255, 0.6)";
      break;

    case "matrix-green":
      bg = pressed ? "rgba(10, 25, 10, 0.98)" : "rgba(5, 15, 5, 0.96)";
      border = highContrast ? "2px solid #00ff66" : "1px solid #00ff66";
      textColor = "#00ff66";
      textShadow = chromaticAberration ? "-1px 0 rgba(0, 255, 102, 0.6), 1px 0 #39ff14" : "0 0 8px #00ff66";
      shadow = pressed
        ? "inset 0 0 12px rgba(0, 255, 102, 0.6), 0 0 8px #00ff66"
        : elevation === 0
          ? "0 0 6px rgba(0, 255, 102, 0.3)"
          : elevation === 1
            ? "0 0 14px rgba(0, 255, 102, 0.5), inset 0 0 8px rgba(0, 255, 102, 0.1)"
            : "0 0 26px rgba(0, 255, 102, 0.7), inset 0 0 12px rgba(0, 255, 102, 0.2)";
      break;

    case "hologram-dissonance":
      bg = pressed ? "rgba(24, 18, 54, 0.95)" : "rgba(16, 12, 38, 0.9)";
      border = highContrast ? "2px solid #d6a4ff" : "1px solid #b967ff";
      textColor = "#d6a4ff";
      textShadow = chromaticAberration ? "-1px 0 #ff71ce, 1px 0 #01cdfe" : "0 0 6px #d6a4ff";
      shadow = pressed
        ? "inset -2px 0 #ff71ce, inset 2px 0 #01cdfe, 0 0 10px #b967ff"
        : elevation === 0
          ? "-1px 0 #ff71ce, 1px 0 #01cdfe"
          : elevation === 1
            ? "-2px 0 #ff71ce, 2px 0 #01cdfe, 0 0 15px rgba(185, 103, 255, 0.4)"
            : "-3px 0 #ff71ce, 3px 0 #01cdfe, 0 0 25px rgba(185, 103, 255, 0.6)";
      backdropFilter = "blur(8px)";
      break;

    case "cyber-terminal":
    default:
      bg = pressed ? "rgba(15, 15, 25, 0.98)" : "rgba(8, 8, 15, 0.95)";
      border = highContrast ? "2px solid #00ffff" : "1px solid #00ffff";
      textColor = "#00ffff";
      textShadow = chromaticAberration ? "-1px 0 #ff0055, 1px 0 #00ffff" : "0 0 6px #00ffff";
      shadow = pressed
        ? "inset -2px 0 0 #ff0055, inset 2px 0 0 #00ffff, 0 0 8px #00ffff"
        : elevation === 0
          ? "-1px 0 0 #ff0055, 1px 0 0 #00ffff"
          : elevation === 1
            ? "-2px 0 0 #ff0055, 2px 0 0 #00ffff, 0 0 12px rgba(0, 255, 255, 0.4)"
            : "-3px 0 0 #ff0055, 3px 0 0 #00ffff, 0 0 24px rgba(0, 255, 255, 0.6)";
      break;
  }

  const result: GlitchStyleResult = {
    background: bg,
    border,
    borderRadius: "0px",
    boxShadow: shadow,
    color: textColor,
    textShadow,
    fontFamily: "'Orbitron', 'Share Tech Mono', VT323, monospace",
    ...(backdropFilter ? { backdropFilter } : {}),
    ...(scanlines
      ? {
          backgroundImage: "repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2) 1px, transparent 1px, transparent 3px)",
          backgroundSize: "100% 3px",
        }
      : {}),
  };

  return result;
}

export const GRUNGE_TAPE_PATH =
  "M 0 4 L 4 0 L 8 5 L 12 1 L 16 4 L 140 4 L 144 0 L 148 5 L 152 1 L 156 4 L 156 26 L 152 30 L 148 25 L 144 29 L 140 26 L 16 26 L 12 30 L 8 25 L 4 29 L 0 26 Z";
export const GRUNGE_SPLATTER_PATH =
  "M 25 15 C 28 8, 35 10, 37 16 C 42 12, 48 18, 44 24 C 49 28, 46 36, 40 35 C 38 42, 30 44, 26 38 C 20 42, 14 36, 17 30 C 11 26, 13 18, 20 18 C 18 12, 22 8, 25 15 Z M 48 8 A 2 2 0 1 1 48 12 A 2 2 0 1 1 48 8 M 8 38 A 3 3 0 1 1 8 44 A 3 3 0 1 1 8 38 M 42 42 A 1.5 1.5 0 1 1 42 45 A 1.5 1.5 0 1 1 42 42";
export const GRUNGE_SCRATCH_PATH =
  "M 5 5 L 45 45 M 12 2 L 48 38 M 2 12 L 38 48 M 45 5 L 5 45 M 48 12 L 12 48";

export const PAPER_CUTOUT_WAVE_PATH =
  "M 0 30 C 30 10, 60 45, 100 25 C 140 5, 170 40, 210 20 C 250 5, 270 35, 300 20 L 300 60 L 0 60 Z";
export const PAPER_FOLDED_CORNER_PATH =
  "M 0 0 L 30 0 L 30 30 Z M 0 0 L 30 30 L 0 30 Z";
export const PAPER_PERFORATION_PATH =
  "M 0 5 L 8 5 M 14 5 L 22 5 M 28 5 L 36 5 M 42 5 L 50 5 M 56 5 L 64 5 M 70 5 L 78 5 M 84 5 L 92 5 M 98 5 L 106 5";

export const GLITCH_CROSSHAIR_PATH =
  "M 15 2 L 15 8 M 15 22 L 15 28 M 2 15 L 8 15 M 22 15 L 28 15 M 10 10 L 20 10 L 20 20 L 10 20 Z";
export const GLITCH_BARCODE_PATH =
  "M 2 2 L 2 22 M 6 2 L 6 22 M 10 2 L 10 14 M 14 6 L 14 22 M 18 2 L 18 22 M 22 2 L 22 18 M 26 6 L 26 22 M 30 2 L 30 22 M 34 2 L 34 16 M 38 6 L 38 22";
export const GLITCH_CORNER_TECH_PATH =
  "M 2 18 L 2 2 L 18 2 M 6 6 L 10 6 L 10 10";

// ============================================================================
// Style Implementations: Anti-Design, 3D Inflated & Isometric (Prompt 69)
// ============================================================================

export type AntiDesignVariant = "toxic-yellow" | "acid-magenta" | "raw-brutalist" | "clash-cyan";

export interface AntiDesignStyleOptions {
  readonly variant?: AntiDesignVariant;
  readonly elevation?: number;
  readonly asymmetrical?: boolean;
  readonly tilted?: boolean;
  readonly pressed?: boolean;
  readonly highContrast?: boolean;
}

export interface AntiDesignStyleResult {
  readonly background: string;
  readonly border: string;
  readonly borderRadius: string;
  readonly boxShadow: string;
  readonly color: string;
  readonly textShadow: string;
  readonly fontFamily: string;
  readonly transform?: string;
}

export function computeAntiDesignStyle(
  options: AntiDesignStyleOptions = {},
): AntiDesignStyleResult {
  const {
    variant = "toxic-yellow",
    elevation = 1,
    asymmetrical = true,
    tilted = false,
    pressed = false,
    highContrast = false,
  } = options;

  let bg = "";
  let border = "";
  let textColor = "";
  let shadow = "";
  let textShadow = "none";

  switch (variant) {
    case "acid-magenta":
      bg = pressed ? "#e000e0" : "#ff00ff";
      border = highContrast ? "3px solid #ffffff" : "3px dashed #ffff00";
      textColor = "#000000";
      shadow = pressed
        ? "1px 1px 0px #ffff00"
        : elevation === 0
          ? "2px 2px 0px #ffff00"
          : elevation === 1
            ? "4px 4px 0px #ffff00, 6px 6px 0px #000000"
            : "6px 6px 0px #ffff00, 10px 10px 0px #000000";
      break;

    case "raw-brutalist":
      bg = pressed ? "#000000" : "#ffffff";
      border = highContrast ? "4px solid #000000" : "3px solid #000000";
      textColor = pressed ? "#ffffff" : "#000000";
      shadow = pressed
        ? "1px 1px 0px #ff0033"
        : elevation === 0
          ? "3px 3px 0px #ff0033"
          : elevation === 1
            ? "5px 5px 0px #000000, 7px 7px 0px #ff0033"
            : "8px 8px 0px #000000, 12px 12px 0px #ff0033";
      break;

    case "clash-cyan":
      bg = pressed ? "#00c4d4" : "#00f0ff";
      border = highContrast ? "3px solid #000000" : "3px solid #1a0033";
      textColor = "#1a0033";
      shadow = pressed
        ? "1px 1px 0px #ff5500"
        : elevation === 0
          ? "2px 2px 0px #ff5500"
          : elevation === 1
            ? "4px 4px 0px #ff5500, 6px 6px 0px #1a0033"
            : "6px 6px 0px #ff5500, 10px 10px 0px #1a0033";
      break;

    case "toxic-yellow":
    default:
      bg = pressed ? "#e6e600" : "#ffff00";
      border = highContrast ? "3px solid #000000" : "3px solid #000000";
      textColor = "#000000";
      shadow = pressed
        ? "1px 1px 0px #000000"
        : elevation === 0
          ? "2px 2px 0px #ff00ff"
          : elevation === 1
            ? "4px 4px 0px #ff00ff, 6px 6px 0px #000000"
            : "6px 6px 0px #ff00ff, 10px 10px 0px #000000";
      break;
  }

  let transform: string | undefined = undefined;
  if (pressed) {
    transform = "translate(3px, 3px) rotate(0deg)";
  } else if (tilted) {
    transform = "rotate(-1.5deg)";
  }

  return {
    background: bg,
    border,
    borderRadius: asymmetrical ? "0px" : "4px",
    boxShadow: shadow,
    color: textColor,
    textShadow,
    fontFamily: "'Druk Wide', Impact, 'Courier New', monospace, sans-serif",
    ...(transform ? { transform } : {}),
  };
}

export type Inflated3DVariant = "bubblegum-pink" | "mallow-lavender" | "cloud-cyan" | "sunny-peach";

export interface Inflated3DStyleOptions {
  readonly variant?: Inflated3DVariant;
  readonly elevation?: number;
  readonly pill?: boolean;
  readonly pressed?: boolean;
  readonly highContrast?: boolean;
}

export interface Inflated3DStyleResult {
  readonly background: string;
  readonly border: string;
  readonly borderRadius: string;
  readonly boxShadow: string;
  readonly color: string;
  readonly textShadow: string;
  readonly fontFamily: string;
  readonly transform?: string;
}

export function compute3DInflatedStyle(
  options: Inflated3DStyleOptions = {},
): Inflated3DStyleResult {
  const {
    variant = "bubblegum-pink",
    elevation = 1,
    pill = true,
    pressed = false,
    highContrast = false,
  } = options;

  let bg = "";
  let shadow = "";
  const border = highContrast ? "2px solid #ffffff" : "none";
  const textColor = "#ffffff";
  const textShadow = "0 1px 2px rgba(0, 0, 0, 0.25)";

  switch (variant) {
    case "mallow-lavender":
      bg = pressed
        ? "linear-gradient(135deg, #9333ea 0%, #c084fc 100%)"
        : "linear-gradient(135deg, #d8b4fe 0%, #c084fc 50%, #9333ea 100%)";
      shadow = pressed
        ? "inset 0 4px 10px rgba(0,0,0,0.35), 0 4px 10px rgba(147, 51, 234, 0.4)"
        : elevation === 0
          ? "inset 0 2px 4px rgba(255,255,255,0.7), inset 0 -3px 6px rgba(0,0,0,0.1), 0 6px 14px rgba(147, 51, 234, 0.25)"
          : elevation === 1
            ? "inset 0 3px 6px rgba(255,255,255,0.8), inset 0 -4px 8px rgba(0,0,0,0.15), 0 14px 28px rgba(147, 51, 234, 0.35)"
            : "inset 0 4px 8px rgba(255,255,255,0.9), inset 0 -6px 12px rgba(0,0,0,0.2), 0 22px 45px rgba(147, 51, 234, 0.45)";
      break;

    case "cloud-cyan":
      bg = pressed
        ? "linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)"
        : "linear-gradient(135deg, #7dd3fc 0%, #38bdf8 50%, #0284c7 100%)";
      shadow = pressed
        ? "inset 0 4px 10px rgba(0,0,0,0.35), 0 4px 10px rgba(2, 132, 199, 0.4)"
        : elevation === 0
          ? "inset 0 2px 4px rgba(255,255,255,0.7), inset 0 -3px 6px rgba(0,0,0,0.1), 0 6px 14px rgba(2, 132, 199, 0.25)"
          : elevation === 1
            ? "inset 0 3px 6px rgba(255,255,255,0.8), inset 0 -4px 8px rgba(0,0,0,0.15), 0 14px 28px rgba(2, 132, 199, 0.35)"
            : "inset 0 4px 8px rgba(255,255,255,0.9), inset 0 -6px 12px rgba(0,0,0,0.2), 0 22px 45px rgba(2, 132, 199, 0.45)";
      break;

    case "sunny-peach":
      bg = pressed
        ? "linear-gradient(135deg, #ea580c 0%, #fb923c 100%)"
        : "linear-gradient(135deg, #fed7aa 0%, #fb923c 50%, #ea580c 100%)";
      shadow = pressed
        ? "inset 0 4px 10px rgba(0,0,0,0.35), 0 4px 10px rgba(234, 88, 12, 0.4)"
        : elevation === 0
          ? "inset 0 2px 4px rgba(255,255,255,0.7), inset 0 -3px 6px rgba(0,0,0,0.1), 0 6px 14px rgba(234, 88, 12, 0.25)"
          : elevation === 1
            ? "inset 0 3px 6px rgba(255,255,255,0.8), inset 0 -4px 8px rgba(0,0,0,0.15), 0 14px 28px rgba(234, 88, 12, 0.35)"
            : "inset 0 4px 8px rgba(255,255,255,0.9), inset 0 -6px 12px rgba(0,0,0,0.2), 0 22px 45px rgba(234, 88, 12, 0.45)";
      break;

    case "bubblegum-pink":
    default:
      bg = pressed
        ? "linear-gradient(135deg, #e03166 0%, #ff5c8a 100%)"
        : "linear-gradient(135deg, #ff8da1 0%, #ff5c8a 50%, #e03166 100%)";
      shadow = pressed
        ? "inset 0 4px 10px rgba(0,0,0,0.35), 0 4px 10px rgba(224, 49, 102, 0.4)"
        : elevation === 0
          ? "inset 0 2px 4px rgba(255,255,255,0.7), inset 0 -3px 6px rgba(0,0,0,0.1), 0 6px 14px rgba(224, 49, 102, 0.25)"
          : elevation === 1
            ? "inset 0 3px 6px rgba(255,255,255,0.8), inset 0 -4px 8px rgba(0,0,0,0.15), 0 14px 28px rgba(224, 49, 102, 0.35)"
            : "inset 0 4px 8px rgba(255,255,255,0.9), inset 0 -6px 12px rgba(0,0,0,0.2), 0 22px 45px rgba(224, 49, 102, 0.45)";
      break;
  }

  return {
    background: bg,
    border,
    borderRadius: pill ? "9999px" : "32px",
    boxShadow: shadow,
    color: textColor,
    textShadow,
    fontFamily: "'Fredoka', 'Baloo 2', Nunito, sans-serif",
    ...(pressed ? { transform: "scale(0.96)" } : {}),
  };
}

export type IsometricVariant = "cobalt-blueprint" | "concrete-slate" | "emerald-matrix" | "clean-elevation";

export interface IsometricStyleOptions {
  readonly variant?: IsometricVariant;
  readonly elevation?: number;
  readonly extruded?: boolean;
  readonly pressed?: boolean;
  readonly highContrast?: boolean;
}

export interface IsometricStyleResult {
  readonly background: string;
  readonly border: string;
  readonly borderRadius: string;
  readonly boxShadow: string;
  readonly color: string;
  readonly textShadow: string;
  readonly fontFamily: string;
  readonly transform?: string;
}

export function computeIsometricStyle(
  options: IsometricStyleOptions = {},
): IsometricStyleResult {
  const {
    variant = "cobalt-blueprint",
    elevation = 1,
    extruded = true,
    pressed = false,
    highContrast = false,
  } = options;

  let bg = "";
  let border = "";
  let textColor = "";
  let shadow = "";
  let textShadow = "none";

  switch (variant) {
    case "concrete-slate":
      bg = pressed ? "#1f232a" : "#2b303a";
      border = highContrast ? "2px solid #ffffff" : "1.5px solid #4a5260";
      textColor = "#f0f2f5";
      shadow = !extruded
        ? "none"
        : pressed
          ? "1px 1px 0px #181b21"
          : elevation === 0
            ? "2px 2px 0px #181b21"
            : elevation === 1
              ? "4px 4px 0px #181b21, 8px 8px 0px #0d0f12"
              : "6px 6px 0px #181b21, 12px 12px 0px #0d0f12";
      break;

    case "emerald-matrix":
      bg = pressed ? "#061710" : "#0a2318";
      border = highContrast ? "2px solid #ffffff" : "1.5px solid #00ff88";
      textColor = "#00ff88";
      shadow = !extruded
        ? "none"
        : pressed
          ? "1px 1px 0px #04120c"
          : elevation === 0
            ? "2px 2px 0px #04120c"
            : elevation === 1
              ? "4px 4px 0px #04120c, 8px 8px 0px #020705"
              : "6px 6px 0px #04120c, 12px 12px 0px #020705";
      textShadow = "0 0 6px rgba(0, 255, 136, 0.6)";
      break;

    case "clean-elevation":
      bg = pressed ? "#f0f4f8" : "#ffffff";
      border = highContrast ? "2px solid #000000" : "1.5px solid #002244";
      textColor = "#002244";
      shadow = !extruded
        ? "none"
        : pressed
          ? "1px 1px 0px #002244"
          : elevation === 0
            ? "2px 2px 0px #002244"
            : elevation === 1
              ? "4px 4px 0px #002244, 8px 8px 0px rgba(0,34,68,0.3)"
              : "6px 6px 0px #002244, 12px 12px 0px rgba(0,34,68,0.3)";
      break;

    case "cobalt-blueprint":
    default:
      bg = pressed ? "#0a1827" : "#0f233a";
      border = highContrast ? "2px solid #ffffff" : "1.5px solid #00f0ff";
      textColor = "#00f0ff";
      shadow = !extruded
        ? "none"
        : pressed
          ? "1px 1px 0px #071320"
          : elevation === 0
            ? "2px 2px 0px #071320"
            : elevation === 1
              ? "4px 4px 0px #071320, 8px 8px 0px #03080e"
              : "6px 6px 0px #071320, 12px 12px 0px #03080e";
      textShadow = "0 0 6px rgba(0, 240, 255, 0.6)";
      break;
  }

  return {
    background: bg,
    border,
    borderRadius: "4px",
    boxShadow: shadow,
    color: textColor,
    textShadow,
    fontFamily: "'Space Grotesk', Rajdhani, Inter, sans-serif",
    ...(pressed ? { transform: "translate(3px, 3px)" } : {}),
  };
}

export const ANTI_DESIGN_STRIPES_PATH =
  "M 0 0 L 10 0 L 30 40 L 20 40 Z M 25 0 L 35 0 L 55 40 L 45 40 Z M 50 0 L 60 0 L 80 40 L 70 40 Z M 75 0 L 85 0 L 105 40 L 95 40 Z";
export const ANTI_DESIGN_CROSS_PATH =
  "M 6 6 L 34 34 M 34 6 L 6 34";
export const ANTI_DESIGN_BURST_PATH =
  "M 25 2 L 31 14 L 45 10 L 41 24 L 50 35 L 36 38 L 32 50 L 22 42 L 10 48 L 12 34 L 2 26 L 15 20 Z";

export const INFLATED_3D_BUBBLE_PATH =
  "M 25 5 A 20 20 0 1 0 25 45 A 20 20 0 1 0 25 5 Z M 16 12 A 6 4 0 0 1 24 10 A 3 2 0 0 0 18 14 Z";
export const INFLATED_3D_PILL_PATH =
  "M 14 6 C 8 6, 4 10, 4 16 L 4 34 C 4 40, 8 44, 14 44 L 36 44 C 42 44, 46 40, 46 34 L 46 16 C 46 10, 42 6, 36 6 Z";
export const INFLATED_3D_CLOUD_PATH =
  "M 14 36 L 40 36 C 45 36, 48 32, 48 28 C 48 24, 45 21, 41 21 C 41 15, 36 10, 30 10 C 26 10, 22 12, 20 16 C 18 15, 16 15, 14 16 C 10 18, 8 22, 8 26 C 8 32, 11 36, 14 36 Z";

export const ISOMETRIC_CUBE_PATH =
  "M 25 5 L 45 16 L 25 27 L 5 16 Z M 5 16 L 25 27 L 25 48 L 5 37 Z M 25 27 L 45 16 L 45 37 L 25 48 Z";
export const ISOMETRIC_GRID_PATH =
  "M 25 2 L 48 15 L 25 28 L 2 15 Z M 25 28 L 48 41 L 25 54 L 2 41 Z M 2 15 L 2 41 M 48 15 L 48 41 M 25 28 L 25 54";
export const ISOMETRIC_PYRAMID_PATH =
  "M 25 6 L 42 16 L 25 26 L 8 16 Z M 8 16 L 25 26 L 25 44 L 8 34 Z M 25 26 L 42 16 L 42 34 L 25 44 Z";

// ============================================================================
// Style Implementations: Ukiyo-e, Brutalism, Bauhaus & Mid-Century Modern (Prompt 70)
// ============================================================================

export type UkiyoeVariant = "indigo-wave" | "vermilion-sun" | "sumi-wash" | "moss-garden";

export interface UkiyoeStyleOptions {
  readonly variant?: UkiyoeVariant;
  readonly elevation?: number;
  readonly woodblockBorder?: boolean;
  readonly pressed?: boolean;
  readonly highContrast?: boolean;
}

export interface UkiyoeStyleResult {
  readonly background: string;
  readonly border: string;
  readonly borderRadius: string;
  readonly boxShadow: string;
  readonly color: string;
  readonly textShadow: string;
  readonly fontFamily: string;
  readonly transform?: string;
}

export function computeUkiyoeStyle(
  options: UkiyoeStyleOptions = {},
): UkiyoeStyleResult {
  const {
    variant = "indigo-wave",
    elevation = 1,
    woodblockBorder = true,
    pressed = false,
    highContrast = false,
  } = options;

  let bg = "";
  let border = "";
  let textColor = "";
  let shadow = "";
  let textShadow = "none";

  switch (variant) {
    case "vermilion-sun":
      bg = pressed ? "#a8271a" : "#c93a2b";
      border = highContrast ? "3px solid #ffffff" : woodblockBorder ? "2px solid #1a1a1a" : "none";
      textColor = "#ffffff";
      shadow = pressed
        ? "inset 0 3px 6px rgba(0,0,0,0.4)"
        : elevation === 0
          ? "0 1px 3px rgba(26, 26, 26, 0.15)"
          : elevation === 1
            ? "0 4px 14px rgba(201, 58, 43, 0.3), 0 1px 3px rgba(26,26,26,0.2)"
            : "0 8px 24px rgba(201, 58, 43, 0.45), 0 2px 6px rgba(26,26,26,0.3)";
      textShadow = "0 1px 2px rgba(0,0,0,0.5)";
      break;

    case "sumi-wash":
      bg = pressed ? "#ebe6d8" : "#faf7f0";
      border = highContrast ? "3px solid #000000" : woodblockBorder ? "1.5px solid #1a1a1a" : "1px solid rgba(26,26,26,0.2)";
      textColor = "#1a1a1a";
      shadow = pressed
        ? "inset 0 2px 5px rgba(26, 26, 26, 0.1)"
        : elevation === 0
          ? "0 1px 3px rgba(26, 26, 26, 0.08)"
          : elevation === 1
            ? "0 4px 12px rgba(26, 26, 26, 0.12)"
            : "0 8px 20px rgba(26, 26, 26, 0.18)";
      break;

    case "moss-garden":
      bg = pressed ? "#2e392f" : "#3d4a3e";
      border = highContrast ? "3px solid #ffffff" : woodblockBorder ? "2px solid #1a1a1a" : "1px solid #c93a2b";
      textColor = "#f5f2e9";
      shadow = pressed
        ? "inset 0 3px 6px rgba(0,0,0,0.3)"
        : elevation === 0
          ? "0 1px 3px rgba(26, 26, 26, 0.15)"
          : elevation === 1
            ? "0 4px 12px rgba(26, 26, 26, 0.25)"
            : "0 8px 22px rgba(26, 26, 26, 0.35)";
      break;

    case "indigo-wave":
    default:
      bg = pressed ? "#121d28" : "#1a2a3a";
      border = highContrast ? "3px solid #ffffff" : woodblockBorder ? "2px solid #c93a2b" : "1.5px solid #1a2a3a";
      textColor = "#f7f4ea";
      shadow = pressed
        ? "inset 0 3px 6px rgba(0,0,0,0.4)"
        : elevation === 0
          ? "0 1px 3px rgba(26, 42, 58, 0.2)"
          : elevation === 1
            ? "0 4px 14px rgba(26, 42, 58, 0.3), 0 0 0 1px rgba(201, 58, 43, 0.3)"
            : "0 8px 24px rgba(26, 42, 58, 0.45), 0 0 0 1px rgba(201, 58, 43, 0.5)";
      break;
  }

  return {
    background: bg,
    border,
    borderRadius: "2px",
    boxShadow: shadow,
    color: textColor,
    textShadow,
    fontFamily: "'Noto Serif JP', 'Shippori Mincho', 'Cinzel', serif",
    ...(pressed ? { transform: "translateY(1px)" } : {}),
  };
}

export type BrutalistVariant = "mono-stark" | "concrete-gray" | "hazard-orange" | "blueprint-cyan";

export interface BrutalistStyleOptions {
  readonly variant?: BrutalistVariant;
  readonly elevation?: number;
  readonly thickBorder?: boolean;
  readonly pressed?: boolean;
  readonly highContrast?: boolean;
}

export interface BrutalistStyleResult {
  readonly background: string;
  readonly border: string;
  readonly borderRadius: string;
  readonly boxShadow: string;
  readonly color: string;
  readonly textShadow: string;
  readonly fontFamily: string;
  readonly transform?: string;
}

export function computeBrutalistStyle(
  options: BrutalistStyleOptions = {},
): BrutalistStyleResult {
  const {
    variant = "mono-stark",
    elevation = 1,
    thickBorder = true,
    pressed = false,
    highContrast = false,
  } = options;

  let bg = "";
  let border = "";
  let textColor = "";
  let shadow = "";

  const borderWidth = highContrast ? "4px solid" : thickBorder ? "3px solid" : "2px solid";

  switch (variant) {
    case "concrete-gray":
      bg = pressed ? "#cfcfcc" : "#e2e2df";
      border = `${borderWidth} #111111`;
      textColor = "#111111";
      shadow = pressed
        ? "1px 1px 0px #111111"
        : elevation === 0
          ? "3px 3px 0px #111111"
          : elevation === 1
            ? "5px 5px 0px #111111"
            : "8px 8px 0px #111111";
      break;

    case "hazard-orange":
      bg = pressed ? "#e04b00" : "#ff5500";
      border = `${borderWidth} #000000`;
      textColor = "#000000";
      shadow = pressed
        ? "1px 1px 0px #000000"
        : elevation === 0
          ? "3px 3px 0px #000000"
          : elevation === 1
            ? "5px 5px 0px #000000"
            : "8px 8px 0px #000000";
      break;

    case "blueprint-cyan":
      bg = pressed ? "#00c4d4" : "#00e5ff";
      border = `${borderWidth} #000000`;
      textColor = "#000000";
      shadow = pressed
        ? "1px 1px 0px #000000"
        : elevation === 0
          ? "3px 3px 0px #000000"
          : elevation === 1
            ? "5px 5px 0px #000000"
            : "8px 8px 0px #000000";
      break;

    case "mono-stark":
    default:
      bg = pressed ? "#000000" : "#ffffff";
      border = `${borderWidth} #000000`;
      textColor = pressed ? "#ffffff" : "#000000";
      shadow = pressed
        ? "1px 1px 0px #000000"
        : elevation === 0
          ? "3px 3px 0px #000000"
          : elevation === 1
            ? "5px 5px 0px #000000"
            : "8px 8px 0px #000000";
      break;
  }

  return {
    background: bg,
    border,
    borderRadius: "0px",
    boxShadow: shadow,
    color: textColor,
    textShadow: "none",
    fontFamily: "'Druk', 'Arial Black', 'IBM Plex Mono', Impact, sans-serif",
    ...(pressed ? { transform: "translate(4px, 4px)" } : {}),
  };
}

export type BauhausVariant = "primary-red" | "primary-blue" | "primary-yellow" | "rational-white";

export interface BauhausStyleOptions {
  readonly variant?: BauhausVariant;
  readonly elevation?: number;
  readonly shapeForm?: "square" | "circle" | "standard";
  readonly pressed?: boolean;
  readonly highContrast?: boolean;
}

export interface BauhausStyleResult {
  readonly background: string;
  readonly border: string;
  readonly borderRadius: string;
  readonly boxShadow: string;
  readonly color: string;
  readonly textShadow: string;
  readonly fontFamily: string;
  readonly transform?: string;
}

export function computeBauhausStyle(
  options: BauhausStyleOptions = {},
): BauhausStyleResult {
  const {
    variant = "primary-red",
    elevation = 0,
    shapeForm = "standard",
    pressed = false,
    highContrast = false,
  } = options;

  let bg = "";
  let border = "";
  let textColor = "";

  const borderStroke = highContrast ? "3px solid #000000" : "2px solid #000000";

  switch (variant) {
    case "primary-blue":
      bg = pressed ? "#003580" : "#0047AB";
      border = borderStroke;
      textColor = "#ffffff";
      break;

    case "primary-yellow":
      bg = pressed ? "#e6b800" : "#FFD166";
      border = borderStroke;
      textColor = "#000000";
      break;

    case "rational-white":
      bg = pressed ? "#e8e8e8" : "#ffffff";
      border = borderStroke;
      textColor = "#000000";
      break;

    case "primary-red":
    default:
      bg = pressed ? "#d62851" : "#EF476F";
      border = borderStroke;
      textColor = "#ffffff";
      break;
  }

  const shadow = elevation > 0 ? "4px 4px 0px #000000" : "none";
  const radius = shapeForm === "circle" ? "9999px" : "0px";

  return {
    background: bg,
    border,
    borderRadius: radius,
    boxShadow: shadow,
    color: textColor,
    textShadow: "none",
    fontFamily: "'Futura', 'Univers', 'Helvetica Neue', Arial, sans-serif",
    ...(pressed ? { transform: "translateY(2px)" } : {}),
  };
}

export type MidCenturyModernVariant = "warm-teak" | "atomic-teal" | "mustard-harvest" | "olive-terracotta";

export interface MidCenturyModernStyleOptions {
  readonly variant?: MidCenturyModernVariant;
  readonly elevation?: number;
  readonly kidneyCurve?: boolean;
  readonly pressed?: boolean;
  readonly highContrast?: boolean;
}

export interface MidCenturyModernStyleResult {
  readonly background: string;
  readonly border: string;
  readonly borderRadius: string;
  readonly boxShadow: string;
  readonly color: string;
  readonly textShadow: string;
  readonly fontFamily: string;
  readonly transform?: string;
}

export function computeMidCenturyModernStyle(
  options: MidCenturyModernStyleOptions = {},
): MidCenturyModernStyleResult {
  const {
    variant = "warm-teak",
    elevation = 1,
    kidneyCurve = false,
    pressed = false,
    highContrast = false,
  } = options;

  let bg = "";
  let border = "";
  let textColor = "";
  let shadow = "";

  switch (variant) {
    case "atomic-teal":
      bg = pressed ? "#1e5270" : "#2a6f97";
      border = highContrast ? "2px solid #ffffff" : "1px solid #1a4863";
      textColor = "#fbf8f3";
      shadow = pressed
        ? "0 2px 4px rgba(26,72,99,0.2)"
        : elevation === 0
          ? "0 2px 6px rgba(26,72,99,0.12)"
          : elevation === 1
            ? "0 6px 16px rgba(26,72,99,0.2)"
            : "0 10px 24px rgba(26,72,99,0.28)";
      break;

    case "mustard-harvest":
      bg = pressed ? "#bd8e5a" : "#d4a373";
      border = highContrast ? "2px solid #000000" : "1px solid #7c4728";
      textColor = "#3e2719";
      shadow = pressed
        ? "0 2px 4px rgba(62,39,25,0.15)"
        : elevation === 0
          ? "0 2px 6px rgba(62,39,25,0.1)"
          : elevation === 1
            ? "0 6px 16px rgba(62,39,25,0.16)"
            : "0 10px 24px rgba(62,39,25,0.24)";
      break;

    case "olive-terracotta":
      bg = pressed ? "#4f5a2e" : "#606c38";
      border = highContrast ? "2px solid #ffffff" : "1px solid #bc6c25";
      textColor = "#fbf8f3";
      shadow = pressed
        ? "0 2px 4px rgba(40,54,24,0.2)"
        : elevation === 0
          ? "0 2px 6px rgba(40,54,24,0.12)"
          : elevation === 1
            ? "0 6px 16px rgba(40,54,24,0.2)"
            : "0 10px 24px rgba(40,54,24,0.28)";
      break;

    case "warm-teak":
    default:
      bg = pressed ? "#a86438" : "#c17c4e";
      border = highContrast ? "2px solid #000000" : "1px solid #7c4728";
      textColor = "#ffffff";
      shadow = pressed
        ? "0 2px 4px rgba(62,39,25,0.2)"
        : elevation === 0
          ? "0 2px 6px rgba(62,39,25,0.12)"
          : elevation === 1
            ? "0 6px 18px rgba(62,39,25,0.2)"
            : "0 12px 28px rgba(62,39,25,0.3)";
      break;
  }

  const radius = kidneyCurve ? "32px 14px 28px 16px" : "18px";

  return {
    background: bg,
    border,
    borderRadius: radius,
    boxShadow: shadow,
    color: textColor,
    textShadow: "none",
    fontFamily: "'Century Gothic', 'Brandon Grotesque', Jost, Futura, sans-serif",
    ...(pressed ? { transform: "translateY(2px)" } : {}),
  };
}

export const UKIYOE_WAVE_PATH =
  "M 0 35 C 15 35, 25 15, 45 15 C 65 15, 75 35, 95 35 C 115 35, 125 10, 145 10 C 165 10, 175 35, 195 35 L 195 50 L 0 50 Z M 135 15 C 138 8, 145 6, 148 12 M 140 18 C 143 12, 149 11, 151 16";
export const UKIYOE_CLOUD_PATH =
  "M 15 25 C 10 25, 5 20, 8 14 C 11 8, 18 8, 22 12 C 26 6, 36 6, 40 12 C 45 10, 50 14, 48 20 C 52 23, 50 29, 45 30 L 15 30 Z";
export const UKIYOE_HANKO_PATH =
  "M 4 4 L 36 4 L 36 36 L 4 36 Z M 8 8 L 32 8 L 32 32 L 8 32 Z M 14 12 L 26 12 M 20 12 L 20 28 M 14 20 L 26 20 M 14 28 L 26 28";

export const BRUTALIST_CROSSHAIR_PATH =
  "M 15 0 L 15 30 M 0 15 L 30 15 M 7 7 L 23 7 L 23 23 L 7 23 Z";
export const BRUTALIST_CORNER_PATH =
  "M 0 16 L 0 0 L 16 0 M 4 4 L 4 12 M 4 4 L 12 4";
export const BRUTALIST_ARROW_PATH =
  "M 4 20 L 26 20 M 16 10 L 26 20 L 16 30";

export const BAUHAUS_TRIANGLE_PATH =
  "M 25 5 L 47 42 L 3 42 Z";
export const BAUHAUS_CIRCLE_PATH =
  "M 25 5 A 20 20 0 1 0 25 45 A 20 20 0 1 0 25 5 Z";
export const BAUHAUS_SQUARE_PATH =
  "M 5 5 L 45 5 L 45 45 L 5 45 Z";

export const MCM_SUNBURST_PATH =
  "M 25 2 L 27 18 L 43 14 L 30 23 L 46 32 L 29 30 L 28 48 L 22 32 L 6 38 L 18 26 L 2 20 L 19 17 Z";
export const MCM_BOOMERANG_PATH =
  "M 4 36 C 14 24, 24 14, 38 4 C 34 16, 26 28, 14 44 C 9 44, 4 41, 4 36 Z";
export const MCM_KIDNEY_PATH =
  "M 12 10 C 22 4, 38 8, 44 20 C 48 30, 42 42, 30 44 C 18 46, 6 38, 6 26 C 6 18, 10 12, 12 10 Z";
