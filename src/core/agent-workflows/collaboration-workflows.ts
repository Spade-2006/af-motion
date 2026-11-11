/**
 * AF Motion — Specialized Multi-Agent Collaboration Workflows (Phase 18, Prompt 145)
 *
 * Implements 4 practical multi-agent collaboration workflows:
 * 1. Complete Design-to-Motion Pipeline (Review-and-Refine)
 * 2. Complete Scene Creation (Hierarchical)
 * 3. Motion Optimization Team (Pipeline)
 * 4. Complete Creative Audit (Parallel)
 */

import type { CollaborationPlan } from "./orchestration-types.js";
import { collaborationPlanner, CollaborationPlanner } from "./collaboration-planner.js";

export const COLLABORATION_WORKFLOW_DEFINITIONS = {
  // 1. Complete Design-to-Motion Pipeline (Review-and-Refine)
  "complete-design-to-motion": {
    id: "complete-design-to-motion",
    name: "Design-to-Motion Collaboration Pipeline",
    description: "Design-to-Motion agent generates choreography while Motion Intelligence, Accessibility, and Composition agents review and refine.",
    strategy: "review-and-refine" as const,
    defaultGoal: "Transform design layout into validated motion choreography with Motion DNA and accessibility compliance.",
    estimatedDurationMs: 2200,
    createPlan: (goal: string, initialInputs: Record<string, unknown> = {}, planner: CollaborationPlanner = collaborationPlanner): CollaborationPlan => {
      const designInput = initialInputs.design || { prompt: goal, dna: "precise", paletteId: "modern-minimal" };

      return planner.createCollaborationPlan(
        goal,
        [
          {
            id: "d2m-generate",
            description: "Interpret design layout and generate initial motion choreography.",
            assignedAgentId: "agent-design-to-motion",
            requiredCapabilities: ["design-interpretation", "animation-generation"],
            inputReferences: {},
            inputs: { ...designInput },
            expectedOutput: "generated-animation",
            dependencies: [],
            priority: 10,
            artifactKey: "initial-choreography",
          },
          {
            id: "motion-review",
            description: "Review animation curves, spring dynamics, and score aesthetic quality.",
            assignedAgentId: "agent-motion-intelligence",
            requiredCapabilities: ["motion-analysis", "quality-scoring"],
            inputReferences: { motionConfig: "initial-choreography" },
            inputs: {},
            expectedOutput: "motion-quality-report",
            dependencies: ["d2m-generate"],
            priority: 8,
            artifactKey: "quality-review",
          },
          {
            id: "a11y-review",
            description: "Audit WCAG 2.2.2 compliance and ensure prefers-reduced-motion fallback.",
            assignedAgentId: "agent-accessibility",
            requiredCapabilities: ["accessibility-audit"],
            inputReferences: { motionConfig: "initial-choreography" },
            inputs: { durationMs: 450, reducedMotionFallback: true },
            expectedOutput: "accessibility-report",
            dependencies: ["d2m-generate"],
            priority: 8,
            artifactKey: "a11y-review",
          },
          {
            id: "composition-finalize",
            description: "Validate composition graph integrity and finalize multi-system synchronization.",
            assignedAgentId: "agent-composition",
            requiredCapabilities: ["composition-validation"],
            inputReferences: { composition: "initial-choreography" },
            inputs: { nodes: [{ id: "root" }], tracks: [{ id: "t1" }] },
            expectedOutput: "composition-validation-report",
            dependencies: ["motion-review", "a11y-review"],
            priority: 6,
            artifactKey: "final-composition",
          },
        ],
        {
          strategy: "review-and-refine",
          coordinatorAgentId: "agent-design-to-motion",
        }
      );
    },
  },

  // 2. Complete Scene Creation (Hierarchical)
  "complete-scene-creation": {
    id: "complete-scene-creation",
    name: "Complete Multi-System Scene Creation",
    description: "Hierarchical coordination: Scene Generation Agent delegates specialized reviews across motion, performance, accessibility, and composition.",
    strategy: "hierarchical" as const,
    defaultGoal: "Build an interactive 3D hero showcase with volumetric particles, physics boundaries, and accessible DOM elements.",
    estimatedDurationMs: 2500,
    createPlan: (goal: string, initialInputs: Record<string, unknown> = {}, planner: CollaborationPlanner = collaborationPlanner): CollaborationPlan => {
      const sceneInput = initialInputs.scene || { prompt: goal, category: "hero", motionDNA: "playful" };

      return planner.createCollaborationPlan(
        goal,
        [
          {
            id: "scene-generate-base",
            description: "Generate coordinated 3D, particle, and DOM scene structure.",
            assignedAgentId: "agent-scene-generation",
            requiredCapabilities: ["scene-understanding", "scene-generation"],
            inputReferences: {},
            inputs: { ...sceneInput },
            expectedOutput: "generated-scene",
            dependencies: [],
            priority: 10,
            artifactKey: "base-scene",
          },
          {
            id: "scene-motion-eval",
            description: "Audit camera paths and aesthetic motion pacing.",
            assignedAgentId: "agent-motion-intelligence",
            requiredCapabilities: ["motion-analysis", "motion-recommendations"],
            inputReferences: { scene: "base-scene" },
            inputs: { intent: goal },
            expectedOutput: "motion-quality-report",
            dependencies: ["scene-generate-base"],
            priority: 8,
            artifactKey: "scene-motion-report",
          },
          {
            id: "scene-perf-eval",
            description: "Analyze particle density and estimate hardware workload.",
            assignedAgentId: "agent-performance-optimization",
            requiredCapabilities: ["telemetry-inspection", "performance-optimization"],
            inputReferences: { scene: "base-scene" },
            inputs: { fps: 60, memoryMB: 60, droppedFrames: 0 },
            expectedOutput: "optimization-report",
            dependencies: ["scene-generate-base"],
            priority: 8,
            artifactKey: "scene-perf-report",
          },
          {
            id: "scene-a11y-eval",
            description: "Inspect continuous background motion for vestibular triggers.",
            assignedAgentId: "agent-accessibility",
            requiredCapabilities: ["accessibility-audit"],
            inputReferences: { scene: "base-scene" },
            inputs: { durationMs: 4000, allowsPause: true },
            expectedOutput: "accessibility-report",
            dependencies: ["scene-generate-base"],
            priority: 8,
            artifactKey: "scene-a11y-report",
          },
          {
            id: "scene-composition-validate",
            description: "Validate cross-system synchronization across 3D, physics, and DOM tracks.",
            assignedAgentId: "agent-composition",
            requiredCapabilities: ["composition-validation"],
            inputReferences: { scene: "base-scene" },
            inputs: { nodes: [{ id: "scene-root" }], tracks: [{ id: "trk1" }] },
            expectedOutput: "composition-validation-report",
            dependencies: ["scene-motion-eval", "scene-perf-eval", "scene-a11y-eval"],
            priority: 6,
            artifactKey: "scene-composition-report",
          },
        ],
        {
          strategy: "hierarchical",
          coordinatorAgentId: "agent-scene-generation",
        }
      );
    },
  },

  // 3. Motion Optimization Team (Pipeline)
  "motion-optimization-team": {
    id: "motion-optimization-team",
    name: "Motion Optimization Pipeline",
    description: "Linear pipeline analyzing quality, diagnosing runtime bottlenecks, selecting accessible fallbacks, and validating final composition.",
    strategy: "pipeline" as const,
    defaultGoal: "Optimize animation pipeline for smooth 60 FPS on low-power devices with zero accessibility compromise.",
    estimatedDurationMs: 1400,
    createPlan: (goal: string, initialInputs: Record<string, unknown> = {}, planner: CollaborationPlanner = collaborationPlanner): CollaborationPlan => {
      const perfInput = initialInputs.telemetry || { fps: 45, memoryMB: 90, droppedFrames: 8 };

      return planner.createCollaborationPlan(
        goal,
        [
          {
            id: "pipe-motion-analysis",
            description: "Analyze baseline motion quality and calculate visual score.",
            assignedAgentId: "agent-motion-intelligence",
            requiredCapabilities: ["motion-analysis", "quality-scoring"],
            inputReferences: {},
            inputs: { intent: goal, timing: 400 },
            expectedOutput: "motion-quality-report",
            dependencies: [],
            priority: 10,
            artifactKey: "pipe-quality",
          },
          {
            id: "pipe-perf-diagnosis",
            description: "Diagnose rendering bottlenecks and generate optimization tiers.",
            assignedAgentId: "agent-performance-optimization",
            requiredCapabilities: ["bottleneck-detection", "performance-optimization"],
            inputReferences: { qualityReport: "pipe-quality" },
            inputs: { ...perfInput },
            expectedOutput: "optimization-report",
            dependencies: ["pipe-motion-analysis"],
            priority: 8,
            artifactKey: "pipe-perf",
          },
          {
            id: "pipe-a11y-fallback",
            description: "Ensure optimized motion profiles maintain WCAG 2.2.2 compatibility.",
            assignedAgentId: "agent-accessibility",
            requiredCapabilities: ["accessibility-audit", "reduced-motion-adaptation"],
            inputReferences: { perfReport: "pipe-perf" },
            inputs: { durationMs: 400, reducedMotionFallback: true },
            expectedOutput: "accessibility-report",
            dependencies: ["pipe-perf-diagnosis"],
            priority: 6,
            artifactKey: "pipe-a11y",
          },
          {
            id: "pipe-composition-verify",
            description: "Verify that optimized composition maintains track alignment and graph integrity.",
            assignedAgentId: "agent-composition",
            requiredCapabilities: ["composition-validation"],
            inputReferences: { a11yReport: "pipe-a11y" },
            inputs: { nodes: [{ id: "optimized-root" }], tracks: [{ id: "opt-t1" }] },
            expectedOutput: "composition-validation-report",
            dependencies: ["pipe-a11y-fallback"],
            priority: 4,
            artifactKey: "pipe-composition",
          },
        ],
        {
          strategy: "pipeline",
          coordinatorAgentId: "agent-performance-optimization",
        }
      );
    },
  },

  // 4. Complete Creative Audit (Parallel)
  "complete-creative-audit": {
    id: "complete-creative-audit",
    name: "Complete Multi-Agent Creative Audit",
    description: "Parallel collaboration: All specialized agents simultaneously audit quality, performance, accessibility, and composition in Wave 0.",
    strategy: "parallel" as const,
    defaultGoal: "Comprehensive multi-domain audit across visual aesthetics, runtime performance, WCAG accessibility, and composition graph integrity.",
    estimatedDurationMs: 1200,
    createPlan: (goal: string, initialInputs: Record<string, unknown> = {}, planner: CollaborationPlanner = collaborationPlanner): CollaborationPlan => {
      const config = initialInputs.config || { duration: 400, fps: 60, memoryMB: 45 };

      return planner.createCollaborationPlan(
        goal,
        [
          // Parallel Wave 0: 4 independent audits
          {
            id: "audit-motion",
            description: "Audit visual appeal and spring curve dynamics.",
            assignedAgentId: "agent-motion-intelligence",
            requiredCapabilities: ["motion-analysis", "quality-scoring"],
            inputReferences: {},
            inputs: { ...config },
            expectedOutput: "motion-quality-report",
            dependencies: [],
            priority: 10,
            artifactKey: "motion-audit-out",
          },
          {
            id: "audit-perf",
            description: "Audit runtime performance telemetry and estimate memory footprint.",
            assignedAgentId: "agent-performance-optimization",
            requiredCapabilities: ["telemetry-inspection"],
            inputReferences: {},
            inputs: { fps: 60, memoryMB: 45, droppedFrames: 0 },
            expectedOutput: "optimization-report",
            dependencies: [],
            priority: 10,
            artifactKey: "perf-audit-out",
          },
          {
            id: "audit-a11y",
            description: "Audit WCAG 2.2.2 motion guidelines and reduced-motion fallback.",
            assignedAgentId: "agent-accessibility",
            requiredCapabilities: ["accessibility-audit"],
            inputReferences: {},
            inputs: { durationMs: 400, reducedMotionFallback: true },
            expectedOutput: "accessibility-report",
            dependencies: [],
            priority: 10,
            artifactKey: "a11y-audit-out",
          },
          {
            id: "audit-composition",
            description: "Audit composition acyclicity and track timing synchronization.",
            assignedAgentId: "agent-composition",
            requiredCapabilities: ["composition-validation"],
            inputReferences: {},
            inputs: { nodes: [{ id: "n1" }], tracks: [{ id: "t1" }] },
            expectedOutput: "composition-validation-report",
            dependencies: [],
            priority: 10,
            artifactKey: "composition-audit-out",
          },
        ],
        {
          strategy: "parallel",
          coordinatorAgentId: "agent-motion-intelligence",
        }
      );
    },
  },
};

export function listCollaborationWorkflows() {
  return Object.values(COLLABORATION_WORKFLOW_DEFINITIONS);
}

export function getCollaborationWorkflow(id: string) {
  return (COLLABORATION_WORKFLOW_DEFINITIONS as Record<string, any>)[id];
}
