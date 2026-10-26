---
pattern: none
status: stable
related: project-card, gradient-floor, blur-crossfade
---

## Overview

A wrapper that tilts its card in 3D towards the pointer, lifts it a little with a deeper shadow, and lays a soft
glare over it that follows the pointer. When the pointer leaves, the card springs back to rest. It makes one card
feel tangible – a plan, a membership, a featured item – without changing what's on it. Touch pointers don't tilt
it, keyboard focus inside it gives a slight lift instead, and with reduced motion only the shadow changes.

## When to use

- One featured card that should invite a closer look: a pricing plan, a membership or gift card, a hero tile.
- A small set of showcase cards on a landing or upgrade page.
- Cards whose content is mostly visual, where a little depth adds to it.

## When not to use

- Cards in a dense grid or list people scan and click through – the movement distracts; use `project-card` on
  its own.
- Cards holding forms or controls people type into – a surface that moves under the pointer is harder to use.
- Swapping one piece of content for another – use `blur-crossfade`.
- A glowing backdrop for a section rather than a card – use `gradient-floor`.

## Anatomy

1. **Content** `.ui-tlt-content` – your card's content, clipped to the rounded corners (the React wrapper's div)
2. **Shadow** `.ui-tlt-card` – the shadow layer behind the content, deeper while tilting

A glare layer (`.ui-tlt-glare`) lies over the content while the pointer is on it; it's off with reduced motion.

## Keyboard

Nothing to operate – the card itself takes no focus. When something inside it has keyboard focus, the card lifts
slightly so the focused card stands out.

## Screen readers

The shadow and glare layers are `aria-hidden="true"`; screen readers read only your content, which stays in the
order you wrote it.

## Do

- Give it element children – text alone can't take the transform. The React wrapper puts children in a div for
  you.
- Keep `maxTilt` around the default 10° – past about 15° the content gets hard to read.
- Turn `glare` off on light, busy artwork where the soft-light glare washes it out.

## Don't

- Don't tilt every card on a page – keep it for the one that matters.
- Don't rely on the tilt to say something – touch screens and reduced motion never show it.

## Example

```html
<tc-tilt-card id="plan" max-tilt="12">
  <div class="plan-card">
    <h3>Pro</h3>
    <p>$24 a month · unlimited agents</p>
  </div>
</tc-tilt-card>

<script type="module">
  import "trenchcoat/tilt-card";
  import "trenchcoat/tokens.css";

  const card = document.querySelector("#plan");
  card.perspective = 700;
  card.addEventListener("pointerenter", () => console.log("Looking at the Pro plan"));
</script>
```

```tsx
import { TiltCard } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function PlanCard() {
  return (
    <TiltCard maxTilt={12} glare perspective={700}>
      <div className="plan-card">
        <h3>Pro</h3>
        <p>$24 a month · unlimited agents</p>
      </div>
    </TiltCard>
  );
}
```
