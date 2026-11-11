import React from "react";
import type {
  UnifiedCompositionLayer,
  UnifiedCompositionState,
  UnifiedSubsystemId,
} from "../../types/unified-playground.js";

interface UnifiedCompositionEditorProps {
  state: UnifiedCompositionState;
  onChange: (updater: (prev: UnifiedCompositionState) => UnifiedCompositionState) => void;
}

const SUBSYSTEM_DEFINITIONS: Array<{ id: UnifiedSubsystemId; label: string; icon: string }> = [
  { id: "animation", label: "Animation", icon: "🎬" },
  { id: "background", label: "Background", icon: "🎨" },
  { id: "styles", label: "Visual Styles", icon: "🎭" },
  { id: "designSystem", label: "Design System & DNA", icon: "📐" },
  { id: "choreography", label: "Choreography", icon: "🎼" },
  { id: "scene3d", label: "3D Scene & Worlds", icon: "🧊" },
  { id: "physics", label: "Motion Physics", icon: "⚛️" },
  { id: "interactions", label: "Interactions & Gestures", icon: "👆" },
  { id: "advancedMotion", label: "Advanced Motion & Morph", icon: "🚀" },
  { id: "simulations", label: "GPU Simulations", icon: "✨" },
];

export const UnifiedCompositionEditor: React.FC<UnifiedCompositionEditorProps> = ({
  state,
  onChange,
}) => {
  const toggleSystem = (sysId: UnifiedSubsystemId) => {
    onChange((prev) => ({
      ...prev,
      systems: {
        ...prev.systems,
        [sysId]: !prev.systems[sysId],
      },
    }));
  };

  const toggleLayer = (layerId: string) => {
    onChange((prev) => ({
      ...prev,
      layers: prev.layers.map((l) => (l.id === layerId ? { ...l, enabled: !l.enabled } : l)),
    }));
  };

  const updateLayerOpacity = (layerId: string, opacity: number) => {
    onChange((prev) => ({
      ...prev,
      layers: prev.layers.map((l) => (l.id === layerId ? { ...l, opacity } : l)),
    }));
  };

  const toggleCoupling = (key: keyof UnifiedCompositionState["crossCoupling"]) => {
    onChange((prev) => ({
      ...prev,
      crossCoupling: {
        ...prev.crossCoupling,
        [key]: !prev.crossCoupling[key],
      },
    }));
  };

  return (
    <div className="unified-composition-editor" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* 1. Participating Subsystems Grid */}
      <section className="unified-panel-section">
        <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#94A3B8" }}>
          Participating Motion Subsystems ({Object.values(state.systems).filter(Boolean).length}/10)
        </h4>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "6px" }}>
          {SUBSYSTEM_DEFINITIONS.map((sys) => {
            const active = state.systems[sys.id];
            return (
              <button
                key={sys.id}
                type="button"
                className={`unified-sys-btn ${active ? "active" : ""}`}
                onClick={() => toggleSystem(sys.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 10px",
                  borderRadius: "6px",
                  border: active ? "1px solid #38BDF8" : "1px solid rgba(255, 255, 255, 0.1)",
                  background: active ? "rgba(56, 189, 248, 0.15)" : "rgba(255, 255, 255, 0.03)",
                  color: active ? "#F8FAFC" : "#94A3B8",
                  cursor: "pointer",
                  fontSize: "0.78rem",
                  fontWeight: active ? 600 : 400,
                  transition: "all 0.15s ease",
                  textAlign: "left",
                }}
              >
                <span>{sys.icon}</span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sys.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. Composition Layer Stack */}
      <section className="unified-panel-section">
        <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#94A3B8" }}>
          Multi-System Layer Stack
        </h4>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {state.layers.map((layer) => (
            <div
              key={layer.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 12px",
                borderRadius: "6px",
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                fontSize: "0.8rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input
                  type="checkbox"
                  checked={layer.enabled}
                  onChange={() => toggleLayer(layer.id)}
                  id={`layer-${layer.id}`}
                  style={{ cursor: "pointer" }}
                />
                <label htmlFor={`layer-${layer.id}`} style={{ cursor: "pointer", fontWeight: 500, color: layer.enabled ? "#F8FAFC" : "#64748B" }}>
                  {layer.name}
                </label>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "0.7rem", color: "#64748B" }}>z: {layer.zIndex}</span>
                <span style={{ fontSize: "0.7rem", color: "#94A3B8" }}>{layer.blendMode}</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={layer.opacity}
                  onChange={(e) => updateLayerOpacity(layer.id, parseFloat(e.target.value))}
                  style={{ width: "60px", cursor: "pointer" }}
                  title={`Opacity: ${Math.round(layer.opacity * 100)}%`}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Cross-System Physical & Interactive Coupling */}
      <section className="unified-panel-section">
        <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#94A3B8" }}>
          Cross-System Physical & Event Coupling
        </h4>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px",
              borderRadius: "6px",
              background: state.crossCoupling.magneticCursorCoupling ? "rgba(56, 189, 248, 0.1)" : "rgba(255, 255, 255, 0.02)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              cursor: "pointer",
              fontSize: "0.78rem",
            }}
          >
            <input
              type="checkbox"
              checked={state.crossCoupling.magneticCursorCoupling}
              onChange={() => toggleCoupling("magneticCursorCoupling")}
            />
            <span>Pointer Magnetic Coupling</span>
          </label>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px",
              borderRadius: "6px",
              background: state.crossCoupling.physicsCollisionTriggers ? "rgba(56, 189, 248, 0.1)" : "rgba(255, 255, 255, 0.02)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              cursor: "pointer",
              fontSize: "0.78rem",
            }}
          >
            <input
              type="checkbox"
              checked={state.crossCoupling.physicsCollisionTriggers}
              onChange={() => toggleCoupling("physicsCollisionTriggers")}
            />
            <span>Collision Particle Bursts</span>
          </label>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px",
              borderRadius: "6px",
              background: state.crossCoupling.scrollWorldCoupling ? "rgba(56, 189, 248, 0.1)" : "rgba(255, 255, 255, 0.02)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              cursor: "pointer",
              fontSize: "0.78rem",
            }}
          >
            <input
              type="checkbox"
              checked={state.crossCoupling.scrollWorldCoupling}
              onChange={() => toggleCoupling("scrollWorldCoupling")}
            />
            <span>Scroll Drives 3D Terrain</span>
          </label>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px",
              borderRadius: "6px",
              background: state.crossCoupling.fluidInteractionCoupling ? "rgba(56, 189, 248, 0.1)" : "rgba(255, 255, 255, 0.02)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              cursor: "pointer",
              fontSize: "0.78rem",
            }}
          >
            <input
              type="checkbox"
              checked={state.crossCoupling.fluidInteractionCoupling}
              onChange={() => toggleCoupling("fluidInteractionCoupling")}
            />
            <span>Fluid Drag Dynamics</span>
          </label>
        </div>
      </section>

      {/* 4. Composition DAG Summary */}
      <section className="unified-panel-section">
        <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#94A3B8" }}>
          Composition Dependency Graph (DAG)
        </h4>
        <div
          style={{
            padding: "10px",
            background: "rgba(0, 0, 0, 0.3)",
            borderRadius: "6px",
            fontFamily: "monospace",
            fontSize: "0.75rem",
            color: "#38BDF8",
            border: "1px solid rgba(255, 255, 255, 0.06)",
          }}
        >
          root-scene (v1.0.0)
          {state.layers
            .filter((l) => l.enabled && state.systems[l.subsystem])
            .map((l) => (
              <div key={l.id} style={{ marginLeft: "14px", color: "#CBD5E1" }}>
                └── {l.id} [{l.subsystem}] (z: {l.zIndex}, {l.blendMode})
              </div>
            ))}
        </div>
      </section>
    </div>
  );
};
