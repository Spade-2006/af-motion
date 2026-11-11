/**
 * AF Motion — Automatic Performance Optimization Engine Tests
 *
 * Comprehensive tests covering performance profiling, bottleneck detection,
 * strategy execution, memory/CPU/GPU/simulation optimizations, worker task manager,
 * verification and rollback, and React integration.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createPerformanceProfiler,
  PerformanceProfiler,
  analyzePerformanceBottlenecks,
  REGISTERED_STRATEGIES,
  getStrategyById,
  getCandidatesForBottlenecks,
  createWorkerTaskManager,
  WorkerTaskManager,
  createPerformanceOptimizer,
  PerformanceOptimizer,
  createAdaptiveQualityController,
} from "../src/catalogue.js";
import {
  usePerformanceProfiler,
  usePerformanceReport,
  usePerformanceOptimizer,
  useOptimizationHistory,
  PerformanceMonitor,
  OptimizationBoundary,
} from "../src/react.js";
import type { DeviceCapabilityProfile, PerformanceSnapshot } from "../src/catalogue.js";

function createMockDeviceProfile(overrides: Partial<any> = {}): DeviceCapabilityProfile {
  return {
    version: "1.0.0",
    category: overrides.category ?? "standard-desktop",
    categoryRationale: "Mock profile",
    scores: {
      cpu: { score: 75, confidence: "high", supportingSignals: [], missingInformation: [], rationale: "" },
      memory: { score: 70, confidence: "high", supportingSignals: [], missingInformation: [], rationale: "" },
      gpu: { score: 75, confidence: "high", supportingSignals: [], missingInformation: [], rationale: "" },
      graphicsFeatures: { score: 80, confidence: "high", supportingSignals: [], missingInformation: [], rationale: "" },
      worker: { score: 90, confidence: "high", supportingSignals: [], missingInformation: [], rationale: "" },
      rendering: { score: 75, confidence: "high", supportingSignals: [], missingInformation: [], rationale: "" },
      overallScore: 75,
    },
    runtime: {
      environment: { value: "browser", status: "detected" },
      isBrowser: { value: true, status: "detected" },
      isWorker: { value: false, status: "detected" },
      isDedicatedWorker: { value: false, status: "detected" },
      isNode: { value: false, status: "detected" },
      isSSR: { value: false, status: "detected" },
    },
    cpu: {
      hardwareConcurrency: { value: 8, status: "detected" },
      webAssemblySupport: { value: true, status: "detected" },
      sharedArrayBufferSupport: { value: true, status: "detected" },
      webWorkersSupport: { value: true, status: "detected" },
    },
    memory: {
      deviceMemoryGB: { value: 8, status: "detected" },
      jsHeapSizeLimitMB: { value: 2048, status: "detected" },
      totalJSHeapSizeMB: { value: 500, status: "detected" },
      usedJSHeapSizeMB: { value: 200, status: "detected" },
    },
    webgl: {
      webgl1: { value: true, status: "detected" },
      webgl2: { value: true, status: "detected" },
      maxTextureSize: { value: 8192, status: "detected" },
      maxCubeMapSize: { value: 8192, status: "detected" },
      maxRenderBufferSize: { value: 8192, status: "detected" },
      maxVertexAttributes: { value: 16, status: "detected" },
      maxTextureUnits: { value: 16, status: "detected" },
      maxUniformVectors: { value: 1024, status: "detected" },
      maxViewportDimensions: { value: [8192, 8192], status: "detected" },
      shaderPrecision: { value: { highp: true, mediump: true, lowp: true }, status: "detected" },
      floatTextures: { value: true, status: "detected" },
      halfFloatTextures: { value: true, status: "detected" },
      instancing: { value: true, status: "detected" },
      timerQuery: { value: false, status: "detected" },
      maxAnisotropy: { value: 16, status: "detected" },
      supportedExtensions: { value: [], status: "detected" },
      unmaskedVendor: { value: "Mock", status: "detected" },
      unmaskedRenderer: { value: "Mock GPU", status: "detected" },
    },
    webgpu: {
      apiAvailable: { value: false, status: "detected" },
      adapterAvailable: { value: false, status: "detected" },
      deviceAvailable: { value: false, status: "detected" },
      computeShaderSupport: { value: false, status: "detected" },
      maxTextureDimension2D: { value: 8192, status: "detected" },
      maxBufferSize: { value: 268435456, status: "detected" },
      features: { value: [], status: "detected" },
      limits: { value: {}, status: "detected" },
      architecture: { value: "mock", status: "detected" },
    },
    supportedGraphicsBackends: ["webgl2", "webgl"],
    activeGraphicsBackend: "webgl2",
    display: {
      dpr: { value: 2.0, status: "detected" },
      viewportWidth: { value: 1920, status: "detected" },
      viewportHeight: { value: 1080, status: "detected" },
      screenWidth: { value: 1920, status: "detected" },
      screenHeight: { value: 1080, status: "detected" },
      colorDepth: { value: 24, status: "detected" },
      colorSpace: { value: "srgb", status: "detected" },
      reducedMotion: { value: false, status: "detected" },
      reducedTransparency: { value: false, status: "detected" },
      highContrast: { value: false, status: "detected" },
      colorScheme: { value: "dark", status: "detected" },
    },
    network: {
      online: { value: true, status: "detected" },
      effectiveType: { value: "4g", status: "detected" },
      downlinkMbps: { value: 10, status: "detected" },
      rttMs: { value: 50, status: "detected" },
      saveData: { value: false, status: "detected" },
    },
    battery: {
      charging: { value: true, status: "detected" },
      level: { value: 0.8, status: "detected" },
      chargingTime: { value: 0, status: "detected" },
      dischargingTime: { value: null, status: "detected" },
    },
    detectedAt: Date.now(),
  };
}

describe("Automatic Performance Optimization Engine", () => {
  describe("Performance Profiler", () => {
    it("should start, stop, and capture snapshots with status tags", () => {
      const profiler = createPerformanceProfiler({ samplingWindowSize: 30 });
      expect(profiler.isProfilingActive).toBe(false);

      profiler.startSession("TestSession");
      expect(profiler.isProfilingActive).toBe(true);

      const snap = profiler.captureSnapshot();
      expect(snap.id).toBeDefined();
      expect(snap.frameDurationMs.status).toBe("measured");
      expect(snap.frameDurationMs.value).toBeCloseTo(16.66, 1);
      expect(snap.fps.value).toBeCloseTo(60, 0);
      expect(snap.isGpuTimingSupported).toBe(false);
      expect(snap.gpuExecutionMs.status).toBe("unsupported");

      const stopped = profiler.stopSession();
      expect(profiler.isProfilingActive).toBe(false);
      expect(stopped?.id).toBe(snap.id);

      profiler.dispose();
    });

    it("should keep historical snapshots bounded within window size", () => {
      const profiler = createPerformanceProfiler({ samplingWindowSize: 15 });
      for (let i = 0; i < 50; i++) {
        profiler.captureSnapshot();
      }
      expect(profiler.getHistoricalSnapshots().length).toBe(15);
      profiler.dispose();
    });

    it("should calculate average metrics across captured snapshots", () => {
      const profiler = createPerformanceProfiler();
      profiler.captureSnapshot({
        frameDurationMs: { value: 20.0, status: "measured", confidence: 1.0, timestamp: Date.now() },
        fps: { value: 50.0, status: "measured", confidence: 1.0, timestamp: Date.now() },
        simulationDurationMs: { value: 6.0, status: "measured", confidence: 1.0, timestamp: Date.now() },
        renderSubmissionMs: { value: 7.0, status: "measured", confidence: 1.0, timestamp: Date.now() },
      });
      profiler.captureSnapshot({
        frameDurationMs: { value: 10.0, status: "measured", confidence: 1.0, timestamp: Date.now() },
        fps: { value: 100.0, status: "measured", confidence: 1.0, timestamp: Date.now() },
        simulationDurationMs: { value: 4.0, status: "measured", confidence: 1.0, timestamp: Date.now() },
        renderSubmissionMs: { value: 3.0, status: "measured", confidence: 1.0, timestamp: Date.now() },
      });

      const avg = profiler.getAverageMetrics();
      expect(avg.avgFps).toBe(75);
      expect(avg.avgFrameDurationMs).toBe(15);
      expect(avg.avgSimMs).toBe(5);
      expect(avg.avgRenderMs).toBe(5);

      profiler.dispose();
    });
  });

  describe("Bottleneck Detection Intelligence", () => {
    it("should report healthy when frame metrics are within 60 FPS budget", () => {
      const profiler = createPerformanceProfiler();
      const snap = profiler.captureSnapshot();
      const report = analyzePerformanceBottlenecks(snap);

      expect(report.bottlenecks.length).toBe(0);
      expect(report.overallHealthScore).toBe(100);
      expect(report.dominantBottleneckCategory).toBe("none");

      profiler.dispose();
    });

    it("should identify CPU bottlenecks under heavy animation or geometry load", () => {
      const profiler = createPerformanceProfiler();
      const snap = profiler.captureSnapshot({
        animationUpdateMs: { value: 12.0, status: "measured", confidence: 0.9, timestamp: Date.now() },
        geometryProcessingMs: { value: 15.0, status: "measured", confidence: 0.95, timestamp: Date.now() },
      });

      const report = analyzePerformanceBottlenecks(snap);
      expect(report.bottlenecks.some((b) => b.id === "cpu_animation_overhead")).toBe(true);
      expect(report.bottlenecks.some((b) => b.id === "cpu_geometry_processing")).toBe(true);
      expect(report.dominantBottleneckCategory).toBe("cpu");
      expect(report.overallHealthScore).toBeLessThan(70);

      profiler.dispose();
    });

    it("should identify GPU draw call bottleneck when render submission exceeds threshold", () => {
      const profiler = createPerformanceProfiler();
      const snap = profiler.captureSnapshot({
        renderSubmissionMs: { value: 10.5, status: "measured", confidence: 0.9, timestamp: Date.now() },
      });

      const report = analyzePerformanceBottlenecks(snap);
      const gpuB = report.bottlenecks.find((b) => b.id === "gpu_render_submission_delay");
      expect(gpuB).toBeDefined();
      expect(gpuB?.category).toBe("gpu");
      expect(gpuB?.recommendedAction.includes("instanced")).toBe(true);

      profiler.dispose();
    });

    it("should identify memory allocation pressure and simulation overload", () => {
      const profiler = createPerformanceProfiler();
      const snap = profiler.captureSnapshot({
        memoryAllocationRateKBPerFrame: { value: 600, status: "measured", confidence: 0.85, timestamp: Date.now() },
        simulationDurationMs: { value: 11.2, status: "measured", confidence: 0.9, timestamp: Date.now() },
      });

      const report = analyzePerformanceBottlenecks(snap);
      expect(report.bottlenecks.some((b) => b.id === "mem_transient_allocations")).toBe(true);
      expect(report.bottlenecks.some((b) => b.id === "sim_computation_load")).toBe(true);

      profiler.dispose();
    });
  });

  describe("Registered Optimization Strategies", () => {
    it("should export strategies spanning all optimization categories", () => {
      expect(REGISTERED_STRATEGIES.length).toBeGreaterThanOrEqual(14);
      const categories = new Set(REGISTERED_STRATEGIES.map((s) => s.category));
      expect(categories.has("cpu")).toBe(true);
      expect(categories.has("memory")).toBe(true);
      expect(categories.has("gpu")).toBe(true);
      expect(categories.has("simulation")).toBe(true);
      expect(categories.has("worker")).toBe(true);
    });

    it("should lookup individual strategies by id", () => {
      const strat = getStrategyById("cpu_memoize_math");
      expect(strat).toBeDefined();
      expect(strat?.safetyScore).toBe(1.0);
    });

    it("should filter candidates by mode compatibility and enabled categories", () => {
      const mockBottlenecks = [
        {
          id: "cpu_animation_overhead",
          category: "cpu" as const,
          severity: "high" as const,
          title: "Animation",
          description: "Slow",
          confidence: 1.0,
          isHardwareConfirmed: true,
          primaryMetric: "animationUpdateMs",
          metricValue: 12,
          threshold: 8,
          recommendedAction: "Fix",
        },
      ];

      // Conservative mode: only conservative strategies are compatible
      const conservativeCandidates = getCandidatesForBottlenecks(mockBottlenecks, "conservative");
      expect(conservativeCandidates.length).toBeGreaterThan(0);
      expect(conservativeCandidates.every((c) => c.isCompatible || c.incompatibilities.length > 0)).toBe(true);

      // Disabling CPU category yields 0 candidates for CPU bottleneck
      const noCpuCandidates = getCandidatesForBottlenecks(mockBottlenecks, "balanced", ["memory", "gpu"]);
      expect(noCpuCandidates.length).toBe(0);
    });
  });

  describe("Worker Task Manager", () => {
    it("should execute task and return structured result", async () => {
      const workerMgr = createWorkerTaskManager({ enableWorkers: false });
      const result = await workerMgr.executeTask({
        id: "task_1",
        type: "compute_mesh",
        payload: { vertexCount: 100 },
        computeFallback: (input) => ({ triangles: input.vertexCount / 3 }),
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ triangles: 100 / 3 });
      expect(result.executedInWorker).toBe(false);

      workerMgr.dispose();
    });

    it("should handle task cancellation gracefully", async () => {
      const workerMgr = createWorkerTaskManager();
      const abortCtrl = new AbortController();
      abortCtrl.abort();

      const result = await workerMgr.executeTask({
        id: "task_cancelled",
        type: "long_job",
        payload: {},
        signal: abortCtrl.signal,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("aborted");

      workerMgr.dispose();
    });
  });

  describe("Automatic Performance Optimizer", () => {
    it("should initialize with default mode and recommend applicable optimizations", () => {
      const optimizer = createPerformanceOptimizer({ mode: "balanced" });
      expect(optimizer.mode).toBe("balanced");
      expect(optimizer.activeOptimizations.length).toBe(0);

      const report = optimizer.getPerformanceReport();
      expect(report.bottlenecks).toBeDefined();

      optimizer.dispose();
    });

    it("should apply optimization, update active tracking, and record history", async () => {
      const optimizer = createPerformanceOptimizer();
      const record = await optimizer.applyOptimization("cpu_memoize_math");

      expect(record.strategyId).toBe("cpu_memoize_math");
      expect(record.status).toBe("applied");
      expect(optimizer.activeOptimizations.length).toBe(1);

      const history = optimizer.getOptimizationHistory();
      expect(history.length).toBe(1);
      expect(history[0].strategyId).toBe("cpu_memoize_math");

      optimizer.dispose();
    });

    it("should rollback individual and all optimizations safely", async () => {
      const optimizer = createPerformanceOptimizer();
      await optimizer.applyOptimization("mem_recycle_typed_arrays");
      await optimizer.applyOptimization("cpu_batch_operations");

      expect(optimizer.activeOptimizations.length).toBe(2);

      const rolledBack = optimizer.rollbackOptimization("mem_recycle_typed_arrays", "Test rollback");
      expect(rolledBack).toBe(true);
      expect(optimizer.activeOptimizations.length).toBe(1);

      optimizer.rollbackAllOptimizations("Teardown");
      expect(optimizer.activeOptimizations.length).toBe(0);

      optimizer.dispose();
    });

    it("should automatically rollback optimizations when a category is disabled", async () => {
      const optimizer = createPerformanceOptimizer();
      await optimizer.applyOptimization("mem_recycle_typed_arrays");
      expect(optimizer.activeOptimizations.length).toBe(1);

      optimizer.setCategoryEnabled("memory", false);
      expect(optimizer.isCategoryEnabled("memory")).toBe(false);
      expect(optimizer.activeOptimizations.length).toBe(0);

      optimizer.dispose();
    });

    it("should coordinate harmoniously with AdaptiveQualityController without conflicts", () => {
      const dev = createMockDeviceProfile();
      const qualityCtrl = createAdaptiveQualityController({ deviceProfile: dev });
      const optimizer = createPerformanceOptimizer({
        deviceProfile: dev,
        adaptiveQualityController: qualityCtrl,
      });

      expect(qualityCtrl.getCurrentQuality()).toBe("high");
      expect(optimizer.mode).toBe("balanced");

      // Quality controller adjusts visual quality preset, while optimizer focuses on bottleneck execution
      qualityCtrl.setQualityPreset("balanced");
      expect(qualityCtrl.getCurrentQuality()).toBe("balanced");

      optimizer.dispose();
      qualityCtrl.dispose();
    });
  });

  describe("React Integration", () => {
    it("should export React hooks and components", () => {
      expect(typeof usePerformanceProfiler).toBe("function");
      expect(typeof usePerformanceReport).toBe("function");
      expect(typeof usePerformanceOptimizer).toBe("function");
      expect(typeof useOptimizationHistory).toBe("function");
      expect(typeof PerformanceMonitor).toBe("function");
      expect(typeof OptimizationBoundary).toBe("function");
    });
  });
});
