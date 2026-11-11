/**
 * AF Motion Elliptical Arc to Cubic Bézier Converter
 *
 * Implements the W3C SVG Arc Endpoint-to-Center Parameterization (Annex F.6)
 * and approximates arbitrary elliptical arcs using smooth cubic Bézier segments.
 */

import type { CubicSegment, SVGPointTuple } from "./types.js";

function vectorAngle(ux: number, uy: number, vx: number, vy: number): number {
  const dot = ux * vx + uy * vy;
  const len = Math.hypot(ux, uy) * Math.hypot(vx, vy);
  let ang = Math.acos(Math.max(-1, Math.min(1, dot / (len || 1))));
  if (ux * vy - uy * vx < 0) ang = -ang;
  return ang;
}

/**
 * Converts an SVG elliptical arc into an array of equivalent Cubic Bézier segments.
 */
export function arcToCubic(
  x1: number,
  y1: number,
  rx: number,
  ry: number,
  angleDeg: number,
  largeArcFlag: number,
  sweepFlag: number,
  x2: number,
  y2: number
): CubicSegment[] {
  // If endpoints are identical, no path to draw
  if (Math.abs(x1 - x2) < 1e-6 && Math.abs(y1 - y2) < 1e-6) {
    return [];
  }

  // If either radius is zero, treat as straight line represented as cubic
  if (rx === 0 || ry === 0) {
    return [
      {
        type: "C",
        cp1: [x1 + (x2 - x1) / 3, y1 + (y2 - y1) / 3],
        cp2: [x1 + (2 * (x2 - x1)) / 3, y1 + (2 * (y2 - y1)) / 3],
        end: [x2, y2],
      },
    ];
  }

  let absRx = Math.abs(rx);
  let absRy = Math.abs(ry);
  const phi = (angleDeg * Math.PI) / 180;
  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);

  // Step 1: Compute (x1', y1')
  const dx2 = (x1 - x2) / 2;
  const dy2 = (y1 - y2) / 2;
  const x1p = cosPhi * dx2 + sinPhi * dy2;
  const y1p = -sinPhi * dx2 + cosPhi * dy2;

  // Step 2: Ensure radii are large enough
  const lambda = (x1p * x1p) / (absRx * absRx) + (y1p * y1p) / (absRy * absRy);
  if (lambda > 1) {
    const sqrtLambda = Math.sqrt(lambda);
    absRx *= sqrtLambda;
    absRy *= sqrtLambda;
  }

  // Step 3: Compute (cx', cy')
  const sign = largeArcFlag === sweepFlag ? -1 : 1;
  const sqNumerator = absRx * absRx * absRy * absRy - absRx * absRx * y1p * y1p - absRy * absRy * x1p * x1p;
  const sqDenominator = absRx * absRx * y1p * y1p + absRy * absRy * x1p * x1p;
  const sq = Math.max(0, sqNumerator / (sqDenominator || 1));
  const coef = sign * Math.sqrt(sq);
  const cxp = coef * ((absRx * y1p) / absRy);
  const cyp = coef * (-(absRy * x1p) / absRx);

  // Step 4: Compute center (cx, cy)
  const cx = cosPhi * cxp - sinPhi * cyp + (x1 + x2) / 2;
  const cy = sinPhi * cxp + cosPhi * cyp + (y1 + y2) / 2;

  // Step 5: Compute start angle theta1 and angular sweep dTheta
  const ux = (x1p - cxp) / absRx;
  const uy = (y1p - cyp) / absRy;
  const vx = (-x1p - cxp) / absRx;
  const vy = (-y1p - cyp) / absRy;

  const theta1 = vectorAngle(1, 0, ux, uy);
  let dTheta = vectorAngle(ux, uy, vx, vy);

  if (!sweepFlag && dTheta > 0) {
    dTheta -= 2 * Math.PI;
  } else if (sweepFlag && dTheta < 0) {
    dTheta += 2 * Math.PI;
  }

  // Subdivide arc into segments of at most PI / 2 (90 degrees)
  const segmentsCount = Math.max(1, Math.ceil(Math.abs(dTheta) / (Math.PI / 2)));
  const delta = dTheta / segmentsCount;

  // Cubic approximation constant: alpha = (4/3) * tan(delta / 4)
  const alpha = (4 / 3) * Math.tan(delta / 4);

  const result: CubicSegment[] = [];
  let currentTheta = theta1;
  let currentX = x1;
  let currentY = y1;

  for (let i = 0; i < segmentsCount; i++) {
    const nextTheta = currentTheta + delta;

    const cosTheta = Math.cos(currentTheta);
    const sinTheta = Math.sin(currentTheta);
    const cosNextTheta = Math.cos(nextTheta);
    const sinNextTheta = Math.sin(nextTheta);

    // Compute endpoint
    let nextX: number;
    let nextY: number;

    if (i === segmentsCount - 1) {
      nextX = x2;
      nextY = y2;
    } else {
      const epXp = absRx * cosNextTheta;
      const epYp = absRy * sinNextTheta;
      nextX = cosPhi * epXp - sinPhi * epYp + cx;
      nextY = sinPhi * epXp + cosPhi * epYp + cy;
    }

    // Tangent vectors for control points
    const cp1Xp = absRx * (cosTheta - alpha * sinTheta);
    const cp1Yp = absRy * (sinTheta + alpha * cosTheta);
    const cp1X = cosPhi * cp1Xp - sinPhi * cp1Yp + cx;
    const cp1Y = sinPhi * cp1Xp + cosPhi * cp1Yp + cy;

    const cp2Xp = absRx * (cosNextTheta + alpha * sinNextTheta);
    const cp2Yp = absRy * (sinNextTheta - alpha * cosNextTheta);
    const cp2X = cosPhi * cp2Xp - sinPhi * cp2Yp + cx;
    const cp2Y = sinPhi * cp2Xp + cosPhi * cp2Yp + cy;

    result.push({
      type: "C",
      cp1: [cp1X, cp1Y],
      cp2: [cp2X, cp2Y],
      end: [nextX, nextY],
    });

    currentTheta = nextTheta;
    currentX = nextX;
    currentY = nextY;
  }

  return result;
}
