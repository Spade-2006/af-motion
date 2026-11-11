/**
 * AF Motion — React Resource & Memory Intelligence Hooks
 *
 * React 18 & 19 compatible hooks and components with Strict Mode safety,
 * SSR safety, and automatic unmount scope cleanup.
 */

"use client";

import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  IResourceRegistry,
  ResourceScope,
  IMemoryMonitor,
  MemorySnapshot,
  MemoryPressureLevel,
  ResourceIntelligenceReport,
  ResourceRegistrationOptions,
} from "./types.js";
import { ResourceRegistry, createResourceRegistry } from "./registry.js";
import { MemoryMonitor, createMemoryMonitor } from "./memory.js";
import { getResourceReport } from "./reports.js";
import { MemoryPressureController, createMemoryPressureController } from "./pressure.js";

// Global singleton registry instance for shared cross-component tracking
export const defaultResourceRegistry = new ResourceRegistry();
export const defaultMemoryMonitor = new MemoryMonitor(defaultResourceRegistry);
export const defaultPressureController = new MemoryPressureController();

export const ResourceRegistryContext = createContext<IResourceRegistry>(defaultResourceRegistry);
export const ResourceScopeContext = createContext<ResourceScope | null>(null);

/**
 * Hook providing a dedicated, automatically disposed ResourceScope tied to component lifecycle.
 */
export function useResourceScope(ownerId?: string): {
  scope: ResourceScope;
  register: <T>(options: Omit<ResourceRegistrationOptions<T>, "scopeId">) => string;
  dispose: () => void;
} {
  const registry = useContext(ResourceRegistryContext);
  const parentScope = useContext(ResourceScopeContext);
  const scopeRef = useRef<ResourceScope | null>(null);

  if (!scopeRef.current) {
    scopeRef.current = registry.createResourceScope(ownerId, parentScope?.id);
  }

  const scope = scopeRef.current;

  useEffect(() => {
    return () => {
      if (scopeRef.current && !scopeRef.current.isDisposed) {
        scopeRef.current.dispose();
        scopeRef.current = null;
      }
    };
  }, []);

  const register = <T>(options: Omit<ResourceRegistrationOptions<T>, "scopeId">): string => {
    return registry.registerResource({
      ...options,
      scopeId: scope.id,
      ownerId: options.ownerId ?? scope.ownerId,
    });
  };

  return {
    scope,
    register,
    dispose: () => scope.dispose(),
  };
}

/**
 * Hook providing reactive MemoryMonitor access and snapshots.
 */
export function useMemoryMonitor(
  customRegistry?: IResourceRegistry
): {
  snapshot: MemorySnapshot;
  capture: () => MemorySnapshot;
  pressureLevel: MemoryPressureLevel;
} {
  const registry = customRegistry ?? useContext(ResourceRegistryContext);
  const monitor = useMemo(() => {
    return registry === defaultResourceRegistry ? defaultMemoryMonitor : createMemoryMonitor(registry);
  }, [registry]);

  const [snapshot, setSnapshot] = useState<MemorySnapshot>(() => {
    return monitor.latestSnapshot;
  });

  const capture = () => {
    const s = monitor.captureSnapshot();
    setSnapshot(s);
    return s;
  };

  useEffect(() => {
    setSnapshot(monitor.latestSnapshot);
  }, [monitor]);

  return {
    snapshot,
    capture,
    pressureLevel: snapshot.memoryPressureLevel,
  };
}

/**
 * Hook returning point-in-time MemorySnapshot.
 */
export function useMemorySnapshot(): MemorySnapshot {
  const { snapshot } = useMemoryMonitor();
  return snapshot;
}

/**
 * Hook returning consolidated ResourceIntelligenceReport.
 */
export function useResourceReport(): ResourceIntelligenceReport {
  const registry = useContext(ResourceRegistryContext);
  const [report, setReport] = useState<ResourceIntelligenceReport>(() => {
    return getResourceReport({
      registry,
      memoryMonitor: defaultMemoryMonitor,
      pressureController: defaultPressureController,
    });
  });

  useEffect(() => {
    setReport(
      getResourceReport({
        registry,
        memoryMonitor: defaultMemoryMonitor,
        pressureController: defaultPressureController,
      })
    );
  }, [registry]);

  return report;
}

/**
 * Hook to observe live system MemoryPressureLevel.
 */
export function useMemoryPressure(): MemoryPressureLevel {
  const [pressure, setPressure] = useState<MemoryPressureLevel>(() => defaultPressureController.currentPressure);

  useEffect(() => {
    const sub = defaultPressureController.onPressureChange((newLevel) => {
      setPressure(newLevel);
    });
    return () => {
      sub.unsubscribe();
    };
  }, []);

  return pressure;
}

/**
 * Component boundary establishing an isolated ResourceScope for descendants.
 */
export function ResourceScopeBoundary({
  ownerId,
  children,
}: {
  ownerId?: string;
  children?: ReactNode;
}) {
  const { scope } = useResourceScope(ownerId);
  return createElement(
    ResourceScopeContext.Provider,
    { value: scope },
    children
  );
}

/**
 * Headless memory monitoring component.
 */
export function MemoryMonitorComponent({
  onPressureChange,
  children,
}: {
  onPressureChange?: (level: MemoryPressureLevel) => void;
  children?: ReactNode;
}) {
  useEffect(() => {
    if (onPressureChange) {
      const sub = defaultPressureController.onPressureChange(onPressureChange);
      return () => sub.unsubscribe();
    }
  }, [onPressureChange]);

  return createElement("div", { "data-af-memory-monitor": "true", style: { display: "contents" } }, children);
}
