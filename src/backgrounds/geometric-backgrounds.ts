import { resolveTargets } from "../core/animate.js";
import type { AnimateTarget } from "../core/animate.js";
import {
  acquireBackgroundTarget as acquireTarget,
  createMotionFrameScheduler,
  releaseBackgroundCanvas,
  releaseBackgroundTarget as releaseTarget,
  resolveBackgroundColors as resolveColors,
  resizeCanvasToElement as setCanvasSize,
  subscribeToActiveBackgroundPalette,
  validateBackgroundColors as validateColors,
} from "./internal/canvas-lifecycle.js";

export type GeometricBackgroundEffect =
  | "grid"
  | "tech-circuit"
  | "polygon-mesh"
  | "hexagon-field"
  | "perspective-floor";
export type GeometricGridShape = "square" | "dot" | "diamond" | "hexagon";

export interface GeometricBackgroundBaseOptions {
  /** Visual treatment. Defaults to "grid". */
  effect?: GeometricBackgroundEffect;
  /** CSS colors for the geometry, or palette primary/secondary/accent colors. */
  colors?: readonly string[];
  /** Registered built-in/custom palette name, or "active" to follow active palette changes. */
  palette?: string;
  /** Animation speed multiplier. Set to 0 for a static scene. Defaults to 1. */
  speed?: number;
  /** Overall intensity from 0 to 1. Defaults to 0.65. */
  intensity?: number;
}

export interface GeometricGridOptions extends GeometricBackgroundBaseOptions {
  effect?: "grid";
  /** Grid geometry. Defaults to "square". */
  shape?: GeometricGridShape;
  /** Distance between grid points/lines in CSS pixels. Defaults to 48. */
  spacing?: number;
  /** Grid line width or dot radius in CSS pixels. Defaults to 1. */
  lineWeight?: number;
  /** Layer opacity from 0 to 1. Defaults to 0.35. */
  opacity?: number;
  /** Perspective strength from 0 (flat) to 1 (strong convergence). Defaults to 0. */
  perspective?: number;
}

export interface TechCircuitOptions extends GeometricBackgroundBaseOptions {
  effect: "tech-circuit";
  /** Circuit trace spacing in CSS pixels. Defaults to 72. */
  spacing?: number;
  /** Relative path/node density from 0.1 to 3. Defaults to 1. */
  density?: number;
  /** Circuit stroke width in CSS pixels. Defaults to 1.25. */
  lineWeight?: number;
}

export interface PolygonMeshOptions extends GeometricBackgroundBaseOptions {
  effect: "polygon-mesh";
  /** Approximate distance between mesh vertices in CSS pixels. Defaults to 96. */
  spacing?: number;
  /** Vertex displacement from the regular lattice, from 0 to 1. Defaults to 0.2. */
  irregularity?: number;
  /** Maximum mesh-link distance in multiples of spacing. Defaults to 1.55. */
  connectionRange?: number;
  /** Mesh stroke width in CSS pixels. Defaults to 1. */
  lineWeight?: number;
}

export interface HexagonFieldOptions extends GeometricBackgroundBaseOptions {
  effect: "hexagon-field";
  /** Horizontal distance between hexagon centers in CSS pixels. Defaults to 56. */
  spacing?: number;
  /** Hexagon stroke width in CSS pixels. Defaults to 1. */
  lineWeight?: number;
  /** Whether the pattern has subtle continuous movement. Defaults to false. */
  animate?: boolean;
}

export interface PerspectiveFloorOptions extends GeometricBackgroundBaseOptions {
  effect: "perspective-floor";
  /** Floor grid spacing in CSS pixels. Defaults to 48. */
  spacing?: number;
  /** Vertical location of the horizon from 0 (top) to 0.9 (near bottom). Defaults to 0.38. */
  horizon?: number;
  /** Animated floor movement multiplier from 0 to 5. Defaults to 1. */
  movement?: number;
  /** Perspective grid line width in CSS pixels. Defaults to 1. */
  lineWeight?: number;
}

export type GeometricBackgroundOptions =
  | GeometricGridOptions
  | TechCircuitOptions
  | PolygonMeshOptions
  | HexagonFieldOptions
  | PerspectiveFloorOptions
  | GeometricBackgroundBaseOptions;

export interface GeometricBackgroundControls {
  /** Stops animation, removes the canvas, and restores target styles. Safe to repeat. */
  destroy(): void;
}

