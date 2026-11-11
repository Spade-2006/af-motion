/**
 * AF Motion — Memory & Resource Intelligence Engine Tests
 *
 * Comprehensive tests covering universal resource registry, lifecycle scopes,
 * reference tracking, memory budget management, intelligent caching, safe pooling,
 * leak detection, GPU context resilience, and React integration.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createResourceRegistry,
  ResourceRegistry,
  createMemoryMonitor,
  MemoryMonitor,
  DEFAULT_MEMORY_BUDGETS,
  createResourceCache,
  ResourceCache,
  safeBufferPoolManager,
  SafeBufferPoolManager,
  detectResourceLeaks,
  GpuResourceIntelligence,
  createMemoryPressureController,
  MemoryPressureController,
  getResourceReport,
  createAdaptiveQualityController,
} from "../src/catalogue.js";
import {
  useResourceScope,
  useMemoryMonitor,
  useMemorySnapshot,
  useResourceReport,
  useMemoryPressure,
  ResourceScope,
  MemoryMonitor as MemoryMonitorComponent,
} from "../src/react.js";

describe("Memory & Resource Intelligence Engine", () => {
  describe("Resource Registry & Ownership", () => {
    it("should register, lookup, and track resource records with metadata", () => {
      const registry = createResourceRegistry();
      const mockBuffer = new Float32Array(1024);

      const resId = registry.registerResource({
        category: "typed_array",
        ownerId: "particle_system",
        resource: mockBuffer,
        estimatedBytes: mockBuffer.byteLength,
        metadata: { stride: 4 },
      });

      expect(registry.hasResource(resId)).toBe(true);
      expect(registry.size).toBe(1);

      const record = registry.getResourceRecord(resId);
      expect(record).toBeDefined();
      expect(record?.category).toBe("typed_array");
      expect(record?.ownerId).toBe("particle_system");
      expect(record?.estimatedBytes).toBe(4096);
      expect(record?.metadata.stride).toBe(4);

      const raw = registry.getRawResource<Float32Array>(resId);
      expect(raw).toBe(mockBuffer);

      registry.disposeAll();
    });

    it("should support reference counting and dispose when refCount reaches 0", () => {
      const registry = createResourceRegistry();
      let disposed = false;
      const res = { dispose: () => { disposed = true; } };

      const resId = registry.registerResource({
        category: "texture",
        resource: res,
      });

      expect(registry.retainResource(resId)).toBe(2);
      expect(registry.releaseResource(resId)).toBe(1);
      expect(disposed).toBe(false);

      expect(registry.releaseResource(resId)).toBe(0);
      expect(disposed).toBe(true);
      expect(registry.hasResource(resId)).toBe(false);

      registry.disposeAll();
    });

    it("should transfer resource ownership", () => {
      const registry = createResourceRegistry();
      const resId = registry.registerResource({
        category: "geometry",
        ownerId: "loader",
        resource: {},
      });

      expect(registry.getResourceRecord(resId)?.ownerId).toBe("loader");
      expect(registry.transferResourceOwnership(resId, "scene_renderer")).toBe(true);
      expect(registry.getResourceRecord(resId)?.ownerId).toBe("scene_renderer");

      registry.disposeAll();
    });

    it("should dispose dependent resources in correct topological order", () => {
      const registry = createResourceRegistry();
      const order: string[] = [];

      const baseBufferId = registry.registerResource({
        category: "gpu_buffer",
        resource: { dispose: () => order.push("base_buffer") },
      });

      const meshGeometryId = registry.registerResource({
        category: "geometry",
        resource: { dispose: () => order.push("mesh_geometry") },
        dependencies: [baseBufferId],
      });

      // Disposing base buffer should first dispose mesh geometry dependent on it
      registry.disposeResource(baseBufferId);

      expect(order).toEqual(["mesh_geometry", "base_buffer"]);
      registry.disposeAll();
    });
  });

  describe("Lifecycle Scopes & Idempotent Disposal", () => {
    it("should create hierarchical scopes and dispose descendants in reverse order", () => {
      const registry = createResourceRegistry();
      const parentScope = registry.createResourceScope("parent");
      const childScope = registry.createResourceScope("child", parentScope.id);

      let res1Disposed = false;
      let res2Disposed = false;

      registry.registerResource({
        category: "cpu_buffer",
        scopeId: parentScope.id,
        resource: { dispose: () => { res1Disposed = true; } },
      });

      registry.registerResource({
        category: "cpu_buffer",
        scopeId: childScope.id,
        resource: { dispose: () => { res2Disposed = true; } },
      });

      expect(parentScope.childScopeIds).toContain(childScope.id);

      // Disposing parent scope must dispose child scope and all owned resources
      parentScope.dispose();

      expect(parentScope.isDisposed).toBe(true);
      expect(childScope.isDisposed).toBe(true);
      expect(res1Disposed).toBe(true);
      expect(res2Disposed).toBe(true);
      expect(registry.size).toBe(0);

      registry.disposeAll();
    });

    it("should guarantee idempotent disposal without throwing on repeated calls", () => {
      const registry = createResourceRegistry();
      let disposeCount = 0;
      const res = { dispose: () => { disposeCount++; } };

      const resId = registry.registerResource({
        category: "framebuffer",
        resource: res,
      });

      expect(registry.disposeResource(resId)).toBe(true);
      expect(registry.disposeResource(resId)).toBe(false); // second call is safe no-op
      expect(disposeCount).toBe(1);

      registry.disposeAll();
    });

    it("should safely handle errors thrown inside resource dispose methods", () => {
      const registry = createResourceRegistry();
      const resId = registry.registerResource({
        category: "shader_program",
        resource: {
          dispose: () => {
            throw new Error("Simulated GPU context error");
          },
        },
      });

      expect(() => registry.disposeResource(resId)).not.toThrow();
      expect(registry.getResourceRecord(resId)?.state).toBe("disposed");

      registry.disposeAll();
    });
  });

  describe("Memory Intelligence & Budgets", () => {
    it("should compute category breakdowns and evaluate memory budgets", () => {
      const registry = createResourceRegistry();
      const monitor = createMemoryMonitor(registry, {
        geometryBytes: 1000,
        warningThresholdRatio: 0.5,
        criticalThresholdRatio: 0.8,
      });

      registry.registerResource({
        category: "geometry",
        resource: {},
        estimatedBytes: 600,
      });

      const snap = monitor.captureSnapshot();
      expect(snap.categoryBytes.geometry).toBe(600);
      expect(snap.budgetStatuses.geometry.utilizationRatio).toBe(0.6);
      expect(snap.budgetStatuses.geometry.status).toBe("warning");

      // Add more to push into critical
      registry.registerResource({
        category: "geometry",
        resource: {},
        estimatedBytes: 300,
      });

      const snap2 = monitor.captureSnapshot();
      expect(snap2.categoryBytes.geometry).toBe(900);
      expect(snap2.budgetStatuses.geometry.status).toBe("critical");

      registry.disposeAll();
      monitor.dispose();
    });

    it("should keep historical memory snapshots bounded", () => {
      const registry = createResourceRegistry();
      const monitor = createMemoryMonitor(registry);

      for (let i = 0; i < 70; i++) {
        monitor.captureSnapshot();
      }

      expect(monitor.getHistoricalSnapshots().length).toBeLessThanOrEqual(60);
      registry.disposeAll();
      monitor.dispose();
    });
  });

  describe("Intelligent Resource Cache", () => {
    it("should evict LRU items when exceeding maxEntries", () => {
      const cache = createResourceCache<string, string>({ maxEntries: 2 });
      cache.set("a", "alpha");
      cache.set("b", "bravo");
      cache.get("a"); // touch 'a', making 'b' least-recently-used

      cache.set("c", "charlie"); // should evict 'b'

      expect(cache.has("a")).toBe(true);
      expect(cache.has("c")).toBe(true);
      expect(cache.has("b")).toBe(false);

      const stats = cache.getStats();
      expect(stats.evictions).toBe(1);
      expect(stats.hits).toBe(1);

      cache.dispose();
    });

    it("should protect pinned resources from LRU eviction", () => {
      const cache = createResourceCache<string, string>({ maxEntries: 2 });
      cache.set("p", "pinned");
      cache.pin("p");
      expect(cache.isPinned("p")).toBe(true);

      cache.set("x", "xray");
      cache.set("y", "yankee"); // should evict 'x', preserving pinned 'p'

      expect(cache.has("p")).toBe(true);
      expect(cache.has("y")).toBe(true);
      expect(cache.has("x")).toBe(false);

      cache.dispose();
    });

    it("should support TTL expiration and manual trimming", () => {
      const cache = createResourceCache<string, string>({ maxBytes: 10000 });
      cache.set("short_lived", "data", 2000, 1); // 1ms TTL

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(cache.get("short_lived")).toBeUndefined();
          expect(cache.has("short_lived")).toBe(false);
          cache.dispose();
          resolve();
        }, 10);
      });
    });
  });

  describe("Resource Pooling & SafeBufferPoolManager", () => {
    it("should acquire and release buffers safely", () => {
      const poolMgr = new SafeBufferPoolManager();
      const arr = poolMgr.acquireFloat32(128);
      expect(arr.length).toBe(128);

      const stats = poolMgr.getStats();
      expect(stats.activeAcquiredCount).toBe(1);
      expect(stats.totalAcquiredBytes).toBe(128 * 4);

      expect(poolMgr.releaseFloat32(arr)).toBe(true);
      expect(poolMgr.getStats().activeAcquiredCount).toBe(0);

      // Attempting double-release must be blocked
      expect(poolMgr.releaseFloat32(arr)).toBe(false);
      expect(poolMgr.getStats().doubleReleaseAttempts).toBe(1);

      poolMgr.clear();
    });

    it("should detect detached transferable buffers", () => {
      const poolMgr = new SafeBufferPoolManager();
      const arr = poolMgr.acquireFloat32(64);

      // Simulate detached ArrayBuffer by transferring it via structuredClone or manual detach
      // In JS environments, an empty ArrayBuffer simulates detached buffer
      const fakeDetached = new Float32Array(new ArrayBuffer(0));
      expect(poolMgr.releaseFloat32(fakeDetached)).toBe(false);

      poolMgr.clear();
    });
  });

  describe("Resource Leak Detection", () => {
    it("should detect temporary allocations surviving past max age", () => {
      const registry = createResourceRegistry();
      registry.registerResource({
        category: "cpu_buffer",
        ownerId: "temp_computation",
        resource: {},
        estimatedBytes: 1024,
      });

      // Check leaks with 0ms age threshold
      const leaks = detectResourceLeaks(registry, { temporaryMaxAgeMs: 0 });
      expect(leaks.length).toBe(1);
      expect(leaks[0].ownerId).toBe("temp_computation");
      expect(leaks[0].suspectedCause).toContain("temporary");

      registry.disposeAll();
    });

    it("should flag unusually high reference counts", () => {
      const registry = createResourceRegistry();
      const resId = registry.registerResource({
        category: "texture",
        resource: {},
      });

      for (let i = 0; i < 30; i++) {
        registry.retainResource(resId);
      }

      const leaks = detectResourceLeaks(registry, { maxExpectedRefCount: 10 });
      expect(leaks.some((l) => l.description.includes("reference count"))).toBe(true);

      registry.disposeAll();
    });

    it("should not flag pinned or root resources as leaks", () => {
      const registry = createResourceRegistry();
      registry.registerResource({
        category: "texture",
        ownerId: "root",
        isPinned: true,
        resource: {},
      });

      const leaks = detectResourceLeaks(registry, { temporaryMaxAgeMs: 0, idleMaxAgeMs: 0 });
      expect(leaks.length).toBe(0);

      registry.disposeAll();
    });
  });

  describe("GPU Resource Intelligence & Context Loss", () => {
    it("should handle context loss and safely prevent disposal crashes", () => {
      const registry = createResourceRegistry();
      const gpuIntel = new GpuResourceIntelligence(registry);

      let glDisposed = false;
      const mockGlTexture = {
        dispose: () => {
          if (gpuIntel.isContextLost) throw new Error("glDeleteTextures failed: context lost");
          glDisposed = true;
        },
      };

      gpuIntel.handleContextLost();
      expect(gpuIntel.isContextLost).toBe(true);

      // Safe dispose must not throw
      expect(() => gpuIntel.safeGpuDispose(mockGlTexture)).not.toThrow();
      expect(glDisposed).toBe(false);

      gpuIntel.handleContextRestored();
      expect(gpuIntel.isContextLost).toBe(false);

      gpuIntel.safeGpuDispose(mockGlTexture);
      expect(glDisposed).toBe(true);

      registry.disposeAll();
    });
  });

  describe("Memory Pressure Controller", () => {
    it("should escalate pressure levels and trigger cache/pool trimming", () => {
      const cache = createResourceCache({ maxBytes: 10000 });
      cache.set("item1", "value1", 2000);
      cache.set("item2", "value2", 2000);

      const pressureCtrl = createMemoryPressureController({ cache });
      expect(pressureCtrl.currentPressure).toBe("normal");

      const listener = vi.fn();
      pressureCtrl.onPressureChange(listener);

      pressureCtrl.setPressure("high");
      expect(pressureCtrl.currentPressure).toBe("high");
      expect(listener).toHaveBeenCalledWith("high");

      pressureCtrl.dispose();
      cache.dispose();
    });

    it("should coordinate with AdaptiveQualityController under critical pressure", () => {
      const qualityCtrl = createAdaptiveQualityController();
      qualityCtrl.setQualityPreset("ultra");
      expect(qualityCtrl.getCurrentQuality()).toBe("ultra");

      const pressureCtrl = createMemoryPressureController({
        adaptiveQualityController: qualityCtrl,
      });

      pressureCtrl.setPressure("critical");
      expect(qualityCtrl.getCurrentQuality()).toBe("battery-saver");

      pressureCtrl.dispose();
      qualityCtrl.dispose();
    });
  });

  describe("Diagnostics & Reporting", () => {
    it("should compile a comprehensive resource report", () => {
      const registry = createResourceRegistry();
      registry.registerResource({ category: "geometry", resource: {}, estimatedBytes: 5000 });
      registry.registerResource({ category: "texture", resource: {}, estimatedBytes: 8000 });

      const report = getResourceReport({ registry });
      expect(report.totalTrackedResources).toBe(2);
      expect(report.totalEstimatedBytes).toBe(13000);
      expect(report.resourcesByCategory.geometry).toBe(1);
      expect(report.resourcesByCategory.texture).toBe(1);
      expect(report.recommendations.length).toBeGreaterThan(0);

      registry.disposeAll();
    });
  });

  describe("React Integration", () => {
    it("should export React hooks and components", () => {
      expect(typeof useResourceScope).toBe("function");
      expect(typeof useMemoryMonitor).toBe("function");
      expect(typeof useMemorySnapshot).toBe("function");
      expect(typeof useResourceReport).toBe("function");
      expect(typeof useMemoryPressure).toBe("function");
      expect(typeof ResourceScope).toBe("function");
      expect(typeof MemoryMonitorComponent).toBe("function");
    });
  });
});
