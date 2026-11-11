import React, { useMemo, useState } from "react";
import type {
  MotionPhysicsStudioState,
  SpringEditorConfig,
} from "../../types/motion-physics.js";
import {
  calculateDampingRatio,
  classifyDampingBehavior,
  calculateNaturalFrequency,
} from "../../../src/core/physics/spring-math.js";
import {
  generateSpringGraphData,
  loadSpringPreset,
  listAvailableSpringPresets,
} from "../../engine/motion-physics-engine.js";
import type {
  SpringPresetName,
  SpringDampingBehavior,
} from "../../../src/core/physics/spring-types.js";

interface AdvancedSpringEditorProps {
  state: MotionPhysicsStudioState;
  onUpdateState: (updater: (prev: MotionPhysicsStudioState) => MotionPhysicsStudioState) => void;
}

export const AdvancedSpringEditor: React.FC<AdvancedSpringEditorProps> = ({
  state,
  onUpdateState,
}) => {
  const { springConfig, selectedSpringPreset } = state;
  const [testDisplacement, setTestDisplacement] = useState<number>(100);
  const [isTestAnimating, setIsTestAnimating] = useState(false);

  // Derived spring mathematics
  const { zeta, omega0, behavior, settlingTime } = useMemo(() => {
    const z = calculateDampingRatio(springConfig.stiffness, springConfig.damping, springConfig.mass);
    const w = calculateNaturalFrequency(springConfig.stiffness, springConfig.mass);
    const b: SpringDampingBehavior = classifyDampingBehavior(z);
    const effectiveZeta = Math.max(0.01, z);
    const st = Math.max(0.1, -Math.log(Math.max(0.0001, springConfig.restDelta)) / (effectiveZeta * (w || 1)));
    return { zeta: z, omega0: w, behavior: b, settlingTime: st };
  }, [springConfig]);

  // Graph data points
  const graphPoints = useMemo(() => {
    return generateSpringGraphData(springConfig, 2.0, 100);
  }, [springConfig]);

  const updateConfig = (key: keyof SpringEditorConfig, val: number) => {
    onUpdateState((prev) => ({
      ...prev,
      springConfig: { ...prev.springConfig, [key]: val },
      selectedSpringPreset: "custom",
    }));
  };

  const handleSelectPreset = (presetName: SpringPresetName) => {
    const loaded = loadSpringPreset(presetName);
    onUpdateState((prev) => ({
      ...prev,
      springConfig: loaded,
      selectedSpringPreset: presetName,
    }));
  };

  // Convert graph points into SVG polyline points string
  const svgPathD = useMemo(() => {
    if (graphPoints.length === 0) return "";
    const w = 460;
    const h = 200;
    const maxT = 2.0;
    const target = springConfig.targetPosition;
    const minY = target - 120;
    const maxY = target + 120;

    return graphPoints
      .map((pt, i) => {
        const x = (pt.time / maxT) * w;
        const normY = (pt.position - minY) / (maxY - minY);
        const y = h - normY * h;
        return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${Math.max(0, Math.min(h, y)).toFixed(1)}`;
      })
      .join(" ");
  }, [graphPoints, springConfig.targetPosition]);

  const behaviorColor =
    behavior === "underdamped"
      ? "#38bdf8"
      : behavior === "critically-damped"
      ? "#22c55e"
      : "#eab308";

  return (
    <div className="mp-spring-editor-layout">
      {/* Left Control Column */}
      <section className="mp-spring-controls-card">
        <div className="mp-panel-header">
          <h3 className="mp-panel-title">Harmonic Spring Physics</h3>
          <span
            className="mp-badge-behavior"
            style={{ backgroundColor: `${behaviorColor}20`, color: behaviorColor, borderColor: behaviorColor }}
          >
            {behavior.toUpperCase().replace("-", " ")}
          </span>
        </div>

        {/* Preset Selector */}
        <div className="mp-presets-row">
          <label className="mp-field-label">Calibrated Presets</label>
          <div className="mp-preset-chip-group">
            {listAvailableSpringPresets().map((p) => (
              <button
                key={p.id}
                type="button"
                className={`mp-preset-chip ${selectedSpringPreset === p.id ? "active" : ""}`}
                onClick={() => handleSelectPreset(p.id as SpringPresetName)}
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
              <span>Stiffness (k)</span>
              <span className="mp-val-readout">{springConfig.stiffness.toFixed(0)} N/m</span>
            </div>
            <input
              type="range"
              min="10"
              max="1000"
              step="5"
              value={springConfig.stiffness}
              onChange={(e) => updateConfig("stiffness", parseFloat(e.target.value))}
            />
          </div>

          <div className="mp-slider-group">
            <div className="mp-slider-header">
              <span>Damping (c)</span>
              <span className="mp-val-readout">{springConfig.damping.toFixed(1)} N·s/m</span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              step="0.5"
              value={springConfig.damping}
              onChange={(e) => updateConfig("damping", parseFloat(e.target.value))}
            />
          </div>

          <div className="mp-slider-group">
            <div className="mp-slider-header">
              <span>Mass (m)</span>
              <span className="mp-val-readout">{springConfig.mass.toFixed(2)} kg</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="10.0"
              step="0.1"
              value={springConfig.mass}
              onChange={(e) => updateConfig("mass", parseFloat(e.target.value))}
            />
          </div>

          <div className="mp-slider-group">
            <div className="mp-slider-header">
              <span>Initial Velocity (v₀)</span>
              <span className="mp-val-readout">{springConfig.initialVelocity.toFixed(0)} px/s</span>
            </div>
            <input
              type="range"
              min="-800"
              max="800"
              step="20"
              value={springConfig.initialVelocity}
              onChange={(e) => updateConfig("initialVelocity", parseFloat(e.target.value))}
            />
          </div>

          <div className="mp-slider-group">
            <div className="mp-slider-header">
              <span>Target Position</span>
              <span className="mp-val-readout">{springConfig.targetPosition.toFixed(0)} px</span>
            </div>
            <input
              type="range"
              min="0"
              max="300"
              step="10"
              value={springConfig.targetPosition}
              onChange={(e) => updateConfig("targetPosition", parseFloat(e.target.value))}
            />
          </div>
        </div>

        {/* Analytical Readouts */}
        <div className="mp-metrics-card">
          <div className="mp-metric-item">
            <span className="mp-metric-label">Damping Ratio (ζ)</span>
            <span className="mp-metric-val">{zeta.toFixed(3)}</span>
          </div>
          <div className="mp-metric-item">
            <span className="mp-metric-label">Natural Freq (ω₀)</span>
            <span className="mp-metric-val">{omega0.toFixed(2)} rad/s</span>
          </div>
          <div className="mp-metric-item">
            <span className="mp-metric-label">Estimated Settle</span>
            <span className="mp-metric-val">{settlingTime.toFixed(2)} s</span>
          </div>
        </div>
      </section>

      {/* Right Column: Live Graph & Interactive Widget */}
      <section className="mp-spring-preview-card">
        <h4 className="mp-graph-title">Analytical Response Curve: x(t)</h4>

        {/* SVG Curve Graph */}
        <div className="mp-graph-wrapper">
          <svg className="mp-graph-svg" viewBox="0 0 460 200">
            {/* Grid Lines */}
            <line x1="0" y1="100" x2="460" y2="100" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="0" y1="50" x2="460" y2="50" stroke="#1e293b" strokeWidth="1" />
            <line x1="0" y1="150" x2="460" y2="150" stroke="#1e293b" strokeWidth="1" />
            <line x1="230" y1="0" x2="230" y2="200" stroke="#1e293b" strokeWidth="1" />

            {/* Target line */}
            <line x1="0" y1="100" x2="460" y2="100" stroke="#9a7aff" strokeWidth="1.5" strokeOpacity="0.4" />

            {/* Response Curve */}
            <path d={svgPathD} fill="none" stroke="#9a7aff" strokeWidth="2.5" />
          </svg>
          <div className="mp-graph-legend">
            <span>0.0s</span>
            <span>1.0s</span>
            <span>2.0s</span>
          </div>
        </div>

        {/* Live Interactive Physics Bounce Stage */}
        <div className="mp-interactive-spring-stage">
          <div className="mp-spring-track">
            <div
              className={`mp-spring-actor ${isTestAnimating ? "bouncing" : ""}`}
              style={{
                transform: `translateX(${testDisplacement}px)`,
                transition: isTestAnimating
                  ? `transform ${settlingTime}s cubic-bezier(0.34, 1.56, 0.64, 1)`
                  : "none",
              }}
            >
              ⚛️
            </div>
            <div
              className="mp-target-anchor"
              style={{ transform: `translateX(${springConfig.targetPosition}px)` }}
            />
          </div>
          <button
            type="button"
            className="mp-btn-trigger"
            onClick={() => {
              setTestDisplacement(0);
              setIsTestAnimating(false);
              setTimeout(() => {
                setTestDisplacement(springConfig.targetPosition);
                setIsTestAnimating(true);
              }, 20);
            }}
          >
            🚀 Trigger Spring Motion
          </button>
        </div>
      </section>
    </div>
  );
};
