/**
 * AF Motion Unified Simulation Lifecycle Coordinator
 *
 * Framework-independent master orchestration layer coordinating GPU compute,
 * particles, fluid dynamics, environmental effects, and interactive force fields
 * with shared timestepping, visibility-aware pausing, and deterministic execution.
 */

import { subscribeAnimationFrames } from "../../core/animation.js";
import { setupCanvasContextLossRecovery, SimulationResourceManager } from "./resource-manager.js";
import { AdaptiveQualityController } from "./optimizer.js";
import type {
  SimulationCoordinator,
  SimulationCoordinatorConfig,
  SimulationCoordinatorMetrics,
  SimulationCoordinatorState,
  SimulationParticipant,
  SimulationQuality,
} from "./types.js";

export class UnifiedSimulationCoordinator implements SimulationCoordinator {
  private participants: Map<string, SimulationParticipant> = new Map();
  private sortedParticipants: SimulationParticipant[] = [];
  private state: SimulationCoordinatorState = "idle";
  private canvas: HTMLCanvasElement | null = null;
  private qualityController: AdaptiveQualityController;
  private resourceManager = new SimulationResourceManager();

  // Timing configuration
  private mode: "fixed" | "variable" | "substep";
  private fixedDelta: number;
  private maxDelta: number;
  private substeps: number;
  private timeScale: number;

  // Runtime metrics & states
  private totalSimulationTime = 0;
  private frameCount = 0;
  private lastFrameTimestamp = 0;
  private timeAccumulator = 0;
  private lastFpsUpdateTime = 0;
  private framesThisSecond = 0;
  private currentFps = 60;
  private lastFrameDurationMs = 0;
  private lastStepDurationMs = 0;
  private lastRenderDurationMs = 0;
  private isReducedMotion = false;

  // Scheduler unbind function
  private unsubscribeScheduler: (() => void) | null = null;
  private unbindContextLoss: (() => void) | null = null;

  // Config options
  private config: SimulationCoordinatorConfig;

  constructor(config: SimulationCoordinatorConfig = {}) {
    this.config = config;
    this.canvas = config.canvas || null;

    const ts = config.timestep || {};
    this.mode = ts.mode || "variable";
    this.fixedDelta = Math.max(0.001, ts.fixedDelta ?? 1 / 60);
    this.maxDelta = Math.max(0.01, ts.maxDelta ?? 0.1);
    this.substeps = Math.max(1, Math.min(16, ts.substeps ?? 1));
    this.timeScale = Math.max(0, ts.timeScale ?? 1.0);

    this.qualityController = new AdaptiveQualityController(config.quality || "high");

    this.checkReducedMotion();
    this.setupContextLoss();

    if (config.autoStart !== false) {
      this.start();
    }
  }

  private checkReducedMotion(): void {
    if (this.config.respectReducedMotion !== false && typeof window !== "undefined" && window.matchMedia) {
      try {
        const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
        this.isReducedMotion = mql.matches;
        const handler = (e: MediaQueryListEvent) => {
          this.isReducedMotion = e.matches;
        };
        if (typeof mql.addEventListener === "function") {
          mql.addEventListener("change", handler);
          this.resourceManager.track(() => mql.removeEventListener("change", handler));
        }
      } catch {
        // Fallback gracefully in unsupported environments
      }
    }
  }

  private setupContextLoss(): void {
    if (this.unbindContextLoss) {
      this.unbindContextLoss();
      this.unbindContextLoss = null;
    }
    if (this.canvas) {
      this.unbindContextLoss = setupCanvasContextLossRecovery(
        this.canvas,
        () => this.handleContextLost(),
        () => this.handleContextRestored()
      );
      this.resourceManager.track(() => {
        if (this.unbindContextLoss) {
          this.unbindContextLoss();
          this.unbindContextLoss = null;
        }
      });
    }
  }

