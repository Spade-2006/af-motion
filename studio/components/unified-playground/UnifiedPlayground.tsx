import React, { useState, useEffect, useRef } from "react";
import type { StudioTab } from "../../types/index.js";
import type {
  UnifiedCompositionState,
  UnifiedPlaygroundTab,
} from "../../types/unified-playground.js";
import { createDefaultUnifiedCompositionState } from "../../engine/unified-playground-engine.js";
import { UnifiedLiveStage } from "./UnifiedLiveStage.js";
import { UnifiedCompositionEditor } from "./UnifiedCompositionEditor.js";
import { UnifiedPresetHub } from "./UnifiedPresetHub.js";
import { UnifiedDesignBridge } from "./UnifiedDesignBridge.js";
import { UnifiedTelemetryPanel } from "./UnifiedTelemetryPanel.js";
import { AIMotionIntelligencePanel } from "./AIMotionIntelligencePanel.js";
import { DesignToMotionPanel } from "./DesignToMotionPanel.js";
import { AISceneGeneratorPanel } from "./AISceneGeneratorPanel.js";
import { AIAgentsPanel } from "./AIAgentsPanel.js";
import { UnifiedCodeExportModal } from "./UnifiedCodeExportModal.js";

interface UnifiedPlaygroundProps {
  onNavigateModule?: (tab: StudioTab) => void;
}

