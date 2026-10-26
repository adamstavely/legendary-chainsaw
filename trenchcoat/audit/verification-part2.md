# Part 2 verification – the Lit elements

2026-10-26 · Remediation step 2.8, on the finished port: 104 element tags (64 components, 22 illustrations, 8
motion pieces – shimmer-loader is two – and the sub-elements some components need), the React wrappers, the
gallery and the seven example apps.

| Check | Result | How |
|---|---|---|
| Axe, light and dark, both looks, Chromium | **186 of 186** gallery files clean | `A11Y_BROWSER=chromium node scripts/a11y.mjs scan <name>` |
| Same, Firefox | **186 of 186** clean | `A11Y_BROWSER=firefox …` |
| Same, WebKit | **185 of 186** – see below | `A11Y_BROWSER=webkit …` |
| Forced colours (Chromium emulation) | **Pass** – 95 entries, 889 controls: every button, switch, checkbox, combobox and field has a system-colour border, selected items are Highlight, every focusable control shows an outline | `node scripts/forced-colors.mjs` |
| Element browser tests (axe in both looks per element) | 6,636 tests pass in Chromium, Firefox and WebKit | `npm test` |
| Screen readers | **Not run** – see below | – |
| Perf: Firefox, WebKit, 4× CPU | Mount medians 16.0 ms (Firefox), 21.0 ms (WebKit), 24.8 ms (Chromium ×4) | `BENCH_BROWSER=… / BENCH_THROTTLE=4 node scripts/perf/bench/mount.mjs` |
| INP-style latency | All under 100 ms, the "good" INP limit is 200 ms – table below | `node scripts/perf/bench/inp.mjs` |
| Examples on every element | **All 7 apps pass**; the html app mounts all 104 tags from `custom-elements.json` without errors | `npm run examples` |
| Tree-shaking | Importing `trenchcoat/button` bundles the button and no other element: 15.5 KB gzip with the Lit runtime | the html app's `shake.js` build |
| Bundlers | Vite (React, Vue, Nuxt, Svelte, html), webpack (Next.js, `next build --webpack`), esbuild (Angular) | `npm run examples` |
| Client-only loading | Next.js (`dynamic(…, { ssr: false })`) and Nuxt (`<ClientOnly>`) build and run without hydration errors | `npm run examples` |
| Types and events | React example type-checks the wrappers; Vue type-checks templates against `trenchcoat/vue`; Svelte and Angular untyped (lit-patterns.md) | `npm run examples` |

## Interaction latency (input event to the frame after it's handled; median and worst of 5–7)

| Interaction | Chromium | Firefox | WebKit | Chromium, CPU ×4 |
|---|---|---|---|---|
| combobox, 5,000 options: open | 16.9 / 40.6 ms | 17.0 / 18.0 | 17.0 / 19.0 | 17.9 / 96.6 |
| command-menu, 5,000 commands: typing, per key | 10.8 / 15.8 | 4.0 / 9.0 | 12.0 / 16.0 | 19.3 / 29.5 |
| data-table, 10,000 rows: sort | 16.7 / 18.3 | 10.0 / 14.0 | 17.0 / 18.0 | 26.9 / 31.3 |

Firefox and WebKit report whole milliseconds. The Event Timing API isn't in WebKit, so the script times from the
event's timestamp to the next frame itself.

## Findings

- **Fixed: trace-waterfall rows showed no focus in forced colours** – their focus ring was an inset box-shadow,
  which forced colours removes (the React version had the same gap). They get an outline there now.
- **WebKit, glow-keyboard (light):** axe in WebKit reports colour contrast on the illustration's key caps; Chromium
  and Firefox don't. The styles are identical in all three, and the keyboard is decorative (`aria-hidden="true"`), so
  1.4.3 doesn't apply – an axe engine difference on hidden content, not a change.
- **decision-tree** (carried over from React, 2.6): the folded "N options" text in the narrow layout is under 4.5:1,
  and the follow-up option buttons fail `label-content-name-mismatch` in real browsers. Open – listed in
  `audit/design-review/README.md` follow-ups.

## Not done

- **VoiceOver.** Decision L16 planned for Claude to run it. Computer use gives the session read-only access to
  browsers, so it can't operate Safari with VoiceOver; it needs a person. The components to cover are toaster,
  combobox, command-menu, data-table, date-range-picker, agent-tree and review-center (live regions and custom
  keyboard patterns). NVDA and JAWS aren't tested. The WCAG audit's status line says so.
- **Typed Angular and Svelte templates** (lit-patterns.md, Not done).
- CPU throttling exists only in Chromium; Firefox and WebKit run unthrottled.
