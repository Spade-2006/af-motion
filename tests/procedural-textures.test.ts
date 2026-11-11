// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement, createRef, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";

import {
  // PRNG & Utils
  createPRNG,
  hashSeed,
  parseColor,
  createSafeCanvas,
  encodeSvgDataUrl,
  // Generators & Metadata
  TEXTURE_GENERATORS,
  TEXTURE_GENERATORS_METADATA,
  listTextureGenerators,
  getTextureGeneratorMetadata,
  generateNoise,
  generatePaper,
  generateFabric,
  generateMarble,
  generateWood,
  generateMetalBrush,
  generateHalftone,
  generateDots,
  generateStripes,
  generateOrganicGradient,
  generateTopographic,
  generateImperfections,
  // Engine & Cache
  TextureCache,
  defaultTextureCache,
  buildTextureCacheKey,
  generateProceduralTexture,
  createResourceManager,
  // Material integration
  applyTextureToSurface,
  resolveTextureInput,
  // Schemas & Validation
  TEXTURE_SCHEMA_VERSION,
  VALID_TEXTURE_GENERATORS,
  TEXTURE_OPTIONS_SCHEMA,
  TEXTURE_CONFIG_SCHEMA,
  validateTextureOptions,
  validateTextureConfig,
  correctTextureConfig,
  TEXTURE_GENERATION_CAPABILITY,
  registerTextureCapability,
  aiMotionRegistry,
  type TextureGeneratorName,
  type GeneratedTexture,
} from "../src/catalogue.js";

import {
  useTexture,
  useProceduralTexture,
  useTexturePresets,
  ProceduralTexture,
} from "../src/react.js";

