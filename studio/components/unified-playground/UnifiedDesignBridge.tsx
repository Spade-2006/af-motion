import React from "react";
import type { UnifiedCompositionState } from "../../types/unified-playground.js";
import { BUILT_IN_PALETTE_INPUTS } from "../../../src/core/built-in-palettes.js";

interface UnifiedDesignBridgeProps {
  state: UnifiedCompositionState;
  onChange: (updater: (prev: UnifiedCompositionState) => UnifiedCompositionState) => void;
}

const MOTION_DNA_OPTIONS: Array<{
  id: "precise" | "playful" | "elegant" | "energetic" | "editorial-flow";
  label: string;
  desc: string;
}> = [
  { id: "precise", label: "Precise", desc: "Crisp, engineering-grade damping and fast response times." },
  { id: "playful", label: "Playful", desc: "Bouncy spring overshoots, elastic momentum, and joyful feedback." },
  { id: "elegant", label: "Elegant", desc: "Long, stately deceleration curves with subtle ease." },
  { id: "energetic", label: "Energetic", desc: "High-velocity snappy transitions with sharp acceleration." },
  { id: "editorial-flow", label: "Editorial Flow", desc: "Smooth, sequential typographic and layout narrative pacing." },
];

export const UnifiedDesignBridge: React.FC<UnifiedDesignBridgeProps> = ({
  state,
  onChange,
}) => {
  const currentPaletteName = state.designBridge.paletteName;

  const handlePaletteSelect = (palette: (typeof BUILT_IN_PALETTE_INPUTS)[number]) => {
    onChange((prev) => ({
      ...prev,
      designBridge: {
        ...prev.designBridge,
        paletteName: palette.name,
        paletteId: palette.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        colors: {
          primary: palette.primary,
          secondary: palette.secondary,
          accent: palette.accent,
          background: "#0B0F19",
        },
      },
    }));
  };

  const handleDnaChange = (dna: UnifiedCompositionState["designBridge"]["motionDNA"]) => {
    onChange((prev) => ({
      ...prev,
      designBridge: {
        ...prev.designBridge,
        motionDNA: dna,
      },
    }));
  };

  const handleTimingChange = (multiplier: number) => {
    onChange((prev) => ({
      ...prev,
      designBridge: {
        ...prev.designBridge,
        timingMultiplier: multiplier,
      },
    }));
  };

  const handleReducedMotionToggle = () => {
    onChange((prev) => ({
      ...prev,
      designBridge: {
        ...prev.designBridge,
        reducedMotion: !prev.designBridge.reducedMotion,
      },
    }));
  };

  return (
    <div className="unified-design-bridge" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* 1. Motion DNA Profile Selector */}
      <section className="unified-panel-section">
        <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#94A3B8" }}>
          Motion DNA Profile
        </h4>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "6px" }}>
          {MOTION_DNA_OPTIONS.map((dna) => {
            const isSelected = state.designBridge.motionDNA === dna.id;
            return (
              <button
                key={dna.id}
                type="button"
                className={`unified-dna-btn ${isSelected ? "active" : ""}`}
                onClick={() => handleDnaChange(dna.id)}
                style={{
                  padding: "8px 10px",
                  borderRadius: "6px",
                  border: isSelected ? "1px solid #38BDF8" : "1px solid rgba(255, 255, 255, 0.08)",
                  background: isSelected ? "rgba(56, 189, 248, 0.15)" : "rgba(255, 255, 255, 0.02)",
                  color: isSelected ? "#F8FAFC" : "#94A3B8",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ fontWeight: 600, fontSize: "0.82rem", color: isSelected ? "#38BDF8" : "#E2E8F0" }}>
                  {dna.label}
                </div>
                <div style={{ fontSize: "0.68rem", opacity: 0.7, marginTop: "2px", lineHeight: 1.3 }}>
                  {dna.desc}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. Global Timing & Accessibility */}
      <section className="unified-panel-section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
          <h4 style={{ margin: 0, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#94A3B8" }}>
            Global Timing Multiplier: <strong style={{ color: "#38BDF8" }}>{state.designBridge.timingMultiplier}x</strong>
          </h4>
          <button
            type="button"
            className="btn-reduced-motion-bridge"
            onClick={handleReducedMotionToggle}
            style={{
              padding: "4px 8px",
              borderRadius: "4px",
              border: state.designBridge.reducedMotion ? "1px solid #F59E0B" : "1px solid rgba(255, 255, 255, 0.1)",
              background: state.designBridge.reducedMotion ? "rgba(245, 158, 11, 0.15)" : "rgba(255, 255, 255, 0.04)",
              color: state.designBridge.reducedMotion ? "#F59E0B" : "#94A3B8",
              fontSize: "0.72rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {state.designBridge.reducedMotion ? "⚠️ Reduced Motion: ON" : "🏃 Motion: Normal"}
          </button>
        </div>

        <input
          type="range"
          min={0.25}
          max={3.0}
          step={0.05}
          value={state.designBridge.timingMultiplier}
          onChange={(e) => handleTimingChange(parseFloat(e.target.value))}
          style={{ width: "100%", cursor: "pointer" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "#64748B", marginTop: "2px" }}>
          <span>0.25x (High Cadence)</span>
          <span>1.0x (Standard)</span>
          <span>3.0x (Slow Motion)</span>
        </div>
      </section>

      {/* 3. 33 Built-in Palettes Gallery */}
      <section className="unified-panel-section">
        <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#94A3B8" }}>
          33 Built-in Color Palettes (Active: {currentPaletteName})
        </h4>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: "8px",
            maxHeight: "260px",
            overflowY: "auto",
            paddingRight: "4px",
          }}
        >
          {BUILT_IN_PALETTE_INPUTS.map((pal) => {
            const isSelected = pal.name === currentPaletteName;
            return (
              <button
                key={pal.name}
                type="button"
                className={`unified-palette-card ${isSelected ? "active" : ""}`}
                onClick={() => handlePaletteSelect(pal)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  padding: "8px",
                  borderRadius: "6px",
                  border: isSelected ? "1px solid #38BDF8" : "1px solid rgba(255, 255, 255, 0.08)",
                  background: isSelected ? "rgba(56, 189, 248, 0.12)" : "rgba(255, 255, 255, 0.02)",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div style={{ display: "flex", height: "14px", borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{ flex: 1, backgroundColor: pal.primary }} title={`Primary: ${pal.primary}`} />
                  <div style={{ flex: 1, backgroundColor: pal.secondary }} title={`Secondary: ${pal.secondary}`} />
                  <div style={{ flex: 1, backgroundColor: pal.accent }} title={`Accent: ${pal.accent}`} />
                </div>
                <span style={{ fontSize: "0.75rem", fontWeight: isSelected ? 600 : 400, color: isSelected ? "#38BDF8" : "#E2E8F0" }}>
                  {pal.name}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. Active Design Token Bridge Preview */}
      <section className="unified-panel-section">
        <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#94A3B8" }}>
          Synced Design Tokens
        </h4>
        <div
          style={{
            padding: "8px 12px",
            background: "rgba(0, 0, 0, 0.3)",
            borderRadius: "6px",
            fontFamily: "monospace",
            fontSize: "0.72rem",
            color: "#94A3B8",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "4px",
          }}
        >
          <div>--af-primary: <span style={{ color: state.designBridge.colors.primary }}>{state.designBridge.colors.primary}</span></div>
          <div>--af-secondary: <span style={{ color: state.designBridge.colors.secondary }}>{state.designBridge.colors.secondary}</span></div>
          <div>--af-accent: <span style={{ color: state.designBridge.colors.accent }}>{state.designBridge.colors.accent}</span></div>
          <div>--af-timing: <span style={{ color: "#38BDF8" }}>{state.designBridge.timingMultiplier}</span></div>
        </div>
      </section>
    </div>
  );
};
