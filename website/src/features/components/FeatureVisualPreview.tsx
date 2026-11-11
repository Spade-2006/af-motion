import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  animate,
  easings,
  stagger,
  magnetic,
  tilt,
  getMotionDNA,
  listPalettes,
  getPalette,
  aurora,
} from "af-motion";
import { evaluateMotionQuality, designToMotionEngine } from "af-motion/catalogue";
import { listPresets } from "af-motion/presets";
import { useWebsiteMotion } from "@/app/providers/MotionProvider";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { FeatureCategoryId } from "../types";
import { Play, Sparkles, RotateCcw, Layers, ShieldCheck } from "lucide-react";

export interface FeatureVisualPreviewProps {
  readonly categoryId: FeatureCategoryId;
}

/**
 * Distinct, non-uniform interactive visual demonstration per feature category.
 * Uses actual AF Motion runtime modules rather than static screenshots or duplicate engines.
 */
export const FeatureVisualPreview: React.FC<FeatureVisualPreviewProps> = ({
  categoryId,
}) => {
  switch (categoryId) {
    case "core-animation":
      return <CoreAnimationPreview />;
    case "visual-effects":
      return <VisualEffectsPreview />;
    case "motion-intelligence":
      return <MotionIntelligencePreview />;
    case "design-system":
      return <DesignSystemPreview />;
    case "three-gpu":
      return <ThreeGpuPreview />;
    case "framework-integrations":
      return <FrameworkIntegrationsPreview />;
  }
};

const CoreAnimationPreview: React.FC = () => {
  const { prefersReducedMotion } = useWebsiteMotion();
  const boxRef = useRef<HTMLDivElement>(null);
  const wordRef = useRef<HTMLDivElement>(null);
  const [runs, setRuns] = useState(0);

  const playDemo = () => {
    setRuns((r) => r + 1);
    if (prefersReducedMotion || !boxRef.current || !wordRef.current) return;

    animate(
      boxRef.current,
      {
        opacity: [0.45, 1],
        transform: [
          "translate3d(-32px, 0, 0) rotate(-14deg) scale(0.88)",
          "translate3d(24px, 0, 0) rotate(0deg) scale(1.06)",
        ],
      },
      { duration: 640, easing: easings.easeOutBack }
    );
    animate(
      wordRef.current,
      {
        opacity: [0.5, 1],
        transform: ["translate3d(0, 10px, 0)", "translate3d(0, 0, 0)"],
      },
      { duration: 480, easing: easings.easeOutExpo }
    );
  };

  return (
    <div className="rounded-2xl border border-cyan-500/20 bg-[#07090f] p-5 flex flex-col justify-between gap-4">
      <div className="flex items-center justify-between gap-2">
        <Badge variant="cyan" size="sm">
          Kinetic Core Stage
        </Badge>
        <Button
          variant="secondary"
          size="sm"
          iconLeading={<Play className="w-3.5 h-3.5 text-cyan-400" />}
          onClick={playDemo}
        >
          Trigger animate()
        </Button>
      </div>

      <div className="h-36 rounded-xl bg-cyber-grid border border-white/[0.06] flex flex-col items-center justify-center gap-3 overflow-hidden relative px-4">
        <div
          ref={boxRef}
          className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 shadow-[0_0_28px_rgba(56,189,248,0.45)] flex items-center justify-center border border-white/20 will-change-transform"
        >
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div ref={wordRef} className="font-mono text-xs tracking-wider uppercase text-cyan-300">
          GPU Transform · Runs: {runs}
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
        <span>Easing: easings.easeOutBack</span>
        <span>{prefersReducedMotion ? "Reduced Motion Static" : "60fps Transform Pipeline"}</span>
      </div>
    </div>
  );
};

