---
pattern: none
status: new
related: attention-pulse, toaster, progress-tracker, text-reveal
---

## Overview

A small tick that draws itself once, for moments like shared or saved, then rests. It never loops, which suits calm, serious work.

## When to use

- Beside words that confirm something finished, such as Saved.
- A step that has just completed.

## When not to use

- Ongoing status – use `progress-tracker`.
- A message people must read – use `toaster`.

## Anatomy

1. **Ring** `.ui-sck-ring` – the circle, drawn first
2. **Tick** `.ui-sck-tick` – drawn after it

## Looks

No look of its own. A page can set `--tc-success-check-size` and `--tc-success-check-color`.

## Keyboard

Nothing to operate. It takes no focus.

## Screen readers

Decorative by default and skipped, so put the words beside it. With `label` it's an image named by the label. It doesn't announce itself, so use a `role="status"` message for anything that matters.

## Content

Pair it with a word or two, such as Shared.

## Do

- Change `play-key` to draw it again after a later save.

## Don't

- Don't rely on the tick alone to say what happened.

## Example

```html
<tc-success-check></tc-success-check> Saved

<script type="module">
  import "trenchcoat/success-check";
  import "trenchcoat/tokens.css";
</script>
```

```tsx
import { SuccessCheck } from "trenchcoat/react";

export function Saved() {
  return <span><SuccessCheck /> Saved</span>;
}
```
