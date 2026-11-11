/**
 * AF Motion CLI — Master Router & Command Dispatcher
 *
 * Provides a modular, lightweight, dependency-free developer command-line interface.
 */

import type { ExitCode, GlobalCLIOptions } from "./types.js";
import { executeInit } from "./commands/init.js";
import { executeDoctor } from "./commands/doctor.js";
import { executeValidate } from "./commands/validate.js";
import {
  executePresetsList,
  executePresetInspect,
  executePresetExport,
} from "./commands/presets.js";
import { executeInfo } from "./commands/info.js";
import { executeExample } from "./commands/example.js";
import { term } from "./utils/terminal.js";

export * from "./types.js";
export * from "./commands/init.js";
export * from "./commands/doctor.js";
export * from "./commands/validate.js";
export * from "./commands/presets.js";
export * from "./commands/info.js";
export * from "./commands/example.js";
export * from "./utils/terminal.js";
export * from "./utils/templates.js";

const CLI_VERSION = "0.1.0";

export function printHelp(): void {
  console.log(term.banner("AF Motion CLI (Auto Flow Motion)", `v${CLI_VERSION}`));
  console.log("");
  console.log(term.bold("Usage:"));
  console.log("  af-motion <command> [arguments] [options]");
  console.log("");
  console.log(term.bold("Commands:"));
  console.log(`  ${term.cyan("init")} [name]              Initialize a new AF Motion project`);
  console.log(`  ${term.cyan("doctor")}                   Diagnose environment, peer dependencies, and configuration`);
  console.log(`  ${term.cyan("validate")} [file]          Validate an AF Motion configuration or composition file`);
  console.log(`  ${term.cyan("presets")} [action] [name]  Discover, inspect, and export animation presets`);
  console.log(`  ${term.cyan("info")}                     Inspect installed AF Motion capabilities and registries`);
  console.log(`  ${term.cyan("example")} <type>           Generate starter example files`);
  console.log("");
  console.log(term.bold("Global Options:"));
  console.log("  -h, --help               Display help information for a command");
  console.log("  -v, --version            Display installed AF Motion version");
  console.log("  --json                   Format output as structured JSON");
  console.log("  --no-color               Suppress ANSI color escape codes");
  console.log("  --quiet                  Suppress standard output messages");
  console.log("");
  console.log(term.bold("Examples:"));
  console.log("  af-motion init my-app --template react-ts");
  console.log("  af-motion doctor");
  console.log("  af-motion validate af-motion.config.json");
  console.log("  af-motion presets --category entrance");
  console.log("  af-motion presets inspect fade-in-up");
  console.log("  af-motion example spring --lang ts");
}

export function parseArgs(rawArgs: string[]): {
  command?: string;
  positional: string[];
  options: Record<string, any>;
} {
  const positional: string[] = [];
  const options: Record<string, any> = {};
  const FORBIDDEN_OPTION_KEYS = new Set(["__proto__", "constructor", "prototype"]);

  let i = 0;
  while (i < rawArgs.length) {
    const arg = rawArgs[i];

    if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else if (arg === "--version" || arg === "-v") {
      options.version = true;
    } else if (arg === "--json") {
      options.json = true;
    } else if (arg === "--no-color") {
      options.color = false;
    } else if (arg === "--quiet") {
      options.quiet = true;
    } else if (arg === "--force") {
      options.force = true;
    } else if (arg === "--print") {
      options.print = true;
    } else if (arg === "--no-config") {
      options.noConfig = true;
    } else if (arg.startsWith("--")) {
      const key = arg.slice(2);
      if (!key || FORBIDDEN_OPTION_KEYS.has(key)) {
        throw new Error(`Invalid or forbidden CLI flag: '${arg}'`);
      }
      const next = rawArgs[i + 1];
      if (next && !next.startsWith("-")) {
        options[key] = next;
        i++;
      } else {
        options[key] = true;
      }
    } else {
      positional.push(arg);
    }
    i++;
  }

  const command = positional[0]?.toLowerCase();
  const subPositional = positional.slice(1);

  return { command, positional: subPositional, options };
}

