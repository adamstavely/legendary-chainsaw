# Changelog

## Unreleased – Donovan scenes and neutral marks

- **Agent Scene** (`tc-agent-scene`) – the assistant in a small scene for all clear, working and offline.
- **Lead Sourcing** and **Enrichment Orbit** take `neutral`, which draws plain marks in place of third-party logos.

## Unreleased – Sharing and search screens

- **Sharing & Access** – a screen with team flags, access reviews and the audit trail.
- **Search Results** – a screen with search, filters, results and Nothing Found.

## Unreleased – Case review

- **Case Review** (`tc-case-review`) – a block for one case: evidence, a timeline, the assistant's labelled suggestion, and
  a decision that needs a written reason. Nothing is chosen for you.
- **Case File** – a screen with Case Review, Donovan and the case's file.

## Unreleased – Reviewing access and the record

- **Access Review** (`tc-access-review`) – a block for periodic reviews of who can see what: keep or remove each one,
  with a written reason for keeping anyone flagged.
- **Audit Trail** (`tc-audit-trail`) – a block showing who did what and when, with search, a filter by outcome and a CSV
  export that keeps spreadsheet formulas from running.

## Unreleased – Motion for state changes

- **List Motion** (`tc-list-motion`) – rows glide when reordered, added or removed. Team Flag Editor now uses it.
- **Collapse** (`tc-collapse`), **Success Check** (`tc-success-check`) and **Attention Pulse** (`tc-attention-pulse`) –
  opening and shutting, a one-time tick, and a one-time ring to draw the eye.

## Unreleased – File details and states

- **File Details** (`tc-file-details`) – a block with one file's details, the team's flag, a summary, its versions and
  entitlement-checked sharing.
- **No Access** (`tc-no-access`), **Nothing Found** (`tc-nothing-found`) and **Something Wrong** (`tc-something-wrong`) –
  illustrations for the states people reach when a page can't show what they wanted.

## Unreleased – Sharing

- **Share Panel** (`tc-share-panel`) – shares with people and groups at a level for each, after checking each one's
  entitlement. Anyone not authorized is flagged, the person sharing is told, and they're left out; a failed check counts
  as not authorized.

## Unreleased – Team flags

- **Team Flag Editor** (`tc-team-flag-editor`) – where a team sets each flag's colour, name, meaning and order, and asks
  first before removing a flag that's on files. `readonly` shows the flags to people who can't change them.
- **Team Flag Picker** (`tc-team-flag-picker`) – picks one of those flags for a file, with what each one means in the
  list, and says when a file's flag has since been removed.

## Unreleased – Donovan's face

- **Agent Face** (`tc-agent-face`) – Donovan's animated face: idle, listening, thinking, speaking, happy, confused,
  sleeping, error and surprised, blending on springs, with floating white hands, blinks, glances and `playGesture` for a wave, nod, hop or spin. It
  wraps `<agent-face>` from `agent-face/`, stops drawing when off screen, and rests when it isn't busy.

## Unreleased – a form the server describes

- **HAL Form** (`tc-hal-form`) – give it a HAL-FORMS document (`resource`) or its URL (`src`) and it draws the template
  as controls: every `type`, `options` inline or from `options.link` (JSON or CSV), `selectedValues`, `minItems` and
  `maxItems`. It checks `required`, `regex`, lengths, ranges and steps when a field is left and on submit, then sends to
  `_htarget`, `target`, the `self` link or `src`, as JSON, form encoding or a query string. `fetcher` adds auth,
  cancelable `tc-submit` hands the request to the app, and `errors` shows the server's messages on fields.

## Unreleased – a chat minimap

- **Chat Minimap** (`tc-chat-minimap`) – a slim rail beside a long chat with a tick for each message the person sent,
  longer for longer messages, and the one in view lit. Pointing at a tick (or moving to it with the arrow keys) shows
  the message and where it falls; a click or Enter scrolls the chat back to it, holding still while the jump scrolls.
  It follows the chat's scroller by itself, or the page drives `current` with `manual`; cancelable `tc-jump` and
  `tc-current-change`.

## Unreleased – a radar chart and a year list

- **Radar Chart** (`tc-radar-chart`) – a few measures on axes round a centre, joined into a shape: one series with its
  value over each axis's name, or up to three compared in their own colours with a legend. A cross of axes or a web of
  rings (`grid="web"`), scaled to the largest value, 100 for “%”, or `max`; read as its numbers, with a Table view.
- **Year List** (`tc-year-list`) – years to choose one from, newest first, as a column or a row that scrolls: a
  `listbox` with one tab stop, keys that move without choosing, Enter or Space to choose, typing a year to jump to it,
  an optional count on each year and a cancelable `tc-selected-change`.

## Unreleased – inline details for entities and identifiers, three inputs and three charts

- **Entity Details** (`tc-entity-details`) – emails, phone numbers, links and @handles in text are found and marked;
  hover, focus or right-click opens a card with Copy, Write email / Call / Open and what your `resolve` (or a
  `tc-entity-lookup` listener) knows. **Identifier Details** (`tc-identifier-details`) does the same for DOIs, IP
  addresses (private and reserved ranges named), file hashes, CVE ids and tracking numbers.
- **Tree Select** (`tc-tree-select`) – one or many from a nested hierarchy, with filtering that keeps parents, ARIA tree
  keys and cascading parent checkboxes; a form control.
- **Breadcrumbs** (`tc-breadcrumbs`) – a trail whose middle folds into "…" when it doesn't fit, with a cancelable
  `tc-navigate` and Copy path.
- **Tag Input** (`tc-tag-input`) – free-text chips with suggestions, paste, limits, de-duplication and validation; a form
  control.
- **Sparkline** (`tc-sparkline`), **Heatmap** (`tc-heatmap`) and **Gauge** (`tc-gauge`) – an inline trend, a shaded
  matrix with legend, selection and table view, and a value against its bands as a dial, half dial or bar (optionally a
  slider).

## Unreleased – search results, research planning, and people

- **Search**
  - **Results List** (`tc-results-list`) – results with the query's words marked in their snippets, grouped by kind
    with counts, Relevance / Date, “Did you mean” and Show more.
  - **Facet Sidebar** (`tc-facet-sidebar`) – checkbox, radio, range and date filters with counts, active filters as
    chips with Clear all.
  - **Saved Search Alerts** (`tc-saved-search-alerts`) – saved searches that report new matches, with frequency,
    channels, pause, Run now and remove with Undo.
- **Research & portfolio**
  - **Roadmap Timeline** (`tc-roadmap-timeline`) – Gantt-style lanes with progress, milestones, Today and
    dependency arrows, at week, month or quarter scale.
  - **Prioritisation Matrix** (`tc-prioritisation-matrix`) – value against effort, points dragged or moved with
    the arrow keys, listed by quadrant.
  - **Risk Register** (`tc-risk-register`) – a 5 × 5 likelihood × impact grid beside a sortable, rescorable register.
  - **Bibliography** (`tc-bibliography`) – references in APA, MLA, Chicago, Harvard or IEEE, with Copy and BibTeX /
    RIS export.
- **People & profiles**
  - **Org Chart** (`tc-org-chart`) – reporting lines that fold, search that opens the way, pan and zoom, an outline
    when narrow.
  - **Person Hovercard** (`tc-person-hovercard`) – the profile card behind any name, with status and local time.
  - **Team Roster** (`tc-team-roster`) – a directory with everyone's local time and the team's best hour to meet.
  - **Relationship Graph** (`tc-relationship-graph`) – people and organisations around one of them, re-centring on
    click, with a keyboard list of every connection.
## Unreleased – a to-do list

- **To-do List** (`tc-todo-list`) – add a to-do (Enter), tick it off, click its words to edit them, move it with
  Alt + ↑ / ↓, remove it with Undo; All / To do / Done tabs with counts, a done bar and Clear done. One cancelable
  `tc-items-change` carries the whole next list and what changed, so a page can keep it in its own store.
## Unreleased – Loupe, a design-system inspector

