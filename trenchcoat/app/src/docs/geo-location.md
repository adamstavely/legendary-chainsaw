---
pattern: listbox
status: new
related: place-list, world-map, travel-itinerary, contact-channels
---

## Overview

A pair of coordinates made useful. It shows the place's name and its latitude and longitude, in decimal or in
degrees, minutes and seconds, with Copy beside them. "Open in" links take the point to Google Maps, Apple Maps,
OpenStreetMap or Bing Maps, or to your own mapping tools, given as URL templates. An embedded OpenStreetMap shows the
spot.

**Privacy:** by default the map waits behind **Show map**, with a line saying which site it loads from. Nothing is
fetched from another site until someone asks. Set `embed="auto"` to show it at once, or `embed="off"` to leave it out.

Give `points` instead of one pair to switch between several places. Coordinates out of range say what's wrong in
words, with no links and no map.

## When to use

- A record carries coordinates people need to look at or pass on: a site, a sensor, an incident location.
- People use different mapping tools and you want to offer each of them.
- A map is useful but shouldn't load on its own, for privacy or bandwidth.

## When not to use

- A list of addresses with their status and dates – use `place-list`, and pair it with this for the picked place.
- Many points at once on one drawing – use `world-map`.
- Journeys between places – use `travel-itinerary`.

## Anatomy

1. **Points** `.ui-geo__points` – the places to switch between, when `points` has more than one
2. **Label** `.ui-geo__label` – what the place is
3. **Coordinates** `.ui-geo__coords` – latitude and longitude in mono, in the chosen notation
4. **Notation** `.ui-geo__notation` – Decimal or DMS
5. **Copy** `.ui-geo__copy` – copies the coordinates as shown
6. **Open in** `.ui-geo__links` – a link per mapping tool, each opening in a new tab
7. **Map** `.ui-geo__map` – the embedded map, or its Show map placeholder
8. **Error** `.ui-geo__error` – what's wrong with coordinates that can't be used

## Looks

Standard is a white card on a gray tray, with the header on the tray above it. Clean is one white card with the header
as its first row. The coordinates, links and map are the same in both.

The map's height is the component token `--tc-geo-map-h` (220px), which a page can override on the element.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves between the points, the notation, Copy, each link and Show map |
| ↑ / ↓ | In the points, moves to the previous or next place |
| Home / End | In the points, moves to the first or last place |
| Enter / Space | In the points, shows the place |
| ← / → | In the notation, switches between Decimal and DMS |

## Screen readers

The points are a single-select `listbox` named "Places", and showing one is confirmed in a polite status message
("Lochside sensor buoy selected"). The coordinates are introduced as "Latitude, longitude" or "Coordinates, degrees
minutes seconds". The notation is a `radiogroup`. Each link reads its tool's name and "opens in a new tab". Show map
names the place, and the map's iframe is titled "Map of …". Bad coordinates are announced as an alert.

## Content

- Give each point a label that says what it is, not where: "North weather mast", not "57.04, −3.61".
- Set `zoom` to suit the thing: 13 for a site in open country, 16–17 for a building.
- In your own provider templates, use {lat}, {lng}, {zoom} and {label}. The element encodes each value, and keeps
  only http(s) links.

## Do

- Keep Show map (`embed="click"`) unless the page already loads from the map's site.
- Listen to `tc-open` to open your own map view instead of leaving the app.
- Spread `defaultGeoProviders` to add an internal GIS tool beside the usual ones.

## Don't

- Don't pass coordinates you haven't checked – the element flags only ones out of range.
- Don't show precision you don't have; five decimal places is about a metre.
- Don't point `embedSrc` at a site you haven't reviewed. The iframe is sandboxed, but it still loads that site.

## Example

```html
<tc-geo-location id="site" heading="Field site" label="North weather mast" latitude="57.04121" longitude="-3.61274" zoom="13"></tc-geo-location>

<script type="module">
  import "trenchcoat/geo-location";
  import "trenchcoat/tokens.css";

  const site = document.querySelector("#site");
  site.addEventListener("tc-open", (e) => console.log("Opening", e.detail.provider.name, e.detail.url));
</script>
```

```tsx
import { useState } from "react";
import { GeoLocation, defaultGeoProviders, type GeoPoint } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const sites: GeoPoint[] = [
  { id: "mast", label: "North weather mast", latitude: 57.04121, longitude: -3.61274 },
  { id: "buoy", label: "Lochside sensor buoy", latitude: 57.11853, longitude: -3.82406 },
];

export function FieldSites() {
  const [selected, setSelected] = useState<string | null>("mast");
  return (
    <GeoLocation
      title="Field sites"
      points={sites}
      selected={selected}
      onSelectedChange={setSelected}
      providers={[...defaultGeoProviders, { id: "gis", name: "Institute GIS", url: "https://gis.example.org/map?lat={lat}&lon={lng}" }]}
    />
  );
}
```
