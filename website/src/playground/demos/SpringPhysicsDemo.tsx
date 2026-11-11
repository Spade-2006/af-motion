import React, { useEffect, useMemo, useRef, useState } from "react";
import { animateSpring } from "af-motion";
import { DemoWorkspace } from "../components/DemoWorkspace";
import { ControlSection, SliderControl } from "../components/ControlPanel";
import { Badge } from "@/components/ui/Badge";
import { useWebsiteMotion } from "@/app/providers/MotionProvider";
import type { DemoComponentProps } from "../types";

interface SpringParams {
  stiffness: number;
  damping: number;
  mass: number;
  initialVelocity: number;
}

const DEFAULT_SPRING: SpringParams = {
  stiffness: 220,
  damping: 16,
  mass: 1.0,
  initialVelocity: 0,
};

function computeSpringSvgTrajectory(params: SpringParams): {
  path: string;
  peak: number;
  settlingTimeMs: number;
} {
  const { stiffness, damping, mass, initialVelocity } = params;
  const dt = 1 / 60;
  let pos = 0;
  let vel = initialVelocity;
  let peak = 0;
  let settledFrame = 180;
  const pts: string[] = [];

  for (let frame = 0; frame <= 180; frame++) {
    const t = frame / 180;
    const x = t * 100;
    const y = 70 - pos * 45;
    pts.push(`${frame === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`);

    if (pos > peak) peak = pos;
    if (Math.abs(1 - pos) < 0.005 && Math.abs(vel) < 0.05 && settledFrame === 180 && frame > 10) {
      settledFrame = frame;
    }

    const force = -stiffness * (pos - 1);
    const damper = -damping * vel;
    const accel = (force + damper) / mass;
    vel += accel * dt;
    pos += vel * dt;
  }

  return {
    path: pts.join(" "),
    peak,
    settlingTimeMs: Math.round((settledFrame / 60) * 1000),
  };
}

