/**
 * AF Motion — Headless Collision & Constraint World Simulation Engine
 *
 * Coordinates rigid bodies, geometric collision detection, constraint solvers,
 * broad-phase AABB spatial partitioning, and deterministic fixed-step integration.
 */

import type {
  PhysicsVector,
  PhysicsValue,
  PhysicsSimulationContext,
  PhysicsLifecycleState,
} from "./types.js";
import type {
  CollisionWorld,
  CollisionWorldOptions,
  CollisionWorldStepResult,
  CollisionBody,
  CollisionBodyConfig,
  CollisionConstraint,
  CollisionConstraintConfig,
  CollisionContact,
} from "./collision-types.js";
import {
  createVector,
  cloneVector,
  addVectors,
  scaleVector,
  isPhysicsVector,
  isPhysicsValue,
} from "./math.js";
import {
  computeBodyAABB,
  aabbOverlap,
  canCollide,
  detectBodyCollision,
} from "./collision-detection.js";
import { resolveContactBatch } from "./collision-response.js";
import { resolveConstraintBatch } from "./collision-constraints.js";
import { PhysicsLifecycleError, PhysicsNumericalError } from "./validation.js";

function toPhysicsVector(val: PhysicsValue | undefined, defaultY = 0): PhysicsVector {
  if (val === undefined) return createVector(0, defaultY);
  if (typeof val === "number") return createVector(val, defaultY);
  return createVector(val.x, val.y ?? defaultY, val.z);
}

let bodyIdSequence = 0;
let constraintIdSequence = 0;

/**
 * Creates an independent, headless collision & constraint world simulation instance.
 */
