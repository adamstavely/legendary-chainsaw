---
pattern: none
status: new
related: number-ticker, number-change, notifications, notification-stack
---

## Overview

A count badge on a corner of what it wraps – an icon button, an avatar or a tab. When the count rises the badge pops, swelling past its size and springing back, and the digits roll up; when it falls they roll down. At 0 the badge shrinks away, and it pops back in from nothing. Above `max` it reads "99+", and `dot` shows a plain dot instead of a number. Nothing moves on first render. With reduced motion the number changes in place and the badge appears and goes without scaling.

## When to use

- Unread or waiting items on a button: a review queue, an inbox, mentions.
- A tab or menu item with new things in it.

## When not to use

- A status or a label – use a tag or [Validity Badge](#/validity-badge).
- A number that's the point of the page – use [Number Ticker](#/number-ticker) or [Number Change](#/number-change).
- Counts that change every second – the badge would never stop moving.

## Anatomy

1. **Host** `[data-ui="bdp"]` – wraps the content and positions the badge
2. **Badge** `.ui-bdp__badge` – the pill or dot on the corner
3. **Digits** `.ui-bdp__digits` – the number, rolling between `.ui-bdp__out` and `.ui-bdp__in`

## Looks

No look of its own. A page can set `--tc-badge-pop-bg`, `--tc-badge-pop-fg`, `--tc-badge-pop-ring` (the ring that separates it from what's under it), `--tc-badge-pop-size`, `--tc-badge-pop-dot` and `--tc-badge-pop-offset`. `position` picks the corner: `top-end` (the default), `top-start`, `bottom-end` or `bottom-start`.

## Keyboard

Nothing to operate: what it wraps keeps its own keys.

## Screen readers

The badge is hidden from screen readers; a polite status says the count in words with `label` ("5 findings to review"). It's updated once a burst of changes has held for `announce-delay` ms, so a run of quick changes is read once. Give the wrapped button its own name.

## Content

- `label` is the word after the count: "unread", "to review", "new".
- Keep `max` low enough that the badge stays small.

## Do

- Clear the count when the person has seen the items.

## Don't

- Don't put the only route to the items in the badge – it isn't a control.

## Example

```html
<tc-badge-pop count="3" label="to review">
  <button aria-label="Review queue">…</button>
</tc-badge-pop>

<script type="module">
  import "@adamstavely/trenchcoat/badge-pop";
  import "@adamstavely/trenchcoat/tokens.css";
</script>
```

```tsx
import { BadgePop } from "@adamstavely/trenchcoat/react";

export function QueueButton({ waiting }: { waiting: number }) {
  return (
    <BadgePop count={waiting} label="to review">
      <button type="button">Queue</button>
    </BadgePop>
  );
}
```
