/**
 * AF Motion Intelligent Configuration Validation & Automatic Correction Engine
 *
 * Framework-independent engine that inspects AF Motion configurations and compositions,
 * identifies schema violations, type mismatches, and out-of-range parameters,
 * and safely computes deterministic, schema-compliant corrections without modifying user intent.
 */

import type { AIMotionCapability, AIMotionRegistry } from "./ai-motion-registry.js";
import type { CompositionNode, MotionComposition } from "./composition.js";
import {
  type SchemaPropertyDescriptor,
  type UnifiedMotionSchema,
} from "./schema.js";

export const CORRECTION_ENGINE_VERSION = "1.0.0";

export type CorrectionSafety = "safe" | "requires_approval" | "unresolvable";

export type CorrectionRuleType =
  | "out_of_range"
  | "invalid_type"
  | "missing_required"
  | "resolve_default"
  | "invalid_enum"
  | "unsupported_property"
  | "accessibility_violation"
  | "incompatible_combination"
  | "missing_dependency"
  | "structure"
  | "unknown";

export interface CorrectionSuggestion {
  readonly path: string;
  readonly property: string;
  readonly originalValue: unknown;
  readonly correctedValue: unknown;
  readonly reason: string;
  readonly rule: CorrectionRuleType;
  readonly safety: CorrectionSafety;
  readonly confidence: number;
}

export interface ConfigurationIssue {
  readonly path: string;
  readonly property?: string;
  readonly message: string;
  readonly rule: string;
  readonly severity: "error" | "warning" | "info";
  readonly received?: unknown;
  readonly expected?: string;
  readonly suggestion?: CorrectionSuggestion;
}

export interface CorrectionReport {
  readonly totalIssues: number;
  readonly safeFixesCount: number;
  readonly approvalRequiredCount: number;
  readonly unresolvableCount: number;
  readonly summary: string;
}

export interface CorrectionOptions {
  readonly registry?: AIMotionRegistry;
  readonly strictMode?: boolean;
  readonly allowUnsupportedRemoval?: boolean;
  readonly clampNumbers?: boolean;
  readonly coerceTypes?: boolean;
  readonly requireApprovalForBreaking?: boolean;
  readonly resolveDefaults?: boolean;
  readonly target?: string;
}

export interface CorrectionResult<T = Record<string, unknown>> {
  readonly valid: boolean;
  readonly corrected: boolean;
  readonly originalConfiguration: Readonly<Record<string, unknown>>;
  readonly correctedConfiguration: T;
  readonly issues: readonly ConfigurationIssue[];
  readonly suggestions: readonly CorrectionSuggestion[];
  readonly appliedCorrections: readonly CorrectionSuggestion[];
  readonly unresolvableIssues: readonly ConfigurationIssue[];
  readonly report: CorrectionReport;
}

export interface CompositionCorrectionResult {
  readonly valid: boolean;
  readonly corrected: boolean;
  readonly originalComposition: MotionComposition;
  readonly correctedComposition: MotionComposition;
  readonly nodeResults: Readonly<Record<string, CorrectionResult>>;
  readonly compositionIssues: readonly ConfigurationIssue[];
  readonly report: CorrectionReport;
}

let defaultRegistryResolver: (() => AIMotionRegistry | undefined) | undefined;

export function setCorrectorRegistryResolver(
  resolver: () => AIMotionRegistry | undefined,
): void {
  defaultRegistryResolver = resolver;
}

export function getEffectiveCorrectorRegistry(
  options?: CorrectionOptions,
): AIMotionRegistry | undefined {
  return options?.registry ?? (defaultRegistryResolver ? defaultRegistryResolver() : undefined);
}

function deepClone<T>(val: T): T {
  if (val === null || typeof val !== "object") return val;
  if (Array.isArray(val)) {
    return val.map((item) => deepClone(item)) as unknown as T;
  }
  const copy: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
    copy[k] = deepClone(v);
  }
  return copy as T;
}

function resolveSchema(
  capabilityIdOrSchema: string | UnifiedMotionSchema,
  options?: CorrectionOptions,
): UnifiedMotionSchema | undefined {
  if (typeof capabilityIdOrSchema === "object" && capabilityIdOrSchema !== null) {
    return capabilityIdOrSchema;
  }

  const registry = getEffectiveCorrectorRegistry(options);
  if (!registry) return undefined;

  return (
    registry.getCapabilitySchema(capabilityIdOrSchema) ??
    registry.getSchemaById(capabilityIdOrSchema)
  );
}

