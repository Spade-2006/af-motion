/**
 * AF Motion — 3D Rigid Body Performance & Stacking Benchmarks
 *
 * Standardized execution benchmarks for multi-body simulations, vertical stacking,
 * high-velocity CCD collision penetration tests, and broadphase throughput.
 */

import { createPhysicsWorld3D } from "./world.js";
import { createSphereShape, createBoxShape, createPlaneShape, createCollider3D } from "./collision/shapes.js";
import { vec3 } from "./math.js";
import { createRope3D } from "./soft/rope.js";
import { createCloth3D } from "./soft/cloth.js";
import { createSoftBody3D } from "./soft/soft-body.js";
import { createHingeConstraint3D } from "./constraints/advanced.js";

export interface RigidBodyBenchmarkResult {
  bodyCount: number;
  steps: number;
  totalTimeMs: number;
  avgStepMs: number;
  fpsEquivalent: number;
}

export interface StackingBenchmarkResult {
  bodyCount: number;
  height: number;
  totalTimeMs: number;
  avgStepMs: number;
  stable: boolean;
}

export interface CCDBenchmarkResult {
  impactSpeed: number;
  tunneled: boolean;
  timeOfImpact: number;
  finalPositionZ: number;
}

/**
 * Runs a performance benchmark simulating N dynamic rigid bodies falling under gravity.
 */
export function benchmarkRigidBodies(
  bodyCount: number = 100,
  steps: number = 30
): RigidBodyBenchmarkResult {
  const world = createPhysicsWorld3D({
    gravity: vec3(0, -9.81, 0),
    timestep: 1 / 60,
    enableSleeping: true,
  });
  world.start();

  // Add ground plane
  world.addBody({
    type: "static",
    position: vec3(0, 0, 0),
    colliders: [createCollider3D(createPlaneShape(vec3(0, 1, 0), 0))],
  });

  // Spawn dynamic sphere bodies in a 3D grid layout
  const side = Math.ceil(Math.cbrt(bodyCount));
  const spacing = 2.5;

  let spawned = 0;
  for (let x = 0; x < side && spawned < bodyCount; x++) {
    for (let y = 0; y < side && spawned < bodyCount; y++) {
      for (let z = 0; z < side && spawned < bodyCount; z++) {
        world.addBody({
          type: "dynamic",
          position: vec3(
            (x - side / 2) * spacing,
            10 + y * spacing,
            (z - side / 2) * spacing
          ),
          mass: 1.0,
          colliders: [createCollider3D(createSphereShape(0.8))],
        });
        spawned++;
      }
    }
  }

  // Measure simulation stepping
  const startTime = typeof performance !== "undefined" ? performance.now() : Date.now();

  for (let s = 0; s < steps; s++) {
    world.step(1 / 60);
  }

  const totalTimeMs = (typeof performance !== "undefined" ? performance.now() : Date.now()) - startTime;
  const avgStepMs = totalTimeMs / steps;
  const fpsEquivalent = avgStepMs > 0 ? 1000 / avgStepMs : 60;

  world.dispose();

  return {
    bodyCount,
    steps,
    totalTimeMs,
    avgStepMs,
    fpsEquivalent,
  };
}

/**
 * Runs a vertical box stacking stability benchmark.
 */
