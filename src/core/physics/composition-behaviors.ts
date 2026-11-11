/**
 * AF Motion — Reusable Physics Motion Behaviors
 *
 * Implements modular motion behaviors: spring dynamics, inertial decay, directional gravity,
 * spatial boundary confinement, hybrid spring-inertia, and multi-force attractors.
 */

import type { PhysicsVector, PhysicsValue } from "./types.js";
import type {
  PhysicsBehavior,
  BehaviorExecutionContext,
} from "./composition-types.js";
import type { CollisionBody } from "./collision-types.js";
import {
  createVector,
  addVectors,
  subVectors,
  scaleVector,
  magnitude,
  dot,
  isPhysicsVector,
} from "./math.js";
import { calculateInertiaAcceleration } from "./inertia-math.js";

let behaviorSequence = 0;

function toVector(val: PhysicsValue | undefined, defaultY = 0): PhysicsVector {
  if (val === undefined) return createVector(0, defaultY);
  if (typeof val === "number") return createVector(val, defaultY);
  return createVector(val.x, val.y ?? defaultY, val.z);
}

/**
 * 1. Spring-Driven Motion Behavior
 */
export interface SpringBehaviorOptions {
  id?: string;
  target: PhysicsValue | string; // coordinate vector or target body ID
  stiffness?: number; // k (default: 170)
  damping?: number;   // c (default: 26)
  precision?: number;
  targetBodyIds?: readonly string[];
}

export function createSpringBehavior(options: SpringBehaviorOptions): PhysicsBehavior {
  const id = options.id || `spring_behavior_${++behaviorSequence}`;
  const stiffness = options.stiffness ?? 170;
  const damping = options.damping ?? 26;
  const precision = options.precision ?? 0.01;

  return {
    id,
    type: "spring",
    priority: 10,
    targetBodyIds: options.targetBodyIds,
    step(context: BehaviorExecutionContext): void {
      const { body, allBodies, dt } = context;
      if (body.type === "static") return;

      let targetPos: PhysicsVector;
      if (typeof options.target === "string") {
        const targetBody = allBodies.get(options.target);
        if (!targetBody) return;
        targetPos = targetBody.position;
      } else {
        targetPos = toVector(options.target);
      }

      const displacement = subVectors(body.position, targetPos);
      const dist = magnitude(displacement);

      if (dist < 1e-6) {
        body.velocity = scaleVector(body.velocity, Math.max(0, 1 - damping * dt));
        return;
      }

      // Spring force: F = -k * x - c * v
      const springForce = scaleVector(displacement, -stiffness);
      const dampForce = scaleVector(body.velocity, -damping);
      const netForce = addVectors(springForce, dampForce);

      // a = F / m
      const acceleration = scaleVector(netForce, body.invMass);
      body.velocity = addVectors(body.velocity, scaleVector(acceleration, dt));
    },
    isSettled(body: CollisionBody): boolean {
      if (typeof options.target === "string") return false;
      const targetPos = toVector(options.target);
      const disp = magnitude(subVectors(body.position, targetPos));
      const speed = magnitude(body.velocity);
      return disp <= precision && speed <= precision;
    },
  };
}

/**
 * 2. Inertial & Resistance Motion Behavior
 */
export interface InertialBehaviorOptions {
  id?: string;
  friction?: number;
  linearFriction?: number;
  drag?: number;
  minVelocity?: number;
  targetBodyIds?: readonly string[];
}

