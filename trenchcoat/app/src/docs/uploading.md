---
pattern: none
status: new
related: downloading, upload-failed, processing, awaiting-review, released
---

## Overview

A document with a round badge showing an arrow rising out of a tray, for a file on its way up, with the words
Uploading. It's the in-progress sibling of `upload-failed` – the same upward arrow, here making it – and it's drawn like
the workflow stages beside `awaiting-review`, so an upload reads the same way as work moving along. On the badge, the
arrow rises out of the tray a few times, then it rests.

## When to use

- A file or a batch of files going up, where the wait is long enough to need saying: "Your scanned receipts are
  uploading".
- A panel that will show the file once it's up, while it isn't yet.

## When not to use

- The upload didn't finish – use `upload-failed`.
- A file coming down to the person – use `downloading`.
- The file is up and being worked on – use `processing`.

## Anatomy

1. **Page** `.ui-upl-page` – the document
2. **Mark** `.ui-upl-badge` – the round badge, with the tray and the arrow drawn on it in ink
3. **Words** `.ui-upl-caption` – what's happening; the default is Uploading

## Looks

One look. Colours follow the page theme through `light-dark()`, with a `.dark` class, `data-theme`, `data-tc-theme` or
the system setting. It has no background of its own, so it takes on whatever it sits on.

## Keyboard

Nothing to operate. The illustration takes no focus.

## Screen readers

The host is `role="img"`, named by `label` or else by `caption`, so what's happening is announced. With `caption=""` and
no `label` it's decorative and skipped, for when the words beside it say the same.

## Content

Say what's going up and whether the person can leave: "Keep this page open until it's done", or "You can close this –
we'll finish in the background".

## Do

- Pair it with real progress when you have it – a bar, a count of files or a percentage beside it.
- Swap it for `upload-failed` with the reason when an upload fails, so the two read as one story.

## Don't

- Don't leave it up after the upload finished or failed; it says something's still happening.
- Don't use it for a short upload inside a field – use a progress bar in the field.

## Example

```html
<tc-uploading></tc-uploading>

<script type="module">
  import "@adamstavely/trenchcoat/uploading";
  import "@adamstavely/trenchcoat/tokens.css";
</script>
```

```tsx
import { Uploading } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function State() {
  return <Uploading />;
}
```
