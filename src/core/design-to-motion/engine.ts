/**
 * AF Motion Design-to-Motion Master Engine (Prompt 142)
 *
 * Coordinates the full Design-to-Motion pipeline:
 * Input Parsing → Design Analysis → Motion Intent → Motion Planning →
 * Configuration Generation → Validation → Export Artifact Generation.
 *
 * Deterministic, offline, zero external LLM API requirement.
 */

import type {
  DesignToMotionInput,
  DesignToMotionOptions,
  GeneratedMotionResult,
  IDesignToMotionProvider,
} from "./types.js";
import { parseAndNormalizeDesignInput } from "./input-parser.js";
import { analyzeDesignSpecification } from "./design-analyzer.js";
import { planMotionFromDesign } from "./motion-planner.js";
import { generateMotionComposition, generateExportArtifacts } from "./generator.js";
import { validateGeneratedMotion } from "./validator.js";

export class DesignToMotionEngine implements IDesignToMotionProvider {
  public readonly id = "af-motion-design-to-motion-engine";
  public readonly name = "AF Motion Design-to-Motion Engine";

  private readonly cache = new Map<string, GeneratedMotionResult>();
  private readonly maxCacheSize: number;

  constructor(options: { maxCacheSize?: number } = {}) {
    this.maxCacheSize = options.maxCacheSize || 64;
  }

  /**
   * Generates production-ready motion configurations synchronously.
   */
  public generateSync(
    input: DesignToMotionInput,
    options: DesignToMotionOptions = {}
  ): GeneratedMotionResult {
    // 1. Timeout / AbortSignal checks
    if (options.timeoutMs !== undefined && options.timeoutMs <= 0) {
      throw new Error("Design-to-Motion generation timed out before execution.");
    }
    if (options.signal?.aborted) {
      throw new Error("Design-to-Motion generation aborted by caller signal.");
    }

    // 2. Check Cache
    const cacheKey = this.computeCacheKey(input, options);
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // 3. Step 1: Input Parsing & Normalization
    const normalized = parseAndNormalizeDesignInput(input);

    // 4. Step 2: Design Analysis
    const analysis = analyzeDesignSpecification(normalized);

    // 5. Step 3: Motion Planning
    const plan = planMotionFromDesign(analysis, normalized.tokens);

    // 6. Step 4: Configuration Generation
    const composition = generateMotionComposition(
      analysis,
      plan,
      normalized.tokens,
      input
    );

    // 7. Step 5: Validation Pipeline
    const validation = validateGeneratedMotion(composition, normalized.tokens);

    // 8. Step 6: Multi-target Code Export
    const exportArtifacts = generateExportArtifacts(
      composition,
      plan,
      normalized.tokens
    );

    const result: GeneratedMotionResult = {
      id: `dtm-res-${Date.now()}`,
      sourceInput: input,
      analysis,
      plan,
      composition,
      validation,
      exportArtifacts,
      generatedAt: Date.now(),
    };

    // 9. Store in cache
    this.putCache(cacheKey, result);

    return result;
  }

  /**
   * Generates production-ready motion configurations asynchronously with timeout/abort support.
   */
  public async generate(
    input: DesignToMotionInput,
    options: DesignToMotionOptions = {}
  ): Promise<GeneratedMotionResult> {
    if (options.signal?.aborted) {
      throw new Error("Design-to-Motion generation aborted.");
    }

    if (options.timeoutMs !== undefined && options.timeoutMs <= 0) {
      throw new Error("Design-to-Motion generation timed out.");
    }

    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      if (options.timeoutMs && options.timeoutMs > 0) {
        timer = setTimeout(() => {
          reject(new Error(`Design-to-Motion generation timed out after ${options.timeoutMs}ms.`));
        }, options.timeoutMs);
      }
    });

    const executionPromise = new Promise<GeneratedMotionResult>((resolve, reject) => {
      try {
        const res = this.generateSync(input, options);
        resolve(res);
      } catch (err) {
        reject(err);
      }
    });

    try {
      return await Promise.race([executionPromise, timeoutPromise]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  /**
   * Clears engine cache.
   */
  public clearCache(): void {
    this.cache.clear();
  }

  private computeCacheKey(input: DesignToMotionInput, options: DesignToMotionOptions): string {
    const rawPrompt = typeof input.naturalLanguage === "string"
      ? input.naturalLanguage
      : input.naturalLanguage?.prompt || "";
    const specId = input.specification?.id || "";
    const dna = input.tokens?.motionDNA || options.fallbackDNA || "";
    const palette = input.tokens?.paletteName || "";
    const reduced = Boolean(input.tokens?.reducedMotion);
    return `${rawPrompt}::${specId}::${dna}::${palette}::${reduced}`;
  }

  private putCache(key: string, result: GeneratedMotionResult): void {
    if (this.cache.size >= this.maxCacheSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }
    this.cache.set(key, result);
  }
}

export const designToMotionEngine = new DesignToMotionEngine();
