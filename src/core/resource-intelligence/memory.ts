/**
 * AF Motion — Memory Intelligence & Budget Manager
 *
 * Quantifies memory consumption across typed arrays, geometry buffers, textures,
 * GPU allocations, and caches. Enforces configurable category budgets and pressure states.
 */

import type {
  IMemoryMonitor,
  IResourceRegistry,
  MemoryBudgetConfig,
  MemoryBudgetStatus,
  MemorySnapshot,
  MemoryPressureLevel,
  ResourceCategory,
} from "./types.js";

export const DEFAULT_MEMORY_BUDGETS: MemoryBudgetConfig = {
  cpuBytes: 128 * 1024 * 1024, // 128 MB
  geometryBytes: 64 * 1024 * 1024, // 64 MB
  textureBytes: 128 * 1024 * 1024, // 128 MB
  gpuBytes: 256 * 1024 * 1024, // 256 MB
  simulationBytes: 64 * 1024 * 1024, // 64 MB
  cacheBytes: 64 * 1024 * 1024, // 64 MB
  temporaryBytes: 32 * 1024 * 1024, // 32 MB
  totalBytes: 512 * 1024 * 1024, // 512 MB
  warningThresholdRatio: 0.75,
  criticalThresholdRatio: 0.90,
};

export class MemoryMonitor implements IMemoryMonitor {
  private readonly _registry: IResourceRegistry;
  private readonly _budgets: Required<MemoryBudgetConfig>;
  private readonly _snapshots: MemorySnapshot[] = [];
  private readonly _maxSnapshots = 60;
  private _isDisposed = false;

  constructor(registry: IResourceRegistry, budgets: Partial<MemoryBudgetConfig> = {}) {
    this._registry = registry;
    this._budgets = {
      cpuBytes: budgets.cpuBytes ?? DEFAULT_MEMORY_BUDGETS.cpuBytes!,
      geometryBytes: budgets.geometryBytes ?? DEFAULT_MEMORY_BUDGETS.geometryBytes!,
      textureBytes: budgets.textureBytes ?? DEFAULT_MEMORY_BUDGETS.textureBytes!,
      gpuBytes: budgets.gpuBytes ?? DEFAULT_MEMORY_BUDGETS.gpuBytes!,
      simulationBytes: budgets.simulationBytes ?? DEFAULT_MEMORY_BUDGETS.simulationBytes!,
      cacheBytes: budgets.cacheBytes ?? DEFAULT_MEMORY_BUDGETS.cacheBytes!,
      temporaryBytes: budgets.temporaryBytes ?? DEFAULT_MEMORY_BUDGETS.temporaryBytes!,
      totalBytes: budgets.totalBytes ?? DEFAULT_MEMORY_BUDGETS.totalBytes!,
      warningThresholdRatio: budgets.warningThresholdRatio ?? DEFAULT_MEMORY_BUDGETS.warningThresholdRatio!,
      criticalThresholdRatio: budgets.criticalThresholdRatio ?? DEFAULT_MEMORY_BUDGETS.criticalThresholdRatio!,
    };
  }

  public get latestSnapshot(): MemorySnapshot {
    if (this._snapshots.length === 0) {
      return this.captureSnapshot();
    }
    return this._snapshots[this._snapshots.length - 1];
  }

