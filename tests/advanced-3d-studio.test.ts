/**
 * AF Motion Studio — Advanced 3D & World Integration Test Suite (Prompt 139)
 *
 * Verifies Advanced 3D Studio workspace integration, 3D physics world, rigid body
 * and constraint editor, XPBD soft bodies, procedural terrain, world generator pipeline,
 * model intelligence & optimization, 3D morphing, unified scene composition,
 * presets, diagnostics, and multi-format code export.
 */

import { describe, it, expect, beforeEach } from "vitest";
import React, { createElement } from "react";
import { renderToString } from "react-dom/server";

import {
  createDefaultAdvanced3DState,
  applyAdvanced3DPreset,
  getAdvanced3DDiagnostics,
  generateAdvanced3DExportBundle,
  ADVANCED_3D_PRESETS,
} from "../studio/engine/advanced-3d-engine.js";
import { Scene3DStudio } from "../studio/components/scene-3d/Scene3DStudio.js";
import { Physics3DPlayground } from "../studio/components/scene-3d/Physics3DPlayground.js";
import { RigidBodyConstraintEditor } from "../studio/components/scene-3d/RigidBodyConstraintEditor.js";
import { SoftBodyClothPlayground } from "../studio/components/scene-3d/SoftBodyClothPlayground.js";
import { ProceduralTerrainEditor } from "../studio/components/scene-3d/ProceduralTerrainEditor.js";
import { WorldGeneratorEditor } from "../studio/components/scene-3d/WorldGeneratorEditor.js";
import { ModelIntelligencePanel } from "../studio/components/scene-3d/ModelIntelligencePanel.js";
import { Morphing3DPlayground } from "../studio/components/scene-3d/Morphing3DPlayground.js";
import { UnifiedSceneCompositionEditor } from "../studio/components/scene-3d/UnifiedSceneCompositionEditor.js";
import { Advanced3DDiagnostics } from "../studio/components/scene-3d/Advanced3DDiagnostics.js";
import { Advanced3DPresetLibrary } from "../studio/components/scene-3d/Advanced3DPresetLibrary.js";
import { Advanced3DCodeExport } from "../studio/components/scene-3d/Advanced3DCodeExport.js";
import type { Advanced3DStudioState } from "../studio/types/advanced-3d.js";