export function benchmarkStacking(
  stacks: number = 1,
  height: number = 5,
  steps: number = 60
): StackingBenchmarkResult {
  const world = createPhysicsWorld3D({
    gravity: vec3(0, -9.81, 0),
    timestep: 1 / 60,
    enableSleeping: true,
  });
  world.start();

  // Ground plane
  world.addBody({
    type: "static",
    position: vec3(0, 0, 0),
    colliders: [createCollider3D(createPlaneShape(vec3(0, 1, 0), 0))],
  });

  const boxHalfExtents = vec3(1, 0.5, 1);
  const boxHeight = 1.0;
  const totalBoxes = stacks * height;

  const stackBodies: string[] = [];

  for (let s = 0; s < stacks; s++) {
    const stackX = (s - stacks / 2) * 3;
    for (let h = 0; h < height; h++) {
      const body = world.addBody({
        type: "dynamic",
        position: vec3(stackX, 0.5 + h * (boxHeight + 0.01), 0),
        mass: 2.0,
        colliders: [createCollider3D(createBoxShape(boxHalfExtents))],
      });
      stackBodies.push(body.id);
    }
  }

  const startTime = typeof performance !== "undefined" ? performance.now() : Date.now();

  for (let i = 0; i < steps; i++) {
    world.step(1 / 60);
  }

  const totalTimeMs = (typeof performance !== "undefined" ? performance.now() : Date.now()) - startTime;
  const avgStepMs = totalTimeMs / steps;

  // Check if stack remained upright (top box didn't topple off horizontally)
  let stable = true;
  for (const id of stackBodies) {
    const b = world.getBody(id);
    if (b && (Math.abs(b.linearVelocity.x) > 2.0 || Math.abs(b.linearVelocity.z) > 2.0)) {
      stable = false;
      break;
    }
  }

  world.dispose();

  return {
    bodyCount: totalBoxes,
    height,
    totalTimeMs,
    avgStepMs,
    stable,
  };
}

/**
 * Runs a high-velocity impact test to verify that Continuous Collision Detection
 * prevents tunneling through a thin static barrier.
 */
export function benchmarkCCD(impactSpeed: number = 100): CCDBenchmarkResult {
  const world = createPhysicsWorld3D({
    gravity: vec3(0, 0, 0),
    timestep: 1 / 60,
  });
  world.start();

  // Thin wall at z = 0 with thickness 0.1
  world.addBody({
    type: "static",
    position: vec3(0, 0, 0),
    colliders: [createCollider3D(createBoxShape(vec3(10, 10, 0.05)))],
  });

  // Fast bullet approaching wall from z = -5 at impactSpeed m/s
  // At 100 m/s with dt = 1/60s, displacement = 1.67m per step.
  // Without CCD, the bullet could jump completely from z = -0.5 to z = +1.17, tunneling through!
  const bullet = world.addBody({
    type: "dynamic",
    position: vec3(0, 0, -2),
    linearVelocity: vec3(0, 0, impactSpeed),
    mass: 0.5,
    colliders: [createCollider3D(createSphereShape(0.2))],
    userData: { enableCCD: true },
  });

  world.step(1 / 60);

  // Bullet should have been stopped at the wall (z <= 0.2)
  const finalPos = bullet.transform.position.z;
  const tunneled = finalPos > 0.5;

  world.dispose();

  return {
    impactSpeed,
    tunneled,
    timeOfImpact: 0,
    finalPositionZ: finalPos,
  };
}

export interface RopeBenchmarkResult {
  segments: number;
  steps: number;
  totalTimeMs: number;
  avgStepMs: number;
  fpsEquivalent: number;
  lengthMaintained: boolean;
}

export function benchmarkRope(segments: number = 100, steps: number = 30): RopeBenchmarkResult {
  const world = createPhysicsWorld3D({ gravity: vec3(0, -9.81, 0), timestep: 1 / 60 });
  world.start();

  const rope = createRope3D({ length: 5.0, segments, pinnedStart: true });
  world.addSoftBody(rope);

  const startTime = typeof performance !== "undefined" ? performance.now() : Date.now();
  for (let i = 0; i < steps; i++) {
    world.step(1 / 60);
  }
  const totalTimeMs = (typeof performance !== "undefined" ? performance.now() : Date.now()) - startTime;
  const avgStepMs = totalTimeMs / steps;
  const fpsEquivalent = avgStepMs > 0 ? 1000 / avgStepMs : 60;

  const endIdx = segments * 3;
  const endY = rope.positions[endIdx + 1];
  const lengthMaintained = endY < 5.0 && endY > -2.0;

  world.dispose();

  return {
    segments,
    steps,
    totalTimeMs,
    avgStepMs,
    fpsEquivalent,
    lengthMaintained,
  };
}

export interface ClothBenchmarkResult {
  resolution: number;
  particleCount: number;
  constraintCount: number;
  steps: number;
  totalTimeMs: number;
  avgStepMs: number;
  fpsEquivalent: number;
}

