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

## 4. Example Workflows

### A. React Animation & Staggered Reveal
```tsx
"use client";

import React from "react";
import { Reveal, useMotionAccessibility } from "af-motion/react";

export function FeatureSection({ items }: { items: { id: string; title: string }[] }) {
  const { prefersReducedMotion } = useMotionAccessibility();

  return (
    <section className="features-grid">
      <Reveal effect="fade-up" duration={prefersReducedMotion ? 0 : 400}>
        <h2 className="title">Engineered Capabilities</h2>
      </Reveal>
      <div className="grid grid-cols-3 gap-4">
        {items.map((item) => (
          <Reveal key={item.id} effect="fade-up">
            <div className="p-6 bg-neutral-900 rounded-xl text-white">
              <h3>{item.title}</h3>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
```

### B. Tactile Spring Microinteraction
```tsx
"use client";

import React, { useRef } from "react";
import { useMicrointeraction, Interactive } from "af-motion/react";

export function TactileButton({ label, onClick }: { label: string; onClick: () => void }) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useMicrointeraction(buttonRef, {
    category: "button",
    hover: { scale: 1.04, duration: 180 },
    press: { scale: 0.95, duration: 90 },
  });

  return (
    <Interactive scale={1.04} pressScale={0.95}>
      <button ref={buttonRef} onClick={onClick} className="cta-button">
        {label}
      </button>
    </Interactive>
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
      colors: ["#3b82f6", "#8b5cf6", "#ec4899"],
      speed: 0.8,
    });
    return () => controls.destroy();
  }, []);

  return <canvas ref={canvasRef} className="w-full h-80 block" />;
}
```

---

## 5. Troubleshooting & Error Recovery

| Issue | Cause | Fix |
| :--- | :--- | :--- |
| `TypeError: window is not defined` | Missing `"use client";` in Next.js App Router | Add `"use client";` as the very first line of the file. |
| Tool call fails in MCP | Server process not started or invalid JSON-RPC | Ensure `bin/mcp-server.js` is built with `npm run build`. |
| Skill not found | Skill name mismatch | Refer to `skills/index.json` for exact directory names and triggers. |
