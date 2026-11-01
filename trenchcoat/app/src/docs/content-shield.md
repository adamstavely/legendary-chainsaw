---
pattern: button
status: new
related: content-hidden, malware-blocked, no-access, dialog
---

## Overview

Keeps content unloaded until someone chooses to see it. While it's shielded, the content isn't in the page at all, so it
can't be read, flash into view or use bandwidth. Hide removes it again. This isn't access control: only send restricted
content to people your server allows.

## When to use

- Images, video or messages flagged as objectionable.
- Evidence reviewers may need to see, but shouldn't see by surprise.

## When not to use

- A file that isn't safe to open – use `malware-blocked`.
- Someone without permission – use `no-access`.
- A picture on its own, on an overlay you build – use `content-hidden`.

## Anatomy

1. **Shield** `.ui-csh__shield` – shown while the content is hidden
2. **Picture** `.ui-csh__picture` – Content Hidden
3. **Reason** `.ui-csh__reason` – why it's hidden
4. **Show** `.ui-csh__reveal` – or `.ui-csh__unavailable` when it can't be revealed
5. **Content** `.ui-csh__content` – filled on reveal
6. **Hide** `.ui-csh__hide` – removes the content

## Looks

Standard puts a white card on the gray tray; Clean is one white card. A page can set `--tc-csh-picture`, the picture's
width.

## Keyboard

| Key | What it does |
|---|---|
| Enter / Space on Show | Reveals, and moves focus to the content's first control, or to Hide |
| Enter / Space on Hide | Removes the content, and moves focus back to Show |

## Screen readers

The picture is an image named by its caption, and the reason is plain text. `role="status"` announces when the content
is shown or hidden. Give the content its own names and alt text.

## Content

Keep `reason` factual: "Flagged as a graphic injury photo". Don't repeat the content. Name the button for the action,
such as "Show photo", with `reveal-label`.

## Do

- Supply content in a `<template>` child, or fill `container` from `tc-reveal`, so it isn't loaded early. In React, pass it as children: the wrapper only renders them once revealed.
- Set `revealable="false"` for people who may not see it.
- Check permission on the server when the content is requested.

## Don't

- Don't put plain content inside it outside a template: it would already be in the page.
- Don't treat it as access control. Anything sent to the browser can be read there.

## Example

```html
<tc-content-shield reason="Flagged as a graphic injury photo" reveal-label="Show photo">
  <template><img src="/incidents/42.jpg" alt="The injury described in the report" /></template>
</tc-content-shield>

<script type="module">
  import "trenchcoat/content-shield";
  import "trenchcoat/tokens.css";
</script>
```

```tsx
import { ContentShield } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Photo() {
  return (
    <ContentShield reason="Flagged as a graphic injury photo" revealLabel="Show photo">
      <img src="/incidents/42.jpg" alt="The injury described in the report" />
    </ContentShield>
  );
}
```
