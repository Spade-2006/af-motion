import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  getAllSections,
  getAllArticles,
  getArticleBySlug,
} from "../engine/docs-engine.js";
import { DocsHeader } from "./DocsHeader.js";
import { DocsSidebar } from "./DocsSidebar.js";
import { DocsArticleView } from "./DocsArticleView.js";
import { DocsSearchModal } from "./DocsSearchModal.js";

export const DocsApp: React.FC = () => {
  const sections = useMemo(() => getAllSections(), []);
  const allArticles = useMemo(() => getAllArticles(), []);

  // Hash-based or default routing
  const getInitialSlug = () => {
    if (typeof window !== "undefined" && window.location.hash) {
      const hash = window.location.hash.replace(/^#\/?/, "");
      if (allArticles.some((a) => a.slug === hash)) {
        return hash;
      }
    }
    return allArticles[0]?.slug ?? "overview";
  };

  const [activeSlug, setActiveSlug] = useState<string>(getInitialSlug);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sync hash when active slug changes
  const handleSelectArticle = useCallback((slug: string) => {
    setActiveSlug(slug);
    if (typeof window !== "undefined") {
      window.location.hash = slug;
      try {
        if (typeof window.scrollTo === "function") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      } catch {
        // Safe fallback in environments like jsdom
      }
    }
  }, []);

  // Listen to hash changes in browser
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, "");
      if (hash && allArticles.some((a) => a.slug === hash)) {
        setActiveSlug(hash);
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [allArticles]);

  // Global Ctrl+K / Cmd+K search shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen((open) => !open);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Current article and surrounding articles for pagination
  const activeArticle = useMemo(
    () => getArticleBySlug(activeSlug) ?? allArticles[0],
    [activeSlug, allArticles]
  );

  const activeSection = useMemo(
    () => sections.find((s) => s.id === activeArticle.sectionId),
    [sections, activeArticle]
  );

  const currentIndex = allArticles.findIndex((a) => a.slug === activeArticle.slug);
  const previousArticle = currentIndex > 0 ? allArticles[currentIndex - 1] : undefined;
  const nextArticle = currentIndex < allArticles.length - 1 ? allArticles[currentIndex + 1] : undefined;

  return (
    <div className="docs-root-container">
      {/* Top Navigation Bar */}
      <DocsHeader
        onOpenSearch={() => setIsSearchOpen(true)}
        onToggleMobileMenu={() => setMobileMenuOpen((open) => !open)}
        mobileMenuOpen={mobileMenuOpen}
      />

      {/* Main Documentation Frame */}
      <div className="docs-main-frame">
        <DocsSidebar
          sections={sections}
          activeArticleSlug={activeArticle.slug}
          onSelectArticle={handleSelectArticle}
          isOpenMobile={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        <main className="docs-content-area">
          <DocsArticleView
            article={activeArticle}
            section={activeSection}
            previousArticle={previousArticle}
            nextArticle={nextArticle}
            onNavigate={handleSelectArticle}
          />
        </main>
      </div>

      {/* Quick Search Dialog Modal */}
      <DocsSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectResult={handleSelectArticle}
      />
    </div>
  );
};
