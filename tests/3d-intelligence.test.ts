// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";

import {
  // Camera Intelligence
  CAMERA_PRESETS,
  getCameraPreset,
  interpolateCamera,
  applyCameraConstraints,
  resolveResponsiveFov,
  validateCameraConfig,
  correctCameraConfig,
  // Lighting Intelligence
  LIGHTING_3D_PRESETS,
  getLighting3DPreset,
  validateLightingConfig,
  correctLightingConfig,
  resolveLightingFallbacks,
  // Environment Intelligence
  ENVIRONMENT_PRESETS,
  getEnvironmentPreset,
  validateEnvironmentConfig,
  correctEnvironmentConfig,
  // Material Intelligence
  MATERIAL_3D_PRESETS,
  getMaterial3DPreset,
  surfaceToMaterial3D,
  validateMaterial3D,
  correctMaterial3D,
  // Schemas & Capabilities
  validateSceneSchema,
  CAMERA_3D_INTELLIGENCE_CAPABILITY,
  LIGHTING_3D_INTELLIGENCE_CAPABILITY,
  ENVIRONMENT_3D_INTELLIGENCE_CAPABILITY,
  MATERIAL_3D_INTELLIGENCE_CAPABILITY,
  register3DIntelligenceCapabilities,
  aiMotionRegistry,
  type SurfaceDefinition,
} from "../src/catalogue.js";

import {
  useCameraConfig3D,
  useLighting3D,
  useEnvironment3D,
  useMaterial3D,
} from "../src/react.js";

