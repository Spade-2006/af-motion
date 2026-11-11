// @vitest-environment jsdom

import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { App } from "../website/src/app/App";
import { MotionProvider } from "../website/src/app/providers/MotionProvider";
import { DEMO_REGISTRY, getDemoById } from "../website/src/playground/registry/demoRegistry";
import { DemoErrorBoundary } from "../website/src/playground/components/DemoErrorBoundary";
import { CodeInspector } from "../website/src/playground/components/CodeInspector";
import { PlaygroundLayout } from "../website/src/playground/components/PlaygroundLayout";

import { BasicAnimationDemo } from "../website/src/playground/demos/BasicAnimationDemo";
import { EasingExplorerDemo } from "../website/src/playground/demos/EasingExplorerDemo";
import { SpringPhysicsDemo } from "../website/src/playground/demos/SpringPhysicsDemo";
import { EffectsShowcaseDemo } from "../website/src/playground/demos/EffectsShowcaseDemo";
import { TimelineDemo } from "../website/src/playground/demos/TimelineDemo";
import { MotionDNADemo } from "../website/src/playground/demos/MotionDNADemo";
import { AILaboratoryDemo } from "../website/src/playground/demos/AILaboratoryDemo";
import { PresetExplorerDemo } from "../website/src/playground/demos/PresetExplorerDemo";

