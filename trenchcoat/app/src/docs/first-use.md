---
pattern: none
status: new
related: glass-folder, nothing-found, setup-guide, agent-scene
---

## Overview

An empty workspace with one highlighted spot to start from, with the words Nothing here yet. It shows a new team or project where to begin, which reads warmer and clearer than a blank page.

## When to use

- A new workspace, team or project with nothing in it yet.
- A section someone's opening for the first time.

## When not to use

- A search with no results – use `nothing-found`.
- An empty folder – use `glass-folder`.
- A list of setup steps – use `setup-guide`.

## Anatomy

1. **Workspace** `.ui-fus-frame` – the empty space, with `.ui-fus-slot` for what's to come
2. **Spot** `.ui-fus-tile` – where to start, glowing a few times
3. **Words** `.ui-fus-caption` – the default is Nothing here yet

## Looks

One look. Colours follow the page theme through `light-dark()`, with a `.dark` class, `data-theme`, `data-tc-theme` or
the system setting. It has no background of its own, so it takes on whatever it sits on.

## Keyboard

Nothing to operate. The illustration takes no focus.

## Screen readers

The host is `role="img"`, named by `label` or else by `caption`, so the message is announced. With `caption=""` and no
`label` it's decorative and skipped, for when the words beside it say the same.

## Content

Replace the words to suit the place: "No cases yet". Add one line on what to do first, and one real button.

## Do

- Put a real button next to it. The plus in the drawing can't be pressed.

## Don't

- Don't show it once there's content, or to people who can't add anything.

## Example

```html
<tc-first-use></tc-first-use>

<script type="module">
  import "trenchcoat/first-use";
  import "trenchcoat/tokens.css";
</script>
```

```tsx
import { FirstUse } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function State() {
  return <FirstUse />;
}
```
