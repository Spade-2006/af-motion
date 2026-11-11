/**
 * AF Motion — Physics Composition Recipes
 *
 * Deterministic configuration factories for standard physics-driven motion recipes:
 * Bouncy Entrance, Heavy Object Drop, Floating Object, Inertial Drag, Spring Return,
 * Constrained Bouncing, Gravity-Driven Interaction, and Elastic Multi-Body Motion.
 */

import type { PhysicsCompositionConfig, PhysicsCompositionRecipe } from "./composition-types.js";
import {
  createSpringBehavior,
  createInertialBehavior,
  createGravityBehavior,
  createBoundedBehavior,
  createSpringInertiaBehavior,
} from "./composition-behaviors.js";
import { createVector } from "./math.js";

/**
 * 1. Bouncy Entrance: Body drops from above and bounces to rest on the ground.
 */
export function bouncyEntranceRecipe(
  overrides?: Partial<PhysicsCompositionConfig>
): PhysicsCompositionConfig {
  return {
    id: "recipe-bouncy-entrance",
    timestep: 1 / 60,
    gravity: createVector(0, 1200),
    bounds: {
      min: createVector(-Infinity, -Infinity),
      max: createVector(Infinity, 400),
    },
    bodies: [
      {
        id: "actor",
        type: "dynamic",
        shape: { type: "circle", radius: 24 },
        position: createVector(0, -100),
        velocity: createVector(0, 50),
        mass: 1.0,
        restitution: 0.7,
        linearDamping: 0.05,
      },
    ],
    ...overrides,
  };
}

/**
 * 2. Heavy Object Drop: High-mass body dropped with rapid inelastic settling.
 */
export function heavyObjectDropRecipe(
  overrides?: Partial<PhysicsCompositionConfig>
): PhysicsCompositionConfig {
  return {
    id: "recipe-heavy-drop",
    timestep: 1 / 60,
    gravity: createVector(0, 2000),
    bounds: {
      min: createVector(-Infinity, -Infinity),
      max: createVector(Infinity, 300),
    },
    bodies: [
      {
        id: "heavy_actor",
        type: "dynamic",
        shape: { type: "rectangle", width: 60, height: 60 },
        position: createVector(0, -50),
        velocity: createVector(0, 0),
        mass: 25.0,
        restitution: 0.15,
        friction: 0.8,
        linearDamping: 0.2,
      },
    ],
    ...overrides,
  };
}

/**
 * 3. Floating Object: Buoyant harmonic spring oscillation simulating fluid levitation.
 */
export function floatingObjectRecipe(
  overrides?: Partial<PhysicsCompositionConfig>
): PhysicsCompositionConfig {
  return {
    id: "recipe-floating-object",
    timestep: 1 / 60,
    gravity: createVector(0, 0),
    bodies: [
      {
        id: "floating_actor",
        type: "dynamic",
        shape: { type: "circle", radius: 20 },
        position: createVector(0, 150),
        velocity: createVector(0, -30),
        mass: 1.5,
        linearDamping: 0.02,
      },
    ],
    behaviors: [
      createSpringBehavior({
        id: "buoyancy",
        target: createVector(0, 180),
        stiffness: 40,
        damping: 4,
        targetBodyIds: ["floating_actor"],
      }),
    ],
    ...overrides,
  };
}

/**
 * 4. Inertial Drag: High initial velocity gliding across a surface with viscous decay.
 */
export function inertialDragRecipe(
  overrides?: Partial<PhysicsCompositionConfig>
): PhysicsCompositionConfig {
  return {
    id: "recipe-inertial-drag",
    timestep: 1 / 60,
    gravity: createVector(0, 0),
    bodies: [
      {
        id: "glider",
        type: "dynamic",
        shape: { type: "circle", radius: 16 },
        position: createVector(0, 0),
        velocity: createVector(500, 0),
        mass: 1.0,
      },
    ],
    behaviors: [
      createInertialBehavior({
        id: "surface_friction",
        friction: 3.5,
        drag: 0.002,
        minVelocity: 0.1,
        targetBodyIds: ["glider"],
      }),
    ],
    ...overrides,
  };
}

/**
 * 5. Spring Return: Snaps displaced body back toward home anchor with harmonic overshoot.
 */
export function springReturnRecipe(
  overrides?: Partial<PhysicsCompositionConfig>
): PhysicsCompositionConfig {
  return {
    id: "recipe-spring-return",
    timestep: 1 / 60,
    gravity: createVector(0, 0),
    bodies: [
      {
        id: "retractor",
        type: "dynamic",
        shape: { type: "circle", radius: 20 },
        position: createVector(150, 80),
        velocity: createVector(0, 0),
        mass: 1.0,
      },
    ],
    behaviors: [
      createSpringBehavior({
        id: "home_pull",
        target: createVector(0, 0),
        stiffness: 220,
        damping: 18,
        targetBodyIds: ["retractor"],
      }),
    ],
    ...overrides,
  };
}

/**
 * 6. Constrained Bouncing: Confines body inside a box repeatedly bouncing off walls.
 */
