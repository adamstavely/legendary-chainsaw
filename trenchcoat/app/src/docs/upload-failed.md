---
pattern: none
status: new
related: something-wrong, malware-blocked, multimodal-input, knowledge-source-manager
---

## Overview

A file lifted above an open tray, its upload arrow stopping short, with a red cross badge and the words Upload failed.
It stands where an upload would have shown – a drop zone, an attachment list – so people see that the file didn't
arrive, and the words beside it say why.

## When to use

- A file that's too large, of a type that isn't accepted, or whose upload stopped part way.
- A batch where some files arrived and this one didn't.

## When not to use

- A file that arrived but was flagged as unsafe – use `malware-blocked`.
- A page or request that failed for another reason – use `something-wrong`.
- A file that arrived but can't be previewed – say so in the file's own view.

## Anatomy

1. **Tray** `.ui-upf-slot` – where the file was going
2. **File** `.ui-upf-file` – the file, lifted, with its upload arrow and the cross badge
3. **Words** `.ui-upf-caption` – what's happened; the default is Upload failed

## Looks

One look. Colours follow the page theme through `light-dark()`, with a `.dark` class, `data-theme`, `data-tc-theme` or
the system setting. It has no background of its own, so it takes on whatever it sits on.

## Keyboard

Nothing to operate. The illustration takes no focus.

## Screen readers

The host is `role="img"`, named by `label` or else by `caption`, so the message is announced. With `caption=""` and no
`label` it's decorative and skipped, for when the words beside it say the same.

## Content

Say why beside it, and what to do: "field-survey.csv is 214 MB, over the 100 MB limit. Split it and try again." Name the
file, give the limit it broke, and offer Try again when the problem was the connection.

## Do

- Keep the file people chose, so trying again doesn't mean choosing it again.
- Put Try again or Choose another file right under it.

## Don't

- Don't show it for a file that's still uploading – show its progress.
- Don't blame people: "isn't accepted" rather than "you uploaded the wrong type".

## Example

```html
<tc-upload-failed></tc-upload-failed>

<script type="module">
  import "@adamstavely/trenchcoat/upload-failed";
  import "@adamstavely/trenchcoat/tokens.css";
</script>
```

```tsx
import { UploadFailed } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function State() {
  return <UploadFailed />;
}
```
