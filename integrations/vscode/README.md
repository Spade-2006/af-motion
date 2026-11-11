# AF Motion — Visual Studio Code & Extension Integration

This guide explains how to configure and use **Visual Studio Code** and compatible AI coding extensions with AF Motion.

---

## 1. Native VS Code vs. AI Extensions

It is essential to distinguish native VS Code functionality from the AI extensions running inside it:

| Feature / Extension | Scope | How It Consumes AF Motion |
| :--- | :--- | :--- |
| **Native VS Code Editor** | Workspace Editor | TypeScript definitions (`dist/*.d.ts`), tasks (`.vscode/tasks.json`), formatters, and snippets. |
| **GitHub Copilot Chat** | AI Extension | Reads `.github/copilot-instructions.md` and workspace code context. |
| **Continue.dev** | AI Extension (Open Source) | Uses `.vscode/mcp.json` or `config.json` for custom MCP servers and prompt files. |
| **Cline / Roo Code** | AI Autonomous Agent | Direct MCP server integration via `.vscode/mcp.json` or extension UI. |
| **Claude Dev** | AI Extension | Uses standard stdio MCP servers via command invocation (`node bin/mcp-server.js`). |

---

## 2. Workspace Setup

When you open this repository in VS Code:
1. **Workspace Settings**: `.vscode/settings.json` automatically sets CRLF line endings, enables the workspace TypeScript SDK, and configures `.mdc` file associations.
2. **Recommended Extensions**: `.vscode/extensions.json` recommends ESLint, Prettier, Tailwind CSS, and GitHub Copilot.
3. **Build & Test Tasks**: `.vscode/tasks.json` provides standard tasks accessible via `Ctrl+Shift+B` (or `Cmd+Shift+B` on macOS):
   - `Build AF Motion` (`npm run build`)
   - `Run Tests` (`npm test`)
   - `Start MCP Stdio Server` (`node bin/mcp-server.js`)

---

## 3. Connecting the MCP Server in VS Code

For extensions supporting MCP servers (such as Cline, Roo Code, Continue, or Claude Dev):

### Automatic Setup (.vscode/mcp.json)
The repository includes `.vscode/mcp.json`:
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

### Manual Extension Setup
If your extension requires manual configuration:
- **Server Name**: `af-motion`
- **Transport Type**: `stdio`
- **Command**: `node`
- **Args**: `["<WORKSPACE_ROOT>/bin/mcp-server.js"]`

---

## 4. Skill Discovery Workflow in VS Code

AI agents in VS Code should query the 13 modular skills under `skills/`:
- **Master Router**: `skills/af-motion/SKILL.md`
- **React Components & Hooks**: `skills/react-animation/SKILL.md`
- **Visual Styles & Palettes**: `skills/visual-styles/SKILL.md`
- **Transitions & Scroll**: `skills/transitions-scroll/SKILL.md`
- **Microinteractions**: `skills/interactive-components/SKILL.md`
- **3D Scenes**: `skills/3d-scene-development/SKILL.md`

### Example Prompts for VS Code AI Agents
- **Button Microinteraction**: "Read `skills/interactive-components/SKILL.md` and implement an accessible spring button using `<Interactive>`."
- **Scroll Reveal**: "Read `skills/react-animation/SKILL.md` and create a responsive feature grid using `<Reveal>`."
- **Performance Audit**: "Call the `validate_motion` MCP tool on this animation config to detect layout thrashing."

---

## 5. Troubleshooting & Recovery

| Issue | Cause | Fix |
| :--- | :--- | :--- |
| TypeScript errors on `af-motion/react` imports | Using old global TypeScript instead of workspace SDK | Run `TypeScript: Select TypeScript Version` > `Use Workspace Version` in the Command Palette. |
| MCP tool calling fails | `bin/mcp-server.js` cannot locate `dist/catalogue.js` | Run the VS Code task `Build AF Motion` or `npm run build` in the terminal. |
| Copilot ignores motion guidelines | Workspace instructions not found | Verify `.github/copilot-instructions.md` exists in the repository root. |

---

## 6. Removal / Clean Up

To remove VS Code workspace settings:
- Delete `.vscode/` from the repository root.
- Global VS Code settings in your user directory are completely untouched.