export function createCollisionWorld(options: CollisionWorldOptions = {}): CollisionWorld {
  let gravity: PhysicsVector = toPhysicsVector(options.gravity, 0);
  const timestep = options.timestep && options.timestep > 0 ? options.timestep : 1 / 60;
  const solverIterations = options.solverIterations && options.solverIterations > 0 ? options.solverIterations : 8;
  const slop = options.slop !== undefined ? options.slop : 0.01;
  const positionalCorrectionPercent = options.positionalCorrectionPercent !== undefined ? options.positionalCorrectionPercent : 0.8;
  const maxSubSteps = options.maxSubSteps && options.maxSubSteps > 0 ? options.maxSubSteps : 10;

  let worldBounds: { min: PhysicsVector; max: PhysicsVector } | undefined = undefined;
  if (options.bounds) {
    worldBounds = {
      min: toPhysicsVector(options.bounds.min, 0),
      max: toPhysicsVector(options.bounds.max, 0),
    };
  }

  const bodies = new Map<string, CollisionBody>();
  const constraints = new Map<string, CollisionConstraint>();
  let activeContacts: CollisionContact[] = [];

  // Lifecycle & timing
  let simulatedTime = 0;
  let tick = 0;
  let accumulator = 0;
  let lastDeltaTime = 0;
  let disposed = false;
  let lifecycle: PhysicsLifecycleState = "idle";

  function assertNotDisposed(method: string): void {
    if (disposed) {
      throw new PhysicsLifecycleError(`Cannot call '${method}' on a disposed CollisionWorld.`);
    }
  }

  function getContext(): PhysicsSimulationContext {
    return {
      time: simulatedTime,
      tick,
      lastDeltaTime,
      accumulator,
      alpha: 0,
      lifecycleState: lifecycle,
    };
  }

  // 1. Body Management
  function addBody(config: CollisionBodyConfig): CollisionBody {
    assertNotDisposed("addBody");
    const id = config.id || `body_${++bodyIdSequence}`;
    const type = config.type || "dynamic";
    const mass = config.mass && config.mass > 0 ? config.mass : 1.0;
    const invMass = type === "static" ? 0 : 1 / mass;

    const body: CollisionBody = {
      id,
      type,
      shape: { ...config.shape },
      position: toPhysicsVector(config.position, 0),
      velocity: toPhysicsVector(config.velocity, 0),
      mass: type === "static" ? Infinity : mass,
      invMass,
      restitution: config.restitution !== undefined ? Math.max(0, Math.min(1, config.restitution)) : 0.8,
      friction: config.friction !== undefined ? Math.max(0, config.friction) : 0.2,
      linearDamping: config.linearDamping !== undefined ? Math.max(0, config.linearDamping) : 0.01,
      isTrigger: Boolean(config.isTrigger),
      layer: config.layer !== undefined ? config.layer : 1,
      mask: config.mask !== undefined ? config.mask : 0xffffffff,
      userData: config.userData,
    };

    bodies.set(id, body);
    return body;
  }

  function removeBody(id: string): boolean {
    assertNotDisposed("removeBody");
    const removed = bodies.delete(id);
    if (removed) {
      // Remove any attached constraints
      for (const [cId, constraint] of constraints.entries()) {
        if (constraint.bodyA.id === id || constraint.bodyB?.id === id) {
          constraints.delete(cId);
        }
      }
    }
    return removed;
  }

  function getBody(id: string): CollisionBody | undefined {
    assertNotDisposed("getBody");
    return bodies.get(id);
  }

  function getBodies(): CollisionBody[] {
    assertNotDisposed("getBodies");
    return Array.from(bodies.values());
  }

  function updateBody(id: string, updates: Partial<CollisionBodyConfig>): boolean {
    assertNotDisposed("updateBody");
    const body = bodies.get(id);
    if (!body) return false;

    if (updates.type !== undefined) {
      body.type = updates.type;
      body.invMass = updates.type === "static" ? 0 : 1 / (updates.mass ?? body.mass);
      body.mass = updates.type === "static" ? Infinity : (updates.mass ?? body.mass);
    }
    if (updates.mass !== undefined && body.type !== "static") {
      body.mass = updates.mass;
      body.invMass = 1 / updates.mass;
    }
    if (updates.shape !== undefined) body.shape = { ...updates.shape };
    if (updates.position !== undefined) body.position = toPhysicsVector(updates.position, 0);
    if (updates.velocity !== undefined) body.velocity = toPhysicsVector(updates.velocity, 0);
    if (updates.restitution !== undefined) body.restitution = Math.max(0, Math.min(1, updates.restitution));
    if (updates.friction !== undefined) body.friction = Math.max(0, updates.friction);
    if (updates.linearDamping !== undefined) body.linearDamping = Math.max(0, updates.linearDamping);
    if (updates.isTrigger !== undefined) body.isTrigger = Boolean(updates.isTrigger);
    if (updates.layer !== undefined) body.layer = updates.layer;
    if (updates.mask !== undefined) body.mask = updates.mask;
    if (updates.userData !== undefined) body.userData = updates.userData;

    return true;
  }

  // 2. Constraint Management
  function addConstraint(config: CollisionConstraintConfig): CollisionConstraint {
    assertNotDisposed("addConstraint");
    const id = config.id || `constraint_${++constraintIdSequence}`;

    const bodyA = typeof config.bodyA === "string" ? bodies.get(config.bodyA) : config.bodyA;
    if (!bodyA) {
      throw new PhysicsNumericalError(`Constraint bodyA not found: ${String(config.bodyA)}`);
    }

    let bodyB: CollisionBody | undefined = undefined;
    if (config.bodyB) {
      bodyB = typeof config.bodyB === "string" ? bodies.get(config.bodyB) : config.bodyB;
      if (!bodyB) {
        throw new PhysicsNumericalError(`Constraint bodyB not found: ${String(config.bodyB)}`);
      }
    }

    let cBounds: { min: PhysicsVector; max: PhysicsVector } | undefined = undefined;
    if (config.bounds) {
      cBounds = {
        min: toPhysicsVector(config.bounds.min, 0),
        max: toPhysicsVector(config.bounds.max, 0),
      };
    }

    const constraint: CollisionConstraint = {
      id,
      type: config.type,
      bodyA,
      bodyB,
      anchor: config.anchor ? toPhysicsVector(config.anchor, 0) : undefined,
      targetDistance: config.targetDistance,
      minDistance: config.minDistance,
      maxDistance: config.maxDistance,
      axis: config.axis,
      bounds: cBounds,
      stiffness: config.stiffness !== undefined ? config.stiffness : 1.0,
      damping: config.damping !== undefined ? config.damping : 0.1,
    };

    constraints.set(id, constraint);
    return constraint;
  }

  function removeConstraint(id: string): boolean {
    assertNotDisposed("removeConstraint");
    return constraints.delete(id);
  }

  function getConstraints(): CollisionConstraint[] {
    assertNotDisposed("getConstraints");
    return Array.from(constraints.values());
  }

  // 3. Collision Detection Pipeline
  function detectCollisions(): CollisionContact[] {
    assertNotDisposed("detectCollisions");
    const bodyList = Array.from(bodies.values());
    const contacts: CollisionContact[] = [];

    // Precompute AABBs for broad-phase
    const aabbs = new Map<string, ReturnType<typeof computeBodyAABB>>();
    for (let i = 0; i < bodyList.length; i++) {
      aabbs.set(bodyList[i].id, computeBodyAABB(bodyList[i]));
    }

    // Pairwise broad + narrow phase
    for (let i = 0; i < bodyList.length; i++) {
      for (let j = i + 1; j < bodyList.length; j++) {
        const a = bodyList[i];
        const b = bodyList[j];

        // 1. Broad-phase layer & mask check
        if (!canCollide(a, b)) continue;

        // 2. Broad-phase AABB overlap test
        const aabbA = aabbs.get(a.id)!;
        const aabbB = aabbs.get(b.id)!;
        if (!aabbOverlap(aabbA, aabbB)) continue;

        // 3. Narrow-phase collision intersection
        const contact = detectBodyCollision(a, b);
        if (contact && contact.collided) {
          contacts.push(contact);
        }
      }
    }

    return contacts;
  }

  function resolveCollisions(contacts?: CollisionContact[]): void {
    assertNotDisposed("resolveCollisions");
    const targetContacts = contacts ?? activeContacts;
    resolveContactBatch(targetContacts, solverIterations, slop, positionalCorrectionPercent);
  }

  function resolveConstraints(dt = timestep): void {
    assertNotDisposed("resolveConstraints");
    resolveConstraintBatch(Array.from(constraints.values()), dt, solverIterations);
  }

  // 4. World Bounds Enforcement
  function enforceWorldBounds(): void {
    if (!worldBounds) return;
    const { min, max } = worldBounds;

    for (const body of bodies.values()) {
      if (body.type === "static") continue;

      // X boundary
      if (body.position.x < min.x) {
        body.position.x = min.x;
        if (body.velocity.x < 0) body.velocity.x = -body.velocity.x * body.restitution;
      } else if (body.position.x > max.x) {
        body.position.x = max.x;
        if (body.velocity.x > 0) body.velocity.x = -body.velocity.x * body.restitution;
      }

      // Y boundary
      if (min.y !== undefined && body.position.y !== undefined && body.position.y < min.y) {
        body.position.y = min.y;
        if (body.velocity.y !== undefined && body.velocity.y < 0) {
          body.velocity.y = -body.velocity.y * body.restitution;
        }
      } else if (max.y !== undefined && body.position.y !== undefined && body.position.y > max.y) {
        body.position.y = max.y;
        if (body.velocity.y !== undefined && body.velocity.y > 0) {
          body.velocity.y = -body.velocity.y * body.restitution;
        }
      }

      // Z boundary
      if (min.z !== undefined && body.position.z !== undefined && body.position.z < min.z) {
        body.position.z = min.z;
        if (body.velocity.z !== undefined && body.velocity.z < 0) {
          body.velocity.z = -body.velocity.z * body.restitution;
        }
      } else if (max.z !== undefined && body.position.z !== undefined && body.position.z > max.z) {
        body.position.z = max.z;
        if (body.velocity.z !== undefined && body.velocity.z > 0) {
          body.velocity.z = -body.velocity.z * body.restitution;
        }
      }
    }
  }

  // 5. Fixed-Step Simulation Loop
  function step(deltaTime = timestep): CollisionWorldStepResult {
    assertNotDisposed("step");
    lastDeltaTime = deltaTime;
    lifecycle = "running";

    accumulator += Math.max(0, deltaTime);
    let stepsTaken = 0;
    activeContacts = [];

    while (accumulator >= timestep && stepsTaken < maxSubSteps) {
      // a) Integrate gravity and linear damping for dynamic bodies
      for (const body of bodies.values()) {
        if (body.type === "static") continue;

        // Apply gravity: v += g * dt
        body.velocity = addVectors(body.velocity, scaleVector(gravity, timestep));

        // Linear damping: v *= (1 - damping * dt)
        if (body.linearDamping > 0) {
          const dampingFactor = Math.max(0, 1 - body.linearDamping * timestep);
          body.velocity = scaleVector(body.velocity, dampingFactor);
        }

        // Integrate positions: p += v * dt
        body.position = addVectors(body.position, scaleVector(body.velocity, timestep));
      }

      // b) Resolve constraints
      resolveConstraints(timestep);

      // c) Detect collisions
      const contacts = detectCollisions();
      activeContacts = contacts;

      // d) Resolve collision impulses & positional penetration
      resolveCollisions(contacts);

      // e) Enforce world boundaries
      enforceWorldBounds();

      tick++;
      simulatedTime += timestep;
      accumulator -= timestep;
      stepsTaken++;
    }

    return {
      contacts: activeContacts,
      stepsTaken,
      context: getContext(),
    };
  }

  // Initial bodies and constraints from options
  if (options.bodies) {
    for (const b of options.bodies) addBody(b);
  }
  if (options.constraints) {
    for (const c of options.constraints) addConstraint(c);
  }

  return {
    addBody,
    removeBody,
    getBody,
    getBodies,
    updateBody,
    addConstraint,
    removeConstraint,
    getConstraints,
    step,
    detectCollisions,
    resolveCollisions,
    resolveConstraints,
    getContacts(): CollisionContact[] {
      assertNotDisposed("getContacts");
      return activeContacts;
    },
    setGravity(newGravity: PhysicsValue): void {
      assertNotDisposed("setGravity");
      gravity = toPhysicsVector(newGravity, 0);
    },
    getGravity(): PhysicsVector {
      assertNotDisposed("getGravity");
      return cloneVector(gravity);
    },
    reset(): void {
      assertNotDisposed("reset");
      simulatedTime = 0;
      tick = 0;
      accumulator = 0;
      activeContacts = [];
      lifecycle = "idle";
    },
    dispose(): void {
      if (disposed) return;
      disposed = true;
      lifecycle = "disposed";
      bodies.clear();
      constraints.clear();
      activeContacts = [];
    },
    isDisposed(): boolean {
      return disposed;
    },
  };
}
