import React from "react";
import type {
  Camera3DConfig,
  Lighting3DConfig,
  Environment3DConfig,
} from "../../../src/3d/schemas/types.js";
import {
  CAMERA_PRESETS,
} from "../../../src/3d/camera/presets.js";
import type { CameraPresetName } from "../../../src/3d/camera/types.js";
import {
  LIGHTING_3D_PRESETS,
} from "../../../src/3d/lighting/presets.js";
import type { LightingPresetName } from "../../../src/3d/lighting/types.js";
import {
  ENVIRONMENT_PRESETS,
} from "../../../src/3d/environment/presets.js";
import type { EnvironmentPresetName } from "../../../src/3d/environment/types.js";
import {
  listAvailableCameraPresets,
  listAvailableLightingPresets,
  listAvailableEnvironmentPresets,
} from "../../engine/scene-3d-studio-engine.js";

interface Scene3DCameraLightingEditorProps {
  camera: Camera3DConfig | undefined;
  lighting: Lighting3DConfig | undefined;
  environment: Environment3DConfig | undefined;
  onUpdateCamera: (cam: Camera3DConfig) => void;
  onUpdateLighting: (light: Lighting3DConfig) => void;
  onUpdateEnvironment: (env: Environment3DConfig) => void;
}

export const Scene3DCameraLightingEditor: React.FC<Scene3DCameraLightingEditorProps> = ({
  camera,
  lighting,
  environment,
  onUpdateCamera,
  onUpdateLighting,
  onUpdateEnvironment,
}) => {
  const cameraPresets = listAvailableCameraPresets();
  const lightingPresets = listAvailableLightingPresets();
  const environmentPresets = listAvailableEnvironmentPresets();

  const currentCam: Camera3DConfig = {
    type: "perspective",
    fov: 45,
    position: [0, 2, 6],
    target: [0, 0, 0],
    ...camera,
  };

  const currentLight: Lighting3DConfig = {
    ambient: { color: "#ffffff", intensity: 0.5 },
    directional: [{ color: "#ffffff", intensity: 1.2, position: [5, 8, 5], castShadow: true }],
    ...lighting,
  };

  const currentEnv: Environment3DConfig = {
    background: "#0a0a0c",
    transparent: false,
    ground: { enabled: true, size: 50, color: "#141418", receiveShadow: true },
    ...environment,
  };

  const handleApplyCameraPreset = (name: CameraPresetName) => {
    const preset = CAMERA_PRESETS[name];
    if (preset) {
      onUpdateCamera({
        type: preset.type,
        fov: preset.fov,
        position: preset.position ? [...preset.position] : [0, 2, 6],
        target: preset.target ? [...preset.target] : [0, 0, 0],
        near: preset.near,
        far: preset.far,
        zoom: preset.zoom,
      });
    }
  };

  const handleApplyLightingPreset = (name: LightingPresetName) => {
    const preset = LIGHTING_3D_PRESETS[name];
    if (preset) {
      onUpdateLighting({
        ambient: preset.ambient ? { ...preset.ambient } : undefined,
        directional: preset.directional ? [...preset.directional] : undefined,
        point: preset.point ? [...preset.point] : undefined,
        spot: preset.spot ? [...preset.spot] : undefined,
      });
    }
  };

  const handleApplyEnvironmentPreset = (name: EnvironmentPresetName) => {
    const preset = ENVIRONMENT_PRESETS[name];
    if (preset) {
      onUpdateEnvironment({
        background: preset.background,
        transparent: preset.transparent,
        ground: preset.ground ? { ...preset.ground } : undefined,
        fog: preset.fog ? { ...preset.fog } : undefined,
      });
    }
  };

  return (
    <div className="scene3d-camera-lighting-panel">
      <div className="scene3d-panel-header">
        <h3 className="scene3d-panel-title">📷 Camera, Lighting & Atmosphere</h3>
      </div>
      <p className="scene3d-panel-subtitle">
        Calibrate camera projection optics, studio illumination rigs, shadows, and environment backdrops.
      </p>

      {/* 1. Camera Settings */}
      <div className="scene3d-section-card">
        <h4 className="scene3d-card-title">📷 Camera Optics & Presets</h4>
        <div className="scene3d-chip-group">
          {cameraPresets.map((preset) => (
            <button
              key={preset}
              type="button"
              className="scene3d-chip-btn"
              onClick={() => handleApplyCameraPreset(preset)}
            >
              {preset}
            </button>
          ))}
        </div>

        <div className="scene3d-row-2col">
          <div className="scene3d-field">
            <label className="scene3d-label">Camera Type</label>
            <select
              className="scene3d-select"
              value={currentCam.type ?? "perspective"}
              onChange={(e) =>
                onUpdateCamera({ ...currentCam, type: e.target.value as "perspective" | "orthographic" })
              }
            >
              <option value="perspective">Perspective</option>
              <option value="orthographic">Orthographic</option>
            </select>
          </div>

          <div className="scene3d-field">
            <label className="scene3d-label">Field of View (FOV): {currentCam.fov ?? 45}°</label>
            <input
              type="range"
              min="15"
              max="110"
              step="1"
              className="scene3d-slider"
              value={currentCam.fov ?? 45}
              onChange={(e) => onUpdateCamera({ ...currentCam, fov: parseInt(e.target.value, 10) })}
            />
          </div>
        </div>
      </div>

      {/* 2. Lighting Rig */}
      <div className="scene3d-section-card">
        <h4 className="scene3d-card-title">💡 Studio Lighting Rigs</h4>
        <div className="scene3d-chip-group">
          {lightingPresets.map((preset) => (
            <button
              key={preset}
              type="button"
              className="scene3d-chip-btn"
              onClick={() => handleApplyLightingPreset(preset)}
            >
              {preset}
            </button>
          ))}
        </div>

        <div className="scene3d-row-2col">
          <div className="scene3d-field">
            <label className="scene3d-label">
              Ambient Light: {currentLight.ambient?.intensity ?? 0.5}
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.05"
              className="scene3d-slider"
              value={currentLight.ambient?.intensity ?? 0.5}
              onChange={(e) =>
                onUpdateLighting({
                  ...currentLight,
                  ambient: {
                    color: currentLight.ambient?.color ?? "#ffffff",
                    intensity: parseFloat(e.target.value),
                  },
                })
              }
            />
          </div>

          <div className="scene3d-field">
            <label className="scene3d-label">
              Key Directional Light: {currentLight.directional?.[0]?.intensity ?? 1.2}
            </label>
            <input
              type="range"
              min="0"
              max="4"
              step="0.1"
              className="scene3d-slider"
              value={currentLight.directional?.[0]?.intensity ?? 1.2}
              onChange={(e) => {
                const dirList = currentLight.directional ? [...currentLight.directional] : [];
                const first = dirList[0] ?? { color: "#ffffff", intensity: 1.2, position: [5, 8, 5] };
                dirList[0] = { ...first, intensity: parseFloat(e.target.value) };
                onUpdateLighting({ ...currentLight, directional: dirList });
              }}
            />
          </div>
        </div>
      </div>

      {/* 3. Environment & Ground */}
      <div className="scene3d-section-card">
        <h4 className="scene3d-card-title">🌐 Atmosphere & Staging Backdrops</h4>
        <div className="scene3d-chip-group">
          {environmentPresets.map((preset) => (
            <button
              key={preset}
              type="button"
              className="scene3d-chip-btn"
              onClick={() => handleApplyEnvironmentPreset(preset)}
            >
              {preset}
            </button>
          ))}
        </div>

        <div className="scene3d-row-2col">
          <div className="scene3d-field">
            <label className="scene3d-label">Background Color</label>
            <div className="scene3d-color-picker-row">
              <input
                type="color"
                className="scene3d-color-input"
                value={currentEnv.background?.startsWith("#") ? currentEnv.background : "#0a0a0c"}
                onChange={(e) => onUpdateEnvironment({ ...currentEnv, background: e.target.value })}
              />
              <span className="scene3d-color-hex">{currentEnv.background}</span>
            </div>
          </div>

          <div className="scene3d-field">
            <label className="scene3d-checkbox-label" style={{ marginTop: "24px" }}>
              <input
                type="checkbox"
                checked={currentEnv.ground?.enabled !== false}
                onChange={(e) =>
                  onUpdateEnvironment({
                    ...currentEnv,
                    ground: {
                      ...currentEnv.ground,
                      enabled: e.target.checked,
                    },
                  })
                }
              />
              <span>Ground Shadow Plane</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
