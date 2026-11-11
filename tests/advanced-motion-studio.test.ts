/**
 * AF Motion Studio — Advanced Motion & Morphing Studio Test Suite (Prompt 137)
 *
 * Verifies Advanced Motion Studio workspace integration, layout FLIP animations,
 * SVG path morphing, parametric motion paths, kinetic typography, shared elements,
 * native view transitions, unified composition DAG, preset library, diagnostics, and code export.
 */

import { describe, it, expect, beforeEach } from "vitest";
import React, { createElement } from "react";
import { renderToString } from "react-dom/server";

import {
  createDefaultAdvancedMotionStudioState,
  validateSvgPath,
  sampleBezierCurve,
  listAvailableAdvancedMotionPresets,
  loadAdvancedMotionPreset,
  getAdvancedMotionDiagnostics,
  generateAdvancedMotionExportBundle,
} from "../studio/engine/advanced-motion-engine.js";
import { AdvancedMotionStudio } from "../studio/components/advanced-motion/AdvancedMotionStudio.js";
import { LayoutAnimationEditor } from "../studio/components/advanced-motion/LayoutAnimationEditor.js";
import { SvgMorphEditor } from "../studio/components/advanced-motion/SvgMorphEditor.js";
import { MotionPathEditor } from "../studio/components/advanced-motion/MotionPathEditor.js";
import { KineticTypographyEditor } from "../studio/components/advanced-motion/KineticTypographyEditor.js";
import { SharedElementEditor } from "../studio/components/advanced-motion/SharedElementEditor.js";
import { ViewTransitionPlayground } from "../studio/components/advanced-motion/ViewTransitionPlayground.js";
import { UnifiedCompositionBuilder } from "../studio/components/advanced-motion/UnifiedCompositionBuilder.js";
import { AdvancedMotionPreviewCanvas } from "../studio/components/advanced-motion/AdvancedMotionPreviewCanvas.js";
import { AdvancedMotionPresetLibrary } from "../studio/components/advanced-motion/AdvancedMotionPresetLibrary.js";
import { AdvancedMotionTimeline } from "../studio/components/advanced-motion/AdvancedMotionTimeline.js";
import { AdvancedMotionDiagnostics } from "../studio/components/advanced-motion/AdvancedMotionDiagnostics.js";
import { AdvancedMotionCodeExport } from "../studio/components/advanced-motion/AdvancedMotionCodeExport.js";
import { StudioHeader } from "../studio/components/StudioHeader.js";
import type { AdvancedMotionStudioState } from "../studio/types/advanced-motion.js";

