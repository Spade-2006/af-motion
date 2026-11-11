import React, { useEffect, useRef } from "react";
import type { Advanced3DStudioState, MorphPresetName } from "../../types/advanced-3d.js";

interface Morphing3DPlaygroundProps {
  state: Advanced3DStudioState;
  onChange: (updater: (prev: Advanced3DStudioState) => Advanced3DStudioState) => void;
}

export const Morphing3DPlayground: React.FC<Morphing3DPlaygroundProps> = ({
  state,
  onChange,
}) => {
  const { morphing } = state;
  const rafRef = useRef<number | null>(null);

  const updateMorphing = (updates: Partial<typeof morphing>) => {
    onChange((prev) => ({
      ...prev,
      morphing: {
        ...prev.morphing,
        ...updates,
      },
    }));
  };

  const morphPresets: { id: MorphPresetName; label: string; src: string; tgt: string }[] = [
    {
      id: "sphere-to-box",
      label: "Sphere ↔ Box",
      src: "Geodesic Sphere",
      tgt: "Subdivided Cube",
    },
    {
      id: "cube-to-sphere",
      label: "Cube ↔ Sphere",
      src: "Subdivided Cube",
      tgt: "Geodesic Sphere",
    },
    {
      id: "torus-to-sphere",
      label: "Torus ↔ Sphere",
      src: "Donut Torus",
      tgt: "Resampled Sphere",
    },
    {
      id: "plane-to-wave",
      label: "Plane ↔ Wave",
      src: "Flat Grid Plane",
      tgt: "Sine Wave Mesh",
    },
    {
      id: "cylinder-to-cone",
      label: "Cylinder ↔ Cone",
      src: "Cylinder Column",
      tgt: "Conical Spire",
    },
  ];

  // Auto-playback loop
  useEffect(() => {
    if (!morphing.isPlaying) return;

    let lastTime = performance.now();
    let forward = true;

    const loop = (currentTime: number) => {
      const dt = currentTime - lastTime;
      lastTime = currentTime;

      const deltaProgress = dt / morphing.duration;

      updateMorphing({
        progress: Math.min(1, Math.max(0, morphing.progress + (forward ? deltaProgress : -deltaProgress))),
      });

      if (morphing.progress >= 1) forward = false;
      if (morphing.progress <= 0) forward = true;

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [morphing.isPlaying, morphing.duration]);

  return (
    <div className="scene3d-editor-panel adv3d-panel" role="region" aria-label="3D Morphing Playground">
      <div className="adv3d-panel-header">
        <h3 className="adv3d-section-title">🌀 3D Morphing & Blend Shape Engine</h3>
        <p className="adv3d-section-desc">
          Topological vertex correspondence, multi-target geometric interpolation,
          and smooth blend shape animations between non-identical meshes.
        </p>
      </div>

      {/* Preset Selector */}
      <div className="studio-form-group">
        <label className="studio-label">Procedural Morph Pairings</label>
        <div className="studio-btn-group adv3d-chips">
          {morphPresets.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`studio-btn studio-btn-sm ${
                morphing.preset === p.id ? "studio-btn-primary" : "studio-btn-outline"
              }`}
              onClick={() =>
                updateMorphing({
                  preset: p.id,
                  sourceGeometry: p.src,
                  targetGeometry: p.tgt,
                })
              }
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Morph Progress & Scrubbing */}
      <div className="adv3d-card adv3d-card-highlight">
        <div className="adv3d-card-header">
          <span className="adv3d-card-label">Interpolation Progress</span>
          <span className="adv3d-badge adv3d-badge-accent">
            {(morphing.progress * 100).toFixed(0)}%
          </span>
        </div>

        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={morphing.progress}
          onChange={(e) => updateMorphing({ progress: Number(e.target.value), isPlaying: false })}
          className="studio-slider adv3d-morph-slider"
        />

        <div className="adv3d-actions-row">
          <button
            type="button"
            className={`studio-btn studio-btn-sm ${
              morphing.isPlaying ? "studio-btn-primary" : "studio-btn-outline"
            }`}
            onClick={() => updateMorphing({ isPlaying: !morphing.isPlaying })}
          >
            {morphing.isPlaying ? "⏸ Pause Morph" : "▶ Animate Morph"}
          </button>
          <button
            type="button"
            className="studio-btn studio-btn-sm studio-btn-outline"
            onClick={() => updateMorphing({ progress: 0, isPlaying: false })}
          >
            ↺ Source (0%)
          </button>
          <button
            type="button"
            className="studio-btn studio-btn-sm studio-btn-outline"
            onClick={() => updateMorphing({ progress: 1, isPlaying: false })}
          >
            🎯 Target (100%)
          </button>
        </div>
      </div>

      {/* Topology & Correspondence Diagnostics */}
      <div className="adv3d-panel-section">
        <h4 className="adv3d-subsection-title">Topological Diagnostics</h4>
        <div className="adv3d-specs-grid">
          <div className="adv3d-spec-row">
            <span>Source Mesh</span>
            <strong>{morphing.sourceGeometry}</strong>
          </div>
          <div className="adv3d-spec-row">
            <span>Target Mesh</span>
            <strong>{morphing.targetGeometry}</strong>
          </div>
          <div className="adv3d-spec-row">
            <span>Resampled Vertices</span>
            <strong>{morphing.vertexCount} pts</strong>
          </div>
          <div className="adv3d-spec-row">
            <span>Correspondence</span>
            <span className="adv3d-badge adv3d-badge-success">
              {morphing.correspondenceStatus.toUpperCase()}
            </span>
          </div>
          <div className="adv3d-spec-row">
            <span>Topology Valid</span>
            <span className="adv3d-badge adv3d-badge-success">
              {morphing.topologyValid ? "✓ Verified" : "✗ Incompatible"}
            </span>
          </div>
        </div>
      </div>

      {/* Animation Duration & Easing */}
      <div className="adv3d-panel-section">
        <h4 className="adv3d-subsection-title">Animation Dynamics</h4>

        <div className="adv3d-grid-two">
          <div className="studio-form-group">
            <div className="studio-field-header">
              <label className="studio-label">Duration (ms)</label>
              <span className="studio-value-display">{morphing.duration}ms</span>
            </div>
            <input
              type="range"
              min="400"
              max="3000"
              step="100"
              value={morphing.duration}
              onChange={(e) => updateMorphing({ duration: Number(e.target.value) })}
              className="studio-slider"
            />
          </div>

          <div className="studio-form-group">
            <label className="studio-label">Easing Function</label>
            <select
              className="studio-select"
              value={morphing.easing}
              onChange={(e) => updateMorphing({ easing: e.target.value })}
            >
              <option value="easeInOutCubic">easeInOutCubic</option>
              <option value="easeOutQuad">easeOutQuad</option>
              <option value="linear">linear</option>
              <option value="easeInOutSine">easeInOutSine</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
