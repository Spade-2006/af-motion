import { describe, expect, it, vi, beforeEach } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";

// Interaction & Camera Controls
import {
  InteractionManager3D,
  CameraControls3D,
  createBoundingBoxRaycaster,
  createThreeRaycastAdapter,
  getInteractionPreset,
  INTERACTION_PRESETS,
} from "../src/3d/interaction/index.js";

// Scroll-Driven 3D Scenes
import {
  ScrollSceneController,
  getScrollTimelinePreset,
  SCROLL_TIMELINE_PRESETS,
  type ScrollSceneTimeline,
} from "../src/3d/scroll/index.js";

// Schemas & Validation
import { validateSceneSchema } from "../src/3d/schemas/validation.js";
import type { Scene3DSpecification } from "../src/3d/schemas/types.js";

// AI Capabilities
import {
  INTERACTION_3D_CAPABILITY,
  CAMERA_CONTROLS_3D_CAPABILITY,
  SCROLL_SCENE_3D_CAPABILITY,
  INTERACTIVE_ENVIRONMENTS_3D_CAPABILITY,
  getAvailableInteractionPresets,
  getScrollTimelinePresets,
  register3DIntelligenceCapabilities,
} from "../src/3d/schema.js";

// React Integration
import {
  useInteraction3D,
  useRaycast3D,
  useCameraControls3D,
  useScrollScene3D,
  useScrollProgress3D,
  InteractiveScene3DView,
  ScrollScene3DView,
} from "../src/react.js";

describe("3D Camera Controls Engine", () => {
  it("initializes with spherical coordinates from initial camera position and target", () => {
    const controls = new CameraControls3D({
      position: [0, 0, 10],
      target: [0, 0, 0],
    });

    const state = controls.getState();
    expect(state.distance).toBeCloseTo(10);
    expect(state.target).toEqual([0, 0, 0]);
    expect(state.position[2]).toBeCloseTo(10);
  });

  it("rotates azimuth and polar coordinates and clamps within configured limits", () => {
    const controls = new CameraControls3D(
      { position: [0, 0, 5], target: [0, 0, 0] },
      {
        minPolarAngle: 0.1,
        maxPolarAngle: 1.5,
        enableDamping: false,
      }
    );

    controls.rotate(0.5, 0.2);
    const camera = controls.update(0.016);
    expect(camera.position).toBeDefined();

    // Polar angle is clamped
    controls.rotate(0, 10.0);
    controls.update(0.016);
    expect(controls.getState().polar).toBeLessThanOrEqual(1.5);
  });

  it("pans target and camera in screen-aligned coordinates", () => {
    const controls = new CameraControls3D({ position: [0, 0, 5], target: [0, 0, 0] });
    controls.pan(2, 1);
    controls.update(0.016);

    const state = controls.getState();
    expect(state.target[1]).toBeGreaterThan(0);
  });

  it("zooms and clamps distance between min and max bounds", () => {
    const controls = new CameraControls3D(
      { position: [0, 0, 5], target: [0, 0, 0] },
      { minDistance: 2, maxDistance: 8, enableDamping: false }
    );

    // Zoom in
    controls.zoom(-100);
    controls.update(0.016);
    expect(controls.getState().distance).toBe(2);

    // Zoom out
    controls.zoom(100);
    controls.update(0.016);
    expect(controls.getState().distance).toBe(8);
  });

  it("focuses on a 3D bounding box calculating required framing distance", () => {
    const controls = new CameraControls3D({ position: [0, 0, 10], target: [0, 0, 0] });

    controls.focusOn({
      min: [-2, -2, -2],
      max: [2, 2, 2],
      size: [4, 4, 4],
      center: [1, 2, 3],
    }, 50);

    const state = controls.getState();
    expect(state.target).toEqual([1, 2, 3]);
    expect(state.distance).toBeGreaterThan(4);
  });

  it("respects reduced motion by immediately applying target coordinates without damping", () => {
    const controls = new CameraControls3D(
      { position: [0, 0, 5], target: [0, 0, 0] },
      { reducedMotion: true, enableDamping: true, dampingFactor: 0.01 }
    );

    controls.rotate(1.0, 0.5);
    // Even without update delta time, target and current are immediately synchronized
    const state = controls.getState();
    expect(state.azimuth).toBeCloseTo(1.0, 1);
  });
});

