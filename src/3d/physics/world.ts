/**
 * AF Motion — 3D Rigid Body Physics World
 *
 * Framework-independent 3D physics engine orchestrating dynamic, static,
 * and kinematic rigid bodies, compound colliders, accurate rotational inertia,
 * continuous collision detection (CCD), resting contact stabilization, and lifecycle.
 * Integrates directly with the Prompt 122 Unified Simulation Coordinator.
 */

import type {
  PhysicsWorldConfig,
  PhysicsMetrics,
  PhysicsWorldState,
  PhysicsWorldEventMap,
  RigidBodyState,
  RigidBodyType,
  Collider3D,
  Constraint3D,
  CollisionManifold3D,
  Transform3D,
  Vector3,
  Ray3D,
  RayHit3D,
  AABB3D,
  SpatialFilter3D,
  Matrix3,
  SoftBodyState,
} from "./types.js";
import {
  vec3,
  vec3Add,
  vec3Sub,
  vec3Scale,
  vec3Dot,
  vec3Cross,
  vec3LengthSq,
  vec3Clone,
  createTransform3D,
  cloneTransform3D,
  mat3Diagonal,
  mat3Invert,
  mat3TransformVector,
  quatIdentity,
  quatRotateVector,
  localToWorldPoint,
  worldToLocalPoint,
} from "./math.js";
import { createPhysicsMaterial } from "./material.js";
import { computeColliderAABB } from "./collision/shapes.js";
import { generateCollisionManifold } from "./collision/narrowphase.js";
import { SpatialHash3D, type SpatialQuery3D } from "./spatial/spatial-hash.js";
import { PhysicsEventEmitter3D, type PhysicsEventListener } from "./events.js";
import {
  SymplecticEulerIntegrator3D,
  ImpulseCollisionSolver3D,
} from "./solver/integrators.js";
import { AdvancedConstraintSolver3D, computeConstraintIslands } from "./constraints/solver.js";
import { simulateSoftBodyStep } from "./soft/gpu.js";
import { resolveSoftBodyCollisions } from "./soft/collision.js";
import type {
  PhysicsIntegrator3D,
  CollisionSolver3D,
  ConstraintSolver3D,
} from "./solver/types.js";
import {
  computeCompoundMassProperties,
  computeColliderInertia,
  computeSphereInertia,
  computeWorldInvInertiaTensor,
} from "./body/inertia.js";
import { sweepBodyCCD, requiresCCD } from "./collision/ccd.js";
import type { SimulationParticipant } from "../../graphics/simulation/types.js";

export interface RigidBodyConfig {
  id?: string;
  type?: RigidBodyType;
  transform?: Partial<Transform3D>;
  position?: Vector3;
  linearVelocity?: Vector3;
  angularVelocity?: Vector3;
  linearFactor?: Vector3;
  angularFactor?: Vector3;
  mass?: number;
  density?: number;
  linearDamping?: number;
  angularDamping?: number;
  gravityScale?: number;
  material?: Partial<import("./types.js").PhysicsMaterial>;
  colliders?: Collider3D[];
  allowSleep?: boolean;
  enableCCD?: boolean;
  userData?: unknown;
}

export interface PhysicsWorld3D {
  readonly id: string;
  getState(): PhysicsWorldState;
  getGravity(): Vector3;
  setGravity(gravity: Vector3): void;
  getTimestep(): number;
  setTimestep(timestep: number): void;
  getMaxSubsteps(): number;
  setMaxSubsteps(substeps: number): void;
  getTimeScale(): number;
  setTimeScale(scale: number): void;
  getSimulationTime(): number;
  isPaused(): boolean;

  // Lifecycle
  start(): void;
  pause(): void;
  resume(): void;
  step(deltaSeconds?: number): void;
  reset(): void;
  dispose(): void;
  updateConfig(config: Partial<PhysicsWorldConfig>): void;

  // Body Management
  addBody(config: RigidBodyConfig | RigidBodyState): RigidBodyState;
  removeBody(bodyId: string): boolean;
  getBody(bodyId: string): RigidBodyState | undefined;
  getAllBodies(): RigidBodyState[];

  // Dynamics, Forces & Impulses API
  applyForce(bodyId: string, force: Vector3, relativePoint?: Vector3, isWorldSpace?: boolean): void;
  applyTorque(bodyId: string, torque: Vector3): void;
  applyImpulse(bodyId: string, impulse: Vector3, relativePoint?: Vector3, isWorldSpace?: boolean): void;
  applyAngularImpulse(bodyId: string, angularImpulse: Vector3): void;
  setLinearVelocity(bodyId: string, velocity: Vector3): void;
  setAngularVelocity(bodyId: string, angularVelocity: Vector3): void;
  setBodyTransform(bodyId: string, transform: Transform3D): void;
  setBodyType(bodyId: string, type: RigidBodyType): void;
  setBodyMass(bodyId: string, mass: number, updateInertia?: boolean): void;
  setBodyDensity(bodyId: string, density: number): void;
  wakeBody(bodyId: string): void;
  sleepBody(bodyId: string): void;
  isBodySleeping(bodyId: string): boolean;
  recomputeBodyInertia(bodyId: string): void;

