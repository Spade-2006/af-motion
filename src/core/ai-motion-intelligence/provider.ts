/**
 * AF Motion AI Motion Intelligence Provider Architecture
 *
 * Defines the extensible intelligence provider interface, registry,
 * and the default local deterministic provider operating 100% offline.
 */

import type {
  IAIMotionIntelligenceProvider,
  MotionAnalysisInput,
  MotionAnalysisOptions,
  MotionAnalysisResult,
} from "./types.js";
import { classifyMotionIntent } from "./intent-classifier.js";
import { evaluateMotionQuality } from "./quality-evaluator.js";
import { generateMotionRecommendations } from "./recommendation-engine.js";
import { queryPatternKnowledgeBase } from "./knowledge-base.js";
import { generateIntelligenceExplanation } from "./explanation-engine.js";

/**
 * Default local deterministic provider operating 100% offline with zero external network dependencies.
 */
export class DeterministicMotionIntelligenceProvider implements IAIMotionIntelligenceProvider {
  public readonly id = "af-motion-deterministic-ai";
  public readonly name = "AF Motion Deterministic Intelligence Engine";
  public readonly version = "1.0.0";
  public readonly capabilities = [
    "intent-classification",
    "quality-evaluation",
    "performance-analysis",
    "accessibility-audit",
    "actionable-recommendations",
    "pattern-matching",
    "evidence-explanation",
  ] as const;

  public async analyze(
    input: MotionAnalysisInput,
    options: MotionAnalysisOptions = {}
  ): Promise<MotionAnalysisResult> {
    const startTime = performance.now();

    // Check cancellation & timeout
    if (options.signal?.aborted) {
      throw new DOMException("Motion analysis was aborted", "AbortError");
    }
    if (options.timeoutMs !== undefined && options.timeoutMs <= 0) {
      throw new Error(`Motion analysis timed out after ${options.timeoutMs}ms`);
    }

    // Wrap with timeout if requested
    const timeoutMs = options.timeoutMs ?? 5000;
    const timeoutPromise = new Promise<never>((_, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Motion analysis timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      options.signal?.addEventListener("abort", () => {
        clearTimeout(timer);
        reject(new DOMException("Motion analysis was aborted", "AbortError"));
      });
    });

    const executionPromise = (async () => {
      // 1. Intent Classification
      const intents = classifyMotionIntent(input);

      // 2. Multi-dimensional Quality Evaluation
      const quality = evaluateMotionQuality(input);

      // 3. Actionable Recommendations Generation
      const recommendations = generateMotionRecommendations(input, quality.findings);

      // 4. Pattern Knowledge Base Matching
      const matchedPatterns = queryPatternKnowledgeBase(intents.primaryIntent, input.contextHint);

      // 5. Intelligence Explanations
      const explanations = generateIntelligenceExplanation(intents, quality, recommendations);

      const endTime = performance.now();
      const analysisDurationMs = Number((endTime - startTime).toFixed(2));

      return {
        targetId: input.id ?? "anonymous-motion-target",
        intents,
        quality,
        recommendations,
        matchedPatterns,
        explanations,
        telemetry: {
          analysisDurationMs,
          cached: false,
          timestamp: Date.now(),
          providerId: this.id,
        },
      };
    })();

    return Promise.race([executionPromise, timeoutPromise]);
  }
}

/**
 * Central registry managing intelligence providers.
 */
export class IntelligenceProviderRegistry {
  private providers = new Map<string, IAIMotionIntelligenceProvider>();
  private defaultProviderId: string;

  constructor() {
    const defaultProv = new DeterministicMotionIntelligenceProvider();
    this.registerProvider(defaultProv);
    this.defaultProviderId = defaultProv.id;
  }

  public registerProvider(provider: IAIMotionIntelligenceProvider): void {
    this.providers.set(provider.id, provider);
  }

  public unregisterProvider(providerId: string): boolean {
    if (providerId === this.defaultProviderId) {
      return false; // Cannot unregister the default deterministic provider
    }
    return this.providers.delete(providerId);
  }

  public getProvider(providerId?: string): IAIMotionIntelligenceProvider {
    const id = providerId ?? this.defaultProviderId;
    const provider = this.providers.get(id);
    if (!provider) {
      throw new Error(`Intelligence provider with id "${id}" is not registered.`);
    }
    return provider;
  }

  public listProviders(): readonly IAIMotionIntelligenceProvider[] {
    return Array.from(this.providers.values());
  }

  public setDefaultProvider(providerId: string): void {
    if (!this.providers.has(providerId)) {
      throw new Error(`Cannot set unregistered provider "${providerId}" as default.`);
    }
    this.defaultProviderId = providerId;
  }
}

export const defaultIntelligenceRegistry = new IntelligenceProviderRegistry();