describe("3D Raycasting & Hit Testing", () => {
  it("performs bounding box hit-testing with createBoundingBoxRaycaster", () => {
    const raycaster = createBoundingBoxRaycaster([
      { id: "cube-1", position: [0, 0, 2], radius: 1 },
      { id: "cube-2", position: [10, 10, 2], radius: 1 },
    ]);

    const hits = raycaster.raycast(0, 0);
    expect(hits.length).toBe(1);
    expect(hits[0].objectId).toBe("cube-1");
  });

  it("adapters Three.js Raycaster safely with mock instances", () => {
    const mockCamera = {};
    const mockScene = { children: [{ id: 42, name: "HeroMesh", userData: { id: "hero-1" } }] };

    const mockThree = {
      Raycaster: class {
        setFromCamera() {}
        intersectObjects() {
          return [
            {
              object: mockScene.children[0],
              point: { x: 1, y: 2, z: 3 },
              distance: 4.5,
              face: { normal: { x: 0, y: 1, z: 0 } },
            },
          ];
        }
      },
      Vector2: class {
        constructor(public x: number, public y: number) {}
      },
    };

    const adapter = createThreeRaycastAdapter(mockThree, () => mockCamera, () => mockScene);
    const hits = adapter.raycast(0, 0);

    expect(hits.length).toBe(1);
    expect(hits[0].objectId).toBe("hero-1");
    expect(hits[0].point).toEqual([1, 2, 3]);
    expect(hits[0].normal).toEqual([0, 1, 0]);
    expect(hits[0].distance).toBe(4.5);
  });

  it("returns empty hits array gracefully when Three.js is absent", () => {
    const adapter = createThreeRaycastAdapter(null);
    expect(adapter.raycast(0, 0)).toEqual([]);
  });
});

describe("3D Interaction Manager & Lifecycle", () => {
  it("tracks hover, click, and selection states on simulated DOM element", () => {
    const raycaster = createBoundingBoxRaycaster([
      { id: "item-a", position: [0, 0, 1], radius: 1 },
      { id: "item-b", position: [5, 5, 1], radius: 1 },
    ]);

    const onHover = vi.fn();
    const onClick = vi.fn();
    const onSelect = vi.fn();

    const manager = new InteractionManager3D({
      raycaster,
      dragThreshold: 5,
      onHover,
      onClick,
      onSelect,
    });

    const mockElement = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 200, height: 200 }),
      tabIndex: 0,
    } as unknown as HTMLElement;

    manager.attach(mockElement);
    expect(mockElement.addEventListener).toHaveBeenCalledWith("pointerdown", expect.any(Function));
    expect(mockElement.addEventListener).toHaveBeenCalledWith("pointermove", expect.any(Function));

    // Programmatic selection
    manager.select("item-a");
    expect(manager.getState().selectedObjectIds).toEqual(["item-a"]);
    expect(onSelect).toHaveBeenCalledWith(["item-a"]);

    manager.select("item-b", true); // multi-select
    expect(manager.getState().selectedObjectIds).toEqual(["item-a", "item-b"]);

    manager.deselect("item-a");
    expect(manager.getState().selectedObjectIds).toEqual(["item-b"]);

    manager.clearSelection();
    expect(manager.getState().selectedObjectIds).toEqual([]);

    manager.detach();
    expect(mockElement.removeEventListener).toHaveBeenCalledWith("pointerdown", expect.any(Function));
  });

  it("provides complete set of 6 curated interaction environment presets", () => {
    const presets = [
      "product-showcase",
      "portfolio",
      "immersive-landing",
      "spatial-story",
      "object-display",
      "scroll-narrative",
    ] as const;

    for (const name of presets) {
      const preset = getInteractionPreset(name);
      expect(preset.name).toBe(name);
      expect(preset.cameraControls).toBeDefined();
      expect(preset.interactionOptions).toBeDefined();
    }
  });
});

describe("3D Scroll-Driven Scene Controller", () => {
  const sampleTimeline: ScrollSceneTimeline = {
    id: "sample-scroll-timeline",
    sections: [
      { id: "intro", start: 0, end: 0.5, name: "Introduction" },
      { id: "details", start: 0.5, end: 1.0, name: "Details" },
    ],
    keyframes: [
      {
        progress: 0,
        camera: { position: [0, 0, 5], target: [0, 0, 0], fov: 60 },
        objects: {
          cube: { position: [0, 0, 0], scale: [1, 1, 1], opacity: 1, visible: true },
        },
      },
      {
        progress: 1,
        camera: { position: [0, 5, 0], target: [0, 0, 0], fov: 40 },
        objects: {
          cube: { position: [2, 0, 0], scale: [2, 2, 2], opacity: 0.5, visible: true },
        },
        easing: "easeInOutCubic",
      },
    ],
  };

  it("interpolates camera and object transforms across scroll progress [0, 1]", () => {
    const controller = new ScrollSceneController({ timeline: sampleTimeline });

    // Progress 0
    const stateStart = controller.evaluate(0);
    expect(stateStart.camera.position).toEqual([0, 0, 5]);
    expect(stateStart.camera.fov).toBe(60);
    expect(stateStart.objects.cube.position).toEqual([0, 0, 0]);
    expect(stateStart.activeSectionId).toBe("intro");

    // Progress 0.5
    const stateMid = controller.evaluate(0.5);
    expect(stateMid.camera.position![1]).toBeGreaterThan(0);
    expect(stateMid.objects.cube.position[0]).toBeGreaterThan(0);
    expect(stateMid.objects.cube.scale[0]).toBeGreaterThan(1);

    // Progress 1
    const stateEnd = controller.evaluate(1);
    expect(stateEnd.camera.position).toEqual([0, 5, 0]);
    expect(stateEnd.camera.fov).toBe(40);
    expect(stateEnd.objects.cube.position).toEqual([2, 0, 0]);
    expect(stateEnd.objects.cube.scale).toEqual([2, 2, 2]);
    expect(stateEnd.objects.cube.opacity).toBe(0.5);
    expect(stateEnd.activeSectionId).toBe("details");
  });

  it("supports bidirectional scroll synchronization", () => {
    const controller = new ScrollSceneController({ timeline: sampleTimeline });

    // Advance forward
    controller.evaluate(0.75);
    expect(controller.getProgress()).toBe(0.75);

    // Scroll back
    const stateReversed = controller.evaluate(0.25);
    expect(stateReversed.progress).toBe(0.25);
    expect(stateReversed.activeSectionId).toBe("intro");
  });

  it("respects reduced motion by jumping directly to closest keyframe stop", () => {
    const controller = new ScrollSceneController({
      timeline: sampleTimeline,
      respectReducedMotion: true,
    });

    const state = controller.evaluate(0.2);
    // Closest keyframe is at progress 0
    expect(state.camera.position).toEqual([0, 0, 5]);
  });

  it("provides all 3 built-in scroll timeline presets", () => {
    const presetNames = ["product-exploded-view", "camera-flythrough", "narrative-chapters"];

    for (const name of presetNames) {
      const timeline = getScrollTimelinePreset(name);
      expect(timeline.id).toBe(name);
      expect(timeline.keyframes.length).toBeGreaterThanOrEqual(2);
      expect(timeline.sections?.length).toBeGreaterThanOrEqual(2);
    }
  });
});

