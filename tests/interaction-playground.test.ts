/**
 * AF Motion Studio — Interaction & Gesture Playground Test Suite (Prompt 136)
 *
 * Verifies Interaction Playground workspace integration, interactive staging canvas,
 * pointer & drag physics, touch & multi-touch emulation, gesture recognition,
 * sequence builder, cursor & magnetic forces, event timeline inspector, preset library,
 * diagnostics telemetry, and code export.
 */

import { describe, it, expect, beforeEach } from "vitest";
import React, { createElement } from "react";
import { renderToString } from "react-dom/server";

import {
  createDefaultInteractionStudioState,
  listAvailableInteractionPresets,
  loadInteractionPreset,
  appendInteractionEvent,
  getInteractionDiagnostics,
  generateInteractionExportBundle,
} from "../studio/engine/interactions-engine.js";
import { InteractionPlayground } from "../studio/components/interactions/InteractionPlayground.js";
import { InteractiveCanvas } from "../studio/components/interactions/InteractiveCanvas.js";
import { PointerDragEditor } from "../studio/components/interactions/PointerDragEditor.js";
import { TouchMultitouchEditor } from "../studio/components/interactions/TouchMultitouchEditor.js";
import { GestureRecognitionEditor } from "../studio/components/interactions/GestureRecognitionEditor.js";
import { GestureSequenceBuilder } from "../studio/components/interactions/GestureSequenceBuilder.js";
import { CursorMagneticEditor } from "../studio/components/interactions/CursorMagneticEditor.js";
import { EventInspectorTimeline } from "../studio/components/interactions/EventInspectorTimeline.js";
import { InteractionPresetLibrary } from "../studio/components/interactions/InteractionPresetLibrary.js";
import { InteractionDiagnosticsPanel } from "../studio/components/interactions/InteractionDiagnosticsPanel.js";
import { InteractionCodeExport } from "../studio/components/interactions/InteractionCodeExport.js";
import { StudioHeader } from "../studio/components/StudioHeader.js";
import type { InteractionStudioState } from "../studio/types/interactions.js";

