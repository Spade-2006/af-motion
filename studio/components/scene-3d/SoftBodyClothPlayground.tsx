import React from "react";
import type { Advanced3DStudioState } from "../../types/advanced-3d.js";

interface SoftBodyClothPlaygroundProps {
  state: Advanced3DStudioState;
  onChange: (updater: (prev: Advanced3DStudioState) => Advanced3DStudioState) => void;
}

export const SoftBodyClothPlayground: React.FC<SoftBodyClothPlaygroundProps> = ({
  state,
  onChange,
}) => {
  const { softBody } = state;

  const updateSoftBody = (updates: Partial<typeof softBody>) => {
    onChange((prev) => ({
      ...prev,
      softBody: {
        ...prev.softBody,
        ...updates,
      },
    }));
  };

  const softBodyTypes = [
    { id: "cloth", label: "Cloth Grid" },
    { id: "rope", label: "Elastic Rope" },
    { id: "chain", label: "Articulated Chain" },
    { id: "volume", label: "Volumetric Jello" },
  ];

  return (
    <div className="scene3d-editor-panel adv3d-panel" role="region" aria-label="Soft Bodies & Cloth Playground">
      <div className="adv3d-panel-header">
        <h3 className="adv3d-section-title">🧶 Soft Bodies & Extended PBD Dynamics</h3>
        <p className="adv3d-section-desc">
          Configure XPBD position-based soft bodies, structural/shear/bending constraints,
          aerodynamic wind interaction, pinning, and progressive tearing.
        </p>
      </div>

      {/* Model Type Selector */}
      <div className="studio-form-group">
        <label className="studio-label">Soft Body Model</label>
        <div className="studio-btn-group">
          {softBodyTypes.map((type) => (
            <button
              key={type.id}
              type="button"
              className={`studio-btn studio-btn-sm ${
                softBody.type === type.id ? "studio-btn-primary" : "studio-btn-outline"
              }`}
              onClick={() =>
                updateSoftBody({
                  type: type.id as "cloth" | "rope" | "chain" | "volume",
                  particleCount: type.id === "rope" ? 32 : type.id === "volume" ? 128 : 256,
                })
              }
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Telemetry Card */}
      <div className="adv3d-card adv3d-card-highlight">
        <div className="adv3d-card-header">
          <span className="adv3d-card-label">XPBD Solver State</span>
          <span className="adv3d-badge adv3d-badge-accent">
            {softBody.particleCount} Particles
          </span>
        </div>
        <div className="adv3d-specs-grid">
          <div className="adv3d-spec-row">
            <span>Deformation Integrity</span>
            <strong>{softBody.deformationScore}%</strong>
          </div>
          <div className="adv3d-spec-row">
            <span>Rigid Body Coupling</span>
            <span className={`adv3d-badge ${softBody.coupledWithRigidBody ? "adv3d-badge-success" : "adv3d-badge-muted"}`}>
              {softBody.coupledWithRigidBody ? "Active" : "Disabled"}
            </span>
          </div>
          <div className="adv3d-spec-row">
            <span>Pinned Anchors</span>
            <strong>{softBody.pinnedIndices.length} nodes</strong>
          </div>
        </div>
      </div>

      {/* Stiffness & Constraints */}
      <div className="adv3d-panel-section">
        <h4 className="adv3d-subsection-title">Stiffness & Compliance</h4>

        <div className="adv3d-grid-two">
          <div className="studio-form-group">
            <div className="studio-field-header">
              <label className="studio-label">Structural Stiffness</label>
              <span className="studio-value-display">{(softBody.structuralStiffness * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={softBody.structuralStiffness}
              onChange={(e) => updateSoftBody({ structuralStiffness: Number(e.target.value) })}
              className="studio-slider"
            />
          </div>

          <div className="studio-form-group">
            <div className="studio-field-header">
              <label className="studio-label">Shear Stiffness</label>
              <span className="studio-value-display">{(softBody.shearStiffness * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={softBody.shearStiffness}
              onChange={(e) => updateSoftBody({ shearStiffness: Number(e.target.value) })}
              className="studio-slider"
            />
          </div>
        </div>

        <div className="adv3d-grid-two">
          <div className="studio-form-group">
            <div className="studio-field-header">
              <label className="studio-label">Bending Resistance</label>
              <span className="studio-value-display">{(softBody.bendingStiffness * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1.0"
              step="0.05"
              value={softBody.bendingStiffness}
              onChange={(e) => updateSoftBody({ bendingStiffness: Number(e.target.value) })}
              className="studio-slider"
            />
          </div>

          <div className="studio-form-group">
            <div className="studio-field-header">
              <label className="studio-label">Wind Influence</label>
              <span className="studio-value-display">{softBody.windInfluence.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0"
              max="2.0"
              step="0.05"
              value={softBody.windInfluence}
              onChange={(e) => updateSoftBody({ windInfluence: Number(e.target.value) })}
              className="studio-slider"
            />
          </div>
        </div>
      </div>

      {/* Pinning & Tearing */}
      <div className="adv3d-panel-section">
        <h4 className="adv3d-subsection-title">Coupling & Tearing</h4>

        <div className="studio-form-group">
          <label className="adv3d-checkbox-label">
            <input
              type="checkbox"
              checked={softBody.coupledWithRigidBody}
              onChange={(e) => updateSoftBody({ coupledWithRigidBody: e.target.checked })}
              className="adv3d-checkbox"
            />
            Coupled Collision with Scene Rigid Bodies
          </label>
        </div>

        <div className="studio-form-group">
          <label className="adv3d-checkbox-label">
            <input
              type="checkbox"
              checked={softBody.tearable}
              onChange={(e) => updateSoftBody({ tearable: e.target.checked })}
              className="adv3d-checkbox"
            />
            Enable Progressive Strain-Based Tearing
          </label>
        </div>

        {softBody.tearable && (
          <div className="studio-form-group">
            <div className="studio-field-header">
              <label className="studio-label">Tear Strain Threshold</label>
              <span className="studio-value-display">{softBody.tearStrainThreshold.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="1.1"
              max="3.0"
              step="0.1"
              value={softBody.tearStrainThreshold}
              onChange={(e) => updateSoftBody({ tearStrainThreshold: Number(e.target.value) })}
              className="studio-slider"
            />
          </div>
        )}
      </div>
    </div>
  );
};
