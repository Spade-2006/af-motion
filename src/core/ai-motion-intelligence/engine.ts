/**
 * AF Motion AI Motion Intelligence Core Engine
 *
 * Master orchestration engine managing normalization, cached deterministic analysis,
 * recommendation lifecycle, and provider coordination.
 */

import type {
  MotionAnalysisInput,
  MotionAnalysisOptions,
  MotionAnalysisResult,
  IntelligentMotionRecommendation,
  IntentClassificationResult,
  MotionQualityEvaluationResult,
} from "./types.js";
import {
  defaultIntelligenceRegistry,
  IntelligenceProviderRegistry,
} from "./provider.js";
import {
  applyAcceptedRecommendations,
  updateRecommendationStatus,
} from "./recommendation-engine.js";

export class AIMotionIntelligenceEngine {
  private cache = new Map<string, MotionAnalysisResult>();
  private maxCacheSize = 100;

  constructor(
    private registry: IntelligenceProviderRegistry = defaultIntelligenceRegistry
  ) {}

  /**
   * Generates a stable cache key from analysis input.
   */
  private computeCacheKey(input: MotionAnalysisInput): string {
    const raw = JSON.stringify({
      id: input.id,
      name: input.name,
      config: input.configuration,
      compositionId: input.composition?.id,
      contextHint: input.contextHint,
      reducedMotion: input.reducedMotion,
    });
    return raw;
  }

  /**
   * Performs end-to-end AI Motion Intelligence analysis.
   */
  public async analyzeMotion(
    input: MotionAnalysisInput,
    options: MotionAnalysisOptions = {}
  ): Promise<MotionAnalysisResult> {
    const cacheKey = this.computeCacheKey(input);

    if (!options.skipCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      return {
        ...cached,
        telemetry: {
          ...cached.telemetry,
          cached: true,
          timestamp: Date.now(),
        },
      };
    }

    const provider = this.registry.getProvider();
    const result = await provider.analyze(input, options);

    // Cache result
    if (this.cache.size >= this.maxCacheSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }
    this.cache.set(cacheKey, result);

    return result;
  }

  /**
   * Classifies motion intent synchronously using deterministic rules.
   */
  public async classifyIntent(
    input: MotionAnalysisInput
  ): Promise<IntentClassificationResult> {
    const res = await this.analyzeMotion(input);
    return res.intents;
  }

  /**
   * Evaluates motion quality synchronously using deterministic rules.
   */
  public async evaluateQuality(
    input: MotionAnalysisInput
  ): Promise<MotionQualityEvaluationResult> {
    const res = await this.analyzeMotion(input);
    return res.quality;
  }

  /**
   * Retrieves actionable recommendations for input.
   */
  public async getRecommendations(
    input: MotionAnalysisInput
  ): Promise<readonly IntelligentMotionRecommendation[]> {
    const res = await this.analyzeMotion(input);
    return res.recommendations;
  }

  /**
   * Updates recommendation acceptance status.
   */
  public acceptRecommendation(
    result: MotionAnalysisResult,
    recommendationId: string
  ): MotionAnalysisResult {
    const updatedRecs = updateRecommendationStatus(
      result.recommendations,
      recommendationId,
      "accepted"
    );
    return { ...result, recommendations: updatedRecs };
  }

  /**
   * Updates recommendation rejection status.
   */
  public rejectRecommendation(
    result: MotionAnalysisResult,
    recommendationId: string
  ): MotionAnalysisResult {
    const updatedRecs = updateRecommendationStatus(
      result.recommendations,
      recommendationId,
      "rejected"
    );
    return { ...result, recommendations: updatedRecs };
  }

  /**
   * Applies accepted recommendations to a configuration object immutably.
   */
  public applyRecommendations<T extends Record<string, unknown>>(
    config: T,
    result: MotionAnalysisResult
  ): T {
    return applyAcceptedRecommendations(config, result.recommendations);
  }

  /**
   * Clears the analysis cache.
   */
  public clearCache(): void {
    this.cache.clear();
  }
}

export const aiMotionIntelligence = new AIMotionIntelligenceEngine();
