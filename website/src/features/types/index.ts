import type { MotionDNA } from "af-motion";

export type FeatureCategoryId =
  | "core-animation"
  | "visual-effects"
  | "motion-intelligence"
  | "design-system"
  | "three-gpu"
  | "framework-integrations";

export interface FeatureCategorySpec {
  readonly id: FeatureCategoryId;
  readonly indexLabel: string;
  readonly title: string;
  readonly shortTitle: string;
  readonly badge: string;
  readonly accent: "cyan" | "indigo" | "purple" | "emerald" | "amber" | "sky";
  readonly subpath: "af-motion" | "af-motion/react" | "af-motion/catalogue" | "af-motion/presets";
  readonly headline: string;
  readonly summary: string;
  readonly problemSolved: string;
  readonly capabilities: readonly string[];
  readonly apiImports: readonly string[];
  readonly codeExample: string;
  readonly relatedCategories: readonly FeatureCategoryId[];
  readonly playgroundDemoId: string;
  readonly playgroundLabel: string;
  readonly defaultDnaProfile?: MotionDNA["name"];
}

export interface FeatureComparisonRow {
  readonly dimension: string;
  readonly leftTitle: string;
  readonly leftSummary: string;
  readonly leftWhenToUse: string;
  readonly rightTitle: string;
  readonly rightSummary: string;
  readonly rightWhenToUse: string;
}