describe("Interaction & Gesture Playground (Prompt 136)", () => {
  let defaultState: InteractionStudioState;

  beforeEach(() => {
    defaultState = createDefaultInteractionStudioState();
  });

  describe("Studio Integration & Navigation", () => {
    it("initializes default state with valid interaction and preview configurations", () => {
      expect(defaultState.viewMode).toBe("playground");
      expect(defaultState.elements.length).toBe(6);
      expect(defaultState.selectedElementId).toBe("elem-drag-card");
      expect(defaultState.pointerDrag.axis).toBe("both");
      expect(defaultState.touchMultitouch.enablePinch).toBe(true);
      expect(defaultState.gestureRecognition.enabledGestures.length).toBe(8);
      expect(defaultState.cursorMagnetic.magneticMode).toBe("attract");
    });

    it("renders StudioHeader with Interactions tab button active when selected", () => {
      const html = renderToString(
        createElement(StudioHeader, {
          activeTab: "interactions",
          onTabChange: () => {},
          viewport: "desktop",
          onViewportChange: () => {},
          reducedMotion: false,
          onToggleReducedMotion: () => {},
          onExportClick: () => {},
        })
      );
      expect(html).toContain("👆 Interactions");
      expect(html).toContain('studio-tab-btn active" title="Interaction &amp; Gesture Playground');
    });

    it("renders complete InteractionPlayground workspace with toolbar and panels", () => {
      const html = renderToString(createElement(InteractionPlayground));
      expect(html).toContain("Interaction &amp; Gesture Playground");
      expect(html).toContain("🕹️ Playground");
      expect(html).toContain("👆 Pointer &amp; Drag");
      expect(html).toContain("📱 Touch &amp; Multi-Touch");
      expect(html).toContain("✨ Gesture Recognition");
      expect(html).toContain("🔗 Gesture Sequences");
      expect(html).toContain("🧲 Cursor &amp; Magnetic");
      expect(html).toContain("📚 Presets");
    });
  });

  describe("Interactive Preview Canvas", () => {
    it("renders all configured staging elements and visual overlays", () => {
      const html = renderToString(
        createElement(InteractiveCanvas, {
          state: defaultState,
          onChange: () => {},
        })
      );
      expect(html).toContain("Draggable Card");
      expect(html).toContain("Interactive Button");
      expect(html).toContain("Pinch &amp; Rotate");
      expect(html).toContain("Magnetic Target");
      expect(html).toContain("Gesture Pad");
      expect(html).toContain("Nested Zone");
      expect(html).toContain("ip-feedback-svg");
    });

    it("supports element selection and feedback rendering", () => {
      const selectedCard = defaultState.elements.find((el) => el.id === "elem-drag-card");
      expect(selectedCard?.isSelected).toBe(true);

      const html = renderToString(
        createElement(InteractiveCanvas, {
          state: defaultState,
          onChange: () => {},
        })
      );
      expect(html).toContain("selected");
    });
  });

  describe("Pointer & Drag Physics", () => {
    it("renders drag axis, threshold, boundaries, and snapping controls", () => {
      const html = renderToString(
        createElement(PointerDragEditor, {
          state: defaultState,
          onChange: () => {},
        })
      );
      expect(html).toContain("Drag Axis Mode");
      expect(html).toContain("Activation Threshold");
      expect(html).toContain("Constrain to Movement Bounds");
      expect(html).toContain("Rubberband Resistance");
      expect(html).toContain("Momentum &amp; Inertia");
      expect(html).toContain("Spring-Back on Release");
    });

    it("supports drag axis constraints and grid updates", () => {
      defaultState.pointerDrag.axis = "x";
      defaultState.pointerDrag.gridSnapping = true;
      defaultState.pointerDrag.gridSize = 30;

      const html = renderToString(
        createElement(PointerDragEditor, {
          state: defaultState,
          onChange: () => {},
        })
      );
      expect(html).toContain("Snap to Grid");
      expect(html).toContain('value="30"');
    });
  });

  describe("Touch & Multi-Touch Playground", () => {
    it("renders touch actions, pinch, rotation, and desktop simulator controls", () => {
      const html = renderToString(
        createElement(TouchMultitouchEditor, {
          state: defaultState,
          onChange: () => {},
        })
      );
      expect(html).toContain("CSS Touch Action");
      expect(html).toContain("Enable Pan Translation");
      expect(html).toContain("Enable Pinch to Zoom");
      expect(html).toContain("Enable Rotation");
      expect(html).toContain("Simulated Input Mode");
      expect(html).toContain("Emulates two touch points on hardware without touch");
    });

    it("clearly labels simulated touch mode when enabled", () => {
      defaultState.touchMultitouch.simulatedTouchEnabled = true;
      const html = renderToString(
        createElement(TouchMultitouchEditor, {
          state: defaultState,
          onChange: () => {},
        })
      );
      expect(html).toContain("Simulated Touch Distance");
      expect(html).toContain("Simulated Rotation Angle");
    });
  });

  describe("Gesture Recognition Engine", () => {
    it("exposes deterministic classifiers, confidence thresholds, and conflict policies", () => {
      const html = renderToString(
        createElement(GestureRecognitionEditor, {
          state: defaultState,
          onChange: () => {},
        })
      );
      expect(html).toContain("Enabled Gesture Recognizers");
      expect(html).toContain("Min Confidence Threshold");
      expect(html).toContain("Long Press Hold Duration");
      expect(html).toContain("Conflict Resolution Policy");
      expect(html).toContain("Active Classifiers");
    });
  });

  describe("Gesture Sequence Builder", () => {
    it("renders ordered multi-stage sequence flows and steppers", () => {
      const html = renderToString(
        createElement(GestureSequenceBuilder, {
          state: defaultState,
          onChange: () => {},
        })
      );
      expect(html).toContain("Active Sequence Pipeline");
      expect(html).toContain("Long Press → Drag → Release");
      expect(html).toContain("Tap → Double Tap");
      expect(html).toContain("Pinch → Rotate");
      expect(html).toContain("Trigger Step");
    });

    it("displays progress and matching status correctly", () => {
      defaultState.gestureSequences[0].isMatched = true;
      const html = renderToString(
        createElement(GestureSequenceBuilder, {
          state: defaultState,
          onChange: () => {},
        })
      );
      expect(html).toContain("Sequence Fully Matched &amp; Executed!");
    });
  });

  describe("Cursor & Magnetic Interaction", () => {
    it("renders cursor modes, smoothing, and magnetic force parameters", () => {
      const html = renderToString(
        createElement(CursorMagneticEditor, {
          state: defaultState,
          onChange: () => {},
        })
      );
      expect(html).toContain("Cursor Tracker Mode");
      expect(html).toContain("Follower Smoothing");
      expect(html).toContain("Attraction Radius");
      expect(html).toContain("Field Strength");
      expect(html).toContain("Force Mode");
      expect(html).toContain("Falloff Curve");
      expect(html).toContain("Enable Shared Magnetic Group");
    });
  });

  describe("Event Inspector & Timeline", () => {
    it("renders chronological interaction events, filters, and pause/clear buttons", () => {
      const html = renderToString(
        createElement(EventInspectorTimeline, {
          state: defaultState,
          onChange: () => {},
        })
      );
      expect(html).toContain("Pause Stream");
      expect(html).toContain("Clear");
      expect(html).toContain("pointerdown");
      expect(html).toContain("dragstart");
      expect(html).toContain("elem-drag-card");
    });

    it("bounds event stream length to prevent unbounded memory growth", () => {
      let state = defaultState;
      for (let i = 0; i < 150; i++) {
        state = appendInteractionEvent(
          state,
          {
            category: "pointer",
            type: "pointermove",
            x: i,
            y: i,
          },
          100
        );
      }
      expect(state.eventStream.length).toBe(100);
    });

    it("does not record events when capture is paused", () => {
      let state = { ...defaultState, isEventCapturePaused: true };
      const beforeCount = state.eventStream.length;
      state = appendInteractionEvent(state, {
        category: "pointer",
        type: "pointerdown",
      });
      expect(state.eventStream.length).toBe(beforeCount);
    });
  });

  describe("Preset Library", () => {
    it("lists all required categorized interaction presets", () => {
      const presets = listAvailableInteractionPresets();
      expect(presets.length).toBe(18);

      const categories = new Set(presets.map((p) => p.category));
      expect(categories.has("pointer-drag")).toBe(true);
      expect(categories.has("touch")).toBe(true);
      expect(categories.has("gestures")).toBe(true);
      expect(categories.has("cursor-magnetic")).toBe(true);

      const names = presets.map((p) => p.name);
      expect(names).toContain("Smooth Drag");
      expect(names).toContain("Magnetic Drag");
      expect(names).toContain("Constrained Drag");
      expect(names).toContain("Snap-to-Grid");
      expect(names).toContain("Momentum Drag");
      expect(names).toContain("Spring-Back Drag");
      expect(names).toContain("Mobile Pan");
      expect(names).toContain("Pinch Zoom");
      expect(names).toContain("Rotation");
      expect(names).toContain("Two-Finger Interaction");
      expect(names).toContain("Swipe Navigation");
      expect(names).toContain("Long Press Menu");
      expect(names).toContain("Double Tap");
      expect(names).toContain("Gesture Sequence");
      expect(names).toContain("Magnetic Button");
      expect(names).toContain("Magnetic Card");
      expect(names).toContain("Cursor Follower");
      expect(names).toContain("Magnetic Group");
    });

    it("applies presets cleanly to studio state", () => {
      const updatedState = loadInteractionPreset("preset-snap-grid", defaultState);
      expect(updatedState.pointerDrag.gridSnapping).toBe(true);
      expect(updatedState.pointerDrag.gridSize).toBe(24);

      const pinchState = loadInteractionPreset("preset-pinch-zoom", defaultState);
      expect(pinchState.touchMultitouch.enablePinch).toBe(true);
      expect(pinchState.touchMultitouch.maxScale).toBe(3.0);
    });

    it("renders Preset Library UI component properly", () => {
      const html = renderToString(
        createElement(InteractionPresetLibrary, {
          state: defaultState,
          onChange: () => {},
        })
      );
      expect(html).toContain("Interaction &amp; Gesture Presets");
      expect(html).toContain("Smooth Drag");
      expect(html).toContain("Apply Preset");
    });
  });

  describe("Diagnostics & Performance Intelligence", () => {
    it("reports hardware capabilities and Performance Intelligence telemetry", () => {
      const diag = getInteractionDiagnostics(defaultState);
      expect(diag.fps).toBeGreaterThan(0);
      expect(diag.eventProcessingDurationMs).toBeLessThan(5);
      expect(diag.activeGestures).toBe(8);
      expect(typeof diag.devicePrimaryInput).toBe("string");
      expect(diag.healthScore).toBeGreaterThanOrEqual(0);
      expect(typeof diag.healthStatus).toBe("string");
    });

    it("renders diagnostics bar with live metrics", () => {
      const html = renderToString(
        createElement(InteractionDiagnosticsPanel, {
          state: defaultState,
        })
      );
      expect(html).toContain("FPS:");
      expect(html).toContain("Latency:");
      expect(html).toContain("Active Pointers:");
      expect(html).toContain("Input HW:");
      expect(html).toContain("Touch Simulator:");
      expect(html).toContain("Health Score:");
    });
  });

  describe("Code Export Engine", () => {
    it("generates production-grade export bundles for React, Vanilla, and JSON", () => {
      const bundle = generateInteractionExportBundle(defaultState);
      expect(bundle.reactHookCode).toContain("useDrag");
      expect(bundle.reactHookCode).toContain("useMagnetic");
      expect(bundle.reactComponentCode).toContain("<Draggable");
      expect(bundle.reactComponentCode).toContain("<Magnetic");
      expect(bundle.vanillaCode).toContain("createDragController");
      expect(bundle.vanillaCode).toContain("createMagneticController");
      expect(bundle.gestureClassifierCode).toContain("createGestureClassifier");
      expect(bundle.gestureClassifierCode).toContain("createGestureSequenceEngine");

      const parsed = JSON.parse(bundle.jsonSchema);
      expect(parsed.version).toBe("1.0.0");
      expect(parsed.pointerDrag.axis).toBe("both");
    });

    it("renders Code Export dialog without errors", () => {
      const html = renderToString(
        createElement(InteractionCodeExport, {
          state: defaultState,
          onClose: () => {},
        })
      );
      expect(html).toContain("Export Interaction Configuration");
      expect(html).toContain("React Hooks");
      expect(html).toContain("React Components");
      expect(html).toContain("Vanilla Controllers");
      expect(html).toContain("Copy Code");
    });
  });
});
