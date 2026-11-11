// @vitest-environment jsdom

import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import fs from "node:fs";
import path from "node:path";

// Website Design System Components
import { PageContainer } from "../website/src/components/layout/PageContainer";
import { SectionContainer } from "../website/src/components/layout/SectionContainer";
import { SectionHeading } from "../website/src/components/layout/SectionHeading";
import { GridLayout } from "../website/src/components/layout/GridLayout";
import { PageTransition } from "../website/src/components/layout/PageTransition";

import { Button } from "../website/src/components/ui/Button";
import { IconButton } from "../website/src/components/ui/IconButton";
import { Badge } from "../website/src/components/ui/Badge";
import { Tag } from "../website/src/components/ui/Tag";
import { Card } from "../website/src/components/ui/Card";
import { Tooltip } from "../website/src/components/ui/Tooltip";
import { Divider } from "../website/src/components/ui/Divider";
import { CodeLabel } from "../website/src/components/ui/CodeLabel";

import { MotionReveal } from "../website/src/components/motion/MotionReveal";
import { MotionStagger } from "../website/src/components/motion/MotionStagger";
import { MagneticElement } from "../website/src/components/motion/MagneticElement";
import { MotionText } from "../website/src/components/motion/MotionText";
import { ScrollProgress } from "../website/src/components/motion/ScrollProgress";

import { GradientSurface } from "../website/src/components/effects/GradientSurface";
import { GlowEffect } from "../website/src/components/effects/GlowEffect";
import { NoiseOverlay } from "../website/src/components/effects/NoiseOverlay";
import { GridBackground } from "../website/src/components/effects/GridBackground";
import { SectionDivider } from "../website/src/components/effects/SectionDivider";

import { FallbackScene } from "../website/src/components/three/FallbackScene";
import { ThreeErrorBoundary } from "../website/src/components/three/ThreeErrorBoundary";
import { detectWebGLSupport } from "../website/src/utils/webgl";

import { Navbar } from "../website/src/components/navigation/Navbar";
import { NavLinks } from "../website/src/components/navigation/NavLinks";
import { MobileNavigation } from "../website/src/components/navigation/MobileNavigation";
import { Footer } from "../website/src/components/navigation/Footer";

import { App } from "../website/src/app/App";
import { HomePage } from "../website/src/pages/HomePage";
import { FeaturesPage } from "../website/src/pages/FeaturesPage";
import { PlaygroundPage } from "../website/src/pages/PlaygroundPage";
import { DocsPage } from "../website/src/pages/DocsPage";
import { ExamplesPage } from "../website/src/pages/ExamplesPage";

import { THEME_TOKENS } from "../website/src/config/tokens";
import { SITE_CONFIG } from "../website/src/config/site";
import { MAIN_NAV_ITEMS } from "../website/src/config/navigation";
import { BUILT_IN_PALETTE_INPUTS } from "../src/core/built-in-palettes";

