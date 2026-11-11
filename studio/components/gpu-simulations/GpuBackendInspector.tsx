import React from "react";
import type { GpuSimulationStudioState } from "../../types/gpu-simulations.js";
import { detectGpuBackendInfo } from "../../engine/gpu-simulations-engine.js";

interface GpuBackendInspectorProps {
  state: GpuSimulationStudioState;
  onChange: (updater: (prev: GpuSimulationStudioState) => GpuSimulationStudioState) => void;
}

export const GpuBackendInspector: React.FC<GpuBackendInspectorProps> = ({
  state,
  onChange,
}) => {
  const { backend } = state;
  const { deviceInfo, activeBackend, backendPreference } = backend;

  const handleSelectPreference = (pref: "auto" | "webgpu" | "webgl2" | "cpu") => {
    const updated = detectGpuBackendInfo(pref);
    onChange((prev) => ({
      ...prev,
      backend: updated,
    }));
  };

  const handleReprobe = () => {
    const updated = detectGpuBackendInfo(backendPreference);
    onChange((prev) => ({
      ...prev,
      backend: updated,
    }));
  };

  const getStatusBadge = (supported: boolean) => (
    <span className={`sim-badge ${supported ? "sim-badge-success" : "sim-badge-muted"}`}>
      {supported ? "✓ Supported" : "✗ Unsupported"}
    </span>
  );

  return (
    <div className="sim-editor-panel" role="region" aria-label="GPU Backend Inspector">
      <div className="sim-panel-section">
        <h3 className="sim-section-title">GPU Compute Backend & Hardware Engine</h3>
        <p className="sim-section-desc">
          Inspect native WebGPU compute pipelines, WebGL2 transform-feedback FBO simulation,
          and deterministic CPU fallback capabilities.
        </p>
      </div>

      {/* Backend Selection Radio Group */}
      <div className="studio-form-group">
        <label className="studio-label">Backend Selection Preference</label>
        <div className="studio-btn-group">
          {(["auto", "webgpu", "webgl2", "cpu"] as const).map((pref) => (
            <button
              key={pref}
              type="button"
              className={`studio-btn studio-btn-sm ${
                backendPreference === pref ? "studio-btn-primary" : "studio-btn-outline"
              }`}
              onClick={() => handleSelectPreference(pref)}
            >
              {pref.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Active Backend Status Card */}
      <div className="sim-card sim-card-highlight">
        <div className="sim-card-header">
          <span className="sim-card-label">Active Simulation Pipeline</span>
          <span className="sim-badge sim-badge-accent">
            {activeBackend.toUpperCase()}
          </span>
        </div>
        <div className="sim-device-name">{deviceInfo.rendererName}</div>
      </div>

      {/* Hardware Probed Capabilities */}
      <div className="sim-panel-section">
        <h4 className="sim-subsection-title">Hardware Capabilities</h4>
        <div className="sim-specs-grid">
          <div className="sim-spec-row">
            <span className="sim-spec-key">WebGPU Compute Shaders</span>
            <span className="sim-spec-val">{getStatusBadge(deviceInfo.webgpuSupported)}</span>
          </div>
          <div className="sim-spec-row">
            <span className="sim-spec-key">WebGL2 Texture & FBO Simulation</span>
            <span className="sim-spec-val">{getStatusBadge(deviceInfo.webgl2Supported)}</span>
          </div>
          <div className="sim-spec-row">
            <span className="sim-spec-key">32-Bit Floating Point Textures</span>
            <span className="sim-spec-val">{getStatusBadge(deviceInfo.float32Textures)}</span>
          </div>
          <div className="sim-spec-row">
            <span className="sim-spec-key">Compute Storage Buffers</span>
            <span className="sim-spec-val">{getStatusBadge(deviceInfo.storageBuffers)}</span>
          </div>
          <div className="sim-spec-row">
            <span className="sim-spec-key">Max Texture Dimension</span>
            <span className="sim-spec-val">{deviceInfo.maxTextureDimension}px</span>
          </div>
          <div className="sim-spec-row">
            <span className="sim-spec-key">Max Buffer Size</span>
            <span className="sim-spec-val">
              {Math.round(deviceInfo.maxBufferSize / (1024 * 1024))} MB
            </span>
          </div>
          <div className="sim-spec-row">
            <span className="sim-spec-key">Workgroup Max Sizes</span>
            <span className="sim-spec-val">
              [{deviceInfo.maxComputeWorkgroupSize.join(", ")}]
            </span>
          </div>
        </div>
      </div>

      {/* Action to Reprobe */}
      <div className="sim-panel-actions">
        <button
          type="button"
          className="studio-btn studio-btn-outline"
          onClick={handleReprobe}
        >
          🔄 Re-Probe GPU Capabilities
        </button>
      </div>
    </div>
  );
};
