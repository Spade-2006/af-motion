/**
 * AF Motion — Agent Communication Protocol & Message Bus (Phase 18, Prompt 145)
 *
 * Provides a structured, typed message bus for inter-agent communication,
 * message delivery, audit trails, and security validation (no executable code).
 */

import type { AgentMessage, AgentMessageType } from "./orchestration-types.js";
import { hasCircularReference, isPlainObject } from "../utils/safe-json.js";

export const MAX_MESSAGE_PAYLOAD_BYTES = 64 * 1024;
export const MAX_BUS_HISTORY_MESSAGES = 1000;

export class AgentMessageBus {
  private readonly messages: AgentMessage[] = [];
  private sequenceCounter = 0;
  private readonly subscribers = new Set<(msg: AgentMessage) => void>();

  public createMessage(params: {
    workflowId: string;
    senderAgentId: string;
    recipientAgentId: string;
    type: AgentMessageType;
    payload: Record<string, unknown>;
    payloadReference?: string;
  }): AgentMessage {
    // Safety check: Ensure no executable code strings in payload
    this.assertPayloadSafety(params.payload);

    this.sequenceCounter++;
    const message: AgentMessage = {
      id: `msg-${Date.now().toString(36)}-${this.sequenceCounter}`,
      workflowId: params.workflowId,
      senderAgentId: params.senderAgentId,
      recipientAgentId: params.recipientAgentId,
      type: params.type,
      sequenceNumber: this.sequenceCounter,
      timestamp: Date.now(),
      payloadReference: params.payloadReference,
      payload: Object.freeze({ ...params.payload }),
      schemaVersion: "1.0.0",
    };

    return message;
  }

  public dispatch(message: AgentMessage): void {
    if (this.messages.length >= MAX_BUS_HISTORY_MESSAGES) {
      this.messages.shift();
    }
    this.messages.push(message);
    for (const sub of this.subscribers) {
      try {
        sub(message);
      } catch (err) {
        // Log & isolate listener error without crashing dispatch loop
        console.error("Error in AgentMessageBus subscriber:", err);
      }
    }
  }

  public subscribe(handler: (msg: AgentMessage) => void): () => void {
    this.subscribers.add(handler);
    return () => {
      this.subscribers.delete(handler);
    };
  }

  public getMessagesForWorkflow(workflowId: string): AgentMessage[] {
    return this.messages.filter((m) => m.workflowId === workflowId);
  }

  public getMessagesBetween(agentA: string, agentB: string): AgentMessage[] {
    return this.messages.filter(
      (m) =>
        (m.senderAgentId === agentA && m.recipientAgentId === agentB) ||
        (m.senderAgentId === agentB && m.recipientAgentId === agentA) ||
        m.recipientAgentId === "*"
    );
  }

  public clear(): void {
    this.messages.length = 0;
    this.sequenceCounter = 0;
  }

  private assertPayloadSafety(payload: unknown): void {
    if (!isPlainObject(payload)) {
      throw new TypeError("Message payload must be a plain object.");
    }
    if (hasCircularReference(payload)) {
      throw new TypeError("Message payload must not contain circular references.");
    }
    const str = JSON.stringify(payload);
    if (str.length > MAX_MESSAGE_PAYLOAD_BYTES) {
      throw new RangeError(`Message payload exceeds maximum size of ${MAX_MESSAGE_PAYLOAD_BYTES} bytes.`);
    }
    const lower = str.toLowerCase();
    if (
      lower.includes("<script") ||
      lower.includes("javascript:") ||
      lower.includes("eval(") ||
      lower.includes("new function") ||
      lower.includes("process.exit") ||
      lower.includes("\"__proto__\"")
    ) {
      throw new Error("Security violation: Message payload contains prohibited code constructs.");
    }
  }
}

export const agentMessageBus = new AgentMessageBus();
