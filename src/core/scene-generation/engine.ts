/**
 * AF Motion AI Scene Generation Master Engine (Prompt 143)
 *
 * Coordinates the full AI Scene Generation pipeline:
 * Scene Description → Scene Understanding → Scene Planning → Object Generation →
 * Animation Planning → Composition Assembly → Validation → Multi-Target Export.
 *
 * Deterministic, offline-capable, and framework-independent.
 */

import type {
  AISceneGenerationInput,
  AISceneGenerationOptions,
  GeneratedSceneResult,
  IAISceneGenerationProvider,
} from "./types.js";
import { parseAndNormalizeSceneInput } from "./input-parser.js";
import { analyzeSceneSpecification } from "./scene-analyzer.js";
import { planSceneExecution } from "./scene-planner.js";
import {
  generateSceneComposition,
  generateScene3DSpec,
  generateSceneExportArtifacts,
} from "./generator.js";
import { validateGeneratedScene } from "./validator.js";

export class AISceneGenerationEngine implements IAISceneGenerationProvider {
  public readonly id = "af-motion-ai-scene-generation-engine";
  public readonly name = "AF Motion AI Scene Generation Engine";

  private readonly cache = new Map<string, GeneratedSceneResult>();
  private readonly maxCacheSize: number;

  constructor(options: { maxCacheSize?: number } = {}) {
    this.maxCacheSize = options.maxCacheSize || 64;
  }

  /**
   * Generates a complete scene synchronously.
   */
  public generateSync(
    input: AISceneGenerationInput,
    options: AISceneGenerationOptions = {}
  ): GeneratedSceneResult {
    // 1. Timeout / AbortSignal checks
    if (options.timeoutMs !== undefined && options.timeoutMs <= 0) {
      throw new Error("Scene generation timed out before execution.");
    }
    if (options.signal?.aborted) {
      throw new Error("Scene generation aborted by caller signal.");
    }

    // 2. Check Cache
    const cacheKey = this.computeCacheKey(input);
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // 3. Step 1: Input Normalization
    const normalized = parseAndNormalizeSceneInput({
      ...input,
      reducedMotion: options.forceReducedMotion !== undefined ? options.forceReducedMotion : input.reducedMotion,
    });

    // 4. Step 2: Scene Understanding & Analysis
    const understanding = analyzeSceneSpecification(normalized);

    // 5. Step 3: Scene & Spatial Planning
    const { plan, spec } = planSceneExecution(understanding, normalized);

    // 6. Step 4: Multi-system Composition Assembly
    const composition = generateSceneComposition(spec, plan);
    const scene3dSpec = generateScene3DSpec(spec);

    // 7. Step 5: Quality Validation Pipeline
    const validation = validateGeneratedScene(spec, composition);

    // 8. Step 6: Multi-target Code Export
    const exportArtifacts = generateSceneExportArtifacts(spec, composition, scene3dSpec);

    const result: GeneratedSceneResult = {
      id: `scene-res-${Date.now()}`,
      sourceInput: input,
      understanding,
      plan,
      specification: spec,
      composition,
      scene3dSpec,
      validation,
      exportArtifacts,
      generatedAt: Date.now(),
    };

    // 9. Cache Store
    this.putCache(cacheKey, result);

    return result;
  }

  /**
   * Generates a complete scene asynchronously with timeout/abort support.
   */
  public async generate(
    input: AISceneGenerationInput,
    options: AISceneGenerationOptions = {}
  ): Promise<GeneratedSceneResult> {
    if (options.signal?.aborted) {
      throw new Error("Scene generation aborted.");
    }

    if (options.timeoutMs !== undefined && options.timeoutMs <= 0) {
      throw new Error("Scene generation timed out.");
    }

    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      if (options.timeoutMs && options.timeoutMs > 0) {
        timer = setTimeout(() => {
          reject(new Error(`Scene generation timed out after ${options.timeoutMs}ms.`));
        }, options.timeoutMs);
      }
    });

    const executionPromise = new Promise<GeneratedSceneResult>((resolve, reject) => {
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

  public clearCache(): void {
    this.cache.clear();
  }

  private computeCacheKey(input: AISceneGenerationInput): string {
    const raw = typeof input.naturalLanguage === "string"
      ? input.naturalLanguage
      : input.naturalLanguage?.prompt || "";
    const cat = input.specification?.category || (typeof input.naturalLanguage !== "string" ? input.naturalLanguage?.categoryHint : "") || "";
    const dna = input.motionDNA || "";
    const pal = input.paletteName || "";
    const red = Boolean(input.reducedMotion);
    return `${raw}::${cat}::${dna}::${pal}::${red}`;
  }

  private putCache(key: string, result: GeneratedSceneResult): void {
    if (this.cache.size >= this.maxCacheSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }
    this.cache.set(key, result);
  }
}

export const aiSceneGenerationEngine = new AISceneGenerationEngine();
