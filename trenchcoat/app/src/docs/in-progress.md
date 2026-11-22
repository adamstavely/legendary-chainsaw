---
pattern: none
status: new
related: processing, success, failed, awaiting-review
---

## Overview

A document with three dots on it, for work that has started and isn't finished – a case being worked, a review under way, a batch partly done. On the badge, the three dots pulse one after another a few times, then rest. It's one of the document-status illustrations beside `released`, `processing`, `awaiting-review` and `upload-failed`, drawn the same way so a list of items reads at a glance.

## When to use

- An item someone or something is working on now, with no progress to show as a number.
- A stage between Not started and Success or Failed.

## When not to use

- A long job with progress you can measure – use `processing`.
- Content waiting for someone to approve it – use `awaiting-review`.

## Anatomy

1. **Page** `.ui-inp-page` – the document, with its folded corner `.ui-inp-fold`
2. **Mark** `.ui-inp-badge` – the round badge, with the three dots drawn on it in ink
3. **Words** `.ui-inp-caption` – where it stands; the default is In progress

## Looks

One look. Colours follow the page theme through `light-dark()`, with a `.dark` class, `data-theme`, `data-tc-theme` or
the system setting. It has no background of its own, so it takes on whatever it sits on.

## Keyboard

Nothing to operate. The illustration takes no focus.

## Screen readers

The host is `role="img"`, named by `label` or else by `caption`, so where the item stands is announced. With `caption=""` and no
`label` it's decorative and skipped, for when the words beside it say the same.

## Content

Put what happened, and what to do next, beside it: "Priya is reviewing the case; she picked it up 20 minutes ago."

## Do

- Use the document-status illustrations together, so the same item reads the same way as it moves along.
- Keep the words short; change `caption` to fit your product's own name for the stage.

## Don't

- Don't use it as the only sign of a problem – say what's wrong in words beside it.
- Don't make it bigger than the content it explains.

## Example

```html
<tc-in-progress></tc-in-progress>

<script type="module">
  import "@adamstavely/trenchcoat/in-progress";
  import "@adamstavely/trenchcoat/tokens.css";
</script>
```

```tsx
import { InProgress } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function State() {
  return <InProgress />;
}
```
