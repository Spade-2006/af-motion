import React, { Suspense, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CodeInspector } from "@/playground/components/CodeInspector";
import { DemoErrorBoundary } from "@/playground/components/DemoErrorBoundary";
import {
  getAllArticles,
  getAllSections,
  getArticleBySlug,
  getExamplesForArticle,
  INTERACTIVE_TYPE_TO_PLAYGROUND,
  type DocArticle,
} from "../data/docsBridge";
import { ArrowLeft, ArrowRight, BookOpen, Code2, Play, Sparkles } from "lucide-react";

const LazyDocsInteractiveHub = React.lazy(() =>
  import("../../../../docs/components/interactive/DocsInteractiveHub.js").then((m) => ({
    default: m.DocsInteractiveHub,
  }))
);

export interface DocsArticleReaderProps {
  readonly slug: string;
  readonly onSelectArticle: (slug: string) => void;
  readonly onBackToHub: () => void;
}

function renderSafeMarkdownBlocks(article: DocArticle): React.ReactNode {
  const parts = article.content.split(/(```[\s\S]*?```)/g);

  return parts.map((part, index) => {
    if (part.startsWith("```")) {
      const rawLines = part.slice(3, -3).trim().split(/\r?\n/);
      const firstLine = (rawLines[0] ?? "").trim();
      const hasLangTag = /^[a-zA-Z0-9_-]+$/.test(firstLine);
      const codeLines = hasLangTag ? rawLines.slice(1) : rawLines;
      return (
        <div key={`code-${index}`} className="my-5">
          <CodeInspector tsCode={codeLines.join("\n")} subpath="af-motion" />
        </div>
      );
    }

    const lines = part.split(/\r?\n/);
    const elements: React.ReactNode[] = [];
    let paragraphBuffer: string[] = [];

    const flush = (key: string) => {
      if (paragraphBuffer.length > 0) {
        const text = paragraphBuffer.join(" ").trim();
        if (text) {
          elements.push(
            <p key={key} className="text-sm sm:text-base text-slate-300 leading-relaxed my-3">
              {text}
            </p>
          );
        }
        paragraphBuffer = [];
      }
    };

    lines.forEach((line, lineIdx) => {
      const trimmed = line.trim();
      if (!trimmed) {
        flush(`p-${index}-${lineIdx}`);
        return;
      }
      if (trimmed.startsWith("### ")) {
        flush(`p-${index}-${lineIdx}-pre`);
        elements.push(
          <h3
            key={`h3-${index}-${lineIdx}`}
            className="text-lg font-bold text-white mt-6 mb-2"
          >
            {trimmed.replace("### ", "").trim()}
          </h3>
        );
      } else if (trimmed.startsWith("## ")) {
        flush(`p-${index}-${lineIdx}-pre`);
        elements.push(
          <h2
            key={`h2-${index}-${lineIdx}`}
            className="text-xl sm:text-2xl font-extrabold text-white mt-8 mb-3 pb-2 border-b border-white/[0.06]"
          >
            {trimmed.replace("## ", "").trim()}
          </h2>
        );
      } else if (trimmed.startsWith("- ")) {
        flush(`p-${index}-${lineIdx}-pre`);
        elements.push(
          <li
            key={`li-${index}-${lineIdx}`}
            className="text-sm text-slate-300 leading-relaxed ml-5 list-disc my-1"
          >
            {trimmed.replace("- ", "")}
          </li>
        );
      } else {
        paragraphBuffer.push(trimmed);
      }
    });

    flush(`p-${index}-end`);
    return <div key={`chunk-${index}`}>{elements}</div>;
  });
}

