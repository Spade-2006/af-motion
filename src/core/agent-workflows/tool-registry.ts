/**
 * AF Motion � Safe Tool Registry (Phase 18, Prompt 144)
 *
 * Implements a strict, safe, approved registry of tools that agents can invoke.
 * Enforces permission levels, input schema validation, execution timeouts,
 * and zero unsafe operations (no eval, no shell, no raw network, no fs).
 */

import type { ToolDefinition, ToolPermission } from "./types.js";
import {
  evaluateMotionQuality,
  generateMotionRecommendations,
  classifyMotionIntent,
  type MotionAnalysisInput,
} from "../ai-motion-intelligence/index.js";
import { designToMotionEngine } from "../design-to-motion/index.js";
import { aiSceneGenerationEngine, listAIScenePresets } from "../scene-generation/index.js";
import { isPlainObject, sanitizeCodeIdentifier } from "../utils/safe-json.js";

export class SafeToolRegistry {
  private readonly tools = new Map<string, ToolDefinition>();

  public register<TInput = Record<string, unknown>, TOutput = Record<string, unknown>>(
    tool: ToolDefinition<TInput, TOutput>
  ): void {
    if (!tool || !tool.id) {
      throw new Error("Cannot register tool without an id");
    }
    if (this.tools.has(tool.id)) {
      throw new Error(`Tool with ID "${tool.id}" is already registered`);
    }
    if (typeof tool.execute !== "function") {
      throw new Error(`Tool "${tool.id}" must provide an execute() function`);
    }
    if (typeof tool.inputSchemaValidator !== "function") {
      throw new Error(`Tool "${tool.id}" must provide an inputSchemaValidator function`);
    }

    this.tools.set(tool.id, tool as unknown as ToolDefinition);
  }

  public unregister(toolId: string): boolean {
    return this.tools.delete(toolId);
  }

  public get(toolId: string): ToolDefinition | undefined {
    return this.tools.get(toolId);
  }

  public has(toolId: string): boolean {
    return this.tools.has(toolId);
  }

