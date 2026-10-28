---
pattern: listbox
status: new
related: world-map, entity-timeline, travel-itinerary, fact-sheet
---

## Overview

The places on record for a person, an account or a business. Each place shows its type with an icon – Residence,
Work, Frequent, Former or Other, or your own – whether it's confirmed (Confirmed, Unverified, Vacated, in words with
a mark), the address, optional coordinates in mono, and when it applies: “Jun 2021 –”, “Until Nov 2020”, or your own
words such as “Visits 2024 –”. Picking a place fires a cancelable change, so a page can show it on a map such as
`world-map`.

## When to use

- A customer or supplier record during a know-your-customer or due-diligence review.
- Sites a business operates from, with which ones are verified.
- Pairing a list of places with a map.

## When not to use

- Trips between places – use `travel-itinerary`.
- Events in order – use `entity-timeline`.
- Facts of every kind with their sources – use `fact-sheet`.

## Anatomy

1. **Icon** `.ui-plc__icon` – the type's icon in its tone
2. **Name** `.ui-plc__name` – the place's name, or its type's
3. **Status** `.ui-plc__status` – Confirmed, Unverified or Vacated, in words with a mark
4. **Address** `.ui-plc__address` – the full address
5. **Coordinates** `.ui-plc__coords` – latitude and longitude in mono
6. **Period** `.ui-plc__span` – when the place applies

## Looks

Standard is a white card on a gray tray, with the header on the tray above it and medium-weight names. Clean is one
white card with the header as its first row. The icons, pills and selection are the same in both.

## Keyboard

The list is one tab stop.

| Key | What it does |
|---|---|
| ↑ / ↓ | Moves to the previous or next place |
| Home / End | Moves to the first or last place |
| Enter / Space | Picks the place, or clears it if it's picked |
| Escape | Clears the picked place |

## Screen readers

The list is a single-select `listbox` named by the heading; each place is an option that reads its name, type,
status, address, coordinates and period, and is `aria-selected` when picked. Picking is confirmed in a polite status
message, “Registered office selected”, and clearing with “Selection cleared”.

## Content

- Name places by what they are to the record: “Registered office”, “Warehouse 7”.
- Give coordinates only when you have them from a reliable source.
- Use `span` when dates don't tell it: “Visits 2024 –”, “Deliveries 2025 –”.

## Do

- Mark places your team hasn't checked as unverified, so reviewers know what's left.
- Pair the list with a map, moving it to the picked place.
- Keep former places, marked vacated, when history matters.

## Don't

- Don't list the same place twice under different types – pick the main one.
- Don't use the tones for anything but the type and status.
- Don't hide coordinates people need to confirm a site; turn them off only when they add nothing.

## Example

```html
<tc-place-list id="places" heading="Places"></tc-place-list>

<script type="module">
  import "trenchcoat/place-list";
  import "trenchcoat/tokens.css";

  const list = document.querySelector("#places");
  list.places = [
    { id: "p1", name: "Registered office", type: "work", status: "confirmed", address: "14 Harbour Row, Leith, Edinburgh", since: Date.parse("2021-06-01") },
    { id: "p2", name: "Warehouse 7", type: "frequent", status: "unverified", address: "Unit 7, Port Approach, Grangemouth" },
  ];
  list.addEventListener("tc-selected-change", (e) => console.log(e.detail.place));
</script>
```

```tsx
import { useState } from "react";
import { PlaceList, type PlaceRecord } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const places: PlaceRecord[] = [
  { id: "p1", name: "Registered office", type: "work", status: "confirmed", address: "14 Harbour Row, Leith, Edinburgh" },
];

export function Places() {
  const [selected, setSelected] = useState<string | null>(null);
  return <PlaceList title="Places" places={places} selected={selected} onSelectedChange={setSelected} />;
}
```
