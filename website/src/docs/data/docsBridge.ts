import {
  getAllSections,
  getAllArticles,
  getArticleBySlug,
  getArticlesBySection,
  searchDocs,
} from "../../../../docs/engine/docs-engine.js";
import type {
  DocSection,
  DocArticle,
  DocSearchResult,
  DocSectionId,
  DocInteractiveType,
} from "../../../../docs/types/index.js";
import publicApiInventory from "../../../../docs/data/public-api-inventory.json";
import { CURATED_EXAMPLES, type CuratedExampleSpec } from "@/examples/data/examplesCatalog";

export {
  getAllSections,
  getAllArticles,
  getArticleBySlug,
  getArticlesBySection,
  searchDocs,
};

export type {
  DocSection,
  DocArticle,
  DocSearchResult,
  DocSectionId,
  DocInteractiveType,
};

export interface PublicApiSubpathEntry {
  readonly exportCount: number;
  readonly namedExports: readonly string[];
}

export interface PublicApiInventoryData {
  readonly schemaVersion: string;
  readonly generatedAt: string;
  readonly version: string;
  readonly totalExports: number;
  readonly subpaths: {
    readonly "af-motion": PublicApiSubpathEntry;
    readonly "af-motion/react": PublicApiSubpathEntry;
    readonly "af-motion/catalogue": PublicApiSubpathEntry;
    readonly "af-motion/presets": PublicApiSubpathEntry;
  };
}

export const PUBLIC_API_INVENTORY = publicApiInventory as PublicApiInventoryData;

export type OfficialSubpath = keyof PublicApiInventoryData["subpaths"];

export const OFFICIAL_SUBPATHS: readonly {
  readonly id: OfficialSubpath;
  readonly title: string;
  readonly summary: string;
  readonly guideSlug: string;
  readonly exampleImport: string;
}[] = [
  {
    id: "af-motion",
    title: "Core Engine & Effects",
    summary: "Framework-independent animation primitives, curves, springs, timelines, pointer/scroll effects, palettes, and Motion DNA.",
    guideSlug: "core-animation",
    exampleImport: `import { animate, animateSpring, createTimeline, easings } from "af-motion";`,
  },
  {
    id: "af-motion/react",
    title: "React 18 & 19 Bindings",
    summary: "SSR-safe hooks and components marked with \"use client\" for App Router, Strict Mode cleanup, and reduced-motion accessibility.",
    guideSlug: "react-hooks",
    exampleImport: `import { Reveal, Interactive, useAnimate, useMotionAccessibility } from "af-motion/react";`,
  },
  {
    id: "af-motion/catalogue",
    title: "AI Intelligence, Styles & 3D",
    summary: "Deterministic quality scoring, recommendations, Design-to-Motion, AI scene generation, workflow agents, 19 visual styles, and schemas.",
    guideSlug: "ai-ecosystem",
    exampleImport: `import { evaluateMotionQuality, designToMotionEngine, listWorkflowTemplates } from "af-motion/catalogue";`,
  },
  {
    id: "af-motion/presets",
    title: "Presets & Design Systems",
    summary: "39 audited motion presets across 9 categories plus structured design system token resolvers and built-in choreographies.",
    guideSlug: "motion-dna",
    exampleImport: `import { listPresets, applyPreset, createDesignSystem } from "af-motion/presets";`,
  },
] as const;

export const INTERACTIVE_TYPE_TO_PLAYGROUND: Readonly<
  Record<DocInteractiveType, { readonly demoId: string; readonly label: string }>
> = {
  "core-animation": { demoId: "basic-animate", label: "Core animate() Lab" },
  "easing-explorer": { demoId: "easing-explorer", label: "Easing Explorer Lab" },
  "spring-physics": { demoId: "spring-physics", label: "Spring Physics Solver" },
  "effects-interactions": { demoId: "magnetic-tilt", label: "Effects Showcase Lab" },
  "palette-explorer": { demoId: "preset-explorer", label: "Preset Explorer Lab" },
  "motion-dna": { demoId: "motion-dna", label: "Motion DNA Lab" },
  "ai-demonstration": { demoId: "ai-laboratory", label: "Deterministic AI Lab" },
  "react-demo": { demoId: "basic-animate", label: "Core & React Lab" },
  "verified-recipes": { demoId: "preset-explorer", label: "Verified Presets Lab" },
};

