---
pattern: none
status: new
related: collapse, blur-crossfade, team-flag-editor, todo-list
---

## Overview

Rows that glide. When a list's rows are reordered, added or removed, each one moves from where it was to where it is instead of jumping, so people can follow what changed. New rows fade in and removed rows fade out.

## When to use

- A list people reorder with buttons or keys.
- A list that changes while someone's reading it, such as a queue.

## When not to use

- Swapping one thing for another – use `blur-crossfade`.
- Opening and shutting one section – use `collapse`.
- Dragging, where the row should follow the pointer – it animates after a change, not during it.

## Anatomy

1. **List** `[data-ui="lsm"]` – holds the rows, which stay your own elements

## Looks

No look of its own. A page can set `duration`; by default it follows `--tc-duration-slow`.

## Keyboard

Nothing to operate. Your own controls keep doing what they do. Moving a row in the DOM can lose focus, so put focus back on the moved row or its control.

## Screen readers

It adds no role, so use `role="list"` when the rows are a list. A removed row's fading copy is `aria-hidden` and `inert`.

## Content

Each direct child is a row. Give rows stable identity in your framework (a React `key`), or they'll be replaced rather than moved.

## Do

- Announce moves in words as well, with a `role="status"` message.
- Give rows a stable `key`.

## Don't

- Don't use it for long lists that change constantly. The movement stops being useful.

## Example

```html
<tc-list-motion id="rows"><div>One</div><div>Two</div></tc-list-motion>

<script type="module">
  import "trenchcoat/list-motion";
  import "trenchcoat/tokens.css";
</script>
```

```tsx
import { ListMotion } from "trenchcoat/react";

export function Rows({ rows }: { rows: { id: string; name: string }[] }) {
  return <ListMotion>{rows.map((r) => <div key={r.id}>{r.name}</div>)}</ListMotion>;
}
```
