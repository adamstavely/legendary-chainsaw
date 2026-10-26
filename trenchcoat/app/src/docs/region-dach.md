---
pattern: listbox
status: stable
related: world-map, integration-grid, logo-cluster
---

## Overview

A calm map for marketing pages and empty states that talk about a market: Germany, Austria and Switzerland sit
filled in the middle, the neighbouring countries fade out towards the edges, and a pastel band travels along the
outer border twice, then rests. A small menu in the top-left corner switches the map to the United States, China,
India, Brazil or Japan; the old map fades out as the new one fades in. Country shapes come from Natural Earth.

## When to use

- A landing page or announcement about launching in, or serving, one of the six regions.
- An empty state for region settings – “No customers in DACH yet”.
- Letting visitors see the same message for another market with the menu.

## When not to use

- Showing where things are across the whole world – use `world-map`.
- Picking a region as part of a form – use `combobox` or `segmented-control`, and keep the map as decoration.
- Showing the services a product connects to – use `integration-grid`.

## Anatomy

1. **Map** `.ui-rd-map` – the countries of the region, filled, with the neighbours fading out
2. **Band** `.ui-rd-band` – the pastel light travelling along the outer border
3. **Menu** `.ui-rd-trigger` – shows the current region and opens the list of the six

## Keyboard

| Key | What it does |
|---|---|
| Enter / Space | On the menu button: opens the list, with focus on it |
| ↓ / ↑ | On the menu button: opens the list; in the list: moves to the next or previous region |
| Home / End | In the list: moves to the first or last region |
| Enter / Space | In the list: picks the region and returns focus to the menu button |
| Escape | Closes the list and returns focus to the menu button |
| Tab | Closes the list and moves on |

## Screen readers

The map is an image with a name that follows the region – “Map of the DACH region: Germany, Austria and Switzerland”,
“Map of Japan” – or your own `label`. The menu button is named “Region: DACH” with `aria-haspopup="listbox"` and
`aria-expanded`; the list is a `listbox` named “Select a region”, with `aria-activedescendant` on the active option
and `aria-selected` on the one shown.

## Content

- Pass `label` when the map carries a message of its own – “Our customers in Germany, Austria and Switzerland”.
- Put the words next to the map, not on it: a heading and a sentence about the region.

## Do

- Turn the menu off (`show-switcher="false"`) when the page is about one region only.
- Listen to `tc-region-change` if the text around the map should change with it.

## Don't

- Don't use it as the only way to choose a region that matters to the product – it's an illustration.
- Don't make it narrower than about 340px – below that the menu stops shrinking with the map and covers more of it.

## Example

```html
<tc-region-dach id="map" region="dach"></tc-region-dach>

<script type="module">
  import "trenchcoat/region-dach";

  const map = document.querySelector("#map");
  map.label = (region) =>
    region === "dach"
      ? "Our customers in Germany, Austria and Switzerland"
      : `Our customers in ${region.toUpperCase()}`;
  map.addEventListener("tc-region-change", (e) => console.log(e.detail.region));
</script>
```

```tsx
import { useState } from "react";
import { RegionDach, type Region } from "trenchcoat/react";

export function MarketMap() {
  const [region, setRegion] = useState<Region>("dach");
  return <RegionDach region={region} onRegionChange={setRegion} />;
}
```
