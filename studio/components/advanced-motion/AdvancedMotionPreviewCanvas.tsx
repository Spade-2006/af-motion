import React from "react";
import type { AdvancedMotionStudioState } from "../../types/advanced-motion.js";

interface AdvancedMotionPreviewCanvasProps {
  state: AdvancedMotionStudioState;
  onChange: (updater: (prev: AdvancedMotionStudioState) => AdvancedMotionStudioState) => void;
}

export const AdvancedMotionPreviewCanvas: React.FC<AdvancedMotionPreviewCanvasProps> = ({
  state,
  onChange,
}) => {
  const { viewMode, layout, svgMorph, motionPath, typography, sharedElement, viewTransition } =
    state;

  return (
    <div className="am-canvas-container">
      <div className="am-canvas-header">
        <div className="am-canvas-info">
          <span className="am-badge-active">Active View: {viewMode.toUpperCase()}</span>
          <span className="am-hint">Real-time GPU accelerated rendering and interactive manipulation.</span>
        </div>
      </div>

      <div className="am-canvas-surface">
        {/* VIEW 1: Layout FLIP Animation */}
        {viewMode === "layout" && (
          <div className={`am-layout-stage mode-${layout.layoutMode}`}>
            {layout.layoutItems.map((item) => (
              <div
                key={item.id}
                className="am-layout-card"
                style={{
                  background: item.color,
                  transition: `transform ${layout.duration}ms ${layout.easing}`,
                }}
              >
                <span className="am-card-label">{item.label}</span>
                <span className="am-card-order">Order #{item.order}</span>
              </div>
            ))}
          </div>
        )}

        {/* VIEW 2: SVG Morphing */}
        {viewMode === "svg-morph" && (
          <div className="am-morph-stage">
            <svg viewBox="0 0 100 100" className="am-morph-svg">
              {/* Ghost Target Outline */}
              <path
                d={svgMorph.targetPath}
                fill="none"
                stroke="rgba(255, 255, 255, 0.12)"
                strokeDasharray="2 2"
                strokeWidth={1}
              />
              {/* Ghost Source Outline */}
              <path
                d={svgMorph.sourcePath}
                fill="none"
                stroke="rgba(59, 130, 246, 0.2)"
                strokeDasharray="2 2"
                strokeWidth={1}
              />
              {/* Active Morph Shape */}
              <path
                d={svgMorph.progress < 0.5 ? svgMorph.sourcePath : svgMorph.targetPath}
                fill="url(#morph-gradient)"
                stroke="#a855f7"
                strokeWidth={1.5}
                style={{
                  transition: `d ${svgMorph.duration}ms ${svgMorph.easing}`,
                }}
              />
              <defs>
                <linearGradient id="morph-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(168, 85, 247, 0.6)" />
                  <stop offset="100%" stopColor="rgba(59, 130, 246, 0.6)" />
                </linearGradient>
              </defs>
            </svg>
            <div className="am-morph-readout">
              Progress: {Math.round(svgMorph.progress * 100)}%
            </div>
          </div>
        )}

        {/* VIEW 3: Motion Path Trajectory */}
        {viewMode === "motion-path" && (
          <div className="am-path-stage">
            <svg viewBox="0 0 500 300" className="am-path-svg">
              {/* Path Curve */}
              <path
                d={motionPath.pathString}
                fill="none"
                stroke="rgba(59, 130, 246, 0.4)"
                strokeWidth={3}
                strokeDasharray="4 2"
              />
              {/* Follower Actor */}
              <g
                transform={`translate(${motionPath.currentCoord.x}, ${motionPath.currentCoord.y}) rotate(${
                  motionPath.autoRotate ? 45 : 0
                })`}
              >
                <circle r={14} fill="#10b981" />
                <polygon points="0,-18 10,14 -10,14" fill="#34d399" />
              </g>
            </svg>
            <div className="am-path-readout">
              Coordinate: ({motionPath.currentCoord.x}, {motionPath.currentCoord.y})
            </div>
          </div>
        )}

        {/* VIEW 4: Kinetic Typography */}
        {viewMode === "typography" && (
          <div className="am-typo-stage">
            <div className="am-typo-container">
              {typography.segmentation === "word" ? (
                typography.text.split(" ").map((w, idx) => (
                  <span
                    key={`word-${idx}`}
                    className={`am-typo-unit preset-${typography.preset}`}
                    style={{
                      animationDelay: `${idx * typography.staggerMs}ms`,
                    }}
                  >
                    {w}&nbsp;
                  </span>
                ))
              ) : typography.segmentation === "character" ? (
                typography.text.split("").map((c, idx) => (
                  <span
                    key={`char-${idx}`}
                    className={`am-typo-unit preset-${typography.preset}`}
                    style={{
                      animationDelay: `${idx * typography.staggerMs}ms`,
                    }}
                  >
                    {c}
                  </span>
                ))
              ) : (
                <div className={`am-typo-unit preset-${typography.preset}`}>
                  {typography.text}
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 5: Shared Element Transition */}
        {viewMode === "shared-element" && (
          <div className="am-shared-stage">
            {sharedElement.activeView === "list" ? (
              <div className="am-shared-list-view">
                <div
                  className="am-shared-card source"
                  style={{
                    width: sharedElement.sourceBounds.width,
                    height: sharedElement.sourceBounds.height,
                    borderRadius: sharedElement.borderRadius,
                  }}
                >
                  <span className="am-card-badge">List Item</span>
                  <h4>Hero Card (Source)</h4>
                </div>
              </div>
            ) : (
              <div className="am-shared-detail-view">
                <div
                  className="am-shared-card destination"
                  style={{
                    width: sharedElement.targetBounds.width,
                    height: sharedElement.targetBounds.height,
                    borderRadius: sharedElement.borderRadius * 1.5,
                  }}
                >
                  <span className="am-card-badge">Detail Hero View</span>
                  <h2>Expanded Hero Card (Destination)</h2>
                  <p>Seamlessly morphed with FLIP geometric matrix calculation.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 6: View Transition */}
        {viewMode === "view-transition" && (
          <div className="am-view-trans-stage">
            <div className={`am-view-pane ${viewTransition.currentView} preset-${viewTransition.transitionPreset}`}>
              {viewTransition.currentView === "view-a" ? (
                <div className="am-page-content view-a">
                  <h3>Document View A (Catalog Index)</h3>
                  <p>Trigger page transition to animate into View B.</p>
                </div>
              ) : (
                <div className="am-page-content view-b">
                  <h3>Document View B (Product Showcase)</h3>
                  <p>Orchestrated with browser-native ViewTransition or FLIP fallback.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 7: Unified Composition */}
        {viewMode === "composition" && (
          <div className="am-comp-stage">
            <div className="am-comp-visualizer">
              <div className="am-comp-indicator" style={{ left: `${state.composition.progress * 100}%` }} />
              <div className="am-comp-lanes">
                {state.composition.steps.map((st) => (
                  <div key={st.id} className="am-comp-lane">
                    <span className="am-lane-tag">{st.system}</span>
                    <div
                      className={`am-lane-bar status-${st.status}`}
                      style={{
                        width: `${Math.min(100, (st.duration / state.composition.duration) * 100)}%`,
                      }}
                    >
                      {st.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
