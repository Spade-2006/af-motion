/**
 * AF Motion — React Performance Intelligence Hooks & Components
 *
 * React 18 & 19 compatible hooks and components with SSR safety, Strict Mode
 * resilience, and reactive subscriber state synchronization.
 */

"use client";

import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  IPerformanceIntelligence,
  UnifiedPerformanceContext,
  PerformanceHealthScores,
  PerformanceDecision,
  UnifiedPerformanceReport,
} from "./types.js";
import {
  PerformanceIntelligenceCoordinator,
  createPerformanceIntelligence, defaultPerformanceIntelligence,
} from "./coordinator.js";

// Global singleton instance for app-level fallback
export { defaultPerformanceIntelligence };


export const PerformanceIntelligenceContext =
  createContext<IPerformanceIntelligence>(defaultPerformanceIntelligence);

export interface PerformanceIntelligenceProviderProps {
  coordinator?: IPerformanceIntelligence;
  children: ReactNode;
}

/**
 * Context Provider for scoping Performance Intelligence within a React component tree.
 */
export function PerformanceIntelligenceProvider(
  props: PerformanceIntelligenceProviderProps
) {
  const coordinator = props.coordinator ?? defaultPerformanceIntelligence;

  return createElement(
    PerformanceIntelligenceContext.Provider,
    { value: coordinator },
    props.children
  );
}

/**
 * Hook to access the Performance Intelligence coordinator instance.
 */
export function usePerformanceIntelligence(): IPerformanceIntelligence {
  return useContext(PerformanceIntelligenceContext);
}

/**
 * Hook to subscribe to the current UnifiedPerformanceContext.
 */
export function usePerformanceContext(): UnifiedPerformanceContext {
  const coordinator = usePerformanceIntelligence();
  const [ctx, setCtx] = useState<UnifiedPerformanceContext>(() => coordinator.context);

  useEffect(() => {
    // Initial sync
    setCtx(coordinator.context);

    if (coordinator instanceof PerformanceIntelligenceCoordinator) {
      return coordinator.subscribe((newCtx) => {
        setCtx(newCtx);
      });
    }
  }, [coordinator]);

  return ctx;
}

/**
 * Hook to subscribe to the evaluated PerformanceHealthScores.
 */
export function usePerformanceHealth(): PerformanceHealthScores {
  const coordinator = usePerformanceIntelligence();
  const [health, setHealth] = useState<PerformanceHealthScores>(() => coordinator.health);

  useEffect(() => {
    setHealth(coordinator.health);

    if (coordinator instanceof PerformanceIntelligenceCoordinator) {
      return coordinator.subscribe((_, newHealth) => {
        setHealth(newHealth);
      });
    }
  }, [coordinator]);

  return health;
}

/**
 * Hook to retrieve and re-evaluate pending performance decisions.
 */
export function usePerformanceDecisions(): readonly PerformanceDecision[] {
  const coordinator = usePerformanceIntelligence();
  const [decisions, setDecisions] = useState<readonly PerformanceDecision[]>(() =>
    coordinator.generateDecisions()
  );

  useEffect(() => {
    setDecisions(coordinator.generateDecisions());

    if (coordinator instanceof PerformanceIntelligenceCoordinator) {
      return coordinator.subscribe(() => {
        setDecisions(coordinator.generateDecisions());
      });
    }
  }, [coordinator]);

  return decisions;
}

/**
 * Hook to retrieve the latest comprehensive UnifiedPerformanceReport.
 */
export function useUnifiedPerformanceReport(): UnifiedPerformanceReport {
  const coordinator = usePerformanceIntelligence();
  const [report, setReport] = useState<UnifiedPerformanceReport>(() => coordinator.getReport());

  useEffect(() => {
    setReport(coordinator.getReport());

    if (coordinator instanceof PerformanceIntelligenceCoordinator) {
      return coordinator.subscribe(() => {
        setReport(coordinator.getReport());
      });
    }
  }, [coordinator]);

  return report;
}

/**
 * Compact status badge indicating real-time performance health and overall score.
 */
export function PerformanceStatus(props: { className?: string }) {
  const health = usePerformanceHealth();
  const score = health.overallHealth.score;
  const status = health.overallHealth.status;

  const color =
    status === "optimal"
      ? "#22c55e"
      : status === "acceptable"
      ? "#eab308"
      : status === "degraded"
      ? "#f97316"
      : "#ef4444";

  return createElement(
    "div",
    {
      className: props.className,
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "4px 8px",
        borderRadius: "4px",
        fontSize: "12px",
        fontFamily: "monospace",
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        color: "#ffffff",
      },
    },
    createElement("span", {
      style: {
        width: "8px",
        height: "8px",
        borderRadius: "50%",
        backgroundColor: color,
      },
    }),
    createElement(
      "span",
      null,
      `${status.toUpperCase()} (${score.toFixed(0)})`
    )
  );
}

/**
 * Comprehensive visual performance diagnostic dashboard component.
 */
export function PerformanceDashboard(props: {
  className?: string;
  showDecisions?: boolean;
}) {
  const report = useUnifiedPerformanceReport();
  const { health, runtime, memory, optimization, recommendations } = report;

  return createElement(
    "aside",
    {
      className: props.className,
      "aria-label": "Performance Intelligence Dashboard",
      style: {
        padding: "16px",
        backgroundColor: "#18181b",
        color: "#f4f4f5",
        borderRadius: "8px",
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: "13px",
        maxWidth: "420px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
      },
    },
    createElement(
      "div",
      {
        style: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #27272a",
          paddingBottom: "8px",
          marginBottom: "12px",
        },
      },
      createElement("h3", { style: { margin: 0, fontSize: "14px", fontWeight: 600 } }, "Performance Intelligence"),
      createElement(PerformanceStatus, null)
    ),
    createElement(
      "div",
      { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" } },
      createElement("div", null, `FPS: ${runtime.fps} (${runtime.frameDrops} drops)`),
      createElement("div", null, `Frame: ${runtime.frameDurationMs}ms`),
      createElement("div", null, `Memory: ${memory.estimatedMemoryMB} MB`),
      createElement("div", null, `Pressure: ${memory.pressureLevel}`),
      createElement("div", null, `Preset: ${optimization.activePreset}`),
      createElement("div", null, `Bottleneck: ${optimization.dominantBottleneck}`)
    ),
    props.showDecisions !== false &&
      recommendations.length > 0 &&
      createElement(
        "div",
        { style: { borderTop: "1px solid #27272a", paddingTop: "8px" } },
        createElement(
          "div",
          { style: { fontWeight: 600, fontSize: "12px", marginBottom: "4px", color: "#a1a1aa" } },
          "RECOMMENDED DECISIONS"
        ),
        createElement(
          "ul",
          { style: { margin: 0, paddingLeft: "16px", fontSize: "12px", color: "#d4d4d8" } },
          recommendations.map((rec, i) =>
            createElement("li", { key: i, style: { marginBottom: "4px" } }, rec)
          )
        )
      )
  );
}
