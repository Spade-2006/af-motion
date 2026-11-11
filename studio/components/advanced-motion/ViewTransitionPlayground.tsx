import React from "react";
import type { AdvancedMotionStudioState } from "../../types/advanced-motion.js";

interface ViewTransitionPlaygroundProps {
  state: AdvancedMotionStudioState;
  onChange: (updater: (prev: AdvancedMotionStudioState) => AdvancedMotionStudioState) => void;
}

export const ViewTransitionPlayground: React.FC<ViewTransitionPlaygroundProps> = ({
  state,
  onChange,
}) => {
  const { viewTransition } = state;

  const updateViewTransition = (updates: Partial<typeof viewTransition>) => {
    onChange((prev) => ({
      ...prev,
      viewTransition: {
        ...prev.viewTransition,
        ...updates,
      },
    }));
  };

  const handleTriggerTransition = () => {
    const nextView = viewTransition.currentView === "view-a" ? "view-b" : "view-a";

    if (
      viewTransition.isNativeSupported &&
      typeof document !== "undefined" &&
      typeof (document as any).startViewTransition === "function"
    ) {
      try {
        (document as any).startViewTransition(() => {
          updateViewTransition({
            currentView: nextView,
            lastEvent: `Native startViewTransition() -> ${nextView}`,
          });
        });
        return;
      } catch {
        // Fallback below
      }
    }

    // Simulated fallback in studio
    updateViewTransition({
      currentView: nextView,
      lastEvent: `Simulated Fallback Transition (${viewTransition.transitionPreset}) -> ${nextView}`,
    });
  };

  const presets = ["crossfade", "slide-left", "slide-right", "zoom"] as const;

  return (
    <div className="am-editor-panel">
      <div className="am-panel-section">
        <h3 className="am-section-title">View Transition API</h3>
        <p className="am-section-desc">
          Browser-native document view transitions with deterministic CSS/JS fallback orchestration.
        </p>
      </div>

      {/* Support Status Badge */}
      <div className="am-panel-subcard">
        <div className="am-support-badge-group">
          <span
            className={`am-support-pill ${
              viewTransition.isNativeSupported ? "native-yes" : "native-no"
            }`}
          >
            {viewTransition.isNativeSupported
              ? "✓ Native ViewTransition Supported"
              : "ℹ️ Simulated Fallback Active (Studio Mode)"}
          </span>
        </div>
        <p className="am-support-note">
          {viewTransition.isNativeSupported
            ? "Your browser supports document.startViewTransition natively."
            : "Running in non-supporting runtime (e.g. Node/SSR/Unsupported browser). AF Motion seamlessly executes deterministic FLIP/DOM fallback."}
        </p>
      </div>

      {/* Transition Preset Selector */}
      <div className="studio-form-group">
        <label className="studio-label">Transition Preset</label>
        <div className="studio-btn-group">
          {presets.map((p) => (
            <button
              key={p}
              type="button"
              className={`studio-btn studio-btn-sm ${
                viewTransition.transitionPreset === p ? "active" : ""
              }`}
              onClick={() => updateViewTransition({ transitionPreset: p })}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div className="studio-form-group">
        <label className="studio-label">Duration ({viewTransition.duration}ms)</label>
        <input
          type="range"
          min="150"
          max="1000"
          step="25"
          value={viewTransition.duration}
          onChange={(e) => updateViewTransition({ duration: Number(e.target.value) })}
          className="studio-range"
        />
      </div>

      {/* Lifecycle Event Log */}
      <div className="am-panel-subcard">
        <span className="am-subcard-title">Transition Lifecycle Event</span>
        <div className="am-event-log-pill">
          <code>{viewTransition.lastEvent}</code>
        </div>
      </div>

      {/* Action CTA */}
      <div className="am-actions-row">
        <button
          type="button"
          className="studio-btn studio-btn-primary"
          onClick={handleTriggerTransition}
        >
          🎬 Run Transition to {viewTransition.currentView === "view-a" ? "View B" : "View A"}
        </button>
      </div>
    </div>
  );
};
