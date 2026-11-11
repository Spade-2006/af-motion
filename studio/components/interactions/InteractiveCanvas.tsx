import React, { useRef, useState, useCallback } from "react";
import type {
  InteractionStudioState,
  InteractivePreviewElement,
} from "../../types/interactions.js";
import { appendInteractionEvent } from "../../engine/interactions-engine.js";

interface InteractiveCanvasProps {
  state: InteractionStudioState;
  onChange: (updater: (prev: InteractionStudioState) => InteractionStudioState) => void;
}

export const InteractiveCanvas: React.FC<InteractiveCanvasProps> = ({ state, onChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activePointer, setActivePointer] = useState<{ x: number; y: number } | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; elemX: number; elemY: number } | null>(null);
  const [draggingElemId, setDraggingElemId] = useState<string | null>(null);

  const { pointerDrag, cursorMagnetic, visualFeedback, touchMultitouch } = state;

  // Handle pointer down on element
  const handlePointerDown = (e: React.PointerEvent, elem: InteractivePreviewElement) => {
    e.stopPropagation();
    e.preventDefault();

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const pointerX = e.clientX - rect.left;
      const pointerY = e.clientY - rect.top;

      setDraggingElemId(elem.id);
      setDragStart({
        x: pointerX,
        y: pointerY,
        elemX: elem.x,
        elemY: elem.y,
      });

      onChange((prev) => {
        let next: InteractionStudioState = {
          ...prev,
          selectedElementId: elem.id,
          elements: prev.elements.map((el) => ({
            ...el,
            isSelected: el.id === elem.id,
          })),
        };

        next = appendInteractionEvent(next, {
          category: "pointer",
          type: "pointerdown",
          targetId: elem.id,
          pointerId: e.pointerId,
          x: Math.round(pointerX),
          y: Math.round(pointerY),
          details: `Pointer down on ${elem.title}`,
        });

        next = appendInteractionEvent(next, {
          category: "drag",
          type: "dragstart",
          targetId: elem.id,
          x: Math.round(elem.x),
          y: Math.round(elem.y),
          details: `Drag initiated for ${elem.title}`,
        });

        return next;
      });
    }
  };

  // Handle pointer move over container
  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pointerX = e.clientX - rect.left;
      const pointerY = e.clientY - rect.top;

      setActivePointer({ x: pointerX, y: pointerY });

      // If currently dragging an element
      if (draggingElemId && dragStart) {
        const dx = pointerX - dragStart.x;
        const dy = pointerY - dragStart.y;

        let nextX = dragStart.elemX;
        let nextY = dragStart.elemY;

        if (pointerDrag.axis === "both" || pointerDrag.axis === "x") {
          nextX += dx;
        }
        if (pointerDrag.axis === "both" || pointerDrag.axis === "y") {
          nextY += dy;
        }

        // Apply grid snapping if enabled
        if (pointerDrag.gridSnapping && pointerDrag.gridSize > 0) {
          nextX = Math.round(nextX / pointerDrag.gridSize) * pointerDrag.gridSize;
          nextY = Math.round(nextY / pointerDrag.gridSize) * pointerDrag.gridSize;
        }

        // Apply bounds if enabled
        if (pointerDrag.boundsEnabled) {
          nextX = Math.max(pointerDrag.bounds.minX, Math.min(pointerDrag.bounds.maxX, nextX));
          nextY = Math.max(pointerDrag.bounds.minY, Math.min(pointerDrag.bounds.maxY, nextY));
        }

        onChange((prev) => ({
          ...prev,
          elements: prev.elements.map((el) =>
            el.id === draggingElemId ? { ...el, x: nextX, y: nextY } : el
          ),
        }));
      }
    },
    [draggingElemId, dragStart, pointerDrag, onChange]
  );

  // Handle pointer up
  const handlePointerUp = useCallback(() => {
    if (draggingElemId) {
      const elemId = draggingElemId;
      setDraggingElemId(null);
      setDragStart(null);

      onChange((prev) => {
        let next = appendInteractionEvent(prev, {
          category: "drag",
          type: "dragend",
          targetId: elemId,
          details: `Drag ended for ${elemId}`,
        });

        // Check spring back
        if (prev.pointerDrag.springBack) {
          next = {
            ...next,
            elements: next.elements.map((el) =>
              el.id === elemId ? { ...el, x: 40, y: 40 } : el
            ),
          };
          next = appendInteractionEvent(next, {
            category: "drag",
            type: "springback",
            targetId: elemId,
            details: `Spring back to origin applied`,
          });
        }

        return next;
      });
    }
  }, [draggingElemId, onChange]);

  // Handle canvas click to deselect or trigger gestures
  const handleCanvasClick = (e: React.PointerEvent) => {
    if (e.target === containerRef.current) {
      onChange((prev): InteractionStudioState => ({
        ...prev,
        selectedElementId: null,
        elements: prev.elements.map((el) => ({ ...el, isSelected: false })),
      }));
    }
  };

  // Reset positions to default
  const handleResetPositions = () => {
    onChange((prev) => {
      return {
        ...prev,
        elements: [
          { ...prev.elements[0], x: 40, y: 40, scale: 1, rotation: 0 },
          { ...prev.elements[1], x: 210, y: 40, scale: 1, rotation: 0 },
          { ...prev.elements[2], x: 370, y: 30, scale: 1, rotation: 0 },
          { ...prev.elements[3], x: 70, y: 180, scale: 1, rotation: 0 },
          { ...prev.elements[4], x: 230, y: 170, scale: 1, rotation: 0 },
          { ...prev.elements[5], x: 430, y: 180, scale: 1, rotation: 0 },
        ],
      };
    });
  };

  return (
    <div className="ip-canvas-container">
      {/* Canvas Top Bar */}
      <div className="ip-canvas-header">
        <div className="ip-canvas-info">
          <span className="ip-badge-active">Stage: Interactive Staging</span>
          <span className="ip-hint">Click & drag items. Pointer, gestures & physics tracked live.</span>
        </div>
        <div className="ip-canvas-actions">
          <button
            type="button"
            className="studio-btn studio-btn-sm"
            onClick={handleResetPositions}
            title="Reset element positions to layout defaults"
          >
            ↺ Reset Layout
          </button>
        </div>
      </div>

      {/* Interactive Surface */}
      <div
        ref={containerRef}
        className="ip-canvas-surface"
        onPointerDown={handleCanvasClick}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{
          touchAction: touchMultitouch.touchAction,
        }}
      >
        {/* SVG Feedback Layer for Magnetic Radii, Drag Bounds, Snap Points */}
        <svg className="ip-feedback-svg" width="100%" height="100%">
          {/* Drag Bounds overlay */}
          {visualFeedback.showDragBounds && pointerDrag.boundsEnabled && (
            <rect
              x={pointerDrag.bounds.minX}
              y={pointerDrag.bounds.minY}
              width={pointerDrag.bounds.maxX - pointerDrag.bounds.minX}
              height={pointerDrag.bounds.maxY - pointerDrag.bounds.minY}
              fill="none"
              stroke="rgba(59, 130, 246, 0.25)"
              strokeDasharray="4 4"
              strokeWidth={1.5}
            />
          )}

          {/* Snap Points */}
          {pointerDrag.snapPointsEnabled &&
            pointerDrag.snapPoints.map((pt, idx) => (
              <circle
                key={`snap-${idx}`}
                cx={pt.x}
                cy={pt.y}
                r={6}
                fill="none"
                stroke="#60a5fa"
                strokeWidth={1.5}
              />
            ))}

          {/* Magnetic Attraction Radius around magnetic target */}
          {visualFeedback.showMagneticRadius &&
            state.elements
              .filter((el) => el.kind === "magnetic-target" || el.kind === "action-button")
              .map((el) => {
                const centerX = el.x + el.width / 2;
                const centerY = el.y + el.height / 2;
                return (
                  <g key={`mag-${el.id}`}>
                    <circle
                      cx={centerX}
                      cy={centerY}
                      r={cursorMagnetic.magneticRadius}
                      fill="rgba(245, 158, 11, 0.05)"
                      stroke="rgba(245, 158, 11, 0.3)"
                      strokeDasharray="3 3"
                    />
                    {activePointer && (
                      <line
                        x1={centerX}
                        y1={centerY}
                        x2={activePointer.x}
                        y2={activePointer.y}
                        stroke="rgba(245, 158, 11, 0.4)"
                        strokeWidth={1}
                      />
                    )}
                  </g>
                );
              })}

          {/* Simulated Multitouch Visualization */}
          {touchMultitouch.simulatedTouchEnabled && (
            <g className="ip-simulated-touch">
              <circle
                cx={touchMultitouch.simulatedCentroid.x - touchMultitouch.simulatedDistance / 2}
                cy={touchMultitouch.simulatedCentroid.y}
                r={16}
                fill="rgba(168, 85, 247, 0.35)"
                stroke="#d8b4fe"
                strokeWidth={2}
              />
              <circle
                cx={touchMultitouch.simulatedCentroid.x + touchMultitouch.simulatedDistance / 2}
                cy={touchMultitouch.simulatedCentroid.y}
                r={16}
                fill="rgba(168, 85, 247, 0.35)"
                stroke="#d8b4fe"
                strokeWidth={2}
              />
              <line
                x1={touchMultitouch.simulatedCentroid.x - touchMultitouch.simulatedDistance / 2}
                y1={touchMultitouch.simulatedCentroid.y}
                x2={touchMultitouch.simulatedCentroid.x + touchMultitouch.simulatedDistance / 2}
                y2={touchMultitouch.simulatedCentroid.y}
                stroke="#c084fc"
                strokeWidth={1.5}
                strokeDasharray="4 2"
              />
              {visualFeedback.showCentroid && (
                <circle
                  cx={touchMultitouch.simulatedCentroid.x}
                  cy={touchMultitouch.simulatedCentroid.y}
                  r={5}
                  fill="#f43f5e"
                />
              )}
            </g>
          )}

          {/* Pointer Coordinate Indicator */}
          {visualFeedback.showPointers && activePointer && (
            <g transform={`translate(${activePointer.x}, ${activePointer.y})`}>
              <circle r={8} fill="rgba(96, 165, 250, 0.4)" stroke="#60a5fa" strokeWidth={1.5} />
              <text x={12} y={-4} fill="#93c5fd" fontSize={10} fontFamily="monospace">
                ({Math.round(activePointer.x)}, {Math.round(activePointer.y)})
              </text>
            </g>
          )}
        </svg>

        {/* DOM Interactive Elements */}
        {state.elements.map((elem) => {
          const isSelected = elem.id === state.selectedElementId;
          return (
            <div
              key={elem.id}
              className={`ip-element ${isSelected ? "selected" : ""} ${
                draggingElemId === elem.id ? "dragging" : ""
              }`}
              style={{
                transform: `translate3d(${elem.x}px, ${elem.y}px, 0px) scale(${elem.scale}) rotate(${elem.rotation}deg)`,
                width: elem.width,
                height: elem.height,
                background: elem.style.background,
                border: elem.style.border,
                color: elem.style.color,
                borderRadius: elem.style.borderRadius,
              }}
              onPointerDown={(e) => handlePointerDown(e, elem)}
            >
              <div className="ip-element-header">
                <span className="ip-element-title">{elem.title}</span>
                <span className="ip-element-kind">{elem.kind}</span>
              </div>
              <div className="ip-element-body">
                {elem.kind === "action-button" ? (
                  <button type="button" className="ip-inner-btn">
                    Trigger CTA
                  </button>
                ) : elem.kind === "gesture-pad" ? (
                  <span className="ip-pad-text">Swipe / Tap Zone</span>
                ) : elem.kind === "resizable-box" ? (
                  <span className="ip-box-text">Pinch & Spin</span>
                ) : (
                  <span className="ip-drag-handle">⠿ Drag Handle</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
