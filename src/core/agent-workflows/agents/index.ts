/**
 * AF Motion — Specialized Agents Index & Registration (Phase 18, Prompt 144)
 */

import { agentRegistry, AgentRegistry } from "../agent-registry.js";
import { motionIntelligenceAgent } from "./motion-intelligence-agent.js";
import { designToMotionAgent } from "./design-to-motion-agent.js";
import { sceneGenerationAgent } from "./scene-generation-agent.js";
import { performanceOptimizationAgent } from "./performance-agent.js";
import { accessibilityAgent } from "./accessibility-agent.js";
import { compositionAgent } from "./composition-agent.js";

export {
  motionIntelligenceAgent,
  designToMotionAgent,
  sceneGenerationAgent,
  performanceOptimizationAgent,
  accessibilityAgent,
  compositionAgent,
};

export const STANDARD_AGENTS = [
  motionIntelligenceAgent,
  designToMotionAgent,
  sceneGenerationAgent,
  performanceOptimizationAgent,
  accessibilityAgent,
  compositionAgent,
];

export function registerDefaultAgents(registry: AgentRegistry = agentRegistry): void {
  for (const agent of STANDARD_AGENTS) {
    if (!registry.has(agent.metadata.id)) {
      registry.register(agent);
    }
  }
}

// Automatically register default agents on load
registerDefaultAgents();
