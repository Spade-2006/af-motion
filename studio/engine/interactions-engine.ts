/**
 * AF Motion Studio — Interaction & Gesture Playground Engine (Prompt 136)
 *
 * Provides state factories, preset catalog, bounded event stream management,
 * device capabilities integration, telemetry diagnostics, and code generation.
 */

import { getDeviceCapabilities } from "../../src/core/interactions/device-capabilities.js";
import { defaultPerformanceIntelligence } from "../../src/core/performance-intelligence/index.js";
import type {
  InteractionStudioState,
  InteractionStudioDiagnostics,
  InteractionPreset,
  InteractionEventLogItem,
  InteractivePreviewElement,
} from "../types/interactions.js";

let eventCounter = 0;

export function createDefaultInteractionStudioState(): InteractionStudioState {
  const elements: InteractivePreviewElement[] = [
    {
      id: "elem-drag-card",
      kind: "drag-card",
      title: "Draggable Card",
      x: 40,
      y: 40,
      width: 140,
      height: 100,
      scale: 1,
      rotation: 0,
      isSelected: true,
      style: {
        background: "rgba(59, 130, 246, 0.16)",
        border: "1px solid rgba(59, 130, 246, 0.45)",
        color: "#93c5fd",
        borderRadius: 12,
      },
    },
    {
      id: "elem-action-btn",
      kind: "action-button",
      title: "Interactive Button",
      x: 210,
      y: 40,
      width: 130,
      height: 48,
      scale: 1,
      rotation: 0,
      isSelected: false,
      style: {
        background: "rgba(16, 185, 129, 0.16)",
        border: "1px solid rgba(16, 185, 129, 0.45)",
        color: "#6ee7b7",
        borderRadius: 8,
      },
    },
    {
      id: "elem-resizable-box",
      kind: "resizable-box",
      title: "Pinch & Rotate",
      x: 370,
      y: 30,
      width: 120,
      height: 120,
      scale: 1,
      rotation: 0,
      isSelected: false,
      style: {
        background: "rgba(168, 85, 247, 0.16)",
        border: "1px solid rgba(168, 85, 247, 0.45)",
        color: "#d8b4fe",
        borderRadius: 16,
      },
    },
    {
      id: "elem-magnetic-target",
      kind: "magnetic-target",
      title: "Magnetic Target",
      x: 70,
      y: 180,
      width: 120,
      height: 54,
      scale: 1,
      rotation: 0,
      isSelected: false,
      style: {
        background: "rgba(245, 158, 11, 0.16)",
        border: "1px solid rgba(245, 158, 11, 0.45)",
        color: "#fcd34d",
        borderRadius: 10,
      },
    },
    {
      id: "elem-gesture-pad",
      kind: "gesture-pad",
      title: "Gesture Pad",
      x: 230,
      y: 170,
      width: 160,
      height: 110,
      scale: 1,
      rotation: 0,
      isSelected: false,
      style: {
        background: "rgba(236, 72, 153, 0.16)",
        border: "1px solid rgba(236, 72, 153, 0.45)",
        color: "#f472b6",
        borderRadius: 14,
      },
    },
    {
      id: "elem-nested-zone",
      kind: "nested-zone",
      title: "Nested Zone",
      x: 430,
      y: 180,
      width: 140,
      height: 100,
      scale: 1,
      rotation: 0,
      isSelected: false,
      style: {
        background: "rgba(99, 102, 241, 0.16)",
        border: "1px solid rgba(99, 102, 241, 0.45)",
        color: "#a5b4fc",
        borderRadius: 12,
      },
    },
  ];

  return {
    viewMode: "playground",
    elements,
    selectedElementId: "elem-drag-card",
    pointerDrag: {
      pointerType: "all",
      capturePointer: true,
      axis: "both",
      threshold: 3,
      delayMs: 0,
      directionLock: false,
      boundsEnabled: true,
      bounds: { minX: 0, maxX: 600, minY: 0, maxY: 350 },
      rubberband: true,
      resistance: 0.25,
      gridSnapping: false,
      gridSize: 20,
      snapPointsEnabled: false,
      snapPoints: [
        { x: 100, y: 100 },
        { x: 300, y: 100 },
        { x: 500, y: 100 },
      ],
      momentum: true,
      springBack: false,
      keyboardEnabled: true,
    },
    touchMultitouch: {
      touchAction: "none",
      enablePan: true,
      enablePinch: true,
      enableRotation: true,
      twoFingerPan: true,
      minScale: 0.5,
      maxScale: 3.0,
      minRotation: -180,
      maxRotation: 180,
      panThreshold: 4,
      pinchThreshold: 0.05,
      rotationThreshold: 3,
      simulatedTouchEnabled: false,
      simulatedDistance: 120,
      simulatedAngle: 0,
      simulatedCentroid: { x: 300, y: 180 },
    },
    gestureRecognition: {
      enabledGestures: [
        "tap",
        "double-tap",
        "long-press",
        "drag",
        "pan",
        "swipe",
        "pinch",
        "rotation",
      ],
      minConfidence: 0.65,
      tapMaxDelayMs: 250,
      doubleTapIntervalMs: 300,
      longPressMinDurationMs: 500,
      swipeMinVelocity: 0.4,
      swipeMinDistance: 40,
      edgeThreshold: 24,
      priorityPolicy: "simultaneous",
    },
    gestureSequences: [
      {
        id: "seq-press-drag-release",
        name: "Long Press → Drag → Release",
        stages: [
          { gestureId: "long-press", timeoutMs: 800 },
          { gestureId: "drag", timeoutMs: 2000 },
          { gestureId: "tap", optional: true, timeoutMs: 500 },
        ],
        sequenceTimeoutMs: 3500,
        currentStageIndex: 0,
        matchedStages: [],
        isMatched: false,
        isFailed: false,
      },
      {
        id: "seq-tap-doubletap",
        name: "Tap → Double Tap",
        stages: [
          { gestureId: "tap", timeoutMs: 500 },
          { gestureId: "double-tap", timeoutMs: 600 },
        ],
        sequenceTimeoutMs: 1500,
        currentStageIndex: 0,
        matchedStages: [],
        isMatched: false,
        isFailed: false,
      },
      {
        id: "seq-pinch-rotate",
        name: "Pinch → Rotate",
        stages: [
          { gestureId: "pinch", timeoutMs: 1200 },
          { gestureId: "rotation", timeoutMs: 1200 },
        ],
        sequenceTimeoutMs: 2500,
        currentStageIndex: 0,
        matchedStages: [],
        isMatched: false,
        isFailed: false,
      },
    ],
    activeSequenceIndex: 0,
    cursorMagnetic: {
      cursorMode: "follower",
      smoothing: 0.2,
      lagMs: 16,
      magneticRadius: 140,
      magneticStrength: 0.5,
      magneticAxis: "both",
      magneticMode: "attract",
      magneticFalloff: "smoothstep",
      magneticGroupEnabled: true,
      respectReducedMotion: true,
    },
    eventStream: [
      {
        id: "init-event-1",
        timestamp: Date.now(),
        category: "pointer",
        type: "pointerdown",
        targetId: "elem-drag-card",
        pointerId: 1,
        x: 65,
        y: 65,
        details: "Pointer captured (mouse primary)",
      },
      {
        id: "init-event-2",
        timestamp: Date.now() + 10,
        category: "drag",
        type: "dragstart",
        targetId: "elem-drag-card",
        x: 65,
        y: 65,
        details: "Drag activated beyond 3px threshold",
      },
    ],
    isEventCapturePaused: false,
    eventCategoryFilter: "all",
    selectedEventId: null,
    visualFeedback: {
      showPointers: true,
      showTrajectories: true,
      showDragBounds: true,
      showMagneticRadius: true,
      showCentroid: true,
    },
    showExportModal: false,
  };
}

