import React from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CHECKLIST_MILESTONES } from "../data/onboardingData";
import { CheckCircle2, Circle, RotateCcw, ArrowUpRight } from "lucide-react";

export interface OnboardingChecklistProps {
  readonly completedIds: readonly string[];
  readonly onToggle: (id: string) => void;
  readonly onReset: () => void;
}

export const OnboardingChecklist: React.FC<OnboardingChecklistProps> = ({
  completedIds,
  onToggle,
  onReset,
}) => {
  const total = CHECKLIST_MILESTONES.length;
  const completedCount = CHECKLIST_MILESTONES.filter((m) =>
    completedIds.includes(m.id)
  ).length;
  const percent = Math.round((completedCount / total) * 100);

  return (
    <Card variant="glow" className="p-5 sm:p-6 space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Badge variant="emerald" size="sm" className="mb-2">
            Optional Local Progress
          </Badge>
          <h3 className="text-lg font-bold text-white">Onboarding Checklist</h3>
          <p className="text-xs text-slate-400 mt-1">
            Saved locally in your browser only. Never blocks docs or playground access.
          </p>
        </div>

        <button
          type="button"
          onClick={onReset}
          aria-label="Reset onboarding progress"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-mono text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      {/* Accessible Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-300">
            {completedCount} of {total} completed
          </span>
          <span className="text-emerald-400">{percent}%</span>
        </div>
        <div
          role="progressbar"
          aria-label="Onboarding completion progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          className="h-2 w-full rounded-full bg-white/[0.08] overflow-hidden"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Milestone List */}
      <ul className="space-y-2.5">
        {CHECKLIST_MILESTONES.map((item) => {
          const isDone = completedIds.includes(item.id);
          return (
            <li
              key={item.id}
              className={`rounded-xl border p-3 transition-colors ${
                isDone
                  ? "bg-emerald-500/[0.06] border-emerald-400/30"
                  : "bg-white/[0.02] border-white/[0.07]"
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={isDone}
                  aria-label={`Toggle milestone: ${item.label}`}
                  onClick={() => onToggle(item.id)}
                  className="mt-0.5 text-slate-300 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded cursor-pointer shrink-0"
                >
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-500" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-sm font-medium ${
                        isDone ? "text-emerald-200 line-through decoration-emerald-400/50" : "text-white"
                      }`}
                    >
                      {item.label}
                    </span>
                    <a
                      href={item.actionHref}
                      className="inline-flex items-center gap-0.5 font-mono text-[10px] text-cyan-400 hover:underline shrink-0"
                    >
                      <span>{item.actionLabel}</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </a>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                    {item.description}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
};
