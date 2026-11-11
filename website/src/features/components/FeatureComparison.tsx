import React from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { FEATURE_COMPARISONS } from "../data/featureCatalog";

export const FeatureComparison: React.FC = () => {
  return (
    <section
      aria-label="Architectural Comparisons"
      className="py-14 sm:py-20 border-t border-white/[0.06]"
    >
      <PageContainer maxWidth="2xl">
        <div className="max-w-3xl mb-10">
          <Badge variant="glow" size="sm" className="mb-3">
            Architecture Tradeoffs
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
            Choose the Right Abstraction Level
          </h2>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            AF Motion avoids a one-size-fits-all abstraction. Mix low-level imperative
            controls, declarative React hooks, unified Motion DNA, and offline AI
            tooling wherever each fits best.
          </p>
        </div>

        <div className="space-y-4">
          {FEATURE_COMPARISONS.map((row) => (
            <Card key={row.dimension} variant="elevated" className="p-5 sm:p-6">
              <div className="font-mono text-xs uppercase tracking-wider text-cyan-400 mb-4">
                {row.dimension}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2">
                  <h3 className="text-base font-bold text-white">{row.leftTitle}</h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {row.leftSummary}
                  </p>
                  <p className="text-xs font-mono text-slate-400 pt-1">
                    Best for: {row.leftWhenToUse}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20 space-y-2">
                  <h3 className="text-base font-bold text-white">{row.rightTitle}</h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {row.rightSummary}
                  </p>
                  <p className="text-xs font-mono text-indigo-300 pt-1">
                    Best for: {row.rightWhenToUse}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </PageContainer>
    </section>
  );
};
