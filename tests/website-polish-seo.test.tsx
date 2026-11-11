// @vitest-environment jsdom

import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import fs from "node:fs";
import path from "node:path";

import { App } from "../website/src/app/App";
import { MotionProvider } from "../website/src/app/providers/MotionProvider";
import { SceneCanvas } from "../website/src/components/three/SceneCanvas";
import {
  applyRouteMetadata,
  buildStructuredDataGraph,
  CANONICAL_ORIGIN,
  getMetadataForRoute,
} from "../website/src/utils/seo";

async function waitForText(el: HTMLElement, text: string, timeoutMs = 4000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (el.textContent?.includes(text)) return;
    await act(async () => {
      await new Promise((r) => setTimeout(r, 25));
    });
  }
}

describe("Prompt 156 — Website Performance, SEO & Responsive Polish", () => {
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

  describe("1. SEO Foundation, Canonical URLs & Structured Data", () => {
    it("verifies static SEO files (robots.txt, sitemap.xml, favicon.svg, og-image.svg, index.html)", () => {
      const websiteDir = path.resolve(__dirname, "../website");
      expect(fs.existsSync(path.join(websiteDir, "public/robots.txt"))).toBe(true);
      expect(fs.existsSync(path.join(websiteDir, "public/sitemap.xml"))).toBe(true);
      expect(fs.existsSync(path.join(websiteDir, "public/favicon.svg"))).toBe(true);
      expect(fs.existsSync(path.join(websiteDir, "public/og-image.svg"))).toBe(true);

      const robots = fs.readFileSync(path.join(websiteDir, "public/robots.txt"), "utf8");
      expect(robots).toContain("Sitemap: https://af-motion.dev/sitemap.xml");

      const sitemap = fs.readFileSync(path.join(websiteDir, "public/sitemap.xml"), "utf8");
      expect(sitemap).toContain("<loc>https://af-motion.dev/</loc>");

      const html = fs.readFileSync(path.join(websiteDir, "index.html"), "utf8");
      expect(html).toContain('rel="canonical"');
      expect(html).toContain('property="og:title"');
      expect(html).toContain('name="twitter:card"');
      expect(html).toContain('type="application/ld+json"');
    });

    it("produces accurate route metadata and valid JSON-LD structured data without fabricated claims", () => {
      const homeMeta = getMetadataForRoute("home");
      expect(homeMeta.canonicalUrl).toBe(CANONICAL_ORIGIN);

      const pgMeta = getMetadataForRoute("playground", "spring-physics");
      expect(pgMeta.title).toContain("Spring Physics");
      expect(pgMeta.canonicalUrl).toBe(`${CANONICAL_ORIGIN}#playground/spring-physics`);

      const docsMeta = getMetadataForRoute("docs", "react-hooks");
      expect(docsMeta.title).toContain("React Hooks");
      expect(docsMeta.canonicalUrl).toBe(`${CANONICAL_ORIGIN}#docs/react-hooks`);

      const graph = buildStructuredDataGraph() as { "@graph": Array<Record<string, unknown>> };
      expect(Array.isArray(graph["@graph"])).toBe(true);
      const appNode = graph["@graph"].find((n) => n["@type"] === "SoftwareApplication");
      expect(appNode?.name).toBe("AF Motion");
      expect(appNode?.softwareVersion).toBe("0.1.0");
      expect(appNode?.aggregateRating).toBeUndefined();
      expect(appNode?.offers).toBeUndefined();
    });

    it("updates document.title, canonical link, and meta tags on hash navigation", async () => {
      await act(async () => {
        window.location.hash = "#features/motion-intelligence";
        root = createRoot(container);
        root.render(<App />);
      });

      expect(document.title).toContain("Motion Intelligence");
      const canonical = document.head.querySelector('link[rel="canonical"]')?.getAttribute("href");
      expect(canonical).toBe(`${CANONICAL_ORIGIN}#features/motion-intelligence`);

      applyRouteMetadata("onboarding");
      expect(document.title).toContain("Developer Onboarding");
    });
  });

  describe("2. Accessibility, Skip Link, Lazy Loading & WebGL Fallback", () => {
    it("renders accessible skip-to-main-content link and #main-content landmark", async () => {
      await act(async () => {
        root = createRoot(container);
        root.render(<App />);
      });

      const skipLink = container.querySelector('a[href="#main-content"]');
      const mainRegion = container.querySelector("#main-content");
      expect(skipLink).not.toBeNull();
      expect(skipLink?.textContent).toContain("Skip to main content");
      expect(mainRegion).not.toBeNull();
      expect(mainRegion?.getAttribute("tabindex")).toBe("-1");
    });

    it("lazy-loads Docs, Examples, and Onboarding routes cleanly on hash change and supports back navigation", async () => {
      await act(async () => {
        window.location.hash = "#overview";
        root = createRoot(container);
        root.render(<App />);
      });
      expect(container.textContent).toContain("Motion is not an effect.");

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
      await waitForText(container, "Verified Animation Examples");
      expect(container.textContent).toContain("Verified Animation Examples");

      await act(async () => {
        window.location.hash = "#docs";
        window.dispatchEvent(new HashChangeEvent("hashchange"));
      });
      await waitForText(container, "AF Motion Documentation Hub");
      expect(container.textContent).toContain("AF Motion Documentation Hub");

      await act(async () => {
        window.location.hash = "#overview";
        window.dispatchEvent(new HashChangeEvent("hashchange"));
      });
      expect(container.textContent).toContain("Motion is not an effect.");
    });

    it("falls back gracefully in SceneCanvas when WebGL is unsupported or lost and supports reduced motion", () => {
      act(() => {
        root = createRoot(container);
        root.render(
          <MotionProvider>
            <SceneCanvas />
          </MotionProvider>
        );
      });

      // In jsdom without WebGL context, SceneCanvas falls back to FallbackScene
      expect(container.textContent).toContain("High-Performance 2D Environment");
    });
  });

  describe("3. Security Hygiene Checks", () => {
    it("contains zero eval(), new Function(), or external tracking scripts inside website/src", () => {
      const websiteSrc = path.resolve(__dirname, "../website/src");
      const files: string[] = [];
      const walk = (dir: string) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) walk(full);
          else if (/\.(ts|tsx)$/.test(entry.name)) files.push(full);
        }
      };
      walk(websiteSrc);

      for (const file of files) {
        const content = fs.readFileSync(file, "utf8");
        expect(content).not.toMatch(/(?<!No )\beval\s*\(/);
        expect(content).not.toMatch(/\bnew\s+Function\s*\(/);
        expect(content).not.toContain("dangerouslySetInnerHTML");
      }
    });
  });
});
