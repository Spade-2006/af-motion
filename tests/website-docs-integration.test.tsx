// @vitest-environment jsdom

import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { App } from "../website/src/app/App";
import { MotionProvider } from "../website/src/app/providers/MotionProvider";
import { DocsPage } from "../website/src/pages/DocsPage";
import { ExamplesPage } from "../website/src/pages/ExamplesPage";
import {
  getAllSections,
  getAllArticles,
  PUBLIC_API_INVENTORY,
} from "../website/src/docs/data/docsBridge";

describe("Prompt 155 — Website Documentation & Examples Integration", () => {
  let container: HTMLDivElement;
  let root: Root | null = null;

  beforeEach(() => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    window.location.hash = "";
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
    container.remove();
  });

  function setInputValue(input: HTMLInputElement, value: string) {
    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value"
    )?.set;
    setter?.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  describe("1. Documentation Hub Discovery, Categories & Learning Paths", () => {
    it("exposes all real Docs sections, articles, API inventory, and learning paths", () => {
      const sections = getAllSections();
      const articles = getAllArticles();

      act(() => {
        root = createRoot(container);
        root.render(
          <MotionProvider>
            <DocsPage />
          </MotionProvider>
        );
      });

      expect(sections.length).toBeGreaterThanOrEqual(10);
      expect(articles.length).toBeGreaterThanOrEqual(30);
      expect(PUBLIC_API_INVENTORY.totalExports).toBe(1940);

      expect(container.textContent).toContain("AF Motion Documentation Hub");
      expect(container.textContent).toContain(`${sections.length} Official Sections`);
      expect(container.textContent).toContain(`${articles.length} Documentation Articles`);
      expect(container.textContent).toContain("1,940 Exports");
      expect(container.textContent).toContain("Beginner Path");
      expect(container.textContent).toContain("Intermediate Path");
      expect(container.textContent).toContain("Advanced Path");
      expect(container.textContent).toContain("Suggested Learning Order");
    });

    it("switches API inventory subpaths and filters exported symbol names", () => {
      act(() => {
        root = createRoot(container);
        root.render(
          <MotionProvider>
            <DocsPage />
          </MotionProvider>
        );
      });

      expect(container.textContent).toContain("af-motion");
      expect(container.textContent).toContain("animateSpring");

      const reactSubpathTab = Array.from(
        container.querySelectorAll('[role="tab"]')
      ).find((el) => el.textContent?.includes("af-motion/react")) as
        | HTMLButtonElement
        | undefined;
      expect(reactSubpathTab).toBeDefined();

      act(() => {
        reactSubpathTab?.click();
      });

      const filterInput = container.querySelector(
        'input[aria-label="Filter exports in af-motion/react"]'
      ) as HTMLInputElement | null;
      expect(filterInput).not.toBeNull();

      act(() => {
        if (filterInput) setInputValue(filterInput, "useAnimate");
      });
      expect(container.textContent).toContain("useAnimate");
    });
  });

  describe("2. Documentation Search, Section Filtering & Keyboard Navigation", () => {
    it("searches titles and content, highlights matches, handles section filters and empty states", () => {
      act(() => {
        root = createRoot(container);
        root.render(
          <MotionProvider>
            <DocsPage />
          </MotionProvider>
        );
      });

      const searchInput = container.querySelector(
        'input[aria-label="Search documentation articles, headings, and content"]'
      ) as HTMLInputElement | null;
      expect(searchInput).not.toBeNull();

      act(() => {
        if (searchInput) setInputValue(searchInput, "Spring");
      });

      expect(container.querySelectorAll("mark").length).toBeGreaterThan(0);
      expect(container.textContent).toContain("Advanced Animation & Physics");

      // Filter by empty match
      act(() => {
        if (searchInput) setInputValue(searchInput, "zzz-nonexistent-query-token");
      });
      expect(container.querySelector('[data-testid="docs-search-empty"]')).not.toBeNull();

      // Clear button resets query cleanly
      const clearBtn = container.querySelector(
        'button[aria-label="Clear documentation search"]'
      ) as HTMLButtonElement | null;
      act(() => {
        clearBtn?.click();
      });
      expect(searchInput?.value).toBe("");
    });

    it("supports section filter tabs and keyboard ArrowDown + Enter navigation", async () => {
      await act(async () => {
        window.location.hash = "#docs";
        root = createRoot(container);
        root.render(<App />);
      });

      const reactSectionTab = Array.from(
        container.querySelectorAll('[role="tab"]')
      ).find((el) => el.textContent?.trim() === "React Animation Development") as
        | HTMLButtonElement
        | undefined;
      act(() => {
        reactSectionTab?.click();
      });
      expect(container.textContent).toContain("1 of 10 Sections");

      const searchInput = container.querySelector(
        'input[aria-label="Search documentation articles, headings, and content"]'
      ) as HTMLInputElement;

      act(() => {
        setInputValue(searchInput, "Hooks");
      });
      act(() => {
        searchInput.dispatchEvent(
          new KeyboardEvent("keydown", { key: "Enter", bubbles: true })
        );
      });

      await act(async () => {
        window.dispatchEvent(new HashChangeEvent("hashchange"));
      });

      expect(window.location.hash).toBe("#docs/react-hooks");
      expect(container.textContent).toContain("React Hooks Reference");
    });
  });

  describe("3. Article Deep-Links, Interactive Widgets & Cross-Links", () => {
    it("renders deep-linked articles with Playground CTAs, Related Examples, and lazy DocsInteractiveHub", async () => {
      await act(async () => {
        window.location.hash = "#docs/easings";
        root = createRoot(container);
        root.render(<App />);
      });

      expect(container.textContent).toContain("56 Built-in Easings & Curves");
      expect(container.textContent).toContain("Try in Website Playground");
      expect(container.textContent).toContain("Related Examples");

      const widgetBtn = Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent?.includes("Launch Docs Interactive Widget")
      );
      expect(widgetBtn).toBeDefined();

      await act(async () => {
        widgetBtn?.click();
        await new Promise((r) => setTimeout(r, 80));
      });
      expect(container.textContent).toContain("Hide Docs Widget");
    });

    it("provides bidirectional links from ExamplesPage back into #docs articles", () => {
      act(() => {
        root = createRoot(container);
        root.render(
          <MotionProvider>
            <ExamplesPage />
          </MotionProvider>
        );
      });

      expect(container.textContent).toContain("Docs: Quickstart Guide");
      expect(container.textContent).toContain("Docs: Effects & Interactive Primitives");
    });

    it("supports back/forward navigation across Features -> Docs -> Article -> Playground -> Onboarding and invalid routes", async () => {
      await act(async () => {
        window.location.hash = "#features";
        root = createRoot(container);
        root.render(<App />);
      });
      expect(container.textContent).toContain("AF Motion Feature Capabilities");

      for (const [hash, expectedText] of [
        ["#docs", "AF Motion Documentation Hub"],
        ["#docs/choreography", "Multi-Track Choreography"],
        ["#examples", "Verified Animation Examples"],
        ["#playground/spring-physics", "Spring Physics Solver"],
        ["#onboarding", "Get Started with AF Motion in Minutes"],
        ["#docs/missing-article-slug", 'Documentation Article "missing-article-slug" Not Found'],
        ["#completely-invalid-route", "404 · Route Not Found"],
      ] as const) {
        await act(async () => {
          window.location.hash = hash;
          window.dispatchEvent(new HashChangeEvent("hashchange"));
        });
        const deadline = Date.now() + 3000;
        while (Date.now() < deadline && !container.textContent?.includes(expectedText)) {
          await act(async () => { await new Promise((r) => setTimeout(r, 25)); });
        }
        expect(container.textContent).toContain(expectedText);
      }
    });

    it("honors prefers-reduced-motion cleanly in DocsPage", () => {
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
            <DocsPage />
          </MotionProvider>
        );
      });

      expect(container.textContent).toContain("AF Motion Documentation Hub");
    });
  });
});
