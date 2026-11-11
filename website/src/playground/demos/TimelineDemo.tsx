import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  animateProgress,
  createTimeline,
  easings,
  type AnimationTimelineControls,
} from "af-motion";
import { DemoWorkspace } from "../components/DemoWorkspace";
import {
  ControlSection,
  SelectControl,
  SliderControl,
} from "../components/ControlPanel";
import type { DemoComponentProps } from "../types";

type EasingKey = keyof typeof easings;
const EASING_KEYS = Object.keys(easings) as EasingKey[];

interface TrackConfig {
  readonly id: string;
  readonly label: string;
  readonly startOffset: number;
  readonly duration: number;
  readonly easing: EasingKey;
  readonly color: string;
}

const DEFAULT_TRACKS: readonly TrackConfig[] = [
  {
    id: "badge",
    label: "1. Badge Pill",
    startOffset: 0,
    duration: 420,
    easing: "easeOutExpo",
    color: "bg-cyan-500",
  },
  {
    id: "card",
    label: "2. Main Card",
    startOffset: 160,
    duration: 540,
    easing: "easeOutCubic",
    color: "bg-indigo-500",
  },
  {
    id: "orb",
    label: "3. Accent Ring",
    startOffset: 320,
    duration: 480,
    easing: "easeOutBack",
    color: "bg-purple-500",
  },
];

