---
pattern: none
status: new
related: preview-card, panel-card, project-card
---

## Overview

A card that introduces a whole collection – a section of a library, a catalog or a design system – and links into it.
Up to three previews sit across the top; then come the title with its counts ("273 items · 273 files"), a bold line,
a short description, the names of what's inside and a link. The names show as many as fit in two lines, then "…".
The whole card opens the collection, but a click that ends a text selection doesn't, so its words can be copied.

## When to use

- The front page of a library, catalog or docs site, one card per section.
- A hub that sends people to collections of different sizes, where counts and examples help them choose.

## When not to use

- One item, such as a single component or page: use `preview-card`.
- A section of a side panel that folds open: use `panel-card`.
- A piece of work with progress and people: use `project-card`.

## Anatomy

1. **Card** `.ui-clc__card` – the white card; the whole of it opens the collection
2. **Previews** `.ui-clc__previews` – up to three frames `.ui-clc__thumb`: a picture `.ui-clc__img`, a live element, or a placeholder
3. **Title** `.ui-clc__title` – the collection's name, a heading, with its counts `.ui-clc__meta` at the right
4. **Subtitle** `.ui-clc__subtitle` – the bold line
5. **Description** `.ui-clc__description` – what the collection is for
6. **Items** `.ui-clc__items` – the names inside `.ui-clc__item`, with "…" `.ui-clc__more` for the ones that don't fit
7. **Link** `.ui-clc__action` – "Browse …" with an arrow `.ui-clc__arrow`

## Looks

Standard sets the card on a gray tray; Clean is one white card. Both lift a little on hover and show the focus ring
round the whole card. A page can set `--tc-clc-pad`, the card's padding, and `--tc-clc-thumb-ratio`, the previews'
shape (16 / 10 by default). At 360px wide and under, the title shrinks and the counts wrap under it.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to the link, the card's one stop |
| Enter | Opens the collection (Space too when there's no `href`) |

## Screen readers

The title is a heading (`heading-level`, 3 by default). The link is named by its words – "Browse Components" – and
described by the title. The names inside are read in full up to the "…", then "and N more" (`labels.more`). Pictures
use their `alt`; give `alt=""` when the words say the same. Live previews are inert and hidden.

## Content

Name the collection with a plural noun ("Components", "Templates"). Keep the bold line to a promise of what's inside
and the description to two or three sentences. List the items people look for first, in the order the collection
shows them. Counts come from `count` and `files`, or write `meta` yourself.

## Do

- Use the same counts the collection's own page shows.
- Pick previews that show different kinds of thing in the collection.

## Don't

- Don't put buttons of your own on the card: the whole card is one link.
- Don't use more than three previews; the strip takes the first three.

## Example

```html
<tc-collection-card id="card" heading="Components" count="273" files="273" href="/components"
  subtitle="Interactive building blocks for research tools"
  description="Self-contained pieces – agent views, charts, inputs and feedback."></tc-collection-card>

<script type="module">
  import "trenchcoat/collection-card";
  import "trenchcoat/tokens.css";

  const card = document.querySelector("#card");
  card.items = ["Agent Cursors", "Agent Findings", "Agent Graph", "Approval Card"];
  card.previews = [{ src: "/shots/checklist.png", alt: "A checklist with five steps" }];
</script>
```

```tsx
import { CollectionCard } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Library() {
  return (
    <CollectionCard
      title="Components"
      count={273}
      files={273}
      href="/components"
      subtitle="Interactive building blocks for research tools"
      description="Self-contained pieces – agent views, charts, inputs and feedback."
      items={["Agent Cursors", "Agent Findings", "Agent Graph", "Approval Card"]}
      previews={[{ src: "/shots/checklist.png", alt: "A checklist with five steps" }]}
    />
  );
}
```
