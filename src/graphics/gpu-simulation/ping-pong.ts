/**
 * AF Motion GPU Simulation Architecture — Ping-Pong Framebuffer Infrastructure
 *
 * Implements deterministic double-buffered ping-pong texture and framebuffer swapping
 * for WebGL2 GPGPU simulation pipelines with completeness validation and cleanup.
 */

import type { ComputeTexture, PingPongFramebuffer, PingPongTextures } from "./types.js";

/**
 * Creates a generic ping-pong state container.
 */
export function createPingPongPair<T>(itemA: T, itemB: T): { current: T; next: T; swap(): void } {
  let isA = true;
  return {
    get current(): T {
      return isA ? itemA : itemB;
    },
    get next(): T {
      return isA ? itemB : itemA;
    },
    swap(): void {
      isA = !isA;
    },
  };
}

/**
 * Creates a ping-pong pair of ComputeTextures.
 */
export function createPingPongTextures(texA: ComputeTexture, texB: ComputeTexture): PingPongTextures {
  return createPingPongPair<ComputeTexture>(texA, texB);
}

/**
 * Creates a WebGL2 Ping-Pong Framebuffer pair bound to two textures for GPGPU simulation.
 */
export function createWebGL2PingPongFramebuffer(
  gl: WebGL2RenderingContext,
  textureA: WebGLTexture,
  textureB: WebGLTexture,
): PingPongFramebuffer {
  const fboA = gl.createFramebuffer();
  const fboB = gl.createFramebuffer();

  if (!fboA || !fboB) {
    if (fboA) gl.deleteFramebuffer(fboA);
    if (fboB) gl.deleteFramebuffer(fboB);
    throw new Error("Failed to allocate WebGL2 framebuffers for ping-pong simulation");
  }

  // Bind texture A to FBO A
  gl.bindFramebuffer(gl.FRAMEBUFFER, fboA);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, textureA, 0);
  const statusA = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if (statusA !== gl.FRAMEBUFFER_COMPLETE) {
    gl.deleteFramebuffer(fboA);
    gl.deleteFramebuffer(fboB);
    throw new Error(`FBO A incomplete status: 0x${statusA.toString(16)}`);
  }

  // Bind texture B to FBO B
  gl.bindFramebuffer(gl.FRAMEBUFFER, fboB);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, textureB, 0);
  const statusB = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if (statusB !== gl.FRAMEBUFFER_COMPLETE) {
    gl.deleteFramebuffer(fboA);
    gl.deleteFramebuffer(fboB);
    throw new Error(`FBO B incomplete status: 0x${statusB.toString(16)}`);
  }

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  let isA = true;
  let disposed = false;

  return {
    get fboA(): unknown {
      return fboA;
    },
    get fboB(): unknown {
      return fboB;
    },
    get currentFbo(): unknown {
      return isA ? fboA : fboB;
    },
    get nextFbo(): unknown {
      return isA ? fboB : fboA;
    },
    get isDisposed(): boolean {
      return disposed;
    },
    swap(): void {
      if (disposed) return;
      isA = !isA;
    },
    dispose(): void {
      if (disposed) return;
      disposed = true;
      try {
        gl.deleteFramebuffer(fboA);
        gl.deleteFramebuffer(fboB);
      } catch {
        // Safe context loss cleanup
      }
    },
  };
}
