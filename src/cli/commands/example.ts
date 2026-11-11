/**
 * AF Motion CLI — `af-motion example`
 *
 * Generates standalone, compilable starter examples for core animation,
 * physical springs, React hooks, Motion DNA, 3D scenes, and offline AI intelligence.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import type { ExampleGenerateOptions, ExampleType } from "../types.js";
import { getExampleContent } from "../utils/templates.js";
import { term } from "../utils/terminal.js";
import { resolveSafeWorkspacePath } from "../utils/safety.js";

export const VALID_EXAMPLE_TYPES: readonly ExampleType[] = [
  "basic",
  "reveal-stagger",
  "spring",
  "timeline",
  "react",
  "motion-dna",
  "3d",
  "ai-quality",
  "design-to-motion",
];

export async function executeExample(
  type?: string,
  options: ExampleGenerateOptions = {}
): Promise<boolean> {
  const cwd = path.resolve(options.cwd ?? process.cwd());

  if (!type || !VALID_EXAMPLE_TYPES.includes(type as ExampleType)) {
    console.log(term.banner("AF Motion Example Generator"));
    console.log("");
    if (type) {
      console.log(term.fail(`Unknown example type: '${type}'`));
      console.log("");
    }
    console.log(term.bold("Available Example Types:"));
    console.log(`  ${term.cyan("basic")}            - Core WAAPI animation with hardware-accelerated transforms`);
    console.log(`  ${term.cyan("reveal-stagger")}   - Scroll reveal and staggered item animations`);
    console.log(`  ${term.cyan("spring")}           - Damped physical spring simulation (animateSpring)`);
    console.log(`  ${term.cyan("timeline")}         - Coordinated multi-track timeline choreography`);
    console.log(`  ${term.cyan("react")}            - React 18/19 components with useAnimate & useMicrointeraction`);
    console.log(`  ${term.cyan("motion-dna")}       - Resolving and applying Motion DNA kinetic curves`);
    console.log(`  ${term.cyan("3d")}               - 3D SceneEngine with geometry, lighting & materials`);
    console.log(`  ${term.cyan("ai-quality")}       - Offline motion quality evaluation and recommendations`);
    console.log(`  ${term.cyan("design-to-motion")} - Deterministic Design-to-Motion specification generation`);
    console.log("");
    console.log(`Usage: ${term.cyan("af-motion example <type> [--lang ts|js] [--out <path>]")}`);
    return false;
  }

  const selectedType = type as ExampleType;
  const lang = options.lang ?? "ts";
  if (lang !== "ts" && lang !== "js") {
    console.error(term.fail(`Invalid --lang '${String(lang)}'. Expected 'ts' or 'js'.`));
    return false;
  }
  const example = getExampleContent(selectedType, lang);

  if (options.print) {
    console.log(example.content);
    return true;
  }

  const outFilename = options.out ?? example.filename;
  const targetPath = resolveSafeWorkspacePath(cwd, outFilename, "example output path");

  if (fs.existsSync(targetPath) && !options.force) {
    console.error(term.fail(`Target file '${outFilename}' already exists. Use --force to overwrite.`));
    return false;
  }

  try {
    const parentDir = path.dirname(targetPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.writeFileSync(targetPath, example.content, "utf8");
    console.log(term.pass(`Generated [${selectedType}] example: ${term.bold(path.relative(cwd, targetPath) || outFilename)}`));
    console.log(`Language: ${lang.toUpperCase()}`);
    return true;
  } catch (err: any) {
    console.error(term.fail(`Failed to write example: ${err.message}`));
    return false;
  }
}
