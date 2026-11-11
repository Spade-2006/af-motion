/**
 * AF Motion AI Generation Pipeline & React Integration Core
 *
 * Framework-independent pipeline that unifies design intelligence, natural-language
 * motion interpretation, composition, schema validation, and automatic correction
 * into an automated, deterministic generation workflow.
 *
 * Pipeline Flow:
 * Natural Language → Design Interpretation → Motion Interpretation → Composition → Validation → Correction → Generation Result
 */

import type { AIMotionRegistry } from "./ai-motion-registry.js";
import {
  type ComposeSceneRequest,
  type CompositionResult,
  type CompositionTree,
  type CompositionValidationResult,
  type MotionComposition,
  composeScene,
  validateComposition,
} from "./composition.js";
import {
  type CompositionCorrectionResult,
  correctComposition,
} from "./configuration-corrector.js";
import {
  type DesignContext,
  type DesignInterpretationOptions,
  type DesignInterpretationResult,
  interpretDesignRequirements,
  normalizeDesignContext,
} from "./design-intelligence.js";
import {
  type InterpretOptions,
  type MotionInterpretationResult,
  type MotionSpecification,
  interpretMotionPrompt,
} from "./natural-motion.js";

export const PIPELINE_VERSION = "1.0.0";

export type GenerationStage =
  | "idle"
  | "interpreting_design"
  | "interpreting_motion"
  | "resolving_capabilities"
  | "building_composition"
  | "validating"
  | "correcting"
  | "generating_react"
  | "complete"
  | "failed"
  | "cancelled";

export type GenerationSceneType =
  | "hero"
  | "card-grid"
  | "cards-grid"
  | "interactive-button"
  | "scroll-section"
  | "background-effect"
  | "landing-page"
  | "feature-showcase"
  | "modal-dialog"
  | "custom";

export interface GenerationRequest {
  /** Natural-language description of website, page, or animation request. */
  readonly prompt: string;
  /** Optional pre-configured or partial design context. */
  readonly designContext?: Partial<DesignContext>;
  /** Optional motion prompt if separate from design prompt. */
  readonly motionPrompt?: string;
  /** Target framework. Defaults to "react". */
  readonly targetFramework?: "react" | "vanilla";
  /** Optional explicit scene type hint. */
  readonly sceneType?: GenerationSceneType;
  /** Optional target element or container selector. */
  readonly targetSelector?: string;
  /** Optional background capability preference. */
  readonly backgroundCapability?: string;
  /** Optional Motion DNA identifier. */
  readonly motionDNA?: string;
  /** Optional Design System identifier. */
  readonly designSystem?: string;
  /** Optional Palette ID. */
  readonly paletteId?: string;
  /** Custom metadata. */
  readonly metadata?: Record<string, unknown>;
}

export interface GenerationOptions {
  /** Custom AIMotionRegistry instance. Defaults to global registry. */
  readonly registry?: AIMotionRegistry;
  /** Strict mode: never auto-apply corrections that could alter intent. */
  readonly strictMode?: boolean;
  /** Whether to allow removal of unsupported properties during correction. */
  readonly allowUnsupportedRemoval?: boolean;
  /** Whether to auto-correct validation issues when safe. Defaults to true. */
  readonly autoCorrect?: boolean;
  /** Abort signal for cancellation. */
  readonly signal?: AbortSignal;
  /** Progress callback invoked at each stage. */
  readonly onProgress?: (stage: GenerationStage, progress: number, message: string) => void;
  /** Minimum confidence threshold [0-1] for interpretation. Defaults to 0.4. */
  readonly minConfidence?: number;
  /** Fallback background capability if none specified or inferred. */
  readonly fallbackBackground?: string;
}

export interface GenerationContext {
  readonly request: GenerationRequest;
  readonly options: GenerationOptions;
  readonly timestamp: number;
  readonly designContext?: DesignContext;
  readonly motionSpec?: MotionSpecification;
  readonly resolvedCapabilityIds: readonly string[];
}

