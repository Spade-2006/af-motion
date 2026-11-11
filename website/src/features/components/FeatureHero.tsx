import React from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SITE_CONFIG } from "@/config/site";
import { FEATURE_CATEGORIES } from "../data/featureCatalog";
import type { FeatureCategoryId } from "../types";
import { ArrowRight, BookOpen, Play, Sparkles } from "lucide-react";

export interface FeatureHeroProps {
  readonly activeCategoryId?: FeatureCategoryId;
  readonly onSelectCategory: (id: FeatureCategoryId) => void;
}

export const FeatureHero: React.FC<FeatureHeroProps> = ({
  activeCategoryId,
  onSelectCategory,
}) => {
  return (
    <div className="pt-28 pb-12 sm:pt-32 sm:pb-16 border-b border-white/[0.06] relative">
      <PageContainer maxWidth="2xl">
        <div className="max-w-4xl">
          <Badge variant="glow" size="sm" className="mb-4">
            <Sparkles className="w-3 h-3 mr-1.5 inline" />
            Architecture &amp; Capabilities
          </Badge>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-[1.1] mb-4">
            AF Motion Feature Capabilities
          </h1>

          <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-3xl mb-8">
            Explore every modular subsystem of AF Motion—from framework-independent GPU
            animation primitives and damped springs to Motion DNA design tokens,
            procedural shaders, React 18/19 bindings, and deterministic AI planning.
          </p>

          <div className="flex flex-wrap items-center gap-3 mb-8">
            <Button
              variant="primary"
              size="md"
              iconTrailing={<ArrowRight className="w-4 h-4" />}
              onClick={() => {
                window.location.hash = "#onboarding";
              }}
            >
              Start Developer Onboarding
            </Button>
            <Button
              variant="secondary"
              size="md"
              iconLeading={<Play className="w-4 h-4 text-cyan-400" />}
              onClick={() => {
                window.location.hash = "#playground";
              }}
            >
              Interactive Playground
            </Button>
            <Button
              variant="outline"
              size="md"
              iconLeading={<BookOpen className="w-4 h-4" />}
              onClick={() => {
                window.location.hash = "#examples";
              }}
            >
              Browse Curated Examples
            </Button>
          </div>

          {/* Verified Spec Strip */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-mono text-slate-400 pb-6 border-b border-white/[0.06]">
            <span>{FEATURE_CATEGORIES.length} Core Pillars</span>
            <span className="text-slate-700">·</span>
            <span>{SITE_CONFIG.stats.coreEasings} Core Easings + Springs</span>
            <span className="text-slate-700">·</span>
            <span>{SITE_CONFIG.stats.presets} Presets (9 Categories)</span>
            <span className="text-slate-700">·</span>
            <span>{SITE_CONFIG.stats.builtInPalettes} Built-in Palettes</span>
            <span className="text-slate-700">·</span>
            <span>{SITE_CONFIG.stats.aiCapabilities} AI Capabilities</span>
          </div>

          {/* Category Jump Navigation */}
          <nav
            aria-label="Feature Category Filter"
            className="flex flex-wrap items-center gap-2 pt-5"
          >
            {FEATURE_CATEGORIES.map((category) => {
              const isActive = activeCategoryId === category.id;
              return (
                <a
                  key={category.id}
                  href={`#features/${category.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    onSelectCategory(category.id);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    isActive
                      ? "bg-indigo-600/25 border-indigo-400/50 text-white"
                      : "bg-white/[0.03] border-white/[0.08] text-slate-300 hover:text-white hover:border-white/[0.2]"
                  }`}
                >
                  <span className="font-mono text-slate-500 mr-1.5">{category.indexLabel}</span>
                  {category.title}
                </a>
              );
            })}
          </nav>
        </div>
      </PageContainer>
    </div>
  );
};
