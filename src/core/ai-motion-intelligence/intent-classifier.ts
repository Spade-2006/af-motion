/**
 * AF Motion AI Motion Intent Classifier
 *
 * Deterministic, rule-based classification engine identifying animation intent
 * from configuration properties, composition nodes, and context signals.
 */

import type {
  AIMotionIntentType,
  IntentClassificationResult,
  IntentSignal,
  MotionAnalysisInput,
  SecondaryIntentResult,
} from "./types.js";
import type { ClassifiedIntentResult, ComponentCategory, MotionIntent } from "../animation-intelligence/types.js";
import { classifyMotionIntent as classifySelectionIntent } from "../animation-intelligence/intent.js";

interface ScoredIntent {
  intent: AIMotionIntentType;
  score: number;
  signals: IntentSignal[];
  reason: string;
}

export function classifyMotionIntent(input: MotionAnalysisInput): IntentClassificationResult;
export function classifyMotionIntent(
  input: string | { componentType?: ComponentCategory; intent?: MotionIntent; description?: string }
): ClassifiedIntentResult;
export function classifyMotionIntent(
  input: MotionAnalysisInput | string | { componentType?: ComponentCategory; intent?: MotionIntent; description?: string }
): IntentClassificationResult | ClassifiedIntentResult {
  if (
    typeof input === "string" ||
    (input &&
      typeof input === "object" &&
      ("componentType" in input || "description" in input || "intent" in input) &&
      !("configuration" in input) &&
      !("composition" in input) &&
      !("contextHint" in input))
  ) {
    return classifySelectionIntent(input as string | { componentType?: ComponentCategory; intent?: MotionIntent; description?: string });
  }
  const analysisInput = (input ?? {}) as MotionAnalysisInput;
  const config = analysisInput.configuration ?? {};
  const composition = analysisInput.composition;
  const contextHint = analysisInput.contextHint?.toLowerCase() ?? "";

  const candidateIntents: Map<AIMotionIntentType, ScoredIntent> = new Map();

  const registerSignal = (
    intent: AIMotionIntentType,
    signalName: string,
    weight: number,
    sourceField: string,
    reason: string
  ) => {
    let entry = candidateIntents.get(intent);
    if (!entry) {
      entry = { intent, score: 0, signals: [], reason };
      candidateIntents.set(intent, entry);
    }
    entry.score += weight;
    entry.signals.push({ signal: signalName, weight, sourceField });
  };

  // 1. Inspect Properties & Keyframes
  const props = (config.properties as Record<string, unknown>) ?? config;
  const trigger = String(config.trigger ?? "").toLowerCase();
  const iterations = config.iterations ?? config.repeat;
  const isInfinite = iterations === "infinite" || iterations === Infinity;
  const duration = typeof config.duration === "number" ? config.duration : 600;

  // Entrance signals
  if (trigger === "entrance" || trigger === "inview" || trigger === "reveal") {
    registerSignal("entrance", "Trigger explicitly set to entrance/inview", 4.0, "trigger", "Trigger indicates entrance");
  }
  if (props.opacity !== undefined && (props.opacity === 0 || (Array.isArray(props.opacity) && props.opacity[0] === 0))) {
    registerSignal("entrance", "Starting opacity is 0 (fade in)", 2.5, "opacity", "Element fades in from transparency");
  }
  if (props.y !== undefined || props.translateY !== undefined) {
    registerSignal("entrance", "Vertical offset transition", 1.5, "translateY", "Translates along Y axis on entrance");
  }

  // Exit signals
  if (trigger === "exit" || trigger === "leave") {
    registerSignal("exit", "Trigger explicitly set to exit", 4.0, "trigger", "Trigger indicates component departure");
  }
  if (Array.isArray(props.opacity) && props.opacity[props.opacity.length - 1] === 0) {
    registerSignal("exit", "Ending opacity is 0 (fade out)", 2.5, "opacity", "Element fades out to transparency");
  }

  // Attention & Ambient signals
  if (isInfinite) {
    if (duration > 1500) {
      registerSignal("ambient", "Slow infinite looping motion", 3.0, "duration/iterations", "Continuous ambient animation");
    } else {
      registerSignal("attention", "Rapid looping attention grabber", 3.0, "duration/iterations", "Repeating attention-grabbing loop");
    }
  }

  // Feedback signals
  if (trigger === "click" || trigger === "press" || trigger === "tap" || duration < 250) {
    registerSignal("feedback", "Fast reactive transition under 250ms", 3.5, "trigger/duration", "Responsive tactile user feedback");
  }

  // Interaction signals
  if (trigger === "hover" || trigger === "drag" || trigger === "pointer" || config.magnetic || config.tilt) {
    registerSignal("interaction", "Direct pointer/drag/magnetic tracking", 4.0, "interaction", "Continuous user input tracking");
  }

  // Morphing signals
  if (config.morph || config.path || config.svgPath || config.d || props.d) {
    registerSignal("morphing", "SVG path / geometry morphing detected", 4.5, "morph/path", "Interpolation between topological shapes");
  }

  // Spatial Movement / 3D signals
  if (props.z !== undefined || props.rotateX !== undefined || props.rotateY !== undefined || config.is3D || config.camera) {
    registerSignal("spatial-movement", "Depth Z-axis or 3D rotation detected", 4.0, "3d-transforms", "Movement in 3D perspective space");
  }

  // Simulation signals
  if (config.particleCount || config.fluid || config.emitter || config.physicsWorld) {
    registerSignal("simulation", "GPU particles, fluid dynamics, or continuous physics", 4.5, "simulation", "Real-time physics or particle simulation");
  }

  // Scroll Storytelling signals
  if (trigger === "scroll" || config.scrollVelocity || config.scrollProgress) {
    registerSignal("scroll-storytelling", "Scroll-linked animation progress", 4.0, "scroll", "Drives narrative motion via scroll progress");
  }

  // Loading signals
  if (contextHint.includes("load") || contextHint.includes("spinner") || (props.rotate && isInfinite)) {
    registerSignal("loading", "Continuous rotational loader or loading context", 3.5, "contextHint/rotate", "Indicates background asynchronous work");
  }

  // 2. Composition Multi-Node Signals
  if (composition) {
    const nodeCount = Object.keys(composition.nodes).length;
    if (nodeCount > 3) {
      registerSignal("transition", "Multi-node hierarchical composition", 2.0, "composition.nodes", "Coordinated multi-element transition");
    }
  }

  // 3. Fallback if no specific signal captured
  if (candidateIntents.size === 0) {
    registerSignal("entrance", "Default entrance animation presumption", 1.0, "default", "Standard motion activation");
  }

  // 4. Rank and Normalize Confidences
  const sorted = Array.from(candidateIntents.values()).sort((a, b) => b.score - a.score);
  const highest = sorted[0];
  const maxPossibleScore = 5.0;
  const primaryConfidence = Math.min(1.0, Number((highest.score / maxPossibleScore).toFixed(2)));

  const secondaryIntents: SecondaryIntentResult[] = sorted.slice(1, 4).map((item) => ({
    intent: item.intent,
    confidence: Math.min(0.95, Number((item.score / maxPossibleScore).toFixed(2))),
    reason: item.reason,
  }));

  const explanation = `Classified as "${highest.intent}" with ${(primaryConfidence * 100).toFixed(0)}% confidence based on ${highest.signals.map((s) => s.signal).join("; ")}.`;

  return {
    primaryIntent: highest.intent,
    confidence: primaryConfidence,
    secondaryIntents,
    signals: highest.signals,
    explanation,
  };
}
