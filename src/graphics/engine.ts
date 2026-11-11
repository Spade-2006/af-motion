import { detectGraphicsCapabilities } from "./capabilities.js";
import { Canvas2DRenderer, createRenderer, NullRenderer } from "./renderer.js";
import { createResourceManager } from "./resource-manager.js";
import type {
  GraphicsCapabilities,
  GraphicsEffect,
  GraphicsEffectInitContext,
  GraphicsEffectUpdateContext,
  GraphicsEngine,
  GraphicsEngineOptions,
  GraphicsEngineState,
  Renderer,
  RendererOptions,
  RenderFrameContext,
  ResourceManager,
} from "./types.js";
import { getCanvasDimensions, setupResizeObserver, setupVisibilityObserver, updateCanvasDimensions } from "./viewport.js";

/**
 * Creates an instance of AF Motion's framework-independent Graphics Engine.
 */
export function createGraphicsEngine(options: GraphicsEngineOptions = {}): GraphicsEngine {
  const {
    renderer: rendererOption,
    dpr: dprOption = "auto",
    autoStart = true,
    pauseOnHidden = true,
    respectReducedMotion = true,
    fpsLimit,
  } = options;

  let state: GraphicsEngineState = "idle";
  let canvas: HTMLCanvasElement | null = null;
  let renderer: Renderer | null = null;
  const resourceManager = createResourceManager();
  const effectsMap = new Map<string, GraphicsEffect>();
  const stateListeners = new Set<(state: GraphicsEngineState) => void>();

  let animFrameId: number | null = null;
  let lastTime: number = 0;
  let elapsedTime: number = 0;
  let frameIndex: number = 0;
  let isContextLost = false;
  let isTabHidden = false;

  let cleanupResize: (() => void) | null = null;
  let cleanupVisibility: (() => void) | null = null;
  let cleanupContextLost: (() => void) | null = null;
  let cleanupContextRestored: (() => void) | null = null;

  function setState(nextState: GraphicsEngineState): void {
    if (state === nextState || state === "destroyed") return;
    state = nextState;
    for (const listener of stateListeners) {
      try {
        listener(state);
      } catch (err) {
        console.warn("[AF Motion Engine] State listener error:", err);
      }
    }
  }

  function resolveDpr(): number {
    if (typeof dprOption === "number" && dprOption > 0) return dprOption;
    if (typeof window !== "undefined" && typeof window.devicePixelRatio === "number") {
      return Math.max(1, window.devicePixelRatio);
    }
    return 1;
  }

  function stopRenderLoop(): void {
    if (animFrameId !== null) {
      if (typeof cancelAnimationFrame === "function") {
        cancelAnimationFrame(animFrameId);
      } else {
        clearTimeout(animFrameId);
      }
      animFrameId = null;
    }
  }

  function scheduleNextFrame(): void {
    if (state !== "running" || isContextLost || isTabHidden || effectsMap.size === 0) {
      stopRenderLoop();
      return;
    }

    if (animFrameId !== null) return;

    if (typeof requestAnimationFrame === "function") {
      animFrameId = requestAnimationFrame(onFrame);
    } else {
      animFrameId = setTimeout(() => onFrame(Date.now()), 16) as unknown as number;
    }
  }

  function onFrame(timestamp: number): void {
    animFrameId = null;

    if (state !== "running" || isContextLost || isTabHidden || !canvas || !renderer) {
      return;
    }

    if (lastTime === 0) {
      lastTime = timestamp;
    }

    const deltaMs = timestamp - lastTime;

    // Apply FPS limit if specified
    if (typeof fpsLimit === "number" && fpsLimit > 0) {
      const minDeltaMs = 1000 / fpsLimit;
      if (deltaMs < minDeltaMs) {
        scheduleNextFrame();
        return;
      }
    }

    lastTime = timestamp;
    // Cap delta at 0.1s to avoid huge jumps after tab freeze
    const deltaTime = Math.min(0.1, deltaMs / 1000);
    elapsedTime += deltaTime;
    frameIndex++;

    renderInternal(timestamp, deltaTime);

    scheduleNextFrame();
  }

  function renderInternal(time: number, deltaTime: number): void {
    if (!canvas || !renderer) return;

    const dpr = resolveDpr();
    const dims = getCanvasDimensions(canvas, dpr);

    const frameContext: RenderFrameContext = {
      time,
      deltaTime,
      elapsedTime,
      frameIndex,
      width: dims.width,
      height: dims.height,
      pixelWidth: dims.pixelWidth,
      pixelHeight: dims.pixelHeight,
      dpr,
      canvas,
      backend: renderer.backend,
      rawContext: (renderer as unknown as { ctx?: unknown; gl?: unknown }).ctx ||
        (renderer as unknown as { gl?: unknown }).gl ||
        null,
    };

    // 1. Clear and prepare frame
    renderer.clear();
    renderer.render(frameContext);

    // 2. Render all active effects
    const updateContext: GraphicsEffectUpdateContext = {
      ...frameContext,
      renderer,
      resourceManager,
    };

    for (const effect of effectsMap.values()) {
      try {
        effect.render(updateContext);
      } catch (err) {
        console.warn(`[AF Motion Engine] Error rendering effect "${effect.id}":`, err);
      }
    }
  }

  function initEffect(effect: GraphicsEffect): void {
    if (!canvas || !renderer || !renderer.isInitialized) return;

    const dpr = resolveDpr();
    const dims = getCanvasDimensions(canvas, dpr);

    const initContext: GraphicsEffectInitContext = {
      canvas,
      renderer,
      capabilities: renderer.getCapabilities(),
      resourceManager,
      width: dims.width,
      height: dims.height,
      dpr,
    };

    try {
      const result = effect.init?.(initContext);
      if (result && typeof (result as Promise<void>).catch === "function") {
        (result as Promise<void>).catch((err) => {
          console.warn(`[AF Motion Engine] Async init failed for effect "${effect.id}":`, err);
          resourceManager.disposeOwnedBy(effect.id);
        });
      }
    } catch (err) {
      console.warn(`[AF Motion Engine] Error initializing effect "${effect.id}":`, err);
      resourceManager.disposeOwnedBy(effect.id);
    }
  }

  const engine: GraphicsEngine = {
    get state(): GraphicsEngineState {
      return state;
    },

    get renderer(): Renderer | null {
      return renderer;
    },

    get capabilities(): GraphicsCapabilities {
      return renderer
        ? renderer.getCapabilities()
        : detectGraphicsCapabilities({ targetDpr: resolveDpr() });
    },

    get canvas(): HTMLCanvasElement | null {
      return canvas;
    },

    get resourceManager(): ResourceManager {
      return resourceManager;
    },

    get effects(): readonly GraphicsEffect[] {
      return Object.freeze(Array.from(effectsMap.values()));
    },

    async attach(targetCanvas: HTMLCanvasElement): Promise<void> {
      if (state === "destroyed") {
        return;
      }

      if (!targetCanvas) {
        throw new TypeError("Cannot attach null or undefined canvas");
      }

      if (canvas === targetCanvas && renderer?.isInitialized) {
        return;
      }

      // Detach any previous canvas and observers
      this.detach();

      canvas = targetCanvas;

      // 1. Resolve or create renderer
      if (rendererOption && typeof (rendererOption as Renderer).init === "function") {
        renderer = rendererOption as Renderer;
      } else {
        const renderOpts: RendererOptions = typeof rendererOption === "object"
          ? (rendererOption as RendererOptions)
          : {};
        renderer = createRenderer(renderOpts);
      }

      // 2. Initialize renderer on target canvas with fallback
      try {
        await renderer.init(canvas, typeof rendererOption === "object" && !(rendererOption as Renderer).init ? rendererOption as RendererOptions : undefined);
      } catch (err) {
        console.warn("[AF Motion Engine] Primary renderer initialization failed; attempting Canvas2D fallback:", err);
        try {
          renderer.destroy();
        } catch {
          // Ignore destruction error
        }

        // Fallback to Canvas2D (or NullRenderer in headless)
        renderer = typeof window !== "undefined" && typeof document !== "undefined"
          ? new Canvas2DRenderer()
          : new NullRenderer();

        try {
          await renderer.init(canvas);
        } catch (fallbackErr) {
          console.warn("[AF Motion Engine] Fallback renderer also failed; defaulting to NullRenderer:", fallbackErr);
          renderer = new NullRenderer();
          renderer.init(canvas);
        }
      }

      // 3. Size initial canvas
      const dpr = resolveDpr();
      const dims = getCanvasDimensions(canvas, dpr);
      updateCanvasDimensions(canvas, dims.width, dims.height, dpr);
      renderer.resize(dims.width, dims.height, dpr);

      // 4. Attach context loss & restore listeners
      cleanupContextLost = renderer.onContextLost(() => {
        isContextLost = true;
        stopRenderLoop();
      });

      cleanupContextRestored = renderer.onContextRestored(() => {
        isContextLost = false;
        if (state === "running") {
          scheduleNextFrame();
        }
      });

      // 5. Attach resize observer
      cleanupResize = setupResizeObserver(canvas, (w, h) => {
        this.resize(w, h);
      });

      // 6. Attach visibility observer if configured
      if (pauseOnHidden) {
        cleanupVisibility = setupVisibilityObserver((visible) => {
          isTabHidden = !visible;
          if (isTabHidden) {
            stopRenderLoop();
          } else if (state === "running") {
            lastTime = 0; // Reset lastTime to avoid huge delta
            scheduleNextFrame();
          }
        });
      }

      // 7. Initialize all registered effects
      for (const effect of effectsMap.values()) {
        initEffect(effect);
      }

      // 8. Auto start if configured
      if (autoStart && effectsMap.size > 0) {
        this.start();
      }
    },

    detach(): void {
      stopRenderLoop();

      cleanupResize?.();
      cleanupResize = null;
      cleanupVisibility?.();
      cleanupVisibility = null;
      cleanupContextLost?.();
      cleanupContextLost = null;
      cleanupContextRestored?.();
      cleanupContextRestored = null;

      if (renderer) {
        try {
          renderer.destroy();
        } catch {
          // Ignore renderer destruction error
        }
        renderer = null;
      }

      canvas = null;
      setState("idle");
    },

    registerEffect(effect: GraphicsEffect): void {
      if (!effect || !effect.id) {
        throw new TypeError("Cannot register invalid GraphicsEffect: id is required");
      }

      // If already registered, unregister first to avoid duplicates
      if (effectsMap.has(effect.id)) {
        this.unregisterEffect(effect.id);
      }

      effectsMap.set(effect.id, effect);

      // Check reduced motion requirement
      if (respectReducedMotion && effect.accessibility?.respectsReducedMotion) {
        const caps = this.capabilities;
        if (caps.reducedMotion && effect.accessibility?.staticFallback) {
          // Render a single static frame and don't loop
          if (canvas && renderer?.isInitialized) {
            initEffect(effect);
            this.requestFrame();
          }
          return;
        }
      }

      // Initialize if engine is attached
      if (canvas && renderer?.isInitialized) {
        initEffect(effect);
        if (state === "running") {
          scheduleNextFrame();
        } else if (autoStart && state !== "paused") {
          this.start();
        }
      }
    },

    unregisterEffect(effectId: string): boolean {
      const effect = effectsMap.get(effectId);
      if (!effect) return false;

      try {
        effect.dispose?.();
      } catch (err) {
        console.warn(`[AF Motion Engine] Error disposing effect "${effectId}":`, err);
      }

      // Clean up all resources owned by this effect
      resourceManager.disposeOwnedBy(effectId);

      effectsMap.delete(effectId);

      // Stop loop if no effects remain to avoid wasteful work
      if (effectsMap.size === 0 && state === "running") {
        stopRenderLoop();
      }

      return true;
    },

    getEffect(effectId: string): GraphicsEffect | undefined {
      return effectsMap.get(effectId);
    },

    hasEffect(effectId: string): boolean {
      return effectsMap.has(effectId);
    },

    start(): void {
      if (state === "destroyed") return;
      lastTime = 0;
      setState("running");
      scheduleNextFrame();
    },

    stop(): void {
      if (state === "destroyed") return;
      stopRenderLoop();
      setState("idle");
    },

    pause(): void {
      if (state === "destroyed" || state === "paused") return;
      stopRenderLoop();
      setState("paused");
      for (const effect of effectsMap.values()) {
        try {
          effect.pause?.();
        } catch (err) {
          console.warn(`[AF Motion Engine] Error pausing effect "${effect.id}":`, err);
        }
      }
    },

    resume(): void {
      if (state === "destroyed" || state !== "paused") return;
      lastTime = 0;
      setState("running");
      for (const effect of effectsMap.values()) {
        try {
          effect.resume?.();
        } catch (err) {
          console.warn(`[AF Motion Engine] Error resuming effect "${effect.id}":`, err);
        }
      }
      scheduleNextFrame();
    },

    requestFrame(): void {
      if (state === "destroyed" || isContextLost || !canvas || !renderer) return;
      renderInternal(Date.now(), 0.016);
    },

    resize(customWidth?: number, customHeight?: number, customDpr?: number): void {
      if (!canvas || !renderer) return;

      const dpr = typeof customDpr === "number" && customDpr > 0 ? customDpr : resolveDpr();
      let width = customWidth;
      let height = customHeight;

      if (width === undefined || height === undefined) {
        const dims = getCanvasDimensions(canvas, dpr);
        width = dims.width;
        height = dims.height;
      }

      updateCanvasDimensions(canvas, width, height, dpr);
      renderer.resize(width, height, dpr);

      for (const effect of effectsMap.values()) {
        try {
          effect.resize?.(width, height, dpr);
        } catch (err) {
          console.warn(`[AF Motion Engine] Error resizing effect "${effect.id}":`, err);
        }
      }

      if (state !== "running") {
        this.requestFrame();
      }
    },

    onStateChange(listener: (state: GraphicsEngineState) => void): () => void {
      stateListeners.add(listener);
      return () => stateListeners.delete(listener);
    },

    destroy(): void {
      if (state === "destroyed") return;

      this.detach();

      // Dispose all effects
      for (const effect of effectsMap.values()) {
        try {
          effect.dispose?.();
        } catch (err) {
          console.warn(`[AF Motion Engine] Error disposing effect "${effect.id}" during destroy:`, err);
        }
      }
      effectsMap.clear();

      // Dispose all resources
      resourceManager.disposeAll();

      setState("destroyed");
      stateListeners.clear();
    },
  };

  return engine;
}