interface Point {
  x: number;
  y: number;
}

interface GeometryState {
  readonly element: HTMLElement;
  readonly canvas: HTMLCanvasElement;
  readonly context: CanvasRenderingContext2D;
  width: number;
  height: number;
  phase: number;
  meshPoints: Point[];
  meshColumns: number;
  meshRows: number;
}

const DEFAULT_COLORS = ["#7c3aed", "#06b6d4", "#ec4899"] as const;
const DEFAULT_SPEED = 1;
const DEFAULT_INTENSITY = 0.65;
const MAX_GRID_LINES = 160;
const MAX_MESH_POINTS = 1600;

function assertFinite(
  name: string,
  value: number,
  minimum: number,
  maximum = Number.POSITIVE_INFINITY,
): void {
  if (typeof value !== "number" || !Number.isFinite(value) || value < minimum || value > maximum) {
    const range = maximum === Number.POSITIVE_INFINITY
      ? `>= ${minimum}`
      : `between ${minimum} and ${maximum}`;
    throw new RangeError(`${name} must be a finite number ${range}, received ${String(value)}`);
  }
}

function setStroke(
  context: CanvasRenderingContext2D,
  color: string,
  lineWeight: number,
  intensity: number,
): void {
  context.strokeStyle = color;
  context.lineWidth = lineWeight;
  context.globalAlpha = intensity;
}

function drawHexagon(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
): void {
  context.beginPath();
  for (let side = 0; side < 6; side++) {
    const angle = (Math.PI / 3) * side;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (side === 0) context.moveTo(px, py);
    else context.lineTo(px, py);
  }
  context.closePath();
  context.stroke();
}

function drawGrid(
  state: GeometryState,
  color: string,
  shape: GeometricGridShape,
  spacing: number,
  lineWeight: number,
  opacity: number,
  perspective: number,
): void {
  const { context, width, height } = state;
  setStroke(context, color, lineWeight, opacity);
  const gridSpacing = Math.max(spacing, width / MAX_GRID_LINES, height / MAX_GRID_LINES);
  const columns = Math.min(MAX_GRID_LINES, Math.ceil(width / gridSpacing) + 1);
  const rows = Math.min(MAX_GRID_LINES, Math.ceil(height / gridSpacing) + 1);
  if (perspective > 0) {
    const horizon = height * (0.12 + (1 - perspective) * 0.35);
    for (let index = 0; index <= columns; index++) {
      const bottomX = index * gridSpacing;
      const centerOffset = (bottomX - width / 2) * perspective * 0.72;
      context.beginPath();
      context.moveTo(width / 2 + centerOffset * 0.05, horizon);
      context.lineTo(bottomX, height);
      context.stroke();
    }
    for (let index = 1; index <= rows; index++) {
      const progress = index / rows;
      const y = horizon + (height - horizon) * progress * progress;
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y);
      context.stroke();
    }
    context.globalAlpha = 1;
    return;
  }

  if (shape === "square") {
    for (let x = 0; x <= width; x += gridSpacing) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, height);
      context.stroke();
    }
    for (let y = 0; y <= height; y += gridSpacing) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y);
      context.stroke();
    }
  } else if (shape === "dot") {
    context.fillStyle = color;
    for (let y = 0; y <= height; y += gridSpacing) {
      for (let x = 0; x <= width; x += gridSpacing) {
        context.beginPath();
        context.arc(x, y, lineWeight, 0, Math.PI * 2);
        context.fill();
      }
    }
  } else if (shape === "diamond") {
    for (let y = 0; y <= height; y += spacing) {
      for (let x = 0; x <= width; x += spacing) {
        context.beginPath();
        context.moveTo(x, y - gridSpacing / 2);
        context.lineTo(x + gridSpacing / 2, y);
        context.lineTo(x, y + gridSpacing / 2);
        context.lineTo(x - gridSpacing / 2, y);
        context.closePath();
        context.stroke();
      }
    }
  } else {
    const radius = gridSpacing / Math.sqrt(3);
    const horizontal = gridSpacing;
    const vertical = radius * 1.5;
    for (let row = 0; row <= MAX_GRID_LINES && row * vertical <= height + radius; row++) {
      let columnCount = 0;
      for (let x = (row % 2) * horizontal / 2; x <= width + horizontal && columnCount < MAX_GRID_LINES; x += horizontal, columnCount++) {
        drawHexagon(context, x, row * vertical, radius);
      }
    }
  }
  context.globalAlpha = 1;
}

