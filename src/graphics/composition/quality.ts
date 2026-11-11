/**
 * AF Motion Adaptive Performance & Quality Management
 *
 * Deterministic quality profiles, sliding-window frame monitoring,
 * and hysteresis-protected dynamic quality scaling.
 */

import type {
  GraphicsQualityLevel,
  GraphicsQualityProfile,
} from "./types.js";

export const QUALITY_PROFILES: Readonly<Record<GraphicsQualityLevel, GraphicsQualityProfile>> = {
  low: {
    level: "low",
    dprLimit: 1.0,
    particleMultiplier: 0.3,
    effectsQuality: "low",
    frameBudgetMs: 33.3, // 30 FPS target
    enablePostProcessing: false,
  },
  medium: {
    level: "medium",
    dprLimit: 1.5,
    particleMultiplier: 0.6,
    effectsQuality: "medium",
    frameBudgetMs: 20.0, // 50 FPS target
    enablePostProcessing: true,
  },
  high: {
    level: "high",
    dprLimit: 2.0,
    particleMultiplier: 1.0,
    effectsQuality: "high",
    frameBudgetMs: 16.6, // 60 FPS target
    enablePostProcessing: true,
  },
  ultra: {
    level: "ultra",
    dprLimit: 3.0,
    particleMultiplier: 1.5,
    effectsQuality: "high",
    frameBudgetMs: 8.3, // 120 FPS target
    enablePostProcessing: true,
  },
};

export function resolveQualityProfile(level?: GraphicsQualityLevel): GraphicsQualityProfile {
  return QUALITY_PROFILES[level ?? "high"] ?? QUALITY_PROFILES.high;
}

export class AdaptiveQualityMonitor {
  private readonly history: number[] = [];
  private readonly windowSize = 30;
  private currentLevel: GraphicsQualityLevel;
  private consecutiveSlowFrames = 0;
  private consecutiveFastFrames = 0;

  constructor(initialLevel: GraphicsQualityLevel = "high") {
    this.currentLevel = initialLevel;
  }

  get currentQuality(): GraphicsQualityLevel {
    return this.currentLevel;
  }

  setQuality(level: GraphicsQualityLevel): void {
    this.currentLevel = level;
    this.consecutiveSlowFrames = 0;
    this.consecutiveFastFrames = 0;
  }

  recordFrame(deltaTimeMs: number): GraphicsQualityLevel {
    this.history.push(deltaTimeMs);
    if (this.history.length > this.windowSize) {
      this.history.shift();
    }

    const budget = QUALITY_PROFILES[this.currentLevel].frameBudgetMs;

    if (deltaTimeMs > budget * 1.25) {
      this.consecutiveSlowFrames++;
      this.consecutiveFastFrames = 0;
    } else if (deltaTimeMs < budget * 0.8) {
      this.consecutiveFastFrames++;
      this.consecutiveSlowFrames = 0;
    } else {
      this.consecutiveSlowFrames = Math.max(0, this.consecutiveSlowFrames - 1);
      this.consecutiveFastFrames = Math.max(0, this.consecutiveFastFrames - 1);
    }

    // Downscale after 20 consecutive slow frames
    if (this.consecutiveSlowFrames >= 20) {
      this.consecutiveSlowFrames = 0;
      this.stepDown();
    }
    // Upscale after 60 consecutive fast frames
    else if (this.consecutiveFastFrames >= 60) {
      this.consecutiveFastFrames = 0;
      this.stepUp();
    }

    return this.currentLevel;
  }

  private stepDown(): void {
    switch (this.currentLevel) {
      case "ultra":
        this.currentLevel = "high";
        break;
      case "high":
        this.currentLevel = "medium";
        break;
      case "medium":
        this.currentLevel = "low";
        break;
      case "low":
        break;
    }
  }

  private stepUp(): void {
    switch (this.currentLevel) {
      case "low":
        this.currentLevel = "medium";
        break;
      case "medium":
        this.currentLevel = "high";
        break;
      case "high":
        this.currentLevel = "ultra";
        break;
      case "ultra":
        break;
    }
  }

  getAverageFrameTime(): number {
    if (this.history.length === 0) return 16.6;
    const sum = this.history.reduce((a, b) => a + b, 0);
    return sum / this.history.length;
  }

  getEstimatedFps(): number {
    const avg = this.getAverageFrameTime();
    return avg > 0 ? Math.round(1000 / avg) : 60;
  }
}