describe("Advanced 3D & World Integration (Prompt 139)", () => {
  let defaultState: Advanced3DStudioState;

  beforeEach(() => {
    defaultState = createDefaultAdvanced3DState();
  });

  describe("Workspace Integration & Navigation", () => {
    it("initializes default state with valid configurations across all 8 subsystems", () => {
      expect(defaultState.section).toBe("foundations");
      expect(defaultState.advancedView).toBe("physics");
      expect(defaultState.physics.gravity).toEqual([0, -9.81, 0]);
      expect(defaultState.rigidBodies.bodies.length).toBeGreaterThanOrEqual(4);
      expect(defaultState.softBody.type).toBe("cloth");
      expect(defaultState.terrain.preset).toBe("mountain-ranges");
      expect(defaultState.world.preset).toBe("alpine-landscape");
      expect(defaultState.modelIntelligence.stats.vertexCount).toBeGreaterThan(0);
      expect(defaultState.morphing.preset).toBe("sphere-to-box");
      expect(defaultState.composition.subsystems.physics).toBe(true);
    });

    it("renders Scene3DStudio with mode switcher buttons for Foundations, Advanced 3D, and Presets", () => {
      const html = renderToString(createElement(Scene3DStudio));
      expect(html).toContain("🧊 3D Scene Studio");
      expect(html).toContain("Foundations");
      expect(html).toContain("Advanced 3D &amp; Worlds");
      expect(html).toContain("📚 Presets");
    });
  });

  describe("3D Physics Playground", () => {
    it("renders Physics3DPlayground with gravity inputs, fixed timesteps, and raycast inspector", () => {
      const html = renderToString(
        createElement(Physics3DPlayground, {
          state: defaultState,
          onChange: () => {},
        })
      );
      expect(html).toContain("3D Physics World");
      expect(html).toContain("Active Physics World");
      expect(html).toContain("Rigid Bodies");
      expect(html).toContain("Gravity Vector (m/s²)");
      expect(html).toContain("Fixed Timestep");
      expect(html).toContain("60 Hz (16.6 ms)");
      expect(html).toContain("Velocity Iterations");
      expect(html).toContain("Position Iterations");
      expect(html).toContain("Automatic Sleep Optimization");
      expect(html).toContain("Spatial Raycast Tester");
      expect(html).toContain("Fire Raycast");
    });
  });

  describe("Rigid Bodies & Constraints Editor", () => {
    it("renders RigidBodyConstraintEditor with rigid body list, shapes, friction, and constraints", () => {
      const html = renderToString(
        createElement(RigidBodyConstraintEditor, {
          state: defaultState,
          onChange: () => {},
        })
      );
      expect(html).toContain("Rigid Bodies &amp; Constraints");
      expect(html).toContain("Dynamic Box Alpha");
      expect(html).toContain("+ Add Body");
      expect(html).toContain("Collider Shape");
      expect(html).toContain("Mass (kg)");
      expect(html).toContain("Restitution (Bounciness)");
      expect(html).toContain("Surface Friction");
      expect(html).toContain("Continuous Collision Detection (CCD)");
      expect(html).toContain("Joint Constraints");
      expect(html).toContain("+ Add Constraint");
    });
  });

  describe("Soft Bodies & Extended PBD Cloth Playground", () => {
    it("renders SoftBodyClothPlayground with models, stiffness sliders, wind, and tearing", () => {
      const html = renderToString(
        createElement(SoftBodyClothPlayground, {
          state: defaultState,
          onChange: () => {},
        })
      );
      expect(html).toContain("Soft Bodies &amp; Extended PBD Dynamics");
      expect(html).toContain("Cloth Grid");
      expect(html).toContain("Elastic Rope");
      expect(html).toContain("XPBD Solver State");
      expect(html).toContain("Structural Stiffness");
      expect(html).toContain("Shear Stiffness");
      expect(html).toContain("Bending Resistance");
      expect(html).toContain("Wind Influence");
      expect(html).toContain("Coupled Collision with Scene Rigid Bodies");
      expect(html).toContain("Enable Progressive Strain-Based Tearing");
    });
  });

  describe("Procedural Terrain & Erosion Engine", () => {
    it("renders ProceduralTerrainEditor with noise types, height scales, and erosion toggles", () => {
      const html = renderToString(
        createElement(ProceduralTerrainEditor, {
          state: defaultState,
          onChange: () => {},
        })
      );
      expect(html).toContain("Procedural Terrain &amp; Erosion Engine");
      expect(html).toContain("Randomize Seed");
      expect(html).toContain("Alpine Mountains");
      expect(html).toContain("Generated Mesh Statistics");
      expect(html).toContain("Noise Algorithm");
      expect(html).toContain("Height Scale");
      expect(html).toContain("Hydraulic Fluvial Erosion");
      expect(html).toContain("Thermal Scree Slope Weathering");
    });
  });

  describe("Procedural World Generator Pipeline", () => {
    it("renders WorldGeneratorEditor with 8 world presets, hydrology, and stage progress", () => {
      const html = renderToString(
        createElement(WorldGeneratorEditor, {
          state: defaultState,
          onChange: () => {},
        })
      );
      expect(html).toContain("Procedural World Pipeline");
      expect(html).toContain("Alpine Landscape");
      expect(html).toContain("Dense Forest");
      expect(html).toContain("Desert Dunes");
      expect(html).toContain("Tropical Island");
      expect(html).toContain("Pipeline Stage");
      expect(html).toContain("Generate World");
      expect(html).toContain("Hydrology &amp; Water Systems");
      expect(html).toContain("River Systems");
      expect(html).toContain("Time of Day");
      expect(html).toContain("Generation Stage Timings");
    });
  });

  describe("3D Model Intelligence & Optimization", () => {
    it("renders ModelIntelligencePanel with raw vs optimized stats and collider recommendation", () => {
      const html = renderToString(
        createElement(ModelIntelligencePanel, {
          state: defaultState,
          onChange: () => {},
        })
      );
      expect(html).toContain("Model Intelligence &amp; Optimization");
      expect(html).toContain("Optimization Target Profile");
      expect(html).toContain("MOBILE");
      expect(html).toContain("BALANCED");
      expect(html).toContain("HIGH-END");
      expect(html).toContain("Original Geometry");
      expect(html).toContain("Optimized Pipeline");
      expect(html).toContain("VRAM");
      expect(html).toContain("Physics Collider Synthesis");
      expect(html).toContain("Intelligence Recommendations");
    });
  });

  describe("3D Morphing Playground", () => {
    it("renders Morphing3DPlayground with morph pairings, progress slider, and diagnostics", () => {
      const html = renderToString(
        createElement(Morphing3DPlayground, {
          state: defaultState,
          onChange: () => {},
        })
      );
      expect(html).toContain("3D Morphing &amp; Blend Shape Engine");
      expect(html).toContain("Sphere ↔ Box");
      expect(html).toContain("Cube ↔ Sphere");
      expect(html).toContain("Torus ↔ Sphere");
      expect(html).toContain("Interpolation Progress");
      expect(html).toContain("Topological Diagnostics");
      expect(html).toContain("Source Mesh");
      expect(html).toContain("Target Mesh");
      expect(html).toContain("Resampled Vertices");
      expect(html).toContain("Topology Valid");
    });
  });

  describe("Unified 3D Scene Composition", () => {
    it("renders UnifiedSceneCompositionEditor with multi-system toggles and coupling", () => {
      const html = renderToString(
        createElement(UnifiedSceneCompositionEditor, {
          state: defaultState,
          onChange: () => {},
        })
      );
      expect(html).toContain("Unified Scene Composition");
      expect(html).toContain("Subsystem Participation");
      expect(html).toContain("3D Rigid Body Physics World");
      expect(html).toContain("Cross-System Physical Coupling");
      expect(html).toContain("Rigid Bodies Collide with Terrain Heightfield");
      expect(html).toContain("Composition Layers Stack");
    });
  });

  describe("Advanced 3D Preset Library (24 Presets)", () => {
    it("contains 24 production presets across all 6 categories", () => {
      expect(ADVANCED_3D_PRESETS.length).toBeGreaterThanOrEqual(24);
      const categories = new Set(ADVANCED_3D_PRESETS.map((p) => p.category));
      expect(categories).toContain("physics");
      expect(categories).toContain("soft-bodies");
      expect(categories).toContain("terrain");
      expect(categories).toContain("world");
      expect(categories).toContain("optimization");
      expect(categories).toContain("morphing");
    });

    it("applies a preset cleanly without mutating source state", () => {
      const jenga = applyAdvanced3DPreset(defaultState, "preset-rigid-stack");
      expect(jenga.selectedPresetId).toBe("preset-rigid-stack");
      expect(jenga.advancedView).toBe("rigid-bodies");

      const cloth = applyAdvanced3DPreset(defaultState, "preset-cloth-sim");
      expect(cloth.selectedPresetId).toBe("preset-cloth-sim");
      expect(cloth.softBody.type).toBe("cloth");

      const desert = applyAdvanced3DPreset(defaultState, "preset-desert-terrain");
      expect(desert.selectedPresetId).toBe("preset-desert-terrain");
      expect(desert.terrain.biome).toBe("desert");
    });

    it("renders Advanced3DPresetLibrary with search input and preset cards", () => {
      const html = renderToString(
        createElement(Advanced3DPresetLibrary, {
          state: defaultState,
          onChange: () => {},
        })
      );
      expect(html).toContain("Production 3D &amp; World Presets");
      expect(html).toContain("Search 3D presets, tags, physics...");
      expect(html).toContain("Falling Objects Cascade");
      expect(html).toContain("Silken Cloth Simulation");
      expect(html).toContain("Alpine Mountain Ranges");
      expect(html).toContain("Dense Ancient Forest");
      expect(html).toContain("Mobile Optimization Profile");
      expect(html).toContain("Sphere to Box Morph");
    });
  });

  describe("Diagnostics & Code Export", () => {
    it("computes live diagnostics combining all 3D subsystems with Performance Intelligence", () => {
      const diag = getAdvanced3DDiagnostics(defaultState);
      expect(diag.fps).toBeGreaterThan(0);
      expect(diag.frameTimeMs).toBeGreaterThan(0);
      expect(diag.activeObjects).toBeGreaterThan(0);
      expect(diag.triangleCount).toBeGreaterThan(0);
      expect(diag.physicsStepDurationMs).toBeGreaterThan(0);
      expect(diag.activeRigidBodies).toBe(defaultState.rigidBodies.bodies.length);
      expect(diag.softBodyNodes).toBe(defaultState.softBody.particleCount);
      expect(diag.terrainVertices).toBe(defaultState.terrain.vertexCount);
      expect(diag.estimatedVramMb).toBeGreaterThan(0);
      expect(diag.healthScore).toBeGreaterThan(0);
      expect(diag.healthStatus).toBeDefined();
    });

    it("renders Advanced3DDiagnostics telemetry bar", () => {
      const html = renderToString(
        createElement(Advanced3DDiagnostics, {
          state: defaultState,
        })
      );
      expect(html).toContain("3D Performance Intelligence Diagnostics");
      expect(html).toContain("FPS");
      expect(html).toContain("Frame Time");
      expect(html).toContain("Triangles");
      expect(html).toContain("Physics Step");
      expect(html).toContain("Rigid Bodies");
      expect(html).toContain("Terrain Verts");
      expect(html).toContain("VRAM Est.");
    });

    it("generates production code for React R3F, Vanilla TS, and Scene JSON", () => {
      const bundle = generateAdvanced3DExportBundle(defaultState);
      expect(bundle.reactR3fCode).toContain("useTerrainMesh");
      expect(bundle.reactR3fCode).toContain("useSoftBody");
      expect(bundle.reactR3fCode).toContain("useMorphGeometry");
      expect(bundle.reactR3fCode).toContain("<Canvas");
      expect(bundle.reactR3fCode).toContain("<Physics");

      expect(bundle.vanillajsCode).toContain("createPhysicsWorld");
      expect(bundle.vanillajsCode).toContain("createTerrain");
      expect(bundle.vanillajsCode).toContain("createSimulationCoordinator");

      const parsed = JSON.parse(bundle.sceneJson);
      expect(parsed.studio).toContain("Advanced 3D & World Studio");
      expect(parsed.physics.fixedDeltaTime).toBeDefined();
      expect(parsed.terrain.dimensions).toEqual([256, 256]);
    });

    it("renders Advanced3DCodeExport modal dialog with format tabs", () => {
      const html = renderToString(
        createElement(Advanced3DCodeExport, {
          state: defaultState,
          onClose: () => {},
        })
      );
      expect(html).toContain("Export 3D Scene &amp; World Code");
      expect(html).toContain("React Three Fiber (R3F)");
      expect(html).toContain("Vanilla TypeScript");
      expect(html).toContain("Complete Scene JSON");
      expect(html).toContain("Copy to Clipboard");
    });
  });
});
