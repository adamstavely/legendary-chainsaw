---
pattern: none
status: new
related: nothing-found, no-access, malware-blocked, dialog
---

## Overview

A blurred picture behind a crossed-out eye, with the words Content hidden. It's made to sit on an overlay that covers objectionable content, so people choose whether to see it and aren't shown it by surprise.

## When to use

- Covering an image, video or message that's been flagged as objectionable.
- Evidence that reviewers may need to see, but shouldn't see without choosing to.

## When not to use

- A file that isn't safe to open – use `malware-blocked`.
- Someone without permission – use `no-access`.
- Content that must not be shown at all: remove it, and say so in words.

## Anatomy

1. **Picture** `.ui-chd-card` – a stand-in, blurred, never the real content
2. **Mark** `.ui-chd-mark` – the crossed-out eye
3. **Words** `.ui-chd-caption` – what's happened; the default is Content hidden

## Looks

One look. Colours follow the page theme through `light-dark()`, with a `.dark` class, `data-theme`, `data-tc-theme` or
the system setting. It has no background of its own, so it takes on whatever it sits on.

## Keyboard

Nothing to operate. The illustration takes no focus.

## Screen readers

The host is `role="img"`, named by `label` or else by `caption`, so the message is announced. With `caption=""` and no
`label` it's decorative and skipped, for when the words beside it say the same.

## Content

Say why if you can, beside it: "Flagged as graphic violence". Keep the wording factual and avoid repeating the content. Offer a way to see it only to people who may, and only if your policy allows it.

## Do

- Don't load the content until someone chooses to see it. A blur or an overlay alone still sends it to the browser, where it can be read or flash into view.
- Put it on a solid or strongly blurred overlay, and give the overlay's Show button a clear name.
- Keep the hidden content out of tab order and the accessibility tree.

## Don't

- Don't rely on it to enforce anything. It's a picture and words, and who may see the content is your server's decision.

## Example

```html
<tc-content-hidden></tc-content-hidden>

<script type="module">
  import "trenchcoat/content-hidden";
  import "trenchcoat/tokens.css";
</script>
```

```tsx
import { ContentHidden } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function State() {
  return <ContentHidden />;
}
```
