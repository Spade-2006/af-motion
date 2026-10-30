# AF Motion – agent instructions (token-efficient)

## Workflow
- Search before reading: use grep/glob, then view only the needed line ranges. Never read whole files over ~200 lines.
- Batch independent reads/searches in one call. Do not re-read files you just edited.
- Do not delegate to sub-agents for work doable in a few direct calls.
- Reuse existing infrastructure (`src/core/animate.ts`, `animation.ts`, `transform.ts`, `backgrounds/internal/canvas-lifecycle.ts`, `core/pointer-capture.ts`); do not add parallel engines, RAF loops or dependencies.
- Make surgical edits. Fix only confirmed issues; add focused regression tests only for them.

## Validation (run the smallest thing that covers the change)
- Tests: `npx vitest run <changed test files>`; types: `npx tsc --noEmit`; whitespace: `git diff --check -- <changed files>`.
- Do not run the full suite or `npm run build` unless explicitly asked.
- Pipe verbose output through `Select-Object -Last 30`.

## Repo rules
- Preserve public APIs, defaults and existing visual output.
- Never modify Studio, showcase, README or the 33 approved palettes (and their HEX values).
- Many files use CRLF: keep line endings unchanged. Do not commit or publish unless asked.
- `tests/index.test.ts` asserts the exact set of root runtime exports; update it when exporting.

## Reporting
- Final answer: confirmed issues fixed, changed files, actual test results. No restating of the diff.
