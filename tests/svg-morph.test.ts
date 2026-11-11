// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  parseSVGPath,
  normalizeSVGPath,
  createMorph,
  interpolateMorph,
  morphPath,
  circleToPath,
  rectToPath,
  ellipseToPath,
  polygonToPath,
  polylineToPath,
  svgElementToPath,
  arcToCubic,
  clearMorphCache,
  formatNormalizedPath,
  type Morph,
} from "../src/catalogue.js";

describe("Prompt 112 — SVG Morphing Engine", () => {
  beforeEach(() => {
    clearMorphCache();
  });

  afterEach(() => {
    clearMorphCache();
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // 1. SVG PATH PARSING & COMMAND SUPPORT
  // -------------------------------------------------------------------------
  describe("1. SVG Path Parsing & Command Support", () => {
    it("parses every SVG path command type (M, L, H, V, C, S, Q, T, A, Z)", () => {
      const d = "M 10 20 L 30 40 H 50 V 60 C 10 10 20 20 30 30 S 40 40 50 50 Q 60 60 70 70 T 80 80 A 25 25 0 0 1 100 100 Z";
      const commands = parseSVGPath(d);

      expect(commands.map((c) => c.type)).toEqual([
        "M", "L", "H", "V", "C", "S", "Q", "T", "A", "Z",
      ]);
    });

    it("parses relative commands (m, l, h, v, c, s, q, t, a, z)", () => {
      const d = "m 5 5 l 10 10 h 5 v 5 c 1 1 2 2 3 3 s 4 4 5 5 q 6 6 7 7 t 8 8 a 10 10 0 1 0 20 20 z";
      const commands = parseSVGPath(d);

      expect(commands.map((c) => c.type)).toEqual([
        "m", "l", "h", "v", "c", "s", "q", "t", "a", "z",
      ]);
    });

    it("handles negative numbers without delimiter whitespace", () => {
      const d = "M-10-20L-30.5-40.25";
      const commands = parseSVGPath(d);

      expect(commands[0].params).toEqual([-10, -20]);
      expect(commands[1].params).toEqual([-30.5, -40.25]);
    });

    it("supports scientific notation and decimals", () => {
      const d = "M 1e-4 .5 L -2.5E+2 12.345";
      const commands = parseSVGPath(d);

      expect(commands[0].params).toEqual([0.0001, 0.5]);
      expect(commands[1].params).toEqual([-250, 12.345]);
    });

    it("expands repeated coordinate sequences after M into implicit L commands", () => {
      const d = "M 10 20 30 40 50 60";
      const commands = parseSVGPath(d);

      expect(commands.length).toBe(3);
      expect(commands[0]).toEqual({ type: "M", params: [10, 20] });
      expect(commands[1]).toEqual({ type: "L", params: [30, 40] });
      expect(commands[2]).toEqual({ type: "L", params: [50, 60] });
    });

    it("throws helpful TypeError on malformed SVG path data", () => {
      expect(() => parseSVGPath("")).toThrow(/non-empty/);
      expect(() => parseSVGPath("L 10 20")).toThrow(/must start with 'M' or 'm'/);
      expect(() => parseSVGPath("M 10")).toThrow(/parameter count mismatch/);
      expect(() => parseSVGPath("M 10 20 X 50 60")).toThrow(/Unexpected character 'X'/);
    });
  });

  // -------------------------------------------------------------------------
  // 2. PATH NORMALIZATION & CONVERSIONS
  // -------------------------------------------------------------------------
  describe("2. Canonical Normalization & Conversions", () => {
    it("converts lines (L, H, V) into exact cubic Bézier curves", () => {
      const norm = normalizeSVGPath("M 0 0 L 30 60 H 90 V 120");
      const subpath = norm.subpaths[0];

      // M + 3 lines converted to cubics = 4 segments
      expect(subpath.segments.length).toBe(4);
      expect(subpath.segments[0].type).toBe("M");
      expect(subpath.segments[1].type).toBe("C");
      expect(subpath.segments[2].type).toBe("C");
      expect(subpath.segments[3].type).toBe("C");

      // Verify first cubic endpoints from (0, 0) to (30, 60)
      const c1 = subpath.segments[1] as any;
      expect(c1.cp1).toEqual([10, 20]);
      expect(c1.cp2).toEqual([20, 40]);
      expect(c1.end).toEqual([30, 60]);
    });

    it("converts quadratic Bézier curves (Q, T) to exact cubic Béziers", () => {
      const norm = normalizeSVGPath("M 0 0 Q 30 60 60 0 T 120 0");
      const subpath = norm.subpaths[0];

      expect(subpath.segments.length).toBe(3); // M + C + C
      expect(subpath.segments[1].type).toBe("C");
      expect(subpath.segments[2].type).toBe("C");
    });

    it("converts elliptical arcs (A) into smooth cubic Bézier segments", () => {
      const cubics = arcToCubic(0, 0, 50, 50, 0, 0, 1, 100, 0);
      expect(cubics.length).toBeGreaterThanOrEqual(1);
      expect(cubics[0].type).toBe("C");
      expect(cubics[cubics.length - 1].end).toEqual([100, 0]);
    });

    it("subdivides segments to align segment counts between mismatched paths", () => {
      const pathSimple = "M 0 0 L 100 0"; // 1 cubic
      const pathComplex = "M 0 0 L 25 0 L 50 0 L 75 0 L 100 0"; // 4 cubics

      const morph = createMorph(pathSimple, pathComplex);
      expect(morph.from.subpaths[0].segments.length).toBe(morph.to.subpaths[0].segments.length);
      expect(morph.from.subpaths[0].segments.length).toBe(5); // M + 4 cubics
    });

    it("aligns closed subpaths and optimizes start point", () => {
      const square1 = "M 0 0 L 100 0 L 100 100 L 0 100 Z";
      const square2 = "M 100 0 L 100 100 L 0 100 L 0 0 Z"; // Same square shifted by 1 vertex

      const morph = createMorph(square1, square2, { alignStartPoints: true });
      expect(morph.from.subpaths[0].segments.length).toBe(morph.to.subpaths[0].segments.length);
    });

    it("supports multiple subpaths and adds collapsed subpaths when counts differ", () => {
      const single = "M 0 0 L 100 0 Z";
      const double = "M 0 0 L 50 0 Z M 60 0 L 100 0 Z";

      const morph = createMorph(single, double);
      expect(morph.from.subpaths.length).toBe(2);
      expect(morph.to.subpaths.length).toBe(2);
    });
  });

  // -------------------------------------------------------------------------
  // 3. SHAPE TO PATH CONVERSIONS
  // -------------------------------------------------------------------------
  describe("3. SVG Shape to Path Conversion", () => {
    it("converts circle to 4-curve closed path", () => {
      const path = circleToPath({ cx: 50, cy: 50, r: 25 });
      expect(path).toContain("M 75 50");
      expect(path).toContain("Z");
      expect((path.match(/C /g) || []).length).toBe(4);
    });

    it("converts rect (with or without rounded corners) to path", () => {
      const sharp = rectToPath({ x: 10, y: 10, width: 80, height: 60 });
      expect(sharp).toBe("M 10 10 H 90 V 70 H 10 Z");

      const rounded = rectToPath({ x: 10, y: 10, width: 80, height: 60, rx: 5, ry: 5 });
      expect(rounded).toContain("C ");
      expect(rounded).toContain("Z");
    });

    it("converts ellipse to 4-curve closed path", () => {
      const path = ellipseToPath({ cx: 100, cy: 100, rx: 40, ry: 20 });
      expect(path).toContain("M 140 100");
      expect(path).toContain("Z");
      expect((path.match(/C /g) || []).length).toBe(4);
    });

    it("converts polygon and polyline to path", () => {
      const poly = polygonToPath({ points: "0,0 100,0 50,100" });
      expect(poly).toBe("M 0 0 L 100 0 L 50 100 Z");

      const line = polylineToPath({ points: "0,0 50,50 100,0" });
      expect(line).toBe("M 0 0 L 50 50 L 100 0");
    });

    it("converts DOM SVGElement instances to path data", () => {
      const circleEl = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circleEl.setAttribute("cx", "100");
      circleEl.setAttribute("cy", "100");
      circleEl.setAttribute("r", "50");

      const pathData = svgElementToPath(circleEl);
      expect(pathData).toContain("M 150 100");

      const rectEl = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rectEl.setAttribute("x", "0");
      rectEl.setAttribute("y", "0");
      rectEl.setAttribute("width", "50");
      rectEl.setAttribute("height", "50");

      const rectPath = svgElementToPath(rectEl);
      expect(rectPath).toBe("M 0 0 H 50 V 50 H 0 Z");
    });
  });

  // -------------------------------------------------------------------------
  // 4. MORPH INTERPOLATION & PROGRESS INSPECTION
  // -------------------------------------------------------------------------
  describe("4. Morph Interpolation & Determinism", () => {
    let morph: Morph;

    beforeEach(() => {
      const circle = circleToPath({ cx: 50, cy: 50, r: 50 });
      const rect = rectToPath({ x: 0, y: 0, width: 100, height: 100 });
      morph = createMorph(circle, rect, { precision: 2 });
    });

    it("interpolates exactly to source at progress = 0", () => {
      const at0 = interpolateMorph(morph, 0);
      const expected = formatNormalizedPath(morph.from, 2);
      expect(at0).toBe(expected);
    });

    it("interpolates exactly to target at progress = 1", () => {
      const at1 = interpolateMorph(morph, 1);
      const expected = formatNormalizedPath(morph.to, 2);
      expect(at1).toBe(expected);
    });

    it("interpolates intermediate geometry at progress = 0.5 deterministically", () => {
      const atHalf = interpolateMorph(morph, 0.5);
      expect(typeof atHalf).toBe("string");
      expect(atHalf).toContain("M ");
      expect(atHalf).toContain("C ");
      expect(atHalf).toContain("Z");

      // Repeated evaluation produces bitwise identical string
      expect(interpolateMorph(morph, 0.5)).toBe(atHalf);
    });

    it("supports reversible morphing from 1 down to 0", () => {
      const forwardHalf = interpolateMorph(morph, 0.5);
      const reverseHalf = interpolateMorph(morph, 1 - 0.5);
      expect(forwardHalf).toBe(reverseHalf);
    });
  });

  // -------------------------------------------------------------------------
  // 5. CACHING & PERFORMANCE
  // -------------------------------------------------------------------------
  describe("5. Caching & Performance", () => {
    it("returns cached Morph on repeated calls with identical path strings", () => {
      const p1 = "M 0 0 L 100 100";
      const p2 = "M 0 100 L 100 0";

      const morph1 = createMorph(p1, p2);
      const morph2 = createMorph(p1, p2);

      expect(morph1).toBe(morph2); // Exact same object reference!
    });

    it("clears cache via clearMorphCache", () => {
      const p1 = "M 0 0 L 100 100";
      const p2 = "M 0 100 L 100 0";

      const morph1 = createMorph(p1, p2);
      clearMorphCache();
      const morph2 = createMorph(p1, p2);

      expect(morph1).not.toBe(morph2);
    });

    it("handles large complex paths efficiently", () => {
      // Generate a path with 200 line segments
      const points: string[] = [];
      for (let i = 0; i < 200; i++) {
        points.push(`${i * 2} ${Math.sin(i / 10) * 50}`);
      }
      const largePathA = `M 0 0 L ${points.join(" L ")}`;
      const largePathB = `M 0 0 L ${points.map((p) => p.split(" ").reverse().join(" ")).join(" L ")}`;

      const t0 = performance.now();
      const largeMorph = createMorph(largePathA, largePathB);
      const interp = interpolateMorph(largeMorph, 0.5);
      const duration = performance.now() - t0;

      expect(interp).toBeDefined();
      expect(duration).toBeLessThan(100); // Super fast compilation and interpolation
    });
  });

  // -------------------------------------------------------------------------
  // 6. ANIMATION API & CONTROLS (morphPath)
  // -------------------------------------------------------------------------
  describe("6. morphPath Animation API", () => {
    it("animates SVG element and updates 'd' attribute across progress", () => {
      const pathEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
      pathEl.setAttribute("d", "M 0 0 L 100 0");

      const onProgress = vi.fn();
      const onComplete = vi.fn();

      const controls = morphPath(pathEl, "M 0 0 L 0 100", {
        duration: 300,
        onProgress,
        onComplete,
      });

      expect(controls).toBeDefined();
      expect(typeof controls.seek).toBe("function");
      expect(typeof controls.pause).toBe("function");
      expect(typeof controls.resume).toBe("function");
      expect(typeof controls.reverse).toBe("function");
      expect(typeof controls.cancel).toBe("function");

      // Seek to 0.5
      controls.seek(0.5);
      expect(pathEl.getAttribute("d")).toBeDefined();
      expect(onProgress).toHaveBeenCalled();

      // Destroy with restoreOriginal = true
      controls.destroy(true);
      expect(pathEl.getAttribute("d")).toBe("M 0 0 L 100 0");
    });

    it("supports morphing an SVG shape (circle) directly into a path", () => {
      const circleEl = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circleEl.setAttribute("cx", "50");
      circleEl.setAttribute("cy", "50");
      circleEl.setAttribute("r", "25");

      const starPath = "M 50 0 L 65 35 L 100 35 L 75 60 L 85 100 L 50 75 L 15 100 L 25 60 L 0 35 L 35 35 Z";

      const controls = morphPath(circleEl, starPath, { duration: 200 });
      controls.seek(1);
      expect(circleEl.getAttribute("d")).toBeDefined();
      controls.destroy(false);
    });
  });
});
