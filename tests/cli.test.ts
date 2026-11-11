import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { execFileSync } from "node:child_process";
import {
  parseArgs,
  runCLI,
  Terminal,
  executeInit,
  executeDoctor,
  executeValidate,
  executePresetsList,
  executePresetInspect,
  executePresetExport,
  executeInfo,
  executeExample,
  getCapabilityInfo,
  validateConfigFile,
} from "../src/cli/index.js";

describe("Prompt 149 — Developer Tooling & CLI Experience", () => {
  let tmpDir: string;
  const binPath = path.resolve("bin/af-motion.js");

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "af-motion-cli-test-"));
  });

  afterEach(() => {
    try {
      if (fs.existsSync(tmpDir)) {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    } catch {}
  });

  // -------------------------------------------------------------------------
  // 1. Argument Parsing & UX
  // -------------------------------------------------------------------------
  describe("1. Command Parsing & UX Basics", () => {
    it("correctly parses command, positional arguments, and flags", () => {
      const parsed = parseArgs(["init", "my-app", "--template", "react-ts", "--force", "--json"]);
      expect(parsed.command).toBe("init");
      expect(parsed.positional).toEqual(["my-app"]);
      expect(parsed.options.template).toBe("react-ts");
      expect(parsed.options.force).toBe(true);
      expect(parsed.options.json).toBe(true);
    });

    it("parses global flags --help and --version", () => {
      const parsedHelp = parseArgs(["--help"]);
      expect(parsedHelp.options.help).toBe(true);

      const parsedVer = parseArgs(["-v"]);
      expect(parsedVer.options.version).toBe(true);
    });

    it("handles Terminal color suppression with NO_COLOR", () => {
      const termNoColor = new Terminal(false);
      expect(termNoColor.isColorEnabled()).toBe(false);
      expect(termNoColor.green("Hello")).toBe("Hello");

      const termColor = new Terminal(true);
      expect(termColor.isColorEnabled()).toBe(true);
      expect(termColor.green("Hello")).toContain("\x1b[32m");
    });
  });

  // -------------------------------------------------------------------------
  // 2. Project Initialization (`af-motion init`)
  // -------------------------------------------------------------------------
  describe("2. Project Initialization (af-motion init)", () => {
    it("initializes a Vanilla TypeScript project with starter file and config", async () => {
      const res = await executeInit({
        cwd: tmpDir,
        template: "vanilla-ts",
        quiet: true,
      });

      expect(res.success).toBe(true);
      expect(res.template).toBe("vanilla-ts");
      expect(fs.existsSync(path.join(tmpDir, "animation.ts"))).toBe(true);
      expect(fs.existsSync(path.join(tmpDir, "af-motion.config.json"))).toBe(true);

      const animContent = fs.readFileSync(path.join(tmpDir, "animation.ts"), "utf8");
      expect(animContent).toContain('import { animate, type AnimationControls } from "af-motion";');
    });

    it("initializes a React TypeScript project with React bindings", async () => {
      const res = await executeInit({
        cwd: tmpDir,
        template: "react-ts",
        quiet: true,
      });

      expect(res.success).toBe(true);
      expect(res.template).toBe("react-ts");
      expect(fs.existsSync(path.join(tmpDir, "AnimatedCard.tsx"))).toBe(true);

      const reactContent = fs.readFileSync(path.join(tmpDir, "AnimatedCard.tsx"), "utf8");
      expect(reactContent).toContain('"use client";');
      expect(reactContent).toContain('import { useAnimate, useMicrointeraction, Reveal } from "af-motion/react";');
    });

    it("protects existing files from being overwritten without --force", async () => {
      // Create existing animation.js with custom user code
      const customCode = "// User proprietary code";
      fs.writeFileSync(path.join(tmpDir, "animation.js"), customCode, "utf8");

      const res = await executeInit({
        cwd: tmpDir,
        template: "vanilla-js",
        force: false,
        quiet: true,
      });

      expect(res.skippedFiles).toContain("animation.js");
      const preserved = fs.readFileSync(path.join(tmpDir, "animation.js"), "utf8");
      expect(preserved).toBe(customCode);
    });

    it("overwrites existing files when --force is provided", async () => {
      fs.writeFileSync(path.join(tmpDir, "animation.js"), "// Old code", "utf8");

      const res = await executeInit({
        cwd: tmpDir,
        template: "vanilla-js",
        force: true,
        quiet: true,
      });

      expect(res.createdFiles).toContain("animation.js");
      const updated = fs.readFileSync(path.join(tmpDir, "animation.js"), "utf8");
      expect(updated).toContain('import { animate } from "af-motion";');
    });
  });

  // -------------------------------------------------------------------------
  // 3. Project Diagnostics (`af-motion doctor`)
  // -------------------------------------------------------------------------
  describe("3. Project Diagnostics (af-motion doctor)", () => {
    it("runs read-only diagnostic checks and returns structured report", async () => {
      const report = await executeDoctor({ cwd: process.cwd(), quiet: true });

      expect(report.checks.length).toBeGreaterThanOrEqual(5);
      expect(report.passedCount).toBeGreaterThanOrEqual(4);
      expect(report.overallStatus).not.toBe("fail");

      const checkIds = report.checks.map((c) => c.id);
      expect(checkIds).toContain("node-version");
      expect(checkIds).toContain("package-json");
      expect(checkIds).toContain("subpath-availability");
    });

    it("detects missing package.json and returns a helpful warning", async () => {
      const report = await executeDoctor({ cwd: tmpDir, quiet: true });
      const pkgCheck = report.checks.find((c) => c.id === "package-json");

      expect(pkgCheck).toBeDefined();
      expect(pkgCheck?.status).toBe("warn");
      expect(pkgCheck?.remediation).toBeDefined();
    });
  });

  // -------------------------------------------------------------------------
  // 4. Configuration Validation (`af-motion validate`)
  // -------------------------------------------------------------------------
  describe("4. Configuration Validation (af-motion validate)", () => {
    it("validates starter af-motion.config.json as strictly valid", () => {
      const configPath = path.join(tmpDir, "af-motion.config.json");
      fs.writeFileSync(
        configPath,
        JSON.stringify({
          defaultMotionDNA: "playful",
          defaultPalette: "Cobalt Classic",
          accessibility: { respectReducedMotion: true, fallbackDurationMs: 0 },
        }),
        "utf8"
      );

      const report = validateConfigFile(configPath);
      expect(report.valid).toBe(true);
      expect(report.summary.errors).toBe(0);
    });

    it("catches unknown Motion DNA profile and suggests verified profiles", () => {
      const configPath = path.join(tmpDir, "af-motion.config.json");
      fs.writeFileSync(
        configPath,
        JSON.stringify({
          defaultMotionDNA: "super-fast-chaos",
        }),
        "utf8"
      );

      const report = validateConfigFile(configPath);
      expect(report.valid).toBe(false);
      expect(report.summary.errors).toBe(1);
      const dnaFinding = report.findings.find((f) => f.path === "$.defaultMotionDNA");
      expect(dnaFinding?.message).toContain("Unknown Motion DNA profile");
      expect(dnaFinding?.suggestion).toContain("playful");
    });

    it("catches unknown palette and reminds of the 33 built-in palettes", () => {
      const configPath = path.join(tmpDir, "af-motion.config.json");
      fs.writeFileSync(
        configPath,
        JSON.stringify({
          defaultPalette: "Random Nonexistent Palette",
        }),
        "utf8"
      );

      const report = validateConfigFile(configPath);
      expect(report.valid).toBe(false);
      const paletteFinding = report.findings.find((f) => f.path === "$.defaultPalette");
      expect(paletteFinding?.message).toContain("Unknown palette");
      expect(paletteFinding?.suggestion).toContain("33 built-in palettes");
    });
  });

  // -------------------------------------------------------------------------
  // 5. Presets Command (`af-motion presets`)
  // -------------------------------------------------------------------------
  describe("5. Preset Discovery & Inspection (af-motion presets)", () => {
    it("inspects registered preset and returns characteristics", async () => {
      const preset = await executePresetInspect("fadeIn", { quiet: true });
      expect(preset).not.toBeNull();
      expect(preset?.name).toBe("fadeIn");
      expect(preset?.category).toBe("entrance");
      expect(preset?.duration).toBe(400);
      expect(preset?.properties).toEqual({ opacity: [0, 1] });
    });

    it("exports preset as standalone TypeScript snippet", async () => {
      const exportPath = path.join(tmpDir, "preset-fade.ts");
      const ok = await executePresetExport("fadeIn", {
        format: "ts",
        out: exportPath,
        cwd: tmpDir,
      });

      expect(ok).toBe(true);
      expect(fs.existsSync(exportPath)).toBe(true);
      const content = fs.readFileSync(exportPath, "utf8");
      expect(content).toContain('import { applyPreset } from "af-motion/presets";');
      expect(content).toContain('applyPreset(target, "fadeIn");');
    });
  });

  // -------------------------------------------------------------------------
  // 6. Capability & System Info (`af-motion info`)
  // -------------------------------------------------------------------------
  describe("6. System Capabilities & Registries (af-motion info)", () => {
    it("returns accurate capability counts matching repository truth", () => {
      const info = getCapabilityInfo();

      expect(info.version).toBe("0.1.0");
      expect(info.subpaths.core).toBe("af-motion");
      expect(info.subpaths.react).toBe("af-motion/react");
      expect(info.subpaths.catalogue).toBe("af-motion/catalogue");
      expect(info.subpaths.presets).toBe("af-motion/presets");

      expect(info.palettesCount).toBe(33);
      expect(info.visualStylesCount).toBe(19);
      expect(info.easingsCount).toBe(56);
      expect(info.presetsCount).toBeGreaterThanOrEqual(30);
      expect(info.aiCapabilities.length).toBeGreaterThanOrEqual(6);
    });
  });

  // -------------------------------------------------------------------------
  // 7. Example Generation (`af-motion example`)
  // -------------------------------------------------------------------------
  describe("7. Example Generation (af-motion example)", () => {
    it("generates spring physics example using official exports", async () => {
      const outPath = path.join(tmpDir, "spring-demo.ts");
      const ok = await executeExample("spring", {
        out: outPath,
        cwd: tmpDir,
      });

      expect(ok).toBe(true);
      expect(fs.existsSync(outPath)).toBe(true);
      const content = fs.readFileSync(outPath, "utf8");
      expect(content).toContain('import { animateSpring } from "af-motion";');
      expect(content).toContain("stiffness: 260");
    });

    it("generates React component example with useAnimate", async () => {
      const outPath = path.join(tmpDir, "Hero.tsx");
      const ok = await executeExample("react", {
        out: outPath,
        lang: "ts",
        cwd: tmpDir,
      });

      expect(ok).toBe(true);
      expect(fs.existsSync(outPath)).toBe(true);
      const content = fs.readFileSync(outPath, "utf8");
      expect(content).toContain('"use client";');
      expect(content).toContain('from "af-motion/react"');
    });
  });

  // -------------------------------------------------------------------------
  // 8. CLI Exit Codes & Error Handling
  // -------------------------------------------------------------------------
  describe("8. CLI Exit Codes & Process Execution", () => {
    it("returns code 0 on --version and --help", async () => {
      expect(await runCLI(["--version"])).toBe(0);
      expect(await runCLI(["--help"])).toBe(0);
    });

    it("returns code 2 on unknown command", async () => {
      expect(await runCLI(["unknown-cmd-xyz"])).toBe(2);
    });

    it("executes bin/af-motion.js binary via Node subprocess", () => {
      const stdout = execFileSync(process.execPath, [binPath, "--version"], {
        encoding: "utf8",
      });
      expect(stdout.trim()).toBe("af-motion v0.1.0");
    });

    it("executes af-motion info --json via subprocess and parses valid JSON", () => {
      const stdout = execFileSync(process.execPath, [binPath, "info", "--json"], {
        encoding: "utf8",
      });
      const parsed = JSON.parse(stdout);
      expect(parsed.version).toBe("0.1.0");
      expect(parsed.palettesCount).toBe(33);
      expect(parsed.visualStylesCount).toBe(19);
    });
  });

  // -------------------------------------------------------------------------
  // 9. Package & Browser Bundle Isolation
  // -------------------------------------------------------------------------
  describe("9. Package & Browser Bundle Isolation", () => {
    it("confirms package.json declares bin entries correctly", () => {
      const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
      expect(pkg.bin).toBeDefined();
      expect(pkg.bin["af-motion"]).toBe("./bin/af-motion.js");
      expect(fs.existsSync(path.resolve(pkg.bin["af-motion"]))).toBe(true);
    });

    it("verifies browser library bundles do not leak Node or CLI modules", () => {
      const indexBundle = fs.readFileSync("dist/index.js", "utf8");
      expect(indexBundle).not.toContain("node:fs");
      expect(indexBundle).not.toContain("node:path");
      expect(indexBundle).not.toContain("node:process");
      expect(indexBundle).not.toContain("runCLI");

      const reactBundle = fs.readFileSync("dist/react.js", "utf8");
      expect(reactBundle).not.toContain("node:fs");
      expect(reactBundle).not.toContain("runCLI");
    });
  });
});
