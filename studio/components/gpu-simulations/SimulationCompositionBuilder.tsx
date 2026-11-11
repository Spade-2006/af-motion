import React from "react";
import type {
  GpuSimulationStudioState,
  SimulationCompositionLayer,
} from "../../types/gpu-simulations.js";

interface SimulationCompositionBuilderProps {
  state: GpuSimulationStudioState;
  onChange: (updater: (prev: GpuSimulationStudioState) => GpuSimulationStudioState) => void;
}

export const SimulationCompositionBuilder: React.FC<SimulationCompositionBuilderProps> = ({
  state,
  onChange,
}) => {
  const { composition } = state;

  const updateComposition = (updates: Partial<typeof composition>) => {
    onChange((prev) => ({
      ...prev,
      composition: {
        ...prev.composition,
        ...updates,
      },
    }));
  };

  const updateCoupling = (updates: Partial<typeof composition.coupling>) => {
    onChange((prev) => ({
      ...prev,
      composition: {
        ...prev.composition,
        coupling: {
          ...prev.composition.coupling,
          ...updates,
        },
      },
    }));
  };

  const handleUpdateLayer = (id: string, updates: Partial<SimulationCompositionLayer>) => {
    onChange((prev) => ({
      ...prev,
      composition: {
        ...prev.composition,
        layers: prev.composition.layers.map((l) =>
          l.id === id ? { ...l, ...updates } : l
        ),
      },
    }));
  };

  const handleMoveLayer = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= composition.layers.length) return;

    const newLayers = [...composition.layers];
    const temp = newLayers[index];
    newLayers[index] = newLayers[targetIndex];
    newLayers[targetIndex] = temp;

    // re-assign order numbers
    const reordered = newLayers.map((l, i) => ({ ...l, order: i + 1 }));
    updateComposition({ layers: reordered });
  };

  return (
    <div className="sim-editor-panel" role="region" aria-label="Simulation Composition Builder">
      <div className="sim-panel-section">
        <h3 className="sim-section-title">Simulation Orchestration & Multi-System Coupling</h3>
        <p className="sim-section-desc">
          Manage composite execution order, cross-system physics coupling, blending,
          and unified timestep coordination.
        </p>
      </div>

      {/* Cross-System Physics Coupling */}
      <div className="sim-panel-section">
        <h4 className="sim-subsection-title">Cross-System Physics Coupling</h4>
        <div className="sim-coupling-grid">
          <label className="sim-checkbox-label">
            <input
              type="checkbox"
              checked={composition.coupling.fluidAdvectsParticles}
              onChange={(e) => updateCoupling({ fluidAdvectsParticles: e.target.checked })}
              className="sim-checkbox"
            />
            <span>Fluid Velocity Advects GPU Particles</span>
          </label>

          <label className="sim-checkbox-label">
            <input
              type="checkbox"
              checked={composition.coupling.windAffectsFluid}
              onChange={(e) => updateCoupling({ windAffectsFluid: e.target.checked })}
              className="sim-checkbox"
            />
            <span>Atmospheric Wind Injects Momentum into Fluid Grid</span>
          </label>

          <label className="sim-checkbox-label">
            <input
              type="checkbox"
              checked={composition.coupling.windAffectsParticles}
              onChange={(e) => updateCoupling({ windAffectsParticles: e.target.checked })}
              className="sim-checkbox"
            />
            <span>Wind Vectors Steer Environmental & GPU Particles</span>
          </label>

          <label className="sim-checkbox-label">
            <input
              type="checkbox"
              checked={composition.coupling.pointerInfluencesAll}
              onChange={(e) => updateCoupling({ pointerInfluencesAll: e.target.checked })}
              className="sim-checkbox"
            />
            <span>Unified Pointer Impulses Affect All Active Subsystems</span>
          </label>
        </div>
      </div>

      {/* Timestep Mode & Time Scale */}
      <div className="sim-panel-section">
        <h4 className="sim-subsection-title">Timestep Coordinator</h4>
        <div className="sim-grid-two">
          <div className="studio-form-group">
            <label className="studio-label">Timestep Mode</label>
            <select
              className="studio-select"
              value={composition.timestepMode}
              onChange={(e) =>
                updateComposition({
                  timestepMode: e.target.value as "fixed" | "variable" | "substep",
                })
              }
            >
              <option value="variable">Variable Delta (Smooth RAF)</option>
              <option value="fixed">Fixed Timestep (60 Hz Deterministic)</option>
              <option value="substep">Substep Integration (Multi-Pass)</option>
            </select>
          </div>

          <div className="studio-form-group">
            <div className="studio-field-header">
              <label className="studio-label">Global Time Scale</label>
              <span className="studio-value-display">{composition.timeScale.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="2.0"
              step="0.05"
              value={composition.timeScale}
              onChange={(e) => updateComposition({ timeScale: Number(e.target.value) })}
              className="studio-slider"
            />
          </div>
        </div>
      </div>

      {/* Layer Composition Stack */}
      <div className="sim-panel-section">
        <h4 className="sim-subsection-title">Composition Layers Stack</h4>
        <div className="sim-layers-stack">
          {composition.layers.map((layer, index) => (
            <div key={layer.id} className="sim-card">
              <div className="sim-card-header">
                <label className="sim-checkbox-label">
                  <input
                    type="checkbox"
                    checked={layer.enabled}
                    onChange={(e) => handleUpdateLayer(layer.id, { enabled: e.target.checked })}
                    className="sim-checkbox"
                  />
                  <span className="sim-card-title">{layer.name}</span>
                </label>
                <div className="sim-layer-order-controls">
                  <button
                    type="button"
                    className="studio-btn studio-btn-sm studio-btn-outline"
                    disabled={index === 0}
                    onClick={() => handleMoveLayer(index, "up")}
                    title="Move Layer Up"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    className="studio-btn studio-btn-sm studio-btn-outline"
                    disabled={index === composition.layers.length - 1}
                    onClick={() => handleMoveLayer(index, "down")}
                    title="Move Layer Down"
                  >
                    ▼
                  </button>
                </div>
              </div>

              <div className="sim-grid-two">
                <div className="studio-form-group">
                  <div className="studio-field-header">
                    <label className="studio-label">Opacity</label>
                    <span className="studio-value-display">{(layer.opacity * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={layer.opacity}
                    onChange={(e) => handleUpdateLayer(layer.id, { opacity: Number(e.target.value) })}
                    className="studio-slider"
                  />
                </div>

                <div className="studio-form-group">
                  <label className="studio-label">Blend Mode</label>
                  <select
                    className="studio-select"
                    value={layer.blendMode}
                    onChange={(e) =>
                      handleUpdateLayer(layer.id, {
                        blendMode: e.target.value as "normal" | "additive" | "screen" | "multiply",
                      })
                    }
                  >
                    <option value="normal">Normal</option>
                    <option value="additive">Additive</option>
                    <option value="screen">Screen</option>
                    <option value="multiply">Multiply</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
