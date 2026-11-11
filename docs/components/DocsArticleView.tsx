import React from "react";
import type { DocArticle, DocSection } from "../types/index.js";
import { DocsCodeBlock } from "./DocsCodeBlock.js";
import { DocsInteractiveHub } from "./interactive/DocsInteractiveHub.js";

interface DocsArticleViewProps {
  article: DocArticle;
  section: DocSection | undefined;
  previousArticle?: DocArticle;
  nextArticle?: DocArticle;
  onNavigate: (slug: string) => void;
}

export const DocsArticleView: React.FC<DocsArticleViewProps> = ({
  article,
  section,
  previousArticle,
  nextArticle,
  onNavigate,
}) => {
  // Helper to render markdown-like content blocks (headings, code blocks, paragraphs)
  const renderContentBlocks = (rawContent: string) => {
    const parts = rawContent.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith("```")) {
        const lines = part.slice(3, -3).trim().split("\n");
        const firstLine = lines[0].trim();
        const lang = firstLine.match(/^[a-zA-Z0-9_-]+$/) ? firstLine : "typescript";
        const codeLines = firstLine.match(/^[a-zA-Z0-9_-]+$/) ? lines.slice(1) : lines;
        const codeText = codeLines.join("\n");

        return (
          <DocsCodeBlock
            key={index}
            code={codeText}
            language={lang}
            filename={lang === "bash" ? "Terminal" : undefined}
          />
        );
      }

      // Render regular paragraphs, subheadings, and lists
      const lines = part.split("\n");
      const elements: React.ReactNode[] = [];
      let currentParagraph: string[] = [];

      const flushParagraph = (pKey: string) => {
        if (currentParagraph.length > 0) {
          const text = currentParagraph.join(" ").trim();
          if (text) {
            elements.push(
              <p key={pKey} className="docs-text-paragraph">
                {text}
              </p>
            );
          }
          currentParagraph = [];
        }
      };

      lines.forEach((line, lineIdx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          flushParagraph(`p-${index}-${lineIdx}`);
          return;
        }

        if (trimmed.startsWith("### ")) {
          flushParagraph(`p-${index}-${lineIdx}-pre`);
          const headingText = trimmed.replace("### ", "").trim();
          const headingId = headingText.toLowerCase().replace(/[^a-z0-9]/g, "-");
          elements.push(
            <h3 key={`h3-${index}-${lineIdx}`} id={headingId} className="docs-subheading-3">
              <a href={`#${headingId}`} className="docs-heading-anchor">#</a>
              {headingText}
            </h3>
          );
        } else if (trimmed.startsWith("## ")) {
          flushParagraph(`p-${index}-${lineIdx}-pre`);
          const headingText = trimmed.replace("## ", "").trim();
          const headingId = headingText.toLowerCase().replace(/[^a-z0-9]/g, "-");
          elements.push(
            <h2 key={`h2-${index}-${lineIdx}`} id={headingId} className="docs-subheading-2">
              <a href={`#${headingId}`} className="docs-heading-anchor">#</a>
              {headingText}
            </h2>
          );
        } else if (trimmed.startsWith("- ")) {
          flushParagraph(`p-${index}-${lineIdx}-pre`);
          elements.push(
            <li key={`li-${index}-${lineIdx}`} className="docs-bullet-item">
              {trimmed.replace("- ", "")}
            </li>
          );
        } else {
          currentParagraph.push(trimmed);
        }
      });

      flushParagraph(`p-${index}-final`);

      return <div key={index} className="docs-content-chunk">{elements}</div>;
    });
  };

  return (
    <div className="docs-article-layout">
      {/* Article Main Body */}
      <article className="docs-article-body">
        {/* Breadcrumbs */}
        <div className="docs-breadcrumbs" aria-label="Breadcrumb">
          <span className="breadcrumb-section">{section?.title ?? "Documentation"}</span>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">{article.title}</span>
        </div>

        {/* Header */}
        <header className="docs-article-header">
          <h1 className="docs-article-title">{article.title}</h1>
          <p className="docs-article-lead">{article.description}</p>

          <div className="docs-tags-row">
            {article.tags.map((tag) => (
              <span key={tag} className="docs-tag-chip">
                #{tag}
              </span>
            ))}
          </div>
        </header>

        {/* Interactive Demonstration Playground */}
        {article.interactiveType && (
          <section className="docs-interactive-section" aria-label="Interactive Demonstration">
            <DocsInteractiveHub type={article.interactiveType} />
          </section>
        )}

        {/* Content Body */}
        <div className="docs-article-content">
          {renderContentBlocks(article.content)}
        </div>

        {/* Bottom Pagination Links */}
        <div className="docs-pagination-row">
          {previousArticle ? (
            <button
              type="button"
              className="docs-pagination-btn prev"
              onClick={() => onNavigate(previousArticle.slug)}
            >
              <span className="pagination-sub">← Previous</span>
              <span className="pagination-title">{previousArticle.title}</span>
            </button>
          ) : (
            <div />
          )}

          {nextArticle ? (
            <button
              type="button"
              className="docs-pagination-btn next"
              onClick={() => onNavigate(nextArticle.slug)}
            >
              <span className="pagination-sub">Next →</span>
              <span className="pagination-title">{nextArticle.title}</span>
            </button>
          ) : (
            <div />
          )}
        </div>
      </article>

      {/* Right Column: Table of Contents ("On this page") */}
      {article.headings.length > 0 && (
        <aside className="docs-toc-sidebar" aria-label="Table of contents">
          <div className="docs-toc-card">
            <h4 className="docs-toc-title">On this page</h4>
            <ul className="docs-toc-list">
              {article.headings.map((h) => (
                <li key={h.id} className={`docs-toc-item level-${h.level}`}>
                  <a href={`#${h.id}`} className="docs-toc-link">
                    {h.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      )}
    </div>
  );
};
