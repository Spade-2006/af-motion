/**
 * AF Motion — Adaptive Quality Controller
 *
 * Coordinates real-time frame monitoring, hysteresis-protected degradation/recovery,
 * power-aware policies, dynamic resolution scaling, and user overrides.
 */

import type { DeviceCapabilityProfile } from "../device-capabilities/types.js";
import type {
  IAdaptiveQualityController,
  AdaptiveQualityControllerOptions,
  QualityPresetName,
  QualityProfile,
  QualityRecommendation,
  PerformanceMetrics,
  QualityAdaptationEvent,
  DynamicResolutionResult,
  SystemQualityPolicies,
  QualityChangeListener,
  QualitySubscription,
  QualitySettingKey,
  FrameMetricsInput,
  UnifiedQualitySettings,
} from "./types.js";
import {
  createQualityProfile,
  getLowerPreset,
  getHigherPreset,
  extractQualityValues,
  buildUnifiedSettings,
  clampNumericSetting,
} from "./profile.js";
import { getRecommendedQuality } from "./recommendation.js";
import { PerformanceTracker } from "./metrics.js";
import { ResolutionIntelligence } from "./resolution.js";
import { aggregateSystemPolicies } from "./policies.js";

export class AdaptiveQualityController implements IAdaptiveQualityController {
  private _profile: QualityProfile;
  private readonly _recommendation: QualityRecommendation;
  private readonly _tracker: PerformanceTracker;
  private readonly _resolution: ResolutionIntelligence;
  private readonly _options: Required<Omit<AdaptiveQualityControllerOptions, "deviceProfile" | "preferences">> & {
    deviceProfile?: DeviceCapabilityProfile;
    preferences?: AdaptiveQualityControllerOptions["preferences"];
  };

  private readonly _history: QualityAdaptationEvent[] = [];
  private readonly _maxHistory = 50;
  private readonly _listeners = new Set<QualityChangeListener>();
  private readonly _lockedSettings = new Set<QualitySettingKey>();

  private _consecutiveSlowFrames = 0;
  private _consecutiveFastFrames = 0;
  private _lastAdaptationTime = 0;
  private _isDisposed = false;

  constructor(options: AdaptiveQualityControllerOptions = {}) {
    const preferences = options.preferences ?? {};
    const targetFps = preferences.targetFps ?? 60;

    this._options = {
      deviceProfile: options.deviceProfile,
      preferences: options.preferences,
      samplingWindowSize: options.samplingWindowSize ?? 60,
      degradeFpsTolerance: options.degradeFpsTolerance ?? 8,
      recoverFpsTolerance: options.recoverFpsTolerance ?? 2,
      consecutiveSlowFramesThreshold: options.consecutiveSlowFramesThreshold ?? 15,
      consecutiveFastFramesThreshold: options.consecutiveFastFramesThreshold ?? 45,
      adaptationCooldownMs: options.adaptationCooldownMs ?? 1500,
      powerAware: options.powerAware ?? true,
    };

    // 1. Initial recommendation
    this._recommendation = getRecommendedQuality(options.deviceProfile, preferences);

    // 2. Initial quality profile
    const initialPreset = preferences.initialPreset ?? this._recommendation.preset;
    this._profile = createQualityProfile(
      initialPreset,
      preferences.overrides,
      {
        isAutoAdaptive: preferences.autoAdapt ?? true,
        isLocked: false,
        lockedSettings: this._lockedSettings,
      }
    );

    // 3. Performance tracker & resolution intelligence
    this._tracker = new PerformanceTracker({
      windowSize: this._options.samplingWindowSize,
      targetFps,
      isGpuTimingSupported: false,
    });
    this._resolution = new ResolutionIntelligence();
  }

  public get profile(): QualityProfile {
    return this._profile;
  }

  public get metrics(): PerformanceMetrics {
    return this._tracker.getMetrics();
  }

  public get recommendation(): QualityRecommendation {
    return this._recommendation;
  }

  public getCurrentQuality(): QualityPresetName {
    return this._profile.preset;
  }

  public getQualityProfile(): QualityProfile {
    return this._profile;
  }

  public getRecommendedProfile(): QualityRecommendation {
    return this._recommendation;
  }

  public getPerformanceMetrics(): PerformanceMetrics {
    return this._tracker.getMetrics();
  }

  public getEffectiveResolution(cssWidth: number, cssHeight: number): DynamicResolutionResult {
    return this._resolution.computeResolution(cssWidth, cssHeight, this._profile.values, {
      maxPixelBudget: this._options.preferences?.maxPixelBudget,
      minResolutionScale: this._options.preferences?.minResolutionScale,
      maxDpr: this._options.preferences?.maxDpr,
    });
  }

  public getSystemPolicies(): SystemQualityPolicies {
    return aggregateSystemPolicies(this._profile.values);
  }

