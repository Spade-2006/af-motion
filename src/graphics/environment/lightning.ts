/**
 * AF Motion Environmental Simulation Engine — Lightning Subsystem
 *
 * Implements stochastic recursive branching lightning bolts, screen-space illumination
 * flash decay, storm coordination, and distance-based thunder callback events.
 */

import type {
  EnvironmentalEffect,
  EnvironmentalEffectType,
  EnvironmentSimulation,
  LightningConfig,
  LightningStrike,
  EnvironmentalVector2Tuple,
} from "./types.js";

let strikeIdSeq = 0;

interface ActiveStrike {
  strike: LightningStrike;
  elapsedMs: number;
}

export class LightningEffectImpl implements EnvironmentalEffect {
  readonly id = `lightning-${++strikeIdSeq}`;
  readonly type: EnvironmentalEffectType = "lightning";
  enabled = true;
  intensity = 1.0;

  frequency: number;
  maxFlashes: number;
  flashDurationMs: number;
  branchCount: number;
  stormCoordination: boolean;
  onThunder?: (delayMs: number, strike: LightningStrike) => void;
  flashColor: readonly [number, number, number];

  private activeStrikes: ActiveStrike[] = [];
  private nextStrikeTimer = 0;
  private currentFlashAlpha = 0;

  constructor(config: LightningConfig = {}) {
    this.frequency = Math.max(0.01, config.frequency ?? 0.15); // Average strikes per second
    this.maxFlashes = Math.max(1, config.maxFlashes ?? 3);
    this.flashDurationMs = Math.max(50, config.flashDurationMs ?? 250);
    this.branchCount = Math.max(2, config.branchCount ?? 4);
    this.stormCoordination = config.stormCoordination ?? true;
    this.onThunder = config.onThunder;
    this.flashColor = config.flashColor ?? [230, 240, 255];

    this.scheduleNextStrike();
  }

  private scheduleNextStrike(): void {
    // Poisson arrival: interval = -ln(U) / lambda
    const intervalSec = -Math.log(Math.max(0.001, Math.random())) / this.frequency;
    this.nextStrikeTimer = intervalSec;
  }

  triggerStrike(startX?: number, startY?: number, endX?: number, endY?: number): LightningStrike {
    const sx = startX ?? (0.2 + Math.random() * 0.6);
    const sy = startY ?? 0.05;
    const ex = endX ?? (sx + (Math.random() - 0.5) * 0.3);
    const ey = endY ?? (0.8 + Math.random() * 0.18);

    const mainPath = this.generateBoltPath([sx, sy], [ex, ey], 5, 0.04);
    const branches: EnvironmentalVector2Tuple[][] = [mainPath];

    // Generate secondary branching forks
    for (let b = 0; b < this.branchCount; b++) {
      const splitIdx = Math.floor(Math.random() * (mainPath.length - 2)) + 1;
      const splitPoint = mainPath[splitIdx]!;
      const branchAngle = (Math.random() - 0.5) * Math.PI * 0.5;
      const branchLen = 0.15 + Math.random() * 0.2;
      const branchEnd: EnvironmentalVector2Tuple = [
        splitPoint[0] + Math.sin(branchAngle) * branchLen,
        splitPoint[1] + Math.cos(branchAngle) * branchLen,
      ];
      branches.push(this.generateBoltPath(splitPoint, branchEnd, 3, 0.025));
    }

    const strike: LightningStrike = {
      id: `strike-${++strikeIdSeq}`,
      startX: sx,
      startY: sy,
      endX: ex,
      endY: ey,
      branches,
      intensity: 1.0,
      progress: 0,
      durationMs: this.flashDurationMs,
    };

    this.activeStrikes.push({ strike, elapsedMs: 0 });
    this.currentFlashAlpha = 0.85;

    // Trigger distance-based thunder callback
    if (this.onThunder) {
      // Approximate distance between 500m and 4000m based on start Y and horizontal displacement
      const estDistanceMeters = 500 + Math.hypot(ex - 0.5, ey - 0.5) * 3500;
      const soundSpeedMs = 343; // Speed of sound in air (m/s)
      const soundDelayMs = Math.round((estDistanceMeters / soundSpeedMs) * 1000);
      this.onThunder(soundDelayMs, strike);
    }

    return strike;
  }

