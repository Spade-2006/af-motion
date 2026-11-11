import { describe, expect, it } from "vitest";
import {
  AI_ECOSYSTEM_SPEC_VERSION,
  UNIFIED_AI_CAPABILITIES,
  aiEcosystemCapabilityRegistry,
  listAICapabilities,
  getAICapability,
  queryAICapabilities,
  deterministicLocalAIProvider,
  DeterministicLocalAIProvider,
  aiEcosystemPipelineCoordinator,
  executeAIEcosystemPipeline,
  type AICapabilityId,
  type AIEcosystemRequest,
} from "../src/catalogue.js";

describe("AI Ecosystem Integration & Validation (Phase 18, Prompt 146)", () => {
  describe("1. Specification Version & Capability Registry", () => {
    it("exports valid AI Ecosystem specification version 1.0.0", () => {
      expect(AI_ECOSYSTEM_SPEC_VERSION).toBe("1.0.0");
    });

    it("verifies all 12 core capabilities are registered in UNIFIED_AI_CAPABILITIES", () => {
      const expectedCapabilities: AICapabilityId[] = [
        "motion-analysis",
        "quality-evaluation",
        "motion-recommendations",
        "design-to-motion-generation",
        "scene-generation",
        "performance-analysis",
        "accessibility-analysis",
        "composition-validation",
        "agent-workflows",
        "multi-agent-orchestration",
        "conflict-resolution",
        "export-generation",
      ];

      expect(UNIFIED_AI_CAPABILITIES).toHaveLength(12);
      for (const capId of expectedCapabilities) {
        const found = UNIFIED_AI_CAPABILITIES.find((c) => c.id === capId);
        expect(found).toBeDefined();
        expect(found?.version).toBe("1.0.0");
        expect(found?.supportedProviders).toContain("deterministic-local");
      }
    });

    it("queries capabilities by search term and category", () => {
      const intelligenceCaps = aiEcosystemCapabilityRegistry.findByCategory("intelligence");
      expect(intelligenceCaps.length).toBeGreaterThanOrEqual(2);
      expect(intelligenceCaps.some((c) => c.id === "quality-evaluation")).toBe(true);

      const generationCaps = aiEcosystemCapabilityRegistry.findByCategory("generation");
      expect(generationCaps.some((c) => c.id === "design-to-motion-generation")).toBe(true);
      expect(generationCaps.some((c) => c.id === "scene-generation")).toBe(true);

      const orchestrationCaps = aiEcosystemCapabilityRegistry.findByCategory("orchestration");
      expect(orchestrationCaps.some((c) => c.id === "multi-agent-orchestration")).toBe(true);

      const queried = queryAICapabilities("motion");
      expect(queried.length).toBeGreaterThan(0);
      expect(queried.some((c) => c.id === "motion-analysis")).toBe(true);
    });

    it("retrieves individual capability metadata and handles unknown IDs", () => {
      const d2m = getAICapability("design-to-motion-generation");
      expect(d2m).toBeDefined();
      expect(d2m?.category).toBe("generation");
      expect(d2m?.executionMode).toBe("async");

      const unknown = getAICapability("non-existent-capability" as AICapabilityId);
      expect(unknown).toBeUndefined();
    });

    it("lists all capabilities via registry instance and helper function", () => {
      const listA = listAICapabilities();
      const listB = aiEcosystemCapabilityRegistry.list();
      expect(listA.length).toBe(12);
      expect(listB.length).toBe(12);
      expect(listA.map((c) => c.id)).toEqual(listB.map((c) => c.id));
      expect(aiEcosystemCapabilityRegistry.size).toBe(12);
    });
  });

  describe("2. Deterministic Local AI Provider", () => {
    it("initializes deterministic provider with offline capability", () => {
      expect(deterministicLocalAIProvider.id).toBe("deterministic-local");
      expect(deterministicLocalAIProvider.isLocal).toBe(true);
      expect(deterministicLocalAIProvider.capabilities.length).toBe(12);
    });

    it("executes scenario locally with telemetry and timing", async () => {
      const request: AIEcosystemRequest = {
        scenario: "quality-audit",
        goal: "Audit spring transition smoothness for button click",
      };

      const response = await deterministicLocalAIProvider.executeScenario(
        request,
        async (req) => ({
          executionId: "exec-test-001",
          scenario: req.scenario,
          state: "success",
          goal: req.goal,
          qualityScore: 92,
          qualityGrade: "A",
          output: { audited: true },
          artifacts: {},
          qualityGates: [],
          recommendations: ["Ensure reduced motion fallback"],
          warnings: [],
          telemetry: {
            startTime: Date.now(),
            endTime: Date.now() + 5,
            durationMs: 5,
            providerId: "deterministic-local",
          },
        }),
      );

      expect(response.state).toBe("success");
      expect(response.telemetry.providerId).toBe("deterministic-local");
      expect(response.qualityScore).toBe(92);
      expect(response.output).toEqual({ audited: true });
    });

    it("honors timeout thresholds", async () => {
      const customProvider = new DeterministicLocalAIProvider();
      const request: AIEcosystemRequest = {
        scenario: "quality-audit",
        goal: "long running task",
        options: {
          timeoutMs: 15,
        },
      };

      const response = await customProvider.executeScenario(
        request,
        async () => {
          await new Promise((resolve) => setTimeout(resolve, 80));
          return {
            executionId: "timeout-exec",
            scenario: request.scenario,
            state: "success",
            goal: request.goal,
            qualityScore: 80,
            qualityGrade: "B",
            output: {},
            artifacts: {},
            qualityGates: [],
            recommendations: [],
            warnings: [],
            telemetry: {
              startTime: Date.now(),
              endTime: Date.now() + 80,
              durationMs: 80,
              providerId: "deterministic-local",
            },
          };
        },
      );

      expect(response.state).toBe("failed_execution");
      expect(response.error).toMatch(/timed out/i);
    });

    it("handles AbortSignal cancellation", async () => {
      const customProvider = new DeterministicLocalAIProvider();
      const controller = new AbortController();
      controller.abort();

      const request: AIEcosystemRequest = {
        scenario: "quality-audit",
        goal: "cancelled task",
        options: {
          signal: controller.signal,
        },
      };

      const response = await customProvider.executeScenario(
        request,
        async () => ({
          executionId: "abort-exec",
          scenario: request.scenario,
          state: "success",
          goal: request.goal,
          qualityScore: 85,
          qualityGrade: "B",
          output: {},
          artifacts: {},
          qualityGates: [],
          recommendations: [],
          warnings: [],
          telemetry: {
            startTime: Date.now(),
            endTime: Date.now(),
            durationMs: 0,
            providerId: "deterministic-local",
          },
        }),
      );

      expect(response.state).toBe("cancelled");
      expect(response.warnings[0]).toMatch(/abort/i);
    });
  });

  describe("3. End-to-End AI Ecosystem Scenarios", () => {
    it("Scenario A: executes end-to-end Design-to-Motion pipeline with validation and export artifacts", async () => {
      const request: AIEcosystemRequest = {
        scenario: "design-to-motion",
        goal: "Create an elegant fade-in modal dialog with playful scale bounce",
        options: {
          paletteId: "neon-cyberpunk",
          motionDNA: "playful",
        },
      };

      const response = await executeAIEcosystemPipeline(request);

      expect(response.state).toMatch(/success|success_with_warnings/);
      expect(response.scenario).toBe("design-to-motion");
      expect(response.output).toBeDefined();

      const out = response.output as any;
      expect(out.composition).toBeDefined();
      expect(out.validation.qualityScore).toBeGreaterThanOrEqual(50);
      expect(Array.isArray(response.recommendations)).toBe(true);
      expect(response.artifacts).toBeDefined();
      expect(response.artifacts["export-artifacts"]).toBeDefined();
      expect(typeof response.artifacts["export-artifacts"].data.reactCode).toBe("string");

      // Verify quality gates ran
      expect(response.qualityGates).toBeDefined();
      expect(response.qualityGates.length).toBeGreaterThan(0);
      expect(response.qualityScore).toBeGreaterThanOrEqual(50);
    });

    it("Scenario B: executes end-to-end Scene Generation pipeline with multi-object choreography", async () => {
      const request: AIEcosystemRequest = {
        scenario: "scene-generation",
        goal: "Generate a hero section banner with floating geometric cards and glowing particle background",
        options: {
          paletteId: "crimson-minimal",
          motionDNA: "elegant",
        },
      };

      const response = await executeAIEcosystemPipeline(request);

      expect(response.state).toMatch(/success|success_with_warnings/);
      expect(response.scenario).toBe("scene-generation");
      expect(response.output).toBeDefined();

      const out = response.output as any;
      expect(out.plan).toBeDefined();
      expect(response.artifacts["generated-scene"]).toBeDefined();
      expect(typeof out.exportArtifacts.reactCode).toBe("string");

      // Verify quality gates
      expect(response.qualityGates.length).toBeGreaterThan(0);
      expect(response.qualityScore).toBeGreaterThanOrEqual(50);
    });

    it("Scenario C: executes end-to-end Multi-Agent Collaboration workflow", async () => {
      const request: AIEcosystemRequest = {
        scenario: "multi-agent-collaboration",
        goal: "Design and optimize a complete interactive dashboard with accessible microinteractions and high-fps GPU animations",
        options: {
          motionDNA: "precise",
          strategy: "collaborative",
        },
      };

      const response = await executeAIEcosystemPipeline(request);

      expect(response.state).toMatch(/success|success_with_warnings/);
      expect(response.scenario).toBe("multi-agent-collaboration");
      expect(response.output).toBeDefined();

      const out = response.output as any;
      expect(out.workflowId).toBeDefined();
      expect(out.plan).toBeDefined();
      expect(out.participatingAgents.length).toBeGreaterThanOrEqual(1);
      expect(response.qualityGates.length).toBeGreaterThan(0);
    });

    it("Scenario D: executes end-to-end Motion Quality Audit against rules and performance checks", async () => {
      const request: AIEcosystemRequest = {
        scenario: "quality-audit",
        goal: "Audit high-frequency hover animations on complex data visualization cards",
        options: {
          motionDNA: "energetic",
        },
      };

      const response = await executeAIEcosystemPipeline(request);

      expect(response.state).toMatch(/success|success_with_warnings/);
      expect(response.scenario).toBe("quality-audit");
      expect(response.output).toBeDefined();

      const out = response.output as any;
      expect(out.workflowId).toBeDefined();
      expect(out.qualityValidation).toBeDefined();
      expect(out.qualityValidation.overallQualityScore).toBeGreaterThanOrEqual(50);
      expect(Array.isArray(response.recommendations)).toBe(true);

      // Verify quality gate score
      expect(response.qualityScore).toBeGreaterThanOrEqual(50);
    });

    it("handles unsupported pipeline scenarios cleanly", async () => {
      const request: AIEcosystemRequest = {
        scenario: "unsupported-scenario" as any,
        goal: "invalid scenario",
      };

      const response = await aiEcosystemPipelineCoordinator.execute(request);

      expect(response.state).toBe("failed_execution");
      expect(response.error).toMatch(/unknown ai ecosystem scenario/i);
    });
  });

  describe("4. Architectural & Safety Boundaries", () => {
    it("operates 100% deterministically and offline without network or external LLM requirements", () => {
      expect((deterministicLocalAIProvider as any).apiKey).toBeUndefined();
      expect((deterministicLocalAIProvider as any).apiEndpoint).toBeUndefined();
      expect(deterministicLocalAIProvider.isLocal).toBe(true);
    });

    it("maintains executionId and telemetry throughout request lifecycles", async () => {
      const request: AIEcosystemRequest = {
        scenario: "quality-audit",
        goal: "audit trace verification",
      };

      const response = await aiEcosystemPipelineCoordinator.execute(request);

      expect(typeof response.executionId).toBe("string");
      expect(response.executionId.length).toBeGreaterThan(0);
      expect(response.telemetry.durationMs).toBeGreaterThanOrEqual(0);
      expect(response.telemetry.providerId).toBe("deterministic-local");
      expect(typeof response.telemetry.startTime).toBe("number");
      expect(typeof response.telemetry.endTime).toBe("number");
    });
  });
});