function drawCircuit(
  state: GeometryState,
  colors: readonly string[],
  spacing: number,
  density: number,
  lineWeight: number,
  intensity: number,
  phase: number,
): void {
  const { context, width, height } = state;
  const columns = Math.min(42, Math.ceil(width / spacing));
  const rows = Math.min(28, Math.ceil(height / spacing));
  const stride = Math.max(1, Math.round(3 / density));
  for (let row = 0; row <= rows; row++) {
    for (let column = (row % 2) * stride; column <= columns; column += stride) {
      const x = column * spacing;
      const y = row * spacing;
      const horizontal = Math.min(width, x + spacing * (0.5 + ((row + column) % 2) * 0.5));
      const vertical = Math.min(height, y + spacing * (0.45 + ((row + column) % 3) * 0.15));
      const color = colors[(row + column) % colors.length] ?? colors[0] ?? "#fff";
      context.globalAlpha = intensity * (0.55 + Math.sin(phase + row * 0.7 + column * 0.45) * 0.25);
      context.strokeStyle = color;
      context.lineWidth = lineWeight;
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(horizontal, y);
      context.lineTo(horizontal, vertical);
      context.stroke();

      context.globalAlpha = intensity * (0.55 + Math.sin(phase + row * 0.7 + column * 0.45) * 0.25);
      context.fillStyle = color;
      context.shadowColor = color;
      context.shadowBlur = 7;
      context.beginPath();
      context.arc(horizontal, vertical, lineWeight * 1.6, 0, Math.PI * 2);
      context.fill();
      context.shadowBlur = 0;
    }
  }
  context.globalAlpha = 1;
}

function resetMeshPoints(state: GeometryState, spacing: number, irregularity: number): void {
  state.meshColumns = Math.max(1, Math.ceil(state.width / spacing));
  state.meshRows = Math.max(1, Math.ceil(state.height / spacing));
  const total = Math.min(MAX_MESH_POINTS, (state.meshColumns + 1) * (state.meshRows + 1));
  const scale = total < (state.meshColumns + 1) * (state.meshRows + 1)
    ? Math.sqrt(total / ((state.meshColumns + 1) * (state.meshRows + 1)))
    : 1;
  state.meshColumns = Math.max(1, Math.floor(state.meshColumns * scale));
  state.meshRows = Math.max(1, Math.floor(state.meshRows * scale));
  state.meshPoints = [];
  for (let row = 0; row <= state.meshRows; row++) {
    for (let column = 0; column <= state.meshColumns; column++) {
      const jitterX = ((row * 17 + column * 31) % 9 - 4) * irregularity * spacing * 0.045;
      const jitterY = ((row * 29 + column * 13) % 9 - 4) * irregularity * spacing * 0.045;
      state.meshPoints.push({
        x: (column / state.meshColumns) * state.width + jitterX,
        y: (row / state.meshRows) * state.height + jitterY,
      });
    }
  }
}

function drawMesh(
  state: GeometryState,
  color: string,
  spacing: number,
  irregularity: number,
  connectionRange: number,
  lineWeight: number,
  intensity: number,
): void {
  if (state.meshPoints.length === 0) resetMeshPoints(state, spacing, irregularity);
  const { context, meshPoints, meshColumns, meshRows, width, height } = state;
  const threshold = spacing * connectionRange;
  setStroke(context, color, lineWeight, intensity);
  for (let row = 0; row <= meshRows; row++) {
    for (let column = 0; column <= meshColumns; column++) {
      const point = meshPoints[row * (meshColumns + 1) + column];
      if (!point) continue;
      if (column < meshColumns) {
        const right = meshPoints[row * (meshColumns + 1) + column + 1];
        if (right && Math.hypot(right.x - point.x, right.y - point.y) <= threshold) {
          context.beginPath();
          context.moveTo(point.x, point.y);
          context.lineTo(right.x, right.y);
          context.stroke();
        }
      }
      if (row < meshRows) {
        const below = meshPoints[(row + 1) * (meshColumns + 1) + column];
        if (below && Math.hypot(below.x - point.x, below.y - point.y) <= threshold) {
          context.beginPath();
          context.moveTo(point.x, point.y);
          context.lineTo(below.x, below.y);
          context.stroke();
        }
      }
      if (row < meshRows && column < meshColumns && (row + column) % 2 === 0) {
        const diagonal = meshPoints[(row + 1) * (meshColumns + 1) + column + 1];
        if (diagonal && Math.hypot(diagonal.x - point.x, diagonal.y - point.y) <= threshold) {
          context.beginPath();
          context.moveTo(point.x, point.y);
          context.lineTo(diagonal.x, diagonal.y);
          context.stroke();
        }
      }
      context.fillStyle = color;
      context.globalAlpha = intensity * 0.85;
      context.beginPath();
      context.arc(Math.max(0, Math.min(width, point.x)), Math.max(0, Math.min(height, point.y)), lineWeight * 1.15, 0, Math.PI * 2);
      context.fill();
    }
  }
  context.globalAlpha = 1;
}

