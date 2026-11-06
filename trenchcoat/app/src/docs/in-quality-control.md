---
pattern: none
status: new
related: awaiting-review, in-translation, in-coordination, pending-release, released
---

## Overview

A document with a magnifying glass over a check on it, for content being checked before it moves on, with the words In quality control. It's one of the workflow stages beside `awaiting-review` – in translation, in
quality control, in coordination, pending release and released – so people can see where an item stands and that it's
on its way, not lost. On the badge, a magnifying glass over a check mark, sweeping across a few times, then it rests.

## When to use

- Content that a second person checks for accuracy, format or standards.
- A deliverable that passed review and is in its final checks.

## When not to use

- Content waiting for someone to approve it – use `awaiting-review`.
- A search or filter with no matches – use `nothing-found`.

## Anatomy

1. **Page** `.ui-iqc-page` – the document
2. **Mark** `.ui-iqc-badge` – the round badge, with the stage drawn on it in ink
3. **Words** `.ui-iqc-caption` – where it stands; the default is In quality control

## Looks

One look. Colours follow the page theme through `light-dark()`, with a `.dark` class, `data-theme`, `data-tc-theme` or
the system setting. It has no background of its own, so it takes on whatever it sits on.

## Keyboard

Nothing to operate. The illustration takes no focus.

## Screen readers

The host is `role="img"`, named by `label` or else by `caption`, so the stage is announced. With `caption=""` and no
`label` it's decorative and skipped, for when the words beside it say the same.

## Content

Say what's being checked and by whom: "A second analyst checks the figures". If it can fail, say what happens then.

## Do

- Use the stages together, so the same item reads the same way as it moves along.
- Use it where the item would otherwise be: in the list, on the page it'll appear on.

## Don't

- Don't use it for an error or a rejection; say what went wrong instead.
- Don't rely on it to hold anything back. It's a picture and words; what's published is your server's decision.

## Example

```html
<tc-in-quality-control></tc-in-quality-control>

<script type="module">
  import "trenchcoat/in-quality-control";
  import "trenchcoat/tokens.css";
</script>
```

```tsx
import { InQualityControl } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function State() {
  return <InQualityControl />;
}
```
