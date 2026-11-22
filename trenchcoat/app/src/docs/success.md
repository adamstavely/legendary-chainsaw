---
pattern: none
status: new
related: failed, in-progress, released, processing
---

## Overview

A document with a check on it and a ring that pops out once, for something that finished without a problem – a job, an import, a check or a save. On the badge, the check draws itself once and a ring pops out from the badge, then it rests. It's one of the document-status illustrations beside `released`, `processing`, `awaiting-review` and `upload-failed`, drawn the same way so a list of items reads at a glance.

## When to use

- A job, an import, a sync or a check that finished and needs nothing more.
- The end of a flow, confirming it worked before people move on.

## When not to use

- Content that's now out and live – use `released`.
- An inbox or queue with nothing left – use `all-done`.

## Anatomy

1. **Page** `.ui-scs-page` – the document, with its folded corner `.ui-scs-fold`
2. **Mark** `.ui-scs-badge` – the round badge, with the check drawn on it in ink
3. **Words** `.ui-scs-caption` – where it stands; the default is Success

## Looks

One look. Colours follow the page theme through `light-dark()`, with a `.dark` class, `data-theme`, `data-tc-theme` or
the system setting. It has no background of its own, so it takes on whatever it sits on.

## Keyboard

Nothing to operate. The illustration takes no focus.

## Screen readers

The host is `role="img"`, named by `label` or else by `caption`, so where the item stands is announced. With `caption=""` and no
`label` it's decorative and skipped, for when the words beside it say the same.

## Content

Put what happened, and what to do next, beside it: "All 1,240 cases imported, with nothing to fix."

## Do

- Use the document-status illustrations together, so the same item reads the same way as it moves along.
- Keep the words short; change `caption` to fit your product's own name for the stage.

## Don't

- Don't use it as the only sign of a problem – say what's wrong in words beside it.
- Don't make it bigger than the content it explains.

## Example

```html
<tc-success></tc-success>

<script type="module">
  import "@adamstavely/trenchcoat/success";
  import "@adamstavely/trenchcoat/tokens.css";
</script>
```

```tsx
import { Success } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function State() {
  return <Success />;
}
```