- **Loupe** (`tc-loupe`) – remade from cautious-lamp's LoupeTool. ⌘⇧L outlines the page's components
  (`data-ds-component` and the library's own elements) with a card of name, path, size, look and docs / source /
  design links; a ruler marks the breakpoints and the window's width; flex and grid containers are outlined and listed.
  Unlike the original, the page keeps scrolling and working underneath, outlines follow scrolling, resizing and DOM
  changes (no polling), the overlay sits in the top layer so transformed or contained ancestors can't shift it, and
  everything is reachable from keyboard lists in the panel. Kept out of generative UI.
## Unreleased – a JSON viewer for review

- **JSON Viewer** (`tc-json-viewer`) – a JSON document laid out for someone to check: Document reads it like a form
  (keys in plain words, nested objects as sections, lists of like objects as tables, links, dates and yes/no drawn as
  what they are) and Raw is the pretty-printed JSON with line numbers; `layout="split"` shows them side by side, each
  field linked to its lines. Search marks and counts matches in every view; reviewers flag fields with notes
  (`tc-flags-change`); Copy and Download hand over the JSON – `source` as written, so integers too big to hold exactly
  (which are marked) keep their digits. `source` text that isn't valid JSON shows where it breaks. With `modal`, it's
  a dialog opened by `open`.
## Unreleased – fixes from a review of the newest components

- **Text to Speech** – when another reader (or the page) cancels the browser's shared speech queue, it pauses instead
  of showing "Reading" with nothing spoken; `lang` reflects to the attribute, as HTMLElement's does.
- **Access Request** – sending, cancelling and Request again keep focus (on what replaced the button); when the page
  controls `status`, the sent time, announcements and validation reset still happen; `level` and `duration` change
  through cancelable `tc-level-change` / `tc-duration-change`, and the React wrapper controls them
  (`onAccessDurationChange` – `onDurationChange` is a React media prop).
- **Score Survey** – a comment typed for a score whose follow-up question has gone isn't sent.
- **Colour Picker** – in CMYK with alpha, changing only the opacity keeps the colour exactly.
- **Speed Reader** – a listener that keeps the place pauses the reading instead of leaving it stuck on Pause.
- **Score Summary** – NPS and CSAT are worked out from the counts and rounded once: a balanced split is 0, not −1.
- **Geo Location** – a copy the browser refused no longer says Copied.

## Unreleased – fixes: redaction, release gates, deletion scopes and configuration panels

- **Conversation Annotation** – a redaction its message no longer matches blocks Send, says why, and the export blanks
  its quote wherever it still appears, so unmasked text is never sent. Redacted text is now absent from the whole
  page: a label over it quotes it as █, and so do the selection hint, the correction editor and its word diff.
- **Configuration Release Control** – the gate is checked again while the confirmation is open and at Confirm. If it
  fails (an approval withdrawn, a hold, a rollback that no longer applies), Confirm is disabled and the dialog says why.
- **Data Handling Policy** – Request deletion picks the first scope it can delete and never an unavailable one; Confirm
  refuses an unavailable scope and is disabled with the reason, including when the scope changes while open.
- **Form reset in twelve configuration panels** (Model Settings, Conversation Annotation, Data Handling Policy,
  Evaluation Dataset Editor, Gate Config, Instruction Editor, MCP Connection Manager, Output Schema Builder, Provider
  Connection, Retrieval Settings, Tool Configuration, Trigger Builder) – the baseline is taken on the first update,
  after React has set its props, not on connect. A reset fires the cancelable `tc-value-change`, so controlled
  wrappers hear about it (`field` is `null` in Data Handling Policy, `change.type` is `"reset"` in MCP Connection Manager).
- **MCP Connection Manager** – an app that answers inside its `tc-connect` listener no longer leaves the server
  stuck on Connecting….
- **Tool Configuration** – `__proto__`, `constructor` and `prototype` are refused as parameter names with a message,
  and if one gets through it stays an ordinary key in the schema and the example call.
- **Number Field** and **Slider Field** – clearing an optional field sets the value to `null` and submits nothing.
  A cleared required field is invalid.

## Unreleased – a UI kit for Adobe XD

- **`xd-kit/`** – an Adobe XD plugin that draws every component (Standard and Clean, light and dark) into an XD
  document as layered, named groups on one artboard per category, and adds the colour tokens and type scale to
  Assets. The drawings are read from the rendered components (`node xd-kit/extract.mjs`), so the kit follows the
  code; `npm run xd-kit` extracts, tests and packs `xd-kit/dist/trenchcoat-ui-kit.xdx`. XD's plugin API can't create
  components, so each group is one ⌘K away from becoming one.

## Unreleased – coordinates in text, and a sharper search family

- **Coordinate Details** (`tc-coordinate-details`) – the geospatial partner to ISBN Details. Coordinates in a passage
  (decimal, hemisphere-lettered or DMS) are found, range-checked and marked; hovering, focusing or right-clicking one
  opens a card with the place (from your `resolve` or a `tc-coordinate-lookup` listener), decimal and DMS with Copy,
  "Open in" mapping links and a map that loads only when asked. `trigger` picks hover, right-click or both.
- **AI Search** – suggestions take a `hint`, pick out what's typed, show ↵ on the highlighted one and the move / search
  / close keys beneath; Send appears once there's something to send.
- **Search History** – each search leads with an icon for how it ran (AI mode, builder, search), its scopes, results
  and time read as one line, and a row's actions show on hover or focus (a saved search keeps its star).
- **Query Builder** – the AND / OR switch is set in the UI font, the "Where / and / or" words show down to 500 px, and
  the date picker's button is quieter. **Routine Form**'s time picker button matches.

## Unreleased – colour picker, NPS / CSAT, coordinates, access requests, reading aloud

- `tc-color-picker` – a saturation and brightness square, hue and opacity sliders, HEX / RGB / CMYK fields, an
  eyedropper where the browser has one (`EyeDropper`), swatches and Copy. A form control, so Angular gets a
  ValueAccessor. CMYK is a plain device-independent conversion, not an ICC print profile.
- `tc-score-survey` – the NPS (0–10) or CSAT (1–5) question with a follow-up per band, Submit and a thank-you.
- `tc-score-summary` – NPS or CSAT results: the score, change and trend, target, bands and a bar per score.
- `tc-geo-location` – coordinates in decimal or DMS, Copy, Open in Google Maps, Apple Maps, OpenStreetMap, Bing or
  your own `providers`, and an OpenStreetMap embed that loads nothing until Show map. Generative UI can't set `embed`
  or `embedSrc`, so a generated map always waits for the click.
- `tc-access-request` – ask for access to one piece of data: level, duration, justification, fields; then pending,
  approved, denied or expired.
- `tc-text-to-speech` – reads a passage aloud with the browser's voices, marking the sentence and word.
- `tc-speed-reader` – RSVP speed reading at 100–1000 words a minute with the recognition point on a guide mark.
- The standalone gallery is rebuilt (#30).

## Unreleased – blocks as elements, routines, a calendar of calendars

### Blocks are Lit elements

- All 18 blocks are now elements – `tc-agent-gallery`, `tc-ai-side-pane`, `tc-ai-workspace`, `tc-app-directory`,
  `tc-client-context`, `tc-evidence-gallery`, `tc-header-nav`, `tc-invoice-credit`, `tc-kpi-board`,
  `tc-logo-marquee`, `tc-metrics-dashboard`, `tc-oversight-home`, `tc-pricing-plans`, `tc-publish-readiness`,
  `tc-red-team-finding`, `tc-task-board`, `tc-testimonial-wall`, `tc-uncertainty-mix` – so Angular
  (`trenchcoat/angular`), Vue, Svelte, plain HTML and generative UI get them like any component, with docs pages.
- Each `blocks/<slug>.tsx` is now a thin React wrapper that keeps its exports, props and types. Its `ref` is the
  `tc-<slug>` element, and with no `look` and no `LookProvider` a block is Standard, like every element (the React
  blocks read the page's `data-tc-look`).
- Every block has both looks; client-context, metrics-dashboard and task-board gain a Clean look.
- Renamed exports where names clashed in the barrel: ai-workspace's `ChatMessage`, `Conversation` and `Project` are
  `AiWorkspaceMessage`, `AiWorkspaceConversation` and `AiWorkspaceProject` (the block file still exports the old
  names). uncertainty-mix's element property is `hiddenKinds` and oversight-home's is `roleId` (`hidden` and `role`
  are HTMLElement's); the React props are unchanged.
- Fixed on the way: oversight-home's changes read "++6%" / "−+50%"; the side pane's composer was too tall as a sheet;
  red-team-finding's muted text on the selected row failed contrast in dark mode.

### New

- **Routine Form** (`tc-routine-form`): set up a scheduled routine – name, frequency, start time in a time zone with
  the next run worked out (DST-safe, `nextRoutineRun()` exported), first run now or on schedule, email notifications
  and instructions, with validation and Create / Save.
- **Multi Calendar** (`tc-multi-calendar`): a calendar of calendars – many people's Google, Outlook, Exchange and
  iCal calendars in Day, Week, Month, Agenda and a People view (one column per person), with show/hide per calendar,
  conflicts across a person's calendars, and create, edit, drag to move or resize, and delete on writable calendars –
  every change a cancelable event, so the page owns saving.
- **Search history:** an opt-in Schedule action on saved searches (`schedulable`, cancelable `tc-schedule`).

### Changed

- **Search components redesigned** to sit with the rest of the library: AI Search has a tray and card with the
  switches below and a keys hint; Query Builder draws its selects as library fields, reads as a sentence and keeps
  each condition on one line; Search History's filter is a quiet field.
- **Chat composer** measures its message again when its width changes.
- **Elements** keep rendering when a Lit parent swaps the last child it put inside them (`<tc-button>${icon}`), which
  used to throw "ChildPart has no parentNode".
- **Multi Calendar:** an event widens into free columns to its right, so busy days keep their titles readable.

## Unreleased – review fixes

### Generative UI (security)

- **Prototype keys:** a `__proto__` key can no longer carry props past the validator, and `required` is checked
  against the object's own keys.
- **Links:** every string an element binds to `href`/`src` is now checked: the generator marks those fields
  `format: "uri-reference"`, and any property ending in `href`, `url` or `src` is a link too (`policyHref`,
  `siteUrl`). `//host` and `/\host` are no longer accepted as relative links.
- **`allowedOrigins`:** a new option on `checkProps`, `checkComponent`, `mountComponent` and `tc-generated-ui` keeps
  images and other resources that load by themselves to the origins you list. Colour fields must be real colours
  (no `url()`).
- **Validator:** `not: {}` fields are dropped; `anyOf` keeps the branch with the fewest issues; values in open
  objects are checked, not copied; top-level `required`/`additionalProperties`, `minItems`/`maxItems` and string
  and number limits are enforced; `MAX_BYTES` is UTF-8 bytes. `date-time` strings become `Date`s, which the
  elements expect.
- **Mounting:** a prop a revised answer drops is reset; a component that fails to load shows a note, reports an
  issue and is retried.
- **Docs:** the Claude example caps its tool loop, checks components on the server and returns what was left out.

### Angular

- `trenchcoat/angular` imports `./<slug>.js`, so it loads under webpack, Karma, Vitest and Node, not only esbuild.
- Server-side rendering no longer crashes: `command-menu` builds its icons on first use instead of when the module
  loads. `check:angular` now imports every dist module in Node with no DOM.
- Form controls: a change the page cancels with `preventDefault()` no longer reaches the form; `reset()` / `null`
  becomes the element's empty value instead of crashing (combobox, dropzone); `disable()` on an element with no
  `disabled` warns in dev mode.
- Every output has a typed `$event`; the generator fails on an untyped event or an event name it can't map.

### Elements

- **Links from data** go through a shared `safeUrl` check in 50 elements: `javascript:` and other schemes render as
  text instead of a link.
- **money-flow:** totals are kept per currency; it keeps re-laying out after being moved in the page (as does
  chat-composer).
- **evidence-list:** hashes are compared as digests (case, spaces, prefix spelling); different algorithms read
  "Hashes not compared", not a mismatch.
- **Focus follows the item** when data changes in travel-itinerary, search-history, coverage-ring and profile-header.
- **search-history** reads the clock on every tick, so times stay right after sleep.
- **query-builder** only says "Copied" when the copy worked, and escapes backslashes and query syntax in values.
- **Bad data** (invalid dates, unknown tones or modes) no longer breaks rendering.
- Smaller: travel-itinerary's percentage is clamped, fingerprint-card's clip ids are unique, citation-badge closes
  on Escape while hovered, and the React `AiSearch` takes a controlled `value`.

### Tokens, build and tooling

- **DTCG export (`tokens/dtcg/`):**
  - `--check` now compares every exported token, resolved through its aliases, with what Chromium computes from
    `tokens.css` in each look and theme. Before, both sides came from the same parser, so a conversion bug passed.
  - Font weights that point at another weight (`--tc-control-font-weight`) stay `fontWeight` aliases instead of
    numbers.
  - Shadows and borders keep references to their colour and width tokens (`{border.default}`, `{focus-ring.width}`).
    Only `color-mix()`, `calc()` and theme branches that are literals in the CSS are exported resolved.
  - **Breaking for Tokens Studio users:** `$themes.json` and `$metadata.json` moved to `tokens/dtcg/tokens-studio/`,
    beside copies of the sets in the form Tokens Studio reads: string values, its own types (`boxShadow`,
    `fontWeights`) and `DEFAULT` for a group's own token. Its DTCG mode doesn't read 2025.10 colour and dimension
    objects yet.
  - The CSS-only tokens are listed for every set, primitives included.
- **Package:**
  - iCloud's `<name> 2.ts` copies are no longer build entries, type-checked or packed.
  - `trenchcoat/internal/*`, `trenchcoat/elements/*`, `trenchcoat/angular/*` (other than `angular/forms`) and other
    internal paths are no longer importable: they weren't API, and their types pointed at the wrong files.
  - `trenchcoat/package.json` is exported.
  - A `sideEffects` pattern that matched nothing is gone.
  - The Angular peer range is now the tested one, `>=19.0.0 <22.0.0`.
- **CI:**
  - Playwright browsers are cached per version.
  - The package is built and packed in its own named step.
  - Actions are pinned to commit SHAs.
  - The token check runs after Chromium is installed.
- **new-component skill:**
  - `integrate.mjs` no longer deletes a copy of a hand-written file in `src/generative`, or a copy with no original.
    It also cleans up duplicated folders (`schemas 2/`), and it fails clearly instead of running every test when a
    component has no test file.
  - `add-to-gallery.mjs` keeps a category's order, handles lists over several lines and category names with `$`, and
    writes nothing unless every component fits.

## Unreleased – Phase 4: a skill for building components

### Added

- **`.claude/skills/new-component/`:** an agent skill with the library's way of building components, so a new one
  comes out like the rest. It covers:
  - deciding whether something new is needed;
  - the element conventions and the five files per component;
  - parallel fork briefs for batches;
  - integration, visual review, and the PR / CI / merge flow;
  - the problems that have bitten before.
  - **Scripts:**
    - `add-to-gallery.mjs` registers components in the README and a gallery section.
    - `integrate.mjs` runs the integration pass in order, stopping at the first failure:
      1. iCloud duplicate cleanup;
      2. regenerating the element index, docs, Angular wrappers and generative schemas;
      3. perf and thumbnails for anything new;
      4. every CI check;
      5. tests in three browsers.
  - **Test cases** in `evals/`, for `claude plugin eval`.

## Unreleased – Phase 3: generative UI

### Added

- **`trenchcoat/generative`:** what an app needs to let a model place components in its answers.
  - **Catalogue:** `catalog` and `catalogPrompt()`, a line per component.
  - **Schemas and tools:** `loadSchema()`, one JSON Schema per component; `toolDefinitions()` and `tagOfTool()`,
    tools for the Messages API.
  - **Checks:** `checkComponent()` and `mountComponent()`.
  - **On a server:** tool definitions and checks work there too.
- **Schemas for 189 components**, generated from their TypeScript types and JSDoc by `scripts/gen-schemas.mjs`
  (`npm run check:generative` keeps them in step).
  - **Left out:** properties that take functions, DOM nodes or files, and fields deeper down that do.
  - **App-controlled:** dialogs, the composer, global shortcuts, the look provider and decoration stay that way.
- **`tc-generated-ui`:** a `component` block, `{ type: "component", tag, props }`, places any catalogued component.
  - **Checks:** props are checked against the schema before they're set; what doesn't fit is left out and listed in
    `tc-spec-check`.
  - **Events:** the component's events come back as `tc-component-event`, also exposed as React's `onComponentEvent`;
    preventing it prevents the component's own.
  - **Guardrails:** links must be http(s), mailto or relative; lists are capped at 200 items, strings at 4,000
    characters, nesting at 8 levels and props at 200 KB.
- **Foundations → Generative UI:** both ways in (the component block, and tool use with the Messages API), with the
  guardrails.

## Unreleased – Phase 2: DTCG token export

### Added

- **`tokens/dtcg/`** (also `trenchcoat/tokens/dtcg/*`): the token dictionary in the Design Tokens Community Group
  format (DTCG 2025.10), for design tools. Generated from `tokens/tokens.css` by `scripts/tokens-dtcg.mjs`.
  - **Primitives:** `primitives.json` holds the 165 primitives.
  - **Modes:** `standard-light`, `standard-dark`, `clean-light` and `clean-dark` each hold every semantic and
    pattern token. A token that the CSS points at another is an alias (`{gray.900}`); anything else is the value
    resolved for that look and theme.
  - **Tokens Studio:** `$themes.json` and `$metadata.json` pair each mode with the primitives.
  - **Types:** colour (sRGB components and hex), dimension, duration, cubic Bézier, font family and weight, number,
    shadow and border.
  - **CSS-only:** the few values with no DTCG type (em letter-spacing, `uppercase`, a padding shorthand) are listed
    with their CSS under `$extensions`.
- **`check:tokens`:** also fails when the export is out of date, when an alias doesn't resolve, or when a token,
  resolved through the export, differs from the CSS in any look and theme.

## Unreleased – Phase 2: Angular wrappers

### Added

- **`trenchcoat/angular`:** a standalone directive for every element, named after it (`tc-combobox` → `Combobox`),
  plus `TRENCHCOAT` for all of them. Generated from the elements' JSDoc by `scripts/gen-angular.mjs` and built by
  `ngc` in partial mode for Angular 19 and later.
  - **No schema:** no `CUSTOM_ELEMENTS_SCHEMA`, and strict templates check every binding.
  - **Inputs:** typed from the element's properties. Plain boolean and numeric attributes are accepted
    (`required`, `value="0.6"`).
  - **Events:** typed, so `$event` is the event's `CustomEvent<…>`. Each handler runs once per event.
- **`trenchcoat/angular/forms`:** a `ControlValueAccessor` for each of the 41 elements that hold a `value`, for
  `[(ngModel)]`, `[formControl]` and `formControlName`. It also provides `TRENCHCOAT_FORMS`. `@angular/forms` is an
  optional peer.
- **`npm run check:angular`:** checks the wrappers in CI.
  - **Up to date:** confirms the generated wrappers are current.
  - **Strict compile:** builds them, and compiles an app against them with strict templates.
  - **Mistakes caught:** confirms five common mistakes fail the build.

### Changed

- **`examples/angular`:** uses the directives with no schema, and checks two things in Chromium: a handler runs once
  per event, and `[(ngModel)]` drives `tc-switch`.
- **Docs:** every page's Angular quick start and controlled example use the directives, and `check:snippets` now
  type-checks their bindings and `$event`.
- **Event details:** four change events gained a field named after the property they change. The existing fields
  stay. The docs' controlled examples read these names, which the events lacked; the new Angular type check caught
  it.
  - `tc-artifact-panel`'s `tc-selected-change`: `selected`.
  - `tc-email-draft`'s `tc-recipient-change`: `recipient`.
  - `tc-reliance-gauge`'s `tc-review-level-change`: `reviewLevel`.
  - `tc-transcript-review`'s `tc-translation-mode-change`: `translationMode`.

## Unreleased – Phase 1: records, investigations and search

Fourteen new Lit elements. Each comes with both looks, a React wrapper, tests in Chromium, Firefox and WebKit, a
gallery demo, a docs page and an overview thumbnail. The gallery gains a **Search** section.

### Added

- **People & profiles:**
  - `tc-entity-timeline`: events by month, each with a category and a graded source, filtered by category.
  - `tc-travel-itinerary`: legs with mode, document, confidence and flags, grouped into journeys.
  - `tc-place-list`: places with type, status, coordinates and dates.
  - `tc-account-list`: masked IBAN-style accounts with a status and the page's own stats.
  - `tc-money-flow`: transfers between entities as bands sized by amount, with flag chips.
    - Entities' and transfers' flows are lit with a readout, and there's a table view.
  - `tc-co-occurrence`: entities ranked by the events they share with a subject.
    - Strength in words and bars, with counts per source.
  - `tc-evidence-list`: exhibits, each opening onto its chain of custody, with hash agreement.
  - `tc-asset-list`: grouped assets with masked identifiers and a status.
  - `tc-contact-channels`: emails, phone numbers, messaging and addresses.
    - Masked until shown, with role, last use and verification.
- **Data & charts:**
  - `tc-ops-overview`: a dense strip of a health pill and count tiles with their change.
  - `tc-sla-status`: on-time share, a Met / At risk / Breached split, a trend and a bar per type.
- **Search:**
  - `tc-query-builder`: conditions in AND / OR groups.
    - Read back in words and as a query string.
  - `tc-search-history`: recent and saved searches.
    - Run again, save, and remove with Undo.
  - `tc-ai-search`: one search box with an AI mode.
    - Suggestions, example prompts, a "search within file contents" option, scope chips and ⌘K.

### Changed

- **Standalone gallery:** `standalone/trenchcoat-gallery.html` is rebuilt with every component to date.
  - It was last built at Part 7, so the people, research, summary, search and record components are new to it.
  - Its size is now about 17 MB.

## Unreleased – summaries, session state and status tracking

Four new Lit elements. Each comes with both looks, a React wrapper, tests in Chromium, Firefox and WebKit, a gallery
demo, a docs page and an overview thumbnail.

### Added

- **`tc-ai-summary`** (AI & chat): the gist of a thread, meeting or set of documents.
  - **Summary:** a TL;DR, then a summary that streams in.
  - **Sources:** key points cite their sources as numbered chips with previews, plus open questions.
  - **Freshness:** a note when the sources have moved on, with Update.
  - **Controls:** Short / Detailed, feedback, a Sources list, Copy and Regenerate.
- **`tc-digest`** (AI & chat): a one-minute digest arranged around what the reader needs, with a reading-time
  estimate.
  - **Sections:** what matters, what to do (ticked off as you go), what changed, and what's safe to ignore.
- **`tc-session-state`** (AI & chat): where a long LLM session stands.
  - **Header:** a health pill.
  - **Tiles:** primary goal, open loops, pending artifacts, and context pressure with a meter that warns as it fills.
  - **Chips:** status chips; the tiles can open what they count.
- **`tc-status-tracker`** (Research & portfolio): a fixed sequence of gates or stages on a line.
  - **Status:** each cleared, pending, blocked or not reached, in words and marks.
  - **Progress:** the line fills as they clear, and the current step is marked.
  - **Records:** a legend, and a step's evidence record on click; vertical when narrow.

## Unreleased – research and portfolio

Fourteen new Lit elements in a new **Research & portfolio** section of the gallery. Each comes with both looks, a
React wrapper, tests in Chromium, Firefox and WebKit, a gallery demo, a docs page and an overview thumbnail.

### Added

- **`tc-traceability-spine`:** the chain from open questions to outcomes.
  - **Columns:** one per stage – Question, Gap, Work, Paper, Cited by, or your own stages.
  - **Linking and tracing:** linked cards are joined by lines. Clicking a card, or pressing Enter on it, traces its
    whole path and dims the rest.
- **`tc-grade-distribution`:** a count over each assessment grade.
  - **Display:** grades with no assessments are muted, and an optional bar shows their proportions.
  - **Filtering:** a grade can be picked as a filter.
- **`tc-investment-balance`:** each priority tier's share of items, budget and people, side by side.
  - **Flags:** over- and under-invested tiers are flagged in words.
  - **Summary:** the biggest mismatch is said in one line.
- **`tc-capacity-bars`:** each person's allocation, split by what they work on, against their capacity.
  - **Scale:** all people share one scale.
  - **Over capacity:** marked on the person and counted.
- **`tc-budget-burn`:** spent against budget for each item, with a pace marker.
  - **Pace:** Ahead, On or Behind pace in words.
  - **Totals and sorting:** totals in the header, and a sort by budget or burn.
- **`tc-publication-impact`:** one paper's impact.
  - **About the paper:** venue, topic, grade and authors.
  - **Reach:** downloads, views, citations and attention, with a reads sparkline, plus mentions.
  - **Readers and feedback:** who is reading, and peer, reader and sponsor feedback, each with a sentiment.
- **`tc-audience-mix`:** who is reading.
  - **Breakdowns:** sector mix, internal versus external, and top places.
- **`tc-citation-badge`:** an embeddable badge of citation tallies – publications, supporting, mentioning and
  contrasting.
  - **Layouts:** labelled or compact.
  - **Details:** a tooltip says what each type means, and an optional link goes to more. No third-party branding.
- **`tc-citation-sections`:** where a work is cited.
  - **Donut:** citing sections – Intro, Methods, Results, Discussion, Other – with letter chips and a legend.
- **`tc-priority-list`:** topics or projects by priority.
  - **Each row:** health, a momentum line with its change, a coverage bar, what's open and the work in flight.
  - **Filtering and grouping:** health filters, and groups per priority.
- **`tc-gap-exposure`:** gaps or risks, and whether anyone is working on them.
  - **Exposure:** severe uncovered gaps are called out.
  - **Investment:** what's been invested in each.
  - **Grouping:** by priority or severity, with an uncovered-only switch.
- **`tc-coverage-ring`:** one share as a large ring.
  - **Bar:** runs from healthiest to needs attention, and reads out each segment.
- **`tc-org-unit-card`:** an organisational unit at a glance.
  - **Header:** its lead and health counts.
  - **Stats:** the page's own stats, with a spent-of-budget bar.
  - **Teams:** each folds open onto its topics.
- **`tc-work-item`:** one piece of work as a card.
  - **Status:** in words, with progress and a due date (marked when overdue).
  - **Resources:** people, what it delivers, spent against budget, and effort.

## Unreleased – people and profiles, and file summaries

Ten new Lit elements, each with both looks, a React wrapper, tests in Chromium, Firefox and WebKit, a gallery demo,
a docs page and an overview thumbnail. Eight sit in a new **People & profiles** section of the gallery; Day Rhythm
is under Data & charts and File Summary under AI & chat.

### Added

- **`tc-profile-header`:** the top of a person's or an account's page.
  - **Identity:** picture or initials, name, a status and tags.
  - **Details:** other names as chips, and a line of key facts.
  - **Actions and tabs:** the page's actions with an overflow button, and a row of section tabs (WAI-ARIA tabs).
- **`tc-person-links`:** the people linked to someone.
  - **Each person:** role, an ID or second line, and the link's strength in words and bars.
  - **List:** a count, "View network" and "Show all". Selecting a person fires a cancelable event.
- **`tc-fact-sheet`:** facts in sections, each value tagged with its source and an Admiralty grade (A1–F6).
  - **Confidence:** the tag is tinted and marked by confidence band.
  - **Uncertainty:** conflicting readings appear side by side, unknowns are stated, and a "How grades work" scale is
    one click away.
- **`tc-document-list`:** identity and record documents.
  - **Each document:** type, country, a masked number shown one at a time, expiry, and a status pill (Verified,
    Active, Expired, Flagged, Fraudulent, or your own).
  - **List:** counts in the header, and View per row.
- **`tc-fingerprint-card`:** a ten-print card in ANSI/NIST finger positions.
  - **Each finger:** a drawn print and its status: captured with NFIQ quality, poor, not captured, unable to print,
    or bandaged.
  - **Interaction:** arrow keys move across both hands, and a finger's detail opens below the card.
- **`tc-biometric-status`:** enrolment across face, fingerprints, iris, DNA, voice, gait and more.
  - **Each record:** a status pill and a quality meter.
  - **Summary:** the count enrolled, and an optional match score.
- **`tc-day-rhythm`:** a typical day as a strip of blocks by kind of place or activity.
  - **Layout:** one row per kind of day, with hour ticks, a now marker and a legend.
  - **Interaction:** the block under the pointer or focus is named in full.
- **`tc-watchlist`:** what a team is watching, most at risk first.
  - **Each row:** avatar, reference, case tag, and a risk badge in words.
  - **List:** filters by risk, a count and View all.
- **`tc-alert-feed`:** a live feed of alerts.
  - **Each alert:** a category, severity shown as an edge, a mark and a word, and a relative time that stays fresh.
  - **Actions:** Escalate and Acknowledge.
  - **Pausing:** Pause feed holds new alerts back, and arrivals are announced politely.
- **`tc-file-summary`:** an AI summary of a file that streams in.
  - **Content:** key points citing their pages or times, plus the people, organisations, dates and amounts mentioned.
  - **Controls:** Short / Detailed, coverage, and Copy, Regenerate and Open file.

### Changed

- **CI:** WebKit runs across eight machines instead of six, after a sixth ran out of memory.
- **`tc-model-settings`:** the signature panel above the controls is now opt-in with `signature`. It drew every
  parameter a second time, so the card read as having two of each setting.

## Unreleased – activity clock and activity calendar

Both are Lit elements with both looks, a React wrapper, tests in Chromium, Firefox and WebKit, a gallery demo and a
docs page, listed under Data & charts. They share one shading scale (`internal/activity-scale.ts`).

### Added

- **`tc-activity-clock`:** activity by hour, a clock per day.
  - **Rings:** an inner AM ring and an outer PM ring of twelve hour segments, labelled at 12 o'clock, with 12 at the top.
  - **Shading:** each segment shaded by its value in `levels` steps, scaled to the busiest hour shown or `max`. An
    hour with no data is outlined, not shaded.
  - **Middle:** the weekday and date, or the hour under the pointer or focus and its value.
  - **Header and selection:** the busiest hour in the header, and a selected hour reported with a cancelable
    `tc-selected-change`.
  - **Keyboard:** a grid with a row per day; ← → move an hour, ↑ ↓ a day, Page keys switch between AM and PM.
- **`tc-activity-calendar`:** a year of activity, contribution-graph style.
  - **Layout:** a column per week and a row per weekday, ending on `end`, with `weeks` and `week-start` settings.
  - **Labels:** month names along the top, and weekday names pinned down the side while the weeks scroll. The newest
    week starts in view.
  - **Values:** a missing day counts as 0, and null is outlined as no data.
  - **Header, footer and selection:** the total in the header; the footer reads out the day under the pointer or
    focus. A selected day is reported with a cancelable `tc-selected-change`.
  - **Keyboard:** ↑ ↓ move a day, ← → a week, Page keys four weeks.

## Unreleased – remediation Part 7 (terms dialog, skills in the composer, app picker, notifications, header nav)

See `audit/remediation-plan.md`, Part 7. Every new component is a Lit element with both looks, a React wrapper,
tests in Chromium, Firefox and WebKit, a gallery demo and a docs page.

### Added

- **`tc-terms-dialog`:** terms to agree to.
  - **Changed terms:** re-acceptance opens with a "What's changed" summary, and changed sections are marked.
  - **Reading:** a jump list that folds into a Contents button.
  - **Accepting:** required and optional consents; Accept can wait for the end of the text, and says why it's waiting.
  - **Other actions:** Decline, print and download, plus a blocking mode.
  - **Saving:** app-driven saving with error and retry.
- **`tc-app-picker`:** the app launcher.
  - **Sections:** Pinned, Recent and All apps, or your own groups.
  - **Finding and opening:** search; real links; arrow keys across the grid.
  - **Pins and states:** an "Edit pins" mode, loading and error states, and an inline panel layout.
- **`tc-notifications`:** the notification center.
  - **Bell:** an unread badge.
  - **List:** All / Unread and category tabs, with items grouped by day.
  - **Per item:** read toggle, actions and dismiss; "Mark all as read".
  - **More:** load more or infinite scroll, polite announcements of new arrivals, and an inline mode. Every change is
    a cancelable event.
- **Skills in `tc-chat-composer`:** `skills`, `recentSkills`, `searchSkills`, `skill`.
  - **Typeahead:** typing `/` at the start of a message opens a ranked typeahead, grouped by source, with recent skills
    first.
  - **Token:** a pick adds a tinted `/skill` token with its argument hint.
  - **Events:** `tc-send` gains `skill` and `args`, and there is a new `tc-skill-change`.
  - **Toolbar:** an optional "/" button.
- **`tc-mention-picker`:** item descriptions, recents, ranking across groups, word-match highlighting and per-trigger
  search. It stays backwards-compatible.
- **Header Nav block:** notifications, app picker and the account avatar for the right end of an app header, with
  one popover open at a time.
- **Shared code:**
  - `internal/modal.ts`, the `ModalController` that `tc-dialog`, `tc-terms-dialog` and `tc-stories` share;
  - `cardHead()` gains `picture`, `pictureShape` and `keepAside`.
- **`standalone/trenchcoat-gallery.html`:** the whole gallery in one HTML file that opens from disk, with no server
  and no network.

### Changed

- **`tc-stories`:** opens a "what changed" brief instead of a story player.
  - **The row stays:** the gradient ring still means something new.
  - **The brief:** a light modal with an optional summary, then a bento of update tiles (metric, status move, note,
    list, image, link), new ones first. Previous and Next move between entries.
  - **Entries:** `entries`, which can be people or accounts; `people` still works.
  - **Removed:** the timers, video and swipe.
- **`tc-dialog`** uses the shared `ModalController`. If the browser closes it on its own, focus now goes back to the
  button that opened it.
- **`tc-profile-menu`:** Standard rounds a photo avatar, as Clean does.
- **Gallery:** "Feedback & onboarding" moved up the sidebar; it was listed after Utilities.
- **Tests:** a new `parkPointer()` helper keeps the real pointer from leaking between test files.

## Unreleased – remediation Part 6 (text selection, the rest of THEMIS, blocks, docs for every framework)

See `audit/remediation-plan.md`, Part 6, and `audit/part6-brief.md`. Every new component is a Lit element with
both looks, a React wrapper, tests in Chromium, Firefox and WebKit, a gallery demo and a docs page.

### Added

- **Text selection:**
  - `tc-text-annotator`: highlight a passage and comment on it;
  - `tc-response-selection`: select part of a model reply to reply to it or request an edit;
  - `tc-selection-translate`: translate the selected text;
  - `tc-isbn-details`: hover an ISBN for its book details.
- **Feedback and onboarding:**
  - `tc-stories`: a gradient ring for new updates that opens a modal viewer;
  - `tc-background-tasks`.
- **Trust & calibration**, from THEMIS and built domain-neutral:
  - `tc-agreement-tracker`, `tc-confidence-brief`, `tc-capability-notice`, `tc-transcript-review`,
    `tc-version-history`, `tc-session-context-bar`, `tc-evidence-coverage`, `tc-review-conflict`;
  - `tc-handoff-brief`, `tc-engagement-quality`, `tc-knowledge-promotion`, `tc-friction-profile`,
    `tc-reasoning-flags`.
- **Blocks:** the five THEMIS blocks and the AI side pane. The side pane is a chat drawer about the page beside it.
- **`tc-chat-composer` toolbar:**
  - model picker, settings and prompt library;
  - page context you can connect and disconnect;
  - a disclaimer line under the input;
  - `hide*` props for each piece.
- **Docs on every page:**
  - Usage and Frameworks tabs for HTML, React / Next.js, Vue / Nuxt, Angular and Svelte;
  - a Browser support section with each component's minimum versions;
  - a Performance section with bundle size, render times and runtime cost.

  New foundations pages cover frameworks, browser support and performance. Components' fallback-only tokens now
  show in the token table.
- **Tooling:**
  - `npm run measure:perf` writes `app/src/docs/perf.json`; `-- --missing` measures only new or changed elements;
  - `npm run check:snippets` type-checks each page's framework snippets and is part of `npm run ci`;
  - the browser feature table is `scripts/browser-features.json`.
- **Shared code:**
  - selection: `SelectionController`, `SelectionToolbarController`;
  - popovers: `PopoverController` and `placePopover`, in the top layer with hover intent;
  - `RequestController`, `internal/kit.ts`, `internal/source-line.ts`;
  - the `--tc-highlight-*` tokens.

### Changed

- **Eight enhancements to existing components**, plus gap fixes:
  - dialog actions, and dialog styles no longer leaking;
  - progress-tracker states;
  - data-table `selectable`;
  - image-grid badges, meta, `openable` and fill;
  - breakdown-chart wrap and fill;
  - kpi-chart colours, `lowerIsBetter` and `deltaFormat`;
  - ai-answer `hideActions`.
- Popovers across the library share one helper.
- `tc-evidence-coverage`'s types are `EvidenceCoverageStatus` and `EvidenceCoverageOpenChange`, so they don't clash
  with coverage-matrix's.
- CI moved to the repo root as `.github/workflows/trenchcoat-ci.yml`, so GitHub runs it. It runs only for changes
  under `trenchcoat/`, and it now also checks the framework snippets.

## Unreleased – remediation Part 5 (more AI components, trust & calibration), the AI configuration rebuild and one card style

See `audit/remediation-plan.md`, Part 5; `audit/ai-config-brief.md`; and `audit/style-drift.md`. Every new or
rebuilt component is a Lit element with both looks, a React wrapper, tests in Chromium, Firefox and WebKit, a
gallery demo and a docs page.

### Added

- **Quality, retrieval, safety, structured output and conversation:** `tc-eval-scorecard`, `tc-feedback-rubric`,
  `tc-retrieval-inspector`, `tc-extraction-review`, `tc-guardrail-notice`, `tc-clarifying-questions`,
  `tc-structured-output`, `tc-generated-ui` and `tc-prompt-starters`.
- **Trust & calibration**, from THEMIS and built domain-neutral:
  - claims and their reliability: `tc-claim-answer`, `tc-verification-queue`, `tc-reflection-gate`,
    `tc-reliance-gauge`, `tc-disagreement-banner`, `tc-synthesis-notes`;
  - where outputs came from: `tc-lineage-graph`, `tc-validity-badge`, `tc-provenance-summary`,
    `tc-correction-propagation`, `tc-attestation-check`, `tc-run-manifest`;
  - policy and control: `tc-policy-simulator`, `tc-gate-config`, `tc-coverage-matrix`, `tc-kill-switch`,
    `tc-playbook-canvas`.
- `tc-approval-card` gains decision detail: why you're seeing it, what each choice does, editable arguments and
  evidence chips.
- **Shared code:**
  - helpers: `ToolbarController`, `internal/util.ts`, `internal/format.ts` and `internal/layered-graph.ts`;
  - tokens: source, validity, syntax and teal tones, and danger action tokens;
  - `internal/card-head.ts`, the shared card header.
- **New style tokens:**
  - the card title and the line under it: `--tc-title-*`, `--tc-subtitle-*`;
  - the card header: `--tc-head-*`;
  - the compact field: `--tc-field-h-sm`.
- **New ratchet counters:** literal font-family, font-size and letter-spacing.
- `check-prefixes` checks that every element's `ui` prefix is unique.

### Changed

- **AI configuration** – provider-connection, mcp-connection-manager, tool-configuration, model-settings,
  model-routing, instruction-editor, knowledge-source-manager, retrieval-settings, multimodal-input,
  output-schema-builder, evaluation-dataset-editor, conversation-annotation, configuration-release-control and
  data-handling-policy:
  - Each was rebuilt from one generic form into a purpose-built view led by its state: a connection path, a route
    that lights up, a retrieval pipeline you edit, a data lifecycle, a release pipeline with its gate, an API
    reference entry, a schema tree beside its rendered answer, and inline annotation.
  - Their APIs changed; see each page.
- **One card style.** Every card's title uses the title tokens in ink, never accent or gray. In Standard the
  header sits on the gray tray with a boxed icon; in Clean it is the card's first row.
- **Type and controls.** Font families, sizes and tracking moved to tokens, and buttons and fields to the control
  and field tokens, across about 150 elements. Seventeen plain-text titles became real headings.
- kpi-chart, progress-tracker, setup-guide and writing-assistant now sit on the Standard tray.
- decision-inbox has a `heading` (React `title`), default "Decisions"; the count moved to the line under it.
- The form primitives' shared `internal/settings.ts` lost its unused panel and field helpers.

### Fixed

- **Buttons at the wrong size and weight:** in email-draft, filter-menu, integration-settings, billing-schedule,
  comments-panel, smart-recommendation, writing-assistant and setup-guide, a button reset outranked the control
  styles. Their buttons rendered at the page's 16px in the regular weight.
- **stepper-form error contrast:** its error messages were 3.9:1; they now use the danger text colour.
- **Gallery styles leaking into components:** the docs page's `h2` and the home page's section spacing were
  styling headings and sections inside components.
- **Stale gallery modules:** a long-running dev server served old modules (mcp-connection-manager failed to
  render). This was fixed by restarting the server; no source change was needed.

## Unreleased – remediation Part 4 (a design-system page for every component)

See `audit/remediation-plan.md`, Part 4.

### Added

- A design-system page for every component, illustration and motion piece in the gallery: overview, when to use and when not, anatomy pinned on the live demo, looks, usage for HTML, React, Vue, Angular and Svelte, the full API (generated), the React props, accessibility with the keyboard table, content guidance, do and don't, related components and the changelog. Foundations pages: getting started, looks, themes, tokens, patterns, accessibility.
- `npm run check:docs`: every public property, event, slot and React prop has a description, every page has its guidance, and every React example type-checks.

### Fixed

- data-table and agent-lanes: a look selector left in front of a comment turned two rules into descendant selectors, so Clean lost data-table's coloured tag pills and agent-lanes' Reject / Approve button styles.
- agent-lanes says "1 task needs you" (was "1 task need you").

## Unreleased – remediation Part 3 (new components)

See `audit/remediation-plan.md`, Part 3. Each is a Lit element with both looks, a React wrapper in `trenchcoat/react`,
browser tests in Chromium, Firefox and WebKit, and a gallery demo.

### Added

- `tc-run-checkpoints` – a run's restore points as a list and a timeline: what each point captured, what going back discards (steps, file changes, tokens, cost), a note for the retry, and `restorer` that may return a promise. Listbox keyboard; `tc-selected-change`, `tc-restore`.
- `tc-budget-guard` – spend and token caps for a live run: a big meter and thin ones, the pace to the cap, a warning with Raise to buttons at `warnAt`, and a hard stop with an alert. `tc-limits-change` (cancelable), `tc-cap-reach` once per cap, `tc-stop`.
- `tc-handoff` – the agent hands the task to a person: what it did, why it stopped, what it needs; Take over turns the needs into a checklist with a note, Hand back folds it to one line. ⌘/Ctrl+Enter; `tc-status-change`, `tc-checked-change`, `tc-note-change`, `tc-return`.
- `tc-live-view` – the agent's screen (frames, a live video or canvas, or your own content) with its pointer, clicks, typing and keys drawn on top, a step caption, and Pause / Take over; your clicks are reported in frame pixels while you have control.
- `tc-sandbox-log` – sandbox command output: a block per step with command, exit code and time; ANSI colours (16, 256 and true colour) mapped to tokens, never parsed as HTML; incremental parsing while it streams; copy and search; windowed (50,000 lines render under 400 rows).
- `tc-code-block` – a streaming code block: a small tokenizer per language (TS/JS, Python, JSON, HTML, CSS, shell) re-highlighting only changed lines, Copy, Apply, and a line diff against `current` with folded unchanged runs. Toolbar keyboard; `tc-view-change`, `tc-copy`, `tc-apply`.
- `tc-artifact-panel` – what a run produced: a list, a preview per kind (Markdown text, code through `tc-code-block`, images, tables from CSV), versions with a diff against the one before, and download (a Blob by default, cancelable).
- `tc-run-compare` – two runs or prompt versions side by side: outputs and prompts word-diffed with inline-diff's Myers diff, steps aligned and marked Added / Dropped / Changed, cost, time and tokens marked better or worse. Tabs; `tc-view-change`, `tc-pick`.
- `tc-tool-permissions` – a grid of agents × tool scopes, allow / ask / deny per cell (a destructive scope never offers allow), presets, a Custom state, and a summary of changes against `saved`. WAI-ARIA grid; `tc-value-change` with the cause, `tc-save`.
- `tc-trigger-builder` – an event or a schedule, an active window, conditions with all/any, a plain-language summary and the next run times; form-associated (JSON under `name`, validity, reset). Built from combobox, date-range-picker and segmented-control.
- `tc-mention-picker` – the / and @ picker for a textarea, input or contenteditable: grouped, scored results, the field keeps focus (aria-activedescendant), ↵ / Tab insert a token or a chip, and the composer's Enter-to-send never sees that ↵. `search` may be async.
- `tc-context-tray` – what's in context as chips with token weights, a meter against the window with a reserved share, pin, remove with undo (⌘/Ctrl+Z), and a warning near the limit. Toolbar keyboard; `tc-items-change` (cancelable).
- `tc-conversation-branches` – edit a past message to fork the conversation; a 2 / 3 switcher on the edited message, each branch's replies (with `tc-message-actions`) below, and `tc-edit` answered with the new replies or a promise of them.
- `tc-chat-history` – conversations grouped by Pinned, folders, Today … month: search, rename in place (F2), pin, move, delete with undo, a context menu; the WAI-ARIA tree pattern, windowed (10,000 chats render under 120 rows).
- `tc-voice-mode` – a voice conversation: `tc-voice-orb` for the state, live captions that announce finished turns once, and Mute / Captions / Interrupt / End in a toolbar; Esc interrupts. The audio stays the app's.
- `tc-answer-arena` – two models' answers streamed side by side, then A / B / tie with a reason; blind mode reveals the names after the vote. `tc-value-change` (cancelable).
- `tc-image-grid` – generated images as a grid: pending, done and failed tiles, regenerate, upscale, download (saves by default), compare two with a keyboard slider, and required, editable alt text. WAI-ARIA grid.
- chat-composer (the Lit element and `trenchcoat/react`): opt-in `mentions` (a `tc-mention-picker` on the message)
  and `context` / `context-limit` (a `tc-context-tray` above it). Without them it renders as before.

### Checks

- The ratchet counts any reference to `Date.now`, not only calls – an alias (`const read = Date.now`) or
  `Date.now.call(Date)` used to get past it. chat-history and trigger-builder read the clock once when they connect
  (the default for `now`), recorded in the baseline.
- The gallery's spacing between its own sections no longer reaches sections inside a component's stage.

## Unreleased – remediation Part 2 (the shift to Lit)

See `audit/remediation-plan.md`, Part 2, and `audit/lit-port-plan.md`.

### Added

- Lit 3 web components: `tc-button`, `tc-combobox` and `tc-data-table` (the pilot), `tc-look-provider` for an
  app-wide default look, the shared controllers (row window, focus rescue, smooth height, off-screen, on-screen,
  ARIA forwarding, hotkeys, rolling numbers). Pixel-identical to the React components in both looks and themes.
- The package build (`npm run build:package`): ES modules per element, TypeScript declarations,
  `custom-elements.json`, React wrappers (`trenchcoat/react`, same API as the React components) and typed bindings
  for Vue (`trenchcoat/vue`) and Svelte (`trenchcoat/svelte`). Still private, 0.1.0, UNLICENSED.
- `examples/`: React, Next.js, Vue, Nuxt, Angular, Svelte and plain-HTML apps that install the packed package;
  `npm run examples` checks all seven.
- Every other component as an element (step 2.6): 61 more, 64 in all, each with its React wrapper under the same
  name and props in `trenchcoat/react`, browser tests in Chromium, Firefox and WebKit, and its gallery demo diffed
  against React in both looks and themes (all under 1 %; the remaining differences are demos that use
  `Math.random()` or a running clock). Import one element with `trenchcoat/<slug>`.
- The 22 illustrations and 8 motion pieces as elements (step 2.7), 105 tags in all; shimmer-loader is two
  (`tc-skeleton`, `tc-shimmer-text`). Same React names and props through `trenchcoat/react`; parity with the React
  versions at 0.00 % except voice-orb's canvas particles (timing) and tilt-card, which drops 3 px of line space
  under its inline-block root.
- glass-folder has an `open` property: the look its hover gives, on demand.
- filter-menu renders only the rows near the viewport in groups over 60 options (tested with 5,000).
- otp-input, dropzone and stepper-form's tags and choices are form controls (ElementInternals): they submit under
  `name`, honour `required`, reset and a disabled fieldset, and are named by a page `<label for>`.

### Breaking

- `components/` is gone: no more generated single-file components and no `-clean` copies. Each component is
  `src/components/<slug>.tsx` with both looks – set `look="clean"` for Clean. Components no longer carry token
  fallbacks or inlined helpers: load `tokens/tokens.css` (it also holds the theme and forced-colours rules they used
  to inline). `npm run build:lib` and `check:lib` are removed. plan-vs-actual (Clean only) is now
  `src/components/plan-vs-actual.tsx`. No app uses Trenchcoat yet, so there is no deprecation period.
- The React components are retired except the ones blocks and screens still import (agent-plan, approval-card,
  button, chat-composer, combobox, data-table, filter-menu, inline-diff, kpi-chart, segmented-control, setup-guide,
  thinking-loader, thinking-state, tool-call-card, usage-meter). Use `trenchcoat/react`: same names and props.
- The React illustrations and motion pieces are retired except glass-folder (three screens import it).
- model-wheel's `defaultModels` is `modelWheelDefaults` (chat-composer's wrapper exports `defaultModels`).
- Renamed types, so the package index can export every element's types: decision-inbox `Decision` →
  `InboxDecision`, plan-vs-actual `PlanStep` → `PlanVsActualStep`, agent-plan `PlanStep` / `PlanStepStatus` →
  `AgentPlanStep` / `AgentPlanStepStatus`. decision-tree keeps `Decision` on the wrapper.
- `ref` on a wrapper is the custom element. Where the React component had an imperative handle (review-center,
  inline-diff, decision-tree), the element has the same methods.
- A few callbacks get the native event instead of React's synthetic one: model-picker `onKeyDown`, toaster
  `ToastAction.onClick` (`preventDefault()` still works). Model-picker, toaster and review-center handle Escape or
  their shortcuts on the element first; a page's `onKeyDown` on the component sees them after (or not, for Escape
  while a menu or toast is open).
- React nodes passed as content (icons, avatars, approval-card previews, toast text, MessageText children) are
  rendered once in a hidden box and cloned into the element: they look the same, but event handlers inside them
  don't run. Plain strings are unaffected. stepper-form steps are the exception: they render through a portal and
  stay live React.

### Behaviour changes

- trace-waterfall rows show an outline when focused in forced-colours mode (their ring was a box-shadow, which
  forced colours removes). data-table sorts only when its rows, sort or columns change – scrolling 10,000 sorted
  rows was 72 ms per step.
- thinking-state no longer reports `onOpenChange(true)` on mount when `open` is held false; date-range-picker
  doesn't flash its "Last 30 days" stand-in before reading today; memory-panel with `undoFor={Infinity}` keeps a
  failure message instead of clearing it at once; dropzone keeps focus on a row while another row folds away (the
  React version lost it in real browsers).

## Unreleased – remediation Part 1 (design work that carries over to Lit)

See `audit/remediation-plan.md`, Part 1.

### Visible changes

- Type scale (decision B): text at 11.5, 12.5 and 13.5 px is now 11, 12 and 13 px in every component and
  illustration, and fields (`--tc-field-font-size`) are 13 px. `--tc-font-size-xs-plus`, `-sm-plus` and `-md-plus`
  are deprecated – only blocks and screens still use them – and check-tokens rejects new uses elsewhere.
- Spacing on the scale: padding, margin and gap in every component, illustration and motion piece use
  `--tc-space-*` (3,389 values that were already on the scale, 322 that were 1 px off it and moved by 1 px). What
  stays literal – 1 px, fractions, negatives and values 2 px or more off the scale – is counted by the ratchet's
  new "literal spacing" rule (448 in these libraries; blocks and screens are untouched).
- Line heights and radii on the scale (`scripts/apply-scales.mjs`): 12 values already on it and 56 that were 1 px off
  now use `--tc-line-height-*` / `--tc-radius-*` (in Clean-only rules, 5 px radii use Clean's
  `--tc-radius-badge`); memory-panel's cards use `--tc-shadow-raised`. Ratchet totals: line-height 151 → 109,
  radius 176 → 101, blurred shadow 50 → 46. Unitless line heights, illustration art shadows and values 2 px or more
  off the scale stay literal.

- Decision C: breakdown-chart's default palettes (and the gallery demo's colours) are at least 3:1 against the
  surface in both themes, with a 2 px gap between segments; date-range-picker's picked range is a 3:1 band
  (`--tc-date-range-picker-band`) with the day numbers still at 4.5:1 or more.
- fan-out-grid cells and agent-queue backlog squares stay 12 px but sit 24 px apart, and each takes clicks across
  24 px (WCAG 2.5.8) – the grids show fewer items per row.

- Smaller illustrations: region-dach's US, China, India, Brazil and Japan outlines are simplified
  (Ramer–Douglas–Peucker; the faded neighbours much more than the land), 167 → 82 KB of source, with a few islets
  under 2.5 units dropped from the neighbours; project-flow's four avatars are WebP instead of PNG, 137 → 90 KB.

- Forced colours (Windows High Contrast): every component carries one shared block (`scripts/tokens.mjs`
  `FORCED_RULES`, also in tokens.css section 3b) that gives buttons, fields, switches and comboboxes a system-colour
  edge (forced colours drop the box-shadows they used), outlines listboxes, menus, dialogs and tablists, shows
  selected / pressed / checked / current items in Highlight, draws switch knobs, and greys disabled controls. Only
  active under `@media (forced-colors: active)`; the normal looks don't change.

### Behaviour changes

- context-window: Clean's "Compacting…" shine runs 3 times and rests, like every other shimmer (it ran endlessly).
- inline-diff: `diffWords` uses Myers' O(ND) diff instead of a capped LCS table. Long texts stay word by word (a
  3,000-word text with 150 edits gives 150 changes, where anything over ~1,500 words used to become one
  replacement), and the work grows with the edits, not the length squared. Its third argument is now a work budget
  (tokens × edits); past it the middle is still one replacement.

