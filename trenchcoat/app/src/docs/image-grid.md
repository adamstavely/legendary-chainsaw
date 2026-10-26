---
pattern: grid
status: new
related: dropzone, artifact-panel, answer-arena
---

## Overview

Generated images as a grid of variations, with what people do next on every tile: regenerate one, upscale it,
compare two, download. A tile is pending (a shimmer, with its progress when the app knows it), done or failed (with
Try again), so a whole batch can come in at its own pace. Every image has an alt-text line under it that people can
edit, and a missing one is flagged, so generated images reach the page described. Compare lays two tiles on top of
each other with a divider to drag between them.

## When to use

- Showing the results of an image-generation prompt, usually four variations.
- When people pick one of several images and need to refine, enlarge or save it.
- Anywhere generated images will be published and need alt text before they go.

## When not to use

- Uploading people's own files – use `dropzone`.
- Everything a run produced – files, documents, code and images together – use `artifact-panel`.
- Comparing two models' text answers – use `answer-arena`.

## Anatomy

1. **Heading** `.ui-igrid__head` – the grid's name and the prompt the images came from
2. **Tile** `.ui-igrid__tile` – one variation: pending, done or failed, numbered in its corner
3. **Actions** `.ui-igrid__tools` – Regenerate, Upscale, Compare and Download, over a done tile on hover or focus
4. **Alt text** `.ui-igrid__alt` – the image's description, with a button to edit it
5. **Summary** `.ui-igrid__foot` – “4 images · 1 needs alt text”, or the comparison and its Swap and Done

## Looks

Standard sets the heading and grid on a white card in the gray tray, with the summary on the tray below it. Clean
drops the tray: one white card whose last row holds the summary. Both use the same tiles, shimmer and compare view.

## Keyboard

| Key | What it does |
|---|---|
| ← / → / ↑ / ↓ | Moves between tiles |
| Home / End | First or last tile in the row |
| Ctrl Home / Ctrl End | First or last tile |
| Enter | Moves into the tile's actions; Tab and Shift Tab then cycle them |
| Escape | From the actions or the alt-text button: back to the tile |
| F2 | Edits the tile's alt text; Enter saves, Escape cancels |
| R / U / C / D | Regenerates, upscales, compares or downloads the focused tile |

In the compare view the divider is a slider: ← / → or ↑ / ↓ move it by 1 (Shift by 10), Page Up / Page Down by 10,
Home / End to either side, and Escape closes the comparison.

## Screen readers

The grid is a `grid` named by the heading and described by the prompt, with one `gridcell` per tile and a single
tab stop. Each tile's name says what it is: “Variation 2: A lighthouse on a cliff at dusk”, “Variation 3:
Generating 40%” or “Variation 4: The model timed out, Try again”, and it is described by “Enter for actions, F2 to
edit alt text, R regenerate, U upscale, C compare, D download”. A pending tile has a `progressbar`. The action
buttons name their tile (“Upscale Variation 2”) and carry `aria-keyshortcuts`. A status region says what happened:
“Variation 2 is ready”, “Regenerating Variation 2”, “Variation 1 picked. Pick a second image to compare”, “Comparing
Variation 1 and Variation 2”, “Alt text saved for Variation 2”. The compare divider is a `slider` whose value text
says how much of each image shows (“50% Variation 1, 50% Variation 2”).

## Content

- Write alt text as what the image shows, in one sentence: “A lighthouse on a sea cliff at dusk, warm light on the
  water” – not “Generated image”.
- Show the prompt with `prompt`, so people remember what they asked for.
- Give pending tiles an `activity` when they're doing something other than generating: “Upscaling”, “Varying”.
- Keep `error` short and specific: “The model timed out”, not a stack trace.

## Do

- Answer `tc-regenerate` and `tc-upscale` by updating the tile: `status: "pending"`, then done with the new `src`.
- Pass `progress` when the model reports it, so the bar shows how far along a tile is.
- Ask for alt text before the images are used – the summary counts the ones still missing.

## Don't

- Don't fill `alt` with the prompt for every tile; the variations differ, and so should their descriptions.
- Don't offer actions your backend can't do – limit them with `actions`.
- Don't use more than about four `columns`; the tiles get too small to judge.

## Example

```html
<tc-image-grid id="images" heading="Lighthouse at dusk" prompt="A lighthouse on a sea cliff at dusk, soft watercolor"></tc-image-grid>

<script type="module">
  import "trenchcoat/image-grid";
  import "trenchcoat/tokens.css";

  const grid = document.querySelector("#images");
  grid.tiles = [
    { id: "a", src: "/out/a.png", alt: "A white lighthouse on a cliff, the sea glowing orange" },
    { id: "b", alt: "", status: "pending", progress: 0.4 },
  ];
  grid.addEventListener("tc-regenerate", (e) => {
    grid.tiles = grid.tiles.map((t) => (t.id === e.detail.tile.id ? { ...t, status: "pending", progress: 0 } : t));
  });
</script>
```

```tsx
import { useState } from "react";
import { ImageGrid, type ImageGridTile } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Variations({ start, regenerate }: { start: ImageGridTile[]; regenerate: (id: string) => void }) {
  const [tiles, setTiles] = useState(start);
  return (
    <ImageGrid
      title="Lighthouse at dusk"
      prompt="A lighthouse on a sea cliff at dusk, soft watercolor"
      tiles={tiles}
      onTilesChange={setTiles}
      onRegenerate={(tile) => {
        setTiles((list) => list.map((t) => (t.id === tile.id ? { ...t, status: "pending", progress: 0 } : t)));
        regenerate(tile.id);
      }}
    />
  );
}
```
