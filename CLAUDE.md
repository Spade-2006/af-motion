# AF Motion — Claude Code Project Instructions

This repository uses **AF Motion**, a high-performance web motion engine with React bindings, 19 visual design styles, 33 built-in palettes, and an AI-native Motion Intelligence system.

---

## 1. Skill Discovery & Routing

All motion capabilities and code examples are documented under `skills/`:
- **Master Routing**: `skills/af-motion/SKILL.md`
- **Foundations & Imports**: `skills/fundamentals/SKILL.md`
- **React Components & Hooks**: `skills/react-animation/SKILL.md`
- **Motion Intelligence & DNA**: `skills/motion-intelligence/SKILL.md`
- **19 Visual Styles & Palettes**: `skills/visual-styles/SKILL.md`
- **Transitions & Scroll**: `skills/transitions-scroll/SKILL.md`
- **Microinteractions**: `skills/interactive-components/SKILL.md`
- **Choreography & Multi-System**: `skills/choreography-sync/SKILL.md`
- **Canvas & Shaders**: `skills/graphics-effects/SKILL.md`
- **3D Scene Engine**: `skills/3d-scene-development/SKILL.md`
- **Motion Validation**: `skills/motion-validation/SKILL.md`
- **AI Composition**: `skills/ai-generation/SKILL.md`
- **MCP Server**: `skills/mcp-integration/SKILL.md`

Always inspect `skills/index.json` or the relevant `SKILL.md` before generating code.

---

## 2. Agent Workflow Guidelines

When implementing motion tasks with Claude Code:
1. **Never Hallucinate APIs**: Only import verified exports from:
   - `af-motion` (Core animations, easings, and backgrounds)
   - `af-motion/react` (React hooks and components)
   - `af-motion/catalogue` (Intelligence, registries, validation, MCP)
   - `af-motion/presets` (Predefined recipes)
2. **GPU Optimization**: Animate exclusively with `transform` and `opacity`. Never animate `width`, `height`, `top`, or `margin`.
3. **Accessibility**: Always support reduced motion using `useMotionAccessibility()`.
4. **React Next.js Safety**: Include `"use client";` at the top of client component files using hooks.

---

## 3. MCP Server Integration

Claude Code can use the AF Motion MCP server by running:
```bash
claude mcp add af-motion node bin/mcp-server.js
```
Or for Claude Desktop, add to `claude_desktop_config.json`:
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
