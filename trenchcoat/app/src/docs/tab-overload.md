---
pattern: none
status: stable
related: glass-folder, layer-stack, side-folder
---

## Overview

Three overlapping browser windows on a 3 : 2 frame that fades out to the right and the bottom. The front window is
lit – coloured dots, a gradient outline and a soft glow – and its placeholder content shimmers a few times; point at a
window behind it and the highlight moves over. It illustrates “too many tabs” or “everything in one place” on a
landing page, an empty state or an onboarding step.

## When to use

- A marketing or onboarding card about browsing, research across many pages, or bringing scattered work together.
- An empty state for a feature that collects pages or links.

## When not to use

- Showing real pages or real screenshots – use `cover-flow`.
- Illustrating files and folders rather than pages – use `glass-folder` or `side-folder`.
- A stack of layers or versions – use `layer-stack`.

## Anatomy

1. **Window** `.ui-to-tab-1` – one of the three browser frames; hovering it moves the highlight
2. **Content** `.ui-to-content-3` – the placeholder lines, bright in the lit window and faint in the others
3. **Highlight** `.ui-to-front-3` – the coloured dots and gradient outline of the lit window

## Keyboard

There is nothing to operate: the highlight follows the pointer only, and the illustration takes no focus.

## Screen readers

Decorative by default: the host is `aria-hidden`. Set `label` and it becomes an image (`role="img"`) named by the
label; take the label away and it is decorative again.

## Do

- Set `label` when the illustration says something the text around it doesn't.
- Give it a container at least 300px wide; it scales with the width and keeps its 3 : 2 shape.

## Don't

- Don't make hovering a window the only way to reach anything – it's decoration.
- Don't put it on a busy background: the fade at the edges blends into the surface behind it.

## Example

```html
<tc-tab-overload label="Three browser windows, the front one highlighted"></tc-tab-overload>

<script type="module">
  import "trenchcoat/tab-overload";
  import "trenchcoat/tokens.css";

  const art = document.querySelector("tc-tab-overload");
  art.label = "Three browser windows – everything you had open, in one place";
</script>
```

```tsx
import { TabOverload } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function EmptyTabs() {
  return (
    <div style={{ width: 360 }}>
      <TabOverload label="Three browser windows, the front one highlighted" />
    </div>
  );
}
```
