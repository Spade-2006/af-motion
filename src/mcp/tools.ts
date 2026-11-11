/**
 * AF Motion MCP Tools
 *
 * Implements standard MCP tools allowing external AI agents to discover,
 * inspect, generate, validate, and optimize AF Motion capabilities.
 */

import {
  aiMotionRegistry,
  visualStyleRegistry,
  BUILT_IN_MOTION_DNA,
  interpretMotionPrompt,
  recommendAnimation,
  createEntranceTransition,
  createExitTransition,
  createPageTransition,
  generateScrollPlan,
  generateMicrointeractionPlan,
  generateChoreographyPlan,
  generate3DSceneFromIntent,
  validateMotionConfig,
  optimizeMotion,
  correctConfiguration,
  interpretVisualReference,
  generateReactImplementationPlan,
  generateReactSpecification,
  type VisualReferenceInput,
  type ReactImplementationPlan,
  type ReactCodeSpecification,
} from "../catalogue.js";

import type { MCPTool, MCPToolResult } from "./types.js";
import { isPlainObject, sanitizeExternalErrorMessage } from "../core/utils/safe-json.js";

function jsonResult(data: unknown): MCPToolResult {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

function errorResult(message: string): MCPToolResult {
  return {
    isError: true,
    content: [
      {
        type: "text",
        text: JSON.stringify({ error: message }, null, 2),
      },
    ],
  };
}

export const MCP_TOOLS: readonly MCPTool[] = [
  {
    name: "discover_capabilities",
    description: "Discover all available AF Motion capabilities with metadata, tags, and categories.",
    inputSchema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          description: "Optional capability category filter (e.g. 'core', 'effect', 'background', 'scroll', 'interactive', 'choreography', 'optimization').",
        },
      },
    },
  },
  {
    name: "search_capabilities",
    description: "Search AF Motion capabilities by keyword, query phrase, or component intent.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Keyword or phrase to search capabilities by (e.g. 'parallax', 'glass', 'magnetic', '3d').",
        },
        category: {
          type: "string",
          description: "Optional category filter.",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "get_capability_details",
    description: "Retrieve complete specification, parameters, code signature, and options for a capability ID.",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "The unique ID of the capability (e.g. 'animate', 'scroll-intelligence', 'microinteractions').",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "list_visual_styles",
    description: "List all 19 supported AF Motion visual styles (e.g. brutalist, editorial, skeuomorphic, glassmorphic).",
    inputSchema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          description: "Optional style category filter.",
        },
      },
    },
  },
  {
    name: "list_motion_dna",
    description: "List all built-in Motion DNA personality profiles (e.g. snappy, calm, cinematic, editorial-flow).",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "interpret_motion_prompt",
    description: "Interpret a natural-language motion request into structured intent, visual style, and component targets.",
    inputSchema: {
      type: "object",
      properties: {
        prompt: {
          type: "string",
          description: "Natural-language description of desired animation or visual behavior.",
        },
      },
      required: ["prompt"],
    },
  },
  {
    name: "generate_animation",
    description: "Generate an intelligent, component-aware animation recommendation and plan.",
    inputSchema: {
      type: "object",
      properties: {
        componentType: {
          type: "string",
          description: "Component category (e.g. 'button', 'card', 'navigation', 'modal', 'typography').",
        },
        intent: {
          type: "string",
          description: "Interaction intent (e.g. 'attention', 'feedback', 'navigation', 'disclosure').",
        },
        visualStyle: {
          type: "string",
          description: "Visual style treatment name.",
        },
        motionDNA: {
          type: "string",
          description: "Motion DNA personality name.",
        },
      },
      required: ["componentType"],
    },
  },
  {
    name: "generate_transition",
    description: "Generate an entrance, exit, or page transition definition.",
    inputSchema: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["entrance", "exit", "page"],
          description: "Transition type.",
        },
        pattern: {
          type: "string",
          description: "Pattern name ('fade', 'slide', 'scale', 'reveal', 'blur', 'shared-element', etc.).",
        },
        direction: {
          type: "string",
          description: "Direction ('up', 'down', 'left', 'right', 'in', 'out').",
        },
        duration: {
          type: "number",
          description: "Duration in milliseconds.",
        },
      },
      required: ["type"],
    },
  },
  {
    name: "generate_scroll_animation",
    description: "Generate an intelligent scroll-driven animation plan.",
    inputSchema: {
      type: "object",
      properties: {
        type: {
          type: "string",
          description: "Scroll animation type ('reveal', 'parallax', 'sticky-story', 'progress-indicator', 'scroll-3d-sync').",
        },
        progressMode: {
          type: "string",
          enum: ["viewport", "element", "container"],
          description: "Calculation mode.",
        },
        startOffset: {
          type: "string",
          description: "Scroll start trigger (e.g. 'top bottom', 'center center').",
        },
        endOffset: {
          type: "string",
          description: "Scroll end trigger (e.g. 'bottom top', 'center center').",
        },
        reducedMotion: {
          type: "boolean",
          description: "Enforce reduced-motion safe fallback.",
        },
      },
    },
  },
  {
    name: "generate_microinteraction",
    description: "Generate tactile microinteraction plans for buttons, cards, inputs, and controls.",
    inputSchema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          description: "Control category (e.g. 'button', 'card', 'input', 'toggle', 'accordion', 'toast').",
        },
        toState: {
          type: "string",
          description: "Target interaction state ('hover', 'press', 'focus', 'active', 'success', 'error').",
        },
        visualStyle: {
          type: "string",
          description: "Visual style name.",
        },
        motionDNA: {
          type: "string",
          description: "Motion DNA personality name.",
        },
        reducedMotion: {
          type: "boolean",
          description: "Enforce reduced-motion safe fallback.",
        },
      },
      required: ["category"],
    },
  },
  {
    name: "generate_choreography",
    description: "Generate synchronized cross-system choreography across DOM, Graphics, and 3D scenes.",
    inputSchema: {
      type: "object",
      properties: {
        pattern: {
          type: "string",
          description: "Pattern name ('multi-element-entrance', 'dom-3d-sync', 'dom-graphics-sync', 'full-cross-system', 'staggered', 'sequential').",
        },
        duration: {
          type: "number",
          description: "Total choreography duration in milliseconds.",
        },
        visualStyle: {
          type: "string",
          description: "Visual style name.",
        },
        motionDNA: {
          type: "string",
          description: "Motion DNA personality name.",
        },
        reducedMotion: {
          type: "boolean",
          description: "Enforce reduced-motion safe fallback.",
        },
      },
    },
  },
  {
    name: "generate_3d_scene",
    description: "Generate a validated 3D scene definition with cameras, lighting, and objects.",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Scene name.",
        },
        camera: {
          type: "object",
          description: "Camera configuration.",
        },
        lighting: {
          type: "array",
          description: "Lighting array.",
        },
      },
    },
  },
  {
    name: "validate_motion",
    description: "Validate a motion configuration for layout thrashing, seizure hazards (WCAG 2.3.1), and reduced-motion compliance.",
    inputSchema: {
      type: "object",
      properties: {
        config: {
          type: "object",
          description: "Motion configuration, transition, or plan to validate.",
        },
      },
      required: ["config"],
    },
  },
  {
    name: "optimize_motion",
    description: "Optimize a motion configuration with GPU transforms, filter dampening, and accessibility fallbacks.",
    inputSchema: {
      type: "object",
      properties: {
        config: {
          type: "object",
          description: "Motion configuration to optimize.",
        },
        level: {
          type: "string",
          enum: ["safe", "balanced", "aggressive"],
          description: "Optimization safety level (default: 'safe').",
        },
      },
      required: ["config"],
    },
  },
  {
    name: "correct_configuration",
    description: "Automatically correct out-of-range or invalid parameters for a registered capability.",
    inputSchema: {
      type: "object",
      properties: {
        capabilityId: {
          type: "string",
          description: "Target capability ID.",
        },
        configuration: {
          type: "object",
          description: "Configuration parameters to correct.",
        },
      },
      required: ["capabilityId", "configuration"],
    },
  },
  {
    name: "analyze_visual_reference",
    description: "Analyze structured visual reference data, classify visual style (19 styles), match palette (33 built-in), and report confidence and uncertainties.",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name or title of visual reference",
        },
        description: {
          type: "string",
          description: "Optional visual description or prompt",
        },
        extractedProperties: {
          type: "object",
          description: "Extracted visual properties (colors, typography, surfaces, layout, motion, graphics, scene3D)",
        },
        components: {
          type: "array",
          description: "Array of extracted component representations",
        },
        targetPlatform: {
          type: "string",
          enum: ["web", "mobile", "responsive"],
          description: "Target platform",
        },
      },
    },
  },
  {
    name: "map_reference_to_style",
    description: "Map visual reference properties deterministically to visual style, color palette, Motion DNA, and design tokens.",
    inputSchema: {
      type: "object",
      properties: {
        reference: {
          type: "object",
          description: "Structured visual reference input object",
        },
      },
    },
  },
  {
    name: "generate_react_plan",
    description: "Generate an end-to-end React implementation plan with component hierarchy, responsive strategy, and minimal motion bindings.",
    inputSchema: {
      type: "object",
      properties: {
        reference: {
          type: "object",
          description: "Structured visual reference input object",
        },
        interpretation: {
          type: "object",
          description: "Pre-computed visual design interpretation object",
        },
      },
    },
  },
  {
    name: "get_implementation_imports",
    description: "Retrieve all required AF Motion package imports partitioned by official subpaths for a reference plan or specification.",
    inputSchema: {
      type: "object",
      properties: {
        plan: {
          type: "object",
          description: "React implementation plan",
        },
        reference: {
          type: "object",
          description: "Visual reference input (if plan is not provided)",
        },
      },
    },
  },
  {
    name: "validate_implementation_spec",
    description: "Validate a React implementation plan or specification for strict accessibility, GPU compositing safety, and package import hygiene.",
    inputSchema: {
      type: "object",
      properties: {
        plan: {
          type: "object",
          description: "React implementation plan to validate",
        },
        spec: {
          type: "object",
          description: "React code specification to validate",
        },
      },
    },
  },
];

