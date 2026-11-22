---
pattern: none
status: new
related: success, released, bibliography
---

## Overview

A book with a bookmark and a check on it, for something that was saved to Readbook, the reading list. Set `caption` to name your own reading list. On the badge, the check draws itself once, then it rests. It's one of the document-status illustrations beside `released`, `processing`, `awaiting-review` and `upload-failed`, drawn the same way so a list of items reads at a glance.

## When to use

- Confirming an article, paper or document was saved to read later.
- In a toast or a small panel right after Save.

## When not to use

- Content that's published – use `released`.
- A general success – use `success`.

## Anatomy

1. **Book** `.ui-rdb-page` – the book, with its spine `.ui-rdb-fold` and bookmark `.ui-rdb-ribbon`
2. **Mark** `.ui-rdb-badge` – the round badge, with the check drawn on it in ink
3. **Words** `.ui-rdb-caption` – where it stands; the default is Added to Readbook

## Looks

One look. Colours follow the page theme through `light-dark()`, with a `.dark` class, `data-theme`, `data-tc-theme` or
the system setting. It has no background of its own, so it takes on whatever it sits on.

## Keyboard

Nothing to operate. The illustration takes no focus.

## Screen readers

The host is `role="img"`, named by `label` or else by `caption`, so where the item stands is announced. With `caption=""` and no
`label` it's decorative and skipped, for when the words beside it say the same.

## Content

Put what happened, and what to do next, beside it: "“Card testing at small merchants” is in your Readbook."

## Do

- Use the document-status illustrations together, so the same item reads the same way as it moves along.
- Keep the words short; change `caption` to fit your product's own name for the stage.

## Don't

- Don't use it as the only sign of a problem – say what's wrong in words beside it.
- Don't make it bigger than the content it explains.

## Example

```html
<tc-added-to-readbook></tc-added-to-readbook>

<script type="module">
  import "@adamstavely/trenchcoat/added-to-readbook";
  import "@adamstavely/trenchcoat/tokens.css";
</script>
```

```tsx
import { AddedToReadbook } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function State() {
  return <AddedToReadbook />;
}
```
