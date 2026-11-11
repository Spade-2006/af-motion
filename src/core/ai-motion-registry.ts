/**
 * AF Motion AI Motion Registry
 *
 * Foundational machine-readable registry allowing AI agents, MCP tools,
 * IDE plugins, and developer tools to discover, inspect, configure,
 * and validate AF Motion's full spectrum of capabilities.
 */

export const REGISTRY_SCHEMA_VERSION = "1.0.0";

import {
  createUnifiedSchema,
  createSchemaId,
  type UnifiedMotionSchema,
  type SchemaFilterOptions,
  type SchemasDocument,
} from "./schema.js";

export type AIMotionCategory =
  | "animation"
  | "effect"
  | "interaction"
  | "background"
  | "preset"
  | "recipe"
  | "choreography"
  | "motion-dna"
  | "adaptive-motion"
  | "design-system"
  | "palette"
  | "visual-style"
  | "graphics"
  | "3d-scene"
  | "core-animation"
  | "visual-effect"
  | "text-effect"
  | "pointer"
  | "scroll"
  | "svg"
  | "gesture"
  | "composition"
  | "react"
  | (string & {});

export type ParameterKind = "positional" | "option" | "prop";

export interface ParameterMetadata {
  readonly name: string;
  readonly kind: ParameterKind;
  readonly type: string;
  readonly required: boolean;
  readonly default?: unknown;
  readonly description: string;
  readonly placeholder?: string;
  readonly range?: { readonly min?: number; readonly max?: number };
  readonly enum?: readonly (string | number)[];
  readonly itemType?: string;
  readonly dependsOn?: string;
  readonly example?: unknown;
}

export interface CallbackParameterDescriptor {
  readonly name: string;
  readonly type: string;
  readonly description: string;
}

export interface CallbackDescriptor {
  readonly name: string;
  readonly parameters: readonly CallbackParameterDescriptor[];
  readonly returnType: string;
  readonly description: string;
}

export interface CompatibilityMetadata {
  readonly browser: boolean;
  readonly ssr: boolean;
  readonly requiresCanvas?: boolean;
  readonly requiresDom?: boolean;
}

export interface UsageSignature {
  readonly importStatement: string;
  readonly invocation: string;
  readonly exampleCode: string;
}

export type ReducedMotionBehavior =
  | "skips-to-endpoint"
  | "disables-animation"
  | "static-fallback"
  | "respects-profile"
  | "not-applicable";

export interface CapabilityConfigurationProperty {
  readonly type: string;
  readonly description?: string;
  readonly default?: unknown;
  readonly enum?: readonly (string | number)[];
  readonly minimum?: number;
  readonly maximum?: number;
  readonly items?: { readonly type: string };
}

export interface CapabilityConfigurationSchema {
  readonly type: "object";
  readonly properties: Readonly<Record<string, CapabilityConfigurationProperty>>;
  readonly required?: readonly string[];
  readonly additionalProperties?: boolean;
}

export interface CapabilityExample {
  readonly title: string;
  readonly description?: string;
  readonly code: string;
  readonly configuration?: Record<string, unknown>;
}