  public captureSnapshot(): MemorySnapshot {
    const timestamp = Date.now();
    const records = this._registry.getAllRecords();

    const categoryBytes: Record<ResourceCategory, number> = {
      cpu_buffer: 0,
      typed_array: 0,
      geometry: 0,
      material: 0,
      texture: 0,
      gpu_buffer: 0,
      gpu_texture: 0,
      framebuffer: 0,
      render_target: 0,
      shader_program: 0,
      webgl_resource: 0,
      webgpu_resource: 0,
      physics_body: 0,
      simulation_resource: 0,
      animation_controller: 0,
      event_subscription: 0,
      worker: 0,
      cached_asset: 0,
    };

    const resourceCounts: Record<ResourceCategory, number> = {
      cpu_buffer: 0,
      typed_array: 0,
      geometry: 0,
      material: 0,
      texture: 0,
      gpu_buffer: 0,
      gpu_texture: 0,
      framebuffer: 0,
      render_target: 0,
      shader_program: 0,
      webgl_resource: 0,
      webgpu_resource: 0,
      physics_body: 0,
      simulation_resource: 0,
      animation_controller: 0,
      event_subscription: 0,
      worker: 0,
      cached_asset: 0,
    };

    let totalEstimated = 0;
    let activeCount = 0;
    let idleCount = 0;
    let pooledCount = 0;

    for (const rec of records) {
      if (rec.state === "disposed" || rec.state === "lost") continue;

      if (rec.state === "active") activeCount++;
      else if (rec.state === "idle") idleCount++;
      else if (rec.state === "pooled") pooledCount++;

      categoryBytes[rec.category] = (categoryBytes[rec.category] || 0) + rec.estimatedBytes;
      resourceCounts[rec.category] = (resourceCounts[rec.category] || 0) + 1;
      totalEstimated += rec.estimatedBytes;
    }

    // Measure browser JS heap if available
    let isMeasured = false;
    let measuredUsed: number | undefined = undefined;
    let measuredTotal: number | undefined = undefined;

    if (typeof performance !== "undefined" && (performance as any).memory) {
      isMeasured = true;
      measuredUsed = (performance as any).memory.usedJSHeapSize;
      measuredTotal = (performance as any).memory.totalJSHeapSize;
    }

    // Budget statuses
    const budgetStatuses: Record<string, MemoryBudgetStatus> = {
      total: this.computeBudgetStatus(totalEstimated, this._budgets.totalBytes),
      geometry: this.computeBudgetStatus(categoryBytes.geometry, this._budgets.geometryBytes),
      texture: this.computeBudgetStatus(categoryBytes.texture + categoryBytes.gpu_texture, this._budgets.textureBytes),
      gpu: this.computeBudgetStatus(
        categoryBytes.gpu_buffer + categoryBytes.gpu_texture + categoryBytes.framebuffer,
        this._budgets.gpuBytes
      ),
      simulation: this.computeBudgetStatus(categoryBytes.simulation_resource, this._budgets.simulationBytes),
      cache: this.computeBudgetStatus(categoryBytes.cached_asset, this._budgets.cacheBytes),
    };

    // Overall memory pressure level
    let pressure: MemoryPressureLevel = "normal";
    const totalStatus = budgetStatuses.total;
    if (totalStatus.status === "critical") {
      pressure = "critical";
    } else if (totalStatus.status === "warning") {
      pressure = "high";
    } else if (totalStatus.utilizationRatio > 0.6) {
      pressure = "elevated";
    }

    const snapshot: MemorySnapshot = {
      timestamp,
      isMeasured,
      totalEstimatedBytes: totalEstimated,
      measuredHeapUsedBytes: measuredUsed,
      measuredHeapTotalBytes: measuredTotal,
      categoryBytes,
      resourceCounts,
      totalTrackedResources: records.length,
      activeResourceCount: activeCount,
      idleResourceCount: idleCount,
      pooledResourceCount: pooledCount,
      budgetStatuses,
      memoryPressureLevel: pressure,
    };

    this.pushSnapshot(snapshot);
    return snapshot;
  }

  public getHistoricalSnapshots(): readonly MemorySnapshot[] {
    return this._snapshots;
  }

  public configureBudgets(config: Partial<MemoryBudgetConfig>): void {
    if (config.cpuBytes !== undefined) this._budgets.cpuBytes = config.cpuBytes;
    if (config.geometryBytes !== undefined) this._budgets.geometryBytes = config.geometryBytes;
    if (config.textureBytes !== undefined) this._budgets.textureBytes = config.textureBytes;
    if (config.gpuBytes !== undefined) this._budgets.gpuBytes = config.gpuBytes;
    if (config.simulationBytes !== undefined) this._budgets.simulationBytes = config.simulationBytes;
    if (config.cacheBytes !== undefined) this._budgets.cacheBytes = config.cacheBytes;
    if (config.temporaryBytes !== undefined) this._budgets.temporaryBytes = config.temporaryBytes;
    if (config.totalBytes !== undefined) this._budgets.totalBytes = config.totalBytes;
    if (config.warningThresholdRatio !== undefined) this._budgets.warningThresholdRatio = config.warningThresholdRatio;
    if (config.criticalThresholdRatio !== undefined) this._budgets.criticalThresholdRatio = config.criticalThresholdRatio;
  }

  public getBudgetStatus(category = "total"): MemoryBudgetStatus {
    const snap = this.latestSnapshot;
    return snap.budgetStatuses[category] ?? this.computeBudgetStatus(0, this._budgets.totalBytes);
  }

  public getOverallPressureLevel(): MemoryPressureLevel {
    return this.latestSnapshot.memoryPressureLevel;
  }

  public reset(): void {
    this._snapshots.length = 0;
  }

  public dispose(): void {
    this._isDisposed = true;
    this.reset();
  }

  private computeBudgetStatus(current: number, limit: number): MemoryBudgetStatus {
    const safeLimit = Math.max(1, limit);
    const ratio = current / safeLimit;
    let status: MemoryBudgetStatus["status"] = "normal";

    if (ratio >= this._budgets.criticalThresholdRatio) {
      status = "critical";
    } else if (ratio >= this._budgets.warningThresholdRatio) {
      status = "warning";
    }

    return {
      currentBytes: current,
      limitBytes: safeLimit,
      utilizationRatio: Number(ratio.toFixed(3)),
      status,
    };
  }

  private pushSnapshot(snap: MemorySnapshot): void {
    this._snapshots.push(snap);
    if (this._snapshots.length > this._maxSnapshots) {
      this._snapshots.shift();
    }
  }
}

export function createMemoryMonitor(
  registry: IResourceRegistry,
  budgets?: Partial<MemoryBudgetConfig>
): MemoryMonitor {
  return new MemoryMonitor(registry, budgets);
}
