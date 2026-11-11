import React, { useState, useMemo } from "react";
import type { UnifiedCompositionState } from "../../types/unified-playground.js";
import {
  designToMotionEngine,
  listDesignToMotionPresets,
  getDesignToMotionPreset,
  type DesignToMotionInput,
  type GeneratedMotionResult,
  type MotionDNAPersonalityOption,
} from "../../../src/core/design-to-motion/index.js";
import { BUILT_IN_PALETTE_INPUTS } from "../../../src/core/built-in-palettes.js";

interface DesignToMotionPanelProps {
  state: UnifiedCompositionState;
  onChange: (updater: (prev: UnifiedCompositionState) => UnifiedCompositionState) => void;
}

const MOTION_DNA_OPTIONS: Array<{
  id: MotionDNAPersonalityOption;
  label: string;
  desc: string;
}> = [
  { id: "precise", label: "Precise", desc: "Crisp, engineering-grade damping and fast response times." },
  { id: "playful", label: "Playful", desc: "Bouncy spring overshoots, elastic momentum, and joyful feedback." },
  { id: "elegant", label: "Elegant", desc: "Long, stately deceleration curves with subtle ease." },
  { id: "energetic", label: "Energetic", desc: "High-velocity snappy transitions with sharp acceleration." },
  { id: "editorial-flow", label: "Editorial Flow", desc: "Smooth, sequential typographic and layout narrative pacing." },
];

