import React from "react";
import type {
  MotionPhysicsStudioState,
  PhysicsPlaygroundConstraint,
} from "../../types/motion-physics.js";

interface CollisionConstraintEditorProps {
  state: MotionPhysicsStudioState;
  onUpdateState: (updater: (prev: MotionPhysicsStudioState) => MotionPhysicsStudioState) => void;
}

export const CollisionConstraintEditor: React.FC<CollisionConstraintEditorProps> = ({
  state,
  onUpdateState,
}) => {
  const { constraints, bodies, visualOptions, selectedConstraintId } = state;

  const handleToggleConstraint = (id: string) => {
    onUpdateState((prev) => ({
      ...prev,
      constraints: prev.constraints.map((c) =>
        c.id === id ? { ...c, enabled: !c.enabled } : c
      ),
    }));
  };

  const handleUpdateConstraint = (
    id: string,
    patch: Partial<PhysicsPlaygroundConstraint>
  ) => {
    onUpdateState((prev) => ({
      ...prev,
      constraints: prev.constraints.map((c) =>
        c.id === id ? { ...c, ...patch } : c
      ),
    }));
  };

  const handleAddConstraint = () => {
    if (bodies.length < 2) return;
    const id = `constraint-${Date.now().toString().slice(-4)}`;
    const newConstraint: PhysicsPlaygroundConstraint = {
      id,
      name: `Constraint ${constraints.length + 1}`,
      type: "distance",
      bodyAId: bodies[0].id,
      bodyBId: bodies[1].id,
      enabled: true,
      length: 120,
      stiffness: 0.8,
      damping: 0.1,
    };
    onUpdateState((prev) => ({
      ...prev,
      constraints: [...prev.constraints, newConstraint],
      selectedConstraintId: id,
    }));
  };

  const handleDeleteConstraint = (id: string) => {
    onUpdateState((prev) => ({
      ...prev,
      constraints: prev.constraints.filter((c) => c.id !== id),
      selectedConstraintId: null,
    }));
  };

  const selectedConstraint = constraints.find((c) => c.id === selectedConstraintId);

  return (
    <div className="mp-constraints-layout">
      {/* Left List: Active Constraints */}
      <section className="mp-spring-controls-card">
        <div className="mp-panel-header">
          <h3 className="mp-panel-title">Geometric Constraints</h3>
          <button type="button" className="mp-btn-action" onClick={handleAddConstraint}>
            ➕ Add Constraint
          </button>
        </div>

        <div className="mp-constraints-list">
          {constraints.map((c) => (
            <div
              key={c.id}
              className={`mp-constraint-item ${selectedConstraintId === c.id ? "selected" : ""}`}
              onClick={() =>
                onUpdateState((prev) => ({ ...prev, selectedConstraintId: c.id }))
              }
            >
              <div className="mp-constraint-item-main">
                <input
                  type="checkbox"
                  checked={c.enabled}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleToggleConstraint(c.id);
                  }}
                />
                <span className="mp-constraint-name">{c.name}</span>
                <span className="mp-constraint-type-badge">{c.type.toUpperCase()}</span>
              </div>
              <button
                type="button"
                className="mp-btn-icon-danger"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteConstraint(c.id);
                }}
              >
                ✕
              </button>
            </div>
          ))}

          {constraints.length === 0 && (
            <p className="mp-empty-hint">No constraints configured. Add one above.</p>
          )}
        </div>

        {/* Overlay visualization toggles */}
        <div className="mp-visual-toggles">
          <h4 className="mp-sub-heading">Collision Inspection Overlays</h4>
          <label className="mp-toggle-label">
            <input
              type="checkbox"
              checked={visualOptions.showCollisionNormals}
              onChange={(e) =>
                onUpdateState((prev) => ({
                  ...prev,
                  visualOptions: { ...prev.visualOptions, showCollisionNormals: e.target.checked },
                }))
              }
            />
            Show Collision Normals & Contacts
          </label>
          <label className="mp-toggle-label">
            <input
              type="checkbox"
              checked={visualOptions.showConstraintLines}
              onChange={(e) =>
                onUpdateState((prev) => ({
                  ...prev,
                  visualOptions: { ...prev.visualOptions, showConstraintLines: e.target.checked },
                }))
              }
            />
            Show Constraint Wireframes
          </label>
        </div>
      </section>

      {/* Right Column: Constraint Inspector */}
      <section className="mp-spring-preview-card">
        <h4 className="mp-graph-title">Constraint Parameters</h4>

        {selectedConstraint ? (
          <div className="mp-inspector-form">
            <div className="mp-form-row">
              <label>Name</label>
              <input
                type="text"
                className="mp-input-text"
                value={selectedConstraint.name}
                onChange={(e) =>
                  handleUpdateConstraint(selectedConstraint.id, { name: e.target.value })
                }
              />
            </div>

            <div className="mp-form-row">
              <label>Constraint Type</label>
              <select
                className="mp-select"
                value={selectedConstraint.type}
                onChange={(e) =>
                  handleUpdateConstraint(selectedConstraint.id, {
                    type: e.target.value as PhysicsPlaygroundConstraint["type"],
                  })
                }
              >
                <option value="distance">Distance Constraint</option>
                <option value="spring">Spring Constraint</option>
                <option value="fixed">Fixed Constraint</option>
                <option value="axis">Axis Constraint</option>
                <option value="min-max-distance">Min-Max Distance Limit</option>
                <option value="boundary">Boundary Constraint</option>
              </select>
            </div>

            <div className="mp-form-row">
              <label>Body A</label>
              <select
                className="mp-select"
                value={selectedConstraint.bodyAId}
                onChange={(e) =>
                  handleUpdateConstraint(selectedConstraint.id, { bodyAId: e.target.value })
                }
              >
                {bodies.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mp-form-row">
              <label>Body B</label>
              <select
                className="mp-select"
                value={selectedConstraint.bodyBId ?? ""}
                onChange={(e) =>
                  handleUpdateConstraint(selectedConstraint.id, { bodyBId: e.target.value })
                }
              >
                {bodies.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {(selectedConstraint.type === "distance" ||
              selectedConstraint.type === "spring" ||
              selectedConstraint.type === "min-max-distance") && (
              <div className="mp-form-row">
                <label>Rest Length: {selectedConstraint.length ?? 100} px</label>
                <input
                  type="range"
                  min="20"
                  max="300"
                  step="5"
                  value={selectedConstraint.length ?? 100}
                  onChange={(e) =>
                    handleUpdateConstraint(selectedConstraint.id, {
                      length: parseFloat(e.target.value),
                    })
                  }
                />
              </div>
            )}

            {selectedConstraint.type === "spring" && (
              <>
                <div className="mp-form-row">
                  <label>Stiffness: {(selectedConstraint.stiffness ?? 0.8).toFixed(2)}</label>
                  <input
                    type="range"
                    min="0.05"
                    max="1.0"
                    step="0.05"
                    value={selectedConstraint.stiffness ?? 0.8}
                    onChange={(e) =>
                      handleUpdateConstraint(selectedConstraint.id, {
                        stiffness: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="mp-form-row">
                  <label>Damping: {(selectedConstraint.damping ?? 0.1).toFixed(2)}</label>
                  <input
                    type="range"
                    min="0.0"
                    max="0.5"
                    step="0.02"
                    value={selectedConstraint.damping ?? 0.1}
                    onChange={(e) =>
                      handleUpdateConstraint(selectedConstraint.id, {
                        damping: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
              </>
            )}

            {selectedConstraint.type === "axis" && (
              <div className="mp-form-row">
                <label>Locked Axis</label>
                <select
                  className="mp-select"
                  value={selectedConstraint.axis ?? "x"}
                  onChange={(e) =>
                    handleUpdateConstraint(selectedConstraint.id, {
                      axis: e.target.value as "x" | "y",
                    })
                  }
                >
                  <option value="x">Horizontal (X)</option>
                  <option value="y">Vertical (Y)</option>
                </select>
              </div>
            )}
          </div>
        ) : (
          <div className="mp-empty-inspector">
            <p>Select a constraint from the list to modify its limits, stiffness, and anchors.</p>
          </div>
        )}
      </section>
    </div>
  );
};
