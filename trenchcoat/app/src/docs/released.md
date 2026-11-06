---
pattern: none
status: new
related: awaiting-review, in-translation, in-quality-control, in-coordination, pending-release, all-done
---

## Overview

A document with a check on it and a few sparks around, for content that's out and live, with the words Released. It's one of the workflow stages beside `awaiting-review` – in translation, in
quality control, in coordination, pending release and released – so people can see where an item stands and that it's
on its way, not lost. On the badge, a check mark that draws itself once, with sparks that twinkle twice, then it rests.

## When to use

- Content or a change that's now out and visible to everyone it's for.
- The last step of a workflow, confirming it finished.

## When not to use

- An inbox or queue with nothing left – use `all-done`.
- Content approved but not out yet – use `pending-release`.

## Anatomy

1. **Page** `.ui-rld-page` – the document
2. **Mark** `.ui-rld-badge` – the round badge, with the stage drawn on it in ink
3. **Words** `.ui-rld-caption` – where it stands; the default is Released

## Looks

One look. Colours follow the page theme through `light-dark()`, with a `.dark` class, `data-theme`, `data-tc-theme` or
the system setting. It has no background of its own, so it takes on whatever it sits on.

## Keyboard

Nothing to operate. The illustration takes no focus.

## Screen readers

The host is `role="img"`, named by `label` or else by `caption`, so the stage is announced. With `caption=""` and no
`label` it's decorative and skipped, for when the words beside it say the same.

## Content

Say where it is and link to it: "Live on the institute's site". Give the date it went out.

## Do

- Use the stages together, so the same item reads the same way as it moves along.
- Use it where the item would otherwise be: in the list, on the page it'll appear on.

## Don't

- Don't use it for an error or a rejection; say what went wrong instead.
- Don't rely on it to hold anything back. It's a picture and words; what's published is your server's decision.

## Example

```html
<tc-released></tc-released>

<script type="module">
  import "trenchcoat/released";
  import "trenchcoat/tokens.css";
</script>
```

```tsx
import { Released } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function State() {
  return <Released />;
}
```
