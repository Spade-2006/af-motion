/**
 * AF Motion Design Intelligence & Context Interpretation Engine
 *
 * Framework-independent interpretation layer that analyzes natural-language design briefs,
 * project requirements, or structured context inputs and produces machine-readable
 * DesignContext specifications and motion recommendations.
 */

import type { AIMotionCapability, AIMotionRegistry } from "./ai-motion-registry.js";
import type { InterpretOptions } from "./natural-motion.js";

export const DESIGN_CONTEXT_SPEC_VERSION = "1.0.0";

export type WebsiteCategory =
  | "portfolio"
  | "saas"
  | "dashboard"
  | "ecommerce"
  | "landing-page"
  | "blog"
  | "enterprise"
  | "creative-agency"
  | "mobile-app"
  | "documentation"
  | "fintech"
  | "general";

export type BrandPersonality =
  | "minimal"
  | "futuristic"
  | "elegant"
  | "playful"
  | "professional"
  | "editorial"
  | "brutalist"
  | "bold"
  | "organic"
  | "tech"
  | "balanced";

export type ColorModePreference = "dark" | "light" | "system" | "high-contrast";

export type VisualVibrancy = "muted" | "vibrant" | "pastel" | "monochrome" | "neon" | "balanced";

export type LayoutDensity = "compact" | "comfortable" | "spacious";

export type LayoutStructure =
  | "bento"
  | "grid"
  | "asymmetric"
  | "centered"
  | "editorial"
  | "full-screen"
  | "split"
  | "standard";

export type MotionIntensity = "none" | "subtle" | "moderate" | "expressive";

export type TargetAudience =
  | "b2b"
  | "b2c"
  | "developer"
  | "consumer"
  | "enterprise"
  | "creative"
  | "general";

export type IndustrySector =
  | "tech"
  | "fintech"
  | "healthcare"
  | "ecommerce"
  | "gaming"
  | "luxury"
  | "fashion"
  | "education"
  | "media"
  | "general";

export interface ComponentRequirements {
  readonly hero?: boolean;
  readonly cards?: boolean;
  readonly buttons?: boolean;
  readonly tables?: boolean;
  readonly charts?: boolean;
  readonly navigation?: boolean;
  readonly modals?: boolean;
  readonly forms?: boolean;
  readonly carousel?: boolean;
  readonly pricing?: boolean;
  readonly customComponents?: readonly string[];
}

export interface InteractionRequirements {
  readonly hoverIntensity?: "none" | "subtle" | "prominent";
  readonly pointerTracking?: boolean;
  readonly magneticElements?: boolean;
  readonly scrollDriven?: boolean;
  readonly microInteractions?: boolean;
}

export interface ResponsivenessRequirements {
  readonly mobileFirst?: boolean;
  readonly adaptiveLayout?: boolean;
  readonly touchOptimized?: boolean;
  readonly breakpointDensity?: boolean;
}

export interface AccessibilityRequirements {
  readonly respectReducedMotion: boolean;
  readonly highContrastMode?: boolean;
  readonly screenReaderOptimized?: boolean;
  readonly keyboardNavigable?: boolean;
  readonly minimumTouchTarget?: boolean;
}

export interface PerformanceConstraints {
  readonly targetFps?: 30 | 60 | 120;
  readonly maxCanvasInstances?: number;
  readonly lowPowerMode?: boolean;
  readonly gpuAcceleration?: boolean;
}

export interface MotionPreferences {
  readonly intensity: MotionIntensity;
  readonly motionDNA?: string;
  readonly springPreference?: boolean;
  readonly preferredEasing?: string;
  readonly reducedMotionBehavior?: "skips-to-endpoint" | "disables-animation" | "static-fallback";
}

export interface VisualDirection {
  readonly colorMode: ColorModePreference;
  readonly vibrancy: VisualVibrancy;
  readonly density: LayoutDensity;
  readonly contrast: "standard" | "high";
  readonly glassmorphism?: boolean;
  readonly roundedCorners?: "none" | "small" | "medium" | "large" | "full";
}

export interface ContentHierarchy {
  readonly primaryFocus?: string;
  readonly visualWeight?: "light" | "balanced" | "heavy";
  readonly informationDensity?: LayoutDensity;
}

export interface DesignContext {
  readonly version: string;
  readonly category: WebsiteCategory;
  readonly industry: IndustrySector;
  readonly audience: TargetAudience;
  readonly personality: BrandPersonality;
  readonly visualDirection: VisualDirection;
  readonly layout: LayoutStructure;
  readonly contentHierarchy: ContentHierarchy;
  readonly components: ComponentRequirements;
  readonly interactions: InteractionRequirements;
  readonly responsiveness: ResponsivenessRequirements;
  readonly accessibility: AccessibilityRequirements;
  readonly performance: PerformanceConstraints;
  readonly motion: MotionPreferences;
  readonly visualStyles: readonly string[];
  readonly palettePreference?: string;
  readonly typographyPreference?: {
    readonly headingFont?: string;
    readonly bodyFont?: string;
    readonly style?: "sans" | "serif" | "mono" | "display";
  };
  readonly rawPrompt?: string;
}

export interface DesignConflict {
  readonly id: string;
  readonly type:
    | "personality_mismatch"
    | "accessibility_conflict"
    | "density_conflict"
    | "performance_conflict"
    | "visual_conflict";
  readonly severity: "warning" | "error";
  readonly description: string;
  readonly fields: readonly string[];
  readonly resolutionSuggestion: string;
}

