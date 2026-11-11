/**
 * AF Motion Studio — Motion Physics Studio Type Definitions
 *
 * Types for the visual interactive physics playground, advanced spring editor,
 * inertia & force editor, collision & constraint builder, multi-behavior composition,
 * preset library, playback timeline, diagnostics, and code export.
 */

import type {
  CollisionBodyConfig,
  CollisionConstraintConfig,
  CollisionShape,
} from "../../src/core/physics/collision-types.js";
import type {
  SpringPresetName,
  SpringDampingBehavior,
} from "../../src/core/physics/spring-types.js";
import type { InertiaPresetName } from "../../src/core/physics/inertia-types.js";
import type { PhysicsCompositionConfig } from "../../src/core/physics/composition-types.js";

export type MotionPhysicsStudioViewMode =
  | "playground"
  | "spring"
  | "inertia"
  | "collision-constraints"
  | "composition"
  | "presets"
  | "diagnostics"
  | "export";

export type FixedTimestepOption = 30 | 60 | 120;

export interface SpringEditorConfig {
  mass: number;
  stiffness: number;
  damping: number;
  initialVelocity: number;
  targetPosition: number;
  restDelta: number;
  restSpeed: number;
  timeScale: number;
}

export interface InertiaEditorConfig {
  mass: number;
  friction: number;
  linearFriction: number;
  drag: number;
  gravity: number;
  initialVelocity: number;
  minVelocity: number;
  timeScale: number;
}

export interface PhysicsPlaygroundBody {
  id: string;
  name: string;
  type: "dynamic" | "static" | "kinematic";
  shape: CollisionShape;
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  mass: number;
  restitution: number;
  friction: number;
  linearDamping: number;
  color: string;
  pinned?: boolean;
}

export interface PhysicsPlaygroundConstraint {
  id: string;
  name: string;
  type: "distance" | "spring" | "fixed" | "axis" | "min-max-distance" | "boundary";
  bodyAId: string;
  bodyBId?: string;
  enabled: boolean;
  length?: number;
  stiffness?: number;
  damping?: number;
  axis?: "x" | "y";
  minDistance?: number;
  maxDistance?: number;
  anchorA?: { x: number; y: number };
  anchorB?: { x: number; y: number };
}

export interface PhysicsVisualOptions {
  showVelocityVectors: boolean;
  showForceVectors: boolean;
  showCollisionNormals: boolean;
  showContactPoints: boolean;
  showConstraintLines: boolean;
  showCenterOfMass: boolean;
  showBounds: boolean;
}

export interface MotionPhysicsStudioState {
  viewMode: MotionPhysicsStudioViewMode;
  selectedBodyId: string | null;
  selectedConstraintId: string | null;

  // Playback & Simulation Timing
  isPlaying: boolean;
  playbackSpeed: number;
  fixedTimestep: FixedTimestepOption;
  elapsedTimeMs: number;
  stepCount: number;

  // Visual Overlays
  visualOptions: PhysicsVisualOptions;

  // Sub-Editor Configurations
  springConfig: SpringEditorConfig;
  selectedSpringPreset: SpringPresetName | "custom";

  inertiaConfig: InertiaEditorConfig;
  selectedInertiaPreset: InertiaPresetName | "custom";

  // Playground World
  gravity: { x: number; y: number };
  bounds: { width: number; height: number };
  bodies: PhysicsPlaygroundBody[];
  constraints: PhysicsPlaygroundConstraint[];

  // Composition Mode
  compositionConfig: PhysicsCompositionConfig;
  selectedRecipeId: string | null;
}

export interface PhysicsDiagnosticsData {
  fps: number;
  stepDurationMs: number;
  activeBodyCount: number;
  collisionCount: number;
  activeConstraintCount: number;
  totalKineticEnergy: number;
  solverIterations: number;
  isSettled: boolean;
  performanceHealthStatus: "optimal" | "acceptable" | "degraded" | "critical";
  performanceHealthScore: number;
}

export interface SpringGraphPoint {
  time: number;
  position: number;
  velocity: number;
}