function drawHexField(
  state: GeometryState,
  color: string,
  spacing: number,
  lineWeight: number,
  intensity: number,
  phase: number,
): void {
  const { context, width, height } = state;
  const radius = spacing / Math.sqrt(3);
  const horizontal = spacing;
  const vertical = radius * 1.5;
  const offset = Math.sin(phase) * Math.min(spacing * 0.035, 2);
  setStroke(context, color, lineWeight, intensity);
  for (let row = -1; row <= MAX_GRID_LINES && row * vertical <= height + radius; row++) {
    let columnCount = 0;
    for (let x = (row % 2) * horizontal / 2 - horizontal; x <= width + horizontal && columnCount < MAX_GRID_LINES; x += horizontal, columnCount++) {
      drawHexagon(context, x + offset, row * vertical, radius);
    }
  }
  context.globalAlpha = 1;
}

function drawPerspectiveFloor(
  state: GeometryState,
  color: string,
  spacing: number,
  horizon: number,
  lineWeight: number,
  intensity: number,
  phase: number,
  movement: number,
): void {
  const { context, width, height } = state;
  const horizonY = height * horizon;
  setStroke(context, color, lineWeight, intensity);
  for (let index = -8; index <= 8; index++) {
    context.beginPath();
    context.moveTo(width / 2 + index * spacing * 0.08, horizonY);
    context.lineTo(width / 2 + index * spacing * 1.8, height);
    context.stroke();
  }
  const rowCount = Math.min(42, Math.ceil(height / spacing) + 8);
  const offset = movement > 0 ? (phase * movement * spacing) % spacing : 0;
  for (let row = 0; row < rowCount; row++) {
    const progress = ((row + offset / spacing) / rowCount);
    const y = horizonY + (height - horizonY) * progress * progress;
    if (y < horizonY || y > height) continue;
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }
  context.globalAlpha = 1;
}

function render(state: GeometryState, effect: GeometricBackgroundEffect, colors: readonly string[], options: GeometricBackgroundBaseOptions): void {
  const { context } = state;
  context.clearRect(0, 0, state.width, state.height);
  const color = colors[0] ?? "#fff";
  const intensity = options.intensity ?? DEFAULT_INTENSITY;
  if (effect === "grid") {
    const gridOptions = options as GeometricGridOptions;
    drawGrid(
      state,
      color,
      gridOptions.shape ?? "square",
      gridOptions.spacing ?? 48,
      gridOptions.lineWeight ?? 1,
      (gridOptions.opacity ?? 0.35) * intensity,
      gridOptions.perspective ?? 0,
    );
  } else if (effect === "tech-circuit") {
    const circuitOptions = options as TechCircuitOptions;
    drawCircuit(
      state,
      colors,
      circuitOptions.spacing ?? 72,
      circuitOptions.density ?? 1,
      circuitOptions.lineWeight ?? 1.25,
      intensity,
      state.phase,
    );
  } else if (effect === "polygon-mesh") {
    const meshOptions = options as PolygonMeshOptions;
    drawMesh(
      state,
      color,
      meshOptions.spacing ?? 96,
      meshOptions.irregularity ?? 0.2,
      meshOptions.connectionRange ?? 1.55,
      meshOptions.lineWeight ?? 1,
      intensity,
    );
  } else if (effect === "hexagon-field") {
    const hexOptions = options as HexagonFieldOptions;
    drawHexField(
      state,
      color,
      hexOptions.spacing ?? 56,
      hexOptions.lineWeight ?? 1,
      intensity,
      state.phase,
    );
  } else {
    const floorOptions = options as PerspectiveFloorOptions;
    drawPerspectiveFloor(
      state,
      color,
      floorOptions.spacing ?? 48,
      floorOptions.horizon ?? 0.38,
      floorOptions.lineWeight ?? 1,
      intensity,
      state.phase,
      floorOptions.movement ?? 1,
    );
  }
  context.globalAlpha = 1;
}

