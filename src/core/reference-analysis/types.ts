/**
 * AF Motion Reference-to-React Implementation Contracts
 *
 * Framework-independent types for analyzing structured visual reference data,
 * classifying visual styles and palettes, generating React implementation plans,
 * and producing deterministic code generation specifications.
 */

export type VisualStyleName =
  | "minimal"
  | "glassmorphism"
  | "brutalist"
  | "brutalism"
  | "neumorphism"
  | "claymorphism"
  | "cyberpunk"
  | "editorial"
  | "swiss"
  | "bauhaus"
  | "aurora"
  | "steampunk"
  | "skeuomorphism"
  | "vaporwave"
  | "psychedelic"
  | "liquid"
  | "neon"
  | "retro-computing"
  | string;

export type MotionDNAPersonality =
  | "precise"
  | "playful"
  | "elegant"
  | "energetic"
  | "editorial-flow"
  | "snappy"
  | "calm"
  | "cinematic"
  | "minimal";

export type ReferenceTargetPlatform = "web" | "mobile" | "responsive";

export interface ExtractedColorRole {
  role: "background" | "primary" | "secondary" | "accent" | "surface" | "text" | "muted";
  value: string;
}

export interface ExtractedTypography {
  headingFont?: string;
  bodyFont?: string;
  codeFont?: string;
  scale?: "compact" | "normal" | "editorial" | "dramatic";
  weights?: number[];
}

export interface ExtractedSurface {
  name: string;
  kind: "glass" | "flat" | "neumorphic" | "metallic" | "clay" | "brutalist" | "glow";
  blur?: number;
  opacity?: number;
  borderWidth?: string | number;
  borderColor?: string;
  boxShadow?: string;
}

export interface ExtractedLayout {
  type: "single-column" | "split" | "grid" | "dashboard" | "sticky-story" | "hero-showcase";
  columns?: number;
  alignment?: "left" | "center" | "right";
  spacingDensity?: "compact" | "normal" | "spacious";
  hasStickyElements?: boolean;
}

export interface ExtractedMotionCharacteristics {
  feel?: "snappy" | "bouncy" | "smooth" | "dramatic" | "minimal";
  speed?: "fast" | "normal" | "slow";
  hasParallax?: boolean;
  hasStagger?: boolean;
  hasSpringFeedback?: boolean;
  hasPageTransitions?: boolean;
}

export interface ExtractedGraphics {
  hasBackgroundEffect?: boolean;
  effectType?: "aurora" | "particles" | "mesh-gradient" | "waves" | "noise" | "cosmic";
  isInteractive?: boolean;
}

export interface Extracted3D {
  has3DScene?: boolean;
  geometryType?: "torus" | "sphere" | "box" | "custom-model";
  materialType?: "glass" | "metallic" | "pbr" | "wireframe";
  interactiveControls?: boolean;
}

export interface ExtractedVisualProperties {
  dominantColors?: string[];
  colorRoles?: ExtractedColorRole[];
  paletteName?: string;
  typography?: ExtractedTypography;
  surfaces?: ExtractedSurface[];
  shadows?: string[];
  borderRadius?: string | number;
  layout?: ExtractedLayout;
  motion?: ExtractedMotionCharacteristics;
  graphics?: ExtractedGraphics;
  scene3D?: Extracted3D;
}

export interface ExtractedComponent {
  id: string;
  name: string;
  role: "header" | "hero" | "card" | "button" | "input" | "grid" | "footer" | "navigation" | "modal" | "graphic-canvas" | "viewport-3d";
  description?: string;
  properties?: Record<string, unknown>;
  children?: ExtractedComponent[];
}

export interface ReferenceMetadata {
  sourceType?: "json-tokens" | "structured-analysis" | "user-prompt" | "design-system";
  author?: string;
  timestamp?: number;
  fidelity?: "wireframe" | "concept" | "high-fidelity";
}

export interface VisualReferenceInput {
  name: string;
  description?: string;
  extractedProperties?: ExtractedVisualProperties;
  components?: ExtractedComponent[];
  targetPlatform?: ReferenceTargetPlatform;
  metadata?: ReferenceMetadata;
}

