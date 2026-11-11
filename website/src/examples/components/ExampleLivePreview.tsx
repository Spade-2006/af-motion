import React, { useEffect, useRef, useState } from "react";
import {
  animate,
  animateSpring,
  aurora,
  countUp,
  createTimeline,
  easings,
  magnetic,
  stagger,
  tilt,
} from "af-motion";
import { evaluateMotionQuality } from "af-motion/catalogue";
import { useWebsiteMotion } from "@/app/providers/MotionProvider";
import { Play, Sparkles } from "lucide-react";

export interface ExampleLivePreviewProps {
  readonly exampleId: string;
}

export const ExampleLivePreview: React.FC<ExampleLivePreviewProps> = ({
  exampleId,
}) => {
  const { prefersReducedMotion } = useWebsiteMotion();
  const primaryRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const metricRef = useRef<HTMLSpanElement>(null);
  const [tick, setTick] = useState(0);
  const [scrollMock, setScrollMock] = useState(35);
  const [springOn, setSpringOn] = useState(false);

  // Mount-bound pointer / canvas effects with automatic teardown
  useEffect(() => {
    if (prefersReducedMotion) return;

    if (exampleId === "magnetic-cta" && buttonRef.current) {
      const m = magnetic(buttonRef.current, { strength: 0.35 });
      return () => m.destroy();
    }
    if (exampleId === "perspective-tilt-card" && primaryRef.current) {
      const t = tilt(primaryRef.current, { maxTilt: 12, scale: 1.03 });
      return () => t.destroy();
    }
    if (exampleId === "gpu-aurora-backdrop" && primaryRef.current) {
      const a = aurora(primaryRef.current, { speed: 6, opacity: 0.65, waveCount: 3 });
      return () => a?.destroy?.();
    }
    return undefined;
  }, [exampleId, prefersReducedMotion]);

  const triggerPreview = () => {
    setTick((t) => t + 1);

    if (exampleId === "entrance-card" && primaryRef.current && !prefersReducedMotion) {
      animate(
        primaryRef.current,
        {
          opacity: [0.3, 1],
          transform: [
            "translate3d(0, 16px, 0) scale(0.94)",
            "translate3d(0, 0, 0) scale(1)",
          ],
        },
        { duration: 520, easing: easings.easeOutExpo }
      );
    }

    if (exampleId === "route-stagger-reveal" && !prefersReducedMotion) {
      stagger(".example-stagger-dot", {
        properties: {
          opacity: [0.25, 1],
          transform: ["translate3d(0, 10px, 0)", "translate3d(0, 0, 0)"],
        },
        stagger: 65,
        duration: 360,
        easing: easings.easeOutCubic,
      });
    }

    if (exampleId === "kpi-count-spring" && metricRef.current) {
      if (prefersReducedMotion) {
        metricRef.current.textContent = "98.4%";
        return;
      }
      countUp(metricRef.current, {
        from: 0,
        to: 98.4,
        decimals: 1,
        suffix: "%",
        duration: 750,
        easing: easings.easeOutExpo,
      });
    }

    if (exampleId === "damped-spring-toggle") {
      const next = !springOn;
      setSpringOn(next);
      if (primaryRef.current && !prefersReducedMotion) {
        animateSpring({
          from: next ? 0 : 1,
          to: next ? 1 : 0,
          config: { stiffness: 240, damping: 16, mass: 1 },
          onUpdate: ({ position }) => {
            if (primaryRef.current) {
              primaryRef.current.style.transform = `translate3d(${Math.round(position * 64)}px, 0, 0)`;
            }
          },
        });
      }
    }

    if (exampleId === "timeline-ai-choreography" && primaryRef.current && !prefersReducedMotion) {
      const bars = primaryRef.current.querySelectorAll<HTMLElement>(".tl-preview-bar");
      if (bars.length >= 2) {
        const tl = createTimeline();
        tl.finished.catch(() => {});
        tl.add({
          at: 0,
          target: bars[0],
          properties: { transform: ["scaleX(0.35)", "scaleX(1)"] },
          options: { duration: 300, easing: easings.easeOutCubic },
        }).add({
          at: 110,
          target: bars[1],
          properties: { transform: ["scaleX(0.35)", "scaleX(1)"] },
          options: { duration: 380, easing: easings.easeOutExpo },
        });
        tl.play();
      }
    }
  };

  return (
    <div className="h-36 rounded-xl bg-cyber-grid border border-white/[0.08] p-3 flex flex-col justify-between relative overflow-hidden">
      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 relative z-10">
        <span>Live Preview</span>
        {exampleId !== "magnetic-cta" &&
          exampleId !== "perspective-tilt-card" &&
          exampleId !== "scroll-depth-track" &&
          exampleId !== "gpu-aurora-backdrop" && (
            <button
              type="button"
              onClick={triggerPreview}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/[0.06] hover:bg-white/[0.12] text-cyan-300 cursor-pointer transition-colors"
            >
              <Play className="w-2.5 h-2.5" />
              Run ({tick})
            </button>
          )}
      </div>

      {/* Mode-specific interactive body */}
      <div className="flex-1 flex items-center justify-center relative z-10">
        {exampleId === "entrance-card" && (
          <div
            ref={primaryRef}
            className="px-4 py-2.5 rounded-lg bg-[#0d1220] border border-cyan-400/35 flex items-center gap-2 text-xs text-white"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>animate() Target</span>
          </div>
        )}

        {exampleId === "magnetic-cta" && (
          <button
            ref={buttonRef}
            type="button"
            className="px-4 py-2 rounded-lg bg-indigo-600 text-xs font-semibold text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] cursor-pointer"
          >
            Magnetic CTA Hover
          </button>
        )}

        {exampleId === "perspective-tilt-card" && (
          <div
            ref={primaryRef}
            className="px-5 py-3 rounded-xl bg-gradient-to-br from-indigo-950/70 to-cyan-950/40 border border-indigo-400/30 text-xs font-semibold text-white cursor-pointer"
          >
            Hover 3D Tilt Surface
          </div>
        )}

        {exampleId === "route-stagger-reveal" && (
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="example-stagger-dot w-7 h-7 rounded-lg bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center font-mono text-[10px] text-white"
              >
                {n}
              </div>
            ))}
          </div>
        )}

        {exampleId === "scroll-depth-track" && (
          <div className="w-full max-w-[210px] space-y-2">
            <div className="h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] relative overflow-hidden flex items-center px-2">
              <div
                className="w-12 h-5 rounded bg-cyan-500/40 border border-cyan-300/50 transition-transform duration-75"
                style={{
                  transform: `translate3d(${prefersReducedMotion ? 0 : Math.round(scrollMock * 1.1)}px, 0, 0)`,
                }}
              />
            </div>
            <input
              type="range"
              aria-label="Simulate scroll parallax offset"
              min={0}
              max={100}
              value={scrollMock}
              onChange={(e) => setScrollMock(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>
        )}

        {exampleId === "kpi-count-spring" && (
          <div className="text-center">
            <span
              ref={metricRef}
              className="text-2xl font-extrabold font-mono text-emerald-400"
            >
              98.4%
            </span>
            <div className="font-mono text-[10px] text-slate-400 mt-0.5">
              Composite Layer Efficiency
            </div>
          </div>
        )}

        {exampleId === "damped-spring-toggle" && (
          <div className="w-32 h-8 rounded-full bg-white/[0.05] border border-white/[0.1] p-1 flex items-center">
            <div
              ref={primaryRef}
              className="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-400 to-indigo-500 shadow"
              style={{
                transform: prefersReducedMotion && springOn ? "translate3d(64px, 0, 0)" : undefined,
              }}
            />
          </div>
        )}

        {exampleId === "gpu-aurora-backdrop" && (
          <div
            ref={primaryRef}
            className="w-full h-20 rounded-lg border border-white/[0.1] bg-gradient-to-r from-indigo-950/60 to-cyan-950/60 flex items-center justify-center font-mono text-[11px] text-sky-200 relative overflow-hidden"
          >
            <span className="relative z-10">
              {prefersReducedMotion ? "Static Reduced-Motion Backdrop" : "Live aurora() Shader"}
            </span>
          </div>
        )}

        {exampleId === "timeline-ai-choreography" && (
          <div ref={primaryRef} className="w-full max-w-[210px] space-y-2">
            <div className="h-2.5 rounded-full bg-cyan-500/60 origin-left tl-preview-bar" />
            <div className="h-2.5 rounded-full bg-indigo-500/60 origin-left w-4/5 tl-preview-bar" />
            <div className="font-mono text-[10px] text-emerald-300">
              AI Audit Grade:{" "}
              {evaluateMotionQuality({ configuration: { duration: 480 } }).grade}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
