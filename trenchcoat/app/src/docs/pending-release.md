---
pattern: none
status: new
related: awaiting-review, in-translation, in-quality-control, in-coordination, released
---

## Overview

A document with an arrow ready to go up on it, for content approved and waiting for its release, with the words Pending release. It's one of the workflow stages beside `awaiting-review` – in translation, in
quality control, in coordination, pending release and released – so people can see where an item stands and that it's
on its way, not lost. On the badge, an upward arrow above a dashed launch line, lifting a little a few times, then it rests.

## When to use

- Content that's approved and scheduled, but not public yet.
- A change merged and waiting for the next release window.

## When not to use

- Content still waiting for approval – use `awaiting-review`.
- Content that's already out – use `released`.

## Anatomy

1. **Page** `.ui-pnr-page` – the document
2. **Mark** `.ui-pnr-badge` – the round badge, with the stage drawn on it in ink
3. **Words** `.ui-pnr-caption` – where it stands; the default is Pending release

## Looks

One look. Colours follow the page theme through `light-dark()`, with a `.dark` class, `data-theme`, `data-tc-theme` or
the system setting. It has no background of its own, so it takes on whatever it sits on.

## Keyboard

Nothing to operate. The illustration takes no focus.

## Screen readers

The host is `role="img"`, named by `label` or else by `caption`, so the stage is announced. With `caption=""` and no
`label` it's decorative and skipped, for when the words beside it say the same.

## Content

Give the date if you have one: "Goes out with Thursday's release". Say whether it can still be changed.

## Do

- Use the stages together, so the same item reads the same way as it moves along.
- Use it where the item would otherwise be: in the list, on the page it'll appear on.

## Don't

- Don't use it for an error or a rejection; say what went wrong instead.
- Don't rely on it to hold anything back. It's a picture and words; what's published is your server's decision.

## Example

```html
<tc-pending-release></tc-pending-release>

<script type="module">
  import "@adamstavely/trenchcoat/pending-release";
  import "@adamstavely/trenchcoat/tokens.css";
</script>
```

```tsx
import { PendingRelease } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function State() {
  return <PendingRelease />;
}
```
