/**
 * AF Motion — Universal Resource Registry & Ownership Engine
 *
 * Tracks cross-system resource lifecycles, manages hierarchical cleanup scopes,
 * handles reference counting and ownership transfer, and guarantees idempotent,
 * dependency-ordered disposal.
 */

import type {
  IResourceRegistry,
  ResourceCategory,
  ResourceLifecycleState,
  ResourceRecord,
  ResourceRegistrationOptions,
  ResourceScope,
  IDisposable,
} from "./types.js";

interface InternalResourceEntry<T = any> {
  readonly id: string;
  readonly category: ResourceCategory;
  ownerId: string;
  scopeId?: string;
  readonly createdAt: number;
  lastAccessedAt: number;
  estimatedBytes: number;
  state: ResourceLifecycleState;
  refCount: number;
  readonly disposalStrategy: ResourceRegistrationOptions["disposalStrategy"];
  readonly onDispose?: (resource: T) => void;
  readonly dependencies: readonly string[];
  isPinned: boolean;
  metadata: Record<string, any>;
  rawResource: T;
}

interface InternalScopeEntry {
  readonly id: string;
  ownerId: string;
  readonly parentScopeId?: string;
  readonly childScopeIds: Set<string>;
  readonly resourceIds: Set<string>;
  isDisposed: boolean;
  readonly createdAt: number;
}

export class ResourceRegistry implements IResourceRegistry {
  private readonly _entries = new Map<string, InternalResourceEntry>();
  private readonly _scopes = new Map<string, InternalScopeEntry>();
  private _sequence = 0;
  private _isDisposed = false;

  public get size(): number {
    let count = 0;
    for (const e of this._entries.values()) {
      if (e.state !== "disposed" && e.state !== "lost") count++;
    }
    return count;
  }

  public registerResource<T = any>(options: ResourceRegistrationOptions<T>): string {
    if (this._isDisposed) {
      throw new Error("Cannot register resource: ResourceRegistry is disposed");
    }

    const id = options.id ?? `res_${options.category}_${++this._sequence}_${Date.now()}`;
    const ownerId = options.ownerId ?? options.scopeId ?? "root";

    const entry: InternalResourceEntry<T> = {
      id,
      category: options.category,
      ownerId,
      scopeId: options.scopeId,
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
      estimatedBytes: options.estimatedBytes ?? 0,
      state: "active",
      refCount: 1,
      disposalStrategy: options.disposalStrategy ?? "immediate",
      onDispose: options.onDispose,
      dependencies: options.dependencies ? [...options.dependencies] : [],
      isPinned: options.isPinned ?? false,
      metadata: options.metadata ? { ...options.metadata } : {},
      rawResource: options.resource,
    };

    this._entries.set(id, entry);

    // Link to scope if specified
    if (options.scopeId) {
      const scope = this._scopes.get(options.scopeId);
      if (scope && !scope.isDisposed) {
        scope.resourceIds.add(id);
      }
    }

    return id;
  }

  public unregisterResource(resourceId: string, forceDispose = false): boolean {
    const entry = this._entries.get(resourceId);
    if (!entry) return false;

    if (forceDispose && entry.state !== "disposed") {
      this.disposeResource(resourceId);
    }

    // Remove from scope
    if (entry.scopeId) {
      const scope = this._scopes.get(entry.scopeId);
      if (scope) {
        scope.resourceIds.delete(resourceId);
      }
    }

    return this._entries.delete(resourceId);
  }

  public getResourceRecord(resourceId: string): ResourceRecord | undefined {
    const entry = this._entries.get(resourceId);
    if (!entry) return undefined;
    entry.lastAccessedAt = Date.now();
    return this.toRecord(entry);
  }

  public getRawResource<T = any>(resourceId: string): T | undefined {
    const entry = this._entries.get(resourceId);
    if (!entry || entry.state === "disposed" || entry.state === "lost") {
      return undefined;
    }
    entry.lastAccessedAt = Date.now();
    return entry.rawResource as T;
  }

  public hasResource(resourceId: string): boolean {
    const entry = this._entries.get(resourceId);
    return !!entry && entry.state !== "disposed" && entry.state !== "lost";
  }

  public retainResource(resourceId: string): number {
    const entry = this._entries.get(resourceId);
    if (!entry || entry.state === "disposed" || entry.state === "lost") {
      return 0;
    }
    entry.refCount++;
    entry.lastAccessedAt = Date.now();
    return entry.refCount;
  }

  public releaseResource(resourceId: string): number {
    const entry = this._entries.get(resourceId);
    if (!entry || entry.state === "disposed" || entry.state === "lost") {
      return 0;
    }
    entry.refCount--;
    entry.lastAccessedAt = Date.now();

    if (entry.refCount <= 0) {
      this.disposeResource(resourceId);
      return 0;
    }

    return entry.refCount;
  }

  public transferResourceOwnership(resourceId: string, newOwnerId: string): boolean {
    const entry = this._entries.get(resourceId);
    if (!entry || entry.state === "disposed") return false;
    entry.ownerId = newOwnerId;
    entry.lastAccessedAt = Date.now();
    return true;
  }

