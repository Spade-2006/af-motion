/**
 * AF Motion — Rendering Resolution Intelligence
 *
 * Dynamic DPR clamping, viewport-aware resolution scaling,
 * maximum pixel budget enforcement, and canvas resizing thrash prevention.
 */

import type {
  DynamicResolutionResult,
  QualityValues,
  UserQualityPreferences,
} from "./types.js";

export interface ResolutionCalculatorOptions {
  maxPixelBudget?: number;
  minResolutionScale?: number;
  maxDpr?: number;
}

export class ResolutionIntelligence {
  private lastPhysicalWidth = 0;
  private lastPhysicalHeight = 0;
  private readonly thresholdPx = 2; // Hysteresis threshold to prevent canvas thrashing

  /**
   * Calculates optimal physical render resolution and effective DPR.
   */
  public computeResolution(
    cssWidth: number,
    cssHeight: number,
    values: Pick<QualityValues, "dpr" | "resolutionScale">,
    options: ResolutionCalculatorOptions = {}
  ): DynamicResolutionResult {
    const safeCssWidth = Math.max(1, cssWidth);
    const safeCssHeight = Math.max(1, cssHeight);

    // DPR constraint
    const effectiveDpr = options.maxDpr !== undefined
      ? Math.min(values.dpr, options.maxDpr)
      : values.dpr;

    // Scale constraint
    const minScale = options.minResolutionScale ?? 0.25;
    const effectiveScale = Math.max(minScale, Math.min(1.0, values.resolutionScale));

    let physicalW = Math.round(safeCssWidth * effectiveDpr * effectiveScale);
    let physicalH = Math.round(safeCssHeight * effectiveDpr * effectiveScale);

    let totalPixels = physicalW * physicalH;
    let isCapped = false;

    // Pixel budget constraint (e.g. 2,073,600 for 1080p)
    if (options.maxPixelBudget && totalPixels > options.maxPixelBudget) {
      const budgetScale = Math.sqrt(options.maxPixelBudget / totalPixels);
      physicalW = Math.max(1, Math.round(physicalW * budgetScale));
      physicalH = Math.max(1, Math.round(physicalH * budgetScale));
      totalPixels = physicalW * physicalH;
      isCapped = true;
    }

    // Canvas layout thrashing hysteresis
    if (
      this.lastPhysicalWidth > 0 &&
      this.lastPhysicalHeight > 0 &&
      Math.abs(physicalW - this.lastPhysicalWidth) <= this.thresholdPx &&
      Math.abs(physicalH - this.lastPhysicalHeight) <= this.thresholdPx
    ) {
      physicalW = this.lastPhysicalWidth;
      physicalH = this.lastPhysicalHeight;
    } else {
      this.lastPhysicalWidth = physicalW;
      this.lastPhysicalHeight = physicalH;
    }

    return {
      physicalWidth: physicalW,
      physicalHeight: physicalH,
      cssWidth: safeCssWidth,
      cssHeight: safeCssHeight,
      effectiveDpr: Number(effectiveDpr.toFixed(2)),
      resolutionScale: Number(effectiveScale.toFixed(2)),
      totalPixels,
      isPixelBudgetCapped: isCapped,
    };
  }

  public reset(): void {
    this.lastPhysicalWidth = 0;
    this.lastPhysicalHeight = 0;
  }
}