  public recordFrame(
    deltaTimeMs: number,
    extraMetrics?: Partial<FrameMetricsInput>
  ): PerformanceMetrics {
    if (this._isDisposed) return this._tracker.getMetrics();

    const metrics = this._tracker.record({
      frameDurationMs: deltaTimeMs,
      ...extraMetrics,
    });

    if (this._profile.isAutoAdaptive && !this._profile.isLocked) {
      this.evaluateAdaptation(metrics);
    }

    return metrics;
  }

  public updatePerformanceMetrics(input: FrameMetricsInput): PerformanceMetrics {
    return this.recordFrame(input.frameDurationMs, input);
  }

  /**
   * Evaluates rolling performance metrics and triggers adaptation when sustained.
   */
  private evaluateAdaptation(metrics: PerformanceMetrics): void {
    const now = Date.now();
    const targetFps = this._options.preferences?.targetFps ?? 60;
    const targetBudgetMs = 1000 / targetFps;

    // Check battery / power-save condition if powerAware is enabled
    if (this._options.powerAware && this._options.deviceProfile?.battery) {
      const b = this._options.deviceProfile.battery;
      if (
        b.level.status === "detected" &&
        b.level.value !== null &&
        b.level.value !== undefined &&
        b.level.value <= 0.2 &&
        b.charging.value === false &&
        this._profile.preset !== "battery-saver"
      ) {
        this.applyPresetChange(
          "battery-saver",
          "power_save",
          `Battery critically low (${Math.round((b.level.value ?? 0) * 100)}%) and not charging. Shifted to Battery Saver.`
        );
        return;
      }
    }

    // Cooldown guard to prevent rapid thrashing
    if (now - this._lastAdaptationTime < this._options.adaptationCooldownMs) {
      return;
    }

    const degradeThresholdFps = targetFps - this._options.degradeFpsTolerance;
    const recoverThresholdFps = targetFps - this._options.recoverFpsTolerance;

    if (metrics.averageFps < degradeThresholdFps || metrics.frameDurationMs > targetBudgetMs * 1.3) {
      this._consecutiveSlowFrames++;
      this._consecutiveFastFrames = 0;
    } else if (metrics.averageFps >= recoverThresholdFps && metrics.longFrames === 0) {
      this._consecutiveFastFrames++;
      this._consecutiveSlowFrames = 0;
    } else {
      this._consecutiveSlowFrames = Math.max(0, this._consecutiveSlowFrames - 1);
      this._consecutiveFastFrames = Math.max(0, this._consecutiveFastFrames - 1);
    }

    // Degrade under sustained pressure
    if (this._consecutiveSlowFrames >= this._options.consecutiveSlowFramesThreshold) {
      this._consecutiveSlowFrames = 0;
      this.degradeQuality(metrics);
    }
    // Recover under sustained stability
    else if (this._consecutiveFastFrames >= this._options.consecutiveFastFramesThreshold) {
      this._consecutiveFastFrames = 0;
      this.recoverQuality(metrics);
    }
  }

  /**
   * Explicitly triggers adaptation step if criteria are met.
   */
  public adaptQuality(): boolean {
    if (this._isDisposed || !this._profile.isAutoAdaptive || this._profile.isLocked) {
      return false;
    }
    const metrics = this._tracker.getMetrics();
    const targetFps = this._options.preferences?.targetFps ?? 60;

    if (metrics.averageFps < targetFps - this._options.degradeFpsTolerance) {
      return this.degradeQuality(metrics);
    } else if (metrics.averageFps >= targetFps - this._options.recoverFpsTolerance) {
      return this.recoverQuality(metrics);
    }
    return false;
  }

  private degradeQuality(metrics: PerformanceMetrics): boolean {
    const nextPreset = getLowerPreset(this._profile.preset);
    if (!nextPreset) return false;

    this.applyPresetChange(
      nextPreset,
      "degrade",
      `Sustained frame pressure: average FPS ${metrics.averageFps} fell below threshold.`,
      metrics
    );
    return true;
  }

  private recoverQuality(metrics: PerformanceMetrics): boolean {
    const nextPreset = getHigherPreset(this._profile.preset);
    if (!nextPreset) return false;

    this.applyPresetChange(
      nextPreset,
      "recover",
      `Performance stabilized: average FPS ${metrics.averageFps} exceeds target.`,
      metrics
    );
    return true;
  }

