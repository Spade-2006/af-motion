import { describe, expect, expectTypeOf, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import * as rootApi from "../src/index.js";
import * as presetsApi from "../src/presets.js";
import * as catalogueApi from "../src/catalogue.js";
import * as reactApi from "../src/react.js";
import type {
  DeclarativeMotionRecipe,
  MotionPreset,
  CapabilityMetadata,
  ChoreographyDefinition,
  DesignSystem,
  MotionDNA,
  AdaptiveMotionConfig,
} from "../src/index.js";

describe("Public API Completeness - Package Exports & Subpaths", () => {
  const pkgPath = path.resolve(__dirname, "../package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

  it("exports all documented public package subpaths", () => {
    expect(pkg.exports).toBeDefined();
    expect(pkg.exports["."]).toEqual({
      types: "./dist/index.d.ts",
      import: "./dist/index.js",
      default: "./dist/index.js",
    });
    expect(pkg.exports["./react"]).toEqual({
      types: "./dist/react.d.ts",
      import: "./dist/react.js",
      default: "./dist/react.js",
    });
    expect(pkg.exports["./presets"]).toEqual({
      types: "./dist/presets.d.ts",
      import: "./dist/presets.js",
      default: "./dist/presets.js",
    });
    expect(pkg.exports["./catalogue"]).toEqual({
      types: "./dist/catalogue.d.ts",
      import: "./dist/catalogue.js",
      default: "./dist/catalogue.js",
    });
    expect(pkg.exports["./catalog"]).toEqual({
      types: "./dist/catalogue.d.ts",
      import: "./dist/catalogue.js",
      default: "./dist/catalogue.js",
    });
    expect(pkg.exports["./package.json"]).toBe("./package.json");
  });

  it("has corresponding build artifacts and TypeScript declarations for every subpath", () => {
    const distFiles = [
      "dist/index.js",
      "dist/index.d.ts",
      "dist/react.js",
      "dist/react.d.ts",
      "dist/presets.js",
      "dist/presets.d.ts",
      "dist/catalogue.js",
      "dist/catalogue.d.ts",
    ];

    for (const relPath of distFiles) {
      const fullPath = path.resolve(__dirname, "..", relPath);
      expect(fs.existsSync(fullPath), `Expected ${relPath} to exist`).toBe(true);
    }
  });

  it("maintains sideEffects: false for bundler tree-shaking", () => {
    expect(pkg.sideEffects).toBe(false);
  });

  it("marks react as an optional peer dependency", () => {
    expect(pkg.peerDependencies?.react).toBeDefined();
    expect(pkg.peerDependenciesMeta?.react?.optional).toBe(true);
  });
});

describe("Public API Completeness - Root Exports (af-motion)", () => {
  it("does not expose undefined or null exports", () => {
    const entries = Object.entries(rootApi);
    expect(entries.length).toBeGreaterThan(50);
    for (const [key, value] of entries) {
      expect(value, `Export ${key} must not be undefined or null`).toBeDefined();
      expect(value).not.toBeNull();
    }
  });

  it("does not contain duplicate export keys", () => {
    const keys = Object.keys(rootApi);
    const uniqueKeys = new Set(keys);
    expect(keys.length).toBe(uniqueKeys.size);
  });

  it("exposes core animation engines", () => {
    expect(typeof rootApi.animate).toBe("function");
    expect(typeof rootApi.animateProgress).toBe("function");
    expect(typeof rootApi.animateSpring).toBe("function");
    expect(typeof rootApi.animateInertia).toBe("function");
    expect(typeof rootApi.createTimeline).toBe("function");
    expect(typeof rootApi.animateSequence).toBe("function");
    expect(typeof rootApi.animateParallel).toBe("function");
  });

  it("exposes visual effects and text effects", () => {
    expect(typeof rootApi.reveal).toBe("function");
    expect(typeof rootApi.stagger).toBe("function");
    expect(typeof rootApi.glow).toBe("function");
    expect(typeof rootApi.borderBeam).toBe("function");
    expect(typeof rootApi.shine).toBe("function");
    expect(typeof rootApi.ripple).toBe("function");
    expect(typeof rootApi.spotlight).toBe("function");
    expect(typeof rootApi.textScramble).toBe("function");
    expect(typeof rootApi.typewriter).toBe("function");
    expect(typeof rootApi.countUp).toBe("function");
    expect(typeof rootApi.textHighlight).toBe("function");
    expect(typeof rootApi.splitText).toBe("function");
    expect(typeof rootApi.textReveal).toBe("function");
    expect(typeof rootApi.textMask).toBe("function");
    expect(typeof rootApi.gradientText).toBe("function");
  });

  it("exposes pointer interactions, gestures, and scroll effects", () => {
    expect(typeof rootApi.magnetic).toBe("function");
    expect(typeof rootApi.hoverMotion).toBe("function");
    expect(typeof rootApi.followPointer).toBe("function");
    expect(typeof rootApi.drag).toBe("function");
    expect(typeof rootApi.pinch).toBe("function");
    expect(typeof rootApi.swipe).toBe("function");
    expect(typeof rootApi.tilt).toBe("function");
    expect(typeof rootApi.scrollProgress).toBe("function");
    expect(typeof rootApi.scrollTrigger).toBe("function");
    expect(typeof rootApi.inView).toBe("function");
    expect(typeof rootApi.scrollVelocity).toBe("function");
    expect(typeof rootApi.scrollAnimate).toBe("function");
    expect(typeof rootApi.scrollDirection).toBe("function");
    expect(typeof rootApi.parallax).toBe("function");
  });

  it("exposes SVG and composition engines", () => {
    expect(typeof rootApi.drawSVG).toBe("function");
    expect(typeof rootApi.morphSVG).toBe("function");
    expect(typeof rootApi.composeEffects).toBe("function");
    expect(typeof rootApi.createMotionChoreography).toBe("function");
    expect(typeof rootApi.createMotionRecipe).toBe("function");
    expect(typeof rootApi.runMotionRecipe).toBe("function");
    expect(typeof rootApi.createMotionStates).toBe("function");
  });

  it("exposes palette and easing registries", () => {
    expect(typeof rootApi.paletteRegistry).toBe("object");
    expect(typeof rootApi.activatePalette).toBe("function");
    expect(typeof rootApi.listPalettes).toBe("function");
    expect(typeof rootApi.easingRegistry).toBe("object");
    expect(typeof rootApi.getEasing).toBe("function");
    expect(typeof rootApi.registerEasing).toBe("function");
  });

  it("exports TypeScript types for presets, recipes, DNA, and catalogue", () => {
    expectTypeOf<DeclarativeMotionRecipe>().toBeObject();
    expectTypeOf<MotionPreset>().toBeObject();
    expectTypeOf<CapabilityMetadata>().toBeObject();
    expectTypeOf<ChoreographyDefinition>().toBeObject();
    expectTypeOf<DesignSystem>().toBeObject();
    expectTypeOf<MotionDNA>().toBeObject();
    expectTypeOf<AdaptiveMotionConfig>().toBeObject();
  });
});

describe("Public API Completeness - Subpaths: Presets, Recipes & AI Discovery (af-motion/presets)", () => {
  it("exposes full preset registry and execution tools", () => {
    expect(presetsApi.PRESET_SCHEMA_VERSION).toBe("1.0.0");
    expect(Array.isArray(presetsApi.BUILT_IN_MOTION_PRESETS)).toBe(true);
    expect(presetsApi.BUILT_IN_MOTION_PRESETS.length).toBeGreaterThan(20);
    expect(typeof presetsApi.listPresets).toBe("function");
    expect(typeof presetsApi.getPreset).toBe("function");
    expect(typeof presetsApi.searchPresets).toBe("function");
    expect(typeof presetsApi.applyPreset).toBe("function");
    expect(typeof presetsApi.registerPreset).toBe("function");
    expect(typeof presetsApi.validatePreset).toBe("function");
    expect(typeof presetsApi.exportPresetsJson).toBe("function");
  });

  it("exposes full declarative recipe registry and composition tools", () => {
    expect(presetsApi.RECIPE_SCHEMA_VERSION).toBe("1.0.0");
    expect(Array.isArray(presetsApi.BUILT_IN_MOTION_RECIPES)).toBe(true);
    expect(typeof presetsApi.listRecipes).toBe("function");
    expect(typeof presetsApi.getRecipe).toBe("function");
    expect(typeof presetsApi.searchRecipes).toBe("function");
    expect(typeof presetsApi.runRecipe).toBe("function");
    expect(typeof presetsApi.registerRecipe).toBe("function");
    expect(typeof presetsApi.composeRecipe).toBe("function");
    expect(typeof presetsApi.validateRecipe).toBe("function");
    expect(typeof presetsApi.exportRecipeJson).toBe("function");
  });

  it("exposes Motion DNA system tools", () => {
    expect(presetsApi.MOTION_DNA_SCHEMA_VERSION).toBe("1.0.0");
    expect(typeof presetsApi.listMotionDNA).toBe("function");
    expect(typeof presetsApi.getMotionDNA).toBe("function");
    expect(typeof presetsApi.resolveMotionDNA).toBe("function");
    expect(typeof presetsApi.applyMotionDNA).toBe("function");
    expect(typeof presetsApi.registerMotionDNA).toBe("function");
    expect(typeof presetsApi.validateMotionDNA).toBe("function");
  });

  it("exposes Adaptive Motion system tools", () => {
    expect(presetsApi.ADAPTIVE_MOTION_SCHEMA_VERSION).toBe("1.0.0");
    expect(typeof presetsApi.adaptAnimationOptions).toBe("function");
    expect(typeof presetsApi.detectRuntimeContext).toBe("function");
    expect(typeof presetsApi.getAdaptiveMotionConfig).toBe("function");
    expect(typeof presetsApi.setAdaptiveMotionConfig).toBe("function");
    expect(typeof presetsApi.enableAdaptiveMotion).toBe("function");
    expect(typeof presetsApi.disableAdaptiveMotion).toBe("function");
  });

  it("exposes Design System layer tools", () => {
    expect(presetsApi.DESIGN_SYSTEM_SCHEMA_VERSION).toBe("1.0.0");
    expect(Array.isArray(presetsApi.BUILT_IN_DESIGN_SYSTEMS)).toBe(true);
    expect(typeof presetsApi.listDesignSystems).toBe("function");
    expect(typeof presetsApi.getDesignSystem).toBe("function");
    expect(typeof presetsApi.resolveDesignSystem).toBe("function");
    expect(typeof presetsApi.createDesignSystem).toBe("function");
    expect(typeof presetsApi.registerDesignSystem).toBe("function");
    expect(typeof presetsApi.validateDesignSystem).toBe("function");
  });

  it("exposes Advanced Choreography tools", () => {
    expect(presetsApi.CHOREOGRAPHY_SCHEMA_VERSION).toBe("1.0.0");
    expect(Array.isArray(presetsApi.BUILT_IN_CHOREOGRAPHIES)).toBe(true);
    expect(typeof presetsApi.listChoreographies).toBe("function");
    expect(typeof presetsApi.getChoreography).toBe("function");
    expect(typeof presetsApi.searchChoreographies).toBe("function");
    expect(typeof presetsApi.registerChoreography).toBe("function");
    expect(typeof presetsApi.createMotionChoreography).toBe("function");
    expect(typeof presetsApi.validateChoreography).toBe("function");
  });
});

describe("Public API Completeness - Catalogue Subpath (af-motion/catalogue)", () => {
  it("exposes capability catalogue inspection and validation", () => {
    expect(catalogueApi.SCHEMA_VERSION).toBe("1.0.0");
    expect(Array.isArray(catalogueApi.CAPABILITIES)).toBe(true);
    expect(catalogueApi.CAPABILITIES.length).toBeGreaterThan(60);
    expect(typeof catalogueApi.listCapabilities).toBe("function");
    expect(typeof catalogueApi.getCapability).toBe("function");
    expect(typeof catalogueApi.searchCapabilities).toBe("function");
    expect(typeof catalogueApi.listCategories).toBe("function");
    expect(typeof catalogueApi.validateCapabilityConfiguration).toBe("function");
    expect(typeof catalogueApi.exportCatalogueJson).toBe("function");
    expect(typeof catalogueApi.exportCatalogueDocument).toBe("function");
  });

  it("re-exports preset, recipe, DNA, adaptive, and choreography discovery tools", () => {
    expect(typeof catalogueApi.listPresets).toBe("function");
    expect(typeof catalogueApi.listRecipes).toBe("function");
    expect(typeof catalogueApi.listMotionDNA).toBe("function");
    expect(typeof catalogueApi.getAdaptiveMotionConfig).toBe("function");
    expect(typeof catalogueApi.listDesignSystems).toBe("function");
    expect(typeof catalogueApi.listChoreographies).toBe("function");
  });
});

describe("Public API Completeness - React Integration (af-motion/react)", () => {
  it("exposes all documented hooks and components", () => {
    expect(typeof reactApi.useAnimate).toBe("function");
    expect(typeof reactApi.useInView).toBe("function");
    expect(typeof reactApi.useScrollProgress).toBe("function");
    expect(typeof reactApi.useScrollVelocity).toBe("function");
    expect(typeof reactApi.useSequence).toBe("function");
    expect(typeof reactApi.useParallel).toBe("function");
    expect(typeof reactApi.useTimeline).toBe("function");
    expect(typeof reactApi.Reveal).toBe("object"); // forwardRef component
    expect(typeof reactApi.AnimatedText).toBe("object"); // forwardRef component
  });
});
