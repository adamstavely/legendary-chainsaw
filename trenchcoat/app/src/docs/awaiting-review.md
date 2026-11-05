---
pattern: none
status: new
related: content-hidden, all-done, no-access, malware-blocked
---

## Overview

A document with an hourglass on it, with the words Awaiting review. It's for content that's been sent in and is held until someone approves it – a post, a summary, a change – so people know it's on its way, not lost. It's the calm counterpart to `content-hidden`.

## When to use

- Content that waits for a moderator or editor before others can see it.
- A submission whose author should know it arrived and what happens next.

## When not to use

- Content covered because it's sensitive – use `content-hidden`.
- Someone without permission to see it – use `no-access`.
- A queue with nothing in it – use `all-done`.

## Anatomy

1. **Page** `.ui-awr-page` – the document waiting
2. **Mark** `.ui-awr-badge` – the round badge, with the hourglass `.ui-awr-glass` on it
3. **Words** `.ui-awr-caption` – what's happening; the default is Awaiting review

## Looks

One look. Colours follow the page theme through `light-dark()`, with a `.dark` class, `data-theme`, `data-tc-theme` or
the system setting. It has no background of its own, so it takes on whatever it sits on.

## Keyboard

Nothing to operate. The illustration takes no focus.

## Screen readers

The host is `role="img"`, named by `label` or else by `caption`, so the message is announced. With `caption=""` and no
`label` it's decorative and skipped, for when the words beside it say the same.

## Content

Say beside it who reviews and roughly how long it takes: "An editor checks new summaries, usually within a day". Say
what happens next – a notification, the item going live – so people don't send it twice.

## Do

- Give a time if you have one, and a way to see or withdraw what was sent.
- Use it where the item would otherwise be: in the list, on the page it'll appear on.

## Don't

- Don't use it for an error or a rejection; say what went wrong instead.
- Don't rely on it to hold anything back. It's a picture and words, and what's published is your server's decision.

## Example

```html
<tc-awaiting-review></tc-awaiting-review>

<script type="module">
  import "trenchcoat/awaiting-review";
  import "trenchcoat/tokens.css";
</script>
```

```tsx
import { AwaitingReview } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function State() {
  return <AwaitingReview />;
}
```