  // Collider Management
  addCollider(bodyId: string, collider: Collider3D): void;
  removeCollider(colliderId: string): boolean;
  getCollider(colliderId: string): Collider3D | undefined;

  // Soft Body Management
  addSoftBody(softBody: SoftBodyState): void;
  addSoftBody3D(softBody: SoftBodyState): void;
  removeSoftBody(softBodyId: string): boolean;
  removeSoftBody3D(softBodyId: string): boolean;
  getSoftBody(softBodyId: string): SoftBodyState | undefined;
  getSoftBodies(): SoftBodyState[];

  // Constraint Management
  addConstraint(constraint: Constraint3D): void;
  addConstraint3D(constraint: Constraint3D): void;
  removeConstraint(constraintId: string): boolean;
  removeConstraint3D(constraintId: string): boolean;
  getConstraint(constraintId: string): Constraint3D | undefined;
  getConstraints(): Constraint3D[];

  // Environment & Wind
  setWind(wind: Vector3): void;
  getWind(): Vector3;

  // Spatial Queries
  raycast(ray: Ray3D, filter?: SpatialFilter3D): RayHit3D[];
  raycastAny(ray: Ray3D, filter?: SpatialFilter3D): boolean;
  queryAABB(aabb: AABB3D, filter?: SpatialFilter3D): Collider3D[];
  querySphere(center: Vector3, radius: number, filter?: SpatialFilter3D): Collider3D[];

  // Events & Observability
  on<K extends keyof PhysicsWorldEventMap>(
    event: K,
    listener: PhysicsEventListener<K>
  ): () => void;
  off<K extends keyof PhysicsWorldEventMap>(
    event: K,
    listener: PhysicsEventListener<K>
  ): void;
  getMetrics(): PhysicsMetrics;

  // Coordinator Integration
  asParticipant(id?: string, priority?: number): SimulationParticipant;
}

/**
 * Creates an independent 3D Physics World instance.
 */
