/**
 * AF Motion Gesture Sequence State Machine
 *
 * Coordinates multi-stage gesture sequences (e.g. tap -> swipe, long-press -> drag)
 * with individual stage timeouts, optional stages, partial progress tracking,
 * and deterministic sequence completion.
 */

import { GestureConfigurationError } from "./errors.js";
import type {
  GestureClassificationResult,
  GestureSequenceController,
  GestureSequenceOptions,
  GestureSequenceStage,
  GestureSequenceState,
} from "./types.js";

let nextSequenceId = 1;

export function createGestureSequence(options: GestureSequenceOptions): GestureSequenceController {
  if (!options || !Array.isArray(options.stages) || options.stages.length === 0) {
    throw new GestureConfigurationError("Gesture sequence must have at least one stage.");
  }

  const id = options.id ?? `seq-${nextSequenceId++}`;
  const stages = [...options.stages];
  const sequenceTimeoutMs = options.sequenceTimeoutMs;

  let currentStageIndex = 0;
  let completedResults: GestureClassificationResult[] = [];
  let completedStages: string[] = [];
  let isMatched = false;
  let isFailed = false;
  let startTime = 0;
  let lastStageTime = 0;
  let isDestroyed = false;

  function resetState(): void {
    currentStageIndex = 0;
    completedResults = [];
    completedStages = [];
    isMatched = false;
    isFailed = false;
    startTime = 0;
    lastStageTime = 0;
  }

  function getTimeRemaining(): number {
    if (startTime === 0 || isMatched || isFailed) return 0;
    if (!sequenceTimeoutMs) return Infinity;
    const elapsed = Date.now() - startTime;
    return Math.max(0, sequenceTimeoutMs - elapsed);
  }

  function getState(): GestureSequenceState {
    return {
      stageIndex: currentStageIndex,
      totalStages: stages.length,
      completedStages: [...completedStages],
      completedResults: [...completedResults],
      isMatched,
      isFailed,
      timeRemainingMs: getTimeRemaining(),
    };
  }

  function feed(match: GestureClassificationResult): boolean {
    if (isDestroyed || isMatched) {
      return false;
    }

    const now = match.recognizedAt || Date.now();

    // Check overall sequence timeout
    if (startTime > 0 && sequenceTimeoutMs !== undefined && sequenceTimeoutMs > 0) {
      if (now - startTime > sequenceTimeoutMs) {
        options.onSequenceFailed?.("Sequence timed out", currentStageIndex);
        resetState();
      }
    }

    // Initialize sequence start
    if (currentStageIndex === 0) {
      startTime = now;
      lastStageTime = now;
    }

    let activeStage = stages[currentStageIndex];

    // Check individual stage timeout
    if (activeStage && currentStageIndex > 0 && activeStage.timeoutMs !== undefined) {
      if (now - lastStageTime > activeStage.timeoutMs) {
        if (activeStage.optional) {
          // Skip optional stage
          currentStageIndex++;
          activeStage = stages[currentStageIndex];
        } else {
          options.onSequenceFailed?.(`Stage ${currentStageIndex} timed out`, currentStageIndex);
          resetState();
          return false;
        }
      }
    }

    if (!activeStage) {
      return false;
    }

    // Match candidate against active stage
    if (match.gestureId === activeStage.gestureId && match.isMatch) {
      completedStages.push(activeStage.gestureId);
      completedResults.push(match);
      lastStageTime = now;

      options.onStageCompleted?.(activeStage, currentStageIndex);
      currentStageIndex++;

      // Check if sequence is now complete
      if (currentStageIndex >= stages.length) {
        isMatched = true;
        options.onSequenceCompleted?.([...completedResults]);
      }
      return true;
    }

    // Check if active stage is optional and candidate matches the next stage
    if (activeStage.optional && currentStageIndex + 1 < stages.length) {
      const nextStage = stages[currentStageIndex + 1];
      if (match.gestureId === nextStage.gestureId && match.isMatch) {
        currentStageIndex++; // skip optional
        completedStages.push(nextStage.gestureId);
        completedResults.push(match);
        lastStageTime = now;

        options.onStageCompleted?.(nextStage, currentStageIndex);
        currentStageIndex++;

        if (currentStageIndex >= stages.length) {
          isMatched = true;
          options.onSequenceCompleted?.([...completedResults]);
        }
        return true;
      }
    }

    // If mismatch occurred at non-zero stage, reset sequence
    if (currentStageIndex > 0) {
      options.onSequenceFailed?.(
        `Unexpected gesture "${match.gestureId}" at stage ${currentStageIndex} (expected "${activeStage.gestureId}")`,
        currentStageIndex
      );
      resetState();

      // Check if the current match happens to match stage 0 of a restarted sequence
      if (match.gestureId === stages[0].gestureId && match.isMatch) {
        startTime = now;
        lastStageTime = now;
        completedStages.push(stages[0].gestureId);
        completedResults.push(match);
        options.onStageCompleted?.(stages[0], 0);
        currentStageIndex = 1;

        if (currentStageIndex >= stages.length) {
          isMatched = true;
          options.onSequenceCompleted?.([...completedResults]);
        }
        return true;
      }
    }

    return false;
  }

  function cancel(): void {
    if (isDestroyed) return;
    isFailed = true;
    options.onSequenceFailed?.("Sequence cancelled by user", currentStageIndex);
    resetState();
  }

  function reset(): void {
    if (isDestroyed) return;
    resetState();
    options.onReset?.();
  }

  function destroy(): void {
    isDestroyed = true;
    resetState();
  }

  return {
    id,
    getState,
    feed,
    cancel,
    reset,
    destroy,
  };
}
