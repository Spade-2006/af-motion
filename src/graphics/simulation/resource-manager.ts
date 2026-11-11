/**
 * AF Motion Simulation GPU Resource Management & Recovery
 *
 * Hardened resource ownership, WebGL context-loss/restoration handling,
 * and leak-free resource pooling for simulation subsystems.
 */

export interface ContextLossHandlers {
  onLost: (event: Event) => void;
  onRestored: (event: Event) => void;
}

/**
 * Attaches WebGL/WebGPU context-loss and context-restored listeners to a canvas.
 * Returns an unbind function that safely removes the listeners.
 */
export function setupCanvasContextLossRecovery(
  canvas: HTMLCanvasElement | null,
  onLost: (event: Event) => void,
  onRestored: (event: Event) => void
): () => void {
  if (!canvas || typeof canvas.addEventListener !== "function") {
    return () => {};
  }

  const handleLost = (e: Event): void => {
    // Calling preventDefault prevents the browser from permanently destroying the WebGL context
    if (typeof (e as any).preventDefault === "function") {
      (e as any).preventDefault();
    }
    onLost(e);
  };

  const handleRestored = (e: Event): void => {
    onRestored(e);
  };

  canvas.addEventListener("webglcontextlost", handleLost, false);
  canvas.addEventListener("webglcontextrestored", handleRestored, false);

  return () => {
    if (canvas && typeof canvas.removeEventListener === "function") {
      canvas.removeEventListener("webglcontextlost", handleLost, false);
      canvas.removeEventListener("webglcontextrestored", handleRestored, false);
    }
  };
}

/**
 * Safe cleanup of a WebGL rendering context.
 */
export function safeDisposeWebGLContext(
  gl: WebGLRenderingContext | WebGL2RenderingContext | null | undefined
): void {
  if (!gl) return;
  try {
    const loseContextExt = gl.getExtension("WEBGL_lose_context");
    if (loseContextExt) {
      loseContextExt.loseContext();
    }
  } catch {
    // Ignore errors during context shutdown
  }
}

/**
 * Manages GPU and CPU allocated resources for simulation lifecycles,
 * preventing leaks across mount/unmount cycles.
 */
export class SimulationResourceManager {
  private cleanups: Set<() => void> = new Set();
  private isDisposed = false;

  /**
   * Register a cleanup action to be invoked when the resource manager is disposed.
   */
  track(cleanup: () => void): () => void {
    if (this.isDisposed) {
      try {
        cleanup();
      } catch {
        // Ignore errors during immediate cleanup
      }
      return () => {};
    }

    this.cleanups.add(cleanup);
    return () => {
      this.cleanups.delete(cleanup);
    };
  }

  /**
   * Track canvas event listeners and auto-remove them on dispose.
   */
  trackEventListener(
    target: EventTarget | null | undefined,
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): () => void {
    if (!target || typeof target.addEventListener !== "function") {
      return () => {};
    }

    target.addEventListener(type, listener, options);
    const unbind = () => {
      try {
        target.removeEventListener(type, listener, options);
      } catch {
        // Ignore errors during removal
      }
    };

    return this.track(unbind);
  }

  /**
   * Dispose all tracked resources cleanly.
   */
  dispose(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;

    for (const cleanup of this.cleanups) {
      try {
        cleanup();
      } catch {
        // Safe disposal: continue with remaining cleanups
      }
    }
    this.cleanups.clear();
  }

  get disposed(): boolean {
    return this.isDisposed;
  }
}
