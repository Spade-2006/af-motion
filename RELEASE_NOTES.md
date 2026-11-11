# AF Motion — V1 Release Notes (`v1.0.0`)

## Product Overview

**Auto Flow Motion (AF Motion)** (`af-motion`) is a framework-independent JavaScript and TypeScript animation engine paired with optional React bindings, physics solvers, 19 visual design styles, 33 built-in palettes, 5 Motion DNA profiles, 3D/GPU helpers, offline deterministic Motion Intelligence, a Model Context Protocol (MCP) server, and developer CLI tooling.

---

## Package Entry Points

All public APIs are exposed through four official ESM subpaths (with zero runtime dependencies):

| Subpath | Runtime Exports | Purpose |
|---|---|---|
| `af-motion` | 107 | Core WAAPI & frame engine (`animate`, `animateSpring`, `easings`, backgrounds, effects, palettes) |
| `af-motion/react` | 289 | Optional React hooks & components (`useAnimate`, `useMicrointeraction`, `useMotionAccessibility`, `Reveal`, `Interactive`) |
| `af-motion/catalogue` | 1,447 | Capabilities, visual styles, Motion DNA, validation, deterministic AI generation, agents, and MCP |
| `af-motion/presets` | 97 | 39 standardized presets & recipes (`listPresets`, `getPreset`, `applyPreset`) |

Additional executables:
- `af-motion` (`bin/af-motion.js`): Developer CLI (`init`, `doctor`, `validate`, `presets`, `info`, `example`)
- `af-motion-mcp` (`bin/mcp-server.js`): Offline stdio Model Context Protocol server

---

## Installation & Quick Start

```bash
npm install af-motion
```

### Core JavaScript / TypeScript
```ts
import { animate } from "af-motion";

const controls = animate(".card", { opacity: [0, 1], transform: ["translateY(16px)", "translateY(0px)"] }, {
  duration: 360,
  easing: "easeOutCubic",
});

// Cancel cleanly if needed
controls.cancel();
```

### React Integration
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
          onClick={() => animate({ opacity: [0.6, 1] }, { duration: 240 })}
        >
          Interactive Card
        </div>
      </Interactive>
    </Reveal>
  );
}
```

### Presets & Catalogue
```ts
import { applyPreset, listPresets } from "af-motion/presets";
import { aiMotionRegistry, validateMotionConfig } from "af-motion/catalogue";

const presets = listPresets();
applyPreset(".hero", presets[0].name);

const capabilities = aiMotionRegistry.searchCapabilities({ term: "spring" });
const validation = validateMotionConfig({ duration: 300, properties: { opacity: [0, 1] } });
```

### CLI Tooling
```bash
npx af-motion init --template vanilla-ts
npx af-motion doctor
npx af-motion validate af-motion.config.json
```

---

## Important API Notes

- **GPU-First Animation**: Animate composited properties (`transform`, `opacity`) where possible; `validateMotionConfig()` flags layout-triggering properties (`width`, `height`, `top`, `left`, `margin`) and accessibility hazards.
- **Reduced Motion**: `animate()` and `animateSpring()` respect `prefers-reduced-motion` by default (`respectReducedMotion: true`), completing immediately at endpoints when enabled.
- **Background-Tab Pacing**: Shared `requestAnimationFrame` loops pause automatically while `document.hidden === true`.
- **Node Built-in Isolation**: Core, React, Catalogue, and Presets subpaths contain zero Node built-ins for browser compatibility; CLI filesystem operations remain isolated in `bin/` and `dist/cli.js`.

---

## Verified & Unverified Compatibility

- **Verified Environments**:
  - `Node.js v24.17.0` (CLI, MCP, ESM package resolution, Vite builds, TypeScript `^7.0.2` compilation, 38 Vitest suites / 785 tests)
  - `React ^19.3.1` (`StrictMode`, `renderToString` SSR, client hydration, unmount cleanup)
  - `JSDOM ^26.1.0` (DOM animations, cancellation, observer cleanup with stubbed observers, `ThreeErrorBoundary` + 2D fallback)
- **Declared / Unverified Environments**:
  - `React 18` (`^18.0.0` declared in `peerDependencies`, not executed locally)
  - Live desktop/mobile browsers: `Chromium`, `Firefox`, `Safari/WebKit` (not verified in an interactive GPU browser session)
  - `Bun`, `Deno`, `Node.js 18 LTS`, and full `Next.js` App Router server/client runtime (not installed/executed in this environment)

---

## Known Limitations

- Real-browser visual testing (WebGL2 shader frames, live WAAPI frame timing, pointer/scroll smoothness, and clipboard permission prompts across Chrome, Firefox, and Safari) should be run in CI/target browsers prior to public npm announcement.
- Two lazy function-level mutual reference pairs (`core/motion-choreography.ts <-> presets.ts`, `core/motion-recipe.ts <-> presets.ts`) remain intentionally in `src/`; runtime execution and Rollup/Vite bundling succeed cleanly.
