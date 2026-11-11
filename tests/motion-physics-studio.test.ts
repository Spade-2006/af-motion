/**
 * AF Motion Studio — Motion Physics Studio Test Suite (Prompt 135)
 *
 * Verifies Motion Physics Studio workspace integration, interactive playground,
 * advanced spring physics calculations, inertia & force dynamics, collision/constraint editing,
 * multi-behavior composition, preset library, diagnostics, and code export.
 */

import { describe, it, expect, beforeEach } from "vitest";
import React, { createElement } from "react";
import { renderToString } from "react-dom/server";

import {
  createDefaultMotionPhysicsState,
  generateSpringGraphData,
  generateInertiaGraphData,
  loadSpringPreset,
  loadInertiaPreset,
  listAvailableSpringPresets,
  listAvailableInertiaPresets,
  listAvailableRecipes,
  computeTotalKineticEnergy,
  getPhysicsDiagnostics,
  generatePhysicsExportBundle,
} from "../studio/engine/motion-physics-engine.js";
import { MotionPhysicsStudio } from "../studio/components/motion-physics/MotionPhysicsStudio.js";
import { PhysicsPlayground } from "../studio/components/motion-physics/PhysicsPlayground.js";
import { AdvancedSpringEditor } from "../studio/components/motion-physics/AdvancedSpringEditor.js";
import { InertiaForceEditor } from "../studio/components/motion-physics/InertiaForceEditor.js";
import { CollisionConstraintEditor } from "../studio/components/motion-physics/CollisionConstraintEditor.js";
import { PhysicsCompositionBuilder } from "../studio/components/motion-physics/PhysicsCompositionBuilder.js";
import { PhysicsPresetLibrary } from "../studio/components/motion-physics/PhysicsPresetLibrary.js";
import { PhysicsDiagnosticsPanel } from "../studio/components/motion-physics/PhysicsDiagnosticsPanel.js";
import { PhysicsCodeExport } from "../studio/components/motion-physics/PhysicsCodeExport.js";
import { StudioHeader } from "../studio/components/StudioHeader.js";
import type { MotionPhysicsStudioState } from "../studio/types/motion-physics.js";

