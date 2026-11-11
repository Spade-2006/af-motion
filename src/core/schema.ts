/**
 * AF Motion Unified Machine-Readable Schema Architecture
 *
 * Provides a standardized, extensible JSON Schema-compatible contract and validation engine
 * allowing AI agents, MCP tools, and developer tools to inspect, configure, validate,
 * and compose every AF Motion capability.
 */

export const SCHEMA_SPEC_VERSION = "1.0.0";

export type SchemaPropertyType = "string" | "number" | "boolean" | "object" | "array" | "null";

export type SchemaCapabilityCategory =
  | "animation"
  | "core-animation"
  | "visual-effect"
  | "text-effect"
  | "background"
  | "pointer"
  | "scroll"
  | "svg"
  | "gesture"
  | "composition"
  | "react"
  | "preset"
  | "recipe"
  | "motion-dna"
  | "design-system"
  | "palette"
  | "choreography"
  | "visual-style"
  | "shader"
  | "graphics"
  | "3d"
  | "ai-motion-spec"
  | "ai-react-component"
  | "studio-config"
  | (string & {});

export interface SchemaPropertyDescriptor {
  readonly type: SchemaPropertyType | readonly SchemaPropertyType[];
  readonly description?: string;
  readonly default?: unknown;
  readonly enum?: readonly (string | number | boolean)[];
  readonly minimum?: number;
  readonly maximum?: number;
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly pattern?: string;
  readonly items?: SchemaPropertyDescriptor | { readonly type: string };
  readonly properties?: Readonly<Record<string, SchemaPropertyDescriptor>>;
  readonly required?: readonly string[];
  readonly additionalProperties?: boolean;
  readonly dependsOn?: string;
  readonly placeholder?: string;
  readonly example?: unknown;
}

export interface CompatibilityMetadata {
  readonly browser: boolean;
  readonly ssr: boolean;
  readonly requiresCanvas?: boolean;
  readonly requiresDom?: boolean;
}

export interface CapabilityAccessibilityMetadata {
  readonly considerations?: readonly string[];
  readonly ariaAttributes?: readonly string[];
  readonly keyboardSupport?: boolean;
  readonly screenReaderSafe?: boolean;
}

export interface CapabilityDependencies {
  readonly required?: readonly string[];
  readonly optional?: readonly string[];
}

export interface CapabilityExample {
  readonly title: string;
  readonly description?: string;
  readonly code: string;
  readonly configuration?: Record<string, unknown>;
}

export type ReducedMotionBehavior =
  | "skips-to-endpoint"
  | "disables-animation"
  | "static-fallback"
  | "respects-profile"
  | "not-applicable";

