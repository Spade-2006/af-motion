"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import type {
  MotionAnalysisInput,
  MotionAnalysisOptions,
  MotionAnalysisResult,
  IntelligentMotionRecommendation,
} from "./types.js";
import { aiMotionIntelligence } from "./engine.js";

export interface UseAIMotionIntelligenceReturn {
  result: MotionAnalysisResult | null;
  loading: boolean;
  error: Error | null;
  acceptRecommendation: (recommendationId: string) => void;
  rejectRecommendation: (recommendationId: string) => void;
  applyAccepted: <T extends Record<string, unknown>>(config: T) => T;
  reanalyze: () => Promise<void>;
}

/**
 * React hook analyzing motion configuration with deterministic AI intelligence.
 */
export function useAIMotionIntelligence(
  input: MotionAnalysisInput | null,
  options: MotionAnalysisOptions = {}
): UseAIMotionIntelligenceReturn {
  const [result, setResult] = useState<MotionAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const runAnalysis = useCallback(async () => {
    if (!input) {
      setResult(null);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const ac = new AbortController();
    abortControllerRef.current = ac;

    setLoading(true);
    setError(null);

    try {
      const res = await aiMotionIntelligence.analyzeMotion(input, {
        ...options,
        signal: ac.signal,
      });
      setResult(res);
    } catch (err: unknown) {
      if ((err as any)?.name !== "AbortError") {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      setLoading(false);
    }
  }, [input, options]);

  useEffect(() => {
    runAnalysis();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [runAnalysis]);

  const acceptRecommendation = useCallback((id: string) => {
    setResult((prev) => (prev ? aiMotionIntelligence.acceptRecommendation(prev, id) : null));
  }, []);

  const rejectRecommendation = useCallback((id: string) => {
    setResult((prev) => (prev ? aiMotionIntelligence.rejectRecommendation(prev, id) : null));
  }, []);

  const applyAccepted = useCallback(
    <T extends Record<string, unknown>>(config: T): T => {
      if (!result) return config;
      return aiMotionIntelligence.applyRecommendations(config, result);
    },
    [result]
  );

  return {
    result,
    loading,
    error,
    acceptRecommendation,
    rejectRecommendation,
    applyAccepted,
    reanalyze: runAnalysis,
  };
}
