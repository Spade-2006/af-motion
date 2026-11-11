/**
 * AF Motion Model Context Protocol (MCP) Contracts
 *
 * Typed contracts for MCP server initialization, JSON-RPC 2.0 transport,
 * tools, resources, and prompt discovery conforming to the MCP specification.
 */

export const AF_MOTION_MCP_VERSION = "1.0.0";
export const MCP_PROTOCOL_VERSION = "2024-11-05";

export interface JSONRPCRequest {
  readonly jsonrpc: "2.0";
  readonly id?: string | number | null;
  readonly method: string;
  readonly params?: Record<string, unknown>;
}

export interface JSONRPCResponse {
  readonly jsonrpc: "2.0";
  readonly id: string | number | null;
  readonly result?: unknown;
  readonly error?: {
    readonly code: number;
    readonly message: string;
    readonly data?: unknown;
  };
}

export interface JSONRPCNotification {
  readonly jsonrpc: "2.0";
  readonly method: string;
  readonly params?: Record<string, unknown>;
}

export interface MCPTool {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: {
    readonly type: "object";
    readonly properties?: Record<string, unknown>;
    readonly required?: readonly string[];
    readonly [key: string]: unknown;
  };
}

export interface MCPToolContent {
  readonly type: "text";
  readonly text: string;
}

export interface MCPToolResult {
  readonly content: readonly MCPToolContent[];
  readonly isError?: boolean;
}

export interface MCPResource {
  readonly uri: string;
  readonly name: string;
  readonly description?: string;
  readonly mimeType?: string;
}

export interface MCPResourceContent {
  readonly uri: string;
  readonly mimeType?: string;
  readonly text?: string;
  readonly blob?: string;
}

export interface MCPPromptArgument {
  readonly name: string;
  readonly description?: string;
  readonly required?: boolean;
}

export interface MCPPrompt {
  readonly name: string;
  readonly description?: string;
  readonly arguments?: readonly MCPPromptArgument[];
}

export interface MCPPromptMessage {
  readonly role: "user" | "assistant";
  readonly content: {
    readonly type: "text";
    readonly text: string;
  };
}

export interface MCPTransport {
  send(message: JSONRPCResponse | JSONRPCNotification): Promise<void>;
  onMessage(handler: (message: JSONRPCRequest) => Promise<void>): void;
  close(): Promise<void>;
}

export interface MCPServerOptions {
  readonly name?: string;
  readonly version?: string;
  readonly transport?: MCPTransport;
}

export interface MCPServerInfo {
  readonly name: string;
  readonly version: string;
  readonly protocolVersion: string;
  readonly capabilities: {
    readonly tools?: Record<string, unknown>;
    readonly resources?: Record<string, unknown>;
    readonly prompts?: Record<string, unknown>;
  };
}
