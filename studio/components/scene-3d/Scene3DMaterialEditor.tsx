import React, { useState } from "react";
import type {
  SceneObjectSpec,
  PrimitiveObjectSpec,
  MaterialSpec,
} from "../../../src/3d/schemas/types.js";
import {
  MATERIAL_3D_PRESETS,
} from "../../../src/3d/materials/presets.js";
import type { Material3DPresetName } from "../../../src/3d/materials/types.js";
import {
  listAvailableMaterialPresets,
  listAvailablePalettesFor3D,
  getPaletteColorFor3D,
} from "../../engine/scene-3d-studio-engine.js";

interface Scene3DMaterialEditorProps {
  selectedObject: SceneObjectSpec | null;
  onUpdateObject: (updated: SceneObjectSpec) => void;
}

export const Scene3DMaterialEditor: React.FC<Scene3DMaterialEditorProps> = ({
  selectedObject,
  onUpdateObject,
}) => {
  const materialPresets = listAvailableMaterialPresets();
  const palettes = listAvailablePalettesFor3D();
  const [selectedPalette, setSelectedPalette] = useState<string>(palettes[0] ?? "neon-cyber");

  if (!selectedObject) {
    return (
      <div className="scene3d-material-panel empty">
        <div className="scene3d-empty-prompt">
          <span className="scene3d-empty-icon">🎨</span>
          <h4>No Object Selected</h4>
          <p>Select a 3D primitive or mesh from the hierarchy to edit its PBR material and surface shader.</p>
        </div>
      </div>
    );
  }

  const prim = selectedObject as PrimitiveObjectSpec;
  const currentMat: MaterialSpec = prim.material ?? {
    type: "physical",
    color: "#9a7aff",
    roughness: 0.3,
    metalness: 0.1,
  };

  const updateMaterial = (patch: Partial<MaterialSpec>) => {
    onUpdateObject({
      ...selectedObject,
      material: {
        ...currentMat,
        ...patch,
      },
    } as SceneObjectSpec);
  };

  const handleApplyPreset = (name: Material3DPresetName) => {
    const preset = MATERIAL_3D_PRESETS[name];
    if (preset) {
      updateMaterial({
        type: preset.type as any,
        color: preset.color,
        roughness: preset.roughness,
        metalness: preset.metalness,
        transmission: preset.transmission,
        ior: preset.ior,
        transparent: preset.transparent,
      });
    }
  };

  const handleApplyPaletteSlot = (slot: "primary" | "secondary" | "accent") => {
    const color = getPaletteColorFor3D(selectedPalette, slot);
    updateMaterial({ color });
  };

  return (
    <div className="scene3d-material-panel">
      <div className="scene3d-panel-header">
        <h3 className="scene3d-panel-title">🎨 Material & Surface Intelligence</h3>
        <span className="scene3d-badge">{selectedObject.name ?? selectedObject.id}</span>
      </div>

      <p className="scene3d-panel-subtitle">
        Physically-based rendering (PBR) metallic-roughness workflow with transmission and palette harmony.
      </p>

      {/* Material Presets */}
      <div className="scene3d-section-card">
        <h4 className="scene3d-card-title">✨ Professional Surface Presets</h4>
        <div className="scene3d-chip-group">
          {materialPresets.map((preset) => (
            <button
              key={preset}
              type="button"
              className="scene3d-chip-btn"
              onClick={() => handleApplyPreset(preset)}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* 33 Built-in Palettes Integration */}
      <div className="scene3d-section-card">
        <h4 className="scene3d-card-title">🎨 Built-in Color Palette Harmony</h4>
        <p className="scene3d-card-desc">
          Apply calibrated tones directly from AF Motion&apos;s 33 immutable built-in palettes.
        </p>

        <div className="scene3d-palette-select-row">
          <select
            className="scene3d-select"
            value={selectedPalette}
            onChange={(e) => setSelectedPalette(e.target.value)}
          >
            {palettes.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <div className="scene3d-palette-slots">
            <button
              type="button"
              className="scene3d-slot-btn"
              style={{ background: getPaletteColorFor3D(selectedPalette, "primary") }}
              onClick={() => handleApplyPaletteSlot("primary")}
              title="Apply Primary Palette Color"
            >
              Primary
            </button>
            <button
              type="button"
              className="scene3d-slot-btn"
              style={{ background: getPaletteColorFor3D(selectedPalette, "secondary") }}
              onClick={() => handleApplyPaletteSlot("secondary")}
              title="Apply Secondary Palette Color"
            >
              Secondary
            </button>
            <button
              type="button"
              className="scene3d-slot-btn"
              style={{ background: getPaletteColorFor3D(selectedPalette, "accent") }}
              onClick={() => handleApplyPaletteSlot("accent")}
              title="Apply Accent Palette Color"
            >
              Accent
            </button>
          </div>
        </div>
      </div>

      {/* PBR Properties Sliders */}
      <div className="scene3d-section-card">
        <h4 className="scene3d-card-title">🔬 PBR Surface Controls</h4>

        {/* Base Color */}
        <div className="scene3d-field">
          <label className="scene3d-label">Base Color</label>
          <div className="scene3d-color-picker-row">
            <input
              type="color"
              className="scene3d-color-input"
              value={currentMat.color?.startsWith("#") ? currentMat.color : "#9a7aff"}
              onChange={(e) => updateMaterial({ color: e.target.value })}
            />
            <span className="scene3d-color-hex">{currentMat.color ?? "#9a7aff"}</span>
            <div
              className="scene3d-mat-swatch"
              style={{
                background: currentMat.color ?? "#9a7aff",
                opacity: currentMat.opacity ?? 1,
              }}
            />
          </div>
        </div>

        {/* Roughness */}
        <div className="scene3d-field">
          <label className="scene3d-label">
            Roughness (Glossiness): {(currentMat.roughness ?? 0.3).toFixed(2)}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            className="scene3d-slider"
            value={currentMat.roughness ?? 0.3}
            onChange={(e) => updateMaterial({ roughness: parseFloat(e.target.value) })}
          />
        </div>

        {/* Metalness */}
        <div className="scene3d-field">
          <label className="scene3d-label">
            Metalness: {(currentMat.metalness ?? 0.1).toFixed(2)}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            className="scene3d-slider"
            value={currentMat.metalness ?? 0.1}
            onChange={(e) => updateMaterial({ metalness: parseFloat(e.target.value) })}
          />
        </div>

        {/* Transmission / Glass */}
        <div className="scene3d-field">
          <label className="scene3d-label">
            Transmission (Glass Optical Refraction): {(currentMat.transmission ?? 0).toFixed(2)}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            className="scene3d-slider"
            value={currentMat.transmission ?? 0}
            onChange={(e) =>
              updateMaterial({
                transmission: parseFloat(e.target.value),
                transparent: parseFloat(e.target.value) > 0,
              })
            }
          />
        </div>

        {/* Wireframe Toggle */}
        <label className="scene3d-checkbox-label">
          <input
            type="checkbox"
            checked={Boolean(currentMat.wireframe)}
            onChange={(e) => updateMaterial({ wireframe: e.target.checked })}
          />
          <span>Render as Wireframe Mesh</span>
        </label>
      </div>
    </div>
  );
};
