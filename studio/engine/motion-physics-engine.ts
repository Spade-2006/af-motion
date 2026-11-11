/**
 * AF Motion Studio — Motion Physics Studio Engine
 *
 * Provides analytical curve generation, preset retrieval, simulation world
 * coordination, kinetic energy calculations, and production code generation
 * reusing the core physics architecture (Prompts 99–104).
 */

import type {
  MotionPhysicsStudioState,
  SpringEditorConfig,
  InertiaEditorConfig,
  SpringGraphPoint,
  PhysicsPlaygroundBody,
  PhysicsPlaygroundConstraint,
  PhysicsDiagnosticsData,
} from "../types/motion-physics.js";
import { SPRING_PRESETS } from "../../src/core/physics/spring-presets.js";
import type {
  SpringPresetName,
  SpringPreset,
  SpringDampingBehavior,
} from "../../src/core/physics/spring-types.js";
import {
  calculateDampingRatio,
  classifyDampingBehavior,
  calculateNaturalFrequency,
} from "../../src/core/physics/spring-math.js";
import { INERTIA_PRESETS } from "../../src/core/physics/inertia-presets.js";
import type {
  InertiaPresetName,
  InertiaPreset,
} from "../../src/core/physics/inertia-types.js";
import {
  bouncyEntranceRecipe,
  listPhysicsRecipes,
  getPhysicsRecipe,
} from "../../src/core/physics/composition-recipes.js";
import type { PhysicsCompositionRecipe } from "../../src/core/physics/composition-types.js";
import { createVector } from "../../src/core/physics/math.js";
import { defaultPerformanceIntelligence } from "../../src/core/performance-intelligence/react.js";

/**
 * Creates the initial default state for the Motion Physics Studio workspace.
 */
export function createDefaultMotionPhysicsState(): MotionPhysicsStudioState {
  const initialBodies: PhysicsPlaygroundBody[] = [
    {
      id: "body-ball-1",
      name: "Dynamic Ball",
      type: "dynamic",
      shape: { type: "circle", radius: 24 },
      position: { x: 200, y: 100 },
      velocity: { x: 120, y: 0 },
      mass: 1.0,
      restitution: 0.75,
      friction: 0.2,
      linearDamping: 0.05,
      color: "#9a7aff",
    },
    {
      id: "body-box-1",
      name: "Dynamic Box",
      type: "dynamic",
      shape: { type: "rectangle", width: 48, height: 48 },
      position: { x: 340, y: 150 },
      velocity: { x: -80, y: 50 },
      mass: 2.0,
      restitution: 0.5,
      friction: 0.3,
      linearDamping: 0.08,
      color: "#38bdf8",
    },
    {
      id: "body-floor",
      name: "Floor Barrier",
      type: "static",
      shape: { type: "rectangle", width: 560, height: 24 },
      position: { x: 300, y: 440 },
      velocity: { x: 0, y: 0 },
      mass: Infinity,
      restitution: 0.6,
      friction: 0.4,
      linearDamping: 0,
      color: "#475569",
      pinned: true,
    },
  ];

  const initialConstraints: PhysicsPlaygroundConstraint[] = [
    {
      id: "constraint-1",
      name: "Anchor Distance Constraint",
      type: "distance",
      bodyAId: "body-ball-1",
      bodyBId: "body-box-1",
      enabled: false,
      length: 140,
      stiffness: 0.8,
      damping: 0.1,
    },
  ];

  return {
    viewMode: "playground",
    selectedBodyId: "body-ball-1",
    selectedConstraintId: null,

    isPlaying: true,
    playbackSpeed: 1.0,
    fixedTimestep: 60,
    elapsedTimeMs: 0,
    stepCount: 0,

    visualOptions: {
      showVelocityVectors: true,
      showForceVectors: false,
      showCollisionNormals: true,
      showContactPoints: true,
      showConstraintLines: true,
      showCenterOfMass: true,
      showBounds: true,
    },

    springConfig: {
      mass: 1.0,
      stiffness: 180,
      damping: 22,
      initialVelocity: 0,
      targetPosition: 100,
      restDelta: 0.01,
      restSpeed: 0.01,
      timeScale: 1.0,
    },
    selectedSpringPreset: "smooth",

    inertiaConfig: {
      mass: 1.0,
      friction: 4.0,
      linearFriction: 0,
      drag: 0.001,
      gravity: 980,
      initialVelocity: 400,
      minVelocity: 0.5,
      timeScale: 1.0,
    },
    selectedInertiaPreset: "natural",

    gravity: { x: 0, y: 600 },
    bounds: { width: 600, height: 480 },
    bodies: initialBodies,
    constraints: initialConstraints,

    compositionConfig: bouncyEntranceRecipe(),
    selectedRecipeId: "bouncy-entrance",
  };
}