  register(participant: SimulationParticipant): () => void {
    if (this.state === "disposed") {
      participant.dispose();
      return () => {};
    }

    this.participants.set(participant.id, participant);
    this.rebuildSortedList();

    // Sync initial quality
    if (participant.setQuality) {
      participant.setQuality(this.qualityController.quality);
    }

    return () => {
      this.unregister(participant.id);
    };
  }

  unregister(id: string): void {
    if (this.participants.delete(id)) {
      this.rebuildSortedList();
    }
  }

  getParticipant(id: string): SimulationParticipant | undefined {
    return this.participants.get(id);
  }

  listParticipants(): readonly SimulationParticipant[] {
    return this.sortedParticipants;
  }

  private rebuildSortedList(): void {
    this.sortedParticipants = Array.from(this.participants.values()).sort(
      (a, b) => (a.priority ?? 0) - (b.priority ?? 0)
    );
  }

  start(): void {
    if (this.state === "running" || this.state === "disposed") return;

    this.state = "running";
    this.lastFrameTimestamp = typeof performance !== "undefined" ? performance.now() : Date.now();
    this.timeAccumulator = 0;

    for (const p of this.sortedParticipants) {
      p.resume?.();
    }

    this.config.onStateChange?.(this.state);

    if (!this.unsubscribeScheduler) {
      this.unsubscribeScheduler = subscribeAnimationFrames((time) => {
        this.onAnimationFrame(time);
      });
    }
  }

  pause(): void {
    if (this.state !== "running") return;

    this.state = "paused";
    if (this.unsubscribeScheduler) {
      this.unsubscribeScheduler();
      this.unsubscribeScheduler = null;
    }

    for (const p of this.sortedParticipants) {
      p.pause?.();
    }

    this.config.onStateChange?.(this.state);
  }

  resume(): void {
    if (this.state === "paused") {
      this.start();
    }
  }

  reset(): void {
    this.totalSimulationTime = 0;
    this.frameCount = 0;
    this.timeAccumulator = 0;
    this.lastFrameTimestamp = typeof performance !== "undefined" ? performance.now() : Date.now();

    for (const p of this.sortedParticipants) {
      p.reset?.();
    }
  }

  private onAnimationFrame(now: number): void {
    if (this.state !== "running") return;

    // Calculate raw delta time
    const rawDt = Math.max(0, (now - this.lastFrameTimestamp) / 1000);
    this.lastFrameTimestamp = now;

    // Frame metrics
    this.framesThisSecond++;
    if (now - this.lastFpsUpdateTime >= 1000) {
      this.currentFps = Math.round((this.framesThisSecond * 1000) / (now - this.lastFpsUpdateTime));
      this.framesThisSecond = 0;
      this.lastFpsUpdateTime = now;
    }

    // Reduced motion adaptation: clamp dt or scale down
    const effectiveTimeScale = this.isReducedMotion ? this.timeScale * 0.25 : this.timeScale;
    const clampedDt = Math.min(rawDt, this.maxDelta) * effectiveTimeScale;

    const frameStart = typeof performance !== "undefined" ? performance.now() : Date.now();

    // 1. Simulation Step Pipeline
    const stepStart = frameStart;
    if (this.mode === "fixed") {
      this.timeAccumulator += clampedDt;
      while (this.timeAccumulator >= this.fixedDelta) {
        this.executeStep(this.fixedDelta);
        this.timeAccumulator -= this.fixedDelta;
      }
    } else if (this.mode === "substep") {
      const subDt = clampedDt / this.substeps;
      for (let s = 0; s < this.substeps; s++) {
        this.executeStep(subDt);
      }
    } else {
      // Variable mode
      this.executeStep(clampedDt);
    }
    const stepEnd = typeof performance !== "undefined" ? performance.now() : Date.now();
    this.lastStepDurationMs = stepEnd - stepStart;

    // 2. Render Pipeline
    const renderStart = stepEnd;
    this.render();
    const renderEnd = typeof performance !== "undefined" ? performance.now() : Date.now();
    this.lastRenderDurationMs = renderEnd - renderStart;

    this.lastFrameDurationMs = renderEnd - frameStart;
    this.frameCount++;

    // Adaptive quality record
    const quality = this.qualityController.recordFrame(this.lastFrameDurationMs);
    if (quality !== this.getQuality()) {
      this.setQuality(quality);
    }
  }

