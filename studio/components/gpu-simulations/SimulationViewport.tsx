import React, { useRef, useEffect, useState, useCallback } from "react";
import type { GpuSimulationStudioState } from "../../types/gpu-simulations.js";

interface SimulationViewportProps {
  state: GpuSimulationStudioState;
}

interface InternalParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export const SimulationViewport: React.FC<SimulationViewportProps> = ({ state }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const particlesRef = useRef<InternalParticle[]>([]);
  const pointerPosRef = useRef<{ x: number; y: number; isDown: boolean }>({
    x: -1000,
    y: -1000,
    isDown: false,
  });
  const [showOverlay, setShowOverlay] = useState(true);
  const [clickBursts, setClickBursts] = useState<Array<{ x: number; y: number; radius: number; alpha: number }>>([]);

  const { particles, fluid, environment, forces, composition, isPlaying, playbackSpeed } = state;

  // Initialize or re-populate particle pool
  const initParticles = useCallback((width: number, height: number) => {
    const pool: InternalParticle[] = [];
    const count = Math.min(particles.count, 400); // Visual canvas density limit for smooth UI
    for (let i = 0; i < count; i++) {
      pool.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * (particles.speed * 0.4),
        vy: (Math.random() - 0.5) * (particles.speed * 0.4),
        life: Math.random() * particles.lifetime,
        maxLife: particles.lifetime,
        size: particles.startSize + Math.random() * (particles.endSize - particles.startSize),
        color: i % 2 === 0 ? particles.startColor : particles.endColor,
      });
    }
    particlesRef.current = pool;
  }, [particles]);

  // Pointer event handlers
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    pointerPosRef.current.x = e.clientX - rect.left;
    pointerPosRef.current.y = e.clientY - rect.top;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    pointerPosRef.current.isDown = true;
    pointerPosRef.current.x = x;
    pointerPosRef.current.y = y;

    // Trigger visual burst
    setClickBursts((prev) => [
      ...prev,
      { x, y, radius: 10, alpha: 1.0 },
    ]);

    // Push away or swirl particles instantly on click
    for (const p of particlesRef.current) {
      const dx = p.x - x;
      const dy = p.y - y;
      const dist = Math.hypot(dx, dy);
      if (dist < forces.pointerRadius * 1.5 && dist > 1) {
        const factor = (forces.pointerStrength * 2) / dist;
        p.vx += (dx / dist) * factor;
        p.vy += (dy / dist) * factor;
      }
    }
  };

  const handlePointerUp = () => {
    pointerPosRef.current.isDown = false;
  };

  const handlePointerLeave = () => {
    pointerPosRef.current.x = -1000;
    pointerPosRef.current.y = -1000;
    pointerPosRef.current.isDown = false;
  };

  // Main rendering simulation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 700);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 460);

    initParticles(width, height);

    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.05) * playbackSpeed * composition.timeScale;
      lastTime = currentTime;

      if (isPlaying) {
        // Clear background with ambient tint
        ctx.fillStyle = environment.ambientTint || "rgba(10, 15, 30, 0.95)";
        ctx.fillRect(0, 0, width, height);

        // 1. Draw Environmental effects (Rain / Snow / Fog / Lightning)
        if (environment.activeEffects.includes("rain")) {
          ctx.strokeStyle = "rgba(148, 163, 184, 0.35)";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          for (let i = 0; i < 40; i++) {
            const rx = (Math.sin(currentTime * 0.002 + i * 27) * 0.5 + 0.5) * width;
            const ry = ((currentTime * (0.8 + (i % 5) * 0.2) + i * 45) % height);
            ctx.moveTo(rx, ry);
            ctx.lineTo(rx + environment.windDirection[0] * 12, ry + 18);
          }
          ctx.stroke();
        }

        if (environment.activeEffects.includes("snow")) {
          ctx.fillStyle = "rgba(241, 245, 249, 0.7)";
          for (let i = 0; i < 35; i++) {
            const sx = (Math.cos(currentTime * 0.001 + i * 19) * 0.5 + 0.5) * width;
            const sy = ((currentTime * (0.2 + (i % 3) * 0.1) + i * 60) % height);
            ctx.beginPath();
            ctx.arc(sx, sy, 2 + (i % 3), 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // 2. Draw Fluid Simulation Layer (Dynamic flow streamlines & dye)
        const fluidLayer = composition.layers.find((l) => l.type === "fluid");
        if (fluidLayer && fluidLayer.enabled) {
          ctx.save();
          ctx.globalAlpha = fluidLayer.opacity;
          const gridStep = Math.max(24, Math.floor(width / (fluid.gridResolution / 2)));
          ctx.strokeStyle = fluid.dyeColor || "#38bdf8";
          ctx.lineWidth = 1.0;

          for (let gx = gridStep; gx < width; gx += gridStep) {
            for (let gy = gridStep; gy < height; gy += gridStep) {
              const angle =
                Math.sin(gx * 0.01 + currentTime * 0.001) * Math.cos(gy * 0.01 + currentTime * 0.001) *
                (fluid.vorticity * 0.08);
              const vx = Math.cos(angle) * 14;
              const vy = Math.sin(angle) * 14;

              if (fluid.visualizationMode === "velocity") {
                ctx.beginPath();
                ctx.moveTo(gx, gy);
                ctx.lineTo(gx + vx, gy + vy);
                ctx.stroke();
              } else if (fluid.visualizationMode === "smoke" || fluid.visualizationMode === "ink") {
                ctx.fillStyle = fluid.dyeColor;
                ctx.beginPath();
                ctx.arc(gx + vx * 0.5, gy + vy * 0.5, 3 + Math.abs(vx) * 0.2, 0, Math.PI * 2);
                ctx.fill();
              }
            }
          }
          ctx.restore();
        }

        // 3. Update & Draw GPU Particles
        const particleLayer = composition.layers.find((l) => l.type === "particle");
        if (particleLayer && particleLayer.enabled) {
          ctx.save();
          ctx.globalAlpha = particleLayer.opacity;
          if (particles.blendMode === "additive") {
            ctx.globalCompositeOperation = "lighter";
          }

          const px = pointerPosRef.current.x;
          const py = pointerPosRef.current.y;

          for (let i = 0; i < particlesRef.current.length; i++) {
            const p = particlesRef.current[i];
            p.life -= dt;

            if (p.life <= 0) {
              // Respawn
              p.life = particles.lifetime;
              p.x = width * 0.5 + (Math.random() - 0.5) * (particles.emitterType === "point" ? 20 : 200);
              p.y = height * 0.5 + (Math.random() - 0.5) * (particles.emitterType === "point" ? 20 : 150);
              p.vx = (Math.random() - 0.5) * particles.speed;
              p.vy = (Math.random() - 0.5) * particles.speed;
            }

            // Turbulence
            if (particles.turbulence > 0) {
              p.vx += (Math.sin(p.y * 0.05 + currentTime * 0.002) * particles.turbulence) * dt;
              p.vy += (Math.cos(p.x * 0.05 + currentTime * 0.002) * particles.turbulence) * dt;
            }

            // Gravity & Drag
            p.vy += particles.gravity * dt;
            p.vx *= 1 - particles.drag * dt;
            p.vy *= 1 - particles.drag * dt;

            // Wind influence
            if (composition.coupling.windAffectsParticles) {
              p.vx += environment.windDirection[0] * environment.windIntensity * 0.4 * dt;
              p.vy += environment.windDirection[1] * environment.windIntensity * 0.4 * dt;
            }

            // Interactive Pointer Force
            if (forces.pointerMode !== "off" && px > 0 && py > 0) {
              const dx = px - p.x;
              const dy = py - p.y;
              const dist = Math.hypot(dx, dy);

              if (dist < forces.pointerRadius && dist > 1) {
                const normX = dx / dist;
                const normY = dy / dist;
                const strength = forces.pointerStrength * (1 - dist / forces.pointerRadius);

                if (forces.pointerMode === "follow") {
                  p.vx += normX * strength * dt;
                  p.vy += normY * strength * dt;
                } else if (forces.pointerMode === "push") {
                  p.vx -= normX * strength * dt;
                  p.vy -= normY * strength * dt;
                } else if (forces.pointerMode === "swirl") {
                  p.vx += -normY * strength * dt;
                  p.vy += normX * strength * dt;
                }
              }
            }

            // Update Position
            p.x += p.vx * dt;
            p.y += p.vy * dt;

            // Render Particle
            const progress = 1 - p.life / p.maxLife;
            const currentSize = Math.max(1, p.size * (1 - progress * 0.5));
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.restore();
        }

        // 4. Render Active Click Bursts / Force Ripples
        setClickBursts((bursts) =>
          bursts
            .map((b) => ({
              ...b,
              radius: b.radius + dt * 200,
              alpha: b.alpha - dt * 2.0,
            }))
            .filter((b) => b.alpha > 0)
        );

        for (const burst of clickBursts) {
          ctx.strokeStyle = `rgba(56, 189, 248, ${burst.alpha})`;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(burst.x, burst.y, burst.radius, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [
    isPlaying,
    playbackSpeed,
    particles,
    fluid,
    environment,
    forces,
    composition,
    clickBursts,
    initParticles,
  ]);

  return (
    <div className="sim-viewport-container" role="region" aria-label="Simulation Viewport Stage">
      {/* Viewport Action Header Bar */}
      <div className="sim-viewport-toolbar">
        <div className="sim-viewport-status">
          <span className="sim-badge sim-badge-accent">
            {state.backend.activeBackend.toUpperCase()}
          </span>
          <span className="sim-viewport-meta">
            Mode: {state.viewMode.toUpperCase()} | Pointer: {forces.pointerMode.toUpperCase()}
          </span>
        </div>
        <div className="sim-viewport-actions">
          <button
            type="button"
            className={`studio-btn studio-btn-sm ${showOverlay ? "studio-btn-primary" : "studio-btn-outline"}`}
            onClick={() => setShowOverlay(!showOverlay)}
          >
            {showOverlay ? "Hide HUD" : "Show HUD"}
          </button>
          <button
            type="button"
            className="studio-btn studio-btn-sm studio-btn-outline"
            onClick={() => {
              if (canvasRef.current) {
                initParticles(canvasRef.current.width, canvasRef.current.height);
              }
            }}
          >
            ↺ Reset Simulation
          </button>
        </div>
      </div>

      {/* Canvas Stage */}
      <div className="sim-canvas-wrapper">
        <canvas
          ref={canvasRef}
          className="sim-canvas"
          onPointerMove={handlePointerMove}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
        />

        {/* Live Viewport Overlay HUD */}
        {showOverlay && (
          <div className="sim-canvas-hud">
            <div className="sim-hud-badge">
              Active Particles: <strong>{particles.count.toLocaleString()}</strong>
            </div>
            <div className="sim-hud-badge">
              Eulerian Cells: <strong>{fluid.gridResolution}×{fluid.gridResolution}</strong>
            </div>
            <div className="sim-hud-badge">
              Coupling: <strong>{composition.coupling.fluidAdvectsParticles ? "Active" : "Independent"}</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
