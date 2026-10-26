---
pattern: tabs
status: stable
related: integration-flow, model-wheel, agent-team
---

## Overview

An illustration for explaining a product in layers: an isometric stack of up to five layers beside a list of the
same entries. The chosen entry lifts its layer out of the stack in blue, with a soft glow underneath. It steps
through the entries on its own – twice round by default, then it rests – and people can pick an entry themselves
by clicking it or with the arrow keys. It pauses while hovered or focused, off screen, and for people who prefer
reduced motion.

## When to use

- A landing page or a feature tour describing what a product is built from: triggers, data, connections, models.
- Any short list of three to five ideas that build on each other, where one at a time should stand out.

## When not to use

- Showing data flowing from many tools into one place – use `integration-flow`.
- A list of AI models to choose from – use `model-wheel`.
- Showing several agents with roles working together – use `agent-team`.

## Anatomy

1. **Stack** `.ui-lyr-stack` – the isometric layers, the chosen one lifted out in blue
2. **List** `.ui-lyr-menu` – one entry per layer, top layer first
3. **Entry** `.ui-lyr-row` – a title and a short muted hint; the chosen one is highlighted

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to the chosen entry, and on out of the list |
| ↓ / ↑ | Picks the next or previous entry, wrapping round |
| Home / End | Picks the first or last entry |
| Enter / Space | Picks the focused entry |

Once someone picks an entry, the stack stops stepping on its own.

## Screen readers

The entries are tabs in a vertical tablist labelled “Layers”, named by their title and hint, with `aria-selected` on
the chosen one. The stack drawing is hidden from assistive technology – the list carries what it shows. The tabs
have no panels: the change is visual only, so put anything people must read in the page around it.

## Example

```html
<tc-layer-stack id="layers" rounds="1"></tc-layer-stack>

<script type="module">
  import "trenchcoat/layer-stack";
  import "trenchcoat/tokens.css";

  const stack = document.querySelector("#layers");
  stack.items = [
    { title: "Triggered by events", hint: "Webhooks", icon: "bolt" },
    { title: "Grounded in your data", hint: "Context", icon: "database" },
    { title: "Connected to your apps", hint: "APIs", icon: "plug" },
  ];
  stack.addEventListener("tc-index-change", (e) => console.log(e.detail.index, e.detail.user));
</script>
```

```tsx
import { useState } from "react";
import { LayerStack, type LayerStackItem } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const items: LayerStackItem[] = [
  { title: "Triggered by events", hint: "Webhooks", icon: "bolt" },
  { title: "Grounded in your data", hint: "Context", icon: "database" },
  { title: "Works with any model", hint: "Routing", icon: "spark" },
];

export function HowItWorks() {
  const [layer, setLayer] = useState(0);
  return (
    <>
      <LayerStack items={items} defaultIndex={0} onIndexChange={setLayer} />
      <p>{items[layer].title}</p>
    </>
  );
}
```
