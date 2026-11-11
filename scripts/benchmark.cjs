const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const { JSDOM } = require("jsdom");

// Setup minimal DOM for Node benchmarking
const dom = new JSDOM("<!DOCTYPE html><html><body><div id='root'></div></body></html>", {
  pretendToBeVisual: true,
});
global.window = dom.window;
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.SVGElement = dom.window.SVGElement;
global.devicePixelRatio = 2;
global.CSS = {
  supports: () => true,
};

let currentRafId = 0;
const rafMap = new Map();
const rafStacks = new Map();
global.requestAnimationFrame = (cb) => {
  const id = ++currentRafId;
  rafMap.set(id, cb);
  rafStacks.set(id, new Error().stack);
  return id;
};
global.cancelAnimationFrame = (id) => {
  rafMap.delete(id);
  rafStacks.delete(id);
};

function flushRays(time) {
  const pending = [...rafMap.entries()];
  rafMap.clear();
  rafStacks.clear();
  for (const [id, cb] of pending) cb(time);
}

async function runBenchmarks() {
  const { animate } = await import("../dist/index.js");
  const { magnetic } = await import("../dist/index.js");
  const { tilt } = await import("../dist/index.js");
  const { drag } = await import("../dist/index.js");
  const { aurora } = await import("../dist/index.js");
  const { animateSequence } = await import("../dist/index.js");
  const { animateParallel } = await import("../dist/index.js");

  const results = {};

  // Force garbage collection if available
  if (global.gc) global.gc();

  // 1. Core Animation Performance
  console.log("Benchmarking Core Animation Engine...");
  {
    const count = 1000;
    const elements = Array.from({ length: count }, () => {
      const el = document.createElement("div");
      document.body.appendChild(el);
      return el;
    });

    const t0 = performance.now();
    const animations = elements.map((el) =>
      animate(el, { opacity: [0, 1], transform: ["translateY(20px)", "translateY(0px)"] }, { duration: 300 })
    );
    const tCreate = performance.now() - t0;

    const t1 = performance.now();
    // Simulate frame tick at 150ms (halfway)
    flushRays(150);
    const tTick = performance.now() - t1;

    const t2 = performance.now();
    // Simulate completion frame tick at 350ms
    flushRays(350);
    const tComplete = performance.now() - t2;

    results.coreAnimation1000 = {
      creationTimeMs: Number(tCreate.toFixed(2)),
      frameTickTimeMs: Number(tTick.toFixed(2)),
      completionTimeMs: Number(tComplete.toFixed(2)),
      totalTimeMs: Number((tCreate + tTick + tComplete).toFixed(2)),
      opsPerSecond: Math.round((count / (tCreate + tTick + tComplete)) * 1000),
    };

    elements.forEach((el) => el.remove());
  }

  // 1b. Animation Cancellation Throughput
  console.log("Benchmarking Animation Cancellation...");
  {
    const count = 1000;
    const elements = Array.from({ length: count }, () => {
      const el = document.createElement("div");
      document.body.appendChild(el);
      return el;
    });

    const animations = elements.map((el) =>
      animate(el, { opacity: [0, 1] }, { duration: 5000 })
    );

    const t0 = performance.now();
    for (const anim of animations) anim.cancel();
    const tCancel = performance.now() - t0;

    results.animationCancellation1000 = {
      cancellationTimeMs: Number(tCancel.toFixed(2)),
      avgPerAnimationMicroseconds: Number(((tCancel / count) * 1000).toFixed(2)),
    };

    elements.forEach((el) => el.remove());
  }

  // 1c. Sequence & Parallel Composition
  console.log("Benchmarking Sequence & Parallel Groups...");
  {
    const stepCount = 50;
    const elements = Array.from({ length: stepCount }, () => document.createElement("div"));

    // Parallel
    const t0 = performance.now();
    const parallelSteps = elements.map((el) => ({
      target: el,
      properties: { opacity: [0, 1] },
      options: { duration: 200 },
    }));
    const parallelControls = animateParallel(parallelSteps);
    flushRays(250);
    const tParallel = performance.now() - t0;

    // Sequence
    const t1 = performance.now();
    const sequenceSteps = elements.map((el) => ({
      target: el,
      properties: { opacity: [0, 1] },
      options: { duration: 10 },
    }));
    const sequenceControls = animateSequence(sequenceSteps);
    for (let i = 0; i < stepCount + 5; i++) {
      flushRays(i * 15);
    }
    const tSequence = performance.now() - t1;

    results.composition = {
      parallel50StepsMs: Number(tParallel.toFixed(2)),
      sequence50StepsMs: Number(tSequence.toFixed(2)),
    };
  }

  // 2. Effects Lifecycle
  console.log("Benchmarking Interactive Effects Lifecycle...");
  {
    const iterations = 500;
    const el = document.createElement("div");
    document.body.appendChild(el);

    // Magnetic
    const t0 = performance.now();
    for (let i = 0; i < iterations; i++) {
      const m = magnetic(el);
      m.destroy();
    }
    const tMagnetic = performance.now() - t0;

    // Tilt
    const t1 = performance.now();
    for (let i = 0; i < iterations; i++) {
      const t = tilt(el);
      t.destroy();
    }
    const tTilt = performance.now() - t1;

    // Drag
    const t2 = performance.now();
    for (let i = 0; i < iterations; i++) {
      const d = drag(el);
      d.destroy();
    }
    const tDrag = performance.now() - t2;

    results.effectsLifecycle = {
      iterations,
      magneticAvgMicroseconds: Number(((tMagnetic / iterations) * 1000).toFixed(2)),
      tiltAvgMicroseconds: Number(((tTilt / iterations) * 1000).toFixed(2)),
      dragAvgMicroseconds: Number(((tDrag / iterations) * 1000).toFixed(2)),
    };

    el.remove();
  }

  // 3. Canvas Background Lifecycle
  console.log("Benchmarking Canvas Background Lifecycle...");
  {
    const iterations = 100;
    const el = document.createElement("div");
    document.body.appendChild(el);

    const t0 = performance.now();
    for (let i = 0; i < iterations; i++) {
      const bg = aurora(el, { speed: 1 });
      flushRays(16);
      bg.destroy();
    }
    const tAurora = performance.now() - t0;

    results.canvasBackgroundLifecycle = {
      iterations,
      totalTimeMs: Number(tAurora.toFixed(2)),
      avgPerCycleMicroseconds: Number(((tAurora / iterations) * 1000).toFixed(2)),
    };

    el.remove();
  }

  // 4. Memory Stability & Stress Test
  console.log("Benchmarking Memory & Stress Testing...");
  {
    if (global.gc) global.gc();
    const memBefore = process.memoryUsage();

    const cycles = 2000;
    for (let i = 0; i < cycles; i++) {
      const el = document.createElement("div");
      document.body.appendChild(el);
      const anim = animate(el, { opacity: [0, 1] }, { duration: 100 });
      if (i % 2 === 0) {
        anim.cancel();
      } else {
        flushRays(i * 100);
        flushRays(i * 100 + 150);
      }
      el.remove();
    }

    if (global.gc) global.gc();
    const memAfter = process.memoryUsage();

    console.log("Remaining RAF callbacks in map:", rafMap.size, [...rafMap.keys()]);
    if (rafMap.size > 0) {
      for (const [id, cb] of rafMap) {
        console.log("RAF callback function:", cb.name, cb.toString().slice(0, 100));
        console.log("Scheduled at stack:\n", rafStacks.get(id));
      }
    }

    results.memoryStress = {
      cycles,
      heapUsedBeforeMB: Number((memBefore.heapUsed / 1024 / 1024).toFixed(2)),
      heapUsedAfterMB: Number((memAfter.heapUsed / 1024 / 1024).toFixed(2)),
      heapDeltaMB: Number(((memAfter.heapUsed - memBefore.heapUsed) / 1024 / 1024).toFixed(2)),
      leakedRafCallbacks: rafMap.size,
    };
  }

  // 5. Bundle Sizes
  console.log("Measuring Production Bundle Sizes...");
  {
    const distDir = path.resolve(__dirname, "../dist");
    const entrypoints = [
      "index.js",
      "react.js",
      "catalogue.js",
      "presets.js",
    ];

    const bundleSizes = {};
    for (const entry of entrypoints) {
      const filePath = path.join(distDir, entry);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath);
        const rawBytes = content.length;
        const gzippedBytes = zlib.gzipSync(content).length;
        bundleSizes[entry] = {
          rawBytes,
          rawKB: Number((rawBytes / 1024).toFixed(2)),
          gzipBytes: gzippedBytes,
          gzipKB: Number((gzippedBytes / 1024).toFixed(2)),
        };
      }
    }
    results.bundleSizes = bundleSizes;
  }

  console.log("\n================ BENCHMARK RESULTS ================");
  console.log(JSON.stringify(results, null, 2));
}

runBenchmarks().catch(console.error);
