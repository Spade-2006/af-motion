/**
 * AF Motion Kinetic Typography Properties & Style Evaluator
 *
 * Interpolates and applies typographic style states (transforms, opacity, blur,
 * spacing, colors) using AF Motion's transform layering system.
 */

import { setTransformLayer } from "../transform.js";
import type { TypographyStyleState } from "./types.js";

function parseColor(color: string): [number, number, number, number] {
  if (color.startsWith("#")) {
    let hex = color.slice(1);
    if (hex.length === 3) {
      hex = hex[0]! + hex[0]! + hex[1]! + hex[1]! + hex[2]! + hex[2]!;
    }
    const num = parseInt(hex, 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255, 1];
  }
  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (match) {
    return [
      Number(match[1]),
      Number(match[2]),
      Number(match[3]),
      match[4] !== undefined ? Number(match[4]) : 1,
    ];
  }
  return [0, 0, 0, 1];
}

function lerpColor(c1: string, c2: string, t: number): string {
  const [r1, g1, b1, a1] = parseColor(c1);
  const [r2, g2, b2, a2] = parseColor(c2);

  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  const a = (a1 + (a2 - a1) * t).toFixed(3);

  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function parseUnit(val: number | string | undefined, defaultUnit = "px"): { num: number; unit: string } {
  if (val === undefined) return { num: 0, unit: defaultUnit };
  if (typeof val === "number") return { num: val, unit: defaultUnit };
  const match = String(val).match(/^(-?[\d.]+)([a-z%]*)$/i);
  if (match) {
    return { num: Number(match[1]), unit: match[2] || defaultUnit };
  }
  return { num: 0, unit: defaultUnit };
}

/**
 * Linearly interpolates between two TypographyStyleState objects.
 */
export function interpolateTypographyState(
  from: TypographyStyleState = {},
  to: TypographyStyleState = {},
  progress: number
): TypographyStyleState {
  const p = Math.max(0, Math.min(1, progress));
  const result: TypographyStyleState = {};

  // Opacity
  if (from.opacity !== undefined || to.opacity !== undefined) {
    const o0 = from.opacity ?? 1;
    const o1 = to.opacity ?? 1;
    result.opacity = o0 + (o1 - o0) * p;
  }

  // Translation X
  if (from.translateX !== undefined || to.translateX !== undefined) {
    const u0 = parseUnit(from.translateX);
    const u1 = parseUnit(to.translateX, u0.unit);
    result.translateX = `${(u0.num + (u1.num - u0.num) * p).toFixed(3)}${u1.unit}`;
  }

  // Translation Y
  if (from.translateY !== undefined || to.translateY !== undefined) {
    const u0 = parseUnit(from.translateY);
    const u1 = parseUnit(to.translateY, u0.unit);
    result.translateY = `${(u0.num + (u1.num - u0.num) * p).toFixed(3)}${u1.unit}`;
  }

  // Translation Z
  if (from.translateZ !== undefined || to.translateZ !== undefined) {
    const u0 = parseUnit(from.translateZ);
    const u1 = parseUnit(to.translateZ, u0.unit);
    result.translateZ = `${(u0.num + (u1.num - u0.num) * p).toFixed(3)}${u1.unit}`;
  }

  // Rotations
  if (from.rotate !== undefined || to.rotate !== undefined) {
    const r0 = from.rotate ?? 0;
    const r1 = to.rotate ?? 0;
    result.rotate = r0 + (r1 - r0) * p;
  }
  if (from.rotateX !== undefined || to.rotateX !== undefined) {
    const r0 = from.rotateX ?? 0;
    const r1 = to.rotateX ?? 0;
    result.rotateX = r0 + (r1 - r0) * p;
  }
  if (from.rotateY !== undefined || to.rotateY !== undefined) {
    const r0 = from.rotateY ?? 0;
    const r1 = to.rotateY ?? 0;
    result.rotateY = r0 + (r1 - r0) * p;
  }
  if (from.rotateZ !== undefined || to.rotateZ !== undefined) {
    const r0 = from.rotateZ ?? 0;
    const r1 = to.rotateZ ?? 0;
    result.rotateZ = r0 + (r1 - r0) * p;
  }

  // Scale
  if (from.scale !== undefined || to.scale !== undefined) {
    const s0 = from.scale ?? 1;
    const s1 = to.scale ?? 1;
    result.scale = s0 + (s1 - s0) * p;
  }
  if (from.scaleX !== undefined || to.scaleX !== undefined) {
    const s0 = from.scaleX ?? 1;
    const s1 = to.scaleX ?? 1;
    result.scaleX = s0 + (s1 - s0) * p;
  }
  if (from.scaleY !== undefined || to.scaleY !== undefined) {
    const s0 = from.scaleY ?? 1;
    const s1 = to.scaleY ?? 1;
    result.scaleY = s0 + (s1 - s0) * p;
  }

  // Skew
  if (from.skewX !== undefined || to.skewX !== undefined) {
    const k0 = from.skewX ?? 0;
    const k1 = to.skewX ?? 0;
    result.skewX = k0 + (k1 - k0) * p;
  }
  if (from.skewY !== undefined || to.skewY !== undefined) {
    const k0 = from.skewY ?? 0;
    const k1 = to.skewY ?? 0;
    result.skewY = k0 + (k1 - k0) * p;
  }

  // Blur
  if (from.blur !== undefined || to.blur !== undefined) {
    const b0 = from.blur ?? 0;
    const b1 = to.blur ?? 0;
    result.blur = Math.max(0, b0 + (b1 - b0) * p);
  }

  // Spacing
  if (from.letterSpacing !== undefined || to.letterSpacing !== undefined) {
    const u0 = parseUnit(from.letterSpacing, "em");
    const u1 = parseUnit(to.letterSpacing, u0.unit);
    result.letterSpacing = `${(u0.num + (u1.num - u0.num) * p).toFixed(3)}${u1.unit}`;
  }
  if (from.wordSpacing !== undefined || to.wordSpacing !== undefined) {
    const u0 = parseUnit(from.wordSpacing, "em");
    const u1 = parseUnit(to.wordSpacing, u0.unit);
    result.wordSpacing = `${(u0.num + (u1.num - u0.num) * p).toFixed(3)}${u1.unit}`;
  }

  // Color
  if (from.color && to.color) {
    result.color = lerpColor(from.color, to.color, p);
  } else if (to.color) {
    result.color = to.color;
  }

  // Transform origin
  if (to.transformOrigin) {
    result.transformOrigin = to.transformOrigin;
  }

  return result;
}

/**
 * Applies interpolated typographic styles to a DOM element.
 */
export function applyTypographyStyle(
  element: HTMLElement,
  state: TypographyStyleState,
  owner: object
): void {
  const transforms: string[] = [];

  // Translations
  const tx = state.translateX ?? 0;
  const ty = state.translateY ?? 0;
  const tz = state.translateZ ?? 0;

  if (tx !== 0 || ty !== 0 || tz !== 0) {
    const xStr = typeof tx === "number" ? `${tx.toFixed(3)}px` : tx;
    const yStr = typeof ty === "number" ? `${ty.toFixed(3)}px` : ty;
    const zStr = typeof tz === "number" ? `${tz.toFixed(3)}px` : tz;
    transforms.push(`translate3d(${xStr}, ${yStr}, ${zStr})`);
  }

  // Scales
  const sx = state.scaleX ?? state.scale ?? 1;
  const sy = state.scaleY ?? state.scale ?? 1;
  if (sx !== 1 || sy !== 1) {
    transforms.push(`scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`);
  }

  // Rotations
  if (state.rotateX) transforms.push(`rotateX(${state.rotateX.toFixed(2)}deg)`);
  if (state.rotateY) transforms.push(`rotateY(${state.rotateY.toFixed(2)}deg)`);
  if (state.rotateZ || state.rotate) {
    const r = (state.rotateZ ?? 0) + (state.rotate ?? 0);
    transforms.push(`rotate(${r.toFixed(2)}deg)`);
  }

  // Skew
  if (state.skewX) transforms.push(`skewX(${state.skewX.toFixed(2)}deg)`);
  if (state.skewY) transforms.push(`skewY(${state.skewY.toFixed(2)}deg)`);

  // Apply transforms through layering system
  setTransformLayer(element, owner, transforms.join(" "));

  // Opacity
  if (state.opacity !== undefined) {
    element.style.opacity = state.opacity.toFixed(4);
  }

  // Blur
  if (state.blur !== undefined) {
    element.style.filter = state.blur > 0.01 ? `blur(${state.blur.toFixed(2)}px)` : "";
  }

  // Spacing
  if (state.letterSpacing !== undefined) {
    element.style.letterSpacing = String(state.letterSpacing);
  }
  if (state.wordSpacing !== undefined) {
    element.style.wordSpacing = String(state.wordSpacing);
  }

  // Color
  if (state.color !== undefined) {
    element.style.color = state.color;
  }

  // Transform origin
  if (state.transformOrigin !== undefined) {
    element.style.transformOrigin = state.transformOrigin;
  }
}

/**
 * Resets inline styles and transform layers for a typography unit.
 */
export function clearTypographyStyle(element: HTMLElement, owner: object): void {
  setTransformLayer(element, owner, "");
  element.style.removeProperty("opacity");
  element.style.removeProperty("filter");
  element.style.removeProperty("letter-spacing");
  element.style.removeProperty("word-spacing");
  element.style.removeProperty("color");
  element.style.removeProperty("transform-origin");
}
