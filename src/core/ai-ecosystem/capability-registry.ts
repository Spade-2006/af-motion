/**
 * AF Motion — Unified AI Capability Registry (Phase 18, Prompt 146)
 *
 * Provides a consolidated, queryable catalog of all AI capabilities across
 * Phase 18 (Prompts 141–145), connecting intelligence, generation, workflows,
 * and orchestration without duplicating lower-level registries.
 */

import type {
  AICapabilityCategory,
  AICapabilityDescriptor,
  AICapabilityId,
} from "./types.js";

export const UNIFIED_AI_CAPABILITIES: readonly AICapabilityDescriptor[] = Object.freeze([
  // 1. Motion Analysis
  {
    id: "motion-analysis",
    name: "AI Motion Analysis",
    description: "Evaluates animation configuration properties, spring stiffness, damping ratios, and easing curves.",
    version: "1.0.0",
    category: "analysis",
    inputSchema: { type: "object", properties: { configuration: { type: "object" }, intent: { type: "string" } } },
    outputSchema: { type: "object", properties: { scores: { type: "object" }, grade: { type: "string" } } },
    requiredDependencies: ["src/core/ai-motion-intelligence"],
    executionMode: "both",
    supportedProviders: ["deterministic-local"],
  },
  // 2. Quality Evaluation
  {
    id: "quality-evaluation",
    name: "Motion Quality Scoring",
    description: "Computes multi-dimensional aesthetic, responsiveness, smoothness, and naturalness scores (0–100).",
    version: "1.0.0",
    category: "intelligence",
    inputSchema: { type: "object", properties: { configuration: { type: "object" } } },
    outputSchema: { type: "object", properties: { overallScore: { type: "number" }, findings: { type: "array" } } },
    requiredDependencies: ["src/core/ai-motion-intelligence"],
    executionMode: "sync",
    supportedProviders: ["deterministic-local"],
  },
  // 3. Motion Recommendations
  {
    id: "motion-recommendations",
    name: "Intelligent Motion Recommendations",
    description: "Generates actionable, evidence-based suggestions to optimize visual appeal and performance.",
    version: "1.0.0",
    category: "intelligence",
    inputSchema: { type: "object", properties: { findings: { type: "array" } } },
    outputSchema: { type: "array", items: { type: "object" } },
    requiredDependencies: ["src/core/ai-motion-intelligence"],
    executionMode: "sync",
    supportedProviders: ["deterministic-local"],
  },
  // 4. Design-to-Motion Generation
  {
    id: "design-to-motion-generation",
    name: "AI Design-to-Motion Generation",
    description: "Transforms visual design briefs and structured token specs into production-ready animation compositions with Motion DNA.",
    version: "1.0.0",
    category: "generation",
    inputSchema: { type: "object", properties: { prompt: { type: "string" }, dna: { type: "string" }, paletteId: { type: "string" } } },
    outputSchema: { type: "object", properties: { composition: { type: "object" }, plan: { type: "object" }, validation: { type: "object" } } },
    requiredDependencies: ["src/core/design-to-motion"],
    executionMode: "async",
    supportedProviders: ["deterministic-local"],
  },
  // 5. Scene Generation
  {
    id: "scene-generation",
    name: "AI Scene & Animation Generation",
    description: "Generates multi-system 3D, physics, particle, and DOM scenes from natural-language descriptions.",
    version: "1.0.0",
    category: "generation",
    inputSchema: { type: "object", properties: { prompt: { type: "string" }, category: { type: "string" } } },
    outputSchema: { type: "object", properties: { composition: { type: "object" }, scene3dSpec: { type: "object" }, plan: { type: "object" } } },
    requiredDependencies: ["src/core/scene-generation"],
    executionMode: "async",
    supportedProviders: ["deterministic-local"],
  },
  // 6. Performance Analysis
  {
    id: "performance-analysis",
    name: "Performance & Bottleneck Telemetry",
    description: "Analyzes runtime framerates, memory footprint, dropped frames, and suggests adaptive quality scaling.",
    version: "1.0.0",
    category: "analysis",
    inputSchema: { type: "object", properties: { fps: { type: "number" }, memoryMB: { type: "number" }, droppedFrames: { type: "number" } } },
    outputSchema: { type: "object", properties: { healthScore: { type: "number" }, bottlenecks: { type: "array" }, recommendations: { type: "array" } } },
    requiredDependencies: ["src/core/performance-intelligence", "src/core/agent-workflows"],
    executionMode: "async",
    supportedProviders: ["deterministic-local"],
  },
  // 7. Accessibility Analysis
  {
    id: "accessibility-analysis",
    name: "WCAG Motion Accessibility Audit",
    description: "Evaluates WCAG 2.2.2 motion guidelines, verifies prefers-reduced-motion fallbacks, and detects vestibular triggers.",
    version: "1.0.0",
    category: "analysis",
    inputSchema: { type: "object", properties: { durationMs: { type: "number" }, allowsPause: { type: "boolean" }, reducedMotionFallback: { type: "boolean" } } },
    outputSchema: { type: "object", properties: { accessible: { type: "boolean" }, violations: { type: "array" }, recommendations: { type: "array" } } },
    requiredDependencies: ["src/core/agent-workflows"],
    executionMode: "async",
    supportedProviders: ["deterministic-local"],
  },
  // 8. Composition Validation
  {
    id: "composition-validation",
    name: "Composition Graph Validation",
    description: "Verifies track timing synchronizations, parent-child hierarchies, and guarantees DAG acyclicity.",
    version: "1.0.0",
    category: "analysis",
    inputSchema: { type: "object", properties: { composition: { type: "object" } } },
    outputSchema: { type: "object", properties: { valid: { type: "boolean" }, issues: { type: "array" } } },
    requiredDependencies: ["src/core/composition", "src/core/agent-workflows"],
    executionMode: "async",
    supportedProviders: ["deterministic-local"],
  },
  // 9. Agent Workflows
  {
    id: "agent-workflows",
    name: "Intelligent Agent Workflows",
    description: "Executes goal-driven multi-step tasks using specialized agents, safe tool registry, and human approval boundaries.",
    version: "1.0.0",
    category: "orchestration",
    inputSchema: { type: "object", properties: { goal: { type: "string" }, templateId: { type: "string" } } },
    outputSchema: { type: "object", properties: { status: { type: "string" }, outputs: { type: "object" }, telemetry: { type: "object" } } },
    requiredDependencies: ["src/core/agent-workflows"],
    executionMode: "async",
    supportedProviders: ["deterministic-local"],
  },
  // 10. Multi-Agent Orchestration
  {
    id: "multi-agent-orchestration",
    name: "Multi-Agent Collaboration & Orchestration",
    description: "Coordinates multi-agent squads across parallel waves, message buses, conflict resolvers, and quality gates.",
    version: "1.0.0",
    category: "orchestration",
    inputSchema: { type: "object", properties: { goal: { type: "string" }, strategy: { type: "string" } } },
    outputSchema: { type: "object", properties: { status: { type: "string" }, artifacts: { type: "object" }, qualityValidation: { type: "object" } } },
    requiredDependencies: ["src/core/agent-workflows"],
    executionMode: "async",
    supportedProviders: ["deterministic-local"],
  },
  // 11. Conflict Resolution
  {
    id: "conflict-resolution",
    name: "Deterministic Conflict Resolution",
    description: "Detects and reconciles accessibility vs aesthetic and performance vs quality conflicts with rule-based precedence.",
    version: "1.0.0",
    category: "orchestration",
    inputSchema: { type: "object", properties: { agentOutputs: { type: "array" } } },
    outputSchema: { type: "array", items: { type: "object" } },
    requiredDependencies: ["src/core/agent-workflows"],
    executionMode: "sync",
    supportedProviders: ["deterministic-local"],
  },
  // 12. Export Generation
  {
    id: "export-generation",
    name: "Multi-Target Code & Spec Export",
    description: "Formats AI compositions and deliverables into React TSX, Vanilla TS, Scene 3D JSON, and Composition JSON.",
    version: "1.0.0",
    category: "export",
    inputSchema: { type: "object", properties: { name: { type: "string" }, spec: { type: "object" } } },
    outputSchema: { type: "object", properties: { reactTsx: { type: "string" }, vanillaTs: { type: "string" }, jsonSpec: { type: "string" } } },
    requiredDependencies: ["src/core/design-to-motion", "src/core/scene-generation"],
    executionMode: "async",
    supportedProviders: ["deterministic-local"],
  },
]);

