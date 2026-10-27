---
pattern: none
status: stable
related: text-reveal, number-ticker, shimmer-loader
---

## Overview

Swaps one piece of content for another with a soft blur, while the box glides to the size of what comes next. The
old content blurs and fades out as the new one blurs in, so a status, a card or a button label changes without a
jump in the layout. If keyboard focus was inside the old content, it moves to the first control of the new content,
so it never drops to the page. For people who ask for reduced motion, the content changes at once.

## When to use

- A status that changes in place – “Saved”, “Uploading 3 files”, “Sync paused” – where each state has a different size.
- Button labels or small cards that change after an action and shouldn't make the page jump.
- Steps in a small flow where the container should follow its content's height.

## When not to use

- Revealing a heading or a sentence as it first appears – use `text-reveal`.
- A number that counts up or down to a new value – use `number-ticker`.
- A placeholder while content loads – use `shimmer-loader`.

## Keyboard

Nothing to operate. When a swap removes the element that had focus, focus moves to the first focusable element in the
new content, or to the new content itself.

## Screen readers

Only the new content is read: the copy of the old content that fades out is `aria-hidden` and inert. The swap isn't
announced – if the change matters, say it in a live region of your own.

## Do

- Change `swapKey` (React: `id`) only when the content means something different; typing into the content needs no swap.
- Use `morph="both"` for content whose width changes too, like cards of different widths; the default glides the height.
- Use `as="span"` in React when the crossfade sits inside a button or a line of text.

## Don't

- Don't swap content on a timer faster than people can read it – and when it changes on its own, give people a way to pause it, as the demo does.
- Don't put the whole page in it; it's for one piece of content.

## Example

```html
<tc-blur-crossfade id="status" swap-key="saved" morph="both"><div>Saved</div></tc-blur-crossfade>

<script type="module">
  import "trenchcoat/blur-crossfade";
  import "trenchcoat/tokens.css";

  const box = document.querySelector("#status");
  const next = document.createElement("div");
  next.textContent = "Uploading 3 files";
  // Put the new content in, then change the key
  box.querySelector("div").replaceWith(next);
  box.swapKey = "uploading";
</script>
```

```tsx
import { BlurCrossfade } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function SyncStatus({ state }: { state: "saved" | "uploading" | "paused" }) {
  return (
    <BlurCrossfade id={state} morph="both">
      {state === "saved" ? <strong>Saved</strong> : state === "uploading" ? <strong>Uploading 3 files</strong> : <strong>Sync paused</strong>}
    </BlurCrossfade>
  );
}
```
