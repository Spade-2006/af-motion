/**
 * AF Motion CLI — Type Definitions
 *
 * Types for command arguments, diagnostic results, configuration schemas,
 * and reporting structures.
 */

export type ExitCode = 0 | 1 | 2;

export interface GlobalCLIOptions {
  help?: boolean;
  version?: boolean;
  json?: boolean;
  color?: boolean;
  quiet?: boolean;
  verbose?: boolean;
  cwd?: string;
}

// ---------------------------------------------------------------------------
// 1. Init Command Types
// ---------------------------------------------------------------------------

export type StarterTemplate = "vanilla-js" | "vanilla-ts" | "react-ts";

export interface InitOptions extends GlobalCLIOptions {
  template?: StarterTemplate;
  name?: string;
  force?: boolean;
  noConfig?: boolean;
}

export interface InitResult {
  success: boolean;
  template: StarterTemplate;
  createdFiles: string[];
  skippedFiles: string[];
  configCreated: boolean;
  message: string;
}

// ---------------------------------------------------------------------------
// 2. Doctor Diagnostic Types
// ---------------------------------------------------------------------------

export type DiagnosticStatus = "pass" | "warn" | "fail";

export interface DiagnosticCheck {
  id: string;
  category: "environment" | "dependencies" | "configuration" | "framework";
  name: string;
  status: DiagnosticStatus;
  message: string;
  details?: string;
  remediation?: string;
}

export interface DoctorReport {
  timestamp: string;
  overallStatus: DiagnosticStatus;
  passedCount: number;
  warnCount: number;
  failCount: number;
  checks: DiagnosticCheck[];
}

// ---------------------------------------------------------------------------
// 3. Validation Types
// ---------------------------------------------------------------------------

export interface ConfigValidationFinding {
  severity: "error" | "warning" | "info";
  path: string;
  message: string;
  suggestion?: string;
}

export interface ConfigValidationReport {
  file: string;
  valid: boolean;
  findings: ConfigValidationFinding[];
  summary: {
    errors: number;
    warnings: number;
  };
}

// ---------------------------------------------------------------------------
// 4. Presets Command Types
// ---------------------------------------------------------------------------

export interface PresetsListOptions extends GlobalCLIOptions {
  category?: string;
  search?: string;
}

export interface PresetInspectResult {
  id: string;
  name: string;
  category: string;
  description: string;
  duration?: number;
  easing?: string;
  tags?: readonly string[];
  properties?: Record<string, unknown>;
  characteristics?: Record<string, unknown>;
}

export interface PresetExportOptions extends GlobalCLIOptions {
  format?: "json" | "ts";
  out?: string;
  force?: boolean;
}

// ---------------------------------------------------------------------------
// 5. Info Types
// ---------------------------------------------------------------------------

export interface AFMotionCapabilityInfo {
  version: string;
  subpaths: {
    core: string;
    react: string;
    catalogue: string;
    presets: string;
  };
  coreFeatures: string[];
  easingsCount: number;
  palettesCount: number;
  visualStylesCount: number;
  motionDNAPersonalities: string[];
  presetsCount: number;
  aiCapabilities: string[];
  environment: {
    nodeVersion: string;
    platform: string;
    arch: string;
    isCI: boolean;
    supportsColor: boolean;
  };
}

// ---------------------------------------------------------------------------
// 6. Example Types
// ---------------------------------------------------------------------------

export type ExampleType =
  | "basic"
  | "reveal-stagger"
  | "spring"
  | "timeline"
  | "react"
  | "motion-dna"
  | "3d"
  | "ai-quality"
  | "design-to-motion";

export interface ExampleGenerateOptions extends GlobalCLIOptions {
  type?: ExampleType;
  lang?: "ts" | "js";
  out?: string;
  force?: boolean;
  print?: boolean;
}
