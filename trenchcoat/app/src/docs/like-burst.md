---
pattern: button
status: new
related: reaction-bar, message-actions, success-check, number-ticker
---

## Overview

A toggle for liking, saving or starring. Pressing it on fills the icon with a spring, and a small ring and eight particles burst from it; pressing it off just empties the icon. An optional count beside it rolls up or down by one. It only bursts when someone presses it, never on first render or when the page sets `pressed` itself. With reduced motion the icon fills without the spring or the burst, and the count changes in place.

## When to use

- A quick, personal reaction: helpful, save, star, follow.
- A toggle whose state is worth a moment of delight.

## When not to use

- Several reactions to pick from – use [Reaction Bar](#/reaction-bar).
- A setting that changes how something works – use [Switch](#/switch).
- Confirming that something was done – use [Success Check](#/success-check).

## Anatomy

1. **Host** `[data-ui="lkb"]` – the visual control
2. **Button** `.ui-lkb__button` – the native button with `aria-pressed`
3. **Spot** `.ui-lkb__spot` – where the icon sits; the default `.ui-lkb__heart` or the page's `slot="icon"`
4. **Burst** `.ui-lkb__burst` – the `.ui-lkb__ring` and eight `.ui-lkb__particle`s
5. **Count** `.ui-lkb__count` – the number, rolling between `.ui-lkb__out` and `.ui-lkb__in`

## Looks

No look of its own. A page can set `--tc-like-burst-color` (the filled icon and ring), `--tc-like-burst-idle` (the empty icon), `--tc-like-burst-size` and `--tc-like-burst-reach` (how far the particles fly).

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to the button |
| Enter or Space | Turns it on or off |

## Screen readers

A toggle button: its name is `label` plus the count ("Save finding 3"), and screen readers say whether it's pressed. The burst says nothing.

## Content

- Name it for what it does: "Save finding", "Helpful", "Star".
- Show the label when the icon alone isn't clear.

## Do

- Change `count` with `pressed` when you control it, so they agree.

## Don't

- Don't use it for actions that can't be undone by pressing again.

## Example

```html
<tc-like-burst label="Helpful" count="7"></tc-like-burst>

<script type="module">
  import "@adamstavely/trenchcoat/like-burst";
  import "@adamstavely/trenchcoat/tokens.css";
  document.querySelector("tc-like-burst").addEventListener("tc-pressed-change", (e) => console.log(e.detail.pressed));
</script>
```

```tsx
import { useState } from "react";
import { LikeBurst } from "@adamstavely/trenchcoat/react";

export function SaveFinding({ saves }: { saves: number }) {
  const [saved, setSaved] = useState(false);
  return <LikeBurst label="Save finding" showLabel pressed={saved} count={saves + (saved ? 1 : 0)} onPressedChange={setSaved} />;
}
```
