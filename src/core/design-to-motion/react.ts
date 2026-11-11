"use client";

/**
 * AF Motion Design-to-Motion React Hook (Prompt 142)
 *
 * Provides reactive access to the deterministic Design-to-Motion generation engine,
 * preset loading, plan inspection, and multi-target code export.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import type {
  DesignToMotionInput,
  DesignToMotionOptions,
  GeneratedMotionResult,
} from "./types.js";
import { designToMotionEngine } from "./engine.js";
import { getDesignToMotionPreset } from "./presets.js";

export interface UseDesignToMotionReturn {
  readonly result: GeneratedMotionResult | null;
  readonly isGenerating: boolean;
  readonly error: string | null;
  readonly input: DesignToMotionInput;
  readonly setInput: (input: DesignToMotionInput | ((prev: DesignToMotionInput) => DesignToMotionInput)) => void;
  readonly generate: (overrideInput?: DesignToMotionInput) => Promise<GeneratedMotionResult | null>;
  readonly applyPreset: (presetId: string) => void;
  readonly activePresetId: string | null;
  readonly clear: () => void;
}

export function useDesignToMotion(
  initialInput?: DesignToMotionInput,
  options?: DesignToMotionOptions
): UseDesignToMotionReturn {
  const [input, setInputState] = useState<DesignToMotionInput>(
    initialInput || {
      naturalLanguage: "Create a premium modal entrance with subtle scale and fade.",
    }
  );
  const [result, setResult] = useState<GeneratedMotionResult | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const generate = useCallback(
    async (overrideInput?: DesignToMotionInput): Promise<GeneratedMotionResult | null> => {
      const targetInput = overrideInput || input;
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      setIsGenerating(true);
      setError(null);

      try {
        const generated = await designToMotionEngine.generate(targetInput, {
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
    const preset = getDesignToMotionPreset(presetId);
    if (!preset) return;
    setActivePresetId(preset.id);
    setInputState(preset.defaultInput);
    try {
      const generated = designToMotionEngine.generateSync(preset.defaultInput);
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
