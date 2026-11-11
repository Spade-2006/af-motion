/**
 * AF Motion Multi-System Motion Adapters
 *
 * Normalizes disparate motion engine controls (SVG morph, motion paths,
 * kinetic typography, shared elements, view transitions, animation, physics, custom)
 * into a unified participant contract with lifecycle safety.
 */

import { morphPath } from "../svg-morph/animator.js";
import { animateAlongPath } from "../motion-path/animator.js";
import { animateText } from "../typography/engine.js";
import { createSharedElementTransition } from "../transitions/shared-element-transition.js";
import { startViewTransition } from "../transitions/view-transition.js";
import { animate } from "../animate.js";
import { animateSpring } from "../spring.js";
import { animateInertia } from "../inertia.js";
import type {
  AnimationParticipantConfig,
  CustomParticipantConfig,
  MotionEngineAdapter,
  MotionParticipantConfig,
  MotionParticipantInstance,
  MotionParticipantState,
  MotionPathParticipantConfig,
  PhysicsParticipantConfig,
  SharedElementParticipantConfig,
  SVGMorphParticipantConfig,
  TypographyParticipantConfig,
  ViewTransitionParticipantConfig,
} from "./types.js";

// =============================================================================
// SVG MORPH ADAPTER
// =============================================================================

class SVGMorphAdapterInstance implements MotionParticipantInstance {
  public readonly id: string;
  public readonly system = "svg-morph";
  private controls: ReturnType<typeof morphPath> | null = null;
  private _state: MotionParticipantState = "idle";
  private _progress = 0;
  private readonly config: SVGMorphParticipantConfig;
  private _finishedPromise: Promise<void> | undefined;
  private _resolveFinished: (() => void) | null = null;

  constructor(config: SVGMorphParticipantConfig) {
    this.id = config.id;
    this.config = config;
  }

  public start(): Promise<void> {
    this._state = "running";
    this._finishedPromise = new Promise<void>((resolve) => {
      this._resolveFinished = resolve;
    });

    this.controls = morphPath(this.config.target, this.config.to, {
      ...this.config.options,
      duration: this.config.duration ?? this.config.options?.duration,
      delay: this.config.delay ?? this.config.options?.delay,
      easing: (typeof this.config.easing === "string" ? this.config.easing : undefined) ?? this.config.options?.easing,
      onProgress: (_val, p) => {
        this._progress = p;
        this.config.options?.onProgress?.(_val, p);
      },
      onComplete: () => {
        this._state = "completed";
        this._progress = 1;
        this.config.options?.onComplete?.();
        this._resolveFinished?.();
        this._resolveFinished = null;
      },
    });

    return this._finishedPromise;
  }

  public pause(): void {
    if (this._state === "running") {
      this.controls?.pause();
      this._state = "paused";
    }
  }

  public resume(): void {
    if (this._state === "paused") {
      this.controls?.resume();
      this._state = "running";
    }
  }

  public reverse(): void {
    this.controls?.reverse();
  }

  public seek(progress: number): void {
    this._progress = progress;
    this.controls?.seek(progress);
  }

  public cancel(): void {
    this._state = "cancelled";
    this.controls?.cancel();
    this._resolveFinished?.();
    this._resolveFinished = null;
  }

  public finish(): void {
    this._state = "completed";
    this._progress = 1;
    this.controls?.seek(1);
    this._resolveFinished?.();
    this._resolveFinished = null;
  }

  public dispose(): void {
    this.cancel();
    this.controls?.destroy();
    this.controls = null;
  }

  public getProgress(): number {
    return this._progress;
  }

  public getState(): MotionParticipantState {
    return this._state;
  }

  public get finished(): Promise<void> | undefined {
    return this._finishedPromise;
  }
}

// =============================================================================
// MOTION PATH ADAPTER
// =============================================================================

class MotionPathAdapterInstance implements MotionParticipantInstance {
  public readonly id: string;
  public readonly system = "motion-path";
  private controls: ReturnType<typeof animateAlongPath> | null = null;
  private _state: MotionParticipantState = "idle";
  private _progress = 0;
  private readonly config: MotionPathParticipantConfig;

  constructor(config: MotionPathParticipantConfig) {
    this.id = config.id;
    this.config = config;
  }

