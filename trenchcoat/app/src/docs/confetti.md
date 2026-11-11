---
pattern: none
status: new
related: success-check, attention-pulse, status-morph, number-ticker
---

## Overview

A celebration for a finished milestone. Wrap what it celebrates, such as a Close review button, and call `fire()`, change `fire-key`, or set `trigger="click"`: paper bursts up out of the content, flutters and falls, and is gone. Bare, or with `origin="viewport-top"`, it rains from the top of the viewport. It never fires when first shown. The pieces are drawn on one canvas over the page that only exists while something is falling, and their colours are the chart tokens, so they follow the theme. With reduced motion there's no paper: the content holds a brief success tint instead, and `announce` is still said.

## When to use

- The end of something people worked towards: all checks passed, a review closed, a long import finished.
- Once per milestone, right after the person's own action.

## When not to use

- Routine saves and small confirmations – use Success Check.
- Drawing the eye to something new – use Attention Pulse.
- Anything that went wrong or needs a decision.

## Anatomy

1. **Host** `[data-ui="cft"]` – wraps the content; holds the reduced-motion tint
2. **Canvas** `.ui-cft__canvas` – over the whole viewport while pieces fall, in the top layer where the Popover API exists; never takes the pointer
3. **Status** `.ui-cft__status` – a visually hidden polite live region for `announce`

## Looks

No look of its own. The pieces use `--tc-chart-1` to `--tc-chart-6` and `--tc-status-success-fg`, or the `colors` you pass (any CSS colour, `var(--token)` included). A page can set `--tc-confetti-tint`, `--tc-confetti-ring` and `--tc-confetti-radius` for the reduced-motion tint.

## Keyboard

Nothing of its own to operate. With `trigger="click"`, the wrapped button fires it from the keyboard as it does from the pointer.

## Screen readers

The canvas is hidden from assistive technology. Set `announce` to say what happened ("Review closed"); it's read once per burst, also with reduced motion.

## Content

`count` sets the pieces per burst (80 by default, at most 300), `spread` the cone's width in degrees, and `seed` the pattern – each burst uses the next seed, so a page that sets one falls the same way every time. `origin` is `self`, `viewport-top` or `x,y` in viewport pixels; `fire({ count, spread, origin, colors, seed })` overrides them for one burst. `tc-confetti-done` fires when the last piece has settled and the canvas is gone.

## Do

- Keep it for real milestones, so it still means something.
- Say what happened in words as well, with `announce` or on the page.

## Don't

- Don't fire it on page load or on a timer.
- Don't fire it for every row in a list – one burst for the whole job.

## Example

```html
<tc-confetti trigger="click" announce="Review closed"><button type="button">Close review</button></tc-confetti>

<script type="module">
  import "@adamstavely/trenchcoat/confetti";
  import "@adamstavely/trenchcoat/tokens.css";
</script>
```

```tsx
import { useRef } from "react";
import { Confetti } from "@adamstavely/trenchcoat/react";
import type { TcConfetti } from "@adamstavely/trenchcoat/confetti";

export function Reconciled({ onClose }: { onClose: () => void }) {
  const confetti = useRef<TcConfetti>(null);
  return (
    <Confetti ref={confetti} announce="Review closed">
      <button type="button" onClick={() => { onClose(); confetti.current?.fire(); }}>Close review</button>
    </Confetti>
  );
}
```
