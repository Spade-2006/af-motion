import React, { useRef, useEffect, useState } from "react";
import type {
  ChoreographyTrackConfig,
  ChoreographyTimelineState,
  MultiSystemActiveSettings,
} from "../../types/choreography.js";
import type { ViewportPreset } from "../../types/index.js";
import { computeTrackProgress } from "../../engine/choreography-builder-engine.js";

interface ChoreographyLivePreviewProps {
  tracks: ChoreographyTrackConfig[];
  timeline: ChoreographyTimelineState;
  systems: MultiSystemActiveSettings;
  reducedMotion: boolean;
}

export const ChoreographyLivePreview: React.FC<ChoreographyLivePreviewProps> = ({
  tracks,
  timeline,
  systems,
  reducedMotion,
}) => {
  const [viewport, setViewport] = useState<ViewportPreset>("desktop");
  const [bgMode, setBgMode] = useState<"dark" | "light" | "grid">("dark");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const containerWidth =
    viewport === "mobile" ? "375px" : viewport === "tablet" ? "680px" : "100%";

  // Find tracks
  const trackMap = new Map<string, ReturnType<typeof computeTrackProgress>>();
  tracks.forEach((t) => {
    trackMap.set(
      t.targetName,
      computeTrackProgress(
        t,
        reducedMotion ? timeline.totalDurationMs : timeline.currentTimeMs,
        timeline.totalDurationMs
      )
    );
  });

  // Render Graphics canvas synchronously
  useEffect(() => {
    if (!systems.graphicsEffects || !canvasRef.current) return;
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext ? canvas.getContext("2d") : null;
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const graphicsTrack = tracks.find((t) => t.system === "graphics");
      const progress = graphicsTrack
        ? (trackMap.get(graphicsTrack.targetName)?.progress ?? 0)
        : (timeline.currentTimeMs / (timeline.totalDurationMs || 1));

      // Draw dynamic fluid aura / wave
      const alpha = 0.2 + progress * 0.4;
      const grad = ctx.createRadialGradient(
        w / 2,
        h / 2,
        10,
        w / 2,
        h / 2,
        w * (0.3 + progress * 0.2)
      );
      grad.addColorStop(0, `rgba(154, 122, 255, ${alpha})`);
      grad.addColorStop(0.5, `rgba(56, 189, 248, ${alpha * 0.6})`);
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Floating particles
      const particleCount = 12;
      for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2 + progress * Math.PI;
        const radius = 60 + (i % 3) * 20;
        const px = w / 2 + Math.cos(angle) * radius;
        const py = h / 2 + Math.sin(angle) * radius;

        ctx.beginPath();
        ctx.arc(px, py, 3 + (i % 2), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(236, 72, 153, ${0.4 + (i % 3) * 0.2})`;
        ctx.fill();
      }
    } catch {
      // Safe fallback in headless / jsdom environments
    }
  }, [systems.graphicsEffects, tracks, timeline.currentTimeMs, timeline.totalDurationMs]);

  // 3D rotation angle
  const scene3dTrack = tracks.find((t) => t.system === "3d");
  const scene3dProgress = scene3dTrack
    ? (trackMap.get(scene3dTrack.targetName)?.progress ?? 0)
    : (timeline.currentTimeMs / (timeline.totalDurationMs || 1));
  const rotDeg = scene3dProgress * 360;

  // DOM elements state
  const titleState = trackMap.get("hero-title") ?? { opacity: 1, y: 0, scale: 1 };
  const subheadState = trackMap.get("hero-subhead") ?? { opacity: 1, y: 0, scale: 1 };
  const ctaState = trackMap.get("hero-cta") ?? { opacity: 1, y: 0, scale: 1 };
  const card1State = trackMap.get("metric-card-1") ?? { opacity: 1, y: 0, scale: 1 };
  const card2State = trackMap.get("metric-card-2") ?? { opacity: 1, y: 0, scale: 1 };

  return (
    <div className="ch-live-preview-container">
      {/* Top Preview Toolbar */}
      <div className="ch-preview-toolbar">
        <div className="ch-preview-toolbar-left">
          <span className="ch-toolbar-title">Choreography Stage</span>
          <span className="ch-preview-pill">
            T+{Math.round(timeline.currentTimeMs)}ms
          </span>
        </div>

        <div className="ch-preview-toolbar-right">
          {/* Viewport Presets */}
          <div className="ch-viewport-btn-group" role="group" aria-label="Viewport">
            <button
              type="button"
              className={`ch-view-btn ${viewport === "desktop" ? "active" : ""}`}
              onClick={() => setViewport("desktop")}
              title="Desktop"
            >
              🖥️
            </button>
            <button
              type="button"
              className={`ch-view-btn ${viewport === "tablet" ? "active" : ""}`}
              onClick={() => setViewport("tablet")}
              title="Tablet"
            >
              📱
            </button>
            <button
              type="button"
              className={`ch-view-btn ${viewport === "mobile" ? "active" : ""}`}
              onClick={() => setViewport("mobile")}
              title="Mobile"
            >
              📲
            </button>
          </div>

          {/* Background Theme */}
          <div className="ch-bg-btn-group" role="group" aria-label="Theme">
            <button
              type="button"
              className={`ch-bg-btn ${bgMode === "dark" ? "active" : ""}`}
              onClick={() => setBgMode("dark")}
            >
              Dark
            </button>
            <button
              type="button"
              className={`ch-bg-btn ${bgMode === "light" ? "active" : ""}`}
              onClick={() => setBgMode("light")}
            >
              Light
            </button>
            <button
              type="button"
              className={`ch-bg-btn ${bgMode === "grid" ? "active" : ""}`}
              onClick={() => setBgMode("grid")}
            >
              Grid
            </button>
          </div>
        </div>
      </div>

      {/* Stage Area */}
      <div className={`ch-preview-stage-area bg-${bgMode}`}>
        <div
          className="ch-stage-viewport-box"
          style={{ maxWidth: containerWidth }}
        >
          {/* Graphics Canvas Background Layer */}
          {systems.graphicsEffects && (
            <canvas
              ref={canvasRef}
              width={500}
              height={360}
              className="ch-stage-graphics-canvas"
            />
          )}

          {/* 3D Scene Geometry Simulated Wireframe Layer */}
          {systems.scene3d && (
            <div
              className="ch-stage-3d-wireframe"
              style={{
                transform: `rotateX(${rotDeg * 0.7}deg) rotateY(${rotDeg}deg)`,
              }}
            >
              <div className="ch-3d-cube-face front" />
              <div className="ch-3d-cube-face back" />
              <div className="ch-3d-cube-face right" />
              <div className="ch-3d-cube-face left" />
              <div className="ch-3d-cube-face top" />
              <div className="ch-3d-cube-face bottom" />
            </div>
          )}

          {/* Core DOM Elements Layer */}
          {systems.dom && (
            <div className="ch-stage-dom-content">
              {/* Headline */}
              <h1
                className="ch-stage-headline"
                style={{
                  opacity: titleState.opacity,
                  transform: `translateY(${titleState.y}px) scale(${titleState.scale})`,
                }}
              >
                Synchronized Motion
              </h1>

              {/* Subhead */}
              <p
                className="ch-stage-subhead"
                style={{
                  opacity: subheadState.opacity,
                  transform: `translateY(${subheadState.y}px)`,
                }}
              >
                Orchestrating DOM transforms, Canvas particle fields, and 3D scenes on a unified timeline.
              </p>

              {/* CTA Button */}
              <div
                className="ch-stage-cta-wrap"
                style={{
                  opacity: ctaState.opacity,
                  transform: `scale(${ctaState.scale})`,
                }}
              >
                <button type="button" className="ch-stage-cta-btn">
                  Explore Ecosystem →
                </button>
              </div>

              {/* Multi-Cards Stagger Layer */}
              <div className="ch-stage-cards-grid">
                <div
                  className="ch-stage-card"
                  style={{
                    opacity: card1State.opacity,
                    transform: `translateY(${card1State.y}px)`,
                  }}
                >
                  <span className="ch-card-stat">60 FPS</span>
                  <span className="ch-card-label">Fluid Frame Rate</span>
                </div>

                <div
                  className="ch-stage-card"
                  style={{
                    opacity: card2State.opacity,
                    transform: `translateY(${card2State.y}px)`,
                  }}
                >
                  <span className="ch-card-stat">7 Systems</span>
                  <span className="ch-card-label">Cross-Sync Engine</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
