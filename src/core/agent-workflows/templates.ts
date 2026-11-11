/**
 * AF Motion — Workflow Templates (Phase 18, Prompt 144)
 *
 * Implements 5 reusable, structured agent workflow templates:
 * 1. Motion Quality Audit
 * 2. Design-to-Animation
 * 3. Complete Scene Creation
 * 4. Performance Optimization
 * 5. Accessibility Audit
 */

import type { TaskPlan, WorkflowTemplate } from "./types.js";

function makeWfId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export const WORKFLOW_TEMPLATES: Record<string, WorkflowTemplate> = {
  // 1. Motion Quality Audit
  "motion-quality-audit": {
    id: "motion-quality-audit",
    name: "Motion Quality Audit",
    description: "Evaluates animation aesthetics, timing curves, accessibility compliance, and performance telemetry to compile an actionable quality report.",
    category: "motion-intelligence",
    defaultGoal: "Audit motion configuration for visual appeal, WCAG compliance, and runtime smoothness.",
    estimatedDurationMs: 1200,
    createPlan: (goal, initialInputs = {}): TaskPlan => {
      const motionConfig = initialInputs.motionConfig || {
        duration: 450,
        easing: "cubic-bezier(0.16, 1, 0.3, 1)",
        elements: ["hero-card", "call-to-action"],
      };

      return {
        workflowId: makeWfId("wf-audit"),
        goal,
        createdAt: Date.now(),
        estimatedDurationMs: 1200,
        tasks: [
          {
            id: "task-motion-analysis",
            description: "Analyze motion curves, spring dynamics, and calculate visual quality score.",
            assignedAgentId: "agent-motion-intelligence",
            inputs: { ...motionConfig, intent: goal },
            expectedOutput: "motion-quality-report",
            dependencies: [],
            priority: 10,
            status: "pending",
          },
          {
            id: "task-a11y-check",
            description: "Evaluate WCAG 2.2.2 motion compliance and verify prefers-reduced-motion fallback.",
            assignedAgentId: "agent-accessibility",
            inputs: { ...motionConfig, allowsPause: true },
            expectedOutput: "accessibility-report",
            dependencies: [],
            priority: 8,
            status: "pending",
          },
          {
            id: "task-perf-check",
            description: "Inspect performance metrics and estimate GPU overhead.",
            assignedAgentId: "agent-performance-optimization",
            inputs: { fps: 60, memoryMB: 40, droppedFrames: 0 },
            expectedOutput: "optimization-report",
            dependencies: [],
            priority: 6,
            status: "pending",
          },
          {
            id: "task-composition-validation",
            description: "Validate composition structure and timing synchronization across tracks.",
            assignedAgentId: "agent-composition",
            inputs: { composition: motionConfig },
            expectedOutput: "composition-validation-report",
            dependencies: ["task-motion-analysis"],
            priority: 4,
            status: "pending",
          },
        ],
      };
    },
  },

  // 2. Design-to-Animation
  "design-to-animation": {
    id: "design-to-animation",
    name: "Design-to-Animation",
    description: "Transforms visual design briefs and structured tokens into coordinated motion choreographies with Motion DNA.",
    category: "design-to-motion",
    defaultGoal: "Generate production-ready motion choreography from design layout and style tokens.",
    estimatedDurationMs: 1500,
    createPlan: (goal, initialInputs = {}): TaskPlan => {
      const designInput = initialInputs.design || {
        prompt: goal,
        dna: "precise",
        paletteId: "modern-minimal",
        elementCount: 3,
      };

      return {
        workflowId: makeWfId("wf-d2m"),
        goal,
        createdAt: Date.now(),
        estimatedDurationMs: 1500,
        tasks: [
          {
            id: "task-generate-motion",
            description: "Interpret design specifications and generate animation composition with Motion DNA.",
            assignedAgentId: "agent-design-to-motion",
            inputs: { ...designInput },
            expectedOutput: "generated-animation",
            dependencies: [],
            priority: 10,
            status: "pending",
          },
          {
            id: "task-validate-a11y",
            description: "Verify accessibility compliance and reduced-motion fallbacks for generated choreography.",
            assignedAgentId: "agent-accessibility",
            inputs: { durationMs: 450, reducedMotionFallback: true },
            expectedOutput: "accessibility-report",
            dependencies: ["task-generate-motion"],
            priority: 8,
            status: "pending",
          },
          {
            id: "task-validate-graph",
            description: "Validate composition graph acyclicity, track timing, and element staging.",
            assignedAgentId: "agent-composition",
            inputs: { nodes: [{ id: "root" }], tracks: [{ id: "t1" }] },
            expectedOutput: "composition-validation-report",
            dependencies: ["task-generate-motion"],
            priority: 6,
            status: "pending",
          },
          {
            id: "task-evaluate-quality",
            description: "Audit final motion quality and score generated choreography aesthetic appeal.",
            assignedAgentId: "agent-motion-intelligence",
            inputs: { intent: goal, timing: 450 },
            expectedOutput: "motion-quality-report",
            dependencies: ["task-generate-motion"],
            priority: 4,
            status: "pending",
          },
        ],
      };
    },
  },

  // 3. Complete Scene Creation
  "complete-scene-creation": {
    id: "complete-scene-creation",
    name: "Complete Scene Creation",
    description: "Generates multi-system 3D, physics, particle, and DOM scenes from natural-language descriptions with quality validation.",
    category: "scene-generation",
    defaultGoal: "Build a complete multi-system interactive hero scene with 3D elements and background particle fields.",
    estimatedDurationMs: 2000,
    createPlan: (goal, initialInputs = {}): TaskPlan => {
      const sceneInput = initialInputs.scene || {
        prompt: goal,
        category: "hero",
        motionDNA: "playful",
        systems: { dom: true, scene3d: true, particles: true, physics: false },
      };

      return {
        workflowId: makeWfId("wf-scene"),
        goal,
        createdAt: Date.now(),
        estimatedDurationMs: 2000,
        tasks: [
          {
            id: "task-generate-scene",
            description: "Orchestrate spatial layout, camera framing, lighting, particle fields, and DOM cards.",
            assignedAgentId: "agent-scene-generation",
            inputs: { ...sceneInput },
            expectedOutput: "generated-scene",
            dependencies: [],
            priority: 10,
            status: "pending",
          },
          {
            id: "task-scene-quality-audit",
            description: "Audit scene animation curves and score visual aesthetic balance.",
            assignedAgentId: "agent-motion-intelligence",
            inputs: { intent: goal },
            expectedOutput: "motion-quality-report",
            dependencies: ["task-generate-scene"],
            priority: 8,
            status: "pending",
          },
          {
            id: "task-scene-perf-eval",
            description: "Estimate particle rendering load, shadow passes, and recommend tier adjustments.",
            assignedAgentId: "agent-performance-optimization",
            inputs: { fps: 60, memoryMB: 65, droppedFrames: 0 },
            expectedOutput: "optimization-report",
            dependencies: ["task-generate-scene"],
            priority: 6,
            status: "pending",
          },
          {
            id: "task-scene-composition-validate",
            description: "Verify multi-system composition synchronization and cross-track alignment.",
            assignedAgentId: "agent-composition",
            inputs: { nodes: [{ id: "scene-root" }], tracks: [{ id: "camera-track" }] },
            expectedOutput: "composition-validation-report",
            dependencies: ["task-generate-scene"],
            priority: 4,
            status: "pending",
          },
        ],
      };
    },
  },

  // 4. Performance Optimization
  "performance-optimization": {
    id: "performance-optimization",
    name: "Performance Optimization",
    description: "Inspects runtime performance telemetry, isolates framerate bottlenecks, and creates an optimization plan.",
    category: "performance",
    defaultGoal: "Diagnose rendering bottlenecks and apply adaptive quality optimizations.",
    estimatedDurationMs: 900,
    createPlan: (goal, initialInputs = {}): TaskPlan => {
      const telemetry = initialInputs.telemetry || {
        fps: 48,
        memoryMB: 95,
        droppedFrames: 6,
      };

      return {
        workflowId: makeWfId("wf-perf"),
        goal,
        createdAt: Date.now(),
        estimatedDurationMs: 900,
        tasks: [
          {
            id: "task-inspect-telemetry",
            description: "Diagnose FPS drops, memory footprint, and isolate hardware bottlenecks.",
            assignedAgentId: "agent-performance-optimization",
            inputs: { ...telemetry },
            expectedOutput: "optimization-report",
            dependencies: [],
            priority: 10,
            status: "pending",
          },
          {
            id: "task-composition-culling",
            description: "Evaluate composition tracks and recommend offscreen culling or track trimming.",
            assignedAgentId: "agent-composition",
            inputs: { composition: telemetry },
            expectedOutput: "composition-validation-report",
            dependencies: ["task-inspect-telemetry"],
            priority: 8,
            status: "pending",
          },
          {
            id: "task-motion-simplification",
            description: "Recommend duration and spring damping adjustments to reduce CPU calculations.",
            assignedAgentId: "agent-motion-intelligence",
            inputs: { intent: "optimize rendering performance" },
            expectedOutput: "motion-quality-report",
            dependencies: ["task-inspect-telemetry"],
            priority: 6,
            status: "pending",
          },
        ],
      };
    },
  },

  // 5. Accessibility Audit
  "accessibility-audit": {
    id: "accessibility-audit",
    name: "Accessibility Audit",
    description: "Evaluates WCAG motion criteria, checks reduced-motion fallback implementations, and suggests vestibular-safe alternatives.",
    category: "accessibility",
    defaultGoal: "Verify WCAG 2.2.2 motion compliance and implement accessible fallback behaviors.",
    estimatedDurationMs: 900,
    createPlan: (goal, initialInputs = {}): TaskPlan => {
      const motionConfig = initialInputs.motionConfig || {
        durationMs: 6500,
        allowsPause: false,
        reducedMotionFallback: true,
      };

      return {
        workflowId: makeWfId("wf-a11y"),
        goal,
        createdAt: Date.now(),
        estimatedDurationMs: 900,
        tasks: [
          {
            id: "task-audit-a11y-rules",
            description: "Inspect motion durations, flashing triggers, and verify prefers-reduced-motion compatibility.",
            assignedAgentId: "agent-accessibility",
            inputs: { ...motionConfig },
            expectedOutput: "accessibility-report",
            dependencies: [],
            priority: 10,
            status: "pending",
          },
          {
            id: "task-evaluate-curves",
            description: "Analyze motion curves for excessive velocity shifts or vestibular triggers.",
            assignedAgentId: "agent-motion-intelligence",
            inputs: { ...motionConfig },
            expectedOutput: "motion-quality-report",
            dependencies: ["task-audit-a11y-rules"],
            priority: 8,
            status: "pending",
          },
          {
            id: "task-verify-safe-composition",
            description: "Verify that composition gracefully degrades to zero-transform when reduced motion is requested.",
            assignedAgentId: "agent-composition",
            inputs: { composition: motionConfig },
            expectedOutput: "composition-validation-report",
            dependencies: ["task-audit-a11y-rules"],
            priority: 6,
            status: "pending",
          },
        ],
      };
    },
  },
};

export function listWorkflowTemplates(): WorkflowTemplate[] {
  return Object.values(WORKFLOW_TEMPLATES);
}

export function getWorkflowTemplate(id: string): WorkflowTemplate | undefined {
  return WORKFLOW_TEMPLATES[id];
}
