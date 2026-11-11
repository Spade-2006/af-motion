# Changelog

All notable changes for **Auto Flow Motion (`af-motion` / AF Motion)** leading into V1 Release Readiness (`0.1.0`) are documented below.

---

## [0.1.0] — V1 Release Candidate

### Added
- **Core Motion Engine (`af-motion`)**: Web Animations and shared `requestAnimationFrame` progress engine (`animate`, `animateProgress`), damped physical spring and inertia solvers (`animateSpring`, `animateInertia`), custom easing registry (`easings`, `registerEasing`, `getEasing`, `removeEasing`), multi-track timeline choreography (`createTimeline`), layered transform composition (`magnetic`, `tilt`, `parallax`), scroll triggers/observers (`reveal`, `stagger`, `inView`, `scrollProgress`, `scrollVelocity`, `scrollTrigger`), canvas backgrounds (`aurora`, `particleField`), and 33 built-in semantic color palettes.
- **Optional React Bindings (`af-motion/react`)**: Framework-optional React integration providing hooks and components (`useAnimate`, `useInView`, `useMicrointeraction`, `useMotionAccessibility`, `Reveal`, `Interactive`, `AnimatedText`, `GlassSurface`) with Strict Mode and SSR compatibility.
- **Capability Catalogue, Styles & Intelligence (`af-motion/catalogue`)**: 19 visual design styles (`visualStyleRegistry`), 5 Motion DNA personality profiles (`precise`, `playful`, `elegant`, `energetic`, `editorial-flow`), AI capability registry (`aiMotionRegistry`), offline deterministic Design-to-Motion and AI Scene Generation engines, motion quality validation/optimization (`validateMotionConfig`, `optimizeMotion`), multi-agent task planner & safe tool registry, and MCP server (`createAFMotionMCPServer`, `StdioTransport`, `InMemoryTransport`).
- **Presets & Choreography (`af-motion/presets`)**: 39 standardized presets (`listPresets`, `getPreset`, `applyPreset`, `animatePreset`, `registerAnimationPreset`) and reusable choreography helpers.
- **Developer CLI (`af-motion`)**: Terminal tooling (`init`, `doctor`, `validate`, `presets`, `info`, `example`) exposed via `bin/af-motion.js` and `bin/mcp-server.js`.
- **Standalone Ecosystem Apps**: Internal interactive Studio (`studio/`), standalone interactive Documentation Hub (`docs/`), and standalone public Website (`website/`).
- **Shared Safety & Path Containment Helpers**: `src/core/utils/safe-json.ts` (prototype-key-stripping JSON parsing, circular reference guards, JSX/attribute/CSS/comment escaping, error path redaction) and `src/cli/utils/safety.ts` (workspace-root path containment).

### Security
- Enforced workspace-root path containment (`resolveSafeWorkspacePath`) across CLI file writes (`init`, `example`, `presets --out`), blocked prototype-polluting CLI flags (`--__proto__`, `--constructor`, `--prototype`), validated `--template`/`--lang`/`--format` allowlists, and serialized preset literals in TypeScript exports.
- Bounded MCP `StdioTransport` stdin buffer (`1 MB`), detached `stdin` listeners on `close()`, validated JSON-RPC `params` and tool arguments as plain objects, and stripped local OS filesystem paths from external MCP error messages.
- Enforced approval boundaries (`onApprovalRequired` / `approvalGranted`), bounded workflow sizes (`MAX_WORKFLOW_TASKS = 100`, `MAX_TASK_RETRIES = 5`), real timeout cutoffs inside execution and retry loops, `64 KB` message bus payload limits, `1000`-message history bounds, and safe identifier sanitization in `SafeToolRegistry`.
- Escaped JSX text, attributes, JS string literals, CSS values, and block comments in deterministic code generation; stripped `__proto__`, `constructor`, and `prototype` keys during JSON deserialization across 3D schemas, compositions, design systems, Motion DNA, choreographies, and visual style registries.

### Fixed
- Fixed per-frame `THREE.AmbientLight`, `DirectionalLight`, and `PointLight` reallocation/scene-graph memory leak in `createThreeRendererAdapter` (`src/3d/adapter.ts`) so existing lights are updated and excess lights removed cleanly.
- Fixed WebGL cleanup lifecycle on `webglcontextlost` in `SceneCanvas` (`website/src/components/three/SceneCanvas.tsx`) and released temporary WebGL probe contexts via `WEBGL_lose_context` (`website/src/utils/webgl.ts`).
- Fixed syntax error `overflow-y auto;` in `studio/studio.css` preventing Studio production builds.
- Rejected `NaN`, `Infinity`, negative durations/repeats, array configs, and circular `transform` references cleanly inside `validateMotionConfig()`.

- Resolved overloaded `classifyMotionIntent()` signature ambiguity between `animation-intelligence` (natural language/component selection) and `ai-motion-intelligence` (configuration analysis) inside `af-motion/catalogue`.

### Documentation
- Fixed four non-existent public import references in `docs/components/interactive/ReactPlayground.tsx` (`prefersReducedMotion`) and `docs/data/docs-content.ts` (`cubicBezier`, `registerCustomPalette`, `createPBRMaterial`) to reference verified public exports (`isAccessible`, `registerEasing`/`getEasing`, `registerPalette`, `getMaterial3DPreset`/`validateMaterial3D`).