export const DesignToMotionPanel: React.FC<DesignToMotionPanelProps> = ({
  state,
  onChange,
}) => {
  const presets = useMemo(() => listDesignToMotionPresets(), []);
  const [selectedPresetId, setSelectedPresetId] = useState<string>("dtm-preset-saas");
  const [promptText, setPromptText] = useState<string>(
    "Create a premium modal entrance with a subtle scale and fade."
  );
  const [selectedDNA, setSelectedDNA] = useState<MotionDNAPersonalityOption>("precise");
  const [selectedPaletteName, setSelectedPaletteName] = useState<string>(state.designBridge.paletteName);
  const [timingMultiplier, setTimingMultiplier] = useState<number>(1.0);
  const [reducedMotion, setReducedMotion] = useState<boolean>(state.designBridge.reducedMotion);
  const [activeInspectTab, setActiveInspectTab] = useState<"plan" | "quality" | "preview" | "export">("plan");
  const [exportFormat, setExportFormat] = useState<"react" | "vanilla" | "json" | "css">("react");
  const [copied, setCopied] = useState<boolean>(false);
  const [isPlayingPreview, setIsPlayingPreview] = useState<boolean>(true);
  const [previewSpeed, setPreviewSpeed] = useState<number>(1.0);
  const [previewMode, setPreviewMode] = useState<"after" | "before">("after");

  // Initial generated state
  const [result, setResult] = useState<GeneratedMotionResult>(() => {
    return designToMotionEngine.generateSync({
      naturalLanguage: "Create a premium modal entrance with a subtle scale and fade.",
      tokens: {
        paletteName: state.designBridge.paletteName,
        motionDNA: "precise",
        timingMultiplier: 1.0,
        reducedMotion: state.designBridge.reducedMotion,
      },
    });
  });

  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const p = getDesignToMotionPreset(presetId);
    if (!p) return;
    const prompt = typeof p.defaultInput.naturalLanguage === "string"
      ? p.defaultInput.naturalLanguage
      : p.defaultInput.naturalLanguage?.prompt || "";
    setPromptText(prompt);
    setSelectedDNA(p.defaultDNA);
    if (p.defaultInput.tokens?.paletteName) {
      setSelectedPaletteName(p.defaultInput.tokens.paletteName);
    }
    const generated = designToMotionEngine.generateSync(p.defaultInput);
    setResult(generated);
  };

  const handleGenerate = () => {
    const input: DesignToMotionInput = {
      naturalLanguage: promptText,
      tokens: {
        paletteName: selectedPaletteName,
        motionDNA: selectedDNA,
        timingMultiplier,
        reducedMotion,
      },
    };
    const generated = designToMotionEngine.generateSync(input);
    setResult(generated);
  };

  const handleApplyToPlayground = () => {
    const matchedPalette = BUILT_IN_PALETTE_INPUTS.find(
      (p) => p.name.toLowerCase() === selectedPaletteName.toLowerCase()
    ) || BUILT_IN_PALETTE_INPUTS[0];

    onChange((prev) => ({
      ...prev,
      name: `${result.plan.name}`,
      description: result.plan.summary,
      designBridge: {
        ...prev.designBridge,
        paletteName: matchedPalette.name,
        paletteId: matchedPalette.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        motionDNA: selectedDNA,
        timingMultiplier,
        reducedMotion,
        colors: {
          primary: matchedPalette.primary,
          secondary: matchedPalette.secondary,
          accent: matchedPalette.accent,
          background: "#0B0F19",
        },
      },
      playback: {
        ...prev.playback,
        durationMs: result.plan.durationMs,
        currentTimeMs: 0,
        progress: 0,
        isPlaying: true,
      },
    }));
  };

  const handleCopyCode = () => {
    let text = "";
    if (exportFormat === "react") text = result.exportArtifacts.reactCode;
    else if (exportFormat === "vanilla") text = result.exportArtifacts.vanillaCode;
    else if (exportFormat === "json") text = result.exportArtifacts.compositionJson;
    else if (exportFormat === "css") {
      text = Object.entries(result.exportArtifacts.cssVariables)
        .map(([k, v]) => `${k}: ${v};`)
        .join("\n");
    }
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="design-to-motion-panel"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        color: "#F8FAFC",
        fontSize: "0.85rem",
      }}
    >
      {/* Header */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ margin: 0, fontSize: "1rem", color: "#38BDF8", fontWeight: 700 }}>
            ✨ AI Design-to-Motion
          </h3>
          <span
            style={{
              padding: "2px 8px",
              borderRadius: "4px",
              fontSize: "0.72rem",
              background: "rgba(56, 189, 248, 0.15)",
              color: "#38BDF8",
              fontWeight: 600,
            }}
          >
            Prompt 142 • Deterministic
          </span>
        </div>
        <p style={{ margin: "4px 0 0 0", color: "#94A3B8", fontSize: "0.78rem" }}>
          Transform visual descriptions, structured specs, and design tokens into production-ready motion.
        </p>
      </div>

      {/* Preset Selector */}
      <div>
        <label style={{ display: "block", marginBottom: "6px", color: "#CBD5E1", fontWeight: 600, fontSize: "0.78rem" }}>
          Template Presets (10)
        </label>
        <select
          value={selectedPresetId}
          onChange={(e) => handleSelectPreset(e.target.value)}
          style={{
            width: "100%",
            padding: "8px 10px",
            borderRadius: "6px",
            background: "#1E293B",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            color: "#F8FAFC",
            fontSize: "0.82rem",
          }}
        >
          {presets.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.category})
            </option>
          ))}
        </select>
      </div>

      {/* Natural Language Prompt Input */}
      <div>
        <label style={{ display: "block", marginBottom: "6px", color: "#CBD5E1", fontWeight: 600, fontSize: "0.78rem" }}>
          Natural-Language Design Brief
        </label>
        <textarea
          rows={3}
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          placeholder="Describe your design intent, elements, and desired motion..."
          style={{
            width: "100%",
            padding: "8px 10px",
            borderRadius: "6px",
            background: "#0F172A",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            color: "#F8FAFC",
            fontSize: "0.82rem",
            resize: "vertical",
            boxSizing: "border-box",
            fontFamily: "inherit",
          }}
        />
      </div>

      {/* Design Tokens & DNA Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <div>
          <label style={{ display: "block", marginBottom: "4px", color: "#94A3B8", fontSize: "0.75rem" }}>
            Motion DNA Personality
          </label>
          <select
            value={selectedDNA}
            onChange={(e) => setSelectedDNA(e.target.value as MotionDNAPersonalityOption)}
            style={{
              width: "100%",
              padding: "6px 8px",
              borderRadius: "6px",
              background: "#1E293B",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "#F8FAFC",
              fontSize: "0.8rem",
            }}
          >
            {MOTION_DNA_OPTIONS.map((dna) => (
              <option key={dna.id} value={dna.id}>
                {dna.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "4px", color: "#94A3B8", fontSize: "0.75rem" }}>
            Palette (33 Built-in)
          </label>
          <select
            value={selectedPaletteName}
            onChange={(e) => setSelectedPaletteName(e.target.value)}
            style={{
              width: "100%",
              padding: "6px 8px",
              borderRadius: "6px",
              background: "#1E293B",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "#F8FAFC",
              fontSize: "0.8rem",
            }}
          >
            {BUILT_IN_PALETTE_INPUTS.map((pal) => (
              <option key={pal.name} value={pal.name}>
                {pal.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Timing Multiplier & Reduced Motion */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.74rem", color: "#94A3B8" }}>
            <span>Timing Multiplier</span>
            <span>{timingMultiplier.toFixed(2)}x</span>
          </div>
          <input
            type="range"
            min={0.5}
            max={2.0}
            step={0.05}
            value={timingMultiplier}
            onChange={(e) => setTimingMultiplier(parseFloat(e.target.value))}
            style={{ width: "100%", accentColor: "#38BDF8" }}
          />
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", color: "#94A3B8", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={reducedMotion}
            onChange={(e) => setReducedMotion(e.target.checked)}
            style={{ accentColor: "#38BDF8" }}
          />
          Reduced Motion
        </label>
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          type="button"
          onClick={handleGenerate}
          style={{
            flex: 1,
            padding: "8px 12px",
            borderRadius: "6px",
            border: "none",
            background: "linear-gradient(135deg, #0284C7 0%, #38BDF8 100%)",
            color: "#0F172A",
            fontWeight: 700,
            cursor: "pointer",
            fontSize: "0.82rem",
          }}
        >
          ⚡ Generate Motion
        </button>

        <button
          type="button"
          onClick={handleApplyToPlayground}
          style={{
            padding: "8px 12px",
            borderRadius: "6px",
            border: "1px solid rgba(56, 189, 248, 0.4)",
            background: "rgba(56, 189, 248, 0.1)",
            color: "#38BDF8",
            fontWeight: 600,
            cursor: "pointer",
            fontSize: "0.82rem",
          }}
        >
          Apply to Stage ↗
        </button>
      </div>

      {/* Inspection Sub-Tabs */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          gap: "4px",
          marginTop: "4px",
        }}
      >
        {(["plan", "quality", "preview", "export"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveInspectTab(tab)}
            style={{
              padding: "6px 12px",
              background: "none",
              border: "none",
              borderBottom: activeInspectTab === tab ? "2px solid #38BDF8" : "2px solid transparent",
              color: activeInspectTab === tab ? "#38BDF8" : "#94A3B8",
              fontWeight: activeInspectTab === tab ? 700 : 500,
              cursor: "pointer",
              fontSize: "0.78rem",
              textTransform: "capitalize",
            }}
          >
            {tab === "quality" ? `Quality (${result.validation.qualityGrade})` : tab}
          </button>
        ))}
      </div>

      {/* Sub-Tab 1: Motion Plan */}
      {activeInspectTab === "plan" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div
            style={{
              padding: "10px",
              borderRadius: "8px",
              background: "rgba(30, 41, 59, 0.6)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <span style={{ fontWeight: 700, color: "#38BDF8" }}>{result.plan.name}</span>
              <span style={{ color: "#94A3B8", fontSize: "0.72rem" }}>
                {result.plan.durationMs}ms • {result.plan.choreographyType}
              </span>
            </div>
            <p style={{ margin: 0, color: "#CBD5E1", fontSize: "0.76rem" }}>
              {result.plan.summary}
            </p>
          </div>

          <div>
            <div style={{ fontSize: "0.75rem", color: "#94A3B8", marginBottom: "4px", fontWeight: 600 }}>
              Matched Knowledge Base Patterns ({result.plan.matchedPatternIds.length})
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {result.plan.matchedPatternIds.map((pid) => (
                <span
                  key={pid}
                  style={{
                    padding: "3px 8px",
                    borderRadius: "4px",
                    background: "rgba(56, 189, 248, 0.12)",
                    color: "#38BDF8",
                    fontSize: "0.72rem",
                    fontFamily: "monospace",
                  }}
                >
                  {pid}
                </span>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: "0.75rem", color: "#94A3B8", marginBottom: "4px", fontWeight: 600 }}>
              Planned Elements ({result.plan.elementPlans.length})
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "160px", overflowY: "auto" }}>
              {result.plan.elementPlans.map((ep) => (
                <div
                  key={ep.elementId}
                  style={{
                    padding: "6px 8px",
                    borderRadius: "6px",
                    background: "#0F172A",
                    border: "1px solid rgba(255, 255, 255, 0.05)",
                    fontSize: "0.74rem",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ color: "#E2E8F0" }}>{ep.name || ep.elementId}</span>
                  <span style={{ color: "#38BDF8", fontFamily: "monospace" }}>
                    {ep.entrance ? `+${ep.entrance.delayMs}ms (${ep.entrance.durationMs}ms)` : "Static"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 2: Quality & Validation */}
      {activeInspectTab === "quality" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 14px",
              borderRadius: "8px",
              background: "rgba(15, 23, 42, 0.8)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <div>
              <div style={{ fontSize: "0.75rem", color: "#94A3B8" }}>Overall Quality Score</div>
              <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#38BDF8" }}>
                {result.validation.qualityScore}/100
              </div>
            </div>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.2rem",
                fontWeight: 900,
                background: result.validation.qualityGrade.startsWith("A")
                  ? "rgba(16, 185, 129, 0.2)"
                  : "rgba(245, 158, 11, 0.2)",
                color: result.validation.qualityGrade.startsWith("A") ? "#34D399" : "#FBBF24",
                border: `1px solid ${
                  result.validation.qualityGrade.startsWith("A") ? "#10B981" : "#F59E0B"
                }`,
              }}
            >
              {result.validation.qualityGrade}
            </div>
          </div>

          {result.validation.findings.length > 0 && (
            <div>
              <div style={{ fontSize: "0.75rem", color: "#94A3B8", marginBottom: "6px", fontWeight: 600 }}>
                Audit Findings ({result.validation.findings.length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "150px", overflowY: "auto" }}>
                {result.validation.findings.map((f) => (
                  <div
                    key={f.id}
                    style={{
                      padding: "6px 8px",
                      borderRadius: "6px",
                      background: "#1E293B",
                      borderLeft: `3px solid ${
                        f.severity === "critical" ? "#EF4444" : f.severity === "warning" ? "#F59E0B" : "#38BDF8"
                      }`,
                      fontSize: "0.74rem",
                    }}
                  >
                    <div style={{ color: "#F1F5F9" }}>{f.message}</div>
                    {f.explanation && (
                      <div style={{ color: "#38BDF8", fontSize: "0.7rem", marginTop: "2px" }}>
                        Why: {f.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sub-Tab 3: Interactive Preview */}
      {activeInspectTab === "preview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {/* Controls bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                type="button"
                onClick={() => setIsPlayingPreview(!isPlayingPreview)}
                style={{
                  padding: "4px 10px",
                  borderRadius: "4px",
                  background: isPlayingPreview ? "#38BDF8" : "#334155",
                  color: isPlayingPreview ? "#0F172A" : "#F8FAFC",
                  border: "none",
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  cursor: "pointer",
                }}
              >
                {isPlayingPreview ? "⏸ Pause" : "▶ Play"}
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode(previewMode === "after" ? "before" : "after")}
                style={{
                  padding: "4px 10px",
                  borderRadius: "4px",
                  background: "#1E293B",
                  color: "#94A3B8",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                }}
              >
                Mode: {previewMode === "after" ? "After (Motion)" : "Before (Static)"}
              </button>
            </div>

            <div style={{ display: "flex", gap: "4px", fontSize: "0.72rem" }}>
              {[0.5, 1.0, 2.0].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setPreviewSpeed(s)}
                  style={{
                    padding: "2px 6px",
                    borderRadius: "4px",
                    background: previewSpeed === s ? "rgba(56, 189, 248, 0.2)" : "none",
                    color: previewSpeed === s ? "#38BDF8" : "#64748B",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          {/* Mini Live Stage */}
          <div
            style={{
              minHeight: "180px",
              padding: "16px",
              borderRadius: "8px",
              background: "#080C14",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {result.plan.elementPlans.map((ep, i) => (
              <div
                key={ep.elementId}
                style={{
                  padding: "10px 16px",
                  borderRadius: "6px",
                  background: "rgba(56, 189, 248, 0.15)",
                  border: "1px solid rgba(56, 189, 248, 0.3)",
                  color: "#38BDF8",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  transform: previewMode === "before"
                    ? "translateY(0px) scale(1)"
                    : isPlayingPreview
                    ? "translateY(0px) scale(1)"
                    : "translateY(16px) scale(0.96)",
                  opacity: previewMode === "before" ? 1 : isPlayingPreview ? 1 : 0.4,
                  transition: previewMode === "after"
                    ? `all ${(ep.entrance?.durationMs || 350) / previewSpeed}ms ${ep.entrance?.easing || "ease-out"} ${
                        (ep.entrance?.delayMs || 0) / previewSpeed
                      }ms`
                    : "none",
                }}
              >
                {ep.name || ep.elementId}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub-Tab 4: Code Export */}
      {activeInspectTab === "export" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: "4px" }}>
              {(["react", "vanilla", "json", "css"] as const).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setExportFormat(fmt)}
                  style={{
                    padding: "3px 8px",
                    borderRadius: "4px",
                    background: exportFormat === fmt ? "rgba(56, 189, 248, 0.2)" : "none",
                    color: exportFormat === fmt ? "#38BDF8" : "#94A3B8",
                    border: "none",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                    textTransform: "uppercase",
                    fontWeight: 600,
                  }}
                >
                  {fmt}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleCopyCode}
              style={{
                padding: "4px 10px",
                borderRadius: "4px",
                background: copied ? "#10B981" : "#1E293B",
                color: "#F8FAFC",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                fontSize: "0.72rem",
                cursor: "pointer",
              }}
            >
              {copied ? "✓ Copied" : "Copy Code"}
            </button>
          </div>

          <pre
            style={{
              margin: 0,
              padding: "10px",
              borderRadius: "6px",
              background: "#0A0E18",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              color: "#CBD5E1",
              fontSize: "0.7rem",
              fontFamily: "monospace",
              maxHeight: "180px",
              overflowX: "auto",
              overflowY: "auto",
              whiteSpace: "pre-wrap",
            }}
          >
            {exportFormat === "react" && result.exportArtifacts.reactCode}
            {exportFormat === "vanilla" && result.exportArtifacts.vanillaCode}
            {exportFormat === "json" && result.exportArtifacts.compositionJson}
            {exportFormat === "css" &&
              Object.entries(result.exportArtifacts.cssVariables)
                .map(([k, v]) => `${k}: ${v};`)
                .join("\n")}
          </pre>
        </div>
      )}
    </div>
  );
};
