import React from "react";
import { Play, RotateCcw, Pause, Copy, Check, Code2, Eye } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { DemoDefinition } from "../types";
import { useCopyCode } from "../hooks/useCopyCode";
import { cn } from "@/utils/cn";

export type PlaygroundViewMode = "split" | "preview" | "code";

export interface PlaygroundToolbarProps {
  readonly demo: DemoDefinition;
  readonly statusText?: string;
  readonly isPaused: boolean;
  readonly viewMode: PlaygroundViewMode;
  readonly currentCode: string;
  readonly onRun: () => void;
  readonly onTogglePause: () => void;
  readonly onReset: () => void;
  readonly onViewModeChange: (mode: PlaygroundViewMode) => void;
}

export const PlaygroundToolbar: React.FC<PlaygroundToolbarProps> = ({
  demo,
  statusText,
  isPaused,
  viewMode,
  currentCode,
  onRun,
  onTogglePause,
  onReset,
  onViewModeChange,
}) => {
  const { copied, copy } = useCopyCode();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-[#0d1018]/90 border border-white/[0.08] backdrop-blur-md">
      {/* Left: Title, Category & Live Status */}
      <div className="flex flex-wrap items-center gap-2.5 min-w-0">
        <Badge variant="glow" size="sm">
          {demo.category}
        </Badge>
        <h2 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
          {demo.title}
        </h2>
        {statusText && (
          <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.07] font-mono text-[10px] text-cyan-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {statusText}
          </span>
        )}
      </div>

      {/* Right: Playback & View Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="primary"
          size="sm"
          iconLeading={<Play className="w-3.5 h-3.5 fill-current" />}
          onClick={onRun}
        >
          Run / Replay
        </Button>

        <button
          type="button"
          onClick={onTogglePause}
          aria-pressed={isPaused}
          title={isPaused ? "Resume loop" : "Pause loop"}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400",
            isPaused
              ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
              : "bg-white/[0.05] hover:bg-white/[0.09] border-white/[0.1] text-slate-300"
          )}
        >
          <Pause className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{isPaused ? "Paused" : "Pause"}</span>
        </button>

        <button
          type="button"
          onClick={onReset}
          title="Reset parameters"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.1] text-xs font-medium text-slate-300 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </button>

        <button
          type="button"
          onClick={() => copy(currentCode)}
          title="Copy snippet"
          aria-label="Copy current example code"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.1] text-xs font-medium text-slate-300 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
          <span className="hidden xl:inline">{copied ? "Copied" : "Copy"}</span>
        </button>

        {/* Preview / Split / Code Toggle */}
        <div
          role="group"
          aria-label="Workspace view mode"
          className="inline-flex rounded-lg bg-[#080a10] p-0.5 border border-white/[0.08]"
        >
          {(
            [
              { id: "split", label: "Split" },
              { id: "preview", label: "Preview", icon: <Eye className="w-3 h-3" /> },
              { id: "code", label: "Code", icon: <Code2 className="w-3 h-3" /> },
            ] as const
          ).map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => onViewModeChange(mode.id)}
              className={cn(
                "inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer",
                viewMode === mode.id
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              )}
            >
              {"icon" in mode && mode.icon}
              <span>{mode.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
