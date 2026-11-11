/**
 * AF Motion Gesture Classifier & Confidence Engine
 *
 * Deterministic gesture classification with multidimensional confidence scoring
 * and explainable breakdowns based on direction, velocity, duration, distance,
 * pointer count, linearity, scale, rotation, and edge containment.
 */

import { getRegisteredGestures } from "./custom-gestures.js";
import type {
  CustomGestureDefinition,
  GestureClassificationResult,
  GestureDirection,
  GestureEdge,
  GestureExplanation,
  GestureSample,
  Point2D,
} from "./types.js";

const CARDINAL_DIRECTIONS: Record<string, number> = {
  right: 0,
  "down-right": 45,
  down: 90,
  "down-left": 135,
  left: 180,
  "up-left": 225,
  up: 270,
  "up-right": 315,
};

/**
 * Computes the angle in degrees [0, 360) from deltaX, deltaY.
 */
export function calculateAngle(dx: number, dy: number): number {
  const rad = Math.atan2(dy, dx);
  let deg = (rad * 180) / Math.PI;
  if (deg < 0) {
    deg += 360;
  }
  return deg;
}

/**
 * Detects the predominant gesture direction from displacement.
 */
export function detectDirection(dx: number, dy: number, minDistance = 5): GestureDirection | null {
  const distance = Math.hypot(dx, dy);
  if (distance < minDistance) {
    return null;
  }

  const deg = calculateAngle(dx, dy);

  if (deg >= 337.5 || deg < 22.5) return "right";
  if (deg >= 22.5 && deg < 67.5) return "down-right";
  if (deg >= 67.5 && deg < 112.5) return "down";
  if (deg >= 112.5 && deg < 157.5) return "down-left";
  if (deg >= 157.5 && deg < 202.5) return "left";
  if (deg >= 202.5 && deg < 247.5) return "up-left";
  if (deg >= 247.5 && deg < 292.5) return "up";
  return "up-right";
}

/**
 * Calculates direction match score between 0.0 and 1.0.
 */
function scoreDirection(
  sample: GestureSample,
  targetDirection?: GestureDirection
): { score: number; reason?: string } {
  if (!targetDirection || targetDirection === "any") {
    return { score: 1.0 };
  }

  const dist = sample.distance;
  if (dist < 4) {
    return { score: 0.0, reason: "movement distance too small to establish direction" };
  }

  const dx = sample.deltaX;
  const dy = sample.deltaY;
  const deg = calculateAngle(dx, dy);

  if (targetDirection === "horizontal") {
    const horizontalScore = Math.abs(dx) / (Math.abs(dx) + Math.abs(dy) || 1);
    return {
      score: horizontalScore,
      reason: horizontalScore < 0.6 ? `direction is not predominantly horizontal (${deg.toFixed(0)}°)` : undefined,
    };
  }

  if (targetDirection === "vertical") {
    const verticalScore = Math.abs(dy) / (Math.abs(dx) + Math.abs(dy) || 1);
    return {
      score: verticalScore,
      reason: verticalScore < 0.6 ? `direction is not predominantly vertical (${deg.toFixed(0)}°)` : undefined,
    };
  }

  const targetAngle = CARDINAL_DIRECTIONS[targetDirection];
  if (targetAngle === undefined) {
    return { score: 1.0 };
  }

  let diff = Math.abs(deg - targetAngle);
  if (diff > 180) {
    diff = 360 - diff;
  }

  if (diff <= 22.5) {
    return { score: 1.0 };
  }
  if (diff <= 45) {
    const score = 1.0 - (diff - 22.5) / (45 - 22.5) * 0.3; // 1.0 down to 0.7
    return { score };
  }
  if (diff <= 90) {
    const score = 0.7 - (diff - 45) / 45 * 0.7; // 0.7 down to 0.0
    return {
      score,
      reason: `angle ${deg.toFixed(0)}° deviates from ${targetDirection} (${targetAngle}°) by ${diff.toFixed(0)}°`,
    };
  }

  return {
    score: 0.0,
    reason: `angle ${deg.toFixed(0)}° is opposite to ${targetDirection} (${targetAngle}°)`,
  };
}

/**
 * Scores pointer count matching.
 */