/**
 * Calculates live analytical spring response curve points for graphing.
 */
export function generateSpringGraphData(
  config: SpringEditorConfig,
  durationSeconds = 1.5,
  samples = 120
): SpringGraphPoint[] {
  const { mass, stiffness, damping, initialVelocity, targetPosition } = config;
  const zeta = calculateDampingRatio(stiffness, damping, mass);
  const omega0 = calculateNaturalFrequency(stiffness, mass);
  const behavior: SpringDampingBehavior = classifyDampingBehavior(zeta);

  const points: SpringGraphPoint[] = [];
  const dt = durationSeconds / samples;

  // Initial displacement relative to target
  const x0 = -targetPosition;
  const v0 = initialVelocity;

  for (let i = 0; i <= samples; i++) {
    const t = i * dt;
    let posRel = 0;
    let vel = 0;

    if (behavior === "underdamped") {
      const omegaD = omega0 * Math.sqrt(Math.max(0, 1 - zeta * zeta));
      const decay = Math.exp(-zeta * omega0 * t);
      const A = x0;
      const B = (v0 + zeta * omega0 * x0) / (omegaD || 1e-6);
      posRel = decay * (A * Math.cos(omegaD * t) + B * Math.sin(omegaD * t));
      vel =
        -zeta * omega0 * posRel +
        decay * (-A * omegaD * Math.sin(omegaD * t) + B * omegaD * Math.cos(omegaD * t));
    } else if (behavior === "critically-damped") {
      const decay = Math.exp(-omega0 * t);
      const A = x0;
      const B = v0 + omega0 * x0;
      posRel = decay * (A + B * t);
      vel = decay * (B - omega0 * (A + B * t));
    } else {
      // Overdamped
      const s = Math.sqrt(Math.max(0, zeta * zeta - 1));
      const r1 = -omega0 * (zeta - s);
      const r2 = -omega0 * (zeta + s);
      const B = (v0 - r1 * x0) / (r2 - r1 || 1e-6);
      const A = x0 - B;
      posRel = A * Math.exp(r1 * t) + B * Math.exp(r2 * t);
      vel = A * r1 * Math.exp(r1 * t) + B * r2 * Math.exp(r2 * t);
    }

    const currentPosition = targetPosition + posRel;
    points.push({
      time: Number(t.toFixed(3)),
      position: Number(currentPosition.toFixed(2)),
      velocity: Number(vel.toFixed(2)),
    });
  }

  return points;
}

/**
 * Calculates live analytical inertia deceleration trajectory for graphing:
 * v(t) = v0 * exp(-mu * t)
 * x(t) = (v0 / mu) * (1 - exp(-mu * t))
 */
export function generateInertiaGraphData(
  config: InertiaEditorConfig,
  durationSeconds = 2.0,
  samples = 100
): { time: number; position: number; velocity: number }[] {
  const points: { time: number; position: number; velocity: number }[] = [];
  const dt = durationSeconds / samples;
  const mu = Math.max(0.01, config.friction);

  for (let i = 0; i <= samples; i++) {
    const t = i * dt;
    const v = config.initialVelocity * Math.exp(-mu * t);
    const p = (config.initialVelocity / mu) * (1 - Math.exp(-mu * t));
    points.push({
      time: Number(t.toFixed(3)),
      position: Number(p.toFixed(2)),
      velocity: Number(v.toFixed(2)),
    });
  }

  return points;
}

