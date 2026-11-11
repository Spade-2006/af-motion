# AF Motion — Cursor Integration

This guide provides instructions for configuring **Cursor** with AF Motion rules, skills, and MCP tools.

---

## 1. Quick Setup

Cursor supports project rules via `.cursor/rules/*.mdc` and `.cursorrules`.

### Modern Cursor (.cursor/rules/)
Place `af-motion.mdc` into `.cursor/rules/`:
```bash
mkdir -p .cursor/rules
cp integrations/cursor/rules/af-motion.mdc .cursor/rules/
```

### Legacy Cursor (.cursorrules)
Copy the root `.cursorrules`:
```bash
cp integrations/cursor/.cursorrules .cursorrules
```

---

## 2. Cursor MCP Server Setup

To enable Cursor to discover and validate AF Motion capabilities automatically:

1. Open **Cursor Settings** (`Cmd+,` or `Ctrl+,`).
2. Navigate to **Features** > **MCP Servers**.
3. Click **Add New MCP Server**:
   - **Name**: `af-motion`
   - **Type**: `command`
   - **Command**: `node bin/mcp-server.js`
4. Alternatively, create `.cursor/mcp.json` in your workspace:
   ```json
   {
     "mcpServers": {
       "af-motion": {
         "command": "node",
         "args": ["bin/mcp-server.js"]
       }
     }
   }
   ```

---

## 3. Recommended Prompts for Cursor Chat / Composer

- **Card Stagger**: "Using `skills/react-animation/SKILL.md`, build a responsive feature grid where cards fade up with 60ms stagger."
- **Spring Interaction**: "Refer to `skills/interactive-components/SKILL.md` to implement a tactile spring button."
- **Theme Palette**: "Using `skills/visual-styles/SKILL.md`, activate the `nordic-frost` palette across our dashboard components."
- **Audit**: "Call the `validate_motion` MCP tool on this animation config to detect layout thrashing."

---

## 4. Uninstallation / Removal

To remove Cursor rules and MCP settings:
- Delete `.cursor/rules/af-motion.mdc` and `.cursorrules`.
- Remove `af-motion` from **Cursor Settings** > **MCP Servers** (or delete `.cursor/mcp.json`).
