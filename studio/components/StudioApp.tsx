import React, { useEffect, useRef, useState } from "react";
import type {
  StudioAnimationConfig,
  StudioBackgroundConfig,
  StudioTab,
  StudioTimelineState,
  ViewportPreset,
} from "../types/index.js";
import { getDefaultAnimationConfig } from "../engine/animation-engine.js";
import { getDefaultBackgroundConfig } from "../engine/background-engine.js";
import { generateExportBundle } from "../engine/code-generator.js";

import { StudioHeader } from "./StudioHeader.js";
import { AnimationEditor } from "./AnimationEditor.js";
import { BackgroundEditor } from "./BackgroundEditor.js";
import { PreviewStage } from "./PreviewStage.js";
import { TimelineController } from "./TimelineController.js";
import { CodeExportPanel } from "./CodeExportPanel.js";
import { FutureModulePlaceholder } from "./FutureModulePlaceholders.js";
import { StyleExplorer } from "./style-explorer/StyleExplorer.js";
import { DesignSystemStudio } from "./design-systems/DesignSystemStudio.js";
import { ChoreographyStudio } from "./choreography/ChoreographyStudio.js";
import { Scene3DStudio } from "./scene-3d/Scene3DStudio.js";
import { MotionPhysicsStudio } from "./motion-physics/MotionPhysicsStudio.js";
import { InteractionPlayground } from "./interactions/InteractionPlayground.js";
import { AdvancedMotionStudio } from "./advanced-motion/AdvancedMotionStudio.js";
import { GpuSimulationStudio } from "./gpu-simulations/GpuSimulationStudio.js";
import { UnifiedPlayground } from "./unified-playground/UnifiedPlayground.js";

