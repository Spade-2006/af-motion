/**
 * AF Motion — Agent Registry (Phase 18, Prompt 144)
 *
 * Provides a modular, thread-safe registry for discovering, registering,
 * inspecting, and querying specialized AI Agents in AF Motion.
 */

import type {
  AgentCapability,
  AgentCategory,
  AgentDefinition,
  AgentInputType,
  AgentMetadata,
} from "./types.js";

export class AgentRegistry {
  private readonly agents = new Map<string, AgentDefinition>();

  public register(agent: AgentDefinition): void {
    if (!agent || !agent.metadata || !agent.metadata.id) {
      throw new Error("Cannot register invalid agent: missing metadata.id");
    }
    if (this.agents.has(agent.metadata.id)) {
      throw new Error(`Agent with ID "${agent.metadata.id}" is already registered`);
    }
    if (!Array.isArray(agent.metadata.capabilities) || agent.metadata.capabilities.length === 0) {
      throw new Error(`Agent "${agent.metadata.id}" must declare at least one capability`);
    }
    if (typeof agent.execute !== "function") {
      throw new Error(`Agent "${agent.metadata.id}" must provide an execute() implementation`);
    }

    this.agents.set(agent.metadata.id, agent);
  }

  public unregister(agentId: string): boolean {
    return this.agents.delete(agentId);
  }

  public get(agentId: string): AgentDefinition | undefined {
    return this.agents.get(agentId);
  }

  public has(agentId: string): boolean {
    return this.agents.has(agentId);
  }

  public list(): AgentMetadata[] {
    return Array.from(this.agents.values()).map((a) => ({ ...a.metadata }));
  }

  public findByCategory(category: AgentCategory): AgentDefinition[] {
    return Array.from(this.agents.values()).filter(
      (a) => a.metadata.category === category
    );
  }

  public findByCapability(capability: AgentCapability): AgentDefinition[] {
    return Array.from(this.agents.values()).filter((a) =>
      a.metadata.capabilities.includes(capability)
    );
  }

  public findByInputType(inputType: AgentInputType): AgentDefinition[] {
    return Array.from(this.agents.values()).filter((a) =>
      a.metadata.acceptedInputTypes.includes(inputType)
    );
  }

  public clear(): void {
    this.agents.clear();
  }

  public get size(): number {
    return this.agents.size;
  }
}

export const agentRegistry = new AgentRegistry();
