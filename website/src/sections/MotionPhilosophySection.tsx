import React, { useEffect, useRef, useState } from "react";
import { animateProgress, animateSpring, easings } from "af-motion";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionContainer } from "@/components/layout/SectionContainer";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MotionReveal } from "@/components/motion/MotionReveal";
import { useWebsiteMotion } from "@/app/providers/MotionProvider";
import { Play, RotateCcw } from "lucide-react";

type MotionModeId = "spring" | "expo" | "back" | "linear";

interface MotionModeSpec {
  readonly id: MotionModeId;
  readonly label: string;
  readonly apiCall: string;
  readonly description: string;
  readonly curvePath: string;
}

const MOTION_MODES: readonly MotionModeSpec[] = [
  {
    id: "spring",
    label: "Damped Spring",
    apiCall: "animateSpring({ stiffness: 220, damping: 18 })",
    description:
      "Physically modeled velocity conservation with natural micro-settle and zero fixed duration lock-in.",
    curvePath: "M 0 70 C 20 10, 45 5, 65 20 C 78 28, 90 18, 100 20",
  },
  {
    id: "expo",
    label: "Exponential Out",
    apiCall: "animateProgress({ easing: easings.easeOutExpo })",
    description:
      "Immediate responsiveness on initial intent followed by silky asymptotic deceleration.",
    curvePath: "M 0 70 C 12 18, 35 19, 100 20",
  },
  {
    id: "back",
    label: "Back Overshoot",
    apiCall: "animateProgress({ easing: easings.easeOutBack })",
    description:
      "Intentional playful anticipation that overshoots target equilibrium before locking into place.",
    curvePath: "M 0 70 C 25 10, 62 4, 82 14 C 92 18, 96 20, 100 20",
  },
  {
    id: "linear",
    label: "Mechanical Linear",
    apiCall: "animateProgress({ easing: easings.linear })",
    description:
      "Uniform constant velocity baseline—useful for scrubbers and continuous rotation, stark for UI entrances.",
    curvePath: "M 0 70 L 100 20",
  },
];

