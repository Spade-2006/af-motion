---
name: mcp-integration
description: Guide for integrating and interacting with AF Motion via the Model Context Protocol (MCP). Use this skill when configuring the MCP server, discovering tools and resources, executing AI coding agent workflows via JSON-RPC 2.0, or setting up stdio/in-memory transports for IDEs like Cursor, Claude Desktop, and Antigravity.
metadata:
  version: "1.0.0"
  category: "mcp"
  author: "AF Motion Team"
---

# Model Context Protocol (MCP) Integration

AF Motion exposes a standardized Model Context Protocol (MCP) interface allowing external AI coding agents, IDEs, and LLM tool chains to discover, configure, generate, and validate motion capabilities through JSON-RPC 2.0.

---

## 1. When to Use & When NOT to Use

### When to Use
- When connecting AF Motion to external coding assistants (Claude Desktop, Cursor, Antigravity, Gemini CLI).
- When executing motion generation, style lookups, and validation tools over a standardized protocol.
- When querying read-only source-of-truth resources (`af-motion://catalogue`, `af-motion://visual-styles`).
- When running automated prompt templates (`react-animation-system`, `scroll-storytelling`).

### When NOT to Use
- In standard React front-end components (use `af-motion/react`).
- When building client-side web applications directly in code.

---

## 2. Step-by-Step Agent Workflow & Architecture

AF Motion provides two transports:
1. **`StdioTransport`**: Reads newline-delimited JSON-RPC from `stdin` and writes responses to `stdout`. Used for standalone server processes and IDE extensions.
2. **`InMemoryTransport`**: In-process channel for unit testing, embedded agents, or server-side workflows.

---

## 3. Standard MCP Capabilities

### 3.1 Exposed MCP Tools (15 Tools)

| Tool | Purpose |
| :--- | :--- |
| `discover_capabilities` | Enumerate available capabilities filtered by category |
| `search_capabilities` | Full-text and tag search across capabilities |
| `get_capability_details` | Retrieve complete schema, signatures, and parameter documentation |
| `list_visual_styles` | Enumerate all 19 visual styles with tokens |
| `list_motion_dna` | Inspect built-in Motion DNA personality profiles |
| `interpret_motion_prompt` | Parse natural language instructions into structured motion intents |
| `generate_animation` | Generate recommended animation plan based on component type and context |
| `generate_transition` | Generate entrance, exit, or page transition plans |
| `generate_scroll_animation` | Generate scroll reveals, parallax layers, or storytelling sequences |
| `generate_microinteraction` | Generate button, card, or input microinteraction parameters |
| `generate_choreography` | Orchestrate sequential or parallel multi-element sequences |
| `generate_3d_scene` | Generate validated 3D scene specifications from descriptions |
| `validate_motion` | Analyze motion configs for performance and accessibility defects |
| `optimize_motion` | Auto-correct layout properties and bound timing parameters |
| `correct_configuration` | Sanitize invalid parameters against capability schemas |

### 3.2 Standard MCP Resources (6 URIs)

- `af-motion://catalogue`: Complete JSON list of registered capabilities.
- `af-motion://categories`: List of all capability categories.
- `af-motion://visual-styles`: Full registry of 19 visual styles and design tokens.
- `af-motion://motion-dna`: Specification of Motion DNA profiles.
- `af-motion://design-systems`: Reusable design systems, curves, and timings.
- `af-motion://palettes`: All 33 built-in AF Motion palettes and CSS variable tokens.

### 3.3 Guided MCP Prompts (6 Prompts)

- `react-animation-system`: Guided prompt for configuring a full React motion system.
- `visual-style-page`: Generates landing page animations adhering to an aesthetic genre.
- `scroll-storytelling`: Orchestrates scroll-linked visual storytelling.
- `interactive-components`: Creates microinteractions for buttons, inputs, and cards.
- `cross-system-choreography`: Synchronizes DOM, SVG canvas, and 3D scenes.
- `validate-and-optimize`: Inspects, repairs, and optimizes existing animations.

---

## 4. Copyable Implementation Examples

### Example A: Running an In-Memory MCP Server
```ts
import {
  createAFMotionMCPServer,
  InMemoryTransport,
} from "af-motion/catalogue";

// 1. Initialize Transport & Server
const transport = new InMemoryTransport();
const server = createAFMotionMCPServer({ transport });

// 2. Client listens for responses
transport.onClientMessage((response) => {
  console.log("Received MCP Response:", response);
});

// 3. Send JSON-RPC request to execute a tool
await transport.sendToServer({
  jsonrpc: "2.0",
  id: 1,
  method: "tools/call",
  params: {
    name: "list_visual_styles",
    arguments: {},
  },
});

// 4. Clean up
await server.close();
```

### Example B: Standalone Stdio Server for Cursor / Claude Desktop
```ts
import {
  createAFMotionMCPServer,
  StdioTransport,
} from "af-motion/catalogue";

// Connect to process stdin / stdout
const transport = new StdioTransport();
const server = createAFMotionMCPServer({ transport });

// The server runs continuously listening on stdin
```

---

## 5. Accessibility & Performance Best Practices

- **Zero Heavy SDK Dependencies**: AF Motion's MCP implementation is pure JSON-RPC 2.0 with zero external dependency overhead.
- **Isolate Tool Errors**: Tool execution failures return `{ isError: true, content: [{ type: "text", text: errorMessage }] }` without crashing the JSON-RPC channel.
- **Graceful Shutdown**: Always call `server.close()` or `server.stop()` on SIGTERM or process exit.

---

## 6. Common Pitfalls & Troubleshooting

| Issue | Cause | Fix |
| :--- | :--- | :--- |
| JSON-RPC Error -32600 | Invalid request format | Ensure request includes `"jsonrpc": "2.0"` and a valid `id`. |
| JSON-RPC Error -32601 | Unsupported method name | Supported methods: `initialize`, `ping`, `tools/list`, `tools/call`, `resources/list`, `resources/read`, `prompts/list`, `prompts/get`. |

---

## 7. Related Skills
- [af-motion](file:///skills/af-motion/SKILL.md)
- [fundamentals](file:///skills/fundamentals/SKILL.md)
- [motion-validation](file:///skills/motion-validation/SKILL.md)
