import React from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ArrowRight, Play, BookOpen } from "lucide-react";

export const FeatureCTA: React.FC = () => {
  return (
    <section className="py-12 sm:py-16 border-t border-white/[0.06]">
      <PageContainer maxWidth="2xl">
        <Card variant="glow" className="p-8 sm:p-12 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <Badge variant="cyan" size="sm">
              Ready to Integrate
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Install AF Motion and Ship Your First Sequence in Minutes
            </h2>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
              Follow the 6-step interactive onboarding guide or jump straight into live
              parameter experimentation inside the Playground.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button
              variant="primary"
              size="md"
              iconTrailing={<ArrowRight className="w-4 h-4" />}
              onClick={() => {
                window.location.hash = "#onboarding";
              }}
            >
              Developer Onboarding
            </Button>
            <Button
              variant="secondary"
              size="md"
              iconLeading={<Play className="w-4 h-4 text-cyan-400" />}
              onClick={() => {
                window.location.hash = "#playground";
              }}
            >
              Open Playground
            </Button>
            <Button
              variant="outline"
              size="md"
              iconLeading={<BookOpen className="w-4 h-4" />}
              onClick={() => {
                window.location.hash = "#examples";
              }}
            >
              Examples
            </Button>
          </div>
        </Card>
      </PageContainer>
    </section>
  );
};