/**
 * Inspects a configuration against a capability schema and produces safe, deterministic corrections.
 */
export function correctConfiguration<T = Record<string, unknown>>(
  capabilityIdOrSchema: string | UnifiedMotionSchema,
  configuration: unknown = {},
  options: CorrectionOptions = {},
): CorrectionResult<T> {
  const schema = resolveSchema(capabilityIdOrSchema, options);
  const issues: ConfigurationIssue[] = [];
  const suggestions: CorrectionSuggestion[] = [];
  const appliedCorrections: CorrectionSuggestion[] = [];
  const unresolvableIssues: ConfigurationIssue[] = [];

  if (typeof configuration !== "object" || configuration === null || Array.isArray(configuration)) {
    const rawVal = configuration;
    const issue: ConfigurationIssue = {
      path: "",
      message: `Invalid configuration structure: expected object, received ${Array.isArray(rawVal) ? "array" : typeof rawVal}.`,
      rule: "structure",
      severity: "error",
      received: rawVal,
      expected: "object",
    };
    issues.push(issue);
    unresolvableIssues.push(issue);

    return {
      valid: false,
      corrected: false,
      originalConfiguration: (typeof rawVal === "object" && rawVal !== null ? (rawVal as Record<string, unknown>) : {}) as Record<string, unknown>,
      correctedConfiguration: {} as unknown as T,
      issues,
      suggestions: [],
      appliedCorrections: [],
      unresolvableIssues,
      report: {
        totalIssues: 1,
        safeFixesCount: 0,
        approvalRequiredCount: 0,
        unresolvableCount: 1,
        summary: "Configuration is structurally invalid (must be an object).",
      },
    };
  }

  const rawConfig = configuration as Record<string, unknown>;
  const originalCopy = deepClone(rawConfig);
  const correctedCopy = deepClone(rawConfig);

  if (!schema) {
    const issue: ConfigurationIssue = {
      path: "",
      message: `Unknown capability or schema: "${String(capabilityIdOrSchema)}". Cannot validate or correct without a schema.`,
      rule: "unknown",
      severity: "error",
      received: capabilityIdOrSchema,
    };
    issues.push(issue);
    unresolvableIssues.push(issue);

    return {
      valid: false,
      corrected: false,
      originalConfiguration: originalCopy,
      correctedConfiguration: originalCopy as unknown as T,
      issues,
      suggestions: [],
      appliedCorrections: [],
      unresolvableIssues,
      report: {
        totalIssues: 1,
        safeFixesCount: 0,
        approvalRequiredCount: 0,
        unresolvableCount: 1,
        summary: "Cannot validate or correct configuration: capability schema not found in registry.",
      },
    };
  }

  const schemaProperties = (schema.properties || {}) as Record<string, SchemaPropertyDescriptor>;
  const allowUnsupportedRemoval = options.allowUnsupportedRemoval ?? false;
  const clampNumbers = options.clampNumbers ?? true;
  const coerceTypes = options.coerceTypes ?? true;
  const strictMode = options.strictMode ?? false;
  const resolveDefaults = options.resolveDefaults ?? true;

  // 1. Check Missing Properties (Required & Defaults)
  const requiredKeys = schema.required ?? [];
  const checkedKeys = new Set<string>();

  // Contextual target resolution
  if (requiredKeys.includes("target") && correctedCopy["target"] === undefined) {
    checkedKeys.add("target");
    if (options.target) {
      const suggestion: CorrectionSuggestion = {
        path: "target",
        property: "target",
        originalValue: undefined,
        correctedValue: options.target,
        reason: `Populated missing required target with contextual target "${options.target}".`,
        rule: "missing_required",
        safety: "safe",
        confidence: 0.95,
      };
      suggestions.push(suggestion);

      const issue: ConfigurationIssue = {
        path: "target",
        property: "target",
        message: suggestion.reason,
        rule: "missing_required",
        severity: "warning",
        expected: "string",
        suggestion,
      };
      issues.push(issue);

      if (!strictMode) {
        correctedCopy["target"] = options.target;
        appliedCorrections.push(suggestion);
      }
    } else {
      const issue: ConfigurationIssue = {
        path: "target",
        property: "target",
        message: 'Required parameter "target" is missing and no contextual target was provided.',
        rule: "missing_required",
        severity: "error",
        expected: "string",
      };
      issues.push(issue);
      unresolvableIssues.push(issue);
    }
  }

  // Schema-level defaultConfiguration & property defaults
  if (resolveDefaults) {
    const defaultSources: Record<string, unknown> = {
      ...(schema.defaultConfiguration ?? {}),
    };
    for (const [k, p] of Object.entries(schemaProperties)) {
      if (p.default !== undefined) {
        defaultSources[k] = p.default;
      }
    }

    for (const [defKey, defVal] of Object.entries(defaultSources)) {
      if (correctedCopy[defKey] === undefined && defVal !== undefined) {
        checkedKeys.add(defKey);
        const isRequired = requiredKeys.includes(defKey);
        const suggestion: CorrectionSuggestion = {
          path: defKey,
          property: defKey,
          originalValue: undefined,
          correctedValue: defVal,
          reason: `Populated missing ${isRequired ? "required" : "optional"} parameter "${defKey}" with schema default.`,
          rule: isRequired ? "missing_required" : "resolve_default",
          safety: "safe",
          confidence: 0.95,
        };
        suggestions.push(suggestion);

        const issue: ConfigurationIssue = {
          path: defKey,
          property: defKey,
          message: suggestion.reason,
          rule: suggestion.rule,
          severity: isRequired ? "warning" : "info",
          expected: typeof defVal,
          suggestion,
        };
        issues.push(issue);

        if (!strictMode) {
          correctedCopy[defKey] = deepClone(defVal);
          appliedCorrections.push(suggestion);
        }
      }
    }
  }

  // Other missing required properties without defaults
  for (const reqKey of requiredKeys) {
    if (correctedCopy[reqKey] === undefined && !checkedKeys.has(reqKey)) {
      const propDesc = schemaProperties[reqKey];
      let suggestedVal: unknown;
      let reason = `Required parameter "${reqKey}" is missing.`;

      if (propDesc?.enum && propDesc.enum.length > 0) {
        suggestedVal = propDesc.enum[0];
        reason = `Required parameter "${reqKey}" is missing. Suggested first allowed option: "${String(propDesc.enum[0])}".`;
      } else if (propDesc?.type === "number") {
        suggestedVal = (propDesc as Record<string, any>).minimum ?? (propDesc as Record<string, any>).min ?? 0;
        reason = `Required parameter "${reqKey}" is missing. Suggested numeric minimum: ${suggestedVal}.`;
      }

      if (suggestedVal !== undefined) {
        const suggestion: CorrectionSuggestion = {
          path: reqKey,
          property: reqKey,
          originalValue: undefined,
          correctedValue: suggestedVal,
          reason,
          rule: "missing_required",
          safety: "requires_approval",
          confidence: 0.6,
        };
        suggestions.push(suggestion);

        const issue: ConfigurationIssue = {
          path: reqKey,
          property: reqKey,
          message: reason,
          rule: "missing_required",
          severity: "error",
          expected: String(propDesc?.type ?? "defined"),
          suggestion,
        };
        issues.push(issue);
      } else {
        const issue: ConfigurationIssue = {
          path: reqKey,
          property: reqKey,
          message: reason,
          rule: "missing_required",
          severity: "error",
        };
        issues.push(issue);
        unresolvableIssues.push(issue);
      }
    }
  }

  // 2. Check Unsupported / Extra Properties
  if (schema.additionalProperties === false || allowUnsupportedRemoval) {
    for (const key of Object.keys(correctedCopy)) {
      if (!schemaProperties[key]) {
        const origVal = correctedCopy[key];
        const suggestion: CorrectionSuggestion = {
          path: key,
          property: key,
          originalValue: origVal,
          correctedValue: undefined,
          reason: `Property "${key}" is not supported by schema for "${schema.capabilityId}".`,
          rule: "unsupported_property",
          safety: "safe",
          confidence: 0.9,
        };
        suggestions.push(suggestion);

        const issue: ConfigurationIssue = {
          path: key,
          property: key,
          message: `Unknown property "${key}" is not allowed.`,
          rule: "unsupported_property",
          severity: "warning",
          received: origVal,
          expected: "undefined",
          suggestion,
        };
        issues.push(issue);

        if (!strictMode && allowUnsupportedRemoval) {
          delete correctedCopy[key];
          appliedCorrections.push(suggestion);
        }
      }
    }
  }

  // 3. Inspect Existing Properties for Type Coercion, Clamping, and Enums
  for (const [key, val] of Object.entries(correctedCopy)) {
    const propDesc = schemaProperties[key];
    if (!propDesc || val === undefined) continue;

    const allowedTypes = Array.isArray(propDesc.type) ? propDesc.type : [propDesc.type];

    // 3A. Type Coercion
    if (coerceTypes) {
      // Number coercion: "400" -> 400
      if (allowedTypes.includes("number") && typeof val === "string") {
        const trimmed = val.trim();
        const num = Number(trimmed);
        if (!isNaN(num) && trimmed !== "") {
          const suggestion: CorrectionSuggestion = {
            path: key,
            property: key,
            originalValue: val,
            correctedValue: num,
            reason: `Coerced string value "${val}" to number ${num}.`,
            rule: "invalid_type",
            safety: "safe",
            confidence: 0.95,
          };
          suggestions.push(suggestion);

          const issue: ConfigurationIssue = {
            path: key,
            property: key,
            message: `Property "${key}" received string "${val}" but expects number.`,
            rule: "invalid_type",
            severity: "warning",
            received: val,
            expected: "number",
            suggestion,
          };
          issues.push(issue);

          if (!strictMode) {
            correctedCopy[key] = num;
            appliedCorrections.push(suggestion);
          }
        }
      }

      // Boolean coercion: "true" -> true, "false" -> false
      const currentValAfterNum = correctedCopy[key];
      if (allowedTypes.includes("boolean") && typeof currentValAfterNum === "string") {
        const lower = currentValAfterNum.trim().toLowerCase();
        if (lower === "true" || lower === "false") {
          const boolVal = lower === "true";
          const suggestion: CorrectionSuggestion = {
            path: key,
            property: key,
            originalValue: currentValAfterNum,
            correctedValue: boolVal,
            reason: `Coerced string "${currentValAfterNum}" to boolean ${boolVal}.`,
            rule: "invalid_type",
            safety: "safe",
            confidence: 0.95,
          };
          suggestions.push(suggestion);

          const issue: ConfigurationIssue = {
            path: key,
            property: key,
            message: `Property "${key}" received string "${currentValAfterNum}" but expects boolean.`,
            rule: "invalid_type",
            severity: "warning",
            received: currentValAfterNum,
            expected: "boolean",
            suggestion,
          };
          issues.push(issue);

          if (!strictMode) {
            correctedCopy[key] = boolVal;
            appliedCorrections.push(suggestion);
          }
        }
      }

      // Array wrap coercion: single string/value -> [value]
      if (allowedTypes.includes("array") && !Array.isArray(val) && typeof val === "string") {
        const arrVal = [val];
        const suggestion: CorrectionSuggestion = {
          path: key,
          property: key,
          originalValue: val,
          correctedValue: arrVal,
          reason: `Wrapped scalar string "${val}" into an array.`,
          rule: "invalid_type",
          safety: "safe",
          confidence: 0.9,
        };
        suggestions.push(suggestion);

        const issue: ConfigurationIssue = {
          path: key,
          property: key,
          message: `Property "${key}" received scalar string but expects array.`,
          rule: "invalid_type",
          severity: "warning",
          received: val,
          expected: "array",
          suggestion,
        };
        issues.push(issue);

        if (!strictMode) {
          correctedCopy[key] = arrVal;
          appliedCorrections.push(suggestion);
        }
      }
    }

    // 3B. Numeric Clamping
    const numericVal = correctedCopy[key];
    if (typeof numericVal === "number" && !isNaN(numericVal)) {
      const minConstraint = (propDesc as Record<string, any>).minimum ?? (propDesc as Record<string, any>).min;
      const maxConstraint = (propDesc as Record<string, any>).maximum ?? (propDesc as Record<string, any>).max;

      if (minConstraint !== undefined && numericVal < minConstraint) {
        const suggestion: CorrectionSuggestion = {
          path: key,
          property: key,
          originalValue: numericVal,
          correctedValue: minConstraint,
          reason: `Value ${numericVal} is below minimum constraint ${minConstraint}. Clamped to minimum.`,
          rule: "out_of_range",
          safety: "safe",
          confidence: 0.95,
        };
        suggestions.push(suggestion);

        const issue: ConfigurationIssue = {
          path: key,
          property: key,
          message: `Property "${key}" value ${numericVal} is less than minimum ${minConstraint}.`,
          rule: "out_of_range",
          severity: "warning",
          received: numericVal,
          expected: `>= ${minConstraint}`,
          suggestion,
        };
        issues.push(issue);

        if (clampNumbers && !strictMode) {
          correctedCopy[key] = minConstraint;
          appliedCorrections.push(suggestion);
        }
      }

      const postMinVal = correctedCopy[key];
      if (typeof postMinVal === "number" && maxConstraint !== undefined && postMinVal > maxConstraint) {
        const suggestion: CorrectionSuggestion = {
          path: key,
          property: key,
          originalValue: postMinVal,
          correctedValue: maxConstraint,
          reason: `Value ${postMinVal} exceeds maximum constraint ${maxConstraint}. Clamped to maximum.`,
          rule: "out_of_range",
          safety: "safe",
          confidence: 0.95,
        };
        suggestions.push(suggestion);

        const issue: ConfigurationIssue = {
          path: key,
          property: key,
          message: `Property "${key}" value ${postMinVal} is greater than maximum ${maxConstraint}.`,
          rule: "out_of_range",
          severity: "warning",
          received: postMinVal,
          expected: `<= ${maxConstraint}`,
          suggestion,
        };
        issues.push(issue);

        if (clampNumbers && !strictMode) {
          correctedCopy[key] = maxConstraint;
          appliedCorrections.push(suggestion);
        }
      }
    }

    // 3C. Enum Normalization and Alternative Suggestions
    const currentVal = correctedCopy[key];
    if (propDesc.enum && propDesc.enum.length > 0 && typeof currentVal === "string") {
      const allowedEnums = propDesc.enum.map(String);
      if (!allowedEnums.includes(currentVal)) {
        // Case-insensitive / hyphen normalization attempt
        const normalized = allowedEnums.find(
          (e) =>
            e.toLowerCase() === currentVal.toLowerCase() ||
            e.toLowerCase().replace(/[-_ ]/g, "") === currentVal.toLowerCase().replace(/[-_ ]/g, ""),
        );

        if (normalized) {
          const suggestion: CorrectionSuggestion = {
            path: key,
            property: key,
            originalValue: currentVal,
            correctedValue: normalized,
            reason: `Normalized enum value "${currentVal}" to standard "${normalized}".`,
            rule: "invalid_enum",
            safety: "safe",
            confidence: 0.9,
          };
          suggestions.push(suggestion);

          const issue: ConfigurationIssue = {
            path: key,
            property: key,
            message: `Enum value "${currentVal}" does not match exact case. Normalized to "${normalized}".`,
            rule: "invalid_enum",
            severity: "warning",
            received: currentVal,
            expected: normalized,
            suggestion,
          };
          issues.push(issue);

          if (!strictMode) {
            correctedCopy[key] = normalized;
            appliedCorrections.push(suggestion);
          }
        } else {
          // Suggest first valid enum or default requiring approval
          const fallback = propDesc.default ?? propDesc.enum[0];
          const suggestion: CorrectionSuggestion = {
            path: key,
            property: key,
            originalValue: currentVal,
            correctedValue: fallback,
            reason: `Unrecognized enum "${currentVal}". Suggested schema default "${String(fallback)}".`,
            rule: "invalid_enum",
            safety: "requires_approval",
            confidence: 0.5,
          };
          suggestions.push(suggestion);

          const issue: ConfigurationIssue = {
            path: key,
            property: key,
            message: `Unknown enum "${currentVal}". Allowed: [${propDesc.enum.join(", ")}].`,
            rule: "invalid_enum",
            severity: "error",
            received: currentVal,
            expected: `one of [${propDesc.enum.join(", ")}]`,
            suggestion,
          };
          issues.push(issue);
          unresolvableIssues.push(issue);
        }
      }
    }
  }

  // Generate Report
  const safeFixesCount = appliedCorrections.filter((c) => c.safety === "safe").length;
  const approvalRequiredCount = suggestions.filter((c) => c.safety === "requires_approval").length;
  const unresolvableCount = unresolvableIssues.length;

  let summary = "Configuration is valid and conforms to schema.";
  if (issues.length > 0) {
    summary = `Identified ${issues.length} configuration issue(s). Applied ${safeFixesCount} safe fix(es); ${approvalRequiredCount} suggestion(s) require approval; ${unresolvableCount} unresolvable issue(s).`;
  }

  const report: CorrectionReport = {
    totalIssues: issues.length,
    safeFixesCount,
    approvalRequiredCount,
    unresolvableCount,
    summary,
  };

  const finalConfig = strictMode ? originalCopy : correctedCopy;
  const valid = issues.length === 0;
  const corrected = appliedCorrections.length > 0;

  return {
    valid,
    corrected,
    originalConfiguration: originalCopy,
    correctedConfiguration: finalConfig as unknown as T,
    issues,
    suggestions,
    appliedCorrections,
    unresolvableIssues,
    report,
  };
}

