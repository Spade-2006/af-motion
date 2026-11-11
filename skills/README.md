# AF Motion AI Agent Skills

Official, reusable AI Agent Skills and instructions for **AF Motion**.

These skills enable AI coding assistants (such as Google Antigravity, Gemini-based coding agents, Claude Code, Cursor, and OpenAI Codex) to discover AF Motion capabilities, select the right APIs, write idiomatic code, and validate performance and accessibility.

---

## 1. Skills Directory Structure

```
skills/
├── index.json                        # Machine-readable discovery registry of all skills
├── README.md                         # Agent compatibility and integration guide
├── af-motion/SKILL.md                # Central routing skill & master agent workflow
├── fundamentals/SKILL.md             # Installation, imports, subpath resolution, API selection
├── react-animation/SKILL.md          # React hooks, components, SSR hydration, Strict Mode
├── motion-intelligence/SKILL.md      # Natural language interpretation & Motion DNA
├── visual-styles/SKILL.md            # 19 visual styles, 33 palettes, design tokens
├── transitions-scroll/SKILL.md       # Entrance/exit, page transitions, scroll storytelling
├── interactive-components/SKILL.md   # Microinteractions, spring buttons, 3D tilt, magnetic
├── choreography-sync/SKILL.md        # Multi-element timelines, DOM + Graphics + 3D sync
├── graphics-effects/SKILL.md         # 2D Canvas ambient backgrounds, particles, shaders
├── 3d-scene-development/SKILL.md     # 3D scene engine, geometry, camera, lighting, GLTF
├── motion-validation/SKILL.md        # Audit, accessibility (WCAG), performance optimization
├── ai-generation/SKILL.md            # AI generation pipeline & composition schemas
└── mcp-integration/SKILL.md          # Model Context Protocol server, tools, and prompts
```

---

## 2. Agent Environment Compatibility

The core skill format uses portable, standard markdown files (`SKILL.md`) with YAML frontmatter.

### 2.1 Google Antigravity
- Place or symlink the `skills/` folder into your project root or `.gemini/antigravity/skills/`.
- The central `af-motion` skill will automatically be discovered and triggered when motion-related requests are detected.

### 2.2 Cursor
- Reference skills directly in `.cursorrules` or `.cursor/rules/`:
  ```markdown
  When implementing animations, motion, or UI visual effects, refer to the AF Motion skills located in `skills/`.
  Start with `skills/af-motion/SKILL.md` for API selection and workflow instructions.
  ```

### 2.3 Claude Code
- Add the skills directory to Claude Code's memory or include in your `CLAUDE.md`:
  ```markdown
  ## Animation & Motion
  AF Motion skills are documented in `skills/`. Follow the instructions in `skills/af-motion/SKILL.md` before generating animations.
  ```

### 2.4 Gemini CLI & Codex
- Use the machine-readable `skills/index.json` to query triggers, paths, and categories to inject targeted skill files into the prompt context dynamically.

---

## 3. Skill Validation

To verify the integrity, schemas, frontmatter, and API references of all skills:

```bash
# Run Vitest skills test suite
npx vitest run tests/skills.test.ts
```
