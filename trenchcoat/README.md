# Trenchcoat

A UI kit for AI-native products: five libraries of single-file React components, plus the Trenchcoat gallery app that shows them all.

| Folder | What |
|---|---|
| `src/components/` | **The source** of each component – one file per component, both looks |
| `src/internal/` | Shared helpers, inlined into the published files by the build |
| `components/` | The published single-file components, generated from `src/` by `npm run build:lib`: `<name>.tsx` (Standard look) and `<name>-clean.tsx` (Clean look). Don't edit these directly – `plan-vs-actual-clean.tsx` is the one hand-written exception |
| `blocks/` | Sections composed from components |
| `screens/` | Full app screens and the App Shell frames |
| `illustrations/` | Animated visuals for empty states and marketing |
| `motion/` | Animation primitives |
| `app/` | The Trenchcoat gallery (Vite + React) |
| `tests/` | Smoke and regression tests |
| `tokens/` | The `--tc-` design-token dictionary (`tokens.css`, optional for consumers) and resolved fallbacks |
| `audit/` | WCAG 2.2 audit, code-quality review, the fix plan and the design-token analysis |

## Commands

```bash
npm install
npm run dev          # gallery at http://localhost:5199
npm run ci           # everything CI runs: typecheck, lint, prefix + ratchet checks, tests
```

## How a component is built

Edit `src/components/<name>.tsx`, then `npm run build:lib` (or `node scripts/build-lib.mjs <name>`). The build writes both published files – identical except their default `look` – inlining `src/internal` helpers and adding per-look fallbacks for every `--tc-` token, so each published file still works on its own with React as its only dependency. A component's `look` prop (`"standard"` | `"clean"`) overrides the file's default; the root renders `data-look`. CI fails if a published file is out of date.

## Guard rails (Phase 0 of audit/code-quality-fix-plan.md)

- **Smoke tests** (`tests/smoke.test.tsx`) mount every gallery demo in every style under StrictMode with fake timers for 5 simulated seconds, frame by frame. They fail on any error, on re-rendering more than half of all frames, on exceeding the recorded render budget (`tests/render-budgets.json`, +25%), and on timers left pending after unmount. After an intended change in render behaviour: `UPDATE_BUDGETS=1 npm test`.
- **Known-bug tests** (`tests/known-bugs.test.tsx`) reproduce High-severity bugs from the review as `test.fails`.
- **Known issues** (`tests/known-issues.ts`) list smoke failures that exist today. Fixing one makes the suite fail until it's removed, so these lists only shrink.
- **Prefix check** (`scripts/check-prefixes.mjs`) fails when two files render the same CSS root class; existing collisions are listed and must be fixed, not added to.
- **Design tokens** (`scripts/check-tokens.mjs`): no legacy `--ui-` tokens; every dictionary token reference carries the exact fallback for its file's look, so a single copied file renders without `tokens.css`. After editing `tokens/tokens.css`, run `node scripts/tokens.mjs && node scripts/check-tokens.mjs --fix`.
- **Visual regression** (`scripts/visual.mjs`): deterministic screenshots of every gallery entry in both styles and themes; `capture <dir>` then `compare <base> <dir>` (reports changed, and colour shifts too subtle for pixelmatch as "subtle").
- **Ratchet** (`scripts/check-ratchet.mjs`) counts risky patterns per file (unexplained eslint-disables, hard-coded ids, render-time clock reads, `any`, `dangerouslySetInnerHTML`); counts may only go down. Lock in an improvement with `node scripts/check-ratchet.mjs --update`.
