---
pattern: none
status: new
related: list-motion, blur-crossfade, setup-guide, comments-panel
---

## Overview

Content that glides open and shut. It animates to the content's real height with nothing to measure, so it keeps up when the content changes, and shut content can't be reached by keyboard or screen readers.

## When to use

- A section that opens from a button.
- Details under a row, or optional fields in a form.

## When not to use

- Swapping one thing for another – use `blur-crossfade`.
- Reordering rows – use `list-motion`.
- A floating menu or card, which shouldn't push the page – use a popover.

## Anatomy

1. **Collapse** `[data-ui="cps"]` – holds one child, which is what opens and shuts

## Looks

No look of its own. It follows `--tc-duration-slow` and `--tc-ease-move`.

## Keyboard

Nothing to operate. Your own button controls it. When it's shut, what's inside can't take focus.

## Screen readers

Shut content is `inert`, so it's skipped. Point your button at it with `aria-expanded` and `aria-controls`.

## Content

Give it one child. Padding belongs on that child's content, so the shut height is really zero.

## Do

- Keep the button's `aria-expanded` in step with `open`.
- Move focus out first if it might be inside when shutting.

## Don't

- Don't use it to hide something people need before they can continue.

## Example

```html
<tc-collapse open><div>The rest of it.</div></tc-collapse>

<script type="module">
  import "trenchcoat/collapse";
  import "trenchcoat/tokens.css";
</script>
```

```tsx
import { Collapse } from "trenchcoat/react";

export function More({ open }: { open: boolean }) {
  return <Collapse open={open}><div>The rest of it.</div></Collapse>;
}
```
