import React, { useState } from "react";
import type {
  InteractionStudioState,
  InteractionStudioViewMode,
} from "../../types/interactions.js";
import { createDefaultInteractionStudioState } from "../../engine/interactions-engine.js";
import { InteractiveCanvas } from "./InteractiveCanvas.js";
import { PointerDragEditor } from "./PointerDragEditor.js";
import { TouchMultitouchEditor } from "./TouchMultitouchEditor.js";
import { GestureRecognitionEditor } from "./GestureRecognitionEditor.js";
import { GestureSequenceBuilder } from "./GestureSequenceBuilder.js";
import { CursorMagneticEditor } from "./CursorMagneticEditor.js";
import { EventInspectorTimeline } from "./EventInspectorTimeline.js";
import { InteractionPresetLibrary } from "./InteractionPresetLibrary.js";
import { InteractionDiagnosticsPanel } from "./InteractionDiagnosticsPanel.js";
import { InteractionCodeExport } from "./InteractionCodeExport.js";

export const InteractionPlayground: React.FC = () => {
  const [state, setState] = useState<InteractionStudioState>(createDefaultInteractionStudioState);

  const setViewMode = (mode: InteractionStudioViewMode) => {
    setState((prev) => ({ ...prev, viewMode: mode }));
  };

  const toggleVisualFeedback = (key: keyof typeof state.visualFeedback) => {
    setState((prev) => ({
      ...prev,
      visualFeedback: {
        ...prev.visualFeedback,
        [key]: !prev.visualFeedback[key],
      },
    }));
  };

  const handleOpenExport = () => {
    setState((prev) => ({ ...prev, showExportModal: true }));
  };

  const handleCloseExport = () => {
    setState((prev) => ({ ...prev, showExportModal: false }));
  };

  const navItems: { id: InteractionStudioViewMode; label: string }[] = [
    { id: "playground", label: "🕹️ Playground" },
    { id: "pointer-drag", label: "👆 Pointer & Drag" },
    { id: "touch-multitouch", label: "📱 Touch & Multi-Touch" },
    { id: "gesture-recognition", label: "✨ Gesture Recognition" },
    { id: "gesture-sequences", label: "🔗 Gesture Sequences" },
    { id: "cursor-magnetic", label: "🧲 Cursor & Magnetic" },
    { id: "presets", label: "📚 Presets" },
  ];

  return (
    <div className="ip-workspace" role="region" aria-label="Interaction & Gesture Playground">
      {/* Top Studio Toolbar */}
      <div className="ip-toolbar">
        {/* Navigation Tabs */}
        <div className="ip-nav-tabs">
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

        {/* Visual Overlays & Export Actions */}
        <div className="ip-toolbar-actions">
          <button
            type="button"
            className={`studio-btn studio-btn-sm ${state.visualFeedback.showPointers ? "active" : ""}`}
            onClick={() => toggleVisualFeedback("showPointers")}
            title="Toggle pointer coordinate indicators"
          >
            🎯 Pointers
          </button>
          <button
            type="button"
            className={`studio-btn studio-btn-sm ${state.visualFeedback.showDragBounds ? "active" : ""}`}
            onClick={() => toggleVisualFeedback("showDragBounds")}
            title="Toggle spatial drag boundaries"
          >
            📐 Bounds
          </button>
          <button
            type="button"
            className={`studio-btn studio-btn-sm ${state.visualFeedback.showMagneticRadius ? "active" : ""}`}
            onClick={() => toggleVisualFeedback("showMagneticRadius")}
            title="Toggle magnetic field radius"
          >
            🧲 Magnetic
          </button>
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
      <div className="ip-main-grid">
        {state.viewMode === "presets" ? (
          <div className="ip-full-panel">
            <InteractionPresetLibrary state={state} onChange={setState} />
          </div>
        ) : (
          <>
            {/* Left Column: Contextual Config Editor */}
            <aside className="ip-left-panel">
              {state.viewMode === "playground" && (
                <div className="ip-editor-panel">
                  <div className="ip-panel-section">
                    <h3 className="ip-section-title">Interaction Playground</h3>
                    <p className="ip-section-desc">
                      Directly manipulate elements on the canvas to inspect pointer trajectories, touch inputs, gestures, and physics.
                    </p>
                  </div>
                  <PointerDragEditor state={state} onChange={setState} />
                </div>
              )}
              {state.viewMode === "pointer-drag" && (
                <PointerDragEditor state={state} onChange={setState} />
              )}
              {state.viewMode === "touch-multitouch" && (
                <TouchMultitouchEditor state={state} onChange={setState} />
              )}
              {state.viewMode === "gesture-recognition" && (
                <GestureRecognitionEditor state={state} onChange={setState} />
              )}
              {state.viewMode === "gesture-sequences" && (
                <GestureSequenceBuilder state={state} onChange={setState} />
              )}
              {state.viewMode === "cursor-magnetic" && (
                <CursorMagneticEditor state={state} onChange={setState} />
              )}
            </aside>

            {/* Right Column: Interactive Canvas & Event Inspector Split */}
            <section className="ip-stage-panel">
              <InteractiveCanvas state={state} onChange={setState} />
              <EventInspectorTimeline state={state} onChange={setState} />
            </section>
          </>
        )}
      </div>

      {/* Bottom Diagnostics Bar */}
      <InteractionDiagnosticsPanel state={state} />

      {/* Code Export Modal */}
      {state.showExportModal && (
        <InteractionCodeExport state={state} onClose={handleCloseExport} />
      )}
    </div>
  );
};