function scorePointerCount(
  sample: GestureSample,
  def: CustomGestureDefinition
): { score: number; reason?: string } {
  if (def.pointerCount === undefined) {
    return { score: 1.0 };
  }

  if (typeof def.pointerCount === "number") {
    if (sample.pointerCount === def.pointerCount) {
      return { score: 1.0 };
    }
    return {
      score: 0.0,
      reason: `expected ${def.pointerCount} pointers, observed ${sample.pointerCount}`,
    };
  }

  const min = def.pointerCount.min ?? 1;
  const max = def.pointerCount.max ?? Infinity;
  if (sample.pointerCount >= min && sample.pointerCount <= max) {
    return { score: 1.0 };
  }
  return {
    score: 0.0,
    reason: `pointer count ${sample.pointerCount} outside range [${min}, ${max}]`,
  };
}

/**
 * Scores distance criteria.
 */
function scoreDistance(
  sample: GestureSample,
  def: CustomGestureDefinition
): { score: number; reason?: string } {
  const dist = sample.distance;

  if (def.minDistance !== undefined && dist < def.minDistance) {
    const score = def.minDistance > 0 ? Math.max(0, dist / def.minDistance) : 0;
    return {
      score,
      reason: `distance ${dist.toFixed(1)}px below minimum ${def.minDistance}px`,
    };
  }

  if (def.maxDistance !== undefined && dist > def.maxDistance) {
    const over = dist - def.maxDistance;
    const score = Math.max(0, 1.0 - over / (def.maxDistance || 1));
    return {
      score,
      reason: `distance ${dist.toFixed(1)}px exceeded maximum ${def.maxDistance}px`,
    };
  }

  return { score: 1.0 };
}

/**
 * Scores duration criteria.
 */
function scoreDuration(
  sample: GestureSample,
  def: CustomGestureDefinition
): { score: number; reason?: string } {
  const dur = sample.durationMs;

  if (def.minDurationMs !== undefined && dur < def.minDurationMs) {
    const score = def.minDurationMs > 0 ? Math.max(0, dur / def.minDurationMs) : 0;
    return {
      score,
      reason: `duration ${dur.toFixed(0)}ms below minimum ${def.minDurationMs}ms`,
    };
  }

  if (def.maxDurationMs !== undefined && dur > def.maxDurationMs) {
    const over = dur - def.maxDurationMs;
    const score = Math.max(0, 1.0 - over / (def.maxDurationMs || 1));
    return {
      score,
      reason: `duration ${dur.toFixed(0)}ms exceeded maximum ${def.maxDurationMs}ms`,
    };
  }

  return { score: 1.0 };
}

/**
 * Scores velocity criteria.
 */
function scoreVelocity(
  sample: GestureSample,
  def: CustomGestureDefinition
): { score: number; reason?: string } {
  const speed = sample.speed;

  if (def.minVelocity !== undefined && speed < def.minVelocity) {
    const score = def.minVelocity > 0 ? Math.max(0, speed / def.minVelocity) : 0;
    return {
      score,
      reason: `velocity ${speed.toFixed(1)}px/s below minimum ${def.minVelocity}px/s`,
    };
  }

  if (def.maxVelocity !== undefined && speed > def.maxVelocity) {
    const over = speed - def.maxVelocity;
    const score = Math.max(0, 1.0 - over / (def.maxVelocity || 1));
    return {
      score,
      reason: `velocity ${speed.toFixed(1)}px/s exceeded maximum ${def.maxVelocity}px/s`,
    };
  }

  return { score: 1.0 };
}

/**
 * Computes gesture path linearity (net displacement / path length).
 */
export function calculateLinearity(sample: GestureSample): number {
  const path = sample.pathLength ?? sample.distance;
  if (path <= 0 || sample.distance <= 0) return 1.0;
  return Math.min(1.0, Math.max(0.0, sample.distance / path));
}

/**
 * Scores edge starting position if required.
 */
