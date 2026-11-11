import React from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  getAllArticles,
  getAllSections,
  PUBLIC_API_INVENTORY,
} from "../data/docsBridge";
import { ArrowRight, BookOpen, Code2, Play, Sparkles } from "lucide-react";

export interface DocsHeroProps {
  readonly onJumpToApi?: () => void;
  readonly onOpenArticle?: (slug: string) => void;
}

export const DocsHero: React.FC<DocsHeroProps> = ({
  onJumpToApi,
  onOpenArticle,
}) => {
  const sectionsCount = getAllSections().length;
  const articlesCount = getAllArticles().length;

  return (
    <div className="pt-28 pb-10 sm:pt-32 sm:pb-12 border-b border-white/[0.06] relative">
      <PageContainer maxWidth="2xl">
        <div className="max-w-4xl">
          <Badge variant="cyan" size="sm" className="mb-4">
            <Sparkles className="w-3 h-3 mr-1.5 inline" />
            Documentation &amp; API Reference
          </Badge>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-[1.1] mb-4">
            AF Motion Documentation Hub
          </h1>

          <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-3xl mb-7">
            Browse every official guide, interactive article, structured learning path,
            and the complete public API inventory synchronized directly with AF
            Motion&apos;s standalone Docs engine.
          </p>

          <div className="flex flex-wrap items-center gap-3 mb-7">
            <Button
              variant="primary"
              size="md"
              iconLeading={<BookOpen className="w-4 h-4" />}
              onClick={() => onOpenArticle?.("overview")}
            >
              Read Overview Article
            </Button>
            <Button
              variant="secondary"
              size="md"
              iconTrailing={<ArrowRight className="w-4 h-4" />}
              onClick={() => {
                window.location.hash = "#onboarding";
              }}
            >
              Developer Onboarding
            </Button>
            <Button
              variant="outline"
              size="md"
              iconLeading={<Play className="w-4 h-4 text-cyan-400" />}
              onClick={() => {
                window.location.hash = "#playground";
              }}
            >
              Playground
            </Button>
            <Button
              variant="outline"
              size="md"
              iconLeading={<Code2 className="w-4 h-4" />}
              onClick={onJumpToApi}
            >
              API Inventory ({PUBLIC_API_INVENTORY.totalExports.toLocaleString()})
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-mono text-slate-400">
            <span>{sectionsCount} Official Sections</span>
            <span className="text-slate-700">·</span>
            <span>{articlesCount} Documentation Articles</span>
            <span className="text-slate-700">·</span>
            <span>{PUBLIC_API_INVENTORY.totalExports.toLocaleString()} Typed Exports</span>
            <span className="text-slate-700">·</span>
            <span>Standalone Docs CLI: npm run docs</span>
          </div>
        </div>
      </PageContainer>
    </div>
  );
};
