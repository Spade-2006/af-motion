import React from "react";
import type {
  Advanced3DStudioState,
  RigidBodyStudioItem,
  ConstraintStudioItem,
} from "../../types/advanced-3d.js";
import type { ColliderShapeType3D, ConstraintType3D } from "../../../src/3d/physics/types.js";

interface RigidBodyConstraintEditorProps {
  state: Advanced3DStudioState;
  onChange: (updater: (prev: Advanced3DStudioState) => Advanced3DStudioState) => void;
}

export const RigidBodyConstraintEditor: React.FC<RigidBodyConstraintEditorProps> = ({
  state,
  onChange,
}) => {
  const { rigidBodies } = state;
  const { bodies, constraints, selectedBodyId, selectedConstraintId } = rigidBodies;

  const updateRigidBodies = (updates: Partial<typeof rigidBodies>) => {
    onChange((prev) => ({
      ...prev,
      rigidBodies: {
        ...prev.rigidBodies,
        ...updates,
      },
    }));
  };

  const selectedBody = bodies.find((b) => b.id === selectedBodyId) ?? bodies[0];

  const handleUpdateBody = (id: string, updates: Partial<RigidBodyStudioItem>) => {
    updateRigidBodies({
      bodies: bodies.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    });
  };

  const handleAddBody = () => {
    const newBody: RigidBodyStudioItem = {
      id: `body-${Date.now()}`,
      name: `Rigid Box ${bodies.length + 1}`,
      type: "dynamic",
      mass: 2.0,
      shape: "box",
      dimensions: [1, 1, 1],
      restitution: 0.5,
      friction: 0.5,
      linearDamping: 0.02,
      angularDamping: 0.05,
      collisionLayer: 1,
      collisionMask: 0xffffffff,
      ccd: false,
      position: [0, 4.0 + bodies.length * 0.5, 0],
      rotation: [0, 0, 0, 1],
      linearVelocity: [0, 0, 0],
      angularVelocity: [0, 0, 0],
      isSleeping: false,
    };
    updateRigidBodies({
      bodies: [...bodies, newBody],
      selectedBodyId: newBody.id,
    });
  };

  const handleRemoveBody = (id: string) => {
    const remaining = bodies.filter((b) => b.id !== id);
    updateRigidBodies({
      bodies: remaining,
      selectedBodyId: remaining[0]?.id ?? null,
    });
  };

  const handleAddConstraint = () => {
    const newConstraint: ConstraintStudioItem = {
      id: `constraint-${Date.now()}`,
      name: `Constraint ${constraints.length + 1}`,
      type: "hinge",
      bodyAId: bodies[0]?.id ?? "body-ground",
      bodyBId: bodies[1]?.id ?? "body-cube-1",
      pivotA: [0, 3, 0],
      pivotB: [0, 0, 0],
      limits: { min: -1.5, max: 1.5 },
      motor: { enabled: false, targetVelocity: 0, maxForce: 0 },
      spring: { stiffness: 100, damping: 10 },
      breakImpulse: 2000,
      enabled: true,
    };
    updateRigidBodies({
      constraints: [...constraints, newConstraint],
      selectedConstraintId: newConstraint.id,
    });
  };

  const handleRemoveConstraint = (id: string) => {
    updateRigidBodies({
      constraints: constraints.filter((c) => c.id !== id),
    });
  };

  const handleUpdateConstraint = (id: string, updates: Partial<ConstraintStudioItem>) => {
    updateRigidBodies({
      constraints: constraints.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    });
  };

  const shapeOptions: ColliderShapeType3D[] = ["box", "sphere", "capsule", "plane", "convex"];
  const constraintOptions: ConstraintType3D[] = [
    "fixed",
    "hinge",
    "slider",
    "cone-twist",
    "spring",
    "generic6dof",
  ];

  return (
    <div className="scene3d-editor-panel adv3d-panel" role="region" aria-label="Rigid Bodies & Constraints Editor">
      <div className="adv3d-panel-header">
        <h3 className="adv3d-section-title">📦 Rigid Bodies & Constraints</h3>
        <p className="adv3d-section-desc">
          Configure physical bodies, collider geometries, inertia tensors, surface friction,
          restitution, and motorized kinematic joints.
        </p>
      </div>

      {/* Body Selector Header */}
      <div className="adv3d-section-header-flex">
        <h4 className="adv3d-subsection-title">Rigid Bodies ({bodies.length})</h4>
        <button
          type="button"
          className="studio-btn studio-btn-sm studio-btn-primary"
          onClick={handleAddBody}
        >
          + Add Body
        </button>
      </div>

      {/* Bodies List Cards */}
      <div className="adv3d-items-stack">
        {bodies.map((body) => {
          const isSelected = body.id === selectedBodyId;
          return (
            <div
              key={body.id}
              className={`adv3d-card ${isSelected ? "adv3d-card-highlight" : ""}`}
              onClick={() => updateRigidBodies({ selectedBodyId: body.id })}
            >
              <div className="adv3d-card-header">
                <span className="adv3d-card-title">{body.name}</span>
                <span className="adv3d-badge adv3d-badge-accent">
                  {body.type.toUpperCase()}
                </span>
                {bodies.length > 1 && (
                  <button
                    type="button"
                    className="studio-btn studio-btn-sm studio-btn-danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveBody(body.id);
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Body Inspector */}
      {selectedBody && (
        <div className="adv3d-panel-section">
          <h4 className="adv3d-subsection-title">Selected Body: {selectedBody.name}</h4>

          <div className="adv3d-grid-two">
            <div className="studio-form-group">
              <label className="studio-label">Body Type</label>
              <select
                className="studio-select"
                value={selectedBody.type}
                onChange={(e) =>
                  handleUpdateBody(selectedBody.id, {
                    type: e.target.value as "dynamic" | "static" | "kinematic",
                  })
                }
              >
                <option value="dynamic">Dynamic</option>
                <option value="static">Static</option>
                <option value="kinematic">Kinematic</option>
              </select>
            </div>

            <div className="studio-form-group">
              <label className="studio-label">Collider Shape</label>
              <select
                className="studio-select"
                value={selectedBody.shape}
                onChange={(e) =>
                  handleUpdateBody(selectedBody.id, {
                    shape: e.target.value as ColliderShapeType3D,
                  })
                }
              >
                {shapeOptions.map((sh) => (
                  <option key={sh} value={sh}>
                    {sh.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="adv3d-grid-two">
            <div className="studio-form-group">
              <div className="studio-field-header">
                <label className="studio-label">Mass (kg)</label>
                <span className="studio-value-display">{selectedBody.mass}kg</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="50"
                step="0.5"
                value={selectedBody.mass}
                onChange={(e) => handleUpdateBody(selectedBody.id, { mass: Number(e.target.value) })}
                className="studio-slider"
              />
            </div>

            <div className="studio-form-group">
              <div className="studio-field-header">
                <label className="studio-label">Restitution (Bounciness)</label>
                <span className="studio-value-display">{selectedBody.restitution.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={selectedBody.restitution}
                onChange={(e) =>
                  handleUpdateBody(selectedBody.id, { restitution: Number(e.target.value) })
                }
                className="studio-slider"
              />
            </div>
          </div>

          <div className="adv3d-grid-two">
            <div className="studio-form-group">
              <div className="studio-field-header">
                <label className="studio-label">Surface Friction</label>
                <span className="studio-value-display">{selectedBody.friction.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={selectedBody.friction}
                onChange={(e) =>
                  handleUpdateBody(selectedBody.id, { friction: Number(e.target.value) })
                }
                className="studio-slider"
              />
            </div>

            <div className="studio-form-group">
              <label className="adv3d-checkbox-label">
                <input
                  type="checkbox"
                  checked={selectedBody.ccd}
                  onChange={(e) => handleUpdateBody(selectedBody.id, { ccd: e.target.checked })}
                  className="adv3d-checkbox"
                />
                Continuous Collision Detection (CCD)
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Constraints Section */}
      <div className="adv3d-panel-section">
        <div className="adv3d-section-header-flex">
          <h4 className="adv3d-subsection-title">Joint Constraints ({constraints.length})</h4>
          <button
            type="button"
            className="studio-btn studio-btn-sm studio-btn-primary"
            onClick={handleAddConstraint}
          >
            + Add Constraint
          </button>
        </div>

        <div className="adv3d-items-stack">
          {constraints.map((constraint) => (
            <div key={constraint.id} className="adv3d-card">
              <div className="adv3d-card-header">
                <label className="adv3d-checkbox-label">
                  <input
                    type="checkbox"
                    checked={constraint.enabled}
                    onChange={(e) =>
                      handleUpdateConstraint(constraint.id, { enabled: e.target.checked })
                    }
                    className="adv3d-checkbox"
                  />
                  <span className="adv3d-card-title">{constraint.name}</span>
                </label>
                <button
                  type="button"
                  className="studio-btn studio-btn-sm studio-btn-danger"
                  onClick={() => handleRemoveConstraint(constraint.id)}
                >
                  ✕
                </button>
              </div>

              <div className="adv3d-grid-two">
                <div className="studio-form-group">
                  <label className="studio-label">Joint Type</label>
                  <select
                    className="studio-select"
                    value={constraint.type}
                    onChange={(e) =>
                      handleUpdateConstraint(constraint.id, {
                        type: e.target.value as ConstraintType3D,
                      })
                    }
                  >
                    {constraintOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="studio-form-group">
                  <div className="studio-field-header">
                    <label className="studio-label">Break Threshold</label>
                    <span className="studio-value-display">{constraint.breakImpulse} Ns</span>
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="5000"
                    step="250"
                    value={constraint.breakImpulse}
                    onChange={(e) =>
                      handleUpdateConstraint(constraint.id, {
                        breakImpulse: Number(e.target.value),
                      })
                    }
                    className="studio-slider"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