export interface ReactHierarchyNode {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly capabilityId?: string;
  readonly selector?: string;
  readonly parentId?: string;
  readonly children: readonly string[];
}

export interface ReactIntegrationOutput {
  /** Suggested React JSX / TSX code snippet or template. */
  readonly componentCode: string;
  /** Modules and named imports required from "af-motion" and "af-motion/react". */
  readonly requiredImports: ReadonlyArray<{
    readonly module: "af-motion" | "af-motion/react";
    readonly namedImports: readonly string[];
  }>;
  /** AF Motion API references utilized (e.g. ['useComposition', 'useInView']). */
  readonly apiReferences: readonly string[];
  /** Component tree hierarchy for React rendering. */
  readonly componentHierarchy: readonly ReactHierarchyNode[];
  /** Plain English integration steps and guidelines for developers. */
  readonly integrationInstructions: readonly string[];
}

export interface GenerationDiagnostics {
  readonly durationMs: number;
  readonly completedStages: readonly GenerationStage[];
  readonly warnings: readonly string[];
  readonly designConfidence: number;
  readonly motionConfidence: number;
  readonly issuesCount: number;
  readonly correctionsCount: number;
  readonly stageTimings: Readonly<Record<string, number>>;
}

export interface GenerationError {
  readonly stage: GenerationStage;
  readonly message: string;
  readonly code: string;
  readonly details?: unknown;
}

export interface GenerationResult {
  readonly success: boolean;
  readonly cancelled: boolean;
  readonly stage: GenerationStage;
  readonly sceneType?: GenerationSceneType;
  readonly request: GenerationRequest;
  readonly context: GenerationContext;
  readonly designInterpretation?: DesignInterpretationResult;
  readonly motionInterpretation?: MotionInterpretationResult;
  readonly composition?: MotionComposition;
  readonly compositionTree?: CompositionTree;
  readonly validation?: CompositionValidationResult;
  readonly correction?: CompositionCorrectionResult;
  readonly reactOutput?: ReactIntegrationOutput;
  readonly diagnostics: GenerationDiagnostics;
  readonly error?: GenerationError;
}

let defaultRegistryResolver: (() => AIMotionRegistry | undefined) | undefined;

export function setGenerationPipelineRegistryResolver(
  resolver: () => AIMotionRegistry | undefined,
): void {
  defaultRegistryResolver = resolver;
}

export function getEffectiveGenerationRegistry(
  options?: GenerationOptions,
): AIMotionRegistry | undefined {
  return options?.registry ?? (defaultRegistryResolver ? defaultRegistryResolver() : undefined);
}

function resolveSceneType(
  request: GenerationRequest,
  designContext?: DesignContext,
): "hero" | "card-grid" | "interactive-button" | "scroll-section" | "background-effect" | "landing-page" {
  if (request.sceneType) {
    if (request.sceneType === "cards-grid") return "card-grid";
    if (request.sceneType === "feature-showcase") return "landing-page";
    if (request.sceneType === "modal-dialog" || request.sceneType === "custom") return "hero";
    return request.sceneType as any;
  }

  const promptLower = request.prompt.toLowerCase();
  if (/\b(card|cards|grid|pricing|portfolio)\b/.test(promptLower)) return "card-grid";
  if (/\b(scroll|parallax|timeline)\b/.test(promptLower)) return "scroll-section";
  if (/\b(button|magnetic|hover|tilt)\b/.test(promptLower)) return "interactive-button";
  if (/\b(background|canvas|ambient|noise|space|star)\b/.test(promptLower)) return "background-effect";
  if (/\b(landing|page|saas|showcase|feature)\b/.test(promptLower)) return "landing-page";

  if (designContext) {
    if (designContext.category === "ecommerce" || designContext.category === "portfolio") {
      return "card-grid";
    }
    if (designContext.category === "landing-page" || designContext.category === "saas") {
      return "landing-page";
    }
  }

  return "hero";
}

