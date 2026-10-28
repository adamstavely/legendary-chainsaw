---
name: new-component
description: Build new Trenchcoat components end to end, the way the library's existing ~240 were built. Covers each component as a Lit element with both looks, plus its React wrapper, gallery demo, docs page and browser tests, then the gallery, Angular, generative-UI and docs integration, checks, and the PR. Use this whenever someone asks for a new component, widget, card, chart, panel or "a component like this screenshot / this app" in trenchcoat or legendary-chainsaw, even if they don't say "component" – and when adding several at once from a review of another app.
---

# Building a Trenchcoat component

A Trenchcoat component is done when it looks and behaves like the rest of the library, and when every generated
surface knows about it:
- the gallery;
- the docs;
- the React wrapper;
- the Angular directive;
- the generative-UI schema;
- the thumbnails;
- the performance table.

This skill is the path that gets there without the slips that cost time.

Work from `trenchcoat/` (the package root). Paths below are relative to it.

## 1. Decide what to build

- **Check it doesn't exist.** Search `src/components/README.md`, the gallery's list with one line per component, for
  the idea and its neighbours. A close match is often a variant or a prop on an existing element, not a new one; say
  so before building.
- **Pick the slug and prefix.** The slug is kebab-case and becomes `tc-<slug>`. The prefix is a short, unique
  `static ui` value, used as `ui-<prefix>__…` in CSS. Check the prefix is free:
  `grep -h 'static override ui = "' src/elements/*.ts`.
- **Pick the gallery category.** The sections are in `app/src/registry.ts` under `categories`. A new section is fine
  when several components share a theme; the user approved "People & profiles", "Research & portfolio" and "Search"
  that way.
- **Keep demo data fictional and neutral.** Use a fraud review, an audit or a research institute. Never covert
  surveillance of private people, even when the reference app is that kind of tool. Reference apps and screenshots
  set the idea, not the styling or branding. For example, citation badges carry no third-party logo; the page passes
  its own.

## 2. Build the five files

| File | What it is |
|---|---|
| `src/elements/<slug>.ts` | The Lit element: both looks, tokens only, keyboard, cancelable change events |
| `src/elements/react/<slug>.ts` | The React wrapper (`@lit/react` + `useControlled` for controllable state) |
| `app/src/demos/<slug>.tsx` | The gallery demo, using the wrapper |
| `app/src/docs/<slug>.md` | The docs page, with every required section |
| `tests/elements/<slug>.test.ts` | Browser tests: structure, behaviour, keyboard, controlled use, React, axe |

Read `references/conventions.md` before writing the element. It holds:
- the element skeleton (looks CSS, cardHead, events);
- the accessibility patterns;
- the docs-page format;
- the test checklist.

Then copy the shape of the closest existing element rather than starting blank:

| Building… | Read first |
|---|---|
| A grid or list with a detail panel | `coverage-matrix.ts` |
| An SVG chart with segments | `activity-clock.ts`, `coverage-ring.ts` |
| A stepper or pipeline | `status-tracker.ts` |
| A list with masked values | `document-list.ts` |
| A streaming AI result | `file-summary.ts`, `ai-summary.ts` |
| A diagram with connectors | `traceability-spine.ts`, `money-flow.ts` |

`CONTRIBUTING.md` has the token rules: which token to use for which pattern, and the ratchet.

### Several components at once

For three or more components, build them in parallel with `fork` agents, two or three components per fork, grouped
by theme. Use the brief in `references/fork-brief.md`. Forks only create new files, and you integrate everything in
step 3, because all of them would otherwise edit the same shared files (registry, README, changelog, generated docs).

When a fork reports back, note:
- its README one-liner and suggested category;
- anything it flagged in other forks' files, such as a type clash or a ratchet hit.

## 3. Integrate

1. **Register in the gallery.** `node .claude/skills/new-component/scripts/add-to-gallery.mjs` adds the README line in
   alphabetical order and the slug to its category; run it with `--help` for the arguments. Then add a changelog
   entry at the top of `CHANGELOG.md`: an `## Unreleased – …` section listing what was added.