export class AIEcosystemCapabilityRegistry {
  private readonly capabilities = new Map<AICapabilityId, AICapabilityDescriptor>();

  constructor() {
    for (const cap of UNIFIED_AI_CAPABILITIES) {
      this.capabilities.set(cap.id, cap);
    }
  }

  public list(): AICapabilityDescriptor[] {
    return Array.from(this.capabilities.values());
  }

  public get(id: AICapabilityId): AICapabilityDescriptor | undefined {
    return this.capabilities.get(id);
  }

  public has(id: AICapabilityId): boolean {
    return this.capabilities.has(id);
  }

  public findByCategory(category: AICapabilityCategory): AICapabilityDescriptor[] {
    return Array.from(this.capabilities.values()).filter((c) => c.category === category);
  }

  public query(term: string): AICapabilityDescriptor[] {
    const q = term.toLowerCase().trim();
    if (!q) return this.list();
    return Array.from(this.capabilities.values()).filter(
      (c) =>
        c.id.includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
    );
  }

  public get size(): number {
    return this.capabilities.size;
  }
}

export const aiEcosystemCapabilityRegistry = new AIEcosystemCapabilityRegistry();

export function listAICapabilities(): AICapabilityDescriptor[] {
  return aiEcosystemCapabilityRegistry.list();
}

export function getAICapability(id: AICapabilityId): AICapabilityDescriptor | undefined {
  return aiEcosystemCapabilityRegistry.get(id);
}

export function queryAICapabilities(term: string): AICapabilityDescriptor[] {
  return aiEcosystemCapabilityRegistry.query(term);
}
