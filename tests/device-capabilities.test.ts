import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  detectDeviceCapabilities,
  detectDeviceCapabilitiesAsync,
  detectDetailedGraphics,
  detectRuntimeEnvironment,
  detectMemoryCapabilities,
  detectCpuCapabilities,
  detectDisplayCapabilities,
  detectNetworkCapabilities,
  detectBatteryCapabilities,
  classifyDevice,
  calculateCapabilityScores,
  getDeviceCapabilityProfile,
  refreshDeviceCapabilities,
  resetCachedDeviceProfile,
  subscribeToCapabilityChanges,
  disposeCapabilityMonitor,
  isCapabilityMonitoringActive,
  type MockEnvironment,
} from "../src/catalogue.js";
import {
  useDeviceCapabilities,
  useDetailedGraphicsCapabilities,
  useDeviceCapabilityChanges,
} from "../src/react.js";

describe("Phase 16 — Device Capability Detection Engine", () => {
  beforeEach(() => {
    resetCachedDeviceProfile();
    disposeCapabilityMonitor();
  });

  afterEach(() => {
    disposeCapabilityMonitor();
    resetCachedDeviceProfile();
    vi.restoreAllMocks();
  });

  describe("1. Runtime Environment Detection", () => {
    it("detects browser environment accurately", () => {
      const runtime = detectRuntimeEnvironment({ isBrowser: true, userAgent: "Mozilla/5.0 Chrome" });
      expect(runtime.isBrowser).toBe(true);
      expect(runtime.isSSR).toBe(false);
      expect(runtime.environment.value).toBe("browser");
      expect(runtime.environment.status).toBe("detected");
    });

    it("detects SSR and Node.js environment safely", () => {
      const ssrRuntime = detectRuntimeEnvironment({ isSSR: true, isNode: true });
      expect(ssrRuntime.isSSR).toBe(true);
      expect(ssrRuntime.isBrowser).toBe(false);
      expect(ssrRuntime.environment.value).toBe("ssr");
    });

    it("detects Web Worker environment", () => {
      const workerRuntime = detectRuntimeEnvironment({ isWorker: true });
      expect(workerRuntime.isWorker).toBe(true);
      expect(workerRuntime.environment.value).toBe("worker");
    });
  });

  describe("2. CPU & Memory Capabilities", () => {
    it("detects hardware concurrency without fabrication", () => {
      const cpu = detectCpuCapabilities({ hardwareConcurrency: 8 });
      expect(cpu.concurrency.value).toBe(8);
      expect(cpu.concurrency.status).toBe("detected");
      expect(cpu.wasmSupported.value).toBe(true);
    });

    it("detects device memory and heap metrics where exposed", () => {
      const mem = detectMemoryCapabilities({
        deviceMemory: 16,
        jsHeapSizeLimit: 4096,
        totalJSHeapSize: 512,
        usedJSHeapSize: 256,
      });

      expect(mem.deviceMemoryGB.value).toBe(16);
      expect(mem.deviceMemoryGB.status).toBe("detected");
      expect(mem.jsHeapLimitMB.value).toBe(4096);
      expect(mem.totalJSHeapMB.value).toBe(512);
      expect(mem.usedJSHeapMB.value).toBe(256);
    });

    it("distinguishes unexposed memory metrics gracefully", () => {
      const mem = detectMemoryCapabilities();
      // On Node / standard test runner without Chrome memory extensions
      expect(["detected", "unsupported", "unavailable"]).toContain(mem.deviceMemoryGB.status);
    });
  });

  describe("3. Graphics Capabilities (WebGL & WebGPU)", () => {
    it("detects WebGL2 and WebGPU graphics ceilings", () => {
      const mockEnv: MockEnvironment = {
        webgl1: true,
        webgl2: true,
        webgpu: true,
        maxTextureSize: 16384,
      };

      const graphics = detectDetailedGraphics({ mockEnv });
      expect(graphics.webgl.webgl2.value).toBe(true);
      expect(graphics.webgpu.apiAvailable.value).toBe(true);
      expect(graphics.webgl.maxTextureSize.value).toBe(16384);
      expect(graphics.supportedBackends).toContain("webgpu");
      expect(graphics.supportedBackends).toContain("webgl2");
      expect(graphics.activeBackend).toBe("webgpu");
    });

    it("falls back to WebGL1 when WebGL2 is unavailable", () => {
      const mockEnv: MockEnvironment = {
        webgl1: true,
        webgl2: false,
        webgpu: false,
        maxTextureSize: 2048,
      };

      const graphics = detectDetailedGraphics({ mockEnv });
      expect(graphics.webgl.webgl1.value).toBe(true);
      expect(graphics.webgl.webgl2.value).toBe(false);
      expect(graphics.webgpu.apiAvailable.value).toBe(false);
      expect(graphics.activeBackend).toBe("webgl");
    });

    it("safely handles non-browser environment with null backend", () => {
      const graphics = detectDetailedGraphics({
        mockEnv: { isBrowser: false, webgl1: false, webgl2: false, webgpu: false },
      });
      expect(graphics.webgl.webgl1.value).toBe(false);
      expect(graphics.webgl.webgl2.value).toBe(false);
      expect(graphics.webgpu.apiAvailable.value).toBe(false);
    });
  });

  describe("4. Display & Network Conditions", () => {
    it("detects display characteristics and media queries", () => {
      const display = detectDisplayCapabilities({
        dpr: 2,
        reducedMotion: true,
      });

      expect(display.dpr.value).toBe(2);
      expect(display.reducedMotion.value).toBe(true);
      expect(display.reducedMotion.status).toBe("detected");
    });

    it("detects network connectivity indicators", () => {
      const net = detectNetworkCapabilities({
        online: true,
        effectiveType: "4g",
        saveData: false,
      });

      expect(net.online.value).toBe(true);
      expect(net.effectiveType.value).toBe("4g");
      expect(net.saveData.value).toBe(false);
    });

    it("handles battery status API defensively", () => {
      const battery = detectBatteryCapabilities({
        batteryCharging: true,
        batteryLevel: 0.95,
      });

      expect(battery.charging.value).toBe(true);
      expect(battery.level.value).toBe(0.95);
    });
  });

  describe("5. Device Classification", () => {
    it("classifies high-end desktop correctly", () => {
      const mockEnv: MockEnvironment = {
        isBrowser: true,
        hardwareConcurrency: 16,
        deviceMemory: 16,
        webgl1: true,
        webgl2: true,
        maxTextureSize: 16384,
      };

      const profile = detectDeviceCapabilities({ mockEnvironment: mockEnv });
      expect(profile.category).toBe("high-end-desktop");
      expect(profile.categoryRationale).toContain("High-end desktop");
    });

    it("classifies low-end mobile correctly", () => {
      const mockEnv: MockEnvironment = {
        isBrowser: true,
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 10_0 like Mac OS X) Mobile",
        hardwareConcurrency: 2,
        deviceMemory: 2,
        webgl1: true,
        webgl2: false,
        maxTextureSize: 2048,
      };

      const profile = detectDeviceCapabilities({ mockEnvironment: mockEnv });
      expect(profile.category).toBe("low-end-mobile");
      expect(profile.categoryRationale).toContain("Low-end mobile");
    });

    it("classifies tablet correctly using touch and viewport signals", () => {
      const profile = detectDeviceCapabilities({
        mockEnvironment: {
          isBrowser: true,
          userAgent: "Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X)",
          hardwareConcurrency: 6,
          webgl2: true,
        },
      });

      // Tablet classification
      const result = classifyDevice({
        runtime: profile.runtime,
        cpu: profile.cpu,
        memory: profile.memory,
        webgl: profile.webgl,
        display: profile.display,
        touchSupport: true,
      });

      expect(result.category).toBe("tablet");
      expect(result.isTablet).toBe(true);
    });
  });

  describe("6. Multi-Dimensional Capability Scoring", () => {
    it("calculates separate deterministic capability scores", () => {
      const profile = detectDeviceCapabilities({
        mockEnvironment: {
          hardwareConcurrency: 8,
          deviceMemory: 8,
          webgl1: true,
          webgl2: true,
          maxTextureSize: 8192,
        },
      });

      const scores = calculateCapabilityScores({
        runtime: profile.runtime,
        cpu: profile.cpu,
        memory: profile.memory,
        webgl: profile.webgl,
        webgpu: profile.webgpu,
        display: profile.display,
      });

      expect(scores.cpu.score).toBeGreaterThan(50);
      expect(scores.memory.score).toBeGreaterThan(50);
      expect(scores.gpu.score).toBeGreaterThan(50);
      expect(scores.overallScore).toBeGreaterThan(50);
      expect(scores.cpu.confidence).toBe("high");
      expect(scores.cpu.supportingSignals.length).toBeGreaterThan(0);
      expect(scores.cpu.rationale).toBeDefined();
    });
  });

  describe("7. Detection Modes & Async Probes", () => {
    it("caches profile and supports forced refresh", () => {
      const p1 = detectDeviceCapabilities();
      const p2 = getDeviceCapabilityProfile();
      expect(p1).toBe(p2);

      const p3 = refreshDeviceCapabilities();
      expect(p3.detectedAt).toBeGreaterThanOrEqual(p1.detectedAt);
    });

    it("supports asynchronous detection with AbortSignal", async () => {
      const asyncProfile = await detectDeviceCapabilitiesAsync();
      expect(asyncProfile).toBeDefined();
      expect(asyncProfile.category).toBeDefined();

      const controller = new AbortController();
      controller.abort();
      await expect(detectDeviceCapabilitiesAsync({ signal: controller.signal })).rejects.toThrow("aborted");
    });
  });

  describe("8. Live Capability Monitoring", () => {
    it("subscribes and cleans up event listeners cleanly", () => {
      const listener = vi.fn();
      const subscription = subscribeToCapabilityChanges(listener);

      expect(isCapabilityMonitoringActive()).toBe(true);
      subscription.unsubscribe();
      expect(isCapabilityMonitoringActive()).toBe(false);
    });

    it("disposes monitor on disposeCapabilityMonitor()", () => {
      subscribeToCapabilityChanges(() => {});
      expect(isCapabilityMonitoringActive()).toBe(true);

      disposeCapabilityMonitor();
      expect(isCapabilityMonitoringActive()).toBe(false);
    });
  });

  describe("9. React Integration", () => {
    it("exports all React hooks cleanly", () => {
      expect(typeof useDeviceCapabilities).toBe("function");
      expect(typeof useDetailedGraphicsCapabilities).toBe("function");
      expect(typeof useDeviceCapabilityChanges).toBe("function");
    });
  });
});