const VisualEffectsPreview: React.FC = () => {
  const { prefersReducedMotion } = useWebsiteMotion();
  const magRef = useRef<HTMLButtonElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const chipContainerRef = useRef<HTMLDivElement>(null);
  const [staggerCount, setStaggerCount] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const m = magRef.current ? magnetic(magRef.current, { strength: 0.35 }) : null;
    const t = tiltRef.current ? tilt(tiltRef.current, { maxTilt: 12, scale: 1.03 }) : null;
    return () => {
      m?.destroy();
      t?.destroy();
    };
  }, [prefersReducedMotion]);

  const replayStagger = () => {
    setStaggerCount((c) => c + 1);
    if (prefersReducedMotion || !chipContainerRef.current) return;
    stagger(".effect-pill-node", {
      properties: {
        opacity: [0.25, 1],
        transform: ["translate3d(0, 12px, 0)", "translate3d(0, 0, 0)"],
      },
      stagger: 55,
      duration: 380,
      easing: easings.easeOutCubic,
    });
  };

  return (
    <div className="rounded-2xl border border-purple-500/20 bg-[#07090f] p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Badge variant="glow" size="sm">
          Pointer &amp; Stagger Stage
        </Badge>
        <button
          type="button"
          onClick={replayStagger}
          className="inline-flex items-center gap-1.5 text-xs font-mono text-purple-300 hover:text-white transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Stagger Pills ({staggerCount})
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.07] flex flex-col items-center justify-center gap-2">
          <button
            ref={magRef}
            type="button"
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-xs font-semibold text-white shadow-[0_0_20px_rgba(139,92,246,0.35)] cursor-pointer"
          >
            Magnetic Button
          </button>
          <span className="font-mono text-[10px] text-slate-400">Hover to pull</span>
        </div>

        <div
          ref={tiltRef}
          className="p-4 rounded-xl bg-gradient-to-br from-indigo-950/60 to-[#0e1324] border border-indigo-400/25 flex flex-col items-center justify-center gap-1 cursor-pointer"
        >
          <span className="text-xs font-semibold text-white">3D Tilt Card</span>
          <span className="font-mono text-[10px] text-cyan-300">maxTilt: 12°</span>
        </div>
      </div>

      <div ref={chipContainerRef} className="flex flex-wrap gap-2">
        {["reveal", "stagger", "magnetic", "tilt", "parallax"].map((label) => (
          <span
            key={label}
            className="effect-pill-node px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.08] font-mono text-[11px] text-slate-300"
          >
            {label}()
          </span>
        ))}
      </div>
    </div>
  );
};