export const DocsArticleReader: React.FC<DocsArticleReaderProps> = ({
  slug,
  onSelectArticle,
  onBackToHub,
}) => {
  const [showLegacyWidget, setShowLegacyWidget] = useState(false);
  const article = useMemo(() => getArticleBySlug(slug), [slug]);
  const sections = useMemo(() => getAllSections(), []);
  const allArticles = useMemo(() => getAllArticles(), []);

  if (!article) {
    return (
      <Card variant="glow" className="p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-5">
        <Badge variant="cyan" size="sm">
          Article Not Found
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          Documentation Article &quot;{slug}&quot; Not Found
        </h1>
        <p className="text-sm text-slate-400">
          Return to the Documentation Hub to browse or search all {allArticles.length}{" "}
          available articles.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button variant="primary" size="md" onClick={onBackToHub}>
            Back to Documentation Hub
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={() => onSelectArticle("overview")}
          >
            Read Overview
          </Button>
        </div>
      </Card>
    );
  }

  const section = sections.find((s) => s.id === article.sectionId);
  const currentIdx = allArticles.findIndex((a) => a.slug === article.slug);
  const prevArticle = currentIdx > 0 ? allArticles[currentIdx - 1] : undefined;
  const nextArticle =
    currentIdx >= 0 && currentIdx < allArticles.length - 1
      ? allArticles[currentIdx + 1]
      : undefined;
  const playgroundLink = article.interactiveType
    ? INTERACTIVE_TYPE_TO_PLAYGROUND[article.interactiveType]
    : undefined;
  const relatedExamples = getExamplesForArticle(article.slug);

  return (
    <div className="space-y-6">
      {/* Breadcrumb + Top Return */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
        <nav aria-label="Documentation breadcrumb" className="flex items-center gap-2 text-xs font-mono">
          <button
            type="button"
            onClick={onBackToHub}
            className="text-cyan-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            All Documentation
          </button>
          <span className="text-slate-600">/</span>
          <span className="text-slate-400">{section?.title ?? article.sectionId}</span>
          <span className="text-slate-600">/</span>
          <span className="text-white">{article.title}</span>
        </nav>

        <div className="flex flex-wrap items-center gap-2">
          {playgroundLink && (
            <Button
              variant="cyan"
              size="sm"
              iconLeading={<Play className="w-3.5 h-3.5" />}
              onClick={() => {
                window.location.hash = `#playground/${playgroundLink.demoId}`;
              }}
            >
              Try in {playgroundLink.label}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              window.location.hash = "#onboarding";
            }}
          >
            Onboarding
          </Button>
        </div>
      </div>

      {/* Main Layout: Article Content + Section Outline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <article className="lg:col-span-8 space-y-6">
          <Card variant="elevated" className="p-6 sm:p-8 space-y-6">
            <header className="space-y-3 border-b border-white/[0.06] pb-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="glow" size="sm">
                  {section?.title ?? article.sectionId}
                </Badge>
                {article.tags.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.07] font-mono text-[11px] text-slate-400"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                {article.title}
              </h1>
              <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
                {article.description}
              </p>
            </header>

            {/* Optional Reused Docs Interactive Hub (Lazy Loaded on Demand) */}
            {article.interactiveType && (
              <div className="p-4 rounded-xl bg-white/[0.02] border border-cyan-500/25 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-white">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>Interactive Practice Paired with This Guide</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {playgroundLink && (
                      <Button
                        variant="primary"
                        size="sm"
                        iconLeading={<Play className="w-3 h-3" />}
                        onClick={() => {
                          window.location.hash = `#playground/${playgroundLink.demoId}`;
                        }}
                      >
                        Try in Website Playground
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowLegacyWidget((v) => !v)}
                    >
                      {showLegacyWidget
                        ? "Hide Docs Widget"
                        : "Launch Docs Interactive Widget"}
                    </Button>
                  </div>
                </div>

                {showLegacyWidget && (
                  <DemoErrorBoundary demoId={article.slug} onReset={() => setShowLegacyWidget(false)}>
                    <Suspense
                      fallback={
                        <div className="p-6 text-xs font-mono text-slate-400">
                          Loading Docs interactive widget...
                        </div>
                      }
                    >
                      <div className="p-4 rounded-xl bg-[#07090f] border border-white/[0.08] text-slate-200 overflow-x-auto">
                        <LazyDocsInteractiveHub type={article.interactiveType} />
                      </div>
                    </Suspense>
                  </DemoErrorBoundary>
                )}
              </div>
            )}

            {/* Rendered Documentation Content */}
            <div>{renderSafeMarkdownBlocks(article)}</div>

            {/* Structured API Signatures if present */}
            {article.apiSignatures && article.apiSignatures.length > 0 && (
              <div className="pt-6 border-t border-white/[0.06] space-y-3">
                <h2 className="text-lg font-bold text-white">API Signatures</h2>
                <div className="space-y-3">
                  {article.apiSignatures.map((sig) => (
                    <div
                      key={sig.name}
                      className="p-4 rounded-xl bg-[#07090f] border border-white/[0.08] space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <code className="font-mono text-xs text-cyan-300 font-semibold">
                          {sig.name}
                        </code>
                        <span className="font-mono text-[10px] text-slate-400">
                          {sig.subpath}
                        </span>
                      </div>
                      <pre className="text-xs font-mono text-slate-200 overflow-x-auto">
                        {sig.signature}
                      </pre>
                      <p className="text-xs text-slate-400">{sig.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Article Pagination */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {prevArticle ? (
              <button
                type="button"
                onClick={() => onSelectArticle(prevArticle.slug)}
                className="p-4 rounded-xl bg-[#0b0d14] hover:bg-[#111522] border border-white/[0.08] text-left transition-colors cursor-pointer"
              >
                <span className="font-mono text-[10px] text-slate-500 uppercase">
                  Previous Article
                </span>
                <div className="text-sm font-semibold text-white mt-1 inline-flex items-center gap-1.5">
                  <ArrowLeft className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{prevArticle.title}</span>
                </div>
              </button>
            ) : (
              <div />
            )}

            {nextArticle && (
              <button
                type="button"
                onClick={() => onSelectArticle(nextArticle.slug)}
                className="p-4 rounded-xl bg-[#0b0d14] hover:bg-[#111522] border border-white/[0.08] text-right transition-colors cursor-pointer"
              >
                <span className="font-mono text-[10px] text-slate-500 uppercase">
                  Next Article
                </span>
                <div className="text-sm font-semibold text-white mt-1 inline-flex items-center justify-end gap-1.5 w-full">
                  <span>{nextArticle.title}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                </div>
              </button>
            )}
          </div>
        </article>

        {/* Right Sidebar: Outline + Related Examples + Related Articles */}
        <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-24">
          {article.headings.length > 0 && (
            <Card variant="default" className="p-5 space-y-3">
              <div className="font-mono text-xs uppercase tracking-wider text-slate-400">
                On This Page
              </div>
              <ul className="space-y-1.5 text-xs">
                {article.headings.map((h) => (
                  <li
                    key={h.id}
                    className={`text-slate-300 ${h.level === 3 ? "pl-3 text-slate-400" : "font-medium"}`}
                  >
                    {h.text}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {relatedExamples.length > 0 && (
            <Card variant="elevated" className="p-5 space-y-3">
              <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-emerald-400">
                <Code2 className="w-3.5 h-3.5" />
                <span>Related Examples</span>
              </div>
              <div className="space-y-2">
                {relatedExamples.map((ex) => (
                  <a
                    key={ex.id}
                    href="#examples"
                    className="block p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.07] transition-colors"
                  >
                    <div className="text-xs font-semibold text-white">{ex.name}</div>
                    <div className="font-mono text-[10px] text-cyan-300 mt-0.5">
                      {ex.category} · View Gallery →
                    </div>
                  </a>
                ))}
              </div>
            </Card>
          )}

          {article.relatedSlugs && article.relatedSlugs.length > 0 && (
            <Card variant="default" className="p-5 space-y-3">
              <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-slate-400">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Related Documentation</span>
              </div>
              <div className="space-y-1.5">
                {article.relatedSlugs.map((relSlug) => {
                  const rel = getArticleBySlug(relSlug);
                  if (!rel) return null;
                  return (
                    <button
                      key={rel.slug}
                      type="button"
                      onClick={() => onSelectArticle(rel.slug)}
                      className="w-full text-left px-3 py-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.07] text-xs text-slate-200 hover:text-cyan-300 transition-colors cursor-pointer flex items-center justify-between gap-2"
                    >
                      <span className="truncate">{rel.title}</span>
                      <ArrowRight className="w-3 h-3 shrink-0" />
                    </button>
                  );
                })}
              </div>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
};
