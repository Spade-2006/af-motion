import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  animate,
  applyMotionDNA,
  getEasing,
  getMotionDNA,
  easings,
} from "af-motion";
import { DemoWorkspace } from "../components/DemoWorkspace";
import { ControlSection, SelectControl } from "../components/ControlPanel";
import { Badge } from "@/components/ui/Badge";
import type { DemoComponentProps } from "../types";

const DNA_NAMES = [
  "snappy",
  "energetic",
  "calm",
  "cinematic",
  "minimal",
  "playful",
] as const;

type DNAId = (typeof DNA_NAMES)[number];

export const MotionDNADemo: React.FC<DemoComponentProps> = ({
  playNonce,
  resetNonce,
  isPaused,
  onCodeChange,
  onStatusChange,
}) => {
  const [primaryDna, setPrimaryDna] = useState<DNAId>("energetic");
  const [compareDna, setCompareDna] = useState<DNAId>("calm");

  const cardARef = useRef<HTMLDivElement>(null);
  const cardBRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (resetNonce === 0) return;
    setPrimaryDna("energetic");
    setCompareDna("calm");
  }, [resetNonce]);

  const primaryProfile = useMemo(() => getMotionDNA(primaryDna), [primaryDna]);
  const compareProfile = useMemo(() => getMotionDNA(compareDna), [compareDna]);

  // Run identical entrance motion governed by primary vs compare Motion DNA
  useEffect(() => {
    if (isPaused) return;
    const elA = cardARef.current;
    const elB = cardBRef.current;
    if (!elA || !elB) return;

    const optsA = applyMotionDNA(primaryDna);
    const optsB = applyMotionDNA(compareDna);

    const resolveFn = (e: unknown) =>
      typeof e === "function"
        ? (e as (t: number) => number)
        : typeof e === "string"
        ? getEasing(e) || easings.easeOutQuad
        : easings.easeOutQuad;

    const animA = animate(
      elA,
      {
        opacity: [0.2, 1],
        transform: ["translate3d(-45px, 0, 0) scale(0.9)", "translate3d(45px, 0, 0) scale(1)"],
      },
      {
        duration: optsA.duration ?? 350,
        easing: resolveFn(optsA.easing),
      }
    );

    const animB = animate(
      elB,
      {
        opacity: [0.2, 1],
        transform: ["translate3d(-45px, 0, 0) scale(0.9)", "translate3d(45px, 0, 0) scale(1)"],
      },
      {
        duration: optsB.duration ?? 350,
        easing: resolveFn(optsB.easing),
      }
    );

    return () => {
      animA.cancel();
      animB.cancel();
    };
  }, [primaryDna, compareDna, playNonce, isPaused]);

  // Update code inspector
  useEffect(() => {
    const code = `import { animate, applyMotionDNA, getMotionDNA } from "af-motion";

// Retrieve full profile metadata from the AF Motion DNA registry
const profile = getMotionDNA("${primaryDna}");

// Apply resolved timing & easing options to an animation call
const options = applyMotionDNA("${primaryDna}");

const controls = animate(
  element,
  {
    opacity: [0, 1],
    transform: ["translate3d(-45px, 0, 0)", "translate3d(45px, 0, 0)"],
  },
  options
);`;
    onCodeChange(code);
    onStatusChange?.(`Motion DNA · Primary: ${primaryDna} (${primaryProfile?.duration ?? 0}ms)`);
  }, [primaryDna, primaryProfile, onCodeChange, onStatusChange]);

  return (
    <DemoWorkspace
      controlsTitle="DNA Personalities"
      stage={
        <div className="flex-1 flex flex-col justify-between gap-5">
          {/* Side-by-Side Comparison Stage */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 items-center">
            {/* Primary Track */}
            <div className="rounded-xl bg-[#090b12] border border-cyan-500/30 p-5 flex flex-col items-center justify-between h-52">
              <div className="flex items-center justify-between w-full">
                <Badge variant="cyan" size="sm">
                  {primaryDna}
                </Badge>
                <span className="font-mono text-[11px] text-slate-400">
                  {primaryProfile?.duration}ms
                </span>
              </div>

              <div
                ref={cardARef}
                className="w-24 h-16 rounded-xl bg-gradient-to-tr from-cyan-500/30 to-indigo-600/30 border border-cyan-400/50 flex items-center justify-center font-mono text-xs text-white shadow-[0_0_20px_rgba(56,189,248,0.25)]"
              >
                DNA A
              </div>

              <div className="w-full text-center font-mono text-[10px] text-slate-500 truncate">
                {String(primaryProfile?.easing ?? "linear")} · k={primaryProfile?.characteristics?.spring?.stiffness ?? 200}
              </div>
            </div>

            {/* Comparison Track */}
            <div className="rounded-xl bg-[#090b12] border border-indigo-500/30 p-5 flex flex-col items-center justify-between h-52">
              <div className="flex items-center justify-between w-full">
                <Badge variant="glow" size="sm">
                  {compareDna}
                </Badge>
                <span className="font-mono text-[11px] text-slate-400">
                  {compareProfile?.duration}ms
                </span>
              </div>

              <div
                ref={cardBRef}
                className="w-24 h-16 rounded-xl bg-gradient-to-tr from-indigo-500/30 to-purple-600/30 border border-indigo-400/50 flex items-center justify-center font-mono text-xs text-white shadow-[0_0_20px_rgba(99,102,241,0.25)]"
              >
                DNA B
              </div>

              <div className="w-full text-center font-mono text-[10px] text-slate-500 truncate">
                {String(compareProfile?.easing ?? "linear")} · k={compareProfile?.characteristics?.spring?.stiffness ?? 140}
              </div>
            </div>
          </div>

          {/* Primary Profile Inspection Card */}
          {primaryProfile && (
            <div className="rounded-xl bg-[#0a0d16] border border-white/[0.08] p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white capitalize">
                  {primaryProfile.name} Personality
                </span>
                <span className="font-mono text-[11px] text-cyan-300">
                  id: {primaryProfile.id}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {primaryProfile.description}
              </p>
            </div>
          )}
        </div>
      }
      controls={
        <>
          <ControlSection title="Switch Primary Profile">
            <div className="grid grid-cols-2 gap-2">
              {DNA_NAMES.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPrimaryDna(id)}
                  className={`px-3 py-2 rounded-lg font-mono text-xs capitalize transition-all cursor-pointer border ${
                    primaryDna === id
                      ? "bg-cyan-500/20 text-cyan-200 border-cyan-400/50 shadow"
                      : "bg-white/[0.03] text-slate-400 border-white/[0.06] hover:text-white"
                  }`}
                >
                  {id}
                </button>
              ))}
            </div>
          </ControlSection>

          <ControlSection title="Comparison Target">
            <SelectControl
              id="dna-compare"
              label="Compare Against Profile"
              value={compareDna}
              options={DNA_NAMES.map((id) => ({
                value: id,
                label: id.charAt(0).toUpperCase() + id.slice(1),
              }))}
              onChange={(v) => setCompareDna(v as DNAId)}
            />
          </ControlSection>
        </>
      }
    />
  );
};

export default MotionDNADemo;