  public createResourceScope(ownerId?: string, parentScopeId?: string): ResourceScope {
    const scopeId = `scope_${++this._sequence}_${Date.now()}`;
    const effectiveOwner = ownerId ?? `scope_owner_${scopeId}`;

    const scopeEntry: InternalScopeEntry = {
      id: scopeId,
      ownerId: effectiveOwner,
      parentScopeId,
      childScopeIds: new Set<string>(),
      resourceIds: new Set<string>(),
      isDisposed: false,
      createdAt: Date.now(),
    };

    this._scopes.set(scopeId, scopeEntry);

    if (parentScopeId) {
      const parent = this._scopes.get(parentScopeId);
      if (parent && !parent.isDisposed) {
        parent.childScopeIds.add(scopeId);
      }
    }

    return this.createScopeHandle(scopeEntry);
  }

  public disposeResourceScope(scopeId: string): boolean {
    const scope = this._scopes.get(scopeId);
    if (!scope || scope.isDisposed) return false;

    scope.isDisposed = true;

    // 1. Dispose all child scopes first (depth-first)
    for (const childId of scope.childScopeIds) {
      this.disposeResourceScope(childId);
    }

    // 2. Dispose all owned resources
    for (const resId of scope.resourceIds) {
      this.disposeResource(resId);
    }
    scope.resourceIds.clear();

    // 3. Unlink from parent scope
    if (scope.parentScopeId) {
      const parent = this._scopes.get(scope.parentScopeId);
      if (parent) {
        parent.childScopeIds.delete(scopeId);
      }
    }

    return true;
  }

  public disposeResource(resourceId: string): boolean {
    const entry = this._entries.get(resourceId);
    if (!entry || entry.state === "disposed" || entry.state === "disposing") {
      return false; // Idempotent guard
    }

    entry.state = "disposing";

    // 1. Dispose dependent resources that depend on this resource first
    for (const other of this._entries.values()) {
      if (other.id !== entry.id && other.dependencies.includes(entry.id) && other.state !== "disposed") {
        this.disposeResource(other.id);
      }
    }

    // 2. Invoke custom onDispose callback if present
    if (entry.onDispose) {
      try {
        entry.onDispose(entry.rawResource);
      } catch (err) {
        console.error(`Error in onDispose callback for resource ${entry.id}:`, err);
      }
    }

    // 3. Invoke standard dispose() method on raw resource if present
    const raw = entry.rawResource;
    if (raw && typeof (raw as IDisposable).dispose === "function") {
      try {
        (raw as IDisposable).dispose();
      } catch (err) {
        console.error(`Error calling dispose() on resource ${entry.id}:`, err);
      }
    }

    entry.state = "disposed";
    entry.refCount = 0;
    return true;
  }

  public getAllRecords(): readonly ResourceRecord[] {
    const records: ResourceRecord[] = [];
    for (const entry of this._entries.values()) {
      records.push(this.toRecord(entry));
    }
    return records;
  }

  public getRecordsByCategory(category: ResourceCategory): readonly ResourceRecord[] {
    const records: ResourceRecord[] = [];
    for (const entry of this._entries.values()) {
      if (entry.category === category) {
        records.push(this.toRecord(entry));
      }
    }
    return records;
  }

  public getRecordsByOwner(ownerId: string): readonly ResourceRecord[] {
    const records: ResourceRecord[] = [];
    for (const entry of this._entries.values()) {
      if (entry.ownerId === ownerId) {
        records.push(this.toRecord(entry));
      }
    }
    return records;
  }

  public disposeAll(): void {
    if (this._isDisposed) return;
    this._isDisposed = true;

    // Dispose all active scopes
    for (const scopeId of this._scopes.keys()) {
      this.disposeResourceScope(scopeId);
    }
    this._scopes.clear();

    // Dispose all resources
    for (const resId of this._entries.keys()) {
      this.disposeResource(resId);
    }
    this._entries.clear();
  }

  private toRecord(entry: InternalResourceEntry): ResourceRecord {
    return {
      id: entry.id,
      category: entry.category,
      ownerId: entry.ownerId,
      scopeId: entry.scopeId,
      createdAt: entry.createdAt,
      lastAccessedAt: entry.lastAccessedAt,
      estimatedBytes: entry.estimatedBytes,
      state: entry.state,
      refCount: entry.refCount,
      disposalStrategy: entry.disposalStrategy ?? "immediate",
      dependencies: entry.dependencies,
      isPinned: entry.isPinned,
      metadata: entry.metadata,
    };
  }

  private createScopeHandle(entry: InternalScopeEntry): ResourceScope {
    const registry = this;
    return {
      get id(): string { return entry.id; },
      get ownerId(): string { return entry.ownerId; },
      get parentScopeId(): string | undefined { return entry.parentScopeId; },
      get childScopeIds(): readonly string[] { return Array.from(entry.childScopeIds); },
      get resourceIds(): readonly string[] { return Array.from(entry.resourceIds); },
      get isDisposed(): boolean { return entry.isDisposed; },
      get createdAt(): number { return entry.createdAt; },
      dispose(): void {
        registry.disposeResourceScope(entry.id);
      },
    };
  }
}

export function createResourceRegistry(): ResourceRegistry {
  return new ResourceRegistry();
}
