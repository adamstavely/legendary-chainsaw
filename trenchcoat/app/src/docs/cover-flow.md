---
pattern: none
status: stable
related: image-grid, model-wheel, tilt-card, layer-stack
---

## Overview

A row of covers to browse in 3D. The cover in front faces you; the others turn away and stack up on both sides over
a soft reflection, and their images drift a little in their frames as they move. People drag, flick, scrub with a
trackpad, use the arrow keys or click a cover, and a spring carries the row along and settles on the nearest one.
The caption below rolls to the new title, with previous and next buttons beside it and a tick per cover under it.

## When to use

- Browsing a small, visual collection where the artwork is the point: albums, books, templates, themes.
- A showcase on a landing page that people can play with.
- Picking one item to open, with `selectable` – a click or Enter on the front cover fires `tc-select`.

## When not to use

- Comparing many images at once, or acting on several – use `image-grid`.
- Choosing between names rather than pictures – use `model-wheel`.
- A single card that reacts to the pointer – use `tilt-card`.
- Layers or stages of a product explained one at a time – use `layer-stack`.

## Keyboard

| Key | What it does |
|---|---|
| ← / → | Brings the previous or next cover to the front |
| Home / End | Brings the first or last cover to the front |
| Enter / Space | With `selectable`: fires `tc-select` for the cover in front |
| Tab | Moves between the carousel, Previous and Next |

## Screen readers

The row is a focusable region with `aria-roledescription="carousel"`, named by `label` (“Cover flow” by default).
Each cover is a slide named “3 of 7: Static Hearts”; only the front one is exposed, and the reflection is hidden.
When the row comes to rest, a polite status region says where – “3 of 7: Static Hearts, Night Signal”. Previous and
Next are `aria-disabled` at the ends, so focus stays on them; the ticks are named “Show Static Hearts” and are for
the pointer only. Reduced motion jumps straight to the chosen cover.

## Content

- Give every item a `title` – it's the caption and part of each slide's name – and an `alt` for its image.
- Use `subtitle` for the one thing that tells covers apart after the title: an artist, an author, a price.
- Keep it to a few dozen covers; people browse a cover flow, they don't search it.

## Example

```html
<tc-cover-flow id="albums" label="Albums" item-width="180" item-height="270" selectable></tc-cover-flow>

<script type="module">
  import "trenchcoat/cover-flow";
  import "trenchcoat/tokens.css";

  const flow = document.querySelector("#albums");
  flow.items = [
    { id: 1, title: "Northern Lights", subtitle: "Aurora Bay", image: "/covers/northern.jpg", alt: "Teal waves" },
    { id: 2, title: "Late Bloom", subtitle: "The Gardeners", image: "/covers/bloom.jpg", alt: "A pink circle" },
    { id: 3, title: "Static Hearts", subtitle: "Night Signal", image: "/covers/static.jpg", alt: "Violet bars" },
  ];
  flow.addEventListener("tc-select", (e) => console.log(e.detail.item.title));
</script>
```

```tsx
import { CoverFlow, type CoverFlowItem } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const albums: CoverFlowItem[] = [
  { id: 1, title: "Northern Lights", subtitle: "Aurora Bay", image: "/covers/northern.jpg", alt: "Teal waves" },
  { id: 2, title: "Late Bloom", subtitle: "The Gardeners", image: "/covers/bloom.jpg", alt: "A pink circle" },
  { id: 3, title: "Static Hearts", subtitle: "Night Signal", image: "/covers/static.jpg", alt: "Violet bars" },
];

export function Albums() {
  return <CoverFlow items={albums} itemWidth={180} itemHeight={270} aria-label="Albums" onSelect={(item) => console.log(item.title)} />;
}
```
