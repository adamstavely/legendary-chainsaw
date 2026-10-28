---
pattern: list
status: new
related: entity-timeline, place-list, fact-sheet, document-list
---

## Overview

Trips as legs, for a travel audit or an expense review. Each leg shows its date, the route as codes – LYS → IST, with
the places' names on hover – the mode with its carrier or road, the document it was booked on, how confident the
record is as a meter and a percentage, and where the record came from with its reliability grade. Flags such as
“No record”, “Cash ticket” or “Identity mismatch” sit on the leg in words with a mark. Grouped, connecting legs
become journeys headed by their whole route and dates.

## When to use

- A travel or expense audit: what was travelled, on what document, and how well each leg is backed up.
- Reconciling bookings, expense claims and card statements leg by leg.
- Any list of journeys where the evidence behind each leg matters.

## When not to use

- Events of every kind in order – use `entity-timeline`.
- Where someone lives or works – use `place-list`.
- The documents themselves – use `document-list`.

## Anatomy

1. **Journey** `.ui-trit__journey-head` – grouped legs' whole route, dates and count
2. **Leg** `.ui-trit__leg` – one row, the whole row opening it
3. **Route** `.ui-trit__route` – origin and destination codes, names on hover
4. **Mode** `.ui-trit__mode` – air, rail, road or sea with the carrier
5. **Document** `.ui-trit__doc` – what the leg was booked or crossed on
6. **Confidence** `.ui-trit__conf` – a meter and the %, in warning below `low-confidence`
7. **Source** `.ui-trit__src` – where the record came from and its grade
8. **Flag** `.ui-trit__flag` – a tint, a mark and a word

## Looks

Standard is a white card on a gray tray, with the header on the tray above it. Clean is one white card with the header
as its first row and thinner marks. The rows, meters and flags are the same in both.

## Keyboard

The legs are one tab stop.

| Key | What it does |
|---|---|
| ↑ / ↓ | Moves to the previous or next leg |
| Home / End | Moves to the first or last leg |
| Enter / Space | Opens the leg (tc-open) |
| Tab | Leaves the list |

## Screen readers

Each journey is a section named “Journey 1: LYS to IST to DXB”; the legs are an ordered list. A leg's button reads
“Open Lyon Saint-Exupéry to Istanbul, 28 May 2026”; the row reads the mode, the carrier, the document, the confidence
in words (“99% confidence, high”), the source and grade, and each flag's word. Colour never carries a flag on its own.

## Content

- Use the codes people know – IATA airports, station or border codes – and give `name` so they read in full.
- Write the document as it identifies the traveller without exposing it: “Passport ••471K”.
- Keep flags to a few words: “Cash ticket”, not “Ticket was paid for in cash”.

## Do

- Give each leg a source and grade, so reviewers can weigh a mileage claim against a booking.
- Set `grouped` when trips have several legs, so the whole route reads first.
- Set `low-confidence` to the level your audit treats as needing a second look.

## Don't

- Don't show full document numbers – mask them in the data you pass.
- Don't use flags for routine facts; keep them for what needs a look.
- Don't mix trips from different people in one list.

## Example

```html
<tc-travel-itinerary id="trips" heading="Travel this quarter" grouped></tc-travel-itinerary>

<script type="module">
  import "trenchcoat/travel-itinerary";
  import "trenchcoat/tokens.css";

  const trips = document.querySelector("#trips");
  trips.legs = [
    { id: "l1", date: Date.parse("2026-05-28T09:00"), from: "LYS", to: "IST", mode: "air", carrier: "TK1814", confidence: 0.99, source: { label: "Booking tool", grade: "A1" } },
    { id: "l2", date: Date.parse("2026-05-31T09:00"), from: "IST", to: "DXB", mode: "air", carrier: "EK122", confidence: 0.97, flags: ["cash"] },
  ];
  trips.addEventListener("tc-open", (e) => console.log(e.detail.id));
</script>
```

```tsx
import { TravelItinerary, type TravelLeg } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const legs: TravelLeg[] = [
  { id: "l1", date: Date.parse("2026-05-28T09:00"), from: "LYS", to: "IST", mode: "air", carrier: "TK1814", confidence: 0.99 },
  { id: "l2", date: Date.parse("2026-05-31T09:00"), from: "IST", to: "DXB", mode: "air", carrier: "EK122", flags: ["cash"] },
];

export function Trips() {
  return <TravelItinerary title="Travel this quarter" legs={legs} grouped onOpen={(id) => console.log(id)} />;
}
```
