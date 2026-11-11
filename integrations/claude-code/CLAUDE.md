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

## 3. Example Workflows

### A. React Animation & Stagger
```tsx
"use client";

import React from "react";
import { Reveal } from "af-motion/react";

export function HeroHeadline({ text }: { text: string }) {
  return (
    <Reveal effect="fade-up" duration={450}>
      <h1 className="text-4xl font-extrabold">{text}</h1>
    </Reveal>
  );
}
```

### B. Visual Styles & Frosted Surfaces
```tsx
"use client";

import React from "react";
import { GlassSurface } from "af-motion/react";

export function MetricsGlassCard() {
  return (
    <GlassSurface className="p-6 rounded-2xl">
      <h3 className="font-bold">Throughput</h3>
      <p className="text-2xl font-mono">1.2M ops/sec</p>
    </GlassSurface>
  );
}
```

### C. Ambient Aurora Canvas Background
```tsx
"use client";

import React, { useEffect, useRef } from "react";
import { aurora } from "af-motion";

export function AuroraHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const controls = aurora({
      canvas: canvasRef.current,
      colors: ["#6366f1", "#a855f7", "#ec4899"],
      speed: 0.7,
    });
    return () => controls.destroy();
  }, []);

  return <canvas ref={canvasRef} className="w-full h-96 block" />;
}
```

---

## 4. MCP Server Integration

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
