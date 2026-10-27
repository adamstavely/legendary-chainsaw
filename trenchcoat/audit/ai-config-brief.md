# AI configuration – the rebuild brief

The gallery's "AI configuration" category holds 14 components that were added outside the remediation plan:
provider-connection, configuration-release-control, mcp-connection-manager, data-handling-policy,
conversation-annotation, multimodal-input, model-settings, instruction-editor, output-schema-builder,
tool-configuration, knowledge-source-manager, retrieval-settings, evaluation-dataset-editor, model-routing.
They pass the repo checks, but none of them is up to the library's standard. Rebuild each one so it is.

Read first, and follow everything in them:
1. **[new-component-brief.md](new-component-brief.md)** – the element, the wrapper, the tests, the demo; looking at
   it in both looks, both themes and at 320 px; the checks.
2. **[docs-brief.md](docs-brief.md)** – the guidance page, JSDoc everywhere, `docs-shot`. `status: new`.
3. **[part5-brief.md](part5-brief.md)** – the shared helpers and tokens that exist now, and "Working alongside
   others".
4. **[ai-component-gaps.md](ai-component-gaps.md)** – the product notes these components were written from. Its
   "Extend these existing components first" section has the details each one is missing.

## What's wrong with them now

- **One generic form for everything.** Every component is `TcSettingsElement.panel()` – a card with a heading, a
  fieldset of stacked labelled inputs, and a status line – built from `field()` / `selectField()` in
  `internal/settings.ts`. Nothing is designed for its job: a model router doesn't show a route, an annotation tool
  doesn't feel like annotating, a release control doesn't show a pipeline.
- **Not the house style.** The code is Prettier-formatted (multi-line imports, one attribute per line), with no
  header comment describing the component, its keyboard pattern, and how Standard and Clean differ. Compare
  `src/elements/kill-switch.ts` or `src/elements/gate-config.ts` and match them.
- **Looks barely differ.** Standard and Clean are the same card with a different background.
- **`static ui` is the whole slug** ("model-settings"). Every other element uses a short, unique prefix (`ks`,
  `gcfg`); `check-prefixes` checks uniqueness.
- **Copy:** title-case headings ("Model Settings"), placeholder defaults ("Model"), demo text that says the demo is
  "simulated", "Working…" / "That didn't work. Try again." as the only feedback, raw `JSON.stringify` output in
  `<pre>` as a feature.
- **Demos** are a single static state. They should tell the component's story, as the Part 5 demos do: a
  connection test that fails then passes, a route that falls back, a release that's promoted.

## What to keep

- The tag names, so the registry, README lines and docs slugs stay as they are.
- Their genuine behaviour where it's right: form association (`formAssociated`, `ElementInternals`, reset and
  disabled callbacks), cancelable `tc-value-change` for controlled use, AbortController-cancelled async actions.
  Rewrite it in house style inside your element, or extract a small, clean helper into `internal/` if two of your
  components share it. **Don't import `panel`, `field`, `selectField` or `settingsCss` from
  `internal/settings.ts`.** The form primitives (`tc-switch`, `tc-checkbox`, `tc-slider-field`, `tc-number-field`,
  `tc-radio-group`, `tc-secret-field`, `tc-tooltip`, `tc-dialog`) still use that file. Leave the file and those
  primitives alone. You may use the primitives inside your components where one fits, but check that it looks
  right in both looks first.
- Decision M applies: domain-neutral. Provider names, models and data belong in demo data, never in the component.
  Credentials: never show or export a raw secret; use a reference and a masked hint.
- Nothing is real. The app supplies connection tests, evals, routing decisions, retention enforcement and so on,
  through events and properties. The component shows state and asks the app; it never fakes a result. Say so in
  the docs, not in the UI.

## Per component – your report

Per component:
- done, or not;
- test count;
- the API in a few lines;
- the keyboard pattern;
- what you changed after looking;
- whether check-docs passes;
- anything you're unsure of.

Keep it short.
