// @vitest-environment jsdom

import { StrictMode, act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createSimulationCoordinator,
  TypedArrayPool,
  sharedBufferPool,
  AdaptiveQualityController,
  benchmarkParticleSimulation,
  benchmarkFluidSimulation,
  benchmarkSpatialQueries,
  benchmarkMultiSimulation,
  setupCanvasContextLossRecovery,
  SimulationResourceManager,
  createParticleParticipant,
  createFluidParticipant,
  createEnvironmentParticipant,
  createInteractiveParticleParticipant,
  type SimulationParticipant,
} from "../src/graphics/simulation/index.js";

import { createParticleSystem } from "../src/graphics/particles/index.js";
import { createFluidSimulation } from "../src/graphics/fluid/index.js";
import { createEnvironment } from "../src/graphics/environment/index.js";
import { createInteractiveParticleSystem } from "../src/graphics/particle-fields/index.js";

import {
  SimulationCanvas,
  ParticleField,
  FluidSimulation,
  Environment,
  InteractiveParticles,
  useSimulationController,
  useParticleSystem,
  useFluidSimulation,
  useEnvironment,
  useInteractiveParticleSystem,
} from "../src/react.js";

describe("Prompt 122 — Simulation Optimization & React Integration", () => {
  let host: HTMLDivElement;
  let root: Root;
  let mock2DContext: any;
  let mockGL2: any;
  const originalGetContext = HTMLCanvasElement.prototype.getContext;

  beforeEach(() => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);

    mock2DContext = {
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      fillStyle: "",
      globalAlpha: 1,
      globalCompositeOperation: "source-over",
    };

    mockGL2 = {
      COLOR_BUFFER_BIT: 0x4000,
      DEPTH_BUFFER_BIT: 0x0100,
      clear: vi.fn(),
      getExtension: vi.fn().mockReturnValue({ loseContext: vi.fn() }),
    };

    HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation(function (type: string) {
      if (type === "2d") return mock2DContext;
      if (type === "webgl2") return mockGL2;
      return null;
    }) as any;
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    host.remove();
    HTMLCanvasElement.prototype.getContext = originalGetContext;
  });

  // ---------------------------------------------------------------------------
  // 1. PERFORMANCE & OPTIMIZATION
  // ---------------------------------------------------------------------------

  describe("1. Buffer Pooling & Adaptive Quality", () => {
    it("TypedArrayPool acquires and releases buffers without memory leaks", () => {
      const pool = new TypedArrayPool();
      const arr1 = pool.acquireFloat32(1024);
      expect(arr1.length).toBe(1024);

      pool.releaseFloat32(arr1);
      const arr2 = pool.acquireFloat32(1024);
      // Recycled same reference
      expect(arr2).toBe(arr1);

      const uintArr = pool.acquireUint32(512);
      expect(uintArr.length).toBe(512);
      pool.releaseUint32(uintArr);
      const uintArr2 = pool.acquireUint32(512);
      expect(uintArr2).toBe(uintArr);

      pool.clear();
      expect(sharedBufferPool).toBeDefined();
    });

    it("AdaptiveQualityController dynamically throttles quality on slow frames", () => {
      const ctrl = new AdaptiveQualityController("ultra");
      expect(ctrl.quality).toBe("ultra");

      // Record 16 slow frames (> 25ms)
      for (let i = 0; i < 20; i++) {
        ctrl.recordFrame(28);
      }
      expect(ctrl.quality).toBe("high");

      // Direct override
      ctrl.setQuality("low");
      expect(ctrl.quality).toBe("low");
    });
  });

  describe("2. Simulation Benchmarks (1k, 10k, 50k & Multi-System)", () => {
    it("benchmarks 1,000 particles under sub-frame budget", () => {
      const res = benchmarkParticleSimulation(1000, 20);
      expect(res.particleCount).toBe(1000);
      expect(res.steps).toBe(20);
      expect(res.durationMs).toBeGreaterThan(0);
      expect(res.avgStepMs).toBeLessThan(15);
    });

    it("benchmarks 10,000 particles simulation throughput", () => {
      const res = benchmarkParticleSimulation(10000, 10);
      expect(res.particleCount).toBe(10000);
      expect(res.particlesPerSec).toBeGreaterThan(10000);
    });

    it("benchmarks 50,000 particles high-density layout", () => {
      const res = benchmarkParticleSimulation(50000, 5);
      expect(res.particleCount).toBe(50000);
      expect(res.durationMs).toBeGreaterThan(0);
    });

    it("benchmarks fluid simulation grid step performance", () => {
      const res = benchmarkFluidSimulation(16, 10);
      expect(res.gridResolution).toBe(16);
      expect(res.cellCount).toBe(256);
      expect(res.avgStepMs).toBeLessThan(20);
    });

    it("benchmarks spatial field query broad-phase culling", () => {
      const res = benchmarkSpatialQueries(500, 4, 10);
      expect(res.particleCount).toBe(500);
      expect(res.forceFieldCount).toBe(4);
      expect(res.queriesPerSec).toBeGreaterThan(1000);
    });

    it("benchmarks multi-simulation concurrent stepping", () => {
      const res = benchmarkMultiSimulation(500, 16, 10);
      expect(res.fps).toBeGreaterThan(0);
      expect(res.durationMs).toBeGreaterThan(0);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. UNIFIED SIMULATION LIFECYCLE
  // ---------------------------------------------------------------------------

  describe("3. Unified Simulation Coordinator", () => {
    it("coordinates multiple participants with priority ordering and deterministic step", () => {
      const coordinator = createSimulationCoordinator({ autoStart: false });
      const executionOrder: string[] = [];

      const p1: SimulationParticipant = {
        id: "p1",
        type: "particle",
        priority: 20,
        step: vi.fn(() => executionOrder.push("p1")),
        dispose: vi.fn(),
      };

      const p2: SimulationParticipant = {
        id: "p2",
        type: "fluid",
        priority: 10,
        step: vi.fn(() => executionOrder.push("p2")),
        dispose: vi.fn(),
      };

      const unreg1 = coordinator.register(p1);
      const unreg2 = coordinator.register(p2);

      expect(coordinator.listParticipants().map((p) => p.id)).toEqual(["p2", "p1"]);

      coordinator.step(1 / 60);
      expect(executionOrder).toEqual(["p2", "p1"]);
      expect(p1.step).toHaveBeenCalledWith(1 / 60, expect.any(Number));
      expect(p2.step).toHaveBeenCalledWith(1 / 60, expect.any(Number));

      unreg1();
      expect(coordinator.listParticipants().map((p) => p.id)).toEqual(["p2"]);

      unreg2();
      coordinator.dispose();
      expect(coordinator.getState()).toBe("disposed");
    });

    it("supports pause, resume, reset and metrics tracking", () => {
      const coordinator = createSimulationCoordinator({ autoStart: false });
      expect(coordinator.getState()).toBe("idle");

      coordinator.start();
      expect(coordinator.getState()).toBe("running");

      coordinator.pause();
      expect(coordinator.getState()).toBe("paused");

      coordinator.resume();
      expect(coordinator.getState()).toBe("running");

      coordinator.step(0.05);
      coordinator.reset();

      const metrics = coordinator.getMetrics();
      expect(metrics.state).toBe("running");
      expect(metrics.totalSimulationTime).toBe(0);

      coordinator.dispose();
    });

    it("adapts subsystems via participant bridges", () => {
      const coordinator = createSimulationCoordinator({ autoStart: false });

      const ps = createParticleSystem({ autoStart: false });
      const fs = createFluidSimulation({ autoStart: false });
      const env = createEnvironment({ autoStart: false });
      const ips = createInteractiveParticleSystem({ autoStart: false });

      const partP = createParticleParticipant("ps", ps);
      const partF = createFluidParticipant("fs", fs);
      const partE = createEnvironmentParticipant("env", env);
      const partI = createInteractiveParticleParticipant("ips", ips);

      coordinator.register(partP);
      coordinator.register(partF);
      coordinator.register(partE);
      coordinator.register(partI);

      expect(coordinator.listParticipants().length).toBe(4);

      coordinator.step(1 / 60);

      coordinator.dispose();
      expect(coordinator.getState()).toBe("disposed");
    });
  });

  // ---------------------------------------------------------------------------
  // 3. GPU RESOURCE MANAGEMENT & RELIABILITY
  // ---------------------------------------------------------------------------

  describe("4. GPU Resource Lifecycle & Context Loss", () => {
    it("handles WebGL context loss and restoration with preventDefault", () => {
      const canvas = document.createElement("canvas");
      let lostFired = false;
      let restoredFired = false;

      const unbind = setupCanvasContextLossRecovery(
        canvas,
        () => {
          lostFired = true;
        },
        () => {
          restoredFired = true;
        }
      );

      const lostEvent = new Event("webglcontextlost", { cancelable: true });
      const restoredEvent = new Event("webglcontextrestored");

      canvas.dispatchEvent(lostEvent);
      expect(lostFired).toBe(true);
      expect(lostEvent.defaultPrevented).toBe(true); // preventDefault called to allow restore

      canvas.dispatchEvent(restoredEvent);
      expect(restoredFired).toBe(true);

      unbind();
    });

    it("SimulationResourceManager cleans up all tracked resources and prevents leaks", () => {
      const manager = new SimulationResourceManager();
      let cleaned1 = false;
      let cleaned2 = false;

      manager.track(() => {
        cleaned1 = true;
      });
      manager.track(() => {
        cleaned2 = true;
      });

      expect(manager.disposed).toBe(false);
      manager.dispose();
      expect(manager.disposed).toBe(true);
      expect(cleaned1).toBe(true);
      expect(cleaned2).toBe(true);

      // Safe against repeated disposal
      expect(() => manager.dispose()).not.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // 4. REACT INTEGRATION & HOOKS
  // ---------------------------------------------------------------------------

  describe("5. React Simulation Hooks", () => {
    it("useSimulationController manages coordinator actions and state", () => {
      let controller: any;

      function ControllerComp() {
        controller = useSimulationController({ autoStart: false });
        return createElement("div", null, `State: ${controller.state}`);
      }

      act(() => {
        root.render(createElement(ControllerComp));
      });

      expect(controller.state).toBe("idle");
      expect(controller.quality).toBe("high");

      act(() => {
        controller.start();
      });
      expect(controller.coordinator.getState()).toBe("running");

      act(() => {
        controller.setQuality("medium");
      });
      expect(controller.quality).toBe("medium");

      act(() => {
        controller.pause();
      });
      expect(controller.coordinator.getState()).toBe("paused");
    });

    it("useParticleSystem initializes, bursts, and cleans up on unmount", () => {
      let psCtrl: any;

      function ParticleComp() {
        psCtrl = useParticleSystem({ capacity: 50, autoStart: false });
        return createElement("div", null, "particles");
      }

      act(() => {
        root.render(createElement(ParticleComp));
      });

      expect(psCtrl.system).toBeDefined();
      expect(typeof psCtrl.burst).toBe("function");

      act(() => {
        const spawned = psCtrl.burst(5);
        expect(spawned).toBeGreaterThanOrEqual(0);
      });

      const disposeSpy = vi.spyOn(psCtrl.system, "dispose");
      act(() => {
        root.render(null);
      });
      expect(disposeSpy).toHaveBeenCalled();
    });

    it("useFluidSimulation initializes, applies forces, and samples velocity", () => {
      let fluidCtrl: any;

      function FluidComp() {
        fluidCtrl = useFluidSimulation({ gridResolution: 16, autoStart: false });
        return createElement("div", null, "fluid");
      }

      act(() => {
        root.render(createElement(FluidComp));
      });

      expect(fluidCtrl.simulation).toBeDefined();

      act(() => {
        fluidCtrl.applyForceAt(0.5, 0.5, 10, 5, 0.1);
        fluidCtrl.addDensityAt(0.5, 0.5, 2.0, 0.1);
      });

      const vel = fluidCtrl.sampleVelocity(0.5, 0.5);
      expect(vel).toHaveProperty("vx");
      expect(vel).toHaveProperty("vy");

      const disposeSpy = vi.spyOn(fluidCtrl.simulation, "dispose");
      act(() => {
        root.render(null);
      });
      expect(disposeSpy).toHaveBeenCalled();
    });

    it("useEnvironment initializes and updates weather and wind", () => {
      let envCtrl: any;

      function EnvComp() {
        envCtrl = useEnvironment({ autoStart: false });
        return createElement("div", null, "env");
      }

      act(() => {
        root.render(createElement(EnvComp));
      });

      expect(envCtrl.environment).toBeDefined();

      act(() => {
        envCtrl.setWeather("rain");
        envCtrl.setWind({ speed: 15, direction: 90, turbulence: 0.5 });
      });

      expect(envCtrl.environment.wind.speed).toBe(15);

      const disposeSpy = vi.spyOn(envCtrl.environment, "dispose");
      act(() => {
        root.render(null);
      });
      expect(disposeSpy).toHaveBeenCalled();
    });

    it("useInteractiveParticleSystem initializes and coordinates forces", () => {
      let ipsCtrl: any;

      function InteractiveComp() {
        ipsCtrl = useInteractiveParticleSystem({ maxParticles: 100, autoStart: false });
        return createElement("div", null, "interactive");
      }

      act(() => {
        root.render(createElement(InteractiveComp));
      });

      expect(ipsCtrl.system).toBeDefined();

      let unregField: () => void = () => {};
      act(() => {
        unregField = ipsCtrl.addField({
          id: "custom_attractor",
          type: "attraction",
          position: [0, 0, 0],
          strength: 10,
          radius: 0.5,
        });
        ipsCtrl.triggerGesture("tap", 0, 0);
      });

      expect(typeof unregField).toBe("function");
      unregField();

      const disposeSpy = vi.spyOn(ipsCtrl.system, "dispose");
      act(() => {
        root.render(null);
      });
      expect(disposeSpy).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // 5. REACT COMPOSITION & STRICT MODE SAFETY
  // ---------------------------------------------------------------------------

  describe("6. React Composition inside <SimulationCanvas>", () => {
    it("renders <SimulationCanvas> with child subsystems sharing the master coordinator", () => {
      let coordinatorRef: any;

      function MultiSystemScene() {
        return createElement(
          SimulationCanvas,
          {
            autoStart: false,
            width: 640,
            height: 480,
            onStateChange: (s) => {
              coordinatorRef = s;
            },
          },
          createElement(ParticleField, { config: { capacity: 100, autoStart: false } }),
          createElement(FluidSimulation, { config: { gridResolution: 16, autoStart: false } }),
          createElement(Environment, { weather: "snow", config: { autoStart: false } }),
          createElement(InteractiveParticles, { config: { maxParticles: 100, autoStart: false } })
        );
      }

      act(() => {
        root.render(createElement(MultiSystemScene));
      });

      const canvas = host.querySelector("canvas");
      expect(canvas).not.toBeNull();
      expect(canvas?.getAttribute("width")).toBe("640");
      expect(canvas?.getAttribute("height")).toBe("480");

      // Verify that children inside SimulationCanvas do NOT mount secondary canvases
      const allCanvases = host.querySelectorAll("canvas");
      expect(allCanvases.length).toBe(1);

      act(() => {
        root.render(null);
      });
      expect(host.querySelector("canvas")).toBeNull();
    });

    it("survives React Strict Mode double-mount safely without resource leaks", () => {
      let renderCount = 0;

      function StrictScene() {
        renderCount++;
        return createElement(
          StrictMode,
          null,
          createElement(
            SimulationCanvas,
            { autoStart: false },
            createElement(ParticleField, { config: { autoStart: false } }),
            createElement(FluidSimulation, { config: { autoStart: false } })
          )
        );
      }

      act(() => {
        root.render(createElement(StrictScene));
      });

      expect(renderCount).toBeGreaterThan(0);
      const canvas = host.querySelector("canvas");
      expect(canvas).not.toBeNull();

      act(() => {
        root.render(null);
      });
      expect(host.querySelector("canvas")).toBeNull();
    });

    it("renders standalone simulation components outside SimulationCanvas", () => {
      function StandaloneScene() {
        return createElement(
          "div",
          null,
          createElement(ParticleField, { className: "pf-canvas", config: { autoStart: false } }),
          createElement(FluidSimulation, { className: "fluid-canvas", config: { autoStart: false } }),
          createElement(Environment, { className: "env-canvas", config: { autoStart: false } }),
          createElement(InteractiveParticles, { className: "ips-canvas", config: { autoStart: false } })
        );
      }

      act(() => {
        root.render(createElement(StandaloneScene));
      });

      const canvases = host.querySelectorAll("canvas");
      expect(canvases.length).toBe(4);

      act(() => {
        root.render(null);
      });
      expect(host.querySelectorAll("canvas").length).toBe(0);
    });
  });
});