function validateOptions(options: GeometricBackgroundOptions, effect: GeometricBackgroundEffect): void {
  const speed = options.speed ?? DEFAULT_SPEED;
  const intensity = options.intensity ?? DEFAULT_INTENSITY;
  assertFinite("speed", speed, 0);
  assertFinite("intensity", intensity, 0, 1);
  if (effect === "grid") {
    const grid = options as GeometricGridOptions;
    assertFinite("spacing", grid.spacing ?? 48, Number.MIN_VALUE);
    assertFinite("lineWeight", grid.lineWeight ?? 1, Number.MIN_VALUE);
    assertFinite("opacity", grid.opacity ?? 0.35, 0, 1);
    assertFinite("perspective", grid.perspective ?? 0, 0, 1);
    if (grid.shape !== undefined && !["square", "dot", "diamond", "hexagon"].includes(grid.shape)) {
      throw new TypeError(`Unknown geometric grid shape "${String(grid.shape)}"`);
    }
  } else if (effect === "tech-circuit") {
    const circuit = options as TechCircuitOptions;
    assertFinite("spacing", circuit.spacing ?? 72, Number.MIN_VALUE);
    assertFinite("density", circuit.density ?? 1, 0.1, 3);
    assertFinite("lineWeight", circuit.lineWeight ?? 1.25, Number.MIN_VALUE);
  } else if (effect === "polygon-mesh") {
    const mesh = options as PolygonMeshOptions;
    assertFinite("spacing", mesh.spacing ?? 96, Number.MIN_VALUE);
    assertFinite("irregularity", mesh.irregularity ?? 0.2, 0, 1);
    assertFinite("connectionRange", mesh.connectionRange ?? 1.55, 1, 3);
    assertFinite("lineWeight", mesh.lineWeight ?? 1, Number.MIN_VALUE);
  } else if (effect === "hexagon-field") {
    const hex = options as HexagonFieldOptions;
    assertFinite("spacing", hex.spacing ?? 56, Number.MIN_VALUE);
    assertFinite("lineWeight", hex.lineWeight ?? 1, Number.MIN_VALUE);
    if (hex.animate !== undefined && typeof hex.animate !== "boolean") {
      throw new TypeError(`animate must be a boolean, received ${String(hex.animate)}`);
    }
  } else {
    const floor = options as PerspectiveFloorOptions;
    assertFinite("spacing", floor.spacing ?? 48, Number.MIN_VALUE);
    assertFinite("horizon", floor.horizon ?? 0.38, 0, 0.9);
    assertFinite("movement", floor.movement ?? 1, 0, 5);
    assertFinite("lineWeight", floor.lineWeight ?? 1, Number.MIN_VALUE);
  }
}

/**
 * Renders one of five Canvas geometric backgrounds with shared responsive,
 * reduced-motion-aware, palette-aware lifecycle management.
 */