export const SpringPhysicsDemo: React.FC<DemoComponentProps> = ({
  playNonce,
  resetNonce,
  isPaused,
  onCodeChange,
  onStatusChange,
}) => {
  const { prefersReducedMotion } = useWebsiteMotion();
  const [params, setParams] = useState<SpringParams>(DEFAULT_SPRING);
  const [liveState, setLiveState] = useState({ position: 0, velocity: 0 });
  const [forward, setForward] = useState(true);
  const orbRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (resetNonce === 0) return;
    setParams(DEFAULT_SPRING);
    setForward(true);
  }, [resetNonce]);

  const dampingRatio = useMemo(() => {
    return params.damping / (2 * Math.sqrt(params.stiffness * params.mass));
  }, [params]);

  const classification = useMemo(() => {
    if (dampingRatio < 0.92) return "Under-damped";
    if (dampingRatio <= 1.08) return "Critically damped";
    return "Over-damped";
  }, [dampingRatio]);

  const trajectory = useMemo(() => computeSpringSvgTrajectory(params), [params]);
  const overshootPct = Math.max(0, (trajectory.peak - 1) * 100);

  // Execute actual AF Motion animateSpring() solver
  useEffect(() => {
    if (isPaused) return;
    const toPos = forward ? 1 : 0;
    const fromPos = forward ? 0 : 1;

    if (prefersReducedMotion) {
      setLiveState({ position: toPos, velocity: 0 });
      if (orbRef.current) {
        orbRef.current.style.transform = `translate3d(${toPos * 100}%, 0, 0)`;
      }
      return;
    }

    const controls = animateSpring({
      from: fromPos,
      to: toPos,
      config: {
        stiffness: params.stiffness,
        damping: params.damping,
        mass: params.mass,
        initialVelocity: params.initialVelocity,
      },
      respectReducedMotion: true,
      onUpdate: ({ position, velocity }) => {
        setLiveState({ position, velocity });
        if (orbRef.current) {
          orbRef.current.style.transform = `translate3d(${position * 220}px, 0, 0)`;
        }
      },
    });

    return () => {
      controls.cancel();
    };
  }, [params, forward, playNonce, isPaused, prefersReducedMotion]);

  // Trigger toggle direction when Play/Replay clicked
  useEffect(() => {
    if (playNonce > 0) {
      setForward((f) => !f);
    }
  }, [playNonce]);

  // Emit generated TS snippet
  useEffect(() => {
    const code = `import { animateSpring } from "af-motion";

const springControls = animateSpring({
  from: 0,
  to: 1,
  config: {
    stiffness: ${params.stiffness},
    damping: ${params.damping},
    mass: ${params.mass},
    initialVelocity: ${params.initialVelocity},
  },
  onUpdate: ({ position }) => {
    element.style.transform = \`translate3d(\${position * 220}px, 0, 0)\`;
  },
});`;
    onCodeChange(code);
    onStatusChange?.(`${classification} · ζ = ${dampingRatio.toFixed(2)}`);
  }, [params, classification, dampingRatio, onCodeChange, onStatusChange]);

  const applyPreset = (stiffness: number, damping: number, mass: number) => {
    setParams({ stiffness, damping, mass, initialVelocity: 0 });
    setForward((f) => !f);
  };

  return (
    <DemoWorkspace
      controlsTitle="Spring Physics Solver"
      stage={
        <div className="flex-1 flex flex-col justify-between gap-5">
          {/* Quick Classification Presets */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => applyPreset(240, 10, 1)}
                className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-indigo-500/20 border border-white/[0.08] text-xs text-slate-300 cursor-pointer"
              >
                Under-damped
              </button>
              <button
                type="button"
                onClick={() => applyPreset(200, 28, 1)}
                className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-cyan-500/20 border border-white/[0.08] text-xs text-slate-300 cursor-pointer"
              >
                Critically damped
              </button>
              <button
                type="button"
                onClick={() => applyPreset(160, 45, 1)}
                className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-purple-500/20 border border-white/[0.08] text-xs text-slate-300 cursor-pointer"
              >
                Over-damped
              </button>
            </div>

            <Badge
              variant={
                classification === "Under-damped"
                  ? "violet"
                  : classification === "Critically damped"
                  ? "cyan"
                  : "emerald"
              }
              size="sm"
            >
              {classification}
            </Badge>
          </div>

          {/* Live Horizontal Spring Track */}
          <div className="rounded-xl bg-[#090b12] border border-white/[0.08] p-6">
            <div className="w-full max-w-[260px] mx-auto h-12 flex items-center relative">
              <div className="w-full h-1 rounded-full bg-white/[0.08]" />
              <div
                ref={orbRef}
                data-testid="spring-orb"
                className="absolute left-0 w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-400 to-indigo-600 border border-white/30 shadow-[0_0_24px_rgba(56,189,248,0.6)] will-change-transform flex items-center justify-center cursor-pointer"
                onClick={() => setForward((f) => !f)}
                title="Click to toggle spring target"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-white" />
              </div>
            </div>
          </div>

          {/* SVG Step Response Trajectory + Real-time Telemetry */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center rounded-xl bg-[#090b12] border border-white/[0.08] p-4">
            <svg viewBox="0 0 100 80" className="w-full h-28 overflow-visible" aria-hidden="true">
              <line
                x1="0"
                y1="25"
                x2="100"
                y2="25"
                stroke="rgba(56,189,248,0.22)"
                strokeDasharray="3 3"
                strokeWidth="0.8"
              />
              <path
                d={trajectory.path}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>

            <div className="space-y-1.5 font-mono text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Damping Ratio (ζ):</span>
                <span className="text-cyan-300 font-semibold">{dampingRatio.toFixed(3)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Peak Overshoot:</span>
                <span className="text-purple-300">{overshootPct.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Est. Settle Time:</span>
                <span className="text-slate-200">~{trajectory.settlingTimeMs}ms</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Live Position / Vel:</span>
                <span className="text-emerald-400">
                  {liveState.position.toFixed(2)} / {liveState.velocity.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      }
      footer={
        <div className="flex flex-wrap justify-between font-mono text-[11px] text-slate-400">
          <span>Engine: af-motion animateSpring() RK4/Semi-Implicit Solver</span>
          <span>Click target square or Run/Replay to cycle target</span>
        </div>
      }
      controls={
        <ControlSection title="Spring Constants">
          <SliderControl
            id="spring-stiffness"
            label="Stiffness (k)"
            value={params.stiffness}
            min={60}
            max={480}
            step={10}
            onChange={(v) => setParams((p) => ({ ...p, stiffness: v }))}
          />
          <SliderControl
            id="spring-damping"
            label="Damping (c)"
            value={params.damping}
            min={4}
            max={60}
            step={1}
            onChange={(v) => setParams((p) => ({ ...p, damping: v }))}
          />
          <SliderControl
            id="spring-mass"
            label="Mass (m)"
            value={params.mass}
            min={0.4}
            max={4.0}
            step={0.1}
            unit="kg"
            onChange={(v) => setParams((p) => ({ ...p, mass: v }))}
          />
          <SliderControl
            id="spring-velocity"
            label="Initial Velocity"
            value={params.initialVelocity}
            min={-12}
            max={12}
            step={0.5}
            onChange={(v) => setParams((p) => ({ ...p, initialVelocity: v }))}
          />
        </ControlSection>
      }
    />
  );
};

export default SpringPhysicsDemo;
