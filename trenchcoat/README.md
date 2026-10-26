# Trenchcoat

A UI kit for AI-native products: five libraries of single-file React components, plus the Trenchcoat gallery app that shows them all.

| Folder | What |
|---|---|
| `src/components/` | The components – one file per component with both looks (the `look` prop picks one); plan-vs-actual has Clean only |
| `src/internal/` | Helpers the components share |
| `blocks/` | Sections composed from components |
| `screens/` | Full app screens and the App Shell frames |
| `illustrations/` | Animated visuals for empty states and marketing |
| `motion/` | Animation primitives |
| `app/` | The Trenchcoat gallery (Vite + React) |
| `tests/` | Smoke and regression tests |
| `tokens/` | The `--tc-` design-token dictionary (`tokens.css`, which apps load once – components rely on it) and resolved fallbacks for the hand-written libraries |
| `audit/` | WCAG 2.2 audit, code-quality review, the fix plan and the design-token analysis |

## Commands

```bash
npm install
npm run dev          # gallery at http://localhost:5199
npm run ci           # everything CI runs: typecheck, lint, prefix + ratchet checks, tests
```

## How a component is built

Edit `src/components/<name>.tsx`. There's no build step: the gallery and the tests load the source directly, and the `look` prop (`"standard"`, the default, or `"clean"`) picks the look; the root renders `data-look`. Components read their values from `tokens/tokens.css`. The components are being ported to Lit web components and packaged (`audit/remediation-plan.md`, Part 2; `audit/lit-port-plan.md`).

## Guard rails (Phase 0 of audit/code-quality-fix-plan.md)

- **Smoke tests** (`tests/smoke.test.tsx`) mount every gallery demo in every style under StrictMode with fake timers for 5 simulated seconds, frame by frame. They fail on any error, on re-rendering more than half of all frames, on exceeding the recorded render budget (`tests/render-budgets.json`, +25%), and on timers left pending after unmount. After an intended change in render behaviour: `UPDATE_BUDGETS=1 npm test`.
- **Known-bug tests** (`tests/known-bugs.test.tsx`) reproduce High-severity bugs from the review as `test.fails`.
- **Known issues** (`tests/known-issues.ts`) list smoke failures that exist today. Fixing one makes the suite fail until it's removed, so these lists only shrink.
- **Prefix check** (`scripts/check-prefixes.mjs`) fails when two files render the same CSS root class; existing collisions are listed and must be fixed, not added to.
- **Design tokens** (`scripts/check-tokens.mjs`): no legacy `--ui-` tokens; in blocks, screens, illustrations and motion every dictionary token reference carries the exact fallback for its file's look, so a single copied file renders without `tokens.css` (components rely on `tokens.css`). After editing `tokens/tokens.css`, run `node scripts/tokens.mjs && node scripts/check-tokens.mjs --fix`.
- **Visual regression** (`scripts/visual.mjs`): deterministic screenshots of every gallery entry in both styles and themes; `capture <dir>` then `compare <base> <dir>` (reports changed, and colour shifts too subtle for pixelmatch as "subtle").
- **Ratchet** (`scripts/check-ratchet.mjs`) counts risky patterns per file (unexplained eslint-disables, hard-coded ids, render-time clock reads, `any`, `dangerouslySetInnerHTML`); counts may only go down. Lock in an improvement with `node scripts/check-ratchet.mjs --update`.
