import React, { useState } from "react";
import { Reveal, Interactive, useMotionAccessibility } from "af-motion/react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CodeInspector } from "@/playground/components/CodeInspector";
import { REACT_INTEGRATION_CODE } from "../data/onboardingData";
import { ShieldCheck, Atom, RefreshCw } from "lucide-react";

export interface ReactIntegrationStepProps {
  readonly onExploreReact?: () => void;
}

export const ReactIntegrationStep: React.FC<ReactIntegrationStepProps> = ({
  onExploreReact,
}) => {
  const [remountKey, setRemountKey] = useState(0);
  const { isAccessible, accessibilityScore, respectsReducedMotion } =
    useMotionAccessibility({
      duration: 450,
      property: "transform",
    });

  return (
    <Card variant="elevated" className="p-6 sm:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Badge variant="glow" size="sm" className="mb-2">
            Step 3 · React 18 &amp; 19 Integration
          </Badge>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            SSR Boundaries, Hooks &amp; Strict Mode Cleanup
          </h2>
        </div>

        <Button
          variant="secondary"
          size="sm"
          iconLeading={<RefreshCw className="w-3.5 h-3.5 text-cyan-400" />}
          onClick={() => {
            setRemountKey((k) => k + 1);
            onExploreReact?.();
          }}
        >
          Remount Component
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7">
          <CodeInspector tsCode={REACT_INTEGRATION_CODE} subpath="af-motion/react" />
        </div>

        <div className="lg:col-span-5 flex flex-col justify-between gap-4 rounded-2xl bg-[#07090f] border border-white/[0.08] p-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 font-mono text-xs text-sky-300">
                <Atom className="w-4 h-4" />
                Live React Bindings
              </span>
              <span className="inline-flex items-center gap-1 font-mono text-[11px] text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                Score {accessibilityScore}
              </span>
            </div>

            <Reveal key={remountKey} direction="up" duration={450}>
              <Interactive category="card" className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.1] space-y-2">
                <div className="text-sm font-semibold text-white">
                  &lt;Reveal /&gt; + &lt;Interactive /&gt;
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  useMotionAccessibility reports:{" "}
                  <code className="text-cyan-300">
                    isAccessible={String(isAccessible)}
                  </code>
                  ,{" "}
                  <code className="text-cyan-300">
                    respectsReducedMotion={String(respectsReducedMotion)}
                  </code>
                  .
                </p>
              </Interactive>
            </Reveal>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1.5 text-xs text-slate-400">
            <div className="font-mono text-[11px] uppercase tracking-wider text-indigo-300">
              Integration Checklist
            </div>
            <p>
              • Add <code className="text-amber-300">&quot;use client&quot;;</code> at the top of Next.js App Router client components.
            </p>
            <p>
              • Always return <code className="text-cyan-300">() =&gt; controls.cancel()</code> in imperative <code className="text-cyan-300">useEffect</code> hooks for React 18/19 Strict Mode double-mount safety.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};