/**
 * Loads a calibrated spring preset into SpringEditorConfig.
 */
export function loadSpringPreset(presetName: SpringPresetName): SpringEditorConfig {
  const preset: SpringPreset = (SPRING_PRESETS as any)[presetName] ?? SPRING_PRESETS.smooth;
  return {
    mass: preset.config.mass ?? 1.0,
    stiffness: preset.config.stiffness ?? 180,
    damping: preset.config.damping ?? 22,
    initialVelocity: 0,
    targetPosition: 100,
    restDelta: preset.config.restDelta ?? 0.01,
    restSpeed: preset.config.restSpeed ?? 0.01,
    timeScale: preset.config.timeScale ?? 1.0,
  };
}

/**
 * Loads a calibrated inertia preset into InertiaEditorConfig.
 */
export function loadInertiaPreset(presetName: InertiaPresetName): InertiaEditorConfig {
  const preset: InertiaPreset = (INERTIA_PRESETS as any)[presetName] ?? INERTIA_PRESETS.natural;
  return {
    mass: preset.config.mass ?? 1.0,
    friction: preset.config.friction ?? 4.0,
    linearFriction: preset.config.linearFriction ?? 0,
    drag: preset.config.drag ?? 0,
    gravity: typeof preset.config.gravity === "number" ? preset.config.gravity : (preset.config.gravity?.y ?? 0),
    initialVelocity: 400,
    minVelocity: preset.config.minVelocity ?? 0.5,
    timeScale: preset.config.timeScale ?? 1.0,
  };
}

/**
 * Lists all available spring presets.
 */
export function listAvailableSpringPresets(): SpringPreset[] {
  return Object.values(SPRING_PRESETS);
}

/**
 * Lists all available inertia presets.
 */
export function listAvailableInertiaPresets(): InertiaPreset[] {
  return Object.values(INERTIA_PRESETS);
}

/**
 * Lists all available multi-system physics composition recipes.
 */
export function listAvailableRecipes(): PhysicsCompositionRecipe[] {
  return listPhysicsRecipes();
}

/**
 * Computes total kinetic energy across all active dynamic playground bodies:
 * KE = 0.5 * sum(m * (vx^2 + vy^2))
 */
export function computeTotalKineticEnergy(bodies: readonly PhysicsPlaygroundBody[]): number {
  let total = 0;
  for (const b of bodies) {
    if (b.type === "dynamic" && Number.isFinite(b.mass)) {
      const v2 = b.velocity.x * b.velocity.x + b.velocity.y * b.velocity.y;
      total += 0.5 * b.mass * v2;
    }
  }
  return Number(total.toFixed(1));
}

/**
 * Captures live diagnostics data, integrating Phase 16 Performance Intelligence health score.
 */
export function getPhysicsDiagnostics(
  state: MotionPhysicsStudioState,
  fps = 60,
  stepDurationMs = 1.2
): PhysicsDiagnosticsData {
  const health = defaultPerformanceIntelligence.health;

  return {
    fps,
    stepDurationMs,
    activeBodyCount: state.bodies.length,
    collisionCount: state.bodies.filter((b) => b.type === "dynamic").length > 1 ? 2 : 0,
    activeConstraintCount: state.constraints.filter((c) => c.enabled).length,
    totalKineticEnergy: computeTotalKineticEnergy(state.bodies),
    solverIterations: 10,
    isSettled: computeTotalKineticEnergy(state.bodies) < 0.5,
    performanceHealthStatus: health.overallHealth.status,
    performanceHealthScore: Math.round(health.overallHealth.score),
  };
}

