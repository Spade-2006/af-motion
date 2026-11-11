/**
 * AF Motion CLI — `af-motion presets`
 *
 * Discovery, inspection, and export of standardized animation recipes and presets
 * reusing the official registry from `src/presets.ts`.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as process from "node:process";
import {
  listPresets,
  listPresetCategories,
  getPreset,
  getPresetsByCategory,
  searchPresets,
} from "../../presets.js";
import type {
  PresetExportOptions,
  PresetInspectResult,
  PresetsListOptions,
} from "../types.js";
import { term } from "../utils/terminal.js";
import { resolveSafeWorkspacePath } from "../utils/safety.js";
import { sanitizeCommentText } from "../../core/utils/safe-json.js";

export async function executePresetsList(options: PresetsListOptions = {}): Promise<void> {
  let presets = listPresets();

  if (options.category) {
    presets = getPresetsByCategory(options.category as any);
  }

  if (options.search) {
    presets = searchPresets(options.search);
  }

  if (options.json) {
    console.log(JSON.stringify(presets, null, 2));
    return;
  }

  console.log(term.banner("AF Motion Preset Discovery"));
  console.log("");
  console.log(`Found ${term.bold(String(presets.length))} presets matching filters:`);
  console.log("");

  const headers = ["Name", "Category", "Duration", "Description"];
  const rows = presets.slice(0, 25).map((p) => [
    term.cyan(p.name),
    p.category,
    `${p.animation?.duration ?? 400}ms`,
    p.description.slice(0, 50) + (p.description.length > 50 ? "..." : ""),
  ]);

  console.log(term.table(headers, rows));

  if (presets.length > 25) {
    console.log("");
    console.log(term.dim(`... and ${presets.length - 25} more presets. Use --search or --category to filter.`));
  }

  console.log("");
  console.log(`Inspect preset: ${term.cyan("af-motion presets inspect <name>")}`);
  console.log(`Export preset:  ${term.cyan("af-motion presets export <name> --format ts")}`);
}

export async function executePresetInspect(
  name: string,
  options: PresetsListOptions = {}
): Promise<PresetInspectResult | null> {
  const preset = getPreset(name);

  if (!preset) {
    if (options.json) {
      console.log(JSON.stringify({ error: `Preset '${name}' not found.` }, null, 2));
    } else {
      console.error(term.fail(`Preset '${name}' not found.`));
      console.error(`Run ${term.cyan("af-motion presets")} to view all registered presets.`);
    }
    return null;
  }

  const result: PresetInspectResult = {
    id: preset.id,
    name: preset.name,
    category: preset.category,
    description: preset.description,
    duration: preset.animation?.duration ?? 400,
    easing: typeof preset.animation?.easing === "string" ? preset.animation.easing : "easeOutCubic",
    tags: preset.tags,
    properties: preset.animation?.properties as Record<string, unknown>,
    characteristics: preset.configurableParameters as unknown as Record<string, unknown>,
  };

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(term.banner(`Preset: ${preset.name}`, preset.id));
    console.log("");
    console.log(`Category:    ${term.cyan(preset.category)}`);
    console.log(`Duration:    ${term.bold(String(preset.animation?.duration ?? 400))}ms`);
    console.log(`Easing:      ${String(preset.animation?.easing ?? "easeOutCubic")}`);
    console.log(`Description: ${preset.description}`);
    if (preset.tags && preset.tags.length > 0) {
      console.log(`Tags:        ${preset.tags.join(", ")}`);
    }

    if (preset.animation?.properties) {
      console.log("");
      console.log(term.bold("Animation Properties:"));
      console.log(JSON.stringify(preset.animation.properties, null, 2));
    }
  }

  return result;
}

export async function executePresetExport(
  name: string,
  options: PresetExportOptions = {}
): Promise<boolean> {
  const preset = getPreset(name);
  if (!preset) {
    console.error(term.fail(`Cannot export unknown preset '${name}'.`));
    return false;
  }

  const format = options.format ?? "json";
  if (format !== "json" && format !== "ts") {
    console.error(term.fail(`Invalid export format '${String(format)}'. Expected 'json' or 'ts'.`));
    return false;
  }
  let content = "";

  if (format === "json") {
    content = JSON.stringify(
      {
        id: preset.id,
        name: preset.name,
        category: preset.category,
        duration: preset.animation?.duration ?? 400,
        easing: typeof preset.animation?.easing === "string" ? preset.animation.easing : "easeOutCubic",
        properties: preset.animation?.properties,
      },
      null,
      2
    );
  } else {
    const safeCommentName = sanitizeCommentText(preset.name);
    const serializedName = JSON.stringify(preset.name);
    content = `// Exported from AF Motion Preset: ${safeCommentName}
import { applyPreset } from "af-motion/presets";

// Apply preset directly to target element
const target = document.querySelector(".target");
if (target) {
  applyPreset(target, ${serializedName});
}
`;
  }

  if (options.out) {
    const cwd = path.resolve(options.cwd ?? process.cwd());
    const outPath = resolveSafeWorkspacePath(cwd, options.out, "preset export output path");
    if (fs.existsSync(outPath) && !options.force) {
      console.error(term.fail(`Target file '${options.out}' already exists. Use --force to overwrite.`));
      return false;
    }
    const parentDir = path.dirname(outPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.writeFileSync(outPath, content, "utf8");
    console.log(term.pass(`Exported preset '${preset.name}' to ${options.out}`));
  } else {
    console.log(content);
  }

  return true;
}