  step(explicitDt?: number): void {
    const dt = explicitDt !== undefined ? explicitDt : this.fixedDelta;
    this.executeStep(dt * this.timeScale);
  }

  private executeStep(dt: number): void {
    if (dt <= 0) return;
    this.totalSimulationTime += dt;

    for (const participant of this.sortedParticipants) {
      try {
        participant.step(dt, this.totalSimulationTime);
      } catch (err) {
        console.error(`SimulationParticipant [${participant.id}] step failed:`, err);
      }
    }

    this.config.onStep?.(dt, this.totalSimulationTime);
  }

  render(): void {
    if (!this.canvas) return;

    let ctx2d: CanvasRenderingContext2D | null = null;
    let gl: WebGL2RenderingContext | null = null;

    // Clear canvas if requested
    if (this.config.clearBeforeRender !== false) {
      try {
        ctx2d = this.canvas.getContext("2d");
        if (ctx2d) {
          if (this.config.clearColor) {
            ctx2d.fillStyle = this.config.clearColor;
            ctx2d.fillRect(0, 0, this.canvas.width, this.canvas.height);
          } else {
            ctx2d.clearRect(0, 0, this.canvas.width, this.canvas.height);
          }
        } else {
          gl = this.canvas.getContext("webgl2") as WebGL2RenderingContext | null;
          if (gl) {
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
          }
        }
      } catch {
        // Safe context lookup
      }
    }

    // Render each participant in priority sequence
    for (const participant of this.sortedParticipants) {
      if (typeof participant.render === "function") {
        try {
          participant.render(this.canvas, (ctx2d || gl) as any);
        } catch (err) {
          console.error(`SimulationParticipant [${participant.id}] render failed:`, err);
        }
      }
    }
  }

  setQuality(quality: SimulationQuality): void {
    this.qualityController.setQuality(quality);
    for (const p of this.sortedParticipants) {
      p.setQuality?.(quality);
    }
  }

  getQuality(): SimulationQuality {
    return this.qualityController.quality;
  }

  getState(): SimulationCoordinatorState {
    return this.state;
  }

  getMetrics(): SimulationCoordinatorMetrics {
    return {
      state: this.state,
      participantCount: this.participants.size,
      fps: this.currentFps,
      frameTimeMs: Math.round(this.lastFrameDurationMs * 100) / 100,
      stepTimeMs: Math.round(this.lastStepDurationMs * 100) / 100,
      renderTimeMs: Math.round(this.lastRenderDurationMs * 100) / 100,
      totalSimulationTime: Math.round(this.totalSimulationTime * 1000) / 1000,
      frameCount: this.frameCount,
      quality: this.getQuality(),
      isReducedMotion: this.isReducedMotion,
    };
  }

  setCanvas(canvas: HTMLCanvasElement | null): void {
    if (this.canvas === canvas) return;
    this.canvas = canvas;
    this.setupContextLoss();
  }

  getCanvas(): HTMLCanvasElement | null {
    return this.canvas;
  }

  handleContextLost(): void {
    for (const p of this.sortedParticipants) {
      p.onContextLost?.();
    }
  }

  handleContextRestored(): void {
    for (const p of this.sortedParticipants) {
      p.onContextRestored?.();
    }
  }

  dispose(): void {
    if (this.state === "disposed") return;

    this.pause();
    this.state = "disposed";

    for (const participant of this.sortedParticipants) {
      try {
        participant.dispose();
      } catch {
        // Continue cleanups
      }
    }
    this.participants.clear();
    this.sortedParticipants = [];

    this.resourceManager.dispose();
    this.config.onStateChange?.(this.state);
  }
}

/**
 * Factory creating a UnifiedSimulationCoordinator.
 */
export function createSimulationCoordinator(
  config?: SimulationCoordinatorConfig
): SimulationCoordinator {
  return new UnifiedSimulationCoordinator(config);
}
