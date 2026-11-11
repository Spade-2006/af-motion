import React, { useEffect, useRef } from "react";
import type { UnifiedCompositionState } from "../../types/unified-playground.js";

interface UnifiedLiveStageProps {
  state: UnifiedCompositionState;
  onPointerMove?: (x: number, y: number) => void;
}

export const UnifiedLiveStage: React.FC<UnifiedLiveStageProps> = ({
  state,
  onPointerMove,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const colors = state.designBridge.colors;
  const isReducedMotion = state.designBridge.reducedMotion;

  // Background Canvas animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let time = 0;

    // Local lightweight particle system for live unified preview
    const particleCount = state.systems.simulations ? 120 : state.systems.background ? 50 : 20;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 1.5 * state.playback.speed,
      vy: (Math.random() - 0.5) * 1.5 * state.playback.speed,
      size: Math.random() * 3 + 1,
      alpha: Math.random() * 0.6 + 0.2,
    }));

    const render = () => {
      if (!ctx || !canvas) return;

      const width = canvas.width;
      const height = canvas.height;

      // 1. Clear background
      ctx.fillStyle = colors.background || "#0B0F19";
      ctx.fillRect(0, 0, width, height);

      // 2. Draw 3D wireframe / grid layer if 3D scene is active
      if (state.systems.scene3d) {
        ctx.save();
        ctx.strokeStyle = `${colors.accent}25`;
        ctx.lineWidth = 1;

        const horizon = height * 0.65;
        const vanishingX = width * 0.5;

        // Perspective vertical lines
        for (let x = -width; x < width * 2; x += 60) {
          ctx.beginPath();
          ctx.moveTo(x, height);
          ctx.lineTo(vanishingX, horizon);
          ctx.stroke();
        }

        // Horizontal depth lines
        for (let y = horizon; y < height; y += (height - horizon) / 8) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 3. Draw particles if background or simulations active
      if ((state.systems.background || state.systems.simulations) && !isReducedMotion) {
        ctx.save();
        for (const p of particles) {
          p.x += p.vx;
          p.y += p.vy;

          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;

          ctx.fillStyle = colors.accent;
          ctx.globalAlpha = p.alpha;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // 4. Draw physics collision boundary if physics active
      if (state.systems.physics) {
        ctx.save();
        ctx.strokeStyle = `${colors.primary}40`;
        ctx.lineWidth = 2;
        if (typeof ctx.setLineDash === "function") {
          ctx.setLineDash([6, 6]);
        }
        ctx.strokeRect(20, 20, width - 40, height - 40);
        ctx.restore();
      }

      time += 0.016 * state.playback.speed;
      if (state.playback.isPlaying && !isReducedMotion) {
        animId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [
    state.systems.background,
    state.systems.simulations,
    state.systems.scene3d,
    state.systems.physics,
    state.playback.isPlaying,
    state.playback.speed,
    colors,
    isReducedMotion,
  ]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    onPointerMove?.(x, y);

    if (cardRef.current && state.crossCoupling.magneticCursorCoupling && !isReducedMotion) {
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const deltaX = (x - centerX) / centerX;
      const deltaY = (y - centerY) / centerY;

      cardRef.current.style.transform = `perspective(800px) rotateY(${deltaX * 12}deg) rotateX(${-deltaY * 12}deg) translateZ(10px)`;
    }
  };

  const handleMouseLeave = () => {
    if (cardRef.current) {
      cardRef.current.style.transform = "perspective(800px) rotateY(0deg) rotateX(0deg) translateZ(0px)";
    }
  };

  return (
    <div
      className="unified-live-stage"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: "420px",
        borderRadius: "12px",
        overflow: "hidden",
        backgroundColor: colors.background || "#0B0F19",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Background Canvas Layer */}
      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      />

      {/* Foreground Interactive Card Layer */}
      <div
        ref={cardRef}
        className="unified-stage-card"
        style={{
          position: "relative",
          zIndex: 10,
          padding: "2rem 2.5rem",
          borderRadius: "16px",
          background: "rgba(255, 255, 255, 0.04)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          border: `1px solid ${colors.accent}40`,
          boxShadow: `0 24px 48px rgba(0, 0, 0, 0.5), 0 0 24px ${colors.accent}20`,
          maxWidth: "460px",
          textAlign: "center",
          color: colors.secondary || "#FFFFFF",
          transition: "transform 0.15s ease-out",
          userSelect: "none",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
          <span
            style={{
              fontSize: "0.7rem",
              padding: "2px 8px",
              borderRadius: "4px",
              background: `${colors.accent}25`,
              color: colors.accent,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            {state.designBridge.motionDNA} DNA
          </span>
          <span
            style={{
              fontSize: "0.7rem",
              padding: "2px 8px",
              borderRadius: "4px",
              background: "rgba(255, 255, 255, 0.1)",
              color: "#ccc",
              fontWeight: 600,
            }}
          >
            {state.designBridge.paletteName}
          </span>
        </div>

        <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.4rem", fontWeight: 700 }}>
          {state.name}
        </h3>
        <p style={{ margin: 0, fontSize: "0.85rem", opacity: 0.8, lineHeight: 1.5 }}>
          {state.description}
        </p>

        {/* Participating Systems Pill Bar */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "4px",
            justifyContent: "center",
            marginTop: "1.25rem",
          }}
        >
          {Object.entries(state.systems)
            .filter(([, active]) => active)
            .map(([sysKey]) => (
              <span
                key={sysKey}
                style={{
                  fontSize: "0.65rem",
                  padding: "1px 6px",
                  borderRadius: "3px",
                  background: "rgba(255, 255, 255, 0.08)",
                  color: "#aaa",
                }}
              >
                ● {sysKey}
              </span>
            ))}
        </div>
      </div>

      {/* Stage HUD / Diagnostics Overlay */}
      <div
        className="unified-stage-hud"
        style={{
          position: "absolute",
          top: "12px",
          right: "12px",
          background: "rgba(10, 14, 23, 0.85)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "6px",
          padding: "4px 8px",
          fontSize: "0.75rem",
          color: "#94A3B8",
          display: "flex",
          gap: "10px",
          alignItems: "center",
          zIndex: 20,
        }}
      >
        <span>
          ⚡ Speed: <strong style={{ color: "#F8FAFC" }}>{state.playback.speed}x</strong>
        </span>
        <span>
          🧬 DNA: <strong style={{ color: colors.accent }}>{state.designBridge.motionDNA}</strong>
        </span>
        <span>
          ⏱️ Multiplier: <strong style={{ color: "#F8FAFC" }}>{state.designBridge.timingMultiplier}x</strong>
        </span>
      </div>
    </div>
  );
};