export interface RecommendedVisualStyle {
  readonly styleId: string;
  readonly capabilityId?: string;
  readonly name: string;
  readonly category: string;
  readonly confidence: number;
  readonly rationale: string;
  readonly isRegistered: boolean;
}

export interface RecommendedMotion {
  readonly intensity: MotionIntensity;
  readonly motionDNA: string;
  readonly designSystem: string;
  readonly recommendedPresets: readonly string[];
  readonly recommendedBackgrounds: readonly string[];
  readonly recommendedEffects: readonly string[];
  readonly defaultEasing: string;
  readonly defaultDuration: number;
  readonly respectReducedMotion: boolean;
}

export interface DesignDetectedCharacteristics {
  readonly keywords: readonly string[];
  readonly detectedCategory?: WebsiteCategory;
  readonly detectedPersonality?: BrandPersonality;
  readonly detectedColorMode?: ColorModePreference;
  readonly detectedLayout?: LayoutStructure;
  readonly explicitComponents: readonly string[];
  readonly explicitInteractions: readonly string[];
  readonly accessibilityFlags: readonly string[];
}

export interface DesignInterpretationResult {
  readonly success: boolean;
  readonly confidence: number;
  readonly normalizedContext: DesignContext;
  readonly detectedCharacteristics: DesignDetectedCharacteristics;
  readonly recommendedVisualStyles: readonly RecommendedVisualStyle[];
  readonly motionRecommendations: RecommendedMotion;
  readonly conflicts: readonly DesignConflict[];
  readonly warnings: readonly string[];
  readonly missingInformation: readonly string[];
  readonly validation: {
    readonly valid: boolean;
    readonly errors: readonly string[];
  };
}

export interface DesignInterpretationOptions {
  readonly registry?: AIMotionRegistry;
  readonly defaultCategory?: WebsiteCategory;
  readonly defaultPersonality?: BrandPersonality;
  readonly defaultColorMode?: ColorModePreference;
  readonly strictValidation?: boolean;
}

export interface DesignContextValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

let defaultRegistryResolver: (() => AIMotionRegistry | undefined) | undefined;

/**
 * Registers the global AI Motion Registry resolver to maintain zero circular dependencies.
 */
export function setDesignRegistryResolver(resolver: () => AIMotionRegistry | undefined): void {
  defaultRegistryResolver = resolver;
}

/**
 * Resolves the effective registry from options or global resolver.
 */
export function getEffectiveDesignRegistry(
  options?: DesignInterpretationOptions,
): AIMotionRegistry | undefined {
  return options?.registry ?? defaultRegistryResolver?.();
}

/**
 * Default fallback design context.
 */
export const DEFAULT_DESIGN_CONTEXT: Readonly<DesignContext> = Object.freeze<DesignContext>({
  version: DESIGN_CONTEXT_SPEC_VERSION,
  category: "general",
  industry: "general",
  audience: "general",
  personality: "balanced",
  visualDirection: {
    colorMode: "system",
    vibrancy: "balanced",
    density: "comfortable",
    contrast: "standard",
    roundedCorners: "medium",
  },
  layout: "standard",
  contentHierarchy: {
    visualWeight: "balanced",
    informationDensity: "comfortable",
  },
  components: {},
  interactions: {
    hoverIntensity: "subtle",
    microInteractions: true,
  },
  responsiveness: {
    mobileFirst: true,
    adaptiveLayout: true,
    touchOptimized: true,
  },
  accessibility: {
    respectReducedMotion: true,
    screenReaderOptimized: true,
    keyboardNavigable: true,
  },
  performance: {
    targetFps: 60,
    maxCanvasInstances: 1,
    gpuAcceleration: true,
  },
  motion: {
    intensity: "moderate",
    motionDNA: "dna-calm",
    springPreference: true,
    preferredEasing: "ease-out",
    reducedMotionBehavior: "skips-to-endpoint",
  },
  visualStyles: [],
});

/**
 * Normalizes a partial design context into a fully populated, valid DesignContext.
 */
export function normalizeDesignContext(partial: Partial<DesignContext> = {}): DesignContext {
  return {
    version: DESIGN_CONTEXT_SPEC_VERSION,
    category: partial.category ?? DEFAULT_DESIGN_CONTEXT.category,
    industry: partial.industry ?? DEFAULT_DESIGN_CONTEXT.industry,
    audience: partial.audience ?? DEFAULT_DESIGN_CONTEXT.audience,
    personality: partial.personality ?? DEFAULT_DESIGN_CONTEXT.personality,
    visualDirection: {
      ...DEFAULT_DESIGN_CONTEXT.visualDirection,
      ...(partial.visualDirection ?? {}),
    },
    layout: partial.layout ?? DEFAULT_DESIGN_CONTEXT.layout,
    contentHierarchy: {
      ...DEFAULT_DESIGN_CONTEXT.contentHierarchy,
      ...(partial.contentHierarchy ?? {}),
    },
    components: {
      ...DEFAULT_DESIGN_CONTEXT.components,
      ...(partial.components ?? {}),
    },
    interactions: {
      ...DEFAULT_DESIGN_CONTEXT.interactions,
      ...(partial.interactions ?? {}),
    },
    responsiveness: {
      ...DEFAULT_DESIGN_CONTEXT.responsiveness,
      ...(partial.responsiveness ?? {}),
    },
    accessibility: {
      ...DEFAULT_DESIGN_CONTEXT.accessibility,
      ...(partial.accessibility ?? {}),
    },
    performance: {
      ...DEFAULT_DESIGN_CONTEXT.performance,
      ...(partial.performance ?? {}),
    },
    motion: {
      ...DEFAULT_DESIGN_CONTEXT.motion,
      ...(partial.motion ?? {}),
    },
    visualStyles: Array.isArray(partial.visualStyles) ? [...partial.visualStyles] : [],
    palettePreference: partial.palettePreference,
    typographyPreference: partial.typographyPreference,
    rawPrompt: partial.rawPrompt,
  };
}