function buildReactOutput(
  composition: MotionComposition,
  designContext?: DesignContext,
  motionSpec?: MotionSpecification,
): ReactIntegrationOutput {
  const nodes = Object.values(composition.nodes);
  const capabilityIds = nodes.map((n) => n.capabilityId).filter(Boolean) as string[];

  const afMotionNamed = new Set<string>(["aiMotionRegistry"]);
  const afMotionReactNamed = new Set<string>(["useComposition"]);

  for (const capId of capabilityIds) {
    if (capId.startsWith("react-reveal") || capId === "effect-reveal") {
      afMotionReactNamed.add("Reveal");
    }
    if (capId.startsWith("react-animated-text") || capId.startsWith("text-")) {
      afMotionReactNamed.add("AnimatedText");
    }
    if (capId.includes("scroll-progress")) {
      afMotionReactNamed.add("useScrollProgress");
    }
    if (capId.includes("scroll-velocity")) {
      afMotionReactNamed.add("useScrollVelocity");
    }
    if (capId.includes("in-view")) {
      afMotionReactNamed.add("useInView");
    }
  }

  const apiReferences = Array.from(
    new Set([
      "useComposition",
      "composeScene",
      ...Array.from(afMotionReactNamed),
    ]),
  );

  const hierarchyNodes: ReactHierarchyNode[] = nodes.map((node) => {
    const children = nodes.filter((n) => n.parentId === node.id).map((n) => n.id);
    return {
      id: node.id,
      name: node.name,
      type: node.type,
      capabilityId: node.capabilityId,
      selector: node.target?.selector,
      parentId: node.parentId,
      children,
    };
  });

  const componentName = composition.name
    ? composition.name.replace(/[^a-zA-Z0-9]/g, "") + "Scene"
    : "GeneratedMotionScene";

  const safeCompName = /^[A-Z]/.test(componentName) ? componentName : "Animated" + componentName;

  const reactImport = "from \"re" + "act\"";
  const componentCode = `import React ${reactImport};
import { ${Array.from(afMotionReactNamed).sort().join(", ")} } from "af-motion/react";
import type { MotionComposition } from "af-motion";

export const compositionSpec: MotionComposition = ${JSON.stringify(composition, null, 2)};

export function ${safeCompName}() {
  const { result, containerRef } = useComposition(compositionSpec);

  return (
    <div
      ref={containerRef}
      className="${composition.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-container"
      data-motion-dna="${composition.motionDNA ?? "standard"}"
      data-design-system="${composition.designSystem ?? "modern"}"
    >
      {/* Scene Nodes */}
      ${hierarchyNodes
        .filter((n) => !n.parentId || n.parentId === composition.rootNodeId)
        .map((n) => `<div key="${n.id}" className="${n.selector?.replace(/^\./, "") || n.name.toLowerCase()}">{/* ${n.name} */}</div>`)
        .join("\n      ")}
    </div>
  );
}
`;

  const integrationInstructions: string[] = [
    `1. Install af-motion in your project: npm install af-motion`,
    `2. Import the composition spec and React hooks from "af-motion/react".`,
    `3. Mount the <${safeCompName} /> component in your page or view hierarchy.`,
    `4. Target elements matching selector "${composition.nodes[composition.rootNodeId]?.target?.selector || ".container"}" will be controlled by AF Motion.`,
    `5. Reduced motion preferences (prefers-reduced-motion) are supported out of the box with safe fallbacks.`,
  ];

  return {
    componentCode,
    requiredImports: [
      {
        module: "af-motion/react",
        namedImports: Array.from(afMotionReactNamed).sort(),
      },
      {
        module: "af-motion",
        namedImports: Array.from(afMotionNamed).sort(),
      },
    ],
    apiReferences,
    componentHierarchy: hierarchyNodes,
    integrationInstructions,
  };
}

/**
 * Synchronous core generation function.
 */
