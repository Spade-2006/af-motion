import React, { useState, useEffect, useRef, useMemo } from "react";
import type {
  ChoreographyStudioViewMode,
  ChoreographyTrackConfig,
  ChoreographyTimelineState,
  MultiSystemActiveSettings,
  ChoreographyTemplate,
} from "../../types/choreography.js";
import {
  listBuiltInChoreographyTemplates,
  getChoreographyTemplateById,
  createDefaultTimelineState,
  getDefaultMultiSystemSettings,
  computeTrackOffsetsFromDependencies,
  evaluateChoreographyIntelligence,
} from "../../engine/choreography-builder-engine.js";
import { ChoreographyTimelineEditor } from "./ChoreographyTimelineEditor.js";
import { ChoreographyPlaybackController } from "./ChoreographyPlaybackController.js";
import { ChoreographySystemManager } from "./ChoreographySystemManager.js";
import { ChoreographyLivePreview } from "./ChoreographyLivePreview.js";
import { ChoreographyIntelligencePanel } from "./ChoreographyIntelligencePanel.js";
import { ChoreographyTemplateSelector } from "./ChoreographyTemplateSelector.js";
import { ChoreographyCodeExport } from "./ChoreographyCodeExport.js";

export const ChoreographyStudio: React.FC = () => {
  const [templates, setTemplates] = useState<ChoreographyTemplate[]>(() =>
    listBuiltInChoreographyTemplates()
  );

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    templates[0].id
  );

  const activeTemplate = useMemo(
    () => templates.find((t) => t.id === selectedTemplateId) ?? templates[0],
    [templates, selectedTemplateId]
  );

  // Active view tab
  const [viewMode, setViewMode] = useState<ChoreographyStudioViewMode>("timeline");

  // Multi-System settings
  const [systems, setSystems] = useState<MultiSystemActiveSettings>(() =>
    getDefaultMultiSystemSettings()
  );

  // Tracks
  const [tracks, setTracks] = useState<ChoreographyTrackConfig[]>(() => [
    ...activeTemplate.tracks,
  ]);

  // Reduced motion
  const [reducedMotion, setReducedMotion] = useState(false);

  // Timeline State
  const [timeline, setTimeline] = useState<ChoreographyTimelineState>(() =>
    createDefaultTimelineState(activeTemplate.totalDurationMs)
  );

  const lastFrameTimeRef = useRef<number>(performance.now());
  const rafIdRef = useRef<number | null>(null);

  // Sync timeline duration when template or tracks change
  useEffect(() => {
    setTimeline((prev) => ({
      ...prev,
      totalDurationMs: activeTemplate.totalDurationMs,
    }));
  }, [activeTemplate.totalDurationMs]);

  // Playback animation loop
  useEffect(() => {
    if (!timeline.isPlaying || reducedMotion) {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      return;
    }

    let lastTime = performance.now();

    const loop = (now: number) => {
      const deltaMs = (now - lastTime) * timeline.playbackRate;
      lastTime = now;

      setTimeline((prev) => {
        if (!prev.isPlaying) return prev;

        const dir = prev.isReversed ? -1 : 1;
        let nextTime = prev.currentTimeMs + deltaMs * dir;

        if (nextTime >= prev.totalDurationMs) {
          if (prev.isLooping) {
            nextTime = 0;
          } else {
            return {
              ...prev,
              currentTimeMs: prev.totalDurationMs,
              isPlaying: false,
            };
          }
        } else if (nextTime <= 0) {
          if (prev.isLooping) {
            nextTime = prev.totalDurationMs;
          } else {
            return {
              ...prev,
              currentTimeMs: 0,
              isPlaying: false,
            };
          }
        }

        return {
          ...prev,
          currentTimeMs: nextTime,
        };
      });

      rafIdRef.current = requestAnimationFrame(loop);
    };

    rafIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [
    timeline.isPlaying,
    timeline.isReversed,
    timeline.isLooping,
    timeline.playbackRate,
    timeline.totalDurationMs,
    reducedMotion,
  ]);

  // Template Actions
  const handleSelectTemplate = (id: string) => {
    setSelectedTemplateId(id);
    const tpl = templates.find((t) => t.id === id);
    if (tpl) {
      setTracks([...tpl.tracks]);
      setTimeline((prev) => ({
        ...prev,
        currentTimeMs: 0,
        totalDurationMs: tpl.totalDurationMs,
      }));
    }
  };

  const handleDuplicateTemplate = () => {
    const copyId = `${activeTemplate.id}-copy-${Date.now().toString().slice(-4)}`;
    const copy: ChoreographyTemplate = {
      ...activeTemplate,
      id: copyId,
      name: `${activeTemplate.name} (Copy)`,
      isCustom: true,
      tracks: [...tracks],
    };
    setTemplates((prev) => [...prev, copy]);
    setSelectedTemplateId(copyId);
  };

  const handleResetTemplate = () => {
    const factory = getChoreographyTemplateById(activeTemplate.id);
    setTracks([...factory.tracks]);
    setTimeline((prev) => ({
      ...prev,
      currentTimeMs: 0,
      totalDurationMs: factory.totalDurationMs,
    }));
  };

  // Track Actions
  const handleUpdateTrack = (updated: ChoreographyTrackConfig) => {
    setTracks((prev) =>
      computeTrackOffsetsFromDependencies(
        prev.map((t) => (t.id === updated.id ? updated : t))
      )
    );
  };

  const handleRemoveTrack = (id: string) => {
    setTracks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleToggleTrack = (id: string) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t))
    );
  };

  const handleAddTrack = () => {
    const newTrack: ChoreographyTrackConfig = {
      id: `track-${Date.now().toString().slice(-4)}`,
      name: `Track ${tracks.length + 1}`,
      system: "dom",
      targetName: `element-${tracks.length + 1}`,
      enabled: true,
      startMs: Math.min(200 * tracks.length, timeline.totalDurationMs - 300),
      durationMs: 400,
      easing: "ease-out",
      color: "#f59e0b",
      properties: { opacity: [0, 1], y: [20, 0] },
    };
    setTracks((prev) => [...prev, newTrack]);
  };

  // System Actions
  const handleToggleSystem = (key: keyof MultiSystemActiveSettings) => {
    setSystems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Playback Handlers
  const handleScrub = (timeMs: number) => {
    setTimeline((prev) => ({ ...prev, currentTimeMs: timeMs }));
  };

  const handleTogglePlay = () => {
    setTimeline((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const handleRestart = () => {
    setTimeline((prev) => ({ ...prev, currentTimeMs: 0, isPlaying: true }));
  };

  const handleToggleReverse = () => {
    setTimeline((prev) => ({ ...prev, isReversed: !prev.isReversed }));
  };

  const handleToggleLoop = () => {
    setTimeline((prev) => ({ ...prev, isLooping: !prev.isLooping }));
  };

  const handleChangeSpeed = (rate: number) => {
    setTimeline((prev) => ({ ...prev, playbackRate: rate }));
  };

  const handleChangeZoom = (zoom: number) => {
    setTimeline((prev) => ({ ...prev, zoom }));
  };

  // Intelligence Report
  const intelligenceReport = useMemo(
    () =>
      evaluateChoreographyIntelligence(
        activeTemplate.pattern,
        tracks,
        systems,
        timeline.totalDurationMs
      ),
    [activeTemplate.pattern, tracks, systems, timeline.totalDurationMs]
  );

  return (
    <div className="ch-studio-container">
      {/* Top Header */}
      <header className="ch-studio-header">
        <div className="ch-studio-header-info">
          <h2 className="ch-studio-title">Choreography & Multi-System Builder</h2>

          {/* Template Select */}
          <div className="ch-header-select-wrap">
            <label className="ch-header-label">Template:</label>
            <select
              className="ch-header-select"
              value={selectedTemplateId}
              onChange={(e) => handleSelectTemplate(e.target.value)}
            >
              {templates.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* View Mode Navigation Tabs */}
        <div className="ch-studio-nav-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "timeline"}
            className={`ch-nav-tab ${viewMode === "timeline" ? "active" : ""}`}
            onClick={() => setViewMode("timeline")}
          >
            ⏱️ Timeline Editor
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "systems"}
            className={`ch-nav-tab ${viewMode === "systems" ? "active" : ""}`}
            onClick={() => setViewMode("systems")}
          >
            🌐 Multi-System
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "intelligence"}
            className={`ch-nav-tab ${viewMode === "intelligence" ? "active" : ""}`}
            onClick={() => setViewMode("intelligence")}
          >
            🧠 Intelligence
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "templates"}
            className={`ch-nav-tab ${viewMode === "templates" ? "active" : ""}`}
            onClick={() => setViewMode("templates")}
          >
            📂 Templates
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "export"}
            className={`ch-nav-tab ${viewMode === "export" ? "active" : ""}`}
            onClick={() => setViewMode("export")}
          >
            💻 Export Code
          </button>
        </div>

        {/* Header Actions */}
        <div className="ch-studio-header-actions">
          <label className="ch-reduced-motion-toggle">
            <input
              type="checkbox"
              checked={reducedMotion}
              onChange={(e) => setReducedMotion(e.target.checked)}
            />
            <span>Reduced Motion</span>
          </label>
        </div>
      </header>

      {/* Main Studio Body: Left editor / Right preview */}
      <div className="ch-studio-body">
        {/* Left Column: Active Module View */}
        <aside className="ch-studio-sidebar">
          {viewMode === "timeline" && (
            <ChoreographyTimelineEditor
              tracks={tracks}
              timeline={timeline}
              onUpdateTrack={handleUpdateTrack}
              onRemoveTrack={handleRemoveTrack}
              onToggleTrack={handleToggleTrack}
              onAddTrack={handleAddTrack}
            />
          )}

          {viewMode === "systems" && (
            <ChoreographySystemManager
              systems={systems}
              onToggleSystem={handleToggleSystem}
              onResetSystems={() => setSystems(getDefaultMultiSystemSettings())}
            />
          )}

          {viewMode === "intelligence" && (
            <ChoreographyIntelligencePanel report={intelligenceReport} />
          )}

          {viewMode === "templates" && (
            <ChoreographyTemplateSelector
              templates={templates}
              selectedTemplateId={selectedTemplateId}
              onSelectTemplate={handleSelectTemplate}
              onDuplicateTemplate={handleDuplicateTemplate}
              onResetTemplate={handleResetTemplate}
            />
          )}

          {viewMode === "export" && (
            <ChoreographyCodeExport
              name={activeTemplate.name}
              pattern={activeTemplate.pattern}
              tracks={tracks}
              systems={systems}
              totalDurationMs={timeline.totalDurationMs}
            />
          )}
        </aside>

        {/* Right Column: Live Synchronized Preview Stage */}
        <main className="ch-studio-main">
          <ChoreographyLivePreview
            tracks={tracks}
            timeline={timeline}
            systems={systems}
            reducedMotion={reducedMotion}
          />
        </main>
      </div>

      {/* Bottom Timeline Controller Bar */}
      <footer className="ch-studio-footer">
        <ChoreographyPlaybackController
          timeline={timeline}
          onScrub={handleScrub}
          onTogglePlay={handleTogglePlay}
          onRestart={handleRestart}
          onToggleReverse={handleToggleReverse}
          onToggleLoop={handleToggleLoop}
          onChangeSpeed={handleChangeSpeed}
          onChangeZoom={handleChangeZoom}
        />
      </footer>
    </div>
  );
};
