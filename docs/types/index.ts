/**
 * AF Motion Documentation — Type Definitions
 *
 * Types for documentation sections, articles, search index, API tables, and navigation.
 */

export type DocSectionId =
  | "getting-started"
  | "core-library"
  | "react-animation"
  | "visual-design"
  | "motion-intelligence"
  | "graphics-3d"
  | "ai-infrastructure"
  | "studio-modules"
  | "examples"
  | "developer-experience"
  | "api-reference";

export type DocInteractiveType =
  | "core-animation"
  | "easing-explorer"
  | "spring-physics"
  | "effects-interactions"
  | "palette-explorer"
  | "motion-dna"
  | "ai-demonstration"
  | "react-demo"
  | "verified-recipes";

export interface DocHeading {
  readonly id: string;
  readonly text: string;
  readonly level: 2 | 3;
}

export interface DocCodeSnippet {
  readonly language: string;
  readonly filename?: string;
  readonly code: string;
  readonly description?: string;
}

export interface DocApiProperty {
  readonly name: string;
  readonly type: string;
  readonly required?: boolean;
  readonly default?: string;
  readonly description: string;
}

export interface DocApiSignature {
  readonly name: string;
  readonly category: string;
  readonly subpath: "af-motion" | "af-motion/react" | "af-motion/catalogue" | "af-motion/presets";
  readonly signature: string;
  readonly description: string;
  readonly parameters?: readonly DocApiProperty[];
  readonly returns?: string;
}

export interface DocArticle {
  readonly id: string;
  readonly sectionId: DocSectionId;
  readonly title: string;
  readonly description: string;
  readonly slug: string;
  readonly headings: readonly DocHeading[];
  readonly content: string; // Markdown or rich text
  readonly tags: readonly string[];
  readonly interactiveType?: DocInteractiveType;
  readonly codeSnippets?: readonly DocCodeSnippet[];
  readonly apiSignatures?: readonly DocApiSignature[];
  readonly relatedSlugs?: readonly string[];
}

export interface DocSection {
  readonly id: DocSectionId;
  readonly title: string;
  readonly icon: string;
  readonly description: string;
  readonly articles: readonly DocArticle[];
}

export interface DocSearchResult {
  readonly articleId: string;
  readonly sectionId: DocSectionId;
  readonly articleTitle: string;
  readonly sectionTitle: string;
  readonly slug: string;
  readonly matchedHeading?: string;
  readonly snippet: string;
  readonly score: number;
}
