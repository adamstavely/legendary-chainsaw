---
pattern: none
status: new
related: awaiting-review, in-translation, in-quality-control, pending-release, released
---

## Overview

A document with three linked points on it, for work being agreed between teams before it goes ahead, with the words In coordination. It's one of the workflow stages beside `awaiting-review` – in translation, in
quality control, in coordination, pending release and released – so people can see where an item stands and that it's
on its way, not lost. On the badge, three linked nodes that light up in turn, then it rests.

## When to use

- Work that waits on several teams or partners agreeing.
- A change that needs sign-off from more than one group before it's scheduled.

## When not to use

- Content waiting for one reviewer – use `awaiting-review`.
- Inviting people to a team – use `team-invite`.

## Anatomy

1. **Page** `.ui-icn-page` – the document
2. **Mark** `.ui-icn-badge` – the round badge, with the stage drawn on it in ink
3. **Words** `.ui-icn-caption` – where it stands; the default is In coordination

## Looks

One look. Colours follow the page theme through `light-dark()`, with a `.dark` class, `data-theme`, `data-tc-theme` or
the system setting. It has no background of its own, so it takes on whatever it sits on.

## Keyboard

Nothing to operate. The illustration takes no focus.

## Screen readers

The host is `role="img"`, named by `label` or else by `caption`, so the stage is announced. With `caption=""` and no
`label` it's decorative and skipped, for when the words beside it say the same.

## Content

Say who's involved and what they're agreeing: "The three partner labs are agreeing dates". Name a contact if people may ask.

## Do

- Use the stages together, so the same item reads the same way as it moves along.
- Use it where the item would otherwise be: in the list, on the page it'll appear on.

## Don't

- Don't use it for an error or a rejection; say what went wrong instead.
- Don't rely on it to hold anything back. It's a picture and words; what's published is your server's decision.

## Example

```html
<tc-in-coordination></tc-in-coordination>

<script type="module">
  import "@adamstavely/trenchcoat/in-coordination";
  import "@adamstavely/trenchcoat/tokens.css";
</script>
```

```tsx
import { InCoordination } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function State() {
  return <InCoordination />;
}
```
