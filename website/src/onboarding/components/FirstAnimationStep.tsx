import React, { useRef, useState } from "react";
import { animate, easings } from "af-motion";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CodeInspector } from "@/playground/components/CodeInspector";
import { useWebsiteMotion } from "@/app/providers/MotionProvider";
import { FIRST_ANIMATION_CODE } from "../data/onboardingData";
import { Play, Sparkles } from "lucide-react";

export interface FirstAnimationStepProps {
  readonly onRunFirstAnimation?: () => void;
}

export const FirstAnimationStep: React.FC<FirstAnimationStepProps> = ({
  onRunFirstAnimation,
}) => {
  const { prefersReducedMotion } = useWebsiteMotion();
  const targetRef = useRef<HTMLDivElement>(null);
  const [executions, setExecutions] = useState(0);

  const handleRun = () => {
    setExecutions((n) => n + 1);
    onRunFirstAnimation?.();
    if (prefersReducedMotion || !targetRef.current) return;

    animate(
      targetRef.current,
      {
        opacity: [0.35, 1],
        transform: [
          "translate3d(0, 20px, 0) scale(0.95)",
          "translate3d(0, 0, 0) scale(1)",
        ],
      },
      {
        duration: 550,
        easing: easings.easeOutExpo,
      }
    );
  };

  return (
    <Card variant="elevated" className="p-6 sm:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Badge variant="emerald" size="sm" className="mb-2">
            Step 2 · Your First Animation
          </Badge>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Target, Keyframes, Timing &amp; Execution
          </h2>
        </div>

        <Button
          variant="cyan"
          size="sm"
          iconLeading={<Play className="w-3.5 h-3.5" />}
          onClick={handleRun}
        >
          Run First Animation
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7">
          <CodeInspector tsCode={FIRST_ANIMATION_CODE} subpath="af-motion" />
        </div>

        <div className="lg:col-span-5 rounded-2xl bg-[#07090f] border border-white/[0.08] p-5 flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Live Target Preview</span>
            <span className="text-cyan-300">Executions: {executions}</span>
          </div>

          <div className="h-44 rounded-xl bg-cyber-grid border border-white/[0.06] flex items-center justify-center p-4">
            <div
              ref={targetRef}
              className="w-full max-w-[230px] p-4 rounded-xl bg-[#0c101b] border border-cyan-400/30 shadow-[0_12px_30px_rgba(6,182,212,0.18)] flex items-center gap-3 will-change-transform"
            >
              <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Welcome Card</div>
                <div className="font-mono text-[10px] text-slate-400">
                  550ms · easeOutExpo
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Notice that only GPU-composited <code className="text-cyan-300">transform</code> and{" "}
            <code className="text-cyan-300">opacity</code> are animated to avoid layout recalculation.
          </p>
        </div>
      </div>
    </Card>
  );
};
