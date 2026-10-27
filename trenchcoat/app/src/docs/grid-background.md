---
pattern: none
status: stable
related: gradient-floor, gradient-text, text-reveal
---

## Overview

A fine line grid behind a hero section or an empty state. It gives a large, bare area some texture without
competing with the words on it: the lines are faint, they fade out towards the edges, and they drift by one cell at
a time for a few seconds before they rest. On first view a circle grows from the centre to uncover the grid. Your
content goes inside it and sits above the lines.

## When to use

- Behind the headline and call to action of a landing or welcome section.
- Behind an empty state that would otherwise be a large blank panel.
- Where the product's look is technical or structured and a grid fits it.

## When not to use

- Behind dense content – tables, forms, long text – where the lines cut through what people read. If the section
  needs a backdrop at all, use `gradient-floor`, which colours only its floor.
- To draw attention to one phrase – use `gradient-text` or `text-reveal`.

## Keyboard

Nothing to operate – the grid is decoration and takes no focus. The content you put inside keeps its own keyboard
behaviour.

## Screen readers

The grid is `aria-hidden="true"`, so screen readers skip it and read only your content.

## Do

- Keep the content short and centred, where the fade leaves the grid most visible.
- Match `size` to the spacing of what's on top – 40 or 48 px cells suit most hero sections.
- Leave `playFor` at its default: the drift stops after five seconds, as WCAG 2.2.2 asks.

## Don't

- Don't set `playFor` to `Infinity` without giving people a way to pause the drift.
- Don't darken the lines with `color` until they compete with the text – they should read as texture.
- Don't nest it inside another moving background.

## Example

```html
<tc-grid-background id="hero" size="40" direction="up">
  <div class="hero">
    <h1>Build on a solid grid</h1>
    <a href="/start">Get started</a>
  </div>
</tc-grid-background>

<script type="module">
  import "trenchcoat/grid-background";
  import "trenchcoat/tokens.css";

  const grid = document.querySelector("#hero");
  grid.fade = 60;
  grid.playFor = 8;
</script>
```

```tsx
import { GridBackground } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Hero() {
  return (
    <GridBackground size={40} direction="up" fade={60}>
      <div className="hero">
        <h1>Build on a solid grid</h1>
        <a href="/start">Get started</a>
      </div>
    </GridBackground>
  );
}
```
