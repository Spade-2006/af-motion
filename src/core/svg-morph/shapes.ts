/**
 * AF Motion SVG Shape to Path Converter
 *
 * Converts SVG primitives (circle, rect, ellipse, polygon, polyline, line)
 * into mathematically equivalent SVG path data strings for seamless morphing.
 */

import type {
  SVGCircleProps,
  SVGEllipseProps,
  SVGPolygonProps,
  SVGPolylineProps,
  SVGRectProps,
} from "./types.js";

// Standard cubic Bézier circular arc approximation constant: 4 * (sqrt(2) - 1) / 3
const KAPPA = 0.5522847498307936;

/**
 * Converts a circle into a closed path with 4 cubic Bézier curves.
 */
export function circleToPath(circle: SVGCircleProps): string {
  const { cx, cy, r } = circle;
  if (r <= 0) {
    return `M ${cx} ${cy} Z`;
  }

  const k = r * KAPPA;
  return [
    `M ${cx + r} ${cy}`,
    `C ${cx + r} ${cy + k} ${cx + k} ${cy + r} ${cx} ${cy + r}`,
    `C ${cx - k} ${cy + r} ${cx - r} ${cy + k} ${cx - r} ${cy}`,
    `C ${cx - r} ${cy - k} ${cx - k} ${cy - r} ${cx} ${cy - r}`,
    `C ${cx + k} ${cy - r} ${cx + r} ${cy - k} ${cx + r} ${cy}`,
    "Z",
  ].join(" ");
}

/**
 * Converts an ellipse into a closed path with 4 cubic Bézier curves.
 */
export function ellipseToPath(ellipse: SVGEllipseProps): string {
  const { cx, cy, rx, ry } = ellipse;
  if (rx <= 0 || ry <= 0) {
    return `M ${cx} ${cy} Z`;
  }

  const kx = rx * KAPPA;
  const ky = ry * KAPPA;

  return [
    `M ${cx + rx} ${cy}`,
    `C ${cx + rx} ${cy + ky} ${cx + kx} ${cy + ry} ${cx} ${cy + ry}`,
    `C ${cx - kx} ${cy + ry} ${cx - rx} ${cy + ky} ${cx - rx} ${cy}`,
    `C ${cx - rx} ${cy - ky} ${cx - kx} ${cy - ry} ${cx} ${cy - ry}`,
    `C ${cx + kx} ${cy - ry} ${cx + rx} ${cy - ky} ${cx + rx} ${cy}`,
    "Z",
  ].join(" ");
}

/**
 * Converts a rectangle (with optional rounded corners) into a closed path.
 */
export function rectToPath(rect: SVGRectProps): string {
  const { x, y, width, height } = rect;
  let rx = Math.max(0, rect.rx ?? 0);
  let ry = Math.max(0, rect.ry ?? (rect.rx !== undefined ? rect.rx : 0));

  // Clamp radii
  rx = Math.min(rx, width / 2);
  ry = Math.min(ry, height / 2);

  if (rx <= 0 || ry <= 0) {
    // Sharp rectangle
    return `M ${x} ${y} H ${x + width} V ${y + height} H ${x} Z`;
  }

  const kx = rx * KAPPA;
  const ky = ry * KAPPA;

  return [
    `M ${x + rx} ${y}`,
    `H ${x + width - rx}`,
    `C ${x + width - rx + kx} ${y} ${x + width} ${y + ry - ky} ${x + width} ${y + ry}`,
    `V ${y + height - ry}`,
    `C ${x + width} ${y + height - ry + ky} ${x + width - rx + kx} ${y + height} ${x + width - rx} ${y + height}`,
    `H ${x + rx}`,
    `C ${x + rx - kx} ${y + height} ${x} ${y + height - ry + ky} ${x} ${y + height - ry}`,
    `V ${y + ry}`,
    `C ${x} ${y + ry - ky} ${x + rx - kx} ${y} ${x + rx} ${y}`,
    "Z",
  ].join(" ");
}

