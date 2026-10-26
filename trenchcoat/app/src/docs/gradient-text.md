---
pattern: none
status: stable
related: text-reveal, number-ticker, gradient-floor, shimmer-loader
---

## Overview

A word or short line whose letters are cut from a liquid gradient: a few soft colour blobs drift over a two-colour
base while the glyphs stay crisp. The first time the text scrolls into view, the colour sweeps across it from left to
right; the flow then runs for five seconds and comes to rest. It takes its font, size and weight from where it sits,
so it drops into a heading or a sentence without its own type styles.

## When to use

- One or two words a hero or empty state should draw the eye to: “Ship faster”, “liquid color”.
- A product name or the key phrase of a heading, set in large display type.

## When not to use

- Text that arrives as it's written or revealed word by word – use `text-reveal`.
- A number that changes – use `number-ticker`.
- A glow behind content rather than in the letters – use `gradient-floor`.
- Text standing in for content that is still loading – use `shimmer-loader`.

## Screen readers

Screen readers read the plain text once; the gradient copy over it is hidden. With `as="h1"` or `as="h2"` the element
is a heading of that level. Reduced motion shows the finished gradient with no sweep or flow.

## Content

- Keep it to a few words – a whole paragraph of moving colour is hard to read.
- The default colours keep 3:1 for large display text; for body-size text pass `colors` with 4.5:1 against the
  background.
- If you set `playFor` to `Infinity`, give people a way to pause it.

## Example

```html
<h1 style="font-size: 56px; font-weight: 800">
  <tc-gradient-text id="hero" text="Ship faster"></tc-gradient-text>
</h1>

<script type="module">
  import "trenchcoat/gradient-text";
  import "trenchcoat/tokens.css";

  const word = document.querySelector("#hero");
  word.colors = ["#7c3aed", "#db2777", "#f59e0b", "#06b6d4"];
  word.speed = 6;
</script>
```

```tsx
import { GradientText } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Hero() {
  return (
    <div style={{ fontSize: 56, fontWeight: 800 }}>
      <GradientText as="h1">Ship faster</GradientText>
    </div>
  );
}
```
