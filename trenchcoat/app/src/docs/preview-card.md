---
pattern: none
status: new
related: collection-card, preview-frame, panel-card
---

## Overview

A gallery or index tile: a large preview on top, then a title and a line or two of description below a hairline. The
preview is a picture (`src`), or the page's own children – a live component or page – fitted by `fit`:
- `cover` fills the frame and crops.
- `contain` shows all of it.
- `scale` lays the children out at `preview-width` (1024px by default) and shrinks them to the card, like a thumbnail
  of a live page.

The title is a link (`href`) or a button that fires `tc-open`, and its hit area covers the whole card. `orientation`
"horizontal" puts the preview beside the words for a list, and `loading` shows a placeholder.

## When to use

- An index of components, templates, pages or files, one tile each.
- A gallery where seeing the thing helps people pick it.

## When not to use

- A whole section with counts and examples: use `collection-card`.
- Working in the page it previews: use `preview-frame`.
- A section of a side panel: use `panel-card`.

## Anatomy

1. **Stage** `.ui-pvc__stage` – the area behind the preview: the tray in Standard, a well in Clean
2. **Frame** `.ui-pvc__frame` – the rounded frame, holding the picture `.ui-pvc__img` or under the live preview
3. **Badge** `.ui-pvc__badge` – the optional tag at the top right
4. **Body** `.ui-pvc__body` – the words: in Standard, a white card on the tray
5. **Title** `.ui-pvc__title` – a heading holding the link `.ui-pvc__link`, on one line
6. **Description** `.ui-pvc__description` – up to two lines
7. **Placeholder** `.ui-pvc__shimmer` and `.ui-pvc__bar` – shown while `loading`

## Looks

Standard sets the preview on a gray tray and the words on a white card below it. Clean is one white card, with the
preview on a sunken well above a hairline. Both lift a little on hover and ring the whole card on focus. A page can set
`--tc-pvc-pad`, the preview's margin, `--tc-pvc-ratio`, the frame's shape (16 / 10 by default), and `--tc-pvc-side`,
the preview's width when horizontal (40%).

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to the title's link, the card's one stop |
| Enter | Opens it (Space too when there's no `href`) |

## Screen readers

The title is a heading (`heading-level`, 3 by default) holding the link, so the card is named by its title. A picture
uses `alt`: leave it empty when the title says it. Live previews are inert and `aria-hidden`, so their controls can't
be reached or read. While `loading`, the card is `aria-busy`.

## Content

Use the thing's own name as the title and say what it does in the description, in a short sentence. A badge is one
word – "New", "Beta". For `fit="scale"`, set `preview-width` to the width the content was designed at.

## Do

- Keep previews of the same kind at the same `fit` and ratio across a grid.
- Prefer a picture to a live preview when the grid is long; live previews cost as much as the real thing.

## Don't

- Don't put controls in a live preview and expect them to work: the preview is inert.
- Don't write a description longer than two lines; the rest is cut off.

## Example

```html
<tc-preview-card heading="Agent Cursors" description="Agents working in a document like teammates" src="/shots/cursors.png" href="/agent-cursors" badge="New"></tc-preview-card>

<script type="module">
  import "@adamstavely/trenchcoat/preview-card";
  import "@adamstavely/trenchcoat/tokens.css";
</script>
```

```tsx
import { PreviewCard } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Tile() {
  return <PreviewCard title="Agent Cursors" description="Agents working in a document like teammates" src="/shots/cursors.png" href="/agent-cursors" badge="New" />;
}
```