  public start(): Promise<void> {
    this._state = "running";
    this.controls = animateAlongPath(this.config.target as any, this.config.path, {
      ...this.config.options,
      duration: this.config.duration ?? this.config.options?.duration,
      delay: this.config.delay ?? this.config.options?.delay,
      easing: (typeof this.config.easing === "string" ? this.config.easing : undefined) ?? this.config.options?.easing,
      onProgress: (p, sample) => {
        this._progress = p;
        this.config.options?.onProgress?.(p, sample);
      },
      onComplete: () => {
        this._state = "completed";
        this._progress = 1;
        this.config.options?.onComplete?.();
      },
    });

    return this.controls.finished.then(() => {
      this._state = "completed";
    });
  }

  public pause(): void {
    if (this._state === "running") {
      this.controls?.pause();
      this._state = "paused";
    }
  }

  public resume(): void {
    if (this._state === "paused") {
      this.controls?.resume();
      this._state = "running";
    }
  }

  public reverse(): void {
    this.controls?.reverse();
  }

  public seek(progress: number): void {
    this._progress = progress;
    this.controls?.seek(progress);
  }

  public cancel(): void {
    this._state = "cancelled";
    this.controls?.cancel();
  }

  public finish(): void {
    this._state = "completed";
    this._progress = 1;
    this.controls?.finish();
  }

  public dispose(): void {
    this.cancel();
    this.controls = null;
  }

  public getProgress(): number {
    return this._progress;
  }

  public getState(): MotionParticipantState {
    return this._state;
  }

  public get finished(): Promise<void> | undefined {
    return this.controls?.finished;
  }
}

// =============================================================================
// TYPOGRAPHY ADAPTER
// =============================================================================

class TypographyAdapterInstance implements MotionParticipantInstance {
  public readonly id: string;
  public readonly system = "typography";
  private controls: ReturnType<typeof animateText> | null = null;
  private _state: MotionParticipantState = "idle";
  private _progress = 0;
  private readonly config: TypographyParticipantConfig;

  constructor(config: TypographyParticipantConfig) {
    this.id = config.id;
    this.config = config;
  }

  public start(): Promise<void> {
    this._state = "running";
    this.controls = animateText(this.config.target, {
      ...this.config.options,
      duration: this.config.duration ?? this.config.options?.duration,
      delay: this.config.delay ?? this.config.options?.delay,
      easing: (typeof this.config.easing === "string" ? this.config.easing : undefined) ?? this.config.options?.easing,
      onProgress: (p, unitIndex) => {
        this._progress = p;
        this.config.options?.onProgress?.(p, unitIndex);
      },
      onComplete: () => {
        this._state = "completed";
        this._progress = 1;
        this.config.options?.onComplete?.();
      },
    });

    return this.controls.finished.then(() => {
      this._state = "completed";
    });
  }

  public pause(): void {
    if (this._state === "running") {
      this.controls?.pause();
      this._state = "paused";
    }
  }

  public resume(): void {
    if (this._state === "paused") {
      this.controls?.resume();
      this._state = "running";
    }
  }

  public reverse(): void {
    this.controls?.reverse();
  }

  public seek(progress: number): void {
    this._progress = progress;
    this.controls?.seek(progress);
  }

  public cancel(): void {
    this._state = "cancelled";
    this.controls?.cancel();
  }

  public finish(): void {
    this._state = "completed";
    this._progress = 1;
    this.controls?.finish();
  }

  public dispose(): void {
    this.cancel();
    this.controls?.destroy();
    this.controls = null;
  }

  public getProgress(): number {
    return this._progress;
  }

  public getState(): MotionParticipantState {
    return this._state;
  }

  public get finished(): Promise<void> | undefined {
    return this.controls?.finished;
  }
}

// =============================================================================
// SHARED ELEMENT ADAPTER
// =============================================================================

class SharedElementAdapterInstance implements MotionParticipantInstance {
  public readonly id: string;
  public readonly system = "shared-element";
  private controls: ReturnType<typeof createSharedElementTransition> | null = null;
  private _state: MotionParticipantState = "idle";
  private _progress = 0;
  private readonly config: SharedElementParticipantConfig;

  constructor(config: SharedElementParticipantConfig) {
    this.id = config.id;
    this.config = config;
  }