export interface UncertaintyArea {
  property: string;
  reason: string;
  assumedDefault: unknown;
  confidence: number;
}

export interface ConfidenceReport {
  overallScore: number; // 0 to 1
  styleConfidence: number;
  paletteConfidence: number;
  motionConfidence: number;
  uncertaintyAreas: UncertaintyArea[];
}

export interface StyleClassificationResult {
  style: VisualStyleName;
  confidence: number;
  reasoning: string;
  alternatives: VisualStyleName[];
}

export interface PaletteMappingResult {
  matchedPaletteId: string;
  matchedPaletteName: string;
  colors: Record<string, string>;
  confidence: number;
}

export interface MotionDNAMappingResult {
  matchedDNA: MotionDNAPersonality;
  timingMultiplier: number;
  confidence: number;
  reasoning: string;
}

export interface DesignTokenMapping {
  colors: Record<string, string>;
  radii: Record<string, string>;
  shadows: Record<string, string>;
  spacing: Record<string, string>;
  fonts: Record<string, string>;
}

export interface VisualDesignInterpretation {
  referenceName: string;
  styleClassification: StyleClassificationResult;
  paletteMapping: PaletteMappingResult;
  motionDNA: MotionDNAMappingResult;
  designTokens: DesignTokenMapping;
  surfaces: ExtractedSurface[];
  layout: ExtractedLayout;
  graphics?: ExtractedGraphics;
  scene3D?: Extracted3D;
  capabilitiesRequired: string[];
  confidenceReport: ConfidenceReport;
}

export interface PlannedComponentNode {
  id: string;
  name: string;
  category: "layout" | "content" | "interactive" | "canvas" | "3d";
  afMotionBinding?: {
    component?: string;
    hook?: string;
    subpath: "af-motion" | "af-motion/react" | "af-motion/catalogue" | "af-motion/presets";
    config?: Record<string, unknown>;
  };
  props: Record<string, unknown>;
  children?: PlannedComponentNode[];
}

export interface PlannedMotionItem {
  id: string;
  targetId: string;
  trigger: "mount" | "scroll" | "hover" | "press" | "continuous";
  capability: string;
  family: string;
  durationMs: number;
  easing: string;
  delayMs?: number;
  reducedMotionFallback: "instant" | "opacity" | "disabled";
}

export interface ResponsiveStrategy {
  mobileFirst: boolean;
  breakpoints: Record<string, string>;
  layoutShifts: Record<string, string>;
}

export interface PlannedGraphicsAnd3D {
  backgroundCanvas?: {
    effect: "aurora" | "particleField" | "cosmic" | "waves";
    subpath: "af-motion";
    interactive: boolean;
  };
  viewport3D?: {
    geometry: string;
    material: string;
    lighting: string;
    controls: boolean;
  };
}

export interface AssetRequirement {
  id: string;
  type: "image" | "font" | "icon" | "3d-model";
  description: string;
  fallback: string;
}

export interface AccessibilityRequirement {
  rule: string;
  strategy: string;
  verified: boolean;
}

export interface ReactImplementationPlan {
  id: string;
  title: string;
  componentHierarchy: PlannedComponentNode[];
  responsiveStrategy: ResponsiveStrategy;
  visualStyleConfig: {
    style: VisualStyleName;
    palette: string;
    motionDNA: MotionDNAPersonality;
  };
  motionPlans: PlannedMotionItem[];
  graphicsAnd3D: PlannedGraphicsAnd3D;
  assetRequirements: AssetRequirement[];
  accessibilityRequirements: AccessibilityRequirement[];
  validationChecklist: string[];
}

export interface ReactComponentSpec {
  name: string;
  fileHint: string;
  isClientComponent: boolean;
  responsibilities: string[];
  props: { name: string; type: string; optional?: boolean }[];
  state: { name: string; type: string; initialValue: string }[];
  afMotionImports: { name: string; subpath: string }[];
  jsxBlueprint: string;
}

export interface ReactCodeSpecification {
  planId: string;
  title: string;
  components: ReactComponentSpec[];
  requiredImports: { subpath: string; namedImports: string[] }[];
  globalCSSVariables: Record<string, string>;
  accessibilityNotes: string[];
  codeTemplate: string;
}
