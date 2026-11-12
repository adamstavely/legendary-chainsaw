# Component canvas – plan

An infinite canvas of every Trenchcoat piece. You pan and zoom around it, switch between layouts (including one that
sorts by how pieces look), zoom in on one piece, and riff on variants with Claude. You then promote a variant into the
library or throw it away.

## What we already have

All in `trenchcoat/`:

| Need                                         | Already in Trenchcoat                                                                                      |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Every piece, rendered                        | ~440 gallery entries (`app/src/registry.ts`), most with an `html` example on their docs page               |
| A cheap picture of each                      | `app/src/thumbs/**`: light, dark and Clean `.webp` per entry, 2.8 MB in all                                |
| Categories and metadata                      | `app/src/catalog.ts`                                                                                       |
| A safe way for a model to change a component | `src/generative`: a JSON Schema per component (378 of them), and `checkComponent()`, which drops bad props |
| Model tool definitions                       | `toolDefinitions()` in `src/generative`                                                                    |
| Prop docs and component tokens               | `custom-elements.json`, `app/src/docs/api/`                                                                |

So the hard parts already exist: renderable pieces, pictures of them, and schema-checked props a model can write. The
canvas is mostly a new view over them.

## Where it lives

- **Its own app.** `canvas/` sits beside `trenchcoat/`. It's a Vue 3 + Vite app in TypeScript, built from Trenchcoat's
  web components, with shadcn-vue only where Trenchcoat has no piece. Phase 1 needed none.
- **Icons and accessibility.** Lucide is the only icon set. The app targets WCAG 2.2 AA.
- **Reading Trenchcoat.** It reads Trenchcoat from source: the elements, the gallery catalogue, the thumbnails, and
  the docs examples for the live pieces. Nothing is copied.
- **Riffing is dev-only.** It needs `ANTHROPIC_API_KEY`, so the call goes through a Vite dev-server middleware
  (`/__canvas/riff`). The key never reaches the browser. A built canvas has every layout but no riffing.

## Rendering

- **Pan and zoom.** A transformed world layer with pointer-drag panning, wheel and pinch zoom, and fit-to-view. Use no
  library; tldraw's licence and weight aren't worth it for cards on a grid.
- **Level of detail.** When zoomed out, each card is its thumbnail. Past about 60% zoom, cards inside the viewport
  swap to the live demo. Live demos are capped at around 24 at once and unmounted when they scroll off. This keeps 440
  pieces smooth.
- **Look and theme.** The canvas has its own switches: Standard or Clean, light or dark. Thumbnails swap with them.
- **Chrome.** As in the screenshot:
  - a "Jump to a piece" field (`tc-command-menu`), opened with ⌘K;
  - layout tabs;
  - a filter by library, category and kind;
  - a count such as "21 of 440 components · 5 libraries".
- **Accessibility.**
  - One card at a time is in the Tab order. Arrow keys move between cards spatially, Enter opens a card, and Escape
    steps back out.
  - A List view gives a plain list.
  - Zoom moves are instant under reduced motion.

## Layouts

