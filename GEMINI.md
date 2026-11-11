# AF Motion — Antigravity Agent Guidelines

You are an expert pair programming agent operating in a repository powered by **AF Motion**, a framework-independent web motion engine with React bindings, 19 visual design styles, 33 built-in palettes, 2D/3D graphics synchronization, and an AI-native Motion Intelligence system.

---

## 1. Skill Discovery & Routing

All official guidelines, workflows, and verified examples live under `skills/`:
- **Master Router**: `skills/af-motion/SKILL.md`
- **Foundations & Imports**: `skills/fundamentals/SKILL.md`
- **React Animation Development**: `skills/react-animation/SKILL.md`
- **Motion Intelligence & DNA**: `skills/motion-intelligence/SKILL.md`
- **Visual Styles & Palettes**: `skills/visual-styles/SKILL.md`
- **Transitions & Scroll Storytelling**: `skills/transitions-scroll/SKILL.md`
- **Microinteractions & Spring UI**: `skills/interactive-components/SKILL.md`
- **Choreography & Multi-System Sync**: `skills/choreography-sync/SKILL.md`
- **Canvas & Shaders**: `skills/graphics-effects/SKILL.md`
- **3D Scene Engine**: `skills/3d-scene-development/SKILL.md`
- **Motion Validation & Audit**: `skills/motion-validation/SKILL.md`
- **AI Composition**: `skills/ai-generation/SKILL.md`
- **MCP Server**: `skills/mcp-integration/SKILL.md`

Always inspect `skills/index.json` or the relevant `SKILL.md` before generating code.

---

## 2. Antigravity Agent Workflow

Follow the 9-step workflow documented in `integrations/antigravity/workflow.md`:
1. **Understand Visual Result**: Identify trigger, target element, and emotional resonance.
2. **Discover Capabilities**: Query AF Motion skills or MCP tools before writing code.
3. **Select Style & DNA**: Choose from 19 styles (e.g. `minimal`, `glassmorphism`, `cyberpunk`) and 5 Motion DNA profiles (`precise`, `playful`, `elegant`, `energetic`, `editorial-flow`).
4. **Inspect Existing Architecture**: Check Next.js client component boundaries (`"use client";`).
5. **Generate AF Motion Configs**: Use `recommendAnimation()` or presets (`listPresets()`, `applyPreset()`).
6. **Compose Multi-System Motion**: Coordinate DOM, Canvas, and 3D scenes.
7. **Validate Accessibility & Performance**: Check `useMotionAccessibility()` and enforce GPU transforms.
8. **Preserve Existing UI**: Maintain documentation, comments, and unrelated application code.
9. **Verify & Report**: Confirm TypeScript compilation and summarize decisions.

---

## 3. Strict Package Subpaths

Only import from official subpaths:
```tsx
// Core Animation Primitives & Backgrounds
import { animate, animateSpring, easings, aurora, particleField, tilt } from "af-motion";

// React Hooks & Components
import { useAnimate, useInView, Reveal, Interactive, useMicrointeraction, useMotionAccessibility, GlassSurface } from "af-motion/react";

// Intelligence, Registries & Validation
import { aiMotionRegistry, visualStyleRegistry, recommendAnimation, validateMotionConfig } from "af-motion/catalogue";

// Standard Presets & Recipes
import { listPresets, applyPreset } from "af-motion/presets";
```

---

## 4. Troubleshooting & Error Recovery

- Check `prefers-reduced-motion` using `useMotionAccessibility()`.
- Animate only `transform` and `opacity`. Never animate layout properties.
- Ensure `bin/mcp-server.js` is built with `npm run build` before connecting via MCP.
