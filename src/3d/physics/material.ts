/**
 * AF Motion — 3D Physics Materials & Combination Rules
 *
 * Reusable surface physical properties governing friction, restitution,
 * damping, and density across collisions. Distinct from visual materials.
 */

import type { PhysicsMaterial, MaterialCombineRule } from "./types.js";
import { clamp } from "./math.js";

/**
 * Creates a validated PhysicsMaterial instance with sensible defaults.
 */
export function createPhysicsMaterial(
  options: Partial<PhysicsMaterial> = {}
): PhysicsMaterial {
  const friction = clamp(options.friction ?? 0.5, 0, 10);
  const restitution = clamp(options.restitution ?? 0.2, 0, 1);
  const density = options.density !== undefined ? Math.max(0.001, options.density) : 1000;
  const linearDamping = options.linearDamping !== undefined ? Math.max(0, options.linearDamping) : 0.01;
  const angularDamping = options.angularDamping !== undefined ? Math.max(0, options.angularDamping) : 0.05;

  return {
    id: options.id || `mat_${Math.random().toString(36).substring(2, 9)}`,
    name: options.name ?? "custom",
    friction,
    restitution,
    density,
    linearDamping,
    angularDamping,
    frictionCombineRule: options.frictionCombineRule ?? "multiply",
    restitutionCombineRule: options.restitutionCombineRule ?? "average",
  };
}

/**
 * Combines two surface friction values according to material combination rules.
 */
export function combineFriction(
  matA: PhysicsMaterial,
  matB: PhysicsMaterial
): number {
  // Higher precedence to "multiply" or "min"
  const rule: MaterialCombineRule =
    matA.frictionCombineRule === "multiply" || matB.frictionCombineRule === "multiply"
      ? "multiply"
      : matA.frictionCombineRule ?? matB.frictionCombineRule ?? "multiply";

  switch (rule) {
    case "multiply":
      return Math.sqrt(matA.friction * matB.friction);
    case "min":
      return Math.min(matA.friction, matB.friction);
    case "max":
      return Math.max(matA.friction, matB.friction);
    case "average":
    default:
      return 0.5 * (matA.friction + matB.friction);
  }
}

/**
 * Combines two restitution coefficients according to material combination rules.
 */
export function combineRestitution(
  matA: PhysicsMaterial,
  matB: PhysicsMaterial
): number {
  const rule: MaterialCombineRule =
    matA.restitutionCombineRule === "max" || matB.restitutionCombineRule === "max"
      ? "max"
      : matA.restitutionCombineRule ?? matB.restitutionCombineRule ?? "average";

  switch (rule) {
    case "max":
      return Math.max(matA.restitution, matB.restitution);
    case "min":
      return Math.min(matA.restitution, matB.restitution);
    case "multiply":
      return matA.restitution * matB.restitution;
    case "average":
    default:
      return 0.5 * (matA.restitution + matB.restitution);
  }
}

/**
 * Curated standard physics material presets.
 */
export const MATERIAL_PRESETS: Record<string, Readonly<PhysicsMaterial>> = {
  default: Object.freeze(
    createPhysicsMaterial({
      id: "mat_preset_default",
      name: "default",
      friction: 0.5,
      restitution: 0.2,
      density: 1000,
    })
  ),
  metal: Object.freeze(
    createPhysicsMaterial({
      id: "mat_preset_metal",
      name: "metal",
      friction: 0.4,
      restitution: 0.15,
      density: 7800,
      linearDamping: 0.005,
      angularDamping: 0.01,
    })
  ),
  wood: Object.freeze(
    createPhysicsMaterial({
      id: "mat_preset_wood",
      name: "wood",
      friction: 0.65,
      restitution: 0.25,
      density: 700,
      linearDamping: 0.02,
      angularDamping: 0.05,
    })
  ),
  rubber: Object.freeze(
    createPhysicsMaterial({
      id: "mat_preset_rubber",
      name: "rubber",
      friction: 0.9,
      restitution: 0.8,
      density: 1100,
      linearDamping: 0.05,
      angularDamping: 0.1,
    })
  ),
  ice: Object.freeze(
    createPhysicsMaterial({
      id: "mat_preset_ice",
      name: "ice",
      friction: 0.03,
      restitution: 0.05,
      density: 917,
      linearDamping: 0.001,
      angularDamping: 0.002,
    })
  ),
  bouncy: Object.freeze(
    createPhysicsMaterial({
      id: "mat_preset_bouncy",
      name: "bouncy",
      friction: 0.5,
      restitution: 0.95,
      density: 1000,
      linearDamping: 0.001,
    })
  ),
  glass: Object.freeze(
    createPhysicsMaterial({
      id: "mat_preset_glass",
      name: "glass",
      friction: 0.25,
      restitution: 0.35,
      density: 2500,
      linearDamping: 0.01,
      angularDamping: 0.02,
    })
  ),
  fabric: Object.freeze(
    createPhysicsMaterial({
      id: "mat_preset_fabric",
      name: "fabric",
      friction: 0.85,
      restitution: 0.05,
      density: 300,
      linearDamping: 0.1,
      angularDamping: 0.2,
    })
  ),
  stone: Object.freeze(
    createPhysicsMaterial({
      id: "mat_preset_stone",
      name: "stone",
      friction: 0.75,
      restitution: 0.1,
      density: 2600,
      linearDamping: 0.01,
      angularDamping: 0.02,
    })
  ),
  foam: Object.freeze(
    createPhysicsMaterial({
      id: "mat_preset_foam",
      name: "foam",
      friction: 0.8,
      restitution: 0.15,
      density: 80,
      linearDamping: 0.15,
      angularDamping: 0.25,
    })
  ),
};

/**
 * Retrieves a material preset by key name with fallback to default.
 */
export function getMaterialPreset(presetName: string): PhysicsMaterial {
  const found = MATERIAL_PRESETS[presetName];
  if (found) return { ...found };
  return { ...MATERIAL_PRESETS.default };
}
