---
pattern: none
status: new
related: success, in-progress, upload-failed, something-wrong
---

## Overview

A document with a cross on it, for something that didn't work – a job, an import, a sync or a check. On the badge, the cross draws itself as the badge gives one small shake, then it rests. It's one of the document-status illustrations beside `released`, `processing`, `awaiting-review` and `upload-failed`, drawn the same way so a list of items reads at a glance.

## When to use

- A job, an import or a check that stopped and won't finish without someone acting.
- Beside the reason it failed and what to do next – Retry, Fix or Contact support.

## When not to use

- An upload that couldn't go up – use `upload-failed`.
- A page or request that couldn't load – use `something-wrong`.

## Anatomy

1. **Page** `.ui-fai-page` – the document, with its folded corner `.ui-fai-fold`
2. **Mark** `.ui-fai-badge` – the round badge, with the cross drawn on it in ink
3. **Words** `.ui-fai-caption` – where it stands; the default is Failed

## Looks

One look. Colours follow the page theme through `light-dark()`, with a `.dark` class, `data-theme`, `data-tc-theme` or
the system setting. It has no background of its own, so it takes on whatever it sits on.

## Keyboard

Nothing to operate. The illustration takes no focus.

## Screen readers

The host is `role="img"`, named by `label` or else by `caption`, so where the item stands is announced. With `caption=""` and no
`label` it's decorative and skipped, for when the words beside it say the same.

## Content

Put what happened, and what to do next, beside it: "The import stopped at row 412: the date column couldn't be read."

## Do

- Use the document-status illustrations together, so the same item reads the same way as it moves along.
- Keep the words short; change `caption` to fit your product's own name for the stage.

## Don't

- Don't use it as the only sign of a problem – say what's wrong in words beside it.
- Don't make it bigger than the content it explains.

## Example

```html
<tc-failed></tc-failed>

<script type="module">
  import "@adamstavely/trenchcoat/failed";
  import "@adamstavely/trenchcoat/tokens.css";
</script>
```

```tsx
import { Failed } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function State() {
  return <Failed />;
}
```
