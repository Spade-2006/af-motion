import React, { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  getAllSections,
  searchDocs,
  type DocSectionId,
} from "../data/docsBridge";
import { Search, X, ArrowUpRight } from "lucide-react";

export interface DocsSearchProps {
  readonly onSelectArticle: (slug: string) => void;
  readonly activeSectionFilter: "all" | DocSectionId;
  readonly onSectionFilterChange: (section: "all" | DocSectionId) => void;
}

function renderHighlightedText(text: string, query: string): React.ReactNode {
  const q = query.trim();
  if (!q) return text;
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "ig");
  const parts = text.split(regex);
  return parts.map((part, idx) =>
    part.toLowerCase() === q.toLowerCase() ? (
      <mark
        key={idx}
        className="bg-cyan-500/25 text-cyan-200 px-0.5 rounded-sm"
      >
        {part}
      </mark>
    ) : (
      <React.Fragment key={idx}>{part}</React.Fragment>
    )
  );
}

export const DocsSearch: React.FC<DocsSearchProps> = ({
  onSelectArticle,
  activeSectionFilter,
  onSectionFilterChange,
}) => {
  const [query, setQuery] = useState("");
  const [highlightedIdx, setHighlightedIdx] = useState(0);
  const sections = useMemo(() => getAllSections(), []);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const raw = searchDocs(query, 20);
    return activeSectionFilter === "all"
      ? raw.slice(0, 10)
      : raw.filter((r) => r.sectionId === activeSectionFilter).slice(0, 10);
  }, [query, activeSectionFilter]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setQuery("");
      setHighlightedIdx(0);
    } else if (e.key === "ArrowDown" && results.length > 0) {
      e.preventDefault();
      setHighlightedIdx((idx) => (idx + 1) % results.length);
    } else if (e.key === "ArrowUp" && results.length > 0) {
      e.preventDefault();
      setHighlightedIdx((idx) => (idx - 1 + results.length) % results.length);
    } else if (e.key === "Enter" && results.length > 0) {
      e.preventDefault();
      const target = results[highlightedIdx] ?? results[0];
      if (target) {
        onSelectArticle(target.slug);
      }
    }
  };

  return (
    <Card variant="elevated" className="p-5 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="text-xs font-mono uppercase tracking-wider text-cyan-400">
          Live Search (Powered by docs-engine.ts)
        </div>
        <span className="font-mono text-[11px] text-slate-400">
          Arrow keys to navigate · Enter to open · Esc to clear
        </span>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="search"
          value={query}
          aria-label="Search documentation articles, headings, and content"
          placeholder="Search articles by title, tag, or body text (e.g. spring, timeline, reveal, MCP)..."
          onChange={(e) => {
            setQuery(e.target.value);
            setHighlightedIdx(0);
          }}
          onKeyDown={handleKeyDown}
          className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#07090f] border border-white/[0.12] text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/60"
        />
        {query && (
          <button
            type="button"
            aria-label="Clear documentation search"
            onClick={() => {
              setQuery("");
              setHighlightedIdx(0);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Section Filter Chips */}
      <div
        role="tablist"
        aria-label="Filter documentation by section"
        className="flex flex-wrap gap-1.5"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeSectionFilter === "all"}
          onClick={() => onSectionFilterChange("all")}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
            activeSectionFilter === "all"
              ? "bg-indigo-600 text-white border-indigo-400/50"
              : "bg-white/[0.03] border-white/[0.08] text-slate-400 hover:text-white"
          }`}
        >
          All Sections
        </button>
        {sections.map((section) => {
          const active = activeSectionFilter === section.id;
          return (
            <button
              key={section.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onSectionFilterChange(section.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                active
                  ? "bg-indigo-600 text-white border-indigo-400/50"
                  : "bg-white/[0.03] border-white/[0.08] text-slate-400 hover:text-white"
              }`}
            >
              {section.title}
            </button>
          );
        })}
      </div>

      {/* Results List */}
      {query.trim() && (
        <div
          role="listbox"
          aria-label="Documentation search results"
          className="pt-2 border-t border-white/[0.06] space-y-2"
        >
          {results.length === 0 ? (
            <div
              data-testid="docs-search-empty"
              className="p-6 rounded-xl bg-[#07090f] border border-white/[0.07] text-center space-y-2"
            >
              <p className="text-sm text-slate-300">
                No documentation articles matched &quot;{query}&quot;.
              </p>
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  onSectionFilterChange("all");
                }}
                className="text-xs font-mono text-cyan-400 hover:underline cursor-pointer"
              >
                Reset search &amp; filters
              </button>
            </div>
          ) : (
            results.map((res, idx) => {
              const isSelected = idx === highlightedIdx;
              return (
                <button
                  key={res.articleId}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => onSelectArticle(res.slug)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-colors flex items-start justify-between gap-3 cursor-pointer ${
                    isSelected
                      ? "bg-indigo-600/20 border-cyan-400/50"
                      : "bg-[#07090f] border-white/[0.08] hover:border-white/[0.2]"
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-white">
                        {renderHighlightedText(res.articleTitle, query)}
                      </span>
                      <Badge variant="default" size="sm">
                        {res.sectionTitle}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2">
                      {renderHighlightedText(res.snippet, query)}
                    </p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                </button>
              );
            })
          )}
        </div>
      )}
    </Card>
  );
};