describe("Prompt 151 — Standalone Website Architecture & Design System", () => {
  let container: HTMLDivElement;
  let root: Root | null = null;

  beforeEach(() => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);

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
  });

  afterEach(() => {
    if (root) {
      act(() => {
        root?.unmount();
      });
      root = null;
    }
    container.remove();
  });

  // =========================================================================
  // 1. Repository Architecture & Configuration Inspection
  // =========================================================================
  describe("1. Repository Architecture & Configuration", () => {
    const websiteDir = path.resolve(__dirname, "../website");

    it("verifies website project directory structure exists", () => {
      expect(fs.existsSync(path.join(websiteDir, "package.json"))).toBe(true);
      expect(fs.existsSync(path.join(websiteDir, "tsconfig.json"))).toBe(true);
      expect(fs.existsSync(path.join(websiteDir, "vite.config.ts"))).toBe(true);
      expect(fs.existsSync(path.join(websiteDir, "index.html"))).toBe(true);
      expect(fs.existsSync(path.join(websiteDir, "README.md"))).toBe(true);
    });

    it("declares isolated dependencies in website/package.json", () => {
      const pkg = JSON.parse(
        fs.readFileSync(path.join(websiteDir, "package.json"), "utf8")
      );
      expect(pkg.name).toBe("af-motion-website");
      expect(pkg.dependencies.three).toBeDefined();
      expect(pkg.dependencies["@react-three/fiber"]).toBeDefined();
      expect(pkg.dependencies["@react-three/drei"]).toBeDefined();
      expect(pkg.dependencies["lucide-react"]).toBeDefined();
    });

    it("configures Tailwind and AF Motion subpath aliases in website/vite.config.ts", () => {
      const configText = fs.readFileSync(
        path.join(websiteDir, "vite.config.ts"),
        "utf8"
      );
      expect(configText).toContain("tailwindcss");
      expect(configText).toContain("af-motion");
      expect(configText).toContain("src/index.ts");
      expect(configText).toContain("src/react.ts");
    });
  });

  // =========================================================================
  // 2. Design Tokens & Site Configuration
  // =========================================================================
  describe("2. Design Tokens & Site Configuration", () => {
    it("defines comprehensive cinematic dark tokens", () => {
      expect(THEME_TOKENS.colors.background.primary).toBe("#07080a");
      expect(THEME_TOKENS.colors.background.card).toBe("#131620");
      expect(THEME_TOKENS.colors.accents.cyan).toBe("#38bdf8");
      expect(THEME_TOKENS.colors.accents.indigo).toBe("#6366f1");
      expect(THEME_TOKENS.colors.accents.violet).toBe("#a855f7");
      expect(THEME_TOKENS.typography.scales.hero).toBeDefined();
      expect(THEME_TOKENS.motion.spring.stiffness).toBe(280);
    });

    it("defines site metadata and navigation items", () => {
      expect(SITE_CONFIG.name).toBe("AF Motion");
      expect(SITE_CONFIG.stats.builtInPalettes).toBe(33);
      expect(SITE_CONFIG.stats.visualStyles).toBe(19);

      expect(MAIN_NAV_ITEMS.length).toBeGreaterThanOrEqual(6);
      const labels = MAIN_NAV_ITEMS.map((i) => i.label);
      expect(labels).toContain("Home");
      expect(labels).toContain("Features");
      expect(labels).toContain("Playground");
      expect(labels).toContain("Examples");
      expect(labels).toContain("Documentation");
    });
  });

  // =========================================================================
  // 3. Layout Components Rendering
  // =========================================================================
  describe("3. Layout Components Rendering", () => {
    it("renders PageContainer, SectionContainer, and SectionHeading", () => {
      act(() => {
        root = createRoot(container);
        root.render(
          <SectionContainer id="test-section" spacing="normal" surface="subtle">
            <PageContainer maxWidth="xl">
              <SectionHeading
                tag="Test Tag"
                title="Test Section Title"
                description="Test description text"
                align="center"
              />
              <GridLayout columns={3} gap="md">
                <div data-testid="item-1">Col 1</div>
                <div data-testid="item-2">Col 2</div>
                <div data-testid="item-3">Col 3</div>
              </GridLayout>
            </PageContainer>
          </SectionContainer>
        );
      });

      expect(container.textContent).toContain("Test Tag");
      expect(container.textContent).toContain("Test Section Title");
      expect(container.textContent).toContain("Test description text");
      expect(container.querySelector('[data-testid="item-1"]')).not.toBeNull();
    });

    it("renders PageTransition wrapper", () => {
      act(() => {
        root = createRoot(container);
        root.render(
          <PageTransition duration={300}>
            <div>Transition Content</div>
          </PageTransition>
        );
      });

      expect(container.textContent).toContain("Transition Content");
    });
  });

  // =========================================================================
  // 4. UI Components Rendering & Microinteractions
  // =========================================================================
  describe("4. UI Components Rendering & Microinteractions", () => {
    it("renders Button with variants and icons", () => {
      act(() => {
        root = createRoot(container);
        root.render(
          <div>
            <Button variant="primary" size="md">
              Primary Button
            </Button>
            <Button variant="cyan" size="sm">
              Cyan Button
            </Button>
            <Button variant="outline" isLoading>
              Loading Button
            </Button>
          </div>
        );
      });

      expect(container.textContent).toContain("Primary Button");
      expect(container.textContent).toContain("Cyan Button");
      expect(container.textContent).toContain("Loading Button");
    });

    it("renders Badge, Tag, and CodeLabel with copy interaction", () => {
      act(() => {
        root = createRoot(container);
        root.render(
          <div>
            <Badge variant="glow">Active Badge</Badge>
            <Tag active>v0.1.0</Tag>
            <CodeLabel code="npm install af-motion" prefix="$" />
          </div>
        );
      });

      expect(container.textContent).toContain("Active Badge");
      expect(container.textContent).toContain("v0.1.0");
      expect(container.textContent).toContain("npm install af-motion");
    });

    it("renders Card and interactive Card", () => {
      act(() => {
        root = createRoot(container);
        root.render(
          <div>
            <Card variant="default">Standard Card Content</Card>
            <Card variant="interactive" interactive>
              Interactive Card Content
            </Card>
          </div>
        );
      });

      expect(container.textContent).toContain("Standard Card Content");
      expect(container.textContent).toContain("Interactive Card Content");
    });

    it("renders Tooltip and Divider", () => {
      act(() => {
        root = createRoot(container);
        root.render(
          <div>
            <Tooltip content="Helper message">
              <span>Hover target</span>
            </Tooltip>
            <Divider orientation="horizontal" glow />
          </div>
        );
      });

      expect(container.textContent).toContain("Hover target");
    });
  });

  // =========================================================================
  // 5. Motion Components & AF Motion Integration
  // =========================================================================
  describe("5. Motion Components & AF Motion Integration", () => {
    it("renders MotionReveal and MotionStagger", () => {
      act(() => {
        root = createRoot(container);
        root.render(
          <div>
            <MotionReveal direction="up" duration={400}>
              <div data-testid="reveal-child">Revealed Child</div>
            </MotionReveal>
            <MotionStagger staggerMs={50}>
              <div data-testid="stagger-1">Item 1</div>
              <div data-testid="stagger-2">Item 2</div>
            </MotionStagger>
          </div>
        );
      });

      expect(container.querySelector('[data-testid="reveal-child"]')).not.toBeNull();
      expect(container.querySelector('[data-testid="stagger-1"]')).not.toBeNull();
      expect(container.querySelector('[data-testid="stagger-2"]')).not.toBeNull();
    });

    it("renders MagneticElement and MotionText", () => {
      act(() => {
        root = createRoot(container);
        root.render(
          <div>
            <MagneticElement strength={0.3}>
              <button>Magnetic Target</button>
            </MagneticElement>
            <MotionText text="Kinetic Typography" as="h3" />
          </div>
        );
      });

      expect(container.textContent).toContain("Magnetic Target");
      expect(container.textContent).toContain("Kinetic");
      expect(container.textContent).toContain("Typography");
    });

    it("renders ScrollProgress indicator", () => {
      act(() => {
        root = createRoot(container);
        root.render(<ScrollProgress height={4} />);
      });

      const bar = container.querySelector('[role="progressbar"]');
      expect(bar).not.toBeNull();
    });
  });

  // =========================================================================
  // 6. Visual Effects & Atmospheric Backgrounds
  // =========================================================================
  describe("6. Visual Effects & Atmospheric Backgrounds", () => {
    it("renders GradientSurface, GlowEffect, NoiseOverlay, GridBackground, and SectionDivider", () => {
      act(() => {
        root = createRoot(container);
        root.render(
          <div>
            <GradientSurface variant="indigo" position="top" />
            <GlowEffect color="cyan" size="md" />
            <NoiseOverlay opacity={0.05} />
            <GridBackground variant="grid" />
            <SectionDivider showDot />
          </div>
        );
      });

      expect(container.querySelector(".bg-cyber-grid")).not.toBeNull();
    });
  });

  // =========================================================================
  // 7. 3D Infrastructure & WebGL Fallback Guarantees
  // =========================================================================
  describe("7. 3D Infrastructure & WebGL Fallback Guarantees", () => {
    it("detects WebGL support gracefully in headless/jsdom environment", () => {
      const info = detectWebGLSupport();
      expect(typeof info.supported).toBe("boolean");
      expect(typeof info.isWebGL2).toBe("boolean");
    });

    it("renders FallbackScene when WebGL is unavailable", () => {
      act(() => {
        root = createRoot(container);
        root.render(
          <FallbackScene error={new Error("WebGL context creation disabled")} />
        );
      });

      expect(container.textContent).toContain("2D Canvas Fallback");
      expect(container.textContent).toContain("High-Performance 2D Environment");
    });

    it("catches 3D rendering failures with ThreeErrorBoundary", () => {
      const BombComponent = () => {
        throw new Error("Simulated WebGL Shader Compile Error");
      };

      // Suppress expected React error log
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

      act(() => {
        root = createRoot(container);
        root.render(
          <ThreeErrorBoundary fallback={<div data-testid="caught-fallback">Caught Error</div>}>
            <BombComponent />
          </ThreeErrorBoundary>
        );
      });

      expect(container.querySelector('[data-testid="caught-fallback"]')).not.toBeNull();
      consoleError.mockRestore();
    });
  });

  // =========================================================================
  // 8. Navigation Shell, Routing & Full Application Render
  // =========================================================================
  describe("8. Navigation Shell, Routing & Full Application Render", () => {
    it("renders desktop Navbar and NavLinks", () => {
      act(() => {
        root = createRoot(container);
        root.render(<Navbar activeHref="#overview" />);
      });

      expect(container.textContent).toContain("AF Motion");
      expect(container.textContent).toContain("Get Started");
      expect(container.textContent).toContain("Playground");
    });

    it("renders MobileNavigation and Footer", () => {
      act(() => {
        root = createRoot(container);
        root.render(
          <div>
            <MobileNavigation isOpen={true} onClose={() => {}} />
            <Footer />
          </div>
        );
      });

      expect(container.textContent).toContain("Get Started");
      expect(container.textContent).toContain("AF Motion");
      expect(container.textContent).toContain("Architecture");
      expect(container.textContent).toContain("Ecosystem");
      expect(container.textContent).toContain("Resources");
    });

    it("renders all route page components without exceptions", () => {
      const pages = [
        <HomePage key="home" />,
        <FeaturesPage key="features" />,
        <PlaygroundPage key="playground" />,
        <DocsPage key="docs" />,
        <ExamplesPage key="examples" />,
      ];

      for (const page of pages) {
        act(() => {
          root = createRoot(container);
          root.render(page);
        });
        expect(container.children.length).toBeGreaterThan(0);
        act(() => {
          root?.unmount();
        });
        root = null;
      }
    });

    it("mounts full top-level <App /> application shell cleanly", () => {
      act(() => {
        root = createRoot(container);
        root.render(<App />);
      });

      expect(container.textContent).toContain("AF Motion");
      expect(container.textContent).toContain("Motion is not an effect.");
      expect(container.textContent).toContain("Engineered for Creative Precision");
      expect(container.textContent).toContain("Seven Integrated Systems.");
      expect(container.textContent).toContain("Timing Dictates Meaning");
    });
  });

  // =========================================================================
  // 9. Root Repository Integrity
  // =========================================================================
  describe("9. Root Repository Integrity", () => {
    it("preserves exactly 33 built-in palettes intact", () => {
      expect(BUILT_IN_PALETTE_INPUTS.length).toBe(33);
    });
  });
});
