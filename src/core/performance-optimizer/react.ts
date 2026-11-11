/**
 * AF Motion — React Performance Optimizer Hooks & Components
 *
 * React 18 & 19 compatible hooks and components with Strict Mode safety,
 * SSR safety, and minimal re-render subscriptions.
 */

"use client";

import {
  createElement,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  IPerformanceProfiler,
  IPerformanceOptimizer,
  PerformanceOptimizerOptions,
  PerformanceProfilerOptions,
  BottleneckAnalysisReport,
  AppliedOptimizationRecord,
  OptimizationCandidate,
  OptimizationMode,
} from "./types.js";
import {
  createPerformanceProfiler,
  PerformanceProfiler,
} from "./profiler.js";
import {
  createPerformanceOptimizer,
  PerformanceOptimizer,
} from "./optimizer.js";

/**
 * React hook to manage an active PerformanceProfiler session.
 */
export function usePerformanceProfiler(
  options: PerformanceProfilerOptions = {}
): IPerformanceProfiler {
  const profilerRef = useRef<PerformanceProfiler | null>(null);

  if (!profilerRef.current) {
    profilerRef.current = createPerformanceProfiler(options);
  }

  useEffect(() => {
    const profiler = profilerRef.current!;
    profiler.startSession();

    return () => {
      profiler.stopSession();
      profiler.dispose();
      profilerRef.current = null;
    };
  }, []);

  return profilerRef.current!;
}

/**
 * React hook to query the latest performance report and bottlenecks.
 */
export function usePerformanceReport(
  optimizerOrProfiler?: IPerformanceOptimizer | IPerformanceProfiler
): {
  bottlenecks: BottleneckAnalysisReport;
  recommendations: readonly OptimizationCandidate[];
  refresh: () => void;
} {
  const localProfiler = usePerformanceProfiler();
  const target = optimizerOrProfiler ?? localProfiler;

  const [reportState, setReportState] = useState(() => {
    if ("analyzeBottlenecks" in target) {
      return {
        bottlenecks: target.analyzeBottlenecks(),
        recommendations: target.recommendOptimizations(),
      };
    }
    const snap = target.captureSnapshot();
    return {
      bottlenecks: {
        timestamp: Date.now(),
        bottlenecks: [],
        dominantBottleneckCategory: "none" as const,
        overallHealthScore: 100,
        summary: "Profile captured.",
        recommendations: [],
      },
      recommendations: [],
    };
  });

  const refresh = () => {
    if ("analyzeBottlenecks" in target) {
      setReportState({
        bottlenecks: target.analyzeBottlenecks(),
        recommendations: target.recommendOptimizations(),
      });
    }
  };

  return {
    ...reportState,
    refresh,
  };
}

/**
 * React hook providing full performance optimizer controls.
 */
export function usePerformanceOptimizer(
  options: PerformanceOptimizerOptions = {}
): IPerformanceOptimizer {
  const optimizerRef = useRef<PerformanceOptimizer | null>(null);

  if (!optimizerRef.current) {
    optimizerRef.current = createPerformanceOptimizer(options);
  }

  useEffect(() => {
    return () => {
      if (optimizerRef.current) {
        optimizerRef.current.dispose();
        optimizerRef.current = null;
      }
    };
  }, []);

  return optimizerRef.current!;
}

/**
 * React hook to subscribe to optimization history and active optimizations.
 */
export function useOptimizationHistory(
  optimizer?: IPerformanceOptimizer
): {
  activeOptimizations: readonly AppliedOptimizationRecord[];
  history: readonly AppliedOptimizationRecord[];
} {
  const defaultOptimizer = usePerformanceOptimizer();
  const target = optimizer ?? defaultOptimizer;

  const [active, setActive] = useState<readonly AppliedOptimizationRecord[]>(() => target.activeOptimizations);
  const [history, setHistory] = useState<readonly AppliedOptimizationRecord[]>(() => target.getOptimizationHistory());

  useEffect(() => {
    setActive(target.activeOptimizations);
    setHistory(target.getOptimizationHistory());
  }, [target]);

  return {
    activeOptimizations: active,
    history,
  };
}

/**
 * Headless or visual Performance Monitor component.
 */
export function PerformanceMonitor({
  optimizer,
  children,
}: {
  optimizer?: IPerformanceOptimizer;
  children?: ReactNode;
}) {
  const effectiveOptimizer = usePerformanceOptimizer();
  const active = optimizer ?? effectiveOptimizer;

  useEffect(() => {
    const profiler = active.profiler;
    profiler.startSession("PerformanceMonitor");
    return () => {
      profiler.stopSession();
    };
  }, [active]);

  return createElement("div", { "data-af-performance-monitor": "true", style: { display: "contents" } }, children);
}

/**
 * Boundary that catches rendering performance issues and provides automatic rollback.
 */
export function OptimizationBoundary({
  fallbackMode = "conservative",
  children,
}: {
  fallbackMode?: OptimizationMode;
  children?: ReactNode;
}) {
  const optimizer = usePerformanceOptimizer({ mode: fallbackMode });
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleError = () => {
      optimizer.rollbackAllOptimizations("ErrorBoundary caught error");
      optimizer.setMode(fallbackMode);
      setHasError(true);
    };

    if (typeof window !== "undefined") {
      window.addEventListener("error", handleError);
      return () => window.removeEventListener("error", handleError);
    }
  }, [optimizer, fallbackMode]);

  return createElement("div", { "data-af-optimization-boundary": hasError ? "fallback" : "active", style: { display: "contents" } }, children);
}