export function createInertialBehavior(options: InertialBehaviorOptions = {}): PhysicsBehavior {
  const id = options.id || `inertia_behavior_${++behaviorSequence}`;
  const friction = options.friction ?? 4.0;
  const linearFriction = options.linearFriction ?? 0;
  const drag = options.drag ?? 0;
  const minVelocity = options.minVelocity ?? 0.05;

  return {
    id,
    type: "inertia",
    priority: 20,
    targetBodyIds: options.targetBodyIds,
    step(context: BehaviorExecutionContext): void {
      const { body, dt } = context;
      if (body.type === "static") return;

      const speed = magnitude(body.velocity);
      if (speed <= minVelocity) {
        body.velocity = createVector(0, body.velocity.y !== undefined ? 0 : undefined, body.velocity.z !== undefined ? 0 : undefined);
        return;
      }

      const { acceleration } = calculateInertiaAcceleration(
        body.velocity,
        body.mass,
        createVector(0, 0),
        friction,
        linearFriction,
        drag,
        createVector(0, 0)
      );

      const accVec = toVector(acceleration as PhysicsValue);
      body.velocity = addVectors(body.velocity, scaleVector(accVec, dt));
    },
    isSettled(body: CollisionBody): boolean {
      return magnitude(body.velocity) <= minVelocity;
    },
  };
}

/**
 * 3. Directional Gravity Behavior
 */
export interface GravityBehaviorOptions {
  id?: string;
  gravity: PhysicsValue;
  targetBodyIds?: readonly string[];
}

export function createGravityBehavior(options: GravityBehaviorOptions): PhysicsBehavior {
  const id = options.id || `gravity_behavior_${++behaviorSequence}`;
  const gVector = toVector(options.gravity);

  return {
    id,
    type: "gravity",
    priority: 5,
    targetBodyIds: options.targetBodyIds,
    step(context: BehaviorExecutionContext): void {
      const { body, dt } = context;
      if (body.type === "static") return;
      body.velocity = addVectors(body.velocity, scaleVector(gVector, dt));
    },
    isSettled(): boolean {
      return false; // Gravity continuously exerts force
    },
  };
}

/**
 * 4. Spatial Bounded Confinement Behavior
 */
export interface BoundedBehaviorOptions {
  id?: string;
  bounds: {
    min: PhysicsValue;
    max: PhysicsValue;
  };
  restitution?: number;
  targetBodyIds?: readonly string[];
}

export function createBoundedBehavior(options: BoundedBehaviorOptions): PhysicsBehavior {
  const id = options.id || `bounded_behavior_${++behaviorSequence}`;
  const min = toVector(options.bounds.min);
  const max = toVector(options.bounds.max);

  return {
    id,
    type: "bounded",
    priority: 50,
    targetBodyIds: options.targetBodyIds,
    step(context: BehaviorExecutionContext): void {
      const { body } = context;
      if (body.type === "static") return;

      const e = options.restitution !== undefined ? options.restitution : body.restitution;

      // X bound
      if (body.position.x < min.x) {
        body.position.x = min.x;
        if (body.velocity.x < 0) body.velocity.x = -body.velocity.x * e;
      } else if (body.position.x > max.x) {
        body.position.x = max.x;
        if (body.velocity.x > 0) body.velocity.x = -body.velocity.x * e;
      }

      // Y bound
      if (min.y !== undefined && body.position.y !== undefined && body.position.y < min.y) {
        body.position.y = min.y;
        if (body.velocity.y !== undefined && body.velocity.y < 0) body.velocity.y = -body.velocity.y * e;
      } else if (max.y !== undefined && body.position.y !== undefined && body.position.y > max.y) {
        body.position.y = max.y;
        if (body.velocity.y !== undefined && body.velocity.y > 0) body.velocity.y = -body.velocity.y * e;
      }

      // Z bound
      if (min.z !== undefined && body.position.z !== undefined && body.position.z < min.z) {
        body.position.z = min.z;
        if (body.velocity.z !== undefined && body.velocity.z < 0) body.velocity.z = -body.velocity.z * e;
      } else if (max.z !== undefined && body.position.z !== undefined && body.position.z > max.z) {
        body.position.z = max.z;
        if (body.velocity.z !== undefined && body.velocity.z > 0) body.velocity.z = -body.velocity.z * e;
      }
    },
  };
}

/**
 * 5. Collision Integration Behavior
 */
export interface CollisionBehaviorOptions {
  id?: string;
  targetBodyIds?: readonly string[];
}

