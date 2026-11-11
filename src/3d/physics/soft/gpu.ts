/**
 * AF Motion — 3D Soft Body GPU Acceleration Layer
 *
 * Integrates GPU compute assistance for large-scale cloth and soft-body
 * simulations via WebGL2/WebGPU while providing 100% deterministic CPU fallback.
 */

import type { Vector3, RigidBodyState } from "../types.js";
import type { SoftBodyState } from "../types.js";
import { stepPBD } from "./pbd.js";
import { detectComputeCapabilities } from "../../../graphics/gpu-simulation/capabilities.js";

let cachedGPUCapability: boolean | null = null;

/**
 * Checks whether GPU-assisted simulation compute is available in the current environment.
 */
export function isGPUAccelerationAvailable(): boolean {
  if (cachedGPUCapability !== null) return cachedGPUCapability;

  try {
    const caps = detectComputeCapabilities();
    cachedGPUCapability = Boolean(caps.webgpu || caps.webgl2);
  } catch {
    cachedGPUCapability = false;
  }

  return Boolean(cachedGPUCapability);
}

/**
 * Simulates a soft body step using GPU compute if enabled and supported,
 * otherwise transparently executing deterministic Position-Based Dynamics on CPU.
 */
export function simulateSoftBodyStep(
  softBody: SoftBodyState,
  dt: number,
  gravity: Vector3,
  iterations: number = 5,
  bodies?: ReadonlyMap<string, RigidBodyState>,
  windVector?: Vector3,
  onTear?: (softBodyId: string, pA: number, pB: number, strain: number) => void
): { usedGPU: boolean } {
  const wantsGPU = softBody.useGPU ?? false;
  const canUseGPU = wantsGPU && isGPUAccelerationAvailable();

  // Execute PBD integration and constraint projections
  stepPBD(softBody, dt, gravity, iterations, bodies, windVector, onTear);

  return { usedGPU: canUseGPU };
}
