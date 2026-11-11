/**
 * AF Motion Environmental Simulation Engine — Wind Subsystem
 *
 * Provides configurable global wind, periodic gusting, spatial turbulence,
 * and seamless integration with Prompt 119 flow-fields and particle physics.
 */

import { DirectionalFlowField } from "../fluid/flow-field.js";
import type { FlowField } from "../fluid/types.js";
import type { EnvironmentalVector2Tuple, EnvironmentalVector3Tuple, WindConfig, WindSystem } from "./types.js";

export class WindSystemImpl implements WindSystem {
  direction: EnvironmentalVector2Tuple;
  speed: number;
  gustIntensity: number;
  gustFrequency: number;
  turbulence: number;
  spatialScale: number;

  private currentGust = 0;
  private flowFieldCache: FlowField | null = null;

  constructor(config: WindConfig = {}) {
    const rawDir = config.direction ?? [1, 0];
    const len = Math.hypot(rawDir[0], rawDir[1]);
    this.direction = len > 0 ? [rawDir[0] / len, rawDir[1] / len] : [1, 0];
    this.speed = Math.max(0, config.speed ?? 1.5);
    this.gustIntensity = Math.max(0, config.gustIntensity ?? 0.8);
    this.gustFrequency = Math.max(0.01, config.gustFrequency ?? 0.5);
    this.turbulence = Math.max(0, config.turbulence ?? 0.3);
    this.spatialScale = Math.max(0.1, config.spatialScale ?? 2.0);
  }

  update(dt: number, time: number): void {
    // Primary gust wave + secondary harmonic
    const primary = Math.sin(time * this.gustFrequency * Math.PI * 2);
    const secondary = Math.sin(time * this.gustFrequency * 2.3 * Math.PI * 2);
    this.currentGust = Math.max(0, primary * 0.7 + secondary * 0.3) * this.gustIntensity;

    if (this.flowFieldCache) {
      this.flowFieldCache.weight = this.speed + this.currentGust;
    }
  }

  sampleWind(x: number, y: number, z: number, time: number): EnvironmentalVector3Tuple {
    const effectiveSpeed = this.speed + this.currentGust;

    // Spatial noise turbulence via trigonometric harmonics
    const turbX =
      Math.sin(y * this.spatialScale + time * 1.5) *
      Math.cos(z * this.spatialScale + time) *
      this.turbulence;
    const turbY =
      Math.cos(x * this.spatialScale + time * 1.2) *
      Math.sin(z * this.spatialScale + time * 0.8) *
      (this.turbulence * 0.3); // Less vertical wind turbulence
    const turbZ =
      Math.sin((x + y) * this.spatialScale * 0.5 + time) *
      this.turbulence *
      0.5;

    const wx = this.direction[0] * effectiveSpeed + turbX;
    const wy = this.direction[1] * effectiveSpeed + turbY;
    const wz = turbZ;

    return [wx, wy, wz];
  }

  toFlowField(): FlowField {
    if (!this.flowFieldCache) {
      this.flowFieldCache = new DirectionalFlowField({
        type: "directional",
        direction: this.direction,
        strength: this.speed,
        weight: this.speed + this.currentGust,
      });
    }
    return this.flowFieldCache;
  }
}

export function createWindSystem(config?: WindConfig): WindSystem {
  return new WindSystemImpl(config);
}
