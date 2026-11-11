/**
 * AF Motion Studio — Advanced Motion & Morphing Studio Type Definitions (Prompt 137)
 *
 * Types for Automatic Layout Animations, SVG Path Morphing, Motion Paths,
 * Kinetic Typography, Shared Elements, View Transitions, Unified Composition,
 * Presets, Timeline Playback, Diagnostics, and Multi-Format Code Export.
 */

export type AdvancedMotionViewMode =
  | "layout"
  | "svg-morph"
  | "motion-path"
  | "typography"
  | "shared-element"
  | "view-transition"
  | "composition"
  | "presets";

export interface LayoutItem {
  id: string;
  label: string;
  width: number;
  height: number;
  order: number;
  color: string;
}

export interface LayoutAnimationConfig {
  staggerMs: number;
  staggerDirection: "forward" | "reverse" | "center" | "random";
  duration: number;
  easing: string;
  layoutItems: LayoutItem[];
  layoutMode: "grid" | "list" | "masonry";
  flipData?: {
    dx: number;
    dy: number;
    dw: number;
    dh: number;
    transform: string;
  };
}

export interface SvgMorphConfig {
  sourcePath: string;
  targetPath: string;
  progress: number;
  duration: number;
  easing: string;
  loop: boolean;
  normalizeWinding: boolean;
  isValidSource: boolean;
  isValidTarget: boolean;
  validationError?: string | null;
}

export interface MotionPathPoint {
  x: number;
  y: number;
  cx1?: number;
  cy1?: number;
  cx2?: number;
  cy2?: number;
}

export interface MotionPathConfig {
  pathType: "svg" | "bezier" | "waypoints" | "catmull-rom";
  pathString: string;
  points: MotionPathPoint[];
  progress: number;
  duration: number;
  autoRotate: boolean;
  loop: boolean;
  reverse: boolean;
  traversalMode: "constant-distance" | "progress";
  pathLength: number;
  currentCoord: { x: number; y: number };
  tangent: { x: number; y: number };
  normal: { x: number; y: number };
  curvature: number;
}

export interface KineticTypographyConfig {
  text: string;
  segmentation: "character" | "word" | "line";
  preset: "fade" | "slide" | "scale" | "blur" | "rotate" | "wave" | "typewriter" | "scramble";
  duration: number;
  delay: number;
  staggerMs: number;
  easing: string;
  direction: "left-to-right" | "right-to-left" | "top-to-bottom";
  followMotionPath: boolean;
}

export interface SharedElementState {
  activeView: "list" | "detail";
  sharedId: string;
  sourceBounds: { x: number; y: number; width: number; height: number };
  targetBounds: { x: number; y: number; width: number; height: number };
  borderRadius: number;
  crossfade: boolean;
  duration: number;
}

export interface ViewTransitionConfig {
  isNativeSupported: boolean;
  transitionPreset: "crossfade" | "slide-left" | "slide-right" | "zoom";
  duration: number;
  currentView: "view-a" | "view-b";
  isSimulated: boolean;
  lastEvent: string;
}

export interface CompositionTrackStep {
  id: string;
  name: string;
  system: "layout" | "svg-morph" | "motion-path" | "typography" | "shared-element";
  startOffset: string; // e.g. "0", "+=200", "<", ">"
  duration: number;
  label?: string;
  status: "idle" | "running" | "completed";
}

export interface UnifiedCompositionConfig {
  id: string;
  name: string;
  duration: number;
  progress: number;
  isPlaying: boolean;
  isReversed: boolean;
  speed: number;
  steps: CompositionTrackStep[];
}

export interface AdvancedMotionPreset {
  id: string;
  name: string;
  category: "layout" | "svg-morph" | "motion-path" | "typography" | "transitions" | "composition";
  description: string;
  apply: (state: AdvancedMotionStudioState) => AdvancedMotionStudioState;
}

export interface AdvancedMotionDiagnosticsData {
  fps: number;
  activeAnimations: number;
  activeTracks: number;
  pathLength: number;
  morphProgress: number;
  isLayoutActive: boolean;
  viewTransitionSupported: boolean;
  healthScore: number;
  healthStatus: string;
}

export interface AdvancedMotionStudioState {
  viewMode: AdvancedMotionViewMode;
  layout: LayoutAnimationConfig;
  svgMorph: SvgMorphConfig;
  motionPath: MotionPathConfig;
  typography: KineticTypographyConfig;
  sharedElement: SharedElementState;
  viewTransition: ViewTransitionConfig;
  composition: UnifiedCompositionConfig;
  showExportModal: boolean;
}
