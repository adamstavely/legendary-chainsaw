# Part 6 – the brief

Part 6 is in [remediation-plan.md](remediation-plan.md), Part 6. Build every component as Parts 3 and 5 did, and
document it in the same pass:

1. **[new-component-brief.md](new-component-brief.md)** – the element, the wrapper, the tests, the demo; look at it
   in both looks, both themes and at 320 px; the checks.
2. **[docs-brief.md](docs-brief.md)** – the guidance page, JSDoc everywhere, `docs-shot`. Every Part 6 page has
   `status: new`.
3. **[part5-brief.md](part5-brief.md)** – the shared helpers and tokens, decision M (domain-neutral), and "Working
   alongside others".
4. **[style-drift.md](style-drift.md)** – the type, button and field standard. **A card uses `cardHead()`** from
   `src/elements/internal/card-head.ts`. In Standard the header goes on the gray tray above the white card; in
   Clean it is the card's first row. The icon is boxed. Inline pieces (marks, chips, popovers, a toolbar) have no
   header.
5. **[ai-config-brief.md](ai-config-brief.md)**, the "What's wrong with them now" section – what to avoid. A
   component leads with a view designed for its job, not a generic stack of labelled fields. Forms are for
   editing.

## What's already in place

- Each component's README line in `src/components/README.md` and its gallery category in `app/src/registry.ts`.
  Your page must live up to the README line, or say in your report why it can't.
- The app owns data and side effects. A component never calls a model, a translation service, a book database or
  a network. It asks through cancelable events, or a resolver function property, and shows loading, error and
  retry.

## Working alongside others

- Several agents build at once in this checkout. Touch only your own components' files, plus the generated
  `index.ts`, `react.ts` and `api/*.json` through their scripts (`node scripts/gen-elements.mjs`,
  `node scripts/gen-docs.mjs <slugs>`, `node scripts/check-docs.mjs <slugs>`).
- Shared files (`tokens/tokens.css`, `src/elements/internal/*`) belong to the agent named in your prompt. Anyone
  else reports what they need.
- Take screenshots with your own Vite server, with HMR off, on a free port. Copy
  `/private/tmp/claude-501/-Users-adamstavely-Lockin-resolve/79595907-1212-49ec-9fe0-d84778023bc8/scratchpad/drift/aishots.mjs`.
  The shared gallery server reloads while others save.
- Don't run `check-ratchet --update`. No git commands. Never touch `icon-composer/` or anything outside
  `trenchcoat/`.

## Report

Keep it short. Per component:
- done or not;
- test count;
- the API in a few lines;
- the keyboard pattern;
- what you changed after looking;
- check-docs passing;
- anything you're unsure of.
