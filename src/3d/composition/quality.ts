/**
 * AF Motion 3D Scene Performance & Adaptive Quality
 *
 * Quality profiles, dynamic DPR scaling, frame-time monitoring,
 * and visibility suspension for 3D compositions.
 */

import type { Scene3DQualityLevel, Scene3DQualityProfile } from "./types.js";

export const SCENE_3D_QUALITY_PROFILES: Record<
  Scene3DQualityLevel,
  Scene3DQualityProfile
> = {
  low: {
    level: "low",
    maxDpr: 1.0,
    antialias: false,
    shadows: false,
    maxObjects: 30,
    targetFps: 30,
  },
  medium: {
    level: "medium",
    maxDpr: 1.5,
    antialias: true,
    shadows: false,
    maxObjects: 80,
    targetFps: 60,
  },
  high: {
    level: "high",
    maxDpr: 2.0,
    antialias: true,
    shadows: true,
    maxObjects: 200,
    targetFps: 60,
  },
  ultra: {
    level: "ultra",
    maxDpr: 2.0,
    antialias: true,
    shadows: true,
    maxObjects: 500,
    targetFps: 60,
  },
};

export function resolveScene3DQualityProfile(
  level: Scene3DQualityLevel = "high"
): Scene3DQualityProfile {
  return SCENE_3D_QUALITY_PROFILES[level] ?? SCENE_3D_QUALITY_PROFILES.high;
}

export class Scene3DPerformanceMonitor {
  private profile: Scene3DQualityProfile;
  private isVisible = true;
  private readonly frameDeltas: number[] = [];
  private lastFrameTime = 0;
  private readonly windowSize = 60;
  private consecutiveLowFpsCount = 0;
  private onQualityDegrade?: (newLevel: Scene3DQualityLevel) => void;

  constructor(options?: {
    initialProfile?: Scene3DQualityLevel;
    onQualityDegrade?: (newLevel: Scene3DQualityLevel) => void;
  }) {
    this.profile = resolveScene3DQualityProfile(options?.initialProfile ?? "high");
    this.onQualityDegrade = options?.onQualityDegrade;
  }

  public getProfile(): Scene3DQualityProfile {
    return this.profile;
  }

  public setProfile(level: Scene3DQualityLevel): void {
    this.profile = resolveScene3DQualityProfile(level);
  }

  public setVisibility(visible: boolean): void {
    this.isVisible = visible;
  }

  public shouldRender(): boolean {
    return this.isVisible;
  }

  /**
   * Records a rendered frame timestamp and tracks FPS health.
   */
  public recordFrame(now = typeof performance !== "undefined" ? performance.now() : Date.now()): void {
    if (this.lastFrameTime === 0) {
      this.lastFrameTime = now;
      return;
    }

    const delta = (now - this.lastFrameTime) / 1000;
    this.lastFrameTime = now;

    if (delta > 0 && delta < 1) {
      this.frameDeltas.push(delta);
      if (this.frameDeltas.length > this.windowSize) {
        this.frameDeltas.shift();
      }
    }

    // Check rolling average FPS
    const avgFps = this.getAverageFps();
    if (this.frameDeltas.length >= 30 && avgFps < 28) {
      this.consecutiveLowFpsCount++;
      if (this.consecutiveLowFpsCount >= 3) {
        this.degradeProfile();
        this.consecutiveLowFpsCount = 0;
      }
    } else {
      this.consecutiveLowFpsCount = 0;
    }
  }

  public getAverageFps(): number {
    if (this.frameDeltas.length === 0) return 60;
    const avgDelta = this.frameDeltas.reduce((a, b) => a + b, 0) / this.frameDeltas.length;
    return avgDelta > 0 ? Math.round(1 / avgDelta) : 60;
  }

  /**
   * Automatically drops quality level by one step when under performance strain.
   */
  private degradeProfile(): void {
    let nextLevel: Scene3DQualityLevel | null = null;
    switch (this.profile.level) {
      case "ultra":
        nextLevel = "high";
        break;
      case "high":
        nextLevel = "medium";
        break;
      case "medium":
        nextLevel = "low";
        break;
      case "low":
        nextLevel = null;
        break;
    }

    if (nextLevel) {
      this.setProfile(nextLevel);
      this.frameDeltas.length = 0; // Reset metrics
      this.onQualityDegrade?.(nextLevel);
    }
  }
}