export function geometricBackground(
  target: AnimateTarget,
  options: GeometricBackgroundOptions = {},
): GeometricBackgroundControls {
  const effect = options.effect ?? "grid";
  if (!["grid", "tech-circuit", "polygon-mesh", "hexagon-field", "perspective-floor"].includes(effect)) {
    throw new TypeError(`Unknown geometric background effect "${String(effect)}"`);
  }
  validateOptions(options, effect);
  const configuredColors = options.colors ?? DEFAULT_COLORS;
  validateColors(configuredColors);
  let currentColors = resolveColors(options.palette, configuredColors);
  validateColors(currentColors);
  const elements = resolveTargets(target);
  if (elements.length === 0) return { destroy: () => undefined };
  if (typeof document === "undefined" || typeof document.createElement !== "function") {
    throw new Error("geometricBackground() requires document.createElement");
  }
  const speed = options.speed ?? DEFAULT_SPEED;
  const requestedAnimation = speed > 0 && (
    effect === "tech-circuit" ||
    (effect === "perspective-floor" && ((options as PerspectiveFloorOptions).movement ?? 1) > 0) ||
    (effect === "hexagon-field" && (options as HexagonFieldOptions).animate === true)
  );

  const states: GeometryState[] = [];
  try {
    for (const element of elements) {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) throw new Error("geometricBackground() requires a canvas with a 2D rendering context");
      canvas.setAttribute("aria-hidden", "true");
      canvas.style.setProperty("position", "absolute");
      canvas.style.setProperty("inset", "0");
      canvas.style.setProperty("width", "100%");
      canvas.style.setProperty("height", "100%");
      canvas.style.setProperty("display", "block");
      canvas.style.setProperty("z-index", "-1");
      canvas.style.setProperty("pointer-events", "none");
      const rect = element.getBoundingClientRect();
      const state: GeometryState = {
        element,
        canvas,
        context,
        width: 0,
        height: 0,
        phase: 0,
        meshPoints: [],
        meshColumns: 0,
        meshRows: 0,
      };
      setCanvasSize(state, rect.width, rect.height);
      states.push(state);
    }
  } catch (error) {
    for (const state of states) {
      state.canvas.parentElement?.removeChild(state.canvas);
      releaseBackgroundCanvas(state.canvas);
    }
    throw error;
  }

  let destroyed = false;
  const drawScene = (state: GeometryState): void => render(state, effect, currentColors, options);
  const scheduler = createMotionFrameScheduler<GeometryState>({
    speed,
    animated: requestedAnimation,
    errorName: "geometricBackground()",
    renderStatic: () => states.forEach(drawScene),
    update: (state, elapsed) => {
      state.phase += elapsed;
      drawScene(state);
    },
  });

  let intersectionObserver: IntersectionObserver | undefined;
  let resizeObserver: ResizeObserver | undefined;
  try {
    if (typeof IntersectionObserver === "function") {
      intersectionObserver = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          const state = states.find((candidate) => candidate.element === entry.target);
          if (state) scheduler.setVisible(state, entry.isIntersecting);
        }
      });
    } else {
      for (const state of states) scheduler.setVisible(state, true);
    }
    if (typeof ResizeObserver === "function") {
      resizeObserver = new ResizeObserver((entries) => {
        if (destroyed) return;
        for (const entry of entries) {
          const state = states.find((candidate) => candidate.element === entry.target);
          if (!state) continue;
          setCanvasSize(state, entry.contentRect.width, entry.contentRect.height);
          state.meshPoints = [];
          drawScene(state);
        }
      });
    }
  } catch (error) {
    scheduler.destroy();
    intersectionObserver?.disconnect();
    resizeObserver?.disconnect();
    throw error;
  }
  const onWindowResize = (): void => {
    if (destroyed) return;
    for (const state of states) {
      const rect = state.element.getBoundingClientRect();
      setCanvasSize(state, rect.width, rect.height);
      state.meshPoints = [];
      drawScene(state);
    }
  };
  const hasWindowResize = !resizeObserver && typeof window !== "undefined";
  if (hasWindowResize) window.addEventListener("resize", onWindowResize);
  const acquired: HTMLElement[] = [];
  const inserted: GeometryState[] = [];
  try {
    for (const state of states) {
      acquireTarget(state.element);
      acquired.push(state.element);
      state.element.insertBefore(state.canvas, state.element.firstChild);
      inserted.push(state);
      intersectionObserver?.observe(state.element);
      resizeObserver?.observe(state.element);
      drawScene(state);
    }
  } catch (error) {
    scheduler.destroy();
    intersectionObserver?.disconnect();
    resizeObserver?.disconnect();
    if (hasWindowResize) window.removeEventListener("resize", onWindowResize);
    for (const state of inserted) {
      if (state.canvas.parentElement === state.element) state.element.removeChild(state.canvas);
    }
    for (const element of acquired) releaseTarget(element);
    throw error;
  }

  const stopPaletteListener = subscribeToActiveBackgroundPalette(options.palette, configuredColors, (colors) => {
    if (destroyed) return;
    currentColors = colors;
    validateColors(currentColors);
    for (const state of states) drawScene(state);
  });

  return {
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      scheduler.destroy();
      stopPaletteListener();
      intersectionObserver?.disconnect();
      resizeObserver?.disconnect();
      if (hasWindowResize) window.removeEventListener("resize", onWindowResize);
      for (const state of states) {
        if (state.canvas.parentElement === state.element) state.element.removeChild(state.canvas);
        releaseBackgroundCanvas(state.canvas);
        releaseTarget(state.element);
      }
    },
  };
}