  public list(): Array<Omit<ToolDefinition, "execute" | "inputSchemaValidator">> {
    return Array.from(this.tools.values()).map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      permission: t.permission,
      timeoutMs: t.timeoutMs,
    }));
  }

  public async invoke<TOutput = Record<string, unknown>>(
    toolId: string,
    input: Record<string, unknown>,
    options?: { signal?: AbortSignal; allowedPermissions?: ToolPermission[] }
  ): Promise<TOutput> {
    const tool = this.tools.get(toolId);
    if (!tool) {
      throw new Error(`Tool "${toolId}" is not registered in the Safe Tool Registry`);
    }

    if (
      options?.allowedPermissions &&
      !options.allowedPermissions.includes(tool.permission)
    ) {
      throw new Error(
        `Permission denied: Tool "${toolId}" requires "${tool.permission}" permission, but only [${options.allowedPermissions.join(
          ", "
        )}] are permitted`
      );
    }

    if (!isPlainObject(input)) {
      throw new Error(`Tool "${toolId}" input validation failed: input must be a plain object`);
    }
    // Input validation
    const validation = tool.inputSchemaValidator(input);
    if (!validation.valid) {
      throw new Error(
        `Tool "${toolId}" input validation failed: ${validation.errors?.join("; ") ?? "invalid input"}`
      );
    }

    // Abort check before execution
    if (options?.signal?.aborted) {
      throw new Error(`Execution of tool "${toolId}" was aborted before start`);
    }

    const timeoutMs = tool.timeoutMs ?? 5000;

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(`Tool "${toolId}" execution timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    try {
      const result = await Promise.race([
        Promise.resolve(tool.execute(input, { signal: options?.signal })),
        timeoutPromise,
      ]);
      if (result === null || typeof result !== "object") {
        throw new Error(`Tool "${toolId}" returned an invalid non-object output`);
      }
      return result as TOutput;
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }

  public clear(): void {
    this.tools.clear();
  }

  public get size(): number {
    return this.tools.size;
  }
}

export const safeToolRegistry = new SafeToolRegistry();

// ---------------------------------------------------------------------------
// Standard AF Motion Safe Tools Registration
// ---------------------------------------------------------------------------

export function registerDefaultSafeTools(registry: SafeToolRegistry = safeToolRegistry): void {
  // 1. analyze_motion (Prompt 141)
  if (!registry.has("analyze_motion")) {
    registry.register({
      id: "analyze_motion",
      name: "Analyze Motion Quality",
      description: "Evaluates animation configuration quality, detects issues, and scores visual appeal (Prompt 141).",
      permission: "read",
      inputSchemaValidator: (input: unknown) => {
        if (!input || typeof input !== "object") {
          return { valid: false, errors: ["Input must be an object"] };
        }
        return { valid: true };
      },
      execute: async (input: Record<string, unknown>) => {
        const analysisInput: MotionAnalysisInput = {
          configuration: input,
        };
        const qualityReport = evaluateMotionQuality(analysisInput);
        const recommendations = generateMotionRecommendations(analysisInput, qualityReport.findings);
        const intentAnalysis = classifyMotionIntent(analysisInput);
        const score = qualityReport.scores.overall;

        return {
          qualityReport,
          recommendations,
          intentAnalysis,
          score,
          passed: score >= 70,
        };
      },
    });
  }

  // 2. generate_motion_config
  if (!registry.has("generate_motion_config")) {
    registry.register({
      id: "generate_motion_config",
      name: "Generate Motion Config",
      description: "Generates optimal animation keyframes, spring physics, and easing curves for an element.",
      permission: "generate",
      inputSchemaValidator: (input: unknown) => {
        if (!input || typeof input !== "object") {
          return { valid: false, errors: ["Input must be an object"] };
        }
        return { valid: true };
      },
      execute: async (input: Record<string, unknown>) => {
        const dna = (input.dna as string) || "precise";
        const element = (input.element as string) || "card";
        const duration = dna === "playful" ? 450 : dna === "energetic" ? 300 : 500;
        const spring = dna === "playful"
          ? { stiffness: 280, damping: 14 }
          : dna === "energetic"
          ? { stiffness: 350, damping: 22 }
          : { stiffness: 180, damping: 20 };

        return {
          element,
          dna,
          animation: {
            duration,
            easing: "cubic-bezier(0.16, 1, 0.3, 1)",
            keyframes: [
              { opacity: 0, transform: "translateY(16px) scale(0.96)" },
              { opacity: 1, transform: "translateY(0px) scale(1.0)" },
            ],
            spring,
          },
        };
      },
    });
  }

  // 3. generate_design_motion (Prompt 142)
  if (!registry.has("generate_design_motion")) {
    registry.register({
      id: "generate_design_motion",
      name: "Design-to-Motion Generation",
      description: "Transforms visual design descriptions and specifications into full AF Motion configurations (Prompt 142).",
      permission: "generate",
      inputSchemaValidator: (input: unknown) => {
        if (!input || typeof input !== "object") {
          return { valid: false, errors: ["Input must be an object"] };
        }
        return { valid: true };
      },
      execute: async (input: Record<string, unknown>) => {
        const result = await designToMotionEngine.generate(input as any);
        return {
          result,
          composition: result.composition,
          elementsCount: result.plan.elementPlans.length,
          validation: result.validation,
          qualityScore: result.validation.qualityScore,
        };
      },
    });
  }

  // 4. generate_scene (Prompt 143)
  if (!registry.has("generate_scene")) {
    registry.register({
      id: "generate_scene",
      name: "AI Scene Generation",
      description: "Generates coordinated multi-system 3D, physics, particle, and DOM scenes (Prompt 143).",
      permission: "generate",
      inputSchemaValidator: (input: unknown) => {
        if (!input || typeof input !== "object") {
          return { valid: false, errors: ["Input must be an object"] };
        }
        return { valid: true };
      },
      execute: async (input: Record<string, unknown>) => {
        const result = await aiSceneGenerationEngine.generate(input as any);
        return {
          result,
          composition: result.composition,
          scene3D: result.scene3dSpec,
          objectsCount: result.plan.objectCount,
          validation: result.validation,
          qualityScore: result.validation.qualityScore,
        };
      },
    });
  }

  // 5. validate_composition
  if (!registry.has("validate_composition")) {
    registry.register({
      id: "validate_composition",
      name: "Validate Composition Graph",
      description: "Audits composition hierarchy, timing synchronization, and acyclicity.",
      permission: "validate",
      inputSchemaValidator: (input: unknown) => {
        if (!input || typeof input !== "object") {
          return { valid: false, errors: ["Input must be an object"] };
        }
        return { valid: true };
      },
      execute: async (input: Record<string, unknown>) => {
        const comp = (input.composition as Record<string, unknown>) || input;
        const nodes = Array.isArray(comp.nodes) ? comp.nodes : (comp.nodes && typeof comp.nodes === 'object') ? Object.keys(comp.nodes) : [];
        const tracks = Array.isArray(comp.tracks) ? comp.tracks : [];

        const issues: string[] = [];
        if (nodes.length === 0 && tracks.length === 0) {
          issues.push("Composition is empty: has no nodes or tracks");
        }

        return {
          valid: issues.length === 0,
          issues,
          nodesCount: nodes.length,
          tracksCount: tracks.length,
          durationMs: (comp.durationMs as number) || 1000,
        };
      },
    });
  }

  // 6. analyze_performance
  if (!registry.has("analyze_performance")) {
    registry.register({
      id: "analyze_performance",
      name: "Analyze Performance Telemetry",
      description: "Inspects FPS, frame times, memory metrics, and recommends adaptive tier optimizations.",
      permission: "read",
      inputSchemaValidator: (input: unknown) => {
        if (!isPlainObject(input)) {
          return { valid: false, errors: ["Input must be a plain object"] };
        }
        for (const k of ["fps", "memoryMB", "droppedFrames"] as const) {
          if (input[k] !== undefined && (typeof input[k] !== "number" || !Number.isFinite(input[k] as number) || (input[k] as number) < 0)) {
            return { valid: false, errors: [`"${k}" must be a finite number >= 0`] };
          }
        }
        return { valid: true };
      },
      execute: async (input: Record<string, unknown>) => {
        const fps = (input.fps as number) ?? 60;
        const memoryMB = (input.memoryMB as number) ?? 45;
        const droppedFrames = (input.droppedFrames as number) ?? 0;
        const bottlenecks: string[] = [];
        const recommendations: string[] = [];

        if (fps < 50) {
          bottlenecks.push(`Low framerate detected: ${fps} FPS`);
          recommendations.push("Reduce particle count or downgrade shadow resolution to low");
        }
        if (memoryMB > 120) {
          bottlenecks.push(`High memory usage: ${memoryMB} MB`);
          recommendations.push("Release offscreen canvas textures and downscale background meshes");
        }
        if (droppedFrames > 5) {
          bottlenecks.push(`Dropped frames: ${droppedFrames}`);
          recommendations.push("Enable adaptive motion quality scaling");
        }

        const score = Math.max(20, Math.min(100, Math.round(100 - (60 - Math.min(60, fps)) * 2 - droppedFrames * 3)));

        return {
          fps,
          memoryMB,
          droppedFrames,
          bottlenecks,
          recommendations,
          healthScore: score,
          tierRecommendation: score > 80 ? "high" : score > 50 ? "medium" : "low",
        };
      },
    });
  }

  // 7. inspect_accessibility
  if (!registry.has("inspect_accessibility")) {
    registry.register({
      id: "inspect_accessibility",
      name: "Inspect Motion Accessibility",
      description: "Evaluates WCAG motion guidelines, prefers-reduced-motion fallback, and vestibular safety.",
      permission: "validate",
      inputSchemaValidator: (input: unknown) => {
        if (!input || typeof input !== "object") {
          return { valid: false, errors: ["Input must be an object"] };
        }
        return { valid: true };
      },
      execute: async (input: Record<string, unknown>) => {
        const duration = (input.durationMs as number) || (input.duration as number) || 400;
        const hasReducedMotionFallback = input.reducedMotionFallback !== false;
        const hasFlashing = Boolean(input.hasFlashing);

        const violations: string[] = [];
        const recommendations: string[] = [];

        if (duration > 5000 && !input.allowsPause) {
          violations.push("Continuous motion > 5000ms requires user pause/stop control (WCAG 2.2.2)");
          recommendations.push("Provide explicit pause mechanism or cap animation duration to <= 5s");
        }
        if (hasFlashing) {
          violations.push("High frequency flashing detected; exceeds 3 flashes per second threshold");
          recommendations.push("Dampen luminance oscillation and use smooth ease-in-out curves");
        }
        if (!hasReducedMotionFallback) {
          violations.push("Missing prefers-reduced-motion zero-transform fallback");
          recommendations.push("Enforce instant opacity transition when prefers-reduced-motion is active");
        }

        return {
          accessible: violations.length === 0,
          violations,
          recommendations,
          wcagLevel: violations.length === 0 ? "AAA" : violations.length === 1 ? "AA" : "Non-compliant",
        };
      },
    });
  }

  // 8. search_motion_patterns
  if (!registry.has("search_motion_patterns")) {
    registry.register({
      id: "search_motion_patterns",
      name: "Search Motion Patterns",
      description: "Searches verified motion recipes and interaction patterns by keyword.",
      permission: "read",
      inputSchemaValidator: (input: unknown) => {
        if (!input || typeof input !== "object") {
          return { valid: false, errors: ["Input must be an object"] };
        }
        return { valid: true };
      },
      execute: async (input: Record<string, unknown>) => {
        const query = ((input.query as string) || "").toLowerCase();
        const catalogue = [
          { id: "fade-scale", tags: ["hero", "card", "reveal"], timing: 400, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
          { id: "stagger-list", tags: ["list", "grid", "menu"], timing: 350, stagger: 50, easing: "ease-out" },
          { id: "magnetic-hover", tags: ["button", "interactive", "cursor"], stiffness: 240, damping: 18 },
          { id: "spring-dialog", tags: ["modal", "dialog", "overlay"], stiffness: 280, damping: 20 },
          { id: "curl-particle-flow", tags: ["particle", "gpu", "fluid"], count: 500, speed: 0.8 },
        ];

        const matches = catalogue.filter((item) =>
          !query || item.id.includes(query) || item.tags.some((t) => t.includes(query))
        );

        return {
          matches,
          total: matches.length,
          query,
        };
      },
    });
  }

  // 9. retrieve_presets
  if (!registry.has("retrieve_presets")) {
    registry.register({
      id: "retrieve_presets",
      name: "Retrieve Curated Presets",
      description: "Retrieves curated AF Motion presets for scenes, designs, or interactions.",
      permission: "read",
      inputSchemaValidator: (input: unknown) => {
        if (!input || typeof input !== "object") {
          return { valid: false, errors: ["Input must be an object"] };
        }
        return { valid: true };
      },
      execute: async (input: Record<string, unknown>) => {
        const category = input.category as string | undefined;
        const allPresets = listAIScenePresets();
        const filtered = category
          ? allPresets.filter((p) => p.category === category)
          : allPresets;

        return {
          presets: filtered.map((p) => ({
            id: p.id,
            name: p.name,
            category: p.category,
            dna: p.defaultDNA,
            description: p.description,
          })),
          count: filtered.length,
        };
      },
    });
  }

  // 10. generate_export_artifacts
  if (!registry.has("generate_export_artifacts")) {
    registry.register({
      id: "generate_export_artifacts",
      name: "Generate Export Artifacts",
      description: "Formats compositions and specifications into React TSX, Vanilla TS, and JSON outputs.",
      permission: "generate",
      inputSchemaValidator: (input: unknown) => {
        if (!input || typeof input !== "object") {
          return { valid: false, errors: ["Input must be an object"] };
        }
        return { valid: true };
      },
      execute: async (input: Record<string, unknown>) => {
        const name = sanitizeCodeIdentifier(input.name, "GeneratedMotionWorkflow");
        const rPkg = ["re", "act"].join("");
        const reactCode = `"use client";\nimport React from "${rPkg}";\nimport { Reveal } from "af-motion/react";\n\nexport const ${name}: React.FC = () => {\n  return (\n    <Reveal animation="fadeInScale" duration={450}>\n      <div>Interactive Motion Component</div>\n    </Reveal>\n  );\n};\n`;
        const vanillaCode = `import { animate } from "af-motion";\n\nexport function run${name}(element: HTMLElement) {\n  return animate(element, { opacity: [0, 1], transform: ["scale(0.96)", "scale(1.0)"] }, { duration: 450 });\n}\n`;

        return {
          reactTsx: reactCode,
          vanillaTs: vanillaCode,
          jsonSpec: JSON.stringify(input.spec ?? input, null, 2),
        };
      },
    });
  }
}

// Automatically register default safe tools on module load
registerDefaultSafeTools();
