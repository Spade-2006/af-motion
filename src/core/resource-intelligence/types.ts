/**
 * AF Motion — Memory & Resource Intelligence Types
 *
 * Unified resource taxonomy, ownership contracts, lifecycle states,
 * memory budget configuration, cache contracts, and diagnostics.
 */

/**
 * Universal resource category classification.
 */
export type ResourceCategory =
  | "cpu_buffer"
  | "typed_array"
  | "geometry"
  | "material"
  | "texture"
  | "gpu_buffer"
  | "gpu_texture"
  | "framebuffer"
  | "render_target"
  | "shader_program"
  | "webgl_resource"
  | "webgpu_resource"
  | "physics_body"
  | "simulation_resource"
  | "animation_controller"
  | "event_subscription"
  | "worker"
  | "cached_asset";

/**
 * Resource lifecycle states.
 */
export type ResourceLifecycleState =
  | "created"
  | "active"
  | "idle"
  | "pooled"
  | "disposing"
  | "disposed"
  | "lost";

/**
 * Disposal strategy applied when a resource is freed.
 */
export type DisposalStrategy = "immediate" | "pooled" | "deferred" | "manual";

/**
 * System-wide memory pressure level.
 */
export type MemoryPressureLevel = "normal" | "elevated" | "high" | "critical";

/**
 * Interface representing an object that can be safely disposed.
 */
export interface IDisposable {
  dispose(): void;
  readonly id?: string;
}

/**
 * Registration options for adding a resource to the registry.
 */
export interface ResourceRegistrationOptions<T = any> {
  readonly id?: string;
  readonly category: ResourceCategory;
  readonly ownerId?: string;
  readonly scopeId?: string;
  readonly resource: T;
  readonly estimatedBytes?: number;
  readonly disposalStrategy?: DisposalStrategy;
  readonly onDispose?: (resource: T) => void;
  readonly dependencies?: readonly string[]; // IDs of resources this depends on
  readonly isPinned?: boolean; // Prevents eviction/automatic disposal
  readonly metadata?: Readonly<Record<string, any>>;
}

/**
 * Immutable record representing a tracked resource in the registry.
 */
export interface ResourceRecord<T = any> {
  readonly id: string;
  readonly category: ResourceCategory;
  readonly ownerId: string;
  readonly scopeId?: string;
  readonly createdAt: number;
  readonly lastAccessedAt: number;
  readonly estimatedBytes: number;
  readonly state: ResourceLifecycleState;
  readonly refCount: number;
  readonly disposalStrategy: DisposalStrategy;
  readonly dependencies: readonly string[];
  readonly isPinned: boolean;
  readonly metadata: Readonly<Record<string, any>>;
}

/**
 * Hierarchical cleanup scope tracking resource ownership and child scopes.
 */
export interface ResourceScope {
  readonly id: string;
  readonly ownerId: string;
  readonly parentScopeId?: string;
  readonly childScopeIds: readonly string[];
  readonly resourceIds: readonly string[];
  readonly isDisposed: boolean;
  readonly createdAt: number;
  dispose(): void;
}

/**
 * Memory budget limits by category.
 */
export interface MemoryBudgetConfig {
  cpuBytes?: number;
  geometryBytes?: number;
  textureBytes?: number;
  gpuBytes?: number;
  simulationBytes?: number;
  cacheBytes?: number;
  temporaryBytes?: number;
  totalBytes?: number;
  warningThresholdRatio?: number; // default 0.75
  criticalThresholdRatio?: number; // default 0.90
}

/**
 * Budget utilization status for a specific category or total.
 */
export interface MemoryBudgetStatus {
  readonly currentBytes: number;
  readonly limitBytes: number;
  readonly utilizationRatio: number; // 0 to 1+
  readonly status: "normal" | "warning" | "critical";
}

/**
 * Point-in-time snapshot of system memory usage.
 */
export interface MemorySnapshot {
  readonly timestamp: number;
  readonly isMeasured: boolean; // true if derived from browser performance.memory
  readonly totalEstimatedBytes: number;
  readonly measuredHeapUsedBytes?: number;
  readonly measuredHeapTotalBytes?: number;
  readonly categoryBytes: Readonly<Record<ResourceCategory, number>>;
  readonly resourceCounts: Readonly<Record<ResourceCategory, number>>;
  readonly totalTrackedResources: number;
  readonly activeResourceCount: number;
  readonly idleResourceCount: number;
  readonly pooledResourceCount: number;
  readonly budgetStatuses: Readonly<Record<string, MemoryBudgetStatus>>;
  readonly memoryPressureLevel: MemoryPressureLevel;
}

