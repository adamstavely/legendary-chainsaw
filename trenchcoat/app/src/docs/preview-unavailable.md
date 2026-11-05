---
pattern: none
status: new
related: malware-blocked, no-access, content-hidden, file-details
---

## Overview

A file whose contents have faded to a dashed outline, a question mark on it, and the words Preview not available. It's for a file the viewer can't show – an unusual format, or one too large to render – that's still safe and allowed to open. It's drawn like the other state illustrations: a soft tile, one pastel mark, a soft glow beneath.

## When to use

- A file type the viewer has no preview for, such as a CAD drawing or a database file.
- A file too large to render in the page.

## When not to use

- A file that isn't safe to open – use `malware-blocked`.
- Someone without permission – use `no-access`.
- Content covered on purpose – use `content-hidden`.

## Anatomy

1. **Page** `.ui-pvu-page` – the file
2. **Outline** `.ui-pvu-ghost` – where its contents would show, faded to dashes
3. **Mark** `.ui-pvu-mark` – the question mark
4. **Words** `.ui-pvu-caption` – what's happened; the default is Preview not available

## Looks

One look. Colours follow the page theme through `light-dark()`, with a `.dark` class, `data-theme`, `data-tc-theme` or
the system setting. It has no background of its own, so it takes on whatever it sits on.

## Keyboard

Nothing to operate. The illustration takes no focus.

## Screen readers

The host is `role="img"`, named by `label` or else by `caption`, so the message is announced. With `caption=""` and no
`label` it's decorative and skipped, for when the words beside it say the same.

## Content

Say what the file is and what people can do instead: "sample-plate-14.cdx can't be shown here. Download it to open in ChemDraw." Name the app if you know it.

## Do

- Offer Download or Open in another app beside it.
- Show what you do know – the name, type, size and when it changed.

## Don't

- Don't make it look like an error: nothing has gone wrong.
- Don't use it for files that are blocked or forbidden – those need their own words.

## Example

```html
<tc-preview-unavailable></tc-preview-unavailable>

<script type="module">
  import "trenchcoat/preview-unavailable";
  import "trenchcoat/tokens.css";
</script>
```

```tsx
import { PreviewUnavailable } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function State() {
  return <PreviewUnavailable />;
}
```
