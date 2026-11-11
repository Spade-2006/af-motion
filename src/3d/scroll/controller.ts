/**
 * AF Motion 3D Scroll-Driven Scene Controller
 *
 * Evaluates scroll progress across timelines, driving camera staging,
 * object transforms, and section activations with bidirectional synchronization.
 */

import type { Camera3DConfig, Vector3Tuple } from "../types.js";
import { interpolateCamera } from "../camera/transitions.js";
import { getEasing } from "../../easing/easings.js";
import type {
  ObjectTransformState,
  ScrollSceneKeyframe,
  ScrollSceneOptions,
  ScrollSceneState,
  ScrollSceneTimeline,
} from "./types.js";

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpVector(a: Vector3Tuple, b: Vector3Tuple, t: number): Vector3Tuple {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

const DEFAULT_OBJECT_STATE: ObjectTransformState = {
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: [1, 1, 1],
  opacity: 1,
  visible: true,
};

export class ScrollSceneController {
  private readonly timeline: ScrollSceneTimeline;
  private readonly sortedKeyframes: readonly ScrollSceneKeyframe[];
  private readonly options: ScrollSceneOptions;
  private currentProgress = 0;
  private activeSectionId?: string;
  private containerElement: HTMLElement | Window | null = null;
  private scrollListener: (() => void) | null = null;

  constructor(options: ScrollSceneOptions) {
    this.options = options;
    this.timeline = options.timeline;

    // Ensure keyframes are sorted by progress and cover [0, 1]
    const rawKfs = [...(options.timeline.keyframes || [])].sort((a, b) => a.progress - b.progress);

    if (rawKfs.length === 0) {
      rawKfs.push(
        { progress: 0, camera: options.initialCamera },
        { progress: 1, camera: options.initialCamera }
      );
    } else if (rawKfs.length === 1) {
      rawKfs.push({ ...rawKfs[0], progress: 1 });
    }

    if (rawKfs[0].progress > 0) {
      rawKfs.unshift({ ...rawKfs[0], progress: 0 });
    }
    if (rawKfs[rawKfs.length - 1].progress < 1) {
      rawKfs.push({ ...rawKfs[rawKfs.length - 1], progress: 1 });
    }

    this.sortedKeyframes = rawKfs;

    if (options.container) {
      this.attachScroll(options.container);
    }
  }

  /**
   * Evaluates scene state at any arbitrary progress point in [0, 1].
   */
  public evaluate(progress: number): ScrollSceneState {
    const p = Math.max(0, Math.min(1, progress));
    this.currentProgress = p;

    // Resolve active section if defined
    let currentSectionId: string | undefined;
    if (this.timeline.sections) {
      for (const sec of this.timeline.sections) {
        if (p >= sec.start && p <= sec.end) {
          currentSectionId = sec.id;
          break;
        }
      }
    }

    if (currentSectionId !== this.activeSectionId) {
      this.activeSectionId = currentSectionId;
      if (currentSectionId && this.options.onSectionChange) {
        this.options.onSectionChange(currentSectionId);
      }
    }

    // Reduced motion handling: snap directly to closest keyframe
    if (this.options.respectReducedMotion) {
      let closestKf = this.sortedKeyframes[0];
      let minDiff = Infinity;
      for (const kf of this.sortedKeyframes) {
        const diff = Math.abs(kf.progress - p);
        if (diff < minDiff) {
          minDiff = diff;
          closestKf = kf;
        }
      }

      const snapCam: Camera3DConfig = {
        type: "perspective",
        position: [0, 0, 5],
        target: [0, 0, 0],
        ...(this.options.initialCamera || {}),
        ...(closestKf.camera || {}),
      };

      const snapObjects: Record<string, ObjectTransformState> = {};
      if (closestKf.objects) {
        for (const [id, spec] of Object.entries(closestKf.objects)) {
          snapObjects[id] = {
            position: spec.position ?? DEFAULT_OBJECT_STATE.position,
            rotation: spec.rotation ?? DEFAULT_OBJECT_STATE.rotation,
            scale: spec.scale ?? DEFAULT_OBJECT_STATE.scale,
            opacity: spec.opacity ?? DEFAULT_OBJECT_STATE.opacity,
            visible: spec.visible ?? DEFAULT_OBJECT_STATE.visible,
          };
        }
      }

      return {
        progress: p,
        activeSectionId: currentSectionId,
        camera: snapCam,
        objects: snapObjects,
      };
    }

    // Find surrounding keyframe segments
    let kfA = this.sortedKeyframes[0];
    let kfB = this.sortedKeyframes[this.sortedKeyframes.length - 1];

    for (let i = 0; i < this.sortedKeyframes.length - 1; i++) {
      if (p >= this.sortedKeyframes[i].progress && p <= this.sortedKeyframes[i + 1].progress) {
        kfA = this.sortedKeyframes[i];
        kfB = this.sortedKeyframes[i + 1];
        break;
      }
    }

    const range = kfB.progress - kfA.progress;
    const rawT = range > 0 ? (p - kfA.progress) / range : 0;

    // Apply easing
    const easingName = kfB.easing || kfA.easing || "easeInOutCubic";
    const easingFn = getEasing(easingName) || ((t: number) => t);
    const easedT = easingFn(rawT);

    // Interpolate Camera
    const baseCam: Camera3DConfig = {
      type: "perspective",
      position: [0, 0, 5],
      target: [0, 0, 0],
      ...(this.options.initialCamera || {}),
    };

    const camA: Camera3DConfig = { ...baseCam, ...(kfA.camera || {}) };
    const camB: Camera3DConfig = { ...baseCam, ...(kfB.camera || {}) };
    const camera = interpolateCamera(camA, camB, easedT);

    // Interpolate Object Transforms
    const objects: Record<string, ObjectTransformState> = {};
    const allObjectIds = new Set([
      ...Object.keys(kfA.objects || {}),
      ...Object.keys(kfB.objects || {}),
    ]);

    for (const id of allObjectIds) {
      const objA = kfA.objects?.[id];
      const objB = kfB.objects?.[id];

      const posA = objA?.position ?? DEFAULT_OBJECT_STATE.position;
      const posB = objB?.position ?? DEFAULT_OBJECT_STATE.position;

      const rotA = objA?.rotation ?? DEFAULT_OBJECT_STATE.rotation;
      const rotB = objB?.rotation ?? DEFAULT_OBJECT_STATE.rotation;

      const scaA = objA?.scale ?? DEFAULT_OBJECT_STATE.scale;
      const scaB = objB?.scale ?? DEFAULT_OBJECT_STATE.scale;

      const opA = objA?.opacity ?? DEFAULT_OBJECT_STATE.opacity;
      const opB = objB?.opacity ?? DEFAULT_OBJECT_STATE.opacity;

      const visA = objA?.visible ?? DEFAULT_OBJECT_STATE.visible;
      const visB = objB?.visible ?? DEFAULT_OBJECT_STATE.visible;

      objects[id] = {
        position: lerpVector(posA, posB, easedT),
        rotation: lerpVector(rotA, rotB, easedT),
        scale: lerpVector(scaA, scaB, easedT),
        opacity: lerp(opA, opB, easedT),
        visible: easedT > 0.5 ? visB : visA,
      };
    }

    const state: ScrollSceneState = {
      progress: p,
      activeSectionId: currentSectionId,
      camera,
      objects,
    };

    if (this.options.onProgress) {
      this.options.onProgress(p, state);
    }

    return state;
  }

  /**
   * Binds scroll event listening to a scroll container or window.
   */
  public attachScroll(container: HTMLElement | Window): void {
    this.detachScroll();
    this.containerElement = container;

    const onScroll = () => {
      let progress = 0;
      if (container === window || !("scrollHeight" in container)) {
        const scrollY = typeof window !== "undefined" ? window.scrollY : 0;
        const maxScroll = typeof document !== "undefined"
          ? document.documentElement.scrollHeight - window.innerHeight
          : 1;
        progress = maxScroll > 0 ? scrollY / maxScroll : 0;
      } else {
        const el = container as HTMLElement;
        const maxScroll = el.scrollHeight - el.clientHeight;
        progress = maxScroll > 0 ? el.scrollTop / maxScroll : 0;
      }
      this.evaluate(progress);
    };

    this.scrollListener = onScroll;
    container.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /**
   * Detaches scroll listener.
   */
  public detachScroll(): void {
    if (this.containerElement && this.scrollListener) {
      this.containerElement.removeEventListener("scroll", this.scrollListener);
      this.containerElement = null;
      this.scrollListener = null;
    }
  }

  public getProgress(): number {
    return this.currentProgress;
  }

  public destroy(): void {
    this.detachScroll();
  }
}

export function createScrollSceneController(options: ScrollSceneOptions): ScrollSceneController {
  return new ScrollSceneController(options);
}
