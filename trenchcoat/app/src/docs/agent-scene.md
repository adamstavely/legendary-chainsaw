---
pattern: none
status: new
related: agent-face, nothing-found, something-wrong, no-access
---

## Overview

The assistant in a small scene, for the states a page rests in: happy above an empty tray and waving once when all's
clear, thinking beside a stack of pages when working, and asleep beside a sign when offline. The face is `agent-face`, so
it follows reduced motion and rests when nothing's happening.

## When to use

- An empty inbox or queue, where being done is good news.
- A panel waiting on the assistant, or showing it's unavailable.

## When not to use

- Beside a serious decision or an error – use `agent-face` alone, or `something-wrong`.
- Search with no results – use `nothing-found`.
- Someone without permission – use `no-access`.

## Anatomy

1. **Scene** `.ui-ags-art` – the tray, pages or sign
2. **Face** `.ui-ags-face` – the assistant

## Looks

One look. Colours follow the page theme through `light-dark()`. A page can set `size`, the face's size in pixels.

## Keyboard

Nothing to operate. It takes no focus.

## Screen readers

Decorative by default: the host is `aria-hidden="true"` and is skipped, so put the words beside it. With `label`, the host
becomes `role="img"` named by the label.

## Content

Pair it with a short heading ("You're all caught up"). Use `name` to rename the assistant.

## Do

- Size its container: it fills the width at a 3 : 2 frame.
- Use it for resting states, and sparingly.

## Don't

- Don't use the happy scene near bad news. It's meant for good news only.

## Example

```html
<tc-agent-scene scene="all-clear"></tc-agent-scene>
<h2>You're all caught up</h2>

<script type="module">
  import "trenchcoat/agent-scene";
  import "trenchcoat/tokens.css";
</script>
```

```tsx
import { AgentScene } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Empty() {
  return (
    <div>
      <AgentScene scene="all-clear" />
      <h2>You're all caught up</h2>
    </div>
  );
}
```
