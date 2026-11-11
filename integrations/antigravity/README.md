# AF Motion — Google Antigravity Integration

This guide provides instructions for configuring **Google Antigravity** to discover and use AF Motion capabilities, skills, and MCP tools natively within your workspace.

---

## 1. Antigravity Customization Architecture

Antigravity discovers customizations across two distinct scopes:
1. **Workspace Scope** (Checked into version control):
   - Project Rules: `GEMINI.md` and `AGENTS.md` in repository root.
   - Project Skills: `skills/<name>/SKILL.md` in repository root.
   - MCP Server: `mcp_config.json` in repository root.
2. **Global Scope** (Machine-local user configuration):
   - Global Config: `~/.gemini/config/`
   - Global Skills: `~/.gemini/antigravity/skills/<name>/SKILL.md`
   - Global Rules: `~/.gemini/antigravity/rules/`

AF Motion is configured at the **workspace scope**, so any developer or agent cloning this repository immediately has full access to AF Motion instructions and skills without manual global machine edits.

---

## 2. Skill Discovery & Registration

Antigravity progressively discovers skills on demand:
- The master router is [skills/af-motion/SKILL.md](file:///skills/af-motion/SKILL.md).
- The discovery index is [skills/index.json](file:///skills/index.json), which maps trigger keywords to corresponding skill folders.
- Antigravity automatically mounts skills found in `skills/` whenever motion, animation, styling, or 3D scene keywords are detected in user requests.

---

## 3. MCP Server Configuration

To connect the AF Motion MCP server in Antigravity:
1. The repository root contains `mcp_config.json`:
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
2. When running Antigravity CLI or IDE with tool execution enabled, the agent gains direct access to 15 tools (e.g. `discover_capabilities`, `recommend_animation`, `validate_motion`) and 6 resources (`af-motion://visual-styles`, `af-motion://palettes`).

---

## 4. Visual Style & Motion DNA Selection

Antigravity agents should refer to:
- **Visual Styles**: [skills/visual-styles/SKILL.md](file:///skills/visual-styles/SKILL.md) for 19 styles (e.g. `minimal`, `glassmorphism`, `cyberpunk`, `editorial`, `brutalist`) and 33 palettes.
- **Motion DNA**: [skills/motion-intelligence/SKILL.md](file:///skills/motion-intelligence/SKILL.md) for 5 personalities (`precise`, `playful`, `elegant`, `energetic`, `editorial-flow`).

---

## 5. Troubleshooting & Recovery

| Issue | Cause | Fix |
| :--- | :--- | :--- |
| MCP tool calling fails | MCP server executable not built | Run `npm run build` so `dist/catalogue.js` is built before running `bin/mcp-server.js`. |
| Skills not activating | Query phrasing does not match triggers | Check `skills/index.json` triggers or explicitly mention `@af-motion`. |
| Hydration mismatch in Next.js | Client animation running on server | Ensure `"use client";` is present at the top of the animated component file. |

---

## 6. Uninstallation / Removal

To remove Antigravity workspace integration:
- Delete `GEMINI.md` and `mcp_config.json` from the repository root.
- The repository will continue to function normally as a standard npm package.
