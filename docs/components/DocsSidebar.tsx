import React from "react";
import type { DocSection, DocArticle } from "../types/index.js";

interface DocsSidebarProps {
  sections: readonly DocSection[];
  activeArticleSlug: string;
  onSelectArticle: (slug: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const DocsSidebar: React.FC<DocsSidebarProps> = ({
  sections,
  activeArticleSlug,
  onSelectArticle,
  isOpenMobile,
  onCloseMobile,
}) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div className="docs-mobile-backdrop" onClick={onCloseMobile} />
      )}

      <aside className={`docs-sidebar ${isOpenMobile ? "mobile-open" : ""}`}>
        <div className="docs-sidebar-inner">
          <nav className="docs-sidebar-nav" aria-label="Documentation Navigation">
            {sections.map((section) => (
              <div key={section.id} className="docs-nav-group">
                <div className="docs-nav-group-header">
                  <span className="docs-nav-group-icon">{section.icon}</span>
                  <span className="docs-nav-group-title">{section.title}</span>
                </div>

                <ul className="docs-nav-items">
                  {section.articles.map((article: DocArticle) => {
                    const isActive = article.slug === activeArticleSlug;
                    return (
                      <li key={article.id}>
                        <button
                          type="button"
                          className={`docs-nav-link ${isActive ? "active" : ""}`}
                          onClick={() => {
                            onSelectArticle(article.slug);
                            onCloseMobile();
                          }}
                        >
                          <span className="docs-nav-link-text">{article.title}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
};
