import React, { useState, useEffect, useRef } from "react";
import type { DocSearchResult } from "../types/index.js";
import { searchDocs } from "../engine/docs-engine.js";

interface DocsSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectResult: (slug: string) => void;
}

export const DocsSearchModal: React.FC<DocsSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectResult,
}) => {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const results: readonly DocSearchResult[] = query ? searchDocs(query, 10) : [];

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((idx) => (results.length > 0 ? (idx + 1) % results.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((idx) => (results.length > 0 ? (idx - 1 + results.length) % results.length : 0));
    } else if (e.key === "Enter" && results.length > 0) {
      const match = results[selectedIndex];
      if (match) {
        onSelectResult(match.slug);
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="docs-search-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="docs-search-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="docs-search-input-row">
          <span className="docs-search-icon">🔍</span>
          <input
            ref={inputRef}
            type="text"
            className="docs-search-input"
            placeholder="Search documentation, guides, and APIs..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
          />
          <button type="button" className="docs-search-close-btn" onClick={onClose}>
            Esc
          </button>
        </div>

        <div className="docs-search-results-list" role="listbox">
          {query && results.length === 0 && (
            <div className="docs-search-empty">
              <span>No documentation matches found for &quot;{query}&quot;.</span>
            </div>
          )}

          {!query && (
            <div className="docs-search-hint">
              <span>Type a keyword like &quot;animate&quot;, &quot;Reveal&quot;, &quot;MCP&quot;, &quot;palettes&quot;, or &quot;3D&quot;...</span>
            </div>
          )}

          {results.map((res, i) => {
            const isSelected = i === selectedIndex;
            return (
              <button
                type="button"
                key={`${res.slug}-${i}`}
                role="option"
                aria-selected={isSelected}
                className={`docs-search-item ${isSelected ? "selected" : ""}`}
                onClick={() => {
                  onSelectResult(res.slug);
                  onClose();
                }}
                onMouseEnter={() => setSelectedIndex(i)}
              >
                <div className="docs-search-item-header">
                  <span className="docs-search-item-title">{res.articleTitle}</span>
                  <span className="docs-search-section-badge">{res.sectionTitle}</span>
                </div>
                {res.matchedHeading && (
                  <span className="docs-search-heading-match">§ {res.matchedHeading}</span>
                )}
                <p className="docs-search-snippet">{res.snippet}</p>
              </button>
            );
          })}
        </div>

        <div className="docs-search-footer">
          <div className="docs-search-shortcuts">
            <span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
            <span><kbd>↵</kbd> Select</span>
            <span><kbd>Esc</kbd> Close</span>
          </div>
        </div>
      </div>
    </div>
  );
};