### Removed

- illustrations/frost-cloud and illustrations/glow-cloud, with their demos and tests.

## Unreleased – accessibility and design pass, blocks, screens, illustrations, motion

All 187 published files now pass axe (WCAG 2.0–2.2 A/AA) in light and dark in a real browser, and every library
follows the same pattern tokens and scales as the components. Dark mode works the same through `.dark`,
`data-tc-theme` or the OS setting everywhere (dark-only colour rules: 247 → 0). Endless animations settle on their
own and pause off-screen.

### Visible changes

- Blocks use the library's Button and SegmentedControl, and the pattern tokens for fields, menus, switches, pills,
  cards and trays (decision 3).
- Screens use the components' own scale (decision 2): the App Shell's tabs, search fields, menus, toolbar buttons and
  cards are on the pattern tokens, and no screen restyles a component from outside or shrinks it with `zoom`, so
  components look the same in a screen as in their own demo. The workspace shells no longer scroll sideways.
- Illustrations follow the page theme (project-flow picks its dark scene from the colour scheme; voice-orb redraws
  on theme change).

### Behaviour changes

- illustrations/project-flow: without `theme` it follows the page theme (it used to default to light).
- App Shell Popover, Dropdown and MenuButton move focus into the menu on open and back to the trigger on close;
  the toast's status region is always mounted.
