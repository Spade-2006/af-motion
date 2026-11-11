/**
 * AF Motion GPU Simulation Architecture — Compute Pipeline
 *
 * Provides typed compute pipeline creation, shader binding layout validation,
 * and lifecycle tracking across WebGPU, WebGL2, and CPU backends.
 */

import { validateShaderDescriptor } from "./shaders.js";
import type {
  ComputeDevice,
  ComputePipeline,
  ComputePipelineDescriptor,
} from "./types.js";

/**
 * Validates a compute pipeline descriptor before creation.
 */
export function validatePipelineDescriptor(descriptor: ComputePipelineDescriptor): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!descriptor) {
    errors.push("Pipeline descriptor cannot be null or undefined");
    return { valid: false, errors };
  }

  const shaderValidation = validateShaderDescriptor(descriptor.shader);
  if (!shaderValidation.valid) {
    errors.push(...shaderValidation.errors);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Creates and registers a compute pipeline on the target compute device.
 */
export function createComputePipeline(
  device: ComputeDevice,
  descriptor: ComputePipelineDescriptor,
): ComputePipeline {
  const validation = validatePipelineDescriptor(descriptor);
  if (!validation.valid) {
    throw new Error(`Invalid compute pipeline descriptor: ${validation.errors.join("; ")}`);
  }

  return device.createPipeline(descriptor);
}
