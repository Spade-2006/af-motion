// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import {
  listAvailableProceduralGeometries,
  listAvailableCameraPresets,
  listAvailableLightingPresets,
  listAvailableEnvironmentPresets,
  listAvailableMaterialPresets,
  listAvailableSceneTemplates,
  getSceneTemplateByName,
  createDefaultSceneSpecification,
  listAvailablePalettesFor3D,
  getPaletteColorFor3D,
  createPrimitiveSceneObject,
  createLightSceneObject,
  duplicateSceneObject,
  evaluateSceneIntelligence,
  generateSceneJson,
  generateSceneR3FCode,
  generateSceneVanillaJsCode,
  createScene3DExportBundle,
  Scene3DStudio,
  Scene3DHierarchyPanel,
  Scene3DGeometryEditor,
  Scene3DCameraLightingEditor,
  Scene3DMaterialEditor,
  Scene3DLiveViewport,
  Scene3DIntelligencePanel,
  Scene3DTemplateSelector,
  Scene3DCodeExport,
} from "../studio/index.js";
import { BUILT_IN_PALETTE_INPUTS } from "../src/core/built-in-palettes.js";
import type { Scene3DSpecification } from "../src/3d/schemas/types.js";

describe("Prompt 97 — 3D Scene Studio", () => {
  let container: HTMLDivElement;
  let root: Root | null = null;
  const originalGetContext = HTMLCanvasElement.prototype.getContext;

  beforeEach(() => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);

    // Mock HTMLCanvasElement.getContext for jsdom
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      arc: vi.fn(),
      strokeRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      fillText: vi.fn(),
      createRadialGradient: vi.fn().mockReturnValue({
        addColorStop: vi.fn(),
      }),
      fillStyle: "",
      strokeStyle: "",
      lineWidth: 1,
    });
  });

  afterEach(() => {
    if (root) {
      act(() => {
        root?.unmount();
      });
      root = null;
    }
    container.remove();
    HTMLCanvasElement.prototype.getContext = originalGetContext;
  });

  describe("1. Dynamic 3D Geometry & Primitive Discovery", () => {
    it("discovers all available procedural geometries dynamically", () => {
      const geometries = listAvailableProceduralGeometries();
      expect(geometries.length).toBeGreaterThanOrEqual(7);

      const types = geometries.map((g) => g.type);
      expect(types).toContain("box");
      expect(types).toContain("sphere");
      expect(types).toContain("cylinder");
      expect(types).toContain("plane");
      expect(types).toContain("torus");
      expect(types).toContain("cone");
      expect(types).toContain("capsule");

      for (const geom of geometries) {
        expect(geom.name).toBeDefined();
        expect(geom.description).toBeDefined();
        expect(geom.defaultParameters).toBeDefined();
        expect(Object.keys(geom.defaultParameters).length).toBeGreaterThan(0);
      }
    });

    it("creates a primitive box object with correct default parameters", () => {
      const box = createPrimitiveSceneObject("box", "My Test Cube");
      expect(box.type).toBe("primitive");
      expect(box.name).toBe("My Test Cube");
      expect(box.geometry.primitive).toBe("box");
      expect(box.geometry.parameters?.width).toBe(1.5);
      expect(box.transform?.position).toEqual([0, 0, 0]);
      expect(box.material?.type).toBe("physical");
    });

    it("creates a light scene object with correct properties", () => {
      const light = createLightSceneObject("directional");
      expect(light.type).toBe("light");
      expect(light.lightType).toBe("directional");
      expect(light.intensity).toBeGreaterThan(0);
      expect(light.castShadow).toBe(true);
    });

    it("duplicates a scene object with an offset position and new ID", () => {
      const original = createPrimitiveSceneObject("sphere", "Focal Sphere");
      const copy = duplicateSceneObject(original);

      expect(copy.id).not.toBe(original.id);
      expect(copy.name).toContain("(Copy)");
      expect(copy.transform?.position?.[0]).toBeGreaterThan(original.transform?.position?.[0] ?? 0);
    });
  });

  describe("2. Presets Discovery (Camera, Lighting, Environment, Materials, Templates)", () => {
    it("discovers all camera presets", () => {
      const cameras = listAvailableCameraPresets();
      expect(cameras).toContain("hero");
      expect(cameras).toContain("isometric");
      expect(cameras).toContain("portrait");
      expect(cameras).toContain("wide");
      expect(cameras).toContain("cinematic");
    });

    it("discovers all lighting presets", () => {
      const lights = listAvailableLightingPresets();
      expect(lights).toContain("studio");
      expect(lights).toContain("cinematic");
      expect(lights).toContain("dramatic");
      expect(lights).toContain("daylight");
      expect(lights).toContain("neon");
    });

    it("discovers all environment presets", () => {
      const envs = listAvailableEnvironmentPresets();
      expect(envs).toContain("studio-dark");
      expect(envs).toContain("studio-light");
      expect(envs).toContain("cyberpunk");
      expect(envs).toContain("dawn");
      expect(envs).toContain("void");
    });

    it("discovers all material presets", () => {
      const mats = listAvailableMaterialPresets();
      expect(mats).toContain("chrome");
      expect(mats).toContain("gold");
      expect(mats).toContain("frosted-glass");
      expect(mats).toContain("clear-glass");
      expect(mats).toContain("matte-plastic");
      expect(mats).toContain("glossy-plastic");
      expect(mats).toContain("neon-glow");
    });

    it("discovers all 8 production scene templates dynamically", () => {
      const templates = listAvailableSceneTemplates();
      expect(templates.length).toBe(8);

      const names = templates.map((t) => t.name);
      expect(names).toContain("product-showcase");
      expect(names).toContain("cinematic-hero");
      expect(names).toContain("abstract-environment");
      expect(names).toContain("interactive-portfolio");
      expect(names).toContain("spatial-storytelling");
      expect(names).toContain("architectural-viz");
      expect(names).toContain("floating-object");
      expect(names).toContain("scroll-product-narrative");
    });

    it("loads a template by name with full specification", () => {
      const template = getSceneTemplateByName("product-showcase");
      expect(template.id).toBeDefined();
      expect(template.objects.length).toBeGreaterThan(0);
      expect(template.camera).toBeDefined();
      expect(template.lighting).toBeDefined();
      expect(template.environment).toBeDefined();
    });
  });

  describe("3. Palette Integration & Immutability", () => {
    it("exposes all 33 built-in palettes for 3D materials", () => {
      const palettes = listAvailablePalettesFor3D();
      expect(palettes.length).toBe(33);
      expect(palettes).toContain("Cobalt Classic");
      expect(palettes).toContain("Burnt Chocolate");
      expect(palettes).toContain("Cosmic Mocha");
      expect(palettes).toContain("Midnight Voltage");
    });

    it("retrieves primary, secondary, and accent colors safely without modifying built-in palettes", () => {
      const primary = getPaletteColorFor3D("Cobalt Classic", "primary");
      const secondary = getPaletteColorFor3D("Cobalt Classic", "secondary");
      const accent = getPaletteColorFor3D("Cobalt Classic", "accent");

      expect(typeof primary).toBe("string");
      expect(typeof secondary).toBe("string");
      expect(typeof accent).toBe("string");

      // Verify immutability of BUILT_IN_PALETTE_INPUTS
      expect(Object.keys(BUILT_IN_PALETTE_INPUTS).length).toBe(33);
    });
  });

  describe("4. Scene Intelligence & Hierarchy Validation", () => {
    it("evaluates scene intelligence with a high quality score on default scene", () => {
      const defaultScene = createDefaultSceneSpecification();
      const report = evaluateSceneIntelligence(defaultScene, false);

      expect(report.score).toBeGreaterThanOrEqual(80);
      expect(report.hierarchyValid).toBe(true);
      expect(report.objectCount).toBe(defaultScene.objects.length);
      expect(report.estimatedPolyCount).toBeGreaterThan(0);
      expect(report.lightingEvaluation).toContain("illumination");
      expect(report.accessibilityNotes.length).toBeGreaterThan(0);
    });

    it("adapts intelligence recommendations when reduced motion is preferred", () => {
      const defaultScene = createDefaultSceneSpecification();
      const report = evaluateSceneIntelligence(defaultScene, true);

      const hasReducedMotionNote = report.accessibilityNotes.some((n) =>
        n.includes("prefers-reduced-motion is ACTIVE")
      );
      expect(hasReducedMotionNote).toBe(true);
    });

    it("flags warnings when polygon count or object count is high", () => {
      const defaultScene = createDefaultSceneSpecification();
      const crowdedObjects = Array.from({ length: 25 }, (_, i) =>
        createPrimitiveSceneObject("sphere", `Sphere ${i}`)
      );
      const crowdedScene: Scene3DSpecification = {
        ...defaultScene,
        objects: crowdedObjects,
      };

      const report = evaluateSceneIntelligence(crowdedScene, false);
      expect(report.objectCount).toBe(25);
      const hasWarning = report.performanceWarnings.some((w) =>
        w.toLowerCase().includes("objects")
      );
      expect(hasWarning).toBe(true);
      expect(report.score).toBeLessThan(100);
    });
  });

  describe("5. Serialization & Code Generation", () => {
    it("generates deterministic Scene JSON specification", () => {
      const scene = createDefaultSceneSpecification();
      const jsonStr = generateSceneJson(scene);

      const parsed = JSON.parse(jsonStr);
      expect(parsed.id).toBeDefined();
      expect(Array.isArray(parsed.objects)).toBe(true);
      expect(parsed.objects.length).toBe(scene.objects.length);
      expect(parsed.camera).toBeDefined();
    });

    it("generates production React TSX code with verified package subpaths", () => {
      const scene = createDefaultSceneSpecification();
      const code = generateSceneR3FCode(scene);

      expect(code).toContain("\"use client\";");
      expect(code).toContain("import React");
      expect(code).toContain("from \"af-motion/react\";");
      expect(code).toContain("from \"af-motion/catalogue\";");
      expect(code).toContain("useMotionAccessibility");
      expect(code).toContain("ProductShowcaseView");
      expect(code).toContain("SCENE_SPEC");
    });

    it("generates framework-independent Vanilla JS script", () => {
      const scene = createDefaultSceneSpecification();
      const script = generateSceneVanillaJsCode(scene);

      expect(script).toContain("import { createScene3D, createRenderer3DAdapter } from \"af-motion\";");
      expect(script).toContain("export function mountScene");
      expect(script).toContain("scene.attach");
      expect(script).toContain("scene.start");
    });

    it("creates a complete export bundle with spec, json, and React TSX", () => {
      const scene = createDefaultSceneSpecification();
      const bundle = createScene3DExportBundle(scene);

      expect(bundle.spec).toBe(scene);
      expect(bundle.json).toContain("\"objects\":");
      expect(bundle.reactR3fCode).toContain("ProductShowcaseView");
      expect(bundle.vanillajsCode).toContain("mountScene");
    });
  });

  describe("6. 3D Scene Studio React UI Integration", () => {
    it("mounts Scene3DStudio into DOM and renders header and navigation tabs", () => {
      act(() => {
        root = createRoot(container);
        root.render(React.createElement(Scene3DStudio));
      });

      expect(container.querySelector(".scene3d-studio-container")).not.toBeNull();
      expect(container.querySelector(".scene3d-studio-title")?.textContent).toContain("3D Scene Studio");
      expect(container.querySelector(".scene3d-studio-nav-tabs")).not.toBeNull();

      const tabs = container.querySelectorAll(".scene3d-nav-tab");
      expect(tabs.length).toBe(7);
      expect(tabs[0].textContent).toContain("Hierarchy");
      expect(tabs[1].textContent).toContain("Geometry");
      expect(tabs[2].textContent).toContain("Camera & Light");
      expect(tabs[3].textContent).toContain("Materials");
      expect(tabs[4].textContent).toContain("Intelligence");
      expect(tabs[5].textContent).toContain("Templates");
      expect(tabs[6].textContent).toContain("Export Code");
    });

    it("switches navigation tabs across all 7 editor sub-views", () => {
      act(() => {
        root = createRoot(container);
        root.render(React.createElement(Scene3DStudio));
      });

      const tabs = container.querySelectorAll<HTMLButtonElement>(".scene3d-nav-tab");

      // 1. Geometry Tab
      act(() => {
        tabs[1].click();
      });
      expect(container.querySelector(".scene3d-geometry-panel")).not.toBeNull();

      // 2. Camera & Light Tab
      act(() => {
        tabs[2].click();
      });
      expect(container.querySelector(".scene3d-camera-lighting-panel")).not.toBeNull();

      // 3. Materials Tab
      act(() => {
        tabs[3].click();
      });
      expect(container.querySelector(".scene3d-material-panel")).not.toBeNull();

      // 4. Intelligence Tab
      act(() => {
        tabs[4].click();
      });
      expect(container.querySelector(".scene3d-intelligence-panel")).not.toBeNull();
      expect(container.querySelector(".scene3d-score-badge")).not.toBeNull();

      // 5. Templates Tab
      act(() => {
        tabs[5].click();
      });
      expect(container.querySelector(".scene3d-template-panel")).not.toBeNull();
      expect(container.querySelectorAll(".scene3d-template-card").length).toBe(8);

      // 6. Export Code Tab
      act(() => {
        tabs[6].click();
      });
      expect(container.querySelector(".scene3d-export-panel")).not.toBeNull();
      expect(container.querySelector(".scene3d-code-display-block")).not.toBeNull();

      // 7. Hierarchy Tab
      act(() => {
        tabs[0].click();
      });
      expect(container.querySelector(".scene3d-hierarchy-panel")).not.toBeNull();
    });

    it("adds a new procedural cube from the hierarchy panel", () => {
      act(() => {
        root = createRoot(container);
        root.render(React.createElement(Scene3DStudio));
      });

      const initialCount = container.querySelectorAll(".scene3d-tree-item").length;

      // Click + Cube button
      const addCubeBtn = Array.from(
        container.querySelectorAll<HTMLButtonElement>(".scene3d-primary-btn")
      ).find((b) => b.textContent?.includes("+ Cube"));
      expect(addCubeBtn).toBeDefined();

      act(() => {
        addCubeBtn?.click();
      });

      const newCount = container.querySelectorAll(".scene3d-tree-item").length;
      expect(newCount).toBe(initialCount + 1);
    });

    it("toggles object visibility from the hierarchy list", () => {
      act(() => {
        root = createRoot(container);
        root.render(React.createElement(Scene3DStudio));
      });

      const firstItem = container.querySelector(".scene3d-tree-item");
      expect(firstItem).not.toBeNull();

      const visibilityBtn = firstItem?.querySelector<HTMLButtonElement>(".scene3d-item-btn");
      expect(visibilityBtn).not.toBeNull();
      expect(visibilityBtn?.textContent).toContain("👁️");

      act(() => {
        visibilityBtn?.click();
      });

      expect(visibilityBtn?.textContent).toContain("🕶️");
    });

    it("interacts with live viewport camera shortcuts and wireframe toggle", () => {
      act(() => {
        root = createRoot(container);
        root.render(React.createElement(Scene3DStudio));
      });

      // Camera view shortcuts
      const frontBtn = Array.from(
        container.querySelectorAll<HTMLButtonElement>(".scene3d-tool-btn")
      ).find((b) => b.textContent?.includes("Front"));
      expect(frontBtn).toBeDefined();

      act(() => {
        frontBtn?.click();
      });

      // Wireframe toggle
      const wireframeBtn = Array.from(
        container.querySelectorAll<HTMLButtonElement>(".scene3d-tool-btn")
      ).find((b) => b.textContent?.includes("Wireframe"));
      expect(wireframeBtn).toBeDefined();

      act(() => {
        wireframeBtn?.click();
      });
      expect(wireframeBtn?.className).toContain("active");
    });

    it("switches export code tabs and updates generated snippet", () => {
      act(() => {
        root = createRoot(container);
        root.render(React.createElement(Scene3DStudio));
      });

      // Switch to Export Code Tab
      const tabs = container.querySelectorAll<HTMLButtonElement>(".scene3d-nav-tab");
      act(() => {
        tabs[6].click();
      });

      const exportTabs = container.querySelectorAll<HTMLButtonElement>(".scene3d-export-tab");
      expect(exportTabs.length).toBe(3);
      expect(exportTabs[0].textContent).toContain("React");
      expect(exportTabs[1].textContent).toContain("Scene JSON");
      expect(exportTabs[2].textContent).toContain("Vanilla JS");

      // Switch to Scene JSON
      act(() => {
        exportTabs[1].click();
      });
      const codeBlock = container.querySelector(".scene3d-code-display-block code");
      expect(codeBlock?.textContent).toContain("\"objects\":");

      // Switch to Vanilla JS
      act(() => {
        exportTabs[2].click();
      });
      expect(codeBlock?.textContent).toContain("mountScene");
    });
  });
});