- motion: gradient-floor, gradient-text and grid-background settle after `playFor` (default 5 s, `Infinity` to
  loop); ShimmerText's default `duration` is 1.6 s; gradient-text's default light colour is darker (#ec4899).

### Added (all optional)

- kpi-chart `fill`, inline-diff `fill`, usage-meter `layout="wide"` – what screens used to force by overriding
  internals.
- Pause controls: blocks/logo-marquee and testimonial-wall `paused` / `defaultPaused` / `onPausedChange` /
  `pauseButton`.
- illustrations/layer-stack `rounds`, model-wheel `turns`; motion `playFor`; number-ticker accepts `aria-live`.
- App Shell Tabs `label`, `fullWidth`, `className`; Popover `role` and `label`.

## Unreleased – accessibility and design pass, components

Every component (both looks) now has 0 axe violations (WCAG 2.0–2.2 A/AA) in light and dark in a real browser,
and the audit's critical keyboard blockers are fixed (data-table and command-menu Tab traps, agent-cursors'
suggestion popover, context-map tiles). Components use the pattern tokens from `tokens/tokens.css` (controls,
fields, menus, pills, cards, trays, kbd, switches, segmented controls) and the duration, easing, type, radius and
z-index scales; dark mode works the same through `.dark`, `data-tc-theme` or the OS setting. See
`audit/design-review/README.md` for the decisions behind the visible changes.