describe("Camera, Lighting, Environment & Material Intelligence (Prompt 78)", () => {
  let host: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    host.remove();
    vi.restoreAllMocks();
  });

  describe("Camera Intelligence", () => {
    it("provides all 7 standard camera presets", () => {
      const presetNames = [
        "hero",
        "isometric",
        "portrait",
        "wide",
        "top-down",
        "cinematic",
        "macro",
      ] as const;

      for (const name of presetNames) {
        const preset = getCameraPreset(name);
        expect(preset).toBeDefined();
        expect(preset.type).toBeDefined();
        expect(preset.position).toBeDefined();
        expect(preset.target).toBeDefined();
      }

      expect(CAMERA_PRESETS.isometric.type).toBe("orthographic");
      expect(CAMERA_PRESETS.hero.type).toBe("perspective");
    });

    it("interpolates smoothly between camera states", () => {
      const from = { position: [0, 0, 10] as const, target: [0, 0, 0] as const, fov: 60 };
      const to = { position: [10, 5, 20] as const, target: [2, 1, 0] as const, fov: 30 };

      const halfway = interpolateCamera(from, to, 0.5);
      expect(halfway.position).toEqual([5, 2.5, 15]);
      expect(halfway.target).toEqual([1, 0.5, 0]);
      expect(halfway.fov).toBe(45);
    });

    it("enforces distance and FOV constraints", () => {
      const cam = {
        position: [0, 0, 20] as const,
        target: [0, 0, 0] as const,
        fov: 100,
      };

      const constrained = applyCameraConstraints(cam, {
        minFov: 30,
        maxFov: 75,
        minDistance: 5,
        maxDistance: 10,
      });

      expect(constrained.fov).toBe(75);
      expect(constrained.position?.[2]).toBeCloseTo(10);
    });

    it("resolves responsive FOVs across viewport widths", () => {
      const config = {
        fov: 50,
        responsiveFov: { mobile: 70, tablet: 60, desktop: 45 },
      };

      expect(resolveResponsiveFov(config, 480)).toBe(70);
      expect(resolveResponsiveFov(config, 768)).toBe(60);
      expect(resolveResponsiveFov(config, 1440)).toBe(45);
    });

    it("validates and corrects camera configurations", () => {
      const invalid = validateCameraConfig({ fov: 200, near: 50, far: 10 });
      expect(invalid.valid).toBe(false);
      expect(invalid.errors.length).toBeGreaterThanOrEqual(2);

      const corrected = correctCameraConfig({
        preset: "cinematic",
        fov: -10,
      });
      expect(corrected.fov).toBe(CAMERA_PRESETS.cinematic.fov);
      expect(corrected.position).toEqual(CAMERA_PRESETS.cinematic.position);
    });
  });

  describe("Lighting Intelligence", () => {
    it("provides all 7 curated lighting presets", () => {
      const presetNames = [
        "studio",
        "cinematic",
        "dramatic",
        "daylight",
        "sunset",
        "neon",
        "product",
      ] as const;

      for (const name of presetNames) {
        const preset = getLighting3DPreset(name);
        expect(preset).toBeDefined();
      }

      expect(LIGHTING_3D_PRESETS.neon.point?.length).toBeGreaterThanOrEqual(2);
      expect(LIGHTING_3D_PRESETS.dramatic.spot?.length).toBe(1);
    });

    it("resolves fallbacks for unsupported hemisphere and area lights", () => {
      const advancedLighting = {
        hemisphere: { skyColor: "#87ceeb", groundColor: "#333333", intensity: 0.8 },
        area: [{ color: "#ffffff", intensity: 2, width: 4, height: 4, position: [0, 4, 0] as const }],
      };

      const fallback = resolveLightingFallbacks(advancedLighting, {
        hemisphere: false,
        area: false,
      });

      expect(fallback.hemisphere).toBeUndefined();
      expect(fallback.ambient?.intensity).toBeCloseTo(0.8 * 0.7);
      expect(fallback.area).toBeUndefined();
      expect(fallback.point?.length).toBe(1);
      expect(fallback.point?.[0].position).toEqual([0, 4, 0]);
    });

    it("validates and corrects lighting configurations safely", () => {
      const report = validateLightingConfig({ ambient: { intensity: -2 } });
      expect(report.valid).toBe(false);

      const corrected = correctLightingConfig({ preset: "dramatic" });
      expect(corrected.spot?.length).toBe(1);
      expect(corrected.ambient?.color).toBe("#050505");
    });
  });

  describe("Environment Intelligence", () => {
    it("provides all 7 atmospheric environment presets", () => {
      const presetNames = [
        "studio-dark",
        "studio-light",
        "dawn",
        "cyberpunk",
        "desert",
        "void",
        "cloudy",
      ] as const;

      for (const name of presetNames) {
        const preset = getEnvironmentPreset(name);
        expect(preset).toBeDefined();
        expect(preset.background).toBeDefined();
      }

      expect(ENVIRONMENT_PRESETS.cyberpunk.fog?.type).toBe("exponential");
      expect(ENVIRONMENT_PRESETS.void.transparent).toBe(true);
    });

    it("validates and corrects environment configurations", () => {
      const report = validateEnvironmentConfig({ fog: { density: -1 } });
      expect(report.valid).toBe(false);

      const corrected = correctEnvironmentConfig({ preset: "dawn" });
      expect(corrected.gradient?.colors).toContain("#fd746c");
      expect(corrected.fog?.color).toBe("#fd746c");
    });
  });

  describe("Material Intelligence & 2D Surface Bridge", () => {
    it("provides all 8 physically based material presets", () => {
      const presetNames = [
        "chrome",
        "gold",
        "frosted-glass",
        "clear-glass",
        "matte-plastic",
        "glossy-plastic",
        "velvet",
        "neon-glow",
      ] as const;

      for (const name of presetNames) {
        const preset = getMaterial3DPreset(name);
        expect(preset).toBeDefined();
        expect(preset.type).toBeDefined();
      }

      expect(MATERIAL_3D_PRESETS.chrome.metalness).toBe(1.0);
      expect(MATERIAL_3D_PRESETS["frosted-glass"].transmission).toBeGreaterThan(0.9);
      expect(MATERIAL_3D_PRESETS["neon-glow"].emissive).toBe("#00f0ff");
    });

    it("bridges Prompt 72 2D surface definitions into 3D materials", () => {
      const glassSurface: SurfaceDefinition = {
        transmission: 0.85,
        refractiveIndex: 1.52,
        opacity: 0.9,
        roughness: 0.2,
        baseColor: "#e0f7fa",
        depth: 12,
      };

      const mat3D = surfaceToMaterial3D(glassSurface);
      expect(mat3D.type).toBe("physical");
      expect(mat3D.transmission).toBe(0.85);
      expect(mat3D.ior).toBe(1.52);
      expect(mat3D.transparent).toBe(true);
      expect(mat3D.thickness).toBe(1.2);
    });

    it("bridges metallic 2D surfaces into 3D standard/physical materials", () => {
      const metalSurface: SurfaceDefinition = {
        roughness: 0.1,
        reflectivity: 0.9,
      };

      const mat3D = surfaceToMaterial3D(metalSurface);
      expect(mat3D.type).toBe("physical");
      expect(mat3D.metalness).toBe(0.9);
      expect(mat3D.roughness).toBe(0.1);
    });

    it("validates and corrects 3D material configurations", () => {
      const report = validateMaterial3D({ roughness: 2.5, metalness: -0.5 });
      expect(report.valid).toBe(false);
      expect(report.errors.length).toBe(2);

      const corrected = correctMaterial3D({ preset: "chrome", roughness: 1.5 });
      expect(corrected.metalness).toBe(1.0);
      expect(corrected.roughness).toBe(0.05); // clamped to preset default
    });
  });

  describe("Unified Scene Integration", () => {
    it("assembles complete scene with intelligent presets", () => {
      const cam = getCameraPreset("hero");
      const lighting = getLighting3DPreset("studio");
      const env = getEnvironmentPreset("studio-dark");
      const mat = getMaterial3DPreset("chrome");

      const spec = {
        id: "hero-showcase",
        version: "1.0.0",
        camera: cam,
        lighting,
        environment: env,
        objects: [
          {
            id: "hero-mesh",
            type: "primitive" as const,
            geometry: { type: "primitive" as const, primitive: "sphere" as const },
            material: mat,
          },
        ],
      };

      const report = validateSceneSchema(spec);
      expect(report.valid).toBe(true);
      expect(report.errors).toHaveLength(0);
    });
  });

  describe("AI Motion Registry Capabilities", () => {
    it("registers camera, lighting, environment, and material capabilities", () => {
      expect(CAMERA_3D_INTELLIGENCE_CAPABILITY.id).toBe("camera-3d-intelligence");
      expect(LIGHTING_3D_INTELLIGENCE_CAPABILITY.id).toBe("lighting-3d-intelligence");
      expect(ENVIRONMENT_3D_INTELLIGENCE_CAPABILITY.id).toBe("environment-3d-intelligence");
      expect(MATERIAL_3D_INTELLIGENCE_CAPABILITY.id).toBe("material-3d-intelligence");

      register3DIntelligenceCapabilities(aiMotionRegistry);

      expect(aiMotionRegistry.getCapability("camera-3d-intelligence")).toBeDefined();
      expect(aiMotionRegistry.getCapability("lighting-3d-intelligence")).toBeDefined();
      expect(aiMotionRegistry.getCapability("environment-3d-intelligence")).toBeDefined();
      expect(aiMotionRegistry.getCapability("material-3d-intelligence")).toBeDefined();
    });
  });

  describe("React 18/19 Integration", () => {
    it("useCameraConfig3D manages camera state and preset switching", () => {
      let cameraControls: any = null;

      function CameraTest() {
        cameraControls = useCameraConfig3D("hero");
        return createElement("div", null, `FOV: ${cameraControls.camera.fov}`);
      }

      act(() => {
        root.render(createElement(StrictMode, null, createElement(CameraTest)));
      });

      expect(cameraControls.camera.fov).toBe(45);

      act(() => {
        cameraControls.setPreset("wide");
      });

      expect(cameraControls.camera.fov).toBe(75);
    });

    it("useLighting3D manages lighting presets", () => {
      let lightingControls: any = null;

      function LightingTest() {
        lightingControls = useLighting3D("studio");
        return createElement("div", null, "Lighting");
      }

      act(() => {
        root.render(createElement(LightingTest));
      });

      expect(lightingControls.lighting.directional?.length).toBe(2);

      act(() => {
        lightingControls.setPreset("neon");
      });

      expect(lightingControls.lighting.point?.length).toBe(3);
    });

    it("useEnvironment3D manages environment presets", () => {
      let envControls: any = null;

      function EnvironmentTest() {
        envControls = useEnvironment3D("studio-dark");
        return createElement("div", null, envControls.environment.background);
      }

      act(() => {
        root.render(createElement(EnvironmentTest));
      });

      expect(envControls.environment.background).toBe("#0a0a0c");

      act(() => {
        envControls.setPreset("cyberpunk");
      });

      expect(envControls.environment.background).toBe("#050014");
    });

    it("useMaterial3D manages material presets", () => {
      let matControls: any = null;

      function MaterialTest() {
        matControls = useMaterial3D("chrome");
        return createElement("div", null, `Metal: ${matControls.material.metalness}`);
      }

      act(() => {
        root.render(createElement(MaterialTest));
      });

      expect(matControls.material.metalness).toBe(1.0);

      act(() => {
        matControls.setPreset("gold");
      });

      expect(matControls.material.color).toBe("#ffd700");
    });

    it("renders React hooks safely in SSR simulation", () => {
      function SSRApp() {
        const { camera } = useCameraConfig3D("cinematic");
        const { lighting } = useLighting3D("sunset");
        const { environment } = useEnvironment3D("desert");
        const { material } = useMaterial3D("velvet");

        return createElement(
          "div",
          { className: "ssr-3d-intelligence" },
          `Cam: ${camera.type}, Light: ${lighting.preset}, Env: ${environment.preset}, Mat: ${material.preset}`
        );
      }

      const html = renderToString(createElement(SSRApp));
      expect(html).toContain("ssr-3d-intelligence");
      expect(html).toContain("perspective");
    });
  });
});
