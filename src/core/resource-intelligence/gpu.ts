/**
 * AF Motion — GPU Resource Intelligence & Context Lifecycle
 *
 * WebGL and WebGPU context loss resilience, texture/buffer lifecycle tracking,
 * and safe disposal that avoids crashes when underlying GPU contexts are invalidated.
 */

import type { IResourceRegistry, ResourceRecord } from "./types.js";

export class GpuResourceIntelligence {
  private readonly _registry: IResourceRegistry;
  private _isContextLost = false;

  constructor(registry: IResourceRegistry) {
    this._registry = registry;
  }

  public get isContextLost(): boolean {
    return this._isContextLost;
  }

  public handleContextLost(): void {
    this._isContextLost = true;

    // Mark all GPU resources as lost
    const gpuCategories = new Set([
      "gpu_buffer",
      "gpu_texture",
      "framebuffer",
      "render_target",
      "shader_program",
      "webgl_resource",
      "webgpu_resource",
    ]);

    for (const record of this._registry.getAllRecords()) {
      if (gpuCategories.has(record.category) && record.state === "active") {
        const raw = this._registry.getRawResource(record.id);
        if (raw && typeof raw === "object") {
          (raw as any).isContextLost = true;
        }
      }
    }
  }

  public handleContextRestored(): void {
    this._isContextLost = false;
  }

  public safeGpuDispose(resource: { dispose?: () => void; deleteBuffer?: () => void }): void {
    if (this._isContextLost) {
      // GPU context is invalid; underlying drivers already reaped the handle.
      return;
    }
    try {
      if (typeof resource.dispose === "function") {
        resource.dispose();
      } else if (typeof resource.deleteBuffer === "function") {
        resource.deleteBuffer();
      }
    } catch (err) {
      console.warn("Handled harmless error during GPU resource disposal:", err);
    }
  }
}
