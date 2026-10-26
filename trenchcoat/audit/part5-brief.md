# Part 5 – the brief

Part 5 adds 27 components (remediation plan, Part 5). Build each one exactly as Part 3's were, and document it as
Part 4's pages were – in the same pass, so it ships with its page:

1. **[new-component-brief.md](new-component-brief.md)** – the element, the React wrapper, the tests, the demo,
   looking at it in both looks and both themes and at 320 px, and the checks. Everything there applies.
2. **[docs-brief.md](docs-brief.md)** – the guidance file `app/src/docs/<slug>.md`, JSDoc on every public property,
   event, slot and React prop, and the page checked with `docs-shot`. `status: new` for every Part 5 component.
3. **This file** – what's new since Part 3.

## What's new since Part 3 – use it, don't copy it

- **Shared helpers** in `src/elements/internal/`:
  - `controllers.ts` `ToolbarController` – the WAI-ARIA toolbar: one tab stop, arrows (`orientation` horizontal,
    vertical or both), Home/End; natively disabled buttons are skipped, aria-disabled ones stay reachable.
    Wire `onKeyDown` / `onFocusIn` to the toolbar element; don't bind tabindex in the template.
  - `util.ts` – `initials()`, `copyText()`, `tokenMs()`, `isMac()`, `textCaret()`.
  - `format.ts` – `duration()` (420ms · 3.4s · 2m 05s), `dollars()`, `compact()` (3.4k).
  - `layered-graph.ts` `layoutColumns()` – nodes in columns, crossings reduced, curved edges, weak edges flagged.
  - The existing controllers (row window, focus rescue, smooth height, off-screen, on-screen, hotkeys, rolling).
- **Tokens** in `tokens/tokens.css`, in both looks:
  - `--tc-source-grounded-fg/-bg`, `--tc-source-model-fg/-bg`, `--tc-source-inferred-fg/-bg` – where a claim came
    from;
  - `--tc-validity-high/-good/-aging/-stale` `-fg/-bg` – evidence freshness bands;
  - `--tc-syntax-*` – code colours;
  - `--tc-tone-teal-*`, `--tc-surface-well`, `--tc-accent-solid`, `--tc-z-popover`.
- **Your README line and gallery category are already in place** – your component's page must live up to its
  README line, or say in your report why it can't.

## Decision M – domain-neutral

The Trust & calibration components come from THEMIS, a governance platform for legal and intelligence analysis.
Build them for any product:
- Source types default to "Sourced", "Model knowledge" and "Inferred". The labels are properties, so an app can
  use its own (THEMIS calls them GRND / PARAM / SYNTH).
- Thresholds, bands and indices are properties, with sensible defaults.
- Legal or intelligence vocabulary goes in demo data at most, never in the component's text.

## Working alongside others

- Several agents build at once in this checkout. Touch only your components' files, plus the generated
  index, React and api files through their scripts.
- Use your own scratchpad subfolder, named after your first component.
- Run the scripts with your own slugs: `node scripts/gen-docs.mjs <slugs>` and
  `node scripts/check-docs.mjs <slugs>`.
- Your gallery page reloads when another agent saves a file. Give a scripted demo time to run, and retry a
  screenshot that caught it mid-reload.
- No git commands. Never touch `icon-composer/` or anything outside `trenchcoat/`.

## Report

Per component: done or not; test count; the API in a few lines; the keyboard pattern; what you changed after
looking; check-docs passing; anything uncertain. Short.