describe("Procedural Textures & Patterns System (Prompt 73)", () => {
  let host: HTMLDivElement;
  let root: Root;
  const originalGetContext = HTMLCanvasElement.prototype.getContext;
  const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;

  const mock2DContext = {
    createImageData: (w: number, h: number) => ({
      data: new Uint8ClampedArray(w * h * 4),
      width: w,
      height: h,
    }),
    putImageData: vi.fn(),
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    closePath: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    rotate: vi.fn(),
    translate: vi.fn(),
    createRadialGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
    drawImage: vi.fn(),
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
  };

  beforeEach(() => {
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);

    HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation(function (type: string) {
      if (type === "2d") return mock2DContext;
      return null;
    });

    HTMLCanvasElement.prototype.toDataURL = vi
      .fn()
      .mockReturnValue(
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
      );
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    host.remove();
    defaultTextureCache.clear();
    HTMLCanvasElement.prototype.getContext = originalGetContext;
    HTMLCanvasElement.prototype.toDataURL = originalToDataURL;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe("Deterministic PRNG & Color Utilities", () => {
    it("produces identical sequences for identical seeds", () => {
      const prng1 = createPRNG(42);
      const prng2 = createPRNG(42);

      const seq1 = [prng1.next(), prng1.range(10, 20), prng1.int(1, 100)];
      const seq2 = [prng2.next(), prng2.range(10, 20), prng2.int(1, 100)];

      expect(seq1).toEqual(seq2);
    });

    it("produces distinct sequences for different seeds", () => {
      const prngA = createPRNG(100);
      const prngB = createPRNG(200);

      expect(prngA.next()).not.toBe(prngB.next());
    });

    it("hashes string seeds deterministically", () => {
      const seed1 = hashSeed("my-procedural-texture-seed");
      const seed2 = hashSeed("my-procedural-texture-seed");
      expect(seed1).toBe(seed2);
      expect(typeof seed1).toBe("number");
    });

    it("parses hex, rgb, rgba, and named colors accurately", () => {
      expect(parseColor("#ff0000")).toEqual({ r: 255, g: 0, b: 0, a: 255 });
      expect(parseColor("#00ff0080")).toEqual({ r: 0, g: 255, b: 0, a: 128 });
      expect(parseColor("rgba(50, 100, 150, 0.5)")).toEqual({ r: 50, g: 100, b: 150, a: 128 });
      expect(parseColor("transparent")).toEqual({ r: 0, g: 0, b: 0, a: 0 });
    });
  });

  describe("All 12 Built-in Generators", () => {
    const allGenerators: TextureGeneratorName[] = [
      "noise",
      "paper",
      "fabric",
      "marble",
      "wood",
      "metal-brush",
      "halftone",
      "dots",
      "stripes",
      "organic-gradient",
      "topographic",
      "imperfections",
    ];

    it("registers all 12 generator functions", () => {
      expect(Object.keys(TEXTURE_GENERATORS)).toEqual(allGenerators);
    });

    it("lists metadata for all 12 generators", () => {
      const list = listTextureGenerators();
      expect(list).toHaveLength(12);
      const names = list.map((m) => m.name);
      expect(names).toEqual(allGenerators);
    });

    for (const name of allGenerators) {
      it(`generates valid output for generator "${name}"`, () => {
        const texture = generateProceduralTexture({
          generator: name,
          options: { seed: 1234, width: 64, height: 64 },
        });

        expect(texture.generator).toBe(name);
        expect(texture.width).toBe(64);
        expect(texture.height).toBe(64);
        expect(texture.dataUrl).toBeTruthy();
        expect(texture.cssBackground).toContain("url(");
        expect(texture.webglDescriptor).toBeDefined();
        expect(texture.webglDescriptor?.format).toBe("rgba8");
        expect(texture.estimatedSizeBytes).toBe(64 * 64 * 4);
      });
    }

    it("produces deterministic output across multiple invocations with same seed", () => {
      const tex1 = generateProceduralTexture(
        { generator: "stripes", options: { seed: 999, angle: 30, frequency: 12 } },
        { cache: false }
      );
      const tex2 = generateProceduralTexture(
        { generator: "stripes", options: { seed: 999, angle: 30, frequency: 12 } },
        { cache: false }
      );

      expect(tex1.dataUrl).toBe(tex2.dataUrl);
      expect(tex1.cssBackground).toBe(tex2.cssBackground);
    });

    it("creates SVG fallbacks when DOM canvas is unavailable (SSR simulation)", () => {
      const originalCreateElement = document.createElement;
      document.createElement = vi.fn().mockImplementation((tag: string) => {
        if (tag === "canvas") throw new Error("Canvas unsupported");
        return originalCreateElement.call(document, tag);
      });

      try {
        const tex = generateProceduralTexture(
          { generator: "marble", options: { seed: 777, width: 128, height: 128 } },
          { cache: false }
        );
        expect(tex.dataUrl).toContain("data:image/svg+xml");
        expect(tex.cssBackground).toContain("data:image/svg+xml");
      } finally {
        document.createElement = originalCreateElement;
      }
    });
  });

  describe("Resolution Clamping & Quality Presets", () => {
    it("respects quality presets (low, medium, high)", () => {
      const low = generateProceduralTexture({ generator: "noise", options: { quality: "low" } }, { cache: false });
      expect(low.width).toBe(128);
      expect(low.height).toBe(128);

      const med = generateProceduralTexture({ generator: "noise", options: { quality: "medium" } }, { cache: false });
      expect(med.width).toBe(256);
      expect(med.height).toBe(256);

      const high = generateProceduralTexture({ generator: "noise", options: { quality: "high" } }, { cache: false });
      expect(high.width).toBe(512);
      expect(high.height).toBe(512);
    });

    it("clamps resolutions between 8px and 2048px safely", () => {
      const tiny = generateProceduralTexture(
        { generator: "dots", options: { width: 2, height: -10 } },
        { cache: false }
      );
      expect(tiny.width).toBe(8);
      expect(tiny.height).toBe(8);

      const huge = generateProceduralTexture(
        { generator: "dots", options: { width: 8000, height: 5000 } },
        { cache: false }
      );
      expect(huge.width).toBe(2048);
      expect(huge.height).toBe(2048);
    });
  });

  describe("Caching & Resource Disposal", () => {
    it("caches textures by configuration key and tracks hit statistics", () => {
      const cache = new TextureCache({ maxSize: 10 });
      const config = { generator: "wood" as const, options: { seed: 55 } };

      const tex1 = generateProceduralTexture(config, { cache });
      const statsAfterMiss = cache.getStats();
      expect(statsAfterMiss.misses).toBe(1);
      expect(statsAfterMiss.hits).toBe(0);

      const tex2 = generateProceduralTexture(config, { cache });
      const statsAfterHit = cache.getStats();
      expect(statsAfterHit.hits).toBe(1);
      expect(tex1).toBe(tex2);
    });

    it("evicts oldest textures when exceeding maxSize (LRU)", () => {
      const cache = new TextureCache({ maxSize: 2 });

      generateProceduralTexture({ generator: "dots", options: { seed: 1 } }, { cache });
      generateProceduralTexture({ generator: "dots", options: { seed: 2 } }, { cache });
      expect(cache.getStats().size).toBe(2);

      // Add a third texture — should evict seed 1
      generateProceduralTexture({ generator: "dots", options: { seed: 3 } }, { cache });
      expect(cache.getStats().size).toBe(2);
      expect(cache.has(buildTextureCacheKey("dots", hashSeed(1), 256, 256, { seed: 1 }))).toBe(false);
      expect(cache.has(buildTextureCacheKey("dots", hashSeed(3), 256, 256, { seed: 3 }))).toBe(true);
    });

    it("integrates with Prompt 71 ResourceManager for lifecycle tracking", () => {
      const rm = createResourceManager();
      const texture = generateProceduralTexture(
        { generator: "metal-brush", options: { seed: 88 } },
        { resourceManager: rm, ownerId: "card-component" }
      );

      expect(rm.size).toBe(1);
      expect(rm.has(texture.id)).toBe(true);
      expect(rm.getResourcesOwnedBy("card-component")).toHaveLength(1);

      // Disposal via resource manager
      rm.disposeOwnedBy("card-component");
      expect(rm.size).toBe(0);
    });
  });

  describe("Material & Surface Integration (Prompt 72)", () => {
    it("applies procedural texture to a surface definition", () => {
      const surface = {
        baseColor: "#1e293b",
        roughness: 0.4,
        elevation: 2,
      };

      const style = applyTextureToSurface(surface, "paper", {
        scale: 1.5,
        repeat: "repeat",
        blendMode: "multiply",
        opacity: 0.8,
      });

      expect(style.background).toBe("#1e293b");
      expect(style.backgroundImage).toContain("url(");
      expect(style.backgroundSize).toBe("150%");
      expect(style.backgroundRepeat).toBe("repeat");
      expect(style.backgroundBlendMode).toBe("multiply");
      expect(style.uniforms?.u_texture_enabled).toBe(true);
      expect(style.uniforms?.u_texture_opacity).toBe(0.8);
      expect(style.uniforms?.u_texture_scale).toEqual([1.5, 1.5]);
    });

    it("resolves direct GeneratedTexture objects in applyTextureToSurface", () => {
      const generated = generateProceduralTexture({ generator: "topographic", options: { seed: 12 } });
      const style = applyTextureToSurface({ baseColor: "#0f172a" }, generated);

      expect(style.backgroundImage).toContain(generated.dataUrl);
    });
  });

  describe("Schema Validation & Correction", () => {
    it("validates correct texture configs", () => {
      expect(validateTextureConfig({ generator: "noise" }).valid).toBe(true);
      expect(validateTextureConfig({ generator: "marble", options: { width: 512, opacity: 0.5 } }).valid).toBe(true);
    });

    it("rejects invalid texture configs and options", () => {
      expect(validateTextureConfig(null).valid).toBe(false);
      expect(validateTextureConfig({ generator: "unknown-generator" as any }).valid).toBe(false);
      expect(validateTextureOptions({ width: 5000 }).valid).toBe(false);
      expect(validateTextureOptions({ opacity: 2 }).valid).toBe(false);
    });

    it("corrects malformed configurations safely", () => {
      const corrected = correctTextureConfig({
        generator: "invalid-name" as any,
        options: { width: 10000, opacity: -5, quality: "unknown" as any },
      });

      expect(corrected.generator).toBe("noise");
      expect(corrected.options?.width).toBe(2048);
      expect(corrected.options?.opacity).toBe(0);
      expect(corrected.options?.quality).toBe("medium");
    });
  });

  describe("AI Motion Registry Integration", () => {
    it("provides valid TEXTURE_GENERATION_CAPABILITY metadata", () => {
      expect(TEXTURE_GENERATION_CAPABILITY.id).toBe("procedural-textures");
      expect(TEXTURE_GENERATION_CAPABILITY.category).toBe("graphics");
      expect(TEXTURE_GENERATION_CAPABILITY.react.componentName).toBe("ProceduralTexture");
      expect(TEXTURE_GENERATION_CAPABILITY.react.hookName).toBe("useTexture");
    });

    it("registers dynamically into aiMotionRegistry", () => {
      registerTextureCapability(aiMotionRegistry);
      const cap = aiMotionRegistry.getCapability("procedural-textures");
      expect(cap).toBeDefined();
      expect(cap?.name).toBe("generateProceduralTexture");
    });
  });

  describe("React Integration", () => {
    it("useTexture returns texture, dataUrl, and cssBackground", () => {
      let captured: any;

      function Consumer() {
        captured = useTexture("dots", { frequency: 16 });
        return createElement("div", null, "Texture Consumer");
      }

      act(() => {
        root.render(createElement(Consumer));
      });

      expect(captured.texture.generator).toBe("dots");
      expect(captured.dataUrl).toBeTruthy();
      expect(captured.style.backgroundImage).toContain("url(");
    });

    it("useProceduralTexture generates from full configuration", () => {
      let captured: GeneratedTexture | undefined;

      function Consumer() {
        captured = useProceduralTexture({ generator: "wood", options: { seed: 101 } });
        return createElement("div", null, "Wood Consumer");
      }

      act(() => {
        root.render(createElement(Consumer));
      });

      expect(captured?.generator).toBe("wood");
      expect(captured?.seed).toBe(hashSeed(101));
    });

    it("useTexturePresets lists all available texture generators", () => {
      let presets: any;

      function Consumer() {
        presets = useTexturePresets();
        return createElement("div", null, "Presets Consumer");
      }

      act(() => {
        root.render(createElement(Consumer));
      });

      expect(presets).toHaveLength(12);
    });

    it("ProceduralTexture renders container div with background style and forwards ref", () => {
      const ref = createRef<HTMLElement>();

      act(() => {
        root.render(
          createElement(
            ProceduralTexture,
            {
              ref,
              generator: "paper",
              scale: 2,
              repeat: "repeat-x",
              className: "paper-texture",
              style: { width: "200px", height: "100px" },
            },
            createElement("span", null, "Inner Content")
          )
        );
      });

      const el = host.querySelector(".paper-texture") as HTMLElement;
      expect(el).not.toBeNull();
      expect(ref.current).toBe(el);
      expect(el.style.backgroundImage).toContain("url(");
      expect(el.style.backgroundRepeat).toBe("repeat-x");
      expect(el.style.backgroundSize).toBe("200%");
      expect(el.textContent).toBe("Inner Content");
    });

    it("ProceduralTexture renders canvas element when as='canvas'", () => {
      const ref = createRef<HTMLCanvasElement>();

      act(() => {
        root.render(
          createElement(ProceduralTexture, {
            ref: ref as any,
            as: "canvas",
            generator: "halftone",
            className: "halftone-canvas",
          })
        );
      });

      const canvas = host.querySelector("canvas.halftone-canvas") as HTMLCanvasElement;
      expect(canvas).not.toBeNull();
      expect(ref.current).toBe(canvas);
      expect(canvas.width).toBe(256);
      expect(canvas.height).toBe(256);
    });

    it("ProceduralTexture renders cleanly in SSR simulation", () => {
      const html = renderToString(
        createElement(
          ProceduralTexture,
          { generator: "fabric", scale: 1.5 },
          createElement("p", null, "SSR Texture")
        )
      );

      expect(html).toContain("SSR Texture");
      expect(html).toContain("background-image");
    });
  });
});