/**
 * Suspected memory or resource leak diagnostic item.
 */
export interface ResourceLeakItem {
  readonly resourceId: string;
  readonly category: ResourceCategory;
  readonly ownerId: string;
  readonly ageMs: number;
  readonly estimatedBytes: number;
  readonly severity: "low" | "medium" | "high";
  readonly description: string;
  readonly suspectedCause: string;
}

/**
 * Statistics reported by a ResourceCache.
 */
export interface ResourceCacheStats {
  readonly entryCount: number;
  readonly maxEntries: number;
  readonly estimatedBytes: number;
  readonly maxBytes: number;
  readonly hits: number;
  readonly misses: number;
  readonly hitRatio: number;
  readonly evictions: number;
}

/**
 * Consolidated resource intelligence diagnostics report.
 */
export interface ResourceIntelligenceReport {
  readonly timestamp: number;
  readonly totalTrackedResources: number;
  readonly resourcesByCategory: Readonly<Record<ResourceCategory, number>>;
  readonly activeCount: number;
  readonly idleCount: number;
  readonly pooledCount: number;
  readonly totalEstimatedBytes: number;
  readonly memoryPressureLevel: MemoryPressureLevel;
  readonly budgetSummary: Readonly<Record<string, MemoryBudgetStatus>>;
  readonly cacheStats?: ResourceCacheStats;
  readonly poolStats?: {
    pooledArraysCount: number;
    pooledBytes: number;
  };
  readonly suspectedLeaks: readonly ResourceLeakItem[];
  readonly recommendations: readonly string[];
}

/**
 * Contract for Universal Resource Registry.
 */
export interface IResourceRegistry {
  readonly size: number;
  registerResource<T = any>(options: ResourceRegistrationOptions<T>): string;
  unregisterResource(resourceId: string, forceDispose?: boolean): boolean;
  getResourceRecord(resourceId: string): ResourceRecord | undefined;
  getRawResource<T = any>(resourceId: string): T | undefined;
  hasResource(resourceId: string): boolean;
  retainResource(resourceId: string): number;
  releaseResource(resourceId: string): number;
  transferResourceOwnership(resourceId: string, newOwnerId: string): boolean;
  createResourceScope(ownerId?: string, parentScopeId?: string): ResourceScope;
  disposeResourceScope(scopeId: string): boolean;
  disposeResource(resourceId: string): boolean;
  getAllRecords(): readonly ResourceRecord[];
  getRecordsByCategory(category: ResourceCategory): readonly ResourceRecord[];
  getRecordsByOwner(ownerId: string): readonly ResourceRecord[];
  disposeAll(): void;
}

/**
 * Contract for Memory Monitor.
 */
export interface IMemoryMonitor {
  readonly latestSnapshot: MemorySnapshot;
  captureSnapshot(): MemorySnapshot;
  getHistoricalSnapshots(): readonly MemorySnapshot[];
  configureBudgets(config: Partial<MemoryBudgetConfig>): void;
  getBudgetStatus(category?: string): MemoryBudgetStatus;
  getOverallPressureLevel(): MemoryPressureLevel;
  reset(): void;
  dispose(): void;
}

/**
 * Contract for Resource Cache.
 */
export interface IResourceCache<K = string, V = any> {
  readonly size: number;
  get(key: K): V | undefined;
  set(key: K, value: V, estimatedBytes?: number, ttlMs?: number): void;
  has(key: K): boolean;
  pin(key: K): boolean;
  unpin(key: K): boolean;
  isPinned(key: K): boolean;
  invalidate(key: K): boolean;
  trimToMemoryLimit(targetBytes?: number): number;
  clear(): void;
  getStats(): ResourceCacheStats;
  dispose(): void;
}

/**
 * Contract for Memory Pressure Controller.
 */
export interface IMemoryPressureController {
  readonly currentPressure: MemoryPressureLevel;
  evaluatePressure(snapshot?: MemorySnapshot): MemoryPressureLevel;
  setPressure(level: MemoryPressureLevel): void;
  onPressureChange(listener: (level: MemoryPressureLevel) => void): { unsubscribe: () => void };
  respondToPressure(level?: MemoryPressureLevel): {
    cacheEntriesEvicted: number;
    bytesReclaimed: number;
  };
  dispose(): void;
}
