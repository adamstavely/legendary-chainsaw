---
pattern: disclosure
status: new
related: person-links, evidence-list, lineage-graph, data-table
---

## Overview

Who keeps turning up alongside a subject. Accounts, cards, devices or people are ranked by how often they appear in
the same events as the subject – logins, payments, shipments, or whatever sources the page has – over a stated window.
Each row gives a strength in words and bars (Always together, Frequent, Occasional), a score from 0 to 100, the share
of the subject's events they were in ("82% · 14 of 17 events"), a count per source and when they were last seen
together. The header sums it up: strong correlates, shared events and the top correlate. Open a row to see the shared
events themselves, grouped by source.

## When to use

- Fraud and abuse reviews: the accounts, cards and devices that move together with one account.
- Investigating linked records in a compliance case, where repeated co-appearance is the signal.
- Any "who else is always here?" question across several event sources.

## When not to use

- The people linked to someone by a known relationship – use `person-links`.
- Where an output came from, step by step – use `lineage-graph`.
- Plain rows people sort, filter and edit – use `data-table`.
- The exhibits behind a case – use `evidence-list`.

## Anatomy

1. **Stats** `.ui-coc__stats` – strong correlates, shared events and the top correlate
2. **Sources** `.ui-coc__legend` – the event sources the counts come from
3. **Sort** `.ui-coc__sort` – score, share or most recent
4. **Row** `.ui-coc__row` – initials, name and ID, strength, share, counts per source and the score
5. **Strength** `.ui-coc__strength` – Always together, Frequent or Occasional, in words and bars
6. **Shared events** `.ui-coc__detail` – an open row's events, grouped by source

## Looks

Standard is a white card on a gray tray, with the header on the tray above it and a bold picked sort. Clean is one
white card with the header as its first row. The rows, strengths and shared events are the same in both.

## Keyboard

The rows are one tab stop; the sort is another.

| Key | What it does |
|---|---|
| ↑ / ↓ | Moves to the previous or next row |
| Home / End | Moves to the first or last row |
| Enter / Space | Opens the row's shared events, or closes them |
| Escape | Closes the open row |
| ← / → (sort) | Picks the previous or next sort |

## Screen readers

The rows are a list named by the heading; each row is a button with `aria-expanded`, reading the name, the ID, the
strength, the score, the share, the counts per source and when last seen – “Dana Okafor, ACC-4471-K, Always together,
score 92, 82%, 14 of 17 events, Logins 9, Payments 14 …”. An open row's events are a region named “Shared events with
Dana Okafor”. The sort is a radio group named “Sort by”. Opening, closing and sorting are confirmed in a polite status
message.

## Content

- Name sources as people know them: “Logins”, “Payments”, “Shipments”, not table names.
- Put an account number or device ID in `detail`, so two people with one name stay apart.
- Say the window in `window` – “120-day window” – so the share has a frame.
- Set `thresholds` to match how your team reads the share, and say so in `description`.

## Do

- Give the shared events for the top few rows, so the evidence is one click away.
- Keep the list to the entities worth a look – a dozen or so, not everything ever seen.

## Don't

- Don't present co-occurrence as proof of a relationship – it's a reason to look, not a finding.
- Don't use it to profile private individuals outside a lawful, documented review.
- Don't hide the share behind the score alone – people need both to judge.

## Example

```html
<tc-co-occurrence id="coc" heading="Seen together with ACC-2291" window="120-day window" events="17"></tc-co-occurrence>

<script type="module">
  import "trenchcoat/co-occurrence";
  import "trenchcoat/tokens.css";

  const coc = document.querySelector("#coc");
  coc.sources = [{ id: "login", label: "Logins" }, { id: "pay", label: "Payments" }];
  coc.entities = [
    { id: "dana", name: "Dana Okafor", detail: "ACC-4471-K", score: 92, together: 14, bySource: { login: 9, pay: 14 } },
    { id: "card", name: "Card ending 0092", score: 74, together: 10, bySource: { pay: 11 } },
  ];
  coc.addEventListener("tc-selected-change", (e) => console.log(e.detail.selected));
</script>
```

```tsx
import { useState } from "react";
import { CoOccurrence, type CoEntity } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const entities: CoEntity[] = [
  { id: "dana", name: "Dana Okafor", detail: "ACC-4471-K", score: 92, together: 14, bySource: { login: 9, pay: 14 } },
  { id: "card", name: "Card ending 0092", score: 74, together: 10, bySource: { pay: 11 } },
];

export function SeenTogether() {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <CoOccurrence
      title="Seen together with ACC-2291"
      window="120-day window"
      events={17}
      sources={[{ id: "login", label: "Logins" }, { id: "pay", label: "Payments" }]}
      entities={entities}
      selected={selected}
      onSelectedChange={setSelected}
    />
  );
}
```
