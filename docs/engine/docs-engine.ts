/**
 * AF Motion Documentation — Search & Query Engine
 *
 * Fast client-side search index, keyword ranking, and validation helpers.
 */

import { DOC_SECTIONS } from "../data/docs-content.js";
import type { DocSection, DocArticle, DocSearchResult, DocSectionId } from "../types/index.js";

/**
 * Returns all registered documentation sections.
 */
export function getAllSections(): readonly DocSection[] {
  return DOC_SECTIONS;
}

/**
 * Returns all registered articles as a flat array.
 */
export function getAllArticles(): readonly DocArticle[] {
  return DOC_SECTIONS.flatMap((s) => s.articles);
}

/**
 * Retrieves a specific article by its slug.
 */
export function getArticleBySlug(slug: string): DocArticle | undefined {
  return getAllArticles().find((a) => a.slug === slug || a.id === slug);
}

/**
 * Retrieves all articles belonging to a specific section.
 */
export function getArticlesBySection(sectionId: DocSectionId): readonly DocArticle[] {
  const section = DOC_SECTIONS.find((s) => s.id === sectionId);
  return section ? section.articles : [];
}

/**
 * Performs fast keyword search across article titles, descriptions, headings, tags, and body text.
 */
export function searchDocs(query: string, maxResults = 8): readonly DocSearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const results: DocSearchResult[] = [];

  for (const section of DOC_SECTIONS) {
    for (const article of section.articles) {
      let score = 0;
      let matchedHeading: string | undefined = undefined;
      let snippet = "";

      const titleLower = article.title.toLowerCase();
      const descLower = article.description.toLowerCase();
      const contentLower = article.content.toLowerCase();
      const words = q.split(/\s+/).filter((w) => w.length > 1);

      // Title match (exact phrase or all query words)
      if (titleLower.includes(q)) {
        score += titleLower.startsWith(q) ? 50 : 35;
        snippet = article.description;
      } else if (words.length > 1 && words.every((w) => titleLower.includes(w))) {
        score += 30;
        snippet = article.description;
      }

      // Tag match
      if (
        article.tags.some((t) => {
          const tl = t.toLowerCase();
          return tl.includes(q) || q.includes(tl) || words.some((w) => tl === w);
        })
      ) {
        score += 25;
      }

      // Heading match
      for (const h of article.headings) {
        const hl = h.text.toLowerCase();
        if (hl.includes(q) || (words.length > 1 && words.every((w) => hl.includes(w)))) {
          score += 20;
          matchedHeading = h.text;
          snippet = `Found in section "${h.text}"`;
          break;
        }
      }

      // Description match
      if (descLower.includes(q) || (words.length > 1 && words.every((w) => descLower.includes(w)))) {
        score += 15;
        if (!snippet) snippet = article.description;
      }

      // Content match
      if (contentLower.includes(q)) {
        score += 10;
        if (!snippet) {
          const idx = contentLower.indexOf(q);
          const start = Math.max(0, idx - 40);
          const end = Math.min(article.content.length, idx + q.length + 60);
          snippet = `...${article.content.slice(start, end).replace(/\n+/g, " ").trim()}...`;
        }
      }

      if (score > 0) {
        results.push({
          articleId: article.id,
          sectionId: section.id,
          articleTitle: article.title,
          sectionTitle: section.title,
          slug: article.slug,
          matchedHeading,
          snippet: snippet || article.description,
          score,
        });
      }
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, maxResults);
}
