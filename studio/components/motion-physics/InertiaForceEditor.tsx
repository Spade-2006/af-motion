import React, { useMemo, useState } from "react";
import type {
  MotionPhysicsStudioState,
  InertiaEditorConfig,
} from "../../types/motion-physics.js";
import {
  generateInertiaGraphData,
  loadInertiaPreset,
  listAvailableInertiaPresets,
} from "../../engine/motion-physics-engine.js";
import type { InertiaPresetName } from "../../../src/core/physics/inertia-types.js";

interface InertiaForceEditorProps {
  state: MotionPhysicsStudioState;
  onUpdateState: (updater: (prev: MotionPhysicsStudioState) => MotionPhysicsStudioState) => void;
}

export const InertiaForceEditor: React.FC<InertiaForceEditorProps> = ({
  state,
  onUpdateState,
}) => {
  const { inertiaConfig, selectedInertiaPreset } = state;
  const [puckOffset, setPuckOffset] = useState<number>(0);
  const [isGliding, setIsGliding] = useState(false);

  // Derived kinetics
  const momentum = inertiaConfig.mass * inertiaConfig.initialVelocity;
  const mu = Math.max(0.01, inertiaConfig.friction);
  const stoppingDistance = inertiaConfig.initialVelocity / mu;
  const stoppingTime = Math.max(
    0.1,
    Math.log(Math.max(1, inertiaConfig.initialVelocity) / Math.max(0.1, inertiaConfig.minVelocity)) / mu
  );

  // Graph points
  const graphPoints = useMemo(() => {
    return generateInertiaGraphData(inertiaConfig, 2.0, 80);
  }, [inertiaConfig]);

  const updateConfig = (key: keyof InertiaEditorConfig, val: number) => {
    onUpdateState((prev) => ({
      ...prev,
      inertiaConfig: { ...prev.inertiaConfig, [key]: val },
      selectedInertiaPreset: "custom",
    }));
  };

  const handleSelectPreset = (presetName: InertiaPresetName) => {
    const loaded = loadInertiaPreset(presetName);
    onUpdateState((prev) => ({
      ...prev,
      inertiaConfig: loaded,
      selectedInertiaPreset: presetName,
    }));
  };

  // Convert velocity graph to SVG path (460w x 180h)
  const svgVelocityPath = useMemo(() => {
    if (graphPoints.length === 0) return "";
    const w = 460;
    const h = 180;
    const maxV = Math.max(10, inertiaConfig.initialVelocity);

    return graphPoints
      .map((pt, i) => {
        const x = (pt.time / 2.0) * w;
        const y = h - (pt.velocity / maxV) * (h - 20) - 10;
        return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${Math.max(5, Math.min(h - 5, y)).toFixed(1)}`;
      })
      .join(" ");
  }, [graphPoints, inertiaConfig.initialVelocity]);

  const handleFlingTest = () => {
    setPuckOffset(0);
    setIsGliding(false);
    setTimeout(() => {
      setPuckOffset(Math.min(320, stoppingDistance * 0.8));
      setIsGliding(true);
    }, 20);
  };

  return (
    <div className="mp-inertia-editor-layout">
      {/* Control Configuration Column */}
      <section className="mp-spring-controls-card">
        <div className="mp-panel-header">
          <h3 className="mp-panel-title">Inertia, Momentum &amp; Friction</h3>
          <span className="mp-badge-behavior" style={{ backgroundColor: "#38bdf820", color: "#38bdf8" }}>
            MOMENTUM
          </span>
        </div>

        {/* Preset Chips */}
        <div className="mp-presets-row">
          <label className="mp-field-label">Inertial Presets</label>
          <div className="mp-preset-chip-group">
            {listAvailableInertiaPresets().map((p) => (
              <button
                key={p.id}
                type="button"
                className={`mp-preset-chip ${selectedInertiaPreset === p.id ? "active" : ""}`}
                onClick={() => handleSelectPreset(p.id as InertiaPresetName)}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Sliders */}
        <div className="mp-sliders-container">
          <div className="mp-slider-group">
            <div className="mp-slider-header">
              <span>Friction Coefficient (μ)</span>
              <span className="mp-val-readout">{inertiaConfig.friction.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="15.0"
              step="0.2"
              value={inertiaConfig.friction}
              onChange={(e) => updateConfig("friction", parseFloat(e.target.value))}
            />
          </div>

          <div className="mp-slider-group">
            <div className="mp-slider-header">
              <span>Initial Velocity (v₀)</span>
              <span className="mp-val-readout">{inertiaConfig.initialVelocity.toFixed(0)} px/s</span>
            </div>
            <input
              type="range"
              min="50"
              max="1200"
              step="25"
              value={inertiaConfig.initialVelocity}
              onChange={(e) => updateConfig("initialVelocity", parseFloat(e.target.value))}
            />
          </div>

          <div className="mp-slider-group">
            <div className="mp-slider-header">
              <span>Mass (m)</span>
              <span className="mp-val-readout">{inertiaConfig.mass.toFixed(1)} kg</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="5.0"
              step="0.1"
              value={inertiaConfig.mass}
              onChange={(e) => updateConfig("mass", parseFloat(e.target.value))}
            />
          </div>

          <div className="mp-slider-group">
            <div className="mp-slider-header">
              <span>Aerodynamic Drag (c_d)</span>
              <span className="mp-val-readout">{(inertiaConfig.drag * 1000).toFixed(2)} m⁻¹</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="0.01"
              step="0.0005"
              value={inertiaConfig.drag}
              onChange={(e) => updateConfig("drag", parseFloat(e.target.value))}
            />
          </div>

          <div className="mp-slider-group">
            <div className="mp-slider-header">
              <span>Simulated Gravity</span>
              <span className="mp-val-readout">{(inertiaConfig.gravity / 100).toFixed(1)} m/s²</span>
            </div>
            <input
              type="range"
              min="0"
              max="2000"
              step="50"
              value={inertiaConfig.gravity}
              onChange={(e) => updateConfig("gravity", parseFloat(e.target.value))}
            />
          </div>
        </div>

        {/* Metrics Readout */}
        <div className="mp-metrics-card">
          <div className="mp-metric-item">
            <span className="mp-metric-label">Momentum (p)</span>
            <span className="mp-metric-val">{momentum.toFixed(1)}</span>
          </div>
          <div className="mp-metric-item">
            <span className="mp-metric-label">Stopping Dist</span>
            <span className="mp-metric-val">{stoppingDistance.toFixed(1)} px</span>
          </div>
          <div className="mp-metric-item">
            <span className="mp-metric-label">Duration</span>
            <span className="mp-metric-val">{stoppingTime.toFixed(2)} s</span>
          </div>
        </div>
      </section>

      {/* Live Graph & Gliding Interactive Stage */}
      <section className="mp-spring-preview-card">
        <h4 className="mp-graph-title">Velocity Decay Profile: v(t) = v₀ · e^(-μt)</h4>

        <div className="mp-graph-wrapper">
          <svg className="mp-graph-svg" viewBox="0 0 460 180">
            {/* Grid */}
            <line x1="0" y1="90" x2="460" y2="90" stroke="#1e293b" strokeWidth="1" />
            <line x1="230" y1="0" x2="230" y2="180" stroke="#1e293b" strokeWidth="1" />

            {/* Threshold Line */}
            <line x1="0" y1="170" x2="460" y2="170" stroke="#334155" strokeDasharray="3 3" />

            {/* Curve */}
            <path d={svgVelocityPath} fill="none" stroke="#38bdf8" strokeWidth="2.5" />
          </svg>
          <div className="mp-graph-legend">
            <span>v₀ = {inertiaConfig.initialVelocity}</span>
            <span>t = 1.0s</span>
            <span>Rest (0 px/s)</span>
          </div>
        </div>

        {/* Flingable Puck Stage */}
        <div className="mp-interactive-spring-stage">
          <div className="mp-spring-track">
            <div
              className="mp-puck-actor"
              style={{
                transform: `translateX(${puckOffset}px)`,
                transition: isGliding
                  ? `transform ${stoppingTime}s cubic-bezier(0.16, 1, 0.3, 1)`
                  : "none",
              }}
            >
              🏒
            </div>
          </div>
          <button type="button" className="mp-btn-trigger" onClick={handleFlingTest}>
            ⚡ Release Inertial Fling
          </button>
        </div>
      </section>
    </div>
  );
};
