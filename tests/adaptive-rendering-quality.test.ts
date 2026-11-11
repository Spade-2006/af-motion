/**
 * AF Motion — Adaptive Rendering & Quality Engine Test Suite
 *
 * Comprehensive tests covering quality profiles, presets, initial recommendation,
 * real-time performance tracking, hysteresis adaptation, dynamic resolution,
 * system policies, user overrides, and React integration.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createAdaptiveQualityController,
  createQualityProfile,
  getRecommendedQuality,
  ORDERED_PRESETS,
  QUALITY_PRESET_VALUES,
  SETTING_ADAPTATION_PRIORITIES,
  SETTING_PERFORMANCE_IMPACT,
  NUMERIC_SETTING_BOUNDS,
  clampNumericSetting,
  buildUnifiedSettings,
  extractQualityValues,
  getLowerPreset,
  getHigherPreset,
  PerformanceTracker,
  ResolutionIntelligence,
  get3DQualityPolicy,
  getParticlesQualityPolicy,
  getFluidQualityPolicy,
  getEnvironmentQualityPolicy,
  getGpuSimulationQualityPolicy,
  getPhysicsQualityPolicy,
  getModelLodQualityPolicy,
  aggregateSystemPolicies,
  AdaptiveQualityController,
} from "../src/catalogue.js";
import {
  useAdaptiveQuality,
  useQualityProfile,
  usePerformanceMetrics,
  useQualityAdaptation,
  AdaptiveQualityProvider,
  AdaptiveQualityBoundary,
  AdaptiveQualityContext,
} from "../src/react.js";
import type { DeviceCapabilityProfile } from "../src/catalogue.js";

function createMockDeviceProfile(overrides: Partial<any> = {}): DeviceCapabilityProfile {
  return {
    version: "1.0.0",
    category: overrides.category ?? "standard-desktop",
    categoryRationale: "Mock profile",
    scores: {
      cpu: { score: overrides.cpuScore ?? 75, confidence: "high", supportingSignals: [], missingInformation: [], rationale: "" },
      memory: { score: overrides.memScore ?? 70, confidence: "high", supportingSignals: [], missingInformation: [], rationale: "" },
      gpu: { score: overrides.gpuScore ?? 75, confidence: "high", supportingSignals: [], missingInformation: [], rationale: "" },
      graphicsFeatures: { score: 80, confidence: "high", supportingSignals: [], missingInformation: [], rationale: "" },
      worker: { score: 90, confidence: "high", supportingSignals: [], missingInformation: [], rationale: "" },
      rendering: { score: 75, confidence: "high", supportingSignals: [], missingInformation: [], rationale: "" },
      overallScore: overrides.compositeScore ?? 75,
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
      webgl2: { value: overrides.webgl2 ?? true, status: "detected" },
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
      unmaskedVendor: { value: "Mock Vendor", status: "detected" },
      unmaskedRenderer: { value: "Mock GPU", status: "detected" },
    },
    webgpu: {
      apiAvailable: { value: overrides.webgpu ?? false, status: "detected" },
      adapterAvailable: { value: overrides.webgpu ?? false, status: "detected" },
      deviceAvailable: { value: overrides.webgpu ?? false, status: "detected" },
      computeShaderSupport: { value: overrides.webgpu ?? false, status: "detected" },
      maxTextureDimension2D: { value: 8192, status: "detected" },
      maxBufferSize: { value: 268435456, status: "detected" },
      features: { value: [], status: "detected" },
      limits: { value: {}, status: "detected" },
      architecture: { value: "mock", status: "detected" },
    },
    supportedGraphicsBackends: overrides.webgpu ? ["webgpu", "webgl2", "webgl"] : ["webgl2", "webgl"],
    activeGraphicsBackend: overrides.webgpu ? "webgpu" : "webgl2",
    display: {
      dpr: { value: overrides.dpr ?? 2.0, status: "detected" },
      viewportWidth: { value: 1920, status: "detected" },
      viewportHeight: { value: 1080, status: "detected" },
      screenWidth: { value: 1920, status: "detected" },
      screenHeight: { value: 1080, status: "detected" },
      colorDepth: { value: 24, status: "detected" },
      colorSpace: { value: "srgb", status: "detected" },
      reducedMotion: { value: overrides.reducedMotion ?? false, status: "detected" },
      reducedTransparency: { value: false, status: "detected" },
      highContrast: { value: false, status: "detected" },
      colorScheme: { value: "dark", status: "detected" },
    },
    network: {
      online: { value: true, status: "detected" },
      effectiveType: { value: "4g", status: "detected" },
      downlinkMbps: { value: 10, status: "detected" },
      rttMs: { value: 50, status: "detected" },
      saveData: { value: overrides.saveData ?? false, status: "detected" },
    },
    battery: {
      charging: { value: overrides.batteryCharging ?? true, status: "detected" },
      level: { value: overrides.batteryLevel ?? 0.8, status: "detected" },
      chargingTime: { value: 0, status: "detected" },
      dischargingTime: { value: null, status: "detected" },
    },
    detectedAt: Date.now(),
  };
}

describe("Adaptive Rendering & Quality Engine", () => {
  describe("Quality Profiles & Presets", () => {
    it("should export standard presets and ordered list", () => {
      expect(ORDERED_PRESETS).toEqual([
        "ultra",
        "high",
        "balanced",
        "performance",
        "battery-saver",
      ]);
      expect(QUALITY_PRESET_VALUES.ultra.dpr).toBe(3.0);
      expect(QUALITY_PRESET_VALUES.high.dpr).toBe(2.0);
      expect(QUALITY_PRESET_VALUES.balanced.dpr).toBe(1.5);
      expect(QUALITY_PRESET_VALUES.performance.dpr).toBe(1.0);
      expect(QUALITY_PRESET_VALUES["battery-saver"].dpr).toBe(1.0);
    });

    it("should clamp numeric settings within safe bounds", () => {
      expect(clampNumericSetting("resolutionScale", 1.5)).toBe(1.0);
      expect(clampNumericSetting("resolutionScale", 0.1)).toBe(0.25);
      expect(clampNumericSetting("dpr", 5.0)).toBe(3.0);
      expect(clampNumericSetting("physicsFrequency", 240)).toBe(120);
      expect(clampNumericSetting("physicsFrequency", 10)).toBe(30);
    });

    it("should create complete profiles with setting descriptors", () => {
      const profile = createQualityProfile("balanced");
      expect(profile.preset).toBe("balanced");
      expect(profile.isAutoAdaptive).toBe(true);
      expect(profile.isLocked).toBe(false);

      const dprDesc = profile.settings.dpr;
      expect(dprDesc.current).toBe(1.5);
      expect(dprDesc.mode).toBe("auto");
      expect(dprDesc.adaptationPriority).toBe(SETTING_ADAPTATION_PRIORITIES.dpr);
      expect(dprDesc.estimatedImpact).toBe("high");

      expect(profile.values.resolutionScale).toBe(0.9);
      expect(profile.values.particleDensity).toBe(0.7);
    });

    it("should allow custom profiles with partial overrides", () => {
      const profile = createQualityProfile("custom", {
        resolutionScale: 0.5,
        shadowQuality: "disabled",
      });
      expect(profile.preset).toBe("custom");
      expect(profile.values.resolutionScale).toBe(0.5);
      expect(profile.values.shadowQuality).toBe("disabled");
      expect(profile.settings.resolutionScale.mode).toBe("manual");
    });

    it("should navigate degradation and recovery ladders correctly", () => {
      expect(getLowerPreset("ultra")).toBe("high");
      expect(getLowerPreset("high")).toBe("balanced");
      expect(getLowerPreset("balanced")).toBe("performance");
      expect(getLowerPreset("performance")).toBe("battery-saver");
      expect(getLowerPreset("battery-saver")).toBeNull();

      expect(getHigherPreset("battery-saver")).toBe("performance");
      expect(getHigherPreset("performance")).toBe("balanced");
      expect(getHigherPreset("balanced")).toBe("high");
      expect(getHigherPreset("high")).toBe("ultra");
      expect(getHigherPreset("ultra")).toBeNull();
    });
  });

  describe("Initial Quality Recommendation", () => {
    it("should recommend Ultra for high-end systems with WebGPU", () => {
      const dev = createMockDeviceProfile({
        compositeScore: 90,
        gpuScore: 88,
        webgpu: true,
        category: "high-end-desktop",
      });
      const rec = getRecommendedQuality(dev);
      expect(rec.preset).toBe("ultra");
      expect(rec.scores.composite).toBe(90);
      expect(rec.rationale.some((r) => r.includes("Ultra"))).toBe(true);
    });

    it("should recommend High for strong capability profiles", () => {
      const dev = createMockDeviceProfile({
        compositeScore: 72,
        gpuScore: 70,
        webgl2: true,
      });
      const rec = getRecommendedQuality(dev);
      expect(rec.preset).toBe("high");
    });

    it("should recommend Balanced for intermediate profiles", () => {
      const dev = createMockDeviceProfile({
        compositeScore: 50,
        gpuScore: 45,
      });
      const rec = getRecommendedQuality(dev);
      expect(rec.preset).toBe("balanced");
    });

    it("should clamp low-end mobile devices to Performance tier", () => {
      const dev = createMockDeviceProfile({
        compositeScore: 48,
        gpuScore: 45,
        category: "low-end-mobile",
      });
      const rec = getRecommendedQuality(dev);
      expect(rec.preset).toBe("performance");
      expect(rec.rationale.some((r) => r.includes("low-end mobile"))).toBe(true);
    });

    it("should automatically select Battery Saver when battery is critically low (< 20%) and discharging", () => {
      const dev = createMockDeviceProfile({
        compositeScore: 85,
        gpuScore: 80,
        batteryCharging: false,
        batteryLevel: 0.15,
      });
      const rec = getRecommendedQuality(dev);
      expect(rec.preset).toBe("battery-saver");
      expect(rec.rationale.some((r) => r.includes("critically low"))).toBe(true);
    });

    it("should respect prefers-reduced-motion by subduing particle density and animation", () => {
      const dev = createMockDeviceProfile({
        compositeScore: 80,
        gpuScore: 80,
        reducedMotion: true,
      });
      const rec = getRecommendedQuality(dev);
      expect(rec.values.particleDensity).toBeLessThanOrEqual(0.3);
      expect(rec.values.animationQuality).toBe("low");
      expect(rec.values.environmentalDetail).toBe("low");
    });

    it("should honor explicit user preferences", () => {
      const dev = createMockDeviceProfile({ compositeScore: 75 });
      const recPower = getRecommendedQuality(dev, { preference: "power" });
      expect(recPower.preset).toBe("battery-saver");

      const recPerf = getRecommendedQuality(dev, { preference: "performance" });
      expect(recPerf.preset).toBe("balanced");

      const recDpr = getRecommendedQuality(dev, { maxDpr: 1.25 });
      expect(recDpr.values.dpr).toBeLessThanOrEqual(1.25);
    });
  });

  describe("Real-Time Performance Monitoring", () => {
    it("should calculate rolling FPS, frame drops, and long frames accurately", () => {
      const tracker = new PerformanceTracker({ windowSize: 30, targetFps: 60 });
      for (let i = 0; i < 30; i++) {
        tracker.record(16.66);
      }
      let metrics = tracker.getMetrics();
      expect(metrics.averageFps).toBeCloseTo(60, 0);
      expect(metrics.frameDrops).toBe(0);
      expect(metrics.longFrames).toBe(0);

      // Inject 3 slow frames (> 33.3ms)
      tracker.record(40.0);
      tracker.record(45.0);
      tracker.record(50.0);

      metrics = tracker.getMetrics();
      expect(metrics.averageFps).toBeLessThan(60);
      expect(metrics.longFrames).toBeGreaterThanOrEqual(3);
      expect(metrics.frameDrops).toBeGreaterThanOrEqual(3);
      expect(metrics.isGpuTimingSupported).toBe(false);
    });

    it("should keep memory bounded even across hundreds of frame submissions", () => {
      const tracker = new PerformanceTracker({ windowSize: 20 });
      for (let i = 0; i < 500; i++) {
        tracker.record(16.66);
      }
      const metrics = tracker.getMetrics();
      expect(metrics.averageFps).toBeCloseTo(60, 0);
    });

    it("should distinguish measured CPU simulation/render times", () => {
      const tracker = new PerformanceTracker();
      tracker.record({
        frameDurationMs: 16.6,
        simulationTimeMs: 4.2,
        renderTimeMs: 8.1,
        workloadComplexity: 120,
        resourcePressure: 0.35,
      });
      const m = tracker.getMetrics();
      expect(m.simulationTimeMs).toBe(4.2);
      expect(m.renderTimeMs).toBe(8.1);
      expect(m.workloadComplexity).toBe(120);
      expect(m.resourcePressure).toBe(0.35);
      expect(m.gpuTimeMs).toBeUndefined();
    });
  });

  describe("Rendering Resolution Intelligence", () => {
    it("should compute dynamic physical dimensions with DPR and scale factor", () => {
      const res = new ResolutionIntelligence();
      const result = res.computeResolution(1920, 1080, { dpr: 2.0, resolutionScale: 1.0 });
      expect(result.physicalWidth).toBe(3840);
      expect(result.physicalHeight).toBe(2160);
      expect(result.effectiveDpr).toBe(2.0);
      expect(result.isPixelBudgetCapped).toBe(false);
    });

    it("should cap resolution when exceeding maximum pixel budget", () => {
      const res = new ResolutionIntelligence();
      // Total 4K is 3840 * 2160 = 8,294,400 pixels; budget cap 2,073,600 (1080p)
      const result = res.computeResolution(
        1920,
        1080,
        { dpr: 2.0, resolutionScale: 1.0 },
        { maxPixelBudget: 2073600 }
      );
      expect(result.totalPixels).toBeLessThanOrEqual(2073600 + 100);
      expect(result.isPixelBudgetCapped).toBe(true);
    });

    it("should prevent layout thrashing for micro pixel shifts (< 2px)", () => {
      const res = new ResolutionIntelligence();
      const first = res.computeResolution(1000, 500, { dpr: 1.0, resolutionScale: 1.0 });
      const second = res.computeResolution(1001, 501, { dpr: 1.0, resolutionScale: 1.0 });
      expect(second.physicalWidth).toBe(first.physicalWidth);
      expect(second.physicalHeight).toBe(first.physicalHeight);
    });
  });

  describe("System-Specific Quality Adaptation Policies", () => {
    it("should derive concrete 3D rendering policies from quality values", () => {
      const polUltra = get3DQualityPolicy(QUALITY_PRESET_VALUES.ultra);
      expect(polUltra.shadowResolution).toBe(2048);
      expect(polUltra.shadowsEnabled).toBe(true);
      expect(polUltra.maxLights).toBe(8);
      expect(polUltra.pbrMaterials).toBe(true);
      expect(polUltra.antialiasing).toBe(true);

      const polLow = get3DQualityPolicy(QUALITY_PRESET_VALUES["battery-saver"]);
      expect(polLow.shadowResolution).toBe(0);
      expect(polLow.shadowsEnabled).toBe(false);
      expect(polLow.pbrMaterials).toBe(false);
    });

    it("should derive particle simulation parameters", () => {
      const pol = getParticlesQualityPolicy(QUALITY_PRESET_VALUES.high);
      expect(pol.activeCountMultiplier).toBe(1.0);
      expect(pol.maxActiveParticles).toBe(50000);
      expect(pol.updateFrequency).toBe(1);

      const polBat = getParticlesQualityPolicy(QUALITY_PRESET_VALUES["battery-saver"]);
      expect(polBat.activeCountMultiplier).toBe(0.25);
      expect(polBat.updateFrequency).toBe(2);
    });

    it("should derive fluid, environmental, gpu simulation, and physics policies", () => {
      const values = QUALITY_PRESET_VALUES.high;
      const all = aggregateSystemPolicies(values);

      expect(all.fluid.solverIterations).toBeGreaterThan(20);
      expect(all.environment.cloudsEnabled).toBe(true);
      expect(all.gpuSimulation.preferredBackend).toBe("webgl2");
      expect(all.physics.simulationHz).toBe(60);
      expect(all.physics.substeps).toBe(2);
      expect(all.modelLod.targetTriangleRatio).toBe(1.0);
    });
  });

  describe("Adaptive Quality Controller", () => {
    it("should initialize with recommended preset and expose public interface", () => {
      const dev = createMockDeviceProfile({ compositeScore: 70, gpuScore: 70 });
      const controller = createAdaptiveQualityController({ deviceProfile: dev });

      expect(controller.getCurrentQuality()).toBe("high");
      expect(controller.getQualityProfile().preset).toBe("high");
      expect(controller.getRecommendedProfile().preset).toBe("high");
      expect(controller.getPerformanceMetrics().averageFps).toBeDefined();

      controller.dispose();
    });

    it("should degrade quality when sustained slow frames occur", () => {
      const dev = createMockDeviceProfile({ compositeScore: 70, gpuScore: 70 });
      const controller = createAdaptiveQualityController({
        deviceProfile: dev,
        consecutiveSlowFramesThreshold: 5,
        adaptationCooldownMs: 0,
      });

      expect(controller.getCurrentQuality()).toBe("high");

      // Submit slow frames (35ms = ~28 FPS)
      for (let i = 0; i < 6; i++) {
        controller.recordFrame(35);
      }

      expect(controller.getCurrentQuality()).toBe("balanced");
      const history = controller.getQualityAdaptationHistory();
      expect(history.length).toBe(1);
      expect(history[0].type).toBe("degrade");
      expect(history[0].previousPreset).toBe("high");
      expect(history[0].newPreset).toBe("balanced");

      controller.dispose();
    });

    it("should recover quality when performance stabilizes", () => {
      const dev = createMockDeviceProfile({ compositeScore: 70, gpuScore: 70 });
      const controller = createAdaptiveQualityController({
        deviceProfile: dev,
        preferences: { initialPreset: "performance" },
        consecutiveFastFramesThreshold: 5,
        adaptationCooldownMs: 0,
      });

      expect(controller.getCurrentQuality()).toBe("performance");

      // Submit fast frames (16.6ms = 60 FPS)
      for (let i = 0; i < 6; i++) {
        controller.recordFrame(16.6);
      }

      expect(controller.getCurrentQuality()).toBe("balanced");
      const history = controller.getQualityAdaptationHistory();
      expect(history.length).toBe(1);
      expect(history[0].type).toBe("recover");

      controller.dispose();
    });

    it("should respect setting locks and user overrides during adaptation", () => {
      const dev = createMockDeviceProfile({ compositeScore: 70 });
      const controller = createAdaptiveQualityController({ deviceProfile: dev });

      controller.setQualityOverride("shadowQuality", "high");
      expect(controller.profile.values.shadowQuality).toBe("high");
      expect(controller.profile.settings.shadowQuality.mode).toBe("manual");

      controller.lockQualitySettings(true);
      expect(controller.profile.isLocked).toBe(true);

      // Attempt manual degrade - locked profile should not adapt
      const adapted = controller.adaptQuality();
      expect(adapted).toBe(false);

      controller.dispose();
    });

    it("should support multiple independent controllers without state leakage", () => {
      const c1 = createAdaptiveQualityController({ preferences: { initialPreset: "ultra" } });
      const c2 = createAdaptiveQualityController({ preferences: { initialPreset: "performance" } });

      expect(c1.getCurrentQuality()).toBe("ultra");
      expect(c2.getCurrentQuality()).toBe("performance");

      c1.setQualityPreset("balanced");
      expect(c1.getCurrentQuality()).toBe("balanced");
      expect(c2.getCurrentQuality()).toBe("performance");

      c1.dispose();
      c2.dispose();
    });

    it("should notify listeners on profile adjustments", () => {
      const controller = createAdaptiveQualityController({ preferences: { initialPreset: "high" } });
      const listener = vi.fn();
      const sub = controller.subscribe(listener);

      controller.setQualityPreset("balanced");
      expect(listener).toHaveBeenCalledTimes(1);

      sub.unsubscribe();
      controller.setQualityPreset("performance");
      expect(listener).toHaveBeenCalledTimes(1); // not called after unsubscribe

      controller.dispose();
    });
  });

  describe("React Integration", () => {
    it("should export all required React hooks and components", () => {
      expect(typeof useAdaptiveQuality).toBe("function");
      expect(typeof useQualityProfile).toBe("function");
      expect(typeof usePerformanceMetrics).toBe("function");
      expect(typeof useQualityAdaptation).toBe("function");
      expect(typeof AdaptiveQualityProvider).toBe("function");
      expect(typeof AdaptiveQualityBoundary).toBe("function");
      expect(AdaptiveQualityContext).toBeDefined();
    });
  });
});
