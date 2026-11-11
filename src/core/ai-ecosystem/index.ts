/**
 * AF Motion — AI Ecosystem Integration (Phase 18, Prompt 146)
 *
 * Unified entry point for the integrated AF Motion AI Ecosystem:
 * - Unified AI Capability Registry
 * - End-to-End Pipeline Coordinator
 * - Hardened Deterministic Local Provider
 * - Cross-System Quality Gates & Scenario Execution
 */

export {
  AI_ECOSYSTEM_SPEC_VERSION,
  type AICapabilityCategory,
  type AICapabilityId,
  type AICapabilityDescriptor,
  type AIEcosystemScenario,
  type AIEcosystemResultState,
  type AIEcosystemRequest,
  type AIEcosystemResponse,
  type IAIEcosystemProvider,
} from "./types.js";

export {
  UNIFIED_AI_CAPABILITIES,
  AIEcosystemCapabilityRegistry,
  aiEcosystemCapabilityRegistry,
  listAICapabilities,
  getAICapability,
  queryAICapabilities,
} from "./capability-registry.js";

export {
  DeterministicLocalAIProvider,
  deterministicLocalAIProvider,
} from "./provider.js";

export {
  AIEcosystemPipelineCoordinator,
  aiEcosystemPipelineCoordinator,
  executeAIEcosystemPipeline,
} from "./pipeline.js";