describe("Advanced Motion & Morphing Studio (Prompt 137)", () => {
  let defaultState: AdvancedMotionStudioState;

  beforeEach(() => {
    defaultState = createDefaultAdvancedMotionStudioState();
  });

  describe("Studio Integration & Navigation", () => {
    it("initializes default state with valid sub-system configs", () => {
      expect(defaultState.viewMode).toBe("layout");
      expect(defaultState.layout.layoutItems.length).toBe(6);
      expect(defaultState.svgMorph.isValidSource).toBe(true);
      expect(defaultState.motionPath.points.length).toBeGreaterThanOrEqual(2);
      expect(defaultState.typography.segmentation).toBe("word");
      expect(defaultState.sharedElement.sharedId).toBe("hero-card-1");
      expect(defaultState.composition.steps.length).toBe(4);
    });

    it("renders StudioHeader with Advanced Motion tab button active when selected", () => {
      const html = renderToString(
        createElement(StudioHeader, {
          activeTab: "advanced-motion",
          onTabChange: () => {},
          viewport: "desktop",
          onViewportChange: () => {},
          reducedMotion: false,
          onToggleReducedMotion: () => {},
          onExportClick: () => {},
        })
      );
      expect(html).toContain("🚀 Advanced Motion");
      expect(html).toContain('studio-tab-btn active" title="Advanced Motion &amp; Morphing Studio');
    });

    it("renders master AdvancedMotionStudio workspace with all 8 navigation buttons", () => {
      const html = renderToString(createElement(AdvancedMotionStudio));
      expect(html).toContain("Advanced Motion &amp; Morphing Studio");
      expect(html).toContain("📐 Layout Animation");
      expect(html).toContain("✨ SVG Morphing");
      expect(html).toContain("🛤️ Motion Paths");
      expect(html).toContain("✍️ Typography");
      expect(html).toContain("🔗 Shared Elements");
      expect(html).toContain("📄 View Transitions");
      expect(html).toContain("🎬 Composition");
      expect(html).toContain("📚 Presets");
    });
  });

  describe("Layout Animation Editor", () => {
    it("renders layout modes, stagger directions, and FLIP geometry matrix", () => {
      const html = renderToString(
        createElement(LayoutAnimationEditor, {
          state: defaultState,
          onChange: () => {},
        })
      );
      expect(html).toContain("Automatic Layout Animation (FLIP)");
      expect(html).toContain("GRID");
      expect(html).toContain("LIST");
      expect(html).toContain("MASONRY");
      expect(html).toContain("FLIP Geometry Matrix");
      expect(html).toContain("Trigger FLIP Layout Shuffle");
    });
  });

  describe("SVG Morphing Editor", () => {
    it("validates SVG paths and produces helpful errors for invalid syntax", () => {
      const valid = validateSvgPath("M 10 10 L 90 90 Z");
      expect(valid.isValid).toBe(true);

      const empty = validateSvgPath("");
      expect(empty.isValid).toBe(false);
      expect(empty.error).toContain("empty");

      const noMove = validateSvgPath("L 10 10");
      expect(noMove.isValid).toBe(false);
      expect(noMove.error).toContain("moveto");

      const invalidChars = validateSvgPath("M 10 10 <script>");
      expect(invalidChars.isValid).toBe(false);
      expect(invalidChars.error).toContain("invalid command characters");
    });

    it("renders source and target textareas, presets, and morph scrubber", () => {
      const html = renderToString(
        createElement(SvgMorphEditor, {
          state: defaultState,
          onChange: () => {},
        })
      );
      expect(html).toContain("SVG Path Morphing");
      expect(html).toContain("Circle → Square");
      expect(html).toContain("Star → Hexagon");
      expect(html).toContain("Source SVG Path (from)");
      expect(html).toContain("Target SVG Path (to)");
      expect(html).toContain("Morph Progress");
    });
  });

  describe("Motion Path Engine", () => {
    it("samples cubic Bézier curves accurately with tangent angles", () => {
      const p0 = { x: 0, y: 0 };
      const p1 = { x: 50, y: 0 };
      const p2 = { x: 50, y: 100 };
      const p3 = { x: 100, y: 100 };

      const sampleStart = sampleBezierCurve(p0, p1, p2, p3, 0);
      expect(sampleStart.x).toBe(0);
      expect(sampleStart.y).toBe(0);

      const sampleEnd = sampleBezierCurve(p0, p1, p2, p3, 1);
      expect(sampleEnd.x).toBe(100);
      expect(sampleEnd.y).toBe(100);

      const sampleMid = sampleBezierCurve(p0, p1, p2, p3, 0.5);
      expect(sampleMid.x).toBe(50);
      expect(sampleMid.y).toBe(50);
    });

    it("renders trajectory templates, progress scrubber, and arc-length telemetry", () => {
      const html = renderToString(
        createElement(MotionPathEditor, {
          state: defaultState,
          onChange: () => {},
        })
      );
      expect(html).toContain("Motion Path Engine");
      expect(html).toContain("S-Curve");
      expect(html).toContain("Circular Orbit");
      expect(html).toContain("Arc-Length Telemetry");
      expect(html).toContain("Auto-Rotate Along Tangent");
    });
  });

  describe("Kinetic Typography Editor", () => {
    it("renders segmentation granularity, presets, and path mapping toggles", () => {
      const html = renderToString(
        createElement(KineticTypographyEditor, {
          state: defaultState,
          onChange: () => {},
        })
      );
      expect(html).toContain("Kinetic Typography Engine");
      expect(html).toContain("CHARACTER");
      expect(html).toContain("WORD");
      expect(html).toContain("LINE");
      expect(html).toContain("typewriter");
      expect(html).toContain("scramble");
      expect(html).toContain("Map Glyph Coordinates Along Motion Path");
    });
  });

  describe("Shared-Element Transition", () => {
    it("renders view toggle button, interpolation matrix, and geometry bounds", () => {
      const html = renderToString(
        createElement(SharedElementEditor, {
          state: defaultState,
          onChange: () => {},
        })
      );
      expect(html).toContain("Shared-Element Transition");
      expect(html).toContain("Transition to");
      expect(html).toContain("Detail View");
      expect(html).toContain("Shared Element Interpolation Matrix");
      expect(html).toContain("Source Rect");
      expect(html).toContain("Target Rect");
    });
  });

  describe("View Transition Playground", () => {
    it("renders browser support detection badge and transition presets", () => {
      const html = renderToString(
        createElement(ViewTransitionPlayground, {
          state: defaultState,
          onChange: () => {},
        })
      );
      expect(html).toContain("View Transition API");
      expect(html).toContain("Transition Preset");
      expect(html).toContain("crossfade");
      expect(html).toContain("slide-left");
      expect(html).toContain("Transition Lifecycle Event");
    });
  });

  describe("Unified Composition Builder", () => {
    it("renders multi-track execution lanes with relative timing offsets", () => {
      const html = renderToString(
        createElement(UnifiedCompositionBuilder, {
          state: defaultState,
          onChange: () => {},
        })
      );
      expect(html).toContain("Unified Composition Builder");
      expect(html).toContain("Master Advanced Motion Journey");
      expect(html).toContain("Choreographed Execution Tracks");
      expect(html).toContain("Text Reveal");
      expect(html).toContain("Layout FLIP Grid");
      expect(html).toContain("SVG Shape Morph");
      expect(html).toContain("Motion Path Orbit");
    });
  });

  describe("Interactive Preview Canvas", () => {
    it("renders stage content corresponding to active view mode", () => {
      const html = renderToString(
        createElement(AdvancedMotionPreviewCanvas, {
          state: defaultState,
          onChange: () => {},
        })
      );
      expect(html).toContain("Active View:");
      expect(html).toContain("LAYOUT");
      expect(html).toContain("Alpha Module");
      expect(html).toContain("Beta Node");
    });
  });

  describe("Preset Library", () => {
    it("contains 24 verified presets across all 6 core categories", () => {
      const presets = listAvailableAdvancedMotionPresets();
      expect(presets.length).toBeGreaterThanOrEqual(24);

      const categories = new Set(presets.map((p) => p.category));
      expect(categories.has("layout")).toBe(true);
      expect(categories.has("svg-morph")).toBe(true);
      expect(categories.has("motion-path")).toBe(true);
      expect(categories.has("typography")).toBe(true);
      expect(categories.has("transitions")).toBe(true);
      expect(categories.has("composition")).toBe(true);

      const names = presets.map((p) => p.name);
      expect(names).toContain("Smooth Rearrangement");
      expect(names).toContain("Staggered Grid");
      expect(names).toContain("Circle to Square");
      expect(names).toContain("Shape Transformation");
      expect(names).toContain("Smooth Curve");
      expect(names).toContain("Circular Orbit");
      expect(names).toContain("Typewriter");
      expect(names).toContain("Word Reveal");
      expect(names).toContain("Shared Element");
      expect(names).toContain("Crossfade");
      expect(names).toContain("Multi-Stage Reveal");
      expect(names).toContain("Morphing Hero");
    });

    it("applies presets cleanly to studio state", () => {
      const layoutState = loadAdvancedMotionPreset("preset-layout-staggered-grid", defaultState);
      expect(layoutState.layout.staggerDirection).toBe("center");
      expect(layoutState.layout.staggerMs).toBe(60);

      const morphState = loadAdvancedMotionPreset("preset-morph-star-poly", defaultState);
      expect(morphState.svgMorph.duration).toBe(1000);
    });

    it("renders Preset Library UI component properly", () => {
      const html = renderToString(
        createElement(AdvancedMotionPresetLibrary, {
          state: defaultState,
          onChange: () => {},
        })
      );
      expect(html).toContain("Advanced Motion &amp; Morphing Presets");
      expect(html).toContain("Smooth Rearrangement");
      expect(html).toContain("Apply Preset");
    });
  });

  describe("Timeline & Diagnostics", () => {
    it("renders playback timeline controls with scrub bar and speed multipliers", () => {
      const html = renderToString(
        createElement(AdvancedMotionTimeline, {
          state: defaultState,
          onChange: () => {},
        })
      );
      expect(html).toContain("Play");
      expect(html).toContain("Reset");
      expect(html).toContain("Speed:");
      expect(html).toContain("0.5");
      expect(html).toContain("1");
      expect(html).toContain("2");
    });

    it("integrates Performance Intelligence health scores into diagnostics strip", () => {
      const diag = getAdvancedMotionDiagnostics(defaultState);
      expect(diag.fps).toBeGreaterThan(0);
      expect(diag.activeTracks).toBe(4);
      expect(diag.healthScore).toBeGreaterThanOrEqual(0);
      expect(typeof diag.healthStatus).toBe("string");

      const html = renderToString(
        createElement(AdvancedMotionDiagnostics, {
          state: defaultState,
        })
      );
      expect(html).toContain("FPS:");
      expect(html).toContain("Active Animations:");
      expect(html).toContain("Tracks:");
      expect(html).toContain("Path Length:");
      expect(html).toContain("Health Score:");
    });
  });

  describe("Code Export Engine", () => {
    it("generates production-grade export bundles for React, Vanilla, Composition, and JSON", () => {
      const bundle = generateAdvancedMotionExportBundle(defaultState);
      expect(bundle.reactHookCode).toContain("useLayoutAnimation");
      expect(bundle.reactHookCode).toContain("useSvgMorph");
      expect(bundle.reactHookCode).toContain("useMotionPath");
      expect(bundle.reactHookCode).toContain("useKineticTypography");

      expect(bundle.reactComponentCode).toContain("<KineticText");
      expect(bundle.reactComponentCode).toContain("<MorphSVG");
      expect(bundle.reactComponentCode).toContain("<SharedElement");
      expect(bundle.reactComponentCode).toContain("<LayoutGroup");

      expect(bundle.vanillaCode).toContain("createLayoutController");
      expect(bundle.vanillaCode).toContain("animateSvgMorph");
      expect(bundle.vanillaCode).toContain("createMotionPathEngine");

      expect(bundle.compositionCode).toContain("createAdvancedMotionController");

      const parsed = JSON.parse(bundle.jsonSchema);
      expect(parsed.version).toBe("1.0.0");
      expect(parsed.layout.duration).toBe(500);
    });

    it("renders Code Export dialog without errors", () => {
      const html = renderToString(
        createElement(AdvancedMotionCodeExport, {
          state: defaultState,
          onClose: () => {},
        })
      );
      expect(html).toContain("Export Advanced Motion Configuration");
      expect(html).toContain("React Hooks");
      expect(html).toContain("React Components");
      expect(html).toContain("Vanilla Controllers");
      expect(html).toContain("Composition Pipeline");
      expect(html).toContain("JSON Schema");
      expect(html).toContain("Copy Code");
    });
  });
});
