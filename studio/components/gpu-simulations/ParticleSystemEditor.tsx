import React from "react";
import type {
  GpuSimulationStudioState,
  SimulationEmitterType,
  SimulationBlendMode,
} from "../../types/gpu-simulations.js";

interface ParticleSystemEditorProps {
  state: GpuSimulationStudioState;
  onChange: (updater: (prev: GpuSimulationStudioState) => GpuSimulationStudioState) => void;
}

export const ParticleSystemEditor: React.FC<ParticleSystemEditorProps> = ({
  state,
  onChange,
}) => {
  const { particles } = state;

  const updateParticles = (updates: Partial<typeof particles>) => {
    onChange((prev) => ({
      ...prev,
      particles: {
        ...prev.particles,
        ...updates,
      },
    }));
  };

  const emitterOptions: { id: SimulationEmitterType; label: string }[] = [
    { id: "point", label: "Point" },
    { id: "box", label: "Box" },
    { id: "sphere", label: "Sphere" },
    { id: "circle", label: "Circle" },
    { id: "cone", label: "Cone" },
  ];

  const blendOptions: { id: SimulationBlendMode; label: string }[] = [
    { id: "additive", label: "Additive" },
    { id: "alpha", label: "Alpha" },
    { id: "screen", label: "Screen" },
  ];

  return (
    <div className="sim-editor-panel" role="region" aria-label="Particle System Editor">
      <div className="sim-panel-section">
        <h3 className="sim-section-title">GPU Particle System Engine</h3>
        <p className="sim-section-desc">
          Configure high-density GPU particle emitters, dynamics, lifecycles, and visual blending.
        </p>
      </div>

      {/* Particle Count Slider */}
      <div className="studio-form-group">
        <div className="studio-field-header">
          <label className="studio-label">Particle Capacity</label>
          <span className="studio-value-display">{particles.count.toLocaleString()}</span>
        </div>
        <input
          type="range"
          min="500"
          max="30000"
          step="500"
          value={particles.count}
          onChange={(e) => updateParticles({ count: Number(e.target.value) })}
          className="studio-slider"
        />
      </div>

      {/* Emitter Shape */}
      <div className="studio-form-group">
        <label className="studio-label">Emitter Geometry</label>
        <div className="studio-btn-group">
          {emitterOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className={`studio-btn studio-btn-sm ${
                particles.emitterType === opt.id ? "studio-btn-primary" : "studio-btn-outline"
              }`}
              onClick={() => updateParticles({ emitterType: opt.id })}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Emission Rate & Lifetime */}
      <div className="sim-grid-two">
        <div className="studio-form-group">
          <div className="studio-field-header">
            <label className="studio-label">Rate (ptcl/s)</label>
            <span className="studio-value-display">{particles.emissionRate}</span>
          </div>
          <input
            type="range"
            min="50"
            max="1500"
            step="25"
            value={particles.emissionRate}
            onChange={(e) => updateParticles({ emissionRate: Number(e.target.value) })}
            className="studio-slider"
          />
        </div>

        <div className="studio-form-group">
          <div className="studio-field-header">
            <label className="studio-label">Lifetime (s)</label>
            <span className="studio-value-display">{particles.lifetime.toFixed(1)}s</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="8"
            step="0.1"
            value={particles.lifetime}
            onChange={(e) => updateParticles({ lifetime: Number(e.target.value) })}
            className="studio-slider"
          />
        </div>
      </div>

      {/* Speed & Spread */}
      <div className="sim-grid-two">
        <div className="studio-form-group">
          <div className="studio-field-header">
            <label className="studio-label">Initial Speed</label>
            <span className="studio-value-display">{particles.speed}</span>
          </div>
          <input
            type="range"
            min="10"
            max="400"
            step="10"
            value={particles.speed}
            onChange={(e) => updateParticles({ speed: Number(e.target.value) })}
            className="studio-slider"
          />
        </div>

        <div className="studio-form-group">
          <div className="studio-field-header">
            <label className="studio-label">Angular Spread</label>
            <span className="studio-value-display">{particles.spread.toFixed(2)} rad</span>
          </div>
          <input
            type="range"
            min="0"
            max="3.14"
            step="0.05"
            value={particles.spread}
            onChange={(e) => updateParticles({ spread: Number(e.target.value) })}
            className="studio-slider"
          />
        </div>
      </div>

      {/* Sizes */}
      <div className="sim-grid-two">
        <div className="studio-form-group">
          <div className="studio-field-header">
            <label className="studio-label">Start Size (px)</label>
            <span className="studio-value-display">{particles.startSize}px</span>
          </div>
          <input
            type="range"
            min="1"
            max="16"
            step="1"
            value={particles.startSize}
            onChange={(e) => updateParticles({ startSize: Number(e.target.value) })}
            className="studio-slider"
          />
        </div>

        <div className="studio-form-group">
          <div className="studio-field-header">
            <label className="studio-label">End Size (px)</label>
            <span className="studio-value-display">{particles.endSize}px</span>
          </div>
          <input
            type="range"
            min="0"
            max="12"
            step="0.5"
            value={particles.endSize}
            onChange={(e) => updateParticles({ endSize: Number(e.target.value) })}
            className="studio-slider"
          />
        </div>
      </div>

      {/* Colors & Blending */}
      <div className="sim-panel-section">
        <h4 className="sim-subsection-title">Color Ramp & Blend Mode</h4>
        <div className="studio-form-group">
          <label className="studio-label">Blend Mode</label>
          <div className="studio-btn-group">
            {blendOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={`studio-btn studio-btn-sm ${
                  particles.blendMode === opt.id ? "studio-btn-primary" : "studio-btn-outline"
                }`}
                onClick={() => updateParticles({ blendMode: opt.id })}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="sim-grid-two">
          <div className="studio-form-group">
            <label className="studio-label">Start Color (CSS / RGBA)</label>
            <input
              type="text"
              value={particles.startColor}
              onChange={(e) => updateParticles({ startColor: e.target.value })}
              className="studio-input"
            />
          </div>
          <div className="studio-form-group">
            <label className="studio-label">End Color (CSS / RGBA)</label>
            <input
              type="text"
              value={particles.endColor}
              onChange={(e) => updateParticles({ endColor: e.target.value })}
              className="studio-input"
            />
          </div>
        </div>
      </div>

      {/* Physics Behaviors */}
      <div className="sim-panel-section">
        <h4 className="sim-subsection-title">Forces & Turbulence</h4>
        <div className="studio-form-group">
          <div className="studio-field-header">
            <label className="studio-label">Turbulence Intensity</label>
            <span className="studio-value-display">{particles.turbulence}</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={particles.turbulence}
            onChange={(e) => updateParticles({ turbulence: Number(e.target.value) })}
            className="studio-slider"
          />
        </div>

        <div className="sim-grid-two">
          <div className="studio-form-group">
            <div className="studio-field-header">
              <label className="studio-label">Gravity</label>
              <span className="studio-value-display">{particles.gravity}</span>
            </div>
            <input
              type="range"
              min="-60"
              max="160"
              step="5"
              value={particles.gravity}
              onChange={(e) => updateParticles({ gravity: Number(e.target.value) })}
              className="studio-slider"
            />
          </div>

          <div className="studio-form-group">
            <div className="studio-field-header">
              <label className="studio-label">Drag</label>
              <span className="studio-value-display">{particles.drag.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.3"
              step="0.01"
              value={particles.drag}
              onChange={(e) => updateParticles({ drag: Number(e.target.value) })}
              className="studio-slider"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
