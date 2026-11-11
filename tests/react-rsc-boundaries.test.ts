// @vitest-environment node

import fs from "node:fs";
import path from "node:path";
import { createElement, useRef } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

describe("Next.js & React Server Component (RSC) Boundaries", () => {
  const distDir = path.resolve(__dirname, "../dist");

  it("ensures dist/react.js carries the 'use client' directive at the top of the file", () => {
    const reactJsPath = path.join(distDir, "react.js");
    expect(fs.existsSync(reactJsPath)).toBe(true);

    const content = fs.readFileSync(reactJsPath, "utf8").trimStart();
    expect(content.startsWith('"use client";') || content.startsWith("'use client';")).toBe(true);
  });

  it("ensures framework-independent entrypoints do NOT declare 'use client' directives", () => {
    const serverEntries = ["index.js", "presets.js", "catalogue.js"];

    for (const entry of serverEntries) {
      const entryPath = path.join(distDir, entry);
      expect(fs.existsSync(entryPath)).toBe(true);

      const content = fs.readFileSync(entryPath, "utf8").trimStart();
      expect(content.startsWith('"use client";')).toBe(false);
      expect(content.startsWith("'use client';")).toBe(false);
    }
  });

  it("allows importing and evaluating presets in pure server environments without browser globals", async () => {
    expect(typeof window).toBe("undefined");
    expect(typeof document).toBe("undefined");

    const presets = await import("../dist/presets.js");
    expect(presets.listPresets).toBeDefined();

    const allPresets = presets.listPresets();
    expect(allPresets.length).toBeGreaterThan(0);

    const first = allPresets[0];
    const retrieved = presets.getPreset(first.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(first.id);
  });

  it("allows querying catalogue schemas in pure server environments without browser globals", async () => {
    expect(typeof window).toBe("undefined");
    expect(typeof document).toBe("undefined");

    const catalogue = await import("../dist/catalogue.js");
    expect(catalogue.exportCatalogueDocument).toBeDefined();

    const doc = catalogue.exportCatalogueDocument();
    expect(doc.version).toBeDefined();
    expect(doc.capabilities.length).toBeGreaterThan(0);
  });

  it("renders React components and hooks on the server without hydration mismatches", async () => {
    const {
      AnimatedText,
      Reveal,
      useInView,
      useScrollProgress,
      useScrollVelocity,
      useSequence,
      useParallel,
      useTimeline,
      useAnimate,
    } = await import("../dist/react.js");

    function FullPageServerPreview() {
      const inView = useInView({ once: true });
      const scrollProgress = useScrollProgress();
      const scrollVelocity = useScrollVelocity();
      const animateState = useAnimate();
      const seq = useSequence([]);
      const par = useParallel([]);
      const tl = useTimeline();

      return createElement(
        "main",
        null,
        createElement(
          Reveal,
          { direction: "up", className: "hero-reveal" },
          createElement(AnimatedText, { text: "Server-Rendered Motion", effect: "scramble" }),
        ),
        createElement("div", {
          "data-in-view": String(inView.isInView),
          "data-scroll": String(scrollProgress.progress),
          "data-velocity": String(scrollVelocity.data.velocity),
          "data-seq-ready": String(typeof seq.play === "function"),
          "data-par-ready": String(typeof par.play === "function"),
          "data-tl-ready": String(typeof tl.play === "function"),
          "data-animate-ready": String(typeof animateState.animate === "function"),
        }),
      );
    }

    const html = renderToString(createElement(FullPageServerPreview));

    expect(html).toContain('aria-label="Server-Rendered Motion"');
    expect(html).toContain('data-in-view="false"');
    expect(html).toContain('data-scroll="0"');
    expect(html).toContain('data-velocity="0"');
    expect(html).toContain('data-seq-ready="true"');
    expect(html).toContain('data-par-ready="true"');
    expect(html).toContain('data-tl-ready="true"');
    expect(html).toContain('data-animate-ready="true"');
  });
});