/**
 * Parses point coordinates from a string or number tuple array.
 */
function parsePoints(points: string | readonly (readonly [number, number])[]): [number, number][] {
  if (Array.isArray(points)) {
    return points.map((p) => [p[0], p[1]]);
  }

  const str = typeof points === "string" ? points : "";
  const numbers = str.trim().split(/[\s,]+/).map(Number).filter((n: number) => !isNaN(n));
  const result: [number, number][] = [];
  for (let i = 0; i < numbers.length; i += 2) {
    if (i + 1 < numbers.length) {
      result.push([numbers[i], numbers[i + 1]]);
    }
  }
  return result;
}

/**
 * Converts a polygon into a closed SVG path.
 */
export function polygonToPath(polygon: SVGPolygonProps): string {
  const coords = parsePoints(polygon.points);
  if (coords.length === 0) return "M 0 0 Z";

  const first = coords[0];
  const rest = coords.slice(1).map((p) => `L ${p[0]} ${p[1]}`).join(" ");
  return `M ${first[0]} ${first[1]} ${rest} Z`.trim();
}

/**
 * Converts a polyline into an open SVG path.
 */
export function polylineToPath(polyline: SVGPolylineProps): string {
  const coords = parsePoints(polyline.points);
  if (coords.length === 0) return "M 0 0";

  const first = coords[0];
  const rest = coords.slice(1).map((p) => `L ${p[0]} ${p[1]}`).join(" ");
  return `M ${first[0]} ${first[1]} ${rest}`.trim();
}

/**
 * Converts any DOM SVG element (path, circle, rect, ellipse, polygon, polyline, line)
 * into a canonical path data string.
 */
export function svgElementToPath(element: SVGElement): string {
  if (!element || !element.tagName) {
    throw new TypeError("Invalid SVG element passed to svgElementToPath()");
  }

  const tag = element.tagName.toLowerCase();

  switch (tag) {
    case "path":
      return element.getAttribute("d") || "";

    case "circle": {
      const cx = parseFloat(element.getAttribute("cx") || "0");
      const cy = parseFloat(element.getAttribute("cy") || "0");
      const r = parseFloat(element.getAttribute("r") || "0");
      return circleToPath({ cx, cy, r });
    }

    case "rect": {
      const x = parseFloat(element.getAttribute("x") || "0");
      const y = parseFloat(element.getAttribute("y") || "0");
      const width = parseFloat(element.getAttribute("width") || "0");
      const height = parseFloat(element.getAttribute("height") || "0");
      const rxAttr = element.getAttribute("rx");
      const ryAttr = element.getAttribute("ry");
      const rx = rxAttr ? parseFloat(rxAttr) : undefined;
      const ry = ryAttr ? parseFloat(ryAttr) : undefined;
      return rectToPath({ x, y, width, height, rx, ry });
    }

    case "ellipse": {
      const cx = parseFloat(element.getAttribute("cx") || "0");
      const cy = parseFloat(element.getAttribute("cy") || "0");
      const rx = parseFloat(element.getAttribute("rx") || "0");
      const ry = parseFloat(element.getAttribute("ry") || "0");
      return ellipseToPath({ cx, cy, rx, ry });
    }

    case "polygon": {
      const points = element.getAttribute("points") || "";
      return polygonToPath({ points });
    }

    case "polyline": {
      const points = element.getAttribute("points") || "";
      return polylineToPath({ points });
    }

    case "line": {
      const x1 = parseFloat(element.getAttribute("x1") || "0");
      const y1 = parseFloat(element.getAttribute("y1") || "0");
      const x2 = parseFloat(element.getAttribute("x2") || "0");
      const y2 = parseFloat(element.getAttribute("y2") || "0");
      return `M ${x1} ${y1} L ${x2} ${y2}`;
    }

    default:
      throw new TypeError(`Cannot convert <${tag}> to SVG path: unsupported SVG element type`);
  }
}
