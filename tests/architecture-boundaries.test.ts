import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

function scanDir(dir: string): string[] {
  let files: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(scanDir(full));
    } else if (entry.name.endsWith(".ts")) {
      files.push(full);
    }
  }
  return files;
}

function getRuntimeImports(filePath: string): string[] {
  const content = fs.readFileSync(filePath, "utf8");
  // Strip block comments and line comments
  const stripped = content
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*/g, "");

  const imports: string[] = [];
  const lines = stripped.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("import type") || trimmed.startsWith("export type")) {
      continue; // Pure compile-time type declaration, erased by tsc/bundlers
    }
    const match = /(?:import|export)\s+(?:[\s\S]*?from\s+)?['"](\.[^'"]+)['"]/.exec(trimmed);
    if (match) {
      let importPath = match[1];
      let resolved = path.resolve(path.dirname(filePath), importPath);
      if (resolved.endsWith(".js")) {
        const tsCandidate = resolved.slice(0, -3) + ".ts";
        if (fs.existsSync(tsCandidate)) {
          resolved = tsCandidate;
        }
      } else if (!resolved.endsWith(".ts")) {
        if (fs.existsSync(resolved + ".ts")) {
          resolved = resolved + ".ts";
        } else if (fs.existsSync(path.join(resolved, "index.ts"))) {
          resolved = path.join(resolved, "index.ts");
        }
      }
      if (fs.existsSync(resolved)) {
        imports.push(resolved);
      }
    }
  }
  return imports;
}

describe("Architectural & Dependency Boundaries", () => {
  const rootDir = path.resolve(__dirname, "..");
  const srcDir = path.resolve(rootDir, "src");
  const allSourceFiles = scanDir(srcDir);

  it("ensures framework-independent core, effects, and presets do not import React", () => {
    const nonReactFiles = allSourceFiles.filter((file) => {
      const rel = path.relative(srcDir, file).replace(/\\/g, "/");
      return !rel.startsWith("react.ts") && !rel.endsWith("/react.ts");
    });

    const offenders: string[] = [];
    for (const file of nonReactFiles) {
      const content = fs.readFileSync(file, "utf8");
      const stripped = content.replace(/`[\s\S]*?`/g, '""');
      if (
        stripped.includes('from "react"') ||
        stripped.includes("from 'react'") ||
        stripped.includes('from "react-dom"') || stripped.includes('from "./react') ||
        stripped.includes("from 'react-dom'")
      ) {
        offenders.push(path.relative(rootDir, file));
      }
    }

    expect(offenders).toEqual([]);
  });

  it("guarantees a Directed Acyclic Graph (DAG) with zero runtime circular dependencies across all source files", () => {
    const graph = new Map<string, string[]>();
    for (const file of allSourceFiles) {
      graph.set(file, getRuntimeImports(file));
    }

    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const cycles: string[][] = [];

    function detectCycles(node: string, currentPath: string[]) {
      visited.add(node);
      recursionStack.add(node);

      const neighbors = graph.get(node) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          detectCycles(neighbor, [...currentPath, neighbor]);
        } else if (recursionStack.has(neighbor)) {
          const cycleStartIdx = currentPath.indexOf(neighbor);
          cycles.push([...currentPath.slice(cycleStartIdx), neighbor]);
        }
      }

      recursionStack.delete(node);
    }

    for (const file of allSourceFiles) {
      if (!visited.has(file)) {
        detectCycles(file, [file]);
      }
    }

    expect(cycles).toHaveLength(0);
  });

  it("maintains strict separation of responsibilities among intelligence and token subsystems", async () => {
    // 1. Palettes must exclusively define color palettes without motion or runtime adaptation logic
    const palettes = await import("../src/core/palettes");
    expect(typeof palettes.getPalette).toBe("function");
    expect(typeof palettes.listPalettes).toBe("function");
    expect(palettes).not.toHaveProperty("applyMotionDNA");
    expect(palettes).not.toHaveProperty("adaptAnimationOptions");

    // 2. Motion DNA must exclusively define motion personality/timing without color tokens
    const motionDNA = await import("../src/core/motion-dna");
    expect(typeof motionDNA.applyMotionDNA).toBe("function");
    expect(typeof motionDNA.registerMotionDNA).toBe("function");
    expect(motionDNA).not.toHaveProperty("getPalette");
    expect(motionDNA).not.toHaveProperty("adaptAnimationOptions");

    // 3. Adaptive Motion must exclusively define runtime adaptation logic
    const adaptive = await import("../src/core/adaptive-motion");
    expect(typeof adaptive.adaptAnimationOptions).toBe("function");
    expect(typeof adaptive.inspectAdaptiveMotion).toBe("function");
    expect(adaptive).not.toHaveProperty("getPalette");
    expect(adaptive).not.toHaveProperty("registerMotionDNA");

    // 4. Design System coordinates tokens without owning animation engines
    const designSystem = await import("../src/core/design-system");
    expect(typeof designSystem.resolveDesignSystem).toBe("function");
    expect(typeof designSystem.registerDesignSystem).toBe("function");
    expect(designSystem).not.toHaveProperty("animate");
  });

  it("verifies package configuration keeps optional peer dependencies cleanly decoupled", () => {
    const pkgPath = path.resolve(rootDir, "package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

    expect(pkg.sideEffects).toBe(false);
    expect(pkg.peerDependencies?.react).toBeDefined();
    expect(pkg.peerDependenciesMeta?.react?.optional).toBe(true);

    // Verify subpaths
    expect(pkg.exports["."]).toBeDefined();
    expect(pkg.exports["./react"]).toBeDefined();
    expect(pkg.exports["./presets"]).toBeDefined();
    expect(pkg.exports["./catalogue"]).toBeDefined();
  });
});