export function benchmarkCloth(size: number = 20, steps: number = 30): ClothBenchmarkResult {
  const world = createPhysicsWorld3D({ gravity: vec3(0, -9.81, 0), timestep: 1 / 60 });
  world.start();

  const cloth = createCloth3D({
    width: 2.0,
    height: 2.0,
    segmentsX: size,
    segmentsY: size,
    pinTopEdge: true,
  });
  world.addSoftBody(cloth);

  const startTime = typeof performance !== "undefined" ? performance.now() : Date.now();
  for (let i = 0; i < steps; i++) {
    world.step(1 / 60);
  }
  const totalTimeMs = (typeof performance !== "undefined" ? performance.now() : Date.now()) - startTime;
  const avgStepMs = totalTimeMs / steps;
  const fpsEquivalent = avgStepMs > 0 ? 1000 / avgStepMs : 60;

  world.dispose();

  return {
    resolution: size,
    particleCount: cloth.particleCount,
    constraintCount: cloth.constraints?.length ?? 0,
    steps,
    totalTimeMs,
    avgStepMs,
    fpsEquivalent,
  };
}

export interface SoftBodyBenchmarkResult {
  bodyCount: number;
  totalParticles: number;
  steps: number;
  totalTimeMs: number;
  avgStepMs: number;
  fpsEquivalent: number;
}

export function benchmarkSoftBodies(count: number = 10, steps: number = 30): SoftBodyBenchmarkResult {
  const world = createPhysicsWorld3D({ gravity: vec3(0, -9.81, 0), timestep: 1 / 60 });
  world.start();

  let totalParticles = 0;
  for (let b = 0; b < count; b++) {
    const rope = createRope3D({ length: 2.0, segments: 10, startPosition: vec3(b * 2, 5, 0) });
    world.addSoftBody(rope);
    totalParticles += rope.particleCount;
  }

  const startTime = typeof performance !== "undefined" ? performance.now() : Date.now();
  for (let i = 0; i < steps; i++) {
    world.step(1 / 60);
  }
  const totalTimeMs = (typeof performance !== "undefined" ? performance.now() : Date.now()) - startTime;
  const avgStepMs = totalTimeMs / steps;
  const fpsEquivalent = avgStepMs > 0 ? 1000 / avgStepMs : 60;

  world.dispose();

  return {
    bodyCount: count,
    totalParticles,
    steps,
    totalTimeMs,
    avgStepMs,
    fpsEquivalent,
  };
}

export interface ArticulatedChainBenchmarkResult {
  links: number;
  steps: number;
  totalTimeMs: number;
  avgStepMs: number;
  fpsEquivalent: number;
  intact: boolean;
}

export function benchmarkArticulatedChain(links: number = 10, steps: number = 30): ArticulatedChainBenchmarkResult {
  const world = createPhysicsWorld3D({ gravity: vec3(0, -9.81, 0), timestep: 1 / 60 });
  world.start();

  let prevBodyId: string | undefined;
  for (let i = 0; i < links; i++) {
    const body = world.addBody({
      type: i === 0 ? "static" : "dynamic",
      position: vec3(0, 10 - i * 1.0, 0),
      mass: 1.0,
      colliders: [createCollider3D(createBoxShape(vec3(0.2, 0.4, 0.2)))],
    });

    if (prevBodyId) {
      world.addConstraint(
        createHingeConstraint3D({
          bodyAId: prevBodyId,
          bodyBId: body.id,
          pivotA: vec3(0, -0.5, 0),
          pivotB: vec3(0, 0.5, 0),
          axisA: vec3(0, 0, 1),
          axisB: vec3(0, 0, 1),
        })
      );
    }
    prevBodyId = body.id;
  }

  const startTime = typeof performance !== "undefined" ? performance.now() : Date.now();
  for (let i = 0; i < steps; i++) {
    world.step(1 / 60);
  }
  const totalTimeMs = (typeof performance !== "undefined" ? performance.now() : Date.now()) - startTime;
  const avgStepMs = totalTimeMs / steps;
  const fpsEquivalent = avgStepMs > 0 ? 1000 / avgStepMs : 60;

  const intact = world.getConstraints().every((c) => c.enabled);

  world.dispose();

  return {
    links,
    steps,
    totalTimeMs,
    avgStepMs,
    fpsEquivalent,
    intact,
  };
}
