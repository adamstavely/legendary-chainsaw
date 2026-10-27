---
pattern: none
status: stable
related: integration-beam, integration-grid, model-wheel
---

## Overview

An illustration that says “this fits in with the tools you already use”: a brand mark on a white disc in the
middle, with company logos gathered round it in bubbles of mixed sizes. When it scrolls into view the disc appears
first and the logos bounce out of it one after another; once they have landed the ring turns once, slowly, and
rests, the logos staying upright. It is square and scales with its container, up to 420 px.

## When to use

- In a landing or onboarding section about integrations, as the picture beside the copy.
- In an empty state for an integrations page, before anything is connected.

## When not to use

- When the logos are the product's actual integrations and people need to pick one – use `integration-picker`.
- To show data moving between two services – use `integration-beam`.
- To lay out many integrations as a browsable set – use `integration-grid`.

## Anatomy

1. **Middle** `.ui-lc-mid` – the white disc with the brand mark, which appears first
2. **Ring** `.ui-lc-orbit` – the logos together, which turn once after they land
3. **Bubble** `.ui-lc-face` – one company logo on its own disc

## Keyboard

Nothing to operate – the cluster takes no focus.

## Screen readers

Decorative by default: the host is `aria-hidden="true"` and screen readers skip it. Set `label` and the host becomes
`role="img"` named by it (“Works with Notion, Figma, Linear and more”); the logos themselves stay hidden.

## Do

- Set `label` when the cluster is the only place the page names the tools.
- Give it a square space at least 240 px wide, so the smallest bubbles keep a readable logo.

## Don't

- Don't use it to claim integrations the product doesn't have – the logos are fixed: Notion, Spotify, Stripe, Google
  Calendar, Linear, GitHub and Figma.
- Don't put two clusters on one screen; the entrance is meant to be seen once.

## Example

```html
<tc-logo-cluster id="tools"></tc-logo-cluster>

<script type="module">
  import "trenchcoat/logo-cluster";
  import "trenchcoat/tokens.css";

  document.querySelector("#tools").label = "Works with Notion, Figma, Linear and more";
</script>
```

```tsx
import { LogoCluster } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Tools() {
  return <LogoCluster label="Works with Notion, Figma, Linear and more" style={{ maxWidth: 320 }} />;
}
```
