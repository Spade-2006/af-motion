/**
 * AF Motion Model Context Protocol (MCP) Server
 *
 * Implements standard MCP server lifecycle, JSON-RPC 2.0 dispatching,
 * tool execution, resource reading, and prompt generation.
 */

import { executeMCPTool, MCP_TOOLS } from "./tools.js";
import { MCP_RESOURCES, readMCPResource } from "./resources.js";
import { getMCPPromptMessages, MCP_PROMPTS } from "./prompts.js";
import type {
  JSONRPCRequest,
  JSONRPCResponse,
  MCPServerInfo,
  MCPServerOptions,
  MCPTransport,
} from "./types.js";
import { AF_MOTION_MCP_VERSION, MCP_PROTOCOL_VERSION } from "./types.js";
import { isPlainObject, sanitizeExternalErrorMessage } from "../core/utils/safe-json.js";

export const MCP_SERVER_INFO: MCPServerInfo = {
  name: "af-motion",
  version: AF_MOTION_MCP_VERSION,
  protocolVersion: MCP_PROTOCOL_VERSION,
  capabilities: {
    tools: { listChanged: false },
    resources: { listChanged: false, subscribe: false },
    prompts: { listChanged: false },
  },
};

export function listMCPTools() {
  return MCP_TOOLS;
}

export function listMCPResources() {
  return MCP_RESOURCES;
}

export function listMCPPrompts() {
  return MCP_PROMPTS;
}

export async function getMCPPrompt(name: string, args: Record<string, string> = {}) {
  const prompt = MCP_PROMPTS.find((p) => p.name === name);
  if (!prompt) throw new Error(`Unknown prompt: '${name}'`);
  const messages = await getMCPPromptMessages(name, args);
  return {
    name: prompt.name,
    description: prompt.description,
    messages,
  };
}

export class AFMotionMCPServer {
  private readonly name: string;
  private readonly version: string;
  private transport?: MCPTransport;
  private isRunning = false;

  constructor(options: MCPServerOptions = {}) {
    this.name = options.name ?? "af-motion";
    this.version = options.version ?? AF_MOTION_MCP_VERSION;
    if (options.transport) {
      void this.start(options.transport);
    }
  }

  public async close(): Promise<void> {
    return this.stop();
  }

  public getInfo(): MCPServerInfo {
    return {
      name: this.name,
      version: this.version,
      protocolVersion: MCP_PROTOCOL_VERSION,
      capabilities: {
        tools: { listChanged: false },
        resources: { listChanged: false, subscribe: false },
        prompts: { listChanged: false },
      },
    };
  }

  public async start(transport?: MCPTransport): Promise<void> {
    if (transport) this.transport = transport;
    if (!this.transport) {
      throw new Error("Cannot start AFMotionMCPServer without a valid MCPTransport");
    }

    this.isRunning = true;
    this.transport.onMessage(async (request) => {
      const response = await this.handleMessage(request);
      if (response && this.transport) {
        await this.transport.send(response);
      }
    });
  }

  public async stop(): Promise<void> {
    this.isRunning = false;
    if (this.transport) {
      await this.transport.close();
      this.transport = undefined;
    }
  }

  public async handleMessage(request: JSONRPCRequest): Promise<JSONRPCResponse | null> {
    if (!isPlainObject(request) || request.jsonrpc !== "2.0" || typeof request.method !== "string") {
      return {
        jsonrpc: "2.0",
        id: isPlainObject(request) && (typeof request.id === "string" || typeof request.id === "number") ? request.id : null,
        error: { code: -32600, message: "Invalid Request: must be a valid JSON-RPC 2.0 request object with string method" },
      };
    }

    const { id = null, method } = request;
    if (request.params !== undefined && !isPlainObject(request.params)) {
      return {
        jsonrpc: "2.0",
        id,
        error: { code: -32602, message: "Invalid params: expected a plain object" },
      };
    }
    const params = request.params ?? {};

    // Handle notifications (no response expected)
    if (method === "notifications/initialized") {
      return null;
    }

    try {
      switch (method) {
        case "initialize": {
          return {
            jsonrpc: "2.0",
            id,
            result: {
              protocolVersion: MCP_PROTOCOL_VERSION,
              serverInfo: {
                name: this.name,
                version: this.version,
              },
              capabilities: {
                tools: {},
                resources: {},
                prompts: {},
              },
            },
          };
        }

        case "ping": {
          return {
            jsonrpc: "2.0",
            id,
            result: {},
          };
        }

        case "tools/list": {
          return {
            jsonrpc: "2.0",
            id,
            result: {
              tools: MCP_TOOLS,
            },
          };
        }

        case "tools/call": {
          const toolName = params.name;
          if (typeof toolName !== "string" || !toolName.trim()) {
            return {
              jsonrpc: "2.0",
              id,
              error: { code: -32602, message: !toolName ? "Missing tool name in tools/call" : "Invalid tool name in tools/call" },
            };
          }
          if (params.arguments !== undefined && !isPlainObject(params.arguments)) {
            return {
              jsonrpc: "2.0",
              id,
              error: { code: -32602, message: "Invalid params: tools/call arguments must be a plain object" },
            };
          }
          const toolArgs = (params.arguments as Record<string, unknown>) ?? {};

          const result = await executeMCPTool(toolName, toolArgs);
          return {
            jsonrpc: "2.0",
            id,
            result,
          };
        }

        case "resources/list": {
          return {
            jsonrpc: "2.0",
            id,
            result: {
              resources: MCP_RESOURCES,
            },
          };
        }

        case "resources/read": {
          const uri = params.uri;
          if (typeof uri !== "string" || !uri.trim()) {
            return {
              jsonrpc: "2.0",
              id,
              error: { code: -32602, message: "Missing or invalid resource uri in resources/read" },
            };
          }

          const content = await readMCPResource(uri);
          return {
            jsonrpc: "2.0",
            id,
            result: {
              contents: [content],
            },
          };
        }

        case "prompts/list": {
          return {
            jsonrpc: "2.0",
            id,
            result: {
              prompts: MCP_PROMPTS,
            },
          };
        }

        case "prompts/get": {
          const promptName = params.name;
          if (typeof promptName !== "string" || !promptName.trim()) {
            return {
              jsonrpc: "2.0",
              id,
              error: { code: -32602, message: "Missing or invalid prompt name in prompts/get" },
            };
          }
          if (params.arguments !== undefined && !isPlainObject(params.arguments)) {
            return {
              jsonrpc: "2.0",
              id,
              error: { code: -32602, message: "Invalid params: prompts/get arguments must be a plain object" },
            };
          }
          const promptArgs = (params.arguments as Record<string, string>) ?? {};

          const messages = await getMCPPromptMessages(promptName, promptArgs);
          return {
            jsonrpc: "2.0",
            id,
            result: {
              messages,
            },
          };
        }

        default: {
          return {
            jsonrpc: "2.0",
            id,
            error: { code: -32601, message: `Method not found: '${method}'` },
          };
        }
      }
    } catch (err) {
      return {
        jsonrpc: "2.0",
        id,
        error: {
          code: -32603,
          message: sanitizeExternalErrorMessage(err, "Internal error"),
        },
      };
    }
  }
}

export function createAFMotionMCPServer(options?: MCPServerOptions): AFMotionMCPServer {
  return new AFMotionMCPServer(options);
}
