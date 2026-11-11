// @vitest-environment jsdom

import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { App } from "../website/src/app/App";
import { MotionProvider } from "../website/src/app/providers/MotionProvider";
import { FeaturesPage } from "../website/src/pages/FeaturesPage";
import { OnboardingPage } from "../website/src/pages/OnboardingPage";
import { ExamplesPage } from "../website/src/pages/ExamplesPage";
import { MobileNavigation } from "../website/src/components/navigation/MobileNavigation";
import { FEATURE_CATEGORIES } from "../website/src/features/data/featureCatalog";
import { CURATED_EXAMPLES } from "../website/src/examples/data/examplesCatalog";

async function waitForText(el: HTMLElement, text: string, timeoutMs = 4000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (el.textContent?.includes(text)) return;
    await act(async () => {
      await new Promise((r) => setTimeout(r, 25));
    });
  }
}

describe("Prompt 154 — Feature Pages, Developer Onboarding & Examples Gallery", () => {
  let container: HTMLDivElement;
  let root: Root | null = null;
  let writeTextMock: ReturnType<typeof vi.fn>;

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

    writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      writable: true,
      configurable: true,
      value: {
        writeText: writeTextMock,
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
  });

  describe("1. Feature Pages, Details & Comparisons", () => {
    it("renders all 6 feature pillars, visual previews, and architectural comparisons", () => {
      act(() => {
        root = createRoot(container);
        root.render(
          <MotionProvider>
            <FeaturesPage />
          </MotionProvider>
        );
      });

      expect(container.textContent).toContain("AF Motion Feature Capabilities");
      expect(FEATURE_CATEGORIES.length).toBe(6);

      for (const cat of FEATURE_CATEGORIES) {
        expect(container.textContent).toContain(cat.title);
        expect(container.textContent).toContain(cat.problemSolved);
      }

      expect(container.textContent).toContain("Choose the Right Abstraction Level");
      expect(container.textContent).toContain("Framework-Independent Core (af-motion)");
      expect(container.textContent).toContain("Deterministic AI Workflows (af-motion/catalogue)");
    });

    it("supports feature category navigation and deep links via #features/<id>", async () => {
      await act(async () => {
        window.location.hash = "#features/motion-intelligence";
        root = createRoot(container);
        root.render(<App />);
      });

      expect(container.textContent).toContain("AF Motion Feature Capabilities");
      const section = container.querySelector('[data-feature-category="motion-intelligence"]');
      expect(section).not.toBeNull();
    });

    it("executes interactive feature demonstrations without errors", async () => {
      await act(async () => {
        root = createRoot(container);
        root.render(
          <MotionProvider>
            <FeaturesPage />
          </MotionProvider>
        );
      });
      await waitForText(container, "Trigger animate()");
      await waitForText(container, "layout-heavy");

      const triggerBtn = Array.from(container.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Trigger animate()")
      );
      expect(triggerBtn).toBeDefined();

      act(() => {
        triggerBtn?.click();
      });
      expect(container.textContent).toContain("GPU Transform · Runs: 1");

      const heavyBtn = Array.from(container.querySelectorAll("button")).find((b) =>
        b.textContent?.trim() === "layout-heavy"
      );
      act(() => {
        heavyBtn?.click();
      });
      expect(container.textContent).toContain("0 Network / 0 LLM Calls");
    });
  });

  describe("2. Developer Onboarding & Interactive Checklist", () => {
    it("switches package managers (npm, pnpm, yarn, bun) and copies commands", async () => {
      await act(async () => {
        root = createRoot(container);
        root.render(
          <MotionProvider>
            <OnboardingPage />
          </MotionProvider>
        );
      });

      const cmdNode = () => container.querySelector('[data-testid="install-command"]')?.textContent;
      expect(cmdNode()).toBe("npm install af-motion");

      for (const [pm, expected] of [
        ["pnpm", "pnpm add af-motion"],
        ["yarn", "yarn add af-motion"],
        ["bun", "bun add af-motion"],
      ] as const) {
        const tab = Array.from(container.querySelectorAll('[role="tab"]')).find(
          (el) => el.textContent?.trim() === pm
        ) as HTMLButtonElement | undefined;
        expect(tab).toBeDefined();
        act(() => {
          tab?.click();
        });
        expect(cmdNode()).toBe(expected);
      }

      const copyBtn = container.querySelector(
        'button[aria-label="Copy bun install command"]'
      ) as HTMLButtonElement | null;
      await act(async () => {
        copyBtn?.click();
      });
      expect(writeTextMock).toHaveBeenCalledWith("bun add af-motion");
      expect(container.textContent).toContain("Copied");
    });

    it("persists checklist progress across remounts and supports reset", () => {
      act(() => {
        root = createRoot(container);
        root.render(
          <MotionProvider>
            <OnboardingPage />
          </MotionProvider>
        );
      });

      const runFirstBtn = Array.from(container.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Run First Animation")
      );
      act(() => {
        runFirstBtn?.click();
      });
      expect(container.textContent).toContain("Executions: 1");
      expect(container.textContent).toContain("1 of 5 completed");

      // Unmount and remount to verify persistence
      act(() => {
        root?.unmount();
      });
      act(() => {
        root = createRoot(container);
        root.render(
          <MotionProvider>
            <OnboardingPage />
          </MotionProvider>
        );
      });
      expect(container.textContent).toContain("1 of 5 completed");

      // Reset progress
      const resetBtn = container.querySelector(
        'button[aria-label="Reset onboarding progress"]'
      ) as HTMLButtonElement | null;
      act(() => {
        resetBtn?.click();
      });
      expect(container.textContent).toContain("0 of 5 completed");
    });
  });

  describe("3. Curated Examples Gallery", () => {
    it("renders all 9 categories and supports category/search filtering & code inspection", () => {
      act(() => {
        root = createRoot(container);
        root.render(
          <MotionProvider>
            <ExamplesPage />
          </MotionProvider>
        );
      });

      expect(CURATED_EXAMPLES.length).toBe(9);
      expect(container.textContent).toContain("Verified Animation Examples");
      expect(container.textContent).toContain("GPU Card Entrance");
      expect(container.textContent).toContain("Synchronized Timeline + AI Quality Audit");

      // Category tab filtering
      const physicsTab = Array.from(container.querySelectorAll('[role="tab"]')).find(
        (el) => el.textContent?.trim() === "Physics and Motion"
      ) as HTMLButtonElement | undefined;
      act(() => {
        physicsTab?.click();
      });
      expect(container.textContent).toContain("Under-Damped Spring Detent");
      expect(container.textContent).not.toContain("GPU Card Entrance");

      // Expand code drawer
      const viewCodeBtn = Array.from(container.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("View Code")
      );
      act(() => {
        viewCodeBtn?.click();
      });
      expect(container.textContent).toContain("animateSpring");
    });
  });

  describe("4. Routing, Deep-Link Regression, Mobile Nav, Reduced Motion & 404", () => {
    it("navigates cleanly across #onboarding, #features, #examples, #playground/<id>, and 404 fallback", { timeout: 15000 }, async () => {
      await act(async () => {
        root = createRoot(container);
        root.render(<App />);
      });

      await act(async () => {
        window.location.hash = "#onboarding";
        window.dispatchEvent(new HashChangeEvent("hashchange"));
      });
      await waitForText(container, "Get Started with AF Motion in Minutes");
      expect(container.textContent).toContain("Get Started with AF Motion in Minutes");

      await act(async () => {
        window.location.hash = "#examples";
        window.dispatchEvent(new HashChangeEvent("hashchange"));
      });
      await waitForText(container, "Curated Recipe Gallery");
      expect(container.textContent).toContain("Curated Recipe Gallery");

      await act(async () => {
        window.location.hash = "#playground/spring-physics";
        window.dispatchEvent(new HashChangeEvent("hashchange"));
      });
      await waitForText(container, "Spring Physics Solver");
      expect(container.textContent).toContain("Spring Physics Solver");

      await act(async () => {
        window.location.hash = "#unknown-invalid-route";
        window.dispatchEvent(new HashChangeEvent("hashchange"));
      });
      await waitForText(container, "404 ? Route Not Found");
      expect(container.textContent).toContain("404 · Route Not Found");
      expect(container.textContent).toContain("#unknown-invalid-route");
    });

    it("routes mobile navigation drawer Get Started CTA to #onboarding", () => {
      const onClose = vi.fn();
      act(() => {
        root = createRoot(container);
        root.render(<MobileNavigation isOpen={true} onClose={onClose} activeRoute="features" />);
      });

      expect(container.textContent).toContain("Onboarding");
      const getStartedBtn = Array.from(container.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Get Started")
      );
      act(() => {
        getStartedBtn?.click();
      });
      expect(onClose).toHaveBeenCalled();
      expect(window.location.hash).toBe("#onboarding");
    });

    it("honors prefers-reduced-motion cleanly in FeaturesPage and OnboardingPage", () => {
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

      act(() => {
        root = createRoot(container);
        root.render(
          <MotionProvider>
            <div>
              <FeaturesPage />
              <OnboardingPage />
            </div>
          </MotionProvider>
        );
      });

      expect(container.textContent).toContain("Reduced Motion Static");
      expect(container.textContent).toContain("respectsReducedMotion=true");
    });
  });
});