  private applyPresetChange(
    newPreset: QualityPresetName,
    type: QualityAdaptationEvent["type"],
    reason: string,
    metrics?: PerformanceMetrics
  ): void {
    const prevPreset = this._profile.preset;
    const prevValues = { ...this._profile.values };

    // Rebuild profile with current overrides and locks preserved
    const currentOverrides: any = {};
    for (const [k, desc] of Object.entries(this._profile.settings)) {
      if (desc.override !== undefined) {
        currentOverrides[k] = desc.override;
      }
    }

    this._profile = createQualityProfile(newPreset, currentOverrides, {
      isAutoAdaptive: this._profile.isAutoAdaptive,
      isLocked: this._profile.isLocked,
      lockedSettings: this._lockedSettings,
    });

    this._lastAdaptationTime = Date.now();
    this._consecutiveSlowFrames = 0;
    this._consecutiveFastFrames = 0;

    // Calculate changed settings
    const changedSettings: any = {};
    for (const k of Object.keys(this._profile.values) as QualitySettingKey[]) {
      if (prevValues[k] !== this._profile.values[k]) {
        changedSettings[k] = {
          from: prevValues[k],
          to: this._profile.values[k],
        };
      }
    }

    const event: QualityAdaptationEvent = {
      timestamp: Date.now(),
      type,
      previousPreset: prevPreset,
      newPreset,
      changedSettings,
      reason,
      triggerMetric: metrics
        ? {
            averageFps: metrics.averageFps,
            frameDurationMs: metrics.frameDurationMs,
            frameDrops: metrics.frameDrops,
          }
        : undefined,
    };

    this.pushHistory(event);
    this.notifyListeners(event);
  }

  public setQualityPreset(preset: QualityPresetName): void {
    if (this._isDisposed) return;
    this.applyPresetChange(preset, "preset_change", `User manually selected '${preset}' preset.`);
  }

  public setQualityOverride<K extends QualitySettingKey>(
    key: K,
    value: UnifiedQualitySettings[K]["current"]
  ): void {
    if (this._isDisposed) return;
    const prevVal = this._profile.values[key];

    const currentOverrides: any = {};
    for (const [k, desc] of Object.entries(this._profile.settings)) {
      if (desc.override !== undefined) {
        currentOverrides[k] = desc.override;
      }
    }
    currentOverrides[key] = value;

    this._profile = createQualityProfile(this._profile.preset, currentOverrides, {
      isAutoAdaptive: this._profile.isAutoAdaptive,
      isLocked: this._profile.isLocked,
      lockedSettings: this._lockedSettings,
    });

    const event: QualityAdaptationEvent = {
      timestamp: Date.now(),
      type: "user_override",
      previousPreset: this._profile.preset,
      newPreset: this._profile.preset,
      changedSettings: {
        [key]: { from: prevVal, to: value },
      },
      reason: `User set explicit override on '${key}': ${String(value)}.`,
    };

    this.pushHistory(event);
    this.notifyListeners(event);
  }

  public clearQualityOverride(key: QualitySettingKey): void {
    if (this._isDisposed) return;
    const currentOverrides: any = {};
    for (const [k, desc] of Object.entries(this._profile.settings)) {
      if (k !== key && desc.override !== undefined) {
        currentOverrides[k] = desc.override;
      }
    }

    this._profile = createQualityProfile(this._profile.preset, currentOverrides, {
      isAutoAdaptive: this._profile.isAutoAdaptive,
      isLocked: this._profile.isLocked,
      lockedSettings: this._lockedSettings,
    });

    this.notifyListeners();
  }

  public clearAllQualityOverrides(): void {
    if (this._isDisposed) return;
    this._profile = createQualityProfile(this._profile.preset, undefined, {
      isAutoAdaptive: this._profile.isAutoAdaptive,
      isLocked: this._profile.isLocked,
      lockedSettings: this._lockedSettings,
    });
    this.notifyListeners();
  }

  public lockQualitySettings(locked: boolean): void {
    if (this._isDisposed) return;
    this._profile = {
      ...this._profile,
      isLocked: locked,
      timestamp: Date.now(),
    };
    this.notifyListeners();
  }

  public unlockQualitySettings(): void {
    this.lockQualitySettings(false);
  }

  public resetToRecommendedQuality(): void {
    if (this._isDisposed) return;
    this._lockedSettings.clear();
    this.applyPresetChange(
      this._recommendation.preset,
      "preset_change",
      "Reset to initial recommended quality profile."
    );
  }

  public getQualityAdaptationHistory(): readonly QualityAdaptationEvent[] {
    return this._history;
  }

  public subscribe(listener: QualityChangeListener): QualitySubscription {
    this._listeners.add(listener);
    return {
      unsubscribe: () => {
        this._listeners.delete(listener);
      },
    };
  }

  private pushHistory(event: QualityAdaptationEvent): void {
    this._history.push(event);
    if (this._history.length > this._maxHistory) {
      this._history.shift();
    }
  }

  private notifyListeners(event?: QualityAdaptationEvent): void {
    for (const listener of this._listeners) {
      try {
        listener(this._profile, event);
      } catch (err) {
        // Prevent listener exception from breaking controller update cycle
        console.error("Error in AdaptiveQualityController listener:", err);
      }
    }
  }

  public dispose(): void {
    if (this._isDisposed) return;
    this._isDisposed = true;
    this._listeners.clear();
    this._history.length = 0;
    this._tracker.reset();
    this._resolution.reset();
  }
}

/**
 * Factory function to create an AdaptiveQualityController instance.
 */
export function createAdaptiveQualityController(
  options: AdaptiveQualityControllerOptions = {}
): AdaptiveQualityController {
  return new AdaptiveQualityController(options);
}
