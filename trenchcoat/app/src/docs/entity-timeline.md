---
pattern: list
status: new
related: fact-sheet, travel-itinerary, place-list, version-history
---

## Overview

What happened to a person, an account or a case, in order. Each event has its date, a title and one quiet line of
detail, a category tag, and where it came from with a reliability grade – "Payments engine · A1" – tinted by how far
to trust it, as in the fact sheet. A flag such as "Auto-flag" marks events a rule picked out. Events sit under month
headers, newest first by default. Category chips with counts filter the list, and opening an event shows its longer
note and attachments in place.

## When to use

- A case file or review: what happened to an account, a customer or a supplier, and where each fact came from.
- An audit trail where the source of each event matters as much as the event.
- Any record a reviewer reads in order and filters by kind.

## When not to use

- Facts about something, not events – use `fact-sheet`.
- Trips with routes and documents – use `travel-itinerary`.
- Versions of one document or setting – use `version-history`.
- Places rather than events – use `place-list`.

## Anatomy

1. **Filters** `.ui-etl__filters` – All, then each category in use with its count
2. **Month** `.ui-etl__month` – the month and year the events under it fall in
3. **Event** `.ui-etl__event` – a dot on the rail, the date, the title and its tags
4. **Category** `.ui-etl__cat` – the event's kind, in its tone
5. **Source** `.ui-etl__src` – where it came from and its grade, tinted and barred by confidence
6. **Flag** `.ui-etl__flag` – a short marker such as "Auto-flag"
7. **Detail** `.ui-etl__more` – the opened event's note and attachments

## Looks

Standard is a white card on a gray tray, with the header on the tray above it and medium-weight titles. Clean is one
white card with the header as its first row and quieter titles. The rail, tags and detail are the same in both.

## Keyboard

The events are one tab stop; the filter chips are ordinary buttons before them.

| Key | What it does |
|---|---|
| ↑ / ↓ | Moves to the previous or next event |
| Home / End | Moves to the first or last event |
| Enter / Space | Opens the event's detail, or closes it |
| Escape | Closes the open detail |
| Tab | Moves on to the open detail's links, then out |

## Screen readers

The filters are a group named "Filter by category", each chip a toggle button (`aria-pressed`) reading its label and
count. Events sit in an ordered list under each month heading; each event's button reads its title and full date,
“Payee details changed from a new device, 9 June 2026”, and is `aria-expanded` when it has a detail. The source tag
reads “Source: Payments engine, grade A1 (completely reliable source, confirmed). High confidence.” Filtering is
confirmed in a polite status message, “2 events, Payment”.

## Content

- Write titles as what happened, past tense: “Payment of €48,000 held”, not “Payment hold”.
- Keep the detail to one line; put the rest in `body`.
- Name sources as people know them – “Payments engine”, “Call centre note” – and grade them on the Admiralty scale.
- Use `flag` for what a rule or a person picked out, in two words or fewer.

## Do

- Give every event a source when the review depends on how far to trust it.
- Keep categories to five or fewer so the chips stay readable.
- Attach the records an event rests on, as links in its detail.

## Don't

- Don't use the category tones for severity – flags and grades already carry that.
- Don't open an event on load unless the page was opened for it.
- Don't leave out the year in a long timeline – the month headers carry it.

## Example

```html
<tc-entity-timeline id="tl" heading="Account timeline"></tc-entity-timeline>

<script type="module">
  import "trenchcoat/entity-timeline";
  import "trenchcoat/tokens.css";

  const tl = document.querySelector("#tl");
  tl.categories = [{ id: "payment", label: "Payment", tone: "warning" }, { id: "account", label: "Account", tone: "info" }];
  tl.events = [
    { id: "e1", date: Date.parse("2026-06-04T12:00"), title: "Payment of €48,000 held", category: "payment", source: { label: "Payments engine", grade: "A1" } },
    { id: "e2", date: Date.parse("2026-02-02T12:00"), title: "Account opened", category: "account", source: { label: "Core banking", grade: "A1" } },
  ];
  tl.addEventListener("tc-selected-change", (e) => console.log(e.detail.selected));
</script>
```

```tsx
import { useState } from "react";
import { EntityTimeline, type TimelineCategory, type TimelineEvent } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const categories: TimelineCategory[] = [{ id: "payment", label: "Payment", tone: "warning" }];
const events: TimelineEvent[] = [
  { id: "e1", date: Date.parse("2026-06-04T12:00"), title: "Payment of €48,000 held", category: "payment", source: { label: "Payments engine", grade: "A1" } },
];

export function AccountTimeline() {
  const [open, setOpen] = useState<string | null>(null);
  return <EntityTimeline title="Account timeline" events={events} categories={categories} selected={open} onSelectedChange={setOpen} />;
}
```
