import React, { useEffect, useMemo, useState } from "react";
import { animateProgress, easings } from "af-motion";
import { DemoWorkspace } from "../components/DemoWorkspace";
import {
  ControlSection,
  SelectControl,
  SliderControl,
  ToggleControl,
} from "../components/ControlPanel";
import { useWebsiteMotion } from "@/app/providers/MotionProvider";
import type { DemoComponentProps } from "../types";
import { Search } from "lucide-react";

type EasingKey = keyof typeof easings;
type EasingCategory = "All" | "Linear" | "Quadratic" | "Cubic" | "Sine" | "Exponential" | "Overshoot";

const EASING_META: Record<EasingKey, { readonly category: Exclude<EasingCategory, "All">; readonly note: string }> = {
  linear: { category: "Linear", note: "Uniform constant rate across [0, 1]" },
  easeInQuad: { category: "Quadratic", note: "Gentle t^2 acceleration from rest" },
  easeOutQuad: { category: "Quadratic", note: "Fast departure, soft quadratic deceleration" },
  easeInOutQuad: { category: "Quadratic", note: "Symmetric quadratic accelerate & settle" },
  easeInCubic: { category: "Cubic", note: "Pronounced t^3 acceleration" },
  easeOutCubic: { category: "Cubic", note: "Crisp cubic UI entrance deceleration" },
  easeInOutCubic: { category: "Cubic", note: "Dramatic symmetric cubic curve" },
  easeInSine: { category: "Sine", note: "Organic sinusoidal start" },
  easeOutSine: { category: "Sine", note: "Soft natural breathing settle" },
  easeInOutSine: { category: "Sine", note: "Gentle smooth wave inflection" },
  easeOutExpo: { category: "Exponential", note: "Immediate snap with silky tail" },
  easeOutBack: { category: "Overshoot", note: "Exceeds 1.0 slightly then snaps back" },
};

const ALL_EASING_KEYS = Object.keys(easings) as EasingKey[];

