// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import {
  getDefaultMultiSystemSettings,
  createDefaultTimelineState,
  listBuiltInChoreographyTemplates,
  getChoreographyTemplateById,
  computeTrackOffsetsFromDependencies,
  computeTrackProgress,
  evaluateChoreographyIntelligence,
  generateChoreographyReactCode,
  generateChoreographyJson,
  generateMultiSystemJson,
  ChoreographyStudio,
  type ChoreographyTrackConfig,
  type MultiSystemActiveSettings,
} from "../studio/index.js";

describe("Prompt 96 — Choreography & Multi-System Builder", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot> | null = null;
  const originalGetContext = HTMLCanvasElement.prototype.getContext;

  beforeEach(() => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);

    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      clearRect: vi.fn(),
      createRadialGradient: vi.fn().mockReturnValue({
        addColorStop: vi.fn(),
      }),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      fillRect: vi.fn(),
      fillStyle: "",
    });
  });

  afterEach(() => {
    if (root) {
      act(() => {
        root?.unmount();
      });
      root = null;
    }
    container.remove();
    HTMLCanvasElement.prototype.getContext = originalGetContext;
  });

  describe("1. Choreography Template Discovery & Registry", () => {
    it("discovers all built-in choreography templates dynamically", () => {
      const templates = listBuiltInChoreographyTemplates();
      expect(templates.length).toBeGreaterThanOrEqual(5);

      const templateIds = templates.map((t) => t.id);
      expect(templateIds).toContain("hero-entrance");
      expect(templateIds).toContain("cross-system-sync");
      expect(templateIds).toContain("dashboard-metrics-stagger");
      expect(templateIds).toContain("modal-dialog-entrance");
      expect(templateIds).toContain("scroll-storytelling-seq");
    });

    it("retrieves individual choreography templates by ID", () => {
      const hero = getChoreographyTemplateById("hero-entrance");
      expect(hero).toBeDefined();
      expect(hero.name).toBe("Hero Section Entrance");
      expect(hero.pattern).toBe("multi-element-entrance");
      expect(hero.tracks.length).toBeGreaterThan(0);
      expect(hero.totalDurationMs).toBe(1200);
    });

    it("falls back to default template for non-existent template ID", () => {
      const fallback = getChoreographyTemplateById("non-existent-template-xyz");
      expect(fallback).toBeDefined();
      expect(fallback.id).toBe("hero-entrance");
    });

    it("creates default timeline state with valid configuration", () => {
      const defaultState = createDefaultTimelineState(1500);
      expect(defaultState.totalDurationMs).toBe(1500);
      expect(defaultState.currentTimeMs).toBe(0);
      expect(defaultState.playbackRate).toBe(1.0);
      expect(defaultState.zoom).toBe(1.0);
      expect(defaultState.isPlaying).toBe(true);
    });
  });

  describe("2. Timeline Calculations & Dependency Resolution", () => {
    it("resolves tracks without dependencies at their declared start offset", () => {
      const tracks: ChoreographyTrackConfig[] = [
        {
          id: "track-1",
          name: "Element 1",
          system: "dom",
          targetName: "el-1",
          startMs: 100,
          durationMs: 400,
          easing: "ease-out",
          enabled: true,
          color: "#3b82f6",
          properties: { opacity: [0, 1] },
        },
      ];

      const resolved = computeTrackOffsetsFromDependencies(tracks);
      expect(resolved[0].startMs).toBe(100);
    });

    it("resolves start-after-end dependencies sequentially", () => {
      const tracks: ChoreographyTrackConfig[] = [
        {
          id: "track-1",
          name: "Parent Track",
          system: "dom",
          targetName: "p-1",
          startMs: 200,
          durationMs: 500,
          easing: "ease-out",
          enabled: true,
          color: "#3b82f6",
          properties: { opacity: [0, 1] },
        },
        {
          id: "track-2",
          name: "Child Track",
          system: "graphics",
          targetName: "canvas-1",
          startMs: 0,
          durationMs: 300,
          easing: "ease-in-out",
          enabled: true,
          color: "#9a7aff",
          dependencyTrackId: "track-1",
          dependencyType: "start-after-end",
          offsetMs: 50,
          properties: { opacity: [0, 1] },
        },
      ];

      const resolved = computeTrackOffsetsFromDependencies(tracks);
      expect(resolved[0].startMs).toBe(200);
      // parent ends at 200 + 500 = 700ms; child starts at 700 + 50 = 750ms
      expect(resolved[1].startMs).toBe(750);
    });

    it("resolves start-with-start dependencies synchronously", () => {
      const tracks: ChoreographyTrackConfig[] = [
        {
          id: "track-a",
          name: "Lead Track",
          system: "dom",
          targetName: "lead",
          startMs: 150,
          durationMs: 600,
          easing: "ease-out",
          enabled: true,
          color: "#3b82f6",
          properties: { scale: [0.8, 1] },
        },
        {
          id: "track-b",
          name: "Follower Track",
          system: "3d",
          targetName: "scene-1",
          startMs: 0,
          durationMs: 400,
          easing: "ease-out",
          enabled: true,
          color: "#ec4899",
          dependencyTrackId: "track-a",
          dependencyType: "start-with-start",
          offsetMs: 30,
          properties: { rotate: [0, 360] },
        },
      ];

      const resolved = computeTrackOffsetsFromDependencies(tracks);
      expect(resolved[0].startMs).toBe(150);
      // lead starts at 150ms; follower starts at 150 + 30 = 180ms
      expect(resolved[1].startMs).toBe(180);
    });

    it("computes track progress accurately across timeline time", () => {
      const track: ChoreographyTrackConfig = {
        id: "track-test",
        name: "Test Track",
        system: "dom",
        targetName: "test-target",
        startMs: 100,
        durationMs: 400,
        easing: "linear",
        enabled: true,
        color: "#3b82f6",
        properties: { opacity: [0, 1], y: [50, 0] },
      };

      // Before start
      const before = computeTrackProgress(track, 50, 1000);
      expect(before.progress).toBe(0);
      expect(before.isActive).toBe(false);

      // Halfway: (300 - 100) / 400 = 0.5
      const halfway = computeTrackProgress(track, 300, 1000);
      expect(halfway.progress).toBeCloseTo(0.5, 2);
      expect(halfway.isActive).toBe(true);
      expect(halfway.opacity).toBeCloseTo(0.5, 2);
      expect(halfway.y).toBeCloseTo(25, 1);

      // At end
      const atEnd = computeTrackProgress(track, 500, 1000);
      expect(atEnd.progress).toBe(1);
      expect(atEnd.opacity).toBe(1);
      expect(atEnd.y).toBe(0);
    });
  });

  describe("3. Multi-System Settings & Coordination", () => {
    it("provides default multi-system settings with systems configured", () => {
      const settings = getDefaultMultiSystemSettings();
      expect(settings.dom).toBe(true);
      expect(settings.pageTransitions).toBe(true);
      expect(settings.scrollMotion).toBe(false);
      expect(settings.microinteractions).toBe(true);
      expect(settings.graphicsEffects).toBe(true);
      expect(settings.scene3d).toBe(true);
      expect(settings.ambientMotion).toBe(true);
    });
  });

  describe("4. Choreography Intelligence Analysis", () => {
    it("evaluates choreography quality and provides scores and recommendations", () => {
      const template = listBuiltInChoreographyTemplates()[0];
      const settings = getDefaultMultiSystemSettings();
      const report = evaluateChoreographyIntelligence(
        template.pattern,
        template.tracks,
        settings,
        template.totalDurationMs
      );

      expect(report.score).toBeGreaterThanOrEqual(70);
      expect(report.recommendedOrder.length).toBeGreaterThan(0);
      expect(Array.isArray(report.conflicts)).toBe(true);
      expect(report.accessibilityNotes.length).toBeGreaterThan(0);
    });

    it("flags excessive duration warning when timeline exceeds 2500ms", () => {
      const template = listBuiltInChoreographyTemplates()[0];
      const settings = getDefaultMultiSystemSettings();

      const report = evaluateChoreographyIntelligence(
        template.pattern,
        template.tracks,
        settings,
        3500
      );

      const hasDurationWarning = report.performanceWarnings.some((w) =>
        w.toLowerCase().includes("duration")
      );
      expect(hasDurationWarning).toBe(true);
      expect(report.timingRecommendations.length).toBeGreaterThan(0);
      expect(report.score).toBeLessThan(100);
    });
  });

  describe("5. Code Generation & Export", () => {
    it("generates production-grade React TSX code importing from official subpaths", () => {
      const template = listBuiltInChoreographyTemplates()[0];
      const settings = getDefaultMultiSystemSettings();
      const tsx = generateChoreographyReactCode(
        template.name,
        template.pattern,
        template.tracks,
        settings,
        template.totalDurationMs
      );

      expect(tsx).toContain("\"use client\";");
      expect(tsx).toContain("import React");
      expect(tsx).toContain("from \"af-motion\";");
      expect(tsx).toContain("from \"af-motion/react\";");
      expect(tsx).toContain("from \"af-motion/catalogue\";");
      expect(tsx).toContain("useMotionAccessibility");
      expect(tsx).toContain("HeroSectionEntranceBuilder");
    });

    it("generates valid Choreography JSON structure", () => {
      const template = listBuiltInChoreographyTemplates()[0];
      const jsonStr = generateChoreographyJson(
        template.name,
        template.pattern,
        template.tracks,
        template.totalDurationMs
      );

      const parsed = JSON.parse(jsonStr);
      expect(parsed.name).toBe("Hero Section Entrance");
      expect(parsed.pattern).toBe("multi-element-entrance");
      expect(parsed.totalDurationMs).toBe(template.totalDurationMs);
      expect(Array.isArray(parsed.tracks)).toBe(true);
      expect(parsed.tracks.length).toBe(template.tracks.length);
    });

    it("generates valid Multi-System JSON specification", () => {
      const template = listBuiltInChoreographyTemplates()[0];
      const settings = getDefaultMultiSystemSettings();
      const multiJsonStr = generateMultiSystemJson(settings, template.tracks);

      const parsed = JSON.parse(multiJsonStr);
      expect(parsed.generator).toContain("AF Motion Studio");
      expect(parsed.systems).toBeDefined();
      expect(parsed.systems.dom).toBe(true);
      expect(parsed.activeTracksCount).toBeGreaterThan(0);
      expect(parsed.crossSystemSync).toBe(true);
    });
  });

  describe("6. Choreography Studio React UI Integration", () => {
    it("mounts ChoreographyStudio and renders header and navigation tabs", () => {
      act(() => {
        root = createRoot(container);
        root.render(React.createElement(ChoreographyStudio));
      });

      expect(container.querySelector(".ch-studio-container")).not.toBeNull();
      expect(container.querySelector(".ch-studio-title")?.textContent).toContain("Choreography & Multi-System Builder");
      expect(container.querySelector(".ch-studio-nav-tabs")).not.toBeNull();

      const tabs = container.querySelectorAll(".ch-nav-tab");
      expect(tabs.length).toBe(5);
      expect(tabs[0].textContent).toContain("Timeline");
      expect(tabs[1].textContent).toContain("Multi-System");
      expect(tabs[2].textContent).toContain("Intelligence");
      expect(tabs[3].textContent).toContain("Templates");
      expect(tabs[4].textContent).toContain("Export Code");
    });

    it("switches tabs between Timeline, Multi-System, Intelligence, Templates, and Export Code", () => {
      act(() => {
        root = createRoot(container);
        root.render(React.createElement(ChoreographyStudio));
      });

      const tabs = container.querySelectorAll<HTMLButtonElement>(".ch-nav-tab");

      // Switch to Multi-System
      act(() => {
        tabs[1].click();
      });
      expect(container.querySelector(".ch-system-manager-panel")).not.toBeNull();

      // Switch to Intelligence
      act(() => {
        tabs[2].click();
      });
      expect(container.querySelector(".ch-intelligence-panel")).not.toBeNull();
      expect(container.querySelector(".ch-score-badge")).not.toBeNull();

      // Switch to Templates
      act(() => {
        tabs[3].click();
      });
      expect(container.querySelector(".ch-template-selector-panel")).not.toBeNull();
      expect(container.querySelectorAll(".ch-template-card").length).toBeGreaterThanOrEqual(5);

      // Switch to Export Code
      act(() => {
        tabs[4].click();
      });
      expect(container.querySelector(".ch-code-export-panel")).not.toBeNull();
      expect(container.querySelector(".ch-code-display-block")).not.toBeNull();

      // Switch back to Timeline
      act(() => {
        tabs[0].click();
      });
      expect(container.querySelector(".ch-timeline-editor")).not.toBeNull();
    });

    it("handles playback controls and time scrubbing", () => {
      act(() => {
        root = createRoot(container);
        root.render(React.createElement(ChoreographyStudio));
      });

      const playBtn = container.querySelector<HTMLButtonElement>(".ch-play-btn");
      expect(playBtn).not.toBeNull();
      // Initially playing
      expect(playBtn?.textContent).toContain("Pause");

      // Toggle Pause
      act(() => {
        playBtn?.click();
      });
      expect(playBtn?.textContent).toContain("Play");

      // Toggle Play
      act(() => {
        playBtn?.click();
      });
      expect(playBtn?.textContent).toContain("Pause");

      // Restart button
      const restartBtn = container.querySelector<HTMLButtonElement>('button[title*="Restart"]');
      expect(restartBtn).not.toBeNull();
      act(() => {
        restartBtn?.click();
      });

      // Scrubber slider
      const scrubber = container.querySelector<HTMLInputElement>(".ch-scrub-slider");
      expect(scrubber).not.toBeNull();
      act(() => {
        scrubber!.value = "600";
        scrubber!.dispatchEvent(new Event("change", { bubbles: true }));
      });
    });

    it("loads a selected choreography template from the template selector", () => {
      act(() => {
        root = createRoot(container);
        root.render(React.createElement(ChoreographyStudio));
      });

      // Navigate to Templates tab
      const tabs = container.querySelectorAll<HTMLButtonElement>(".ch-nav-tab");
      act(() => {
        tabs[3].click();
      });

      // Click on Dashboard Metrics Stagger template card
      const templateCards = container.querySelectorAll<HTMLButtonElement>(".ch-template-card");
      const dashboardCard = Array.from(templateCards).find((c) =>
        c.textContent?.includes("Dashboard Metrics Stagger")
      );
      expect(dashboardCard).toBeDefined();

      act(() => {
        dashboardCard?.click();
      });

      // Check that selected card is updated
      expect(dashboardCard?.className).toContain("selected");
    });

    it("toggles systems in the multi-system manager", () => {
      act(() => {
        root = createRoot(container);
        root.render(React.createElement(ChoreographyStudio));
      });

      // Switch to Multi-System tab
      const tabs = container.querySelectorAll<HTMLButtonElement>(".ch-nav-tab");
      act(() => {
        tabs[1].click();
      });

      const systemCards = container.querySelectorAll<HTMLDivElement>(".ch-system-card");
      expect(systemCards.length).toBe(7);

      const firstCard = systemCards[0];
      const toggleInput = firstCard.querySelector<HTMLInputElement>('input[type="checkbox"]');
      expect(toggleInput).not.toBeNull();
      const initialChecked = toggleInput?.checked;

      // Toggle system
      act(() => {
        toggleInput?.click();
      });
      expect(toggleInput?.checked).toBe(!initialChecked);

      // Toggle back
      act(() => {
        toggleInput?.click();
      });
      expect(toggleInput?.checked).toBe(initialChecked);
    });

    it("renders code export sub-tabs and triggers code switching", () => {
      act(() => {
        root = createRoot(container);
        root.render(React.createElement(ChoreographyStudio));
      });

      // Switch to Export Code tab
      const tabs = container.querySelectorAll<HTMLButtonElement>(".ch-nav-tab");
      act(() => {
        tabs[4].click();
      });

      const exportSubTabs = container.querySelectorAll<HTMLButtonElement>(".ch-export-tab");
      expect(exportSubTabs.length).toBe(3);
      expect(exportSubTabs[0].textContent).toContain("React");
      expect(exportSubTabs[1].textContent).toContain("Choreography JSON");
      expect(exportSubTabs[2].textContent).toContain("Multi-System JSON");

      // Switch to Choreography JSON
      act(() => {
        exportSubTabs[1].click();
      });
      const codeView = container.querySelector(".ch-code-display-block code");
      expect(codeView?.textContent).toContain("\"pattern\":");

      // Switch to Multi-System JSON
      act(() => {
        exportSubTabs[2].click();
      });
      expect(codeView?.textContent).toContain("\"systems\":");
    });
  });
});