export interface CapabilityReactMetadata {
  readonly available: boolean;
  readonly componentName?: string;
  readonly hookName?: string;
  readonly importPath?: string;
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

export interface AIMotionCapability {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: AIMotionCategory;
  readonly tags?: readonly string[];
  readonly version?: string;
  readonly schema?: CapabilityConfigurationSchema;
  readonly parameters?: readonly ParameterMetadata[];
  readonly defaultConfiguration?: Readonly<Record<string, unknown>>;
  readonly dependencies?: CapabilityDependencies;
  readonly compatibility?: CompatibilityMetadata;
  readonly react?: CapabilityReactMetadata;
  readonly accessibility?: CapabilityAccessibilityMetadata;
  readonly reducedMotion?: ReducedMotionBehavior;
  readonly supportedTargets?: readonly string[];
  readonly signature?: UsageSignature;
  readonly examples?: readonly CapabilityExample[];
  readonly controls?: readonly string[];
  readonly callbacks?: readonly string[];
  readonly callbackDescriptors?: readonly CallbackDescriptor[];
  readonly custom?: boolean;
}

export interface CapabilityFilterOptions {
  readonly category?: AIMotionCategory;
  readonly tags?: readonly string[];
  readonly target?: string;
  readonly search?: string;
  readonly ssrCompatible?: boolean;
  readonly requiresCanvas?: boolean;
  readonly reactAvailable?: boolean;
  readonly customOnly?: boolean;
}

export interface CapabilitySearchQuery {
  readonly term?: string;
  readonly category?: AIMotionCategory;
  readonly tags?: readonly string[];
  readonly limit?: number;
}

export interface CapabilitySchemaInfo {
  readonly id: string;
  readonly name: string;
  readonly category: AIMotionCategory;
  readonly schema: CapabilityConfigurationSchema;
  readonly defaultConfiguration: Readonly<Record<string, unknown>>;
  readonly parameters: readonly ParameterMetadata[];
  readonly examples: readonly CapabilityExample[];
}

export interface CapabilityRegistrationValidationError {
  readonly field: string;
  readonly message: string;
}

export interface CapabilityValidationResult {
  readonly valid: boolean;
  readonly errors: readonly CapabilityRegistrationValidationError[];
}

export interface RegistryExportOptions {
  readonly pretty?: boolean;
  readonly includeCustom?: boolean;
  readonly category?: AIMotionCategory;
}

export interface RegistryDocument {
  readonly $schema: string;
  readonly version: string;
  readonly totalCapabilities: number;
  readonly builtInCount: number;
  readonly customCount: number;
  readonly categories: readonly string[];
  readonly tags: readonly string[];
  readonly capabilities: readonly AIMotionCapability[];
}

export interface AIMotionRegistry {
  registerCapability(capability: AIMotionCapability, options?: { override?: boolean }): void;
  unregisterCapability(id: string): boolean;
  getCapability(id: string): AIMotionCapability | undefined;
  hasCapability(id: string): boolean;
  listCapabilities(filter?: CapabilityFilterOptions): readonly AIMotionCapability[];
  searchCapabilities(query: string | CapabilitySearchQuery): readonly AIMotionCapability[];
  getCapabilitiesByCategory(category: AIMotionCategory): readonly AIMotionCapability[];
  getCapabilitiesByTag(tag: string): readonly AIMotionCapability[];
  getCapabilitySchema(id: string): UnifiedMotionSchema | undefined;
  getSchemaById(schemaId: string): UnifiedMotionSchema | undefined;
  listSchemas(filter?: SchemaFilterOptions): readonly UnifiedMotionSchema[];
  exportSchemas(options?: { pretty?: boolean; category?: string }): SchemasDocument;
  getCapabilityCategories(): readonly string[];
  getCapabilityTags(): readonly string[];
  getCategories(): readonly string[];
  getTags(): readonly string[];
  subscribe(listener: () => void): () => void;
  exportRegistry(options?: RegistryExportOptions): RegistryDocument;
  resetCustomCapabilities(): void;
  reset(): void;
  getVersion(): number;
}

/**
 * Validates capability metadata before registration.
 */
export function validateCapability(capability: unknown): CapabilityValidationResult {
  const errors: CapabilityRegistrationValidationError[] = [];

  if (!capability || typeof capability !== "object" || Array.isArray(capability)) {
    return {
      valid: false,
      errors: [{ field: "capability", message: "Capability must be a non-null object." }],
    };
  }

  const cap = capability as Partial<AIMotionCapability>;

  if (typeof cap.id !== "string" || cap.id.trim() === "") {
    errors.push({ field: "id", message: "Capability ID must be a non-empty string." });
  } else if (!/^[a-z0-9-_]+$/i.test(cap.id)) {
    errors.push({ field: "id", message: `Capability ID "${cap.id}" contains invalid characters (use alphanumeric, hyphen, underscore).` });
  }

  if (typeof cap.name !== "string" || cap.name.trim() === "") {
    errors.push({ field: "name", message: "Capability name must be a non-empty string." });
  }

  if (typeof cap.description !== "string" || cap.description.trim().length < 5) {
    errors.push({ field: "description", message: "Capability description must be at least 5 characters long." });
  }

  if (typeof cap.category !== "string" || cap.category.trim() === "") {
    errors.push({ field: "category", message: "Capability category must be a non-empty string." });
  }

  if (cap.tags !== undefined) {
    if (!Array.isArray(cap.tags) || cap.tags.some((t) => typeof t !== "string" || t.trim() === "")) {
      errors.push({ field: "tags", message: "Tags must be an array of non-empty strings." });
    }
  }

  if (cap.schema !== undefined) {
    if (!cap.schema || typeof cap.schema !== "object" || cap.schema.type !== "object") {
      errors.push({ field: "schema", message: "Schema must be an object schema with type: 'object'." });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Derives a JSON schema from parameter metadata if no explicit schema is provided.
 */
export function deriveJsonSchemaFromParameters(
  parameters: readonly ParameterMetadata[] | undefined,
  defaultConfig: Readonly<Record<string, unknown>> | undefined,
): CapabilityConfigurationSchema {
  const properties: Record<string, CapabilityConfigurationProperty> = {};
  const required: string[] = [];

  if (parameters) {
    for (const param of parameters) {
      if (param.kind === "option" || param.kind === "prop") {
        const prop: CapabilityConfigurationProperty = {
          type: param.type,
          description: param.description,
          default: param.default,
          enum: param.enum,
          minimum: param.range?.min,
          maximum: param.range?.max,
          items: param.itemType ? { type: param.itemType } : undefined,
        };
        properties[param.name] = prop;
        if (param.required) {
          required.push(param.name);
        }
      }
    }
  }

  if (defaultConfig) {
    for (const [key, value] of Object.entries(defaultConfig)) {
      if (!properties[key]) {
        properties[key] = {
          type: typeof value,
          default: value,
        };
      }
    }
  }

  return {
    type: "object",
    properties,
    required: required.length > 0 ? required : undefined,
    additionalProperties: true,
  };
}

/**
 * Creates an instance of the AI Motion Registry.
 */
export function createAIMotionRegistry(initialCapabilities: readonly AIMotionCapability[] = []): AIMotionRegistry {
  const builtInMap = new Map<string, AIMotionCapability>();
  const customMap = new Map<string, AIMotionCapability>();
  const listeners = new Set<() => void>();
  let version = 0;
  let cachedAll: readonly AIMotionCapability[] | null = null;

  for (const cap of initialCapabilities) {
    const frozen = Object.freeze({ ...cap, custom: false });
    builtInMap.set(cap.id, frozen);
  }

  function notify(): void {
    version++;
    cachedAll = null;
    for (const listener of listeners) {
      try {
        listener();
      } catch {}
    }
  }

  function getAllCapabilities(): readonly AIMotionCapability[] {
    if (cachedAll) return cachedAll;
    const list: AIMotionCapability[] = [];
    for (const cap of builtInMap.values()) {
      if (!customMap.has(cap.id)) {
        list.push(cap);
      }
    }
    for (const cap of customMap.values()) {
      list.push(cap);
    }
    cachedAll = Object.freeze(list);
    return cachedAll;
  }

  return {
    registerCapability(capability: AIMotionCapability, options: { override?: boolean } = {}): void {
      const validation = validateCapability(capability);
      if (!validation.valid) {
        const msg = validation.errors.map((e) => `${e.field}: ${e.message}`).join("; ");
        throw new TypeError(`Cannot register capability: ${msg}`);
      }

      if (builtInMap.has(capability.id) && !options.override) {
        throw new Error(`Cannot overwrite built-in capability "${capability.id}" without options.override = true`);
      }

      const stored: AIMotionCapability = Object.freeze({
        ...capability,
        custom: true,
      });

      customMap.set(capability.id, stored);
      notify();
    },

    unregisterCapability(id: string): boolean {
      if (typeof id !== "string") {
        throw new TypeError("Capability ID must be a string");
      }

      if (builtInMap.has(id) && !customMap.has(id)) {
        throw new Error(`Cannot unregister built-in capability "${id}"`);
      }

      const removed = customMap.delete(id);
      if (removed) {
        notify();
      }
      return removed;
    },

    getCapability(id: string): AIMotionCapability | undefined {
      if (typeof id !== "string") return undefined;
      return customMap.get(id) ?? builtInMap.get(id);
    },

    hasCapability(id: string): boolean {
      if (typeof id !== "string") return false;
      return customMap.has(id) || builtInMap.has(id);
    },

    listCapabilities(filter: CapabilityFilterOptions = {}): readonly AIMotionCapability[] {
      let list = getAllCapabilities();

      if (filter.customOnly) {
        list = list.filter((c) => c.custom === true);
      }

      if (filter.category) {
        const catNorm = filter.category.toLowerCase();
        list = list.filter((c) => {
          const cNorm = c.category.toLowerCase();
          if (cNorm === catNorm) return true;
          // Alias matching (e.g. animation <-> core-animation, effect <-> visual-effect)
          if (catNorm === "animation" && cNorm === "core-animation") return true;
          if (catNorm === "core-animation" && cNorm === "animation") return true;
          if (catNorm === "effect" && cNorm === "visual-effect") return true;
          if (catNorm === "visual-effect" && cNorm === "effect") return true;
          return false;
        });
      }

      if (filter.tags && filter.tags.length > 0) {
        const reqTags = filter.tags.map((t) => t.toLowerCase());
        list = list.filter((c) => {
          if (!c.tags || c.tags.length === 0) return false;
          const cTags = c.tags.map((t) => t.toLowerCase());
          return reqTags.every((t) => cTags.includes(t));
        });
      }

      if (filter.target) {
        const targetReq = filter.target.toLowerCase();
        list = list.filter((c) =>
          c.supportedTargets?.some((t) => t.toLowerCase().includes(targetReq)),
        );
      }

      if (filter.ssrCompatible !== undefined) {
        list = list.filter((c) => c.compatibility?.ssr === filter.ssrCompatible);
      }

      if (filter.requiresCanvas !== undefined) {
        list = list.filter((c) => (c.compatibility?.requiresCanvas ?? false) === filter.requiresCanvas);
      }

      if (filter.reactAvailable !== undefined) {
        list = list.filter((c) => (c.react?.available ?? false) === filter.reactAvailable);
      }

      if (filter.search && filter.search.trim() !== "") {
        const term = filter.search.toLowerCase().trim();
        list = list.filter((c) =>
          c.name.toLowerCase().includes(term) ||
          c.id.toLowerCase().includes(term) ||
          c.description.toLowerCase().includes(term) ||
          c.tags?.some((t) => t.toLowerCase().includes(term)) ||
          c.category.toLowerCase().includes(term),
        );
      }

      return Object.freeze([...list]);
    },

    searchCapabilities(query: string | CapabilitySearchQuery): readonly AIMotionCapability[] {
      const q: CapabilitySearchQuery = typeof query === "string" ? { term: query } : query;
      const term = q.term ? q.term.toLowerCase().trim() : "";

      if (!term && !q.category && (!q.tags || q.tags.length === 0)) {
        return [];
      }

      let results = getAllCapabilities();

      if (q.category) {
        const catNorm = q.category.toLowerCase();
        results = results.filter((c) => c.category.toLowerCase() === catNorm);
      }

      if (q.tags && q.tags.length > 0) {
        const reqTags = q.tags.map((t) => t.toLowerCase());
        results = results.filter((c) => {
          if (!c.tags) return false;
          const cTags = c.tags.map((t) => t.toLowerCase());
          return reqTags.some((t) => cTags.includes(t));
        });
      }

      if (term) {
        const scored = results.map((c) => {
          let score = 0;
          const id = c.id.toLowerCase();
          const name = c.name.toLowerCase();
          const desc = c.description.toLowerCase();
          const cat = c.category.toLowerCase();
          const tags = (c.tags || []).map((t) => t.toLowerCase());

          if (id === term) score += 100;
          else if (id.includes(term)) score += 40;

          if (name === term) score += 80;
          else if (name.includes(term)) score += 30;

          if (cat === term) score += 50;

          for (const tag of tags) {
            if (tag === term) score += 40;
            else if (tag.includes(term)) score += 15;
          }

          if (desc.includes(term)) score += 10;

          return { capability: c, score };
        });

        results = scored
          .filter((item) => item.score > 0)
          .sort((a, b) => b.score - a.score)
          .map((item) => item.capability);
      }

      if (q.limit !== undefined && q.limit > 0) {
        results = results.slice(0, q.limit);
      }

      return Object.freeze([...results]);
    },

    getCapabilitiesByCategory(category: AIMotionCategory): readonly AIMotionCapability[] {
      return this.listCapabilities({ category });
    },

    getCapabilitiesByTag(tag: string): readonly AIMotionCapability[] {
      return this.listCapabilities({ tags: [tag] });
    },

    getCapabilitySchema(id: string): UnifiedMotionSchema | undefined {
      const cap = this.getCapability(id);
      if (!cap) return undefined;
      return createUnifiedSchema(cap);
    },

    getSchemaById(schemaId: string): UnifiedMotionSchema | undefined {
      if (typeof schemaId !== "string" || !schemaId.trim()) return undefined;

      const prefix = "af-motion:schema:capability:";
      if (schemaId.startsWith(prefix)) {
        const capabilityId = schemaId.slice(prefix.length);
        return this.getCapabilitySchema(capabilityId);
      }

      const shortPrefix = "af-motion:schema:";
      if (schemaId.startsWith(shortPrefix)) {
        const capabilityId = schemaId.slice(shortPrefix.length);
        return this.getCapabilitySchema(capabilityId);
      }

      return this.getCapabilitySchema(schemaId);
    },

    listSchemas(filter: SchemaFilterOptions = {}): readonly UnifiedMotionSchema[] {
      let caps = getAllCapabilities();

      if (filter.category) {
        const catNorm = filter.category.toLowerCase();
        caps = caps.filter((c) => c.category.toLowerCase() === catNorm);
      }

      if (filter.tag) {
        const tagNorm = filter.tag.toLowerCase();
        caps = caps.filter((c) => c.tags?.some((t) => t.toLowerCase() === tagNorm));
      }

      const schemas = caps.map((c) => createUnifiedSchema(c));

      if (filter.version) {
        return Object.freeze(schemas.filter((s) => s.schemaVersion === filter.version));
      }

      return Object.freeze(schemas);
    },

    exportSchemas(options: { pretty?: boolean; category?: string } = {}): SchemasDocument {
      const schemas = this.listSchemas({ category: options.category });
      return {
        $schema: "https://af-motion.dev/schemas/schemas-document-v1.json",
        version: "1.0.0",
        totalSchemas: schemas.length,
        schemas,
      };
    },

    getCapabilityCategories(): readonly string[] {
      const categories = new Set<string>();
      for (const cap of getAllCapabilities()) {
        categories.add(cap.category);
      }
      return Object.freeze(Array.from(categories).sort());
    },

    getCapabilityTags(): readonly string[] {
      const tags = new Set<string>();
      for (const cap of getAllCapabilities()) {
        if (cap.tags) {
          for (const t of cap.tags) tags.add(t);
        }
      }
      return Object.freeze(Array.from(tags).sort());
    },

    subscribe(listener: () => void): () => void {
      if (typeof listener !== "function") {
        throw new TypeError("Registry listener must be a function");
      }
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    exportRegistry(options: RegistryExportOptions = {}): RegistryDocument {
      let caps = getAllCapabilities();

      if (options.includeCustom === false) {
        caps = caps.filter((c) => !c.custom);
      }

      if (options.category) {
        const catNorm = options.category.toLowerCase();
        caps = caps.filter((c) => c.category.toLowerCase() === catNorm);
      }

      const builtInCount = caps.filter((c) => !c.custom).length;
      const customCount = caps.filter((c) => c.custom).length;

      const categories = Array.from(new Set(caps.map((c) => c.category))).sort();
      const tags = Array.from(new Set(caps.flatMap((c) => c.tags || []))).sort();

      return {
        $schema: "https://af-motion.dev/schemas/ai-motion-registry-v1.json",
        version: REGISTRY_SCHEMA_VERSION,
        totalCapabilities: caps.length,
        builtInCount,
        customCount,
        categories,
        tags,
        capabilities: caps,
      };
    },

    resetCustomCapabilities(): void {
      if (customMap.size > 0) {
        customMap.clear();
        notify();
      }
    },
    reset(): void {
      this.resetCustomCapabilities();
    },
    getCategories(): readonly string[] {
      return this.getCapabilityCategories();
    },
    getTags(): readonly string[] {
      return this.getCapabilityTags();
    },
    getVersion(): number {
      return version;
    },
  };
}