  public async start(): Promise<void> {
    this._state = "running";
    this.controls = createSharedElementTransition({
      id: this.config.id,
      source: this.config.source,
      destination: this.config.destination,
      config: {
        ...this.config.options,
        duration: this.config.duration ?? this.config.options?.duration,
        delay: this.config.delay ?? this.config.options?.delay,
        easing: (typeof this.config.easing === "string" ? this.config.easing : undefined) ?? this.config.options?.easing,
        onUpdate: (p) => {
          this._progress = p;
          this.config.options?.onUpdate?.(p);
        },
        onComplete: () => {
          this._state = "completed";
          this._progress = 1;
          this.config.options?.onComplete?.();
        },
      },
    });

    await this.controls.start();
    this._state = "completed";
  }

  public pause(): void {
    this.controls?.pause();
    this._state = "paused";
  }

  public resume(): void {
    this.controls?.resume();
    this._state = "running";
  }

  public reverse(): void {
    this.controls?.reverse();
  }

  public seek(progress: number): void {
    this._progress = progress;
    this.controls?.seek(progress);
  }

  public cancel(): void {
    this._state = "cancelled";
    this.controls?.cancel();
  }

  public finish(): void {
    this._state = "completed";
    this._progress = 1;
    this.controls?.finish();
  }

  public dispose(): void {
    this.cancel();
    this.controls = null;
  }

  public getProgress(): number {
    return this._progress;
  }

  public getState(): MotionParticipantState {
    return this._state;
  }
}

// =============================================================================
// VIEW TRANSITION ADAPTER
// =============================================================================

class ViewTransitionAdapterInstance implements MotionParticipantInstance {
  public readonly id: string;
  public readonly system = "view-transition";
  private instance: ReturnType<typeof startViewTransition> | null = null;
  private _state: MotionParticipantState = "idle";
  private _progress = 0;
  private readonly config: ViewTransitionParticipantConfig;

  constructor(config: ViewTransitionParticipantConfig) {
    this.id = config.id;
    this.config = config;
  }

  public async start(): Promise<void> {
    this._state = "running";
    this.instance = startViewTransition(this.config.update, {
      ...this.config.options,
      duration: this.config.duration,
      onComplete: () => {
        this._state = "completed";
        this._progress = 1;
      },
    });

    await this.instance.finished;
    this._state = "completed";
  }

  public pause(): void {
    // View transitions are continuous
  }

  public resume(): void {
    // View transitions are continuous
  }

  public reverse(): void {
    // Not applicable to full-view transitions
  }

  public seek(progress: number): void {
    this._progress = progress;
  }

  public cancel(): void {
    this._state = "cancelled";
    this.instance?.skipTransition();
  }

  public finish(): void {
    this._state = "completed";
    this._progress = 1;
    this.instance?.skipTransition();
  }

  public dispose(): void {
    this.cancel();
    this.instance = null;
  }

  public getProgress(): number {
    return this._progress;
  }

  public getState(): MotionParticipantState {
    return this._state;
  }
}

// =============================================================================
// ANIMATION & PHYSICS ADAPTERS
// =============================================================================

class AnimationAdapterInstance implements MotionParticipantInstance {
  public readonly id: string;
  public readonly system = "animation";
  private controls: any = null;
  private _state: MotionParticipantState = "idle";
  private _progress = 0;
  private readonly config: AnimationParticipantConfig;

  constructor(config: AnimationParticipantConfig) {
    this.id = config.id;
    this.config = config;
  }

  public start(): Promise<void> {
    this._state = "running";
    this.controls = animate(this.config.target as any, this.config.keyframes as any, {
      ...this.config.options,
      duration: this.config.duration,
      delay: this.config.delay,
      easing: typeof this.config.easing === "string" ? this.config.easing : undefined,
    });

    return this.controls.finished.then(() => {
      this._state = "completed";
      this._progress = 1;
    });
  }

  public pause(): void {
    this.controls?.pause();
    this._state = "paused";
  }

  public resume(): void {
    this.controls?.resume();
    this._state = "running";
  }

  public reverse(): void {
    this.controls?.reverse();
  }

  public seek(progress: number): void {
    this._progress = progress;
    this.controls?.seek(progress);
  }

  public cancel(): void {
    this._state = "cancelled";
    this.controls?.cancel();
  }

  public finish(): void {
    this._state = "completed";
    this._progress = 1;
    this.controls?.finish();
  }

  public dispose(): void {
    this.cancel();
    this.controls = null;
  }

  public getProgress(): number {
    return this._progress;
  }

  public getState(): MotionParticipantState {
    return this._state;
  }
}

