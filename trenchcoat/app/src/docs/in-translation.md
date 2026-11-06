---
pattern: none
status: new
related: awaiting-review, in-quality-control, in-coordination, pending-release, released
---

## Overview

A document with two speech bubbles on it, for content being translated into other languages, with the words In translation. It's one of the workflow stages beside `awaiting-review` – in translation, in
quality control, in coordination, pending release and released – so people can see where an item stands and that it's
on its way, not lost. On the badge, two speech bubbles, one in each language, that nod in turn, then it rests.

## When to use

- Content being translated, before the other languages are ready.
- A page whose versions in other languages are on their way.

## When not to use

- Content held for a reviewer's approval – use `awaiting-review`.
- A long export or background job – use `processing`.

## Anatomy

1. **Page** `.ui-itn-page` – the document
2. **Mark** `.ui-itn-badge` – the round badge, with the stage drawn on it in ink
3. **Words** `.ui-itn-caption` – where it stands; the default is In translation

## Looks

One look. Colours follow the page theme through `light-dark()`, with a `.dark` class, `data-theme`, `data-tc-theme` or
the system setting. It has no background of its own, so it takes on whatever it sits on.

## Keyboard

Nothing to operate. The illustration takes no focus.

## Screen readers

The host is `role="img"`, named by `label` or else by `caption`, so the stage is announced. With `caption=""` and no
`label` it's decorative and skipped, for when the words beside it say the same.

## Content

Say which languages and when: "French and German versions, usually within a week". Say whether the original is already live.

## Do

- Use the stages together, so the same item reads the same way as it moves along.
- Use it where the item would otherwise be: in the list, on the page it'll appear on.

## Don't

- Don't use it for an error or a rejection; say what went wrong instead.
- Don't rely on it to hold anything back. It's a picture and words; what's published is your server's decision.

## Example

```html
<tc-in-translation></tc-in-translation>

<script type="module">
  import "trenchcoat/in-translation";
  import "trenchcoat/tokens.css";
</script>
```

```tsx
import { InTranslation } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function State() {
  return <InTranslation />;
}
```
