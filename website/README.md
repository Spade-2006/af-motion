# AF Motion — Standalone Public Website

A premium, cinematic developer marketing website and interactive showcase for **AF Motion** — the high-performance, framework-independent motion engine with React bindings, 19 visual styles, 33 built-in palettes, and an AI-native Motion Intelligence system.

---

## 1. Architecture Overview

The website is engineered as a standalone React 19 application decoupled from the core library runtime:

```text
website/
├── public/                # Static assets (fonts, images, 3D glTF models)
├── src/
│   ├── app/               # Application shell, router, and context providers
│   │   ├── App.tsx        # Top-level application component
│   │   ├── router.tsx     # Hash-based client router
│   │   └── providers/     # Theme and Motion accessibility providers
│   ├── components/        # Reusable design system component library
│   │   ├── layout/        # PageContainer, SectionContainer, SectionHeading, GridLayout
│   │   ├── navigation/    # Navbar, NavLinks, MobileNavigation, Footer
│   │   ├── ui/            # Button, IconButton, Badge, Tag, Card, Tooltip, Divider, CodeLabel
│   │   ├── motion/        # MotionReveal, MotionStagger, MagneticElement, MotionText, ScrollProgress
│   │   ├── effects/       # GradientSurface, GlowEffect, NoiseOverlay, GridBackground, SectionDivider
│   │   └── three/         # SceneCanvas, SceneEnvironment, FallbackScene, ThreeErrorBoundary
│   ├── sections/          # Composed page sections (DesignSystemPreviewSection)
│   ├── pages/             # Route views (HomePage, Features, Playground, Docs, Examples)
│   ├── hooks/             # Custom hooks (useWebsiteMotion, useScrollPosition)
│   ├── styles/            # Tailwind CSS v4, tokens.css, and main stylesheet
│   ├── config/            # Tokens, site metadata, and navigation structures
│   ├── utils/             # Classname merger (cn) and WebGL capability detection
│   └── main.tsx           # React DOM root entry point
├── index.html             # HTML entry with font preconnections and meta tags
├── package.json           # Isolated package manifest
├── tsconfig.json          # TypeScript configuration extending repo root
└── vite.config.ts         # Vite configuration with Tailwind CSS v4 & AF Motion aliases
```

---

## 2. Local Development & Build Commands

### From the Repository Root

```bash
# Start website local dev server (port 5174)
npm run website

# Build production website bundle (outputs to website-dist/)
npm run website:build
```

### From the `website/` Directory

```bash
cd website

# Start Vite dev server
npm run dev

# Compile TypeScript typecheck
npm run typecheck

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 3. Design System & Token Reference

The website aesthetic combines **Awwwards-level creative technology**, **cinematic 3D environments**, and **minimal editorial typography**:

- **Dark Obsidian Canvas**: `#07080a`, `#0b0d12`
- **Charcoal Surfaces**: `#131620`, `#1a1e2b`, `#222838`
- **Restrained Electric Accents**:
  - Electric Cyan: `#38bdf8` (`--accent-cyan`)
  - Neon Indigo: `#6366f1` (`--accent-indigo`)
  - Violet Atmosphere: `#a855f7` (`--accent-violet`)
  - Emerald State: `#10b981` (`--accent-emerald`)
- **Typography Scale**: Plus Jakarta Sans for high-contrast headlines and JetBrains Mono for technical telemetry.

---

## 4. 3D Infrastructure & WebGL Fallback Conventions

3D scenes use **Three.js v0.187** and **React Three Fiber v9**:

- **`SceneCanvas`**: Handles DPR clamping (`[1, 2]`), power preference (`high-performance`), and responsive resize observer.
- **`ThreeErrorBoundary`**: Gracefully catches context loss, shader compilation failures, and WebGL initialization errors.
- **`FallbackScene`**: When WebGL is disabled or unsupported, displays a lightweight CSS 2D geometric particle visual without interrupting user navigation.

---

## 5. AF Motion Integration

The website directly consumes local AF Motion library modules through explicit aliases in `vite.config.ts` and `tsconfig.json`:

```tsx
import { animate, easings } from "af-motion";
import { Reveal, Interactive, useMicrointeraction, useMotionAccessibility } from "af-motion/react";
import { visualStyleRegistry } from "af-motion/catalogue";
import { listPresets } from "af-motion/presets";
```

All animations enforce hardware acceleration by animating exclusively `transform` (`matrix3d`) and `opacity`.