export function appendInteractionEvent(
  state: InteractionStudioState,
  event: Omit<InteractionEventLogItem, "id" | "timestamp">,
  maxHistory = 100
): InteractionStudioState {
  if (state.isEventCapturePaused) return state;

  eventCounter++;
  const newEvent: InteractionEventLogItem = {
    ...event,
    id: `ev-${Date.now()}-${eventCounter}`,
    timestamp: Date.now(),
  };

  const updatedStream = [newEvent, ...state.eventStream];
  if (updatedStream.length > maxHistory) {
    updatedStream.length = maxHistory;
  }

  return {
    ...state,
    eventStream: updatedStream,
  };
}

export function listAvailableInteractionPresets(): InteractionPreset[] {
  return [
    // Pointer & Drag
    {
      id: "preset-smooth-drag",
      name: "Smooth Drag",
      category: "pointer-drag",
      description: "Low-threshold direct pointer dragging with elastic momentum and spring damping.",
      apply: (state) => ({
        ...state,
        pointerDrag: {
          ...state.pointerDrag,
          threshold: 2,
          delayMs: 0,
          momentum: true,
          springBack: false,
          rubberband: true,
          resistance: 0.15,
        },
      }),
    },
    {
      id: "preset-magnetic-drag",
      name: "Magnetic Drag",
      category: "pointer-drag",
      description: "Draggable element with automatic snapping into predefined magnetic anchors.",
      apply: (state) => ({
        ...state,
        pointerDrag: {
          ...state.pointerDrag,
          threshold: 3,
          snapPointsEnabled: true,
          snapPoints: [
            { x: 80, y: 80 },
            { x: 260, y: 80 },
            { x: 440, y: 80 },
          ],
          springBack: false,
        },
      }),
    },
    {
      id: "preset-constrained-drag",
      name: "Constrained Drag",
      category: "pointer-drag",
      description: "Strict coordinate boundary confinement with elastic edge resistance.",
      apply: (state) => ({
        ...state,
        pointerDrag: {
          ...state.pointerDrag,
          boundsEnabled: true,
          bounds: { minX: 50, maxX: 450, minY: 50, maxY: 250 },
          rubberband: true,
          resistance: 0.4,
          axis: "both",
        },
      }),
    },
    {
      id: "preset-snap-grid",
      name: "Snap-to-Grid",
      category: "pointer-drag",
      description: "Discrete 2D coordinate grid snapping at 24px step intervals.",
      apply: (state) => ({
        ...state,
        pointerDrag: {
          ...state.pointerDrag,
          gridSnapping: true,
          gridSize: 24,
          threshold: 4,
          momentum: false,
        },
      }),
    },
    {
      id: "preset-momentum-drag",
      name: "Momentum Drag",
      category: "pointer-drag",
      description: "Friction-decayed ballistic release conserving launch velocity.",
      apply: (state) => ({
        ...state,
        pointerDrag: {
          ...state.pointerDrag,
          momentum: true,
          resistance: 0.05,
          springBack: false,
        },
      }),
    },
    {
      id: "preset-spring-back-drag",
      name: "Spring-Back Drag",
      category: "pointer-drag",
      description: "Elastic drag that returns to the original origin when released.",
      apply: (state) => ({
        ...state,
        pointerDrag: {
          ...state.pointerDrag,
          springBack: true,
          momentum: false,
          rubberband: true,
        },
      }),
    },

    // Touch & Multitouch
    {
      id: "preset-mobile-pan",
      name: "Mobile Pan",
      category: "touch",
      description: "Single-touch low-latency smooth surface panning with touch-action bypass.",
      apply: (state) => ({
        ...state,
        touchMultitouch: {
          ...state.touchMultitouch,
          touchAction: "none",
          enablePan: true,
          twoFingerPan: false,
          enablePinch: false,
          enableRotation: false,
          panThreshold: 3,
        },
      }),
    },
    {
      id: "preset-pinch-zoom",
      name: "Pinch Zoom",
      category: "touch",
      description: "Dual-touch distance tracking mapped directly to logarithmic scale limits [0.5, 3.0].",
      apply: (state) => ({
        ...state,
        touchMultitouch: {
          ...state.touchMultitouch,
          enablePinch: true,
          minScale: 0.5,
          maxScale: 3.0,
          pinchThreshold: 0.04,
        },
      }),
    },
    {
      id: "preset-touch-rotation",
      name: "Rotation",
      category: "touch",
      description: "Two-finger centroid angular delta tracking bounded to [-180°, 180°].",
      apply: (state) => ({
        ...state,
        touchMultitouch: {
          ...state.touchMultitouch,
          enableRotation: true,
          minRotation: -180,
          maxRotation: 180,
          rotationThreshold: 3,
        },
      }),
    },
    {
      id: "preset-two-finger-all",
      name: "Two-Finger Interaction",
      category: "touch",
      description: "Simultaneous 2D affine transformation: pan translation, pinch zoom, and rotation.",
      apply: (state) => ({
        ...state,
        touchMultitouch: {
          ...state.touchMultitouch,
          enablePan: true,
          enablePinch: true,
          enableRotation: true,
          twoFingerPan: true,
        },
      }),
    },

    // Gestures
    {
      id: "preset-swipe-navigation",
      name: "Swipe Navigation",
      category: "gestures",
      description: "High-velocity directional swipe detection optimized for carousels and edge drawers.",
      apply: (state) => ({
        ...state,
        gestureRecognition: {
          ...state.gestureRecognition,
          swipeMinVelocity: 0.45,
          swipeMinDistance: 50,
          edgeThreshold: 30,
          priorityPolicy: "exclusive",
        },
      }),
    },
    {
      id: "preset-long-press-menu",
      name: "Long Press Menu",
      category: "gestures",
      description: "Temporal hold recognizer (500ms) with tight 8px movement suppression.",
      apply: (state) => ({
        ...state,
        gestureRecognition: {
          ...state.gestureRecognition,
          longPressMinDurationMs: 500,
          minConfidence: 0.8,
        },
      }),
    },
    {
      id: "preset-double-tap",
      name: "Double Tap",
      category: "gestures",
      description: "Quick consecutive tap classifier with 280ms threshold for zoom toggles.",
      apply: (state) => ({
        ...state,
        gestureRecognition: {
          ...state.gestureRecognition,
          tapMaxDelayMs: 200,
          doubleTapIntervalMs: 280,
          minConfidence: 0.75,
        },
      }),
    },
    {
      id: "preset-gesture-sequence",
      name: "Gesture Sequence",
      category: "gestures",
      description: "Multi-stage sequential pipeline requiring Long Press followed by Drag.",
      apply: (state) => ({
        ...state,
        activeSequenceIndex: 0,
      }),
    },

    // Cursor & Magnetic
    {
      id: "preset-magnetic-button",
      name: "Magnetic Button",
      category: "cursor-magnetic",
      description: "Smooth pull attraction toward interactive CTA button within 120px radius.",
      apply: (state) => ({
        ...state,
        cursorMagnetic: {
          ...state.cursorMagnetic,
          magneticRadius: 120,
          magneticStrength: 0.6,
          magneticMode: "attract",
          magneticFalloff: "smoothstep",
        },
      }),
    },
    {
      id: "preset-magnetic-card",
      name: "Magnetic Card",
      category: "cursor-magnetic",
      description: "Subtle card attraction (0.35 strength) with exponential falloff and 160px reach.",
      apply: (state) => ({
        ...state,
        cursorMagnetic: {
          ...state.cursorMagnetic,
          magneticRadius: 160,
          magneticStrength: 0.35,
          magneticMode: "attract",
          magneticFalloff: "exponential",
        },
      }),
    },
    {
      id: "preset-cursor-follower",
      name: "Cursor Follower",
      category: "cursor-magnetic",
      description: "Low-latency fluid trailing follower with sub-frame interpolation and 20ms lag.",
      apply: (state) => ({
        ...state,
        cursorMagnetic: {
          ...state.cursorMagnetic,
          cursorMode: "follower",
          smoothing: 0.15,
          lagMs: 20,
        },
      }),
    },
    {
      id: "preset-magnetic-group",
      name: "Magnetic Group",
      category: "cursor-magnetic",
      description: "Shared magnetic field coordinating multiple target elements seamlessly.",
      apply: (state) => ({
        ...state,
        cursorMagnetic: {
          ...state.cursorMagnetic,
          magneticGroupEnabled: true,
          magneticStrength: 0.5,
          magneticRadius: 150,
        },
      }),
    },
  ];
}

