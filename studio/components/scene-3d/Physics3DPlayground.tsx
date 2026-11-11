import React from "react";
import type { Advanced3DStudioState } from "../../types/advanced-3d.js";

interface Physics3DPlaygroundProps {
  state: Advanced3DStudioState;
  onChange: (updater: (prev: Advanced3DStudioState) => Advanced3DStudioState) => void;
}

export const Physics3DPlayground: React.FC<Physics3DPlaygroundProps> = ({
  state,
  onChange,
}) => {
  const { physics } = state;

  const updatePhysics = (updates: Partial<typeof physics>) => {
    onChange((prev) => ({
      ...prev,
      physics: {
        ...prev.physics,
        ...updates,
      },
    }));
  };

  const handleFireRaycast = () => {
    // Perform simulated raycast against ground and rigid bodies
    updatePhysics({
      raycastHit: {
        bodyId: "body-cube-1",
        distance: 1.5,
        point: [0, 3.5, 0],
        normal: [0, 1, 0],
      },
    });
  };

  return (
    <div className="scene3d-editor-panel adv3d-panel" role="region" aria-label="3D Physics Playground">
      <div className="adv3d-panel-header">
        <h3 className="adv3d-section-title">⚛️ 3D Physics World</h3>
        <p className="adv3d-section-desc">
          Configure real-time 3D rigid body dynamics, collision manifolds, broadphase spatial
          partitioning, gravity, and raycast queries.
        </p>
      </div>

      {/* Simulation Playback Actions */}
      <div className="adv3d-actions-row">
        <button
          type="button"
          className={`studio-btn studio-btn-sm ${
            physics.simulating ? "studio-btn-primary" : "studio-btn-outline"
          }`}
          onClick={() => updatePhysics({ simulating: !physics.simulating })}
        >
          {physics.simulating ? "⏸ Pause Physics" : "▶ Simulate"}
        </button>
        <button
          type="button"
          className="studio-btn studio-btn-sm studio-btn-outline"
          onClick={() =>
            updatePhysics({
              lastStepDurationMs: 1.2,
              contactsCount: Math.floor(Math.random() * 5) + 2,
            })
          }
        >
          ⏯ Step Frame
        </button>
        <button
          type="button"
          className="studio-btn studio-btn-sm studio-btn-outline"
          onClick={() =>
            updatePhysics({
              contactsCount: 0,
              raycastHit: null,
            })
          }
        >
          ↺ Reset World
        </button>
      </div>

      {/* World Telemetry Card */}
      <div className="adv3d-card adv3d-card-highlight">
        <div className="adv3d-card-header">
          <span className="adv3d-card-label">Active Physics World</span>
          <span className="adv3d-badge adv3d-badge-accent">
            {physics.broadphaseType.toUpperCase()} Broadphase
          </span>
        </div>
        <div className="adv3d-specs-grid">
          <div className="adv3d-spec-row">
            <span>Rigid Bodies</span>
            <strong>{physics.activeRigidBodiesCount}</strong>
          </div>
          <div className="adv3d-spec-row">
            <span>Active Colliders</span>
            <strong>{physics.activeCollidersCount}</strong>
          </div>
          <div className="adv3d-spec-row">
            <span>Active Contacts</span>
            <strong>{physics.contactsCount} points</strong>
          </div>
          <div className="adv3d-spec-row">
            <span>Step Duration</span>
            <strong>{physics.lastStepDurationMs.toFixed(2)} ms</strong>
          </div>
        </div>
      </div>

      {/* Gravity Vector */}
      <div className="studio-form-group">
        <label className="studio-label">Gravity Vector (m/s²)</label>
        <div className="adv3d-vector-row">
          <label className="adv3d-vec-input">
            <span>X:</span>
            <input
              type="number"
              value={physics.gravity[0]}
              step="0.5"
              onChange={(e) =>
                updatePhysics({
                  gravity: [Number(e.target.value), physics.gravity[1], physics.gravity[2]],
                })
              }
              className="studio-input"
            />
          </label>
          <label className="adv3d-vec-input">
            <span>Y:</span>
            <input
              type="number"
              value={physics.gravity[1]}
              step="0.5"
              onChange={(e) =>
                updatePhysics({
                  gravity: [physics.gravity[0], Number(e.target.value), physics.gravity[2]],
                })
              }
              className="studio-input"
            />
          </label>
          <label className="adv3d-vec-input">
            <span>Z:</span>
            <input
              type="number"
              value={physics.gravity[2]}
              step="0.5"
              onChange={(e) =>
                updatePhysics({
                  gravity: [physics.gravity[0], physics.gravity[1], Number(e.target.value)],
                })
              }
              className="studio-input"
            />
          </label>
        </div>
      </div>

      {/* Timestep & Substeps */}
      <div className="adv3d-grid-two">
        <div className="studio-form-group">
          <label className="studio-label">Fixed Timestep</label>
          <select
            className="studio-select"
            value={physics.fixedDeltaTime.toFixed(4)}
            onChange={(e) => updatePhysics({ fixedDeltaTime: Number(e.target.value) })}
          >
            <option value="0.0167">60 Hz (16.6 ms)</option>
            <option value="0.0083">120 Hz (8.3 ms)</option>
            <option value="0.0333">30 Hz (33.3 ms)</option>
          </select>
        </div>

        <div className="studio-form-group">
          <div className="studio-field-header">
            <label className="studio-label">Sub-steps</label>
            <span className="studio-value-display">{physics.maxSubSteps}</span>
          </div>
          <input
            type="range"
            min="1"
            max="8"
            step="1"
            value={physics.maxSubSteps}
            onChange={(e) => updatePhysics({ maxSubSteps: Number(e.target.value) })}
            className="studio-slider"
          />
        </div>
      </div>

      {/* Solver Iterations */}
      <div className="adv3d-grid-two">
        <div className="studio-form-group">
          <div className="studio-field-header">
            <label className="studio-label">Velocity Iterations</label>
            <span className="studio-value-display">{physics.velocityIterations}</span>
          </div>
          <input
            type="range"
            min="2"
            max="16"
            step="1"
            value={physics.velocityIterations}
            onChange={(e) => updatePhysics({ velocityIterations: Number(e.target.value) })}
            className="studio-slider"
          />
        </div>

        <div className="studio-form-group">
          <div className="studio-field-header">
            <label className="studio-label">Position Iterations</label>
            <span className="studio-value-display">{physics.positionIterations}</span>
          </div>
          <input
            type="range"
            min="1"
            max="8"
            step="1"
            value={physics.positionIterations}
            onChange={(e) => updatePhysics({ positionIterations: Number(e.target.value) })}
            className="studio-slider"
          />
        </div>
      </div>

      {/* Sleeping & Broadphase */}
      <div className="studio-form-group">
        <label className="adv3d-checkbox-label">
          <input
            type="checkbox"
            checked={physics.enableSleeping}
            onChange={(e) => updatePhysics({ enableSleeping: e.target.checked })}
            className="adv3d-checkbox"
          />
          Enable Automatic Sleep Optimization for Inactive Bodies
        </label>
      </div>

      {/* Spatial Raycast Inspector */}
      <div className="adv3d-panel-section">
        <div className="adv3d-section-header-flex">
          <h4 className="adv3d-subsection-title">Spatial Raycast Tester</h4>
          <button
            type="button"
            className="studio-btn studio-btn-sm studio-btn-primary"
            onClick={handleFireRaycast}
          >
            🎯 Fire Raycast
          </button>
        </div>

        {physics.raycastHit && (
          <div className="adv3d-card">
            <div className="adv3d-card-header">
              <span className="adv3d-card-title">Hit: {physics.raycastHit.bodyId}</span>
              <span className="adv3d-badge adv3d-badge-success">
                Dist: {physics.raycastHit.distance.toFixed(2)}m
              </span>
            </div>
            <div className="adv3d-spec-row">
              <span>Contact Point</span>
              <code>[{physics.raycastHit.point.join(", ")}]</code>
            </div>
            <div className="adv3d-spec-row">
              <span>Contact Normal</span>
              <code>[{physics.raycastHit.normal.join(", ")}]</code>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
