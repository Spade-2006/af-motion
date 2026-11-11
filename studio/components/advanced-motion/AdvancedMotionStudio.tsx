import React, { useState } from "react";
import type {
  AdvancedMotionStudioState,
  AdvancedMotionViewMode,
} from "../../types/advanced-motion.js";
import { createDefaultAdvancedMotionStudioState } from "../../engine/advanced-motion-engine.js";
import { LayoutAnimationEditor } from "./LayoutAnimationEditor.js";
import { SvgMorphEditor } from "./SvgMorphEditor.js";
import { MotionPathEditor } from "./MotionPathEditor.js";
import { KineticTypographyEditor } from "./KineticTypographyEditor.js";
import { SharedElementEditor } from "./SharedElementEditor.js";
import { ViewTransitionPlayground } from "./ViewTransitionPlayground.js";
import { UnifiedCompositionBuilder } from "./UnifiedCompositionBuilder.js";
import { AdvancedMotionPreviewCanvas } from "./AdvancedMotionPreviewCanvas.js";
import { AdvancedMotionPresetLibrary } from "./AdvancedMotionPresetLibrary.js";
import { AdvancedMotionTimeline } from "./AdvancedMotionTimeline.js";
import { AdvancedMotionDiagnostics } from "./AdvancedMotionDiagnostics.js";
import { AdvancedMotionCodeExport } from "./AdvancedMotionCodeExport.js";

export const AdvancedMotionStudio: React.FC = () => {
  const [state, setState] = useState<AdvancedMotionStudioState>(
    createDefaultAdvancedMotionStudioState
  );

  const setViewMode = (mode: AdvancedMotionViewMode) => {
    setState((prev) => ({ ...prev, viewMode: mode }));
  };

  const handleOpenExport = () => {
    setState((prev) => ({ ...prev, showExportModal: true }));
  };

  const handleCloseExport = () => {
    setState((prev) => ({ ...prev, showExportModal: false }));
  };

  const navItems: { id: AdvancedMotionViewMode; label: string }[] = [
    { id: "layout", label: "📐 Layout Animation" },
    { id: "svg-morph", label: "✨ SVG Morphing" },
    { id: "motion-path", label: "🛤️ Motion Paths" },
    { id: "typography", label: "✍️ Typography" },
    { id: "shared-element", label: "🔗 Shared Elements" },
    { id: "view-transition", label: "📄 View Transitions" },
    { id: "composition", label: "🎬 Composition" },
    { id: "presets", label: "📚 Presets" },
  ];

  return (
    <div className="am-workspace" role="region" aria-label="Advanced Motion & Morphing Studio">
      {/* Studio Header Toolbar */}
      <div className="am-toolbar">
        {/* Navigation Tabs */}
        <div className="am-nav-tabs">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`studio-tab-btn ${state.viewMode === item.id ? "active" : ""}`}
              onClick={() => setViewMode(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="am-toolbar-actions">
          <button
            type="button"
            className="studio-btn studio-btn-sm studio-btn-primary"
            onClick={handleOpenExport}
          >
            📦 Export Code
          </button>
        </div>
      </div>

      {/* Main Two-Column Modular Workspace */}
      <div className="am-main-grid">
        {state.viewMode === "presets" ? (
          <div className="am-full-panel">
            <AdvancedMotionPresetLibrary state={state} onChange={setState} />
          </div>
        ) : (
          <>
            {/* Left Column: Contextual Config Editor */}
            <aside className="am-left-panel">
              {state.viewMode === "layout" && (
                <LayoutAnimationEditor state={state} onChange={setState} />
              )}
              {state.viewMode === "svg-morph" && (
                <SvgMorphEditor state={state} onChange={setState} />
              )}
              {state.viewMode === "motion-path" && (
                <MotionPathEditor state={state} onChange={setState} />
              )}
              {state.viewMode === "typography" && (
                <KineticTypographyEditor state={state} onChange={setState} />
              )}
              {state.viewMode === "shared-element" && (
                <SharedElementEditor state={state} onChange={setState} />
              )}
              {state.viewMode === "view-transition" && (
                <ViewTransitionPlayground state={state} onChange={setState} />
              )}
              {state.viewMode === "composition" && (
                <UnifiedCompositionBuilder state={state} onChange={setState} />
              )}
            </aside>

            {/* Right Column: Interactive Staging Canvas & Timeline */}
            <section className="am-stage-panel">
              <AdvancedMotionPreviewCanvas state={state} onChange={setState} />
              <AdvancedMotionTimeline state={state} onChange={setState} />
            </section>
          </>
        )}
      </div>

      {/* Bottom Diagnostics Strip */}
      <AdvancedMotionDiagnostics state={state} />

      {/* Code Export Dialog */}
      {state.showExportModal && (
        <AdvancedMotionCodeExport state={state} onClose={handleCloseExport} />
      )}
    </div>
  );
};