### Visible changes

- Standard primary actions are flat ink everywhere (Button and every component's own primary).
- Button sizes come from the control tokens: Standard sm/md/lg 32/40/48 → 28/32/40 px (Clean unchanged).
- Fields show a ≥3:1 edge and a focus ring; focus rings everywhere use the focus tokens.
- Pills, kbd chips, switches, trays (inset 6 → 4 px in Standard) and cards follow one recipe per look.
- Endless shimmers, sweeps and glows run a few cycles and stop (and pause off-screen); state is never shown by
  colour alone (marks, edges, underlines, dash patterns).

### Behaviour changes

- toaster: toasts with an action don't auto-dismiss (`actionDuration`, default Infinity).
- segmented-control selects on pointer release, not press.
- writing-assistant: dictation fills the field and no longer sends by itself.
- data-table renders only the rows in view above 60 rows (was 200); combobox windows options above 300 matches;
  command-menu shows at most `maxRows` (default 200) results.
- Roles that promised a keyboard pattern they didn't implement were replaced: agent-tree (nested lists instead of
  tree), profile-menu (buttons instead of menu), comments-panel filters and experiment-card winners (`aria-pressed`
  buttons), setup-guide tasks (`role="checkbox"`), date-range-picker presets (toggle buttons).
- usage-meter: the `--tc-usage-meter-track`, `-fill` and `-action-bg-hover` custom properties are gone; it uses the
  meter and action tokens.

