# Trenchcoat Canvas

Every Trenchcoat piece on one infinite canvas. Pan and zoom around ~390 components, blocks and motion pieces, switch
between layouts, and open any piece live, running from its own docs example.

This is phase 1 of the plan in [`PLAN.md`](PLAN.md):
the canvas itself, with the Grid and Free layouts. Sorting by visual similarity, and riffing on variants with Claude, come
next.

```bash
npm install
npm run dev
```

Then open http://localhost:5210.

## What it does

- **Grid.** Each category is a section, in the gallery's order.
- **Free.** Drag a card by its title bar, or move it with its arrow buttons or Alt + arrow keys. Positions are kept in
  this browser; **Reset layout** puts them back.
- **Zoom in** past 125% and the cards in view swap their thumbnail for the running piece. At most 12 run at once.
- **Open a piece** (Enter, or click its title) to zoom to it and use it. Escape goes back to the canvas.
- **Jump to a piece** (⌘K or Ctrl K) finds any piece by name or description. You can also filter by library and
  category, switch the look (Standard or Clean) and the theme (light or dark), and use a **List** view that shows the
  same pieces as a plain, scrollable list.

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
- **Announcements.** A status region announces zoom changes once they settle, opening and closing pieces, and
  filter changes.
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

- **Unit tests** (Node): the viewport maths, the layouts, arrow-key navigation, and the snippet parser.
- **Browser tests** (Chromium): keyboard use, opening and closing pieces, the Free layout, filters and the list
  view. axe checks the WCAG 2.2 AA and best-practice rules in both themes and both looks, and every docs example is
  mounted.
