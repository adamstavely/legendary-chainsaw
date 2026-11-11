---
pattern: none
status: new
related: status-morph, success-check, blur-crossfade, button
---

## Overview

One icon turning into the next – copy into a check, play into pause, menu into close. The old icon turns away, shrinks and blurs out as the new one turns in, in the same spot, so nothing around it moves. With `revert-after` it turns back on its own, like a copy button's check that goes back to the copy icon.

## When to use

- A button whose icon shows what just happened, such as copied or saved.
- A toggle whose icon shows its state, such as play and pause or open and closed.

## When not to use

- A status with a word beside it – use `status-morph`.
- A one-time tick for something finished – use `success-check`.
- Swapping text or larger content – use `blur-crossfade`.

## Anatomy

1. **Box** `[data-ui="iswp"]` – one cell holding every icon, sized to the largest
2. **Icon** `[data-state]` – your own icons; the one showing has `data-active`, and while they swap the old one has `data-leaving` and the new one `data-enter`

## Looks

No look of its own. The icons keep their colour and size. It follows `--tc-duration-moderate` and `--tc-ease-move`, and a page can override `--tc-iswp-turn` (90deg), `--tc-iswp-shrink` (0.5) and `--tc-iswp-blur` (4px). With reduced motion the icons simply crossfade.

## Keyboard

Nothing to operate. It takes no focus; the button or toggle around it does.

## Screen readers

The icons are hidden from screen readers – name the control around it in words. A toggle should say its state with `aria-pressed` or `aria-expanded`. With `announce`, each change reads the new icon's `data-label` politely, which suits a result like "Link copied" that has no other words on screen.

## Content

Give each icon a `data-state`, and a `data-label` when you use `announce`. Keep the icons the same size so the swap stays in place. The resting state is the first icon's, or `rest`.

## Do

- Use `revert-after` for a momentary result (1.5–2 seconds), so the control is ready again.
- Name the control in words as well, such as "Copy link".

## Don't

- Don't swap on hover. The movement is for something that happened.
- Don't put more than one meaning in a swap. Copied and failed need words.

## Example

```html
<button type="button">
  <tc-icon-swap state="copy" revert-after="1600" announce>
    <svg data-state="copy" data-label="Copy" viewBox="0 0 24 24" width="16" height="16"><rect x="8" y="8" width="14" height="14" rx="2" /></svg>
    <svg data-state="done" data-label="Link copied" viewBox="0 0 24 24" width="16" height="16"><path d="M20 6 9 17l-5-5" /></svg>
  </tc-icon-swap>
  Copy link
</button>

<script type="module">
  import "@adamstavely/trenchcoat/icon-swap";
  import "@adamstavely/trenchcoat/tokens.css";
  const swap = document.querySelector("tc-icon-swap");
  swap.closest("button").addEventListener("click", () => (swap.state = "done"));
</script>
```

```tsx
import { useState } from "react";
import { IconSwap } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function CopyLink({ url }: { url: string }) {
  const [state, setState] = useState("copy");
  return (
    <button type="button" onClick={() => void navigator.clipboard.writeText(url).then(() => setState("done"))}>
      <IconSwap state={state} onStateChange={setState} revertAfter={1600} announce>
        <svg data-state="copy" data-label="Copy" viewBox="0 0 24 24" width="16" height="16"><rect x="8" y="8" width="14" height="14" rx="2" /></svg>
        <svg data-state="done" data-label="Link copied" viewBox="0 0 24 24" width="16" height="16"><path d="M20 6 9 17l-5-5" /></svg>
      </IconSwap>
      Copy link
    </button>
  );
}
```
