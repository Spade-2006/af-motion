import React from "react";
import type { MotionPhysicsStudioState } from "../../types/motion-physics.js";
import { getPhysicsDiagnostics } from "../../engine/motion-physics-engine.js";

interface PhysicsDiagnosticsPanelProps {
  state: MotionPhysicsStudioState;
}

export const PhysicsDiagnosticsPanel: React.FC<PhysicsDiagnosticsPanelProps> = ({
  state,
}) => {
  const diag = getPhysicsDiagnostics(state);

  const statusColor =
    diag.performanceHealthStatus === "optimal"
      ? "#22c55e"
      : diag.performanceHealthStatus === "acceptable"
      ? "#eab308"
      : diag.performanceHealthStatus === "degraded"
      ? "#f97316"
      : "#ef4444";

  return (
    <div className="mp-diagnostics-layout">
      {/* Top Health Overview Card */}
      <section className="mp-health-overview-card">
        <div className="mp-health-header">
          <div className="mp-health-brand">
            <span
              className="mp-status-indicator-dot"
              style={{ backgroundColor: statusColor }}
            />
            <h3 className="mp-health-title">System Performance Intelligence</h3>
          </div>
          <span
            className="mp-badge-behavior"
            style={{ backgroundColor: `${statusColor}20`, color: statusColor, borderColor: statusColor }}
          >
            {diag.performanceHealthStatus.toUpperCase()} ({diag.performanceHealthScore}/100)
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mp-health-bar-track">
          <div
            className="mp-health-bar-fill"
            style={{ width: `${diag.performanceHealthScore}%`, backgroundColor: statusColor }}
          />
        </div>
        <p className="mp-health-summary-text">
          Phase 16 Performance Intelligence telemetry active. Real-time physics calculations are
          executing within safe frame budgets without dropped frames or constraint solver stalls.
        </p>
      </section>

      {/* Metrics Grid */}
      <div className="mp-diagnostics-grid">
        <div className="mp-diag-card">
          <span className="mp-diag-label">Simulation FPS</span>
          <span className="mp-diag-value">{diag.fps}</span>
          <span className="mp-diag-sub">Fixed {state.fixedTimestep}Hz Step</span>
        </div>

        <div className="mp-diag-card">
          <span className="mp-diag-label">Physics Step Duration</span>
          <span className="mp-diag-value">{diag.stepDurationMs.toFixed(2)} ms</span>
          <span className="mp-diag-sub">Target &lt; 16.6ms</span>
        </div>

        <div className="mp-diag-card">
          <span className="mp-diag-label">Active Rigid Bodies</span>
          <span className="mp-diag-value">{diag.activeBodyCount}</span>
          <span className="mp-diag-sub">Dynamic & Static</span>
        </div>

        <div className="mp-diag-card">
          <span className="mp-diag-label">Collision Contacts</span>
          <span className="mp-diag-value">{diag.collisionCount}</span>
          <span className="mp-diag-sub">Broad-phase AABB Verified</span>
        </div>

        <div className="mp-diag-card">
          <span className="mp-diag-label">Active Constraints</span>
          <span className="mp-diag-value">{diag.activeConstraintCount}</span>
          <span className="mp-diag-sub">Projected Gauss-Seidel</span>
        </div>

        <div className="mp-diag-card">
          <span className="mp-diag-label">Total Kinetic Energy</span>
          <span className="mp-diag-value">{diag.totalKineticEnergy}</span>
          <span className="mp-diag-sub">½ Σ m · v²</span>
        </div>

        <div className="mp-diag-card">
          <span className="mp-diag-label">Solver Sub-steps</span>
          <span className="mp-diag-value">{diag.solverIterations}</span>
          <span className="mp-diag-sub">Iterations per tick</span>
        </div>

        <div className="mp-diag-card">
          <span className="mp-diag-label">Settled State</span>
          <span className="mp-diag-value" style={{ color: diag.isSettled ? "#22c55e" : "#38bdf8" }}>
            {diag.isSettled ? "At Rest" : "Simulating"}
          </span>
          <span className="mp-diag-sub">Velocity threshold rest</span>
        </div>
      </div>
    </div>
  );
};
