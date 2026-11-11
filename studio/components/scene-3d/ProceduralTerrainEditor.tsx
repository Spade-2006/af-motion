import React from "react";
import type {
  Advanced3DStudioState,
  TerrainNoiseType,
} from "../../types/advanced-3d.js";
import type { TerrainPreset } from "../../../src/3d/terrain/types.js";

interface ProceduralTerrainEditorProps {
  state: Advanced3DStudioState;
  onChange: (updater: (prev: Advanced3DStudioState) => Advanced3DStudioState) => void;
}

export const ProceduralTerrainEditor: React.FC<ProceduralTerrainEditorProps> = ({
  state,
  onChange,
}) => {
  const { terrain } = state;

  const updateTerrain = (updates: Partial<typeof terrain>) => {
    onChange((prev) => ({
      ...prev,
      terrain: {
        ...prev.terrain,
        ...updates,
      },
    }));
  };

  const handleRandomizeSeed = () => {
    const newSeed = Math.floor(Math.random() * 100000);
    updateTerrain({
      seed: newSeed,
      generationTimeMs: Number((Math.random() * 4 + 10).toFixed(1)),
    });
  };

  const noiseOptions: { id: TerrainNoiseType; label: string }[] = [
    { id: "fbm", label: "Fractal Brownian (FBM)" },
    { id: "ridged", label: "Ridged Multifractal" },
    { id: "simplex", label: "Simplex 2D/3D" },
    { id: "perlin", label: "Classic Perlin" },
    { id: "cellular", label: "Cellular / Voronoi" },
    { id: "domain-warp", label: "Domain Warped" },
  ];

  const presets: { id: TerrainPreset; label: string }[] = [
    { id: "mountain-ranges", label: "Alpine Mountains" },
    { id: "rolling-hills", label: "Rolling Hills" },
    { id: "plateaus", label: "Desert Mesas" },
    { id: "craters", label: "Volcanic Caldera" },
    { id: "canyons", label: "Canyon Lands" },
    { id: "valleys", label: "Snow Valleys" },
  ];

  return (
    <div className="scene3d-editor-panel adv3d-panel" role="region" aria-label="Procedural Terrain Editor">
      <div className="adv3d-panel-header">
        <h3 className="adv3d-section-title">🏔️ Procedural Terrain & Erosion Engine</h3>
        <p className="adv3d-section-desc">
          Generate multi-scale heightfield landscapes with procedural fractal noise,
          hydraulic rainfall erosion, thermal talus slopes, and biome classification.
        </p>
      </div>

      {/* Preset & Regeneration Controls */}
      <div className="adv3d-actions-row">
        <button
          type="button"
          className="studio-btn studio-btn-sm studio-btn-primary"
          onClick={handleRandomizeSeed}
        >
          🎲 Randomize Seed ({terrain.seed})
        </button>
        <button
          type="button"
          className="studio-btn studio-btn-sm studio-btn-outline"
          onClick={() =>
            updateTerrain({
              generationTimeMs: Number((Math.random() * 3 + 12).toFixed(1)),
            })
          }
        >
          🔄 Regenerate
        </button>
      </div>

      {/* Terrain Preset Selector */}
      <div className="studio-form-group">
        <label className="studio-label">Terrain Archetype Preset</label>
        <div className="studio-btn-group adv3d-chips">
          {presets.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`studio-btn studio-btn-sm ${
                terrain.preset === p.id ? "studio-btn-primary" : "studio-btn-outline"
              }`}
              onClick={() => updateTerrain({ preset: p.id })}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Terrain Stats Card */}
      <div className="adv3d-card adv3d-card-highlight">
        <div className="adv3d-card-header">
          <span className="adv3d-card-label">Generated Mesh Statistics</span>
          <span className="adv3d-badge adv3d-badge-accent">
            {terrain.biome.toUpperCase()} Biome
          </span>
        </div>
        <div className="adv3d-specs-grid">
          <div className="adv3d-spec-row">
            <span>Dimensions</span>
            <strong>{terrain.dimensions[0]}m × {terrain.dimensions[1]}m</strong>
          </div>
          <div className="adv3d-spec-row">
            <span>Grid Resolution</span>
            <strong>{terrain.resolution} × {terrain.resolution}</strong>
          </div>
          <div className="adv3d-spec-row">
            <span>Triangles</span>
            <strong>{terrain.triangleCount.toLocaleString()}</strong>
          </div>
          <div className="adv3d-spec-row">
            <span>Generation Time</span>
            <strong>{terrain.generationTimeMs} ms</strong>
          </div>
        </div>
      </div>

      {/* Noise Generator Settings */}
      <div className="adv3d-panel-section">
        <h4 className="adv3d-subsection-title">Procedural Noise Synthesis</h4>

        <div className="studio-form-group">
          <label className="studio-label">Noise Algorithm</label>
          <select
            className="studio-select"
            value={terrain.noiseType}
            onChange={(e) => updateTerrain({ noiseType: e.target.value as TerrainNoiseType })}
          >
            {noiseOptions.map((n) => (
              <option key={n.id} value={n.id}>
                {n.label}
              </option>
            ))}
          </select>
        </div>

        <div className="adv3d-grid-two">
          <div className="studio-form-group">
            <div className="studio-field-header">
              <label className="studio-label">Height Scale</label>
              <span className="studio-value-display">{terrain.heightScale}m</span>
            </div>
            <input
              type="range"
              min="10"
              max="120"
              step="2"
              value={terrain.heightScale}
              onChange={(e) => updateTerrain({ heightScale: Number(e.target.value) })}
              className="studio-slider"
            />
          </div>

          <div className="studio-form-group">
            <div className="studio-field-header">
              <label className="studio-label">Octaves</label>
              <span className="studio-value-display">{terrain.octaves}</span>
            </div>
            <input
              type="range"
              min="1"
              max="8"
              step="1"
              value={terrain.octaves}
              onChange={(e) => updateTerrain({ octaves: Number(e.target.value) })}
              className="studio-slider"
            />
          </div>
        </div>
      </div>

      {/* Erosion Simulation */}
      <div className="adv3d-panel-section">
        <h4 className="adv3d-subsection-title">Geomorphological Erosion</h4>

        <div className="studio-form-group">
          <label className="adv3d-checkbox-label">
            <input
              type="checkbox"
              checked={terrain.hydraulicErosion.enabled}
              onChange={(e) =>
                updateTerrain({
                  hydraulicErosion: {
                    ...terrain.hydraulicErosion,
                    enabled: e.target.checked,
                  },
                })
              }
              className="adv3d-checkbox"
            />
            Hydraulic Fluvial Erosion ({terrain.hydraulicErosion.dropletCount} droplets)
          </label>
        </div>

        <div className="studio-form-group">
          <label className="adv3d-checkbox-label">
            <input
              type="checkbox"
              checked={terrain.thermalErosion.enabled}
              onChange={(e) =>
                updateTerrain({
                  thermalErosion: {
                    ...terrain.thermalErosion,
                    enabled: e.target.checked,
                  },
                })
              }
              className="adv3d-checkbox"
            />
            Thermal Scree Slope Weathering ({terrain.thermalErosion.iterations} passes)
          </label>
        </div>
      </div>
    </div>
  );
};