export async function executeMCPTool(
  name: string,
  args: Record<string, any> = {}
): Promise<MCPToolResult> {
  if (typeof name !== "string" || !name.trim()) {
    return errorResult("Tool name must be a non-empty string");
  }
  if (!isPlainObject(args as unknown)) {
    return errorResult("Tool arguments must be a plain object");
  }
  if (args.duration !== undefined && (typeof args.duration !== "number" || !Number.isFinite(args.duration) || args.duration < 0)) {
    return errorResult("Invalid numeric parameter 'duration': must be a finite number >= 0");
  }
  try {
    switch (name) {
      case "discover_capabilities": {
        const caps = aiMotionRegistry.listCapabilities({ category: args.category });
        const categories = aiMotionRegistry.getCategories();
        return jsonResult({
          count: caps.length,
          categories,
          capabilities: caps.map((c) => ({
            id: c.id,
            name: c.name,
            category: c.category,
            version: c.version,
            description: c.description,
            tags: c.tags,
            reducedMotion: c.reducedMotion,
          })),
        });
      }

      case "search_capabilities": {
        if (!args.query) return errorResult("Missing required parameter 'query'");
        const results = aiMotionRegistry.searchCapabilities({
          term: String(args.query),
          category: args.category,
        });
        return jsonResult({
          query: args.query,
          count: results.length,
          results,
        });
      }

      case "get_capability_details": {
        const id = String(args.id || args.capabilityId || "");
        if (!id) return errorResult("Missing required parameter 'id' or 'capabilityId'");
        let cap = aiMotionRegistry.getCapability(id);
        if (!cap) {
          const all = aiMotionRegistry.listCapabilities();
          cap = all.find((c) => c.name === id || c.id === id);
        }
        if (!cap) return jsonResult({ found: false, capability: null, id });
        return jsonResult({ found: true, capability: cap, ...cap });
      }

      case "list_visual_styles": {
        const styles = visualStyleRegistry.listVisualStyles();
        return jsonResult({
          count: styles.length,
          styles: styles.map((s) => ({
            id: s.id,
            name: s.name,
            category: s.category,
            description: s.description,
            tags: s.tags,
          })),
        });
      }

      case "list_motion_dna": {
        return jsonResult({
          count: Object.keys(BUILT_IN_MOTION_DNA).length,
          profiles: Object.values(BUILT_IN_MOTION_DNA),
          dna: BUILT_IN_MOTION_DNA,
        });
      }

      case "interpret_motion_prompt": {
        if (!args.prompt) return errorResult("Missing required parameter 'prompt'");
        const interpreted = interpretMotionPrompt(String(args.prompt));
        return jsonResult({
          prompt: args.prompt,
          interpretation: interpreted,
          ...interpreted,
        });
      }

      case "generate_animation": {
        if (!args.componentType) return errorResult("Missing required parameter 'componentType'");
        const plan = recommendAnimation({
          componentType: args.componentType,
          intent: args.intent,
          visualStyle: args.visualStyle,
          motionDNA: args.motionDNA,
        });
        return jsonResult(plan);
      }

      case "generate_transition": {
        const type = args.type ?? "entrance";
        if (type === "entrance") {
          return jsonResult(createEntranceTransition(args));
        } else if (type === "exit") {
          return jsonResult(createExitTransition(args));
        } else {
          return jsonResult(createPageTransition(args));
        }
      }

      case "generate_scroll_animation": {
        const plan = generateScrollPlan(args);
        return jsonResult(plan);
      }

      case "generate_microinteraction": {
        if (!args.category) return errorResult("Missing required parameter 'category'");
        const plan = generateMicrointeractionPlan(args);
        return jsonResult(plan);
      }

      case "generate_choreography": {
        const plan = generateChoreographyPlan(args);
        return jsonResult(plan);
      }

      case "generate_3d_scene": {
        const result = generate3DSceneFromIntent(args.prompt || args.description || args);
        return jsonResult({
          ...result,
          specification: result.spec,
        });
      }

      case "validate_motion": {
        if (!args.config) return errorResult("Missing required parameter 'config'");
        const report = validateMotionConfig(args.config);
        return jsonResult(report);
      }

      case "optimize_motion": {
        if (!args.config) return errorResult("Missing required parameter 'config'");
        const optimized = optimizeMotion(args.config, { level: args.level });
        return jsonResult(optimized);
      }

      case "correct_configuration": {
        if (!args.capabilityId || !args.configuration) {
          return errorResult("Missing required parameters 'capabilityId' or 'configuration'");
        }
        const corrected = correctConfiguration(String(args.capabilityId), args.configuration);
        return jsonResult(corrected);
      }

      case "analyze_visual_reference": {
        const input: VisualReferenceInput = {
          name: args.name || args.reference?.name || "Visual Reference",
          description: args.description || args.reference?.description,
          extractedProperties: args.extractedProperties || args.reference?.extractedProperties,
          components: args.components || args.reference?.components,
          targetPlatform: args.targetPlatform || args.reference?.targetPlatform || "responsive",
        };
        const interpretation = interpretVisualReference(input);
        return jsonResult(interpretation);
      }

      case "map_reference_to_style": {
        const ref = args.reference || args;
        const input: VisualReferenceInput = {
          name: ref.name || "Visual Reference",
          description: ref.description,
          extractedProperties: ref.extractedProperties,
          components: ref.components,
          targetPlatform: ref.targetPlatform || "responsive",
        };
        const interpretation = interpretVisualReference(input);
        return jsonResult({
          style: interpretation.styleClassification,
          palette: interpretation.paletteMapping,
          motionDNA: interpretation.motionDNA,
          tokens: interpretation.designTokens,
          confidence: interpretation.confidenceReport,
        });
      }

      case "generate_react_plan": {
        const target = args.interpretation || args.reference || args;
        const plan = generateReactImplementationPlan(target);
        return jsonResult(plan);
      }

      case "get_implementation_imports": {
        let plan = args.plan;
        if (!plan) {
          const target = args.reference || args;
          plan = generateReactImplementationPlan(target);
        }
        const spec = generateReactSpecification(plan);
        return jsonResult({
          requiredImports: spec.requiredImports,
          components: spec.components.map((c: any) => ({
            name: c.name,
            fileHint: c.fileHint,
            imports: c.afMotionImports,
          })),
        });
      }

      case "validate_implementation_spec": {
        const issues: string[] = [];
        const warnings: string[] = [];
        const plan = args.plan;
        const spec = args.spec;

        if (!plan && !spec) {
          return errorResult("At least one of 'plan' or 'spec' must be provided for validation");
        }

        const allowedSubpaths = new Set([
          "af-motion",
          "af-motion/react",
          "af-motion/catalogue",
          "af-motion/presets",
        ]);

        if (spec && Array.isArray(spec.requiredImports)) {
          for (const imp of spec.requiredImports) {
            if (!allowedSubpaths.has(imp.subpath)) {
              issues.push(`Forbidden or unknown subpath import: '${imp.subpath}'. Must use official subpaths.`);
            }
          }
        }

        if (plan && Array.isArray(plan.motionPlans)) {
          for (const m of plan.motionPlans) {
            if (!m.reducedMotionFallback) {
              warnings.push(`Motion item '${m.id}' does not define an explicit reducedMotionFallback.`);
            }
          }
        }

        return jsonResult({
          valid: issues.length === 0,
          issues,
          warnings,
          checklist: plan?.validationChecklist ?? [
            "Check prefers-reduced-motion fallback",
            "Animate only transform and opacity",
            "Verify official subpath imports",
          ],
        });
      }

      default:
        return errorResult(`Unknown tool: '${name}'`);
    }
  } catch (err) {
    return errorResult(sanitizeExternalErrorMessage(err, "MCP tool execution failed"));
  }
}