/**
 * Factory for creating a strongly-typed DesignContext.
 */
export function createDesignContext(initial: Partial<DesignContext> = {}): DesignContext {
  return normalizeDesignContext(initial);
}

/**
 * Validates a DesignContext for structural integrity and constraint satisfaction.
 */
export function validateDesignContext(context: unknown): DesignContextValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!context || typeof context !== "object") {
    return {
      valid: false,
      errors: ["Design context must be a non-null object."],
      warnings: [],
    };
  }

  const ctx = context as Partial<DesignContext>;

  if (ctx.version && typeof ctx.version !== "string") {
    errors.push("Design context version must be a string.");
  }

  const validCategories: readonly WebsiteCategory[] = [
    "portfolio",
    "saas",
    "dashboard",
    "ecommerce",
    "landing-page",
    "blog",
    "enterprise",
    "creative-agency",
    "mobile-app",
    "documentation",
    "fintech",
    "general",
  ];

  if (ctx.category && !validCategories.includes(ctx.category)) {
    errors.push(`Invalid website category: "${ctx.category}".`);
  }

  const validPersonalities: readonly BrandPersonality[] = [
    "minimal",
    "futuristic",
    "elegant",
    "playful",
    "professional",
    "editorial",
    "brutalist",
    "bold",
    "organic",
    "tech",
    "balanced",
  ];

  if (ctx.personality && !validPersonalities.includes(ctx.personality)) {
    errors.push(`Invalid brand personality: "${ctx.personality}".`);
  }

  if (ctx.visualDirection) {
    const validModes: readonly ColorModePreference[] = ["dark", "light", "system", "high-contrast"];
    if (ctx.visualDirection.colorMode && !validModes.includes(ctx.visualDirection.colorMode)) {
      errors.push(`Invalid color mode preference: "${ctx.visualDirection.colorMode}".`);
    }
  }

  if (ctx.motion) {
    const validIntensities: readonly MotionIntensity[] = ["none", "subtle", "moderate", "expressive"];
    if (ctx.motion.intensity && !validIntensities.includes(ctx.motion.intensity)) {
      errors.push(`Invalid motion intensity: "${ctx.motion.intensity}".`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Converts a DesignContext into contextual defaults for Prompt 59's interpretMotionPrompt.
 */
export function toNaturalMotionContext(context: DesignContext): InterpretOptions["context"] {
  let defaultTarget: string | undefined;
  if (context.components.hero) defaultTarget = "#hero";
  else if (context.components.cards) defaultTarget = ".card";
  else if (context.components.buttons) defaultTarget = "button";
  else if (context.components.tables) defaultTarget = "table";

  let motionDNA = context.motion.motionDNA?.replace("dna-", "");
  if (!motionDNA || motionDNA === "calm") {
    if (context.personality === "minimal") motionDNA = "minimal";
    else if (context.personality === "futuristic" || context.personality === "tech") motionDNA = "snappy";
    else if (context.personality === "playful") motionDNA = "playful";
    else if (context.personality === "elegant") motionDNA = "cinematic";
    else if (!motionDNA) motionDNA = "calm";
  }

  let designSystem: string;
  if (context.personality === "minimal") designSystem = "ds-minimal";
  else if (context.personality === "playful" || context.personality === "bold") designSystem = "ds-expressive";
  else designSystem = "ds-default";

  return {
    defaultTarget,
    motionDNA,
    designSystem,
    preferredCategory: context.motion.intensity === "subtle" ? "preset" : "choreography",
  };
}

// --- Keyword Dictionaries for Deterministic Classification ---

interface PatternMap<T> {
  readonly value: T;
  readonly patterns: readonly RegExp[];
}

const CATEGORY_PATTERNS: readonly PatternMap<WebsiteCategory>[] = [
  { value: "dashboard", patterns: [/\bdashboard\b/i, /\banalytics\b/i, /\badmin\s+panel\b/i, /\bdata\s+dense\b/i, /\bkpi\b/i] },
  { value: "saas", patterns: [/\bsaas\b/i, /\bsoftware\b/i, /\bcloud\s+platform\b/i, /\bweb\s+app\b/i] },
  { value: "portfolio", patterns: [/\bportfolio\b/i, /\bpersonal\s+site\b/i, /\bshowcase\s+site\b/i, /\bdesigner\s+site\b/i] },
  { value: "ecommerce", patterns: [/\be[-]?commerce\b/i, /\bstore\b/i, /\bshop\b/i, /\bproducts\b/i, /\bcheckout\b/i] },
  { value: "landing-page", patterns: [/\blanding\s+page\b/i, /\bwaitlist\b/i, /\blaunch\s+page\b/i, /\bmarketing\s+page\b/i] },
  { value: "creative-agency", patterns: [/\bagency\b/i, /\bcreative\s+studio\b/i, /\bdesign\s+agency\b/i] },
  { value: "fintech", patterns: [/\bfintech\b/i, /\bfinance\b/i, /\bbanking\b/i, /\btrading\b/i, /\bpayments\b/i] },
  { value: "blog", patterns: [/\bblog\b/i, /\bpublication\b/i, /\bmagazine\b/i, /\bnewsletter\b/i] },
  { value: "enterprise", patterns: [/\benterprise\b/i, /\bcorporate\b/i, /\bb2b\s+portal\b/i] },
  { value: "documentation", patterns: [/\bdocs?\b/i, /\bdocumentation\b/i, /\bapi\s+reference\b/i, /\bknowledge\s+base\b/i] },
  { value: "mobile-app", patterns: [/\bmobile\s+app\b/i, /\bios\b/i, /\bandroid\b/i, /\bpwa\b/i] },
];

const PERSONALITY_PATTERNS: readonly PatternMap<BrandPersonality>[] = [
  { value: "minimal", patterns: [/\bminimal(?:ist)?\b/i, /\bclean\b/i, /\bsimple\b/i, /\bunderstated\b/i, /\bzen\b/i] },
  { value: "futuristic", patterns: [/\bfuturistic\b/i, /\bcyber(?:punk)?\b/i, /\bsci[-]?fi\b/i, /\bspace\b/i, /\bnext[-]?gen\b/i] },
  { value: "elegant", patterns: [/\belegant\b/i, /\bluxury\b/i, /\brefined\b/i, /\bsophisticated\b/i, /\bpremium\b/i, /\bgraceful\b/i] },
  { value: "playful", patterns: [/\bplayful\b/i, /\bfun\b/i, /\bwhimsical\b/i, /\bquirky\b/i, /\bcheerful\b/i, /\bbouncy\b/i] },
  { value: "professional", patterns: [/\bprofessional\b/i, /\bcorporate\b/i, /\btrustworthy\b/i, /\bformal\b/i, /\bauthoritative\b/i] },
  { value: "editorial", patterns: [/\beditorial\b/i, /\btypographic\b/i, /\bserif\b/i, /\bmagazine\s+style\b/i, /\bliterary\b/i] },
  { value: "brutalist", patterns: [/\bbrutalist\b/i, /\braw\b/i, /\bneo[-]?brutalism\b/i, /\bunpolished\b/i, /\bhigh[-]?contrast\s+borders\b/i] },
  { value: "bold", patterns: [/\bbold\b/i, /\bexpressive\b/i, /\bvibrant\b/i, /\bdramatic\b/i, /\bimpactful\b/i] },
  { value: "organic", patterns: [/\borganic\b/i, /\bnatural\b/i, /\bearthy\b/i, /\bsoft\b/i, /\bcurved\b/i] },
  { value: "tech", patterns: [/\btech(?:y)?\b/i, /\bdeveloper[-]?focused\b/i, /\bgeek\b/i, /\bmodern\s+tech\b/i] },
];

const COLOR_MODE_PATTERNS: readonly PatternMap<ColorModePreference>[] = [
  { value: "dark", patterns: [/\bdark(?:\s+mode)?\b/i, /\bnight\b/i, /\bblack\s+background\b/i, /\bdim\b/i] },
  { value: "light", patterns: [/\blight(?:\s+mode)?\b/i, /\bday\b/i, /\bwhite\s+background\b/i, /\bbright\b/i] },
  { value: "high-contrast", patterns: [/\bhigh[\s-]contrast\b/i, /\bmaximum\s+contrast\b/i, /\ba11y\s+contrast\b/i] },
  { value: "system", patterns: [/\bsystem(?:\s+theme)?\b/i, /\bauto\s+theme\b/i] },
];

const LAYOUT_PATTERNS: readonly PatternMap<LayoutStructure>[] = [
  { value: "bento", patterns: [/\bbento(?:\s+grid)?\b/i, /\bmodular\s+grid\b/i, /\bcompartmentalized\b/i] },
  { value: "asymmetric", patterns: [/\basymmetric(?:al)?\b/i, /\boff[-]?grid\b/i, /\bunbalanced\b/i] },
  { value: "grid", patterns: [/\bgrid(?:\s+layout)?\b/i, /\bcolumns\b/i, /\bmulti[-]?column\b/i] },
  { value: "centered", patterns: [/\bcentered\b/i, /\bsingle[-]?column\b/i, /\bhero[-]?centric\b/i] },
  { value: "editorial", patterns: [/\beditorial\s+layout\b/i, /\bnewspaper\b/i, /\bspread\b/i] },
  { value: "full-screen", patterns: [/\bfull[-]?screen\b/i, /\bimmersive\b/i, /\bviewport[-]?filling\b/i] },
  { value: "split", patterns: [/\bsplit(?:\s+screen)?\b/i, /\bhalf[-]?half\b/i, /\btwo[-]?panel\b/i] },
];

const INDUSTRY_PATTERNS: readonly PatternMap<IndustrySector>[] = [
  { value: "fintech", patterns: [/\bfintech\b/i, /\bfinance\b/i, /\bpayments?\b/i, /\bbanking\b/i, /\binvest(?:ment)?\b/i] },
  { value: "healthcare", patterns: [/\bhealth(?:care)?\b/i, /\bmedical\b/i, /\bclinic\b/i, /\bpatient\b/i, /\bwellness\b/i] },
  { value: "gaming", patterns: [/\bgaming\b/i, /\bgames?\b/i, /\besports\b/i, /\barcade\b/i] },
  { value: "luxury", patterns: [/\bluxury\b/i, /\bhaute\b/i, /\bjewelry\b/i, /\bhigh[-]?end\b/i] },
  { value: "fashion", patterns: [/\bfashion\b/i, /\bapparel\b/i, /\bclothing\b/i, /\boutfits?\b/i] },
  { value: "education", patterns: [/\beducation\b/i, /\blearning\b/i, /\bedtech\b/i, /\bcourses?\b/i, /\bacademy\b/i] },
  { value: "media", patterns: [/\bmedia\b/i, /\bnews\b/i, /\bentertainment\b/i, /\bstreaming\b/i] },
  { value: "ecommerce", patterns: [/\bretail\b/i, /\bcommerce\b/i, /\bstore\b/i, /\bconsumer\s+goods\b/i] },
  { value: "tech", patterns: [/\btech\b/i, /\bsoftware\b/i, /\bdeveloper\b/i, /\bai\b/i, /\bhardware\b/i] },
];

function matchFirst<T>(input: string, maps: readonly PatternMap<T>[]): T | undefined {
  for (const map of maps) {
    for (const pat of map.patterns) {
      if (pat.test(input)) {
        return map.value;
      }
    }
  }
  return undefined;
}

function extractKeywords(input: string): string[] {
  const words = input.toLowerCase().match(/\b[a-z0-9_-]{3,}\b/g) ?? [];
  const stopwords = new Set([
    "with", "that", "this", "from", "have", "make", "need", "want", "look", "feel", "design", "build",
    "create", "site", "website", "page", "user", "users", "using", "into", "some", "like", "well"
  ]);
  return Array.from(new Set(words.filter(w => !stopwords.has(w)))).slice(0, 15);
}

/**
 * Detects conflicts within a DesignContext specification.
 */
function identifyDesignConflicts(context: DesignContext): DesignConflict[] {
  const conflicts: DesignConflict[] = [];

  // 1. High Motion vs Reduced Motion
  if (context.motion.intensity === "expressive" && context.accessibility.respectReducedMotion) {
    conflicts.push({
      id: "conflict-motion-accessibility",
      type: "accessibility_conflict",
      severity: "warning",
      description: "Expressive motion intensity requested alongside strict reduced motion preference.",
      fields: ["motion.intensity", "accessibility.respectReducedMotion"],
      resolutionSuggestion: "Provide a static-fallback or skips-to-endpoint override for prefers-reduced-motion while retaining expressive curves by default.",
    });
  }

  // 2. High-Density Dashboard vs Spacious Layout
  if (
    (context.category === "dashboard" || context.category === "fintech") &&
    context.visualDirection.density === "spacious"
  ) {
    conflicts.push({
      id: "conflict-density-dashboard",
      type: "density_conflict",
      severity: "warning",
      description: "High data-density dashboard combined with spacious layout density.",
      fields: ["category", "visualDirection.density"],
      resolutionSuggestion: "Adopt a compact or comfortable density to prevent excessive scrolling and fragmented information hierarchy.",
    });
  }

  // 3. Brutalist vs Soft/Pastel/Gentle
  if (
    context.personality === "brutalist" &&
    (context.visualDirection.vibrancy === "pastel" || context.visualDirection.vibrancy === "muted")
  ) {
    conflicts.push({
      id: "conflict-brutalist-soft",
      type: "personality_mismatch",
      severity: "warning",
      description: "Brutalist design language conflicts with muted or pastel aesthetic.",
      fields: ["personality", "visualDirection.vibrancy"],
      resolutionSuggestion: "Use high-contrast monochrome or bold saturated primary colors with sharp borders.",
    });
  }

  // 4. Luxury/Editorial vs Playful Neon
  if (
    (context.personality === "elegant" || context.personality === "editorial") &&
    context.visualDirection.vibrancy === "neon"
  ) {
    conflicts.push({
      id: "conflict-luxury-neon",
      type: "visual_conflict",
      severity: "warning",
      description: "Luxury/editorial aesthetic typically clashes with high-saturation neon vibrancy.",
      fields: ["personality", "visualDirection.vibrancy"],
      resolutionSuggestion: "Switch to a refined dark mode, rich metallic accents, or muted monochromatic palette.",
    });
  }

  // 5. 120 FPS Target vs Heavy Canvas in Low Power Mode
  if (context.performance.targetFps === 120 && context.performance.lowPowerMode) {
    conflicts.push({
      id: "conflict-fps-low-power",
      type: "performance_conflict",
      severity: "warning",
      description: "120 FPS target requested while low-power mode is enabled.",
      fields: ["performance.targetFps", "performance.lowPowerMode"],
      resolutionSuggestion: "Cap animation refresh rate to 60 FPS or 30 FPS to conserve battery in low power mode.",
    });
  }

  return conflicts;
}

/**
 * Recommends registered visual capabilities and styles matching the context.
 */
function resolveVisualStyles(
  context: DesignContext,
  registry?: AIMotionRegistry,
): RecommendedVisualStyle[] {
  const recommendations: RecommendedVisualStyle[] = [];

  // 1. Query visual-style capabilities if any are registered
  if (registry) {
    const registeredStyles = registry.listCapabilities({ category: "visual-style" });
    for (const style of registeredStyles) {
      recommendations.push({
        styleId: style.id,
        capabilityId: style.id,
        name: style.name,
        category: "visual-style",
        confidence: 0.9,
        rationale: `Registered visual style capability "${style.name}" matches project requirements.`,
        isRegistered: true,
      });
    }
  }

  // 2. Recommend matching registered backgrounds and design systems
  if (context.personality === "futuristic" || context.personality === "tech") {
    recommendations.push({
      styleId: "bg-cosmic",
      capabilityId: "bg-cosmic",
      name: "Cosmic Nebula",
      category: "background",
      confidence: 0.88,
      rationale: "Futuristic and tech-oriented backgrounds pair seamlessly with deep cosmic shaders.",
      isRegistered: true,
    });
    recommendations.push({
      styleId: "bg-fluid",
      capabilityId: "bg-fluid",
      name: "Fluid Metaballs",
      category: "background",
      confidence: 0.82,
      rationale: "Fluidic dynamic motion provides an interactive next-generation feel.",
      isRegistered: true,
    });
  } else if (context.personality === "minimal") {
    recommendations.push({
      styleId: "ds-minimal",
      capabilityId: "ds-minimal",
      name: "Minimal Design System",
      category: "design-system",
      confidence: 0.95,
      rationale: "Clean, restrained motion with zero unnecessary decorative flourishes.",
      isRegistered: true,
    });
    recommendations.push({
      styleId: "bg-grid",
      capabilityId: "bg-grid",
      name: "Subtle Grid Background",
      category: "background",
      confidence: 0.85,
      rationale: "Structured grid creates order without visual noise.",
      isRegistered: true,
    });
  } else if (context.personality === "playful" || context.personality === "bold") {
    recommendations.push({
      styleId: "ds-expressive",
      capabilityId: "ds-expressive",
      name: "Expressive Design System",
      category: "design-system",
      confidence: 0.92,
      rationale: "Bouncy spring physics, vibrant accents, and high-energy motion.",
      isRegistered: true,
    });
    recommendations.push({
      styleId: "bg-aurora",
      capabilityId: "bg-aurora",
      name: "Aurora Borealis",
      category: "background",
      confidence: 0.84,
      rationale: "Vibrant shifting chromatic waves complement bold and playful branding.",
      isRegistered: true,
    });
  } else {
    recommendations.push({
      styleId: "ds-default",
      capabilityId: "ds-default",
      name: "Balanced Standard System",
      category: "design-system",
      confidence: 0.8,
      rationale: "Versatile, accessible motion curves suitable for multi-purpose applications.",
      isRegistered: true,
    });
  }

  // 3. Palette recommendation from 33 built-in palettes
  if (context.visualDirection.colorMode === "dark") {
    recommendations.push({
      styleId: "palette-midnight-voltage",
      capabilityId: "palette-midnight-voltage",
      name: "Midnight Voltage",
      category: "palette",
      confidence: 0.86,
      rationale: "High-contrast dark mode with electric accents.",
      isRegistered: true,
    });
  } else if (context.personality === "elegant") {
    recommendations.push({
      styleId: "palette-cosmic-mocha",
      capabilityId: "palette-cosmic-mocha",
      name: "Cosmic Mocha",
      category: "palette",
      confidence: 0.89,
      rationale: "Sophisticated neutral tones with warm, refined contrast.",
      isRegistered: true,
    });
  }

  return recommendations;
}

/**
 * Derives comprehensive motion recommendations from design context.
 */
function deriveMotionRecommendations(context: DesignContext): RecommendedMotion {
  let intensity: MotionIntensity = context.motion.intensity;
  let motionDNA = context.motion.motionDNA ?? "dna-calm";
  let designSystem = "ds-default";
  const presets: string[] = [];
  const backgrounds: string[] = [];
  const effects: string[] = [];

  if (context.category === "dashboard") {
    intensity = "subtle";
    motionDNA = "dna-snappy";
    designSystem = "ds-default";
    presets.push("preset-fade-in", "preset-card-deck-stagger");
    effects.push("effect-count-up", "effect-stagger");
  } else if (context.category === "portfolio" || context.category === "creative-agency") {
    intensity = "expressive";
    motionDNA = "dna-cinematic";
    designSystem = "ds-expressive";
    presets.push("preset-hero-sequence", "preset-scroll-reveal-rise");
    backgrounds.push("bg-fluid", "bg-aurora");
    effects.push("pointer-magnetic", "pointer-tilt", "effect-reveal");
  } else if (context.personality === "minimal") {
    intensity = "subtle";
    motionDNA = "dna-minimal";
    designSystem = "ds-minimal";
    presets.push("preset-fade-in");
    effects.push("effect-reveal");
  } else if (context.personality === "futuristic") {
    intensity = "moderate";
    motionDNA = "dna-snappy";
    presets.push("preset-fade-in", "preset-scroll-scale-in");
    backgrounds.push("bg-cosmic", "bg-fluid");
    effects.push("pointer-magnetic", "effect-glow");
  } else if (context.personality === "playful") {
    intensity = "expressive";
    motionDNA = "dna-playful";
    designSystem = "ds-expressive";
    presets.push("preset-card-deck-stagger");
    effects.push("pointer-magnetic", "effect-ripple");
  } else {
    presets.push("preset-fade-in");
    effects.push("effect-reveal");
  }

  if (context.interactions.magneticElements && !effects.includes("pointer-magnetic")) {
    effects.push("pointer-magnetic");
  }
  if (context.interactions.scrollDriven && !effects.includes("scroll-animate")) {
    effects.push("scroll-animate");
  }

  let defaultEasing = "ease-out";
  let defaultDuration = 500;

  if (motionDNA === "dna-snappy") {
    defaultEasing = "cubic-bezier(0.2, 0.8, 0.2, 1)";
    defaultDuration = 300;
  } else if (motionDNA === "dna-playful") {
    defaultEasing = "spring(1, 100, 10, 0)";
    defaultDuration = 600;
  } else if (motionDNA === "dna-cinematic") {
    defaultEasing = "cubic-bezier(0.16, 1, 0.3, 1)";
    defaultDuration = 800;
  }

  return {
    intensity,
    motionDNA,
    designSystem,
    recommendedPresets: presets,
    recommendedBackgrounds: backgrounds,
    recommendedEffects: effects,
    defaultEasing,
    defaultDuration,
    respectReducedMotion: context.accessibility.respectReducedMotion,
  };
}

/**
 * Interprets a natural language design brief or partial design context into a structured DesignInterpretationResult.
 */
export function interpretDesignRequirements(
  input: string | Partial<DesignContext>,
  options: DesignInterpretationOptions = {},
): DesignInterpretationResult {
  const warnings: string[] = [];
  const missingInformation: string[] = [];

  // Case 1: Structured input
  if (typeof input === "object" && input !== null) {
    const normalized = normalizeDesignContext(input);
    const validation = validateDesignContext(normalized);
    const conflicts = identifyDesignConflicts(normalized);
    const registry = getEffectiveDesignRegistry(options);
    const recommendedStyles = resolveVisualStyles(normalized, registry);
    const motionRecommendations = deriveMotionRecommendations(normalized);

    const confidence = validation.valid ? 0.95 : 0.6;

    return {
      success: validation.valid,
      confidence,
      normalizedContext: normalized,
      detectedCharacteristics: {
        keywords: [],
        detectedCategory: normalized.category,
        detectedPersonality: normalized.personality,
        detectedColorMode: normalized.visualDirection.colorMode,
        detectedLayout: normalized.layout,
        explicitComponents: Object.keys(normalized.components).filter(
          (k) => (normalized.components as Record<string, unknown>)[k] === true,
        ),
        explicitInteractions: Object.keys(normalized.interactions).filter(
          (k) => (normalized.interactions as Record<string, unknown>)[k] !== undefined,
        ),
        accessibilityFlags: normalized.accessibility.respectReducedMotion
          ? ["respectReducedMotion"]
          : [],
      },
      recommendedVisualStyles: recommendedStyles,
      motionRecommendations,
      conflicts,
      warnings,
      missingInformation,
      validation: {
        valid: validation.valid,
        errors: validation.errors,
      },
    };
  }

  // Case 2: Natural Language input
  const prompt = String(input ?? "").trim();
  if (!prompt) {
    const fallback = normalizeDesignContext({});
    return {
      success: false,
      confidence: 0,
      normalizedContext: fallback,
      detectedCharacteristics: {
        keywords: [],
        explicitComponents: [],
        explicitInteractions: [],
        accessibilityFlags: [],
      },
      recommendedVisualStyles: [],
      motionRecommendations: deriveMotionRecommendations(fallback),
      conflicts: [],
      warnings: ["Empty design prompt provided."],
      missingInformation: ["category", "personality", "visualDirection", "layout"],
      validation: {
        valid: false,
        errors: ["Empty design prompt"],
      },
    };
  }

  const keywords = extractKeywords(prompt);

  // Extract Category
  const detectedCategory = matchFirst(prompt, CATEGORY_PATTERNS) ?? options.defaultCategory;
  if (!detectedCategory) {
    missingInformation.push("category");
  }

  // Extract Personality
  const detectedPersonality = matchFirst(prompt, PERSONALITY_PATTERNS) ?? options.defaultPersonality;
  if (!detectedPersonality) {
    missingInformation.push("personality");
  }

  // Extract Color Mode
  const detectedColorMode = matchFirst(prompt, COLOR_MODE_PATTERNS) ?? options.defaultColorMode;

  // Extract Layout
  const detectedLayout = matchFirst(prompt, LAYOUT_PATTERNS);
  if (!detectedLayout) {
    missingInformation.push("layout");
  }

  // Extract Industry
  const detectedIndustry = matchFirst(prompt, INDUSTRY_PATTERNS) ?? "general";

  // Extract Components
  const components: ComponentRequirements = {
    hero: /\bhero(?:\s+section)?\b/i.test(prompt),
    cards: /\bcards?\b/i.test(prompt),
    buttons: /\bbuttons?\b/i.test(prompt),
    tables: /\btables?\b/i.test(prompt),
    charts: /\bcharts?\b|\bgraphs?\b/i.test(prompt),
    navigation: /\bnav(?:bar)?\b|\bnavigation\b/i.test(prompt),
    modals: /\bmodals?\b|\bdialogs?\b/i.test(prompt),
    forms: /\bforms?\b|\binputs?\b/i.test(prompt),
    carousel: /\bcarousel\b|\bslider\b/i.test(prompt),
    pricing: /\bpricing\b|\btiers?\b/i.test(prompt),
  };

  const explicitComponents = Object.entries(components)
    .filter(([_, v]) => v === true)
    .map(([k]) => k);

  // Extract Interactions
  const magnetic = /\bmagnetic\b/i.test(prompt);
  const scrollDriven = /\bscroll[\s-]?driven\b|\bon\s+scroll\b/i.test(prompt);
  const pointerTracking = /\bcursor\b|\bpointer\s+tracking\b/i.test(prompt);
  const subtleHover = /\bsubtle\s+hover\b/i.test(prompt);

  const interactions: InteractionRequirements = {
    magneticElements: magnetic,
    scrollDriven,
    pointerTracking,
    hoverIntensity: subtleHover ? "subtle" : "prominent",
    microInteractions: true,
  };

  const explicitInteractions: string[] = [];
  if (magnetic) explicitInteractions.push("magneticElements");
  if (scrollDriven) explicitInteractions.push("scrollDriven");
  if (pointerTracking) explicitInteractions.push("pointerTracking");

  // Extract Accessibility
  const reducedMotion =
    /\breduced[\s-]?motion\b/i.test(prompt) ||
    /\bprefers[\s-]?reduced[\s-]?motion\b/i.test(prompt) ||
    /\baccessible\b/i.test(prompt) ||
    /\ba11y\b/i.test(prompt);

  const highContrast = /\bhigh[\s-]contrast\b/i.test(prompt);

  const accessibilityFlags: string[] = [];
  if (reducedMotion) accessibilityFlags.push("respectReducedMotion");
  if (highContrast) accessibilityFlags.push("highContrastMode");

  // Extract Vibrancy & Density
  let vibrancy: VisualVibrancy = "balanced";
  if (/\bneon\b/i.test(prompt)) vibrancy = "neon";
  else if (/\bpastel\b/i.test(prompt)) vibrancy = "pastel";
  else if (/\bmonochrome\b|\bblack\s+and\s+white\b/i.test(prompt)) vibrancy = "monochrome";
  else if (/\bmuted\b/i.test(prompt)) vibrancy = "muted";
  else if (/\bvibrant\b|\bcolorful\b/i.test(prompt)) vibrancy = "vibrant";

  let density: LayoutDensity = "comfortable";
  if (/\bcompact\b|\bdata[\s-]dense\b|\bhigh\s+density\b/i.test(prompt)) density = "compact";
  else if (/\bspacious\b|\bairey\b|\bgenerous\s+spacing\b/i.test(prompt)) density = "spacious";

  // Extract Motion Intensity
  let motionIntensity: MotionIntensity = "moderate";
  if (/\bno\s+motion\b|\bstatic\b/i.test(prompt)) motionIntensity = "none";
  else if (/\bsubtle\s+motion\b|\bminimal\s+motion\b|\bunderstated\b/i.test(prompt))
    motionIntensity = "subtle";
  else if (/\bexpressive\s+motion\b|\bbold\s+motion\b|\bhigh\s+energy\b/i.test(prompt))
    motionIntensity = "expressive";

  let derivedDNA = "dna-calm";
  if (detectedPersonality === "minimal") derivedDNA = "dna-minimal";
  else if (detectedPersonality === "futuristic" || detectedPersonality === "tech") derivedDNA = "dna-snappy";
  else if (detectedPersonality === "playful") derivedDNA = "dna-playful";
  else if (detectedPersonality === "elegant") derivedDNA = "dna-cinematic";
  else if (detectedCategory === "dashboard") derivedDNA = "dna-snappy";

  // Build Normalized Context
  const normalizedContext: DesignContext = normalizeDesignContext({
    category: detectedCategory ?? "general",
    industry: detectedIndustry,
    personality: detectedPersonality ?? "balanced",
    layout: detectedLayout ?? "standard",
    visualDirection: {
      colorMode: detectedColorMode ?? "system",
      vibrancy,
      density,
      contrast: highContrast ? "high" : "standard",
    },
    components,
    interactions,
    accessibility: {
      respectReducedMotion: true,
      highContrastMode: highContrast,
    },
    motion: {
      intensity: motionIntensity,
      motionDNA: derivedDNA,
      reducedMotionBehavior: "skips-to-endpoint",
    },
    rawPrompt: prompt,
  });

  const conflicts = identifyDesignConflicts(normalizedContext);
  const registry = getEffectiveDesignRegistry(options);
  const recommendedVisualStyles = resolveVisualStyles(normalizedContext, registry);
  const motionRecommendations = deriveMotionRecommendations(normalizedContext);

  // Confidence Calculation
  let confidence = 0.5;
  if (detectedCategory) confidence += 0.15;
  if (detectedPersonality) confidence += 0.15;
  if (detectedColorMode) confidence += 0.1;
  if (detectedLayout) confidence += 0.05;
  if (explicitComponents.length > 0) confidence += 0.05;
  confidence = Math.min(0.98, Math.max(0.2, Math.round(confidence * 100) / 100));

  const validation = validateDesignContext(normalizedContext);

  return {
    success: confidence >= 0.4,
    confidence,
    normalizedContext,
    detectedCharacteristics: {
      keywords,
      detectedCategory,
      detectedPersonality,
      detectedColorMode,
      detectedLayout,
      explicitComponents,
      explicitInteractions,
      accessibilityFlags,
    },
    recommendedVisualStyles,
    motionRecommendations,
    conflicts,
    warnings,
    missingInformation,
    validation: {
      valid: validation.valid,
      errors: validation.errors,
    },
  };
}
