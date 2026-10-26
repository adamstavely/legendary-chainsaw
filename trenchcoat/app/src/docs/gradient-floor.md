---
pattern: none
status: stable
related: grid-background, gradient-text, text-reveal
---

## Overview

A soft, blurred band of colour that glows up from the bottom edge of a section. It gives a hero or a launch panel
warmth and depth without an image: a colour layer and a white layer above it rise and fall against each other while
both drift sideways, then slow down and rest after five seconds. Your content goes inside it and sits above the
glow. It scales with the width of its container, so the same floor works in a narrow card and a full-width hero.

## When to use

- Behind the headline and call to action of a landing, launch or welcome section.
- The bottom of an announcement or “what's new” panel, to give it some lift.
- Where the product's look is soft and colourful rather than technical.

## When not to use

- Behind dense content – tables, forms, long text – where the colour fights what people read. Use a plain surface.
- For a structured, technical texture – use `grid-background`.
- To draw attention to one phrase – use `gradient-text` or `text-reveal`.

## Anatomy

1. **Colour layer** `.ui-gf-layer--color` – the blurred gradient shape, from `colors[0]` at the crest down
2. **Light layer** `.ui-gf-layer--light` – the white shape on top that lightens it where they overlap
3. **Content** `.ui-gf-content` – your children, above the floor (with the element: every child)

## Keyboard

Nothing to operate – the floor is decoration and takes no focus. The content inside keeps its own keyboard
behaviour.

## Screen readers

Both layers are `aria-hidden="true"`, so screen readers skip the floor and read only your content.

## Do

- Give the container a height – the floor is anchored to its bottom edge and fills the width.
- Keep the text near the top, where the background stays light (`--tc-gradient-floor-bg`), and check its contrast.
- Leave `playFor` at its default: the motion stops after five seconds, as WCAG 2.2.2 asks. It also stays still with
  reduced motion and pauses off screen.

## Don't

- Don't set `playFor` to `Infinity` without giving people a way to pause it.
- Don't pick three colours of the same lightness – the crest, middle and bottom read best as a clear progression.
- Don't stack it under another moving background.

## Example

```html
<tc-gradient-floor id="hero" style="height: 320px">
  <div class="hero">
    <h1>Agents that ship.</h1>
    <a href="/start">Get started</a>
  </div>
</tc-gradient-floor>

<script type="module">
  import "trenchcoat/gradient-floor";
  import "trenchcoat/tokens.css";

  const floor = document.querySelector("#hero");
  floor.colors = ["#FF7700", "#FF0055", "#0073FF"];
  floor.playFor = 8;
</script>
```

```tsx
import { GradientFloor } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Hero() {
  return (
    <GradientFloor colors={["#22c55e", "#06b6d4", "#6366f1"]} speed={4} style={{ height: 320 }}>
      <h1>Agents that ship.</h1>
      <a href="/start">Get started</a>
    </GradientFloor>
  );
}
```
