#!/usr/bin/env node

/**
 * AF Motion Model Context Protocol (MCP) Stdio Server
 *
 * Standalone executable entrypoint running the AF Motion MCP server over standard input/output.
 * Compatible with Cursor, Claude Desktop, Claude Code, Antigravity, and Codex.
 */

import { createAFMotionMCPServer, StdioTransport } from "../dist/catalogue.js";

const transport = new StdioTransport();
const server = createAFMotionMCPServer({ transport });

const cleanup = async () => {
  await server.close();
  process.exit(0);
};

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
