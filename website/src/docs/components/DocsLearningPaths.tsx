import React from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DEVELOPER_LEARNING_PATHS, getArticleBySlug } from "../data/docsBridge";
import { ArrowRight, Play, Compass } from "lucide-react";

export interface DocsLearningPathsProps {
  readonly onSelectArticle: (slug: string) => void;
}

export const DocsLearningPaths: React.FC<DocsLearningPathsProps> = ({
  onSelectArticle,
}) => {
  return (
    <section aria-label="Developer Learning Paths" className="space-y-5">
      <div>
        <Badge variant="emerald" size="sm" className="mb-2">
          Suggested Learning Order
        </Badge>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">
          Structured Developer Learning Paths
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Curated progressions connecting canonical Docs guides, Onboarding steps,
          and interactive Playground labs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {DEVELOPER_LEARNING_PATHS.map((track) => (
          <Card key={track.id} variant="elevated" className="p-6 flex flex-col gap-4">
            <div>
              <Badge variant={track.accent} size="sm" className="mb-2">
                Suggested Sequence
              </Badge>
              <h3 className="text-lg font-bold text-white">{track.level}</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {track.subtitle}
              </p>
            </div>

            <ol className="space-y-2.5 pt-2 border-t border-white/[0.06]">
              {track.steps.map((step) => {
                const realArticle = getArticleBySlug(step.docSlug);
                return (
                  <li
                    key={`${track.id}-${step.stepNumber}`}
                    className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.07] space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => onSelectArticle(step.docSlug)}
                        className="text-left text-xs font-semibold text-white hover:text-cyan-300 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <span className="font-mono text-indigo-300">
                          {step.stepNumber}.
                        </span>
                        <span>{step.title}</span>
                      </button>
                      <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono">
                      <span className="text-slate-400 truncate">
                        Guide: {realArticle?.title ?? step.docSlug}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        {step.playgroundDemoId && (
                          <a
                            href={`#playground/${step.playgroundDemoId}`}
                            className="inline-flex items-center gap-0.5 text-cyan-400 hover:underline"
                          >
                            <Play className="w-2.5 h-2.5" /> Lab
                          </a>
                        )}
                        {step.onboardingHref && (
                          <a
                            href={step.onboardingHref}
                            className="inline-flex items-center gap-0.5 text-emerald-400 hover:underline"
                          >
                            <Compass className="w-2.5 h-2.5" /> Setup
                          </a>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </Card>
        ))}
      </div>
    </section>
  );
};