export const StudioApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<StudioTab>("dual");
  const [viewport, setViewport] = useState<ViewportPreset>("desktop");
  const [reducedMotion, setReducedMotion] = useState(false);

  const [animConfig, setAnimConfig] = useState<StudioAnimationConfig>(getDefaultAnimationConfig);
  const [bgConfig, setBgConfig] = useState<StudioBackgroundConfig>(getDefaultBackgroundConfig);

  const [timeline, setTimeline] = useState<StudioTimelineState>({
    currentTimeMs: 0,
    durationMs: 1000,
    progress: 0,
    isPlaying: true,
    isReversed: false,
    isLooping: true,
    fps: 60,
  });

  // Keep duration synchronized with animation config duration
  useEffect(() => {
    setTimeline((prev) => ({
      ...prev,
      durationMs: animConfig.duration || 1000,
    }));
  }, [animConfig.duration]);

  // Main Animation Loop using requestAnimationFrame
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!timeline.isPlaying) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    let lastTime = performance.now();

    const loop = (now: number) => {
      const deltaMs = now - lastTime;
      lastTime = now;

      setTimeline((prev) => {
        if (!prev.isPlaying) return prev;

        const dir = prev.isReversed ? -1 : 1;
        let nextTime = prev.currentTimeMs + deltaMs * dir;
        let nextProgress = nextTime / prev.durationMs;

        if (nextProgress >= 1.0) {
          if (prev.isLooping) {
            nextTime = 0;
            nextProgress = 0;
          } else {
            nextTime = prev.durationMs;
            nextProgress = 1.0;
            return {
              ...prev,
              currentTimeMs: nextTime,
              progress: 1.0,
              isPlaying: false,
            };
          }
        } else if (nextProgress <= 0) {
          if (prev.isLooping) {
            nextTime = prev.durationMs;
            nextProgress = 1.0;
          } else {
            nextTime = 0;
            nextProgress = 0;
            return {
              ...prev,
              currentTimeMs: 0,
              progress: 0,
              isPlaying: false,
            };
          }
        }

        return {
          ...prev,
          currentTimeMs: nextTime,
          progress: Math.max(0, Math.min(1, nextProgress)),
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
  }, [timeline.isPlaying, timeline.durationMs]);

  // Scrub timeline to specific millisecond
  const onScrub = (timeMs: number) => {
    setTimeline((prev) => ({
      ...prev,
      currentTimeMs: Math.max(0, Math.min(prev.durationMs, timeMs)),
      progress: Math.max(0, Math.min(1, timeMs / prev.durationMs)),
    }));
  };

  const onTogglePlay = () => {
    setTimeline((prev) => ({
      ...prev,
      isPlaying: !prev.isPlaying,
    }));
  };

  const onRestart = () => {
    setTimeline((prev) => ({
      ...prev,
      currentTimeMs: 0,
      progress: 0,
      isPlaying: true,
    }));
  };

  const onToggleReverse = () => {
    setTimeline((prev) => ({
      ...prev,
      isReversed: !prev.isReversed,
    }));
  };

  const onToggleLoop = () => {
    setTimeline((prev) => ({
      ...prev,
      isLooping: !prev.isLooping,
    }));
  };

  const onToggleReducedMotion = () => {
    setReducedMotion((prev) => !prev);
  };

  // Generate real-time code export bundle
  const exportBundle = generateExportBundle(animConfig, bgConfig);

  return (
    <div className={`studio-app-shell viewport-${viewport}`}>
      <StudioHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        viewport={viewport}
        onViewportChange={setViewport}
        reducedMotion={reducedMotion}
        onToggleReducedMotion={onToggleReducedMotion}
        onExportClick={() => setActiveTab("export")}
      />

      <main className="studio-workspace">
        {/* Module Routing */}
        {activeTab === "unified" ? (
          <UnifiedPlayground onNavigateModule={(tab) => setActiveTab(tab)} />
        ) : activeTab === "style-explorer" ? (
          <StyleExplorer />
        ) : activeTab === "design-systems" ? (
          <DesignSystemStudio />
        ) : activeTab === "choreography" ? (
          <ChoreographyStudio />
        ) : activeTab === "scene-3d" ? (
          <Scene3DStudio />
        ) : activeTab === "motion-physics" ? (
          <MotionPhysicsStudio />
        ) : activeTab === "interactions" ? (
          <InteractionPlayground />
        ) : activeTab === "advanced-motion" ? (
          <AdvancedMotionStudio />
        ) : activeTab === "simulations" ? (
          <GpuSimulationStudio />
        ) : activeTab === "export" ? (
          <div className="studio-export-workspace">
            <CodeExportPanel bundle={exportBundle} />
          </div>
        ) : (
          <div className="studio-editor-grid">
            {/* Left Column: Properties / Presets */}
            <aside className="studio-sidebar-panels">
              {activeTab === "animation" && (
                <AnimationEditor
                  config={animConfig}
                  onChange={setAnimConfig}
                  onReplay={onRestart}
                />
              )}
              {activeTab === "background" && (
                <BackgroundEditor
                  config={bgConfig}
                  onChange={setBgConfig}
                />
              )}
              {activeTab === "dual" && (
                <div className="dual-panel-container">
                  <div className="dual-subpanel">
                    <h2 className="subpanel-badge">Animation Controls</h2>
                    <AnimationEditor
                      config={animConfig}
                      onChange={setAnimConfig}
                      onReplay={onRestart}
                    />
                  </div>
                  <div className="dual-subpanel">
                    <h2 className="subpanel-badge">Background Controls</h2>
                    <BackgroundEditor
                      config={bgConfig}
                      onChange={setBgConfig}
                    />
                  </div>
                </div>
              )}
            </aside>

            {/* Center Column: Preview Stage & Timeline */}
            <section className="studio-center-stage">
              <PreviewStage
                animationConfig={animConfig}
                backgroundConfig={bgConfig}
                progress={reducedMotion ? 1 : timeline.progress}
                viewport={viewport}
                timeMs={timeline.currentTimeMs}
              />

              <TimelineController
                timeline={timeline}
                onScrub={onScrub}
                onTogglePlay={onTogglePlay}
                onRestart={onRestart}
                onToggleReverse={onToggleReverse}
                onToggleLoop={onToggleLoop}
              />
            </section>
          </div>
        )}
      </main>
    </div>
  );
};
