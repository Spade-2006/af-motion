# AF Motion — Codex Agent Instructions

You are working in a repository powered by **AF Motion**, a high-performance, framework-independent motion engine with React bindings, 19 visual design styles, 33 built-in palettes, and an AI-native Motion Intelligence system.

---

## 1. Skill Discovery & Routing

All motion capabilities are documented in the `skills/` directory:
- Master Router: `skills/af-motion/SKILL.md`
- Foundations & Imports: `skills/fundamentals/SKILL.md`
- React Hooks & Components: `skills/react-animation/SKILL.md`
- Motion Intelligence & DNA: `skills/motion-intelligence/SKILL.md`
- Visual Styles & Palettes: `skills/visual-styles/SKILL.md`
- Transitions & Scroll Storytelling: `skills/transitions-scroll/SKILL.md`
- Microinteractions & Spring UI: `skills/interactive-components/SKILL.md`
- Choreography & Multi-System Sync: `skills/choreography-sync/SKILL.md`
- Canvas & Shaders: `skills/graphics-effects/SKILL.md`
- 3D Scenes & Geometry: `skills/3d-scene-development/SKILL.md`
- Motion Validation & Audit: `skills/motion-validation/SKILL.md`
- Composition Pipelines: `skills/ai-generation/SKILL.md`
- MCP Protocol Integration: `skills/mcp-integration/SKILL.md`

Always inspect `skills/index.json` or the relevant `SKILL.md` before generating code.

---

## 2. Deterministic Agent Workflow

When fulfilling a motion or UI request, follow these 10 steps:
1. **Understand Visual Intent**: Identify trigger, aesthetic, and target element.
2. **Discover Capabilities**: Query AF Motion skills or MCP tools.
3. **Select Style & DNA**: Choose from 19 visual styles (e.g. `minimal`, `glassmorphism`, `cyberpunk`) and 5 Motion DNA profiles (`precise`, `playful`, `elegant`, `energetic`, `editorial-flow`).
4. **Minimize Capability Set**: Use the simplest primitive (e.g. `<Reveal>` or `useAnimate`).
5. **Compose / Plan Motion**: Configure durations, easing curves, and keyframes.
6. **Integrate with React/DOM**: Ensure `"use client";` in Next.js App Router.
7. **Enforce Accessibility**: Check `useMotionAccessibility()` and honor `prefers-reduced-motion`.
8. **Optimize GPU Transforms**: Animate only `transform` and `opacity`. Never animate `width`, `height`, `top`, or `margin`.
9. **Verify Imports & Types**: Import from `af-motion`, `af-motion/react`, `af-motion/catalogue`, or `af-motion/presets`.
10. **Report Decisions**: Note the selected style, DNA, and reduced-motion fallback.

---

## 3. Package Import Subpaths

- **`af-motion`**: Core DOM animations and backgrounds (`animate`, `animateSpring`, `easings`, `aurora`, `particleField`, `tilt`).
- **`af-motion/react`**: React components and hooks (`useAnimate`, `useInView`, `Reveal`, `Interactive`, `useMicrointeraction`, `useMotionAccessibility`).
- **`af-motion/catalogue`**: Intelligence and validation (`aiMotionRegistry`, `visualStyleRegistry`, `recommendAnimation`, `validateMotionConfig`).
- **`af-motion/presets`**: Standardized recipes (`listPresets`, `applyPreset`, `runRecipe`).

---

## 4. Example Prompts & Code Patterns

### Button Microinteraction
```tsx
"use client";

import React, { useRef } from "react";
import { useMicrointeraction, Interactive } from "af-motion/react";

export function SpringButton({ label, onClick }: { label: string; onClick: () => void }) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useMicrointeraction(buttonRef, {
    category: "button",
    hover: { scale: 1.04, duration: 180 },
    press: { scale: 0.95, duration: 90 },
  });

  return (
    <Interactive scale={1.04} pressScale={0.95}>
      <button ref={buttonRef} onClick={onClick} className="cta-btn">
        {label}
      </button>
    </Interactive>
  );
}
```

---

## 5. Troubleshooting & Validation

- Run `npx vitest run tests/skills.test.ts` to verify skill references and imports.
- Never invent exports or configuration fields outside documented skills.
