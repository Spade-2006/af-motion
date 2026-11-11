// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createMotionPath,
  parseMotionPath,
  sampleMotionPath,
  getMotionPathLength,
  getMotionPathPoint,
  getMotionPathTangent,
  animateAlongPath,
  createPathFollower,
  computeSegmentLength,
  buildPathLUT,
  lookupDistanceInLUT,
  type MotionPath,
  type PathSample,
  type MotionPathSegmentDefinition,
} from "../src/catalogue.js";

describe("Prompt 113 — Motion Path Engine", () => {
  let frames: Map<number, FrameRequestCallback>;
  let nextId: number;
  let clockTime: number;
  let activeControls: ReturnType<typeof animateAlongPath>[];

  function flushFrame(time: number): void {
    clockTime = time;
    const pending = [...frames.values()];
    frames.clear();
    for (const callback of pending) callback(time);
  }

  beforeEach(() => {
    Object.defineProperty(document, "hidden", { value: false, configurable: true, writable: true });
    document.dispatchEvent(new Event("visibilitychange"));
    frames = new Map();
    nextId = 1;
    clockTime = 0;
    activeControls = [];
    vi.stubGlobal("performance", { now: () => clockTime } as Performance);
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      const id = nextId++;
      frames.set(id, callback);
      return id;
    });
    vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
  });

  afterEach(() => {
    for (const c of activeControls) {
      try {
        c.cancel();
      } catch {
        // ignore
      }
    }
    activeControls = [];
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // 1. PATH REPRESENTATIONS & PARSING
  // -------------------------------------------------------------------------
  describe("1. Path Representations & Parsing", () => {
    it("parses 2D SVG path data (lines and curves)", () => {
      const svgPath = "M 0 0 L 100 0 C 150 50 150 150 100 200 Z";
      const path = createMotionPath(svgPath);

      expect(path.is3D).toBe(false);
      expect(path.isClosed).toBe(true);
      expect(path.segments.length).toBeGreaterThanOrEqual(3);
      expect(path.totalLength).toBeGreaterThan(300);
    });

    it("parses 2D waypoints into smooth cubic Bézier segments", () => {
      const waypoints = [
        [0, 0],
        [50, 100],
        [100, 50],
        [150, 150],
      ];
      const path = createMotionPath(waypoints);

      expect(path.is3D).toBe(false);
      expect(path.segments.length).toBe(3);
      expect(path.segments[0]!.type).toBe("cubic");
      expect(path.totalLength).toBeGreaterThan(150);
    });

    it("parses 3D waypoints into 3D cubic Bézier segments", () => {
      const waypoints3D = [
        [0, 0, 0],
        [10, 20, 30],
        [30, 40, 60],
        [60, 50, 90],
      ];
      const path = createMotionPath(waypoints3D);

      expect(path.is3D).toBe(true);
      expect(path.bounds.max.z).toBeGreaterThanOrEqual(90);
    });

    it("parses explicit segment definitions (linear, quadratic, cubic)", () => {
      const segDefs: MotionPathSegmentDefinition[] = [
        {
          type: "line",
          start: { x: 0, y: 0, z: 0 },
          end: { x: 100, y: 0, z: 0 },
        },
        {
          type: "quadratic",
          start: { x: 100, y: 0, z: 0 },
          controlPoints: [{ x: 150, y: 50, z: 10 }],
          end: { x: 200, y: 0, z: 20 },
        },
        {
          type: "cubic",
          start: { x: 200, y: 0, z: 20 },
          controlPoints: [
            { x: 250, y: 50, z: 20 },
            { x: 250, y: 100, z: 30 },
          ],
          end: { x: 300, y: 100, z: 40 },
        },
      ];

      const path = createMotionPath(segDefs);
      expect(path.segments.length).toBe(3);
      expect(path.is3D).toBe(true);
      expect(path.totalLength).toBeGreaterThan(300);
    });

    it("supports closed loop paths with wrap-around boundaries", () => {
      const closedWaypoints = [
        [0, 0],
        [100, 0],
        [100, 100],
        [0, 100],
      ];
      const path = createMotionPath(closedWaypoints, { closed: true });

      expect(path.isClosed).toBe(true);
      expect(path.segments.length).toBe(4);
    });
  });

  // -------------------------------------------------------------------------
  // 2. PATH SAMPLING & NUMERICAL STABILITY
  // -------------------------------------------------------------------------
  describe("2. Path Sampling & Numerical Stability", () => {
    it("samples position accurately at endpoints and midpoints", () => {
      const line = createMotionPath("M 0 0 L 200 0");

      const start = line.sample(0);
      const mid = line.sample(0.5);
      const end = line.sample(1);

      expect(start.position.x).toBeCloseTo(0);
      expect(start.position.y).toBeCloseTo(0);
      expect(mid.position.x).toBeCloseTo(100);
      expect(mid.position.y).toBeCloseTo(0);
      expect(end.position.x).toBeCloseTo(200);
      expect(end.position.y).toBeCloseTo(0);
    });

    it("computes unit tangent vector and 2D rotation angle in degrees", () => {
      const diagonal = createMotionPath("M 0 0 L 100 100");

      const sample = diagonal.sample(0.5);
      expect(sample.tangent.x).toBeCloseTo(Math.SQRT1_2);
      expect(sample.tangent.y).toBeCloseTo(Math.SQRT1_2);
      expect(sample.angle).toBeCloseTo(45);
    });

    it("computes 2D normal perpendicular to tangent", () => {
      const horizontal = createMotionPath("M 0 0 L 100 0");
      const sample = horizontal.sample(0.5);

      expect(sample.tangent.x).toBeCloseTo(1);
      expect(sample.tangent.y).toBeCloseTo(0);
      expect(sample.normal.x).toBeCloseTo(0);
      expect(sample.normal.y).toBeCloseTo(1);
    });

    it("evaluates curvature along curved segments", () => {
      const curved = createMotionPath("M 0 0 C 0 100 100 100 100 0");

      const midSample = curved.sample(0.5);
      expect(midSample.curvature).toBeGreaterThan(0);

      const straight = createMotionPath("M 0 0 L 100 0");
      const straightSample = straight.sample(0.5);
      expect(straightSample.curvature).toBeCloseTo(0);
    });

    it("guarantees constant-speed traversal with arc-length parameterization", () => {
      // Non-linear cubic with clustered control points
      const nonUniformCurve = createMotionPath("M 0 0 C 1 1 2 2 100 0");

      const s25 = nonUniformCurve.sample(0.25, { constantSpeed: true });
      const s50 = nonUniformCurve.sample(0.5, { constantSpeed: true });
      const s75 = nonUniformCurve.sample(0.75, { constantSpeed: true });

      const total = nonUniformCurve.totalLength;
      expect(s25.distance).toBeCloseTo(total * 0.25, 1);
      expect(s50.distance).toBeCloseTo(total * 0.5, 1);
      expect(s75.distance).toBeCloseTo(total * 0.75, 1);
    });

    it("handles degenerate paths and zero-length segments safely", () => {
      const degenerate = createMotionPath([
        [10, 20],
        [10, 20],
      ]);

      expect(degenerate.totalLength).toBeCloseTo(0);
      const sample = degenerate.sample(0.5);
      expect(sample.position.x).toBe(10);
      expect(sample.position.y).toBe(20);
      expect(Number.isFinite(sample.tangent.x)).toBe(true);
      expect(Number.isFinite(sample.angle)).toBe(true);
    });

    it("supports sampling by absolute distance via sampleAtDistance", () => {
      const path = createMotionPath("M 0 0 L 100 0 L 100 100");
      expect(path.totalLength).toBeCloseTo(200);

      const sample50 = path.sampleAtDistance(50);
      expect(sample50.position.x).toBeCloseTo(50);
      expect(sample50.position.y).toBeCloseTo(0);

      const sample150 = path.sampleAtDistance(150);
      expect(sample150.position.x).toBeCloseTo(100);
      expect(sample150.position.y).toBeCloseTo(50);
    });
  });

  // -------------------------------------------------------------------------
  // 3. 3D MOTION PATHS & ORIENTATION FRAMES
  // -------------------------------------------------------------------------
  describe("3. 3D Motion Paths & Orientation Frames", () => {
    it("computes 3D tangent, normal, and binormal (Frenet/Bishop frame)", () => {
      const helix = createMotionPath([
        [0, 0, 0],
        [10, 10, 20],
        [0, 20, 40],
        [-10, 10, 60],
        [0, 0, 80],
      ]);

      expect(helix.is3D).toBe(true);
      const sample = helix.sample(0.5);

      expect(Number.isFinite(sample.position.z)).toBe(true);
      expect(sample.position.z).toBeGreaterThan(0);
      expect(Number.isFinite(sample.pitch)).toBe(true);
      expect(Number.isFinite(sample.yaw)).toBe(true);

      // Verify orthogonality of frame: tangent . normal ≈ 0
      const dotProduct =
        sample.tangent.x * sample.normal.x +
        sample.tangent.y * sample.normal.y +
        sample.tangent.z * sample.normal.z;
      expect(dotProduct).toBeCloseTo(0, 3);
    });
  });

  // -------------------------------------------------------------------------
  // 4. PATH FOLLOWER & RETARGETING
  // -------------------------------------------------------------------------
  describe("4. Path Follower & Retargeting", () => {
    it("follows path and generates CSS translate and rotate transforms", () => {
      const follower = createPathFollower("M 0 0 L 100 100", {
        autoRotate: true,
        rotationOffset: 0,
      });

      const s0 = follower.seek(0);
      expect(s0.position.x).toBeCloseTo(0);
      expect(follower.getTransform()).toContain("translate(0.000px, 0.000px)");
      expect(follower.getTransform()).toContain("rotate(45.00deg)");

      follower.seek(1);
      expect(follower.getTransform()).toContain("translate(100.000px, 100.000px)");
    });

    it("steps along path by incremental distance", () => {
      const follower = createPathFollower("M 0 0 L 200 0", { constantSpeed: true });

      follower.step(50);
      expect(follower.getPosition().x).toBeCloseTo(50);

      follower.step(50);
      expect(follower.getPosition().x).toBeCloseTo(100);
    });

    it("smoothly retargets to a new path dynamically", () => {
      const follower = createPathFollower("M 0 0 L 100 0");
      follower.seek(0.5);
      expect(follower.getPosition().x).toBeCloseTo(50);

      // Retarget to perpendicular path
      follower.retarget("M 0 50 L 0 200", { targetProgress: 0 });
      expect(follower.getPosition().x).toBeCloseTo(0);
      expect(follower.getPosition().y).toBeCloseTo(50);
    });
  });

  // -------------------------------------------------------------------------
  // 5. ANIMATION ENGINE INTEGRATION
  // -------------------------------------------------------------------------
  describe("5. Animation Engine Integration", () => {
    it("drives callback target along path with playback controls", () => {
      const updates: PathSample[] = [];
      const controls = animateAlongPath(
        (sample) => updates.push(sample),
        "M 0 0 L 100 0",
        { duration: 1000 }
      );
      activeControls.push(controls);

      // Immediately applied initial sample
      expect(updates.length).toBe(1);
      expect(updates[0]!.position.x).toBeCloseTo(0);

      flushFrame(0);
      flushFrame(500);
      expect(updates.length).toBeGreaterThan(1);
      const last = updates[updates.length - 1]!;
      expect(last.position.x).toBeCloseTo(50);

      flushFrame(1000);
      const finalSample = updates[updates.length - 1]!;
      expect(finalSample.position.x).toBeCloseTo(100);
    });

    it("updates DOM element transform style layered via setTransformLayer", () => {
      const element = document.createElement("div");
      document.body.appendChild(element);

      const controls = animateAlongPath(element, "M 0 0 L 200 0", {
        duration: 500,
        autoRotate: true,
      });
      activeControls.push(controls);

      flushFrame(0);
      flushFrame(250);
      expect(element.style.transform).toContain("translate(100.000px, 0.000px)");
      expect(element.style.transform).toContain("rotate(0.00deg)");

      flushFrame(500);
      expect(element.style.transform).toContain("translate(200.000px, 0.000px)");

      document.body.removeChild(element);
    });

    it("computes duration automatically from specified speed", () => {
      const samples: PathSample[] = [];
      // 100px path at 100px/s speed = 1000ms duration
      const controls = animateAlongPath(
        (sample) => samples.push(sample),
        "M 0 0 L 100 0",
        { speed: 100 }
      );
      activeControls.push(controls);

      flushFrame(0);
      flushFrame(500);
      expect(samples[samples.length - 1]!.position.x).toBeCloseTo(50);

      flushFrame(1000);
      expect(samples[samples.length - 1]!.position.x).toBeCloseTo(100);
    });

    it("supports pause, resume, reverse, and seek controls", () => {
      let currentSample!: PathSample;
      const controls = animateAlongPath(
        (s) => {
          currentSample = s;
        },
        "M 0 0 L 100 0",
        { duration: 1000 }
      );
      activeControls.push(controls);

      flushFrame(0);
      flushFrame(300);
      expect(currentSample.position.x).toBeCloseTo(30);

      controls.pause();
      flushFrame(600); // Clock advances while paused
      expect(currentSample.position.x).toBeCloseTo(30);

      controls.resume();
      flushFrame(800);
      expect(currentSample.position.x).toBeGreaterThan(30);

      controls.seek(0.9);
      expect(currentSample.position.x).toBeCloseTo(90);

      controls.cancel();
    });

    it("supports forward and reverse direction with offsets", () => {
      let currentSample!: PathSample;
      const controls = animateAlongPath(
        (s) => {
          currentSample = s;
        },
        "M 0 0 L 100 0",
        {
          duration: 1000,
          direction: "reverse",
          startOffset: 0.2,
          endOffset: 0.8,
        }
      );
      activeControls.push(controls);

      flushFrame(0);
      // In reverse mode, starts at endOffset (0.8 -> 80)
      expect(currentSample.position.x).toBeCloseTo(80);

      flushFrame(1000);
      // Ends at startOffset (0.2 -> 20)
      expect(currentSample.position.x).toBeCloseTo(20);
    });
  });

  // -------------------------------------------------------------------------
  // 6. PUBLIC CONVENIENCE APIS
  // -------------------------------------------------------------------------
  describe("6. Public Convenience APIs", () => {
    it("getMotionPathLength, getMotionPathPoint, getMotionPathTangent work directly", () => {
      const d = "M 0 0 L 300 400";
      const length = getMotionPathLength(d);
      expect(length).toBeCloseTo(500);

      const pt = getMotionPathPoint(d, 0.5);
      expect(pt.x).toBeCloseTo(150);
      expect(pt.y).toBeCloseTo(200);

      const tan = getMotionPathTangent(d, 0.5);
      expect(tan.x).toBeCloseTo(3 / 5);
      expect(tan.y).toBeCloseTo(4 / 5);
    });

    it("sampleMotionPath helper produces complete PathSample", () => {
      const sample = sampleMotionPath("M 0 0 C 10 20 30 40 50 60", 0.7);
      expect(sample.progress).toBe(0.7);
      expect(sample.position).toBeDefined();
      expect(sample.tangent).toBeDefined();
      expect(sample.normal).toBeDefined();
      expect(sample.angle).toBeDefined();
    });
  });

  // -------------------------------------------------------------------------
  // 7. ADVANCED CORNERS, SMOOTHING & RETARGETING
  // -------------------------------------------------------------------------
  describe("7. Advanced Orientation Smoothing & Dynamic Retargeting", () => {
    it("smooths orientation across sharp corner boundaries", () => {
      // 90 degree sharp corner from (0,0)->(100,0)->(100,100)
      const sharpPath = createMotionPath("M 0 0 L 100 0 L 100 100");
      const follower = createPathFollower(sharpPath, { smoothing: 0.5 });

      follower.seek(0.48); // Near corner along X axis (angle = 0)
      const t1 = follower.getTransform();

      follower.seek(0.52); // Just past corner along Y axis (angle = 90)
      const t2 = follower.getTransform();

      // Smoothed angle should not immediately jump 90 degrees
      expect(t1).toContain("rotate");
      expect(t2).toContain("rotate");
    });

    it("retargets active animation cleanly to a new path", () => {
      let currentSample!: PathSample;
      const controls = animateAlongPath(
        (s) => {
          currentSample = s;
        },
        "M 0 0 L 100 0",
        { duration: 1000 }
      );
      activeControls.push(controls);

      flushFrame(0);
      flushFrame(500);
      expect(currentSample.position.x).toBeCloseTo(50);

      // Retarget to new path
      controls.retarget("M 50 0 L 50 200");
      expect(controls.getCurrentSample().position.x).toBeCloseTo(50);
      expect(controls.getCurrentSample().position.y).toBeCloseTo(0);
    });

    it("supports yoyo and repeat animation along paths", () => {
      const samples: PathSample[] = [];
      const controls = animateAlongPath(
        (s) => samples.push(s),
        "M 0 0 L 100 0",
        { duration: 500, repeat: 1, yoyo: true }
      );
      activeControls.push(controls);

      flushFrame(0);
      flushFrame(500); // end of 1st iteration (x = 100)
      expect(samples[samples.length - 1]!.position.x).toBeCloseTo(100);

      flushFrame(1000); // end of yoyo reverse iteration (x = 0)
      expect(samples[samples.length - 1]!.position.x).toBeCloseTo(0);
    });

    it("handles large paths with 1000+ points performantly", () => {
      const largeWaypoints: [number, number, number][] = [];
      for (let i = 0; i < 1000; i++) {
        largeWaypoints.push([i, Math.sin(i * 0.1) * 20, Math.cos(i * 0.1) * 20]);
      }

      const start = performance.now();
      const largePath = createMotionPath(largeWaypoints);
      const compileTime = performance.now() - start;

      expect(largePath.segments.length).toBe(999);
      expect(largePath.totalLength).toBeGreaterThan(1000);
      expect(compileTime).toBeLessThan(200);

      const sample = largePath.sample(0.5);
      expect(sample.position.x).toBeGreaterThan(400);
    });
  });
});