2. **Run the integration pass.**
   `node .claude/skills/new-component/scripts/integrate.mjs --slugs <slug,slug,…>`. It:
   - deletes iCloud duplicate files;
   - regenerates the element index, docs, Angular wrappers and generative schemas;
   - measures performance and captures thumbnails for anything new;
   - runs every check;
   - runs the new components' tests in Chromium, Firefox and WebKit, plus the React suite;
   - stops at the first failure, saying what to fix.
3. **Fix what it reports, then run it again.** Common fixes:
   - **Ratchet failure, `clock/environment read`.** A component with its own clock (a `Date.now()` used when `now`
     isn't given) needs `node scripts/check-ratchet.mjs --update`, as the contract allows. Any other ratchet failure
     means a literal: use a token or a component token instead of updating the baseline.
   - **Docs check, `has no description`.** Give every public property its own JSDoc line; one comment over two
     properties only documents the first.
   - **Snippets check, Angular errors.** The controlled example reads `detail.<property>` for `tc-<property>-change`.
     Include that field in the event detail; it can sit beside an existing one.

## 4. Look at it

The tests can't judge layout. Start the gallery: `npx vite --port 5200` from `trenchcoat/`, or reuse a running one.
Check each new component at `http://localhost:5200/#/<slug>` in Standard and Clean, light and dark, full width and
narrow.

Tile the light thumbnails from `app/src/thumbs/components/<slug>.light.webp` into one sheet to compare them at a
glance. Things that have needed fixing before:
- labels hidden under other elements;
- names cut off;
- a drawing squeezed into a narrow card; it should keep its size and scroll;
- a panel that looks doubled.

Elements register their CSS once per page load, so reload the page after a CSS change. A screenshot taken mid-scroll
or mid-animation can look broken when nothing is; check the DOM before chasing a layout bug.

## 5. Commit, PR, merge

- **Stage only Trenchcoat.** Stage only `trenchcoat/` and, when changed, `.github/workflows/trenchcoat-ci.yml`.
  Never `git add -A` at the repo root, and never touch `icon-composer/`. Before committing, check that nothing named
  `* 2.*` is staged.
- **Branch from `main`.** If the work is already in your working tree, stash it, switch, then pop. Commit with a
  message that lists what was added, and open a PR whose body says what each component does and what was checked.
- **Watch CI yourself.** The repo has no required checks and auto-merge is off, so `gh pr merge --auto` merges at
  once. Run `gh run watch <id> --exit-status` in the background.
- **Merge only when the user has asked and every job has passed.** Use `gh pr merge <n> --merge`.
- **WebKit flakes.** A WebKit shard that dies with "page crashed … out of memory" is the runner, not the code: re-run
  it with `gh run rerun <id> --failed`. A real test failure on WebKit alone is usually timing: fix it with
  `expect.poll` or `finish()`, not a longer wait.

## Things that have bitten before

- **iCloud copies.** The repo lives under `~/Documents`, which iCloud syncs. It keeps creating `name 2.ts`,
  `name 3.json` copies, and an older copy can shadow a newer file in generated indexes. `integrate.mjs` removes them;
  check again before committing.
- **Stale test cache.** If a test fails on something you just changed, run `rm -rf node_modules/.vitest-cache`.
- **zsh doesn't split variables.** `$FILES` passed to vitest is one argument, so list test files explicitly.
- **The main typecheck excludes `src/angular/`.** Those files import the built package and are checked by
  `npm run check:angular`.
- **Prop names that collide with React DOM props.** `onSelect`, `onCopy` and similar break the wrapper's types; name
  the callback for what it does (`onSegmentSelect`, `onCopyHash`).
- **Accessible names.** A button's accessible name must contain its visible text (axe's label-in-name rule): name it
  from its own words plus screen-reader-only text, not an `aria-label` that differs.
- **Dim with colour, not opacity.** Text faded with `opacity` fails contrast; mute it with token colours instead.
- **Measuring width.** For a ResizeObserver layout, measure the scroll container, not the drawing; a drawing given
  its own width otherwise feeds back into the measurement.
- **Keyboard tests.** Send `{ ctrlKey: true, metaKey: true }` for ⌘/Ctrl shortcuts: WebKit on Linux reports a Mac
  user agent.
- **axe after animations.** Run axe after `await finish(el)`, so contrast is measured on settled colours.