export const TimelineDemo: React.FC<DemoComponentProps> = ({
  playNonce,
  resetNonce,
  isPaused,
  onCodeChange,
  onStatusChange,
}) => {
  const [tracks, setTracks] = useState<readonly TrackConfig[]>(DEFAULT_TRACKS);
  const [playheadMs, setPlayheadMs] = useState(0);

  const track0Ref = useRef<HTMLDivElement>(null);
  const track1Ref = useRef<HTMLDivElement>(null);
  const track2Ref = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<AnimationTimelineControls | null>(null);

  const totalDuration = useMemo(
    () => Math.max(...tracks.map((t) => t.startOffset + t.duration), 500),
    [tracks]
  );

  useEffect(() => {
    if (resetNonce === 0) return;
    setTracks(DEFAULT_TRACKS);
    setPlayheadMs(0);
  }, [resetNonce]);

  // Execute real AF Motion createTimeline() sequence
  useEffect(() => {
    const els = [track0Ref.current, track1Ref.current, track2Ref.current];
    if (els.some((el) => !el)) return;

    timelineRef.current?.cancel();

    const tl = createTimeline();
    // Prevent AbortError unhandled rejection when timeline is cancelled on unmount/rebuild
    tl.finished.catch(() => {});

    tl.add({
      at: tracks[0].startOffset,
      target: els[0]!,
      properties: {
        opacity: [0, 1],
        transform: ["translate3d(-30px, 0, 0) scale(0.9)", "translate3d(0, 0, 0) scale(1)"],
      },
      options: {
        duration: tracks[0].duration,
        easing: easings[tracks[0].easing],
      },
    })
      .add({
        at: tracks[1].startOffset,
        target: els[1]!,
        properties: {
          opacity: [0, 1],
          transform: ["translate3d(0, 26px, 0) scale(0.94)", "translate3d(0, 0, 0) scale(1)"],
        },
        options: {
          duration: tracks[1].duration,
          easing: easings[tracks[1].easing],
        },
      })
      .add({
        at: tracks[2].startOffset,
        target: els[2]!,
        properties: {
          opacity: [0, 1],
          transform: ["translate3d(30px, 0, 0) scale(0.8)", "translate3d(0, 0, 0) scale(1)"],
        },
        options: {
          duration: tracks[2].duration,
          easing: easings[tracks[2].easing],
        },
      });

    timelineRef.current = tl;
    if (!isPaused) {
      tl.play();
    }

    // Track visual playhead progression synchronized to timeline span
    const headAnim = animateProgress({
      duration: totalDuration,
      easing: easings.linear,
      onUpdate: (p) => {
        setPlayheadMs(Math.round(p * totalDuration));
      },
    });
    if (isPaused) {
      headAnim.pause();
    }

    return () => {
      headAnim.cancel();
      tl.cancel();
    };
  }, [tracks, playNonce]);

  useEffect(() => {
    if (!timelineRef.current) return;
    if (isPaused) {
      timelineRef.current.pause();
    } else {
      timelineRef.current.resume();
    }
  }, [isPaused]);

  const handleSeek = (ms: number) => {
    setPlayheadMs(ms);
    timelineRef.current?.seek(ms);
  };

  // Emit generated TS code
  useEffect(() => {
    const code = `import { createTimeline, easings } from "af-motion";

const timeline = createTimeline()
  .add({
    at: ${tracks[0].startOffset},
    target: ".track-badge",
    properties: { opacity: [0, 1], transform: ["translate3d(-30px, 0, 0)", "translate3d(0, 0, 0)"] },
    options: { duration: ${tracks[0].duration}, easing: easings.${tracks[0].easing} },
  })
  .add({
    at: ${tracks[1].startOffset},
    target: ".track-card",
    properties: { opacity: [0, 1], transform: ["translate3d(0, 26px, 0)", "translate3d(0, 0, 0)"] },
    options: { duration: ${tracks[1].duration}, easing: easings.${tracks[1].easing} },
  })
  .add({
    at: ${tracks[2].startOffset},
    target: ".track-orb",
    properties: { opacity: [0, 1], transform: ["translate3d(30px, 0, 0)", "translate3d(0, 0, 0)"] },
    options: { duration: ${tracks[2].duration}, easing: easings.${tracks[2].easing} },
  });

timeline.play();`;
    onCodeChange(code);
    onStatusChange?.(`createTimeline() · 3 Tracks · ${totalDuration}ms total`);
  }, [tracks, totalDuration, onCodeChange, onStatusChange]);

  const updateTrack = (index: number, patch: Partial<TrackConfig>) => {
    setTracks((prev) =>
      prev.map((t, i) => (i === index ? { ...t, ...patch } : t))
    );
  };

  return (
    <DemoWorkspace
      controlsTitle="Track Offsets & Timing"
      stage={
        <div className="flex-1 flex flex-col justify-between gap-5">
          {/* Choreographed Elements Preview */}
          <div className="flex flex-col items-center justify-center gap-4 py-4">
            <div
              ref={track0Ref}
              className="px-3.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/40 font-mono text-[11px] text-cyan-300"
            >
              Step 1 · Choreographed Header
            </div>

            <div className="flex items-center gap-4">
              <div
                ref={track1Ref}
                className="w-44 p-4 rounded-xl bg-[#111524] border border-indigo-500/40 shadow-lg text-center"
              >
                <div className="text-xs font-bold text-white">Step 2 · Card Body</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Offset +{tracks[1].startOffset}ms</div>
              </div>

              <div
                ref={track2Ref}
                className="w-16 h-16 rounded-2xl bg-purple-600/25 border border-purple-400/40 flex items-center justify-center font-mono text-xs text-purple-300"
              >
                Step 3
              </div>
            </div>
          </div>

          {/* Multi-Track Visual Timeline Bars */}
          <div className="rounded-xl bg-[#090b12] border border-white/[0.08] p-4 space-y-2.5 relative">
            <div className="flex items-center justify-between font-mono text-[10px] text-slate-500 pb-1">
              <span>0ms</span>
              <span>Playhead: {playheadMs}ms</span>
              <span>{totalDuration}ms</span>
            </div>

            {tracks.map((track) => {
              const leftPct = (track.startOffset / totalDuration) * 100;
              const widthPct = (track.duration / totalDuration) * 100;
              return (
                <div key={track.id} className="space-y-1">
                  <div className="flex justify-between font-mono text-[10px] text-slate-400">
                    <span>{track.label}</span>
                    <span>
                      {track.startOffset}ms → {track.startOffset + track.duration}ms ({track.easing})
                    </span>
                  </div>
                  <div className="w-full h-3 rounded bg-white/[0.05] relative overflow-hidden">
                    <div
                      style={{
                        left: `${leftPct}%`,
                        width: `${widthPct}%`,
                      }}
                      className={`absolute inset-y-0 rounded ${track.color} opacity-80`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      }
      footer={
        <div className="flex items-center gap-3">
          <label htmlFor="tl-seek" className="font-mono text-[11px] text-slate-400 shrink-0">
            Scrub Seek:
          </label>
          <input
            id="tl-seek"
            type="range"
            min={0}
            max={totalDuration}
            step={10}
            value={Math.min(playheadMs, totalDuration)}
            onChange={(e) => handleSeek(Number(e.target.value))}
            className="w-full h-1.5 rounded-full bg-white/[0.1] appearance-none cursor-pointer accent-cyan-400"
          />
          <span className="font-mono text-[11px] text-cyan-300 w-14 text-right">
            {playheadMs}ms
          </span>
        </div>
      }
      controls={
        <>
          {tracks.map((track, idx) => (
            <ControlSection key={track.id} title={track.label}>
              <SliderControl
                id={`tl-off-${idx}`}
                label="Start Offset"
                value={track.startOffset}
                min={0}
                max={600}
                step={20}
                unit="ms"
                onChange={(v) => updateTrack(idx, { startOffset: v })}
              />
              <SliderControl
                id={`tl-dur-${idx}`}
                label="Duration"
                value={track.duration}
                min={200}
                max={900}
                step={20}
                unit="ms"
                onChange={(v) => updateTrack(idx, { duration: v })}
              />
              <SelectControl
                id={`tl-ease-${idx}`}
                label="Easing"
                value={track.easing}
                options={EASING_KEYS.map((k) => ({ value: k, label: k }))}
                onChange={(v) => updateTrack(idx, { easing: v as EasingKey })}
              />
            </ControlSection>
          ))}
        </>
      }
    />
  );
};

export default TimelineDemo;
