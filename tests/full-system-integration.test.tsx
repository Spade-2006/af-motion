// @vitest-environment jsdom

import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import React, { StrictMode, act } from "react";
import { createRoot, type Root } from "react-dom/client";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";

import {
  animate,
  animateSpring,
  applyMotionDNA,
  aurora,
  createTimeline,
  easings,
  getMotionDNA,
  listPalettes,
  particleField,
} from "af-motion";
import {
  Interactive,
  Reveal,
  useAnimate,
  useMotionAccessibility,
} from "af-motion/react";
import {
  aiSceneGenerationEngine,
  designToMotionEngine,
  evaluateMotionQuality,
  generateMotionRecommendations,
  listWorkflowTemplates,
} from "af-motion/catalogue";
import { applyPreset, listPresets } from "af-motion/presets";

import { BUILT_IN_PALETTE_INPUTS } from "../src/core/built-in-palettes.js";
import { getArticleBySlug } from "../docs/engine/docs-engine.js";

import { App } from "../website/src/app/App";
import { MotionProvider } from "../website/src/app/providers/MotionProvider";
import { PlaygroundPage } from "../website/src/pages/PlaygroundPage";
import { SceneCanvas } from "../website/src/components/three/SceneCanvas";

async function waitForText(el: HTMLElement, text: string, timeoutMs = 4500) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (el.textContent?.includes(text)) return;
    await act(async () => {
      await new Promise((r) => setTimeout(r, 25));
    });
  }
}

