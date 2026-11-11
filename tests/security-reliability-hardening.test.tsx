// @vitest-environment jsdom

import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import React, { StrictMode, act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

import {
  animate,
  animateSpring,
  aurora,
  definePalette,
  magnetic,
  particleField,
  registerEasing,
  reveal,
  tilt,
} from "af-motion";
import { Interactive, Reveal, useAnimate, useMotionAccessibility } from "af-motion/react";
import {
  agentMessageBus,
  createAFMotionMCPServer,
  deserializeSceneSchema,
  designToMotionEngine,
  executeMCPTool,
  importCompositionFromJson,
  safeToolRegistry,
  taskPlanner,
  validateMotionConfig,
  workflowExecutionEngine,
} from "af-motion/catalogue";
import { listPresets } from "af-motion/presets";
import { generateSceneExportArtifacts } from "../src/core/scene-generation/generator.js";
import { createScene3D } from "../src/3d/scene.js";
import { createThreeRendererAdapter } from "../src/3d/adapter.js";
import { runCLI, executeInit, executeExample, executePresetExport } from "../src/cli/index.js";
import { ThreeErrorBoundary } from "../website/src/components/three/ThreeErrorBoundary";
import { SceneCanvas } from "../website/src/components/three/SceneCanvas";

describe("Prompt 158 — Security, Performance & Compatibility Hardening", () => {
  let container: HTMLDivElement;
  let root: Root | null = null;
  let tempDirs: string[] = [];

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (root) {
      act(() => {
        root?.unmount();
      });
      root = null;
    }
    container.remove();
    for (const dir of tempDirs) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
    tempDirs = [];
  });

  function makeTempDir(prefix = "af-sec-"): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
    tempDirs.push(dir);
    return dir;
  }

  // 1-4. Malformed config, NaN/Infinity, extreme parameters, invalid easing/palette registration
  it("rejects malformed configurations, NaN/Infinity, circular structures, and invalid registrations", () => {
    expect(validateMotionConfig(null).valid).toBe(false);
    expect(validateMotionConfig([] as unknown as Record<string, unknown>).valid).toBe(false);

    const nanReport = validateMotionConfig({ duration: Number.NaN, properties: { opacity: [0, 1] } });
    expect(nanReport.valid).toBe(false);
    expect(nanReport.issues.some((i) => i.id === "issue-invalid-duration")).toBe(true);

    const negRepeatReport = validateMotionConfig({ duration: 300, repeat: -2, properties: { opacity: [0, 1] } });
    expect(negRepeatReport.valid).toBe(false);
    expect(negRepeatReport.issues.some((i) => i.id === "issue-invalid-repeat")).toBe(true);

    const circular: Record<string, unknown> = {};
    circular.self = circular;
    const circularReport = validateMotionConfig({
      duration: 300,
      properties: { transform: circular },
    });
    expect(circularReport.valid).toBe(false);
    expect(circularReport.issues.some((i) => i.id === "issue-circular-config")).toBe(true);

    expect(() =>
      animate(container, { opacity: [0, 1] }, { duration: Number.POSITIVE_INFINITY })
    ).toThrow(RangeError);
    expect(() =>
      animateSpring({ config: { stiffness: Number.NaN }, onUpdate: () => undefined })
    ).toThrow(RangeError);
    expect(() => registerEasing("easeOutCubic", (t) => t)).toThrow(TypeError);
    expect(() => registerEasing("not-a-fn", "bad" as unknown as (t: number) => number)).toThrow(TypeError);
    expect(() =>
      definePalette({
        name: "Invalid",
        primary: "javascript:alert(1)",
        secondary: "#000000",
        accent: "#ffffff",
      })
    ).toThrow(TypeError);
  });

  // 5. Unsafe code-generation escaping & prototype pollution resistance
  it("neutralizes JSX/JS/comment injection in deterministic code generation and strips prototype keys on JSON import", async () => {
    const evilString = 'Hero */ <script>alert(1)</script> {window.eval("x")} " onClick="alert(2)';
    const d2m = await designToMotionEngine.generate({
      naturalLanguage: "Animate card entrance",
      tokens: {
        motionDNA: "precise",
        timingMultiplier: Number.POSITIVE_INFINITY,
      },
      specification: {
        elements: [
          {
            id: evilString,
            name: evilString,
            type: "card",
          },
        ],
      },
    });
    expect(d2m.exportArtifacts.reactCode).not.toContain("<script>");
    expect(d2m.exportArtifacts.reactCode).not.toContain("{window.eval");
    expect(d2m.exportArtifacts.reactCode).toContain("&lt;script&gt;");

    const sceneArtifacts = generateSceneExportArtifacts(
      {
        id: "scene-sec",
        name: "Test */ ; process.exit(1)",
        description: "Test",
        category: "hero",
        motionDNA: "precise",
        paletteName: "Cobalt Classic",
        timingMultiplier: 1,
        reducedMotion: false,
        environment: {
          backgroundColor: "#0B0F19; background-image: url(https://evil.example)",
        },
        objects: [
          {
            id: 'obj" onclick="evil()',
            name: "{(() => evil())()}",
            type: "ui-element",
            layer: "foreground",
            transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: 1 },
          },
        ],
      },
      importCompositionFromJson(JSON.stringify({ name: "Comp" })).composition
    );
    expect(sceneArtifacts.reactCode).not.toContain("{(() =>");
    expect(sceneArtifacts.reactCode).toContain("&#123;");
    expect(sceneArtifacts.reactCode).not.toContain("onclick=\"evil");

    const pollutedJson = JSON.stringify({
      name: "Safe Comp",
      __proto__: { polluted: true },
      constructor: { prototype: { polluted: true } },
    });
    const compRes = importCompositionFromJson(pollutedJson);
    expect(Object.prototype.hasOwnProperty.call(compRes.composition, "polluted")).toBe(false);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();

    expect(() => deserializeSceneSchema("")).toThrow();
  });

  // 6-7. CLI path traversal, argument validation, and flag prototype pollution
  it("blocks CLI path traversal, invalid flags/templates/langs, and preset export breakout", async () => {
    const cwd = makeTempDir("af-cli-sec-");

    await expect(
      executeInit({ cwd, name: "../../outside-dir", quiet: true })
    ).rejects.toThrow(/Security error.*outside workspace directory/i);

    await expect(
      executeInit({ cwd, template: "evil-shell" as unknown as "vanilla-ts", quiet: true })
    ).rejects.toThrow(/Invalid starter template/i);

    await expect(
      executeExample("spring", { cwd, out: "../escape.ts" })
    ).rejects.toThrow(/Security error.*outside workspace directory/i);

    const badLang = await executeExample("spring", { cwd, lang: "python" as unknown as "ts" });
    expect(badLang).toBe(false);

    const validPresetName = listPresets()[0]!.name;
    await expect(
      executePresetExport(validPresetName, { cwd, out: "../../stolen.ts" })
    ).rejects.toThrow(/Security error.*outside workspace directory/i);

    const exitCodeProto = await runCLI(["init", "--__proto__", "polluted"]);
    expect(exitCodeProto).toBe(2);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  // 8-10. Agent tool input validation, workflow bounds, approval enforcement & message bus safety
  it("enforces agent tool validation, workflow step/retry bounds, approval rejection, and message safety", async () => {
    await expect(
      safeToolRegistry.invoke("analyze_performance", [] as unknown as Record<string, unknown>)
    ).rejects.toThrow(/plain object/i);

    await expect(
      safeToolRegistry.invoke("analyze_performance", { fps: Number.NaN })
    ).rejects.toThrow(/finite number/i);

    await expect(
      safeToolRegistry.invoke("analyze_motion", {}, { allowedPermissions: ["transform"] })
    ).rejects.toThrow(/Permission denied/i);

    const generated = await safeToolRegistry.invoke<{ reactTsx: string }>("generate_export_artifacts", {
      name: "Foo = (() => process.exit(1))(); export const Bar",
    });
    expect(generated.reactTsx).not.toContain("process.exit");

    expect(() =>
      agentMessageBus.createMessage({
        workflowId: "wf-1",
        senderAgentId: "a",
        recipientAgentId: "b",
        type: "task_assignment",
        payload: { code: "<SCRIPT>eval('x')</SCRIPT>" },
      })
    ).toThrow(/prohibited code/i);

    const giantTasks = Array.from({ length: 105 }, (_, i) => ({
      id: `t-${i}`,
      description: "step",
      assignedAgentId: "agent-motion-intelligence",
      inputs: {},
      expectedOutput: "motion-quality-report" as const,
      dependencies: [],
      priority: 1,
      status: "pending" as const,
    }));
    const planValidation = taskPlanner.validatePlan({
      workflowId: "wf-giant",
      goal: "Too many tasks",
      tasks: giantTasks,
      createdAt: Date.now(),
      estimatedDurationMs: 1000,
    });
    expect(planValidation.valid).toBe(false);
    expect(planValidation.issues[0]).toMatch(/maximum allowed task count/i);

    const approvalPlan = taskPlanner.createCustomPlan(
      "Needs human signoff",
      [
        {
          id: "step-1",
          description: "Analyze config",
          assignedAgentId: "agent-motion-intelligence",
          inputs: { duration: 300 },
          expectedOutput: "motion-quality-report",
          dependencies: [],
          priority: 1,
        },
      ],
      { requirePlanApproval: true }
    );
    const denied = await workflowExecutionEngine.executePlan(approvalPlan, {
      onApprovalRequired: async () => false,
    });
    expect(denied.status).toBe("failed");
    expect(denied.error).toMatch(/approval denied/i);
    expect(denied.telemetry.auditTrail.some((e) => e.type === "approval_rejected")).toBe(true);
  });

  // 11. MCP argument validation & error sanitization
  it("rejects malformed MCP JSON-RPC params and sanitizes invalid arguments", async () => {
    const server = createAFMotionMCPServer();

    const nullParams = await server.handleMessage({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: null as unknown as Record<string, unknown>,
    });
    expect(nullParams?.error?.code).toBe(-32602);

    const badToolArgs = await server.handleMessage({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: { name: "discover_capabilities", arguments: ["invalid"] },
    });
    expect(badToolArgs?.error?.code).toBe(-32602);

    const negDuration = await executeMCPTool("generate_transition", {
      type: "entrance",
      duration: Number.NaN,
    });
    expect(negDuration.isError).toBe(true);
  });

  // 12-13, 18. Animation cancellation, zero duration, repeated cancel, observer cleanup & target removal
  it("handles zero duration, repeated cancellation, target removal, and idempotent effect/observer cleanup", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);

    const onCancel = vi.fn();
    const controls = animate(el, { opacity: [0, 1] }, { duration: 0, onCancel });
    controls.cancel();
    controls.cancel();
    expect(onCancel).toHaveBeenCalledTimes(1);

    const springControls = animateSpring({
      from: 0,
      to: 100,
      onUpdate: () => undefined,
    });
    el.remove();
    springControls.cancel();
    springControls.cancel();

    const btn = document.createElement("button");
    const mag = magnetic(btn);
    mag.destroy();
    mag.destroy();

    const tlt = tilt(document.createElement("div"));
    tlt.destroy();
    tlt.destroy();

    // Observer cleanup verification for reveal()
    const disconnectSpy = vi.fn();
    const origIO = globalThis.IntersectionObserver;
    globalThis.IntersectionObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {
        disconnectSpy();
      }
      takeRecords() {
        return [];
      }
    } as unknown as typeof IntersectionObserver;

    const revTarget = document.createElement("div");
    const rev = reveal(revTarget);
    rev.destroy();
    rev.destroy();
    expect(disconnectSpy).toHaveBeenCalledTimes(1);
    globalThis.IntersectionObserver = origIO;

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
    }) as unknown as typeof HTMLCanvasElement.prototype.getContext;

    const host = document.createElement("div");
    const aur = aurora(host);
    const pf = particleField(host, { count: 10 });
    aur.destroy();
    aur.destroy();
    pf.destroy();
    pf.destroy();
    HTMLCanvasElement.prototype.getContext = origGetCtx;
  });

  // 14-16. React unmount cleanup, Strict Mode & SSR safety
  it("cleans up React hooks cleanly under StrictMode and renders deterministically in SSR", () => {
    const disconnectSpy = vi.fn();
    const origIO = globalThis.IntersectionObserver;
    globalThis.IntersectionObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {
        disconnectSpy();
      }
      takeRecords() {
        return [];
      }
    } as unknown as typeof IntersectionObserver;

    function HookWidget() {
      const ref = React.useRef<HTMLDivElement>(null);
      const { prefersReducedMotion } = useMotionAccessibility();
      useAnimate(ref, { opacity: [0, 1] }, { duration: 250 });
      return (
        <div ref={ref} data-reduced={String(prefersReducedMotion)}>
          <Reveal>
            <Interactive>Button</Interactive>
          </Reveal>
        </div>
      );
    }

    const ssrHtml = renderToString(<HookWidget />);
    expect(ssrHtml).toContain("Button");

    root = createRoot(container);
    act(() => {
      root?.render(
        <StrictMode>
          <HookWidget />
        </StrictMode>
      );
    });
    expect(container.textContent).toContain("Button");
    act(() => {
      root?.unmount();
    });
    root = null;
    expect(disconnectSpy).toHaveBeenCalled();
    globalThis.IntersectionObserver = origIO;
  });

  // 17, 19-20. GPU resource reuse, 3D disposal, WebGL fallback & ErrorBoundary recovery
  it("reuses 3D scene lights across frames, disposes GPU resources idempotently, and recovers cleanly via ThreeErrorBoundary", async () => {
    const addedLights: unknown[] = [];
    const disposed: string[] = [];
    const mockThree = {
      WebGLRenderer: class {
        shadowMap = { enabled: false };
        setPixelRatio() {}
        setSize() {}
        render() {}
        dispose() {
          disposed.push("renderer");
        }
      },
      Scene: class {
        add(obj: unknown) {
          addedLights.push(obj);
        }
        remove() {}
        traverse(cb: (o: unknown) => void) {
          cb({
            geometry: { dispose: () => disposed.push("geometry") },
            material: { dispose: () => disposed.push("material") },
          });
        }
      },
      PerspectiveCamera: class {
        position = { set() {} };
        aspect = 1;
        updateProjectionMatrix() {}
      },
      AmbientLight: class {
        intensity = 0.5;
        color = { set() {} };
      },
      DirectionalLight: class {
        intensity = 1;
        castShadow = false;
        color = { set() {} };
        position = { set() {} };
      },
      Color: class {},
    };

    const adapter = createThreeRendererAdapter({ THREE: mockThree });
    const scene = createScene3D(
      {
        lighting: {
          ambient: { color: "#ffffff", intensity: 0.4 },
          directional: [{ color: "#ffffff", intensity: 0.9, position: [1, 2, 3] }],
        },
        autoStart: false,
      },
      { adapter }
    );
    const canvas = document.createElement("canvas");
    await scene.attach(canvas);
    scene.requestFrame();
    scene.requestFrame();
    scene.requestFrame();
    // 1 ambient + 1 directional light total across 4 render calls (no per-frame reallocation)
    expect(addedLights.length).toBe(2);

    scene.destroy();
    scene.destroy();
    expect(disposed).toContain("renderer");
    expect(disposed).toContain("geometry");
    expect(disposed).toContain("material");

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    function ExplodingCanvas(): React.ReactElement {
      throw new Error("Simulated WebGL driver failure");
    }
    root = createRoot(container);
    act(() => {
      root?.render(
        <ThreeErrorBoundary>
          <ExplodingCanvas />
        </ThreeErrorBoundary>
      );
    });
    expect(container.textContent).toContain("High-Performance 2D Environment");

    act(() => {
      root?.render(<SceneCanvas />);
    });
    expect(container.textContent).toContain("2D Canvas Fallback");
    errorSpy.mockRestore();
    warnSpy.mockRestore();
  });
});