export const MotionPhilosophySection: React.FC = () => {
  const { prefersReducedMotion } = useWebsiteMotion();
  const [selectedMode, setSelectedMode] = useState<MotionModeId>("spring");
  const [progressValue, setProgressValue] = useState(0);
  const [isForward, setIsForward] = useState(true);
  const [runNonce, setRunNonce] = useState(0);
  const orbRef = useRef<HTMLDivElement>(null);

  const activeSpec =
    MOTION_MODES.find((m) => m.id === selectedMode) || MOTION_MODES[0];

  useEffect(() => {
    const targetPos = isForward ? 1 : 0;
    const startPos = isForward ? 0 : 1;

    if (prefersReducedMotion) {
      setProgressValue(targetPos);
      if (orbRef.current) {
        orbRef.current.style.transform = `translate3d(${targetPos * 100}%, 0, 0)`;
      }
      return;
    }

    let cancelFn: (() => void) | undefined;

    if (selectedMode === "spring") {
      const spring = animateSpring({
        from: startPos,
        to: targetPos,
        config: { stiffness: 220, damping: 18, mass: 1 },
        respectReducedMotion: true,
        onUpdate: ({ position }) => {
          setProgressValue(position);
          if (orbRef.current) {
            orbRef.current.style.transform = `translate3d(${position * 220}px, 0, 0)`;
          }
        },
      });
      cancelFn = () => spring.cancel();
    } else {
      const easingFn =
        selectedMode === "expo"
          ? easings.easeOutExpo
          : selectedMode === "back"
          ? easings.easeOutBack
          : easings.linear;

      const anim = animateProgress({
        duration: 850,
        easing: easingFn,
        respectReducedMotion: true,
        onUpdate: (p) => {
          const val = startPos + (targetPos - startPos) * p;
          setProgressValue(val);
          if (orbRef.current) {
            orbRef.current.style.transform = `translate3d(${val * 220}px, 0, 0)`;
          }
        },
      });
      cancelFn = () => anim.cancel();
    }

    return () => {
      cancelFn?.();
    };
  }, [selectedMode, isForward, runNonce, prefersReducedMotion]);

  const handleTrigger = (modeId?: MotionModeId) => {
    if (modeId && modeId !== selectedMode) {
      setSelectedMode(modeId);
      setIsForward(true);
    } else {
      setIsForward((prev) => !prev);
    }
    setRunNonce((n) => n + 1);
  };

  return (
    <SectionContainer id="philosophy" surface="subtle" spacing="normal">
      <PageContainer maxWidth="xl">
        <MotionReveal direction="up" duration={550}>
          <SectionHeading
            tag="Motion Philosophy"
            title="Timing Dictates Meaning"
            description="Great interfaces communicate mass, intent, and responsiveness through physics rather than static keyframes. Test AF Motion's live solvers below."
            align="center"
          />
        </MotionReveal>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Mode Selector Cards */}
          <div className="lg:col-span-5 min-w-0 flex flex-col gap-3">
            {MOTION_MODES.map((mode) => {
              const isSelected = mode.id === selectedMode;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => handleTrigger(mode.id)}
                  className={`text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 ${
                    isSelected
                      ? "bg-[#151928] border-indigo-500/50 shadow-[0_0_24px_rgba(99,102,241,0.18)]"
                      : "bg-[#0d1018]/80 border-white/[0.06] hover:border-white/[0.15]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-white">
                      {mode.label}
                    </span>
                    {isSelected && (
                      <Badge variant="cyan" size="sm">
                        Active
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {mode.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Interactive Solver Stage */}
          <div className="lg:col-span-7 min-w-0 flex">
            <Card variant="elevated" className="w-full p-6 sm:p-8 flex flex-col justify-between">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-white/[0.06]">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-cyan-400 block mb-1">
                    Live AF Motion Execution
                  </span>
                  <code className="font-mono text-xs sm:text-sm text-slate-200">
                    {activeSpec.apiCall}
                  </code>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  iconLeading={
                    isForward ? (
                      <RotateCcw className="w-3.5 h-3.5" />
                    ) : (
                      <Play className="w-3.5 h-3.5" />
                    )
                  }
                  onClick={() => handleTrigger()}
                >
                  Trigger Motion
                </Button>
              </div>

              {/* Calibrated Trajectory Track */}
              <div className="my-8 py-6 px-4 rounded-xl bg-[#07090e] border border-white/[0.06]">
                <div className="relative h-14 flex items-center">
                  <div className="w-full max-w-[260px] h-1 rounded-full bg-white/[0.08] mx-auto relative">
                    <div
                      ref={orbRef}
                      className="absolute -top-4 left-0 w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-400 to-indigo-500 shadow-[0_0_24px_rgba(56,189,248,0.6)] border border-white/30 will-change-transform flex items-center justify-center"
                    >
                      <span className="w-2 h-2 rounded-full bg-white" />
                    </div>
                  </div>
                </div>
              </div>

              {/* SVG Trajectory Curve + Telemetry */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-4 border-t border-white/[0.06]">
                <div className="h-20 rounded-lg bg-[#090b10] border border-white/[0.06] p-3 flex items-center justify-center">
                  <svg
                    viewBox="0 0 100 80"
                    className="w-full h-full overflow-visible"
                    aria-hidden="true"
                  >
                    <line
                      x1="0"
                      y1="70"
                      x2="100"
                      y2="20"
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                    />
                    <path
                      d={activeSpec.curvePath}
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                <div className="flex flex-col gap-1.5 font-mono text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Solver Position:</span>
                    <span className="text-cyan-300 font-semibold">
                      {progressValue.toFixed(3)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>GPU Property:</span>
                    <span className="text-slate-200">translate3d(x, 0, 0)</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Reduced Motion:</span>
                    <span className="text-emerald-400">
                      {prefersReducedMotion ? "Honored (Static)" : "Ready"}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </PageContainer>
    </SectionContainer>
  );
};
