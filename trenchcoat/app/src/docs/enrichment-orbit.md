---
pattern: none
status: stable
related: integration-flow, lead-sourcing, thinking-loader
---

## Overview

A small animated scene that says “an AI model is working on your data”: a Grok tile sits inside two rings, coloured
comets run round the rings in opposite directions, and three data nodes orbit the outer ring, staying upright as
they travel. It suits loading and empty states where enrichment takes a while. The comets and nodes make a few
rounds and then rest; they hold still off screen, in a hidden tab, and for people who prefer reduced motion.
Colours follow the page theme.

## When to use

- An empty or waiting state while records are being enriched, scored or researched by a model.
- A marketing section about data enrichment.

## When not to use

- A short wait inside a conversation – use `thinking-loader`.
- Showing data arriving from several tools – use `integration-flow`.
- Showing one tool reaching out to others – use `lead-sourcing`.

## Anatomy

1. **Tile** `.ui-eo-tile` – the model's mark in the centre
2. **Rings** `.ui-eo-rings` – the two orbits
3. **Comets** `.ui-eo-spin` – coloured light running round each ring
4. **Node** `.ui-eo-orbit` – one of the three data nodes travelling round the outer ring

## Screen readers

Decorative by default: the element is `aria-hidden` and assistive technology skips it. Set `label` and it becomes an
image named by that text (“Enriching your leads”) – do that when the scene is the only sign that work is going on,
and say what is happening, not what it looks like.

## Example

```html
<div style="width: 320px">
  <tc-enrichment-orbit id="orbit"></tc-enrichment-orbit>
</div>

<script type="module">
  import "trenchcoat/enrichment-orbit";
  import "trenchcoat/tokens.css";

  // Named while the work runs; without a label the scene is decorative
  document.querySelector("#orbit").label = "Enriching your leads";
</script>
```

```tsx
import { EnrichmentOrbit } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Enriching() {
  return (
    <div style={{ width: 320 }}>
      <EnrichmentOrbit label="Enriching your leads" />
    </div>
  );
}
```
