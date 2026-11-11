import { parseSafeJson } from "../core/utils/safe-json.js";

declare const process: {
  stdin?: {
    setEncoding(enc: string): void;
    on(event: string, listener: (chunk: string) => void): void;
    off?(event: string, listener: (chunk: string) => void): void;
  };
  stdout?: {
    write(chunk: string): boolean;
  };
} | undefined;

const MAX_STDIO_BUFFER_CHARS = 1024 * 1024;

/**
 * AF Motion MCP Transports
 *
 * Pluggable transports for MCP communication: in-memory channel for tests/embedding,
 * and standard I/O (stdio) transport for external CLI/daemon processes.
 */

import type {
  JSONRPCNotification,
  JSONRPCRequest,
  JSONRPCResponse,
  MCPTransport,
} from "./types.js";

/**
 * In-memory transport for testing, direct in-process agent execution, and embedding.
 */
export class InMemoryTransport implements MCPTransport {
  private serverHandler: ((message: JSONRPCRequest) => Promise<void>) | null = null;
  private clientHandler: ((message: JSONRPCResponse | JSONRPCNotification) => void) | null = null;
  private closed = false;

  public onMessage(handler: (message: JSONRPCRequest) => Promise<void>): void {
    this.serverHandler = handler;
  }

  public onClientMessage(handler: (message: JSONRPCResponse | JSONRPCNotification) => void): void {
    this.clientHandler = handler;
  }

  public async send(message: JSONRPCResponse | JSONRPCNotification): Promise<void> {
    if (this.closed) throw new Error("Transport is closed");
    if (this.clientHandler) {
      this.clientHandler(message);
    }
  }

  public async sendToServer(request: JSONRPCRequest): Promise<void> {
    return this.sendFromClient(request);
  }

  public async sendFromClient(request: JSONRPCRequest): Promise<void> {
    if (this.closed) throw new Error("Transport is closed");
    if (this.serverHandler) {
      await this.serverHandler(request);
    }
  }

  public async close(): Promise<void> {
    this.closed = true;
    this.serverHandler = null;
    this.clientHandler = null;
  }
}

/**
 * Standard I/O (stdio) transport reading newline-delimited JSON from stdin and writing to stdout.
 */
export class StdioTransport implements MCPTransport {
  private messageHandler: ((message: JSONRPCRequest) => Promise<void>) | null = null;
  private closed = false;
  private dataListener: ((chunk: string) => void) | null = null;

  constructor() {
    if (typeof process !== "undefined" && process.stdin && process.stdout) {
      let buffer = "";

      process.stdin.setEncoding("utf8");
      this.dataListener = async (chunk: string) => {
        if (this.closed) return;
        if (buffer.length + chunk.length > MAX_STDIO_BUFFER_CHARS) {
          buffer = "";
          return;
        }
        buffer += chunk;
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const parsed = parseSafeJson<JSONRPCRequest>(trimmed, { maxLength: MAX_STDIO_BUFFER_CHARS });
            if (this.messageHandler) {
              await this.messageHandler(parsed);
            }
          } catch {
            // Ignore parse errors or oversized invalid lines
          }
        }
      };
      process.stdin.on("data", this.dataListener);
    }
  }

  public onMessage(handler: (message: JSONRPCRequest) => Promise<void>): void {
    this.messageHandler = handler;
  }

  public async send(message: JSONRPCResponse | JSONRPCNotification): Promise<void> {
    if (this.closed) throw new Error("StdioTransport is closed");
    if (typeof process !== "undefined" && process.stdout) {
      process.stdout.write(JSON.stringify(message) + "\n");
    }
  }

  public async close(): Promise<void> {
    this.closed = true;
    this.messageHandler = null;
    if (this.dataListener && typeof process !== "undefined" && process.stdin?.off) {
      process.stdin.off("data", this.dataListener);
    }
    this.dataListener = null;
  }
}
