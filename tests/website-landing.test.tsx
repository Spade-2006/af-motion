// @vitest-environment jsdom

import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { HeroSection } from "../website/src/sections/HeroSection";
import { ProductIntroSection } from "../website/src/sections/ProductIntroSection";
import { CapabilityShowcaseSection } from "../website/src/sections/CapabilityShowcaseSection";
import { MotionPhilosophySection } from "../website/src/sections/MotionPhilosophySection";
import { CodeIntroductionSection } from "../website/src/sections/CodeIntroductionSection";
import { DeveloperCtaSection } from "../website/src/sections/DeveloperCtaSection";
import { App } from "../website/src/app/App";
import { MotionProvider } from "../website/src/app/providers/MotionProvider";
import { useAdaptiveQuality } from "../website/src/hooks/useAdaptiveQuality";

describe("Prompt 152 — Cinematic Landing Page & 3D Hero", () => {
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

  describe("1. Hero Experience & Positioning", () => {
    it("renders dominant headline, positioning copy, CTAs, and verified metadata", async () => {
      await act(async () => {
        root = createRoot(container);
        root.render(
          <MotionProvider>
            <HeroSection />
          </MotionProvider>
        );
      });

      expect(container.textContent).toContain("Motion is not an effect.");
      expect(container.textContent).toContain("an experience.");
      expect(container.textContent).toContain("Get Started");
      expect(container.textContent).toContain("Explore Playground");
      expect(container.textContent).toContain("GitHub");
      expect(container.textContent).toContain("npm install af-motion");
      expect(container.textContent).toContain("12 Core Easings + Springs");
      expect(container.textContent).toContain("19 Styles");
    });

    it("honors prefers-reduced-motion in HeroSection and shows static pose HUD", async () => {
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
            <HeroSection />
          </MotionProvider>
        );
      });

      expect(container.textContent).toContain("Static Reduced-Motion Pose");
    });
  });

  describe("2. Below-the-Fold Homepage Sections", () => {
    it("renders ProductIntroSection with core engineering pillars", () => {
      act(() => {
        root = createRoot(container);
        root.render(<ProductIntroSection />);
      });

      expect(container.textContent).toContain("Engineered for Creative Precision");
      expect(container.textContent).toContain("Framework-Independent Core");
      expect(container.textContent).toContain("Zero Layout Thrashing");
      expect(container.textContent).toContain("Deterministic & Reduced-Motion Native");
    });

    it("renders CapabilityShowcaseSection with all 7 systems and accurate counts", () => {
      act(() => {
        root = createRoot(container);
        root.render(<CapabilityShowcaseSection />);
      });

      expect(container.textContent).toContain("Core Animation Engine");
      expect(container.textContent).toContain("Easing Curves & Spring Physics");
      expect(container.textContent).toContain("12 mathematically verified easing functions");
      expect(container.textContent).toContain("Interactive Effects & Gestures");
      expect(container.textContent).toContain("React 18 & 19 Bindings");
      expect(container.textContent).toContain("3D Scenes & GPU Shaders");
      expect(container.textContent).toContain("Deterministic Motion Intelligence");
      expect(container.textContent).toContain("161 registered capabilities");
      expect(container.textContent).toContain("CLI & Model Context Protocol (MCP)");
      expect(container.textContent).toContain("1,940 typed exports");
    });

    it("renders MotionPhilosophySection and switches solvers interactively", () => {
      act(() => {
        root = createRoot(container);
        root.render(
          <MotionProvider>
            <MotionPhilosophySection />
          </MotionProvider>
        );
      });

      expect(container.textContent).toContain("Timing Dictates Meaning");
      expect(container.textContent).toContain("animateSpring({ stiffness: 220, damping: 18 })");

      const expoButton = Array.from(container.querySelectorAll("button")).find((btn) =>
        btn.textContent?.includes("Exponential Out")
      );
      expect(expoButton).toBeDefined();

      act(() => {
        expoButton?.click();
      });

      expect(container.textContent).toContain(
        "animateProgress({ easing: easings.easeOutExpo })"
      );
    });

    it("renders CodeIntroductionSection, switches code tabs, and runs live demo", () => {
      act(() => {
        root = createRoot(container);
        root.render(
          <MotionProvider>
            <CodeIntroductionSection />
          </MotionProvider>
        );
      });

      expect(container.textContent).toContain("Write Clean, Typed Motion");
      expect(container.textContent).toContain('from "af-motion"');
      expect(container.textContent).toContain("Runs executed: 0");

      const reactTab = Array.from(container.querySelectorAll("button")).find((btn) =>
        btn.textContent?.includes("React Bindings")
      );
      act(() => {
        reactTab?.click();
      });
      expect(container.textContent).toContain('from "af-motion/react"');

      const runBtn = Array.from(container.querySelectorAll("button")).find((btn) =>
        btn.textContent?.includes("Run Example")
      );
      act(() => {
        runBtn?.click();
      });
      expect(container.textContent).toContain("Runs executed: 1");
    });

    it("renders DeveloperCtaSection with real navigation actions", () => {
      act(() => {
        root = createRoot(container);
        root.render(<DeveloperCtaSection />);
      });

      expect(container.textContent).toContain("Start Building with AF Motion");
      expect(container.textContent).toContain("Read Documentation");
      expect(container.textContent).toContain("Open Playground");
      expect(container.textContent).toContain("Browse Examples");
      expect(container.textContent).toContain("GitHub");
    });
  });

  describe("3. Navigation & Responsive Quality Tiers", () => {
    it("switches routes cleanly via window.location.hash", async () => {
      await act(async () => {
        root = createRoot(container);
        root.render(<App />);
      });

      expect(container.textContent).toContain("Motion is not an effect.");

      await act(async () => {
        window.location.hash = "#features";
        window.dispatchEvent(new HashChangeEvent("hashchange"));
      });
      expect(container.textContent).toContain("AF Motion Feature Capabilities");

      await act(async () => {
        window.location.hash = "#playground";
        window.dispatchEvent(new HashChangeEvent("hashchange"));
      });
      expect(container.textContent).toContain("Interactive Motion Playground");
    });

    it("adapts quality tier across mobile, tablet, and desktop widths", () => {
      let latestQuality: ReturnType<typeof useAdaptiveQuality> | null = null;
      const Probe = () => {
        latestQuality = useAdaptiveQuality();
        return null;
      };

      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 390,
      });
      act(() => {
        root = createRoot(container);
        root.render(<Probe />);
      });
      expect(latestQuality?.qualityTier).toBe("low");
      expect(latestQuality?.isMobile).toBe(true);

      act(() => {
        (window as any).innerWidth = 820;
        window.dispatchEvent(new Event("resize"));
      });
      expect(latestQuality?.qualityTier).toBe("medium");
      expect(latestQuality?.isTablet).toBe(true);
    });
  });
});
