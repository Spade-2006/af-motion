import React, { useState, useMemo } from "react";
import type { UnifiedCompositionState } from "../../types/unified-playground.js";
import {
  aiSceneGenerationEngine,
  listAIScenePresets,
  getAIScenePreset,
  type AISceneGenerationInput,
  type GeneratedSceneResult,
  type SceneCategory,
  type SceneObjectDefinition,
} from "../../../src/core/scene-generation/index.js";
import type { MotionDNAPersonalityOption } from "../../../src/core/design-to-motion/types.js";
import { BUILT_IN_PALETTE_INPUTS } from "../../../src/core/built-in-palettes.js";

interface AISceneGeneratorPanelProps {
  state: UnifiedCompositionState;
  onChange: (updater: (prev: UnifiedCompositionState) => UnifiedCompositionState) => void;
}

const SCENE_CATEGORIES: Array<{ id: SceneCategory; label: string }> = [
  { id: "hero", label: "Hero Showcase" },
  { id: "product-showcase", label: "Product Showcase" },
  { id: "physics-playground", label: "Physics Playground" },
  { id: "particle-environment", label: "Particle Environment" },
  { id: "portfolio", label: "Spatial Portfolio" },
  { id: "cinematic-sequence", label: "Cinematic Sequence" },
  { id: "interactive-interface", label: "Interactive Interface" },
  { id: "scroll-storytelling", label: "Scroll Storytelling" },
  { id: "3d-world", label: "3D World & Terrain" },
];

const MOTION_DNA_OPTIONS: Array<{ id: MotionDNAPersonalityOption; label: string }> = [
  { id: "precise", label: "Precise (Engineering Damped)" },
  { id: "playful", label: "Playful (Bouncy Elastic)" },
  { id: "elegant", label: "Elegant (Stately Deceleration)" },
  { id: "energetic", label: "Energetic (High Velocity)" },
  { id: "editorial-flow", label: "Editorial Flow (Narrative Pacing)" },
];

