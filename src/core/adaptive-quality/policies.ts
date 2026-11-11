/**
 * AF Motion — System-Specific Quality Adaptation Policies
 *
 * Concrete adapters transforming unified quality values into actionable runtime parameters
 * for 3D Scenes, Particles, Fluid, Environmental, GPU Simulation, Physics, and Model LOD.
 */

import type {
  QualityValues,
  System3DQualityPolicy,
  SystemParticlesQualityPolicy,
  SystemFluidQualityPolicy,
  SystemEnvironmentQualityPolicy,
  SystemGpuSimulationQualityPolicy,
  SystemPhysicsQualityPolicy,
  SystemModelLodQualityPolicy,
  SystemQualityPolicies,
} from "./types.js";

/**
 * Derives 3D scene rendering policy.
 */
export function get3DQualityPolicy(values: QualityValues): System3DQualityPolicy {
  let shadowRes = 0;
  if (values.shadowQuality === "high") shadowRes = 2048;
  else if (values.shadowQuality === "medium") shadowRes = 1024;
  else if (values.shadowQuality === "low") shadowRes = 512;

  let maxLights = 2;
  if (values.lightingQuality === "advanced") maxLights = 8;
  else if (values.lightingQuality === "standard") maxLights = 4;

  let maxDrawCalls = 30;
  if (values.geometryDetail === "ultra") maxDrawCalls = 500;
  else if (values.geometryDetail === "high") maxDrawCalls = 200;
  else if (values.geometryDetail === "medium") maxDrawCalls = 80;

  return {
    maxLodLevel: values.modelLod,
    shadowResolution: shadowRes,
    shadowsEnabled: values.shadowQuality !== "disabled",
    maxLights,
    pbrMaterials: values.materialQuality === "pbr",
    antialiasing: values.geometryDetail === "ultra" || values.geometryDetail === "high",
    maxDrawCalls,
  };
}

/**
 * Derives Particle system simulation and rendering policy.
 */
export function getParticlesQualityPolicy(values: QualityValues): SystemParticlesQualityPolicy {
  return {
    activeCountMultiplier: values.particleDensity,
    maxActiveParticles: Math.round(50000 * values.particleDensity),
    spawnRateFactor: values.particleDensity,
    updateFrequency: values.particleDensity < 0.4 ? 2 : 1,
    useInstancing: values.geometryDetail !== "low",
  };
}

/**
 * Derives Fluid solver resolution and iteration policy.
 */
export function getFluidQualityPolicy(values: QualityValues): SystemFluidQualityPolicy {
  return {
    gridResolutionScale: values.fluidResolution,
    solverIterations: Math.round(20 * values.fluidResolution) + 10,
    updateFrequency: values.fluidResolution < 0.4 ? 2 : 1,
    highPrecision: values.fluidResolution >= 0.8,
  };
}

/**
 * Derives Environmental effects policy.
 */
export function getEnvironmentQualityPolicy(values: QualityValues): SystemEnvironmentQualityPolicy {
  let rainFactor = 0.3;
  if (values.environmentalDetail === "high") rainFactor = 1.0;
  else if (values.environmentalDetail === "medium") rainFactor = 0.6;

  let fireParticles = 200;
  if (values.environmentalDetail === "high") fireParticles = 1000;
  else if (values.environmentalDetail === "medium") fireParticles = 500;

  return {
    rainSnowDensityFactor: rainFactor,
    fogQuality: values.environmentalDetail,
    cloudsEnabled: values.environmentalDetail !== "low",
    cloudDetail: values.environmentalDetail,
    fireSmokeMaxParticles: fireParticles,
  };
}

/**
 * Derives GPU Simulation compute backend and buffer policy.
 */
export function getGpuSimulationQualityPolicy(
  values: QualityValues
): SystemGpuSimulationQualityPolicy {
  return {
    preferredBackend: values.gpuSimulationQuality,
    workgroupSize: values.gpuSimulationQuality === "webgpu" ? 256 : 128,
    maxComputeBufferBytes:
      values.gpuSimulationQuality === "webgpu" ? 64 * 1024 * 1024 : 16 * 1024 * 1024,
    allowCpuFallback: true,
  };
}

/**
 * Derives Physics simulation frequency and solver policy.
 * Preserves physics invariants and never alters critical correctness.
 */
export function getPhysicsQualityPolicy(values: QualityValues): SystemPhysicsQualityPolicy {
  const hz = values.physicsFrequency;
  const substeps = hz >= 120 ? 4 : hz >= 60 ? 2 : 1;
  const iterations = hz >= 60 ? 10 : 6;

  return {
    substeps,
    simulationHz: hz,
    solverIterations: iterations,
    enableSleeping: true,
    throttleNonCritical: hz <= 30,
  };
}

/**
 * Derives Model LOD decimation and simplification policy.
 */
export function getModelLodQualityPolicy(values: QualityValues): SystemModelLodQualityPolicy {
  const lodIdx = values.modelLod;
  const ratio = lodIdx === 0 ? 1.0 : lodIdx === 1 ? 0.5 : lodIdx === 2 ? 0.25 : 0.1;
  const distMult = lodIdx === 0 ? 1.0 : lodIdx === 1 ? 0.8 : 0.6;

  return {
    distanceMultiplier: distMult,
    targetTriangleRatio: ratio,
    maxLODIndex: lodIdx,
    allowSimplification: lodIdx > 0,
  };
}

/**
 * Combines all individual system policies into a single snapshot.
 */
export function aggregateSystemPolicies(values: QualityValues): SystemQualityPolicies {
  return {
    scene3d: get3DQualityPolicy(values),
    particles: getParticlesQualityPolicy(values),
    fluid: getFluidQualityPolicy(values),
    environment: getEnvironmentQualityPolicy(values),
    gpuSimulation: getGpuSimulationQualityPolicy(values),
    physics: getPhysicsQualityPolicy(values),
    modelLod: getModelLodQualityPolicy(values),
  };
}