export function loadInteractionPreset(
  presetId: string,
  state: InteractionStudioState
): InteractionStudioState {
  const presets = listAvailableInteractionPresets();
  const found = presets.find((p) => p.id === presetId);
  if (!found) return state;
  return found.apply(state);
}

export function getInteractionDiagnostics(
  state: InteractionStudioState
): InteractionStudioDiagnostics {
  const caps = getDeviceCapabilities();
  const health = defaultPerformanceIntelligence.health;
  const context = defaultPerformanceIntelligence.context;

  return {
    fps: context?.fps ?? 60,
    eventProcessingDurationMs: 0.45,
    activePointers: state.eventStream.filter(
      (e) => e.category === "pointer" && e.type === "pointerdown"
    ).length > 0 ? 1 : 0,
    activeGestures: state.gestureRecognition.enabledGestures.length,
    activeControllers: 4, // pointer, drag, touch, magnetic
    eventHistorySize: state.eventStream.length,
    devicePrimaryInput: caps.primaryInput,
    hardwareTouchPoints: caps.maxTouchPoints,
    isSimulatingTouch: state.touchMultitouch.simulatedTouchEnabled,
    healthScore: Math.round(health.overallHealth.score),
    healthStatus: health.overallHealth.status,
  };
}

export function generateInteractionExportBundle(state: InteractionStudioState) {
  const { pointerDrag, touchMultitouch, gestureRecognition, cursorMagnetic } = state;

  const reactHookCode = `import React, { useRef } from "react";
import {
  useDrag,
  usePointer,
  useTouch,
  useMultiTouch,
  useGesture,
  useMagnetic,
} from "af-motion/react";

export function InteractiveDemo() {
  const dragRef = useRef<HTMLDivElement>(null);
  const magneticRef = useRef<HTMLButtonElement>(null);

  // Advanced Drag configuration
  const drag = useDrag(dragRef, {
    axis: "${pointerDrag.axis}",
    threshold: ${pointerDrag.threshold},
    momentum: ${pointerDrag.momentum},
    springBack: ${pointerDrag.springBack},
    elastic: ${pointerDrag.rubberband ? pointerDrag.resistance : false},
    grid: ${pointerDrag.gridSnapping ? pointerDrag.gridSize : "undefined"},
    bounds: ${
      pointerDrag.boundsEnabled
        ? `{ minX: ${pointerDrag.bounds.minX}, maxX: ${pointerDrag.bounds.maxX}, minY: ${pointerDrag.bounds.minY}, maxY: ${pointerDrag.bounds.maxY} }`
        : "undefined"
    },
    keyboardEnabled: ${pointerDrag.keyboardEnabled},
  });

  // Magnetic CTA button
  const magnetic = useMagnetic(magneticRef, {
    radius: ${cursorMagnetic.magneticRadius},
    strength: ${cursorMagnetic.magneticStrength},
    mode: "${cursorMagnetic.magneticMode}",
    falloff: "${cursorMagnetic.magneticFalloff}",
    respectReducedMotion: ${cursorMagnetic.respectReducedMotion},
  });

  return (
    <div className="relative w-full h-[400px] overflow-hidden bg-slate-900">
      <div
        ref={dragRef}
        className="w-36 h-28 bg-blue-500/20 border border-blue-400 rounded-xl cursor-grab"
      >
        <span>Drag Me</span>
      </div>

      <button
        ref={magneticRef}
        className="mt-6 px-5 py-2.5 bg-emerald-500/20 border border-emerald-400 rounded-lg text-emerald-300"
      >
        Magnetic Action
      </button>
    </div>
  );
}`;

  const reactComponentCode = `import React from "react";
import { Draggable, Magnetic, GestureArea } from "af-motion/react";

export function DeclarativeInteractionDemo() {
  return (
    <div className="interaction-canvas">
      {/* Declarative Draggable Card */}
      <Draggable
        axis="${pointerDrag.axis}"
        threshold={${pointerDrag.threshold}}
        momentum={${pointerDrag.momentum}}
        springBack={${pointerDrag.springBack}}
        className="drag-card"
      >
        <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
          <h3>Draggable Element</h3>
        </div>
      </Draggable>

      {/* Magnetic Attraction Target */}
      <Magnetic
        radius={${cursorMagnetic.magneticRadius}}
        strength={${cursorMagnetic.magneticStrength}}
        mode="${cursorMagnetic.magneticMode}"
      >
        <button className="magnetic-button">Attracted CTA</button>
      </Magnetic>

      {/* Gesture Recognition Region */}
      <GestureArea
        tap
        swipe
        pinch
        onSwipe={(e) => console.log("Swiped direction:", e.direction)}
        className="gesture-zone"
      >
        <span>Swipe or Tap Here</span>
      </GestureArea>
    </div>
  );
}`;

  const vanillaCode = `import {
  createDragController,
  createPointerController,
  createMultiTouchController,
  createMagneticController,
  createGestureClassifier,
} from "af-motion";

// 1. Initialize Drag Controller on Target DOM Element
const dragTarget = document.querySelector("#drag-card");
const dragController = createDragController(dragTarget, {
  axis: "${pointerDrag.axis}",
  threshold: ${pointerDrag.threshold},
  momentum: ${pointerDrag.momentum},
  springBack: ${pointerDrag.springBack},
  elastic: ${pointerDrag.rubberband ? pointerDrag.resistance : false},
  grid: ${pointerDrag.gridSnapping ? pointerDrag.gridSize : "undefined"},
  bounds: ${
    pointerDrag.boundsEnabled
      ? `{ minX: ${pointerDrag.bounds.minX}, maxX: ${pointerDrag.bounds.maxX}, minY: ${pointerDrag.bounds.minY}, maxY: ${pointerDrag.bounds.maxY} }`
      : "undefined"
  },
  onDragStart: (state) => console.log("Drag began at:", state.position),
  onDragEnd: (state) => console.log("Drag settled at:", state.position),
});

// 2. Initialize Magnetic Force Controller
const magneticTarget = document.querySelector("#magnetic-btn");
const magneticController = createMagneticController(magneticTarget, {
  radius: ${cursorMagnetic.magneticRadius},
  strength: ${cursorMagnetic.magneticStrength},
  mode: "${cursorMagnetic.magneticMode}",
  falloff: "${cursorMagnetic.magneticFalloff}",
  respectReducedMotion: ${cursorMagnetic.respectReducedMotion},
});

// Clean up resources on unmount
function cleanup() {
  dragController.destroy();
  magneticController.destroy();
}`;

  const gestureClassifierCode = `import {
  createGestureClassifier,
  createGestureSequenceEngine,
} from "af-motion";

// Deterministic Gesture Classifier Configuration
const classifier = createGestureClassifier({
  minConfidence: ${gestureRecognition.minConfidence},
  edgeThreshold: ${gestureRecognition.edgeThreshold},
});

// Gesture Sequence Pipeline (${state.gestureSequences[state.activeSequenceIndex]?.name || "Sequence"})
const sequenceEngine = createGestureSequenceEngine({
  id: "${state.gestureSequences[state.activeSequenceIndex]?.id || "seq-1"}",
  name: "${state.gestureSequences[state.activeSequenceIndex]?.name || "Custom Sequence"}",
  stages: ${JSON.stringify(state.gestureSequences[state.activeSequenceIndex]?.stages || [], null, 2)},
  sequenceTimeoutMs: ${state.gestureSequences[state.activeSequenceIndex]?.sequenceTimeoutMs || 3000},
  onStageCompleted: (stage, idx) => console.log(\`Stage \${idx} complete: \${stage.gestureId}\`),
  onSequenceCompleted: (results) => console.log("All sequence stages completed successfully!", results),
  onSequenceFailed: (reason, idx) => console.warn(\`Sequence failed at stage \${idx}: \${reason}\`),
});`;

  const jsonSchema = JSON.stringify(
    {
      version: "1.0.0",
      pointerDrag,
      touchMultitouch,
      gestureRecognition,
      cursorMagnetic,
    },
    null,
    2
  );

  return {
    reactHookCode,
    reactComponentCode,
    vanillaCode,
    gestureClassifierCode,
    jsonSchema,
  };
}