describe("Scene Specification Interaction Validation", () => {
  it("validates interaction action targets and reports errors on missing IDs", () => {
    const invalidScene: Scene3DSpecification = {
      id: "interactive-scene",
      version: "1.0.0",
      objects: [
        {
          id: "button-mesh",
          type: "interactive",
          interaction: {
            trigger: "click",
            action: "highlight",
            targetId: "non-existent-mesh",
          },
        },
      ],
    };

    const report = validateSceneSchema(invalidScene);
    expect(report.valid).toBe(false);
    expect(report.errors.some((e) => e.code === "INVALID_INTERACTION_TARGET")).toBe(true);
  });

  it("validates scroll timeline object targets and reports warnings on non-existent targets", () => {
    const sceneWithBadTimeline: Scene3DSpecification = {
      id: "scroll-scene",
      version: "1.0.0",
      objects: [{ id: "box-1", type: "mesh" }],
      scrollTimeline: {
        id: "tl",
        keyframes: [
          {
            progress: 0,
            objects: {
              "ghost-object": { position: [1, 1, 1] },
            },
          },
        ],
      },
    };

    const report = validateSceneSchema(sceneWithBadTimeline);
    expect(report.warnings.some((w) => w.code === "INVALID_TIMELINE_TARGET")).toBe(true);
  });
});

describe("React Integration (InteractiveScene3DView & ScrollScene3DView)", () => {
  it("renders InteractiveScene3DView and ScrollScene3DView in SSR without error", () => {
    const interactiveHtml = renderToString(
      createElement(InteractiveScene3DView, {
        preset: "product-showcase",
        children: () => createElement("span", null, "Interactive Viewport"),
      })
    );
    expect(interactiveHtml).toContain("Interactive Viewport");
    expect(interactiveHtml).toContain('data-interaction-preset="product-showcase"');

    const scrollHtml = renderToString(
      createElement(ScrollScene3DView, {
        timeline: "product-exploded-view",
        progress: 0.5,
        children: (scene) =>
          createElement("div", null, `Active Section: ${scene.activeSectionId}`),
      })
    );
    expect(scrollHtml).toContain("Active Section: expanding");
    expect(scrollHtml).toContain('data-scroll-progress="0.500"');
  });
});

describe("AI Motion Registry Discovery Integration", () => {
  it("provides available interaction presets and scroll timeline presets for AI agents", () => {
    const presets = getAvailableInteractionPresets();
    expect(presets.length).toBe(6);
    expect(presets.some((p) => p.name === "product-showcase")).toBe(true);

    const scrollPresets = getScrollTimelinePresets();
    expect(scrollPresets.length).toBe(3);
    expect(scrollPresets.some((p) => p.id === "camera-flythrough")).toBe(true);
  });

  it("registers all Prompt 80 capabilities dynamically into AI Motion Registry", () => {
    const mockRegistry = {
      capabilities: new Map<string, any>(),
      registerCapability(cap: any) {
        this.capabilities.set(cap.id, cap);
      },
    };

    register3DIntelligenceCapabilities(mockRegistry as any);

    expect(mockRegistry.capabilities.has(INTERACTION_3D_CAPABILITY.id)).toBe(true);
    expect(mockRegistry.capabilities.has(CAMERA_CONTROLS_3D_CAPABILITY.id)).toBe(true);
    expect(mockRegistry.capabilities.has(SCROLL_SCENE_3D_CAPABILITY.id)).toBe(true);
    expect(mockRegistry.capabilities.has(INTERACTIVE_ENVIRONMENTS_3D_CAPABILITY.id)).toBe(true);
  });
});
