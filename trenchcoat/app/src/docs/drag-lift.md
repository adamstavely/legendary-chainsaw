---
pattern: none
status: new
related: list-motion, task-board, scheduled-runs, prioritisation-matrix
---

## Overview

Picks its child up while it's dragged: it lifts, follows the pointer and leaves a gap where it was. It's only the lift. Where things land is the page's call, so use `tc-list-motion` for rows that move once dropped.

## When to use

- Anything people drag, where the page decides what dropping does.
- Cards on a board, or tasks moving between lists.

## When not to use

- Rows gliding after a reorder – use `list-motion`.
- A complete board with dropping built in – use `task-board`.

## Anatomy

1. **Host** `[data-ui="dlf"]` – shows the gap while `data-lifted`
2. **Child** `[data-ui="dlf"] > :first-child` – what's lifted
3. **Handle** `[data-drag-handle]` – optional; touch drags only from it

## Looks

No look of its own. A page can set `--tc-drag-lift-scale`, `--tc-drag-lift-shadow`, `--tc-drag-lift-gap` and `--tc-drag-lift-radius`.

## Keyboard

| Key | What it does |
|---|---|
| Escape | Cancels a drag, and the child glides home |

Dragging itself is by pointer, so the page must offer a keyboard way to do the same move.

## Screen readers

It adds no role and announces nothing. Announce what a drag did with a `role="status"` message, and offer a way that doesn't need dragging.

## Content

Give the child a visible handle when it also holds text people might select or scroll past on touch.

## Do

- Call `preventDefault()` on `tc-drag-end` once your page has placed the item, so it doesn't glide home.
- Offer buttons or a menu for the same move.

## Don't

- Don't make dragging the only way to do something.

## Example

```html
<tc-drag-lift><div><span data-drag-handle>⠿</span> A card</div></tc-drag-lift>

<script type="module">
  import "trenchcoat/drag-lift";
  import "trenchcoat/tokens.css";
</script>
```

```tsx
import { DragLift } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Card() {
  return (
    <DragLift onTcDragEnd={(e) => console.log(e.detail.x, e.detail.y)}>
      <div>A card</div>
    </DragLift>
  );
}
```
