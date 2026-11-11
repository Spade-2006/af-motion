import React, { useRef, useState, useEffect, useCallback } from "react";
import type {
  MotionPhysicsStudioState,
  PhysicsPlaygroundBody,
  PhysicsPlaygroundConstraint,
} from "../../types/motion-physics.js";

interface PhysicsPlaygroundProps {
  state: MotionPhysicsStudioState;
  onUpdateState: (updater: (prev: MotionPhysicsStudioState) => MotionPhysicsStudioState) => void;
}

export const PhysicsPlayground: React.FC<PhysicsPlaygroundProps> = ({
  state,
  onUpdateState,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [draggingBodyId, setDraggingBodyId] = useState<string | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const { bodies, constraints, visualOptions, gravity, bounds, selectedBodyId } = state;

  // Drag interaction
  const handlePointerDown = (e: React.PointerEvent, body: PhysicsPlaygroundBody) => {
    e.stopPropagation();
    onUpdateState((prev) => ({ ...prev, selectedBodyId: body.id }));

    if (body.pinned || body.type === "static") return;

    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    dragOffsetRef.current = {
      x: x - body.position.x,
      y: y - body.position.y,
    };
    setDraggingBodyId(body.id);
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingBodyId) return;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffsetRef.current.x;
    const y = e.clientY - rect.top - dragOffsetRef.current.y;

    onUpdateState((prev) => ({
      ...prev,
      bodies: prev.bodies.map((b) =>
        b.id === draggingBodyId
          ? {
              ...b,
              position: {
                x: Math.max(30, Math.min(prev.bounds.width - 30, x)),
                y: Math.max(30, Math.min(prev.bounds.height - 30, y)),
              },
              velocity: { x: 0, y: 0 },
            }
          : b
      ),
    }));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingBodyId) {
      setDraggingBodyId(null);
      (e.target as Element).releasePointerCapture?.(e.pointerId);
    }
  };

  // Add new bodies
  const handleAddCircle = () => {
    const id = `body-circle-${Date.now().toString().slice(-4)}`;
    const newBody: PhysicsPlaygroundBody = {
      id,
      name: `Circle ${id.slice(-3)}`,
      type: "dynamic",
      shape: { type: "circle", radius: 20 },
      position: { x: 150 + Math.random() * 200, y: 80 },
      velocity: { x: (Math.random() - 0.5) * 100, y: 0 },
      mass: 1.0,
      restitution: 0.75,
      friction: 0.2,
      linearDamping: 0.05,
      color: "#ec4899",
    };
    onUpdateState((prev) => ({
      ...prev,
      bodies: [...prev.bodies, newBody],
      selectedBodyId: id,
    }));
  };

  const handleAddBox = () => {
    const id = `body-box-${Date.now().toString().slice(-4)}`;
    const newBody: PhysicsPlaygroundBody = {
      id,
      name: `Box ${id.slice(-3)}`,
      type: "dynamic",
      shape: { type: "rectangle", width: 44, height: 44 },
      position: { x: 200 + Math.random() * 200, y: 80 },
      velocity: { x: (Math.random() - 0.5) * 80, y: 0 },
      mass: 2.0,
      restitution: 0.5,
      friction: 0.3,
      linearDamping: 0.08,
      color: "#f59e0b",
    };
    onUpdateState((prev) => ({
      ...prev,
      bodies: [...prev.bodies, newBody],
      selectedBodyId: id,
    }));
  };

  const handleApplyImpulse = (dirX: number, dirY: number) => {
    if (!selectedBodyId) return;
    onUpdateState((prev) => ({
      ...prev,
      bodies: prev.bodies.map((b) =>
        b.id === selectedBodyId && b.type === "dynamic"
          ? {
              ...b,
              velocity: {
                x: b.velocity.x + dirX,
                y: b.velocity.y + dirY,
              },
            }
          : b
      ),
    }));
  };

  const handleDeleteSelected = () => {
    if (!selectedBodyId) return;
    onUpdateState((prev) => ({
      ...prev,
      bodies: prev.bodies.filter((b) => b.id !== selectedBodyId),
      constraints: prev.constraints.filter(
        (c) => c.bodyAId !== selectedBodyId && c.bodyBId !== selectedBodyId
      ),
      selectedBodyId: null,
    }));
  };

  const selectedBody = bodies.find((b) => b.id === selectedBodyId);

  return (
    <div className="mp-playground-container">
      {/* Simulation Stage */}
      <div className="mp-canvas-wrapper">
        <svg
          ref={svgRef}
          className="mp-physics-svg"
          viewBox={`0 0 ${bounds.width} ${bounds.height}`}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onClick={() => onUpdateState((prev) => ({ ...prev, selectedBodyId: null }))}
        >
          {/* Background Grid Pattern */}
          <defs>
            <pattern id="mp-grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width={bounds.width} height={bounds.height} fill="url(#mp-grid)" />

          {/* Boundaries */}
          {visualOptions.showBounds && (
            <rect
              x="2"
              y="2"
              width={bounds.width - 4}
              height={bounds.height - 4}
              fill="none"
              stroke="#334155"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
          )}

          {/* Constraints lines */}
          {visualOptions.showConstraintLines &&
            constraints.map((c) => {
              if (!c.enabled) return null;
              const bodyA = bodies.find((b) => b.id === c.bodyAId);
              const bodyB = bodies.find((b) => b.id === c.bodyBId);
              if (!bodyA || !bodyB) return null;
              return (
                <g key={c.id}>
                  <line
                    x1={bodyA.position.x}
                    y1={bodyA.position.y}
                    x2={bodyB.position.x}
                    y2={bodyB.position.y}
                    stroke="#38bdf8"
                    strokeWidth="2"
                    strokeDasharray={c.type === "spring" ? "3 3" : undefined}
                  />
                  <circle cx={bodyA.position.x} cy={bodyA.position.y} r="3" fill="#38bdf8" />
                  <circle cx={bodyB.position.x} cy={bodyB.position.y} r="3" fill="#38bdf8" />
                </g>
              );
            })}

          {/* Render Physics Bodies */}
          {bodies.map((body) => {
            const isSelected = body.id === selectedBodyId;
            const isCircle = body.shape.type === "circle";
            const radius = isCircle ? (body.shape as any).radius : 20;
            const width = !isCircle ? (body.shape as any).width : 40;
            const height = !isCircle ? (body.shape as any).height : 40;

            return (
              <g
                key={body.id}
                className={`mp-body-group ${isSelected ? "selected" : ""}`}
                onPointerDown={(e) => handlePointerDown(e, body)}
                style={{ cursor: body.type === "static" ? "default" : "grab" }}
              >
                {isCircle ? (
                  <circle
                    cx={body.position.x}
                    cy={body.position.y}
                    r={radius}
                    fill={body.color}
                    stroke={isSelected ? "#ffffff" : "rgba(255, 255, 255, 0.25)"}
                    strokeWidth={isSelected ? 3 : 1.5}
                    opacity={body.type === "static" ? 0.85 : 0.95}
                  />
                ) : (
                  <rect
                    x={body.position.x - width / 2}
                    y={body.position.y - height / 2}
                    width={width}
                    height={height}
                    rx="4"
                    fill={body.color}
                    stroke={isSelected ? "#ffffff" : "rgba(255, 255, 255, 0.25)"}
                    strokeWidth={isSelected ? 3 : 1.5}
                    opacity={body.type === "static" ? 0.85 : 0.95}
                  />
                )}

                {/* Center of Mass Indicator */}
                {visualOptions.showCenterOfMass && (
                  <circle
                    cx={body.position.x}
                    cy={body.position.y}
                    r="2.5"
                    fill="#ffffff"
                  />
                )}

                {/* Velocity Vector Arrow */}
                {visualOptions.showVelocityVectors &&
                  body.type === "dynamic" &&
                  (Math.abs(body.velocity.x) > 5 || Math.abs(body.velocity.y) > 5) && (
                    <line
                      x1={body.position.x}
                      y1={body.position.y}
                      x2={body.position.x + body.velocity.x * 0.25}
                      y2={body.position.y + body.velocity.y * 0.25}
                      stroke="#22c55e"
                      strokeWidth="2"
                      markerEnd="url(#mp-arrow)"
                    />
                  )}
              </g>
            );
          })}
        </svg>

        {/* Floating Quick Action Toolbar */}
        <div className="mp-canvas-toolbar">
          <button type="button" className="mp-btn-action" onClick={handleAddCircle}>
            ➕ Add Circle
          </button>
          <button type="button" className="mp-btn-action" onClick={handleAddBox}>
            ➕ Add Box
          </button>
          {selectedBody && selectedBody.type === "dynamic" && (
            <>
              <button
                type="button"
                className="mp-btn-action impulse"
                onClick={() => handleApplyImpulse(0, -300)}
                title="Apply upward impulse"
              >
                🚀 Jump Up
              </button>
              <button
                type="button"
                className="mp-btn-action impulse"
                onClick={() => handleApplyImpulse(250, -100)}
                title="Apply fling impulse"
              >
                💨 Fling Right
              </button>
              <button
                type="button"
                className="mp-btn-action danger"
                onClick={handleDeleteSelected}
                title="Remove body"
              >
                🗑️ Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Selected Object Inspector & Overlay Controls */}
      <aside className="mp-inspector-panel">
        <h3 className="mp-inspector-title">Object Inspector</h3>

        {selectedBody ? (
          <div className="mp-inspector-form">
            <div className="mp-form-row">
              <label>Name</label>
              <input
                type="text"
                className="mp-input-text"
                value={selectedBody.name}
                onChange={(e) =>
                  onUpdateState((prev) => ({
                    ...prev,
                    bodies: prev.bodies.map((b) =>
                      b.id === selectedBody.id ? { ...b, name: e.target.value } : b
                    ),
                  }))
                }
              />
            </div>

            <div className="mp-form-row">
              <label>Type</label>
              <select
                className="mp-select"
                value={selectedBody.type}
                onChange={(e) =>
                  onUpdateState((prev) => ({
                    ...prev,
                    bodies: prev.bodies.map((b) =>
                      b.id === selectedBody.id
                        ? { ...b, type: e.target.value as "dynamic" | "static" }
                        : b
                    ),
                  }))
                }
              >
                <option value="dynamic">Dynamic</option>
                <option value="static">Static (Immovable)</option>
              </select>
            </div>

            <div className="mp-form-row">
              <label>Mass: {selectedBody.mass.toFixed(1)}</label>
              <input
                type="range"
                min="0.1"
                max="10.0"
                step="0.1"
                disabled={selectedBody.type === "static"}
                value={Number.isFinite(selectedBody.mass) ? selectedBody.mass : 10}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onUpdateState((prev) => ({
                    ...prev,
                    bodies: prev.bodies.map((b) =>
                      b.id === selectedBody.id ? { ...b, mass: val } : b
                    ),
                  }));
                }}
              />
            </div>

            <div className="mp-form-row">
              <label>Restitution (Bounciness): {selectedBody.restitution.toFixed(2)}</label>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={selectedBody.restitution}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onUpdateState((prev) => ({
                    ...prev,
                    bodies: prev.bodies.map((b) =>
                      b.id === selectedBody.id ? { ...b, restitution: val } : b
                    ),
                  }));
                }}
              />
            </div>

            <div className="mp-form-row">
              <label>Friction: {selectedBody.friction.toFixed(2)}</label>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={selectedBody.friction}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onUpdateState((prev) => ({
                    ...prev,
                    bodies: prev.bodies.map((b) =>
                      b.id === selectedBody.id ? { ...b, friction: val } : b
                    ),
                  }));
                }}
              />
            </div>

            <div className="mp-form-row">
              <label>Linear Damping: {selectedBody.linearDamping.toFixed(2)}</label>
              <input
                type="range"
                min="0.0"
                max="0.5"
                step="0.01"
                value={selectedBody.linearDamping}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onUpdateState((prev) => ({
                    ...prev,
                    bodies: prev.bodies.map((b) =>
                      b.id === selectedBody.id ? { ...b, linearDamping: val } : b
                    ),
                  }));
                }}
              />
            </div>

            <div className="mp-form-row">
              <label>Color</label>
              <input
                type="color"
                className="mp-input-color"
                value={selectedBody.color}
                onChange={(e) =>
                  onUpdateState((prev) => ({
                    ...prev,
                    bodies: prev.bodies.map((b) =>
                      b.id === selectedBody.id ? { ...b, color: e.target.value } : b
                    ),
                  }))
                }
              />
            </div>
          </div>
        ) : (
          <div className="mp-empty-inspector">
            <p>Click on any body in the canvas to inspect and edit its physical properties.</p>
          </div>
        )}

        <div className="mp-visual-toggles">
          <h4 className="mp-sub-heading">Visual Overlays</h4>
          <label className="mp-toggle-label">
            <input
              type="checkbox"
              checked={visualOptions.showVelocityVectors}
              onChange={(e) =>
                onUpdateState((prev) => ({
                  ...prev,
                  visualOptions: { ...prev.visualOptions, showVelocityVectors: e.target.checked },
                }))
              }
            />
            Velocity Vectors
          </label>
          <label className="mp-toggle-label">
            <input
              type="checkbox"
              checked={visualOptions.showConstraintLines}
              onChange={(e) =>
                onUpdateState((prev) => ({
                  ...prev,
                  visualOptions: { ...prev.visualOptions, showConstraintLines: e.target.checked },
                }))
              }
            />
            Constraint Links
          </label>
          <label className="mp-toggle-label">
            <input
              type="checkbox"
              checked={visualOptions.showCenterOfMass}
              onChange={(e) =>
                onUpdateState((prev) => ({
                  ...prev,
                  visualOptions: { ...prev.visualOptions, showCenterOfMass: e.target.checked },
                }))
              }
            />
            Center of Mass
          </label>
        </div>
      </aside>
    </div>
  );
};
