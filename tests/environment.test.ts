/**
 * Vitest Test Suite for AF Motion Environmental Simulation Engine (Prompt 120)
 */

import { describe, expect, it, vi } from "vitest";
import {
  createCloudEffect,
  createEnvironment,
  createFireEffect,
  createFogEffect,
  createLightningEffect,
  createRainEffect,
  createSnowEffect,
  createWeatherSystem,
  createWindSystem,
  disposeEnvironment,
  EnvironmentSimulationImpl,
  updateEnvironment,
  WindSystemImpl,
} from "../src/catalogue.js";

describe("Prompt 120 — Environmental Simulation Engine", () => {
  describe("Wind System", () => {
    it("creates wind system with normalized direction and speed", () => {
      const wind = createWindSystem({
        direction: [3, 4],
        speed: 2.5,
        gustIntensity: 1.0,
      });

      expect(wind).toBeInstanceOf(WindSystemImpl);
      expect(wind.direction[0]).toBeCloseTo(0.6, 5);
      expect(wind.direction[1]).toBeCloseTo(0.8, 5);
      expect(wind.speed).toBe(2.5);
    });

    it("samples wind field with spatial turbulence and gust variation", () => {
      const wind = createWindSystem({
        direction: [1, 0],
        speed: 2.0,
        turbulence: 0.5,
      });

      wind.update(0.1, 1.0);
      const [wx, wy, wz] = wind.sampleWind(0.5, 0.5, 0, 1.0);
      expect(typeof wx).toBe("number");
      expect(typeof wy).toBe("number");
      expect(typeof wz).toBe("number");
      expect(wx).toBeGreaterThan(0.5); // Dominated by positive X wind
    });

    it("converts wind to a Prompt 119 FlowField", () => {
      const wind = createWindSystem({
        direction: [1, 0],
        speed: 3.0,
      });

      const flowField = wind.toFlowField();
      expect(flowField).toBeDefined();
      expect(flowField.type).toBe("directional");
      const [fx, fy] = flowField.evaluate(0.5, 0.5, 0);
      expect(fx).toBeGreaterThan(0);
      expect(fy).toBeCloseTo(0, 5);
    });
  });

  describe("Rain Effect", () => {
    it("creates rain effect with default configuration and particle pools", () => {
      const rain = createRainEffect();
      expect(rain.type).toBe("rain");
      expect(rain.intensity).toBe(1.0);
      expect(rain.dropletSize).toBe(1.5);
      expect(rain.splashesEnabled).toBe(true);
    });

    it("spawns droplets and updates positions based on falling speed and wind", () => {
      const env = createEnvironment({ autoStart: false });
      const rain = createRainEffect({ intensity: 2.0 });

      // Run multiple updates to spawn and advance rain
      for (let i = 0; i < 10; i++) {
        rain.update(0.016, i * 0.016, env);
      }

      expect(rain.activeDroplets).toBeGreaterThan(0);
    });

    it("renders rain streaks and splashes onto Canvas2D context", () => {
      const rain = createRainEffect({ intensity: 1.0 });
      const env = createEnvironment({ autoStart: false });
      rain.update(0.05, 0.05, env);

      const mockCtx = {
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        stroke: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        strokeStyle: "",
        fillStyle: "",
        lineWidth: 1,
      } as unknown as CanvasRenderingContext2D;

      expect(() => rain.render(mockCtx, 800, 600)).not.toThrow();
      expect(mockCtx.beginPath).toHaveBeenCalled();
    });

    it("cleans up particles upon disposal", () => {
      const rain = createRainEffect();
      const env = createEnvironment({ autoStart: false });
      rain.update(0.05, 0.05, env);
      expect(rain.activeDroplets).toBeGreaterThan(0);

      rain.dispose();
      expect(rain.activeDroplets).toBe(0);
    });
  });

  describe("Snow Effect", () => {
    it("creates snow effect and tracks snowflake flutter", () => {
      const snow = createSnowEffect({
        intensity: 1.5,
        flakeSize: 3.0,
        driftAmount: 0.8,
      });

      expect(snow.type).toBe("snow");
      expect(snow.flakeSize).toBe(3.0);

      const env = createEnvironment({ autoStart: false });
      for (let i = 0; i < 10; i++) {
        snow.update(0.016, i * 0.016, env);
      }

      expect(snow.activeFlakes).toBeGreaterThan(0);
    });

    it("renders snowflakes and accumulation layer on Canvas2D", () => {
      const snow = createSnowEffect({ accumulationEnabled: true });
      const env = createEnvironment({ autoStart: false });
      snow.update(0.05, 0.05, env);

      const mockCtx = {
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        closePath: vi.fn(),
        fillStyle: "",
      } as unknown as CanvasRenderingContext2D;

      expect(() => snow.render(mockCtx, 800, 600)).not.toThrow();
      expect(mockCtx.beginPath).toHaveBeenCalled();
    });
  });

  describe("Fog & Atmospheric Haze Effect", () => {
    it("creates fog effect with height-based gradient and animated layers", () => {
      const fog = createFogEffect({
        density: 0.75,
        groundHeight: 0.4,
        layers: 3,
        approximationMode: "height-gradient",
      });

      expect(fog.type).toBe("fog");
      expect(fog.density).toBe(0.75);
      expect(fog.approximationMode).toBe("height-gradient");
    });

    it("renders exponential height fog gradient on Canvas2D", () => {
      const fog = createFogEffect();
      const env = createEnvironment({ autoStart: false });
      fog.update(0.1, 0.1, env);

      const mockGradient = { addColorStop: vi.fn() };
      const mockCtx = {
        save: vi.fn(),
        restore: vi.fn(),
        createLinearGradient: vi.fn().mockReturnValue(mockGradient),
        fillRect: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        closePath: vi.fn(),
        fill: vi.fn(),
        fillStyle: "",
      } as unknown as CanvasRenderingContext2D;

      expect(() => fog.render(mockCtx, 800, 600)).not.toThrow();
      expect(mockCtx.createLinearGradient).toHaveBeenCalled();
      expect(mockGradient.addColorStop).toHaveBeenCalled();
      expect(mockCtx.fillRect).toHaveBeenCalled();
    });
  });

  describe("Cloud Effect", () => {
    it("creates procedural cloud layers with wind-driven animation", () => {
      const clouds = createCloudEffect({
        coverage: 0.7,
        density: 0.9,
        layers: 3,
        windDriven: true,
      });

      expect(clouds.type).toBe("cloud");
      expect(clouds.coverage).toBe(0.7);

      const env = createEnvironment({ autoStart: false });
      clouds.update(0.1, 1.0, env);

      const mockCtx = {
        save: vi.fn(),
        restore: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        fillStyle: "",
      } as unknown as CanvasRenderingContext2D;

      expect(() => clouds.render(mockCtx, 800, 600)).not.toThrow();
    });
  });

  describe("Fire & Smoke Effect", () => {
    it("creates fire effect with upward buoyancy and thermal color ramp", () => {
      const fire = createFireEffect({
        intensity: 1.2,
        smokeEnabled: true,
        smokeDensity: 0.8,
      });

      expect(fire.type).toBe("fire");
      expect(fire.smokeEnabled).toBe(true);

      const env = createEnvironment({ autoStart: false });
      for (let i = 0; i < 15; i++) {
        fire.update(0.016, i * 0.016, env);
      }

      expect(fire.activeFireParticles).toBeGreaterThan(0);
    });

    it("renders additive fire glow and smoke puffs on Canvas2D", () => {
      const fire = createFireEffect();
      const env = createEnvironment({ autoStart: false });
      fire.update(0.05, 0.05, env);

      const mockCtx = {
        save: vi.fn(),
        restore: vi.fn(),
        beginPath: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        fillStyle: "",
        globalCompositeOperation: "",
      } as unknown as CanvasRenderingContext2D;

      expect(() => fire.render(mockCtx, 800, 600)).not.toThrow();
    });
  });

  describe("Lightning & Weather Events", () => {
    it("generates recursive branching bolts and triggers distance-based thunder callback", () => {
      const onThunder = vi.fn();
      const lightning = createLightningEffect({
        onThunder,
        branchCount: 3,
      });

      expect(lightning.type).toBe("lightning");

      // Manually trigger strike
      const strike = lightning.triggerStrike(0.5, 0.1, 0.5, 0.9);
      expect(strike.branches.length).toBeGreaterThanOrEqual(1);
      expect(lightning.activeStrikeCount).toBe(1);

      // Verify thunder callback was invoked with reasonable delay (> 500ms)
      expect(onThunder).toHaveBeenCalledTimes(1);
      const [delayMs, passedStrike] = onThunder.mock.calls[0]!;
      expect(delayMs).toBeGreaterThan(500);
      expect(passedStrike.id).toBe(strike.id);
    });

    it("renders lightning bolt branches and screen illumination flash", () => {
      const lightning = createLightningEffect();
      lightning.triggerStrike();

      const mockCtx = {
        save: vi.fn(),
        restore: vi.fn(),
        fillRect: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        stroke: vi.fn(),
        fillStyle: "",
        strokeStyle: "",
        lineWidth: 1,
      } as unknown as CanvasRenderingContext2D;

      expect(() => lightning.render(mockCtx, 800, 600)).not.toThrow();
      expect(mockCtx.fillRect).toHaveBeenCalled(); // Screen flash
      expect(mockCtx.stroke).toHaveBeenCalled(); // Bolt line
    });
  });

  describe("Weather System & Transitions", () => {
    it("initializes with weather presets and coordinates atmospheric parameters", () => {
      const weather = createWeatherSystem("rain");
      expect(weather.currentWeather).toBe("rain");

      const env = createEnvironment({ weather: "rain", autoStart: false });
      weather.update(0.016, env);

      expect(env.parameters.humidity).toBeGreaterThan(0.8);
      expect(env.parameters.ambientLight).toBeLessThan(0.7);
    });

    it("interpolates parameters smoothly during weather transitions", () => {
      const env = createEnvironment({ weather: "clear", autoStart: false });
      env.setWeather("storm", 2.0);

      expect(env.weather.targetWeather).toBe("storm");

      // Advance transition halfway (1.0 sec)
      env.update(1.0);
      expect(env.weather.transitionProgress).toBeCloseTo(0.5, 1);

      // Finish transition
      env.update(1.2);
      expect(env.weather.currentWeather).toBe("storm");
      expect(env.weather.targetWeather).toBeNull();
    });
  });

  describe("Environment Simulation Controller Lifecycle & Management", () => {
    it("manages multiple simultaneous effects and updates metrics", () => {
      const rain = createRainEffect();
      const fog = createFogEffect();
      const env = createEnvironment({
        effects: [rain, fog],
        autoStart: false,
      });

      expect(env).toBeInstanceOf(EnvironmentSimulationImpl);
      expect(env.getEffects().length).toBe(2);

      env.update(0.016);
      expect(env.metrics.activeEffects).toBe(2);
      expect(env.metrics.fps).toBeGreaterThanOrEqual(30);
      expect(env.metrics.memoryBytes).toBeGreaterThan(0);
    });

    it("supports runtime parameter updates without simulation recreation", () => {
      const env = createEnvironment({ autoStart: false });
      expect(env.parameters.temperature).toBe(20);

      env.updateParameters({
        temperature: 32,
        humidity: 0.85,
        visibility: 0.6,
        ambientLight: 0.5,
      });

      expect(env.parameters.temperature).toBe(32);
      expect(env.parameters.humidity).toBe(0.85);
      expect(env.parameters.visibility).toBe(0.6);
      expect(env.parameters.ambientLight).toBe(0.5);
    });

    it("handles dynamic effect addition, retrieval, and removal", () => {
      const env = createEnvironment({ autoStart: false });
      const snow = createSnowEffect({ intensity: 0.8 });

      env.addEffect(snow);
      expect(env.getEffect(snow.id)).toBe(snow);
      expect(env.getEffects().length).toBe(1);

      expect(env.removeEffect(snow.id)).toBe(true);
      expect(env.getEffects().length).toBe(0);
      expect(env.removeEffect("non-existent")).toBe(false);
    });

    it("handles lifecycle state transitions: start, pause, resume, reset, dispose", () => {
      const env = createEnvironment({ autoStart: false });
      expect(env.state).toBe("idle");

      env.start();
      expect(env.state).toBe("running");

      env.pause();
      expect(env.state).toBe("paused");

      env.resume();
      expect(env.state).toBe("running");

      env.reset();
      expect(env.state).toBe("running");

      env.dispose();
      expect(env.state).toBe("disposed");
      expect(env.getEffects().length).toBe(0);
    });

    it("executes standalone helper functions", () => {
      const env = createEnvironment({ autoStart: false });
      expect(() => updateEnvironment(env, 0.016)).not.toThrow();
      expect(() => disposeEnvironment(env)).not.toThrow();
    });

    it("renders complete environmental scene with depth sorting on Canvas2D", () => {
      const mockCtx = {
        save: vi.fn(),
        restore: vi.fn(),
        fillRect: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        stroke: vi.fn(),
        fillStyle: "",
        strokeStyle: "",
        lineWidth: 1,
        createLinearGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
      };

      const mockCanvas = {
        width: 800,
        height: 600,
        getContext: (type: string) => (type === "2d" ? mockCtx : null),
      } as unknown as HTMLCanvasElement;

      const env = createEnvironment({
        effects: [
          createRainEffect(),
          createSnowEffect(),
          createFogEffect(),
          createCloudEffect(),
          createFireEffect(),
          createLightningEffect(),
        ],
        canvas: mockCanvas,
        autoStart: false,
      });

      env.update(0.016);
      expect(() => env.render(mockCanvas)).not.toThrow();
      expect(mockCtx.fillRect).toHaveBeenCalled(); // Atmospheric background
    });
  });
});
