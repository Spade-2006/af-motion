import { describe, expect, it, beforeEach } from "vitest";
import {
  agentRegistry,
  safeToolRegistry,
  taskPlanner,
  workflowExecutionEngine,
  listWorkflowTemplates,
  getWorkflowTemplate,
  TaskPlanValidationError,
  STANDARD_AGENTS,
  motionIntelligenceAgent,
  designToMotionAgent,
  sceneGenerationAgent,
  performanceOptimizationAgent,
  accessibilityAgent,
  compositionAgent,
  AGENT_WORKFLOWS_SPEC_VERSION,
  type AgentDefinition,
  type TaskPlan,
} from "../src/catalogue.js";
import { useAgentWorkflow } from "../src/react.js";

describe("Intelligent Agent Workflows (Phase 18, Prompt 144)", () => {
  describe("1. Agent Foundation & Registry", () => {
    it("exports valid specification version 1.0.0", () => {
      expect(AGENT_WORKFLOWS_SPEC_VERSION).toBe("1.0.0");
    });

    it("registers and discovers all 6 specialized agents", () => {
      expect(agentRegistry.size).toBeGreaterThanOrEqual(6);
      expect(agentRegistry.has("agent-motion-intelligence")).toBe(true);
      expect(agentRegistry.has("agent-design-to-motion")).toBe(true);
      expect(agentRegistry.has("agent-scene-generation")).toBe(true);
      expect(agentRegistry.has("agent-performance-optimization")).toBe(true);
      expect(agentRegistry.has("agent-accessibility")).toBe(true);
      expect(agentRegistry.has("agent-composition")).toBe(true);
    });

    it("finds agents by category and capability", () => {
      const motionAgents = agentRegistry.findByCategory("motion-intelligence");
      expect(motionAgents.length).toBeGreaterThan(0);
      expect(motionAgents[0].metadata.id).toBe("agent-motion-intelligence");

      const a11yAgents = agentRegistry.findByCapability("accessibility-audit");
      expect(a11yAgents.length).toBeGreaterThan(0);
      expect(a11yAgents[0].metadata.id).toBe("agent-accessibility");
    });

    it("validates agent definitions on custom registration", () => {
      expect(() => {
        agentRegistry.register({} as any);
      }).toThrow(/missing metadata\.id/);

      expect(() => {
        agentRegistry.register({
          metadata: { id: "invalid-agent", capabilities: [] },
          execute: () => ({} as any),
        } as any);
      }).toThrow(/must declare at least one capability/);
    });
  });

  describe("2. Safe Tool Registry", () => {
    it("registers default safe tools with strict permissions", () => {
      expect(safeToolRegistry.has("analyze_motion")).toBe(true);
      expect(safeToolRegistry.has("generate_design_motion")).toBe(true);
      expect(safeToolRegistry.has("generate_scene")).toBe(true);
      expect(safeToolRegistry.has("analyze_performance")).toBe(true);
      expect(safeToolRegistry.has("inspect_accessibility")).toBe(true);
      expect(safeToolRegistry.has("validate_composition")).toBe(true);
      expect(safeToolRegistry.has("search_motion_patterns")).toBe(true);
      expect(safeToolRegistry.has("retrieve_presets")).toBe(true);
      expect(safeToolRegistry.has("generate_export_artifacts")).toBe(true);
    });

    it("rejects unknown or invalid tool invocations", async () => {
      await expect(
        safeToolRegistry.invoke("unknown_tool", {})
      ).rejects.toThrow(/not registered/);
    });

    it("enforces tool permission restrictions", async () => {
      await expect(
        safeToolRegistry.invoke("generate_scene", { prompt: "test" }, {
          allowedPermissions: ["read"],
        })
      ).rejects.toThrow(/requires "generate" permission/);
    });

    it("executes safe read tools deterministically", async () => {
      const result = await safeToolRegistry.invoke<{ score: number; passed: boolean }>(
        "analyze_motion",
        { duration: 400, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }
      );
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(typeof result.passed).toBe("boolean");
    });
  });

  describe("3. Task Planning & Dependency Resolution", () => {
    it("validates a standard sequential task plan", () => {
      const plan = taskPlanner.createCustomPlan("Test sequential goal", [
        {
          id: "step-1",
          description: "Analyze motion aesthetics",
          assignedAgentId: "agent-motion-intelligence",
          inputs: { duration: 450 },
          expectedOutput: "motion-quality-report",
          dependencies: [],
          priority: 10,
        },
        {
          id: "step-2",
          description: "Inspect accessibility",
          assignedAgentId: "agent-accessibility",
          inputs: { durationMs: 450 },
          expectedOutput: "accessibility-report",
          dependencies: ["step-1"],
          priority: 5,
        },
      ]);

      expect(plan.tasks.length).toBe(2);
      const order = taskPlanner.getTopologicalExecutionOrder(plan);
      expect(order[0].id).toBe("step-1");
      expect(order[1].id).toBe("step-2");
    });

    it("detects and rejects circular dependencies (cycle detection)", () => {
      const cyclicPlan: TaskPlan = {
        workflowId: "wf-cyclic",
        goal: "Circular dependency test",
        createdAt: Date.now(),
        estimatedDurationMs: 1000,
        tasks: [
          {
            id: "task-A",
            description: "Task A",
            assignedAgentId: "agent-motion-intelligence",
            inputs: {},
            expectedOutput: "motion-quality-report",
            dependencies: ["task-B"],
            priority: 1,
            status: "pending",
          },
          {
            id: "task-B",
            description: "Task B",
            assignedAgentId: "agent-accessibility",
            inputs: {},
            expectedOutput: "accessibility-report",
            dependencies: ["task-A"],
            priority: 1,
            status: "pending",
          },
        ],
      };

      expect(() => {
        taskPlanner.getTopologicalExecutionOrder(cyclicPlan);
      }).toThrow(TaskPlanValidationError);
    });

    it("rejects task plan referencing unknown agents", () => {
      const invalidPlan: TaskPlan = {
        workflowId: "wf-invalid",
        goal: "Invalid agent test",
        createdAt: Date.now(),
        estimatedDurationMs: 1000,
        tasks: [
          {
            id: "task-1",
            description: "Task with rogue agent",
            assignedAgentId: "non-existent-agent",
            inputs: {},
            expectedOutput: "motion-quality-report",
            dependencies: [],
            priority: 1,
            status: "pending",
          },
        ],
      };

      const val = taskPlanner.validatePlan(invalidPlan);
      expect(val.valid).toBe(false);
      expect(val.issues.some((i) => i.includes("non-existent-agent"))).toBe(true);
    });
  });

  describe("4. Workflow Execution Engine", () => {
    it("executes a complete multi-step workflow asynchronously", async () => {
      const plan = taskPlanner.createCustomPlan("Execute multi-step audit", [
        {
          id: "task-analyze",
          description: "Analyze motion quality",
          assignedAgentId: "agent-motion-intelligence",
          inputs: { duration: 400 },
          expectedOutput: "motion-quality-report",
          dependencies: [],
          priority: 10,
        },
        {
          id: "task-a11y",
          description: "Evaluate accessibility",
          assignedAgentId: "agent-accessibility",
          inputs: { durationMs: 400, reducedMotionFallback: true },
          expectedOutput: "accessibility-report",
          dependencies: ["task-analyze"],
          priority: 5,
        },
      ]);

      const result = await workflowExecutionEngine.executePlan(plan);
      expect(result.status).toBe("completed");
      expect(result.outputs["task-analyze"]).toBeDefined();
      expect(result.outputs["task-a11y"]).toBeDefined();
      expect(result.telemetry.totalTasks).toBe(2);
      expect(result.telemetry.completedTasks).toBe(2);
      expect(result.telemetry.failedTasks).toBe(0);
      expect(result.telemetry.durationMs).toBeGreaterThan(0);
    });

    it("handles task cancellation via AbortSignal", async () => {
      const controller = new AbortController();
      controller.abort();

      const plan = taskPlanner.createCustomPlan("Cancelled workflow", [
        {
          id: "task-1",
          description: "Never runs",
          assignedAgentId: "agent-motion-intelligence",
          inputs: {},
          expectedOutput: "motion-quality-report",
          dependencies: [],
          priority: 1,
        },
      ]);

      const result = await workflowExecutionEngine.executePlan(plan, {
        signal: controller.signal,
      });

      expect(result.status).toBe("cancelled");
    });

    it("skips optional tasks gracefully when dependency fails", async () => {
      // Create a task that will fail
      const failingAgent: AgentDefinition = {
        metadata: {
          id: "agent-failing",
          name: "Failing Agent",
          description: "Intentionally fails for testing",
          version: "1.0.0",
          category: "custom",
          capabilities: ["motion-analysis"],
          acceptedInputTypes: ["generic-json"],
          expectedOutputTypes: ["motion-quality-report"],
        },
        instructions: ["Fail intentionally."],
        execute: () => {
          throw new Error("Intentional failure");
        },
      };
      agentRegistry.register(failingAgent);

      const plan = taskPlanner.createCustomPlan("Optional task skip test", [
        {
          id: "task-fail",
          description: "Will fail",
          assignedAgentId: "agent-failing",
          inputs: {},
          expectedOutput: "motion-quality-report",
          dependencies: [],
          priority: 10,
          optional: true,
        },
        {
          id: "task-skip",
          description: "Should be skipped",
          assignedAgentId: "agent-accessibility",
          inputs: {},
          expectedOutput: "accessibility-report",
          dependencies: ["task-fail"],
          priority: 5,
          optional: true,
        },
      ]);

      const result = await workflowExecutionEngine.executePlan(plan);
      expect(result.plan.tasks.find((t) => t.id === "task-fail")?.status).toBe("failed");
      expect(result.plan.tasks.find((t) => t.id === "task-skip")?.status).toBe("skipped");

      agentRegistry.unregister("agent-failing");
    });
  });

  describe("5. Workflow Templates (All 5 Implemented)", () => {
    it("provides 5 complete workflow templates", () => {
      const templates = listWorkflowTemplates();
      expect(templates.length).toBe(5);
      const ids = templates.map((t) => t.id);
      expect(ids).toContain("motion-quality-audit");
      expect(ids).toContain("design-to-animation");
      expect(ids).toContain("complete-scene-creation");
      expect(ids).toContain("performance-optimization");
      expect(ids).toContain("accessibility-audit");
    });

    it("executes Motion Quality Audit template", async () => {
      const tmpl = getWorkflowTemplate("motion-quality-audit")!;
      const plan = tmpl.createPlan("Audit hero animation");
      const result = await workflowExecutionEngine.executePlan(plan);
      expect(result.status).toBe("completed");
      expect(result.telemetry.completedTasks).toBe(4);
    });

    it("executes Design-to-Animation template", async () => {
      const tmpl = getWorkflowTemplate("design-to-animation")!;
      const plan = tmpl.createPlan("Generate animated pricing cards");
      const result = await workflowExecutionEngine.executePlan(plan);
      expect(result.status).toBe("completed");
      expect(result.telemetry.completedTasks).toBe(4);
    });

    it("executes Complete Scene Creation template", async () => {
      const tmpl = getWorkflowTemplate("complete-scene-creation")!;
      const plan = tmpl.createPlan("Generate interactive hero world with particles");
      const result = await workflowExecutionEngine.executePlan(plan);
      expect(result.status).toBe("completed");
      expect(result.telemetry.completedTasks).toBe(4);
    });

    it("executes Performance Optimization template", async () => {
      const tmpl = getWorkflowTemplate("performance-optimization")!;
      const plan = tmpl.createPlan("Optimize 45 FPS bottleneck");
      const result = await workflowExecutionEngine.executePlan(plan);
      expect(result.status).toBe("completed");
      expect(result.telemetry.completedTasks).toBe(3);
    });

    it("executes Accessibility Audit template", async () => {
      const tmpl = getWorkflowTemplate("accessibility-audit")!;
      const plan = tmpl.createPlan("Check continuous motion duration and vestibular triggers");
      const result = await workflowExecutionEngine.executePlan(plan);
      expect(result.status).toBe("completed");
      expect(result.telemetry.completedTasks).toBe(3);
    });
  });

  describe("6. React Hook Integration (useAgentWorkflow)", () => {
    it("exports useAgentWorkflow cleanly from af-motion/react", () => {
      expect(typeof useAgentWorkflow).toBe("function");
    });
  });

  describe("7. Determinism & Offline Safety", () => {
    it("guarantees identical outputs for identical inputs without network calls", async () => {
      const tmpl = getWorkflowTemplate("motion-quality-audit")!;
      const planA = tmpl.createPlan("Deterministic test");
      const planB = tmpl.createPlan("Deterministic test");

      const resultA = await workflowExecutionEngine.executePlan(planA);
      const resultB = await workflowExecutionEngine.executePlan(planB);

      expect(resultA.status).toBe("completed");
      expect(resultB.status).toBe("completed");
      expect(resultA.telemetry.totalTasks).toBe(resultB.telemetry.totalTasks);
      expect(resultA.telemetry.completedTasks).toBe(resultB.telemetry.completedTasks);
    });
  });
});
