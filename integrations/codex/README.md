# AF Motion — OpenAI Codex Integration

This guide explains how OpenAI Codex and Codex-based developer tools can discover and use AF Motion capabilities.

---

## 1. Quick Setup

Codex automatically detects repository context from `AGENTS.md` and `skills/index.json`.

1. Ensure `AGENTS.md` exists in your project root (or reference `integrations/codex/AGENTS.md`).
2. When prompting Codex, reference the relevant skill:
   > "Using AF Motion's `skills/interactive-components/SKILL.md`, implement a spring hover button."

---

## 2. MCP Server Setup for Codex Tools

If your Codex environment supports Model Context Protocol (MCP) servers:

Add the following to your Codex / tool configuration:

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

This exposes 15 tools (e.g. `discover_capabilities`, `recommend_animation`, `validate_motion`) directly to the model.

---

## 3. Example Prompts for Codex

| Task | Prompt Example |
| :--- | :--- |
| **Card Entrance** | "Read `skills/react-animation/SKILL.md` and create a staggered card grid using `<Reveal>` in Next.js." |
| **Button Microinteraction** | "Read `skills/interactive-components/SKILL.md` and add spring press and hover feedback to our CTA button." |
| **Scroll Storytelling** | "Read `skills/transitions-scroll/SKILL.md` and create a sticky hero section tracking `useScrollProgress`." |
| **Animation Audit** | "Audit this motion config with `validateMotionConfig` from `af-motion/catalogue` to check for layout thrashing." |

---

## 4. Uninstallation / Removal

To remove the Codex integration:
- Delete `AGENTS.md` and `integrations/codex/`.
- No global system files or background processes are affected.