export const UnifiedPlayground: React.FC<UnifiedPlaygroundProps> = ({
  onNavigateModule,
}) => {
  const [activeTab, setActiveTab] = useState<UnifiedPlaygroundTab>("composition");
  const [state, setState] = useState<UnifiedCompositionState>(createDefaultUnifiedCompositionState);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Animation timeline loop
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!state.playback.isPlaying || state.designBridge.reducedMotion) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    let lastTime = performance.now();

    const loop = (now: number) => {
      const deltaMs = (now - lastTime) * state.playback.speed;
      lastTime = now;

      setState((prev) => {
        if (!prev.playback.isPlaying) return prev;

        let nextTime = prev.playback.currentTimeMs + deltaMs;
        let nextProgress = nextTime / prev.playback.durationMs;

        if (nextProgress >= 1.0) {
          if (prev.playback.loop) {
            nextTime = 0;
            nextProgress = 0;
          } else {
            nextTime = prev.playback.durationMs;
            nextProgress = 1.0;
            return {
              ...prev,
              playback: { ...prev.playback, currentTimeMs: nextTime, progress: 1.0, isPlaying: false },
            };
          }
        }

        return {
          ...prev,
          playback: {
            ...prev.playback,
            currentTimeMs: nextTime,
            progress: Math.min(1, Math.max(0, nextProgress)),
          },
        };
      });

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [state.playback.isPlaying, state.playback.speed, state.playback.durationMs, state.designBridge.reducedMotion]);

  // Timeline Handlers
  const handleTogglePlay = () => {
    setState((prev) => ({
      ...prev,
      playback: { ...prev.playback, isPlaying: !prev.playback.isPlaying },
    }));
  };

  const handleRestart = () => {
    setState((prev) => ({
      ...prev,
      playback: { ...prev.playback, currentTimeMs: 0, progress: 0, isPlaying: true },
    }));
  };

  const handleScrub = (progress: number) => {
    setState((prev) => ({
      ...prev,
      playback: {
        ...prev.playback,
        progress,
        currentTimeMs: progress * prev.playback.durationMs,
      },
    }));
  };

  const handleSpeedSelect = (speed: number) => {
    setState((prev) => ({
      ...prev,
      playback: { ...prev.playback, speed },
    }));
  };

  return (
    <div
      className="unified-playground-container"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        backgroundColor: "#0B0F19",
        color: "#F8FAFC",
        overflow: "hidden",
      }}
    >
      {/* 1. Sub-Navigation Bar */}
      <nav
        className="unified-playground-nav"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "8px 16px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          backgroundColor: "rgba(15, 23, 42, 0.8)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div style={{ display: "flex", gap: "6px" }}>
          <button
            type="button"
            className={`unified-tab-btn ${activeTab === "composition" ? "active" : ""}`}
            onClick={() => setActiveTab("composition")}
            style={{
              padding: "6px 14px",
              borderRadius: "6px",
              border: activeTab === "composition" ? "1px solid #38BDF8" : "1px solid transparent",
              background: activeTab === "composition" ? "rgba(56, 189, 248, 0.15)" : "transparent",
              color: activeTab === "composition" ? "#38BDF8" : "#94A3B8",
              fontSize: "0.82rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            🎛️ Composition
          </button>
          <button
            type="button"
            className={`unified-tab-btn ${activeTab === "presets" ? "active" : ""}`}
            onClick={() => setActiveTab("presets")}
            style={{
              padding: "6px 14px",
              borderRadius: "6px",
              border: activeTab === "presets" ? "1px solid #38BDF8" : "1px solid transparent",
              background: activeTab === "presets" ? "rgba(56, 189, 248, 0.15)" : "transparent",
              color: activeTab === "presets" ? "#38BDF8" : "#94A3B8",
              fontSize: "0.82rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            📚 Preset Hub
          </button>
          <button
            type="button"
            className={`unified-tab-btn ${activeTab === "design-bridge" ? "active" : ""}`}
            onClick={() => setActiveTab("design-bridge")}
            style={{
              padding: "6px 14px",
              borderRadius: "6px",
              border: activeTab === "design-bridge" ? "1px solid #38BDF8" : "1px solid transparent",
              background: activeTab === "design-bridge" ? "rgba(56, 189, 248, 0.15)" : "transparent",
              color: activeTab === "design-bridge" ? "#38BDF8" : "#94A3B8",
              fontSize: "0.82rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            🎨 Design & DNA Bridge
          </button>
          <button
            type="button"
            className={`unified-tab-btn ${activeTab === "telemetry" ? "active" : ""}`}
            onClick={() => setActiveTab("telemetry")}
            style={{
              padding: "6px 14px",
              borderRadius: "6px",
              border: activeTab === "telemetry" ? "1px solid #38BDF8" : "1px solid transparent",
              background: activeTab === "telemetry" ? "rgba(56, 189, 248, 0.15)" : "transparent",
              color: activeTab === "telemetry" ? "#38BDF8" : "#94A3B8",
              fontSize: "0.82rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            📊 Telemetry
          </button>
          <button
            type="button"
            className={`unified-tab-btn ${activeTab === "intelligence" ? "active" : ""}`}
            onClick={() => setActiveTab("intelligence")}
            style={{
              padding: "6px 14px",
              borderRadius: "6px",
              border: activeTab === "intelligence" ? "1px solid #A855F7" : "1px solid transparent",
              background: activeTab === "intelligence" ? "rgba(168, 85, 247, 0.15)" : "transparent",
              color: activeTab === "intelligence" ? "#C084FC" : "#94A3B8",
              fontSize: "0.82rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            🧠 AI Intelligence
          </button>
          <button
            type="button"
            className={`unified-tab-btn ${activeTab === "design-to-motion" ? "active" : ""}`}
            onClick={() => setActiveTab("design-to-motion")}
            style={{
              padding: "6px 14px",
              borderRadius: "6px",
              border: activeTab === "design-to-motion" ? "1px solid #F43F5E" : "1px solid transparent",
              background: activeTab === "design-to-motion" ? "rgba(244, 63, 94, 0.15)" : "transparent",
              color: activeTab === "design-to-motion" ? "#FB7185" : "#94A3B8",
              fontSize: "0.82rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            ? Design-to-Motion
          </button>
          <button
            type="button"
            className={`unified-tab-btn ${activeTab === "scene-generator" ? "active" : ""}`}
            onClick={() => setActiveTab("scene-generator")}
            style={{
              padding: "6px 14px",
              borderRadius: "6px",
              border: activeTab === "scene-generator" ? "1px solid #06B6D4" : "1px solid transparent",
              background: activeTab === "scene-generator" ? "rgba(6, 182, 212, 0.15)" : "transparent",
              color: activeTab === "scene-generator" ? "#22D3EE" : "#94A3B8",
              fontSize: "0.82rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            ?? Scene Gen
          </button>
          <button
            type="button"
            className={`unified-tab-btn ${activeTab === "ai-agents" ? "active" : ""}`}
            onClick={() => setActiveTab("ai-agents")}
            style={{
              padding: "6px 14px",
              borderRadius: "6px",
              border: activeTab === "ai-agents" ? "1px solid #10B981" : "1px solid transparent",
              background: activeTab === "ai-agents" ? "rgba(16, 185, 129, 0.15)" : "transparent",
              color: activeTab === "ai-agents" ? "#34D399" : "#94A3B8",
              fontSize: "0.82rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            ?? AI Agents
          </button>
        </div>

        <button
          type="button"
          className="btn-export-unified"
          onClick={() => setIsExportOpen(true)}
          style={{
            padding: "6px 16px",
            borderRadius: "6px",
            border: "none",
            background: "#38BDF8",
            color: "#0F172A",
            fontWeight: 700,
            fontSize: "0.82rem",
            cursor: "pointer",
            boxShadow: "0 0 12px rgba(56, 189, 248, 0.3)",
          }}
        >
          Export Code ↗
        </button>
      </nav>

      {/* 2. Main Workspace Layout */}
      <div
        className="unified-workspace-body"
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(340px, 460px) 1fr",
          flex: 1,
          overflow: "hidden",
        }}
      >
        {/* Left Editor Panel */}
        <aside
          className="unified-sidebar-panel"
          style={{
            padding: "16px",
            borderRight: "1px solid rgba(255, 255, 255, 0.08)",
            overflowY: "auto",
            backgroundColor: "rgba(10, 14, 23, 0.6)",
          }}
        >
          {activeTab === "composition" && (
            <UnifiedCompositionEditor state={state} onChange={setState} />
          )}
          {activeTab === "presets" && (
            <UnifiedPresetHub
              state={state}
              onChange={setState}
              onNavigateModule={onNavigateModule}
            />
          )}
          {activeTab === "design-bridge" && (
            <UnifiedDesignBridge state={state} onChange={setState} />
          )}
          {activeTab === "telemetry" && (
            <UnifiedTelemetryPanel state={state} />
          )}
          {activeTab === "intelligence" && (
            <AIMotionIntelligencePanel state={state} onChange={setState} />
          )}
          {activeTab === "design-to-motion" && (
            <DesignToMotionPanel state={state} onChange={setState} />
          )}
          {activeTab === "scene-generator" && (
            <AISceneGeneratorPanel state={state} onChange={setState} />
          )}
          {activeTab === "ai-agents" && (
            <AIAgentsPanel state={state} onChange={setState} />
          )}
        </aside>

        {/* Right Stage & Timeline Controller */}
        <section
          className="unified-stage-column"
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "16px",
            gap: "12px",
            overflow: "hidden",
          }}
        >
          <div style={{ flex: 1, minHeight: "360px", overflow: "hidden" }}>
            <UnifiedLiveStage state={state} />
          </div>

          {/* Timeline Playback Bar */}
          <div
            className="unified-timeline-bar"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "10px 16px",
              borderRadius: "8px",
              background: "rgba(15, 23, 42, 0.7)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <button
              type="button"
              className="btn-play-pause"
              onClick={handleTogglePlay}
              style={{
                background: "none",
                border: "none",
                fontSize: "1.1rem",
                cursor: "pointer",
                color: "#38BDF8",
              }}
              title={state.playback.isPlaying ? "Pause" : "Play"}
            >
              {state.playback.isPlaying ? "⏸️" : "▶️"}
            </button>
            <button
              type="button"
              className="btn-restart"
              onClick={handleRestart}
              style={{
                background: "none",
                border: "none",
                fontSize: "1rem",
                cursor: "pointer",
                color: "#94A3B8",
              }}
              title="Restart"
            >
              🔄
            </button>

            {/* Scrub Slider */}
            <input
              type="range"
              min={0}
              max={1}
              step={0.005}
              value={state.playback.progress}
              onChange={(e) => handleScrub(parseFloat(e.target.value))}
              style={{ flex: 1, cursor: "pointer" }}
              title={`Progress: ${Math.round(state.playback.progress * 100)}%`}
            />

            <span style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "#94A3B8", minWidth: "60px" }}>
              {Math.round(state.playback.currentTimeMs)}ms
            </span>

            {/* Speed Options */}
            <div style={{ display: "flex", gap: "2px" }}>
              {[0.25, 0.5, 1.0, 2.0].map((spd) => (
                <button
                  key={spd}
                  type="button"
                  onClick={() => handleSpeedSelect(spd)}
                  style={{
                    padding: "2px 6px",
                    borderRadius: "4px",
                    border: state.playback.speed === spd ? "1px solid #38BDF8" : "none",
                    background: state.playback.speed === spd ? "rgba(56, 189, 248, 0.2)" : "transparent",
                    color: state.playback.speed === spd ? "#38BDF8" : "#64748B",
                    fontSize: "0.7rem",
                    cursor: "pointer",
                  }}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* 3. Export Modal */}
      <UnifiedCodeExportModal
        state={state}
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />
    </div>
  );
};