### Added (all optional)

- Pause controls: agent-graph `paused` / `defaultPaused` / `onPausedChange`, agent-lanes and progress-tracker
  Pause/Play buttons.
- Timing: approval-card `allowStopTimer` / `stopTimerLabel`, review-center `undoTimeout` and `shortcuts={false}`,
  memory-panel's Undo pauses on hover and focus.
- combobox `invalid`, otp-input `labelledBy`, stepper-form tags `autoComplete`, decision-tree Previous/Next buttons,
  inline-diff "Undo last decision", agent-plan Move up/down buttons, delegate-board click-to-assign.

## Unreleased – blocks, screens, illustrations, motion (code-quality Phase 5)

The single-look libraries now follow the same contract as components (`CONTRIBUTING.md`): `className`, DOM props
and `ref` on the root (screens pass them to the App Shell root), controllable state as `x` / `defaultX` /
`onXChange`, promise-aware async callbacks, timers and listeners cleaned up on unmount, and animations that pause
off-screen and in hidden tabs. Each file has a contract spec. React commits per 5 s across all demos: 1,009 → 898
(kpi-board 49 → 1, illustrations agent-team 43 → 1, screens agent-run 30 → 22). "affectUI" is now Trenchcoat
throughout.

### Breaking: values you pass now stay in control

