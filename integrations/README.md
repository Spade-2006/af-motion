# AF Motion — Agent Integrations

This directory provides official integrations for external AI coding agents and development environments, allowing them to discover and use **AF Motion** capabilities naturally within their workflows.

---

## 1. Supported Agent Environments

| Environment | Scope & Mode | Config & Instruction Files | MCP Server Support |
| :--- | :--- | :--- | :--- |
| **Google Antigravity** | Workspace Agent | `GEMINI.md`, `mcp_config.json`, `integrations/antigravity/workflow.md` | Yes (workspace stdio & in-memory) |
| **Visual Studio Code** | IDE & AI Extensions | `.vscode/`, `.github/copilot-instructions.md`, `.vscode/mcp.json` | Yes (Cline, Roo Code, Continue) |
| **OpenAI Codex** | Coding Agent | `AGENTS.md`, `integrations/codex/config.json` | Yes (`bin/mcp-server.js`) |
| **Claude Code** | CLI & Desktop | `CLAUDE.md`, `claude-desktop-config.json` | Yes (`claude mcp add`) |
| **Cursor IDE** | AI Editor & Composer | `.cursorrules`, `.cursor/rules/af-motion.mdc`, `.cursor/mcp.json` | Yes (Cursor MCP) |

---

## 2. Shared Architecture & Single Source of Truth

All agent integrations point directly to the single source of truth:
- **Skills Directory**: `skills/` (13 modular skills with `skills/index.json`)
- **MCP Server**: `bin/mcp-server.js` (exposing 15 tools, 6 resources, and 6 prompts)
- **Shared Manifest**: `integrations/manifest.json`

No agent configuration duplicates underlying skill instructions or capability schemas.

---

## 3. Quickstart Guides

- **Google Antigravity**: See [`integrations/antigravity/README.md`](file:///integrations/antigravity/README.md)
- **Visual Studio Code**: See [`integrations/vscode/README.md`](file:///integrations/vscode/README.md)
- **OpenAI Codex**: See [`integrations/codex/README.md`](file:///integrations/codex/README.md)
- **Claude Code**: See [`integrations/claude-code/README.md`](file:///integrations/claude-code/README.md)
- **Cursor IDE**: See [`integrations/cursor/README.md`](file:///integrations/cursor/README.md)

---

## 4. Verification

Run automated tests validating all agent integration configs, MCP entrypoints, and skill links:

```bash
npx vitest run tests/integrations.test.ts
```