export const AISceneGeneratorPanel: React.FC<AISceneGeneratorPanelProps> = ({
  state,
  onChange,
}) => {
  const presets = useMemo(() => listAIScenePresets(), []);
  const [selectedPresetId, setSelectedPresetId] = useState<string>("scene-preset-hero");
  const [promptText, setPromptText] = useState<string>(
    "Create a futuristic landing page hero with floating geometric objects and a glowing particle background."
  );
  const [category, setCategory] = useState<SceneCategory>("hero");
  const [selectedDNA, setSelectedDNA] = useState<MotionDNAPersonalityOption>("precise");
  const [selectedPaletteName, setSelectedPaletteName] = useState<string>(state.designBridge.paletteName);
  const [timingMultiplier, setTimingMultiplier] = useState<number>(1.0);
  const [reducedMotion, setReducedMotion] = useState<boolean>(state.designBridge.reducedMotion);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"plan" | "objects" | "quality" | "preview" | "export">("plan");
  const [exportFormat, setExportFormat] = useState<"react" | "vanilla" | "scene-json" | "comp-json">("react");
  const [copied, setCopied] = useState<boolean>(false);
  const [isPlayingPreview, setIsPlayingPreview] = useState<boolean>(true);
  const [previewSpeed, setPreviewSpeed] = useState<number>(1.0);

  // Initial generated scene
  const [result, setResult] = useState<GeneratedSceneResult>(() => {
    return aiSceneGenerationEngine.generateSync({
      naturalLanguage: "Create a futuristic landing page hero with floating geometric objects and a glowing particle background.",
      paletteName: state.designBridge.paletteName,
      motionDNA: "precise",
      timingMultiplier: 1.0,
      reducedMotion: state.designBridge.reducedMotion,
    });
  });

  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const p = getAIScenePreset(presetId);
    if (!p) return;
    const prompt = typeof p.defaultInput.naturalLanguage === "string"
      ? p.defaultInput.naturalLanguage
      : p.defaultInput.naturalLanguage?.prompt || "";
    setPromptText(prompt);
    setCategory(p.category);
    setSelectedDNA(p.defaultDNA);
    setSelectedPaletteName(p.defaultPalette);

    const generated = aiSceneGenerationEngine.generateSync(p.defaultInput);
    setResult(generated);
    setSelectedObjectId(generated.specification.objects[0]?.id || null);
  };

  const handleGenerate = () => {
    const input: AISceneGenerationInput = {
      naturalLanguage: {
        prompt: promptText,
        categoryHint: category,
        targetDNA: selectedDNA,
        targetPalette: selectedPaletteName,
      },
      paletteName: selectedPaletteName,
      motionDNA: selectedDNA,
      timingMultiplier,
      reducedMotion,
    };
    const generated = aiSceneGenerationEngine.generateSync(input);
    setResult(generated);
    setSelectedObjectId(generated.specification.objects[0]?.id || null);
  };

  const handleApplyToStage = () => {
    const matchedPalette = BUILT_IN_PALETTE_INPUTS.find(
      (p) => p.name.toLowerCase() === selectedPaletteName.toLowerCase()
    ) || BUILT_IN_PALETTE_INPUTS[0];

    onChange((prev) => ({
      ...prev,
      name: result.specification.name,
      description: result.plan.summary,
      systems: {
        ...prev.systems,
        animation: result.plan.systemParticipation.animation,
        background: result.plan.systemParticipation.background,
        scene3d: result.plan.systemParticipation.scene3d,
        physics: result.plan.systemParticipation.physics,
        interactions: result.plan.systemParticipation.interactions,
        simulations: result.plan.systemParticipation.simulations,
      },
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
          background: result.specification.environment.backgroundColor,
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
    else if (exportFormat === "scene-json") text = result.exportArtifacts.sceneJson;
    else if (exportFormat === "comp-json") text = result.exportArtifacts.compositionJson;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedObject: SceneObjectDefinition | undefined = result.specification.objects.find(
    (o) => o.id === selectedObjectId
  );

  return (
    <div
      className="ai-scene-generator-panel"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        color: "#F8FAFC",
        fontSize: "0.85rem",
      }}
    >
      {/* Header */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ margin: 0, fontSize: "1rem", color: "#A855F7", fontWeight: 700 }}>
            🌌 AI Scene Generator
          </h3>
          <span
            style={{
              padding: "2px 8px",
              borderRadius: "4px",
              fontSize: "0.72rem",
              background: "rgba(168, 85, 247, 0.15)",
              color: "#C084FC",
              fontWeight: 600,
            }}
          >
            Prompt 143 • Multi-System
          </span>
        </div>
        <p style={{ margin: "4px 0 0 0", color: "#94A3B8", fontSize: "0.78rem" }}>
          Transforms scene descriptions into complete animated scenes (DOM, 3D, physics, particles).
        </p>
      </div>

      {/* Preset Selector */}
      <div>
        <label style={{ display: "block", marginBottom: "4px", color: "#CBD5E1", fontWeight: 600, fontSize: "0.78rem" }}>
          Curated Scene Presets (10)
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
        <label style={{ display: "block", marginBottom: "4px", color: "#CBD5E1", fontWeight: 600, fontSize: "0.78rem" }}>
          Natural-Language Scene Description
        </label>
        <textarea
          rows={3}
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          placeholder="Describe your scene: objects, lighting, particles, camera, interactions..."
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

      {/* Selectors Grid: Category, Motion DNA, Palette */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <div>
          <label style={{ display: "block", marginBottom: "4px", color: "#94A3B8", fontSize: "0.75rem" }}>
            Scene Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as SceneCategory)}
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
            {SCENE_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "4px", color: "#94A3B8", fontSize: "0.75rem" }}>
            Motion DNA
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
      </div>

      {/* Palette & Controls */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "10px", alignItems: "center" }}>
        <div>
          <label style={{ display: "block", marginBottom: "4px", color: "#94A3B8", fontSize: "0.75rem" }}>
            Color Palette (33 Built-in)
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

        <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", color: "#94A3B8", cursor: "pointer", marginTop: "14px" }}>
          <input
            type="checkbox"
            checked={reducedMotion}
            onChange={(e) => setReducedMotion(e.target.checked)}
            style={{ accentColor: "#A855F7" }}
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
            background: "linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)",
            color: "#FFFFFF",
            fontWeight: 700,
            cursor: "pointer",
            fontSize: "0.82rem",
          }}
        >
          🌌 Generate Scene
        </button>

        <button
          type="button"
          onClick={handleApplyToStage}
          style={{
            padding: "8px 12px",
            borderRadius: "6px",
            border: "1px solid rgba(168, 85, 247, 0.4)",
            background: "rgba(168, 85, 247, 0.1)",
            color: "#C084FC",
            fontWeight: 600,
            cursor: "pointer",
            fontSize: "0.82rem",
          }}
        >
          Apply to Workspace ↗
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
        {(["plan", "objects", "quality", "preview", "export"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "6px 10px",
              background: "none",
              border: "none",
              borderBottom: activeTab === tab ? "2px solid #A855F7" : "2px solid transparent",
              color: activeTab === tab ? "#C084FC" : "#94A3B8",
              fontWeight: activeTab === tab ? 700 : 500,
              cursor: "pointer",
              fontSize: "0.78rem",
              textTransform: "capitalize",
            }}
          >
            {tab === "quality" ? `Quality (${result.validation.qualityGrade})` : tab}
          </button>
        ))}
      </div>

      {/* Tab 1: Scene Plan */}
      {activeTab === "plan" && (
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
              <span style={{ fontWeight: 700, color: "#C084FC" }}>{result.plan.name}</span>
              <span style={{ color: "#94A3B8", fontSize: "0.72rem" }}>
                {result.plan.durationMs}ms • {result.plan.objectCount} objects
              </span>
            </div>
            <p style={{ margin: 0, color: "#CBD5E1", fontSize: "0.76rem" }}>
              {result.plan.summary}
            </p>
          </div>

          <div>
            <div style={{ fontSize: "0.75rem", color: "#94A3B8", marginBottom: "6px", fontWeight: 600 }}>
              Multi-System Participation
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px" }}>
              {Object.entries(result.plan.systemParticipation).map(([sys, active]) => (
                <div
                  key={sys}
                  style={{
                    padding: "4px 8px",
                    borderRadius: "4px",
                    background: active ? "rgba(168, 85, 247, 0.15)" : "#0F172A",
                    color: active ? "#C084FC" : "#64748B",
                    fontSize: "0.72rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ textTransform: "capitalize" }}>{sys}</span>
                  <span>{active ? "✓" : "–"}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Scene Objects */}
      {activeTab === "objects" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "160px", overflowY: "auto" }}>
            {result.specification.objects.map((obj) => (
              <div
                key={obj.id}
                onClick={() => setSelectedObjectId(obj.id)}
                style={{
                  padding: "8px 10px",
                  borderRadius: "6px",
                  background: selectedObjectId === obj.id ? "rgba(168, 85, 247, 0.2)" : "#0F172A",
                  border: `1px solid ${selectedObjectId === obj.id ? "#A855F7" : "rgba(255, 255, 255, 0.05)"}`,
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.75rem",
                }}
              >
                <div>
                  <span style={{ fontWeight: 600, color: "#F8FAFC" }}>{obj.name}</span>
                  <span style={{ color: "#94A3B8", marginLeft: "6px", fontSize: "0.7rem" }}>
                    ({obj.type})
                  </span>
                </div>
                <span
                  style={{
                    padding: "1px 6px",
                    borderRadius: "3px",
                    background: "rgba(255, 255, 255, 0.08)",
                    fontSize: "0.68rem",
                    color: "#C084FC",
                  }}
                >
                  {obj.layer}
                </span>
              </div>
            ))}
          </div>

          {selectedObject && (
            <div
              style={{
                padding: "8px 10px",
                borderRadius: "6px",
                background: "#1E293B",
                fontSize: "0.74rem",
              }}
            >
              <div style={{ fontWeight: 700, color: "#C084FC", marginBottom: "4px" }}>
                Inspector: {selectedObject.name}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px", color: "#CBD5E1" }}>
                <div>Pos: [{selectedObject.transform.position.join(", ")}]</div>
                <div>Layer: {selectedObject.layer}</div>
                {selectedObject.visuals?.color && (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    Color: <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "2px", background: selectedObject.visuals.color }} />
                  </div>
                )}
                {selectedObject.physics && (
                  <div>Mass: {selectedObject.physics.mass} (Static: {selectedObject.physics.isStatic ? "Yes" : "No"})</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Quality Evaluation */}
      {activeTab === "quality" && (
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
              <div style={{ fontSize: "0.75rem", color: "#94A3B8" }}>Scene Quality Score</div>
              <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#C084FC" }}>
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
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "140px", overflowY: "auto" }}>
              {result.validation.findings.map((f) => (
                <div
                  key={f.id}
                  style={{
                    padding: "6px 8px",
                    borderRadius: "6px",
                    background: "#1E293B",
                    borderLeft: `3px solid ${
                      f.severity === "critical" ? "#EF4444" : f.severity === "warning" ? "#F59E0B" : "#C084FC"
                    }`,
                    fontSize: "0.74rem",
                  }}
                >
                  <div style={{ color: "#F1F5F9" }}>{f.message}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Live Preview Stage */}
      {activeTab === "preview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button
              type="button"
              onClick={() => setIsPlayingPreview(!isPlayingPreview)}
              style={{
                padding: "4px 10px",
                borderRadius: "4px",
                background: isPlayingPreview ? "#A855F7" : "#334155",
                color: "#FFFFFF",
                border: "none",
                fontSize: "0.75rem",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              {isPlayingPreview ? "⏸ Pause" : "▶ Play Scene"}
            </button>

            <div style={{ display: "flex", gap: "4px", fontSize: "0.72rem" }}>
              {[0.5, 1.0, 2.0].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setPreviewSpeed(s)}
                  style={{
                    padding: "2px 6px",
                    borderRadius: "4px",
                    background: previewSpeed === s ? "rgba(168, 85, 247, 0.25)" : "none",
                    color: previewSpeed === s ? "#C084FC" : "#64748B",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          <div
            style={{
              minHeight: "180px",
              padding: "16px",
              borderRadius: "8px",
              background: result.specification.environment.backgroundColor,
              border: "1px solid rgba(255, 255, 255, 0.08)",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              justifyContent: "center",
              alignItems: "center",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {result.specification.objects
              .filter((o) => o.type !== "particle-system")
              .map((obj, i) => (
                <div
                  key={obj.id}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "6px",
                    background: "rgba(168, 85, 247, 0.15)",
                    border: "1px solid rgba(168, 85, 247, 0.3)",
                    color: obj.visuals?.color || "#C084FC",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    transform: isPlayingPreview ? "scale(1)" : "scale(0.96)",
                    transition: `all ${(obj.animation?.entrance?.durationMs || 400) / previewSpeed}ms ease-out`,
                  }}
                >
                  {obj.name}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Tab 5: Multi-Format Code Export */}
      {activeTab === "export" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: "4px" }}>
              {(["react", "vanilla", "scene-json", "comp-json"] as const).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setExportFormat(fmt)}
                  style={{
                    padding: "3px 8px",
                    borderRadius: "4px",
                    background: exportFormat === fmt ? "rgba(168, 85, 247, 0.25)" : "none",
                    color: exportFormat === fmt ? "#C084FC" : "#94A3B8",
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
            {exportFormat === "scene-json" && result.exportArtifacts.sceneJson}
            {exportFormat === "comp-json" && result.exportArtifacts.compositionJson}
          </pre>
        </div>
      )}
    </div>
  );
};
