import React from "react";
import type { UnifiedCompositionState } from "../../types/unified-playground.js";
import { getUnifiedTelemetry } from "../../engine/unified-playground-engine.js";

interface UnifiedTelemetryPanelProps {
  state: UnifiedCompositionState;
}

export const UnifiedTelemetryPanel: React.FC<UnifiedTelemetryPanelProps> = ({
  state,
}) => {
  const telemetry = getUnifiedTelemetry(state);

  return (
    <div className="unified-telemetry-panel" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* 1. Health & Quality Banner */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          borderRadius: "8px",
          background: "rgba(56, 189, 248, 0.08)",
          border: "1px solid rgba(56, 189, 248, 0.2)",
        }}
      >
        <div>
          <span style={{ fontSize: "0.72rem", color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Performance Intelligence Status
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "2px" }}>
            <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#38BDF8" }}>
              Health Score: {telemetry.healthScore}/100
            </span>
            <span
              style={{
                fontSize: "0.7rem",
                padding: "2px 6px",
                borderRadius: "4px",
                background: "rgba(16, 185, 129, 0.2)",
                color: "#10B981",
                fontWeight: 600,
                textTransform: "uppercase",
              }}
            >
              Optimal Tier: {telemetry.adaptiveQuality}
            </span>
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <span style={{ fontSize: "0.7rem", color: "#64748B" }}>Backend</span>
          <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#F8FAFC" }}>
            {telemetry.gpuBackend} <span style={{ fontSize: "0.65rem", color: "#10B981" }}>[Detected]</span>
          </div>
        </div>
      </div>

      {/* 2. Core Telemetry Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
        <div style={{ padding: "10px", borderRadius: "6px", background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
          <span style={{ fontSize: "0.7rem", color: "#64748B" }}>FPS [Measured]</span>
          <div style={{ fontSize: "1.3rem", fontWeight: 700, color: telemetry.fps >= 55 ? "#10B981" : "#F59E0B", marginTop: "2px" }}>
            {telemetry.fps}
          </div>
        </div>

        <div style={{ padding: "10px", borderRadius: "6px", background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
          <span style={{ fontSize: "0.7rem", color: "#64748B" }}>Frame Time [Measured]</span>
          <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "#38BDF8", marginTop: "2px" }}>
            {telemetry.frameTimeMs} <span style={{ fontSize: "0.8rem", fontWeight: 400 }}>ms</span>
          </div>
        </div>

        <div style={{ padding: "10px", borderRadius: "6px", background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
          <span style={{ fontSize: "0.7rem", color: "#64748B" }}>Est. VRAM [Estimated]</span>
          <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "#F8FAFC", marginTop: "2px" }}>
            ~{telemetry.vramEstimateMB} <span style={{ fontSize: "0.8rem", fontWeight: 400 }}>MB</span>
          </div>
        </div>
      </div>

      {/* 3. Subsystem Entity Breakdown */}
      <section className="unified-panel-section">
        <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#94A3B8" }}>
          Active Multi-System Workload Breakdown
        </h4>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px", borderRadius: "6px", background: "rgba(255, 255, 255, 0.02)", fontSize: "0.8rem" }}>
            <span style={{ color: "#94A3B8" }}>Active Animations:</span>
            <strong style={{ color: "#F8FAFC" }}>{telemetry.activeAnimations}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px", borderRadius: "6px", background: "rgba(255, 255, 255, 0.02)", fontSize: "0.8rem" }}>
            <span style={{ color: "#94A3B8" }}>Active Simulations:</span>
            <strong style={{ color: "#F8FAFC" }}>{telemetry.activeSimulations}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px", borderRadius: "6px", background: "rgba(255, 255, 255, 0.02)", fontSize: "0.8rem" }}>
            <span style={{ color: "#94A3B8" }}>Physics Bodies:</span>
            <strong style={{ color: "#F8FAFC" }}>{telemetry.physicsBodies}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px", borderRadius: "6px", background: "rgba(255, 255, 255, 0.02)", fontSize: "0.8rem" }}>
            <span style={{ color: "#94A3B8" }}>Particle Count:</span>
            <strong style={{ color: "#F8FAFC" }}>{telemetry.particleCount.toLocaleString()}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px", borderRadius: "6px", background: "rgba(255, 255, 255, 0.02)", fontSize: "0.8rem", gridColumn: "1 / -1" }}>
            <span style={{ color: "#94A3B8" }}>3D Scene Triangles:</span>
            <strong style={{ color: "#F8FAFC" }}>{telemetry.triangles3D.toLocaleString()}</strong>
          </div>
        </div>
      </section>

      {/* 4. Bottleneck Diagnosis */}
      {telemetry.bottleneck && (
        <div
          style={{
            padding: "10px 12px",
            borderRadius: "6px",
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.25)",
            color: "#F87171",
            fontSize: "0.8rem",
          }}
        >
          ⚠️ <strong>Bottleneck Warning:</strong> {telemetry.bottleneck}
        </div>
      )}
    </div>
  );
};