export function createPhysicsWorld3D(
  config: PhysicsWorldConfig = {}
): PhysicsWorld3D {
  const worldId = `physics3d_${Math.random().toString(36).substring(2, 9)}`;

  let state: PhysicsWorldState = "idle";
  let gravity: Vector3 = config.gravity ? vec3Clone(config.gravity) : { x: 0, y: -9.81, z: 0 };
  let timestep = Math.max(0.001, config.timestep ?? 1 / 60);
  let maxSubsteps = Math.max(1, config.maxSubsteps ?? 5);
  let solverIterations = Math.max(1, config.solverIterations ?? 10);
  let enableSleeping = config.enableSleeping ?? true;
  let sleepThreshold = Math.max(0.001, config.sleepThreshold ?? 0.05);
  let timeBeforeSleep = Math.max(0.1, config.timeBeforeSleep ?? 0.5);
  let timeScale = Math.max(0, config.timeScale ?? 1.0);
  let simulationTime = 0;
  let timeAccumulator = 0;

  const bodies = new Map<string, RigidBodyState>();
  const colliders = new Map<string, Collider3D>();
  const constraints = new Map<string, Constraint3D>();
  const activeManifolds = new Map<string, CollisionManifold3D>();

  const emitter = new PhysicsEventEmitter3D();
  const spatialQuery: SpatialQuery3D = new SpatialHash3D({
    cellSize: config.spatialCellSize ?? 2.0,
  });

  const integrator: PhysicsIntegrator3D = new SymplecticEulerIntegrator3D();
  const collisionSolver: CollisionSolver3D = new ImpulseCollisionSolver3D();
  const constraintSolver = new AdvancedConstraintSolver3D((constraintId, constraint, impulse) => {
    emitter.emit("constraintEvent", { constraintId, type: "broken" });
    emitter.emit("constraintBreak", { constraintId, constraint, impulse });
  });

  const softBodies = new Map<string, SoftBodyState>();
  let windVector: Vector3 = config.windVector ? vec3Clone(config.windVector) : { x: 0, y: 0, z: 0 };
  let groundY = config.groundY ?? 0;
  let hasGround = config.hasGround ?? true;

  let metrics: PhysicsMetrics = {
    stepDuration: 0,
    activeBodyCount: 0,
    staticBodyCount: 0,
    sleepingBodyCount: 0,
    colliderCount: 0,
    contactCount: 0,
    manifoldCount: 0,
    constraintCount: 0,
    broadphasePairCount: 0,
    solverIterations,
    simulationTime: 0,
    substepsExecuted: 0,
  };

  function updateMetrics(stepDuration: number, substeps: number, broadphasePairs: number): void {
    let active = 0;
    let stat = 0;
    let sleeping = 0;

    for (const b of bodies.values()) {
      if (b.type === "static") stat++;
      else if (b.isSleeping) sleeping++;
      else active++;
    }

    let contactPoints = 0;
    for (const m of activeManifolds.values()) {
      contactPoints += m.contacts.length;
    }

    let softParticles = 0;
    for (const sb of softBodies.values()) {
      softParticles += sb.particleCount;
    }
    const islandCount = constraints.size > 0 ? computeConstraintIslands(bodies, Array.from(constraints.values())).length : 0;

    metrics = {
      stepDuration,
      activeBodyCount: active,
      staticBodyCount: stat,
      sleepingBodyCount: sleeping,
      colliderCount: colliders.size,
      contactCount: contactPoints,
      manifoldCount: activeManifolds.size,
      constraintCount: constraints.size,
      broadphasePairCount: broadphasePairs,
      solverIterations,
      simulationTime,
      substepsExecuted: substeps,
      softBodyCount: softBodies.size,
      softParticleCount: softParticles,
      islandCount,
    };
  }

  function internalWakeBody(body: RigidBodyState): void {
    if (body.isSleeping) {
      body.isSleeping = false;
      body.sleepTime = 0;
    }
  }

  function internalSleepBody(body: RigidBodyState): void {
    if (body.type === "dynamic" && body.allowSleep && !body.isSleeping) {
      body.isSleeping = true;
      body.linearVelocity = vec3(0, 0, 0);
      body.angularVelocity = vec3(0, 0, 0);
      body.force = vec3(0, 0, 0);
      body.torque = vec3(0, 0, 0);
    }
  }

  function getBodyTransform(bodyId?: string): Transform3D {
    const b = bodyId ? bodies.get(bodyId) : undefined;
    return b ? b.transform : createTransform3D();
  }

  function simulateSubstep(dt: number): void {
    simulationTime += dt;

    // Snapshot start transforms for Continuous Collision Detection (CCD)
    const startPositions = new Map<string, Transform3D>();
    for (const b of bodies.values()) {
      if (b.type === "dynamic" && !b.isSleeping) {
        startPositions.set(b.id, cloneTransform3D(b.transform));
      }
    }

    // 1. Numerical Integration (velocities and proposed positions)
    const bodyList = Array.from(bodies.values());
    integrator.integrate(bodyList, dt, gravity);

    // 1.1 Continuous Collision Detection (CCD) for fast-moving bodies
    for (const body of bodies.values()) {
      if (body.type !== "dynamic" || body.isSleeping) continue;

      const prevTransform = startPositions.get(body.id);
      if (!prevTransform) continue;

      const displacement = vec3Sub(body.transform.position, prevTransform.position);
      if (requiresCCD(body, displacement)) {
        const ccd = sweepBodyCCD(body, prevTransform, body.transform, spatialQuery, getBodyTransform);
        if (ccd.hasCollision && ccd.timeOfImpact < 1.0 && ccd.hitPoint && ccd.hitNormal) {
          // Clamp body position to contact surface
          body.transform.position = vec3Add(
            prevTransform.position,
            vec3Scale(displacement, ccd.timeOfImpact)
          );

          // Zero or reflect normal velocity
          const normVel = vec3Dot(body.linearVelocity, ccd.hitNormal);
          if (normVel < 0) {
            body.linearVelocity = vec3Sub(body.linearVelocity, vec3Scale(ccd.hitNormal, normVel));
          }

          // If hit body is sleeping, wake it
          if (ccd.hitBodyId) {
            const hitB = bodies.get(ccd.hitBodyId);
            if (hitB) internalWakeBody(hitB);
          }
        }
      }
    }

    // 2. Update collider AABBs in spatial acceleration structure
    for (const body of bodies.values()) {
      for (const col of body.colliders) {
        col.aabb = computeColliderAABB(col, body.transform);
        spatialQuery.update(col);
      }
    }

    // 3. Broad-phase Collision Detection
    const potentialPairs = spatialQuery.getPotentialPairs();

    // 4. Narrow-phase Contact Generation
    const nextManifolds = new Map<string, CollisionManifold3D>();

    for (const [colA, colB] of potentialPairs) {
      const bodyA = colA.bodyId ? bodies.get(colA.bodyId) : undefined;
      const bodyB = colB.bodyId ? bodies.get(colB.bodyId) : undefined;

      const tA = bodyA ? bodyA.transform : createTransform3D();
      const tB = bodyB ? bodyB.transform : createTransform3D();

      const manifold = generateCollisionManifold(bodyA, bodyB, colA, colB, tA, tB);
      if (manifold) {
        const manifoldKey = `${colA.id}:${colB.id}`;
        nextManifolds.set(manifoldKey, manifold);

        if (manifold.isTrigger) {
          if (!activeManifolds.has(manifoldKey)) {
            emitter.emit("triggerEnter", {
              trigger: colA.isTrigger ? colA : colB,
              other: colA.isTrigger ? colB : colA,
              bodyTrigger: colA.isTrigger ? bodyA : bodyB,
              bodyOther: colA.isTrigger ? bodyB : bodyA,
            });
          }
        } else {
          if (!activeManifolds.has(manifoldKey)) {
            emitter.emit("collisionStart", { manifold });
          } else {
            emitter.emit("collisionPersist", { manifold });
          }
        }
      }
    }

    // Detect collision / trigger endings
    for (const [key, oldManifold] of activeManifolds.entries()) {
      if (!nextManifolds.has(key)) {
        if (oldManifold.isTrigger) {
          const colA = colliders.get(oldManifold.colliderAId);
          const colB = colliders.get(oldManifold.colliderBId);
          if (colA && colB) {
            emitter.emit("triggerExit", {
              trigger: colA.isTrigger ? colA : colB,
              other: colA.isTrigger ? colB : colA,
            });
          }
        } else {
          emitter.emit("collisionEnd", {
            bodyAId: oldManifold.bodyAId,
            bodyBId: oldManifold.bodyBId,
            colliderAId: oldManifold.colliderAId,
            colliderBId: oldManifold.colliderBId,
          });
        }
      }
    }

    // Swap active manifolds
    activeManifolds.clear();
    for (const [k, v] of nextManifolds.entries()) {
      activeManifolds.set(k, v);
    }

    // 5. Constraint Solving
    constraintSolver.solveConstraints(
      Array.from(constraints.values()),
      bodies,
      solverIterations,
      dt
    );

    // 6. Collision Resolution (impulse solver with true rotational inertia)
    collisionSolver.resolveCollisions(
      Array.from(activeManifolds.values()),
      bodies,
      solverIterations,
      dt
    );

    // 6.5. Soft Body Simulation & Collisions
    for (const sb of softBodies.values()) {
      simulateSoftBodyStep(
        sb,
        dt,
        gravity,
        solverIterations,
        bodies,
        windVector,
        (softBodyId, pA, pB, strain) => {
          emitter.emit("clothTear", { softBodyId, particleA: pA, particleB: pB, strain });
        }
      );
    }
    if (softBodies.size > 0) {
      resolveSoftBodyCollisions(softBodies.values(), bodies, dt, groundY, hasGround);
    }

    // 7. Articulated Island & Sleeping Check
    if (enableSleeping) {
      // 7.1 Island-synchronized sleeping for constrained mechanisms
      if (constraints.size > 0) {
        const islands = computeConstraintIslands(bodies, Array.from(constraints.values()));
        for (const island of islands) {
          if (island.isSleeping) {
            for (const bid of island.bodyIds) {
              const b = bodies.get(bid);
              if (b && !b.isSleeping) internalSleepBody(b);
            }
          } else {
            // Wake entire island if it has moving energy
            for (const bid of island.bodyIds) {
              const b = bodies.get(bid);
              if (b && b.isSleeping) internalWakeBody(b);
            }
          }
        }
      }

      // 7.2 Sleeping check for unconstrained bodies
      for (const body of bodies.values()) {
        if (body.type !== "dynamic" || !body.allowSleep || body.isSleeping) continue;

        const linEnergy = 0.5 * body.mass * vec3LengthSq(body.linearVelocity);
        const angEnergy = 0.5 * vec3LengthSq(body.angularVelocity);
        const totalEnergy = linEnergy + angEnergy;

        if (totalEnergy < sleepThreshold) {
          body.sleepTime += dt;
          if (body.sleepTime >= timeBeforeSleep) {
            internalSleepBody(body);
          }
        } else {
          body.sleepTime = 0;
        }
      }
    }
  }

  const world: PhysicsWorld3D = {
    id: worldId,

    getState: () => state,
    getGravity: () => vec3Clone(gravity),
    setGravity: (g) => { gravity = vec3Clone(g); },
    getTimestep: () => timestep,
    setTimestep: (dt) => { timestep = Math.max(0.001, dt); },
    getMaxSubsteps: () => maxSubsteps,
    setMaxSubsteps: (s) => { maxSubsteps = Math.max(1, s); },
    getTimeScale: () => timeScale,
    setTimeScale: (s) => { timeScale = Math.max(0, s); },
    getSimulationTime: () => simulationTime,
    isPaused: () => state === "paused",

    start: () => {
      if (state === "disposed") return;
      const prev = state;
      state = "running";
      emitter.emit("stateChange", { previous: prev, current: state });
    },

    pause: () => {
      if (state === "disposed" || state === "paused") return;
      const prev = state;
      state = "paused";
      emitter.emit("stateChange", { previous: prev, current: state });
    },

    resume: () => {
      if (state === "disposed" || state === "running") return;
      const prev = state;
      state = "running";
      emitter.emit("stateChange", { previous: prev, current: state });
    },

    step: (deltaSeconds?: number) => {
      if (state === "disposed" || state === "paused") return;

      const startTime = typeof performance !== "undefined" ? performance.now() : Date.now();
      const rawDelta = deltaSeconds !== undefined ? deltaSeconds : timestep;
      const scaledDelta = rawDelta * timeScale;

      timeAccumulator += scaledDelta;
      let substeps = 0;
      const effectiveThreshold = timestep * 0.95;

      while (
        (timeAccumulator >= timestep || (substeps === 0 && timeAccumulator >= effectiveThreshold)) &&
        substeps < maxSubsteps
      ) {
        simulateSubstep(timestep);
        timeAccumulator = Math.max(0, timeAccumulator - timestep);
        substeps++;
      }

      // Avoid accumulation spiral if lagging
      if (timeAccumulator > timestep * maxSubsteps) {
        timeAccumulator = 0;
      }

      const duration = (typeof performance !== "undefined" ? performance.now() : Date.now()) - startTime;
      updateMetrics(duration, substeps, spatialQuery.getPotentialPairs().length);
    },

    reset: () => {
      timeAccumulator = 0;
      simulationTime = 0;
      activeManifolds.clear();

      for (const body of bodies.values()) {
        body.linearVelocity = vec3(0, 0, 0);
        body.angularVelocity = vec3(0, 0, 0);
        body.force = vec3(0, 0, 0);
        body.torque = vec3(0, 0, 0);
        body.isSleeping = false;
        body.sleepTime = 0;
      }
    },

    dispose: () => {
      if (state === "disposed") return;
      const prev = state;
      state = "disposed";
      emitter.emit("stateChange", { previous: prev, current: "disposed" });

      bodies.clear();
      colliders.clear();
      constraints.clear();
      softBodies.clear();
      activeManifolds.clear();
      spatialQuery.clear();
      emitter.clear();
    },

    updateConfig: (patch: Partial<PhysicsWorldConfig>) => {
      if (patch.gravity) gravity = vec3Clone(patch.gravity);
      if (patch.timestep !== undefined) timestep = Math.max(0.001, patch.timestep);
      if (patch.maxSubsteps !== undefined) maxSubsteps = Math.max(1, patch.maxSubsteps);
      if (patch.solverIterations !== undefined) solverIterations = Math.max(1, patch.solverIterations);
      if (patch.enableSleeping !== undefined) enableSleeping = patch.enableSleeping;
      if (patch.sleepThreshold !== undefined) sleepThreshold = Math.max(0.001, patch.sleepThreshold);
      if (patch.timeBeforeSleep !== undefined) timeBeforeSleep = Math.max(0.1, patch.timeBeforeSleep);
      if (patch.timeScale !== undefined) timeScale = Math.max(0, patch.timeScale);
    },

    addBody: (cfgOrBody: RigidBodyConfig | RigidBodyState): RigidBodyState => {
      const isExisting = "invMass" in cfgOrBody;
      let body: RigidBodyState;

      if (isExisting) {
        body = cfgOrBody as RigidBodyState;
      } else {
        const cfg = cfgOrBody as RigidBodyConfig;
        const bType: RigidBodyType = cfg.type ?? "dynamic";

        // Accurate mass and rotational inertia calculation from shape(s)
        const childColliders = cfg.colliders ?? [];
        const isStaticOrKinematic = bType === "static" || bType === "kinematic";

        let finalMass = isStaticOrKinematic ? 0 : Math.max(0.0001, cfg.mass ?? 1.0);
        let inertia: Matrix3;
        let invInertia: Matrix3;

        if (isStaticOrKinematic) {
          inertia = mat3Diagonal(0, 0, 0);
          invInertia = mat3Diagonal(0, 0, 0);
        } else if (childColliders.length > 0) {
          const compound = computeCompoundMassProperties(
            childColliders,
            cfg.density ?? 1000,
            cfg.mass
          );
          finalMass = compound.mass;
          inertia = compound.inertiaTensor;
          invInertia = compound.invInertiaTensor;
        } else {
          // Single unit sphere inertia fallback
          inertia = computeColliderInertia({ type: "sphere", radius: 1.0 }, finalMass);
          invInertia = mat3Invert(inertia);
        }

        const invMass = isStaticOrKinematic ? 0 : 1 / finalMass;

        const pos = cfg.position
          ? vec3Clone(cfg.position)
          : cfg.transform?.position
          ? vec3Clone(cfg.transform.position)
          : vec3(0, 0, 0);
        const rot = cfg.transform?.rotation ? { ...cfg.transform.rotation } : quatIdentity();
        const scale = cfg.transform?.scale ? vec3Clone(cfg.transform.scale) : vec3(1, 1, 1);

        const mergedUserData: Record<string, unknown> = typeof cfg.userData === "object" && cfg.userData !== null
          ? { ...(cfg.userData as Record<string, unknown>) }
          : {};
        if (cfg.enableCCD !== undefined) {
          mergedUserData.enableCCD = cfg.enableCCD;
        }

        body = {
          id: cfg.id || `body3d_${Math.random().toString(36).substring(2, 9)}`,
          type: bType,
          transform: createTransform3D(pos, rot, scale),
          linearVelocity: cfg.linearVelocity ? vec3Clone(cfg.linearVelocity) : vec3(0, 0, 0),
          angularVelocity: cfg.angularVelocity ? vec3Clone(cfg.angularVelocity) : vec3(0, 0, 0),
          linearFactor: cfg.linearFactor ? vec3Clone(cfg.linearFactor) : vec3(1, 1, 1),
          angularFactor: cfg.angularFactor ? vec3Clone(cfg.angularFactor) : vec3(1, 1, 1),
          force: vec3(0, 0, 0),
          torque: vec3(0, 0, 0),
          mass: finalMass,
          invMass,
          inertiaTensor: inertia,
          invInertiaTensor: invInertia,
          material: createPhysicsMaterial(cfg.material),
          colliders: childColliders,
          isSleeping: false,
          allowSleep: cfg.allowSleep ?? enableSleeping,
          sleepTime: 0,
          linearDamping: cfg.linearDamping ?? 0.01,
          angularDamping: cfg.angularDamping ?? 0.05,
          gravityScale: cfg.gravityScale ?? 1.0,
          userData: mergedUserData,
        };
      }

      bodies.set(body.id, body);

      // Register all child colliders
      for (const col of body.colliders) {
        col.bodyId = body.id;
        colliders.set(col.id, col);
        col.aabb = computeColliderAABB(col, body.transform);
        spatialQuery.register(col);
      }

      emitter.emit("bodyAdded", { body });
      return body;
    },

    removeBody: (bodyId: string): boolean => {
      const body = bodies.get(bodyId);
      if (!body) return false;

      for (const col of body.colliders) {
        colliders.delete(col.id);
        spatialQuery.unregister(col.id);
        emitter.emit("colliderRemoved", { colliderId: col.id });
      }

      bodies.delete(bodyId);
      emitter.emit("bodyRemoved", { bodyId });
      return true;
    },

    getBody: (bodyId: string) => bodies.get(bodyId),
    getAllBodies: () => Array.from(bodies.values()),

    applyForce: (
      bodyId: string,
      force: Vector3,
      relativePoint?: Vector3,
      isWorldSpace: boolean = true
    ): void => {
      const body = bodies.get(bodyId);
      if (!body || body.type !== "dynamic") return;
      internalWakeBody(body);

      const f = isWorldSpace ? force : quatRotateVector(body.transform.rotation, force);
      body.force = vec3Add(body.force, f);

      if (relativePoint) {
        const r = isWorldSpace
          ? relativePoint
          : quatRotateVector(body.transform.rotation, relativePoint);
        const torque = vec3Cross(r, f);
        body.torque = vec3Add(body.torque, torque);
      }
    },

    applyTorque: (bodyId: string, torque: Vector3): void => {
      const body = bodies.get(bodyId);
      if (!body || body.type !== "dynamic") return;
      internalWakeBody(body);
      body.torque = vec3Add(body.torque, torque);
    },

    applyImpulse: (
      bodyId: string,
      impulse: Vector3,
      relativePoint?: Vector3,
      isWorldSpace: boolean = true
    ): void => {
      const body = bodies.get(bodyId);
      if (!body || body.type !== "dynamic") return;
      internalWakeBody(body);

      const j = isWorldSpace ? impulse : quatRotateVector(body.transform.rotation, impulse);
      body.linearVelocity = vec3Add(body.linearVelocity, vec3Scale(j, body.invMass));

      if (relativePoint) {
        const r = isWorldSpace
          ? relativePoint
          : quatRotateVector(body.transform.rotation, relativePoint);
        const torqueImpulse = vec3Cross(r, j);
        const worldInvInertia = computeWorldInvInertiaTensor(
          body.invInertiaTensor,
          body.transform.rotation
        );
        const deltaOmega = mat3TransformVector(worldInvInertia, torqueImpulse);
        body.angularVelocity = vec3Add(body.angularVelocity, deltaOmega);
      }
    },

    applyAngularImpulse: (bodyId: string, angularImpulse: Vector3): void => {
      const body = bodies.get(bodyId);
      if (!body || body.type !== "dynamic") return;
      internalWakeBody(body);

      const worldInvInertia = computeWorldInvInertiaTensor(
        body.invInertiaTensor,
        body.transform.rotation
      );
      const deltaOmega = mat3TransformVector(worldInvInertia, angularImpulse);
      body.angularVelocity = vec3Add(body.angularVelocity, deltaOmega);
    },

    setLinearVelocity: (bodyId: string, velocity: Vector3): void => {
      const body = bodies.get(bodyId);
      if (!body) return;
      body.linearVelocity = vec3Clone(velocity);
      internalWakeBody(body);
    },

    setAngularVelocity: (bodyId: string, angularVelocity: Vector3): void => {
      const body = bodies.get(bodyId);
      if (!body) return;
      body.angularVelocity = vec3Clone(angularVelocity);
      internalWakeBody(body);
    },

    setBodyTransform: (bodyId: string, transform: Transform3D): void => {
      const body = bodies.get(bodyId);
      if (!body) return;
      body.transform = {
        position: vec3Clone(transform.position),
        rotation: { ...transform.rotation },
        scale: vec3Clone(transform.scale),
      };
      internalWakeBody(body);

      for (const col of body.colliders) {
        col.aabb = computeColliderAABB(col, body.transform);
        spatialQuery.update(col);
      }
    },

    setBodyType: (bodyId: string, type: RigidBodyType): void => {
      const body = bodies.get(bodyId);
      if (!body) return;
      body.type = type;

      if (type === "static" || type === "kinematic") {
        body.invMass = 0;
        body.invInertiaTensor = mat3Diagonal(0, 0, 0);
        if (type === "static") {
          body.linearVelocity = vec3(0, 0, 0);
          body.angularVelocity = vec3(0, 0, 0);
        }
      } else {
        body.invMass = 1 / Math.max(0.0001, body.mass);
        body.invInertiaTensor = mat3Invert(body.inertiaTensor);
        internalWakeBody(body);
      }
    },

    setBodyMass: (bodyId: string, mass: number, updateInertia: boolean = true): void => {
      const body = bodies.get(bodyId);
      if (!body || body.type === "static" || body.type === "kinematic") return;

      body.mass = Math.max(0.0001, mass);
      body.invMass = 1 / body.mass;

      if (updateInertia) {
        world.recomputeBodyInertia(bodyId);
      }
      internalWakeBody(body);
    },

    setBodyDensity: (bodyId: string, density: number): void => {
      const body = bodies.get(bodyId);
      if (!body || body.colliders.length === 0) return;

      const compound = computeCompoundMassProperties(body.colliders, density);
      body.mass = compound.mass;
      body.invMass = compound.invMass;
      body.inertiaTensor = compound.inertiaTensor;
      body.invInertiaTensor = compound.invInertiaTensor;
      internalWakeBody(body);
    },

    wakeBody: (bodyId: string): void => {
      const body = bodies.get(bodyId);
      if (body) internalWakeBody(body);
    },

    sleepBody: (bodyId: string): void => {
      const body = bodies.get(bodyId);
      if (body) internalSleepBody(body);
    },

    isBodySleeping: (bodyId: string): boolean => {
      const body = bodies.get(bodyId);
      return body ? body.isSleeping : false;
    },

    recomputeBodyInertia: (bodyId: string): void => {
      const body = bodies.get(bodyId);
      if (!body || body.type === "static" || body.type === "kinematic") return;

      if (body.colliders.length > 0) {
        const compound = computeCompoundMassProperties(
          body.colliders,
          body.material.density ?? 1000,
          body.mass
        );
        body.inertiaTensor = compound.inertiaTensor;
        body.invInertiaTensor = compound.invInertiaTensor;
      } else {
        const inertia = computeSphereInertia(1.0, body.mass);
        body.inertiaTensor = inertia;
        body.invInertiaTensor = mat3Invert(inertia);
      }
    },

    addCollider: (bodyId: string, collider: Collider3D): void => {
      const body = bodies.get(bodyId);
      if (!body) return;

      collider.bodyId = bodyId;
      body.colliders.push(collider);
      colliders.set(collider.id, collider);
      collider.aabb = computeColliderAABB(collider, body.transform);
      spatialQuery.register(collider);

      // Automatically recompute compound inertia if dynamic
      if (body.type === "dynamic") {
        world.recomputeBodyInertia(bodyId);
      }

      emitter.emit("colliderAdded", { collider });
    },

    removeCollider: (colliderId: string): boolean => {
      const col = colliders.get(colliderId);
      if (!col) return false;

      const bodyId = col.bodyId;
      if (bodyId) {
        const body = bodies.get(bodyId);
        if (body) {
          const idx = body.colliders.findIndex((c) => c.id === colliderId);
          if (idx !== -1) body.colliders.splice(idx, 1);
          if (body.type === "dynamic") {
            world.recomputeBodyInertia(bodyId);
          }
        }
      }

      colliders.delete(colliderId);
      spatialQuery.unregister(colliderId);
      emitter.emit("colliderRemoved", { colliderId });
      return true;
    },

    getCollider: (colliderId: string) => colliders.get(colliderId),

    addSoftBody: (softBody: SoftBodyState): void => {
      softBodies.set(softBody.id, softBody);
      emitter.emit("softBodyAdded", { softBody });
    },

    addSoftBody3D: (softBody: SoftBodyState): void => {
      world.addSoftBody(softBody);
    },

    removeSoftBody: (softBodyId: string): boolean => {
      const existed = softBodies.delete(softBodyId);
      if (existed) {
        emitter.emit("softBodyRemoved", { softBodyId });
      }
      return existed;
    },

    removeSoftBody3D: (softBodyId: string): boolean => {
      return world.removeSoftBody(softBodyId);
    },

    getSoftBody: (softBodyId: string) => softBodies.get(softBodyId),
    getSoftBodies: () => Array.from(softBodies.values()),

    addConstraint: (constraint: Constraint3D): void => {
      constraints.set(constraint.id, constraint);
    },

    addConstraint3D: (constraint: Constraint3D): void => {
      world.addConstraint(constraint);
    },

    removeConstraint: (constraintId: string): boolean => {
      return constraints.delete(constraintId);
    },

    removeConstraint3D: (constraintId: string): boolean => {
      return world.removeConstraint(constraintId);
    },

    getConstraint: (constraintId: string) => constraints.get(constraintId),
    getConstraints: () => Array.from(constraints.values()),

    setWind: (wind: Vector3): void => {
      windVector = vec3Clone(wind);
    },

    getWind: (): Vector3 => vec3Clone(windVector),

    raycast: (ray: Ray3D, filter?: SpatialFilter3D): RayHit3D[] => {
      return spatialQuery.raycast(ray, filter, getBodyTransform);
    },

    raycastAny: (ray: Ray3D, filter?: SpatialFilter3D): boolean => {
      return spatialQuery.raycastAny(ray, filter, getBodyTransform);
    },

    queryAABB: (aabb: AABB3D, filter?: SpatialFilter3D): Collider3D[] => {
      return spatialQuery.queryAABB(aabb, filter);
    },

    querySphere: (center: Vector3, radius: number, filter?: SpatialFilter3D): Collider3D[] => {
      return spatialQuery.querySphere(center, radius, filter);
    },

    on: (event, listener) => emitter.on(event, listener),
    off: (event, listener) => emitter.off(event, listener),
    getMetrics: () => ({ ...metrics }),

    asParticipant: (participantId?: string, priority: number = 5): SimulationParticipant => {
      return createPhysics3DParticipant(world, {
        id: participantId,
        priority,
      });
    },
  };

  return world;
}

/**
 * Creates a SimulationParticipant adapter for the Prompt 122 Unified Simulation Coordinator.
 */
export function createPhysics3DParticipant(
  world: PhysicsWorld3D,
  options: { id?: string; priority?: number } = {}
): SimulationParticipant {
  return {
    id: options.id || `participant_${world.id}`,
    type: "physics-3d",
    priority: options.priority ?? 5,
    instance: world,
    step: (dt: number) => {
      world.step(dt);
    },
    pause: () => {
      world.pause();
    },
    resume: () => {
      world.resume();
    },
    reset: () => {
      world.reset();
    },
    dispose: () => {
      world.dispose();
    },
  };
}
