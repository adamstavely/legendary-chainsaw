---
pattern: none
status: stable
related: integration-beam, logo-cluster, integration-picker
---

## Overview

A wall of rounded logo tiles in three rows around one larger, bright centre tile that holds your product mark. It
says “works with the tools you already use” in one picture: the tiles are frosted and fade toward the edges while
the logos keep their full colour, so the eye lands on the centre first. Pointing at a tile turns it solid white and
grows its logo a little. It scales with its container and needs no motion to make its point.

## When to use

- A landing or pricing section about integrations, next to the headline that names them.
- The header of an integrations page or directory, above the real list.
- Onboarding, to show which tools can be connected before anyone connects one.

## When not to use

- Letting people connect or pick an integration – the tiles aren't controls; use `integration-picker`.
- Showing data flowing between your product and a few tools – use `integration-beam`.
- A compact cluster of logos, such as customers or partners – use `logo-cluster`.

## Anatomy

1. **Centre tile** `.ui-ig-tile--center` – the larger white tile with your product mark
2. **Mark** `.ui-ig-mark` – the neutral default mark; your own `mark` replaces it
3. **Tile** `.ui-ig-tile` – a frosted tile, fainter the further it sits from the centre
4. **Logo** `.ui-ig-logo` – one integration's logo, a single 24 × 24 path in its brand colour

## Looks

One look. Colours follow the page theme through `light-dark()`: in dark the tiles turn charcoal, black logos turn
light, and a logo with a `darkColor` switches to it. It works with a `.dark` class, `data-theme`, `data-tc-theme` or
the system setting.

## Keyboard

Nothing to operate – the tiles take no focus. Hover is decoration only.

## Screen readers

The host is `role="img"`. Its name is `label` when set, otherwise “Integrates with” and the names of the logos on
show (“Integrates with Notion, Stripe, Figma, …”). The tiles themselves are hidden.

## Content

- Give every logo the tool's real name – it goes into the image's name.
- Lead with the tools your customers recognise: logos fill the rows from the top left, and repeat when there are
  fewer than the tiles.
- Set `label` when the list of names is long and a sentence says it better (“Connects with 40+ tools”).

## Do

- Use `columns` 7 or 5 in narrower layouts – the rows get shorter instead of the tiles getting tiny.
- Pass `color` for brand marks and leave it out for black marks, so they follow the ink colour in dark.
- Put your own mark in the centre with `mark` – the default flower is a placeholder.

## Don't

- Don't show tools you don't integrate with to fill the grid – pass fewer logos and let them repeat, or use fewer
  `columns`.
- Don't link the tiles – put a real link to the integrations page next to the grid.

## Example

```html
<tc-integration-grid id="tools" columns="7"></tc-integration-grid>

<script type="module">
  import "trenchcoat/integration-grid";
  import "trenchcoat/tokens.css";

  const grid = document.querySelector("#tools");
  grid.logos = [
    { name: "Stripe", color: "#635BFF", path: "M13.976 9.15c…" },
    { name: "GitHub", path: "M12 .297c…" },
  ];
  grid.label = "Integrates with Stripe, GitHub and more";
</script>
```

```tsx
import { IntegrationGrid, type IntegrationGridLogo } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const logos: IntegrationGridLogo[] = [
  { name: "Stripe", color: "#635BFF", path: "M13.976 9.15c…" },
  { name: "GitHub", path: "M12 .297c…" },
];

export function Integrations() {
  return <IntegrationGrid columns={7} logos={logos} mark={<img src="/mark.svg" alt="" width={34} height={34} />} />;
}
```
