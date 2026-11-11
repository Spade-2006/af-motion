import React, { Suspense } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CodeInspector } from "@/playground/components/CodeInspector";
import { getFeatureCategoryById } from "../data/featureCatalog";
import type { FeatureCategoryId, FeatureCategorySpec } from "../types";
import { CheckCircle2, Play, BookOpen, Compass } from "lucide-react";

const LazyFeatureVisualPreview = React.lazy(() =>
  import("./FeatureVisualPreview").then((m) => ({
    default: m.FeatureVisualPreview,
  }))
);

export interface FeatureDetailSectionProps {
  readonly category: FeatureCategorySpec;
  readonly isHighlighted?: boolean;
  readonly onSelectRelated: (id: FeatureCategoryId) => void;
}

export const FeatureDetailSection: React.FC<FeatureDetailSectionProps> = ({
  category,
  isHighlighted = false,
  onSelectRelated,
}) => {
  return (
    <article
      id={`feature-${category.id}`}
      data-feature-category={category.id}
      className="scroll-mt-24 py-10 sm:py-14 border-t border-white/[0.06]"
    >
      <Card
        variant={isHighlighted ? "glow" : "default"}
        className="p-6 sm:p-8 lg:p-10 space-y-8"
      >
        {/* 1. Header & Problem Context */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <Badge variant="cyan" size="sm">
                {category.indexLabel} · {category.title}
              </Badge>
              <Badge variant="default" size="sm">
                Subpath: {category.subpath}
              </Badge>
            </div>

            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {category.headline}
            </h3>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              {category.summary}
            </p>

            {/* Problem Solved Callout */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08]">
              <div className="font-mono text-[11px] uppercase tracking-wider text-indigo-300 mb-1">
                Problem Solved
              </div>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                {category.problemSolved}
              </p>
            </div>

            {/* Actual AF Motion Capabilities */}
            <div>
              <h4 className="font-mono text-xs uppercase tracking-wider text-slate-400 mb-3">
                Verified Capabilities
              </h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {category.capabilities.map((cap) => (
                  <li
                    key={cap}
                    className="flex items-start gap-2 text-xs sm:text-sm text-slate-300 leading-snug"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{cap}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Distinct Lazy-Loaded Interactive Visual Demonstration */}
          <div className="lg:col-span-5">
            <Suspense
              fallback={
                <div className="h-[248px] rounded-2xl border border-white/[0.08] bg-[#07090f] p-5 flex items-center justify-center font-mono text-xs text-slate-500">
                  Loading {category.shortTitle} demonstration...
                </div>
              }
            >
              <LazyFeatureVisualPreview categoryId={category.id} />
            </Suspense>
          </div>
        </div>

        {/* 2. Code Example + API Imports */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8">
            <CodeInspector
              tsCode={category.codeExample}
              subpath={category.subpath}
            />
          </div>

          <div className="lg:col-span-4 space-y-5 p-5 rounded-2xl bg-[#090c14] border border-white/[0.08]">
            <div>
              <div className="font-mono text-xs uppercase tracking-wider text-slate-400 mb-2.5">
                Public API Imports
              </div>
              <div className="flex flex-wrap gap-1.5">
                {category.apiImports.map((sym) => (
                  <code
                    key={sym}
                    className="px-2 py-1 rounded-md bg-white/[0.04] border border-white/[0.08] font-mono text-[11px] text-cyan-300"
                  >
                    {sym}
                  </code>
                ))}
              </div>
            </div>

            <div>
              <div className="font-mono text-xs uppercase tracking-wider text-slate-400 mb-2.5">
                Related Features
              </div>
              <div className="flex flex-wrap gap-1.5">
                {category.relatedCategories.map((relId) => {
                  const rel = getFeatureCategoryById(relId);
                  if (!rel) return null;
                  return (
                    <button
                      key={rel.id}
                      type="button"
                      onClick={() => onSelectRelated(rel.id)}
                      className="px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
                    >
                      {rel.shortTitle}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CTAs */}
            <div className="pt-3 border-t border-white/[0.06] flex flex-col gap-2.5">
              <Button
                variant="primary"
                size="sm"
                iconLeading={<Play className="w-3.5 h-3.5" />}
                onClick={() => {
                  window.location.hash = `#playground/${category.playgroundDemoId}`;
                }}
              >
                {category.playgroundLabel}
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  iconLeading={<Compass className="w-3.5 h-3.5 text-cyan-400" />}
                  onClick={() => {
                    window.location.hash = "#onboarding";
                  }}
                >
                  Onboarding
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  iconLeading={<BookOpen className="w-3.5 h-3.5" />}
                  onClick={() => {
                    window.location.hash = "#docs";
                  }}
                >
                  Docs
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </article>
  );
};
