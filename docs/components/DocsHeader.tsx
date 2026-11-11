import React from "react";

interface DocsHeaderProps {
  onOpenSearch: () => void;
  onToggleMobileMenu: () => void;
  mobileMenuOpen: boolean;
}

export const DocsHeader: React.FC<DocsHeaderProps> = ({
  onOpenSearch,
  onToggleMobileMenu,
  mobileMenuOpen,
}) => {
  return (
    <header className="docs-header">
      <div className="docs-header-left">
        <button
          type="button"
          className="docs-mobile-hamburger"
          onClick={onToggleMobileMenu}
          aria-label={mobileMenuOpen ? "Close documentation navigation" : "Open documentation navigation"}
        >
          {mobileMenuOpen ? "✕" : "☰"}
        </button>

        <a href="#overview" className="docs-brand-link">
          <span className="docs-brand-logo">✨ AF Motion</span>
          <span className="docs-brand-tag">Docs</span>
        </a>
        <span className="docs-version-badge">v1.0.0</span>
      </div>

      {/* Global Quick Search Button */}
      <div className="docs-header-center">
        <button
          type="button"
          className="docs-search-trigger"
          onClick={onOpenSearch}
          title="Search documentation (Ctrl+K or Cmd+K)"
        >
          <span className="docs-search-icon">🔍</span>
          <span className="docs-search-placeholder">Search documentation, APIs, and guides...</span>
          <kbd className="docs-search-kbd">Ctrl K</kbd>
        </button>
      </div>

      <div className="docs-header-right">
        <a
          href="/studio"
          className="docs-nav-link studio-link"
          target="_blank"
          rel="noopener noreferrer"
          title="Launch AF Motion Studio"
        >
          🎛️ Studio
        </a>
        <a
          href="https://github.com/Spade-2006/af-motion"
          className="docs-nav-link github-link"
          target="_blank"
          rel="noopener noreferrer"
          title="GitHub Repository"
        >
          🐙 GitHub
        </a>
      </div>
    </header>
  );
};
