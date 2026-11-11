import React from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  getAllSections,
  INTERACTIVE_TYPE_TO_PLAYGROUND,
  type DocSectionId,
} from "../data/docsBridge";
import { ArrowRight, Play } from "lucide-react";

export interface DocsCategoryGridProps {
  readonly activeSectionFilter: "all" | DocSectionId;
  readonly onSelectArticle: (slug: string) => void;
}

export const DocsCategoryGrid: React.FC<DocsCategoryGridProps> = ({
  activeSectionFilter,
  onSelectArticle,
}) => {
  const sections = getAllSections();
  const visibleSections =
    activeSectionFilter === "all"
      ? sections
      : sections.filter((s) => s.id === activeSectionFilter);

  return (
    <section aria-label="Documentation Sections" className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Documentation Categories
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            All real sections and articles read directly from AF Motion&apos;s Docs store.
          </p>
        </div>
        <Badge variant="default" size="sm">
          {visibleSections.length} of {sections.length} Sections
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {visibleSections.map((section) => (
          <Card
            key={section.id}
            variant="elevated"
            className="p-6 flex flex-col justify-between gap-4"
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[11px] uppercase tracking-wider text-cyan-400">
                    {section.id}
                  </span>
                  <h3 className="text-lg font-bold text-white mt-0.5">
                    {section.title}
                  </h3>
                </div>
                <Badge variant="cyan" size="sm">
                  {section.articles.length}{" "}
                  {section.articles.length === 1 ? "Article" : "Articles"}
                </Badge>
              </div>

              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                {section.description}
              </p>

              {/* Real Articles inside this Section */}
              <ul className="space-y-1.5 pt-2 border-t border-white/[0.06]">
                {section.articles.map((article) => {
                  const pgLink = article.interactiveType
                    ? INTERACTIVE_TYPE_TO_PLAYGROUND[article.interactiveType]
                    : undefined;
                  return (
                    <li
                      key={article.id}
                      className="flex items-center justify-between gap-2 text-xs py-1"
                    >
                      <button
                        type="button"
                        onClick={() => onSelectArticle(article.slug)}
                        className="text-left text-slate-200 hover:text-cyan-300 transition-colors inline-flex items-center gap-1.5 cursor-pointer min-w-0"
                      >
                        <ArrowRight className="w-3 h-3 text-indigo-400 shrink-0" />
                        <span className="truncate font-medium">{article.title}</span>
                      </button>

                      {pgLink && (
                        <a
                          href={`#playground/${pgLink.demoId}`}
                          title={`Try ${pgLink.label}`}
                          className="shrink-0 inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-400/25 hover:bg-cyan-500/20"
                        >
                          <Play className="w-2.5 h-2.5" />
                          Lab
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
};
