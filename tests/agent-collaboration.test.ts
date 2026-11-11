import { describe, expect, it } from "vitest";
import {
  ORCHESTRATION_SPEC_VERSION,
  agentRegistry,
  safeToolRegistry,
  collaborationPlanner,
  multiAgentOrchestrator,
  conflictResolver,
  agentMessageBus,
  SharedWorkflowContext,
  listCollaborationWorkflows,
  getCollaborationWorkflow,
  TaskPlanValidationError,
  type CollaborationPlan,
} from "../src/catalogue.js";
import { useAgentCollaboration } from "../src/react.js";

describe("Multi-Agent Collaboration & Orchestration (Phase 18, Prompt 145)", () => {
  describe("1. Orchestration Foundation & Version", () => {
    it("exports valid orchestration specification version 1.0.0", () => {
      expect(ORCHESTRATION_SPEC_VERSION).toBe("1.0.0");
    });

    it("verifies required specialized agents are registered and available", () => {
      expect(agentRegistry.has("agent-motion-intelligence")).toBe(true);
      expect(agentRegistry.has("agent-design-to-motion")).toBe(true);
      expect(agentRegistry.has("agent-scene-generation")).toBe(true);
      expect(agentRegistry.has("agent-performance-optimization")).toBe(true);
      expect(agentRegistry.has("agent-accessibility")).toBe(true);
      expect(agentRegistry.has("agent-composition")).toBe(true);
    });

    it("matches capabilities to registered agents accurately", () => {
      const a11yAgent = collaborationPlanner.selectAgentForCapability("accessibility-audit");
      expect(a11yAgent.id).toBe("agent-accessibility");

      const motionAgent = collaborationPlanner.selectAgentForCapability("motion-analysis");
      expect(motionAgent.id).toBe("agent-motion-intelligence");

      const d2mAgent = collaborationPlanner.selectAgentForCapability("design-interpretation");
      expect(d2mAgent.id).toBe("agent-design-to-motion");

      const sceneAgent = collaborationPlanner.selectAgentForCapability("scene-generation");
      expect(sceneAgent.id).toBe("agent-scene-generation");
    });
  });

  describe("2. Collaboration Planning & Parallel Wave Grouping", () => {
    it("computes parallel execution waves correctly for diamond dependencies", () => {
      // diamond: A -> (B, C) -> D
      const plan = collaborationPlanner.createCollaborationPlan("Diamond workflow", [
        {
          id: "task-A",
          description: "Root task",
          assignedAgentId: "agent-motion-intelligence",
          requiredCapabilities: ["motion-analysis"],
          inputReferences: {},
          inputs: {},
          expectedOutput: "motion-quality-report",
          dependencies: [],
          priority: 10,
        },
        {
          id: "task-B",
          description: "Branch B",
          assignedAgentId: "agent-accessibility",
          requiredCapabilities: ["accessibility-audit"],
          inputReferences: {},
          inputs: {},
          expectedOutput: "accessibility-report",
          dependencies: ["task-A"],
          priority: 8,
        },
        {
          id: "task-C",
          description: "Branch C",
          assignedAgentId: "agent-performance-optimization",
          requiredCapabilities: ["telemetry-inspection"],
          inputReferences: {},
          inputs: {},
          expectedOutput: "optimization-report",
          dependencies: ["task-A"],
          priority: 7,
        },
        {
          id: "task-D",
          description: "Converge D",
          assignedAgentId: "agent-composition",
          requiredCapabilities: ["composition-validation"],
          inputReferences: {},
          inputs: {},
          expectedOutput: "composition-validation-report",
          dependencies: ["task-B", "task-C"],
          priority: 5,
        },
      ]);

      expect(plan.parallelWaves.length).toBe(3);
      expect(plan.parallelWaves[0]).toEqual(["task-A"]);
      // Wave 1 contains B and C in parallel
      expect(plan.parallelWaves[1].sort()).toEqual(["task-B", "task-C"].sort());
      expect(plan.parallelWaves[2]).toEqual(["task-D"]);
    });

    it("detects and rejects circular dependencies in collaboration plans", () => {
      expect(() => {
        collaborationPlanner.createCollaborationPlan("Cyclic plan", [
          {
            id: "task-1",
            description: "Task 1",
            assignedAgentId: "agent-motion-intelligence",
            requiredCapabilities: ["motion-analysis"],
            inputReferences: {},
            inputs: {},
            expectedOutput: "motion-quality-report",
            dependencies: ["task-2"],
            priority: 1,
          },
          {
            id: "task-2",
            description: "Task 2",
            assignedAgentId: "agent-accessibility",
            requiredCapabilities: ["accessibility-audit"],
            inputReferences: {},
            inputs: {},
            expectedOutput: "accessibility-report",
            dependencies: ["task-1"],
            priority: 1,
          },
        ]);
      }).toThrow(TaskPlanValidationError);
    });

    it("rejects task when assigned agent lacks the required capability", () => {
      expect(() => {
        collaborationPlanner.createCollaborationPlan("Capability mismatch", [
          {
            id: "task-mismatch",
            description: "Assigning 3D scene gen to a11y agent",
            assignedAgentId: "agent-accessibility",
            requiredCapabilities: ["scene-generation"],
            inputReferences: {},
            inputs: {},
            expectedOutput: "generated-scene",
            dependencies: [],
            priority: 1,
          },
        ]);
      }).toThrow(/lacks required capability/);
    });
  });

  describe("3. Agent Communication Protocol & Message Bus", () => {
    it("dispatches typed messages with sequence numbers and schema validation", () => {
      const msg = agentMessageBus.createMessage({
        workflowId: "wf-comm-test",
        senderAgentId: "agent-design-to-motion",
        recipientAgentId: "agent-motion-intelligence",
        type: "artifact_delivery",
        payload: { choreographyId: "choreo-123", duration: 400 },
        payloadReference: "initial-choreography",
      });

      expect(msg.id).toBeDefined();
      expect(msg.sequenceNumber).toBeGreaterThan(0);
      expect(msg.schemaVersion).toBe("1.0.0");
      expect(msg.type).toBe("artifact_delivery");

      let received = false;
      const unsubscribe = agentMessageBus.subscribe((m) => {
        if (m.id === msg.id) received = true;
      });

      agentMessageBus.dispatch(msg);
      expect(received).toBe(true);
      unsubscribe();
    });

    it("rejects prohibited executable code constructs in message payload", () => {
      expect(() => {
        agentMessageBus.createMessage({
          workflowId: "wf-unsafe",
          senderAgentId: "agent-a",
          recipientAgentId: "agent-b",
          type: "task_assignment",
          payload: { code: "eval('alert(1)')" },
        });
      }).toThrow(/Security violation/);
    });
  });

  describe("4. Shared Context & Immutable Artifact Versioning", () => {
    it("stores immutable artifacts with deterministic hashes and versioning", () => {
      const ctx = new SharedWorkflowContext("wf-shared-test", "Shared context goal");

      const artV1 = ctx.storeArtifact({
        key: "motion-spec",
        type: "generated-animation",
        producerAgentId: "agent-design-to-motion",
        taskId: "task-1",
        data: { duration: 400, easing: "ease-out" },
      });

      expect(artV1.version).toBe(1);
      expect(artV1.immutable).toBe(true);
      expect(artV1.hash.startsWith("h_")).toBe(true);

      const artV2 = ctx.storeArtifact({
        key: "motion-spec",
        type: "generated-animation",
        producerAgentId: "agent-motion-intelligence",
        taskId: "task-2",
        data: { duration: 450, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
      });

      expect(artV2.version).toBe(2);
      expect(ctx.getArtifact("motion-spec", 1)?.data).toEqual({ duration: 400, easing: "ease-out" });
      expect(ctx.getArtifact("motion-spec", 2)?.data).toEqual({ duration: 450, easing: "cubic-bezier(0.16, 1, 0.3, 1)" });
      expect(ctx.getArtifact("motion-spec")?.version).toBe(2); // Latest by default
    });
  });

  describe("5. Conflict Detection & Resolution Engine", () => {
    it("detects accessibility violations and auto-resolves via safety rule precedence", () => {
      const conflicts = conflictResolver.detectConflicts({
        workflowId: "wf-conf-test",
        agentOutputs: [
          {
            agentId: "agent-accessibility",
            output: {
              accessible: false,
              violations: ["Duration exceeds 5000ms without pause mechanism"],
            },
            artifactKey: "a11y-audit",
          },
          {
            agentId: "agent-motion-intelligence",
            output: { score: 92 },
          },
        ],
      });

      expect(conflicts.length).toBe(1);
      expect(conflicts[0].conflictType).toBe("accessibility_violation");
      expect(conflicts[0].resolutionStrategy).toBe("rule_based");
      expect(conflicts[0].approvalStatus).toBe("auto_resolved");
      expect(conflicts[0].reason).toContain("WCAG 2.2.2 compliance takes absolute priority");
    });

    it("detects performance bottlenecks and resolves via priority", () => {
      const conflicts = conflictResolver.detectConflicts({
        workflowId: "wf-conf-perf",
        agentOutputs: [
          {
            agentId: "agent-performance-optimization",
            output: { healthScore: 45, bottlenecks: ["Framerate dropped to 38 FPS"] },
            artifactKey: "perf-audit",
          },
          {
            agentId: "agent-scene-generation",
            output: { objectsCount: 40 },
          },
        ],
      });

      expect(conflicts.length).toBe(1);
      expect(conflicts[0].conflictType).toBe("performance_vs_quality");
      expect(conflicts[0].selectedResolution).toEqual({
        reduceParticleDensity: true,
        downgradeQualityTier: "medium",
      });
    });

    it("supports manual human approval resolution", () => {
      const conflict = conflictResolver.detectConflicts({
        workflowId: "wf-manual-conf",
        agentOutputs: [
          {
            agentId: "agent-accessibility",
            output: { accessible: false, violations: ["Large scaling trigger"] },
          },
        ],
      })[0];

      const resolved = conflictResolver.resolveConflict(conflict, "human_approval", {
        userAcceptedRisk: true,
        reducedScale: 1.15,
      });

      expect(resolved.resolutionStrategy).toBe("human_approval");
      expect(resolved.approvalStatus).toBe("approved");
      expect(resolved.selectedResolution).toEqual({ userAcceptedRisk: true, reducedScale: 1.15 });
    });
  });

  describe("6. Specialized Collaboration Workflows (All 4 Verified)", () => {
    it("provides 4 specialized collaboration workflow definitions", () => {
      const workflows = listCollaborationWorkflows();
      expect(workflows.length).toBe(4);
      const ids = workflows.map((w) => w.id);
      expect(ids).toContain("complete-design-to-motion");
      expect(ids).toContain("complete-scene-creation");
      expect(ids).toContain("motion-optimization-team");
      expect(ids).toContain("complete-creative-audit");
    });

    it("orchestrates Complete Design-to-Motion Pipeline (Review-and-Refine)", async () => {
      const wf = getCollaborationWorkflow("complete-design-to-motion")!;
      const plan = wf.createPlan("Design pricing card reveal with playful DNA");
      const deliverable = await multiAgentOrchestrator.orchestrate(plan);

      expect(deliverable.status).toBe("completed");
      expect(deliverable.strategy).toBe("review-and-refine");
      expect(deliverable.participatingAgents.length).toBeGreaterThanOrEqual(3);
      expect(deliverable.qualityValidation.passed).toBe(true);
      expect(deliverable.telemetry.tasksCompleted).toBe(4);
      expect(deliverable.telemetry.messagesSent).toBeGreaterThan(0);
    });

    it("orchestrates Complete Scene Creation (Hierarchical)", async () => {
      const wf = getCollaborationWorkflow("complete-scene-creation")!;
      const plan = wf.createPlan("Hero showcase with 3D particles and DOM cards");
      const deliverable = await multiAgentOrchestrator.orchestrate(plan);

      expect(deliverable.status).toBe("completed");
      expect(deliverable.strategy).toBe("hierarchical");
      expect(deliverable.telemetry.waveCount).toBeGreaterThanOrEqual(2);
      expect(deliverable.telemetry.tasksCompleted).toBe(5);
    });

    it("orchestrates Motion Optimization Team (Pipeline)", async () => {
      const wf = getCollaborationWorkflow("motion-optimization-team")!;
      const plan = wf.createPlan("Optimize 45 FPS bottleneck on mobile");
      const deliverable = await multiAgentOrchestrator.orchestrate(plan);

      expect(deliverable.status).toBe("completed");
      expect(deliverable.strategy).toBe("pipeline");
      expect(deliverable.telemetry.tasksCompleted).toBe(4);
    });

    it("orchestrates Complete Creative Audit (Parallel)", async () => {
      const wf = getCollaborationWorkflow("complete-creative-audit")!;
      const plan = wf.createPlan("Full creative health check");
      const deliverable = await multiAgentOrchestrator.orchestrate(plan);

      expect(deliverable.status).toBe("completed");
      expect(deliverable.strategy).toBe("parallel");
      expect(deliverable.telemetry.waveCount).toBe(1); // All 4 run concurrently in Wave 0!
      expect(deliverable.telemetry.tasksCompleted).toBe(4);
    });
  });

  describe("7. Orchestration Engine Control & Concurrency", () => {
    it("handles concurrency limits and executes chunks correctly", async () => {
      const plan = collaborationPlanner.createCollaborationPlan("Concurrency limit test", [
        {
          id: "task-1",
          description: "Task 1",
          assignedAgentId: "agent-motion-intelligence",
          requiredCapabilities: ["motion-analysis"],
          inputReferences: {},
          inputs: {},
          expectedOutput: "motion-quality-report",
          dependencies: [],
          priority: 1,
        },
        {
          id: "task-2",
          description: "Task 2",
          assignedAgentId: "agent-performance-optimization",
          requiredCapabilities: ["telemetry-inspection"],
          inputReferences: {},
          inputs: {},
          expectedOutput: "optimization-report",
          dependencies: [],
          priority: 1,
        },
      ]);

      const deliverable = await multiAgentOrchestrator.orchestrate(plan, {
        maxConcurrency: 1, // Serialized chunk execution
      });

      expect(deliverable.status).toBe("completed");
      expect(deliverable.telemetry.tasksCompleted).toBe(2);
    });

    it("aborts orchestration immediately when AbortSignal fires", async () => {
      const controller = new AbortController();
      controller.abort();

      const wf = getCollaborationWorkflow("complete-creative-audit")!;
      const plan = wf.createPlan("Cancelled collaboration");

      const deliverable = await multiAgentOrchestrator.orchestrate(plan, {
        signal: controller.signal,
      });

      expect(deliverable.status).toBe("cancelled");
    });
  });

  describe("8. React Integration (useAgentCollaboration)", () => {
    it("exports useAgentCollaboration hook cleanly from af-motion/react", () => {
      expect(typeof useAgentCollaboration).toBe("function");
    });
  });

  describe("9. Collective Quality Gates", () => {
    it("enforces mandatory quality gates and reflects status in deliverable", async () => {
      const wf = getCollaborationWorkflow("complete-design-to-motion")!;
      const plan = wf.createPlan("Quality gate audit");
      const deliverable = await multiAgentOrchestrator.orchestrate(plan);

      expect(deliverable.qualityValidation.passed).toBe(true);
      expect(deliverable.qualityValidation.gates.length).toBeGreaterThanOrEqual(3);
      expect(deliverable.qualityValidation.overallQualityScore).toBeGreaterThanOrEqual(70);
    });
  });
});