export async function runCLI(rawArgs: string[] = process.argv.slice(2)): Promise<ExitCode> {
  let parsed: ReturnType<typeof parseArgs>;
  try {
    parsed = parseArgs(rawArgs);
  } catch (err: any) {
    console.error(term.fail(`Invalid CLI arguments: ${err.message}`));
    return 2;
  }
  const { command, positional, options } = parsed;

  if (options.color === false) {
    term.setColorEnabled(false);
  }

  // Global version flag
  if (options.version) {
    console.log(options.json ? JSON.stringify({ version: CLI_VERSION }) : `af-motion v${CLI_VERSION}`);
    return 0;
  }

  // Global help flag without command
  if (!command || command === "help" || (options.help && !command)) {
    printHelp();
    return 0;
  }

  try {
    switch (command) {
      case "init": {
        if (options.help) {
          console.log(term.banner("af-motion init", "Initialize an AF Motion configuration and starter animation"));
          console.log("");
          console.log("Usage: af-motion init [name] [options]");
          console.log("");
          console.log("Options:");
          console.log("  --template <type>  Starter template: vanilla-js, vanilla-ts, react-ts (default: auto-detected)");
          console.log("  --force            Overwrite existing files if they exist");
          console.log("  --no-config        Do not generate af-motion.config.json");
          console.log("  --json             Output initialization results as JSON");
          return 0;
        }

        const name = positional[0] || options.name;
        const res = await executeInit({
          name,
          template: options.template,
          force: options.force,
          noConfig: options.noConfig,
          json: options.json,
          quiet: options.quiet,
          cwd: options.cwd,
        });
        return res.success ? 0 : 1;
      }

      case "doctor": {
        if (options.help) {
          console.log(term.banner("af-motion doctor", "Diagnose environment, peer dependencies, and configuration"));
          console.log("");
          console.log("Usage: af-motion doctor [options]");
          console.log("");
          console.log("Options:");
          console.log("  --json   Output diagnostic report as structured JSON");
          return 0;
        }

        const report = await executeDoctor({
          json: options.json,
          quiet: options.quiet,
          cwd: options.cwd,
        });
        return report.overallStatus === "fail" ? 1 : 0;
      }

      case "validate": {
        if (options.help) {
          console.log(term.banner("af-motion validate", "Validate configuration and composition schemas"));
          console.log("");
          console.log("Usage: af-motion validate [file] [options]");
          console.log("");
          console.log("Options:");
          console.log("  --json   Output validation report as structured JSON");
          return 0;
        }

        const targetFile = positional[0];
        const report = await executeValidate(targetFile, {
          json: options.json,
          quiet: options.quiet,
          cwd: options.cwd,
        });
        return report.valid ? 0 : 1;
      }

      case "presets": {
        if (options.help) {
          console.log(term.banner("af-motion presets", "Explore, inspect, and export verified animation presets"));
          console.log("");
          console.log("Usage:");
          console.log("  af-motion presets [list] [--category <cat>] [--search <query>]");
          console.log("  af-motion presets inspect <name> [--json]");
          console.log("  af-motion presets export <name> [--format json|ts] [--out <path>]");
          return 0;
        }

        const action = positional[0];
        if (action === "inspect") {
          const name = positional[1];
          if (!name) {
            console.error(term.fail("Preset name required for inspect: af-motion presets inspect <name>"));
            return 2;
          }
          const preset = await executePresetInspect(name, { json: options.json });
          return preset ? 0 : 1;
        }

        if (action === "export") {
          const name = positional[1];
          if (!name) {
            console.error(term.fail("Preset name required for export: af-motion presets export <name>"));
            return 2;
          }
          const ok = await executePresetExport(name, {
            format: options.format,
            out: options.out,
            force: options.force,
            cwd: options.cwd,
          });
          return ok ? 0 : 1;
        }

        // Default list action
        await executePresetsList({
          category: options.category,
          search: options.search,
          json: options.json,
        });
        return 0;
      }

      case "info": {
        if (options.help) {
          console.log(term.banner("af-motion info", "Inspect AF Motion system capabilities and registries"));
          console.log("");
          console.log("Usage: af-motion info [options]");
          console.log("");
          console.log("Options:");
          console.log("  --json   Output capability matrix as structured JSON");
          return 0;
        }

        await executeInfo({ json: options.json, quiet: options.quiet });
        return 0;
      }

      case "example": {
        if (options.help) {
          console.log(term.banner("af-motion example", "Generate compilable starter animation examples"));
          console.log("");
          console.log("Usage: af-motion example <type> [options]");
          console.log("");
          console.log("Types: basic, reveal-stagger, spring, timeline, react, motion-dna, 3d, ai-quality, design-to-motion");
          console.log("");
          console.log("Options:");
          console.log("  --lang <ts|js>  Output programming language (default: ts)");
          console.log("  --out <path>    Custom destination filename");
          console.log("  --print         Print example to stdout instead of writing to disk");
          console.log("  --force         Overwrite existing file");
          return 0;
        }

        const type = positional[0];
        const ok = await executeExample(type, {
          lang: options.lang,
          out: options.out,
          force: options.force,
          print: options.print,
          cwd: options.cwd,
        });
        return ok ? 0 : (type ? 1 : 0);
      }

      default: {
        console.error(term.fail(`Unknown command: '${command}'`));
        console.log(`Run ${term.cyan("af-motion --help")} to see all available commands.`);
        return 2;
      }
    }
  } catch (err: any) {
    console.error(term.fail(`CLI execution error: ${err.message}`));
    return 1;
  }
}
