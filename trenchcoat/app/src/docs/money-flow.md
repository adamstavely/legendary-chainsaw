---
pattern: none
status: new
related: account-list, lineage-graph, breakdown-chart, data-table
---

## Overview

How money moved between people, companies and accounts, drawn left to right:
- **Entities** are cards in columns. They take the column you give them, or one worked out from who paid whom: payers
  to the left of the people they paid. Each card shows its kind (person, company, shell entity, bank or unknown) as an
  icon and a word.
- **Transfers** are bands whose width follows the amount. Each is labelled with its amount and an optional flag chip,
  such as "Layering", "Cash-in" or "Courier fee". Flagged bands are drawn in the danger ink.
- **Labels** sit in the gap between two columns, never on a card, and labels in one gap are kept apart. When the
  card is too narrow for every column and its labels, the drawing keeps its size and scrolls sideways.

Pointing at or focusing an entity lights the transfers in and out of it and dims the rest. Pointing at a transfer
lights it and its two ends. A readout says what's lit in words: "Halden Freight SARL → Kestrel Holdings · €240,000 ·
15 May · Layering". The transfers are also listed under the drawing, and "Show as table" swaps the drawing for a table
of every transfer.

## When to use

- Tracing funds through an anti-money-laundering, fraud or audit review.
- Showing how a payment was split and passed on, such as a grant through sub-recipients or an invoice through
  intermediaries.
- Any small network of payers and payees where who paid whom matters more than the totals.

## When not to use

- The accounts themselves, with their identifiers and status – use `account-list`.
- Where an AI output came from – use `lineage-graph`.
- Totals by category, with no flow between them – use `breakdown-chart`.
- Thousands of transactions to sort and filter – use `data-table`.

## Anatomy

1. **Total** `.ui-mfl__total` – how many transfers and how much moved
2. **Readout** `.ui-mfl__readout` – what's lit, in words
3. **Show as table** `.ui-mfl__toggle` – swaps the drawing for a table
4. **Band** `.ui-mfl__band` – a transfer, as wide as its amount
5. **Label** `.ui-mfl__label` – the transfer's amount and flag on its band
6. **Entity** `.ui-mfl__node` – a card with the name, kind and detail
7. **Transfers** `.ui-mfl__transfers` – every transfer as a row under the drawing
8. **Flag** `.ui-mfl__flag` – why a transfer stands out

## Looks

Standard is a white card on a gray tray, with the header on the tray above it and medium-weight entity names. Clean is
one white card with the header as its first row. The bands, cards and list are the same in both. Bands use
`--tc-mfl-band` (by default `--tc-chart-1`) and flagged bands `--tc-mfl-flagged`; set either on the element.

## Keyboard

The entities are one tab stop and the transfers list is a second.

| Key | What it does |
|---|---|
| ← / → | Moves to the nearest entity in the column before or after |
| ↑ / ↓ | Moves within a column of entities, or between transfers in the list |
| Home / End | Moves to the first or last entity, or transfer |
| Enter / Space | Selects the entity or transfer, or clears it if it's selected |
| Escape | Clears the selection |
| Tab | Moves from the entities to the transfers list, then on |

Focusing an entity or a transfer lights it, just as pointing does.

## Screen readers

The drawing is a group named by the heading and described by “Arrow keys move between entities; Enter selects one
and lights its transfers”. The bands and their labels are hidden; the same facts are in the transfers list and the
table. Each entity is a toggle button (`aria-pressed`) that reads its name, kind and detail, then its flows: “Halden
Freight SARL, Company · France, in €58,000 · out €249,500 · 3 transfers”. Each transfer in the list is a toggle button
that reads “Halden Freight SARL to Kestrel Holdings €240,000 15 May Layering”. Selecting is confirmed in a polite
status message, and clearing with “Selection cleared”. The table has a caption, “Transfers”, and column headers.

## Content

- Name entities the way investigators know them, and put the country or role in `detail`.
- Keep flags to a word or two that says why the transfer stands out: “Layering”, “Cash-in”, “Structuring”.
- Give each transfer a date; the list and the readout show it.
- Set `column` on entities when the flow has a known order the transfers don't show, such as origin, conduit and
  destination.

## Do

- Keep the network small – roughly twenty entities and thirty transfers – so the drawing stays readable.
- Give transfers their own `currency` when they're in more than one.
- Pair a selected entity with its accounts in `account-list`.

## Don't

- Don't use flag chips for every transfer – a flag only means something when most transfers have none.
- Don't draw totals by category here – there's no flow between them.
- Don't rely on the drawing alone in a report; include the table.

## Example

```html
<tc-money-flow id="flow" heading="Money flow" currency="EUR"></tc-money-flow>

<script type="module">
  import "trenchcoat/money-flow";
  import "trenchcoat/tokens.css";

  const flow = document.querySelector("#flow");
  flow.nodes = [
    { id: "op", label: "Halden Freight SARL", kind: "company", detail: "France" },
    { id: "hold", label: "Kestrel Holdings", kind: "shell", detail: "Cyprus" },
    { id: "prop", label: "Alder Estates SL", kind: "company", detail: "Spain" },
  ];
  flow.transfers = [
    { id: "t1", from: "op", to: "hold", amount: 240000, date: Date.parse("2026-05-15T12:00"), flag: "Layering" },
    { id: "t2", from: "hold", to: "prop", amount: 180000, date: Date.parse("2026-05-20T12:00") },
  ];
  flow.addEventListener("tc-selected-change", (e) => console.log(e.detail.selected));
</script>
```

```tsx
import { useState } from "react";
import { MoneyFlow, type FlowNode, type FlowRef, type FlowTransfer } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const nodes: FlowNode[] = [
  { id: "op", label: "Halden Freight SARL", kind: "company", detail: "France" },
  { id: "hold", label: "Kestrel Holdings", kind: "shell", detail: "Cyprus" },
];
const transfers: FlowTransfer[] = [{ id: "t1", from: "op", to: "hold", amount: 240000, flag: "Layering" }];

export function Flow() {
  const [selected, setSelected] = useState<FlowRef | null>(null);
  return <MoneyFlow title="Money flow" nodes={nodes} transfers={transfers} selected={selected} onSelectedChange={setSelected} />;
}
```
