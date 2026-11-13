---
pattern: listbox
status: new
related: travel-itinerary, place-list, geo-location, schedule-card
---

## Overview

A trip planned day by day, with each day's stops on a map. Beside the map, the days are tabs and the chosen day's
stops are listed in order – numbered, with the time, what kind of stop it is (sight, food, stay, transport, venue),
how long to stay, and how long it takes to get there from the stop before. The map is drawn from the stops'
coordinates and fitted to the day or the whole trip: the chosen day's route and numbered markers stand out, the other
days stay muted. Picking a stop in the list lights it up on the map, and the other way round.

No map tiles load by default – a quiet grid stands in, so nothing is sent to another site. Give `tileUrl` and the
tiles wait behind **Show map tiles**, which says which site they load from.

## When to use

- A plan an assistant drew up – “three days in Lisbon”, a site-visit schedule, a field trip.
- A multi-day event across several venues.
- Any ordered set of places per day where the route matters.

## When not to use

- Trips already taken, audited leg by leg – use `travel-itinerary`.
- Places on record with no order or days – use `place-list`.
- One location with its coordinates – use `geo-location`.

## Anatomy

1. **Day tabs** `.ui-mit__tabs` – one tab per day, with its date; hidden for a one-day plan
2. **Day heading** `.ui-mit__day-head` – the chosen day's name and date
3. **Stops** `.ui-mit__stops` – the day's stops in order
4. **Stop** `.ui-mit__stop` – number, name, time, kind, how long to stay and a note
5. **Travel** `.ui-mit__travel` – how long it takes from the stop before
6. **Map** `.ui-mit__map` – the stops drawn from their coordinates
7. **Route** `.ui-mit__route` – each day's path; the chosen day's in the accent, the others muted and dashed
8. **Marker** `.ui-mit__marker` – a numbered stop on the map
9. **Fit** `.ui-mit__fit` – Show all days or Zoom to the day
10. **Tiles prompt** `.ui-mit__tiles-ask` – where tiles would load from, and Show map tiles

## Looks

Standard is a white card on a gray tray, with the header on the tray above it and medium-weight stop names. Clean is
one white card with the header as its first row. The map, markers and routes are the same in both. The list's width
is the component token `--tc-mit-side`, and the number badges' size is `--tc-mit-num`. Below 640 px of width the map
moves above the list.

## Keyboard

The day tabs, the stops and the map's markers are a tab stop each.

| Key | What it does |
|---|---|
| ← / → (day tabs) | Chooses the previous or next day |
| Home / End (day tabs) | Chooses the first or last day |
| ↑ / ↓ (stops) | Moves to the previous or next stop |
| Home / End (stops, markers) | Moves to the first or last stop |
| ← → ↑ ↓ (markers) | Moves between the day's markers on the map |
| Enter / Space | Picks the stop, or clears it if it's picked |
| Escape | Clears the picked stop |

## Screen readers

The days are a `tablist` named “Days”, each tab controlling the panel of stops. The stops are a single-select
`listbox` named by the day; each option reads its number, name, time, kind, how long to stay, note and how to get there
(“Getting there: 12 min walk”). The map is a group named “Map of Day 2”; each marker is a toggle button reading its
number, name and time, pressed when picked, and the other days' routes are hidden from screen readers. Picking is
confirmed in a polite status message – “Belém Tower selected, stop 2 of 3, Day 2” – and so are changing the day and the
fit.

## Content

- Name stops by what people will see on the street: “Belém Tower”, not a booking reference.
- Write times the way the plan does: “09:40”, “Afternoon”.
- Put travel on the stop it leads to: “12 min walk”, “25 min by metro”.
- Use notes for what matters on the day: a booking, an entrance, what to bring.

## Do

- Give accurate coordinates – the map fits to them, so one wrong stop squeezes the rest.
- Keep each day short enough to read without scrolling the list.
- Credit the tile provider with `tileAttribution` when you give `tileUrl`.

## Don't

- Don't load tiles without asking – leave them behind Show map tiles unless people have agreed.
- Don't put places with no location on the map; leave `lat` and `lng` out and the list says so.
- Don't use the itinerary for an audit of past travel – use `travel-itinerary`.

## Example

```html
<tc-map-itinerary id="trip" heading="Lisbon field visit"></tc-map-itinerary>

<script type="module">
  import "@adamstavely/trenchcoat/map-itinerary";
  import "@adamstavely/trenchcoat/tokens.css";

  const trip = document.querySelector("#trip");
  trip.days = [
    {
      id: "d1",
      label: "Day 1",
      stops: [
        { id: "s1", name: "Hotel Avenida", lat: 38.7189, lng: -9.1437, time: "11:00", kind: "stay" },
        { id: "s2", name: "Praça do Comércio", lat: 38.7075, lng: -9.1364, time: "15:00", kind: "sight", travel: "20 min walk" },
      ],
    },
    {
      id: "d2",
      label: "Day 2",
      stops: [
        { id: "s3", name: "Belém Tower", lat: 38.6916, lng: -9.216, time: "10:00", kind: "sight" },
        { id: "s4", name: "Jerónimos Monastery", lat: 38.6979, lng: -9.2068, time: "11:30", kind: "sight", travel: "10 min walk" },
      ],
    },
  ];
  trip.addEventListener("tc-stop-select", (e) => console.log(e.detail.item));
</script>
```

```tsx
import { useState } from "react";
import { MapItinerary, type ItineraryDay } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Trip({ days }: { days: ItineraryDay[] }) {
  const [day, setDay] = useState<string | null>(days[0]?.id ?? null);
  const [stop, setStop] = useState<string | null>(null);
  return (
    <MapItinerary
      title="Lisbon field visit"
      days={days}
      day={day}
      onDayChange={setDay}
      stop={stop}
      onStopSelect={setStop}
      tileUrl="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      tileAttribution="© OpenStreetMap contributors"
    />
  );
}
```
