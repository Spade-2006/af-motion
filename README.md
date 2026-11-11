# AF Motion (Auto Flow Motion)

**Version:** 1.0.0

**Auto Flow Motion (AF Motion)** is a framework-independent JavaScript and TypeScript animation engine paired with optional React 19 bindings, spring and inertia physics, multi-track timelines, visual effects, 19 design styles, 33 curated palettes, 5 Motion DNA profiles, 3D/GPU tooling, deterministic AI Motion Intelligence, a developer CLI, and an offline Model Context Protocol (MCP) server.

---

## Core Capabilities

- **Framework-Independent Core (`af-motion`)**: Web Animations API and shared `requestAnimationFrame` progress engine (`animate`, `animateProgress`), damped springs (`animateSpring`), inertia physics (`animateInertia`), custom easing registry (`easings`, `registerEasing`), multi-track timelines (`createTimeline`), layered transforms (`magnetic`, `tilt`, `parallax`), scroll triggers/observers (`reveal`, `stagger`, `inView`, `scrollProgress`, `scrollVelocity`, `scrollTrigger`), canvas backgrounds (`aurora`, `particleField`), and 33 semantic palettes.
- **Optional React Bindings (`af-motion/react`)**: Client hooks and components (`useAnimate`, `useInView`, `useMicrointeraction`, `useMotionAccessibility`, `Reveal`, `Interactive`, `AnimatedText`, `GlassSurface`) with zero React dependency leaked into core modules.
- **Presets & Choreography (`af-motion/presets`)**: `39` built-in motion presets (`listPresets`, `getPreset`, `applyPreset`, `animatePreset`, `registerAnimationPreset`) and synchronized cross-system choreography helpers.
- **Catalogue, Styles, 3D & Intelligence (`af-motion/catalogue`)**: `19` visual design styles, `5` Motion DNA personalities (`precise`, `playful`, `elegant`, `energetic`, `editorial-flow`), `validateMotionConfig()`, `optimizeMotion()`, offline deterministic Design-to-Motion and Scene Generation, safe agent workflow planning, 3D scene/GPU utilities, and `createAFMotionMCPServer`.
- **Developer CLI & MCP (`af-motion`, `af-motion-mcp`)**: Terminal commands (`init`, `doctor`, `validate`, `presets`, `info`, `example`) and stdio JSON-RPC 2.0 MCP server.

---

## Installation

```bash
npm install af-motion
```

`react` is an optional peer dependency (`^18.0.0 || ^19.0.0`). Vanilla JS/TS, Preset, Catalogue, CLI, and MCP workflows run without React installed.

---

## Quick Start

### Basic DOM Animation

```ts
import { animate } from "af-motion";

const controls = animate(
  ".card",
  { opacity: [0, 1], transform: ["translateY(16px)", "translateY(0px)"] },
  { duration: 360, easing: "easeOutCubic" }
);

// Supports pause(), resume(), reverse(), seek(), and cancel()
controls.cancel();
```

### React Integration (`af-motion/react`)

```tsx
"use client";

import { Interactive, Reveal, useAnimate } from "af-motion/react";

export function MotionCard() {
  const { ref, animate } = useAnimate<HTMLDivElement>();

  return (
    <Reveal>
      <Interactive>
        <div
          ref={ref}
          onClick={() => animate({ opacity: [0.7, 1] }, { duration: 240 })}
        >
          Auto Flow Motion Card
        </div>
      </Interactive>
    </Reveal>
  );
}
```

### Easing, Spring Physics & Timelines

```ts
import { animateSpring, createTimeline, registerEasing } from "af-motion";

registerEasing("smoothStep", (t) => t * t * (3 - 2 * t));

const spring = animateSpring({
  from: 0,
  to: 1,
  config: { stiffness: 180, damping: 20, mass: 1 },
  onUpdate: ({ position }) => console.log(position),
  onComplete: () => console.log("settled"),
});
spring.cancel();

const timeline = createTimeline()
  .addLabel("enter", 0)
  .add({ target: ".hero", properties: { opacity: [0, 1] }, at: "enter" })
  .add({
    target: ".subtitle",
    properties: { transform: ["translateY(12px)", "translateY(0px)"] },
    at: { previous: "end", offset: -80 },
    options: { duration: 400 },
  });

timeline.play();
```

### Visual Effects & Cleanup

```ts
import { inView, magneticElement, parallax, tilt } from "af-motion";

const mag = magneticElement(".cta-button", { strength: 0.25, distance: 120 });
const tlt = tilt(".preview-card");
const par = parallax(".layer", { speed: 0.2 });
const view = inView(".reveal-section", (el) => {
  el.classList.add("is-visible");
  return () => el.classList.remove("is-visible");
});

// Idempotent listener & observer cleanup
mag.destroy();
tlt.destroy();
par.destroy();
view.destroy();
```

### Presets, Motion DNA & Palettes

```ts
import { animatePreset, getMotionDNA, registerPalette } from "af-motion";
import { applyPreset, listPresets } from "af-motion/presets";

const dna = getMotionDNA("precise");
animatePreset(".panel", "slideUp", { duration: dna?.duration ?? 320 });

const allPresets = listPresets();
applyPreset(".hero-title", allPresets[0].name);

registerPalette({
  name: "Brand Obsidian",
  primary: "#38BDF8",
  secondary: "#0F172A",
  accent: "#F472B6",
});
```

### Catalogue, Validation, 3D/GPU & Offline AI Intelligence

```ts
import {
  aiMotionRegistry,
  createScene3D,
  designToMotionEngine,
  evaluateMotionQuality,
  validateMotionConfig,
} from "af-motion/catalogue";

const searchResults = aiMotionRegistry.searchCapabilities({ term: "spring" });

const report = validateMotionConfig({
  duration: 320,
  properties: { opacity: [0, 1], transform: ["translateY(8px)", "translateY(0px)"] },
});

const quality = evaluateMotionQuality({
  configuration: { duration: 320, properties: { opacity: [0, 1] } },
});

const scene = createScene3D({ id: "preview-3d", autoStart: false });
scene.destroy();
```

---

## CLI & MCP Server

```bash
# Project tooling
npx af-motion init --template vanilla-ts
npx af-motion doctor
npx af-motion validate af-motion.config.json
npx af-motion presets
npx af-motion example spring --print

# Offline MCP server (stdio JSON-RPC 2.0)
npx af-motion-mcp
```

---

## Documentation, Release Notes & Source

- **Source & Issues**: [github.com/Spade-2006/af-motion](https://github.com/Spade-2006/af-motion)
- **Changelog**: [CHANGELOG.md](./CHANGELOG.md)
- **Release Notes**: [RELEASE_NOTES.md](./RELEASE_NOTES.md)
- **Interactive Docs App** (repository workspace): `npm run docs`
- **Public Website App** (repository workspace): `npm run website`

---

## Compatibility Information

- **Verified**: Node.js `v24.17.0` (`>=18.0.0` declared in `engines`), React `^19.3.1` (`StrictMode`, SSR `renderToString`, hydration), JSDOM `^26.1.0`, TypeScript `^7.0.2`.
- **Declared / Unverified Locally**: React `^18.0.0`, Node.js `18` LTS, Bun, Deno, Next.js App Router runtime, and live Chromium/Firefox/Safari WebGL2 browser execution.

---

## License

MIT © Satyansh Acharya