export function createCollisionBehavior(options: CollisionBehaviorOptions = {}): PhysicsBehavior {
  const id = options.id || `collision_behavior_${++behaviorSequence}`;
  return {
    id,
    type: "collision",
    priority: 40,
    targetBodyIds: options.targetBodyIds,
    step(context: BehaviorExecutionContext): void {
      if (context.world) {
        const contacts = context.world.detectCollisions();
        context.world.resolveCollisions(contacts);
      }
    },
  };
}

/**
 * 6. Constrained Motion Behavior
 */
export interface ConstrainedBehaviorOptions {
  id?: string;
  targetBodyIds?: readonly string[];
}

export function createConstrainedBehavior(options: ConstrainedBehaviorOptions = {}): PhysicsBehavior {
  const id = options.id || `constrained_behavior_${++behaviorSequence}`;
  return {
    id,
    type: "constrained",
    priority: 30,
    targetBodyIds: options.targetBodyIds,
    step(context: BehaviorExecutionContext): void {
      if (context.world) {
        context.world.resolveConstraints(context.dt);
      }
    },
  };
}

/**
 * 7. Hybrid Spring + Inertia Behavior
 *
 * Pulls body toward an equilibrium target via spring force while simultaneously
 * simulating fluid drag and velocity momentum persistence.
 */
export interface SpringInertiaBehaviorOptions {
  id?: string;
  target: PhysicsValue;
  stiffness?: number;
  damping?: number;
  friction?: number;
  drag?: number;
  targetBodyIds?: readonly string[];
}

export function createSpringInertiaBehavior(options: SpringInertiaBehaviorOptions): PhysicsBehavior {
  const id = options.id || `hybrid_behavior_${++behaviorSequence}`;
  const targetPos = toVector(options.target);
  const stiffness = options.stiffness ?? 150;
  const damping = options.damping ?? 20;
  const friction = options.friction ?? 1.5;
  const drag = options.drag ?? 0.005;

  return {
    id,
    type: "hybrid",
    priority: 15,
    targetBodyIds: options.targetBodyIds,
    step(context: BehaviorExecutionContext): void {
      const { body, dt } = context;
      if (body.type === "static") return;

      // 1. Spring displacement pull
      const disp = subVectors(body.position, targetPos);
      const springF = scaleVector(disp, -stiffness);

      // 2. Viscous and aerodynamic drag forces
      const speed = magnitude(body.velocity);
      const dampF = scaleVector(body.velocity, -damping);
      const viscousF = scaleVector(body.velocity, -friction * body.mass);
      const dragF = speed > 0 ? scaleVector(body.velocity, -drag * speed * speed) : createVector(0, 0);

      // Net force
      const netForce = addVectors(addVectors(springF, dampF), addVectors(viscousF, dragF));
      const acc = scaleVector(netForce, body.invMass);

      body.velocity = addVectors(body.velocity, scaleVector(acc, dt));
    },
    isSettled(body: CollisionBody): boolean {
      const disp = magnitude(subVectors(body.position, targetPos));
      const speed = magnitude(body.velocity);
      return disp <= 0.02 && speed <= 0.02;
    },
  };
}

/**
 * 8. Multi-Force Field Behavior
 */
export type DynamicForceGenerator = (body: CollisionBody, context: BehaviorExecutionContext) => PhysicsVector;

export interface MultiForceBehaviorOptions {
  id?: string;
  forces: DynamicForceGenerator[];
  targetBodyIds?: readonly string[];
}

export function createMultiForceBehavior(options: MultiForceBehaviorOptions): PhysicsBehavior {
  const id = options.id || `multiforce_behavior_${++behaviorSequence}`;

  return {
    id,
    type: "multi-force",
    priority: 8,
    targetBodyIds: options.targetBodyIds,
    step(context: BehaviorExecutionContext): void {
      const { body, dt } = context;
      if (body.type === "static") return;

      let totalForce = createVector(0, 0);
      for (const forceFn of options.forces) {
        const f = forceFn(body, context);
        totalForce = addVectors(totalForce, f);
      }

      const acc = scaleVector(totalForce, body.invMass);
      body.velocity = addVectors(body.velocity, scaleVector(acc, dt));
    },
  };
}
