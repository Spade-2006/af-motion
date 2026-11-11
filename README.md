# AF Motion

### Auto Flow Motion — A powerful animation toolkit for the modern web.

[![npm version](https://img.shields.io/npm/v/af-motion)](https://www.npmjs.com/package/af-motion)
[![npm downloads](https://img.shields.io/npm/dm/af-motion)](https://www.npmjs.com/package/af-motion)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![GitHub Release](https://img.shields.io/github/v/release/Spade-2006/af-motion)](https://github.com/Spade-2006/af-motion)

AF Motion is a framework-independent JavaScript and TypeScript animation engine with optional React bindings.

From physics-based motion and multi-track timelines to visual effects, design systems, 3D/GPU tooling, and deterministic AI Motion Intelligence — AF Motion brings an extensive motion toolkit into one developer-friendly library.

## ✨ Features

- **Framework-independent core:** `animate`, `animateProgress`, spring physics, inertia, custom easing, and multi-track timelines.
- **Visual effects:** Reveal, stagger, magnetic interactions, tilt, parallax, scroll triggers, and canvas backgrounds.
- **React integration:** Optional React 18/19 hooks and components, including `useAnimate`, `useInView`, `Reveal`, `Interactive`, and `AnimatedText`.
- **Motion presets:** 39 built-in presets and choreography helpers.
- **Design system:** 19 visual styles, 33 curated palettes, and 5 Motion DNA profiles.
- **3D & GPU tooling:** Scene generation, GPU utilities, and visual motion workflows.
- **Motion Intelligence:** Deterministic, offline-capable design-to-motion and scene-generation capabilities.
- **Developer tooling:** CLI, TypeScript declarations, and an offline MCP server.

## 📦 Installation

```bash
npm install af-motion
```

React is an optional peer dependency:

```bash
npm install react react-dom
```

Supported React peer dependency range: `^18.0.0 || ^19.0.0`.

Vanilla JavaScript and TypeScript users do not need React.

## 🚀 Quick Start

### 1. Basic Animation

```ts
import { animate } from "af-motion";

const controls = animate(
  ".card",
  {
    opacity: [0, 1],
    transform: [
      "translateY(16px)",
      "translateY(0px)"
    ]
  },
  {
    duration: 360,
    easing: "easeOutCubic"
  }
);

// pause(), resume(), reverse(), seek(), cancel()
controls.cancel();
```

### 2. React Integration

```tsx
"use client";

import {
  Interactive,
  Reveal,
  useAnimate
} from "af-motion/react";

export function MotionCard() {
  const { ref, animate } = useAnimate<HTMLDivElement>();

  return (
    <Reveal>
      <Interactive>
        <div
          ref={ref}
          onClick={() =>
            animate(
              { opacity: [0.7, 1] },
              { duration: 240 }
            )
          }
        >
          Auto Flow Motion Card
        </div>
      </Interactive>
    </Reveal>
  );
}
```

### 3. Spring Physics & Timelines

```ts
import {
  animateSpring,
  createTimeline,
  registerEasing
} from "af-motion";

registerEasing(
  "smoothStep",
  (t) => t * t * (3 - 2 * t)
);

const spring = animateSpring({
  from: 0,
  to: 1,
  config: {
    stiffness: 180,
    damping: 20,
    mass: 1
  },
  onUpdate: ({ position }) => console.log(position),
  onComplete: () => console.log("settled")
});

spring.cancel();

const timeline = createTimeline()
  .addLabel("enter", 0)
  .add({
    target: ".hero",
    properties: { opacity: [0, 1] },
    at: "enter"
  })
  .add({
    target: ".subtitle",
    properties: {
      transform: [
        "translateY(12px)",
        "translateY(0px)"
      ]
    },
    at: { previous: "end", offset: -80 },
    options: { duration: 400 }
  });

timeline.play();
```

### 4. Interactive Effects

```ts
import {
  inView,
  magneticElement,
  parallax,
  tilt
} from "af-motion";

const magnetic = magneticElement(
  ".cta-button",
  { strength: 0.25, distance: 120 }
);

const tiltEffect = tilt(".preview-card");

const parallaxEffect = parallax(
  ".layer",
  { speed: 0.2 }
);

const observer = inView(
  ".reveal-section",
  (el) => {
    el.classList.add("is-visible");

    return () => {
      el.classList.remove("is-visible");
    };
  }
);

// Clean up when no longer needed
magnetic.destroy();
tiltEffect.destroy();
parallaxEffect.destroy();
observer.destroy();
```

### 5. Presets, Motion DNA & Palettes

```ts
import {
  animatePreset,
  getMotionDNA,
  registerPalette
} from "af-motion";

import {
  applyPreset,
  listPresets
} from "af-motion/presets";

const dna = getMotionDNA("precise");

animatePreset(
  ".panel",
  "slideUp",
  { duration: dna?.duration ?? 320 }
);

const presets = listPresets();

applyPreset(".hero-title", presets[0].name);

registerPalette({
  name: "Brand Obsidian",
  primary: "#38BDF8",
  secondary: "#0F172A",
  accent: "#F472B6"
});
```

### 6. Catalogue, Validation & 3D

```ts
import {
  aiMotionRegistry,
  createScene3D,
  evaluateMotionQuality,
  validateMotionConfig
} from "af-motion/catalogue";

const results = aiMotionRegistry.searchCapabilities({
  term: "spring"
});

const report = validateMotionConfig({
  duration: 320,
  properties: {
    opacity: [0, 1],
    transform: [
      "translateY(8px)",
      "translateY(0px)"
    ]
  }
});

const quality = evaluateMotionQuality({
  configuration: {
    duration: 320,
    properties: { opacity: [0, 1] }
  }
});

const scene = createScene3D({
  id: "preview-3d",
  autoStart: false
});

scene.destroy();
```

## 🛠️ CLI & MCP

AF Motion includes a developer CLI for project setup, diagnostics, validation, and examples.

```bash
npx af-motion init --template vanilla-ts
npx af-motion doctor
npx af-motion validate af-motion.config.json
npx af-motion presets
npx af-motion example spring --print
```

### MCP Server

AF Motion also provides an offline, stdio-based JSON-RPC 2.0 MCP server.

```bash
npx af-motion-mcp
```

It exposes motion capabilities to compatible MCP clients without requiring an external AI API.

## 📚 Documentation & Resources

- **GitHub Repository:** https://github.com/Spade-2006/af-motion
- **npm Package:** https://www.npmjs.com/package/af-motion
- **GitHub Releases:** https://github.com/Spade-2006/af-motion/releases
- **Changelog:** [CHANGELOG.md](./CHANGELOG.md)
- **Release Notes:** [RELEASE_NOTES.md](./RELEASE_NOTES.md)

### Run Locally

Start the documentation and website applications from the repository:

```bash
npm run docs
npm run website
```

## 🧪 Compatibility

| Environment | Status |
|---|---|
| Node.js 24.17.0 | Verified |
| React 19 | Verified for SSR and hydration |
| React 18 | Installation, imports and TypeScript resolution verified |
| TypeScript | Declaration imports verified |
| JSDOM | Verified |
| Node.js 18 LTS | Declared, not locally verified |
| Bun / Deno | Not locally verified |
| Next.js App Router | Runtime not fully verified |
| Browser WebGL2 | Not fully verified |

React is optional. The core animation engine does not require React.

## 📄 License

Copyright © 2026 Satyansh Acharya.

Licensed under the **Apache License, Version 2.0**.

See [LICENSE](./LICENSE) for the full license text.
