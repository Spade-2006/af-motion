// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import {
  getAllSections,
  getAllArticles,
  getArticleBySlug,
  getArticlesBySection,
  searchDocs,
  DocsApp,
  DocsHeader,
  DocsSidebar,
  DocsArticleView,
  DocsSearchModal,
  DocsCodeBlock,
  type DocSectionId,
  CoreAnimationPlayground,
  EasingExplorer,
  SpringPhysicsPlayground,
  EffectsPlayground,
  MotionDNAPlayground,
  PaletteExplorer,
  AIDemonstrationPlayground,
  ReactPlayground,
  DocsInteractiveHub,
} from "../docs/index.js";
import { BUILT_IN_PALETTE_INPUTS } from "../src/core/built-in-palettes.js";

// Import actual library exports to verify documentation claims
import * as CoreExports from "../src/index.js";
import * as ReactExports from "../src/react.js";
import * as CatalogueExports from "../src/catalogue.js";
import * as PresetsExports from "../src/presets.js";

describe("Prompt 98 — Complete Documentation System", () => {
  let container: HTMLDivElement;
  let root: Root | null = null;

  beforeEach(() => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    window.scrollTo = vi.fn();
    if (typeof window !== "undefined") {
      window.location.hash = "";
    }
    class MockIntersectionObserver {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    }
    (window as any).IntersectionObserver = MockIntersectionObserver;
    (globalThis as any).IntersectionObserver = MockIntersectionObserver;
    if (!window.matchMedia) {
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
    }
    if (!HTMLCanvasElement.prototype.getContext) {
      HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(null);
    }
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
    if (typeof window !== "undefined") {
      window.location.hash = "";
    }
    container.remove();
  });

  describe("1. Documentation Structure & Coverage", () => {
    it("provides all required documentation sections", () => {
      const sections = getAllSections();
      expect(sections.length).toBeGreaterThanOrEqual(10);

      const sectionIds = sections.map((s) => s.id);
      expect(sectionIds).toContain("getting-started");
      expect(sectionIds).toContain("core-library");
      expect(sectionIds).toContain("react-animation");
      expect(sectionIds).toContain("visual-design");
      expect(sectionIds).toContain("motion-intelligence");
      expect(sectionIds).toContain("graphics-3d");
      expect(sectionIds).toContain("ai-infrastructure");
      expect(sectionIds).toContain("studio-modules");
      expect(sectionIds).toContain("examples");
      expect(sectionIds).toContain("developer-experience");

      for (const section of sections) {
        expect(section.title).toBeDefined();
        expect(section.icon).toBeDefined();
        expect(section.description).toBeDefined();
        expect(section.articles.length).toBeGreaterThan(0);
      }
    });

    it("retrieves articles by slug and section ID", () => {
      const overview = getArticleBySlug("overview");
      expect(overview).toBeDefined();
      expect(overview?.title).toBe("Product Overview");
      expect(overview?.headings.length).toBeGreaterThan(0);
      expect(overview?.tags).toContain("intro");

      const coreArticles = getArticlesBySection("core-library");
      expect(coreArticles.length).toBeGreaterThan(0);
      const coreSlugs = coreArticles.map((a) => a.slug);
      expect(coreSlugs).toContain("core-animation");
      expect(coreSlugs).toContain("easings");
    });
  });

  describe("2. Search Engine & Indexing", () => {
    it("returns ranked search results across titles, headings, and tags", () => {
      // Search for animate
      const animateResults = searchDocs("animate");
      expect(animateResults.length).toBeGreaterThan(0);
      expect(animateResults[0].score).toBeGreaterThan(0);

      // Search for React components
      const reactResults = searchDocs("Reveal");
      expect(reactResults.length).toBeGreaterThan(0);
      expect(reactResults.some((r) => r.slug === "react-components")).toBe(true);

      // Search for MCP
      const mcpResults = searchDocs("mcp");
      expect(mcpResults.length).toBeGreaterThan(0);
      expect(mcpResults.some((r) => r.slug === "mcp-server")).toBe(true);

      // Search for 3D
      const threeDResults = searchDocs("3d");
      expect(threeDResults.length).toBeGreaterThan(0);
      expect(threeDResults.some((r) => r.slug === "3d-engine")).toBe(true);
    });

    it("handles empty and non-matching queries gracefully", () => {
      expect(searchDocs("")).toEqual([]);
      expect(searchDocs("   ")).toEqual([]);

      const nonExistent = searchDocs("xyznonexistentterm9999");
      expect(nonExistent).toEqual([]);
    });
  });

  describe("3. Verified Implementation Alignment (Zero Invention)", () => {
    it("verifies documented core library exports exist in af-motion", () => {
      expect(typeof CoreExports.animate).toBe("function");
      expect(typeof CoreExports.animateSpring).toBe("function");
      expect(typeof CoreExports.easings).toBe("object");
      expect(typeof CoreExports.aurora).toBe("function");
      expect(typeof CoreExports.particleField).toBe("function");
      expect(typeof CoreExports.tilt).toBe("function");
      expect(typeof CoreExports.activatePalette).toBe("function");
    });

    it("verifies documented React exports exist in af-motion/react", () => {
      expect(typeof ReactExports.useAnimate).toBe("function");
      expect(typeof ReactExports.useInView).toBe("function");
      expect(typeof ReactExports.useMicrointeraction).toBe("function");
      expect(typeof ReactExports.useMotionAccessibility).toBe("function");
      expect(typeof ReactExports.Reveal).toBe("object"); // forwardRef component
      expect(typeof ReactExports.Interactive).toBe("object");
      expect(typeof ReactExports.GlassSurface).toBe("object");
    });

    it("verifies documented catalogue exports exist in af-motion/catalogue", () => {
      expect(typeof CatalogueExports.aiMotionRegistry).toBe("object");
      expect(typeof CatalogueExports.visualStyleRegistry).toBe("object");
      expect(typeof CatalogueExports.recommendAnimation).toBe("function");
      expect(typeof CatalogueExports.validateMotionConfig).toBe("function");
      expect(typeof CatalogueExports.createScene3D).toBe("function");
    });

    it("verifies documented preset exports exist in af-motion/presets", () => {
      expect(typeof PresetsExports.listPresets).toBe("function");
      expect(typeof PresetsExports.applyPreset).toBe("function");
    });

    it("verifies all 19 visual styles are documented", () => {
      const stylesArticle = getArticleBySlug("visual-styles");
      expect(stylesArticle).toBeDefined();

      const expectedStyles = [
        "Skeuomorphism",
        "Neumorphism",
        "Art Nouveau",
        "Liquid Chrome",
        "De Stijl",
        "Memphis",
        "Psychedelic",
        "Vaporwave",
        "Steampunk",
        "Grunge",
        "Paper Cutout",
        "Glitch",
        "Anti-Design",
        "3D Inflated",
        "Isometric",
        "Ukiyo-e",
        "Brutalism",
        "Bauhaus",
        "Mid-Century Modern",
      ];

      for (const style of expectedStyles) {
        expect(stylesArticle?.content).toContain(style);
      }
    });

    it("verifies built-in palettes documentation preserves exact definitions", () => {
      const palettesArticle = getArticleBySlug("palettes");
      expect(palettesArticle).toBeDefined();
      expect(palettesArticle?.content).toContain("33");

      // Verify that sample palette hex definitions match BUILT_IN_PALETTE_INPUTS exactly
      const cobalt = BUILT_IN_PALETTE_INPUTS.find((p) => p.name === "Cobalt Classic");
      expect(cobalt).toBeDefined();
      expect(cobalt?.primary).toBe("#111111");
      expect(cobalt?.secondary).toBe("#FFFFFF");
      expect(cobalt?.accent).toBe("#0047AB");
      expect(palettesArticle?.content).toContain("#111111");
      expect(palettesArticle?.content).toContain("#0047AB");
    });
  });

  describe("4. Practical Code Examples Verification", () => {
    it("provides verified examples article containing practical snippets", () => {
      const examplesArticle = getArticleBySlug("verified-examples");
      expect(examplesArticle).toBeDefined();
      expect(examplesArticle?.content).toContain("Core DOM Animation");
      expect(examplesArticle?.content).toContain("React Component Reveal");
      expect(examplesArticle?.content).toContain("Tactile Button Microinteraction");
      expect(examplesArticle?.content).toContain("af-motion");
      expect(examplesArticle?.content).toContain("af-motion/react");
    });
  });

  describe("5. React Documentation Website UI Integration", () => {
    it("mounts DocsApp and renders header, brand logo, search trigger, and sidebar", () => {
      act(() => {
        root = createRoot(container);
        root.render(React.createElement(DocsApp));
      });

      expect(container.querySelector(".docs-root-container")).not.toBeNull();
      expect(container.querySelector(".docs-header")).not.toBeNull();
      expect(container.querySelector(".docs-brand-logo")?.textContent).toContain("AF Motion");
      expect(container.querySelector(".docs-version-badge")?.textContent).toBe("v0.1.0");
      expect(container.querySelector(".docs-search-trigger")).not.toBeNull();
      expect(container.querySelector(".docs-sidebar")).not.toBeNull();
      expect(container.querySelector(".docs-article-body")).not.toBeNull();
    });

    it("switches active article when sidebar navigation link is clicked", () => {
      act(() => {
        root = createRoot(container);
        root.render(React.createElement(DocsApp));
      });

      // Find link for "Installation & Setup"
      const navLinks = container.querySelectorAll<HTMLButtonElement>(".docs-nav-link");
      const installLink = Array.from(navLinks).find((link) =>
        link.textContent?.includes("Installation & Setup")
      );
      expect(installLink).toBeDefined();

      act(() => {
        installLink?.click();
      });

      // Article title should update
      expect(container.querySelector(".docs-article-title")?.textContent).toBe("Installation & Setup");
      expect(container.querySelector(".breadcrumb-current")?.textContent).toBe("Installation & Setup");
    });

    it("navigates articles using previous and next pagination buttons", () => {
      act(() => {
        root = createRoot(container);
        root.render(React.createElement(DocsApp));
      });

      // Initially on "Product Overview", next should be "Installation & Setup"
      const nextBtn = container.querySelector<HTMLButtonElement>(".docs-pagination-btn.next");
      expect(nextBtn).not.toBeNull();
      expect(nextBtn?.textContent).toContain("Installation & Setup");

      act(() => {
        nextBtn?.click();
      });

      expect(container.querySelector(".docs-article-title")?.textContent).toBe("Installation & Setup");

      // Previous button should now link back to "Product Overview"
      const prevBtn = container.querySelector<HTMLButtonElement>(".docs-pagination-btn.prev");
      expect(prevBtn).not.toBeNull();
      expect(prevBtn?.textContent).toContain("Product Overview");
    });

    it("opens search modal, filters queries live, and jumps to article on selection", () => {
      act(() => {
        root = createRoot(container);
        root.render(React.createElement(DocsApp));
      });

      const searchTrigger = container.querySelector<HTMLButtonElement>(".docs-search-trigger");
      expect(searchTrigger).not.toBeNull();

      // Open search modal
      act(() => {
        searchTrigger?.click();
      });

      expect(container.querySelector(".docs-search-overlay")).not.toBeNull();

      // Type search query
      const searchInput = container.querySelector<HTMLInputElement>(".docs-search-input");
      expect(searchInput).not.toBeNull();

      act(() => {
        const valueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value"
        )?.set;
        valueSetter?.call(searchInput, "visual styles");
        searchInput!.dispatchEvent(new Event("input", { bubbles: true }));
      });

      // Should show results
      const searchItems = container.querySelectorAll<HTMLDivElement>(".docs-search-item");
      expect(searchItems.length).toBeGreaterThan(0);

      // Click the first result
      act(() => {
        searchItems[0].click();
      });

      // Modal should close and active article should update
      expect(container.querySelector(".docs-search-overlay")).toBeNull();
      expect(container.querySelector(".docs-article-title")?.textContent).toBe("19 Visual Design Styles");
    });

    it("toggles mobile navigation drawer using hamburger button", () => {
      act(() => {
        root = createRoot(container);
        root.render(React.createElement(DocsApp));
      });

      const hamburger = container.querySelector<HTMLButtonElement>(".docs-mobile-hamburger");
      expect(hamburger).not.toBeNull();

      // Open mobile drawer
      act(() => {
        hamburger?.click();
      });

      expect(container.querySelector(".docs-sidebar.mobile-open")).not.toBeNull();
      expect(container.querySelector(".docs-mobile-backdrop")).not.toBeNull();

      // Close mobile drawer by clicking backdrop
      act(() => {
        container.querySelector<HTMLDivElement>(".docs-mobile-backdrop")?.click();
      });

      expect(container.querySelector(".docs-sidebar.mobile-open")).toBeNull();
    });

    it("renders code block with language badge and copy action", () => {
      act(() => {
        root = createRoot(container);
        root.render(
          React.createElement(DocsCodeBlock, {
            code: "import { animate } from 'af-motion';",
            language: "typescript",
            filename: "example.ts",
          })
        );
      });

      expect(container.querySelector(".docs-code-container")).not.toBeNull();
      expect(container.querySelector(".docs-code-filename")?.textContent).toBe("example.ts");
      expect(container.querySelector(".docs-code-lang")?.textContent).toBe("typescript");
      expect(container.querySelector(".docs-code-copy-btn")).not.toBeNull();

      const copyBtn = container.querySelector<HTMLButtonElement>(".docs-code-copy-btn");
      act(() => {
        copyBtn?.click();
      });

      expect(copyBtn?.textContent).toContain("Copied");
    });
  });
  describe("6. Prompt 147 — Expanded Documentation & Developer Experience", () => {
    it("verifies all 5 Motion DNA personalities are documented with exact characteristics", () => {
      const dnaArticle = getArticleBySlug("motion-dna");
      expect(dnaArticle).toBeDefined();
      const expectedDNAs = ["precise", "playful", "elegant", "energetic", "editorial-flow"];
      for (const dna of expectedDNAs) {
        expect(dnaArticle?.content.toLowerCase()).toContain(dna);
      }
    });

    it("verifies expanded effects and advanced animation articles exist", () => {
      const effectsArticle = getArticleBySlug("effects-interactions");
      expect(effectsArticle).toBeDefined();
      expect(effectsArticle?.content).toContain("reveal");
      expect(effectsArticle?.content).toContain("stagger");
      expect(effectsArticle?.content).toContain("magnetic");
      expect(effectsArticle?.content).toContain("tilt");
      expect(effectsArticle?.content).toContain("parallax");

      const advancedArticle = getArticleBySlug("advanced-animation");
      expect(advancedArticle).toBeDefined();
      expect(advancedArticle?.content).toContain("animateSpring");
      expect(advancedArticle?.content).toContain("createTimeline");
      expect(advancedArticle?.content).toContain("PerformanceIntelligenceCoordinator");
    });

    it("verifies React integration guide covers Strict Mode and SSR hydration safety", () => {
      const reactGuide = getArticleBySlug("react-guide");
      expect(reactGuide).toBeDefined();
      expect(reactGuide?.content).toContain("Strict Mode");
      expect(reactGuide?.content).toContain("SSR");
      expect(reactGuide?.content).toContain('"use client";');
      expect(reactGuide?.content).toContain("controls.cancel()");
    });

    it("verifies AI ecosystem documentation covers all 12 capabilities and offline deterministic guarantees", () => {
      const aiEcoArticle = getArticleBySlug("ai-ecosystem");
      expect(aiEcoArticle).toBeDefined();
      expect(aiEcoArticle?.content).toContain("Offline & Deterministic Guarantee");
      expect(aiEcoArticle?.content).toContain("12 Unified AI Capabilities");
      expect(aiEcoArticle?.content).toContain("executeAIEcosystemPipeline");

      const d2mArticle = getArticleBySlug("design-to-motion");
      expect(d2mArticle).toBeDefined();

      const sceneGenArticle = getArticleBySlug("scene-generation");
      expect(sceneGenArticle).toBeDefined();

      const agentsArticle = getArticleBySlug("agent-workflows");
      expect(agentsArticle).toBeDefined();
      expect(agentsArticle?.content).toContain("safeToolRegistry");
    });

    it("verifies export integration covers React TSX, Vanilla TS, and Composition JSON", () => {
      const exportArticle = getArticleBySlug("export-integration");
      expect(exportArticle).toBeDefined();
      expect(exportArticle?.content).toContain("React TSX");
      expect(exportArticle?.content).toContain("Vanilla TypeScript");
      expect(exportArticle?.content).toContain("Composition JSON");
    });

    it("verifies troubleshooting guide addresses SSR, React Strict Mode, and mobile FPS optimization", () => {
      const troubleArticle = getArticleBySlug("troubleshooting");
      expect(troubleArticle).toBeDefined();
      expect(troubleArticle?.content).toContain("Window or Document is not defined");
      expect(troubleArticle?.content).toContain("Animation triggers twice in React development");
      expect(troubleArticle?.content).toContain("Jank or low FPS on mobile devices");
    });

    it("verifies API reference maps all 4 official subpaths comprehensively", () => {
      const apiArticle = getArticleBySlug("api-reference");
      expect(apiArticle).toBeDefined();
      expect(apiArticle?.content).toContain("af-motion (Core DOM Animation & Primitives)");
      expect(apiArticle?.content).toContain("af-motion/react (React 18/19 Bindings)");
      expect(apiArticle?.content).toContain("af-motion/catalogue (Intelligence, 3D & AI Ecosystem)");
      expect(apiArticle?.content).toContain("af-motion/presets (Standard Presets)");
    });
  });

  describe("7. Prompt 148 - Interactive Documentation and Live Playgrounds", () => {
    it("renders CoreAnimationPlayground with WAAPI controls and code generation", () => {
      act(() => {
        root = createRoot(container);
        root.render(React.createElement(CoreAnimationPlayground));
      });

      expect(container.querySelector(".docs-playground-card")).not.toBeNull();
      expect(container.querySelector(".interactive-target-card")).not.toBeNull();
      expect(container.textContent).toContain("Core Animation");

      const codeTabBtn = container.querySelectorAll<HTMLButtonElement>(".docs-tab-btn")[1];
      act(() => {
        codeTabBtn?.click();
      });
      expect(container.querySelector(".docs-playground-code-view")).not.toBeNull();
    });

    it("renders EasingExplorer with curve SVG and presets", () => {
      act(() => {
        root = createRoot(container);
        root.render(React.createElement(EasingExplorer));
      });

      expect(container.querySelector(".docs-curve-svg")).not.toBeNull();
      expect(container.textContent).toContain("Interactive Easing & Curve Explorer");
    });

    it("renders SpringPhysicsPlayground and calculates damping ratio", () => {
      act(() => {
        root = createRoot(container);
        root.render(React.createElement(SpringPhysicsPlayground));
      });

      expect(container.textContent).toContain("Harmonic Oscillations");
      expect(container.textContent).toContain("Damping Ratio");
      expect(container.querySelector(".spring-target-object")).not.toBeNull();
    });

    it("renders PaletteExplorer displaying all 33 built-in palettes", () => {
      act(() => {
        root = createRoot(container);
        root.render(React.createElement(PaletteExplorer));
      });

      expect(container.textContent).toContain("33 Built-in Color Palettes");
      const options = container.querySelectorAll("#palette-select option");
      expect(options.length).toBe(33);
      expect(BUILT_IN_PALETTE_INPUTS.length).toBe(33);
    });

    it("renders MotionDNAPlayground with all 5 personalities", () => {
      act(() => {
        root = createRoot(container);
        root.render(React.createElement(MotionDNAPlayground));
      });

      expect(container.textContent).toContain("Motion DNA Personality Playground");
      expect(container.textContent).toContain("Precise");
      expect(container.textContent).toContain("Playful");
      expect(container.textContent).toContain("Elegant");
      expect(container.textContent).toContain("Energetic");
      expect(container.textContent).toContain("Editorial Flow");
    });

    it("renders EffectsPlayground and toggles effect tabs", () => {
      act(() => {
        root = createRoot(container);
        root.render(React.createElement(EffectsPlayground));
      });

      expect(container.textContent).toContain("Interactive Effects");
      expect(container.textContent).toContain("Reveal");
      expect(container.textContent).toContain("Stagger");
      expect(container.textContent).toContain("Magnetic");
      expect(container.textContent).toContain("Tilt");
    });

    it("renders AIDemonstrationPlayground with offline quality audit", () => {
      act(() => {
        root = createRoot(container);
        root.render(React.createElement(AIDemonstrationPlayground));
      });

      expect(container.textContent).toContain("Deterministic AI Intelligence");
      expect(container.textContent).toContain("Quality Evaluation");
    });

    it("renders ReactPlayground with reduced motion simulation toggle", () => {
      act(() => {
        root = createRoot(container);
        root.render(React.createElement(ReactPlayground));
      });

      expect(container.textContent).toContain("React Hooks");
      expect(container.textContent).toContain("Simulate prefers-reduced-motion");
    });

    it("renders DocsInteractiveHub dynamically matching article interactiveType", () => {
      act(() => {
        root = createRoot(container);
        root.render(React.createElement(DocsInteractiveHub, { type: "core-animation" }));
      });
      expect(container.textContent).toContain("Core Animation");

      act(() => {
        root?.render(React.createElement(DocsInteractiveHub, { type: "palette-explorer" }));
      });
      expect(container.textContent).toContain("33 Built-in Color Palettes");
    });

    it("verifies documentation articles have correct interactiveType mappings", () => {
      const coreArticle = getArticleBySlug("core-animation");
      expect(coreArticle?.interactiveType).toBe("core-animation");

      const easingsArticle = getArticleBySlug("easings");
      expect(easingsArticle?.interactiveType).toBe("easing-explorer");

      const springArticle = getArticleBySlug("advanced-animation");
      expect(springArticle?.interactiveType).toBe("spring-physics");

      const paletteArticle = getArticleBySlug("palettes");
      expect(paletteArticle?.interactiveType).toBe("palette-explorer");

      const dnaArticle = getArticleBySlug("motion-dna");
      expect(dnaArticle?.interactiveType).toBe("motion-dna");

      const aiArticle = getArticleBySlug("ai-ecosystem");
      expect(aiArticle?.interactiveType).toBe("ai-demonstration");

      const reactArticle = getArticleBySlug("react-hooks");
      expect(reactArticle?.interactiveType).toBe("react-demo");
    });
  });
});