function scoreEdge(
  sample: GestureSample,
  edge?: GestureEdge,
  threshold = 30
): { score?: number; reason?: string } {
  if (!edge) return {};

  const minX = sample.targetBounds?.minX ?? 0;
  const minY = sample.targetBounds?.minY ?? 0;
  const maxX = sample.targetBounds?.maxX ?? (typeof window !== "undefined" ? window.innerWidth : 1000);
  const maxY = sample.targetBounds?.maxY ?? (typeof window !== "undefined" ? window.innerHeight : 1000);

  let distFromEdge = 0;
  switch (edge) {
    case "left":
      distFromEdge = sample.startPoint.x - minX;
      break;
    case "right":
      distFromEdge = maxX - sample.startPoint.x;
      break;
    case "top":
      distFromEdge = sample.startPoint.y - minY;
      break;
    case "bottom":
      distFromEdge = maxY - sample.startPoint.y;
      break;
  }

  if (distFromEdge <= threshold) {
    return { score: 1.0 };
  }

  const over = distFromEdge - threshold;
  const score = Math.max(0, 1.0 - over / threshold);
  return {
    score,
    reason: `start position (${sample.startPoint.x.toFixed(0)}, ${sample.startPoint.y.toFixed(0)}) is ${distFromEdge.toFixed(0)}px away from ${edge} edge (max ${threshold}px)`,
  };
}

/**
 * Scores scale change (pinch gestures).
 */
function scoreScale(
  sample: GestureSample,
  def: CustomGestureDefinition
): { score?: number; reason?: string } {
  if (def.minScaleChange === undefined && !def.id.startsWith("pinch")) {
    return {};
  }

  const minScaleChange = def.minScaleChange ?? 0.1;
  const rawScale = sample.scaleChange ?? 1.0;

  if (def.id === "pinch-in") {
    const pinchInDelta = 1.0 - rawScale;
    if (pinchInDelta >= minScaleChange) return { score: 1.0 };
    return {
      score: pinchInDelta > 0 ? Math.max(0, pinchInDelta / minScaleChange) : 0,
      reason: `pinch-in delta ${(pinchInDelta * 100).toFixed(1)}% below required ${(minScaleChange * 100).toFixed(1)}%`,
    };
  }

  if (def.id === "pinch-out") {
    const pinchOutDelta = rawScale - 1.0;
    if (pinchOutDelta >= minScaleChange) return { score: 1.0 };
    return {
      score: pinchOutDelta > 0 ? Math.max(0, pinchOutDelta / minScaleChange) : 0,
      reason: `pinch-out delta ${(pinchOutDelta * 100).toFixed(1)}% below required ${(minScaleChange * 100).toFixed(1)}%`,
    };
  }

  const absDelta = Math.abs(rawScale - 1.0);
  if (absDelta >= minScaleChange) return { score: 1.0 };
  return {
    score: Math.max(0, absDelta / minScaleChange),
    reason: `scale delta ${(absDelta * 100).toFixed(1)}% below required ${(minScaleChange * 100).toFixed(1)}%`,
  };
}

/**
 * Scores rotation change (rotation gestures).
 */
function scoreRotation(
  sample: GestureSample,
  def: CustomGestureDefinition
): { score?: number; reason?: string } {
  if (def.minRotationChange === undefined && !def.id.startsWith("rotate")) {
    return {};
  }

  const minRotationChange = def.minRotationChange ?? 15;
  const rawRot = sample.rotationChange ?? 0.0;

  if (def.id === "rotate-cw") {
    if (rawRot >= minRotationChange) return { score: 1.0 };
    return {
      score: rawRot > 0 ? Math.max(0, rawRot / minRotationChange) : 0,
      reason: `clockwise rotation ${rawRot.toFixed(1)}° below required ${minRotationChange}°`,
    };
  }

  if (def.id === "rotate-ccw") {
    const ccwRot = -rawRot;
    if (ccwRot >= minRotationChange) return { score: 1.0 };
    return {
      score: ccwRot > 0 ? Math.max(0, ccwRot / minRotationChange) : 0,
      reason: `counter-clockwise rotation ${ccwRot.toFixed(1)}° below required ${minRotationChange}°`,
    };
  }

  const absRot = Math.abs(rawRot);
  if (absRot >= minRotationChange) return { score: 1.0 };
  return {
    score: Math.max(0, absRot / minRotationChange),
    reason: `rotation ${absRot.toFixed(1)}° below required ${minRotationChange}°`,
  };
}

