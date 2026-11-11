import React, { useState, useEffect, useRef, useCallback } from "react";
import type {
  MotionPhysicsStudioState,
  MotionPhysicsStudioViewMode,
  FixedTimestepOption,
} from "../../types/motion-physics.js";
import { createDefaultMotionPhysicsState } from "../../engine/motion-physics-engine.js";
import { PhysicsPlayground } from "./PhysicsPlayground.js";
import { AdvancedSpringEditor } from "./AdvancedSpringEditor.js";
import { InertiaForceEditor } from "./InertiaForceEditor.js";
import { CollisionConstraintEditor } from "./CollisionConstraintEditor.js";
import { PhysicsCompositionBuilder } from "./PhysicsCompositionBuilder.js";
import { PhysicsPresetLibrary } from "./PhysicsPresetLibrary.js";
import { PhysicsDiagnosticsPanel } from "./PhysicsDiagnosticsPanel.js";
import { PhysicsCodeExport } from "./PhysicsCodeExport.js";

export const MotionPhysicsStudio: React.FC = () => {
  const [state, setState] = useState<MotionPhysicsStudioState>(() =>
    createDefaultMotionPhysicsState()
  );

  // Undo / Redo Stacks
  const [undoStack, setUndoStack] = useState<MotionPhysicsStudioState[]>([]);
  const [redoStack, setRedoStack] = useState<MotionPhysicsStudioState[]>([]);

  const commitChange = useCallback(
    (newState: MotionPhysicsStudioState) => {
      setUndoStack((prev) => [...prev.slice(-20), state]);
      setRedoStack([]);
      setState(newState);
    },
    [state]
  );

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setUndoStack((s) => s.slice(0, -1));
    setRedoStack((s) => [...s, state]);
    setState(prev);
  }, [undoStack, state]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((s) => s.slice(0, -1));
    setUndoStack((s) => [...s, state]);
    setState(next);
  }, [redoStack, state]);

  // Keyboard shortcut listener for Ctrl+Z and Ctrl+Y
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Physics Simulation Step
  const stepSimulation = useCallback(
    (dtSeconds: number) => {
      setState((prev) => {
        const { gravity, bounds, bodies, constraints } = prev;
        const newBodies = bodies.map((body) => {
          if (body.type === "static" || body.pinned) return body;

          // Apply Gravity & Linear Damping
          let vx = body.velocity.x * (1 - body.linearDamping);
          let vy = (body.velocity.y + gravity.y * dtSeconds) * (1 - body.linearDamping);

          let px = body.position.x + vx * dtSeconds;
          let py = body.position.y + vy * dtSeconds;

          // Arena Boundary Collision Checks
          const radius = body.shape.type === "circle" ? (body.shape as any).radius : 20;

          // Floor
          if (py + radius >= bounds.height - 20) {
            py = bounds.height - 20 - radius;
            vy = -vy * body.restitution;
            vx *= 1 - body.friction;
          }
          // Ceiling
          if (py - radius <= 10) {
            py = 10 + radius;
            vy = -vy * body.restitution;
          }
          // Left Wall
          if (px - radius <= 10) {
            px = 10 + radius;
            vx = -vx * body.restitution;
          }
          // Right Wall
          if (px + radius >= bounds.width - 10) {
            px = bounds.width - 10 - radius;
            vx = -vx * body.restitution;
          }

          // Small velocity cutoff
          if (Math.abs(vx) < 1.0 && Math.abs(vy) < 1.0 && py + radius >= bounds.height - 25) {
            vx = 0;
            vy = 0;
          }

          return {
            ...body,
            position: { x: px, y: py },
            velocity: { x: vx, y: vy },
          };
        });

        // Solve Distance Constraints
        for (const c of constraints) {
          if (!c.enabled || c.type !== "distance" || !c.length) continue;
          const bodyA = newBodies.find((b) => b.id === c.bodyAId);
          const bodyB = newBodies.find((b) => b.id === c.bodyBId);
          if (!bodyA || !bodyB) continue;

          const dx = bodyB.position.x - bodyA.position.x;
          const dy = bodyB.position.y - bodyA.position.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const diff = (dist - c.length) / dist;

          if (bodyA.type === "dynamic" && bodyB.type === "dynamic") {
            const factor = 0.5 * (c.stiffness ?? 0.8);
            bodyA.position.x += dx * diff * factor;
            bodyA.position.y += dy * diff * factor;
            bodyB.position.x -= dx * diff * factor;
            bodyB.position.y -= dy * diff * factor;
          } else if (bodyA.type === "dynamic") {
            const factor = c.stiffness ?? 0.8;
            bodyA.position.x += dx * diff * factor;
            bodyA.position.y += dy * diff * factor;
          } else if (bodyB.type === "dynamic") {
            const factor = c.stiffness ?? 0.8;
            bodyB.position.x -= dx * diff * factor;
            bodyB.position.y -= dy * diff * factor;
          }
        }

        return {
          ...prev,
          bodies: newBodies,
          elapsedTimeMs: prev.elapsedTimeMs + dtSeconds * 1000,
          stepCount: prev.stepCount + 1,
        };
      });
    },
    []
  );

  // Playback Animation Frame Loop
  const rafIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  useEffect(() => {
    if (!state.isPlaying) {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      return;
    }

    const dt = (1 / state.fixedTimestep) * state.playbackSpeed;

    const loop = (now: number) => {
      stepSimulation(dt);
      rafIdRef.current = requestAnimationFrame(loop);
    };

    rafIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [state.isPlaying, state.fixedTimestep, state.playbackSpeed, stepSimulation]);

  const handleTogglePlay = () => {
    setState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const handleResetSimulation = () => {
    commitChange(createDefaultMotionPhysicsState());
  };

  const handleStepForward = () => {
    stepSimulation(1 / state.fixedTimestep);
  };

  return (
    <div className="mp-studio-container">
      {/* Top Navigation & Toolbar */}
      <header className="mp-studio-header">
        <div className="mp-studio-brand">
          <h2 className="mp-studio-title">⚛️ Motion Physics Studio</h2>
          <span className="mp-studio-sub">Rigid &amp; Harmonic Dynamics</span>
        </div>

        {/* View Mode Tabs */}
        <nav className="mp-view-tabs" aria-label="Physics Views">
          <button
            type="button"
            className={`mp-tab-btn ${state.viewMode === "playground" ? "active" : ""}`}
            onClick={() => setState((prev) => ({ ...prev, viewMode: "playground" }))}
          >
            🎮 Playground
          </button>
          <button
            type="button"
            className={`mp-tab-btn ${state.viewMode === "spring" ? "active" : ""}`}
            onClick={() => setState((prev) => ({ ...prev, viewMode: "spring" }))}
          >
            🌀 Spring Editor
          </button>
          <button
            type="button"
            className={`mp-tab-btn ${state.viewMode === "inertia" ? "active" : ""}`}
            onClick={() => setState((prev) => ({ ...prev, viewMode: "inertia" }))}
          >
            ⚡ Inertia &amp; Forces
          </button>
          <button
            type="button"
            className={`mp-tab-btn ${state.viewMode === "collision-constraints" ? "active" : ""}`}
            onClick={() => setState((prev) => ({ ...prev, viewMode: "collision-constraints" }))}
          >
            🔗 Constraints
          </button>
          <button
            type="button"
            className={`mp-tab-btn ${state.viewMode === "composition" ? "active" : ""}`}
            onClick={() => setState((prev) => ({ ...prev, viewMode: "composition" }))}
          >
            🧩 Composition
          </button>
          <button
            type="button"
            className={`mp-tab-btn ${state.viewMode === "presets" ? "active" : ""}`}
            onClick={() => setState((prev) => ({ ...prev, viewMode: "presets" }))}
          >
            📚 Presets
          </button>
          <button
            type="button"
            className={`mp-tab-btn ${state.viewMode === "diagnostics" ? "active" : ""}`}
            onClick={() => setState((prev) => ({ ...prev, viewMode: "diagnostics" }))}
          >
            📊 Diagnostics
          </button>
          <button
            type="button"
            className={`mp-tab-btn ${state.viewMode === "export" ? "active" : ""}`}
            onClick={() => setState((prev) => ({ ...prev, viewMode: "export" }))}
          >
            📦 Export
          </button>
        </nav>

        {/* Playback Controls Toolbar */}
        <div className="mp-playback-controls">
          <button
            type="button"
            className={`mp-btn-ctrl play ${state.isPlaying ? "active" : ""}`}
            onClick={handleTogglePlay}
            title={state.isPlaying ? "Pause Simulation" : "Start Simulation"}
          >
            {state.isPlaying ? "⏸️ Pause" : "▶️ Play"}
          </button>

          <button
            type="button"
            className="mp-btn-ctrl"
            onClick={handleStepForward}
            title="Step forward single fixed tick"
          >
            ⏭️ Step
          </button>

          <button
            type="button"
            className="mp-btn-ctrl"
            onClick={handleResetSimulation}
            title="Reset simulation to initial state"
          >
            ↺ Reset
          </button>

          {/* Timestep selector */}
          <select
            className="mp-select-sm"
            value={state.fixedTimestep}
            onChange={(e) =>
              setState((prev) => ({
                ...prev,
                fixedTimestep: parseInt(e.target.value, 10) as FixedTimestepOption,
              }))
            }
            title="Fixed simulation timestep"
          >
            <option value="30">30 Hz</option>
            <option value="60">60 Hz</option>
            <option value="120">120 Hz</option>
          </select>

          {/* Speed selector */}
          <select
            className="mp-select-sm"
            value={state.playbackSpeed}
            onChange={(e) =>
              setState((prev) => ({
                ...prev,
                playbackSpeed: parseFloat(e.target.value),
              }))
            }
            title="Playback speed multiplier"
          >
            <option value="0.25">0.25x</option>
            <option value="0.5">0.5x</option>
            <option value="1">1.0x</option>
            <option value="2">2.0x</option>
          </select>

          {/* Undo / Redo */}
          <button
            type="button"
            className="mp-btn-icon"
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            title="Undo (Ctrl+Z)"
          >
            ↶
          </button>
          <button
            type="button"
            className="mp-btn-icon"
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            title="Redo (Ctrl+Y)"
          >
            ↷
          </button>
        </div>
      </header>

      {/* Main Workspace View */}
      <main className="mp-studio-body">
        {state.viewMode === "playground" && (
          <PhysicsPlayground state={state} onUpdateState={setState} />
        )}
        {state.viewMode === "spring" && (
          <AdvancedSpringEditor state={state} onUpdateState={setState} />
        )}
        {state.viewMode === "inertia" && (
          <InertiaForceEditor state={state} onUpdateState={setState} />
        )}
        {state.viewMode === "collision-constraints" && (
          <CollisionConstraintEditor state={state} onUpdateState={setState} />
        )}
        {state.viewMode === "composition" && (
          <PhysicsCompositionBuilder state={state} onUpdateState={setState} />
        )}
        {state.viewMode === "presets" && (
          <PhysicsPresetLibrary state={state} onUpdateState={setState} />
        )}
        {state.viewMode === "diagnostics" && (
          <PhysicsDiagnosticsPanel state={state} />
        )}
        {state.viewMode === "export" && <PhysicsCodeExport state={state} />}
      </main>
    </div>
  );
};