describe("Motion Physics Studio (Prompt 135)", () => {
  let defaultState: MotionPhysicsStudioState;

  beforeEach(() => {
    defaultState = createDefaultMotionPhysicsState();
  });

  describe("Studio Integration & Navigation", () => {
    it("initializes default state with valid simulation configurations", () => {
      expect(defaultState.viewMode).toBe("playground");
      expect(defaultState.isPlaying).toBe(true);
      expect(defaultState.fixedTimestep).toBe(60);
      expect(defaultState.bodies.length).toBeGreaterThanOrEqual(3);
      expect(defaultState.constraints.length).toBeGreaterThanOrEqual(1);
      expect(defaultState.gravity.y).toBe(600);
    });

    it("renders StudioHeader with Physics tab button active when selected", () => {
      const html = renderToString(
        createElement(StudioHeader, {
          activeTab: "motion-physics",
          onTabChange: () => {},
          viewport: "desktop",
          onViewportChange: () => {},
          reducedMotion: false,
          onToggleReducedMotion: () => {},
          onExportClick: () => {},
        })
      );
      expect(html).toContain("⚛️ Physics");
      expect(html).toContain('studio-tab-btn active" title="Motion Physics Studio');
    });

    it("renders MotionPhysicsStudio main component without crashing", () => {
      const html = renderToString(createElement(MotionPhysicsStudio));
      expect(html).toContain("⚛️ Motion Physics Studio");
      expect(html).toContain("Playground");
      expect(html).toContain("Spring Editor");
      expect(html).toContain("Inertia &amp; Forces");
      expect(html).toContain("Constraints");
      expect(html).toContain("Composition");
      expect(html).toContain("Presets");
      expect(html).toContain("Diagnostics");
      expect(html).toContain("Export");
    });
  });

  describe("Interactive Physics Playground", () => {
    it("renders playground canvas with bodies and toolbar", () => {
      const html = renderToString(
        createElement(PhysicsPlayground, {
          state: defaultState,
          onUpdateState: () => {},
        })
      );
      expect(html).toContain("mp-canvas-wrapper");
      expect(html).toContain("Dynamic Ball");
      expect(html).toContain("Object Inspector");
      expect(html).toContain("Add Circle");
      expect(html).toContain("Add Box");
    });

    it("computes total kinetic energy accurately across dynamic bodies", () => {
      const ke = computeTotalKineticEnergy(defaultState.bodies);
      expect(ke).toBeGreaterThan(0);
      expect(typeof ke).toBe("number");
    });

    it("ignores static/immovable bodies in kinetic energy calculation", () => {
      const staticOnlyState = {
        ...defaultState,
        bodies: defaultState.bodies.map((b) => ({ ...b, type: "static" as const })),
      };
      const ke = computeTotalKineticEnergy(staticOnlyState.bodies);
      expect(ke).toBe(0);
    });
  });

  describe("Advanced Spring Editor", () => {
    it("renders harmonic spring editor with analytical readouts", () => {
      const html = renderToString(
        createElement(AdvancedSpringEditor, {
          state: defaultState,
          onUpdateState: () => {},
        })
      );
      expect(html).toContain("Harmonic Spring Physics");
      expect(html).toContain("Stiffness (k)");
      expect(html).toContain("Damping (c)");
      expect(html).toContain("Damping Ratio (ζ)");
      expect(html).toContain("Natural Freq (ω₀)");
      expect(html).toContain("Analytical Response Curve");
    });

    it("generates analytical spring graph points spanning settling window", () => {
      const points = generateSpringGraphData(defaultState.springConfig, 1.5, 60);
      expect(points.length).toBe(61);
      expect(points[0].time).toBe(0);
      expect(points[0].position).toBe(0); // Starts at 0 relative to target 100
      expect(points[points.length - 1].time).toBe(1.5);
      // Settles close to target position 100
      expect(Math.abs(points[points.length - 1].position - 100)).toBeLessThan(15);
    });

    it("loads calibrated spring presets accurately", () => {
      const snappy = loadSpringPreset("snappy");
      expect(snappy.stiffness).toBe(300);
      expect(snappy.damping).toBe(30);

      const gentle = loadSpringPreset("gentle");
      expect(gentle.stiffness).toBe(120);
      expect(gentle.damping).toBe(14);
    });

    it("lists all official spring presets from engine registry", () => {
      const presets = listAvailableSpringPresets();
      expect(presets.length).toBeGreaterThanOrEqual(8);
      const names = presets.map((p) => p.id);
      expect(names).toContain("gentle");
      expect(names).toContain("smooth");
      expect(names).toContain("snappy");
      expect(names).toContain("bouncy");
      expect(names).toContain("stiff");
    });
  });

  describe("Inertia & Force Editor", () => {
    it("renders inertia editor with velocity decay profile", () => {
      const html = renderToString(
        createElement(InertiaForceEditor, {
          state: defaultState,
          onUpdateState: () => {},
        })
      );
      expect(html).toContain("Inertia, Momentum &amp; Friction");
      expect(html).toContain("Friction Coefficient (μ)");
      expect(html).toContain("Initial Velocity (v₀)");
      expect(html).toContain("Momentum (p)");
      expect(html).toContain("Stopping Dist");
      expect(html).toContain("Velocity Decay Profile");
    });

    it("generates decaying velocity trajectory for inertia simulation", () => {
      const points = generateInertiaGraphData(defaultState.inertiaConfig, 2.0, 50);
      expect(points.length).toBe(51);
      expect(points[0].time).toBe(0);
      expect(points[0].velocity).toBe(defaultState.inertiaConfig.initialVelocity);
      expect(points[points.length - 1].velocity).toBeLessThan(points[0].velocity);
      expect(points[points.length - 1].position).toBeGreaterThan(0);
    });

    it("loads calibrated inertia presets accurately", () => {
      const heavy = loadInertiaPreset("heavy");
      expect(heavy.mass).toBe(3.0);
      expect(heavy.friction).toBe(2.0);

      const light = loadInertiaPreset("light");
      expect(light.mass).toBe(0.5);
      expect(light.friction).toBe(6.0);
    });

    it("lists all official inertia presets from engine registry", () => {
      const presets = listAvailableInertiaPresets();
      expect(presets.length).toBeGreaterThanOrEqual(6);
      const names = presets.map((p) => p.id);
      expect(names).toContain("natural");
      expect(names).toContain("heavy");
      expect(names).toContain("light");
      expect(names).toContain("high-friction");
      expect(names).toContain("low-friction");
    });
  });

  describe("Collision & Constraint Editor", () => {
    it("renders collision constraints panel with list and parameters", () => {
      const html = renderToString(
        createElement(CollisionConstraintEditor, {
          state: defaultState,
          onUpdateState: () => {},
        })
      );
      expect(html).toContain("Geometric Constraints");
      expect(html).toContain("Anchor Distance Constraint");
      expect(html).toContain("Collision Inspection Overlays");
    });
  });

  describe("Physics Composition Builder", () => {
    it("renders multi-system physics composition recipes and serialized behavior graph", () => {
      const html = renderToString(
        createElement(PhysicsCompositionBuilder, {
          state: defaultState,
          onUpdateState: () => {},
        })
      );
      expect(html).toContain("Multi-System Physics Recipes");
      expect(html).toContain("Bouncy Entrance");
      expect(html).toContain("Active Composition Plan");
      expect(html).toContain("Serialized Behavior Graph");
    });

    it("lists all available physics composition recipes", () => {
      const recipes = listAvailableRecipes();
      expect(recipes.length).toBeGreaterThanOrEqual(7);
      const ids = recipes.map((r) => r.id);
      expect(ids).toContain("bouncy-entrance");
      expect(ids).toContain("heavy-object-drop");
      expect(ids).toContain("floating-object");
      expect(ids).toContain("inertial-drag");
      expect(ids).toContain("spring-return");
      expect(ids).toContain("constrained-bouncing");
      expect(ids).toContain("elastic-multi-body-motion");
    });
  });

  describe("Preset Library", () => {
    it("renders searchable preset library with category filters", () => {
      const html = renderToString(
        createElement(PhysicsPresetLibrary, {
          state: defaultState,
          onUpdateState: () => {},
        })
      );
      expect(html).toContain("Search physics presets");
      expect(html).toContain("All (");
      expect(html).toContain("Springs (");
      expect(html).toContain("Inertia (");
      expect(html).toContain("Recipes (");
      expect(html).toContain("Apply Preset →");
    });
  });

  describe("Diagnostics & Phase 16 Performance Intelligence", () => {
    it("captures comprehensive diagnostics integrated with Performance Intelligence", () => {
      const diag = getPhysicsDiagnostics(defaultState, 60, 1.4);
      expect(diag.fps).toBe(60);
      expect(diag.stepDurationMs).toBe(1.4);
      expect(diag.activeBodyCount).toBe(defaultState.bodies.length);
      expect(diag.activeConstraintCount).toBe(0); // initial constraint is disabled
      expect(diag.totalKineticEnergy).toBeGreaterThan(0);
      expect(diag.solverIterations).toBe(10);
      expect(diag.performanceHealthScore).toBeGreaterThanOrEqual(0);
      expect(diag.performanceHealthScore).toBeLessThanOrEqual(100);
      expect(["optimal", "acceptable", "degraded", "critical"]).toContain(
        diag.performanceHealthStatus
      );
    });

    it("renders PhysicsDiagnosticsPanel component with health score badge and metrics", () => {
      const html = renderToString(
        createElement(PhysicsDiagnosticsPanel, {
          state: defaultState,
        })
      );
      expect(html).toContain("System Performance Intelligence");
      expect(html).toContain("Simulation FPS");
      expect(html).toContain("Physics Step Duration");
      expect(html).toContain("Active Rigid Bodies");
      expect(html).toContain("Total Kinetic Energy");
    });
  });

  describe("Code Export Panel", () => {
    it("generates production code snippets across React, Core, Composition and JSON", () => {
      const bundle = generatePhysicsExportBundle(defaultState);

      // React Hook snippet
      expect(bundle.reactCode).toContain("usePhysicsComposition");
      expect(bundle.reactCode).toContain("createVector");
      expect(bundle.reactCode).toContain("InteractivePhysicsComponent");

      // Core engine snippet
      expect(bundle.vanillaCode).toContain("animateAdvancedSpring");
      expect(bundle.vanillaCode).toContain("createCollisionWorld");

      // Composition engine snippet
      expect(bundle.compositionCode).toContain("createPhysicsComposition");
      expect(bundle.compositionCode).toContain("createSpringBehavior");

      // JSON config
      expect(bundle.jsonConfig).toContain('"version": "1.0"');
      const parsed = JSON.parse(bundle.jsonConfig);
      expect(parsed.bodies.length).toBe(defaultState.bodies.length);
      expect(parsed.springConfig.stiffness).toBe(defaultState.springConfig.stiffness);
    });

    it("renders PhysicsCodeExport component with tab switches and copy CTA", () => {
      const html = renderToString(
        createElement(PhysicsCodeExport, {
          state: defaultState,
        })
      );
      expect(html).toContain("React Component");
      expect(html).toContain("Core Engine API");
      expect(html).toContain("Physics Composition");
      expect(html).toContain("JSON Schema");
      expect(html).toContain("Copy Code");
    });
  });
});
