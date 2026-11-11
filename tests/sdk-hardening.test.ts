import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execSync } from "node:child_process";
import * as rootApi from "../src/index.js";
import * as reactApi from "../src/react.js";
import * as catalogueApi from "../src/catalogue.js";
import * as presetsApi from "../src/presets.js";
import { BUILT_IN_PALETTE_INPUTS } from "../src/core/built-in-palettes.js";

interface PackageJson {
  readonly name: string;
  readonly version: string;
  readonly type: string;
  readonly sideEffects: boolean;
  readonly files: readonly string[];
  readonly main: string;
  readonly module: string;
  readonly types: string;
  readonly exports: Record<string, any>;
  readonly bin: Record<string, string>;
  readonly peerDependencies: Record<string, string>;
  readonly peerDependenciesMeta: Record<string, { optional?: boolean }>;
}

interface ApiInventory {
  readonly schemaVersion: string;
  readonly totalExports: number;
  readonly subpaths: Record<
    string,
    {
      readonly exportCount: number;
      readonly namedExports: readonly string[];
    }
  >;
}

describe("Prompt 150 — SDK & Developer Experience Hardening", () => {
  const rootDir = path.resolve(__dirname, "..");
  const pkgPath = path.join(rootDir, "package.json");
  const pkg: PackageJson = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  const inventoryPath = path.join(rootDir, "docs/data/public-api-inventory.json");

  // =========================================================================
  // 1. Package Configuration & Pure ESM Compliance
  // =========================================================================
  describe("1. Package Configuration & Pure ESM Compliance", () => {
    it("is configured as a pure ESM package", () => {
      expect(pkg.type).toBe("module");
      expect(pkg.main).toBe("./dist/index.js");
      expect(pkg.module).toBe("./dist/index.js");
      expect(pkg.types).toBe("./dist/index.d.ts");
    });

    it("enables tree-shaking with sideEffects: false", () => {
      expect(pkg.sideEffects).toBe(false);
    });

    it("declares all 4 official subpaths plus catalog alias in exports", () => {
      expect(pkg.exports).toBeDefined();

      // Root '.'
      expect(pkg.exports["."]).toEqual({
        types: "./dist/index.d.ts",
        import: "./dist/index.js",
        default: "./dist/index.js",
      });

      // './react'
      expect(pkg.exports["./react"]).toEqual({
        types: "./dist/react.d.ts",
        import: "./dist/react.js",
        default: "./dist/react.js",
      });

      // './catalogue'
      expect(pkg.exports["./catalogue"]).toEqual({
        types: "./dist/catalogue.d.ts",
        import: "./dist/catalogue.js",
        default: "./dist/catalogue.js",
      });

      // './catalog' alias
      expect(pkg.exports["./catalog"]).toEqual({
        types: "./dist/catalogue.d.ts",
        import: "./dist/catalogue.js",
        default: "./dist/catalogue.js",
      });

      // './presets'
      expect(pkg.exports["./presets"]).toEqual({
        types: "./dist/presets.d.ts",
        import: "./dist/presets.js",
        default: "./dist/presets.js",
      });

      // './package.json'
      expect(pkg.exports["./package.json"]).toBe("./package.json");
    });

    it("declares both CLI and MCP executable binaries", () => {
      expect(pkg.bin).toEqual({
        "af-motion": "./bin/af-motion.js",
        "af-motion-mcp": "./bin/mcp-server.js",
      });

      expect(fs.existsSync(path.join(rootDir, "bin/af-motion.js"))).toBe(true);
      expect(fs.existsSync(path.join(rootDir, "bin/mcp-server.js"))).toBe(true);
    });

    it("keeps React as an optional peer dependency", () => {
      expect(pkg.peerDependencies.react).toBeDefined();
      expect(pkg.peerDependenciesMeta.react.optional).toBe(true);
    });
  });

  // =========================================================================
  // 2. Public API Inventory Matching & Completeness
  // =========================================================================
  describe("2. Public API Inventory Matching & Completeness", () => {
    it("has a valid machine-readable inventory file", () => {
      expect(fs.existsSync(inventoryPath)).toBe(true);
      const inventory: ApiInventory = JSON.parse(fs.readFileSync(inventoryPath, "utf8"));
      expect(inventory.schemaVersion).toBe("1.0.0");
      expect(inventory.totalExports).toBeGreaterThan(1800);
      expect(inventory.subpaths["af-motion"]).toBeDefined();
      expect(inventory.subpaths["af-motion/react"]).toBeDefined();
      expect(inventory.subpaths["af-motion/catalogue"]).toBeDefined();
      expect(inventory.subpaths["af-motion/presets"]).toBeDefined();
    });

    it("matches all named exports for root entry point (af-motion)", () => {
      const inventory: ApiInventory = JSON.parse(fs.readFileSync(inventoryPath, "utf8"));
      const rootInventory = inventory.subpaths["af-motion"];
      const actualKeys = Object.keys(rootApi);

      expect(actualKeys.length).toBe(rootInventory.exportCount);
      for (const name of rootInventory.namedExports) {
        expect((rootApi as any)[name]).toBeDefined();
      }

      // Check key primitives
      expect(typeof rootApi.animate).toBe("function");
      expect(typeof rootApi.animateSpring).toBe("function");
      expect(typeof rootApi.animateProgress).toBe("function");
      expect(typeof rootApi.createTimeline).toBe("function");
      expect(typeof rootApi.easings).toBe("object");
      expect(typeof rootApi.aurora).toBe("function");
      expect(typeof rootApi.particleField).toBe("function");
      expect(typeof rootApi.tilt).toBe("function");
    });

    it("matches all named exports for React entry point (af-motion/react)", () => {
      const inventory: ApiInventory = JSON.parse(fs.readFileSync(inventoryPath, "utf8"));
      const reactInventory = inventory.subpaths["af-motion/react"];
      const actualKeys = Object.keys(reactApi);

      expect(actualKeys.length).toBe(reactInventory.exportCount);
      for (const name of reactInventory.namedExports) {
        expect((reactApi as any)[name]).toBeDefined();
      }

      // Check key React components and hooks
      expect(typeof reactApi.useAnimate).toBe("function");
      expect(typeof reactApi.useInView).toBe("function");
      expect(typeof reactApi.useScrollProgress).toBe("function");
      expect(typeof reactApi.useScrollVelocity).toBe("function");
      expect(typeof reactApi.useMicrointeraction).toBe("function");
      expect(typeof reactApi.useMotionAccessibility).toBe("function");
      expect(["function", "object"].includes(typeof reactApi.Reveal)).toBe(true);
      expect(["function", "object"].includes(typeof reactApi.Interactive)).toBe(true);
      expect(["function", "object"].includes(typeof reactApi.GlassSurface)).toBe(true);
    });

    it("matches all named exports for Catalogue entry point (af-motion/catalogue)", () => {
      const inventory: ApiInventory = JSON.parse(fs.readFileSync(inventoryPath, "utf8"));
      const catInventory = inventory.subpaths["af-motion/catalogue"];
      const actualKeys = Object.keys(catalogueApi);

      expect(actualKeys.length).toBe(catInventory.exportCount);
      for (const name of catInventory.namedExports) {
        expect((catalogueApi as any)[name]).toBeDefined();
      }

      // Check key Catalogue intelligence & 3D exports
      expect(typeof catalogueApi.aiMotionRegistry).toBe("object");
      expect(typeof catalogueApi.visualStyleRegistry).toBe("object");
      expect(typeof catalogueApi.recommendAnimation).toBe("function");
      expect(typeof catalogueApi.validateMotionConfig).toBe("function");
      expect(typeof catalogueApi.composeScene).toBe("function");
    });

    it("matches all named exports for Presets entry point (af-motion/presets)", () => {
      const inventory: ApiInventory = JSON.parse(fs.readFileSync(inventoryPath, "utf8"));
      const presetsInventory = inventory.subpaths["af-motion/presets"];
      const actualKeys = Object.keys(presetsApi);

      expect(actualKeys.length).toBe(presetsInventory.exportCount);
      for (const name of presetsInventory.namedExports) {
        expect((presetsApi as any)[name]).toBeDefined();
      }

      // Check key Presets exports
      expect(typeof presetsApi.listPresets).toBe("function");
      expect(typeof presetsApi.applyPreset).toBe("function");
      expect(typeof presetsApi.getPreset).toBe("function");
      expect(typeof presetsApi.runRecipe).toBe("function");
    });
  });

  // =========================================================================
  // 3. Built Artifacts & Browser Isolation
  // =========================================================================
  describe("3. Built Artifacts & Browser Isolation", () => {
    it("ensures all distribution files and declaration maps exist", () => {
      const expectedDistFiles = [
        "dist/index.js",
        "dist/index.d.ts",
        "dist/react.js",
        "dist/react.d.ts",
        "dist/catalogue.js",
        "dist/catalogue.d.ts",
        "dist/presets.js",
        "dist/presets.d.ts",
        "dist/cli.js",
      ];

      for (const rel of expectedDistFiles) {
        const full = path.join(rootDir, rel);
        expect(fs.existsSync(full), `Missing expected build artifact: ${rel}`).toBe(true);
      }
    });

    it("verifies browser entry points do NOT leak Node-specific builtins", () => {
      const browserBundles = [
        "dist/index.js",
        "dist/react.js",
        "dist/catalogue.js",
        "dist/presets.js",
      ];

      const forbiddenNodeImports = [
        'from "node:fs"',
        "from 'node:fs'",
        'from "node:child_process"',
        "from 'node:child_process'",
        'from "node:readline"',
        "from 'node:readline'",
        'from "child_process"',
        "from 'child_process'",
        'from "readline"',
        "from 'readline'",
      ];

      for (const bundle of browserBundles) {
        const content = fs.readFileSync(path.join(rootDir, bundle), "utf8");
        for (const forbidden of forbiddenNodeImports) {
          expect(content).not.toContain(forbidden);
        }
      }
    });

    it("ensures CLI binary executes cleanly via node without module errors", () => {
      const output = execSync(`node bin/af-motion.js --version`, {
        cwd: rootDir,
        encoding: "utf8",
      });
      expect(output.trim()).toBe(`af-motion v${pkg.version}`);
    });
  });

  // =========================================================================
  // 4. Packaging & Distributable Tarball Inspection
  // =========================================================================
  describe("4. Packaging & Distributable Tarball Inspection", () => {
    it("contains only allowed files in npm pack manifest", { timeout: 20000 }, () => {
      const packResult = execSync(`npm pack --dry-run --json --ignore-scripts`, {
        cwd: rootDir,
        encoding: "utf8",
      });
      const parsed = JSON.parse(packResult);
      expect(Array.isArray(parsed)).toBe(true);
      const manifest = parsed[0];
      const files: { path: string }[] = manifest.files;

      const filePaths = files.map((f) => f.path);

      // Must include dist/ files
      expect(filePaths.some((p) => p.startsWith("dist/index.js"))).toBe(true);
      expect(filePaths.some((p) => p.startsWith("dist/react.js"))).toBe(true);
      expect(filePaths.some((p) => p.startsWith("dist/catalogue.js"))).toBe(true);
      expect(filePaths.some((p) => p.startsWith("dist/presets.js"))).toBe(true);
      expect(filePaths.some((p) => p.startsWith("dist/cli.js"))).toBe(true);
      expect(filePaths.some((p) => p.startsWith("bin/af-motion.js"))).toBe(true);
      expect(filePaths.some((p) => p.startsWith("bin/mcp-server.js"))).toBe(true);
      expect(filePaths).toContain("package.json");
      expect(filePaths).toContain("README.md");

      // Must NOT include raw source code, tests, docs, or studio
      expect(filePaths.some((p) => p.startsWith("src/"))).toBe(false);
      expect(filePaths.some((p) => p.startsWith("tests/"))).toBe(false);
      expect(filePaths.some((p) => p.startsWith("studio/"))).toBe(false);
      expect(filePaths.some((p) => p.startsWith("docs/"))).toBe(false);
      expect(filePaths.some((p) => p.startsWith(".github/"))).toBe(false);
    });

    it("simulates external TypeScript consumer compilation across all 4 subpaths", { timeout: 20000 }, () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "af-motion-consumer-"));
      try {
        const tsconfigContent = {
          compilerOptions: {
            target: "ES2022",
            module: "ESNext",
            moduleResolution: "bundler",
            strict: true,
            skipLibCheck: true,
            paths: {
              "af-motion": [path.join(rootDir, "dist/index.d.ts")],
              "af-motion/react": [path.join(rootDir, "dist/react.d.ts")],
              "af-motion/catalogue": [path.join(rootDir, "dist/catalogue.d.ts")],
              "af-motion/presets": [path.join(rootDir, "dist/presets.d.ts")],
            },
          },
        };

        const consumerSource = `
          import { animate, easings } from "af-motion";
          import { useAnimate, Reveal } from "af-motion/react";
          import { aiMotionRegistry, visualStyleRegistry, validateMotionConfig } from "af-motion/catalogue";
          import { listPresets, applyPreset } from "af-motion/presets";

          const t = animate(null as any, { opacity: [0, 1] }, { duration: 300 });
          const presets = listPresets();
          const validation = validateMotionConfig({ duration: 300 });
        `;

        fs.writeFileSync(
          path.join(tempDir, "tsconfig.json"),
          JSON.stringify(tsconfigContent, null, 2),
          "utf8"
        );
        fs.writeFileSync(path.join(tempDir, "index.ts"), consumerSource, "utf8");

        execSync(`npx tsc -p "${tempDir}/tsconfig.json" --noEmit`, {
          cwd: rootDir,
          encoding: "utf8",
        });
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });
  });

  // =========================================================================
  // 5. Diagnostics, Validation & Error Handling
  // =========================================================================
  describe("5. Diagnostics, Validation & Error Handling", () => {
    it("reports structured validation warnings with actionable guidance for layout properties", () => {
      const configWithLayout = {
        duration: 500,
        properties: {
          width: 100, // Non-GPU property
        },
      };

      const result = catalogueApi.validateMotionConfig(configWithLayout as any);
      expect(result.issues.length).toBeGreaterThan(0);

      const layoutIssue = result.issues.find((i: any) => i.property === "width");
      expect(layoutIssue).toBeDefined();
      expect(layoutIssue?.suggestedFix).toContain("transform");
      expect(layoutIssue?.category).toBe("layout-thrashing");
    });

    it("rejects invalid non-object configs with valid: false", () => {
      const nullResult = catalogueApi.validateMotionConfig(null as any);
      expect(nullResult.valid).toBe(false);
      expect(nullResult.issues.length).toBe(1);
      expect(nullResult.issues[0].severity).toBe("error");
    });

    it("ensures exactly 33 built-in palettes and 19 visual styles are registered", () => {
      expect(BUILT_IN_PALETTE_INPUTS.length).toBe(33);
      expect(catalogueApi.visualStyleRegistry.listVisualStyles().length).toBe(19);
    });
  });
});
