import React from "react";
import type {
  CustomMotionDNAValues,
} from "../../types/design-systems.js";
import type { MotionDNAPersonality } from "../../../src/core/motion-dna.js";
import { BUILT_IN_MOTION_DNA } from "../../../src/core/motion-dna.js";
import { getDefaultMotionDNAValues, getMotionDNAById } from "../../engine/design-system-dna-engine.js";

interface MotionDNAEditorProps {
  dnaValues: CustomMotionDNAValues;
  onChange: (values: CustomMotionDNAValues) => void;
  onReset: () => void;
}

const PERSONALITIES: Array<{
  id: MotionDNAPersonality;
  label: string;
  icon: string;
  desc: string;
}> = [
  {
    id: "snappy",
    label: "Snappy",
    icon: "⚡",
    desc: "Crisp, low-latency responsiveness for productivity dashboards & toolbars.",
  },
  {
    id: "energetic",
    label: "Energetic",
    icon: "🔥",
    desc: "Punchy, dynamic springs with dramatic entrances for high-impact landing pages.",
  },
  {
    id: "calm",
    label: "Calm",
    icon: "🌊",
    desc: "Gentle, non-intrusive deceleration curves for content readers & meditation apps.",
  },
  {
    id: "cinematic",
    label: "Cinematic",
    icon: "🎬",
    desc: "Stately, deliberate, theatrical pacing with sweeping continuous motion.",
  },
  {
    id: "minimal",
    label: "Minimal",
    icon: "◻️",
    desc: "Subtle, utility-first transitions for dense tabular interfaces and data tables.",
  },
  {
    id: "playful",
    label: "Playful",
    icon: "🎈",
    desc: "Bouncy, expressive overshoots and tactile feedback for creative apps.",
  },
];

export const MotionDNAEditor: React.FC<MotionDNAEditorProps> = ({
  dnaValues,
  onChange,
  onReset,
}) => {
  const handleSelectPersonality = (p: MotionDNAPersonality) => {
    const dnaDef = getMotionDNAById(p);
    const defaults = getDefaultMotionDNAValues(dnaDef);
    onChange({
      ...defaults,
      personality: p,
    });
  };

  const updateSpring = (
    key: keyof CustomMotionDNAValues["spring"],
    val: number
  ) => {
    onChange({
      ...dnaValues,
      spring: {
        ...dnaValues.spring,
        [key]: val,
      },
    });
  };

  const activeMeta = PERSONALITIES.find((p) => p.id === dnaValues.personality);

  return (
    <div className="ds-motion-dna-editor-panel">
      <div className="ds-section-header">
        <h3 className="ds-section-title">🧬 Motion DNA Profile Editor</h3>
        <button
          type="button"
          className="ds-reset-btn"
          onClick={onReset}
          title="Reset Motion DNA to profile defaults"
        >
          Reset Profile
        </button>
      </div>

      <p className="ds-section-subtitle">
        Define the brand&apos;s systemic physics: timing, spring dynamics, and emotional resonance.
      </p>

      {/* Personality Selector Grid */}
      <div className="ds-dna-personality-grid" role="radiogroup" aria-label="Motion DNA Personality">
        {PERSONALITIES.map((p) => {
          const isSelected = p.id === dnaValues.personality;
          return (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={`ds-dna-personality-card ${isSelected ? "selected" : ""}`}
              onClick={() => handleSelectPersonality(p.id)}
            >
              <div className="ds-dna-card-header">
                <span className="ds-dna-icon">{p.icon}</span>
                <span className="ds-dna-label">{p.label}</span>
                {isSelected && <span className="ds-active-pill">Active</span>}
              </div>
              <p className="ds-dna-desc">{p.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Pacing & Dynamics Controls */}
      <div className="ds-dna-controls-section">
        <h4 className="ds-overrides-title">
          Motion Dynamics for <em>{activeMeta?.label}</em>
        </h4>

        <div className="ds-control-row">
          <label className="ds-label">
            <span>Motion Intensity ({dnaValues.intensity}x)</span>
          </label>
          <input
            type="range"
            min="0.2"
            max="2.0"
            step="0.05"
            value={dnaValues.intensity}
            onChange={(e) =>
              onChange({ ...dnaValues, intensity: Number(e.target.value) })
            }
          />
        </div>

        <div className="ds-control-row">
          <label className="ds-label">
            <span>Base Duration ({dnaValues.duration}ms)</span>
          </label>
          <input
            type="range"
            min="100"
            max="800"
            step="25"
            value={dnaValues.duration}
            onChange={(e) =>
              onChange({ ...dnaValues, duration: Number(e.target.value) })
            }
          />
        </div>

        <div className="ds-control-row">
          <label className="ds-label">
            <span>Distance Multiplier ({dnaValues.distanceMultiplier}x)</span>
          </label>
          <input
            type="range"
            min="0.2"
            max="2.0"
            step="0.1"
            value={dnaValues.distanceMultiplier}
            onChange={(e) =>
              onChange({ ...dnaValues, distanceMultiplier: Number(e.target.value) })
            }
          />
        </div>

        <div className="ds-control-row">
          <label className="ds-label">
            <span>Entrance Easing Curve</span>
          </label>
          <select
            className="ds-select"
            value={dnaValues.entranceEasing}
            onChange={(e) =>
              onChange({ ...dnaValues, entranceEasing: e.target.value })
            }
          >
            <option value="ease-out">ease-out (Standard Deceleration)</option>
            <option value="cubic-bezier(0.16, 1, 0.3, 1)">ease-out-expo (Snappy)</option>
            <option value="cubic-bezier(0.34, 1.56, 0.64, 1)">overshoot (Playful)</option>
            <option value="cubic-bezier(0.25, 0.1, 0.25, 1)">smooth (Calm)</option>
            <option value="linear">linear</option>
          </select>
        </div>

        {/* Spring Physics Parameters */}
        <h4 className="ds-overrides-title" style={{ marginTop: "20px" }}>
          Spring Physics (F = -kx - cv)
        </h4>

        <div className="ds-control-row">
          <label className="ds-label">
            <span>Stiffness (k = {dnaValues.spring.stiffness})</span>
          </label>
          <input
            type="range"
            min="50"
            max="600"
            step="10"
            value={dnaValues.spring.stiffness}
            onChange={(e) => updateSpring("stiffness", Number(e.target.value))}
          />
        </div>

        <div className="ds-control-row">
          <label className="ds-label">
            <span>Damping (c = {dnaValues.spring.damping})</span>
          </label>
          <input
            type="range"
            min="5"
            max="60"
            step="1"
            value={dnaValues.spring.damping}
            onChange={(e) => updateSpring("damping", Number(e.target.value))}
          />
        </div>

        <div className="ds-control-row">
          <label className="ds-label">
            <span>Mass (m = {dnaValues.spring.mass})</span>
          </label>
          <input
            type="range"
            min="0.5"
            max="3.0"
            step="0.1"
            value={dnaValues.spring.mass}
            onChange={(e) => updateSpring("mass", Number(e.target.value))}
          />
        </div>

        <label className="ds-checkbox-row">
          <input
            type="checkbox"
            checked={dnaValues.respectReducedMotion}
            onChange={(e) =>
              onChange({ ...dnaValues, respectReducedMotion: e.target.checked })
            }
          />
          <span>Respect Reduced Motion Preference</span>
        </label>
      </div>
    </div>
  );
};