describe("Prompt 153 — Interactive Animation Showcase & Playground", () => {
  let container: HTMLDivElement;
  let root: Root | null = null;

  beforeEach(() => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    window.location.hash = "";
    window.scrollTo = vi.fn();

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
    container.remove();
  });

  describe("1. Registry, Routing & Lazy Loading", () => {
    it("registers all 11 playground laboratories across categories", () => {
      expect(DEMO_REGISTRY.length).toBe(11);
      expect(getDemoById("basic-animate").subpath).toBe("af-motion");
      expect(getDemoById("easing-explorer").category).toBe("Timing & Physics");
      expect(getDemoById("spring-physics").category).toBe("Timing & Physics");
      expect(getDemoById("three-gpu-showcase").isHeavy).toBe(true);
      expect(getDemoById("ai-laboratory").subpath).toBe("af-motion/catalogue");
      expect(getDemoById("preset-explorer").subpath).toBe("af-motion/presets");
    });

    it("resolves #playground and deep-linked #playground/<id> routes via lazy loading", async () => {
      await act(async () => {
        root = createRoot(container);
        root.render(<App />);
      });

      await act(async () => {
        window.location.hash = "#playground/spring-physics";
        window.dispatchEvent(new HashChangeEvent("hashchange"));
      });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 80));
      });

      expect(container.textContent).toContain("AF Motion Playground");
      expect(container.textContent).toContain("Spring Physics Solver");
    });
  });

  describe("2. Core, Timing & Physics Labs", () => {
    it("renders BasicAnimationDemo, adjusts parameters, and emits public animate() code", () => {
      const onCodeChange = vi.fn();
      act(() => {
        root = createRoot(container);
        root.render(
          <MotionProvider>
            <BasicAnimationDemo
              playNonce={0}
              resetNonce={0}
              isPaused={false}
              onCodeChange={onCodeChange}
            />
          </MotionProvider>
        );
      });

      expect(container.querySelector('[data-testid="basic-animation-target"]')).not.toBeNull();
      expect(onCodeChange).toHaveBeenCalled();
      const latestCode = onCodeChange.mock.calls.at(-1)?.[0] as string;
      expect(latestCode).toContain('from "af-motion"');
      expect(latestCode).toContain("animate(");
      expect(latestCode).toContain("easings.easeOutExpo");
    });

    it("renders EasingExplorerDemo with 12 built-in core curves and SVG trajectory", () => {
      const onCodeChange = vi.fn();
      act(() => {
        root = createRoot(container);
        root.render(
          <MotionProvider>
            <EasingExplorerDemo
              playNonce={0}
              resetNonce={0}
              isPaused={false}
              onCodeChange={onCodeChange}
            />
          </MotionProvider>
        );
      });

      expect(container.textContent).toContain("12 Built-in Core Curves");
      expect(container.querySelector("svg path")).not.toBeNull();

      const backBtn = Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent?.trim() === "easeOutBack"
      );
      expect(backBtn).toBeDefined();
      act(() => {
        backBtn?.click();
      });

      const latestCode = onCodeChange.mock.calls.at(-1)?.[0] as string;
      expect(latestCode).toContain("easeOutBack");
    });

    it("renders SpringPhysicsDemo and switches between Under, Critically, and Over-damped states", () => {
      const onCodeChange = vi.fn();
      act(() => {
        root = createRoot(container);
        root.render(
          <MotionProvider>
            <SpringPhysicsDemo
              playNonce={0}
              resetNonce={0}
              isPaused={false}
              onCodeChange={onCodeChange}
            />
          </MotionProvider>
        );
      });

      expect(container.textContent).toContain("Under-damped");
      expect(container.textContent).toContain("Damping Ratio");

      const critBtn = Array.from(container.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Critically damped")
      );
      act(() => {
        critBtn?.click();
      });
      expect(container.textContent).toContain("Critically damped");

      const overBtn = Array.from(container.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Over-damped")
      );
      act(() => {
        overBtn?.click();
      });
      expect(container.textContent).toContain("Over-damped");
    });
  });

  describe("3. Effects, Timeline & Motion DNA Labs", () => {
    it("switches cleanly across Stagger, Reveal, Magnetic, Tilt, and Parallax in EffectsShowcaseDemo", () => {
      const onCodeChange = vi.fn();
      act(() => {
        root = createRoot(container);
        root.render(
          <MotionProvider>
            <EffectsShowcaseDemo
              initialTab="stagger"
              playNonce={0}
              resetNonce={0}
              isPaused={false}
              onCodeChange={onCodeChange}
            />
          </MotionProvider>
        );
      });

      expect(onCodeChange.mock.calls.at(-1)?.[0]).toContain("stagger(");

      for (const [label, expectedApi] of [
        ["Reveal", "reveal("],
        ["Magnetic", "magnetic("],
        ["3D Tilt", "tilt("],
        ["Parallax", "parallax("],
      ] as const) {
        const tabBtn = Array.from(container.querySelectorAll("button")).find(
          (b) => b.textContent?.trim() === label
        );
        act(() => {
          tabBtn?.click();
        });
        expect(onCodeChange.mock.calls.at(-1)?.[0]).toContain(expectedApi);
      }
    });

    it("renders TimelineDemo with 3 choreographed tracks and seek scrub bar", () => {
      const onCodeChange = vi.fn();
      act(() => {
        root = createRoot(container);
        root.render(
          <MotionProvider>
            <TimelineDemo
              playNonce={0}
              resetNonce={0}
              isPaused={false}
              onCodeChange={onCodeChange}
            />
          </MotionProvider>
        );
      });

      expect(container.textContent).toContain("1. Badge Pill");
      expect(container.textContent).toContain("2. Main Card");
      expect(container.textContent).toContain("3. Accent Ring");
      expect(container.querySelector("#tl-seek")).not.toBeNull();
      expect(onCodeChange.mock.calls.at(-1)?.[0]).toContain("createTimeline()");
    });

    it("renders MotionDNADemo and switches across all 6 built-in DNA personalities", () => {
      const onCodeChange = vi.fn();
      act(() => {
        root = createRoot(container);
        root.render(
          <MotionProvider>
            <MotionDNADemo
              playNonce={0}
              resetNonce={0}
              isPaused={false}
              onCodeChange={onCodeChange}
            />
          </MotionProvider>
        );
      });

      const cinematicBtn = Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent?.trim().toLowerCase() === "cinematic"
      );
      expect(cinematicBtn).toBeDefined();

      act(() => {
        cinematicBtn?.click();
      });

      expect(container.textContent).toContain("cinematic Personality");
      expect(onCodeChange.mock.calls.at(-1)?.[0]).toContain('applyMotionDNA("cinematic")');
    });
  });

  describe("4. Deterministic AI Lab, Presets, Code Inspector & Safety", () => {
    it("renders AILaboratoryDemo across Intelligence, Design-to-Motion, Scene Gen, and Workflows", () => {
      const onCodeChange = vi.fn();
      act(() => {
        root = createRoot(container);
        root.render(
          <MotionProvider>
            <AILaboratoryDemo
              playNonce={0}
              resetNonce={0}
              isPaused={false}
              onCodeChange={onCodeChange}
            />
          </MotionProvider>
        );
      });

      expect(container.textContent).toContain("Offline · Deterministic");
      expect(container.textContent).toContain("Overall Score");
      expect(container.textContent).toContain("A+");

      const wfTab = Array.from(container.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Agent Workflows")
      );
      act(() => {
        wfTab?.click();
      });
      expect(container.textContent).toContain("Approval Gated");
      expect(onCodeChange.mock.calls.at(-1)?.[0]).toContain('from "af-motion/catalogue"');
    });

    it("renders PresetExplorerDemo exposing all 39 official presets from af-motion/presets", () => {
      const onCodeChange = vi.fn();
      act(() => {
        root = createRoot(container);
        root.render(
          <MotionProvider>
            <PresetExplorerDemo
              playNonce={0}
              resetNonce={0}
              isPaused={false}
              onCodeChange={onCodeChange}
            />
          </MotionProvider>
        );
      });

      expect(container.textContent).toContain("39 / 39 matching presets");
      expect(onCodeChange.mock.calls.at(-1)?.[0]).toContain('from "af-motion/presets"');
    });

    it("copies generated code via clipboard and switches TS/JS in CodeInspector", async () => {
      act(() => {
        root = createRoot(container);
        root.render(
          <CodeInspector
            tsCode={'const x: number = 10;\nanimate(".box", { opacity: [0, 1] });'}
            subpath="af-motion"
          />
        );
      });

      const jsBtn = Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent?.trim().toLowerCase() === "js"
      );
      act(() => {
        jsBtn?.click();
      });
      expect(container.textContent).toContain("const x = 10;");

      const copyBtn = container.querySelector('[aria-label="Copy generated code"]') as HTMLButtonElement;
      await act(async () => {
        copyBtn.click();
      });
      expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
    });

    it("isolates runtime demo errors cleanly with DemoErrorBoundary", () => {
      const CrashDemo = () => {
        throw new Error("Simulated WebGL Crash");
      };
      const consoleWarn = vi.spyOn(console, "error").mockImplementation(() => {});

      act(() => {
        root = createRoot(container);
        root.render(
          <DemoErrorBoundary demoId="crash-test">
            <CrashDemo />
          </DemoErrorBoundary>
        );
      });

      expect(container.textContent).toContain("Demonstration Error Isolated");
      expect(container.textContent).toContain("Simulated WebGL Crash");
      consoleWarn.mockRestore();
    });

    it("renders PlaygroundLayout with mobile demo selector and respects reduced motion", async () => {
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query.includes("prefers-reduced-motion"),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      await act(async () => {
        root = createRoot(container);
        root.render(
          <MotionProvider>
            <PlaygroundLayout initialDemoId="basic-animate" />
          </MotionProvider>
        );
      });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 80));
      });

      const mobileSelect = container.querySelector("#mobile-demo-select");
      expect(mobileSelect).not.toBeNull();
      expect(container.textContent).toContain("AF Motion Playground");
    });
  });
});