  private generateBoltPath(
    start: EnvironmentalVector2Tuple,
    end: EnvironmentalVector2Tuple,
    iterations: number,
    roughness: number,
  ): EnvironmentalVector2Tuple[] {
    let points: EnvironmentalVector2Tuple[] = [start, end];

    for (let iter = 0; iter < iterations; iter++) {
      const nextPoints: EnvironmentalVector2Tuple[] = [points[0]!];
      const currentRough = roughness / (iter + 1);

      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i]!;
        const p1 = points[i + 1]!;

        const midX = (p0[0] + p1[0]) / 2;
        const midY = (p0[1] + p1[1]) / 2;

        const normalX = -(p1[1] - p0[1]);
        const normalY = p1[0] - p0[0];
        const normalLen = Math.hypot(normalX, normalY) || 1;

        const displacement = (Math.random() - 0.5) * 2 * currentRough;
        const jitterX = midX + (normalX / normalLen) * displacement;
        const jitterY = midY + (normalY / normalLen) * displacement;

        nextPoints.push([jitterX, jitterY]);
        nextPoints.push(p1);
      }
      points = nextPoints;
    }

    return points;
  }

  update(dt: number, _time: number, env: EnvironmentSimulation): void {
    if (!this.enabled || this.intensity <= 0 || dt <= 0) return;

    // Check storm intensity multiplier
    const stormMult =
      env.weather.currentWeather === "storm" || env.weather.currentWeather === "firestorm"
        ? 2.5
        : 1.0;

    this.nextStrikeTimer -= dt * stormMult * this.intensity * env.globalIntensity;
    if (this.nextStrikeTimer <= 0) {
      if (this.activeStrikes.length < this.maxFlashes) {
        this.triggerStrike();
      }
      this.scheduleNextStrike();
    }

    // Update active strikes
    const dtMs = dt * 1000;
    for (let i = this.activeStrikes.length - 1; i >= 0; i--) {
      const active = this.activeStrikes[i]!;
      active.elapsedMs += dtMs;
      if (active.elapsedMs >= active.strike.durationMs) {
        this.activeStrikes.splice(i, 1);
      }
    }

    // Decay screen illumination flash
    if (this.currentFlashAlpha > 0) {
      this.currentFlashAlpha = Math.max(0, this.currentFlashAlpha - dt * 4.0);
    }
  }

  render(ctx: CanvasRenderingContext2D | WebGL2RenderingContext, targetW: number, targetH: number): void {
    if (!this.enabled || this.intensity <= 0) return;
    if (!("beginPath" in ctx)) return;

    const c2d = ctx as CanvasRenderingContext2D;
    const [fr, fg, fb] = this.flashColor;

    c2d.save();

    // 1. Screen flash illumination
    if (this.currentFlashAlpha > 0.01) {
      c2d.fillStyle = `rgba(${fr}, ${fg}, ${fb}, ${this.currentFlashAlpha * 0.45})`;
      c2d.fillRect(0, 0, targetW, targetH);
    }

    // 2. Render lightning bolts
    for (let s = 0; s < this.activeStrikes.length; s++) {
      const active = this.activeStrikes[s]!;
      const strike = active.strike;
      const progress = active.elapsedMs / strike.durationMs;
      const boltAlpha = Math.max(0, 1 - progress);

      // Outer glow
      c2d.strokeStyle = `rgba(${fr}, ${fg}, ${fb}, ${boltAlpha * 0.35})`;
      c2d.lineWidth = 6;
      this.drawBranches(c2d, strike.branches, targetW, targetH);

      // Inner core
      c2d.strokeStyle = `rgba(255, 255, 255, ${boltAlpha * 0.95})`;
      c2d.lineWidth = 2;
      this.drawBranches(c2d, strike.branches, targetW, targetH);
    }

    c2d.restore();
  }

  private drawBranches(
    c2d: CanvasRenderingContext2D,
    branches: ReadonlyArray<ReadonlyArray<EnvironmentalVector2Tuple>>,
    targetW: number,
    targetH: number,
  ): void {
    for (let b = 0; b < branches.length; b++) {
      const branch = branches[b]!;
      if (branch.length < 2) continue;

      c2d.beginPath();
      c2d.moveTo(branch[0]![0] * targetW, branch[0]![1] * targetH);
      for (let p = 1; p < branch.length; p++) {
        c2d.lineTo(branch[p]![0] * targetW, branch[p]![1] * targetH);
      }
      c2d.stroke();
    }
  }

  get activeStrikeCount(): number {
    return this.activeStrikes.length;
  }

  dispose(): void {
    this.activeStrikes.length = 0;
    this.currentFlashAlpha = 0;
  }
}

export function createLightningEffect(config?: LightningConfig): LightningEffectImpl {
  return new LightningEffectImpl(config);
}
