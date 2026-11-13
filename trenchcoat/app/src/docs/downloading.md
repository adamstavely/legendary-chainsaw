---
pattern: none
status: new
related: uploading, upload-failed, processing, pending-release, released
---

## Overview

A document with a round badge showing an arrow dropping into a tray, for a file or an export on its way to the person,
with the words Downloading. It's drawn like the workflow stages beside `awaiting-review` – in translation, in quality
control, in coordination, pending release and released – so a file being fetched reads the same way as work moving
along. On the badge, the arrow drops into the tray a few times, then it rests.

## When to use

- An export or report being prepared and sent to the person: "Your audit export is downloading".
- A file being fetched before it can be opened, where the wait is long enough to need saying.

## When not to use

- A file going up from the person – use `uploading`.
- Work being done on the server with nothing coming back yet – use `processing`.
- A short wait inside a button or a row – use a spinner or a progress bar; this is for a page or a panel.

## Anatomy

1. **Page** `.ui-dnl-page` – the document
2. **Mark** `.ui-dnl-badge` – the round badge, with the tray and the arrow drawn on it in ink
3. **Words** `.ui-dnl-caption` – what's happening; the default is Downloading

## Looks

One look. Colours follow the page theme through `light-dark()`, with a `.dark` class, `data-theme`, `data-tc-theme` or
the system setting. It has no background of its own, so it takes on whatever it sits on.

## Keyboard

Nothing to operate. The illustration takes no focus.

## Screen readers

The host is `role="img"`, named by `label` or else by `caption`, so what's happening is announced. With `caption=""` and
no `label` it's decorative and skipped, for when the words beside it say the same.

## Content

Say what's coming and where it'll land: "The quarterly audit export is on its way – it'll be in your downloads". Give a
size or a time when you know it.

## Do

- Pair it with real progress when you have it – a bar or a percentage beside it.
- Replace it with what came down, or with what went wrong, as soon as it's done.

## Don't

- Don't leave it up after the download finished or failed; it says something's still happening.
- Don't use it as a loading screen for a page; it's about a file.

## Example

```html
<tc-downloading></tc-downloading>

<script type="module">
  import "@adamstavely/trenchcoat/downloading";
  import "@adamstavely/trenchcoat/tokens.css";
</script>
```

```tsx
import { Downloading } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function State() {
  return <Downloading />;
}
```