| Layout  | How cards are placed                                                                                     | Data source                             |
| ------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| Grid    | Sections per category, alphabetical (the gallery's order)                                                | catalog.ts                              |
| Free    | Wherever you drag them, saved per viewer in localStorage                                                 | –                                       |
| Matrix  | One row per piece, with four columns: Standard and Clean, each light and dark. A drift check at a glance | thumbs                                  |
| Graph   | Pieces joined by what they use, e.g. a block made of cards and badges                                    | imports in `src/elements` and `blocks/` |
| Similar | Visual neighbours side by side; clusters get a label                                                     | embeddings → 2-D layout                 |
| Focus   | One piece, large and live, with its variants around it                                                   | riffs                                   |

Layout changes animate cards from old to new positions, as a FLIP transition on the world layer.

## Visual similarity

A build-time script, `canvas/scripts/similarity.mjs`, writes `canvas/src/data/similarity.json`:

1. **Embed each light thumbnail.** Use a CLIP image model run locally with `@huggingface/transformers`. That's about
   100 MB of weights, cached outside the repo and never shipped.
2. **Lay out in 2-D** with UMAP (`umap-js`) under a fixed seed, so the layout is the same on every run. Snap the result
   to a loose grid so cards don't overlap.
3. **Cluster** with k-means on the 2-D map, and name each cluster after its most typical piece.
4. **Find near-duplicates.** List pairs above a similarity threshold in `canvas/reports/near-duplicates.md` as
   candidates to merge.

A unit test fails when the output no longer matches the thumbnails; `npm run similarity` brings it up to date. The
output is committed, so the canvas itself needs no model.

## Riffing with Claude (Focus)

Zoom into a card, or press Enter on it, and a side panel opens next to the live piece.

- **The prompt.** A free-text prompt ("denser", "for a mobile sheet", "error state", "more urgent") plus quick chips.
- **The request.** The middleware calls `claude-opus-5-5` with adaptive thinking and streaming. It sends:
  - the component's schema;
  - the demo's current props;
  - the docs page;
  - the list of the component's own tokens.

  One tool, `propose_variants`, returns 3–4 variants. Each has a name, a one-line rationale, props, and optional token
  overrides.

- **Checking.** Props go through `checkComponent()`. Token overrides are limited to the component's own `--tc-*`
  tokens, with values that are other tokens, so there are no literals and the ratchet holds. Anything dropped shows on
  the card.
- **Display.** Variants appear as live cards in a ring around the original, so they can be compared side by side in
  both looks and both themes. Each one can be riffed on again, and the history is a branch in the panel.

### Promote and discard

- **Discard** removes the card. It stays in the session history.
- **Promote, for a props or token variant.** The middleware writes `trenchcoat/app/src/variants/<slug>.json`. Promoted variants
  then:
  - become named presets in the gallery demo;
  - get a "Variants" section on the docs page, with snippets;
  - appear on the canvas as permanent satellites of the piece.

  Nothing in `src/` changes, so this is cheap and reversible.

- **Promote, for a variant that needs new code** (a new attribute, a new layout mode). The model flags these as
  "structural". Promote then writes a brief, `audit/variant-requests/<slug>-<name>.md`, holding the prompt, rationale,
  screenshot and suggested API. The new-component skill builds it as a normal PR. The canvas never edits element
  source itself.

## Phases (one PR each)

1. **Canvas shell** (done).
   - pan and zoom, level of detail, and the Grid and Free layouts;
   - live pieces from the docs examples;
   - jump-to, filter, look and theme, keyboard and list view.

   Tests cover keyboard movement, LOD caps, axe, and a pan/zoom performance budget.

2. **Similarity** (done).
   - the similarity script, the Similar layout, and More like this;
   - Look-alike badges and the near-duplicate report, `canvas/reports/near-duplicates.md`;
   - a unit test that fails when `similarity.json` no longer matches the thumbnails, in place of an `integrate.mjs`
     hook, so Trenchcoat itself is unchanged.

   What changed from the plan, and why:
   - **Groups are named after their most typical piece** ("Like Sankey Chart"). Naming them by category mixed
     unrelated pieces, and naming them with CLIP's text side ("bar charts", "forms") was often wrong. A piece's name is
     always true.
   - **Groups come from the 2-D map**, not the raw embeddings, so each group is one place on the map and they're about
     the same size.
   - **No structural vector yet.** CLIP alone sorts well; counting buttons and inputs would need every piece rendered.
   - **Matrix is deferred.** Only light and dark thumbnails are captured, not Clean, so it would show two of its four
     columns. It needs Clean thumbnails from Trenchcoat first.

3. **Riff** (done).
   - the riff panel beside an open component, the dev-server endpoints and the Claude call, and variant cards in a
     ring around the piece;
   - validation, keep and discard, `trenchcoat/app/src/variants/<slug>.json`, and briefs for structural variants in
     `trenchcoat/audit/variant-requests/`.

   What changed from the plan, and why:
   - **Presets in the gallery demos and docs pages are left for a Trenchcoat PR.** They change Trenchcoat itself (a
     version bump and changelog), and are better built once some variants have been kept to design them around.
   - **Kept variants show in the dev server only.** A built canvas has no riffing, and reading them at build time would
     reload the page whenever one is kept.
   - **Briefs have no screenshot yet**, only the prompt, rationale, what to build and the closest props and tokens.
   - **The variants are previews**, not interactive: the panel acts on them, so they never take focus.

4. **Graph** (done).
   - the composition graph layout, from the elements' own source: an element that renders `<tc-other>` or imports
     `./other` is built with it. A block shares its element's slug, so it shows its element's links;
   - each card's description, and the List view, say the links in words.

   What's left of this phase moves on: screenshots in the structural-variant briefs come with the next one.

5. **Tune** (next). DialKit in the riff panel: a dial for each of the open component's props (sliders, toggles,
   selects, text) and for its tokens (each a choice of other tokens), applied to the live piece as they move. Keep saves
   the result as a variant, with the same checks as a riff. Also screenshots for structural-variant briefs.

## Decisions to confirm

- **Scope of pieces.** Components, blocks and motion. Illustrations and screens are left out, since they don't riff
  well.