/**
 * Validates and corrects a configuration, returning structured diagnosis and suggestions.
 */
export const validateAndCorrectConfiguration = correctConfiguration;

/**
 * Validates and corrects an entire MotionComposition, fixing individual node configurations,
 * missing targets, and broken hierarchy references.
 */
export function correctComposition(
  composition: MotionComposition,
  options: CorrectionOptions = {},
): CompositionCorrectionResult {
  const nodeResults: Record<string, CorrectionResult> = {};
  const compositionIssues: ConfigurationIssue[] = [];
  let totalIssues = 0;
  let safeFixes = 0;
  let approvalRequired = 0;
  let unresolvable = 0;

  const originalCopy = deepClone(composition);
  const updatedNodes = { ...composition.nodes };
  let anyNodeCorrected = false;

  for (const [nodeId, node] of Object.entries(composition.nodes)) {
    if (node.capabilityId) {
      const nodeOptions: CorrectionOptions = {
        ...options,
        target: node.target?.selector ?? options.target,
      };

      const result = correctConfiguration(
        node.capabilityId,
        node.configuration ? { ...node.configuration } : {},
        nodeOptions,
      );

      nodeResults[nodeId] = result;
      totalIssues += result.report.totalIssues;
      safeFixes += result.report.safeFixesCount;
      approvalRequired += result.report.approvalRequiredCount;
      unresolvable += result.report.unresolvableCount;

      if (result.corrected) {
        anyNodeCorrected = true;
        updatedNodes[nodeId] = {
          ...node,
          configuration: result.correctedConfiguration,
        };
      }
    }
  }

  // Check parent reference integrity
  for (const [nodeId, node] of Object.entries(updatedNodes)) {
    if (node.parentId && !updatedNodes[node.parentId]) {
      const issue: ConfigurationIssue = {
        path: `nodes.${nodeId}.parentId`,
        property: "parentId",
        message: `Node "${nodeId}" references non-existent parent "${node.parentId}". Reassigned to root.`,
        rule: "missing_dependency",
        severity: "warning",
      };
      compositionIssues.push(issue);
      totalIssues++;
      safeFixes++;
      anyNodeCorrected = true;

      updatedNodes[nodeId] = {
        ...node,
        parentId: composition.rootNodeId,
      };
    }
  }

  const correctedComposition: MotionComposition = {
    ...composition,
    nodes: updatedNodes,
  };

  const report: CorrectionReport = {
    totalIssues,
    safeFixesCount: safeFixes,
    approvalRequiredCount: approvalRequired,
    unresolvableCount: unresolvable,
    summary: `Composition audit completed. ${totalIssues} issue(s) detected across ${Object.keys(composition.nodes).length} nodes.`,
  };

  return {
    valid: totalIssues === 0,
    corrected: anyNodeCorrected,
    originalComposition: originalCopy,
    correctedComposition: options.strictMode ? originalCopy : correctedComposition,
    nodeResults,
    compositionIssues,
    report,
  };
}