export interface UnifiedMotionSchema {
  readonly $schema?: string;
  readonly $id: string;
  readonly id?: string;
  readonly schemaVersion: string;
  readonly capabilityId: string;
  readonly name: string;
  readonly category: SchemaCapabilityCategory;
  readonly description: string;
  readonly type: "object";
  readonly properties: Readonly<Record<string, SchemaPropertyDescriptor>>;
  readonly required?: readonly string[];
  readonly additionalProperties?: boolean;
  readonly defaultConfiguration?: Readonly<Record<string, unknown>>;
  readonly compatibility?: CompatibilityMetadata;
  readonly accessibility?: CapabilityAccessibilityMetadata;
  readonly reducedMotion?: ReducedMotionBehavior;
  readonly dependencies?: CapabilityDependencies;
  readonly examples?: readonly CapabilityExample[];
  readonly tags?: readonly string[];
  readonly parameters?: readonly unknown[];
  readonly schema?: {
    readonly type: "object";
    readonly properties: Readonly<Record<string, unknown>>;
    readonly required?: readonly string[];
    readonly additionalProperties?: boolean;
  };
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export type ValidationRule =
  | "required"
  | "type"
  | "range"
  | "enum"
  | "unknown"
  | "pattern"
  | "structure"
  | "length";

export interface ConfigurationValidationError {
  readonly path: string;
  readonly property?: string;
  readonly parameter?: string;
  readonly message: string;
  readonly received?: unknown;
  readonly expected?: string;
  readonly rule: ValidationRule;
}

export interface ConfigurationValidationOptions {
  readonly allowUnknown?: boolean;
  readonly coerceTypes?: boolean;
  readonly strictRequired?: boolean;
}

export interface ConfigurationValidationResult {
  readonly valid: boolean;
  readonly errors: readonly ConfigurationValidationError[];
  readonly resolvedConfiguration?: Readonly<Record<string, unknown>>;
}

export interface SchemaValidationError {
  readonly field: string;
  readonly message: string;
}

export interface SchemaValidationResult {
  readonly valid: boolean;
  readonly errors: readonly SchemaValidationError[];
}

export interface SchemasDocument {
  readonly $schema: string;
  readonly version: string;
  readonly totalSchemas: number;
  readonly schemas: readonly UnifiedMotionSchema[];
}

export interface SchemaFilterOptions {
  readonly category?: string;
  readonly tag?: string;
  readonly version?: string;
}

/**
 * Builds a canonical schema URI for a capability.
 */
export function createSchemaId(capabilityId: string): string {
  return `af-motion:schema:capability:${capabilityId}`;
}

/**
 * Validates a schema document structure before registration or distribution.
 */
export function validateSchema(schema: unknown): SchemaValidationResult {
  const errors: SchemaValidationError[] = [];

  if (!schema || typeof schema !== "object" || Array.isArray(schema)) {
    return {
      valid: false,
      errors: [{ field: "schema", message: "Schema must be a non-null object." }],
    };
  }

  const s = schema as Partial<UnifiedMotionSchema>;

  if (typeof s.$id !== "string" || s.$id.trim() === "") {
    errors.push({ field: "$id", message: "Schema $id must be a non-empty string identifier." });
  }

  if (typeof s.schemaVersion !== "string" || s.schemaVersion.trim() === "") {
    errors.push({ field: "schemaVersion", message: "Schema version must be a non-empty semver string." });
  }

  if (typeof s.capabilityId !== "string" || s.capabilityId.trim() === "") {
    errors.push({ field: "capabilityId", message: "Capability ID must be a non-empty string." });
  }

  if (typeof s.name !== "string" || s.name.trim() === "") {
    errors.push({ field: "name", message: "Schema name must be a non-empty string." });
  }

  if (typeof s.category !== "string" || s.category.trim() === "") {
    errors.push({ field: "category", message: "Schema category must be a non-empty string." });
  }

  if (s.type !== "object") {
    errors.push({ field: "type", message: "Root schema type must be 'object'." });
  }

  if (!s.properties || typeof s.properties !== "object" || Array.isArray(s.properties)) {
    errors.push({ field: "properties", message: "Schema properties must be an object map." });
  } else {
    for (const [propName, propDesc] of Object.entries(s.properties)) {
      if (!propDesc || typeof propDesc !== "object" || Array.isArray(propDesc)) {
        errors.push({ field: `properties.${propName}`, message: `Property descriptor for "${propName}" must be an object.` });
        continue;
      }
      if (!propDesc.type) {
        errors.push({ field: `properties.${propName}.type`, message: `Property "${propName}" must define a type.` });
      }
      if (propDesc.minimum !== undefined && propDesc.maximum !== undefined && propDesc.minimum > propDesc.maximum) {
        errors.push({
          field: `properties.${propName}`,
          message: `Property "${propName}" has minimum (${propDesc.minimum}) greater than maximum (${propDesc.maximum}).`,
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates a runtime configuration object against a UnifiedMotionSchema.
 * Recursively inspects nested objects, array items, required fields, ranges, and enums.
 */
export function validateConfiguration(
  schema: UnifiedMotionSchema | { readonly type: "object"; readonly properties: Record<string, unknown>; readonly required?: readonly string[]; readonly additionalProperties?: boolean },
  configuration: unknown,
  options: ConfigurationValidationOptions = {},
): ConfigurationValidationResult {
  const errors: ConfigurationValidationError[] = [];

  if (configuration === null || typeof configuration !== "object" || Array.isArray(configuration)) {
    return {
      valid: false,
      errors: [
        {
          path: "",
          message: "Configuration must be a non-null object.",
          rule: "structure",
          received: configuration,
          expected: "object",
        },
      ],
    };
  }

  const configObj = configuration as Record<string, unknown>;
  const properties = (schema.properties || {}) as Record<string, SchemaPropertyDescriptor>;
  const requiredList = schema.required || [];
  const allowUnknown = options.allowUnknown ?? (schema.additionalProperties !== false);

  // 1. Check root required fields
  for (const reqKey of requiredList) {
    const val = configObj[reqKey];
    if (val === undefined || (options.strictRequired && val === null)) {
      errors.push({
        path: reqKey,
        property: reqKey,
        parameter: reqKey,
        message: `Missing required parameter "${reqKey}".`,
        rule: "required",
        received: val,
        expected: "defined",
      });
    }
  }

  // Helper for recursive property validation
  function validateProperty(
    propDesc: SchemaPropertyDescriptor,
    val: unknown,
    currentPath: string,
    keyName: string,
  ): void {
    if (val === undefined) return;

    const allowedTypes = Array.isArray(propDesc.type) ? propDesc.type : [propDesc.type];

    // Determine actual type of value
    let actualType: SchemaPropertyType = typeof val as SchemaPropertyType;
    if (val === null) actualType = "null";
    else if (Array.isArray(val)) actualType = "array";

    const typeMatches = allowedTypes.some((t) => {
      if (t === actualType || t === "any") return true;
      if (t === "EasingOption") return actualType === "string" || typeof val === "function";
      if (t === "AnimateTarget") return actualType === "string" || actualType === "object";
      if (t === "AnimatableProperties") return actualType === "object";
      return false;
    });

    if (!typeMatches && val !== null) {
      errors.push({
        path: currentPath,
        property: keyName,
        parameter: keyName,
        message: `Parameter "${currentPath}" must be of type ${allowedTypes.join(" | ")}, received ${actualType}.`,
        rule: "type",
        received: actualType,
        expected: allowedTypes.join(" | "),
      });
      return;
    }

    // Number checks
    if (actualType === "number" && typeof val === "number") {
      if (!Number.isFinite(val)) {
        errors.push({
          path: currentPath,
          property: keyName,
          parameter: keyName,
          message: `Parameter "${currentPath}" must be a finite number, received ${String(val)}.`,
          rule: "type",
          received: val,
          expected: "finite number",
        });
      } else {
        if (propDesc.minimum !== undefined && val < propDesc.minimum) {
          errors.push({
            path: currentPath,
            property: keyName,
            parameter: keyName,
            message: `Parameter "${currentPath}" must be >= ${propDesc.minimum} (minimum), received ${val}.`,
            rule: "range",
            received: val,
            expected: `>= ${propDesc.minimum}`,
          });
        }
        if (propDesc.maximum !== undefined && val > propDesc.maximum) {
          errors.push({
            path: currentPath,
            property: keyName,
            parameter: keyName,
            message: `Parameter "${currentPath}" must be <= ${propDesc.maximum} (maximum), received ${val}.`,
            rule: "range",
            received: val,
            expected: `<= ${propDesc.maximum}`,
          });
        }
      }
    }

    // String checks
    if (actualType === "string" && typeof val === "string") {
      if (propDesc.minLength !== undefined && val.length < propDesc.minLength) {
        errors.push({
          path: currentPath,
          property: keyName,
          parameter: keyName,
          message: `Parameter "${currentPath}" must have length >= ${propDesc.minLength}, received length ${val.length}.`,
          rule: "length",
          received: val.length,
          expected: `>= ${propDesc.minLength}`,
        });
      }
      if (propDesc.maxLength !== undefined && val.length > propDesc.maxLength) {
        errors.push({
          path: currentPath,
          property: keyName,
          parameter: keyName,
          message: `Parameter "${currentPath}" must have length <= ${propDesc.maxLength}, received length ${val.length}.`,
          rule: "length",
          received: val.length,
          expected: `<= ${propDesc.maxLength}`,
        });
      }
      if (propDesc.pattern) {
        try {
          const reg = new RegExp(propDesc.pattern);
          if (!reg.test(val)) {
            errors.push({
              path: currentPath,
              property: keyName,
              parameter: keyName,
              message: `Parameter "${currentPath}" does not match required pattern "${propDesc.pattern}".`,
              rule: "pattern",
              received: val,
              expected: propDesc.pattern,
            });
          }
        } catch {}
      }
    }

    // Enum checks
    if (propDesc.enum && propDesc.enum.length > 0) {
      if (!propDesc.enum.includes(val as string | number | boolean)) {
        errors.push({
          path: currentPath,
          property: keyName,
          parameter: keyName,
          message: `Parameter "${currentPath}" must be one of: ${propDesc.enum.join(", ")}, received ${String(val)}.`,
          rule: "enum",
          received: val,
          expected: propDesc.enum.join(" | "),
        });
      }
    }

    // Nested Object checks
    if (actualType === "object" && typeof val === "object" && val !== null && !Array.isArray(val)) {
      const nestedObj = val as Record<string, unknown>;
      if (propDesc.properties) {
        // Nested required
        if (propDesc.required) {
          for (const nestedReq of propDesc.required) {
            if (nestedObj[nestedReq] === undefined) {
              errors.push({
                path: `${currentPath}.${nestedReq}`,
                property: nestedReq,
                parameter: nestedReq,
                message: `Missing required nested parameter "${currentPath}.${nestedReq}".`,
                rule: "required",
                received: undefined,
                expected: "defined",
              });
            }
          }
        }

        // Nested properties validation
        for (const [subKey, subVal] of Object.entries(nestedObj)) {
          const subDesc = propDesc.properties[subKey];
          if (subDesc) {
            validateProperty(subDesc, subVal, `${currentPath}.${subKey}`, subKey);
          } else if (propDesc.additionalProperties === false || !allowUnknown) {
            errors.push({
              path: `${currentPath}.${subKey}`,
              property: subKey,
              parameter: subKey,
              message: `Unknown nested parameter "${currentPath}.${subKey}" is not permitted.`,
              rule: "unknown",
              received: subVal,
              expected: "undefined",
            });
          }
        }
      }
    }

    // Nested Array checks
    if (actualType === "array" && Array.isArray(val) && propDesc.items) {
      const itemDesc = propDesc.items as SchemaPropertyDescriptor;
      val.forEach((itemVal, idx) => {
        validateProperty(itemDesc, itemVal, `${currentPath}[${idx}]`, `${keyName}[${idx}]`);
      });
    }
  }

  // 2. Validate declared properties
  for (const [key, val] of Object.entries(configObj)) {
    if (val === undefined) continue;
    const propDesc = properties[key];

    if (propDesc) {
      validateProperty(propDesc, val, key, key);
    } else if (!allowUnknown) {
      errors.push({
        path: key,
        property: key,
        parameter: key,
        message: `Unknown parameter "${key}" is not permitted by schema.`,
        rule: "unknown",
        received: val,
        expected: "undefined",
      });
    }
  }

  // 3. Resolve defaults if valid
  let resolvedConfiguration: Record<string, unknown> | undefined;
  if (errors.length === 0) {
    resolvedConfiguration = resolveConfigurationDefaults(schema as UnifiedMotionSchema, configObj);
  }

  return {
    valid: errors.length === 0,
    errors,
    resolvedConfiguration: resolvedConfiguration ? Object.freeze(resolvedConfiguration) : undefined,
  };
}

/**
 * Pure function that resolves default values from a schema and merges them with user configurations.
 * Recursively applies defaults to nested objects.
 */
export function resolveConfigurationDefaults<T = Record<string, unknown>>(
  schema: UnifiedMotionSchema | { readonly properties?: Record<string, unknown>; readonly defaultConfiguration?: Record<string, unknown> },
  configuration: Record<string, unknown> = {},
): T {
  const result: Record<string, unknown> = {};
  const properties = (schema.properties || {}) as Record<string, SchemaPropertyDescriptor>;

  // Apply root defaultConfiguration if provided
  if ("defaultConfiguration" in schema && schema.defaultConfiguration) {
    Object.assign(result, schema.defaultConfiguration);
  }

  // Helper for applying property defaults recursively
  function applyDefaults(props: Record<string, SchemaPropertyDescriptor>, target: Record<string, unknown>, userVals: Record<string, unknown>): void {
    for (const [key, desc] of Object.entries(props)) {
      const userVal = userVals[key];

      if (userVal !== undefined) {
        if (typeof userVal === "object" && userVal !== null && !Array.isArray(userVal) && desc.properties) {
          const nestedTarget: Record<string, unknown> = {};
          if (desc.default && typeof desc.default === "object") {
            Object.assign(nestedTarget, desc.default);
          }
          applyDefaults(desc.properties, nestedTarget, userVal as Record<string, unknown>);
          target[key] = nestedTarget;
        } else {
          target[key] = userVal;
        }
      } else if (desc.default !== undefined) {
        if (typeof desc.default === "object" && desc.default !== null && !Array.isArray(desc.default) && desc.properties) {
          const nestedTarget = { ...(desc.default as Record<string, unknown>) };
          applyDefaults(desc.properties, nestedTarget, {});
          target[key] = nestedTarget;
        } else {
          target[key] = desc.default;
        }
      }
    }
  }

  applyDefaults(properties, result, configuration);

  // Preserve any additional user options passed in
  for (const [key, val] of Object.entries(configuration)) {
    if (result[key] === undefined && val !== undefined) {
      result[key] = val;
    }
  }

  return result as T;
}

/**
 * Creates a complete UnifiedMotionSchema for a capability, deriving schema properties from parameter descriptors if necessary.
 */
export function createUnifiedSchema(capability: {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly description: string;
  readonly version?: string;
  readonly schema?: { readonly type: "object"; readonly properties: Record<string, unknown>; readonly required?: readonly string[]; readonly additionalProperties?: boolean };
  readonly parameters?: readonly { readonly name: string; readonly kind?: string; readonly type: string; readonly required?: boolean; readonly default?: unknown; readonly description?: string; readonly range?: { readonly min?: number; readonly max?: number }; readonly enum?: readonly (string | number)[]; readonly itemType?: string }[];
  readonly defaultConfiguration?: Readonly<Record<string, unknown>>;
  readonly compatibility?: CompatibilityMetadata;
  readonly accessibility?: CapabilityAccessibilityMetadata;
  readonly reducedMotion?: ReducedMotionBehavior;
  readonly dependencies?: CapabilityDependencies;
  readonly examples?: readonly CapabilityExample[];
  readonly tags?: readonly string[];
  readonly metadata?: Readonly<Record<string, unknown>>;
}): UnifiedMotionSchema {
  const schemaId = createSchemaId(capability.id);
  const schemaVersion = capability.version || SCHEMA_SPEC_VERSION;
  const properties: Record<string, SchemaPropertyDescriptor> = {};
  const required: string[] = [];

  // If explicit schema exists, copy its properties
  if (capability.schema?.properties) {
    for (const [k, p] of Object.entries(capability.schema.properties)) {
      properties[k] = p as SchemaPropertyDescriptor;
    }
    if (capability.schema.required) {
      required.push(...capability.schema.required);
    }
  }

  // Ingest parameters
  if (capability.parameters) {
    for (const param of capability.parameters) {
      if (!properties[param.name]) {
        let propType: SchemaPropertyType = "string";
        if (param.type === "number") propType = "number";
        else if (param.type === "boolean") propType = "boolean";
        else if (param.type === "object") propType = "object";
        else if (param.type.includes("[]") || param.type.startsWith("Array")) propType = "array";

        properties[param.name] = {
          type: propType,
          description: param.description,
          default: param.default,
          enum: param.enum,
          minimum: param.range?.min,
          maximum: param.range?.max,
          items: param.itemType ? { type: param.itemType } : undefined,
        };
      }
      if (param.required && !required.includes(param.name)) {
        required.push(param.name);
      }
    }
  }

  // Populate defaultConfiguration keys if not yet present
  if (capability.defaultConfiguration) {
    for (const [k, v] of Object.entries(capability.defaultConfiguration)) {
      if (!properties[k]) {
        const valType = (typeof v === "number" ? "number" : typeof v === "boolean" ? "boolean" : typeof v === "object" ? "object" : "string") as SchemaPropertyType;
        properties[k] = {
          type: valType,
          default: v,
        };
      }
    }
  }

  const rawSchema = {
    type: "object" as const,
    properties,
    required: required.length > 0 ? Object.freeze(required) : undefined,
    additionalProperties: capability.schema?.additionalProperties ?? true,
  };

  return Object.freeze({
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: schemaId,
    id: capability.id,
    capabilityId: capability.id,
    schemaVersion,
    name: capability.name,
    category: capability.category as SchemaCapabilityCategory,
    description: capability.description,
    type: "object" as const,
    properties: Object.freeze(properties),
    required: required.length > 0 ? Object.freeze(required) : undefined,
    additionalProperties: capability.schema?.additionalProperties ?? true,
    defaultConfiguration: capability.defaultConfiguration ?? {},
    compatibility: capability.compatibility,
    accessibility: capability.accessibility,
    reducedMotion: capability.reducedMotion,
    dependencies: capability.dependencies,
    examples: capability.examples,
    tags: capability.tags,
    parameters: capability.parameters,
    schema: rawSchema,
    metadata: capability.metadata,
  });
}