function sampleEasingSvgPath(fn: (t: number) => number, steps = 48): string {
  const pts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = t * 100;
    const y = 80 - fn(t) * 60;
    pts.push(`${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  return pts.join(" ");
}

export const EasingExplorerDemo: React.FC<DemoComponentProps> = ({
  playNonce,
  resetNonce,
  isPaused,
  onCodeChange,
  onStatusChange,
}) => {
  const { prefersReducedMotion } = useWebsiteMotion();
  const [primaryEasing, setPrimaryEasing] = useState<EasingKey>("easeOutExpo");
  const [compareEnabled, setCompareEnabled] = useState(true);
  const [compareEasing, setCompareEasing] = useState<EasingKey>("easeOutBack");
  const [duration, setDuration] = useState(900);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<EasingCategory>("All");
  const [rawProgress, setRawProgress] = useState(0);

  useEffect(() => {
    if (resetNonce === 0) return;
    setPrimaryEasing("easeOutExpo");
    setCompareEnabled(true);
    setCompareEasing("easeOutBack");
    setDuration(900);
    setSearchQuery("");
    setCategoryFilter("All");
  }, [resetNonce]);

  const filteredEasings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return ALL_EASING_KEYS.filter((key) => {
      const catMatch =
        categoryFilter === "All" || EASING_META[key].category === categoryFilter;
      const textMatch = !q || key.toLowerCase().includes(q);
      return catMatch && textMatch;
    });
  }, [searchQuery, categoryFilter]);

  // Animate linear raw progress 0 -> 1 cleanly using AF Motion animateProgress
  useEffect(() => {
    if (prefersReducedMotion) {
      setRawProgress(1);
      return;
    }

    const anim = animateProgress({
      duration,
      easing: easings.linear,
      respectReducedMotion: true,
      onUpdate: (p) => {
        setRawProgress(p);
      },
    });

    if (isPaused) {
      anim.pause();
    }

    return () => {
      anim.cancel();
    };
  }, [primaryEasing, compareEasing, duration, playNonce, isPaused, prefersReducedMotion]);

  // Emit live generated snippet
  useEffect(() => {
    const code = compareEnabled
      ? `import { animateProgress, easings } from "af-motion";

// Compare Primary (${primaryEasing}) vs Secondary (${compareEasing})
const t = 0.5;
const primaryValue = easings.${primaryEasing}(t);
const compareValue = easings.${compareEasing}(t);

const controls = animateProgress({
  duration: ${duration},
  easing: easings.${primaryEasing},
  onUpdate: (easedProgress) => {
    element.style.transform = \`translate3d(\${easedProgress * 180}px, 0, 0)\`;
  },
});`
      : `import { animate, easings } from "af-motion";

const controls = animate(
  element,
  {
    opacity: [0, 1],
    transform: ["translate3d(0, 20px, 0)", "translate3d(0, 0, 0)"],
  },
  {
    duration: ${duration},
    easing: easings.${primaryEasing},
  }
);`;
    onCodeChange(code);
    onStatusChange?.(
      `${ALL_EASING_KEYS.length} Built-in Core Curves · Selected: ${primaryEasing}`
    );
  }, [primaryEasing, compareEasing, compareEnabled, duration, onCodeChange, onStatusChange]);

  const primaryPath = useMemo(
    () => sampleEasingSvgPath(easings[primaryEasing]),
    [primaryEasing]
  );
  const comparePath = useMemo(
    () => sampleEasingSvgPath(easings[compareEasing]),
    [compareEasing]
  );

  const primaryEased = easings[primaryEasing](rawProgress);
  const compareEased = easings[compareEasing](rawProgress);

  return (
    <DemoWorkspace
      controlsTitle="Curve Laboratory"
      stage={
        <div className="flex-1 flex flex-col justify-between gap-5">
          {/* SVG Curve Visualizer */}
          <div className="relative rounded-xl bg-[#090b12] border border-white/[0.08] p-5 h-52 sm:h-60 flex items-center justify-center">
            <svg
              viewBox="-6 -8 112 100"
              className="w-full h-full max-w-md overflow-visible"
              role="img"
              aria-label={`Easing curve graph for ${primaryEasing}`}
            >
              {/* Reference Frame */}
              <rect
                x="0"
                y="20"
                width="100"
                height="60"
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeDasharray="2 2"
              />
              <line
                x1="0"
                y1="80"
                x2="100"
                y2="20"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="0.8"
                strokeDasharray="3 3"
              />

              {/* Secondary Comparison Curve */}
              {compareEnabled && (
                <path
                  d={comparePath}
                  fill="none"
                  stroke="#818cf8"
                  strokeWidth="1.8"
                  strokeDasharray="3 2"
                />
              )}

              {/* Primary Easing Curve */}
              <path
                d={primaryPath}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.4"
                strokeLinecap="round"
              />

              {/* Endpoints */}
              <circle cx="0" cy="80" r="2.2" fill="#94a3b8" />
              <circle cx="100" cy="20" r="2.2" fill="#38bdf8" />

              {/* Animated Progress Playhead Line */}
              <line
                x1={rawProgress * 100}
                y1="10"
                x2={rawProgress * 100}
                y2="84"
                stroke="rgba(56,189,248,0.35)"
                strokeWidth="0.9"
              />

              {/* Compare Dot */}
              {compareEnabled && (
                <circle
                  cx={rawProgress * 100}
                  cy={80 - compareEased * 60}
                  r="3.2"
                  fill="#818cf8"
                />
              )}

              {/* Primary Tracking Dot */}
              <circle
                cx={rawProgress * 100}
                cy={80 - primaryEased * 60}
                r="3.8"
                fill="#38bdf8"
              />
            </svg>
          </div>

          {/* Live Horizontal Motion Comparison Tracks */}
          <div className="space-y-3 rounded-xl bg-[#090b12] border border-white/[0.08] p-4">
            <div className="flex items-center gap-3">
              <span className="w-28 font-mono text-[11px] text-cyan-300 truncate">
                {primaryEasing}
              </span>
              <div className="flex-1 h-2 rounded-full bg-white/[0.06] relative">
                <div
                  style={{ transform: `translateX(${primaryEased * 100}%)` }}
                  className="absolute inset-y-0 left-0 right-4 pointer-events-none"
                >
                  <div className="w-4 h-4 -mt-1 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(56,189,248,0.8)]" />
                </div>
              </div>
              <span className="w-12 text-right font-mono text-[11px] text-slate-400">
                {primaryEased.toFixed(2)}
              </span>
            </div>

            {compareEnabled && (
              <div className="flex items-center gap-3">
                <span className="w-28 font-mono text-[11px] text-indigo-300 truncate">
                  {compareEasing}
                </span>
                <div className="flex-1 h-2 rounded-full bg-white/[0.06] relative">
                  <div
                    style={{ transform: `translateX(${compareEased * 100}%)` }}
                    className="absolute inset-y-0 left-0 right-4 pointer-events-none"
                  >
                    <div className="w-4 h-4 -mt-1 rounded-full bg-indigo-400 shadow-[0_0_12px_rgba(129,140,248,0.8)]" />
                  </div>
                </div>
                <span className="w-12 text-right font-mono text-[11px] text-slate-400">
                  {compareEased.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>
      }
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-slate-400">
          <span>{EASING_META[primaryEasing].note}</span>
          <span>12 Built-in Core Curves · Extensible via registerEasing()</span>
        </div>
      }
      controls={
        <>
          <ControlSection title="Search & Filter">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search easings..."
                aria-label="Search easing curves"
                className="w-full rounded-lg bg-[#0d1018] border border-white/[0.1] pl-8 pr-2.5 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              />
            </div>

            <SelectControl
              id="easing-category"
              label="Category Filter"
              value={categoryFilter}
              options={[
                { value: "All", label: "All Categories (12)" },
                { value: "Linear", label: "Linear" },
                { value: "Quadratic", label: "Quadratic" },
                { value: "Cubic", label: "Cubic" },
                { value: "Sine", label: "Sine" },
                { value: "Exponential", label: "Exponential" },
                { value: "Overshoot", label: "Overshoot" },
              ]}
              onChange={(v) => setCategoryFilter(v as EasingCategory)}
            />
          </ControlSection>

          <ControlSection title="Curve Selection">
            <div className="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto pr-1">
              {filteredEasings.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setPrimaryEasing(key)}
                  className={`text-left px-2.5 py-1.5 rounded-lg font-mono text-xs transition-colors cursor-pointer ${
                    primaryEasing === key
                      ? "bg-cyan-500/20 text-cyan-200 border border-cyan-400/40"
                      : "bg-white/[0.03] text-slate-400 hover:text-white"
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>

            <SliderControl
              id="easing-duration"
              label="Duration"
              value={duration}
              min={250}
              max={1800}
              step={50}
              unit="ms"
              onChange={setDuration}
            />
          </ControlSection>

          <ControlSection title="Comparison Mode">
            <ToggleControl
              id="easing-compare-toggle"
              label="Compare Two Curves"
              checked={compareEnabled}
              onChange={setCompareEnabled}
            />

            {compareEnabled && (
              <SelectControl
                id="easing-compare-select"
                label="Secondary Curve"
                value={compareEasing}
                options={ALL_EASING_KEYS.map((k) => ({ value: k, label: k }))}
                onChange={(v) => setCompareEasing(v as EasingKey)}
              />
            )}
          </ControlSection>
        </>
      }
    />
  );
};

export default EasingExplorerDemo;