const EXAMPLE_TO_DOC_SLUG: Readonly<Record<string, string>> = {
  "entrance-card": "quickstart",
  "magnetic-cta": "effects-interactions",
  "perspective-tilt-card": "effects-interactions",
  "route-stagger-reveal": "effects-interactions",
  "scroll-depth-track": "effects-interactions",
  "kpi-count-spring": "easings",
  "damped-spring-toggle": "advanced-animation",
  "gpu-aurora-backdrop": "background-effects",
  "timeline-ai-choreography": "choreography",
};

export function getDocArticleForExample(exampleId: string): DocArticle | undefined {
  const slug = EXAMPLE_TO_DOC_SLUG[exampleId];
  return slug ? getArticleBySlug(slug) : getArticleBySlug("verified-examples");
}

export function getExamplesForArticle(articleSlug: string): readonly CuratedExampleSpec[] {
  const direct = CURATED_EXAMPLES.filter(
    (ex) => EXAMPLE_TO_DOC_SLUG[ex.id] === articleSlug
  );
  if (direct.length > 0) return direct;
  if (articleSlug === "verified-examples" || articleSlug === "overview") {
    return CURATED_EXAMPLES.slice(0, 3);
  }
  return [];
}

export interface LearningPathStep {
  readonly stepNumber: number;
  readonly title: string;
  readonly docSlug: string;
  readonly playgroundDemoId?: string;
  readonly onboardingHref?: string;
}

export interface LearningPathTrack {
  readonly id: "beginner" | "intermediate" | "advanced";
  readonly level: string;
  readonly subtitle: string;
  readonly accent: "emerald" | "cyan" | "glow";
  readonly steps: readonly LearningPathStep[];
}

export const DEVELOPER_LEARNING_PATHS: readonly LearningPathTrack[] = [
  {
    id: "beginner",
    level: "Beginner Path",
    subtitle: "Suggested learning order to install AF Motion and animate safely.",
    accent: "emerald",
    steps: [
      { stepNumber: 1, title: "Installation", docSlug: "installation", onboardingHref: "#onboarding-step-1" },
      { stepNumber: 2, title: "First animation", docSlug: "quickstart", playgroundDemoId: "basic-animate" },
      { stepNumber: 3, title: "Easing functions", docSlug: "easings", playgroundDemoId: "easing-explorer" },
      { stepNumber: 4, title: "Basic effects", docSlug: "effects-interactions", playgroundDemoId: "magnetic-tilt" },
      { stepNumber: 5, title: "React integration", docSlug: "react-guide", onboardingHref: "#onboarding-step-3" },
    ],
  },
  {
    id: "intermediate",
    level: "Intermediate Path",
    subtitle: "Scale into physics solvers, multi-track choreography, and design tokens.",
    accent: "cyan",
    steps: [
      { stepNumber: 1, title: "Spring physics", docSlug: "advanced-animation", playgroundDemoId: "spring-physics" },
      { stepNumber: 2, title: "Timeline choreography", docSlug: "choreography", playgroundDemoId: "timeline-choreography" },
      { stepNumber: 3, title: "Motion DNA", docSlug: "motion-dna", playgroundDemoId: "motion-dna" },
      { stepNumber: 4, title: "Presets & palettes", docSlug: "palettes", playgroundDemoId: "preset-explorer" },
      { stepNumber: 5, title: "Accessibility & performance", docSlug: "accessibility-guide" },
    ],
  },
  {
    id: "advanced",
    level: "Advanced Path",
    subtitle: "Master 3D hardware pipelines, AI intelligence, and agent workflows.",
    accent: "glow",
    steps: [
      { stepNumber: 1, title: "3D and GPU engines", docSlug: "3d-engine", playgroundDemoId: "three-gpu-showcase" },
      { stepNumber: 2, title: "Motion intelligence", docSlug: "intelligence-overview", playgroundDemoId: "ai-laboratory" },
      { stepNumber: 3, title: "Design-to-Motion", docSlug: "design-to-motion", playgroundDemoId: "ai-laboratory" },
      { stepNumber: 4, title: "Scene generation", docSlug: "scene-generation", playgroundDemoId: "ai-laboratory" },
      { stepNumber: 5, title: "Agent workflows & MCP", docSlug: "agent-workflows" },
      { stepNumber: 6, title: "Advanced architecture & API", docSlug: "api-reference" },
    ],
  },
] as const;
