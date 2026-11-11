/**
 * AF Motion Kinetic Typography Motion Path Integration
 *
 * Positions and orients segmented typography units along 2D and 3D motion paths
 * using AF Motion's Motion Path Engine.
 */

import { createMotionPath } from "../motion-path/engine.js";
import { setTransformLayer } from "../transform.js";
import type { MotionPath, MotionPathDefinition } from "../motion-path/types.js";
import type { TypographyUnit } from "./types.js";

export interface TextPathOptions {
  /** Normalized path offset for the first character (0..1). Defaults to 0. */
  pathOffset?: number;
  /** Automatically orient characters along path tangent. Defaults to true. */
  autoRotate?: boolean;
  /** Fixed rotation offset in degrees. Defaults to 0. */
  rotationOffset?: number;
  /** Whether the text path forms a closed loop. Defaults to false. */
  loop?: boolean;
  /** Transform owner token for transform layering. */
  transformOwner?: object;
}

/**
 * Positions an array of typography units along a motion path at a specific global progress.
 */
export function applyTextToMotionPath(
  units: ReadonlyArray<TypographyUnit>,
  pathDefinition: MotionPathDefinition,
  globalProgress: number,
  options: TextPathOptions = {}
): void {
  const path: MotionPath = createMotionPath(pathDefinition);
  const totalUnits = units.length;
  if (totalUnits === 0 || path.totalLength <= 0) return;

  const autoRotate = options.autoRotate ?? true;
  const rotationOffset = options.rotationOffset ?? 0;
  const pathOffset = options.pathOffset ?? 0;
  const loop = options.loop ?? path.isClosed;
  const owner = options.transformOwner ?? {};

  for (let i = 0; i < totalUnits; i++) {
    const unit = units[i]!;
    if (!unit.element) continue;

    // Distribute units along normalized progress
    const spacingFraction = totalUnits > 1 ? i / (totalUnits - 1) : 0;
    // Map text length to a fraction of path (or full span)
    const spanProgress = 0.8;
    const baseProgress = pathOffset + spacingFraction * spanProgress;
    let unitProgress = baseProgress + globalProgress;

    if (loop) {
      unitProgress = ((unitProgress % 1) + 1) % 1;
    } else {
      unitProgress = Math.max(0, Math.min(1, unitProgress));
    }

    const sample = path.sample(unitProgress, {
      constantSpeed: true,
      overflow: loop ? "loop" : "clamp",
    });

    const x = sample.position.x.toFixed(3);
    const y = sample.position.y.toFixed(3);
    const z = sample.position.z.toFixed(3);

    const translate = path.is3D
      ? `translate3d(${x}px, ${y}px, ${z}px)`
      : `translate(${x}px, ${y}px)`;

    let transform = translate;
    if (autoRotate) {
      const rot = (sample.angle + rotationOffset).toFixed(2);
      transform += ` rotate(${rot}deg)`;
    }

    setTransformLayer(unit.element, owner, transform);
  }
}
