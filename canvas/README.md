# Trenchcoat Canvas

Every Trenchcoat piece on one infinite canvas. Pan and zoom around ~390 components, blocks and motion pieces, switch
between layouts, and open any piece live, running from its own docs example.

This covers phases 1 to 5 of the plan in [`PLAN.md`](PLAN.md): the canvas itself, with the Grid and Free layouts; the
Similar layout, which sorts pieces by how they look; riffing on a component's variants with Claude; the Graph layout,
which shows which pieces are built from which; and tuning a component by hand on DialKit's dials.

```bash
npm install
npm run dev
```

Then open http://localhost:5210.

## What it does

- **Grid.** Each category is a section, in the gallery's order.
- **Similar.** Pieces that look alike sit together, in groups named after their most typical piece ("Like Sankey
  Chart"), with similar groups near each other. Pieces that look almost the same as another carry a **Look-alike**
  badge. On any other layout, **More like this** on the current card shows it here, among its look-alikes. The List
  view groups by look too.
- **Graph.** Pieces joined by what they're built from: a line runs from each piece down to each part it uses, and the
  current card's lines stand out. Rows go from the pieces built from the deepest stack of parts at the top to the
  parts themselves at the bottom; pieces that neither use nor are used by another come last. The links come from the
  elements' source – one element rendering `<tc-other>` or importing `./other` – and each card's description says the
  same in words ("Built with … Used in …"), as does the List view.
- **Free.** Drag a card by its title bar, or move it with its arrow buttons or Alt + arrow keys. Positions are kept in
  this browser; **Reset layout** puts them back.
- **Zoom in** past 125% and the cards in view swap their thumbnail for the running piece. At most 12 run at once.
- **Open a piece** (Enter, or click its title) to zoom to it and use it. Escape goes back to the canvas.
- **Jump to a piece** (⌘K or Ctrl K) finds any piece by name or description. You can also filter by library and
  category, switch the look (Standard or Clean) and the theme (light or dark), and use a **List** view that shows the
  same pieces as a plain, scrollable list.

## The panel: Riff and Tune

Open a component (Enter, or click its title) and a panel opens beside it, with two tabs. Without the dev server – in a
built canvas – there's only Tune, and no tabs.

### Tune

[DialKit](https://www.dialkit.dev)'s dials, inline in the panel: one for each of the component's props the schema
describes simply – a toggle, a choice, a number, a line of text or a colour – and a **Tokens** folder with one for each
of its tokens that sits on a scale (space, radius, type size, weight, line height, shadow, duration), offering the
other steps of that scale. The piece changes as a dial moves. **Reset** puts it back; closing the piece does too.
**Keep tuned version** (dev server only) saves what the dials moved as a variant, checked and stored exactly like a
riffed one.

DialKit's own title bar and versions toolbar are hidden: the panel has the piece's name, and Keep and Reset. It loads,
with Motion, only once a piece is opened.

### Riff

Say what should change – or pick one of the
ideas – and Claude proposes three or four variants. They appear live around the piece, so you can compare them, and
the panel lists each one with why it differs:

- **Show** zooms to it. **Riff on this** starts the next request from that variant instead of the piece.
- **Keep** saves it to `trenchcoat/app/src/variants/<slug>.json`: a name, the prompt, and the props and tokens that
  differ. Kept variants come back around the piece whenever it's opened. A variant Claude marks **Needs new code** also
  gets a brief in `trenchcoat/audit/variant-requests/`, to build as a normal pull request. The canvas never edits a
  component's code.
- **Discard** drops it; **Remove** un-keeps a kept one. Commit what you keep like any other change.

Riffing runs in the dev server only (`npm run dev`), with `ANTHROPIC_API_KEY` set (or an `ant auth login` profile).
`plugins/riff.ts` holds the key and calls `claude-opus-5-5`, with adaptive thinking and the server-side refusal
fallback; the browser only talks to the dev server, which accepts requests from the canvas's own origin alone. A built
canvas has no riffing.

What Claude writes is checked before anything is shown or saved:

- **Props** go through Trenchcoat's generative-UI checks (`checkProps`), against the component's JSON Schema: a prop
  that isn't allowed is left out, and the panel says which and why.
- **Tokens** may only be the component's own – the shared tokens its source uses and its `--tc-<slug>-…` component
  tokens – and each must be set to another token as `var(--tc-…)`. No literal colours or sizes, so kept variants
  keep to the token rules.

Each request is one call to Claude Opus 5.5: roughly 5–10K input tokens (the schema, the docs page, the props, and the
token list, which is cached), plus the thinking and the answer.

## How it gets the pieces

It reads Trenchcoat from source in `../trenchcoat`, so it always shows this branch's elements:

| What                            | From                                                                            |
| ------------------------------- | ------------------------------------------------------------------------------- |
| Names, descriptions, categories | `trenchcoat/app/src/catalog.ts` (the gallery's catalogue)                       |
| Thumbnails                      | `trenchcoat/app/src/thumbs/`                                                    |
| Live pieces                     | The first `html` example on each docs page, `trenchcoat/app/src/docs/<slug>.md` |
| Elements                        | `trenchcoat/src/elements/<slug>.ts`                                             |

`plugins/trenchcoat.ts` resolves `@adamstavely/trenchcoat/<slug>` to the source and turns each docs example into a
module. `src/data/examples.ts` mounts an example inside its card:

- its ids are prefixed, so several examples can be live at once;
- its `document` is scoped to the card;
- its `fetch` gets an empty reply.

## How it sorts by look

`npm run similarity` (`scripts/similarity.mjs`) writes `src/data/similarity.json` and
[`reports/near-duplicates.md`](reports/near-duplicates.md). Run it when thumbnails change; a unit test fails until you
do.

1. It embeds each piece's light thumbnail with CLIP (`Xenova/clip-vit-base-patch32`), run locally with
   `@huggingface/transformers`. The model, about 100 MB, downloads once into `node_modules/.cache/clip`, and embeddings
   are cached by thumbnail hash, so a rerun only embeds what changed.
2. UMAP lays the embeddings out in 2-D, and k-means groups neighbouring pieces on that map, about 22 to a group. Both
   use a fixed seed, so the same thumbnails always give the same map.
3. Each group becomes a block of cards near the groups it resembles (`src/canvas/similarity.ts`).
4. Pairs of pieces with a cosine similarity of 0.92 or more are listed as near-duplicates: candidates to merge or to
   make more distinct.

The JSON is committed, so the canvas itself needs no model.

Four docs examples rely on something the docs page around them provides: Agent Recap, Header Brand, Stories and
Structured Output. Those cards show their thumbnail. `tests/browser/examples.test.ts` lists them, and it fails if
any other example stops mounting.

## Accessibility

The canvas targets WCAG 2.2 AA:

- **Keyboard.**
  - One card at a time is in the Tab order. Arrow keys move between cards spatially, Enter opens a card, Escape
    returns, + and − zoom, 0 resets the zoom, and 1 fits everything.
  - These shortcuts only work while focus is on the canvas (2.1.4).
  - Live pieces stay `inert` until opened, so Tab never wanders through hundreds of controls.
- **No dragging needed** (2.5.7). Panning and moving cards both have button and keyboard equivalents: the zoom
  buttons, Jump to a piece, the cards' arrow buttons and Alt + arrows.
- **Focus not obscured** (2.4.11). Moving to a card pans just enough to show it clear of the edges.
- **Announcements.** A status region announces zoom changes once they settle, opening and closing pieces, filter
  changes, and moving to the Similar layout. A card's description says which pieces it looks most like.
- **Reduced motion.** The view jumps instead of gliding.
- **Colour and contrast.** Colours, focus rings and type are Trenchcoat tokens, in light and dark.
- **List view.** It gives everything in reading order, and reflows down to 320 px.

The app's own controls are Trenchcoat elements:

- the jump field is `tc-command-menu`;
- the switches are `tc-segmented-control`;
- the filters are `tc-filter-menu`;
- the buttons are `tc-button`.

Icons are Lucide (`@lucide/vue`).

## Checks

```bash
npm run ci   # typecheck, lint (incl. vuejs-accessibility), format, tests, build
```

The tests have two parts:

- **Unit tests** (Node): the viewport maths, the layouts, arrow-key navigation, the snippet parser, the similarity
  maths, that `similarity.json` still matches the thumbnails, and the riff endpoint's request, checks and origin rule
  (against a fake Claude client – no test calls the API).
- **Browser tests** (Chromium): keyboard use, opening and closing pieces, the Free and Similar layouts, More like
  this, riffing (with the endpoints stubbed), filters and the list view. axe checks the WCAG 2.2 AA and best-practice rules in both themes and both looks, and every docs example is
  mounted.
