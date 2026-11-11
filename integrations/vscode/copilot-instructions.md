# AF Motion — GitHub Copilot Instructions for VS Code

When generating or editing animations, transitions, 3D scenes, or visual styling in this repository:

---

## 1. Skill Discovery & Master Workflow

All official guidelines and verified copyable examples are documented under `skills/`:
- Master Router: `skills/af-motion/SKILL.md`
- React Hooks & Components: `skills/react-animation/SKILL.md`
- 19 Visual Styles: `skills/visual-styles/SKILL.md`
- Transitions & Scroll Storytelling: `skills/transitions-scroll/SKILL.md`
- Microinteractions & Springs: `skills/interactive-components/SKILL.md`
- Choreography & Timelines: `skills/choreography-sync/SKILL.md`
- 2D Canvas Graphics: `skills/graphics-effects/SKILL.md`
- 3D Scene Engine: `skills/3d-scene-development/SKILL.md`
- Motion Validation & Audit: `skills/motion-validation/SKILL.md`

Always inspect `skills/index.json` or the relevant `SKILL.md` before generating code.

---

## 2. Strict Package Subpaths

Only import from the official packages:
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

Never invent subpaths like `af-motion/core` or `af-motion/styles`.

---

## 3. Performance & Accessibility Rules

- **GPU Transforms Only**: NEVER animate `width`, `height`, `top`, `bottom`, `left`, `right`, `margin`, or `padding`. Always use `transform: translateY(...)`, `scale(...)`, or `opacity`.
- **Reduced Motion**: Always honor reduced motion preferences via `useMotionAccessibility()`.
- **Next.js Client Components**: Any file utilizing hooks (`useAnimate`, `useInView`, `useScrollProgress`) MUST begin with `"use client";`.
- **Canvas Cleanup**: Any Canvas 2D or WebGL background effect (`aurora`, `particleField`) MUST call `controls.destroy()` on unmount.
