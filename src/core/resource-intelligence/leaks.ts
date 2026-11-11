/**
 * AF Motion — Resource Leak Detection Diagnostics
 *
 * Deterministically analyzes registered resources to detect abandoned scopes,
 * unreleased temporary allocations, unbalanced reference counts, and GPU leaks.
 */

import type {
  IResourceRegistry,
  ResourceLeakItem,
  ResourceRecord,
} from "./types.js";

export interface LeakDetectionOptions {
  temporaryMaxAgeMs?: number; // default 15,000ms
  idleMaxAgeMs?: number; // default 60,000ms
  maxExpectedRefCount?: number; // default 20
}

export function detectResourceLeaks(
  registry: IResourceRegistry,
  options: LeakDetectionOptions = {}
): readonly ResourceLeakItem[] {
  const tempMaxAge = options.temporaryMaxAgeMs ?? 15000;
  const idleMaxAge = options.idleMaxAgeMs ?? 60000;
  const maxRef = options.maxExpectedRefCount ?? 20;

  const now = Date.now();
  const records = registry.getAllRecords();
  const leaks: ResourceLeakItem[] = [];

  for (const rec of records) {
    if (rec.state === "disposed" || rec.state === "lost") continue;
    if (rec.isPinned) continue; // Pinned resources are intentionally retained

    const age = now - rec.createdAt;
    const idleDuration = now - rec.lastAccessedAt;

    // 1. Temporary resources active beyond expected lifetime
    if (rec.ownerId.startsWith("temp_") && age >= tempMaxAge) {
      leaks.push({
        resourceId: rec.id,
        category: rec.category,
        ownerId: rec.ownerId,
        ageMs: age,
        estimatedBytes: rec.estimatedBytes,
        severity: "medium",
        description: `Temporary resource remained active for ${Math.round(age / 1000)}s.`,
        suspectedCause: "Scope did not release or dispose temporary allocation upon completion.",
      });
      continue;
    }

    // 2. Unbalanced reference counts
    if (rec.refCount > maxRef) {
      leaks.push({
        resourceId: rec.id,
        category: rec.category,
        ownerId: rec.ownerId,
        ageMs: age,
        estimatedBytes: rec.estimatedBytes,
        severity: "high",
        description: `Unusually high reference count (${rec.refCount}).`,
        suspectedCause: "Retain called repeatedly without matching release calls.",
      });
      continue;
    }

    // 3. Stale idle GPU resources without recent access
    const isGpuResource =
      rec.category === "gpu_buffer" ||
      rec.category === "gpu_texture" ||
      rec.category === "framebuffer" ||
      rec.category === "webgl_resource";

    if (isGpuResource && idleDuration >= idleMaxAge && rec.ownerId !== "root") {
      leaks.push({
        resourceId: rec.id,
        category: rec.category,
        ownerId: rec.ownerId,
        ageMs: age,
        estimatedBytes: rec.estimatedBytes,
        severity: rec.estimatedBytes > 10 * 1024 * 1024 ? "high" : "medium",
        description: `GPU resource idle for ${Math.round(idleDuration / 1000)}s without access.`,
        suspectedCause: "Subsystem unmounted without explicitly disposing GPU textures or framebuffers.",
      });
    }
  }

  return leaks;
}