| File | Prop now controlled | Starting value | Change handler |
|---|---|---|---|
| blocks/task-board | `tasks` | `defaultTasks` | `onTasksChange` (`onChange` deprecated) |
| blocks/ai-workspace | `conversations`, `projects` | `defaultConversations`, `defaultProjects` | `onConversationsChange`, `onProjectsChange` |
| illustrations/region-dach, world-map | `region`, `continent` (now warn without a handler unless `showSwitcher={false}`) | `defaultRegion`, `defaultContinent` | `onRegionChange`, `onContinentChange` |

### Behaviour changes

- blocks/app-directory: `onToggle` runs when the user clicks (not after the simulated delay) and may return a
  promise; a rejection leaves the app unchanged and shows an error.
- Decorative illustrations are `aria-hidden` unless given `label` (then `role="img"` with that name).
- illustrations/cover-flow: a controlled `index` only changes through `onIndexChange`; gestures no longer report
  every cover passing by.
- illustrations/voice-orb: the root forwards DOM props and `ref`; a caller's `onClick` runs first, and
  `preventDefault()` in it skips `onPress`.
- motion/tilt-card: a caller's pointer handlers run alongside the card's instead of being replaced.

### Deprecated (kept for one release)

- blocks/task-board `onChange` → `onTasksChange`
- illustrations/layer-stack `onChange` → `onIndexChange`