class PhysicsAdapterInstance implements MotionParticipantInstance {
  public readonly id: string;
  public readonly system = "physics";
  private controls: any = null;
  private _state: MotionParticipantState = "idle";
  private _progress = 0;
  private readonly config: PhysicsParticipantConfig;

  constructor(config: PhysicsParticipantConfig) {
    this.id = config.id;
    this.config = config;
  }

  public start(): Promise<void> {
    this._state = "running";
    const onUpdate = (this.config.options as any)?.onUpdate ?? (() => undefined);
    if (this.config.type === "inertia") {
      this.controls = animateInertia({
        ...this.config.options,
        onUpdate,
      } as any);
    } else {
      this.controls = animateSpring({
        ...this.config.options,
        onUpdate,
      } as any);
    }

    return this.controls.finished.then(() => {
      this._state = "completed";
      this._progress = 1;
    });
  }

  public pause(): void {
    this.controls?.pause();
    this._state = "paused";
  }

  public resume(): void {
    this.controls?.resume();
    this._state = "running";
  }

  public reverse(): void {
    this.controls?.reverse?.();
  }

  public seek(progress: number): void {
    this._progress = progress;
  }

  public cancel(): void {
    this._state = "cancelled";
    this.controls?.cancel();
  }

  public finish(): void {
    this._state = "completed";
    this._progress = 1;
    this.controls?.finish?.();
  }

  public dispose(): void {
    this.cancel();
    this.controls = null;
  }

  public getProgress(): number {
    return this._progress;
  }

  public getState(): MotionParticipantState {
    return this._state;
  }
}

// =============================================================================
// CUSTOM RUNNER ADAPTER
// =============================================================================

class CustomAdapterInstance implements MotionParticipantInstance {
  public readonly id: string;
  public readonly system = "custom";
  private _state: MotionParticipantState = "idle";
  private _progress = 0;
  private readonly config: CustomParticipantConfig;

  constructor(config: CustomParticipantConfig) {
    this.id = config.id;
    this.config = config;
  }

  public async start(): Promise<void> {
    this._state = "running";
    await this.config.run(this._progress, this._state);
    this._state = "completed";
    this._progress = 1;
  }

  public pause(): void {
    this._state = "paused";
    this.config.run(this._progress, this._state);
  }

  public resume(): void {
    this._state = "running";
    this.config.run(this._progress, this._state);
  }

  public reverse(): void {
    this._progress = 1 - this._progress;
    this.config.run(this._progress, this._state);
  }

  public seek(progress: number): void {
    this._progress = progress;
    this.config.run(this._progress, this._state);
  }

  public cancel(): void {
    this._state = "cancelled";
    this.config.onCancel?.();
  }

  public finish(): void {
    this._state = "completed";
    this._progress = 1;
    this.config.onFinish?.();
  }

  public dispose(): void {
    this.cancel();
    this.config.onDispose?.();
  }

  public getProgress(): number {
    return this._progress;
  }

  public getState(): MotionParticipantState {
    return this._state;
  }
}

// =============================================================================
// ADAPTER REGISTRY
// =============================================================================

const adapterRegistry = new Map<string, MotionEngineAdapter>();

/**
 * Registers a custom motion engine adapter.
 */
export function registerMotionAdapter(system: string, adapter: MotionEngineAdapter): void {
  adapterRegistry.set(system, adapter);
}

/**
 * Retrieves a registered motion engine adapter.
 */
export function getMotionAdapter(system: string): MotionEngineAdapter | undefined {
  return adapterRegistry.get(system);
}

/**
 * Creates an instance of a motion participant according to its system type.
 */
export function createParticipantInstance(config: MotionParticipantConfig): MotionParticipantInstance {
  // Check custom registry first
  const custom = adapterRegistry.get(config.system);
  if (custom) {
    return custom.createInstance(config);
  }

  switch (config.system) {
    case "svg-morph":
      return new SVGMorphAdapterInstance(config);
    case "motion-path":
      return new MotionPathAdapterInstance(config);
    case "typography":
      return new TypographyAdapterInstance(config);
    case "shared-element":
      return new SharedElementAdapterInstance(config);
    case "view-transition":
      return new ViewTransitionAdapterInstance(config);
    case "animation":
      return new AnimationAdapterInstance(config);
    case "physics":
      return new PhysicsAdapterInstance(config);
    case "custom":
      return new CustomAdapterInstance(config);
    default:
      throw new Error(`Unsupported motion system "${(config as any).system}" for participant "${(config as any).id}".`);
  }
}
