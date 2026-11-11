/**
 * AF Motion — Unified Performance Intelligence Engine Test Suite
 *
 * Verifies context aggregation, multi-dimensional health scoring, policy-driven decision
 * synthesis, conflict resolution, history tracking, reporting, coordinator lifecycle, and React integration.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React, { createElement } from "react";
import { renderToString } from "react-dom/server";

import {
  createPerformanceIntelligence,
  PerformanceIntelligenceCoordinator,
  buildUnifiedPerformanceContext,
  evaluatePerformanceHealth,
  determineHealthStatus,
  HEALTH_SCORING_WEIGHTS,
  generatePerformanceDecisions,
  resolvePerformanceConflicts,
  PerformanceHistoryTracker,
  buildUnifiedPerformanceReport,
  QUALITY_PRESET_LADDER,
  getLowerQualityPreset,
  getHigherQualityPreset,
  QualityDegradationPolicy,
  QualityRecoveryPolicy,
  CpuOptimizationPolicy,
  MemoryPruningPolicy,
  GpuOptimizationPolicy,
  SimulationAdjustmentPolicy,
  BackgroundMaintenancePolicy,
  DEFAULT_PERFORMANCE_POLICIES,
  type UnifiedPerformanceContext,
  type PerformanceHealthScores,
  type PerformanceDecision,
} from "../src/catalogue.js";

import {
  PerformanceIntelligenceProvider,
  PerformanceDashboard,
  PerformanceStatus,
} from "../src/react.js";

describe("Unified Performance Intelligence Engine (Prompt 134)", () => {
  describe("Context Aggregation", () => {
    it("builds a unified performance context with safe defaults when sources are omitted", () => {
      const ctx = buildUnifiedPerformanceContext();
      expect(ctx.timestamp).toBeGreaterThan(0);
      expect(ctx.deviceCategory).toBe("desktop");
      expect(ctx.capabilityScores.composite).toBeGreaterThan(0);
      expect(ctx.activeQualityPreset).toBe("high");
      expect(ctx.fps).toBe(60);
      expect(ctx.frameDurationMs).toBeCloseTo(16.67, 1);
      expect(ctx.memoryPressureLevel).toBe("normal");
      expect(ctx.isVisible).toBe(true);
    });

    it("aggregates data accurately from custom context sources", () => {
      const mockProfile: any = {
        classification: { category: "high-end-mobile" },
        overallScore: 82,
        cpu: { coreCount: 8, benchmarkScore: 80 },
        memory: { deviceMemoryGB: 8, benchmarkScore: 85 },
        gpu: { tier: "high", benchmarkScore: 85 },
        activeBackend: "webgpu",
        features: { prefersReducedMotion: true },
      };

      const mockQuality: any = {
        name: "ultra",
        targetFps: 60,
        resolutionScale: 1.0,
        dpr: 2.0,
        physicsSubsteps: 4,
        maxParticles: 50000,
        features: { shadows: true, bloom: true, ssao: true, depthOfField: false, antialiasing: "msaa" },
        isLocked: true,
      };

      const ctx = buildUnifiedPerformanceContext({
        deviceProfile: mockProfile,
        qualityProfile: mockQuality,
        metrics: { fps: 45, frameDurationMs: 22.2, frameTimeVariance: 3.5, frameDrops: 4 },
        bottlenecks: { dominantBottleneck: "gpu", bottlenecks: [] } as any,
        memoryPressure: "elevated",
        telemetry: { isVisible: true, batteryLevel: 0.65, isBatteryCharging: true },
      });

      expect(ctx.deviceCategory).toBe("high-end-mobile");
      expect(ctx.activeBackend).toBe("webgpu");
      expect(ctx.isReducedMotion).toBe(true);
      expect(ctx.activeQualityPreset).toBe("ultra");
      expect(ctx.isQualityLocked).toBe(true);
      expect(ctx.fps).toBe(45);
      expect(ctx.frameDrops).toBe(4);
      expect(ctx.dominantBottleneck).toBe("gpu");
      expect(ctx.memoryPressureLevel).toBe("elevated");
      expect(ctx.batteryLevel).toBe(0.65);
      expect(ctx.isBatteryCharging).toBe(true);
    });
  });

  describe("Multi-Dimensional Health Scoring", () => {
    it("determines proper health status across score ranges", () => {
      expect(determineHealthStatus(95)).toBe("optimal");
      expect(determineHealthStatus(85)).toBe("optimal");
      expect(determineHealthStatus(75)).toBe("acceptable");
      expect(determineHealthStatus(55)).toBe("degraded");
      expect(determineHealthStatus(30)).toBe("critical");
    });

    it("evaluates healthy performance context with optimal scores", () => {
      const ctx = buildUnifiedPerformanceContext();
      const health = evaluatePerformanceHealth(ctx);

      expect(health.overallHealth.score).toBeGreaterThanOrEqual(80);
      expect(health.cpuHealth.score).toBeGreaterThanOrEqual(80);
      expect(health.gpuHealth.score).toBeGreaterThanOrEqual(80);
      expect(health.memoryHealth.score).toBeGreaterThanOrEqual(80);
      expect(health.renderingHealth.score).toBeGreaterThanOrEqual(80);
      expect(health.simulationHealth.score).toBeGreaterThanOrEqual(80);
    });

    it("evaluates degraded frame drops as poor rendering health", () => {
      const ctx = buildUnifiedPerformanceContext({
        metrics: { fps: 28, frameDurationMs: 35.7, frameTimeVariance: 12.0, frameDrops: 25 },
        bottlenecks: { dominantBottleneck: "gpu" } as any,
      });
      const health = evaluatePerformanceHealth(ctx);

      expect(health.renderingHealth.score).toBeLessThan(60);
      expect(health.renderingHealth.status).toBe("critical");
      expect(health.overallHealth.score).toBeLessThan(75);
    });

    it("evaluates high memory pressure as critical memory health", () => {
      const ctx = buildUnifiedPerformanceContext({
        memoryPressure: "critical",
        memorySnapshot: {
          timestamp: Date.now(),
          jsHeapUsedBytes: 600 * 1024 * 1024,
          jsHeapTotalBytes: 700 * 1024 * 1024,
          estimatedGpuBytes: 400 * 1024 * 1024,
          trackedResourceBytes: 500 * 1024 * 1024,
          trackedResourceCount: 1500,
          pressureLevel: "critical",
        },
      });
      const health = evaluatePerformanceHealth(ctx);

      expect(health.memoryHealth.score).toBeLessThan(40);
      expect(health.memoryHealth.status).toBe("critical");
      expect(health.overallHealth.score).toBeLessThan(80);
    });

    it("differentiates inherent hardware capability from live runtime health", () => {
      // High-end device (score 95) experiencing critical frame drops (runtime health < 50)
      const ctx = buildUnifiedPerformanceContext({
        deviceProfile: {
          classification: { category: "high-end-desktop" },
          overallScore: 95,
          cpu: { coreCount: 16, benchmarkScore: 95 },
          memory: { deviceMemoryGB: 32, benchmarkScore: 95 },
          gpu: { tier: "high", benchmarkScore: 95 },
        } as any,
        metrics: { fps: 22, frameDurationMs: 45.4, frameTimeVariance: 15.0, frameDrops: 30 },
      });
      const health = evaluatePerformanceHealth(ctx);

      expect(health.hardwareCapabilityVsRuntimeHealth.capabilityScore).toBe(95);
      expect(health.hardwareCapabilityVsRuntimeHealth.runtimeHealthScore).toBeLessThan(70);
      expect(health.hardwareCapabilityVsRuntimeHealth.divergenceRationale).toContain(
        "Hardware capability is high, but runtime is bottlenecked"
      );
    });
  });

  describe("Decision Policies & Generation", () => {
    it("steps through quality preset ladder correctly", () => {
      expect(getLowerQualityPreset("ultra")).toBe("high");
      expect(getLowerQualityPreset("high")).toBe("medium");
      expect(getLowerQualityPreset("medium")).toBe("low");
      expect(getLowerQualityPreset("low")).toBeNull();

      expect(getHigherQualityPreset("low")).toBe("medium");
      expect(getHigherQualityPreset("medium")).toBe("high");
      expect(getHigherQualityPreset("high")).toBe("ultra");
      expect(getHigherQualityPreset("ultra")).toBeNull();
    });

    it("triggers quality degradation when rendering is degraded", () => {
      const ctx = buildUnifiedPerformanceContext({
        qualityProfile: { name: "high", isLocked: false } as any,
        metrics: { fps: 28, frameDurationMs: 35.7, frameTimeVariance: 8.0, frameDrops: 20 },
      });
      const health = evaluatePerformanceHealth(ctx);
      const decisions = generatePerformanceDecisions(ctx, health);

      const degradeDec = decisions.find((d) => d.category === "reduce_quality");
      expect(degradeDec).toBeDefined();
      expect(degradeDec?.targetPreset).toBe("medium");
      expect(degradeDec?.requiredSubsystem).toBe("quality");
      expect(degradeDec?.priority).toBeGreaterThanOrEqual(6);
    });

    it("does not degrade quality when quality is locked by user", () => {
      const ctx = buildUnifiedPerformanceContext({
        qualityProfile: { name: "high", isLocked: true } as any,
        metrics: { fps: 28, frameDurationMs: 35.7, frameTimeVariance: 8.0, frameDrops: 20 },
      });
      const health = evaluatePerformanceHealth(ctx);
      const decisions = generatePerformanceDecisions(ctx, health);

      const degradeDec = decisions.find((d) => d.category === "reduce_quality");
      expect(degradeDec).toBeUndefined();
    });

    it("promotes quality recovery when health is optimal and headroom exists", () => {
      const ctx = buildUnifiedPerformanceContext({
        qualityProfile: { name: "medium", isLocked: false } as any,
        metrics: { fps: 60, frameDurationMs: 16.2, frameTimeVariance: 0.2, frameDrops: 0 },
      });
      const health = evaluatePerformanceHealth(ctx);
      const decisions = generatePerformanceDecisions(ctx, health);

      const recoverDec = decisions.find((d) => d.category === "increase_quality");
      expect(recoverDec).toBeDefined();
      expect(recoverDec?.targetPreset).toBe("high");
    });

    it("blocks quality recovery when memory pressure is high or battery is low", () => {
      const ctxHighMem = buildUnifiedPerformanceContext({
        qualityProfile: { name: "medium", isLocked: false } as any,
        metrics: { fps: 60, frameDurationMs: 16.2, frameTimeVariance: 0.2, frameDrops: 0 },
        memoryPressure: "high",
      });
      const healthHighMem = evaluatePerformanceHealth(ctxHighMem);
      const decisionsHighMem = generatePerformanceDecisions(ctxHighMem, healthHighMem);
      expect(decisionsHighMem.find((d) => d.category === "increase_quality")).toBeUndefined();

      const ctxLowBattery = buildUnifiedPerformanceContext({
        qualityProfile: { name: "medium", isLocked: false } as any,
        metrics: { fps: 60, frameDurationMs: 16.2, frameTimeVariance: 0.2, frameDrops: 0 },
        telemetry: { batteryLevel: 0.15, isBatteryCharging: false },
      });
      const healthLowBattery = evaluatePerformanceHealth(ctxLowBattery);
      const decisionsLowBattery = generatePerformanceDecisions(ctxLowBattery, healthLowBattery);
      expect(decisionsLowBattery.find((d) => d.category === "increase_quality")).toBeUndefined();
    });

    it("triggers memory pruning under critical pressure", () => {
      const ctx = buildUnifiedPerformanceContext({
        memoryPressure: "critical",
      });
      const health = evaluatePerformanceHealth(ctx);
      const decisions = generatePerformanceDecisions(ctx, health);

      const pruneDec = decisions.find((d) => d.category === "release_resources");
      expect(pruneDec).toBeDefined();
      expect(pruneDec?.priority).toBe(10);
      expect(pruneDec?.requiredSubsystem).toBe("resource");
      expect(pruneDec?.payload?.aggressive).toBe(true);
    });

    it("triggers idle maintenance when document is hidden", () => {
      const ctx = buildUnifiedPerformanceContext({
        telemetry: { isVisible: false },
      });
      const health = evaluatePerformanceHealth(ctx);
      const decisions = generatePerformanceDecisions(ctx, health);

      const bgDec = decisions.find((d) => d.category === "maintain");
      expect(bgDec).toBeDefined();
      expect(bgDec?.requiredSubsystem).toBe("runtime");
    });
  });

  describe("Conflict Resolution", () => {
    it("resolves contradictory quality increase vs quality reduction in favor of downgrade", () => {
      const decisions: PerformanceDecision[] = [
        {
          id: "dec_1",
          category: "increase_quality",
          reason: "Headroom available",
          supportingSignals: [],
          priority: 3,
          expectedBenefit: "Higher fidelity",
          riskLevel: "medium",
          isReversible: true,
          confidence: 0.8,
          requiredSubsystem: "quality",
          targetPreset: "ultra",
        },
        {
          id: "dec_2",
          category: "reduce_quality",
          reason: "Frame drop spike",
          supportingSignals: [],
          priority: 8,
          expectedBenefit: "Stable frame budget",
          riskLevel: "low",
          isReversible: true,
          confidence: 0.9,
          requiredSubsystem: "quality",
          targetPreset: "medium",
        },
      ];

      const resolution = resolvePerformanceConflicts(decisions);
      expect(resolution.hasConflict).toBe(true);
      expect(resolution.resolvedDecisions.length).toBe(1);
      expect(resolution.resolvedDecisions[0].category).toBe("reduce_quality");
    });

    it("suppresses quality increase when emergency memory release is pending", () => {
      const decisions: PerformanceDecision[] = [
        {
          id: "dec_inc",
          category: "increase_quality",
          reason: "FPS is high",
          supportingSignals: [],
          priority: 3,
          expectedBenefit: "Higher fidelity",
          riskLevel: "medium",
          isReversible: true,
          confidence: 0.8,
          requiredSubsystem: "quality",
        },
        {
          id: "dec_prune",
          category: "release_resources",
          reason: "Critical memory pressure",
          supportingSignals: [],
          priority: 10,
          expectedBenefit: "Prevent OOM",
          riskLevel: "high",
          isReversible: false,
          confidence: 0.95,
          requiredSubsystem: "resource",
        },
      ];

      const resolution = resolvePerformanceConflicts(decisions);
      expect(resolution.hasConflict).toBe(true);
      expect(resolution.resolvedDecisions.some((d) => d.category === "increase_quality")).toBe(false);
      expect(resolution.resolvedDecisions.some((d) => d.category === "release_resources")).toBe(true);
    });

    it("deduplicates multiple identical strategy actions", () => {
      const decisions: PerformanceDecision[] = [
        {
          id: "dec_cpu_1",
          category: "optimize_cpu",
          strategyId: "frame-rate-throttling",
          reason: "CPU high",
          supportingSignals: [],
          priority: 5,
          expectedBenefit: "Save CPU",
          riskLevel: "low",
          isReversible: true,
          confidence: 0.8,
          requiredSubsystem: "optimizer",
        },
        {
          id: "dec_cpu_2",
          category: "optimize_cpu",
          strategyId: "frame-rate-throttling",
          reason: "CPU critical",
          supportingSignals: [],
          priority: 8,
          expectedBenefit: "Save CPU immediately",
          riskLevel: "low",
          isReversible: true,
          confidence: 0.9,
          requiredSubsystem: "optimizer",
        },
      ];

      const resolution = resolvePerformanceConflicts(decisions);
      expect(resolution.hasConflict).toBe(true);
      expect(resolution.resolvedDecisions.length).toBe(1);
      expect(resolution.resolvedDecisions[0].id).toBe("dec_cpu_2"); // Retained higher priority
    });
  });

  describe("History Tracking & Snapshot Comparison", () => {
    it("maintains bounded history ring buffer", () => {
      const tracker = new PerformanceHistoryTracker(5);
      for (let i = 0; i < 10; i++) {
        tracker.push(buildUnifiedPerformanceContext({ metrics: { fps: 50 + i } }));
      }

      const history = tracker.getHistory();
      expect(history.length).toBe(5);
      expect(history[0].fps).toBe(55);
      expect(history[4].fps).toBe(59);
    });

    it("compares before and after snapshots accurately", () => {
      const tracker = new PerformanceHistoryTracker();
      const before = buildUnifiedPerformanceContext({
        metrics: { fps: 30, frameDurationMs: 33.3 },
        memorySnapshot: { estimatedGpuBytes: 200 * 1024 * 1024 } as any,
      });
      const after = buildUnifiedPerformanceContext({
        metrics: { fps: 58, frameDurationMs: 17.2 },
        memorySnapshot: { estimatedGpuBytes: 150 * 1024 * 1024 } as any,
      });

      const comparison = tracker.compareSnapshots(before, after);
      expect(comparison.fpsDelta).toBe(28);
      expect(comparison.frameDurationDeltaMs).toBe(-16.1);
      expect(comparison.memoryDeltaMB).toBe(-50);
      expect(comparison.improved).toBe(true);
      expect(comparison.summary).toContain("FPS +28.0");
    });

    it("analyzes trends over multiple frames", () => {
      const tracker = new PerformanceHistoryTracker(10);
      // Pushing degrading FPS sequence: 60, 58, 55, 45, 40, 35
      [60, 58, 55, 48, 40, 35].forEach((fps) => {
        tracker.push(buildUnifiedPerformanceContext({ metrics: { fps } }));
      });

      const trend = tracker.analyzeTrend();
      expect(trend.fpsTrend).toBe("degrading");
      expect(trend.sampleCount).toBe(6);
    });
  });

  describe("Diagnostic Report Generation", () => {
    it("generates a clean, JSON-serializable report without circular references", () => {
      const ctx = buildUnifiedPerformanceContext();
      const health = evaluatePerformanceHealth(ctx);
      const decisions = generatePerformanceDecisions(ctx, health);

      const report = buildUnifiedPerformanceReport(ctx, health, decisions);

      expect(report.generatedAt).toBeDefined();
      expect(report.device.category).toBe("desktop");
      expect(report.runtime.fps).toBe(60);
      expect(report.health.overallScore).toBeGreaterThanOrEqual(80);

      // Verify clean JSON serialization
      const json = JSON.stringify(report);
      expect(json).toBeDefined();
      const parsed = JSON.parse(json);
      expect(parsed.runtime.fps).toBe(60);
      expect(parsed.health.status).toBe(report.health.status);
    });
  });

  describe("PerformanceIntelligenceCoordinator Lifecycle", () => {
    let coordinator: PerformanceIntelligenceCoordinator;

    beforeEach(() => {
      coordinator = new PerformanceIntelligenceCoordinator({
        autoStart: false,
        evaluationIntervalMs: 50,
      });
    });

    afterEach(() => {
      coordinator.dispose();
    });

    it("initializes with snapshot, health, and stopped state", () => {
      expect(coordinator.isRunning).toBe(false);
      expect(coordinator.context.fps).toBe(60);
      expect(coordinator.health.overallHealth.score).toBeGreaterThan(0);
      expect(coordinator.getHistory().length).toBe(1);
    });

    it("starts, pauses, and resumes periodic evaluation", () => {
      coordinator.start();
      expect(coordinator.isRunning).toBe(true);

      coordinator.pause();
      expect(coordinator.isRunning).toBe(false);

      coordinator.resume();
      expect(coordinator.isRunning).toBe(true);
    });

    it("notifies subscribers when refresh or evaluateHealth is called", () => {
      const listener = vi.fn();
      const unsubscribe = coordinator.subscribe(listener);

      coordinator.refresh();
      expect(listener).toHaveBeenCalledTimes(1);

      coordinator.evaluateHealth();
      expect(listener).toHaveBeenCalledTimes(2);

      unsubscribe();
      coordinator.refresh();
      expect(listener).toHaveBeenCalledTimes(2);
    });

    it("applies decisions safely across subsystems", async () => {
      const mockOptimizer = {
        applyStrategy: vi.fn(),
      };
      const mockResourceManager = {
        pruneUnusedResources: vi.fn(),
      };

      const coord = new PerformanceIntelligenceCoordinator(
        { autoStart: false },
        {
          optimizer: mockOptimizer as any,
          resourceManager: mockResourceManager as any,
        }
      );

      const decisions: PerformanceDecision[] = [
        {
          id: "dec_test_1",
          category: "optimize_cpu",
          strategyId: "frame-rate-throttling",
          reason: "CPU test",
          supportingSignals: [],
          priority: 5,
          expectedBenefit: "test",
          riskLevel: "low",
          isReversible: true,
          confidence: 0.9,
          requiredSubsystem: "optimizer",
        },
        {
          id: "dec_test_2",
          category: "release_resources",
          reason: "Resource test",
          supportingSignals: [],
          priority: 7,
          expectedBenefit: "test",
          riskLevel: "low",
          isReversible: false,
          confidence: 0.95,
          requiredSubsystem: "resource",
        },
      ];

      const results = await coord.applyDecisions(decisions);
      expect(results.length).toBe(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
      expect(mockOptimizer.applyStrategy).toHaveBeenCalledWith("frame-rate-throttling");
      expect(mockResourceManager.pruneUnusedResources).toHaveBeenCalled();

      coord.dispose();
    });

    it("provides unified report and resets cleanly", () => {
      const report = coordinator.getReport();
      expect(report.device.activeBackend).toBe("webgl2");

      coordinator.reset();
      expect(coordinator.isRunning).toBe(false);
      expect(coordinator.getHistory().length).toBe(1);
    });
  });

  describe("React Integration", () => {
    it("renders PerformanceStatus and PerformanceDashboard components without crashing", () => {
      const coordinator = createPerformanceIntelligence();

      const statusHtml = renderToString(
        createElement(
          PerformanceIntelligenceProvider,
          { coordinator },
          createElement(PerformanceStatus, null)
        )
      );
      expect(statusHtml).toContain("OPTIMAL");

      const dashboardHtml = renderToString(
        createElement(
          PerformanceIntelligenceProvider,
          { coordinator },
          createElement(PerformanceDashboard, { showDecisions: true })
        )
      );
      expect(dashboardHtml).toContain("Performance Intelligence");
      expect(dashboardHtml).toContain("FPS: 60");

      coordinator.dispose();
    });
  });
});
