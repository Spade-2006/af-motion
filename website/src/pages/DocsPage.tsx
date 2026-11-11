import React, { useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { GridBackground } from "@/components/effects/GridBackground";
import { GradientSurface } from "@/components/effects/GradientSurface";
import { DocsHero } from "@/docs/components/DocsHero";
import { DocsSearch } from "@/docs/components/DocsSearch";
import { DocsQuickStart } from "@/docs/components/DocsQuickStart";
import { DocsCategoryGrid } from "@/docs/components/DocsCategoryGrid";
import { DocsLearningPaths } from "@/docs/components/DocsLearningPaths";
import { DocsApiExplorer } from "@/docs/components/DocsApiExplorer";
import { DocsArticleReader } from "@/docs/components/DocsArticleReader";
import type { DocSectionId } from "@/docs/data/docsBridge";

export interface DocsPageProps {
  readonly initialArticleSlug?: string;
}

export const DocsPage: React.FC<DocsPageProps> = ({ initialArticleSlug }) => {
  const [activeSectionFilter, setActiveSectionFilter] = useState<
    "all" | DocSectionId
  >("all");

  const navigateToArticle = (slug: string) => {
    window.location.hash = `#docs/${slug}`;
  };

  const backToHub = () => {
    window.location.hash = "#docs";
  };

  const jumpToApiReference = () => {
    if (initialArticleSlug) {
      window.location.hash = "#docs";
      setTimeout(() => {
        const el = document.getElementById("docs-api-reference");
        if (el && typeof el.scrollIntoView === "function") {
          el.scrollIntoView({ behavior: "smooth" });
        }
      }, 60);
    } else {
      const el = document.getElementById("docs-api-reference");
      if (el && typeof el.scrollIntoView === "function") {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <main className="relative w-full min-h-screen overflow-hidden">
      <GridBackground variant="grid" fadeEdges />
      <GradientSurface variant="cyan" position="top" className="opacity-35" />

      {initialArticleSlug ? (
        <div className="pt-28 pb-20 sm:pt-32">
          <PageContainer maxWidth="2xl">
            <DocsArticleReader
              slug={initialArticleSlug}
              onSelectArticle={navigateToArticle}
              onBackToHub={backToHub}
            />
          </PageContainer>
        </div>
      ) : (
        <>
          <DocsHero
            onJumpToApi={jumpToApiReference}
            onOpenArticle={navigateToArticle}
          />
          <div className="py-12 space-y-14">
            <PageContainer maxWidth="2xl" className="space-y-14">
              <DocsSearch
                onSelectArticle={navigateToArticle}
                activeSectionFilter={activeSectionFilter}
                onSectionFilterChange={setActiveSectionFilter}
              />

              <DocsQuickStart onSelectArticle={navigateToArticle} />

              <DocsCategoryGrid
                activeSectionFilter={activeSectionFilter}
                onSelectArticle={navigateToArticle}
              />

              <DocsLearningPaths onSelectArticle={navigateToArticle} />

              <DocsApiExplorer onSelectArticle={navigateToArticle} />
            </PageContainer>
          </div>
        </>
      )}
    </main>
  );
};
