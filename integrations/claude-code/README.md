# AF Motion — Claude Code & Claude Desktop Integration

This guide provides step-by-step instructions for integrating AF Motion with **Claude Code** (CLI) and **Claude Desktop**.

---

## 1. Project Instructions (CLAUDE.md)

Claude Code automatically consumes `CLAUDE.md` in the root of the repository.

- The file instructs Claude to inspect `skills/index.json` and follow the 10-step agent workflow.
- It specifies exact package subpaths to prevent import hallucinations.

---

## 2. MCP Server Configuration

### Claude Code CLI
Register the AF Motion MCP server with Claude Code by running:

```bash
claude mcp add af-motion node bin/mcp-server.js
```

To verify the connection:
```bash
claude mcp list
```

### Claude Desktop
Add the AF Motion server entry to your Claude Desktop configuration file:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "af-motion": {
      "command": "node",
      "args": ["<PATH_TO_REPO>/bin/mcp-server.js"]
    }
  }
}
```

---

## 3. Capabilities Available to Claude

Once connected via MCP, Claude can call 15 tools:
- `discover_capabilities`, `search_capabilities`, `get_capability_details`
- `list_visual_styles`, `list_motion_dna`, `interpret_motion_prompt`
- `generate_animation`, `generate_transition`, `generate_scroll_animation`
- `generate_microinteraction`, `generate_choreography`, `generate_3d_scene`
- `validate_motion`, `optimize_motion`, `correct_configuration`

---

## 4. Uninstallation / Removal

To disconnect Claude:
- Claude Code: `claude mcp remove af-motion`
- Claude Desktop: Remove the `"af-motion"` entry from `claude_desktop_config.json`.