/**
 * Produces an explainable breakdown of a gesture classification candidate.
 */
export function explainGesture(
  sample: GestureSample,
  def: CustomGestureDefinition
): GestureExplanation {
  const dir = scoreDirection(sample, def.direction);
  const ptr = scorePointerCount(sample, def);
  const dist = scoreDistance(sample, def);
  const dur = scoreDuration(sample, def);
  const vel = scoreVelocity(sample, def);
  const lin = calculateLinearity(sample);
  const edge = scoreEdge(sample, def.edge, def.edgeThreshold);
  const scale = scoreScale(sample, def);
  const rot = scoreRotation(sample, def);

  const failureReasons: string[] = [];
  if (ptr.reason) failureReasons.push(ptr.reason);
  if (dir.reason) failureReasons.push(dir.reason);
  if (dist.reason) failureReasons.push(dist.reason);
  if (dur.reason) failureReasons.push(dur.reason);
  if (vel.reason) failureReasons.push(vel.reason);
  if (edge.reason) failureReasons.push(edge.reason);
  if (scale.reason) failureReasons.push(scale.reason);
  if (rot.reason) failureReasons.push(rot.reason);

  const name = def.name ?? def.id;
  const summary =
    failureReasons.length === 0
      ? `Matched ${name} cleanly across all criteria.`
      : `Failed ${name}: ${failureReasons.join("; ")}.`;

  return {
    directionMatch: dir.score,
    velocityMatch: vel.score,
    distanceMatch: dist.score,
    durationMatch: dur.score,
    pointerCountMatch: ptr.score,
    linearity: lin,
    edgeMatch: edge.score,
    scaleMatch: scale.score,
    rotationMatch: rot.score,
    summary,
  };
}

/**
 * Calculates gesture definition specificity score.
 * Highly constrained gestures (swipes, pinches, edge gestures) score higher
 * than generic catch-all gestures (drag, pan).
 */
export function calculateSpecificity(def: CustomGestureDefinition): number {
  let score = 0;
  if (def.direction && def.direction !== "any") score += 50;
  if (def.edge) score += 40;
  if (def.minVelocity !== undefined || def.maxVelocity !== undefined) score += 30;
  if (def.minScaleChange !== undefined) score += 40;
  if (def.minRotationChange !== undefined) score += 40;
  if (def.minLinearity !== undefined) score += 20;
  if (def.minDurationMs !== undefined || def.maxDurationMs !== undefined) score += 15;
  if (def.minDistance !== undefined || def.maxDistance !== undefined) score += 10;
  if (def.priority === "critical") score += 60;
  if (def.priority === "high") score += 30;
  if (def.priority === "low") score -= 20;
  return score;
}

/**
 * Evaluates a single gesture candidate against a definition and computes confidence.
 */
