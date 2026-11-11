/**
 * AF Motion CLI — `af-motion init`
 *
 * Initializes an AF Motion starter configuration and animation template
 * with strict existing-file protection and template auto-detection.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import type { InitOptions, InitResult, StarterTemplate } from "../types.js";
import { getStarterTemplate, STARTER_CONFIG_JSON } from "../utils/templates.js";
import { term } from "../utils/terminal.js";
import { resolveSafeWorkspacePath } from "../utils/safety.js";
import { parseSafeJson } from "../../core/utils/safe-json.js";

const VALID_TEMPLATES: ReadonlySet<StarterTemplate> = new Set(["vanilla-js", "vanilla-ts", "react-ts"]);

export function detectTemplate(projectDir: string): StarterTemplate {
  const pkgPath = path.join(projectDir, "package.json");
  const tsconfigPath = path.join(projectDir, "tsconfig.json");

  let hasReact = false;
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = parseSafeJson<Record<string, any>>(fs.readFileSync(pkgPath, "utf8"));
      hasReact = Boolean(pkg.dependencies?.react || pkg.devDependencies?.react || pkg.peerDependencies?.react);
    } catch {}
  }

  const hasTs = fs.existsSync(tsconfigPath);

  if (hasReact) return "react-ts";
  if (hasTs) return "vanilla-ts";
  return "vanilla-js";
}

export async function executeInit(options: InitOptions = {}): Promise<InitResult> {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const targetDir = options.name ? resolveSafeWorkspacePath(cwd, options.name, "init target directory") : cwd;
  if (options.template !== undefined && !VALID_TEMPLATES.has(options.template)) {
    throw new TypeError(`Invalid starter template '${String(options.template)}'. Expected one of: vanilla-js, vanilla-ts, react-ts.`);
  }

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const template: StarterTemplate = options.template ?? detectTemplate(targetDir);
  const starter = getStarterTemplate(template);

  const createdFiles: string[] = [];
  const skippedFiles: string[] = [];

  // 1. Create starter animation file
  const starterFilePath = path.join(targetDir, starter.filename);
  if (fs.existsSync(starterFilePath) && !options.force) {
    skippedFiles.push(starter.filename);
  } else {
    fs.writeFileSync(starterFilePath, starter.content, "utf8");
    createdFiles.push(starter.filename);
  }

  // 2. Create configuration file (unless disabled)
  let configCreated = false;
  if (!options.noConfig) {
    const configPath = path.join(targetDir, "af-motion.config.json");
    if (fs.existsSync(configPath) && !options.force) {
      skippedFiles.push("af-motion.config.json");
    } else {
      fs.writeFileSync(configPath, STARTER_CONFIG_JSON, "utf8");
      createdFiles.push("af-motion.config.json");
      configCreated = true;
    }
  }

  const success = createdFiles.length > 0;
  const message = success
    ? `Initialized AF Motion [${template}] template in ${path.relative(cwd, targetDir) || "."}`
    : `No files were created because existing files were preserved. Use --force to overwrite.`;

  const result: InitResult = {
    success,
    template,
    createdFiles,
    skippedFiles,
    configCreated,
    message,
  };

  if (!options.quiet) {
    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(term.banner("AF Motion Project Initialization"));
      console.log("");
      console.log(`Target directory: ${term.bold(targetDir)}`);
      console.log(`Template:         ${term.cyan(template)}`);
      console.log("");

      if (createdFiles.length > 0) {
        console.log(term.bold("Created files:"));
        for (const file of createdFiles) {
          console.log(`  ${term.green("+")} ${file}`);
        }
      }

      if (skippedFiles.length > 0) {
        console.log("");
        console.log(term.yellow("Existing files preserved (use --force to overwrite):"));
        for (const file of skippedFiles) {
          console.log(`  ${term.yellow("!")} ${file}`);
        }
      }

      console.log("");
      if (success) {
        console.log(term.bold("Next Steps:"));
        console.log(`  1. Run diagnostics:  ${term.cyan("af-motion doctor")}`);
        console.log(`  2. Explore presets:  ${term.cyan("af-motion presets")}`);
        console.log(`  3. Generate example: ${term.cyan("af-motion example spring")}`);
      }
    }
  }

  return result;
}
