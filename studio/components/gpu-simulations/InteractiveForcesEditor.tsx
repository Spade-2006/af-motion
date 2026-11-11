import React from "react";
import type {
  GpuSimulationStudioState,
  PointerInteractionMode,
  ForceType,
  ForceFalloffType,
  ForceFieldItem,
} from "../../types/gpu-simulations.js";

interface InteractiveForcesEditorProps {
  state: GpuSimulationStudioState;
  onChange: (updater: (prev: GpuSimulationStudioState) => GpuSimulationStudioState) => void;
}

export const InteractiveForcesEditor: React.FC<InteractiveForcesEditorProps> = ({
  state,
  onChange,
}) => {
  const { forces } = state;

  const updateForces = (updates: Partial<typeof forces>) => {
    onChange((prev) => ({
      ...prev,
      forces: {
        ...prev.forces,
        ...updates,
      },
    }));
  };

  const pointerModes: { id: PointerInteractionMode; label: string }[] = [
    { id: "follow", label: "🧲 Follow" },
    { id: "push", label: "💥 Push" },
    { id: "swirl", label: "🌀 Swirl" },
    { id: "click-burst", label: "✨ Burst" },
    { id: "off", label: "Off" },
  ];

  const falloffOptions: { id: ForceFalloffType; label: string }[] = [
    { id: "smoothstep", label: "Smoothstep" },
    { id: "linear", label: "Linear" },
    { id: "inverse-square", label: "Inverse-Square" },
    { id: "none", label: "Uniform" },
  ];

  const handleAddForce = () => {
    const newForce: ForceFieldItem = {
      id: `force-${Date.now()}`,
      name: `Custom Force ${forces.activeForces.length + 1}`,
      type: "attraction",
      strength: 150,
      radius: 200,
      falloff: "smoothstep",
      enabled: true,
      position: [0.5, 0.5],
    };
    updateForces({ activeForces: [...forces.activeForces, newForce] });
  };

  const handleRemoveForce = (id: string) => {
    updateForces({
      activeForces: forces.activeForces.filter((f) => f.id !== id),
    });
  };

  const handleUpdateItem = (id: string, updates: Partial<ForceFieldItem>) => {
    updateForces({
      activeForces: forces.activeForces.map((f) =>
        f.id === id ? { ...f, ...updates } : f
      ),
    });
  };

  return (
    <div className="sim-editor-panel" role="region" aria-label="Interactive Forces Editor">
      <div className="sim-panel-section">
        <h3 className="sim-section-title">Interactive Spatial Force Fields</h3>
        <p className="sim-section-desc">
          Configure real-time pointer interactions, spatial hash grid acceleration,
          and composable point force fields.
        </p>
      </div>

      {/* Pointer Mode */}
      <div className="studio-form-group">
        <label className="studio-label">Pointer Interaction Mode</label>
        <div className="studio-btn-group">
          {pointerModes.map((mode) => (
            <button
              key={mode.id}
              type="button"
              className={`studio-btn studio-btn-sm ${
                forces.pointerMode === mode.id ? "studio-btn-primary" : "studio-btn-outline"
              }`}
              onClick={() => updateForces({ pointerMode: mode.id })}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pointer Strength & Radius */}
      <div className="sim-grid-two">
        <div className="studio-form-group">
          <div className="studio-field-header">
            <label className="studio-label">Pointer Strength</label>
            <span className="studio-value-display">{forces.pointerStrength}</span>
          </div>
          <input
            type="range"
            min="20"
            max="400"
            step="10"
            value={forces.pointerStrength}
            onChange={(e) => updateForces({ pointerStrength: Number(e.target.value) })}
            className="studio-slider"
          />
        </div>

        <div className="studio-form-group">
          <div className="studio-field-header">
            <label className="studio-label">Pointer Radius (px)</label>
            <span className="studio-value-display">{forces.pointerRadius}px</span>
          </div>
          <input
            type="range"
            min="40"
            max="350"
            step="10"
            value={forces.pointerRadius}
            onChange={(e) => updateForces({ pointerRadius: Number(e.target.value) })}
            className="studio-slider"
          />
        </div>
      </div>

      {/* Spatial Grid Toggle */}
      <div className="studio-form-group">
        <label className="sim-checkbox-label">
          <input
            type="checkbox"
            checked={forces.spatialGridEnabled}
            onChange={(e) => updateForces({ spatialGridEnabled: e.target.checked })}
            className="sim-checkbox"
          />
          Enable Spatial Hash Grid Partitioning (O(N) vs O(N²))
        </label>
      </div>

      {/* Active Force Fields */}
      <div className="sim-panel-section">
        <div className="sim-section-header-flex">
          <h4 className="sim-subsection-title">Active Force Fields ({forces.activeForces.length})</h4>
          <button
            type="button"
            className="studio-btn studio-btn-sm studio-btn-primary"
            onClick={handleAddForce}
          >
            + Add Force
          </button>
        </div>

        <div className="sim-forces-stack">
          {forces.activeForces.map((force) => (
            <div key={force.id} className="sim-card">
              <div className="sim-card-header">
                <label className="sim-checkbox-label">
                  <input
                    type="checkbox"
                    checked={force.enabled}
                    onChange={(e) => handleUpdateItem(force.id, { enabled: e.target.checked })}
                    className="sim-checkbox"
                  />
                  <span className="sim-card-title">{force.name}</span>
                </label>
                <button
                  type="button"
                  className="studio-btn studio-btn-sm studio-btn-danger"
                  onClick={() => handleRemoveForce(force.id)}
                  title="Remove Force"
                >
                  ✕
                </button>
              </div>

              <div className="sim-grid-two">
                <div className="studio-form-group">
                  <label className="studio-label">Force Type</label>
                  <select
                    className="studio-select"
                    value={force.type}
                    onChange={(e) => handleUpdateItem(force.id, { type: e.target.value as ForceType })}
                  >
                    <option value="attraction">Attraction</option>
                    <option value="repulsion">Repulsion</option>
                    <option value="vortex">Vortex</option>
                    <option value="drag">Drag</option>
                    <option value="gravitational">Gravitational</option>
                    <option value="turbulence">Turbulence</option>
                  </select>
                </div>

                <div className="studio-form-group">
                  <label className="studio-label">Falloff Model</label>
                  <select
                    className="studio-select"
                    value={force.falloff}
                    onChange={(e) =>
                      handleUpdateItem(force.id, { falloff: e.target.value as ForceFalloffType })
                    }
                  >
                    {falloffOptions.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="sim-grid-two">
                <div className="studio-form-group">
                  <div className="studio-field-header">
                    <label className="studio-label">Strength</label>
                    <span className="studio-value-display">{force.strength}</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="400"
                    step="10"
                    value={force.strength}
                    onChange={(e) => handleUpdateItem(force.id, { strength: Number(e.target.value) })}
                    className="studio-slider"
                  />
                </div>

                <div className="studio-form-group">
                  <div className="studio-field-header">
                    <label className="studio-label">Radius (px)</label>
                    <span className="studio-value-display">{force.radius}px</span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="400"
                    step="10"
                    value={force.radius}
                    onChange={(e) => handleUpdateItem(force.id, { radius: Number(e.target.value) })}
                    className="studio-slider"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