export function evaluateGestureMatch(
  sample: GestureSample,
  def: CustomGestureDefinition,
  minConfidence = 0.65
): GestureClassificationResult {
  const explanation = explainGesture(sample, def);

  // Critical hard criteria check
  if (explanation.pointerCountMatch < 0.5) {
    return {
      gestureId: def.id,
      name: def.name ?? def.id,
      confidence: 0.0,
      isMatch: false,
      explanation,
      sample,
      recognizedAt: Date.now(),
    };
  }

  if (def.direction && def.direction !== "any" && explanation.directionMatch < 0.5) {
    return {
      gestureId: def.id,
      name: def.name ?? def.id,
      confidence: 0.0,
      isMatch: false,
      explanation,
      sample,
      recognizedAt: Date.now(),
    };
  }

  if (def.edge && explanation.edgeMatch !== undefined && explanation.edgeMatch < 0.5) {
    return {
      gestureId: def.id,
      name: def.name ?? def.id,
      confidence: 0.0,
      isMatch: false,
      explanation,
      sample,
      recognizedAt: Date.now(),
    };
  }

  // Multidimensional weighted confidence calculation
  const weights: { score: number; weight: number }[] = [
    { score: explanation.pointerCountMatch, weight: 1.0 },
    { score: explanation.distanceMatch, weight: 1.2 },
    { score: explanation.durationMatch, weight: 1.0 },
  ];

  if (def.direction && def.direction !== "any") {
    weights.push({ score: explanation.directionMatch, weight: 1.5 });
  }

  if (def.minVelocity !== undefined || def.maxVelocity !== undefined) {
    weights.push({ score: explanation.velocityMatch, weight: 1.2 });
  }

  if (explanation.edgeMatch !== undefined) {
    weights.push({ score: explanation.edgeMatch, weight: 1.3 });
  }

  if (explanation.scaleMatch !== undefined) {
    weights.push({ score: explanation.scaleMatch, weight: 1.5 });
  }

  if (explanation.rotationMatch !== undefined) {
    weights.push({ score: explanation.rotationMatch, weight: 1.5 });
  }

  if (def.minLinearity !== undefined) {
    const linScore = explanation.linearity >= def.minLinearity ? 1.0 : explanation.linearity / def.minLinearity;
    weights.push({ score: linScore, weight: 1.0 });
  }

  let totalWeight = 0;
  let totalScore = 0;
  for (const item of weights) {
    totalWeight += item.weight;
    totalScore += item.score * item.weight;
  }

  const confidence = totalWeight > 0 ? Math.min(1.0, Math.max(0.0, totalScore / totalWeight)) : 1.0;
  const isMatch =
    confidence >= minConfidence &&
    explanation.distanceMatch >= 0.5 &&
    explanation.durationMatch >= 0.5 &&
    explanation.velocityMatch >= 0.5 &&
    (explanation.scaleMatch === undefined || explanation.scaleMatch >= 0.5) &&
    (explanation.rotationMatch === undefined || explanation.rotationMatch >= 0.5);

  return {
    gestureId: def.id,
    name: def.name ?? def.id,
    confidence: Number(confidence.toFixed(3)),
    isMatch,
    explanation,
    sample,
    recognizedAt: Date.now(),
  };
}

/**
 * Classifies an input gesture sample against all registered gestures or a specific definition.
 */
export function classifyGesture(
  sample: GestureSample,
  targetDefinition?: CustomGestureDefinition,
  minConfidence = 0.65
): GestureClassificationResult {
  if (targetDefinition) {
    return evaluateGestureMatch(sample, targetDefinition, minConfidence);
  }

  const allSorted = classifyAllGestures(sample, getRegisteredGestures(), minConfidence);
  const matching = allSorted.filter((res) => res.isMatch);

  if (matching.length > 0) {
    return matching[0];
  }

  // Diagnostic fallback for closest attempt
  const allAttempts = classifyAllGestures(sample, getRegisteredGestures(), 0.0);
  if (allAttempts.length > 0) {
    return allAttempts[0];
  }

  const fallbackSample = sample;
  return {
    gestureId: "unknown",
    name: "Unknown Gesture",
    confidence: 0.0,
    isMatch: false,
    explanation: {
      directionMatch: 0,
      velocityMatch: 0,
      distanceMatch: 0,
      durationMatch: 0,
      pointerCountMatch: 0,
      linearity: calculateLinearity(sample),
      summary: "No registered gestures matched the input sample.",
    },
    sample: fallbackSample,
    recognizedAt: Date.now(),
  };
}

/**
 * Classifies a gesture sample against all registered definitions, returning all results sorted by
 * confidence and gesture specificity.
 */
export function classifyAllGestures(
  sample: GestureSample,
  definitions: readonly CustomGestureDefinition[] = getRegisteredGestures(),
  minConfidence = 0.0
): readonly GestureClassificationResult[] {
  const defMap = new Map<string, CustomGestureDefinition>(definitions.map((d) => [d.id, d]));

  return definitions
    .map((def) => evaluateGestureMatch(sample, def, minConfidence))
    .sort((a, b) => {
      const diff = b.confidence - a.confidence;
      if (Math.abs(diff) > 0.05) {
        return diff;
      }
      // If confidence is tied or within 0.05, prioritize higher specificity
      const defA = defMap.get(a.gestureId);
      const defB = defMap.get(b.gestureId);
      const specA = defA ? calculateSpecificity(defA) : 0;
      const specB = defB ? calculateSpecificity(defB) : 0;
      return specB - specA;
    });
}
