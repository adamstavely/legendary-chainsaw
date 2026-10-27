---
pattern: listbox
status: stable
related: region-dach, logo-cluster, integration-beam
---

## Overview

A world map with one continent picked out: the highlighted continent sits white with a soft shadow on a light gray
world, and a pastel band travels twice round its coastline before it rests. A small menu in the top-left corner
switches between the six continents, the old highlight fading as the new one settles in. Use it to say where
something happens – a region a product launches in, where a team or its customers are – at a glance.

## When to use

- In a section about regional availability, data residency or a launch in one part of the world.
- Beside copy about a team, an office or customers on one continent.
- In onboarding, where the person's region is already known and the map confirms it.

## When not to use

- For a single country or region within a continent – use `region-dach` for the German-speaking region.
- To show that a product connects to other tools – use `logo-cluster` or `integration-beam`.
- Values by region – it highlights one continent and carries no data; use `breakdown-chart`.

## Anatomy

1. **Map** `.ui-wm-map` – the world, with the highlighted continent and the band along its coast
2. **Continent** `.ui-wm-focus` – the highlighted continent
3. **Switcher** `.ui-wm-trigger` – the pill in the top-left corner that names the continent; it opens a menu of all six

## Keyboard

| Key | What it does |
|---|---|
| Enter / Space | On the trigger: opens the menu. In the menu: picks the active continent and closes it |
| ↓ / ↑ | On the trigger: opens the menu. In the menu: moves to the next or previous continent |
| Home / End | Moves to the first or last continent |
| Escape | Closes the menu and returns focus to the trigger |
| Tab | Closes the menu and moves on |

## Screen readers

The map is `role="img"`, named “World map with Europe highlighted” – or by `label`, which can be a string or a
function of the continent. The trigger is a button with `aria-haspopup="listbox"` and `aria-expanded`, named
“Continent: Europe”. The menu is a listbox named “Select a continent”; focus moves to it when it opens, and
`aria-activedescendant` points at the active option. The current continent is `aria-selected`. There is no live
region: the new name reaches screen readers through the trigger when focus returns to it.

## Content

- When the map stands for something specific, say it in `label`: “Our customers in Asia” tells more than the default.
- Keep the copy beside the map about the place; the map can't carry text of its own.

## Do

- Hide the menu (`showSwitcher` false) when the continent is fixed by the page.
- Use the function form of `label` when the menu is shown, so the name follows the pick.
- Give it the full width of its column – the menu scales down with the map, and it stops shrinking at about
  340 px wide.

## Don't

- Don't set `continent` in React without `onContinentChange` while the menu is shown – the menu can't change it, and
  the wrapper warns in development.
- Don't use the highlight to mean a country – it always covers the whole continent.

## Example

```html
<tc-world-map id="map" continent="asia"></tc-world-map>

<script type="module">
  import "trenchcoat/world-map";
  import "trenchcoat/tokens.css";

  const map = document.querySelector("#map");
  map.label = (continent) => `Customers in ${continent.replace("-", " ")}`;
  map.addEventListener("tc-continent-change", (e) => console.log(e.detail.continent));
</script>
```

```tsx
import { useState } from "react";
import { WorldMap, type Continent } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Regions() {
  const [continent, setContinent] = useState<Continent>("asia");
  return (
    <WorldMap
      continent={continent}
      onContinentChange={setContinent}
      label={(c) => `Customers in ${c.replace("-", " ")}`}
    />
  );
}
```