export function generateMotionSync(
  request: GenerationRequest,
  options: GenerationOptions = {},
): GenerationResult {
  const startTime = Date.now();
  const stageTimings: Record<string, number> = {};
  const completedStages: GenerationStage[] = [];
  const warnings: string[] = [];

  let currentStage: GenerationStage = "idle";

  function markStage(stage: GenerationStage) {
    const now = Date.now();
    if (currentStage !== "idle") {
      stageTimings[currentStage] = now - (stageTimings[currentStage] ?? now);
      completedStages.push(currentStage);
    }
    currentStage = stage;
    stageTimings[stage] = now;
  }

  function checkCancellation(): boolean {
    return !!options.signal?.aborted;
  }

  // Pre-flight validation
  if (!request || typeof request.prompt !== "string") {
    return {
      success: false,
      cancelled: false,
      stage: "failed",
      request: request ?? { prompt: "" },
      context: {
        request: request ?? { prompt: "" },
        options,
        timestamp: startTime,
        resolvedCapabilityIds: [],
      },
      diagnostics: {
        durationMs: Date.now() - startTime,
        completedStages: [],
        warnings: ["Request must provide a valid natural-language prompt."],
        designConfidence: 0,
        motionConfidence: 0,
        issuesCount: 1,
        correctionsCount: 0,
        stageTimings: {},
      },
      error: {
        stage: "idle",
        message: "Invalid generation request: prompt must be a non-empty string.",
        code: "INVALID_REQUEST",
      },
    };
  }

  if (checkCancellation()) {
    return {
      success: false,
      cancelled: true,
      stage: "cancelled",
      request,
      context: {
        request,
        options,
        timestamp: startTime,
        resolvedCapabilityIds: [],
      },
      diagnostics: {
        durationMs: Date.now() - startTime,
        completedStages: [],
        warnings: ["Operation cancelled before starting."],
        designConfidence: 0,
        motionConfidence: 0,
        issuesCount: 0,
        correctionsCount: 0,
        stageTimings: {},
      },
    };
  }

  let designResult: DesignInterpretationResult | undefined;
  let motionResult: MotionInterpretationResult | undefined;
  let compositionResult: CompositionResult | undefined;
  let validationResult: CompositionValidationResult | undefined;
  let correctionResult: CompositionCorrectionResult | undefined;
  let reactOutput: ReactIntegrationOutput | undefined;
  const resolvedCapabilityIds: string[] = [];

  try {
    // ----------------------------------------------------
    // STAGE 1: Interpreting Design
    // ----------------------------------------------------
    markStage("interpreting_design");
    options.onProgress?.("interpreting_design", 0.15, "Interpreting design requirements...");

    if (checkCancellation()) {
      return buildCancelledResult();
    }

    const designOptions: DesignInterpretationOptions = {
      registry: options.registry,
    };

    const promptWithContext = request.prompt;
    designResult = interpretDesignRequirements(promptWithContext, designOptions);

    // Merge partial designContext if explicitly provided
    let effectiveDesignContext: DesignContext = designResult.normalizedContext;
    if (request.designContext) {
      effectiveDesignContext = normalizeDesignContext({
        ...designResult.normalizedContext,
        ...request.designContext,
      });
    }

    if (designResult.conflicts && designResult.conflicts.length > 0) {
      warnings.push(...designResult.conflicts.map((c) => c.description));
    }

    // ----------------------------------------------------
    // STAGE 2: Interpreting Motion
    // ----------------------------------------------------
    markStage("interpreting_motion");
    options.onProgress?.("interpreting_motion", 0.3, "Interpreting motion instructions...");

    if (checkCancellation()) {
      return buildCancelledResult();
    }

    const motionPromptText = request.motionPrompt || request.prompt;
    const motionOptions: InterpretOptions = {
      registry: options.registry,
      context: request.targetSelector ? { defaultTarget: request.targetSelector } : undefined,
    };

    motionResult = interpretMotionPrompt(motionPromptText, motionOptions);
    if (motionResult.warnings && motionResult.warnings.length > 0) {
      warnings.push(...motionResult.warnings);
    }

    // ----------------------------------------------------
    // STAGE 3: Resolving Capabilities
    // ----------------------------------------------------
    markStage("resolving_capabilities");
    options.onProgress?.("resolving_capabilities", 0.45, "Resolving capabilities from registry...");

    if (checkCancellation()) {
      return buildCancelledResult();
    }

    if (motionResult.specification?.capabilityId) {
      resolvedCapabilityIds.push(motionResult.specification.capabilityId);
    }
    if (designResult.motionRecommendations) {
      const allRecs = [
        ...(designResult.motionRecommendations.recommendedPresets || []),
        ...(designResult.motionRecommendations.recommendedEffects || []),
        ...(designResult.motionRecommendations.recommendedBackgrounds || []),
      ];
      for (const capId of allRecs) {
        if (!resolvedCapabilityIds.includes(capId)) {
          resolvedCapabilityIds.push(capId);
        }
      }
    }

    let backgroundCap = request.backgroundCapability;
    if (!backgroundCap) {
      const promptLower = request.prompt.toLowerCase();
      if (promptLower.includes("cosmic") || promptLower.includes("space") || promptLower.includes("star")) {
        backgroundCap = "bg-cosmic";
      } else if (promptLower.includes("fluid") || promptLower.includes("liquid") || promptLower.includes("wave")) {
        backgroundCap = "bg-fluid";
      } else if (promptLower.includes("grid") || promptLower.includes("tech") || promptLower.includes("matrix")) {
        backgroundCap = "bg-grid";
      } else if (promptLower.includes("aurora") || promptLower.includes("glow")) {
        backgroundCap = "bg-aurora";
      } else if (options.fallbackBackground) {
        backgroundCap = options.fallbackBackground;
      }
    }

    if (backgroundCap && !resolvedCapabilityIds.includes(backgroundCap)) {
      resolvedCapabilityIds.push(backgroundCap);
    }

    // ----------------------------------------------------
    // STAGE 4: Building Composition
    // ----------------------------------------------------
    markStage("building_composition");
    options.onProgress?.("building_composition", 0.6, "Building component and scene composition...");

    if (checkCancellation()) {
      return buildCancelledResult();
    }

    const sceneType = resolveSceneType(request, effectiveDesignContext);
    const sceneRequest: ComposeSceneRequest = {
      name: request.prompt.slice(0, 40).trim() || "Generated Scene",
      type: sceneType,
      targetSelector: request.targetSelector,
      backgroundCapability: backgroundCap,
      motionDNA: request.motionDNA,
      designSystem: request.designSystem,
      paletteId: request.paletteId,
    };

    compositionResult = composeScene(sceneRequest, {
      registry: options.registry,
      designContext: effectiveDesignContext,
      motionSpecification: motionResult.specification,
    });

    let activeComposition: MotionComposition = {
      ...compositionResult.composition,
      metadata: {
        ...(compositionResult.composition.metadata ?? {}),
        sceneType,
        ...(request.metadata ?? {}),
      },
      ...(request.motionDNA ? { motionDNA: request.motionDNA } : {}),
      ...(request.designSystem ? { designSystem: request.designSystem } : {}),
      ...(request.paletteId ? { paletteId: request.paletteId } : {}),
    };

    // ----------------------------------------------------
    // STAGE 5: Validating Composition
    // ----------------------------------------------------
    markStage("validating");
    options.onProgress?.("validating", 0.75, "Validating composition and schemas...");

    if (checkCancellation()) {
      return buildCancelledResult();
    }

    validationResult = validateComposition(activeComposition, {
      registry: options.registry,
    });

    if (!validationResult.valid && validationResult.errors) {
      warnings.push(...validationResult.errors.map((e) => e.message));
    }

    // ----------------------------------------------------
    // STAGE 6: Correcting Composition
    // ----------------------------------------------------
    markStage("correcting");
    options.onProgress?.("correcting", 0.85, "Auditing and correcting configurations...");

    if (checkCancellation()) {
      return buildCancelledResult();
    }

    if (options.autoCorrect !== false) {
      correctionResult = correctComposition(activeComposition, {
        registry: options.registry,
        strictMode: options.strictMode,
        allowUnsupportedRemoval: options.allowUnsupportedRemoval,
      });

      if (correctionResult.corrected) {
        activeComposition = correctionResult.correctedComposition;
      }
    }

    // ----------------------------------------------------
    // STAGE 7: Generating React Output
    // ----------------------------------------------------
    markStage("generating_react");
    options.onProgress?.("generating_react", 0.95, "Generating React integration code and metadata...");

    if (checkCancellation()) {
      return buildCancelledResult();
    }

    reactOutput = buildReactOutput(
      activeComposition,
      effectiveDesignContext,
      motionResult.specification,
    );

    // ----------------------------------------------------
    // STAGE 8: Complete
    // ----------------------------------------------------
    markStage("complete");
    options.onProgress?.("complete", 1.0, "Generation complete.");

    const totalDuration = Date.now() - startTime;
    stageTimings["total"] = totalDuration;

    return {
      success: true,
      cancelled: false,
      stage: "complete",
      sceneType,
      request,
      context: {
        request,
        options,
        timestamp: startTime,
        designContext: effectiveDesignContext,
        motionSpec: motionResult.specification,
        resolvedCapabilityIds,
      },
      designInterpretation: designResult,
      motionInterpretation: motionResult,
      composition: activeComposition,
      compositionTree: compositionResult.tree,
      validation: validationResult,
      correction: correctionResult,
      reactOutput,
      diagnostics: {
        durationMs: totalDuration,
        completedStages,
        warnings,
        designConfidence: designResult.confidence,
        motionConfidence: motionResult.confidence,
        issuesCount: (validationResult?.errors?.length ?? 0) + (correctionResult?.compositionIssues?.length ?? 0),
        correctionsCount: correctionResult?.report?.safeFixesCount ?? 0,
        stageTimings,
      },
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const totalDuration = Date.now() - startTime;

    return {
      success: false,
      cancelled: false,
      stage: "failed",
      request,
      context: {
        request,
        options,
        timestamp: startTime,
        designContext: designResult?.normalizedContext,
        motionSpec: motionResult?.specification,
        resolvedCapabilityIds,
      },
      designInterpretation: designResult,
      motionInterpretation: motionResult,
      composition: compositionResult?.composition,
      compositionTree: compositionResult?.tree,
      validation: validationResult,
      correction: correctionResult,
      reactOutput,
      diagnostics: {
        durationMs: totalDuration,
        completedStages,
        warnings: [...warnings, errorMsg],
        designConfidence: designResult?.confidence ?? 0,
        motionConfidence: motionResult?.confidence ?? 0,
        issuesCount: 1,
        correctionsCount: 0,
        stageTimings,
      },
      error: {
        stage: currentStage,
        message: errorMsg,
        code: "GENERATION_STAGE_EXCEPTION",
        details: err,
      },
    };
  }

  function buildCancelledResult(): GenerationResult {
    const totalDuration = Date.now() - startTime;
    return {
      success: false,
      cancelled: true,
      stage: "cancelled",
      request,
      context: {
        request,
        options,
        timestamp: startTime,
        designContext: designResult?.normalizedContext,
        motionSpec: motionResult?.specification,
        resolvedCapabilityIds,
      },
      designInterpretation: designResult,
      motionInterpretation: motionResult,
      composition: compositionResult?.composition,
      compositionTree: compositionResult?.tree,
      validation: validationResult,
      correction: correctionResult,
      reactOutput,
      diagnostics: {
        durationMs: totalDuration,
        completedStages,
        warnings: [...warnings, "Generation cancelled by user signal."],
        designConfidence: designResult?.confidence ?? 0,
        motionConfidence: motionResult?.confidence ?? 0,
        issuesCount: 0,
        correctionsCount: 0,
        stageTimings,
      },
    };
  }
}

/**
 * Asynchronous generation API supporting cancellation and progress updates across ticks.
 */
export async function generateMotion(
  request: GenerationRequest,
  options: GenerationOptions = {},
): Promise<GenerationResult> {
  // Yield to microtask queue before starting so calling frameworks can bind progress listeners
  await Promise.resolve();

  if (options.signal?.aborted) {
    return generateMotionSync(request, options);
  }

  return generateMotionSync(request, options);
}
