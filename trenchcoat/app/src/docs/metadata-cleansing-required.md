---
pattern: none
status: new
related: import-review, in-progress, failed, success
---

## Overview

A document with a tag on it and a few specks beside it, for records whose metadata needs tidying – missing fields, inconsistent names or duplicates – before they can move to the next stage. On the badge, the specks beside it twinkle twice, then rest. It's one of the document-status illustrations beside `released`, `processing`, `awaiting-review` and `upload-failed`, drawn the same way so a list of items reads at a glance.

## When to use

- Records held back until their metadata is complete and consistent.
- Beside what needs fixing and a way to start – Review fields, Fix all.

## When not to use

- Records that failed outright – use `failed`.
- An import whose rows need checking cell by cell – use `import-review`.

## Anatomy

1. **Page** `.ui-mcr-page` – the document, with its folded corner `.ui-mcr-fold`
2. **Mark** `.ui-mcr-badge` – the round badge, with the tag drawn on it in ink
3. **Words** `.ui-mcr-caption` – where it stands; the default is Metadata cleansing required

## Looks

One look. Colours follow the page theme through `light-dark()`, with a `.dark` class, `data-theme`, `data-tc-theme` or
the system setting. It has no background of its own, so it takes on whatever it sits on.

## Keyboard

Nothing to operate. The illustration takes no focus.

## Screen readers

The host is `role="img"`, named by `label` or else by `caption`, so where the item stands is announced. With `caption=""` and no
`label` it's decorative and skipped, for when the words beside it say the same.

## Content

Put what happened, and what to do next, beside it: "38 records are missing a publisher or a date; fix them to release the batch."

## Do

- Use the document-status illustrations together, so the same item reads the same way as it moves along.
- Keep the words short; change `caption` to fit your product's own name for the stage.

## Don't

- Don't use it as the only sign of a problem – say what's wrong in words beside it.
- Don't make it bigger than the content it explains.

## Example

```html
<tc-metadata-cleansing-required></tc-metadata-cleansing-required>

<script type="module">
  import "@adamstavely/trenchcoat/metadata-cleansing-required";
  import "@adamstavely/trenchcoat/tokens.css";
</script>
```

```tsx
import { MetadataCleansingRequired } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function State() {
  return <MetadataCleansingRequired />;
}
```