describe("Prompt 157 — Full-System Cross-Ecosystem Integration (Scenarios 1–8)", () => {
  let container: HTMLDivElement;
  let root: Root | null = null;
  let tempDirs: string[] = [];

  beforeEach(() => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    window.location.hash = "";
    window.localStorage.clear();
    window.scrollTo = vi.fn();
    Element.prototype.scrollIntoView = vi.fn();

    class MockIntersectionObserver {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    }
    (window as any).IntersectionObserver = MockIntersectionObserver;
    (globalThis as any).IntersectionObserver = MockIntersectionObserver;

    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    Object.defineProperty(navigator, "clipboard", {
      writable: true,
      configurable: true,
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    if (root) {
      act(() => {
        root?.unmount();
      });
      root = null;
    }
    window.location.hash = "";
    window.localStorage.clear();
    container.remove();

    for (const d of tempDirs) {
      try {
        if (fs.existsSync(d)) fs.rmSync(d, { recursive: true, force: true });
      } catch {
        // best-effort temp cleanup
      }
    }
    tempDirs = [];
  });

  it("Scenario 1 — Core to Website: real core animation controls + Playground demo & copyable import", async () => {
    const node = document.createElement("div");
    document.body.appendChild(node);
    const controls = animate(
      node,
      { opacity: [0, 1], transform: ["translate3d(0,12px,0)", "translate3d(0,0,0)"] },
      { duration: 300, easing: easings.easeOutExpo }
    );
    expect(typeof controls.pause).toBe("function");
    expect(typeof controls.cancel).toBe("function");
    controls.cancel();
    node.remove();

    await act(async () => {
      root = createRoot(container);
      root.render(
        <MotionProvider>
          <PlaygroundPage initialDemoId="basic-animate" />
        </MotionProvider>
      );
    });

    await waitForText(container, 'from "af-motion"');
    expect(container.textContent).toContain("Basic Animation Engine (animate)");
    expect(container.textContent).toContain("easings.easeOutExpo");
  });

  it("Scenario 2 — Preset to React: preset application + React 19 StrictMode components", () => {
    const allPresets = listPresets();
    expect(allPresets.length).toBe(39);

    const target = document.createElement("div");
    document.body.appendChild(target);
    const applied = applyPreset(target, allPresets[0].id);
    expect(applied).toBeDefined();
    target.remove();

    const StrictProbe: React.FC = () => {
      const { ref, animate: trigger } = useAnimate<HTMLDivElement>();
      const a11y = useMotionAccessibility({ duration: 420, property: "transform" });
      return (
        <Reveal direction="up" duration={420}>
          <Interactive category="card">
            <div
              ref={ref}
              data-testid="strict-probe"
              onClick={() => trigger({ opacity: [0.8, 1] }, { duration: 150 })}
            >
              StrictMode Ready · Score {a11y.accessibilityScore}
            </div>
          </Interactive>
        </Reveal>
      );
    };

    act(() => {
      root = createRoot(container);
      root.render(
        <StrictMode>
          <StrictProbe />
        </StrictMode>
      );
    });

    expect(container.querySelector('[data-testid="strict-probe"]')).not.toBeNull();
    expect(container.textContent).toContain("StrictMode Ready");
  });

  it("Scenario 3 — Motion DNA & Palettes to Animation: resolves profiles and preserves all 33 palettes", () => {
    expect(listPalettes().length).toBe(33);
    expect(BUILT_IN_PALETTE_INPUTS.length).toBe(33);

    const profile = getMotionDNA("snappy");
    expect(profile?.duration).toBeGreaterThan(0);

    const resolvedOpts = applyMotionDNA("snappy");
    const box = document.createElement("div");
    document.body.appendChild(box);
    const anim = animate(
      box,
      { opacity: [0, 1], transform: ["scale(0.95)", "scale(1)"] },
      resolvedOpts
    );
    expect(anim).toBeDefined();
    anim.cancel();
    box.remove();
  });

  it("Scenario 4 — Documentation to Playground: real Docs article links into interactive Playground lab", async () => {
    const easingsArticle = getArticleBySlug("easings");
    expect(easingsArticle?.interactiveType).toBe("easing-explorer");

    await act(async () => {
      window.location.hash = "#docs/easings";
      root = createRoot(container);
      root.render(<App />);
    });

    await waitForText(container, "Try in Website Playground");
    expect(container.textContent).toContain("56 Built-in Easings & Curves");

    await act(async () => {
      window.location.hash = "#playground/easing-explorer";
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });

    await waitForText(container, "Easing Curve Laboratory");
    expect(container.textContent).toContain("12 built-in core easing curves");
  });

  it("Scenario 5 — Deterministic AI Pipeline: Design-to-Motion, Quality Audit, Scene Gen & Workflows", () => {
    const input = {
      configuration: {
        duration: 420,
        easing: "easeOutExpo",
        properties: { opacity: [0, 1], transform: ["translate3d(0,16px,0)", "translate3d(0,0,0)"] },
      },
    };
    const qualityA = evaluateMotionQuality(input as any);
    const qualityB = evaluateMotionQuality(input as any);
    expect(qualityA.scores.overall).toBe(qualityB.scores.overall);
    expect(qualityA.grade).toBe(qualityB.grade);

    const recs = generateMotionRecommendations(input as any, qualityA.findings);
    expect(Array.isArray(recs)).toBe(true);

    const dtmA = designToMotionEngine.generateSync({
      naturalLanguage: { prompt: "Elevated hero card reveal with snappy button feedback" },
    });
    const dtmB = designToMotionEngine.generateSync({
      naturalLanguage: { prompt: "Elevated hero card reveal with snappy button feedback" },
    });
    expect(dtmA.plan.durationMs).toBe(dtmB.plan.durationMs);
    expect(dtmA.exportArtifacts.reactCode).toContain("af-motion");

    const scene = aiSceneGenerationEngine.generateSync({
      naturalLanguage: { prompt: "Orbital 3D product stage with soft lighting" },
      specification: { category: "hero" },
    });
    expect(scene.scene3dSpec).toBeDefined();
    expect(scene.validation.isValid).toBe(true);
    expect(listWorkflowTemplates().length).toBeGreaterThan(0);
  });

  it("Scenario 6 — CLI to Consumer Project: init, validate, presets, and real TypeScript compile against dist/", () => {
    const consumerDir = fs.mkdtempSync(path.join(os.tmpdir(), "afm-consumer-157-"));
    tempDirs.push(consumerDir);

    const binPath = path.resolve("bin/af-motion.js");
    execFileSync(process.execPath, [binPath, "init", "--template", "vanilla-ts", "--quiet"], {
      cwd: consumerDir,
      encoding: "utf8",
    });

    expect(fs.existsSync(path.join(consumerDir, "animation.ts"))).toBe(true);
    expect(fs.existsSync(path.join(consumerDir, "af-motion.config.json"))).toBe(true);

    const validateOut = execFileSync(
      process.execPath,
      [binPath, "validate", "af-motion.config.json", "--json"],
      { cwd: consumerDir, encoding: "utf8" }
    );
    const validated = JSON.parse(validateOut);
    expect(validated.valid).toBe(true);

    // Real consumer TypeScript compilation test referencing built ./dist/*.d.ts
    const distRoot = path.resolve("dist").replace(/\\/g, "/");
    fs.writeFileSync(
      path.join(consumerDir, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: {
          target: "ES2022",
          module: "ESNext",
          moduleResolution: "Bundler",
          noEmit: true,
          strict: true,
          skipLibCheck: true,
          paths: {
            "af-motion": [`${distRoot}/index.d.ts`],
            "af-motion/react": [`${distRoot}/react.d.ts`],
            "af-motion/catalogue": [`${distRoot}/catalogue.d.ts`],
            "af-motion/presets": [`${distRoot}/presets.d.ts`],
          },
        },
        include: ["animation.ts"],
      }),
      "utf8"
    );

    const tscBin = path.resolve("node_modules/typescript/bin/tsc");
    execFileSync(process.execPath, [tscBin, "-p", path.join(consumerDir, "tsconfig.json")], {
      cwd: consumerDir,
      encoding: "utf8",
    });
  });

  it("Scenario 7 — 3D/GPU Lifecycle, Timeline Cancellation & Clean Unmount", () => {
    const origGetCtx = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      scale: vi.fn(),
      setTransform: vi.fn(),
      createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    }) as any;
    const bgHost = document.createElement("div");
    document.body.appendChild(bgHost);

    const auroraHandle = aurora(bgHost, { speed: 6, opacity: 0.7 });
    auroraHandle.destroy();

    const pField = particleField(bgHost, { count: 24 });
    pField.destroy();
    bgHost.remove();
    HTMLCanvasElement.prototype.getContext = origGetCtx;

    const tlNode = document.createElement("div");
    document.body.appendChild(tlNode);
    const tl = createTimeline();
    tl.finished.catch(() => {});
    tl.add({
      at: 0,
      target: tlNode,
      properties: { opacity: [0, 1] },
      options: { duration: 400 },
    });
    tl.play();
    tl.cancel();
    tlNode.remove();

    const sp = animateSpring({
      from: 0,
      to: 1,
      config: { stiffness: 180, damping: 16 },
      onUpdate: vi.fn(),
    });
    sp.cancel();

    act(() => {
      root = createRoot(container);
      root.render(
        <MotionProvider>
          <SceneCanvas />
        </MotionProvider>
      );
    });
    expect(container.textContent).toContain("High-Performance 2D Environment");
  });

  it("Scenario 8 — Full Developer Journey: Home -> Features -> Docs -> Article -> Examples -> Playground -> Onboarding", async () => {
    await act(async () => {
      window.location.hash = "#overview";
      root = createRoot(container);
      root.render(<App />);
    });
    expect(container.textContent).toContain("Motion is not an effect.");

    const routeChecks: ReadonlyArray<readonly [string, string]> = [
      ["#features", "AF Motion Feature Capabilities"],
      ["#docs", "AF Motion Documentation Hub"],
      ["#docs/choreography", "Multi-Track Choreography"],
      ["#examples", "Verified Animation Examples"],
      ["#playground/spring-physics", "Spring Physics Solver"],
      ["#onboarding", "Get Started with AF Motion in Minutes"],
    ];

    for (const [hash, expected] of routeChecks) {
      await act(async () => {
        window.location.hash = hash;
        window.dispatchEvent(new HashChangeEvent("hashchange"));
      });
      await waitForText(container, expected);
      expect(container.textContent).toContain(expected);
    }
  });
});
