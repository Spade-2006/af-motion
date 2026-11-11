/**
 * AF Motion — Multi-Dimensional Capability Scoring
 *
 * Computes deterministic, explainable 0–100 scores across CPU, Memory, GPU,
 * Graphics Features, Worker, and Rendering dimensions with confidence levels and signals.
 */

import type {
  CapabilityScores,
  DimensionScore,
  CpuCapabilityInfo,
  MemoryCapabilityInfo,
  WebGLCapabilitiesInfo,
  WebGPUCapabilitiesInfo,
  DisplayCapabilityInfo,
  RuntimeEnvironmentInfo,
} from "./types.js";

/**
 * Calculates multi-dimensional capability scores based on detected device characteristics.
 */
export function calculateCapabilityScores(profile: {
  runtime: RuntimeEnvironmentInfo;
  cpu: CpuCapabilityInfo;
  memory: MemoryCapabilityInfo;
  webgl: WebGLCapabilitiesInfo;
  webgpu: WebGPUCapabilitiesInfo;
  display: DisplayCapabilityInfo;
}): CapabilityScores {
  const { runtime, cpu, memory, webgl, webgpu, display } = profile;

  // 1. CPU Score
  const concurrency = cpu.concurrency.value;
  const wasm = cpu.wasmSupported.value;
  const sab = cpu.sharedArrayBuffer.value;

  const cpuSignals: string[] = [];
  const cpuMissing: string[] = [];
  let cpuScore = 20; // baseline

  if (cpu.concurrency.status === "detected") {
    cpuSignals.push(`${concurrency} logical CPU cores`);
    cpuScore += Math.min(50, concurrency * 6);
  } else {
    cpuMissing.push("Hardware concurrency unknown");
  }

  if (wasm) {
    cpuSignals.push("WebAssembly supported");
    cpuScore += 15;
  }
  if (sab) {
    cpuSignals.push("SharedArrayBuffer supported");
    cpuScore += 15;
  }

  const cpuDim: DimensionScore = {
    score: Math.min(100, Math.max(0, cpuScore)),
    confidence: cpu.concurrency.status === "detected" ? "high" : "low",
    supportingSignals: cpuSignals,
    missingInformation: cpuMissing,
    rationale: `CPU rating based on ${concurrency} cores, WASM (${wasm}), and SAB (${sab}).`,
  };

  // 2. Memory Score
  const memGB = memory.deviceMemoryGB.value;
  const heapLimit = memory.jsHeapLimitMB.value;
  const memSignals: string[] = [];
  const memMissing: string[] = [];
  let memScore = 30; // baseline

  if (memGB !== null) {
    memSignals.push(`${memGB}GB device memory`);
    memScore += Math.min(50, memGB * 7);
  } else {
    memMissing.push("Navigator deviceMemory not exposed");
  }

  if (heapLimit !== null) {
    memSignals.push(`${heapLimit}MB JS heap limit`);
    memScore += Math.min(20, Math.round(heapLimit / 200));
  } else {
    memMissing.push("Performance heap metrics not exposed");
  }

  const memDim: DimensionScore = {
    score: Math.min(100, Math.max(0, memScore)),
    confidence: memGB !== null ? "high" : "medium",
    supportingSignals: memSignals,
    missingInformation: memMissing,
    rationale: memGB !== null ? `Device has ~${memGB}GB accessible RAM.` : "Estimated memory capacity.",
  };

  // 3. GPU Score
  const hasWebGL2 = webgl.webgl2.value;
  const hasWebGPU = webgpu.apiAvailable.value;
  const maxTex = webgl.maxTextureSize.value;
  const gpuSignals: string[] = [];
  const gpuMissing: string[] = [];
  let gpuScore = 10;

  if (hasWebGPU) {
    gpuSignals.push("WebGPU API available");
    gpuScore += 30;
  }
  if (hasWebGL2) {
    gpuSignals.push("WebGL2 available");
    gpuScore += 35;
  } else if (webgl.webgl1.value) {
    gpuSignals.push("WebGL1 available");
    gpuScore += 15;
  } else {
    gpuMissing.push("No hardware WebGL context");
  }

  if (maxTex >= 8192) {
    gpuSignals.push(`High max texture size (${maxTex}px)`);
    gpuScore += 25;
  } else if (maxTex >= 4096) {
    gpuSignals.push(`Standard max texture size (${maxTex}px)`);
    gpuScore += 15;
  } else if (maxTex > 0) {
    gpuSignals.push(`Limited max texture size (${maxTex}px)`);
    gpuScore += 5;
  }

  const gpuDim: DimensionScore = {
    score: Math.min(100, Math.max(0, gpuScore)),
    confidence: webgl.webgl1.status === "detected" ? "high" : "low",
    supportingSignals: gpuSignals,
    missingInformation: gpuMissing,
    rationale: `GPU capability based on ${hasWebGPU ? "WebGPU + " : ""}${hasWebGL2 ? "WebGL2" : "WebGL1"} with ${maxTex}px texture ceiling.`,
  };

  // 4. Graphics Features Score
  const floatTex = webgl.floatTextures.value;
  const instancing = webgl.instancing.value;
  const timerQuery = webgl.timerQuery.value;
  const aniso = webgl.maxAnisotropy.value;
  const featSignals: string[] = [];
  const featMissing: string[] = [];
  let featScore = 20;

  if (floatTex) {
    featSignals.push("Float textures");
    featScore += 25;
  } else {
    featMissing.push("Float textures unsupported");
  }

  if (instancing) {
    featSignals.push("Hardware instancing");
    featScore += 25;
  }

  if (aniso > 1) {
    featSignals.push(`Anisotropic filtering (${aniso}x)`);
    featScore += 15;
  }

  if (timerQuery) {
    featSignals.push("GPU timer queries");
    featScore += 15;
  }

  const featDim: DimensionScore = {
    score: Math.min(100, Math.max(0, featScore)),
    confidence: "high",
    supportingSignals: featSignals,
    missingInformation: featMissing,
    rationale: `Features rating based on floating-point textures, instancing, and anisotropic filtering.`,
  };

  // 5. Worker Score
  const workerAvail = cpu.workerAvailable.value;
  const offscreen = runtime.offscreenCanvasSupported.value;
  const workerSignals: string[] = [];
  const workerMissing: string[] = [];
  let workerScore = 0;

  if (workerAvail) {
    workerSignals.push("Web Workers available");
    workerScore += 60;
  } else {
    workerMissing.push("Web Workers unavailable");
  }

  if (offscreen) {
    workerSignals.push("OffscreenCanvas supported");
    workerScore += 40;
  } else {
    workerMissing.push("OffscreenCanvas unsupported");
  }

  const workerDim: DimensionScore = {
    score: workerScore,
    confidence: "high",
    supportingSignals: workerSignals,
    missingInformation: workerMissing,
    rationale: `Worker rating based on Worker (${workerAvail}) and OffscreenCanvas (${offscreen}).`,
  };

  // 6. Rendering Composite Score
  const dpr = display.dpr.value;
  const renderingScore = Math.round(
    gpuDim.score * 0.4 +
    featDim.score * 0.25 +
    cpuDim.score * 0.2 +
    memDim.score * 0.15
  );

  const renderingDim: DimensionScore = {
    score: renderingScore,
    confidence: "high",
    supportingSignals: [`DPR: ${dpr}`, ...gpuDim.supportingSignals],
    missingInformation: [],
    rationale: "Composite rendering suitability score.",
  };

  // Overall Weighted Score
  const overallScore = Math.round(
    gpuDim.score * 0.35 +
    cpuDim.score * 0.25 +
    memDim.score * 0.15 +
    featDim.score * 0.15 +
    workerDim.score * 0.1
  );

  return {
    cpu: cpuDim,
    memory: memDim,
    gpu: gpuDim,
    graphicsFeatures: featDim,
    worker: workerDim,
    rendering: renderingDim,
    overallScore,
  };
}
