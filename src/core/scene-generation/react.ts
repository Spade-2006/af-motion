"use client";

/**
 * AF Motion AI Scene Generation React Hook (Prompt 143)
 *
 * Provides reactive access to the deterministic AI Scene Generation engine,
 * preset application, scene inspection, and multi-system export.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import type {
  AISceneGenerationInput,
  AISceneGenerationOptions,
  GeneratedSceneResult,
} from "./types.js";
import { aiSceneGenerationEngine } from "./engine.js";
import { getAIScenePreset } from "./presets.js";

export interface UseAISceneGenerationReturn {
  readonly result: GeneratedSceneResult | null;
  readonly isGenerating: boolean;
  readonly error: string | null;
  readonly input: AISceneGenerationInput;
  readonly setInput: (
    input: AISceneGenerationInput | ((prev: AISceneGenerationInput) => AISceneGenerationInput)
  ) => void;
  readonly generate: (overrideInput?: AISceneGenerationInput) => Promise<GeneratedSceneResult | null>;
  readonly applyPreset: (presetId: string) => void;
  readonly activePresetId: string | null;
  readonly clear: () => void;
}

export function useAISceneGeneration(
  initialInput?: AISceneGenerationInput,
  options?: AISceneGenerationOptions
): UseAISceneGenerationReturn {
  const [input, setInputState] = useState<AISceneGenerationInput>(
    initialInput || {
      naturalLanguage:
        "Create a futuristic landing page hero with floating geometric objects and a glowing particle background.",
    }
  );
  const [result, setResult] = useState<GeneratedSceneResult | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const generate = useCallback(
    async (overrideInput?: AISceneGenerationInput): Promise<GeneratedSceneResult | null> => {
      const targetInput = overrideInput || input;
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      setIsGenerating(true);
      setError(null);

      try {
        const generated = await aiSceneGenerationEngine.generate(targetInput, {
          ...options,
          signal: abortControllerRef.current.signal,
        });
        setResult(generated);
        return generated;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return null;
        }
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        return null;
      } finally {
        setIsGenerating(false);
      }
    },
    [input, options]
  );

  const applyPreset = useCallback((presetId: string) => {
    const preset = getAIScenePreset(presetId);
    if (!preset) return;
    setActivePresetId(preset.id);
    setInputState(preset.defaultInput);
    try {
      const generated = aiSceneGenerationEngine.generateSync(preset.defaultInput);
      setResult(generated);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  const clear = useCallback(() => {
    setResult(null);
    setError(null);
    setActivePresetId(null);
  }, []);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return {
    result,
    isGenerating,
    error,
    input,
    setInput: setInputState,
    generate,
    applyPreset,
    activePresetId,
    clear,
  };
}
