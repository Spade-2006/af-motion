// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import {
  createDefaultUnifiedCompositionState,
  UNIFIED_PRESET_REGISTRY,
  searchUnifiedPresets,
  applyUnifiedPreset,
  buildMotionCompositionFromUnifiedState,
  getUnifiedTelemetry,
  generateUnifiedExportBundle,
  UnifiedPlayground,
  UnifiedLiveStage,
  UnifiedCompositionEditor,
  UnifiedPresetHub,
  UnifiedDesignBridge,
  UnifiedTelemetryPanel,
  UnifiedCodeExportModal,
  StudioApp,
  StudioHeader,
} from "../studio/index.js";
import { BUILT_IN_PALETTE_INPUTS } from "../src/core/built-in-palettes.js";
import { COMPOSITION_SPEC_VERSION, validateComposition } from "../src/core/composition.js";

describe("Prompt 140 — Unified Visual Playground & Feature Integration", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);

    // Mock HTMLCanvasElement.getContext
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      strokeRect: vi.fn(),
      setLineDash: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
    });
  });

  afterEach(() => {
    container.remove();
    vi.unstubAllGlobals();
  });

  describe("1. Unified Creative Workspace Navigation & App Integration", () => {
    it("renders the StudioHeader with the new Unified Playground tab alongside all existing tabs", () => {
      let activeTab = "dual";
      const onTabChange = vi.fn((tab) => {
        activeTab = tab;
      });

      const root = createRoot(container);
      act(() => {
        root.render(
          React.createElement(StudioHeader, {
            activeTab: activeTab as any,
            onTabChange,
            viewport: "desktop",
            onViewportChange: vi.fn(),
            reducedMotion: false,
            onToggleReducedMotion: vi.fn(),
            onExportClick: vi.fn(),
          })
        );
      });

      const buttons = Array.from(container.querySelectorAll(".studio-tab-btn"));
      const tabTexts = buttons.map((b) => b.textContent?.trim());

      expect(tabTexts).toContain("🎬 Animation");
      expect(tabTexts).toContain("🎨 Background");
      expect(tabTexts).toContain("🎛️ Combined Studio");
      expect(tabTexts).toContain("📦 Code & Export");
      expect(tabTexts).toContain("🎭 Styles");
      expect(tabTexts).toContain("📐 Design Systems & DNA");
      expect(tabTexts).toContain("🎬 Choreography");
      expect(tabTexts).toContain("🧊 3D Scene");
      expect(tabTexts).toContain("⚛️ Physics");
      expect(tabTexts).toContain("👆 Interactions");
      expect(tabTexts).toContain("🚀 Advanced Motion");
      expect(tabTexts).toContain("✨ Simulations");
      expect(tabTexts).toContain("🌐 Unified Playground");

      // Verify clicking Unified Playground triggers tab change
      const unifiedBtn = buttons.find((b) => b.textContent?.includes("Unified Playground"));
      expect(unifiedBtn).toBeDefined();

      act(() => {
        unifiedBtn?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      });
      expect(onTabChange).toHaveBeenCalledWith("unified");

      act(() => {
        root.unmount();
      });
    });

    it("mounts UnifiedPlayground cleanly inside StudioApp when activeTab is unified", async () => {
      const root = createRoot(container);
      await act(async () => {
        root.render(React.createElement(StudioApp));
      });

      // Switch to Unified tab
      const buttons = Array.from(container.querySelectorAll(".studio-tab-btn"));
      const unifiedBtn = buttons.find((b) => b.textContent?.includes("Unified Playground"));
      expect(unifiedBtn).toBeDefined();

      await act(async () => {
        unifiedBtn?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      });

      expect(container.querySelector(".unified-playground-container")).not.toBeNull();
      expect(container.querySelector(".unified-live-stage")).not.toBeNull();
      expect(container.textContent).toContain("Unified Interactive Motion Scene");

      await act(async () => {
        root.unmount();
      });
    });
  });

  describe("2. Default State Factory & Configuration Validation", () => {
    it("creates a well-structured default composition state connecting multiple subsystems", () => {
      const state = createDefaultUnifiedCompositionState();

      expect(state.id).toBe("comp-default-unified");
      expect(state.name).toBe("Unified Interactive Motion Scene");
      expect(state.systems.animation).toBe(true);
      expect(state.systems.background).toBe(true);
      expect(state.systems.scene3d).toBe(true);
      expect(state.systems.physics).toBe(true);
      expect(state.systems.interactions).toBe(true);

      expect(state.designBridge.paletteName).toBe("Cobalt Classic");
      expect(state.designBridge.motionDNA).toBe("precise");
      expect(state.designBridge.timingMultiplier).toBe(1.0);
      expect(state.crossCoupling.magneticCursorCoupling).toBe(true);
      expect(state.crossCoupling.physicsCollisionTriggers).toBe(true);

      expect(state.layers.length).toBeGreaterThanOrEqual(5);
      expect(state.playback.isPlaying).toBe(true);
      expect(state.playback.durationMs).toBe(3000);
    });

    it("builds a validated MotionComposition conforming to src/core/composition.ts spec", () => {
      const state = createDefaultUnifiedCompositionState();
      const composition = buildMotionCompositionFromUnifiedState(state);

      expect(composition.version).toBe(COMPOSITION_SPEC_VERSION);
      expect(composition.rootNodeId).toBe("root-scene");
      expect(composition.nodes["root-scene"]).toBeDefined();
      expect(composition.nodes["root-scene"].type).toBe("scene");

      // Verify layers converted to valid child nodes
      expect(composition.nodes["node-background"]).toBeDefined();
      expect(composition.nodes["node-scene3d"]).toBeDefined();
      expect(composition.nodes["node-physics"]).toBeDefined();
      expect(composition.nodes["node-animation"]).toBeDefined();

      // Validate against the library's official validation rules
      const validation = validateComposition(composition);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it("preserves serialization stability through JSON round-trip", () => {
      const state = createDefaultUnifiedCompositionState();
      const composition = buildMotionCompositionFromUnifiedState(state);

      const serialized = JSON.stringify(composition);
      const deserialized = JSON.parse(serialized);

      expect(deserialized.id).toBe(composition.id);
      expect(deserialized.nodes["root-scene"].name).toBe(composition.name);
      expect(Object.keys(deserialized.nodes)).toEqual(Object.keys(composition.nodes));
    });
  });

  describe("3. Unified Preset Registry & Search Filter Engine", () => {
    it("indexes presets across all 10 studio subsystems", () => {
      const subsystems = new Set(UNIFIED_PRESET_REGISTRY.map((p) => p.subsystem));

      expect(subsystems.has("animation")).toBe(true);
      expect(subsystems.has("background")).toBe(true);
      expect(subsystems.has("styles")).toBe(true);
      expect(subsystems.has("designSystem")).toBe(true);
      expect(subsystems.has("choreography")).toBe(true);
      expect(subsystems.has("scene3d")).toBe(true);
      expect(subsystems.has("physics")).toBe(true);
      expect(subsystems.has("interactions")).toBe(true);
      expect(subsystems.has("advancedMotion")).toBe(true);
      expect(subsystems.has("simulations")).toBe(true);
      expect(UNIFIED_PRESET_REGISTRY.length).toBeGreaterThanOrEqual(20);
    });

    it("filters presets accurately by keyword, category, and subsystem", () => {
      const auroraResults = searchUnifiedPresets("aurora");
      expect(auroraResults.length).toBeGreaterThan(0);
      expect(auroraResults.some((p) => p.id.includes("aurora"))).toBe(true);

      const physicsOnly = searchUnifiedPresets("", "physics");
      expect(physicsOnly.length).toBeGreaterThan(0);
      expect(physicsOnly.every((p) => p.category === "physics")).toBe(true);

      const simOnly = searchUnifiedPresets("", "all", "simulations");
      expect(simOnly.length).toBeGreaterThan(0);
      expect(simOnly.every((p) => p.subsystem === "simulations")).toBe(true);
    });

    it("immutably applies presets to composition state, enabling required subsystem", () => {
      const state = createDefaultUnifiedCompositionState();
      state.systems.simulations = false;

      const galaxyPreset = UNIFIED_PRESET_REGISTRY.find((p) => p.id === "sim-galaxy-vortex")!;
      const updated = applyUnifiedPreset(state, galaxyPreset);

      expect(updated.systems.simulations).toBe(true);
      expect(updated.name).toContain(galaxyPreset.name);
      expect(updated.description).toBe(galaxyPreset.description);
      // original state remains unmutated
      expect(state.systems.simulations).toBe(false);
    });
  });

  describe("4. Design & Motion DNA Bridge", () => {
    it("features all 33 built-in palettes and allows seamless palette switching", () => {
      let state = createDefaultUnifiedCompositionState();
      const onChange = vi.fn((updater) => {
        state = updater(state);
      });

      const root = createRoot(container);
      act(() => {
        root.render(React.createElement(UnifiedDesignBridge, { state, onChange }));
      });

      const paletteButtons = container.querySelectorAll(".unified-palette-card");
      expect(paletteButtons.length).toBe(BUILT_IN_PALETTE_INPUTS.length);
      expect(BUILT_IN_PALETTE_INPUTS.length).toBe(33);

      // Select "Midnight Voltage"
      const midnightBtn = Array.from(paletteButtons).find((b) => b.textContent?.includes("Midnight Voltage"));
      expect(midnightBtn).toBeDefined();

      act(() => {
        midnightBtn?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      });

      expect(onChange).toHaveBeenCalled();
      expect(state.designBridge.paletteName).toBe("Midnight Voltage");
      expect(state.designBridge.colors.primary).toBe("#101B3F");

      act(() => {
        root.unmount();
      });
    });

    it("supports all 5 Motion DNA personality profiles", () => {
      let state = createDefaultUnifiedCompositionState();
      const onChange = vi.fn((updater) => {
        state = updater(state);
      });

      const root = createRoot(container);
      act(() => {
        root.render(React.createElement(UnifiedDesignBridge, { state, onChange }));
      });

      const dnaButtons = container.querySelectorAll(".unified-dna-btn");
      expect(dnaButtons.length).toBe(5);

      // Click "Playful"
      const playfulBtn = Array.from(dnaButtons).find((b) => b.textContent?.includes("Playful"));
      expect(playfulBtn).toBeDefined();

      act(() => {
        playfulBtn?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      });

      expect(state.designBridge.motionDNA).toBe("playful");

      act(() => {
        root.unmount();
      });
    });
  });

  describe("5. Performance Intelligence Telemetry Integration", () => {
    it("computes accurate telemetry with clear distinction between measured and estimated values", () => {
      const state = createDefaultUnifiedCompositionState();
      const telemetry = getUnifiedTelemetry(state);

      expect(telemetry.fps).toBeGreaterThanOrEqual(30);
      expect(telemetry.frameTimeMs).toBeGreaterThan(0);
      expect(telemetry.healthScore).toBeGreaterThanOrEqual(50);
      expect(["low", "medium", "high", "ultra"]).toContain(telemetry.adaptiveQuality);

      // Verify measured vs estimated tags
      expect(telemetry.isEstimated.fps).toBe(false);
      expect(telemetry.isEstimated.frameTime).toBe(false);
      expect(telemetry.isEstimated.vram).toBe(true);
      expect(telemetry.isEstimated.gpuBackend).toBe(false);

      expect(telemetry.activeAnimations).toBeGreaterThan(0);
      expect(telemetry.physicsBodies).toBeGreaterThan(0);
      expect(telemetry.triangles3D).toBeGreaterThan(0);
    });

    it("renders UnifiedTelemetryPanel with metrics and status badges", () => {
      const state = createDefaultUnifiedCompositionState();
      const root = createRoot(container);

      act(() => {
        root.render(React.createElement(UnifiedTelemetryPanel, { state }));
      });

      expect(container.textContent).toContain("Performance Intelligence Status");
      expect(container.textContent).toContain("Health Score");
      expect(container.textContent).toContain("Optimal Tier");
      expect(container.textContent).toContain("FPS [Measured]");
      expect(container.textContent).toContain("Est. VRAM [Estimated]");

      act(() => {
        root.unmount();
      });
    });
  });

  describe("6. Unified Multi-Target Code Export", () => {
    it("generates production-ready React code referencing authentic AF Motion subpaths", () => {
      const state = createDefaultUnifiedCompositionState();
      const bundle = generateUnifiedExportBundle(state);

      expect(bundle.title).toBe(state.name);
      expect(bundle.reactCode).toContain('"use client";');
      expect(bundle.reactCode).toContain('from "af-motion"');
      expect(bundle.reactCode).toContain('from "af-motion/react"');
      expect(bundle.reactCode).toContain("useMotionAccessibility");
      expect(bundle.reactCode).toContain("particleField");
      expect(bundle.reactCode).toContain("animateSpring");

      // Verify subpaths in bundle imports metadata
      const subpaths = bundle.imports.map((i) => i.subpath);
      expect(subpaths).toContain("af-motion");
      expect(subpaths).toContain("af-motion/react");
      expect(subpaths).toContain("af-motion/catalogue");
    });

    it("generates Vanilla TypeScript snippet with proper cleanup returns", () => {
      const state = createDefaultUnifiedCompositionState();
      const bundle = generateUnifiedExportBundle(state);

      expect(bundle.vanillaCode).toContain('import { animateSpring, particleField } from "af-motion";');
      expect(bundle.vanillaCode).toContain("mountUnifiedExperience(host: HTMLElement): () => void");
      expect(bundle.vanillaCode).toContain("cleanupBg?.()");
      expect(bundle.vanillaCode).toContain("cleanupCard?.()");
    });

    it("renders UnifiedCodeExportModal with tab switching and copy controls", () => {
      const state = createDefaultUnifiedCompositionState();
      const onClose = vi.fn();
      const root = createRoot(container);

      act(() => {
        root.render(
          React.createElement(UnifiedCodeExportModal, { state, isOpen: true, onClose })
        );
      });

      expect(container.querySelector(".unified-export-modal-content")).not.toBeNull();
      expect(container.textContent).toContain("Export Unified Experience");

      const tabs = container.querySelectorAll(".unified-export-tab");
      expect(tabs.length).toBe(4); // React, Vanilla, JSON, CSS

      act(() => {
        root.unmount();
      });
    });
  });

  describe("7. Cross-System Composition Editor & Live Stage Lifecycle", () => {
    it("renders UnifiedCompositionEditor with system toggles, layer stack, and DAG", () => {
      let state = createDefaultUnifiedCompositionState();
      const onChange = vi.fn((updater) => {
        state = updater(state);
      });

      const root = createRoot(container);
      act(() => {
        root.render(React.createElement(UnifiedCompositionEditor, { state, onChange }));
      });

      const sysButtons = container.querySelectorAll(".unified-sys-btn");
      expect(sysButtons.length).toBe(10);

      // Toggle Advanced Motion
      const advBtn = Array.from(sysButtons).find((b) => b.textContent?.includes("Advanced Motion"));
      expect(advBtn).toBeDefined();

      act(() => {
        advBtn?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      });

      expect(state.systems.advancedMotion).toBe(true);

      // Check DAG rendering
      expect(container.textContent).toContain("Composition Dependency Graph (DAG)");
      expect(container.textContent).toContain("root-scene (v1.0.0)");

      act(() => {
        root.unmount();
      });
    });

    it("mounts and disposes UnifiedLiveStage cleanly without leaks", () => {
      const state = createDefaultUnifiedCompositionState();
      const root = createRoot(container);

      act(() => {
        root.render(React.createElement(UnifiedLiveStage, { state }));
      });

      expect(container.querySelector("canvas")).not.toBeNull();
      expect(container.querySelector(".unified-stage-card")).not.toBeNull();

      // Unmount
      act(() => {
        root.unmount();
      });

      expect(container.innerHTML).toBe("");
    });
  });
});