### Added

- Controllable props: screens/app-shell `collapsed`, `panelOpen`; screens crm/settings-billing `tab`, evals
  `version`, files `view`, integrations `connected`, onboarding `step`, analytics `period`; blocks agent-gallery
  `index`, pricing-plans `billing`, client-context `client`, invoice-credit `view`, metrics-dashboard `range`/`metric`,
  app-directory `connected`, kpi-board `range`/`segment`; illustrations layer-stack `index`.
- Promise-aware callbacks: screens onboarding `onComplete`, agent-run `onApprove`, assistant-home `onSend`; blocks
  invoice-credit `onIssue`, metrics-dashboard `onExport`, ai-workspace `respond`.
- blocks/metrics-dashboard `now` (epoch ms).

## Unreleased – performance (code-quality Phase 4)

Animated components no longer re-render React to move pixels: clocks, countdowns, progress bars, rolling numbers
and typing reveals write to the DOM (text nodes, CSS custom properties) and React renders only when structure or a
discrete label changes. Live clocks pause off-screen and in hidden tabs. Across the gallery's demos, React commits
in 5 simulated seconds went from 2,311 to 1,009 (e.g. context-window 84 → 3, compact-breakdown 82 → 5,
agent-steering 52 → 2, agent-lanes 51 → 5, trace-waterfall 51 → 8, tool-call-card 60 → 9). No-deps layout effects
that measured on every render are keyed or ResizeObserver-driven, and functions over ~300 lines are split into
named parts.

### Behaviour changes

- data-table renders only the rows in view above 200 rows (spacer rows keep the scroll height; `aria-rowcount` and
  `aria-rowindex` are set on every row).
- dropzone reports progress through `onChange` at most once a second (status changes are still reported at once).
- toaster: when several toasters share the hotkey, the newest one with a toast takes it; Ctrl/⌘ + the key no longer
  triggers it.

### Added

- agent-lanes `rate`: how fast its clock runs, in clock ms per real ms (0 with `now`, 1 without – as before).

## Unreleased – one API contract (code-quality Phase 3)

Every component built from `src/components/` now follows the contract in [CONTRIBUTING.md](CONTRIBUTING.md):
controlled/uncontrolled state through one rule, `className`/rest props/`ref` on the root, promise-aware async
callbacks, hydration-safe rendering, form fields on inputs, opt-out shortcuts and `useId` ids.

### Breaking: values you pass now stay in control

A value prop that is defined now **controls** the component. Before, several components copied it into state once and
ignored later changes, or decided control by whether a callback was passed. If you passed one of these as a starting
value, move it to the `default…` prop (or pass the change handler too). In development, a controlled value without
its change handler logs a warning naming the prop.

| Component | Prop now controlled | Starting value | Change handler |
|---|---|---|---|
| data-table | `rows` | `defaultRows` | `onRowsChange` |
| billing-schedule | `phase` | `defaultPhase` | `onPhaseChange` |
| project-card | `tasks`, `status` | `defaultTasks`, `defaultStatus` | `onTasksChange`, `onStatusChange` |
| memory-panel | `memories` | `defaultMemories` | `onChange` |

The same rule now applies to the props that used to be copied once (comment-thread, comments-panel,
notification-stack, email-draft, progress-tracker, setup-guide, tips-panel, reaction-bar, integration-picker,
integration-settings, decision-inbox, review-center) and to the local decision maps in agent-inbox, agent-lanes and
delegate-board: a decision you make is kept until the task you pass changes, then your data wins.

### Breaking: `now` is epoch ms everywhere

fan-out-grid and plan-vs-actual read `now` as epoch ms and tick on their own clock when it isn't passed. The old
meaning (ms from the start of the job, with job-relative task times) is `elapsed`. trace-waterfall without
`startedAt` still reads `now` the old way, deprecated in favour of `elapsed`.

### Deprecated (kept for one release)

- stepper-form `initialValues` → `defaultValues`; `initialStep` → `defaultStep`
- setup-guide `onChange` → `onDoneChange` (same arguments)
- cited-answer `defaultOpen` → `defaultPreview`
- trace-waterfall `now` without `startedAt` → `elapsed`

### Added

- `className`, DOM props and `ref` on every component root (components with an imperative handle – decision-tree,
  review-center, inline-diff – keep it).
- New controllable state (`x` / `defaultX` / `onXChange`) where a parent may want it, e.g. agent-cursors `tab` and
  `following`, agent-graph `selected`, agent-inbox `view` and `expanded`, agent-lanes `expanded`, agent-ledger
  `onUndoneChange`, agent-queue `paused` and `openId`, agent-steering `draft`, agent-tree `collapsed`.
- Async callbacks (send, run, approve, upload, retry, compact …) may return a promise: the component shows pending,
  and a rejection shows an error you can retry from. Long operations (chat-composer, command-menu, context-window,
  dropzone, integration-picker/-settings, message-actions, otp-input, stepper-form, writing-assistant) receive an
  `AbortSignal`.
- Inputs (combobox, otp-input, segmented-control, date-range-picker, dropzone, filter-menu, stepper-form …) take
  `name` (hidden input for native forms), `disabled` and `required`; Enter ignores IME composition.
- `hotkey` on command-menu, integration-picker and toaster: `false` turns the shortcut off, a string changes it; one
  listener per shortcut however many instances.