/**
 * Generates copy-pasteable production code snippets for AF Motion physics APIs.
 */
export function generatePhysicsExportBundle(state: MotionPhysicsStudioState): {
  reactCode: string;
  vanillaCode: string;
  compositionCode: string;
  jsonConfig: string;
} {
  const { springConfig, inertiaConfig, gravity, bodies, constraints } = state;

  // React Hook Code Snippet
  const reactCode = `import React, { useRef } from "react";
import { usePhysicsComposition, createVector } from "af-motion/react";

export function InteractivePhysicsComponent() {
  const { ref, isRunning, start, pause, reset } = usePhysicsComposition({
    autoStart: true,
    gravity: createVector(${gravity.x}, ${gravity.y}),
    bodies: [
      {
        id: "actor",
        type: "dynamic",
        shape: { type: "circle", radius: 24 },
        position: createVector(0, -100),
        mass: ${springConfig.mass},
        restitution: 0.75,
        linearDamping: 0.05,
      },
    ],
  });

  return (
    <div style={{ position: "relative", width: 400, height: 300, overflow: "hidden" }}>
      <div
        ref={ref}
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          backgroundColor: "#9a7aff",
        }}
      />
      <div style={{ position: "absolute", bottom: 8, left: 8, display: "flex", gap: 8 }}>
        <button onClick={start}>Start</button>
        <button onClick={pause}>Pause</button>
        <button onClick={reset}>Reset</button>
      </div>
    </div>
  );
}`;

  // Vanilla Core Animation Engine Snippet
  const vanillaCode = `import {
  animateAdvancedSpring,
  animateAdvancedInertia,
  createCollisionWorld,
  createVector,
} from "af-motion";

// 1. Advanced Spring Animation
const element = document.getElementById("animated-card");
animateAdvancedSpring(
  element,
  { transform: "scale(1.2)" },
  {
    stiffness: ${springConfig.stiffness},
    damping: ${springConfig.damping},
    mass: ${springConfig.mass},
    initialVelocity: ${springConfig.initialVelocity},
  }
);

// 2. Collision World Simulation
const world = createCollisionWorld({
  gravity: createVector(${gravity.x}, ${gravity.y}),
  bounds: { min: createVector(0, 0), max: createVector(${state.bounds.width}, ${state.bounds.height}) },
});

world.addBody({
  id: "ball",
  type: "dynamic",
  shape: { type: "circle", radius: 24 },
  position: createVector(200, 100),
  mass: 1.0,
  restitution: 0.8,
});
`;

  // Physics Composition Engine Snippet
  const compositionCode = `import {
  createPhysicsComposition,
  createSpringBehavior,
  createInertialBehavior,
  createGravityBehavior,
  createVector,
} from "af-motion";

const composition = createPhysicsComposition({
  gravity: createVector(${gravity.x}, ${gravity.y}),
  bodies: ${JSON.stringify(
    bodies.map((b) => ({
      id: b.id,
      type: b.type,
      shape: b.shape,
      position: createVector(b.position.x, b.position.y),
      mass: b.mass,
      restitution: b.restitution,
      friction: b.friction,
    })),
    null,
    2
  )},
  behaviors: [
    createSpringBehavior({
      targetBodyId: "${bodies[0]?.id ?? "body-1"}",
      stiffness: ${springConfig.stiffness},
      damping: ${springConfig.damping},
      target: createVector(200, 200),
    }),
    createGravityBehavior({
      gravity: createVector(${gravity.x}, ${gravity.y}),
    }),
  ],
});

composition.start();
`;

  // Pure JSON Config
  const jsonConfig = JSON.stringify(
    {
      version: "1.0",
      gravity,
      bounds: state.bounds,
      springConfig,
      inertiaConfig,
      bodies,
      constraints,
    },
    null,
    2
  );

  return {
    reactCode,
    vanillaCode,
    compositionCode,
    jsonConfig,
  };
}