const MotionIntelligencePreview: React.FC = () => {
  const [presetMode, setPresetMode] = useState<"fast" | "balanced" | "layout-heavy">("balanced");

  const analysis = useMemo(() => {
    const config =
      presetMode === "fast"
        ? { duration: 180, easing: "easeOutExpo", properties: ["transform", "opacity"] }
        : presetMode === "balanced"
        ? { duration: 480, easing: "easeOutCubic", properties: ["transform", "opacity"] }
        : { duration: 1200, easing: "linear", properties: ["width", "top"] };

    const audit = evaluateMotionQuality({ configuration: config });
    const plan = designToMotionEngine.generateSync({
      naturalLanguage: {
        prompt:
          presetMode === "fast"
            ? "Snappy tooltip micro-reveal"
            : presetMode === "balanced"
            ? "Editorial panel fade and slide entrance"
            : "Heavy layout expansion transition",
      },
    });
    return { audit, plan, config };
  }, [presetMode]);

  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-[#07090f] p-5 flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge variant="emerald" size="sm">
          Deterministic Pipeline Audit
        </Badge>
        <div className="flex items-center gap-1.5">
          {(["fast", "balanced", "layout-heavy"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setPresetMode(mode)}
              className={`px-2.5 py-1 rounded-md font-mono text-[11px] border transition-colors cursor-pointer ${
                presetMode === mode
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/40"
                  : "bg-white/[0.03] text-slate-400 border-white/[0.08] hover:text-white"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.07]">
          <div className="font-mono text-[10px] text-slate-400 uppercase">Overall</div>
          <div className="text-xl font-bold text-white mt-0.5">{analysis.audit.scores.overall}</div>
        </div>
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.07]">
          <div className="font-mono text-[10px] text-slate-400 uppercase">Grade</div>
          <div className="text-xl font-bold text-emerald-400 mt-0.5">{analysis.audit.grade}</div>
        </div>
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.07]">
          <div className="font-mono text-[10px] text-slate-400 uppercase">Findings</div>
          <div className="text-xl font-bold text-cyan-300 mt-0.5">
            {analysis.audit.findings.length}
          </div>
        </div>
      </div>

      <div className="text-xs font-mono text-slate-300 bg-white/[0.02] border border-white/[0.06] rounded-lg px-3 py-2 flex items-center justify-between gap-2">
        <span className="truncate">
          Design Plan Elements: {analysis.plan.plan?.elementPlans?.length ?? 0}
        </span>
        <span className="text-emerald-400 shrink-0">0 Network / 0 LLM Calls</span>
      </div>
    </div>
  );
};

const DNA_PROFILES = ["snappy", "energetic", "calm", "cinematic", "minimal", "playful"] as const;

const DesignSystemPreview: React.FC = () => {
  const palettes = useMemo(() => {
    return listPalettes()
      .slice(0, 4)
      .map((name) => getPalette(name))
      .filter((p): p is NonNullable<ReturnType<typeof getPalette>> => Boolean(p));
  }, []);
  const presets = useMemo(() => listPresets(), []);

  return (
    <div className="rounded-2xl border border-indigo-500/20 bg-[#07090f] p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Badge variant="glow" size="sm">
          6 Motion DNA Profiles · {presets.length} Presets
        </Badge>
        <span className="font-mono text-[11px] text-slate-400">33 Built-in Palettes</span>
      </div>

      {/* Motion DNA Comparison */}
      <div className="space-y-2">
        {DNA_PROFILES.map((name) => {
          const dna = getMotionDNA(name);
          const duration = dna?.duration ?? 300;
          const scaleWidth = Math.min(Math.max(Math.round((duration / 900) * 100), 18), 96);
          return (
            <div key={name} className="flex items-center gap-3 text-xs">
              <span className="w-20 font-mono text-slate-300 shrink-0">{name}</span>
              <div className="flex-1 h-2 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400"
                  style={{ width: `${scaleWidth}%` }}
                />
              </div>
              <span className="font-mono text-[10px] text-slate-400 w-16 text-right shrink-0">
                {duration}ms
              </span>
            </div>
          );
        })}
      </div>

      {/* Built-in Palette Sample Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/[0.06]">
        {palettes.map((pal) => (
          <div
            key={pal.name}
            className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.07] flex flex-col gap-1.5"
          >
            <div className="flex items-center gap-1">
              {Object.values(pal.tokens)
                .slice(0, 4)
                .map((hex, i) => (
                  <span
                    key={i}
                    className="w-3 h-3 rounded-sm border border-white/15"
                    style={{ backgroundColor: String(hex) }}
                  />
                ))}
            </div>
            <span className="font-mono text-[10px] text-slate-300 truncate">{pal.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const ThreeGpuPreview: React.FC = () => {
  const { prefersReducedMotion } = useWebsiteMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const [shaderActive, setShaderActive] = useState(true);

  useEffect(() => {
    if (prefersReducedMotion || !shaderActive || !stageRef.current) return;
    const controls = aurora(stageRef.current, { speed: 6, opacity: 0.65, waveCount: 3 });
    return () => {
      controls?.destroy?.();
    };
  }, [prefersReducedMotion, shaderActive]);

  return (
    <div className="rounded-2xl border border-sky-500/20 bg-[#07090f] p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Badge variant="cyan" size="sm">
          GPU Aurora Canvas Preview
        </Badge>
        <button
          type="button"
          onClick={() => setShaderActive((v) => !v)}
          className="font-mono text-[11px] text-sky-300 hover:text-white cursor-pointer"
        >
          {shaderActive ? "Pause Canvas" : "Resume Canvas"}
        </button>
      </div>

      <div
        ref={stageRef}
        className="h-36 rounded-xl border border-white/[0.08] bg-gradient-to-br from-indigo-950/70 via-[#0a1020] to-cyan-950/60 flex flex-col items-center justify-center relative overflow-hidden p-4 text-center"
      >
        <span className="text-xs font-semibold text-white relative z-10">
          {prefersReducedMotion
            ? "Reduced-Motion Static Atmosphere"
            : "aurora() Procedural Background Active"}
        </span>
        <span className="font-mono text-[10px] text-sky-300 relative z-10 mt-1">
          Auto teardown via controls.destroy()
        </span>
      </div>

      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
        <span>Subpaths: af-motion · af-motion/react</span>
        <a href="#playground/three-gpu-showcase" className="text-cyan-400 hover:underline">
          Launch 3D Scene Lab →
        </a>
      </div>
    </div>
  );
};

const SUBPATHS = [
  {
    name: "af-motion",
    desc: "Zero-dep DOM animations, curves, springs, effects, palettes & backgrounds",
    exportsHint: "animate · easings · animateSpring · createTimeline · reveal · stagger",
  },
  {
    name: "af-motion/react",
    desc: "Optional React 18/19 SSR-safe hooks & components with \"use client\"",
    exportsHint: "Reveal · Interactive · useAnimate · useInView · useMotionAccessibility",
  },
  {
    name: "af-motion/catalogue",
    desc: "AI Motion Intelligence, Design-to-Motion, Scene Gen & Workflows",
    exportsHint: "evaluateMotionQuality · designToMotionEngine · aiSceneGenerationEngine",
  },
  {
    name: "af-motion/presets",
    desc: "39 categorized presets & design system token resolution",
    exportsHint: "listPresets · applyPreset · MOTION_PRESET_CATEGORIES",
  },
] as const;

const FrameworkIntegrationsPreview: React.FC = () => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const current = SUBPATHS[selectedIdx];

  return (
    <div className="rounded-2xl border border-amber-500/20 bg-[#07090f] p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Badge variant="default" size="sm">
          4 Official ESM Subpaths
        </Badge>
        <span className="inline-flex items-center gap-1 font-mono text-[11px] text-emerald-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          SSR &amp; Strict Mode Safe
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {SUBPATHS.map((sp, idx) => (
          <button
            key={sp.name}
            type="button"
            onClick={() => setSelectedIdx(idx)}
            className={`px-3 py-2 rounded-lg text-left font-mono text-xs border transition-colors cursor-pointer ${
              selectedIdx === idx
                ? "bg-indigo-600/20 border-indigo-400/50 text-white"
                : "bg-white/[0.02] border-white/[0.07] text-slate-400 hover:text-white"
            }`}
          >
            {sp.name}
          </button>
        ))}
      </div>

      <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.07] space-y-1.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-white">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span>{current.desc}</span>
        </div>
        <div className="font-mono text-[11px] text-cyan-300">{current.exportsHint}</div>
      </div>
    </div>
  );
};
