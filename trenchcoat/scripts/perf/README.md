# Perf bench

The scripts behind `audit/bundle-and-performance-audit.md` and `audit/perf-baseline-react.md`. Slow and
machine-dependent, so not part of `npm run ci`. Run them from `.perf/` (git-ignored); each writes its results
there. The repo root is the default for scripts that take one.

| Script | Measures | Run |
|---|---|---|
| `bundle.mjs` | Every published file bundled on its own (esbuild, minified): min / gzip / brotli, CSS, fallbacks, helpers | `node ../scripts/perf/bundle.mjs .. sizes.json` |
| `report-sizes.mjs` | The tables from `sizes.json` | `node ../scripts/perf/report-sizes.mjs sizes.json` |
| `combo.mjs` | 1 / 5 / 10 / 64 components bundled together | `node ../scripts/perf/combo.mjs ..` |
| `bench/build.mjs` | Builds the bench page (every demo, production React with the profiler) | `node ../scripts/perf/bench/build.mjs ..` |
| `bench/mount.mjs` | Mount cost per demo | `node ../scripts/perf/bench/mount.mjs` |
| `bench/large.mjs` | Large-data mount and interaction timings | `node ../scripts/perf/bench/large.mjs` |
| `bench/steady.mjs` | Commits, rAF and timers at rest, in view and off-screen | `node ../scripts/perf/bench/steady.mjs` |
| `bench/anims-all.mjs` | Infinite CSS animations still running off-screen | `node ../scripts/perf/bench/anims-all.mjs` |
| `bench/leak.mjs`, `leak2.mjs` | Listeners, observers, timers and heap after mount/unmount cycles | `node ../scripts/perf/bench/leak.mjs` |

The bench mounts each gallery demo: through the React wrappers (`src/elements/react.ts`) for everything ported to Lit, through the React module for blocks, screens and the React files that stay. The React numbers from before the port are in `audit/perf-baseline-react.md`.
