/**
 * AF Motion CLI — `af-motion validate`
 *
 * Validates AF Motion configuration files and animation compositions
 * against official schemas, Motion DNA profiles, and the 33 built-in palettes.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import type { ConfigValidationFinding, ConfigValidationReport, GlobalCLIOptions } from "../types.js";
import { BUILT_IN_PALETTE_INPUTS } from "../../core/built-in-palettes.js";
import { term } from "../utils/terminal.js";
import { parseSafeJson } from "../../core/utils/safe-json.js";

const VALID_MOTION_DNAS = new Set([
  "precise",
  "playful",
  "elegant",
  "energetic",
  "editorial-flow",
  "snappy",
  "calm",
  "cinematic",
  "minimal",
]);

const VALID_PALETTE_NAMES = new Set(BUILT_IN_PALETTE_INPUTS.map((p) => p.name.toLowerCase()));

export function validateConfigFile(filePath: string): ConfigValidationReport {
  const findings: ConfigValidationFinding[] = [];

  if (!fs.existsSync(filePath)) {
    findings.push({
      severity: "error",
      path: filePath,
      message: `File does not exist: ${filePath}`,
    });
    return {
      file: filePath,
      valid: false,
      findings,
      summary: { errors: 1, warnings: 0 },
    };
  }

  let content = "";
  try {
    content = fs.readFileSync(filePath, "utf8");
  } catch (err: any) {
    findings.push({
      severity: "error",
      path: filePath,
      message: `Failed to read file: ${err.message}`,
    });
    return {
      file: filePath,
      valid: false,
      findings,
      summary: { errors: 1, warnings: 0 },
    };
  }

  let parsed: any = null;
  try {
    parsed = parseSafeJson(content);
  } catch (err: any) {
    findings.push({
      severity: "error",
      path: filePath,
      message: `Invalid JSON syntax: ${err.message}`,
    });
    return {
      file: filePath,
      valid: false,
      findings,
      summary: { errors: 1, warnings: 0 },
    };
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    findings.push({
      severity: "error",
      path: "$",
      message: "Configuration root must be a valid JSON object.",
    });
    return {
      file: filePath,
      valid: false,
      findings,
      summary: { errors: 1, warnings: 0 },
    };
  }

  // 1. Validate Motion DNA reference
  if (parsed.defaultMotionDNA !== undefined) {
    if (typeof parsed.defaultMotionDNA !== "string") {
      findings.push({
        severity: "error",
        path: "$.defaultMotionDNA",
        message: "defaultMotionDNA must be a string.",
      });
    } else if (!VALID_MOTION_DNAS.has(parsed.defaultMotionDNA.toLowerCase())) {
      findings.push({
        severity: "error",
        path: "$.defaultMotionDNA",
        message: `Unknown Motion DNA profile '${parsed.defaultMotionDNA}'.`,
        suggestion: `Choose from: ${Array.from(VALID_MOTION_DNAS).join(", ")}.`,
      });
    }
  }

  // 2. Validate Palette reference
  if (parsed.defaultPalette !== undefined) {
    if (typeof parsed.defaultPalette !== "string") {
      findings.push({
        severity: "error",
        path: "$.defaultPalette",
        message: "defaultPalette must be a string.",
      });
    } else if (!VALID_PALETTE_NAMES.has(parsed.defaultPalette.toLowerCase())) {
      findings.push({
        severity: "error",
        path: "$.defaultPalette",
        message: `Unknown palette '${parsed.defaultPalette}'.`,
        suggestion: `Reference one of the 33 built-in palettes (e.g. 'Cobalt Classic', 'Midnight Voltage', 'Neon Abyss').`,
      });
    }
  }

  // 3. Validate Accessibility Settings
  if (parsed.accessibility !== undefined) {
    if (typeof parsed.accessibility !== "object" || parsed.accessibility === null) {
      findings.push({
        severity: "error",
        path: "$.accessibility",
        message: "accessibility must be an object.",
      });
    } else {
      if (
        parsed.accessibility.respectReducedMotion !== undefined &&
        typeof parsed.accessibility.respectReducedMotion !== "boolean"
      ) {
        findings.push({
          severity: "error",
          path: "$.accessibility.respectReducedMotion",
          message: "respectReducedMotion must be a boolean.",
        });
      }
      if (
        parsed.accessibility.fallbackDurationMs !== undefined &&
        (typeof parsed.accessibility.fallbackDurationMs !== "number" ||
          !Number.isFinite(parsed.accessibility.fallbackDurationMs) ||
          parsed.accessibility.fallbackDurationMs < 0)
      ) {
        findings.push({
          severity: "error",
          path: "$.accessibility.fallbackDurationMs",
          message: "fallbackDurationMs must be a finite non-negative number.",
        });
      }
    }
  }

  // 4. Validate Performance Settings
  if (parsed.performance !== undefined) {
    if (typeof parsed.performance !== "object" || parsed.performance === null) {
      findings.push({
        severity: "error",
        path: "$.performance",
        message: "performance must be an object.",
      });
    } else {
      if (
        parsed.performance.targetFps !== undefined &&
        ![30, 60, 90, 120].includes(parsed.performance.targetFps)
      ) {
        findings.push({
          severity: "warning",
          path: "$.performance.targetFps",
          message: `targetFps (${parsed.performance.targetFps}) is unusual. Standard target rates are 30, 60, or 120.`,
        });
      }
      if (
        parsed.performance.gpuAcceleration !== undefined &&
        typeof parsed.performance.gpuAcceleration !== "boolean"
      ) {
        findings.push({
          severity: "error",
          path: "$.performance.gpuAcceleration",
          message: "gpuAcceleration must be a boolean.",
        });
      }
    }
  }

  // 5. Composition structure validation if present
  if (parsed.tracks !== undefined || parsed.keyframes !== undefined) {
    if (parsed.tracks !== undefined && !Array.isArray(parsed.tracks)) {
      findings.push({
        severity: "error",
        path: "$.tracks",
        message: "Composition tracks must be an array.",
      });
    }
  }

  const errors = findings.filter((f) => f.severity === "error").length;
  const warnings = findings.filter((f) => f.severity === "warning").length;

  return {
    file: filePath,
    valid: errors === 0,
    findings,
    summary: {
      errors,
      warnings,
    },
  };
}

export async function executeValidate(
  targetPath?: string,
  options: GlobalCLIOptions = {}
): Promise<ConfigValidationReport> {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  if (targetPath && targetPath.includes("\0")) {
    throw new Error("Security error: target file path contains null byte.");
  }
  let fileToValidate = targetPath ? path.resolve(cwd, targetPath) : "";

  if (!fileToValidate) {
    // Auto-discover config
    const candidateJson = path.join(cwd, "af-motion.config.json");
    if (fs.existsSync(candidateJson)) {
      fileToValidate = candidateJson;
    } else {
      fileToValidate = candidateJson; // Will report file not found
    }
  }

  const report = validateConfigFile(fileToValidate);

  if (!options.quiet) {
    if (options.json) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      console.log(term.banner("AF Motion Configuration Validation"));
      console.log("");
      console.log(`Validating file: ${term.bold(path.relative(cwd, fileToValidate) || fileToValidate)}`);
      console.log("");

      if (report.findings.length === 0) {
        console.log(term.pass("Configuration adheres to schema and verified AF Motion standards."));
      } else {
        for (const finding of report.findings) {
          const badge =
            finding.severity === "error"
              ? term.fail()
              : finding.severity === "warning"
              ? term.warn()
              : term.info();

          console.log(`${badge} ${term.bold(finding.path)}: ${finding.message}`);
          if (finding.suggestion) {
            console.log(`  ${term.cyan("Suggestion:")} ${finding.suggestion}`);
          }
        }
      }

      console.log("");
      if (report.valid) {
        console.log(term.green(`Validation Status: VALID (${report.summary.warnings} warnings)`));
      } else {
        console.log(term.red(`Validation Status: INVALID (${report.summary.errors} errors, ${report.summary.warnings} warnings)`));
      }
    }
  }

  return report;
}
