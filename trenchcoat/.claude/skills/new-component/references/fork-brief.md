# Brief for a component-building fork

Give each fork two or three related components. Forks inherit the conversation, so they already know the
conventions; the brief fixes the scope and the rules that keep parallel forks from colliding. Fill in the
<placeholders>:

```
Build exactly these <N> new Trenchcoat elements in <absolute path to trenchcoat>, following
.claude/skills/new-component/references/conventions.md (TcElement, light DOM, Standard tray + Clean card, cardHead,
tokens only, roving focus, cancelable change events with the property's own name in the detail, React wrapper with
useControlled for controllable state, demo, docs page with every required section, browser tests incl. the React
wrapper and axe in both looks and both themes, expect.poll – no fixed waits). Read <closest existing element(s)>
first and reuse their patterns without editing them.

1. `tc-<slug>` (src/elements/<slug>.ts, prefix "<prefix>"): <what it shows, its data shape, its states and words,
   its interactions and events, its narrow-width behaviour>.
2. …

Demo data: <a fictional, neutral setting>.

STRICT RULES:
- Only create NEW files: src/elements/<slug>.ts, src/elements/react/<slug>.ts, app/src/demos/<slug>.tsx,
  app/src/docs/<slug>.md, tests/elements/<slug>.test.ts. Do not edit any existing file. You may run
  `node scripts/gen-elements.mjs`.
- Other forks are writing other new elements at the same time – don't touch their files; ignore their errors.
- iCloud creates "<name> 2.<ext>" copies in this repo – ignore them, never import or edit them.
- Never touch icon-composer. No git commands. Don't use the browser pane.
- Don't run gen-docs, check-docs, capture-thumbs or measure-perf – the parent does.
- Verify: tsc (ignore errors in other forks' files and " 2" copies), eslint on your files,
  `npx lit-analyzer src/elements/<slug>.ts --strict`, `node scripts/check-ratchet.mjs` clean for your files,
  `node scripts/check-tokens.mjs`, `node scripts/check-prefixes.mjs`, and your tests passing in chromium, firefox and
  webkit – list the files explicitly on the vitest command line.
- Final report (short): files, each element's public API, a README one-liner each
  ("- **Name** (`slug.tsx`) – …"), the gallery category you suggest, the docs `related` slugs, anything unfinished.
```

Launch the forks in one message, with `run_in_background: true`, then integrate when they've all reported.
