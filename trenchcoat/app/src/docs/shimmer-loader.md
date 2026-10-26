---
pattern: none
status: stable
related: thinking-loader, thinking-state, text-reveal, blur-crossfade
---

## Overview

Two loading states with a soft sweep of light. `tc-skeleton` draws placeholder blocks in the shape of the content
that's on its way – an avatar, a line of text, an image – so the layout doesn't jump when it arrives.
`tc-shimmer-text` runs a brighter band through the letters of a short label, for an AI “Thinking…” state; the label
stays readable the whole time. The sweeps run three passes and then rest, hold while off screen, and turn into
plain blocks and plain text with reduced motion.

## When to use

- Loading a card, a list or a profile whose shape you know – skeleton blocks in the same layout.
- A one-word status while a model works: “Thinking…”, “Searching…”.
- Waits of a second or more; shorter ones are better with nothing at all.

## When not to use

- Showing the model's reasoning or steps while it works – use `thinking-state`.
- An animated “the model is working” mark without text – use `thinking-loader`.
- Swapping one piece of content for another once it's loaded – use `blur-crossfade`.

## Anatomy

1. **Skeleton** `tc-skeleton` – a placeholder block; `circle` makes it round for avatars
2. **Shimmer text** `tc-shimmer-text` – a label with a brighter band sliding through its letters

## Screen readers

Skeletons are hidden from assistive technology (`aria-hidden="true"`) unless the page sets `aria-hidden` itself –
announce the loading state once, elsewhere on the page. Shimmer text reads as its label, once: the brighter copy in
the band is hidden.

## Content

- Keep shimmer text to one or two words with an ellipsis: “Thinking…”, “Writing…”.
- Size skeletons like the content they stand for – a short line for a name, a wider one for a title.

## Do

- Match the real layout: the same gaps, the same avatar size, the last line of a paragraph shorter.
- Replace the skeletons with the content as soon as it arrives, in one go.
- Set `--tc-shimmer-loader-passes` to `infinite` only when you give people a way to pause it.

## Don't

- Don't skeleton a whole page for a wait of a few hundred milliseconds.
- Don't use shimmer text for anything people must read to act – it's a status, not a message.

## Example

```html
<tc-skeleton circle width="40"></tc-skeleton>
<tc-skeleton width="45%" height="12"></tc-skeleton>
<tc-shimmer-text id="status" text="Thinking…"></tc-shimmer-text>

<script type="module">
  import "trenchcoat/shimmer-loader";

  document.querySelector("#status").duration = 2;
</script>
```

```tsx
import { ShimmerText, Skeleton } from "trenchcoat/react";

export function LoadingProfile() {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <Skeleton circle width={40} />
      <Skeleton width="45%" height={12} />
      <Skeleton width="30%" height={10} />
      <ShimmerText>Thinking…</ShimmerText>
    </div>
  );
}
```