export function constrainedBouncingRecipe(
  overrides?: Partial<PhysicsCompositionConfig>
): PhysicsCompositionConfig {
  return {
    id: "recipe-constrained-bouncing",
    timestep: 1 / 60,
    gravity: createVector(0, 400),
    bounds: {
      min: createVector(0, 0),
      max: createVector(300, 300),
    },
    bodies: [
      {
        id: "bouncing_actor",
        type: "dynamic",
        shape: { type: "circle", radius: 15 },
        position: createVector(50, 50),
        velocity: createVector(150, -80),
        mass: 1.0,
        restitution: 0.9,
      },
    ],
    ...overrides,
  };
}

/**
 * 7. Gravity-Driven Interaction: Dropping body interacting with static platforms.
 */
export function gravityDrivenInteractionRecipe(
  overrides?: Partial<PhysicsCompositionConfig>
): PhysicsCompositionConfig {
  return {
    id: "recipe-gravity-interaction",
    timestep: 1 / 60,
    gravity: createVector(0, 980),
    bodies: [
      {
        id: "falling_ball",
        type: "dynamic",
        shape: { type: "circle", radius: 14 },
        position: createVector(100, 20),
        velocity: createVector(0, 0),
        mass: 1.0,
        restitution: 0.6,
      },
      {
        id: "static_ledge",
        type: "static",
        shape: { type: "rectangle", width: 140, height: 20 },
        position: createVector(120, 160),
      },
    ],
    ...overrides,
  };
}

/**
 * 8. Elastic Multi-Body Motion: Multiple dynamic bodies colliding elastically in a bounding arena.
 */
export function elasticMultiBodyMotionRecipe(
  overrides?: Partial<PhysicsCompositionConfig>
): PhysicsCompositionConfig {
  return {
    id: "recipe-elastic-multibody",
    timestep: 1 / 60,
    gravity: createVector(0, 0),
    bounds: {
      min: createVector(-150, -150),
      max: createVector(150, 150),
    },
    bodies: [
      {
        id: "body_1",
        type: "dynamic",
        shape: { type: "circle", radius: 16 },
        position: createVector(-80, 0),
        velocity: createVector(120, 40),
        mass: 1.0,
        restitution: 1.0,
      },
      {
        id: "body_2",
        type: "dynamic",
        shape: { type: "circle", radius: 16 },
        position: createVector(80, 0),
        velocity: createVector(-100, -20),
        mass: 1.0,
        restitution: 1.0,
      },
      {
        id: "body_3",
        type: "dynamic",
        shape: { type: "circle", radius: 16 },
        position: createVector(0, 80),
        velocity: createVector(30, -110),
        mass: 1.0,
        restitution: 1.0,
      },
    ],
    ...overrides,
  };
}

/**
 * Central dictionary of all registered physics composition recipes.
 */
export const PHYSICS_COMPOSITION_RECIPES: Record<string, PhysicsCompositionRecipe> = {
  "bouncy-entrance": {
    id: "bouncy-entrance",
    name: "Bouncy Entrance",
    description: "Object drops under gravity and bounces smoothly to rest on a ground plane.",
    create: bouncyEntranceRecipe,
  },
  "heavy-object-drop": {
    id: "heavy-object-drop",
    name: "Heavy Object Drop",
    description: "High-mass body dropped with rapid inelastic impact settling.",
    create: heavyObjectDropRecipe,
  },
  "floating-object": {
    id: "floating-object",
    name: "Floating Object",
    description: "Buoyant harmonic spring oscillation simulating fluid levitation.",
    create: floatingObjectRecipe,
  },
  "inertial-drag": {
    id: "inertial-drag",
    name: "Inertial Drag",
    description: "High initial velocity gliding across a flat surface with viscous decay.",
    create: inertialDragRecipe,
  },
  "spring-return": {
    id: "spring-return",
    name: "Spring Return",
    description: "Displaced object snaps back toward home anchor with harmonic overshoot.",
    create: springReturnRecipe,
  },
  "constrained-bouncing": {
    id: "constrained-bouncing",
    name: "Constrained Bouncing",
    description: "Confines body inside a box repeatedly bouncing off walls with high restitution.",
    create: constrainedBouncingRecipe,
  },
  "gravity-driven-interaction": {
    id: "gravity-driven-interaction",
    name: "Gravity-Driven Interaction",
    description: "Dropping ball colliding with and bouncing off static ledges.",
    create: gravityDrivenInteractionRecipe,
  },
  "elastic-multi-body-motion": {
    id: "elastic-multi-body-motion",
    name: "Elastic Multi-Body Motion",
    description: "Multiple dynamic bodies colliding elastically in a shared bounding arena.",
    create: elasticMultiBodyMotionRecipe,
  },
};

export function getPhysicsRecipe(id: string): PhysicsCompositionRecipe | undefined {
  return PHYSICS_COMPOSITION_RECIPES[id];
}

export function listPhysicsRecipes(): PhysicsCompositionRecipe[] {
  return Array.from(Object.values(PHYSICS_COMPOSITION_RECIPES));
}
